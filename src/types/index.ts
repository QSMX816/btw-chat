// ============ 消息与对话类型 ============

export type Role = 'user' | 'assistant' | 'system';

export interface ThinkingBlock {
  content: string;
  done: boolean;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  reasoning?: string;          // 深度思考过程
  thinkingDone?: boolean;      // 思考是否完成
  createdAt: number;
  model?: string;
  error?: boolean;
  attachments?: Attachment[];
  // BTW 相关：如果这条消息触发了一个 btw 对话，记录关联 id
  btwThreadId?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // base64
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
  // 关联的 btw 子对话
  btwConversations: BtwConversation[];
}

export interface BtwConversation {
  id: string;
  anchorMessageId: string;   // 主聊天中触发它的消息
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  closed: boolean;           // 是否已关闭（关闭后在主聊天显示 tag）
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

export type ThemeName =
  | 'aurora'
  | 'sunset'
  | 'ocean'
  | 'midnight'
  | 'forest'
  | 'rose';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface Settings {
  theme: ThemeName;
  themeMode: ThemeMode;
  glassIntensity: number;     // 毛玻璃强度 0-100
  fontScale: number;          // 字体缩放
  activeProviderId: string;
  activeModelId: string;
  webSearchEnabled: boolean;
  sendOnEnter: boolean;
  streamResponses: boolean;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

// ============ IPC 通道 ============

export const IPC = {
  // 配置
  GET_PROVIDERS: 'config:get-providers',
  SAVE_PROVIDERS: 'config:save-providers',
  GET_SETTINGS: 'config:get-settings',
  SAVE_SETTINGS: 'config:save-settings',
  // 对话
  GET_CONVERSATIONS: 'conv:get-all',
  SAVE_CONVERSATION: 'conv:save',
  DELETE_CONVERSATION: 'conv:delete',
  GET_CONVERSATION: 'conv:get',
  // 网络请求（通过主进程绕过 CORS）
  CHAT_STREAM: 'net:chat-stream',
  CANCEL_STREAM: 'net:cancel-stream',
  WEB_SEARCH: 'net:web-search',
  SNIFF_MODELS: 'net:sniff-models',
} as const;
