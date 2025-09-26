import { create } from 'zustand';
import type { Template } from '../types';
import { PRESET_TEMPLATES } from '../utils/constants';
import { storage } from '../utils/storage';

interface TemplateStore {
  templates: Template[];
  isTemplateModalOpen: boolean;
  editingTemplate: Template | null;

  // Actions
  loadTemplates: () => void;
  addTemplate: (template: Omit<Template, 'id' | 'isPreset'>) => void;
  updateTemplate: (id: string, template: Template) => void;
  deleteTemplate: (id: string) => void;
  setTemplateModalOpen: (open: boolean) => void;
  setEditingTemplate: (template: Template | null) => void;
  getTemplateById: (id: string) => Template | undefined;
}

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  templates: [],
  isTemplateModalOpen: false,
  editingTemplate: null,

  loadTemplates: () => {
    const customTemplates = storage.getCustomTemplates();
    set({ templates: [...PRESET_TEMPLATES, ...customTemplates] });
  },

  addTemplate: (template) => {
    const newTemplate = { ...template, id: `custom_${Date.now()}`, isPreset: false };
    storage.addCustomTemplate(newTemplate);
    set((state) => ({
      templates: [...state.templates, newTemplate],
    }));
  },

  updateTemplate: (id, template) => {
    storage.updateCustomTemplate(id, template);
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === id ? { ...template, isPreset: false } : t
      ),
    }));
  },

  deleteTemplate: (id) => {
    storage.removeCustomTemplate(id);
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
    }));
  },

  setTemplateModalOpen: (open) => set({ isTemplateModalOpen: open }),

  setEditingTemplate: (template) => set({ editingTemplate: template }),

  getTemplateById: (id) => {
    const state = get();
    return state.templates.find((t) => t.id === id);
  },
}));