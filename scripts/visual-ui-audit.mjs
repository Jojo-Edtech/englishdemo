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
const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    return [key, value];
  }),
);

const url = args.get("url") ?? "http://127.0.0.1:5173/";
const round = args.get("round") ?? "round";
const outputDir = path.resolve(args.get("output") ?? path.join(rootDir, "test-artifacts", "visual-ui-audit", round));

fs.mkdirSync(outputDir, { recursive: true });

const viewports = [
  { id: "desktop", width: 1440, height: 920, mobile: false },
  { id: "laptop", width: 1366, height: 768, mobile: false },
  { id: "tablet", width: 768, height: 1024, mobile: true },
  { id: "mobile", width: 390, height: 844, mobile: true },
];

const panels = {
  desktop: ["总览", "导入", "错因", "学情", "报告", "ima助手", "练习"],
  mobile: ["总览", "导入", "错因", "学情", "报告", "ima", "学生"],
};

const report = {
  url,
  round,
  startedAt: new Date().toISOString(),
  screenshots: [],
  issues: [],
  metrics: [],
};

function addIssue(scope, severity, message, detail) {
  report.issues.push({
    scope,
    severity,
    message,
    detail,
  });
}

async function clickButton(page, name) {
  const locator = page.getByRole("button", { name, exact: true }).first();
  await locator.waitFor({ state: "visible", timeout: 8000 });
  await locator.click();
  await page.waitForTimeout(180);
}

async function analyzePage(page, scope) {
  const result = await page.evaluate(() => {
    const doc = document.documentElement;
    const viewportWidth = doc.clientWidth;
    const viewportHeight = doc.clientHeight;
    const elements = Array.from(document.body.querySelectorAll("*"));
    const issues = [];
    const textBlocks = [];
    const buttons = [];
    const cards = [];

    function visible(element) {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 1 && rect.height > 1;
    }

    function ownText(element) {
      return Array.from(element.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent || "")
        .join("")
        .replace(/\s+/g, " ")
        .trim();
    }

    for (const element of elements) {
      if (!visible(element)) continue;
      const tag = element.tagName.toLowerCase();
      if (["svg", "path", "line", "polyline", "circle", "rect", "defs", "clippath", "g"].includes(tag)) {
        continue;
      }
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const className = String(element.className || "");
      const text = ownText(element);
      const allText = (element.textContent || "").replace(/\s+/g, " ").trim();

      if (rect.left < -3 || rect.right > viewportWidth + 3) {
        if (!element.closest(".heatmap") && !element.closest(".recharts-wrapper")) {
          issues.push({
            type: "out-of-viewport",
            selector: `${tag}.${className.slice(0, 60)}`,
            text: allText.slice(0, 90),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            viewportWidth,
          });
        }
      }

      if (text) {
        const fontSize = Number.parseFloat(style.fontSize);
        const lineHeight = Number.parseFloat(style.lineHeight);
        const density = text.length / Math.max(rect.width * rect.height, 1);
        const lines = Math.round(rect.height / Math.max(lineHeight || fontSize * 1.4, 1));
        textBlocks.push({
          selector: `${tag}.${className.slice(0, 60)}`,
          text: text.slice(0, 90),
          fontSize,
          lineHeight,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          lines,
          density,
        });
        if (element.scrollWidth > element.clientWidth + 3 && style.overflowX === "visible") {
          issues.push({
            type: "text-overflow",
            selector: `${tag}.${className.slice(0, 60)}`,
            text: text.slice(0, 90),
            scrollWidth: element.scrollWidth,
            clientWidth: element.clientWidth,
          });
        }
        if (fontSize > 22 && !element.closest(".report-document")) {
          issues.push({
            type: "oversized-text",
            selector: `${tag}.${className.slice(0, 60)}`,
            text: text.slice(0, 90),
            fontSize,
          });
        }
        if (fontSize < 10 && text.length > 2) {
          issues.push({
            type: "tiny-text",
            selector: `${tag}.${className.slice(0, 60)}`,
            text: text.slice(0, 90),
            fontSize,
          });
        }
      }

      if (tag === "button" || element.getAttribute("role") === "button") {
        const name = element.getAttribute("aria-label") || allText;
        buttons.push({
          name: name.slice(0, 60),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
        if (rect.height < 30 || rect.width < 30) {
          issues.push({
            type: "small-target",
            name: name.slice(0, 60),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
        }
      }

      if (className.includes("card") || className.includes("panel") || className.includes("hero")) {
        cards.push({
          selector: `${tag}.${className.slice(0, 60)}`,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          textLength: allText.length,
          fill: allText.length / Math.max(rect.width * rect.height, 1),
        });
      }
    }

    const h1 = document.querySelector("h1");
    const h1Rect = h1?.getBoundingClientRect();
    const h1Style = h1 ? getComputedStyle(h1) : null;
    const hero = document.querySelector(".demo-hero");
    const heroRect = hero?.getBoundingClientRect();
    const firstMetric = document.querySelector(".metric-card");
    const metricRect = firstMetric?.getBoundingClientRect();
    const mobileNav = document.querySelector(".mobile-nav");
    const mobileNavRect = mobileNav?.getBoundingClientRect();

    const h1Font = h1Style ? Number.parseFloat(h1Style.fontSize) : 0;
    if (viewportWidth <= 430 && h1Font > 19) {
      issues.push({ type: "mobile-title-too-large", fontSize: h1Font });
    }
    if (heroRect && viewportWidth <= 430 && heroRect.height > viewportHeight * 0.42) {
      issues.push({
        type: "mobile-hero-too-tall",
        height: Math.round(heroRect.height),
        viewportHeight,
      });
    }
    if (metricRect && viewportWidth <= 430 && metricRect.height > 96) {
      issues.push({
        type: "mobile-metric-card-too-tall",
        height: Math.round(metricRect.height),
      });
    }
    if (mobileNavRect && mobileNavRect.height > 64) {
      issues.push({
        type: "mobile-nav-too-tall",
        height: Math.round(mobileNavRect.height),
      });
    }

    return {
      viewportWidth,
      viewportHeight,
      title: h1?.textContent?.trim() ?? "",
      h1: h1Rect
        ? {
            width: Math.round(h1Rect.width),
            height: Math.round(h1Rect.height),
            fontSize: h1Font,
          }
        : null,
      hero: heroRect
        ? {
            width: Math.round(heroRect.width),
            height: Math.round(heroRect.height),
          }
        : null,
      metric: metricRect
        ? {
            width: Math.round(metricRect.width),
            height: Math.round(metricRect.height),
          }
        : null,
      horizontalOverflow: doc.scrollWidth - doc.clientWidth,
      issues,
      textBlocks: textBlocks
        .sort((a, b) => b.density - a.density)
        .slice(0, 8),
      buttons: buttons.slice(0, 20),
      cards: cards.slice(0, 20),
    };
  });

  report.metrics.push({ scope, ...result, issues: undefined });
  for (const issue of result.issues) {
    const severity = ["out-of-viewport", "text-overflow", "small-target"].includes(issue.type)
      ? "high"
      : "medium";
    addIssue(scope, severity, issue.type, issue);
  }
  if (result.horizontalOverflow > 3) {
    addIssue(scope, "high", "document-horizontal-overflow", {
      horizontalOverflow: result.horizontalOverflow,
    });
  }
}

async function run() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        isMobile: viewport.mobile,
      });
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      const list = viewport.mobile ? panels.mobile : panels.desktop;
      for (const panel of list) {
        await clickButton(page, panel);
        const safePanel = panel.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "-");
        const fileName = `${viewport.id}-${safePanel}.png`;
        const screenshotPath = path.join(outputDir, fileName);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        report.screenshots.push(screenshotPath);
        await analyzePage(page, `${viewport.id}-${panel}`);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }

  report.finishedAt = new Date().toISOString();
  const jsonPath = path.join(outputDir, "visual-ui-audit.json");
  const mdPath = path.join(outputDir, "visual-ui-audit.md");
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  const grouped = report.issues.reduce((acc, issue) => {
    acc[issue.message] = (acc[issue.message] ?? 0) + 1;
    return acc;
  }, {});
  const markdown = [
    `# Visual UI Audit ${round}`,
    "",
    `URL: ${url}`,
    `Screenshots: ${report.screenshots.length}`,
    `Issues: ${report.issues.length}`,
    "",
    "## Issue Summary",
    ...Object.entries(grouped).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Screenshots",
    ...report.screenshots.map((item) => `- ${path.relative(outputDir, item)}`),
    "",
  ].join("\n");
  fs.writeFileSync(mdPath, markdown);
  console.log(`json=${jsonPath}`);
  console.log(`notes=${mdPath}`);
  console.log(`screenshots=${report.screenshots.length}`);
  console.log(`issues=${report.issues.length}`);
  if (report.issues.some((issue) => issue.severity === "high")) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
