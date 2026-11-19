# RobotIC Docusaurus 知识库

这是华南理工大学 RobotIC 机器人实验室的知识库工程，使用 Docusaurus 3 构建。内容发布到 GitHub Pages：

```text
https://scut-robotic.github.io/docs/
```

## 工程结构

- 正文：`content/`
- 侧边栏：`sidebars.ts`
- 图像等静态资源：`static/`
- Markdown 转换插件：`src/remark/`
- 站点配置：`docusaurus.config.ts`
- 构建测试：`tests/`
- 构建产物：`docs/`，不提交到源码分支

## 本地开发

在工程根目录运行：

```powershell
npm install
npm run start
```

默认访问：

```text
http://localhost:3000/docs/
```

修改普通 Markdown 后页面会自动刷新。修改 Docusaurus 配置、Remark 插件或依赖后，需要重启开发服务器。

## 编写指南

### 换行

Obsidian 会把普通 Markdown 中的单换行显示为换行，而 Docusaurus 默认把单换行当作空格。需要两边都强制换行时，在前一行末尾保留两个半角空格，再换行：

```markdown
> Ver1.0··
> 本章编者：李融
```

上面的 `··` 表示两个实际的半角空格，不是中文句号，也不要写在下一行开头。普通长段落不要为了排版手动断行，让网页和 Obsidian 根据各自窗口宽度自动折行。

行尾空格属于 Markdown 语法的一部分，提交前不要运行会删除行尾空格的格式化工具。

### 内容源

知识库发布以 Docusaurus 工程中的文件为准：

```text
D:\dev\Docusaurus\content\
```

当前嵌入式软件资料位于：

```text
D:\dev\Docusaurus\content\电控组知识库\嵌入式软件基础\
```

建议直接编辑这里的内容，并把它作为唯一发布源。不要同时修改 Obsidian 原件和 Docusaurus 副本，否则两边会逐渐产生差异。

如果需要继续用 Obsidian 编辑，可以把 `D:\dev\Docusaurus\content` 添加为 Obsidian Vault，或只打开 `content` 目录。

## 修改现有文档

1. 打开 `content/电控组知识库/嵌入式软件基础/` 下对应的 Markdown 文件。
2. 修改正文。
3. 运行 `npm run start` 预览。
4. 确认页面、图片、公式和高亮块正常。
5. 运行测试和正式构建。

## 新增文档

新文档放入对应分类目录，例如：

```text
content/电控组知识库/嵌入式软件基础/1. 编程基础/1.5-新文档.md
```

推荐使用以下头部：

```markdown
---
title: 新文档
sidebar_label: 1.5 新文档
sidebar_position: 30
---

# 新文档

正文从这里开始。
```

编号采用两层结构：

- 外层分类使用 `1.`、`2.`、`3.`……
- 分类内正文使用 `1.1-`、`1.2-`、`2.1-`、`2.2-`……
- 番外、附录放在正文之后，例如 `1.3-番外`、`1.4-附录`

自定义前缀解析器位于 `src/numberPrefix.ts`，会把 `1.2` 转换为可排序的数值，同时从页面路由中移除前缀。

编号只用于文件名、分类标签和 `sidebar_label`。每篇具体文档的 `title` 和正文 H1 只写纯文档标题，不再重复编号。

当前使用 `sidebars.ts` 中的显式侧边栏。新增文档后，需要把文档 ID 加到对应分类的 `items` 中。

例如：

```ts
{
  type: 'category',
  label: '1. 编程基础',
  items: [
    '电控组知识库/嵌入式软件基础/编程基础/C语言编程',
    '电控组知识库/嵌入式软件基础/编程基础/程序设计的思维',
  ],
}
```

## 新增分类

显式侧边栏模式下，新建目录后还需要在 `sidebars.ts` 中添加一个 `category`：

```ts
{
  type: 'category',
  label: '6. 新分类',
  collapsed: true,
  items: [
    '电控组知识库/嵌入式软件基础/新分类/6.1-新文档',
  ],
}
```

## 新增专业组知识库

不同组使用独立 sidebar，互不混入：

1. 在 `content/` 下创建新的组目录，例如 `content/视觉组知识库/`。
2. 在 `sidebars.ts` 中增加独立的 `visionGroupSidebar`。
3. 只把视觉组的文档 ID 放入该 sidebar。
4. 在首页 `content/welcome.mdx` 增加进入视觉组知识库的链接。

首页不属于任何专业组 sidebar，只负责选择知识库。进入某个组后，只显示该组自己的目录。

## 图片

图片放在文档附近的 `assets/` 或文档同级目录，并使用相对路径：

```markdown
![示意图](<assets/示意图.png>)
```

文件名含空格时保留尖括号。不要使用本地绝对路径，例如 `D:\...`。

## 高亮块

可以继续使用 Obsidian callout：

```markdown
> [!Note] 标题
> 正文
```

构建时会自动转换为 Docusaurus admonition。当前映射：

- `Note` → 蓝色“信息”
- `Info` → 灰色“备注”
- `Tip` / `Success` → 绿色
- `Warning` / `Attention` / `Question` → 黄色
- `Important` / `Danger` → 红色

## 公式

支持行内公式和独立公式：

```markdown
$E = mc^2$

$$
f = \frac{\mathrm{CLK}}{\mathrm{PSC} + 1}
$$
```

含 JSX 冲突的复杂 `.md` 文件可以在 front matter 中声明：

```yaml
format: mdx
```

## 发布前检查

在工程根目录依次运行：

```powershell
npm run typecheck
node --test tests/docs-build.test.mjs
npm run build
```

构建测试会实际执行一次 Docusaurus 构建，并检查：

- 文档和图片数量
- 相对图片路径
- 页面和分类路由
- KaTeX 公式
- Obsidian callout 的标题及颜色映射
- 页面标题和残留标记

三项检查都通过后再提交源码。

## 构建与发布

正式构建：

```powershell
npm run build
```

静态站点输出到：

```text
D:\dev\Docusaurus\docs
```

推送到 `main` 后，GitHub Actions 会执行依赖安装、TypeScript 检查和 Docusaurus 构建，然后发布到 GitHub Pages。
