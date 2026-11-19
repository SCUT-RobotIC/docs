# RobotIC 知识库开发与内容维护指南

这是华南理工大学 RobotIC 机器人实验室的知识库工程，使用 Docusaurus 3 构建。

线上地址：[RobotIC 知识库](https://scut-robotic.github.io/docs/)

仓库内容分为两类使用者：

- **内容编辑者**：只编写和维护 Markdown 文档，通常不需要修改 TypeScript 或 React 代码。
- **站点开发者**：维护主题、配置、Markdown 插件、自动化测试和 GitHub Pages 部署。

两种工作可以共用同一份 `content/` 内容，但操作步骤不同。

## 工程结构

```text
content/                 知识库正文
sidebars.ts              自动侧边栏入口
src/knowledgeSidebars.mjs 目录扫描、排序和侧边栏生成
static/                  全站静态资源
src/css/                 全站样式
src/remark/              Obsidian 语法转换插件
docusaurus.config.ts     站点配置
.github/workflows/       GitHub Pages 自动部署
tests/                   构建与内容检查
docs/                    本地构建产物，不提交
```

发布内容以 `content/` 为唯一来源。不要维护另一份 Markdown 副本。

## 方式一：只写内容

不需要安装 Node.js，也不需要理解 Docusaurus 代码。推荐使用 Obsidian 或任意 Markdown 编辑器。

1. 获取仓库并拉取最新 `main` 分支。
2. 在 Obsidian 中把仓库的 `content/` 目录添加为 Vault，或者直接使用文本编辑器打开该目录。
3. 在任一知识库下修改现有文档，或按目录结构新增主题和 Markdown 文件。
4. 确认目录名和文件名符合排序约定，网站会自动生成顶栏入口和侧边栏。
5. 提交并推送内容；如需本地预览，再按下文的开发流程启动站点。

内容编辑应保持以下约定：

- 每篇文档只有一个一级标题 `#`。
- 知识库、主题和文档的层级直接由目录层级表达。
- 文件和目录默认按名称字典序排列。
- 图片使用相对于当前文档的路径。
- 不修改 `docs/`，它是构建产物。

## 方式二：开发站点

开发环境需要 Git 和 Node.js 20 或更高版本。在仓库根目录运行：

```powershell
npm install
npm run start
```

本地地址：

```text
http://localhost:3000/docs/
```

普通 Markdown 修改会自动刷新。修改 `docusaurus.config.ts`、`sidebars.ts`、`src/knowledgeSidebars.mjs`、`src/remark/` 或依赖后，建议重启开发服务器。

开发完成后运行：

```powershell
npm run typecheck
node --test tests/docs-build.test.mjs
npm run build
```

其中 `node --test tests/docs-build.test.mjs` 会完整执行一次 Docusaurus 构建，因此通常可以代替单独的本地构建检查。

## 自动生成知识库与侧边栏

`content/` 下的每个顶层目录都会自动成为一个独立知识库、顶栏入口和侧边栏。目录层级直接对应主题层级：

```text
content/
└── 视觉组知识库/
    ├── index.mdx
    └── 1. 基础/
        ├── index.mdx
        └── 1.1 相机/
            └── 相机模型.md
```

上述结构会自动生成：

```text
视觉组知识库
└── 1. 基础
    └── 1.1 相机
        └── 相机模型
```

规则如下：

- 带 `index.md` 或 `index.mdx` 的目录会成为可点击的主题入口。
- 其他 Markdown 自动成为侧边栏文档。
- 可以使用任意层级目录，不需要填写数字格式。
- 默认按目录名和文件名的字典序排列。
- 隐藏目录和文件不会进入侧边栏，例如 `.obsidian`。

普通编辑者新增内容时，不需要修改 `sidebars.ts`。开发服务器运行时新增或移动顶层知识库、主题目录后，如果侧边栏没有立即刷新，重启 `npm run start` 即可；正式构建不需要额外操作。

### 特殊排序

如果字典序不满足要求，可以在对应目录放置 `_order.json`，只列出需要提前的直属目录或文件：

```json
{
  "order": [
    "1. 基础",
    "2. 进阶",
    "3. 附录"
  ]
}
```

未出现在列表中的项目排在已列出项目之后，再按字典序排列。知识库顶层的特殊顺序由 `content/_order.json` 控制。

### 文档属性

普通文档可以不写 front matter，页面标题会使用第一个 H1。需要自定义页面标题或侧栏名称时再使用：

```markdown
---
title: 相机模型
sidebar_label: 1.1.1 相机模型
---

# 相机模型

正文从这里开始。
```

`sidebar_position` 不参与当前目录驱动的侧边栏排序。

## Markdown 语法速查

### 标题层级

每篇文档只写一个一级标题，正文内部从二级标题开始，不要跳过层级：

```markdown
# 文档标题

## 第一节

### 第一节的小节
```

### 段落与换行

段落之间留一个空行。Obsidian 会把单个源码换行显示为换行，Docusaurus 默认把它当作空格；需要两边都强制换行时，在上一行末尾保留两个半角空格：

```markdown
第一行··
第二行
```

上面的 `··` 表示两个实际的半角空格。行尾空格属于 Markdown 语法，不要启用会删除行尾空格的格式化工具。普通长段落不要手动折行，让页面根据窗口宽度自动换行。

### 强调、代码和链接

```markdown
**粗体**
*斜体*
`行内代码`
[链接文字](https://example.com)
```

同目录文档之间的链接使用相对路径，不写本地绝对路径。

### 列表

```markdown
- 无序列表项
- 另一个列表项

1. 有序列表项
2. 另一个有序列表项
```

嵌套列表使用两个或四个空格缩进，并保持整篇文档一致。

### 图片

图片放在文档附近的 `assets/` 或文档同级目录，并使用相对路径：

```markdown
![示意图](<assets/示意图.png>)
```

文件名含空格时保留尖括号。图片路径必须相对于当前 Markdown 文件，不使用本地绝对路径。

### 代码块

在围栏后标注语言，以获得正确高亮：

````markdown
```c
int main(void) {
    return 0;
}
```
````

### 高亮块

可以继续使用 Obsidian callout。正文中的每一行都要以 `>` 开头：

```markdown
> [!Note] 标题
> 正文第一段
>
> 正文第二段
```

构建时会自动转换为 Docusaurus admonition。当前颜色和语义映射：

| 写法 | 显示效果 |
| --- | --- |
| `[!Note]` | 蓝色，信息 |
| `[!Info]` | 灰色，备注 |
| `[!Tip]` / `[!Success]` | 绿色，提示 |
| `[!Warning]` / `[!Attention]` / `[!Question]` | 黄色，警告或问题 |
| `[!Important]` / `[!Danger]` | 红色，重要或危险 |

推荐给每个高亮块写明确标题，例如：

```markdown
> [!Question] 需要先完成什么？
> 阅读本节前应先掌握上一节的内容。
```

### 公式

支持行内公式和独立公式：

```markdown
$E = mc^2$

$$
f = \frac{\mathrm{CLK}}{\mathrm{PSC} + 1}
$$
```

公式由 KaTeX 渲染。复杂公式应单独成段，避免和中文标点混在同一行造成解析歧义。

### MDX：在 Markdown 中使用 JSX

Docusaurus 本身基于 MDX。普通内容继续使用 `.md`；需要在 Markdown 中插入 JSX、导入组件或使用表达式时，使用 `.mdx`。

MDX 可以理解为“Markdown + JSX”。除了常规 Markdown，它还支持：

- 行内 HTML/JSX：

```mdx
按 <kbd>Ctrl</kbd> + <kbd>C</kbd> 复制。
```

- 导入并使用 React 组件：

```mdx
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="stm32" label="STM32">
    STM32 内容
  </TabItem>
  <TabItem value="rtos" label="RTOS">
    RTOS 内容
  </TabItem>
</Tabs>
```

组件导入写在 front matter 之后、正文之前。组件内部可以继续写普通 Markdown。

- 使用 JavaScript 表达式：

```mdx
当前计算结果：{2 * 4}
```

- 使用 MDX 注释：

```mdx
{/* 这段注释不会显示在页面上 */}
```

编写时注意：

- 不需要组件或表达式时优先使用 `.md`，源码更简单，也更容易被其他 Markdown 工具读取。
- 在 MDX 中，`{}` 和 `<组件名>` 具有特殊含义；需要展示这些字符时放进行内代码：

```mdx
使用 `{变量}` 表示表达式，使用 `<Component />` 表示组件。
```

- 如果文件必须保留 `.md` 后缀但同时包含 MDX，需要在 front matter 中声明：

```yaml
---
format: mdx
---
```

- 组件必须能在构建阶段正常渲染，不要在组件顶层直接访问 `window`、`document` 等只在浏览器中存在的对象。

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
docs/
```

推送到 `main` 后，GitHub Actions 会执行依赖安装、TypeScript 检查和 Docusaurus 构建，然后发布到 GitHub Pages。
