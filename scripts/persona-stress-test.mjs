import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

function loadPlaywright() {
  try {
    return require("playwright");
  } catch {
    return require("/tmp/english-analytics-audit/node_modules/playwright");
  }
}

const { chromium } = loadPlaywright();

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sampleCsv = fs.readFileSync(
  path.join(rootDir, "sample-data", "shenzhen-english-demo-sample.csv"),
  "utf8",
);

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    return [key, value];
  }),
);

const url = args.get("url") ?? "http://127.0.0.1:5173/";
const iterations = Number(args.get("iterations") ?? 1000);
const outputDir = path.resolve(args.get("output") ?? path.join(rootDir, "test-artifacts", "persona-stress"));
const seed = Number(args.get("seed") ?? 20260705);

fs.mkdirSync(outputDir, { recursive: true });

function makeRandom(initialSeed) {
  let state = initialSeed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const random = makeRandom(seed);

const pick = (items) => items[Math.floor(random() * items.length)];

const report = {
  url,
  iterations,
  seed,
  startedAt: new Date().toISOString(),
  personas: {},
  failures: [],
  consoleErrors: [],
  screenshots: [],
};

const desktop = { width: 1440, height: 920 };
const mobile = { width: 390, height: 844 };

function recordFailure(scope, message, detail = undefined) {
  report.failures.push({
    scope,
    message,
    detail,
    at: new Date().toISOString(),
  });
}

async function firstVisible(locator) {
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const item = locator.nth(index);
    if (await item.isVisible().catch(() => false)) return item;
  }
  return null;
}

async function clickButton(page, name, scope) {
  const item = await firstVisible(page.getByRole("button", { name, exact: true }));
  if (!item) {
    recordFailure(scope, `找不到可见按钮：${name}`);
    return false;
  }
  await item.click();
  return true;
}

async function clickText(page, text, scope) {
  const item = await firstVisible(page.getByText(text, { exact: false }));
  if (!item) {
    recordFailure(scope, `找不到可见文本：${text}`);
    return false;
  }
  await item.click();
  return true;
}

async function waitStable(page) {
  await page.waitForTimeout(70);
}

async function capture(page, name) {
  const file = path.join(outputDir, `${String(report.screenshots.length + 1).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  report.screenshots.push(file);
}

async function layoutCheck(page, scope) {
  const result = await page.evaluate(() => {
    const doc = document.documentElement;
    const viewportWidth = doc.clientWidth;
    const viewportHeight = doc.clientHeight;
    const outside = [];
    const textOverflow = [];
    const unnamedButtons = [];
    const smallTargets = [];
    const all = Array.from(document.body.querySelectorAll("*"));

    for (const element of all) {
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const rect = element.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;
      const tag = element.tagName.toLowerCase();
      if (["svg", "path", "line", "polyline", "circle", "rect", "defs", "clippath", "g"].includes(tag)) {
        continue;
      }
      const text = (element.textContent || "").replace(/\s+/g, " ").trim();
      const className = String(element.className || "");

      if (rect.left < -4 || rect.right > viewportWidth + 4) {
        if (!element.closest(".heatmap") && !element.closest(".recharts-wrapper")) {
          outside.push({
            tag,
            className: className.slice(0, 90),
            text: text.slice(0, 90),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            viewportWidth,
          });
        }
      }

      const ownText = Array.from(element.childNodes).some(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
      );
      if (ownText && element.scrollWidth > element.clientWidth + 4 && style.overflowX === "visible") {
        if (!element.closest(".recharts-wrapper") && tag !== "select") {
          textOverflow.push({
            tag,
            className: className.slice(0, 90),
            text: text.slice(0, 90),
            scrollWidth: element.scrollWidth,
            clientWidth: element.clientWidth,
          });
        }
      }

      if (tag === "button") {
        const name = element.getAttribute("aria-label") || text;
        if (!name) {
          unnamedButtons.push({ className: className.slice(0, 90) });
        }
        if ((rect.width < 28 || rect.height < 28) && !element.closest(".recharts-wrapper")) {
          smallTargets.push({
            name: name.slice(0, 60),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
        }
      }
    }

    const fixedBottom = document.querySelector(".mobile-nav");
    const fixedBottomOk = !fixedBottom || fixedBottom.scrollWidth <= fixedBottom.clientWidth + 2;
    return {
      title: document.querySelector("h1")?.textContent?.trim() ?? "",
      horizontalOverflow: doc.scrollWidth - doc.clientWidth,
      verticalSpaceOk: document.body.scrollHeight >= viewportHeight,
      outside: outside.slice(0, 5),
      textOverflow: textOverflow.slice(0, 5),
      unnamedButtons: unnamedButtons.slice(0, 5),
      smallTargets: smallTargets.slice(0, 5),
      fixedBottomOk,
    };
  });

  if (!result.title) recordFailure(scope, "页面标题不可见");
  if (result.horizontalOverflow > 4) recordFailure(scope, "页面出现横向滚动", result);
  if (!result.verticalSpaceOk) recordFailure(scope, "页面高度异常", result);
  if (result.outside.length) recordFailure(scope, "有元素冲出视口", result.outside);
  if (result.textOverflow.length) recordFailure(scope, "有文字疑似挤出容器", result.textOverflow);
  if (result.unnamedButtons.length) recordFailure(scope, "存在无名称按钮", result.unnamedButtons);
  if (result.smallTargets.length) recordFailure(scope, "存在过小点击目标", result.smallTargets);
  if (!result.fixedBottomOk) recordFailure(scope, "移动端底部导航横向溢出", result);
}

async function openPage(browser, viewport, name) {
  const page = await browser.newPage({
    viewport,
    deviceScaleFactor: 1,
    isMobile: viewport.width < 600,
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      report.consoleErrors.push({
        persona: name,
        text: message.text(),
        at: new Date().toISOString(),
      });
    }
  });
  page.on("pageerror", (error) => {
    report.consoleErrors.push({
      persona: name,
      text: error.message,
      at: new Date().toISOString(),
    });
  });
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  return page;
}

async function runTeacher(page) {
  const actions = [
    async (scope) => clickButton(page, pick(["总览", "批改", "错因", "学情", "报告", "ima助手", "练习"]), scope),
    async (scope) => {
      await clickButton(page, "导入", scope);
      const input = page.locator("textarea.live-data-input");
      await input.fill(sampleCsv);
      await clickButton(page, "解析学情", scope);
      await page.getByText("已解析 12 名学生", { exact: false }).waitFor({ state: "visible", timeout: 5000 });
      return true;
    },
    async (scope) => {
      await clickButton(page, "错因", scope);
      await clickText(page, pick(["Q21", "Q24", "Q27", "Q31"]), scope);
      return true;
    },
    async (scope) => {
      await clickButton(page, "报告", scope);
      await clickText(page, pick(["备课组版", "学生版", "家长版"]), scope);
      return true;
    },
  ];

  for (let index = 0; index < iterations; index += 1) {
    const scope = `teacher-${index + 1}`;
    await pick(actions)(scope);
    await waitStable(page);
    await layoutCheck(page, scope);
  }
}

async function runStudent(page) {
  const actions = [
    async (scope) => clickButton(page, "学生", scope),
    async (scope) => {
      await clickButton(page, "学生", scope);
      await clickText(page, pick(["S02", "S03", "S05", "S07"]), scope);
      return true;
    },
    async (scope) => {
      await clickButton(page, "错因", scope);
      await clickText(page, pick(["Q21", "Q24", "Q31"]), scope);
      return true;
    },
    async (scope) => clickButton(page, pick(["总览", "学情", "报告", "ima"]), scope),
  ];

  for (let index = 0; index < iterations; index += 1) {
    const scope = `student-${index + 1}`;
    await pick(actions)(scope);
    await waitStable(page);
    await layoutCheck(page, scope);
  }
}

async function runNeeds(browser) {
  const desktopPage = await openPage(browser, desktop, "needs-desktop");
  const mobilePage = await openPage(browser, mobile, "needs-mobile");
  const scenarios = [
    {
      name: "校长快速看成果",
      page: desktopPage,
      run: async (scope) => {
        await clickButton(desktopPage, "总览", scope);
        await clickButton(desktopPage, "报告", scope);
      },
    },
    {
      name: "老师导入真实数据",
      page: desktopPage,
      run: async (scope) => {
        await clickButton(desktopPage, "导入", scope);
        await desktopPage.locator("textarea.live-data-input").fill(sampleCsv);
        await clickButton(desktopPage, "解析学情", scope);
        await desktopPage.getByText("已解析 12 名学生", { exact: false }).waitFor({ state: "visible", timeout: 5000 });
      },
    },
    {
      name: "备课组定位错因",
      page: desktopPage,
      run: async (scope) => {
        await clickButton(desktopPage, "错因", scope);
        await clickText(desktopPage, pick(["Q21", "Q24", "Q27", "Q31"]), scope);
      },
    },
    {
      name: "学生手机看任务",
      page: mobilePage,
      run: async (scope) => {
        await clickButton(mobilePage, "学生", scope);
      },
    },
    {
      name: "老师手机快看学情",
      page: mobilePage,
      run: async (scope) => {
        await clickButton(mobilePage, pick(["总览", "学情", "报告", "ima"]), scope);
      },
    },
  ];

  for (let index = 0; index < iterations; index += 1) {
    const scenario = pick(scenarios);
    const scope = `need-${index + 1}-${scenario.name}`;
    await scenario.run(scope);
    await waitStable(scenario.page);
    await layoutCheck(scenario.page, scope);
  }

  await desktopPage.close();
  await mobilePage.close();
}

async function run() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const teacherPage = await openPage(browser, desktop, "teacher");
    await capture(teacherPage, "teacher-overview");
    await runTeacher(teacherPage);
    await capture(teacherPage, "teacher-final");
    await teacherPage.close();
    report.personas.teacher = { iterations };

    const studentPage = await openPage(browser, mobile, "student");
    await capture(studentPage, "student-overview");
    await runStudent(studentPage);
    await capture(studentPage, "student-final");
    await studentPage.close();
    report.personas.student = { iterations };

    await runNeeds(browser);
    report.personas.needs = { iterations };
  } finally {
    await browser.close();
  }

  report.finishedAt = new Date().toISOString();
  const reportPath = path.join(outputDir, "persona-stress-report.json");
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`report=${reportPath}`);
  console.log(`screenshots=${report.screenshots.length}`);
  console.log(`consoleErrors=${report.consoleErrors.length}`);
  console.log(`failures=${report.failures.length}`);
  if (report.consoleErrors.length || report.failures.length) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  recordFailure("runner", error.message, error.stack);
  const reportPath = path.join(outputDir, "persona-stress-report.json");
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.error(error);
  process.exit(1);
});
