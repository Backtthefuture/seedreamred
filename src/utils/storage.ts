import { STORAGE_KEYS, DEFAULT_IMAGE_SIZE, AI_MODEL, DEFAULT_SPLIT_PROMPT } from './constants';
import type { Template } from '../types';
import type { RecentProject } from '../stores/useAppStore';

export const storage = {
  getApiKey(): string | null {
    return localStorage.getItem(STORAGE_KEYS.API_KEY);
  },

  setApiKey(key: string): void {
    localStorage.setItem(STORAGE_KEYS.API_KEY, key);
  },

  removeApiKey(): void {
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
  },

  getImageSize(): string {
    return localStorage.getItem(STORAGE_KEYS.IMAGE_SIZE) || DEFAULT_IMAGE_SIZE;
  },

  setImageSize(size: string): void {
    localStorage.setItem(STORAGE_KEYS.IMAGE_SIZE, size);
  },

  getWatermarkEnabled(): boolean {
    const value = localStorage.getItem(STORAGE_KEYS.WATERMARK_ENABLED);
    return value !== 'false'; // 默认为true
  },

  setWatermarkEnabled(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEYS.WATERMARK_ENABLED, String(enabled));
  },

  getCustomTemplates(): Template[] {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_TEMPLATES);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  setCustomTemplates(templates: Template[]): void {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TEMPLATES, JSON.stringify(templates));
  },

  addCustomTemplate(template: Template): void {
    const templates = this.getCustomTemplates();
    templates.push(template);
    this.setCustomTemplates(templates);
  },

  removeCustomTemplate(id: string): void {
    const templates = this.getCustomTemplates();
    const filtered = templates.filter(t => t.id !== id);
    this.setCustomTemplates(filtered);
  },

  updateCustomTemplate(id: string, template: Template): void {
    const templates = this.getCustomTemplates();
    const index = templates.findIndex(t => t.id === id);
    if (index !== -1) {
      templates[index] = template;
      this.setCustomTemplates(templates);
    }
  },

  getRecentProjects(): RecentProject[] {
    const data = localStorage.getItem(STORAGE_KEYS.RECENT_PROJECTS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  setRecentProjects(projects: RecentProject[]): void {
    // 最多保存10个历史记录
    const limitedProjects = projects.slice(0, 10);
    localStorage.setItem(STORAGE_KEYS.RECENT_PROJECTS, JSON.stringify(limitedProjects));
  },

  addRecentProject(project: RecentProject): void {
    const projects = this.getRecentProjects();
    // 移除相同ID的旧项目
    const filtered = projects.filter(p => p.id !== project.id);
    // 添加到开头
    filtered.unshift(project);
    this.setRecentProjects(filtered);
  },

  getRecentProjectById(id: string): RecentProject | null {
    const projects = this.getRecentProjects();
    return projects.find(p => p.id === id) || null;
  },

  clearRecentProjects(): void {
    localStorage.removeItem(STORAGE_KEYS.RECENT_PROJECTS);
  },

  // AI模型相关存储方法
  getSelectedAIModel(): string {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_AI_MODEL) || AI_MODEL;
  },

  setSelectedAIModel(modelId: string): void {
    localStorage.setItem(STORAGE_KEYS.SELECTED_AI_MODEL, modelId);
  },

  // 自定义提示词相关存储方法
  getCustomPrompt(): string {
    return localStorage.getItem(STORAGE_KEYS.CUSTOM_PROMPT) || DEFAULT_SPLIT_PROMPT;
  },

  setCustomPrompt(prompt: string): void {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PROMPT, prompt);
  },

  getUseCustomPrompt(): boolean {
    const value = localStorage.getItem(STORAGE_KEYS.USE_CUSTOM_PROMPT);
    return value === 'true';
  },

  setUseCustomPrompt(use: boolean): void {
    localStorage.setItem(STORAGE_KEYS.USE_CUSTOM_PROMPT, String(use));
  },

  // 模板选择相关存储方法
  getSelectedTemplateId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_TEMPLATE_ID);
  },

  setSelectedTemplateId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.SELECTED_TEMPLATE_ID, id);
  },
};