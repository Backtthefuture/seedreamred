import { MIN_TEXT_LENGTH } from './constants';

export const validators = {
  isValidTextLength(text: string): boolean {
    return text.length >= MIN_TEXT_LENGTH;
  },

  isValidApiKey(key: string): boolean {
    return key.length > 0 && key.trim().length > 0;
  },

  isValidTemplateName(name: string): boolean {
    return name.length > 0 && name.length <= 20;
  },

  isValidPrompt(prompt: string): boolean {
    return prompt.length > 0 && prompt.includes('{content}');
  },
};