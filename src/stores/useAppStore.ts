import { create } from 'zustand';
import type { SplitResult, GeneratedImage } from '../types';
import { storage } from '../utils/storage';
import { DEFAULT_IMAGE_SIZE, AI_MODEL, DEFAULT_SPLIT_PROMPT } from '../utils/constants';
import { doubaoAPI } from '../services/apiClient';
import { PromptBuilder } from '../services/promptBuilder';
import { useTemplateStore } from './useTemplateStore';

export interface RecentProject {
  id: string;
  name: string;
  wordCount: number;
  date: string;
  inputText: string;
  splitResults: SplitResult[];
  thumbnail?: string;
}

interface AppStore {
  // 状态
  inputText: string;
  selectedTemplateId: string;
  splitResults: SplitResult[];
  generatedImages: GeneratedImage[];
  isGenerating: boolean;
  isSplitting: boolean;
  editingIndex: number | null;
  imageSize: string;
  watermarkEnabled: boolean;
  
  // AI模型相关状态
  selectedAIModel: string;
  customPrompt: string;
  useCustomPrompt: boolean;
  
  // 历史记录
  recentProjects: RecentProject[];

  // Actions
  setInputText: (text: string) => void;
  setSelectedTemplateId: (id: string) => void;
  setSplitResults: (results: SplitResult[]) => void;
  setGeneratedImages: (images: GeneratedImage[]) => void;
  setIsGenerating: (generating: boolean) => void;
  setIsSplitting: (splitting: boolean) => void;
  setImageSize: (size: string) => void;
  setWatermarkEnabled: (enabled: boolean) => void;
  updateImageStatus: (id: string, status: GeneratedImage['status'], error?: string) => void;
  updateImageUrl: (id: string, url: string) => void;
  updateSplitResult: (index: number, text: string) => void;
  setEditingIndex: (index: number | null) => void;
  resetGeneration: () => void;
  initializeApp: () => void;
  regenerateSingleImage: (imageId: string) => Promise<void>;
  updateSplitResultAndRegenerate: (type: 'cover' | 'content', index: number, newText: string) => Promise<void>;
  
  // AI模型相关 Actions
  setSelectedAIModel: (modelId: string) => void;
  setCustomPrompt: (prompt: string) => void;
  setUseCustomPrompt: (use: boolean) => void;
  
  // 历史记录 Actions
  addToRecentProjects: (project: Omit<RecentProject, 'id' | 'date'>) => void;
  loadRecentProject: (projectId: string) => void;
  clearRecentProjects: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // 初始状态
  inputText: '',
  selectedTemplateId: '',
  splitResults: [],
  generatedImages: [],
  isGenerating: false,
  isSplitting: false,
  editingIndex: null,
  imageSize: DEFAULT_IMAGE_SIZE,
  watermarkEnabled: true,
  selectedAIModel: AI_MODEL,
  customPrompt: DEFAULT_SPLIT_PROMPT,
  useCustomPrompt: false,
  recentProjects: [],

  // Actions
  setInputText: (text) => set({ inputText: text }),
  
  setSelectedTemplateId: (id) => set({ selectedTemplateId: id }),
  
  setSplitResults: (results) => set({ splitResults: results }),
  
  setGeneratedImages: (images) => set({ generatedImages: images }),
  
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  
  setIsSplitting: (splitting) => set({ isSplitting: splitting }),
  

  setImageSize: (size) => {
    storage.setImageSize(size);
    set({ imageSize: size });
  },

  setWatermarkEnabled: (enabled) => {
    storage.setWatermarkEnabled(enabled);
    set({ watermarkEnabled: enabled });
  },
  
  updateImageStatus: (id, status, error) => set((state) => ({
    generatedImages: state.generatedImages.map(img =>
      img.id === id ? { ...img, status, error } : img
    ),
  })),
  
  updateImageUrl: (id, url) => set((state) => ({
    generatedImages: state.generatedImages.map(img =>
      img.id === id ? { ...img, url, status: 'success' } : img
    ),
  })),
  
  updateSplitResult: (index, text) => set((state) => ({
    splitResults: state.splitResults.map((result, i) =>
      i === index ? { ...result, text, charCount: text.length } : result
    ),
  })),
  
  setEditingIndex: (index) => set({ editingIndex: index }),
  
  // AI模型相关方法
  setSelectedAIModel: (modelId) => {
    storage.setSelectedAIModel(modelId);
    set({ selectedAIModel: modelId });
  },
  
  setCustomPrompt: (prompt) => {
    storage.setCustomPrompt(prompt);
    set({ customPrompt: prompt });
  },
  
  setUseCustomPrompt: (use) => {
    storage.setUseCustomPrompt(use);
    set({ useCustomPrompt: use });
  },
  
  resetGeneration: () => set({
    splitResults: [],
    generatedImages: [],
    isGenerating: false,
    isSplitting: false,
    editingIndex: null,
  }),
  
  initializeApp: () => {
    const imageSize = storage.getImageSize();
    const watermarkEnabled = storage.getWatermarkEnabled();
    const recentProjects = storage.getRecentProjects();
    const selectedAIModel = storage.getSelectedAIModel();
    const customPrompt = storage.getCustomPrompt();
    const useCustomPrompt = storage.getUseCustomPrompt();
    
    set({ 
      imageSize: imageSize,
      watermarkEnabled: watermarkEnabled,
      recentProjects: recentProjects,
      selectedAIModel: selectedAIModel,
      customPrompt: customPrompt,
      useCustomPrompt: useCustomPrompt
    });
  },
  
  // 单张图片重新生成
  regenerateSingleImage: async (imageId: string) => {
    const state = get();
    const image = state.generatedImages.find(img => img.id === imageId);
    
    if (!image || !image.prompt) {
      console.error('Image not found or no prompt available');
      return;
    }
    
    // 更新状态为generating
    set((state) => ({
      generatedImages: state.generatedImages.map(img =>
        img.id === imageId ? { ...img, status: 'generating' as const, error: undefined } : img
      ),
    }));
    
    try {
      // 调用API生成单张图片
      await doubaoAPI.generateImages(
        [{ id: imageId, prompt: image.prompt }],
        (id, status, url, error) => {
          if (status === 'success' && url) {
            // 更新图片URL和状态
            set((state) => ({
              generatedImages: state.generatedImages.map(img =>
                img.id === id ? { ...img, url, status: 'success' as const } : img
              ),
            }));
          } else if (status === 'error') {
            // 更新错误状态
            set((state) => ({
              generatedImages: state.generatedImages.map(img =>
                img.id === id ? { ...img, status: 'error' as const, error } : img
              ),
            }));
          }
        }
      );
    } catch (error: any) {
      // 处理异常
      set((state) => ({
        generatedImages: state.generatedImages.map(img =>
          img.id === imageId ? { ...img, status: 'error' as const, error: error.message } : img
        ),
      }));
    }
  },
  
  // 历史记录 Actions
  addToRecentProjects: (project) => {
    const projectWithMeta: RecentProject = {
      ...project,
      id: `project_${Date.now()}`,
      date: new Date().toISOString(),
    };
    storage.addRecentProject(projectWithMeta);
    set({ recentProjects: storage.getRecentProjects() });
  },
  
  loadRecentProject: (projectId) => {
    const project = storage.getRecentProjectById(projectId);
    if (project) {
      set({
        inputText: project.inputText,
        splitResults: project.splitResults,
      });
    }
  },
  
  clearRecentProjects: () => {
    storage.clearRecentProjects();
    set({ recentProjects: [] });
  },
  
  // 更新文本并重新生成单张图片
  updateSplitResultAndRegenerate: async (type: 'cover' | 'content', index: number, newText: string) => {
    const state = get();
    
    // 1. 更新splitResult
    const updatedSplitResults = state.splitResults.map((result) => {
      if (result.type === type && result.index === index) {
        return { ...result, text: newText, charCount: newText.length };
      }
      return result;
    });
    set({ splitResults: updatedSplitResults });
    
    // 2. 找到对应的图片和模板
    const targetImage = state.generatedImages.find(
      img => img.type === type && img.index === index
    );
    
    if (!targetImage || !targetImage.templateId) {
      console.error('Image not found or no templateId available');
      return;
    }
    
    // 3. 获取模板
    const template = useTemplateStore.getState().getTemplateById(targetImage.templateId);
    if (!template) {
      console.error('Template not found');
      return;
    }
    
    // 4. 生成新的prompt
    const updatedSplitResult = updatedSplitResults.find(
      r => r.type === type && r.index === index
    );
    
    if (!updatedSplitResult) {
      console.error('Updated split result not found');
      return;
    }
    
    const newPrompt = PromptBuilder.buildPrompt(template, updatedSplitResult);
    
    // 5. 更新图片状态为generating并保存新prompt
    set((state) => ({
      generatedImages: state.generatedImages.map(img =>
        img.id === targetImage.id
          ? { ...img, status: 'generating' as const, prompt: newPrompt, error: undefined }
          : img
      ),
    }));
    
    // 6. 调用API重新生成图片
    try {
      await doubaoAPI.generateImages(
        [{ id: targetImage.id, prompt: newPrompt }],
        (id, status, url, error) => {
          if (status === 'success' && url) {
            set((state) => ({
              generatedImages: state.generatedImages.map(img =>
                img.id === id ? { ...img, url, status: 'success' as const } : img
              ),
            }));
          } else if (status === 'error') {
            set((state) => ({
              generatedImages: state.generatedImages.map(img =>
                img.id === id ? { ...img, status: 'error' as const, error } : img
              ),
            }));
          }
        }
      );
    } catch (error: any) {
      set((state) => ({
        generatedImages: state.generatedImages.map(img =>
          img.id === targetImage.id ? { ...img, status: 'error' as const, error: error.message } : img
        ),
      }));
    }
  },
}));