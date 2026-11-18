# RobotIC Docusaurus 知识库

这是华南理工大学 RobotIC 机器人实验室的知识库工程，使用 Docusaurus 3 构建。生成结果写入根目录的 `docs/`，可按计划发布到 GitHub Pages。

## 本地开发

```powershell
npm install
npm run start
```

开发服务器会按 `/docs/` 基路径加载资源。

## 构建

```powershell
npm run build
```

构建完成后，静态站点位于：

```text
D:\dev\Docusaurus\docs
```

计划发布地址：

```text
https://scut-robotic.github.io/docs/
```

## 工程结构

- 正文：`content/`
- 侧边栏：`sidebars.ts`
- 图像等静态资源：`static/`
- 站点配置：`docusaurus.config.ts`
- 构建测试：`tests/`
- 构建产物：`docs/`

修改正文并重新构建后，提交源码和 `docs/` 即可发布。
