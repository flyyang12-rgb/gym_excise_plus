const DEFAULT_API_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-v4-flash";
const DEFAULT_WARNING = "稳住节奏继续变强";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const COACH_SYSTEM_PROMPT = [
  "你是「健身小助手」里的中文 AI 私教，定位是：专业、温柔、清晰、针对性强。",
  "你的核心人设：像一位懂增肌、减脂、新手安全和动作降级的专业教练。你会先稳定用户情绪，再给可执行建议。",
  "语气要求：短句、温和、可靠，有耐心但不啰嗦。可以轻轻提醒风险，但不要嘲讽、羞辱、打压或制造焦虑。",
  "知识范围：只回答训练安排、动作降级、恢复、拉伸、饮食基础、增肌和减脂执行建议。",
  "安全边界：你不是医生，不做诊断，不猜具体病名，不给药物建议。出现刺痛、肿胀、麻木、无法承重、放射痛、胸痛、呼吸异常时，引导用户绕开疼痛动作并就医。",
  "不要直接说“不行”“不能练”。默认回答“可以练，但要降级、换动作或避开疼点”，让用户感觉被支持。",
  "回答必须三行以内：title 不超过 10 个字；lead 用一句话给结论和做法；steps 最多 1 条且可为空；warning 必须只写 8 个汉字激励原则，例如“稳住节奏继续变强”。",
  "输出必须是合法 JSON，不要 Markdown，不要代码块，不要额外解释。",
].join("\n");

function stripHiddenChars(value) {
  return String(value || "").replace(/^\uFEFF/, "").trim();
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
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
    lead: String(answer.lead || fallbackLead || "今天可以练，但先把动作降级，避开疼点，慢慢找回稳定发力。")
      .trim()
      .slice(0, 90),
    steps: Array.isArray(answer.steps) ? answer.steps.slice(0, 1).filter(Boolean) : [],
    warning: normalizeEightChineseChars(answer.warning),
  };
}

function parseJsonAnswer(text) {
  const cleanText = String(text || "")
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
    "请根据当前页面上下文回答用户，优先使用用户当前目标、BMI、今天训练动作和当前动作。",
    "回答要极简、专业、温柔、针对性强，三行以内。先给结论，再给可执行调整。",
    "如果用户描述疼痛或不舒服：表达“可以练”，但要降级、换动作或避开疼点；不要推测具体病名。",
    "必须输出合法 json，不要 Markdown，不要代码块。",
    "warning 必须只写 8 个汉字激励训练原则，不要标点，不要解释。",
    'json 格式示例：{"title":"可以降级","lead":"今天可以练，先避开深蹲，改慢走和核心稳定，让膝盖轻松一点。","steps":[],"warning":"稳住节奏继续变强"}',
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

function getApiConfig(env) {
  const baseUrl = stripHiddenChars(env.AI_BASE_URL || env.DEEPSEEK_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
  return {
    chatCompletionsUrl: baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`,
    apiKey: stripHiddenChars(env.DEEPSEEK_API_KEY || env.OPENAI_API_KEY || env.AI_API_KEY || ""),
    model: stripHiddenChars(env.AI_MODEL || env.DEEPSEEK_MODEL || env.OPENAI_MODEL || DEFAULT_MODEL),
  };
}

export function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const question = String(body.question || "").trim();

    if (!question) {
      return jsonResponse({ error: "Question is required" }, 400);
    }

    if (!isUsefulCoachQuestion(question)) {
      return jsonResponse({
        answer: {
          title: "说具体点",
          lead: "说清楚位置、动作和感觉，比如卷腹腰酸，我才能给你更准确的调整。",
          steps: [],
          warning: "说清问题练得更准",
        },
      });
    }

    const { chatCompletionsUrl, apiKey, model } = getApiConfig(env || {});
    if (!apiKey) {
      return jsonResponse({ error: "AI coach is unavailable", code: "missing_api_key" }, 500);
    }

    const response = await fetch(chatCompletionsUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: COACH_SYSTEM_PROMPT },
          { role: "user", content: buildPrompt(question.slice(0, 800), body.context || {}) },
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
        temperature: 0.3,
        stream: false,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return jsonResponse({ error: "AI coach is unavailable", code: "model_request_failed" }, response.status);
    }

    return jsonResponse({ answer: parseJsonAnswer(data.choices?.[0]?.message?.content || "") });
  } catch (error) {
    return jsonResponse({ error: "AI coach is unavailable", code: "ai_coach_unavailable" }, 500);
  }
}
