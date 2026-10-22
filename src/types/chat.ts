export interface AttachedImage {
  data: string; // base64 string or data url
  mimeType: string;
  name?: string;
}

export interface WebChunk {
  uri: string;
  title: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  images?: AttachedImage[];
  webChunks?: WebChunk[];
  searchQueries?: string[];
  status?: 'sending' | 'streaming' | 'complete' | 'error';
  error?: string;
}

export interface StarterPrompt {
  title: string;
  prompt: string;
  category: string;
}

export interface Persona {
  id: string;
  name: string;
  roleTitle: string;
  description: string;
  systemInstruction: string;
  iconName: string;
  accentColor: string;
  starterPrompts: StarterPrompt[];
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  personaId: string;
  systemInstruction?: string;
  enableSearch: boolean;
  temperature: number;
  model: string;
  messages: Message[];
}
