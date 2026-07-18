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
