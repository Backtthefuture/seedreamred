import type { Template, SplitResult } from '../types';

export class PromptBuilder {
  /**
   * 构建图片生成提示词
   */
  static buildPrompt(template: Template, splitResult: SplitResult): string {
    const prompt = splitResult.type === 'cover' 
      ? template.coverPrompt 
      : template.contentPrompt;
    
    // 替换{content}占位符
    return prompt.replace('{content}', splitResult.text);
  }

  /**
   * 批量构建提示词
   */
  static buildPrompts(
    template: Template, 
    splitResults: SplitResult[]
  ): Array<{ id: string; prompt: string; type: 'cover' | 'content'; index: number }> {
    return splitResults.map((result) => ({
      id: `img_${result.type}_${result.index}_${Date.now()}`,
      prompt: this.buildPrompt(template, result),
      type: result.type,
      index: result.index,
    }));
  }

  /**
   * 优化提示词（可选的增强功能）
   */
  static optimizePrompt(prompt: string): string {
    // 可以在这里添加提示词优化逻辑
    // 例如：添加默认的质量要求、风格描述等
    const qualityEnhancers = [
      '高清画质',
      '专业摄影',
      '色彩鲜艳',
      '构图精美',
    ];
    
    // 如果提示词没有包含质量相关的词汇，自动添加
    const hasQualityKeywords = qualityEnhancers.some(keyword => 
      prompt.includes(keyword)
    );
    
    if (!hasQualityKeywords) {
      return `${prompt}，高清画质，专业摄影`;
    }
    
    return prompt;
  }

  /**
   * 验证提示词
   */
  static validatePrompt(prompt: string): boolean {
    // 检查提示词是否有效
    if (!prompt || prompt.trim().length === 0) {
      return false;
    }
    
    // 检查是否还有未替换的占位符
    if (prompt.includes('{content}')) {
      return false;
    }
    
    // 检查长度（假设API有长度限制）
    if (prompt.length > 1000) {
      return false;
    }
    
    return true;
  }
}