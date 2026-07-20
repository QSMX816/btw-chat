// 轻量 token 估算：不依赖具体模型的分词器，用启发式给个接近的数。
export function estimateTokens(text: string): number {
  if (!text) return 0;
  let cjk = 0;
  let ascii = 0;
  let other = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (
      (c >= 0x3400 && c <= 0x9fff) ||
      (c >= 0xf900 && c <= 0xfaff) ||
      (c >= 0x3040 && c <= 0x30ff) ||
      (c >= 0xac00 && c <= 0xd7af)
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

export function estimateConversationTokens(
  messages: { content: string; reasoning?: string }[],
  systemPrompt = ''
): number {
  let total = estimateTokens(systemPrompt);
  for (const m of messages) {
    total += estimateTokens(m.content);
    if (m.reasoning) total += estimateTokens(m.reasoning);
    total += 4;
  }
  return total;
}

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
