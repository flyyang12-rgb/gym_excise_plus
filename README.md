# 健身小助手 (gym_excise)

晚间训练 · 小白模式 · 可接入真实 AI 的健身小助手

打开网页就能用。未配置 AI 时会使用本地安全兜底建议；配置 DeepSeek API 后，AI 问答会通过后端代理调用真实模型。

## 在线使用

部署后的地址:https://flyyang12-rgb.github.io/gym_excise_plus/

## 本地预览

如果只想看静态页面，直接用浏览器打开 `index.html` 即可。

如果要测试真实 AI 问答：

```bash
npm start
```

然后打开 `http://localhost:5501/`。本地会读取 `.env`：

```bash
DEEPSEEK_API_KEY=你的_DeepSeek_Key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
PORT=5501
```

## 手机不用 VPN 的部署方式

GitHub Pages 只能托管静态页面，不能运行 AI 后端，也不能安全保存 DeepSeek Key。  
如果手机网络访问 AI 超时，建议把整站部署到支持 Pages Functions / 云函数的平台，并使用同域接口 `/api/ai-coach`。

项目已经包含同域函数文件：

```text
edge-functions/api/ai-coach.js
```

部署时添加环境变量：

```bash
DEEPSEEK_API_KEY=你的_DeepSeek_Key
DEEPSEEK_BASE_URL=https://ai-gateway-intl.eo-edgefunctions7.com/v1/chat/completions
DEEPSEEK_MODEL=deepseek-v4-flash
```

部署成功后，页面会自动请求当前域名下的 `/api/ai-coach`，手机不开 VPN 也更容易正常使用。

默认模型使用 `deepseek-v4-flash`。

## 功能

- 按身高 / 体重 / 上下班时间生成晚间训练时段建议
- 3/4/5 练自动排周计划,点哪天练哪天
- 卡片化展示当晚动作、组次、休息时间
- 配套器械图与口语化动作说明
- 训练完成打卡 + 恢复 / 拉伸 / 饮食提醒

## 文件结构

```
.
├── api/ai-coach.js     # Node Serverless AI 接口
├── edge-functions/api/ # Pages Functions AI 接口
├── ai-coach-handler.js # OpenAI 调用与安全提示
├── index.html          # 主页面
├── package.json        # 本地服务脚本
├── server.js           # 本地 API + 静态文件服务
├── style.css           # 样式
├── script.js           # 训练计划与交互逻辑
└── images/             # 器械图
```
