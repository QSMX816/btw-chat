// 轻量 token 估算：不依赖具体模型的分词器，用启发式给个接近的数。
// 经验值：英文约 4 字符/token，中日韩字符约 1~1.5 token/字。
// 仅用于 UI 实时展示，不是精确计费依据。
export function estimateTokens(text: string): number {
  if (!text) return 0;
  let cjk = 0;
  let ascii = 0;
  let other = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (
      (c >= 0x3400 && c <= 0x9fff) || // CJK 统一汉字 + 扩展A
      (c >= 0xf900 && c <= 0xfaff) || // CJK 兼容
      (c >= 0x3040 && c <= 0x30ff) || // 平假名 + 片假名
      (c >= 0xac00 && c <= 0xd7af)    // 韩文音节
    ) {
      cjk++;
    } else if (c < 128) {
      ascii++;
    } else {
      other++;
    }
  }
  return Math.ceil(cjk * 1.2 + other * 0.6 + ascii / 4);
}

// 整段对话（含思考过程）的 token 估算
export function estimateConversationTokens(
  messages: { content: string; reasoning?: string }[],
  systemPrompt = ''
): number {
  let total = estimateTokens(systemPrompt);
  for (const m of messages) {
    total += estimateTokens(m.content);
    if (m.reasoning) total += estimateTokens(m.reasoning);
    total += 4; // 每条消息的结构开销
  }
  return total;
}

// 按角色拆分 input / output token 估算，用于费用估算：
//  - system + user 视为输入（input）
//  - assistant 的正文 + 思考过程 视为输出（output）
export function estimateInputOutputTokens(
  messages: { role: string; content: string; reasoning?: string }[],
  systemPrompt = ''
): { input: number; output: number } {
  let input = estimateTokens(systemPrompt);
  let output = 0;
  for (const m of messages) {
    if (m.role === 'assistant') {
      output += estimateTokens(m.content);
      if (m.reasoning) output += estimateTokens(m.reasoning);
      output += 4;
    } else {
      input += estimateTokens(m.content);
      input += 4;
    }
  }
  return { input, output };
}

// 估算美元费用：input/output token 数 × 模型单价（USD/1M）
export function estimateCostUsd(
  inputTokens: number,
  outputTokens: number,
  model?: { inputPricePerM?: number; outputPricePerM?: number }
): number {
  if (!model) return 0;
  const inP = model.inputPricePerM ?? 0;
  const outP = model.outputPricePerM ?? 0;
  if (!inP && !outP) return 0;
  return (inputTokens / 1e6) * inP + (outputTokens / 1e6) * outP;
}
