# 健身小助手（gym_excise）

面向晚间训练新手的中文健身小助手。页面可以根据个人信息生成增肌或减脂计划，记录训练完成情况和训练小记，并通过后端代理接入 DeepSeek 等兼容 OpenAI Chat Completions 的模型。

在线地址：<https://flyyang12-rgb.github.io/gym_excise_plus/>

## 主要功能

- 根据身高、体重和上下班时间给出晚间训练建议
- 支持增肌、减脂两套训练内容
- 自动生成每周 3、4 或 5 练计划
- 展示动作组次、休息时间、器械说明和动作教程
- 按日期记录动作完成状态
- 在浏览器本地保存训练心得小记
- AI 私教结合当前目标、BMI、当日训练和当前动作回答问题
- AI 不可用时自动使用本地兜底建议

## 本地运行

只查看静态页面时，可以直接打开 `index.html`，也可以使用任意静态文件服务器。静态模式下页面主体功能正常，但真实 AI 问答需要可访问的后端接口。

测试完整的本地服务和 AI 接口需要 Node.js 20 或更高版本：

```bash
npm start
```

然后打开 <http://localhost:5500/>。可以在项目根目录创建 `.env`：

```dotenv
DEEPSEEK_API_KEY=你的_DeepSeek_Key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
PORT=5500
```

接口也兼容 `OPENAI_API_KEY`、`AI_API_KEY`、`AI_BASE_URL`、`AI_MODEL` 和 `OPENAI_MODEL`。`DEEPSEEK_BASE_URL`/`AI_BASE_URL` 既可以填写 API 根地址，也可以直接填写以 `/chat/completions` 结尾的完整地址。

## AI 接口与部署

GitHub Pages 只能托管静态文件，不能安全保存模型 API Key。前端在 localhost、`127.0.0.1` 和 GitHub Pages 环境下会请求已部署的 Vercel AI 接口；部署到其他平台时会请求同域 `/api/ai-coach`。

项目提供两种服务端入口：

- `api/ai-coach.js`：Node Serverless Function，复用 `ai-coach-handler.js`
- `edge-functions/api/ai-coach.js`：Pages Functions / Edge Runtime 版本

部署 AI 接口时至少配置：

```dotenv
DEEPSEEK_API_KEY=你的_DeepSeek_Key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
```

不要把 API Key 写入 `script.js`、`index.html` 或其他前端资源。

## 数据保存

项目没有账号和数据库，数据仅保存在当前浏览器的 `localStorage`：

- `fitness_helper_progress_v2`：每日动作打卡记录
- `fitness_helper_training_notes_v1`：训练心得小记

身高、体重、目标和训练频率等资料刷新页面后会恢复默认值。

## 项目结构

```text
.
├── api/ai-coach.js              # Node Serverless AI 接口
├── edge-functions/api/ai-coach.js # Pages Functions AI 接口
├── ai-coach-handler.js          # Node AI 请求处理与安全约束
├── server.js                    # 本地静态服务与 AI API
├── index.html                   # 页面结构
├── style.css                    # 页面样式
├── script.js                    # 训练数据、状态、渲染与交互
├── images/                      # 器械与主题图片
├── package.json                 # Node 版本与启动命令
├── AGENTS.md                    # Codex 开发手册
└── CLAUDE.md                    # Claude Code 手册入口
```

## 开发说明

项目没有构建步骤、依赖安装、代码检查器或自动化测试。修改后至少执行：

```bash
node --check script.js
node --check server.js
node --check ai-coach-handler.js
```

修改 `style.css` 或 `script.js` 后，应同步更新 `index.html` 中对应资源的 `?v=` 缓存标识，并在浏览器中检查受影响的桌面端和移动端流程。
