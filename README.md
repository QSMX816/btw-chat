# BTW Chat

一个带有 **「顺便问一下 / BTW」分支对话** 的 AI 聊天桌面应用（Windows / macOS / Linux）。

主流聊天软件都把追问塞回主对话，主线被越带越偏。BTW Chat 让你在**任意一条 AI 回答**上就地开一个侧边追问分支：左边主聊天、右边 BTW，互不污染；用完关掉，原回答处会留下一个 tag，随时点开回看。

> 界面模仿 Apple 美学：动态渐变背景 + 毛玻璃 / 液态玻璃材质，6 套主题，深浅模式可切换。

---

## ✨ 功能一览

### 核心：BTW 分支对话
- 每条 AI 回答下方都有「**顺便问一下**」入口
- 点击后聊天区分两栏：**左主聊天 / 右 BTW**
- BTW 自动带上主线上下文，但回答只留在侧栏
- 关闭 BTW 后，原回答处显示一个 **查看 tag**（带消息数），点击即重新展开
- 一个主对话可以挂多个 BTW 分支

### 模型与 API
- 内置 **OpenAI · Anthropic · Google Gemini · DeepSeek · 智谱 GLM · Moonshot Kimi**
- 支持任意 **OpenAI 兼容**接口（本地 Ollama / vLLM / 自建服务），可自定义 Base URL
- 可在设置里**添加任意自定义提供商**
- API Key 仅存本地（`electron-store`），不上传
- 模型切换下拉，带「思考 / 视觉 / 联网」能力标签

### 聊天体验
- **流式输出**，逐字显示
- **深度思考过程**：o 系列 / DeepSeek-R1 / Claude / GLM / Gemini 2.5 的推理过程单独折叠展示，带「正在思考…」动画
- **联网搜索**：开关开启后自动用 DuckDuckGo 检索并注入上下文（无需 Key）
- 漂亮的 **Markdown**：表格、引用、链接，代码块带**语言标签 + 一键复制**
- 图片附件（视觉模型）

### 对话管理
- 历史对话侧栏（本地持久化，最近 500 条）
- 新建 / 删除（二次确认）/ 重命名 / **置顶**
- 搜索对话
- 重新生成最后一条

### 界面
- 6 套主题：极光 / 日落 / 海洋 / 午夜 / 森林 / 玫瑰
- 浅色 / 深色 / 跟随系统
- 毛玻璃强度滑块、字号缩放
- 自定义无边框标题栏 + 红绿灯按钮（Windows 上也用）

---

## 🛠 技术栈

Electron 32 · React 18 · TypeScript · Vite · Zustand · react-markdown + highlight.js

```
btw-chat/
├── electron/                # 主进程
│   ├── main.ts              # 入口
│   ├── preload.ts           # 上下文桥（安全 IPC）
│   ├── ipc/                 # 配置 / 对话 / 流式 / 搜索 / 窗口
│   └── providers/           # OpenAI / Anthropic / Gemini 流式实现（纯 fetch）
├── src/                     # 渲染进程
│   ├── components/          # TitleBar / Sidebar / ChatPanel / BtwPanel / Composer / MessageBubble / SettingsModal / Markdown / Icons
│   ├── stores/              # config + conversations (zustand)
│   ├── services/chat.ts     # IPC 流封装
│   ├── hooks/useTheme.ts
│   ├── styles/              # global.css + themes.css
│   └── types/
└── package.json
```

所有 AI 请求都走**主进程** fetch（绕过浏览器 CORS），渲染进程只通过安全 IPC 收发数据（`contextIsolation: true`，无 Node 集成）。

---

## 🚀 开发与构建

### 1. 安装依赖
```bash
npm install
```

### 2. 开发模式（热重载）
```bash
npm run dev
```
Vite 在 5173，Electron 连上本地 dev server，DevTools 自动打开。

### 3. 打包 Windows 可执行程序

**在 Windows 上**（最简单）：
```bash
npm run dist
```
产出在 `release/` 目录：
- `BTW Chat-1.0-x64.exe` —— NSIS 安装程序
- `BTW Chat-1.0-x64.exe` (portable) —— 免安装便携版

**跨平台打包**：在任意系统用 `--win` 参数即可产出 Windows 包；首次会下载 Windows 版 Electron 运行时。Linux/macOS 上打 NSIS 需要 Wine。

只生成解压目录（不打包安装程序，最快验证）：
```bash
npm run build
npx electron-builder --win --dir
```

### 4. 首次使用
1. 打开应用 → 标题栏齿轮 **设置** → **模型与 API**
2. 填入任一提供商的 API Key（如 OpenAI 的 `sk-...`）
3. 回到主界面顶栏切换模型，开始对话
4. 收到回答后，点回答下方的 **「顺便问一下 (BTW)」** 体验分支对话

---

## 🔌 自定义 / 本地模型

设置 → 模型与 API → **添加自定义**：
- 填名称、API Key、Base URL（如 `http://localhost:11434/v1` 接 Ollama）
- 选协议类型（OpenAI 兼容 / Anthropic / Gemini）
- 添加模型 ID

---

## 📄 说明

- 仅做学习/个人用途；请遵守各模型提供商的使用条款。
- API Key 与对话记录均保存在本地用户数据目录（`electron-store`）。
