# AGENTS.md

本文件是 Codex、Claude Code 等智能体在本仓库工作的统一开发说明。用户使用、环境变量、API 调试和部署步骤见 [README.md](README.md)；`CLAUDE.md` 只保留指向本文件的入口。

## 项目边界

「健身小助手」是面向晚间训练新手的中文单页网站，前端使用 HTML、CSS 和普通 JavaScript，无需构建。Node / Serverless 后端仅用于代理兼容 OpenAI Chat Completions 的模型请求，没有账号和数据库。

- 新增用户文案使用中文，表达直接、清楚、支持新手，删除矫揉造作的措辞。
- 计划由本地模板生成；AI 结合上下文回答问题，不会自动修改计划。
- 保持静态前端可独立使用，AI 失败时保留本地兜底。
- 不因局部改动引入框架、打包工具、数据库或新依赖；需要改变架构时先明确任务范围。
- 阅读代码确认现状，不把文档中的部署步骤当作已经执行过的配置。修改功能、配置或数据结构后同步更新相应文档。

## 命令与运行环境

要求 Node.js 20+，命令在仓库根目录执行。当前无第三方 npm 依赖、构建步骤或 linter。

```bash
npm start
npm test
```

`npm start` 启动 `server.js`，默认端口 `5500`，支持 `.env` 的 `PORT`；以启动日志为准。`npm test` 调用 Node 内置的 `node --test`。

- `.env.example` 是可提交的空密钥模板，真实 `.env` 及其他 `.env.*` 文件被忽略。不要覆盖用户已有 `.env`，不要读取或输出密钥来验证配置。
- 本地服务启动时加载 `.env`，已有的同名进程环境变量优先；修改配置后重启。
- **localhost 页面默认使用线上 Vercel AI。** 本地 `.env` 只影响本地服务。直接验证本地 API 或临时切换前端 localhost 分支的方法见 README；不要把临时调试路由混入无关提交。
- `file://` 可查看主体页面，但默认关闭动作示范图且无法使用同域 HTTP API。需要媒体和完整交互时用 HTTP 服务。
- `server.js` 直接提供根目录文件，用于开发预览；不要把含 `.env` 的开发目录作为公网生产服务。

## 文件职责与加载顺序

| 文件 | 责任 |
| --- | --- |
| `index.html` | 静态结构、稳定元素 ID、底部导航、弹窗和资源引用 |
| `style.css` | 全部布局、主题、轮播、弹窗与响应式样式 |
| `script.js` | 训练配置、页面状态、渲染、事件、持久化、AI 请求及版本提示 |
| `exercise-guides.js` | 动作名称归一化、教学内容、媒体映射、休息时间和下一动作工具函数 |
| `diet-guide.js` | 按目标返回饮食原则及五个时段的建议 |
| `images/` | 器械和主题图片 |
| `exercise-media/` | 动作 GIF 和定制 WebP 素材 |
| `server.js` | 本地静态服务、`.env` 加载和 `/api/ai-coach` 路由 |
| `ai-coach-handler.js` | Node 提示词、模型请求、响应整理、校验和 CORS |
| `api/ai-coach.js` | 复用 Node handler 的薄适配入口 |
| `edge-functions/api/ai-coach.js` | 使用 Fetch API 的独立 Pages Functions 适配源码 |
| `test/*.test.js` | Node 内置测试，无浏览器自动化测试 |

HTML 按 `exercise-guides.js` → `diet-guide.js` → `script.js` 加载。前两个文件同时暴露浏览器全局 `window.ExerciseGuides` / `window.DietGuide` 和 CommonJS 导出，供页面与测试复用。`script.js` 在末尾直接调用 `init()`，不要未经重构就改成模块脚本或打乱加载顺序。

保留仍被脚本查询的 DOM ID，包括隐藏的资料控件。当前 BMI 编辑入口在“饮食”模块，上下班时间控件隐藏；不能因为看不到就认定节点无用。

## 内容修改入口

优先更新配置对象，不在渲染函数内复制业务内容。

| 内容 | 修改位置 |
| --- | --- |
| 目标标签、训练时长、教练和恢复提示 | `script.js` 的 `goalConfig` |
| 器械卡片和器械图片 | `equipmentLibrary` 与 `images/` |
| 增肌外部教程链接 | `tutorialLinks`，按动作名称匹配 |
| 每周 3 / 4 / 5 练安排 | `planTemplates` / `fatLossPlanTemplates` |
| 动作、组次和训练说明 | `workoutLibrary` / `fatLossWorkouts` |
| 动作教学和示范图 | `exercise-guides.js` 的 `aliases`、`memoryCues`、`guides` |
| 分时段饮食 | `diet-guide.js` 的 `configs` |

`state.goal` 选择两套平行内容：`muscleGain` 使用增肌模板、器械及外部教程；`fatLoss` 使用减脂模板和瑜伽垫训练，没有外部教程链接，但同样支持页面内的动作教学。共享功能必须检查两个目标。

新增或修改动作名称时，核对教学别名、媒体、教程链接、完成记录和测试。动作名称也是持久化键，改名可能使旧记录无法匹配。未匹配教学的动作走文字兜底，不能假定 `guide.media` 总存在。

`EXERCISE_MEDIA_ENABLED` 目前仅在 `localhost`、`127.0.0.1` 和 `flyyang12-rgb.github.io` 开启。新域名不会自动显示示范图。保留媒体署名、`approximate` 近似示范标记及定制素材的元信息；新增第三方素材时记录来源及可使用范围，不把现有域名开关当作素材授权证明。

## 状态、渲染和交互

- `defaultState` 提供身高、体重、上下班时间、目标和频率；`state` 是当前可变状态。
- `activeDayId` 选训练计划，`activeExerciseIndex` 选动作，`activeGuideTab` 选教学标签，`activeModule` 选训练 / 器械 / 饮食页面。
- `rerenderAll()` 调用各渲染函数；多处使用 `innerHTML` 替换节点。替换后必须重新绑定对应交互，不要保留失效的节点引用。用户输入插入 HTML 前通过 `escapeHtml()` 处理。
- 周计划同时支持卡片点击、滑动、箭头与键盘切换；当前选中的卡片、动作内容及进度应保持一致。
- 完成非最后一个动作会启动默认 60 秒休息；`restState.endAt` 保存绝对结束时间，以避免后台标签页计时漂移。每次调整 15 秒，调整后剩余时间限制为 15–180 秒。
- 休息结束或跳过后进入下一动作；最后一个动作不能回绕。切换目标、频率或训练日通过 `resetExerciseStepper()` 清理计时和动作状态。
- “今日完成打卡”会标记当前计划的全部动作；不是只打一个独立的签到标记。
- “看器械 / 看瑜伽垫”跳转对应 `#equipment-<key>` 并高亮，浮动“返回动作”恢复训练位置。
- 动作教学抽屉支持按钮、背景、Escape 和拖动关闭；弹窗维护焦点约束及关闭后的焦点恢复。修改弹窗时同时检查触屏和键盘操作。
- 身高体重通过 BMI 弹窗应用到 `state`。训练小记由 `saveTrainingNote()` 保存并重渲染列表。

## 持久化约定

只持久化以下两个 `localStorage` 数据集：

| 键 | 结构 |
| --- | --- |
| `fitness_helper_progress_v2` | `{ "YYYY-MM-DD": { [workoutId]: { [exerciseName]: boolean } } }` |
| `fitness_helper_training_notes_v1` | `[{ id: string, text: string, createdAt: ISODateString }]` |

- 日期使用 `todayKey()` 的浏览器本地日期。选择周计划卡片不会改变写入日期，也不是补签功能。
- 计划 ID 在 `getPlanByFrequency()` 中由 `${day}-${key}-${index}` 生成。变更计划顺序、名称、动作名或存储键之前考虑旧记录迁移，不能无说明地丢弃数据。
- 小记最多 120 字，保存最新 20 条；渲染只显示最近 5 天内最新 5 条。列表中消失不一定代表已从存储删除。
- 资料、目标、频率、当前动作、计时器和 AI 对话不持久化，刷新恢复默认状态。
- 读取已有损坏 JSON 时有兜底；存储写入目前没有专门错误提示。不要声称已实现云同步、导入导出或自动恢复。
- 验证存储功能时使用隔离浏览器环境，不清空用户日常使用的站点数据。

## AI 与部署约束

环境变量的优先级、请求示例、响应结构、错误码和平台步骤统一维护在 README，修改时同步代码与文档。

- `getAiCoachContext()` 发送目标、身高体重、BMI、频率、选中计划和当前动作等上下文，不发送打卡历史和小记。增加发送字段时同步说明数据用途。
- 前端超时常量 `AI_REQUEST_TIMEOUT_MS` 为 10000。当前计时器在收到响应头后清除，响应体读取和服务端模型请求没有独立超时；不要把它写成端到端 10 秒保证。
- `askAiCoach()` 在接口失败时使用本地建议，界面不展示详细失败原因。验证真实 AI 必须检查请求目标和响应，不能仅以“界面出现回答”判定成功。
- Node 与 Edge 各有提示词、筛选和响应整理实现。修改共同的 AI 行为时同步两端；当前提示词、错误处理并非完全一致，Node 支持 `ALLOWED_ORIGIN`，Edge 固定为 `*`。不要在文档中承诺尚未实现的一致性。
- API 密钥只保留在服务端环境中，不能进入前端、文档、日志输出或提交。CORS 控制不是身份认证；本接口当前没有鉴权和限流。
- `api/ai-coach.js` 是现有 Node 入口；`edge-functions/` 是可选源码目录，不是 Cloudflare 自动识别的 `functions/`。不要宣称当前仓库无需适配就能发布 Cloudflare 函数。
- 不要为无关任务发布新站点或修改平台配置。用户要求提交或推送时，在其授权范围内执行。

## 测试和人工验证

现有 `node:test` 测试覆盖动作别名、素材映射、媒体开关、近似示范标记、兜底内容、休息时间计算、动作索引边界和饮食配置。没有浏览器端到端、真实 AI 或存储集成测试，也没有自动执行这些测试的 CI 工作流。

根据改动执行现有测试和相关语法检查：

```bash
npm test
node --check script.js
node --check exercise-guides.js
node --check diet-guide.js
node --check server.js
node --check ai-coach-handler.js
node --check api/ai-coach.js
```

Edge 文件使用 ES module；PowerShell 语法检查命令：

```powershell
Get-Content -Raw -LiteralPath edge-functions/api/ai-coach.js | node --input-type=module --check
```

涉及页面行为时，选取受影响流程在桌面和移动宽度下验证：

| 范围 | 检查内容 |
| --- | --- |
| 计划 | 增肌 / 减脂 × 3 / 4 / 5 练；卡片、周历、滑动及键盘选择一致 |
| 动作 | 前后切换、教学抽屉、媒体关闭或加载失败、器械跳转与返回 |
| 休息 | 勾选启动、±15 秒、跳过、结束进入下一动作、切换计划清理旧计时 |
| 打卡和小记 | 单项取消、整套完成、刷新后的记录、小记保存及显示限制 |
| 饮食和 BMI | 两个目标的五个时段、轮播、修改身高体重并应用 |
| AI | 上下文与当前动作一致、请求目标正确、成功与失败兜底、请求完成后可继续输入 |
| 弹窗和布局 | Escape、Tab 焦点、关闭后焦点、移动端滚动和底部导航遮挡 |

纯文档修改不需要逐项浏览器回归；命令、配置示例和声明仍需核对。不要为低影响文案改动添加只复述实现的测试，也不要声称未执行的检查已经通过。

## 版本、提交和推送

- `index.html` 引用了带 `?v=` 的 `style.css`、`exercise-guides.js`、`diet-guide.js` 和 `script.js`。修改哪个资源，就更新对应标识；不要假设它们必须相同。
- 发布界面版本时同步 `script.js` 的 `APP_VERSION` 与 HTML 的初始版本文字。GitHub 最新提交信息仅更新版本提示，不会代替资源缓存标识。
- 仅文档、测试命令或示例配置更新不需要修改页面版本。
- 提交前检查工作区和差异，只暂存本次任务文件，保留用户已有修改。核对真实 `.env` 未进入暂存区。
- 有推送授权时，先确认远端和目标分支。当前常用目标为 `origin/main`；新建分支默认使用 `codex/` 前缀。
- 本机常用代理推送命令为 `git -c http.proxy=http://127.0.0.1:7897 push origin main`。代理不可用时检查本机网络，也可以在直连可用时使用普通 `git push`；不要将本机代理写成所有贡献者的必需配置。
- 遇到远端新增提交，先获取并检查再合并或变基，不强制覆盖远端。推送成功只表示提交到达 GitHub，不能据此宣称 Pages / Vercel 发布已完成。
