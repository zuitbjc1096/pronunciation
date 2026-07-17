// GLM AI integration module
const GLM_API = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const GLM_KEY = "ad8fbc9e61194d61b2b305bd96c387d0.LhUfNCZ61aipQA4Z";
const GLM_MODEL = "glm-4-flash";

async function callGLM(systemPrompt, userPrompt) {
  try {
    const resp = await fetch(GLM_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GLM_KEY}`,
      },
      body: JSON.stringify({
        model: GLM_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) {
    console.error("GLM API error:", e);
    return null;
  }
}

// Generate similar-sounding words for practice
async function glmSimilarWords(word) {
  const system = `你是一个专业的英语语音老师，专门教小学一年级的中国小朋友学英语发音。
你的回答必须严格按照 JSON 数组格式，不要有任何其他文字。`;

  const prompt = `小朋友在学习单词 "${word}" 的发音时遇到了困难。
请给出3个和 "${word}" 发音相似或含有相同元音/辅音组合的简单英语单词，帮助小朋友通过类比来练习。

要求：
1. 单词必须是小学一年级能理解的简单词
2. 每个词给出中文翻译和一个 emoji
3. 严格返回 JSON 数组格式

返回格式示例：
[{"word":"cat","cn":"猫","emoji":"🐱"},{"word":"hat","cn":"帽子","emoji":"🎩"},{"word":"bat","cn":"蝙蝠","emoji":"🦇"}]`;

  const result = await callGLM(system, prompt);
  if (!result) return null;

  try {
    const match = result.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : null;
  } catch (e) {
    return null;
  }
}

// Generate phonics explanation for a letter combination
async function glmPhonicsHelp(letter, word) {
  const system = `你是一个亲切的英语语音老师，用简短、易懂的中文给6-7岁小朋友解释英语发音。
回答要简短（2-3句），用生动的比喻。`;

  const prompt = `请用简单的中文解释字母 "${letter}" 在单词 "${word}" 里是怎么发音的。
给一个小朋友容易记住的发音技巧或比喻。`;

  return await callGLM(system, prompt);
}
