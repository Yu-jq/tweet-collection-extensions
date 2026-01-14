# 推特内容抓取器 Chrome 扩展

一个强大的浏览器扩展，让您轻松抓取和保存推特内容为结构化的 Markdown 文档。

## 功能特点

- 在推特页面直接点击按钮抓取推文
- 侧边栏表格管理所有抓取的推文
- 支持抓取文本、图片和视频
- 默认全选，可多选管理
- 一键导出为 Markdown 文档（图片自动转 base64）
- 本地存储，隐私安全

## 安装步骤

### 1. 构建扩展

**Windows 用户（推荐使用 npm）：**
```bash
npm install --legacy-peer-deps
npm run build
```

**Mac/Linux 用户：**
```bash
pnpm install
pnpm run build
```

### 2. 加载到 Chrome

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目的 `dist` 文件夹

### 3. 使用扩展

1. 访问 Twitter (twitter.com) 或 X (x.com)
2. 点击浏览器工具栏中的扩展图标，打开侧边栏
3. 在推文上会看到蓝色的"抓取"按钮，点击即可抓取
4. 在侧边栏中管理和导出您的推文集合

## 使用说明

### 抓取推文
- 浏览推特时，每条推文旁边会出现"抓取"按钮
- 点击按钮即可将推文添加到侧边栏表格
- 支持抓取文本、图片和视频链接

### 管理推文
- 侧边栏显示所有抓取的推文
- 默认全选所有推文
- 可以单独选择/取消选择
- 可以删除不需要的推文
- 点击外链图标查看原推文

### 导出 Markdown
- 点击"下载 Markdown"按钮
- 系统会将选中的推文导出为 .md 文件
- 图片会自动下载并转换为 base64 内嵌在文档中
- 视频会保留链接

## 技术栈

- React 19
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Chrome Extension Manifest V3

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式（实时预览侧边栏 UI）
pnpm run dev

# 构建扩展
pnpm run build
```

## 注意事项

- 扩展需要访问 twitter.com 和 x.com 的权限
- 所有数据存储在本地，不会上传到任何服务器
- 导出的 Markdown 文件可能较大（因为图片转 base64）

## 许可证

MIT
