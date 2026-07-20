// ============ 消息与对话类型（移动端，去掉桌面端的 IPC 枚举）============

export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
  reasoning?: string; // 深度思考过程
  thinkingDone?: boolean;
  createdAt: number;
  model?: string;
  error?: boolean;
  attachments?: Attachment[];
  btwThreadId?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data?: string; // base64（图片）
  kind?: 'image' | 'document';
  extractedText?: string;
  extractError?: string;
  extracting?: boolean;
  truncated?: boolean;
  pages?: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  modelId: string;
  providerId: string;
  pinned?: boolean;
  btwConversations: BtwConversation[];
}

export interface BtwConversation {
  id: string;
  anchorMessageId: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  closed: boolean;
}

// ============ 提供商与模型 ============

export type ProviderKind =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'openai-compatible'
  | 'custom';

export interface ModelConfig {
  id: string;
  name: string;
  contextWindow?: number;
  supportsThinking?: boolean;
  supportsVision?: boolean;
  supportsWebSearch?: boolean;
  inputPricePerM?: number;
  outputPricePerM?: number;
}

export interface Provider {
  id: string;
  kind: ProviderKind;
  name: string;
  apiKey: string;
  baseURL?: string;
  enabled: boolean;
  models: ModelConfig[];
  builtIn?: boolean;
}

// ============ 设置 ============

export type ThemeName = 'aurora' | 'sunset' | 'ocean' | 'midnight' | 'forest' | 'rose';
export type ThemeMode = 'light' | 'dark' | 'auto';

export interface Settings {
  theme: ThemeName;
  themeMode: ThemeMode;
  language: 'auto' | 'zh' | 'en';
  fontScale: number;
  activeProviderId: string;
  activeModelId: string;
  webSearchEnabled: boolean;
  sendOnEnter: boolean;
  streamResponses: boolean;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

// 嗅探结果
export interface SniffedModel {
  id: string;
  name: string;
  supportsThinking?: boolean;
  supportsVision?: boolean;
}
