import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  buildKnowledgeSidebars,
  discoverKnowledgeBases,
  knowledgeBaseSidebarId,
} from "../src/knowledgeSidebars.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const siteRoot = repoRoot;
const outputRoot = path.join(repoRoot, "docs");
const legacyName = ["git", "book"].join("");
const importedRoot = path.join(
  repoRoot,
  "content",
  "电控组知识库",
  "嵌入式软件基础",
);
const contentRoot = path.join(repoRoot, "content");

function collectFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(entryPath));
    } else {
      files.push(entryPath);
    }
  }
  return files;
}

function admonitionTypeForText(html, text) {
  const textIndex = html.indexOf(text);
  assert.notEqual(textIndex, -1, `expected admonition title: ${text}`);
  const classes = [
    ...html
      .slice(0, textIndex)
      .matchAll(/theme-admonition-([a-z]+)/g),
  ];
  return classes.at(-1)?.[1];
}

function collectSidebarLabels(items) {
  return items.flatMap((item) =>
    item.type === "category"
      ? [item.label, ...collectSidebarLabels(item.items ?? [])]
      : [item.label],
  );
}

function lastCommitIso(relativePath) {
  const result = spawnSync(
    "git",
    ["log", "-1", "--format=%cI", "--", relativePath],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 0, result.stderr);
  const timestamp = result.stdout.trim();
  assert.ok(timestamp, `expected git history for ${relativePath}`);
  return new Date(timestamp).toISOString();
}

test("generates nested sidebars from content directories", () => {
  const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), "robotickb-"));
  try {
    const knowledgeBaseRoot = path.join(temporaryRoot, "机械组知识库");
    const firstTopicRoot = path.join(knowledgeBaseRoot, "1. 一级主题");
    const secondTopicRoot = path.join(firstTopicRoot, "1.1 二级主题");
    mkdirSync(secondTopicRoot, {recursive: true});
    writeFileSync(
      path.join(temporaryRoot, "_order.json"),
      '{"order":["机械组知识库","电控组知识库","算法组知识库"]}',
    );
    for (const name of ["电控组知识库", "算法组知识库"]) {
      const directory = path.join(temporaryRoot, name);
      mkdirSync(directory, {recursive: true});
      writeFileSync(
        path.join(directory, "index.md"),
        `# ${name}\n\n知识库首页。\n`,
      );
    }
    writeFileSync(
      path.join(knowledgeBaseRoot, "index.md"),
      "# 机械组知识库\n\n知识库首页。\n",
    );
    writeFileSync(
      path.join(firstTopicRoot, "index.md"),
      "# 一级主题\n\n一级主题首页。\n",
    );
    writeFileSync(
      path.join(secondTopicRoot, "示例文档.md"),
      "# 示例文档\n\n正文。\n",
    );

    assert.deepEqual(
      discoverKnowledgeBases(temporaryRoot).map(({name}) => name),
      ["机械组知识库", "电控组知识库", "算法组知识库"],
    );

    const sidebars = buildKnowledgeSidebars(temporaryRoot);
    const sidebarId = knowledgeBaseSidebarId("机械组知识库");
    const root = sidebars[sidebarId][0];
    assert.equal(root.label, "机械组知识库");
    assert.equal(root.link.id, "机械组知识库/index");
    assert.equal(root.items[0].label, "1. 一级主题");
    assert.equal(
      root.items[0].link.id,
      "机械组知识库/一级主题/index",
    );
    assert.deepEqual(root.items[0].items[0].items, [
      {
        type: "doc",
        id: "机械组知识库/一级主题/二级主题/示例文档",
      },
    ]);
  } finally {
    rmSync(temporaryRoot, {recursive: true, force: true});
  }
});

test("builds the Docusaurus knowledge base under the docs URL", () => {
  const readme = readFileSync(path.join(repoRoot, "README.md"), "utf8");
  assert.match(readme, /## 发布前检查/);
  assert.match(readme, /## 方式一：只写内容/);
  assert.match(readme, /## 方式二：开发站点/);
  assert.match(readme, /## 自动生成知识库与侧边栏/);
  assert.match(readme, /### 特殊排序/);
  assert.match(readme, /### 文档更新时间/);
  assert.match(readme, /## Markdown 语法速查/);
  assert.match(readme, /### 高亮块/);
  assert.match(readme, /### MDX：在 Markdown 中使用 JSX/);
  assert.match(readme, /@theme\/Tabs/);
  assert.doesNotMatch(readme, /\b[A-Za-z]:[\\/]/);
  assert.doesNotMatch(readme, /RockyLi|rockeyleo|李融|我的文档/i);

  const configSource = readFileSync(
    path.join(repoRoot, "docusaurus.config.ts"),
    "utf8",
  );
  assert.match(configSource, /src\/remark\/lastUpdated\.mjs/);
  const workflowSource = readFileSync(
    path.join(repoRoot, ".github", "workflows", "deploy.yml"),
    "utf8",
  );
  assert.match(workflowSource, /fetch-depth:\s*0/);

  assert.ok(
    existsSync(path.join(repoRoot, "content", "电控组知识库", "index.mdx")),
    "expected the electronic control knowledge base landing page",
  );
  assert.ok(existsSync(importedRoot), "expected the embedded software library");
  assert.equal(
    existsSync(
      path.join(contentRoot, "电控组知识库", "RobotIC线上知识库"),
    ),
    false,
    "the accidental nested Obsidian vault must not remain in content",
  );

  const hierarchicalDocs = [
    "1. 编程基础/1.1-C语言编程.md",
    "1. 编程基础/1.2-程序设计的思维.md",
    "1. 编程基础/1.3-番外：跑步进入现代IDE——STM32开发环境的探索.md",
    "1. 编程基础/1.4-附录：推荐代码规范.md",
    "2. STM32基础/2.1-引入和内核.md",
    "2. STM32基础/2.2-外设.md",
    "2. STM32基础/2.3-通信.md",
    "2. STM32基础/2.4-【扩展】烧录和调试.md",
    "3. 控制理论/3.1-基础控制.md",
    "3. 控制理论/3.2-【扩展】滤波.md",
    "3. 控制理论/3.3-【扩展】运动解算和规划.md",
    "3. 控制理论/3.4-【扩展】进一步理解控制理论.md",
    "4. RTOS/4.1-RTOS.md",
    "5.【扩展】一点C++/5.1-一点C++.md",
    "5.【扩展】一点C++/5.2-番外：在STM32工程中使用C++.md",
  ];
  for (const relativePath of hierarchicalDocs) {
    assert.ok(
      existsSync(path.join(importedRoot, relativePath)),
      `expected hierarchical document ${relativePath}`,
    );
  }

  const importedFiles = collectFiles(importedRoot);
  const markdownFiles = importedFiles.filter((file) =>
    /\.mdx?$/.test(file),
  );
  const copiedDocs = markdownFiles.filter(
    (file) => file !== path.join(importedRoot, "index.md"),
  );
  const imageFiles = importedFiles.filter((file) =>
    /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(file),
  );

  assert.equal(copiedDocs.length, 16);
  assert.equal(imageFiles.length, 60);

  const imageReferences = [];
  const missingImages = [];
  for (const note of markdownFiles) {
    const markdown = readFileSync(note, "utf8");
    for (const match of markdown.matchAll(/!\[[^\]]*\]\(<([^>]+)>\)/g)) {
      const target = match[1];
      imageReferences.push(target);
      const resolved = path.resolve(path.dirname(note), target);
      if (!existsSync(resolved)) {
        missingImages.push({note, target, resolved});
      }
      assert.equal(path.isAbsolute(target), false, `${note} uses ${target}`);
    }
  }

  assert.equal(imageReferences.length, 42);
  assert.deepEqual(missingImages, []);
  const preface = readFileSync(
    path.join(importedRoot, "0. 序言和目录.md"),
    "utf8",
  );
  assert.doesNotMatch(preface, /\[\[[^\]]+\]\]/);

  const result =
    process.platform === "win32"
      ? spawnSync(process.env.ComSpec ?? "cmd.exe", [
          "/d",
          "/s",
          "/c",
          "npm run build",
        ], {
          cwd: siteRoot,
          encoding: "utf8",
        })
      : spawnSync("npm", ["run", "build"], {
          cwd: siteRoot,
          encoding: "utf8",
        });

  assert.equal(
    result.status,
    0,
    `Docusaurus build failed (${result.error?.message ?? "no spawn error"}):\n${result.stdout}\n${result.stderr}`,
  );

  const indexHtml = readFileSync(path.join(outputRoot, "index.html"), "utf8");
  assert.match(indexHtml, /RobotIC 知识库/);
  assert.match(indexHtml, /\/docs\/assets\//);
  assert.match(indexHtml, /\/docs\/img\/robot-logo-dark\.png/);
  assert.match(indexHtml, /\/docs\/img\/robot-logo-light\.png/);
  assert.match(indexHtml, /href="?\/docs\/机械组知识库"?/);
  assert.match(indexHtml, /href="?\/docs\/电控组知识库"?/);
  assert.match(indexHtml, /href="?\/docs\/算法组知识库"?/);
  assert.match(indexHtml, /class="knowledge-entry"/);
  assert.match(indexHtml, /机械组知识库/);
  assert.match(indexHtml, /电控组知识库/);
  assert.match(indexHtml, /算法组知识库/);
  const navbarHtml = indexHtml.slice(0, indexHtml.indexOf("<main"));
  for (const label of ["机械组知识库", "电控组知识库", "算法组知识库"]) {
    assert.match(
      navbarHtml,
      new RegExp(`>${label}</a>`),
      `missing navbar knowledge base: ${label}`,
    );
  }
  assert.doesNotMatch(
    indexHtml,
    /嵌入式软件基础 · STM32 · 控制理论 · RTOS/,
  );
  assert.doesNotMatch(indexHtml, /每个专业组使用独立侧边栏/);
  assert.doesNotMatch(indexHtml, /需要新增或维护文档时/);
  assert.ok(existsSync(path.join(repoRoot, "static", "img", "favicon.png")));
  assert.equal(
    existsSync(path.join(outputRoot, "writing-guide", "index.html")),
    false,
    "the writing guide must not be published as a separate page",
  );
  assert.ok(
    existsSync(path.join(outputRoot, "电控组知识库", "index.html")),
    "expected the electronic control knowledge base route",
  );
  assert.ok(
    existsSync(
      path.join(outputRoot, "电控组知识库", "嵌入式软件基础", "index.html"),
    ),
    "expected the embedded software library route",
  );
  const peripheralHtml = readFileSync(
    path.join(
      outputRoot,
      "电控组知识库",
      "嵌入式软件基础",
      "STM32基础",
      "外设",
      "index.html",
    ),
    "utf8",
  );
  assert.match(peripheralHtml, /class="katex"/);
  assert.doesNotMatch(peripheralHtml, /<p>\s*\$\$/);
  const cLanguageHtml = readFileSync(
    path.join(
      outputRoot,
      "电控组知识库",
      "嵌入式软件基础",
      "编程基础",
      "C语言编程",
      "index.html",
    ),
    "utf8",
  );
  assert.match(cLanguageHtml, /theme-admonition-tip/);
  assert.doesNotMatch(cLanguageHtml, /\[!Tip\]/i);
  assert.doesNotMatch(cLanguageHtml, /\[!Question\]/i);
  assert.equal(
    admonitionTypeForText(cLanguageHtml, "使用stdint提供的数据类型"),
    "tip",
  );
  assert.equal(
    admonitionTypeForText(cLanguageHtml, "为什么总是有UB？"),
    "warning",
  );
  assert.equal(
    admonitionTypeForText(
      cLanguageHtml,
      "【扩展】结构体的存储结构",
    ),
    "info",
  );

  const embeddedIndexPath =
    "content/电控组知识库/嵌入式软件基础/index.md";
  const embeddedIndexHtml = readFileSync(
    path.join(
      outputRoot,
      "电控组知识库",
      "嵌入式软件基础",
      "index.html",
    ),
    "utf8",
  );
  assert.match(embeddedIndexHtml, /更新时间：/);
  assert.match(
    embeddedIndexHtml,
    new RegExp(
      `</header>\\s*<p class="doc-last-updated" data-doc-updated-at="${lastCommitIso(embeddedIndexPath)}">更新时间：`,
    ),
  );

  const prefacePath =
    "content/电控组知识库/嵌入式软件基础/0. 序言和目录.md";
  const prefaceHtml = readFileSync(
    path.join(
      outputRoot,
      "电控组知识库",
      "嵌入式软件基础",
      "序言和目录",
      "index.html",
    ),
    "utf8",
  );
  assert.match(prefaceHtml, /更新时间：/);
  assert.match(
    prefaceHtml,
    new RegExp(
      `</header>\\s*<p class="doc-last-updated" data-doc-updated-at="${lastCommitIso(prefacePath)}">更新时间：`,
    ),
  );

  const coreHtml = readFileSync(
    path.join(
      outputRoot,
      "电控组知识库",
      "嵌入式软件基础",
      "STM32基础",
      "引入和内核",
      "index.html",
    ),
    "utf8",
  );
  assert.equal(
    admonitionTypeForText(
      coreHtml,
      "具体中断的使用方法详见各自章节。",
    ),
    "note",
  );

  const appendixHtml = readFileSync(
    path.join(
      outputRoot,
      "电控组知识库",
      "嵌入式软件基础",
      "编程基础",
      "附录：推荐代码规范",
      "index.html",
    ),
    "utf8",
  );
  assert.match(appendixHtml, /<title[^>]*>附录：推荐代码规范/);
  assert.match(appendixHtml, /<h1>附录：推荐代码规范<\/h1>/);

  const designThinkingHtml = readFileSync(
    path.join(
      outputRoot,
      "电控组知识库",
      "嵌入式软件基础",
      "编程基础",
      "程序设计的思维",
      "index.html",
    ),
    "utf8",
  );
  assert.match(designThinkingHtml, /<title[^>]*>程序设计的思维/);
  assert.match(designThinkingHtml, /<h1>程序设计的思维<\/h1>/);
  assert.match(designThinkingHtml, /Ver1\.0<br\s*\/?>/);

  assert.match(coreHtml, /更多参考：<br\s*\/?>/);
  assert.match(
    coreHtml,
    /Cortex-M3 Devices Generic User Guide<\/a><br\s*\/?>/,
  );

  const documentTitles = [
    ["RTOS/RTOS", "RTOS"],
    ["STM32基础/【扩展】烧录和调试", "【扩展】烧录和调试"],
    ["STM32基础/外设", "外设"],
    ["STM32基础/引入和内核", "引入和内核"],
    ["STM32基础/通信", "通信"],
    ["序言和目录", "序言和目录"],
    ["【扩展】一点C++/一点C++", "一点C++"],
    [
      "【扩展】一点C++/番外：在STM32工程中使用C++",
      "番外：在STM32工程中使用C++",
    ],
    ["控制理论/【扩展】滤波", "【扩展】滤波"],
    [
      "控制理论/【扩展】运动解算和规划",
      "【扩展】运动解算和规划",
    ],
    [
      "控制理论/【扩展】进一步理解控制理论",
      "【扩展】进一步理解控制理论",
    ],
    ["控制理论/基础控制", "基础控制"],
    ["编程基础/C语言编程", "C语言编程"],
    [
      "编程基础/番外：跑步进入现代IDE——STM32开发环境的探索",
      "番外：跑步进入现代IDE——STM32开发环境的探索",
    ],
    ["编程基础/程序设计的思维", "程序设计的思维"],
    ["编程基础/附录：推荐代码规范", "附录：推荐代码规范"],
  ];
  for (const [relativePath, expectedTitle] of documentTitles) {
    const documentHtml = readFileSync(
      path.join(
        outputRoot,
        "电控组知识库",
        "嵌入式软件基础",
        relativePath,
        "index.html",
      ),
      "utf8",
    );
    const headings = [
      ...documentHtml.matchAll(/<h1[^>]*>(.*?)<\/h1>/g),
    ].map((match) => match[1].replace(/<[^>]+>/g, ""));
    assert.deepEqual(
      headings,
      [expectedTitle],
      `unexpected H1 structure for ${relativePath}`,
    );
  }

  const contentDocsRoot = path.join(
    repoRoot,
    ".docusaurus",
    "docusaurus-plugin-content-docs",
    "default",
  );
  const sidebarFile = collectFiles(contentDocsRoot).find((file) => {
    if (!/docs-.*\.json$/.test(file)) {
      return false;
    }
    return readFileSync(file, "utf8").includes('"docsSidebars"');
  });
  assert.ok(sidebarFile, "expected generated sidebar metadata");
  const sidebarData = JSON.parse(readFileSync(sidebarFile, "utf8"));
  const knowledgeBases = discoverKnowledgeBases(contentRoot);
  assert.deepEqual(
    knowledgeBases.map(({name}) => name),
    ["机械组知识库", "电控组知识库", "算法组知识库"],
  );
  for (const knowledgeBase of knowledgeBases) {
    assert.ok(
      sidebarData.version.docsSidebars[knowledgeBase.sidebarId],
      `missing sidebar for ${knowledgeBase.name}`,
    );
  }
  const electricKnowledgeBase = knowledgeBases.find(
    ({name}) => name === "电控组知识库",
  );
  assert.ok(electricKnowledgeBase, "expected the electric knowledge base");
  const sidebarLabels = collectSidebarLabels(
    sidebarData.version.docsSidebars[electricKnowledgeBase.sidebarId],
  );
  const expectedNumberedLabels = [
    "电控组知识库",
    "嵌入式软件基础",
    "0. 序言和目录",
    "1. 编程基础",
    "1.1 C语言编程",
    "1.2 程序设计的思维",
    "1.3 番外：跑步进入现代IDE——STM32开发环境的探索",
    "1.4 附录：推荐代码规范",
    "2. STM32基础",
    "2.1 引入和内核",
    "2.2 外设",
    "2.3 通信",
    "2.4 【扩展】存储结构",
    "3. 控制理论",
    "3.1 基础控制",
    "3.2 【扩展】滤波",
    "3.3 【扩展】运动解算和规划",
    "3.4 【扩展】进一步理解控制理论",
    "4. RTOS",
    "4.1 RTOS",
    "5.【扩展】一点C++",
    "5.1 一点C++",
    "5.2 番外：在STM32工程中使用C++",
  ];
  let previousLabelIndex = -1;
  for (const label of expectedNumberedLabels) {
    const labelIndex = sidebarLabels.indexOf(label, previousLabelIndex + 1);
    assert.notEqual(labelIndex, -1, `missing sidebar label: ${label}`);
    previousLabelIndex = labelIndex;
  }

  assert.equal(
    existsSync(path.join(outputRoot, "markdown-page", "index.html")),
    false,
    "Docusaurus template routes must not be published",
  );
  assert.equal(
    existsSync(path.join(repoRoot, legacyName)),
    false,
    "the obsolete nested project directory must be removed",
  );

  const filesWithoutLegacyName = [
    "README.md",
    "package.json",
    "docusaurus.config.ts",
    "sidebars.ts",
    "content/welcome.mdx",
    "docs/index.html",
  ];
  for (const relativePath of filesWithoutLegacyName) {
    const content = readFileSync(path.join(repoRoot, relativePath), "utf8");
    assert.doesNotMatch(
      content,
      new RegExp(legacyName, "i"),
      `${relativePath} still contains the obsolete project name`,
    );
  }
});
