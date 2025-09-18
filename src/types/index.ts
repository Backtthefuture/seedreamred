export interface SplitResult {
  type: 'cover' | 'content';
  text: string;
  index: number;
  charCount: number;
}

export interface Template {
  id: string;
  name: string;
  coverPrompt: string;
  contentPrompt: string;
  isPreset: boolean;
}

export interface GeneratedImage {
  id: string;
  url: string;
  type: 'cover' | 'content';
  index: number;
  status: 'pending' | 'generating' | 'success' | 'error';
  error?: string;
  prompt?: string; // 保存生成时的提示词，用于重新生成
  templateId?: string; // 保存生成时使用的模板ID，用于编辑后重新生成
}

export interface AppState {
  inputText: string;
  selectedTemplateId: string | null;
  splitResults: SplitResult[];
  generatedImages: GeneratedImage[];
  isGenerating: boolean;
  apiKey: string | null;
}