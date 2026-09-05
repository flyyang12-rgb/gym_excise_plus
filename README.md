# 健身小助手（gym_excise）

面向晚间训练新手的中文健身网站。按增肌或减脂目标提供每周 3、4、5 练的预设计划，支持动作教学、休息计时、打卡、训练小记、饮食指南和 AI 问答。无需注册，没有账号和数据库。

[在线使用](https://flyyang12-rgb.github.io/gym_excise_plus/) · [GitHub 仓库](https://github.com/flyyang12-rgb/gym_excise_plus) · [智能体开发说明](AGENTS.md)

## 怎么使用

1. **选目标和频率。** 在“训练”页选择“增肌”或“减脂”，再选每周 3、4 或 5 练。增肌以健身器械为主，减脂以瑜伽垫和自重训练为主。计划来自内置模板，AI 问答不会自动改写计划。
2. **选训练日。** 点击小日历或本周训练卡片，也可以左右滑动卡片。下方“今晚训练”显示选中计划的动作。
3. **看动作。** 按动作卡查看组次、要点、呼吸和常见错误；有专属教学的动作可以点“看教学”。“看器械 / 看瑜伽垫”会跳到器械说明，点“返回动作”继续训练。部分增肌动作另有外部教程链接。
4. **完成动作并休息。** 勾选“完成”记录当前动作；还有下一个动作时，会开始 60 秒倒计时。可以每次增减 15 秒，调整后的剩余时间限制在 15–180 秒，也可以“跳过休息”。倒计时结束后进入下一动作，最后一个动作不会跳回开头。
5. **打卡和写小记。** “今日完成打卡”会一次性标记当前计划的全部动作；单个动作可取消勾选。在“近 5 天心得”右侧点“+”写小记，每条最多 120 字，页面显示最近 5 天内最新的 5 条。
6. **看饮食和身体数据。** 底部切换到“饮食”，查看早餐、午餐、训练前、训练后和可选加餐建议；向下找到“BMI 身体数据”，填写身高、体重后点“应用到当前页面”。当前上下班时间输入区隐藏，使用内置默认时间。
7. **问 AI。** 在“饮食”页点“AI 问答”。描述具体动作和问题；请求会携带当前目标、身体数据及选中的训练内容。接口不可用时仍会显示本地建议，因此有回答不代表线上模型调用成功。

**打卡按实际操作当天保存。** 选择“周一”的计划表示今天做这套训练，不是给过去或未来的周一补签。切换目标、频率或训练日会重置当前动作和休息计时。

## 本地运行

在项目根目录操作。需要 Node.js 20 或更高版本；当前没有第三方 npm 依赖，无需先执行 `npm install`，也没有构建步骤。

```bash
npm start
```

默认打开 [本地页面](http://localhost:5500/)。如果 `.env` 或终端环境中设置了 `PORT`，以启动日志显示的地址为准。按 `Ctrl+C` 停止服务。

也可以直接打开 `index.html`，但此方式只适合查看页面：动作示范图默认关闭，AI 使用本地兜底。推荐通过本地服务预览。

### 配置本地模型服务

以下 PowerShell 命令仅在 `.env` 不存在时复制示例，避免覆盖已有配置：

```powershell
if (-not (Test-Path -LiteralPath .env)) {
    Copy-Item -LiteralPath .env.example -Destination .env
}
```

编辑 `.env`，填写自己的密钥；示例中的密钥默认为空：

```dotenv
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
PORT=5500
```

模型名是当前代码默认值，实际请填写服务商账户可调用的模型。修改 `.env` 后需要重启本地服务。服务启动时只填充尚未设置的环境变量，终端或系统中已有的同名变量优先。

| 用途 | 支持的名称，按读取优先级从左到右 | 未配置时 |
| --- | --- | --- |
| API 密钥 | `DEEPSEEK_API_KEY` → `OPENAI_API_KEY` → `AI_API_KEY` | 模型请求返回 `missing_api_key` |
| API 地址 | `AI_BASE_URL` → `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` |
| 模型 | `AI_MODEL` → `DEEPSEEK_MODEL` → `OPENAI_MODEL` | `deepseek-v4-flash` |
| 本地端口 | `PORT` | `5500` |
| 允许的网页来源，仅 Node 接口 | `ALLOWED_ORIGIN` | `*` |

同一用途尽量只设置一个变量，避免高优先级别名覆盖预期配置。API 地址可以是根地址或完整的 `/chat/completions` 地址；代码只会追加 `/chat/completions`，不会自动补 `/v1`。需要 `/v1` 的服务应自行写入地址。

`ALLOWED_ORIGIN` 填写一个完整来源，例如 `https://flyyang12-rgb.github.io`，不含仓库路径；它不是逗号分隔的域名列表。当前 Edge 实现固定允许 `*`，不会读取此变量。

### 页面实际请求哪个 AI 接口

前端地址由 `script.js` 的 `AI_COACH_API` 决定，浏览器不会读取 `.env`。

| 页面打开方式 | AI 请求目标 | 动作示范图 |
| --- | --- | --- |
| `localhost` / `127.0.0.1`，任意端口 | `https://gym-excise-plus.vercel.app/api/ai-coach` | 启用 |
| `flyyang12-rgb.github.io` | 同上 | 启用 |
| 其他 HTTP(S) 域名，包括 Vercel 域名 | 同域 `/api/ai-coach` | 默认关闭 |
| 直接打开 HTML，`file://` | 无可用 HTTP API，转为本地建议 | 默认关闭 |

**本地启动了服务，不代表页面会调用本地 AI。** 修改本地密钥不会改变 localhost 页面默认使用的线上服务。

只检查本地接口时，在另一个 PowerShell 窗口执行下面的请求。若端口有修改，请替换地址中的 `5500`：

```powershell
Invoke-RestMethod -Uri 'http://localhost:5500/api/ai-coach' -Method Post -ContentType 'application/json; charset=utf-8' -Body '{"question":"你好"}'
```

预期返回含 `answer` 的对象，标题为“说具体点”。此请求不调用模型、不需要密钥，只验证路由和请求处理。验证真实模型时，将请求体改为 `{"question":"深蹲时如何控制动作速度？","context":{}}`；这会向配置的模型服务发起请求。

需要从页面完整调试本地 AI 时，临时将 `script.js` 中 localhost / `127.0.0.1` 分支改为：

```javascript
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
  return "/api/ai-coach";
}
```

刷新时在开发者工具 Network 面板禁用缓存，确认请求地址是当前本地端口。调试后恢复该临时修改；若要永久改变路由策略，应同步修改本文中的环境表及资源缓存标识。当前没有可直接切换前端 API 地址的环境变量。

## AI 接口约定

入口为 `POST /api/ai-coach`，请求类型为 `application/json`：

```json
{
  "question": "深蹲时如何控制动作速度？",
  "context": {
    "profile": { "goal": "增肌" },
    "todayWorkout": { "currentExercise": "史密斯深蹲" }
  }
}
```

`question` 必填，`context` 可省略。通过问题筛选后，发给模型的问题最多保留 800 个字符。成功响应结构如下，文字仅作示例：

```json
{
  "answer": {
    "title": "动作节奏",
    "lead": "根据当前动作给出一句具体建议。",
    "steps": [],
    "warning": "稳住节奏继续变强"
  }
}
```

服务端将标题限制为 10 个字符、主要回答限制为 90 个字符、`steps` 最多保留 1 条，`warning` 规范为 8 个汉字。前端等待响应头的超时设置是 10 秒；读取响应体和后端模型调用没有单独配置超时。前端失败后显示本地建议，但不显示具体错误码。

| 结果 | 含义和检查方向 |
| --- | --- |
| `200`，标题“说具体点” | 问题未通过训练相关筛选，没有调用模型 |
| `400`，`Question is required` | 缺少问题或问题为空 |
| `405`，`Method not allowed` | Node 接口不接受该方法；浏览器地址栏直接访问是 GET |
| `500`，`missing_api_key` | 处理此次请求的后端没有有效密钥配置 |
| `model_request_failed`，状态码来自上游 | 检查后端日志中的密钥、地址、模型名和上游错误 |
| `ai_coach_unavailable` | 请求解析、网络或其他处理异常，检查后端日志 |

接口还支持 `OPTIONS` 预检。Node 与 Edge 的提示词及部分错误处理存在差异，不应将两者视为完全相同的实现。

## 数据保存与网络请求

| 数据 | 保存方式和限制 |
| --- | --- |
| 动作打卡 | `localStorage` 的 `fitness_helper_progress_v2`，按本地日期、计划 ID 和动作名称保存 |
| 训练小记 | `localStorage` 的 `fitness_helper_training_notes_v1`，最多保留最新 20 条；页面只显示近 5 天内最新 5 条 |
| 身高、体重、目标、频率及上下班时间 | 仅当前页面状态，刷新恢复默认值 |
| 当前动作、休息计时和 AI 对话 | 不做持久化，刷新不会恢复 |

本地记录不跨设备同步。浏览器、协议、域名或端口不同，记录也不共享；清除站点数据会删除记录，无痕窗口中的记录通常在关闭后消失。目前没有导出、导入或云端备份入口。暂时看不到小记时，先检查是否超出页面的时间或数量范围。

“本地保存”指打卡和小记。调用 AI 时，问题及 `getAiCoachContext()` 中的身高、体重、BMI、目标、频率、选中计划和动作信息会发送给后端，再由后端传给模型服务。当前不会发送打卡历史和训练小记。页面还会向 GitHub 请求最新提交信息，用于版本提示；该请求失败不影响训练。

## 部署

当前前端代码指向上面的 GitHub Pages 页面和 Vercel AI 地址。以下是按仓库结构配置平台的步骤，不代表已核验平台控制台中的发布设置。仓库目前没有 CI 工作流，推送不会自动运行本地测试。

### GitHub Pages：静态前端

1. 将代码推送到仓库。
2. 在仓库的 **Settings → Pages → Build and deployment** 中选择 **Deploy from a branch**，发布分支选 `main`，目录选 `/(root)`，保存。已有发布配置时先检查，不必重复更改。
3. 等待 Pages 发布完成，在 Actions / Pages 中确认结果，再打开网页检查资源加载。

此步骤对应 GitHub 官方的[从分支发布说明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。GitHub Pages 不运行本项目的 Node API；AI 由单独的服务端提供。Fork 仓库或使用自定义域名后，需要检查 `AI_COACH_API` 和 `EXERCISE_MEDIA_ENABLED`，原有域名判断不会自动匹配新地址。

### Vercel：Node AI 接口

1. 导入 GitHub 仓库，项目根目录选择仓库根目录。按本项目的静态文件加 `/api` 函数结构，选择 **Other**，覆盖 Build Command 并留空，输出目录用 `.`。这是无需构建的配置方式，见 [Vercel 构建说明](https://vercel.com/docs/builds/configure-a-build)。
2. 在项目环境变量中填写模型密钥、API 地址和模型名，选择需要的 Production / Preview 环境。密钥只放服务端环境配置，见 [Vercel 环境变量说明](https://vercel.com/docs/environment-variables)。
3. 创建部署，确认 `/api/ai-coach` 被识别为函数。仓库入口 `api/ai-coach.js` 复用根目录的 `ai-coach-handler.js`，见 [Node 函数说明](https://vercel.com/docs/functions/runtimes/node-js)。这里不以 `npm start` 启动生产服务。
4. 将本地接口验证示例中的地址替换为部署地址，先验证固定回答，再验证真实模型请求。若前后端分开部署，检查 CORS 允许的来源。
5. 若使用了新的 AI 服务域名，修改前端 `AI_COACH_API` 中对应地址并发布前端。修改 Vercel 环境变量后，需要创建新部署才能生效。

### Cloudflare Pages Functions：可选适配

`edge-functions/api/ai-coach.js` 是适配源码，仓库尚未配置成可直接发布的 Cloudflare Pages Functions 项目。Cloudflare 默认从项目根目录的 `functions/` 识别函数，不会自动识别这里的 `edge-functions/`，见 [Pages Functions 官方说明](https://developers.cloudflare.com/pages/functions/get-started/)。

采用此方案时，在独立部署分支将适配源码复制为 `functions/api/ai-coach.js`，配置静态输出目录及服务端环境变量，再部署并验证 `/api/ai-coach`。更新源码时同步部署副本。普通域名会使用同域 API，但动作示范图仍需检查域名开关。当前 Edge 的 CORS 固定为 `*`，设置 `ALLOWED_ORIGIN` 不会改变它。

`server.js` 用于本地开发预览：它直接读取项目根目录文件，没有生产级的静态资源隔离，不要将包含 `.env` 的开发目录直接公开为生产站点。发布静态资源时只包含前端所需文件；不要上传本地 `.env`。`.env.example` 可以提交，真实密钥不能写入前端资源、文档或 Git 历史。

## 常见问题

| 现象 | 检查方法 |
| --- | --- |
| 本地页面打不开 / `EADDRINUSE` | 检查 Node 版本、启动日志和 `PORT`；端口被占用时换一个端口后重启 |
| 改了本地密钥，网页回答没变化 | localhost 默认请求线上接口，按“页面实际请求哪个 AI 接口”验证目标地址 |
| AI 能回答，但不确定是否联网 | 查看 Network 是否有 POST 请求及其结果；宽泛问题和接口失败都可能返回本地建议 |
| AI 接口返回 HTML 或 404 | 检查域名、函数部署路径；静态站点不会自动执行服务端文件 |
| 部署后动作没有示范图 | 检查 `EXERCISE_MEDIA_ENABLED` 的域名名单、`exercise-media/` 文件路径和大小写；开关关闭时仍提供文字教学 |
| 刷新后资料或计时消失 | 当前没有持久化这些状态，属于现有行为 |
| 打卡或小记不见了 | 检查是否换了浏览器、域名、端口或日期，是否清理了站点数据；小记还受显示范围限制 |
| 保存小记或打卡失败 | 检查浏览器是否禁用站点存储、空间是否不足；当前写入失败没有专门提示，检查 Console |
| 修改样式或脚本后还是旧页面 | 确认发布完成，更新被修改资源的 `?v=`，再禁用缓存刷新 |

## 项目结构

```text
.
├── index.html                    # 页面结构、模块入口与脚本加载顺序
├── style.css                     # 样式、响应式布局和主题
├── script.js                     # 训练模板、页面状态、渲染和交互
├── exercise-guides.js            # 动作教学、别名、媒体映射、计时工具
├── diet-guide.js                 # 增肌 / 减脂分时段饮食内容
├── images/                       # 器械与主题图片
├── exercise-media/               # 动作 GIF 和定制 WebP 示范图
├── server.js                     # 本地静态服务与 AI 路由
├── ai-coach-handler.js            # Node AI 请求处理
├── api/ai-coach.js                # Vercel Node 函数入口
├── edge-functions/api/ai-coach.js # 可选 Pages Functions 适配源码
├── test/                         # Node 内置测试
├── .env.example                  # 无密钥的配置模板
├── package.json                  # 运行和测试命令
├── AGENTS.md                     # 智能体开发约束与验证清单
└── CLAUDE.md                     # 指向 AGENTS.md 的入口
```

## 开发与验证

```bash
npm test
node --check script.js
node --check exercise-guides.js
node --check diet-guide.js
node --check server.js
node --check ai-coach-handler.js
node --check api/ai-coach.js
```

`npm test` 等价于 `node --test`，使用 Node 内置测试运行器。现有测试覆盖饮食配置、动作别名与示范图映射、未匹配动作兜底、媒体开关、近似示范标记、计时计算和动作索引边界；不覆盖浏览器布局、真实 AI、存储读写或部署。

Edge 文件使用 ES module 导出，仓库根目录使用 CommonJS。在 PowerShell 中可按模块语法检查：

```powershell
Get-Content -Raw -LiteralPath edge-functions/api/ai-coach.js | node --input-type=module --check
```

修改界面后，在桌面和手机宽度下检查受影响流程；共享功能需覆盖增肌、减脂及 3 / 4 / 5 练组合。完整检查项目见 [AGENTS.md](AGENTS.md)。

修改 `style.css`、`script.js`、`exercise-guides.js` 或 `diet-guide.js` 后，更新 `index.html` 中对应资源的 `?v=`。各资源版本可以不同。发布新界面版本时同时更新 `script.js` 的 `APP_VERSION` 和 HTML 的初始版本文字；仅文档更新无需修改页面版本。
