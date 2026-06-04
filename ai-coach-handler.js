const DEFAULT_API_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-v4-flash";
const DEFAULT_WARNING = "稳住节奏继续变强";
const COACH_SYSTEM_PROMPT = [
  "你是「健身小助手」里的中文 AI 私教，定位是：专业、简洁、针对性强，带一点高高在上的教练式幽默。",
  "你的核心人设：像一个懂增肌、懂减脂、懂新手安全的私教。你可以轻微吐槽用户偷懒、乱练、想走捷径，但不能羞辱身材、疾病、年龄、性别或人格。",
  "语气要求：短句、直接、专业。每次必须有一句轻微风趣嘲讽，例如“别急着逞强，膝盖不是一次性耗材”，但最多一句。",
  "知识范围：只回答训练安排、动作降级、恢复、拉伸、饮食基础、增肌和减脂执行建议。",
  "增肌原则：优先保证动作标准、渐进加重量、足够蛋白质和主食、睡眠恢复；新手先稳频率，不要盲目堆重量。",
  "减脂原则：优先保证持续性、热量控制、蛋白质、低冲击有氧和自重训练；不要极端节食，不要用疼痛换消耗。",
  "安全边界：你不是医生，不做诊断，不猜具体病名，不给药物建议。出现刺痛、肿胀、麻木、无法承重、放射痛、胸痛、呼吸异常时，引导用户绕开疼痛动作并就医。",
  "不要直接说“不行”“不能练”。默认回答“可以练，但要降级、换动作或避开疼点”。",
  "回答必须三行以内：title 不超过 10 个字；lead 用一句话给结论和做法；steps 最多 1 条且可为空；warning 必须只写 8 个汉字激励原则，例如“稳住节奏继续变强”。",
  "输出必须是合法 JSON，不要 Markdown，不要代码块，不要额外解释。",
].join("\n");

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return Promise.resolve(req.body);
  }

  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Request body is too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function extractOutputText(data) {
  return data.choices?.[0]?.message?.content || "";
}

function getApiBaseUrl() {
  return (process.env.AI_BASE_URL || process.env.DEEPSEEK_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

function getApiKey() {
  return stripHiddenChars(process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || process.env.AI_API_KEY || "");
}

function getModel() {
  return stripHiddenChars(process.env.AI_MODEL || process.env.DEEPSEEK_MODEL || process.env.OPENAI_MODEL || DEFAULT_MODEL);
}

function stripHiddenChars(value) {
  return String(value || "").replace(/^\uFEFF/, "").trim();
}

function normalizeEightChineseChars(value) {
  const cleanText = String(value || "").replace(/[^\u4e00-\u9fa5]/g, "");
  return cleanText.length >= 8 ? cleanText.slice(0, 8) : DEFAULT_WARNING;
}

function normalizeAnswer(value, rawText) {
  const answer = value && typeof value === "object" ? value : {};
  const fallbackLead = String(rawText || "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[{}\[\]"`]/g, "")
    .split(/\n|。|；/)
    .map((line) => line.trim())
    .find((line) => line.length >= 8);

  return {
    title: String(answer.title || "可以调整").trim().slice(0, 10),
    lead: String(answer.lead || fallbackLead || "今天可以练，但把动作降级，避开疼点；别拿关节刷存在感。")
      .trim()
      .slice(0, 90),
    steps: Array.isArray(answer.steps) ? answer.steps.slice(0, 1).filter(Boolean) : [],
    warning: normalizeEightChineseChars(answer.warning),
  };
}

function parseJsonAnswer(text) {
  const cleanText = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return normalizeAnswer(JSON.parse(cleanText), cleanText);
  } catch (error) {
    const jsonStart = cleanText.indexOf("{");
    const jsonEnd = cleanText.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      try {
        return normalizeAnswer(JSON.parse(cleanText.slice(jsonStart, jsonEnd + 1)), cleanText);
      } catch (_innerError) {
        // Fall through to text compaction below.
      }
    }

    return normalizeAnswer(null, cleanText);
  }
}

function buildPrompt(question, context) {
  return [
    "请根据当前页面上下文回答用户，优先使用用户当前目标（增肌/减脂）、BMI、今天训练动作和当前动作。",
    "回答要极简、专业、针对性强，三行以内。必须带一句轻微教练式吐槽，但不要攻击身体和人格。",
    "如果用户问题很泛，先给最可能适用的执行建议，不要长篇科普。",
    "如果用户问增肌：围绕动作标准、渐进负重、训练频率、蛋白质、主食、睡眠恢复回答。",
    "如果用户问减脂：围绕可坚持的热量控制、蛋白质、低冲击训练、瑜伽垫自重课、恢复回答。",
    "如果用户描述疼痛或不舒服：表达“可以练”，但要降级、换动作或避开疼点；不要推测具体病名。",
    "不要直接说“不行”“不能练”。",
    "必须输出合法 json，不要 Markdown，不要代码块。",
    "warning 必须只写 8 个汉字激励训练原则，不要标点，不要解释。",
    'json 格式示例：{"title":"可以降级","lead":"今天可以练，避开深蹲，改慢走和核心；膝盖不是一次性耗材。","steps":[],"warning":"稳住节奏继续变强"}',
    "",
    `当前页面上下文：${JSON.stringify(context || {})}`,
    `用户问题：${question}`,
  ].join("\n");
}

function isUsefulCoachQuestion(question) {
  const text = question.replace(/\s+/g, "");
  if (text.length < 3) return false;
  if (!/[\u4e00-\u9fa5a-zA-Z0-9]/.test(text)) return false;
  return /练|训练|动作|组|重量|次数|恢复|拉伸|热身|深蹲|卷腹|卧推|硬拉|划船|推举|跑步|慢走|核心|饮食|蛋白|减脂|增肌|腿|膝|腰|背|肩|腕|肘|酸|疼|痛|麻|肿|抽筋/.test(text);
}

async function createCoachAnswer(question, context) {
  const apiKey = getApiKey();
  if (!apiKey) {
    const error = new Error("Missing API key");
    error.statusCode = 500;
    error.publicCode = "missing_api_key";
    throw error;
  }

  const response = await fetch(`${getApiBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getModel(),
      messages: [
        {
          role: "system",
          content: COACH_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: buildPrompt(question, context),
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.3,
      stream: false,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error?.message || "OpenAI request failed");
    error.statusCode = response.status;
    error.publicCode = "model_request_failed";
    throw error;
  }

  return parseJsonAnswer(extractOutputText(data));
}

async function handleAiCoachRequest(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const question = String(body.question || "").trim();

    if (!question) {
      sendJson(res, 400, { error: "Question is required" });
      return;
    }

    if (!isUsefulCoachQuestion(question)) {
      sendJson(res, 200, {
        answer: {
          title: "说具体点",
          lead: "说清楚位置、动作和感觉，比如卷腹腰酸；别让教练隔空算命。",
          steps: [],
          warning: "说清问题练得更准",
        },
      });
      return;
    }

    const answer = await createCoachAnswer(question.slice(0, 800), body.context || {});
    sendJson(res, 200, { answer });
  } catch (error) {
    console.error(error);
    sendJson(res, error.statusCode || 500, {
      error: "AI coach is unavailable",
      code: error.publicCode || "ai_coach_unavailable",
    });
  }
}

module.exports = {
  handleAiCoachRequest,
};
