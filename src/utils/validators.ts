import { MIN_TEXT_LENGTH } from './constants';

export const validators = {
  isValidTextLength(text: string): boolean {
    return text.length >= MIN_TEXT_LENGTH;
  },

  isValidApiKey(key: string): boolean {
    if (!key || typeof key !== 'string') {
      return false;
    }
    
    const trimmedKey = key.trim();
    
    // 基本长度检查：API密钥通常至少20字符
    if (trimmedKey.length < 20) {
      return false;
    }
    
    // 检查是否包含非法字符（API密钥通常只包含字母、数字、短横线、下划线）
    const validChars = /^[A-Za-z0-9\-_]+$/;
    if (!validChars.test(trimmedKey)) {
      return false;
    }
    
    // 豆包API密钥格式检查（通常是UUID格式或特定长度的字符串）
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const longKeyPattern = /^[A-Za-z0-9\-_]{32,}$/; // 至少32位的字符串
    
    return uuidPattern.test(trimmedKey) || longKeyPattern.test(trimmedKey);
  },

  isDolphinApiKeyFormat(key: string): boolean {
    if (!key || typeof key !== 'string') {
      return false;
    }
    
    const trimmedKey = key.trim();
    
    // 豆包特定格式检查
    const dolphinPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return dolphinPattern.test(trimmedKey);
  },

  getApiKeyError(key: string): string | null {
    if (!key || typeof key !== 'string') {
      return '请输入API密钥';
    }
    
    const trimmedKey = key.trim();
    
    if (trimmedKey.length === 0) {
      return '请输入API密钥';
    }
    
    if (trimmedKey.length < 20) {
      return 'API密钥长度不足（至少20个字符）';
    }
    
    if (trimmedKey.length > 200) {
      return 'API密钥长度过长（最多200个字符）';
    }
    
    const validChars = /^[A-Za-z0-9\-_]+$/;
    if (!validChars.test(trimmedKey)) {
      return 'API密钥包含无效字符（仅支持字母、数字、短横线、下划线）';
    }
    
    // 检查是否符合常见格式
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const longKeyPattern = /^[A-Za-z0-9\-_]{32,}$/;
    
    if (!uuidPattern.test(trimmedKey) && !longKeyPattern.test(trimmedKey)) {
      return 'API密钥格式不正确（应为UUID格式或至少32位的字符串）';
    }
    
    return null; // 格式正确
  },

  isValidTemplateName(name: string): boolean {
    return name.length > 0 && name.length <= 20;
  },

  isValidPrompt(prompt: string): boolean {
    return prompt.length > 0 && prompt.includes('{content}');
  },
};