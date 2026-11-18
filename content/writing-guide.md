---
id: writing-guide
title: 编写指南
sidebar_position: 2
---

# 编写指南

## 新增文档

在 `content/` 下创建 `.md` 或 `.mdx` 文件，然后在 `sidebars.ts` 中登记页面 ID。

例如：

```markdown
---
id: motor-tuning
title: 电机调试
sidebar_position: 10
---

# 电机调试

在这里编写正文。
```

## 本地预览

在知识库工程根目录运行：

```powershell
npm run start
```

浏览器打开 Docusaurus 给出的本地地址。修改 Markdown 后页面会自动刷新。

## 构建并发布

在知识库工程根目录运行：

```powershell
npm run build
```

构建结果会写入仓库根目录的 `docs/`。将该目录和源文件一起提交到 `main` 后，GitHub Pages 会自动发布：

```text
https://scut-robotic.github.io/docs/
```

## Markdown 约定

- 标题从二级标题开始，页面标题由 front matter 的 `title` 提供。
- 图片放在 `static/` 或文档同级目录，并使用相对路径。
- 命令块标明语言，例如 `powershell`、`bash` 或 `c`。
- 引用仓库文件时优先使用相对链接。
- 提交前运行 `npm run build`，构建失败时不要发布。
