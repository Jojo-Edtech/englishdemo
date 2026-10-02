// Browser-independent scenarios. Pass the documented CUA tab wrapper; no browser launch or state injection.
export const roles = ['teacher', 'group', 'student', 'parent', 'principal'];
export const scenarioNames = {
  teacher: ['correction-status', 'invalid-score', 'missing-score', 'quoted-table', 'duplicate-header', 'question-to-practice'],
  group: ['warning-persistence', 'multiple-follow-ups', 'mastery-filters', 'lesson-copy', 'report-draft', 'cross-class-scope'],
  student: ['profile-isolation', 'follow-up-isolation', 'mistake-book-copy', 'student-navigation', 'missing-history', 'no-wrong-answers'],
  parent: ['tone-copy', 'editable-draft', 'audience-isolation', 'privacy-content', 'draft-navigation', 'mobile-report'],
  principal: ['class-comparison', 'class-task-isolation', 'priority-drilldown', 'management-report', 'history-navigation', 'keyboard-navigation'],
};

export async function inspectRoleLayout(tab) {
  return tab.playwright.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const clipped = [];
    for (const el of document.querySelectorAll('button,h1,h2,h3,p,textarea,input,select,.panel-header')) {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height || getComputedStyle(el).visibility === 'hidden' || el.closest('.recharts-wrapper')) continue;
      let scrolling = false;
      for (let parent = el.parentElement; parent; parent = parent.parentElement) {
        if (['auto', 'scroll'].includes(getComputedStyle(parent).overflowX) && parent.scrollWidth > parent.clientWidth + 1) { scrolling = true; break; }
      }
      if (!scrolling && (rect.left < -1 || rect.right > width + 1 || el.scrollWidth > el.clientWidth + 2) && !['TEXTAREA', 'INPUT', 'SELECT'].includes(el.tagName)) {
        clipped.push({ tag: el.tagName, cls: el.className, text: el.textContent?.slice(0, 70), left: rect.left, right: rect.right, scroll: el.scrollWidth, client: el.clientWidth });
      }
    }
    return {
      width, documentOverflow: document.documentElement.scrollWidth - width, clipped,
      charts: [...document.querySelectorAll('.recharts-wrapper')].map((el) => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })),
      images: [...document.images].map((el) => ({ loaded: el.complete && el.naturalWidth > 0, alt: el.alt })),
    };
  });
}

export function createRoleRunner(tab) {
  const p = tab.playwright;
  const button = (name) => p.getByRole('button', { name, exact: true });
  const text = (selector) => p.locator(selector).innerText({ timeoutMs: 3000 });
  const visible = (locator) => locator.isVisible();
  let checks = [];
  function assert(condition, message) {
    if (!condition) throw new Error(message);
    checks.push(message);
  }
  async function nav(name) {
    if (name === '学生') {
      await p.getByRole('group', { name: '切换角色视图' }).getByRole('button', { name, exact: true }).click();
    } else {
      const desktop = p.getByRole('navigation', { name: '教师端导航' });
      if (await visible(desktop)) await desktop.getByRole('button', { name, exact: true }).click();
      else {
        const mobile = p.getByRole('navigation', { name: '移动端导航' });
        if (['总览', '导入', '批改', '学情'].includes(name)) await mobile.getByRole('button', { name, exact: true }).click();
        else {
          await mobile.getByRole('button', { name: '更多', exact: true }).click();
          await p.getByRole('navigation', { name: '全部功能导航' }).getByRole('button', { name, exact: true }).click();
        }
      }
    }
    assert((await text('h1')).length > 0, `navigation:${name}`);
  }
  async function selectStudent(index) {
    await p.locator('.student-row').nth(index).click();
    const label = await p.locator('.student-row').nth(index).innerText();
    assert(label.includes(await text('.student-identity h2')), 'selected student matches profile');
  }
  async function report(audience, tone) {
    await nav('报告');
    await p.locator('.report-type').filter({ hasText: audience }).click();
    if (tone) await p.getByRole('group', { name: '改写语气' }).getByRole('button', { name: tone, exact: true }).click();
    assert((await text('.report-editor-panel .panel-header')).includes(audience), 'report audience matches');
  }
  async function copyReport() {
    await p.locator('.report-toolbar .primary-button').click();
    assert((await text('.report-toolbar .primary-button')) === '已复制', 'report copy confirmed');
    const body = await text('.report-draft-preview');
    assert((await tab.clipboard.readText()).includes(body), 'clipboard matches visible report');
  }
  async function editReport(marker, navigate = false) {
    const original = await text('.report-draft-preview');
    await button('编辑报告').click();
    await p.getByLabel('报告正文').fill(`${original}\n${marker}`);
    await button('完成编辑').click();
    assert((await text('.report-draft-preview')).endsWith(marker), 'edited report visible');
    if (navigate) { await nav('总览'); await nav('报告'); }
    assert((await text('.report-draft-preview')).endsWith(marker), 'report draft retained');
    await copyReport();
    await button('编辑报告').click();
    await p.getByLabel('报告正文').fill(original);
    await button('完成编辑').click();
    assert((await text('.report-draft-preview')) === original, 'report restored after synthetic edit');
  }
  async function parse(csv) {
    await nav('导入');
    await p.getByLabel('学生成绩表').fill(csv);
    assert(await p.locator('.live-analysis').count() === 0, 'stale analysis removed after input edit');
    await button('解析学情').click();
  }
  async function diagnose(iteration) {
    await nav('错因');
    await p.locator('.question-picker .question-chip').nth(0).click();
    await button('生成同类练习').click();
    await nav('错因');
    await p.locator('.question-picker .question-chip').nth(2).click();
    await nav('练习');
    assert((await text('.practice-hero')).includes('Q27'), 'direct practice navigation uses current question');
    assert((await text('.practice-list')).includes('用上下文排除熟词生义干扰'), 'practice content does not leak from previous question');
    await nav('错因');
    const classIndex = Math.floor(iteration / 6) % 3;
    await p.getByLabel('选择班级').selectOption({ index: classIndex });
    const index = Math.floor(iteration / 6) % 6;
    await p.locator('.question-chip').nth(index).click();
    const heading = await text('.diagnosis-heading h2');
    const counts = await text('.student-split .panel-header');
    const match = counts.match(/(\d+) 对 \/ (\d+) 错/);
    assert(!!match, 'question response counts exist');
    const correct = Number(match[1]), wrong = Number(match[2]), count = correct + wrong;
    assert(classIndex === 2 ? count === 0 : count > 0, 'selected class has only its own response sample');
    const rate = await p.locator('.diagnosis-card strong').nth(1).innerText();
    assert(rate === (count ? `${Math.round(wrong / count * 100)}%` : '暂无数据'), 'wrong rate uses current question denominator');
    assert((await text('.donut span')) === (count ? `${Math.round(correct / count * 100)}%` : '暂无数据'), 'donut uses matching response counts');
    assert((await text('.question-response-evidence')).includes(count ? `${count} 份本题作答` : '暂无本题作答记录'), 'narrative evidence matches current sample');
    await button('生成同类练习').click();
    const q = heading.match(/Q\d+/)[0];
    assert((await text('.practice-hero')).includes(q), 'practice matches selected question');
    assert(await p.locator('.practice-card').count() > 0, 'practice has answer-bearing questions');
  }
  async function layout() {
    const result = await p.evaluate(() => ({
      width: window.innerWidth,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      badValues: /NaN|Infinity|undefined/.test(document.querySelector('main')?.textContent ?? ''),
      brokenImages: [...document.images].filter((img) => img.complete && img.naturalWidth === 0).length,
    }));
    assert(result.overflow <= 1, `page fits viewport (${result.width}px)`);
    assert(!result.badValues, 'no invalid numeric/rendered values');
    assert(result.brokenImages === 0, 'no broken images');
    return result.width;
  }

  async function teacher(c, i) {
    const id = `T${i}`;
    if (c === 0) {
      await parse(`学生ID,姓名,班级,Q21主旨,订正完成\n${id}A,测试甲,测试班,2,未完成\n${id}B,测试乙,测试班,1,未订正`);
      assert((await text('.live-metrics')).includes('0/2'), 'negative correction values are incomplete');
      await p.getByLabel('学生成绩表').fill(`学生ID,姓名,班级,Q21主旨,订正完成\n${id}A,测试甲,测试班,2,1\n${id}B,测试乙,测试班,1,0`);
      await button('解析学情').click();
      assert((await text('.live-metrics')).includes('1/2'), 'numeric correction is metadata');
      assert((await text('.data-quality-gate')).includes('2/2 个得分单元'), 'correction column excluded from scores');
    } else if (c === 1) {
      await parse(`学生ID,姓名,班级,Q21主旨,Q27词义,总分\n${id}A,测试甲,测试班,2,2,100\n${id}B,测试乙,测试班,-1,9,100`);
      assert((await text('.data-quality-details')).includes('异常得分 2'), 'out-of-range scores flagged');
      assert((await text('.data-quality-details')).includes('总分口径差异 1'), 'incompatible total flagged');
      assert(!(await text('.live-metrics')).includes('2500%'), 'total cannot inflate attainment');
      await nav('总览'); await nav('导入');
      assert((await text('.data-quality-details')).includes('异常得分 2'), 'validation retained on navigation');
    } else if (c === 2) {
      await parse(`学生ID,姓名,班级,Q21主旨,Q27词义\n${id}A,测试甲,测试班,2,\n${id}B,测试乙,测试班,,缺考`);
      assert((await text('.live-metrics')).includes('有效作答 1人'), 'no-score student excluded from average');
      assert((await text('.live-metrics')).includes('达成率 100%'), 'missing not scored as zero');
      assert((await text('.live-preview')).includes('未评分'), 'missing student explicitly ungraded');
      await button('清空').click();
      assert(await p.locator('.live-analysis').count() === 0, 'clear removes imported results');
    } else if (c === 3) {
      await parse(`\uFEFF学生ID,姓名,班级,Q21主旨,备注\n${id},测试甲,测试班,2,"第一行,说明\n第二行"`);
      assert((await text('.live-metrics')).includes('1人'), 'quoted multiline CSV is one student');
      await p.getByLabel('学生成绩表').fill(`student_id\tname\tclass\tQ21\n${id}\tTester\tDemo\t1`);
      await button('解析学情').click();
      assert((await text('.live-metrics')).includes('达成率 50%'), 'English TSV columns parsed');
    } else if (c === 4) {
      await parse(`姓名,班级,Q21,Q21\n测试甲,测试班,1,2`);
      assert((await text('.live-message')).includes('未能解析'), 'duplicate headers rejected');
      assert(await p.locator('.live-analysis').count() === 0, 'invalid table cannot retain previous result');
      await button('载入样例').click();
      assert((await text('.live-metrics')).includes('12人'), 'sample restores usable state');
    } else await diagnose(i);
  }

  async function group(c, i) {
    if (c === 4) { await report('备课组版', ['正式', '简洁', '鼓励'][Math.floor(i / 6) % 3]); await editReport(`QA-G-${i}`, true); return; }
    await nav('学情');
    if (c === 0) {
      const index = Math.floor(i / 6) % 3;
      const target = p.locator('.warning-status-chip').nth(index);
      const before = await target.innerText();
      await target.click();
      const after = await target.innerText();
      assert(after !== before, 'warning advances status');
      await nav('总览'); await nav('学情');
      assert((await p.locator('.warning-status-chip').nth(index).innerText()) === after, 'warning survives page change');
    } else if (c === 1) {
      const a = Math.floor(i / 6) % 30, b = (a + 7) % 30;
      await button('全部学生').click();
      for (const n of [a, b]) {
        await p.locator('.mastery-cell').nth(n).click();
        await p.locator('.mastery-inspector button').click();
        assert((await p.locator('.mastery-inspector button').getAttribute('aria-pressed')) === 'true', 'selected task assigned');
      }
      await nav('报告'); await nav('学情');
      for (const n of [a, b]) {
        await p.locator('.mastery-cell').nth(n).click();
        assert((await p.locator('.mastery-inspector button').getAttribute('aria-pressed')) === 'true', 'multiple assignments retained');
      }
    } else if (c === 2) {
      for (const name of ['需关注', '稳定达成', '全部学生']) {
        await button(name).click();
        const rows = await p.locator('.mastery-row:not(.mastery-head)').evaluateAll((elements) => elements.map((row) => ({
          name: row.querySelector('.mastery-student strong')?.textContent,
          values: [...row.querySelectorAll('button')].map((button) => Number(button.textContent)),
        })));
        assert(rows.length > 0, 'mastery filter nonempty');
        const selected = await text('.mastery-inspector h3');
        assert(rows.some((row) => selected.startsWith(row.name)), 'inspector belongs to filtered rows');
        for (const row of rows) {
          const values = row.values;
          if (name === '需关注') assert(values.some((v) => v < 60), 'attention row contains low skill');
          if (name === '稳定达成') assert(values.slice(-5).every((v) => v >= 65), 'stable row skills meet threshold');
        }
      }
    } else if (c === 3) {
      await button('复制备课单').click();
      assert((await tab.clipboard.readText()).includes('讲评课备课单（40分钟）'), 'lesson clipboard has plan');
      assert(await visible(button('已复制备课单')), 'lesson copy visible');
      await nav('总览'); await nav('学情');
      assert(await visible(button('复制备课单')), 'copy state resets after remount');
    } else {
      assert((await text('.analysis-context-bar')).includes('跨班级能力样例'), 'aggregate scope explicit');
      assert(await p.getByLabel('选择班级').count() === 0, 'no ineffective class filter on aggregate');
      await report('备课组版', '正式'); await copyReport();
      assert((await text('.analysis-context-bar')).includes('报告模板演示'), 'report template scope explicit');
    }
  }

  async function student(c, i) {
    await nav('学生');
    if (c === 0 || c === 4) {
      await selectStudent(1);
      const known = await text('.student-identity p');
      await selectStudent([2, 3, 4, 5, 7, 8, 9, 10, 11][Math.floor(i / 6) % 9]);
      assert((await text('.student-identity p')) !== known, 'unknown student does not inherit S02 profile');
      assert((await text('.student-progress-grid')).includes('暂无历史测验记录'), 'missing history shown as empty');
      assert(await p.locator('.tracker-row').count() === 0, 'no inherited tracking events');
      assert((await text('.task-closure-panel')).includes('暂无已分配'), 'no inherited personal task status');
      if (c === 0) { await selectStudent(1); assert((await text('.student-identity p')) === known, 'known profile restored'); }
    } else if (c === 1) {
      await selectStudent(1);
      await p.locator('.profile-review-card button').click();
      const a = await text('.follow-up-list');
      await selectStudent(2);
      await p.locator('.profile-review-card button').click();
      const b = await text('.follow-up-list');
      assert(a !== b, 'different students have different task drafts');
      await nav('总览'); await nav('学生');
      assert((await text('.follow-up-list')) === b, 'selected student tasks retained on navigation');
      await selectStudent(1);
      assert((await text('.follow-up-list')) === a, 'first student tasks remain isolated');
    } else if (c === 2) {
      await selectStudent(1);
      await p.getByRole('button', { name: /^(复制错题本|已复制错题本)$/ }).click();
      assert((await tab.clipboard.readText()).startsWith('# S02'), 'copied book belongs to S02');
      await selectStudent(2);
      assert(await visible(button('复制错题本')), 'copy success not leaked between students');
      await button('复制错题本').click();
      assert((await tab.clipboard.readText()).startsWith('# S03'), 'new copied book belongs to S03');
    } else if (c === 3) {
      const n = Math.floor(i / 6) % 12;
      await selectStudent(n);
      const name = await text('.student-identity h2');
      await nav('总览'); await nav('学生');
      assert((await text('.student-identity h2')) === name, 'student selection retained');
      assert(await p.getByLabel('选择班级').count() === 0, 'no misleading class filter for personal view');
    } else {
      await p.locator('.student-row').filter({ hasText: 'S13 全对样例' }).click();
      assert(await p.locator('.mistake-card').count() === 0, 'fixture contains no-wrong-answer student');
      assert((await text('.mistake-list')).includes('本次暂无错题'), 'no-wrong-answer empty state');
      await selectStudent(1);
      assert(await p.locator('.mistake-card').count() > 0, 'known mistakes return for S02');
      await p.locator('.student-row').filter({ hasText: 'S13 全对样例' }).click();
      assert(await p.locator('.mistake-card').count() === 0, 'empty state does not inherit previous mistakes');
      await p.locator('.profile-review-card button').click();
      assert(!(await text('.follow-up-list')).includes('订正：Q'), 'no nonexistent wrong-question tasks');
    }
  }

  async function parent(c, i) {
    const tones = ['正式', '简洁', '鼓励'];
    await report('家长版', tones[Math.floor(i / 6) % 3]);
    if (c === 0) {
      await copyReport();
      await p.getByRole('group', { name: '改写语气' }).getByRole('button', { name: tones[(Math.floor(i / 6) + 1) % 3], exact: true }).click();
      assert(await visible(button('复制报告')), 'tone change invalidates copied state');
      await copyReport();
    } else if (c === 1 || c === 4) await editReport(`QA-P-${i}`, c === 4);
    else if (c === 2) {
      const body = await text('.report-draft-preview');
      await p.locator('.report-type').filter({ hasText: '学生版' }).click();
      assert((await text('.report-document')).includes('S02 林同学'), 'student audience is separate template');
      await p.locator('.report-type').filter({ hasText: '家长版' }).click();
      await p.getByRole('group', { name: '改写语气' }).getByRole('button', { name: tones[Math.floor(i / 6) % 3], exact: true }).click();
      assert((await text('.report-draft-preview')) === body, 'parent draft not overwritten by another audience');
    } else if (c === 3) {
      const body = await text('.report-draft-preview');
      assert(!/S\d{2}|第\d+名|排名第|班级平均/.test(body), 'parent template contains no peer identifiers or ranking');
      assert((await text('.report-delivery-panel')).includes('已隐藏排名与班级比较'), 'privacy scope disclosed');
      await copyReport();
      assert(!/S\d{2}/.test(await tab.clipboard.readText()), 'copied parent report excludes peer identifiers');
    } else {
      await button('编辑报告').click();
      const dimensions = await p.getByLabel('报告正文').evaluate((el) => ({ width: el.clientWidth, font: Number.parseFloat(getComputedStyle(el).fontSize) }));
      assert(dimensions.width >= 200 && dimensions.font >= 13, 'report editor usable at this viewport');
      await button('完成编辑').click();
      await nav('总览'); await nav('报告');
      assert((await text('.report-editor-panel .panel-header')).includes('家长版'), 'parent report selection retained');
    }
  }

  async function principal(c, i) {
    await nav('总览');
    if (c === 0) {
      const entries = [['高二(3)班', '63'], ['高二(7)班', '58'], ['高三英语备课组', '67']];
      for (const [name, rate] of entries) {
        await p.getByLabel('选择班级').selectOption({ label: name });
        assert((await text('.overview-stat-line')).includes(rate), `class summary:${name}`);
        assert((await text('.analysis-context-bar')).includes(name), 'class context matches selected summary');
      }
    } else if (c === 1) {
      const toggle = p.locator('.lesson-checkbox').nth(Math.floor(i / 6) % 3);
      await p.getByLabel('选择班级').selectOption({ index: 0 });
      const before = await toggle.getAttribute('aria-pressed');
      await toggle.click();
      const after = await toggle.getAttribute('aria-pressed');
      assert(before !== after, 'lesson completion toggles');
      await p.getByLabel('选择班级').selectOption({ index: 1 });
      const other = await toggle.getAttribute('aria-pressed');
      await p.getByLabel('选择班级').selectOption({ index: 0 });
      assert((await toggle.getAttribute('aria-pressed')) === after, 'class completion retained');
      await nav('报告'); await nav('总览');
      assert((await toggle.getAttribute('aria-pressed')) === after, 'completion retained across pages');
      await toggle.click();
      await p.getByLabel('选择班级').selectOption({ index: 1 });
      assert((await toggle.getAttribute('aria-pressed')) === other, 'other class completion unaffected');
    } else if (c === 2) {
      await p.getByRole('button', { name: /^优先讲评 Q27/ }).click();
      assert((await text('.diagnosis-heading h2')).startsWith('Q27.'), 'priority card opens correct question');
      await button('生成同类练习').click();
      assert((await text('.practice-hero')).includes('Q27'), 'priority practice preserves question');
      await nav('总览');
    } else if (c === 3) {
      await report('备课组版', '正式'); await copyReport();
      assert((await tab.clipboard.readText()).includes('共性错因'), 'management report has actionable evidence');
      await nav('学情');
      assert((await text('.analysis-context-bar')).includes('跨班级'), 'management sees aggregate context');
    } else if (c === 4) {
      await nav('导入'); await nav('报告');
      await tab.back();
      assert((await text('h1')) === '数据导入与解析', 'browser back restores previous page');
      await tab.forward();
      assert((await text('h1')) === '报告生成与导出', 'browser forward restores report');
    } else {
      await p.getByRole('link', { name: '跳到主要内容' }).press('Enter');
      assert(await p.evaluate(() => document.activeElement?.id === 'main-content'), 'skip link focuses main');
      const mobile = p.getByRole('navigation', { name: '移动端导航' });
      if (await visible(mobile)) {
        await mobile.getByRole('button', { name: '更多', exact: true }).click();
        assert(await visible(p.getByRole('dialog')), 'mobile full menu opens');
        await p.getByRole('dialog').press('Escape');
        assert(!(await visible(p.getByRole('dialog'))), 'Escape closes full menu');
      } else {
        await p.getByRole('navigation', { name: '教师端导航' }).getByRole('button', { name: '学情', exact: true }).press('Enter');
        assert((await text('h1')) === '班级学情可视化', 'desktop navigation keyboard accessible');
      }
    }
  }
  const workflows = { teacher, group, student, parent, principal };
  return {
    nav,
    async run(role, iteration) {
      checks = [];
      const started = Date.now(), scenario = scenarioNames[role][iteration % 6];
      try {
        await workflows[role](iteration % 6, iteration);
        const viewport = await layout();
        return { role, iteration, scenario, viewport, passed: true, assertions: checks, durationMs: Date.now() - started };
      } catch (error) {
        return { role, iteration, scenario, passed: false, assertions: checks, error: String(error), durationMs: Date.now() - started };
      }
    },
  };
}
