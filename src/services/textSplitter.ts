import type { SplitResult } from '../types';
import { 
  MIN_SPLIT_LENGTH, 
  MAX_SPLIT_LENGTH, 
  COVER_MIN_LENGTH, 
  COVER_MAX_LENGTH 
} from '../utils/constants';
import { splitTextWithAI } from './aiService';

export class TextSplitter {
  private text: string;

  constructor(text: string) {
    this.text = text.trim();
  }

  /**
   * 智能拆分文本为封面和内容图片
   */
  public split(): SplitResult[] {
    const results: SplitResult[] = [];
    
    // 1. 提取封面文字
    const coverText = this.extractCoverText();
    results.push({
      type: 'cover',
      text: coverText,
      index: 0,
      charCount: coverText.length,
    });

    // 2. 拆分剩余内容
    const remainingText = this.text;
    const contentParts = this.splitContent(remainingText);
    
    contentParts.forEach((part, index) => {
      results.push({
        type: 'content',
        text: part,
        index: index + 1,
        charCount: part.length,
      });
    });

    return results;
  }

  /**
   * 提取封面文字 - 获取最吸引人的核心观点
   */
  private extractCoverText(): string {
    // 尝试找到第一句话或第一个段落的核心内容
    const sentences = this.text.match(/[^。！？.!?]+[。！？.!?]/g) || [];
    
    if (sentences.length === 0) {
      // 如果没有找到句子，取前50个字符
      return this.text.slice(0, COVER_MAX_LENGTH);
    }

    let coverText = '';
    for (const sentence of sentences) {
      if (coverText.length + sentence.length <= COVER_MAX_LENGTH) {
        coverText += sentence;
      } else if (coverText.length < COVER_MIN_LENGTH) {
        // 如果还没达到最小长度，截取部分句子
        const remaining = COVER_MAX_LENGTH - coverText.length;
        coverText += sentence.slice(0, remaining);
        break;
      } else {
        break;
      }
    }

    // 如果提取的内容太短，补充更多内容
    if (coverText.length < COVER_MIN_LENGTH) {
      coverText = this.text.slice(0, COVER_MAX_LENGTH);
    }

    return this.cleanText(coverText);
  }

  /**
   * 拆分内容为多个部分
   */
  private splitContent(text: string): string[] {
    const parts: string[] = [];
    const paragraphs = this.splitIntoParagraphs(text);
    
    let currentPart = '';
    
    for (const paragraph of paragraphs) {
      // 如果段落本身就超过最大长度，需要进一步拆分
      if (paragraph.length > MAX_SPLIT_LENGTH) {
        // 先保存当前累积的内容
        if (currentPart.length >= MIN_SPLIT_LENGTH) {
          parts.push(this.cleanText(currentPart));
          currentPart = '';
        }
        
        // 拆分长段落
        const subParts = this.splitLongParagraph(paragraph);
        parts.push(...subParts);
      } else if (currentPart.length + paragraph.length <= MAX_SPLIT_LENGTH) {
        // 如果加上当前段落不超过最大长度，累积
        currentPart += (currentPart ? '\n' : '') + paragraph;
      } else {
        // 当前部分已经足够长，保存并开始新的部分
        if (currentPart.length >= MIN_SPLIT_LENGTH) {
          parts.push(this.cleanText(currentPart));
          currentPart = paragraph;
        } else {
          // 当前部分太短，强制加入这个段落
          currentPart += '\n' + paragraph;
          parts.push(this.cleanText(currentPart));
          currentPart = '';
        }
      }
    }

    // 处理最后剩余的内容
    if (currentPart.length > 0) {
      if (currentPart.length < MIN_SPLIT_LENGTH && parts.length > 0) {
        // 如果最后一部分太短，合并到前一部分
        const lastPart = parts.pop()!;
        if (lastPart.length + currentPart.length <= MAX_SPLIT_LENGTH) {
          parts.push(this.cleanText(lastPart + '\n' + currentPart));
        } else {
          parts.push(lastPart);
          parts.push(this.cleanText(currentPart));
        }
      } else {
        parts.push(this.cleanText(currentPart));
      }
    }

    // 确保至少有3张内容图，最多8张
    if (parts.length < 3) {
      // 如果内容太少，尝试进一步拆分
      return this.ensureMinimumParts(parts);
    } else if (parts.length > 8) {
      // 如果内容太多，合并一些较短的部分
      return this.mergeExcessParts(parts);
    }

    return parts;
  }

  /**
   * 将文本拆分为段落
   */
  private splitIntoParagraphs(text: string): string[] {
    // 按换行符分割
    let paragraphs = text.split(/\n\n+/);
    
    // 如果没有明显的段落分割，尝试按句号分割
    if (paragraphs.length === 1) {
      const sentences = text.match(/[^。！？.!?]+[。！？.!?]/g) || [];
      if (sentences.length > 3) {
        // 将句子组合成段落
        const tempParagraphs: string[] = [];
        let currentParagraph = '';
        
        for (const sentence of sentences) {
          if (currentParagraph.length + sentence.length <= MAX_SPLIT_LENGTH) {
            currentParagraph += sentence;
          } else {
            if (currentParagraph) {
              tempParagraphs.push(currentParagraph);
            }
            currentParagraph = sentence;
          }
        }
        
        if (currentParagraph) {
          tempParagraphs.push(currentParagraph);
        }
        
        return tempParagraphs;
      }
    }
    
    return paragraphs.filter(p => p.trim().length > 0);
  }

  /**
   * 拆分长段落
   */
  private splitLongParagraph(paragraph: string): string[] {
    const parts: string[] = [];
    const sentences = paragraph.match(/[^。！？.!?]+[。！？.!?]/g) || [];
    
    if (sentences.length === 0) {
      // 如果没有句子分割，按字数强制拆分
      let start = 0;
      while (start < paragraph.length) {
        const end = Math.min(start + MAX_SPLIT_LENGTH, paragraph.length);
        parts.push(this.cleanText(paragraph.slice(start, end)));
        start = end;
      }
      return parts;
    }

    let currentPart = '';
    for (const sentence of sentences) {
      if (currentPart.length + sentence.length <= MAX_SPLIT_LENGTH) {
        currentPart += sentence;
      } else {
        if (currentPart.length >= MIN_SPLIT_LENGTH) {
          parts.push(this.cleanText(currentPart));
          currentPart = sentence;
        } else {
          // 句子太长，需要截断
          currentPart += sentence.slice(0, MAX_SPLIT_LENGTH - currentPart.length);
          parts.push(this.cleanText(currentPart));
          currentPart = sentence.slice(MAX_SPLIT_LENGTH - currentPart.length);
        }
      }
    }
    
    if (currentPart) {
      parts.push(this.cleanText(currentPart));
    }

    return parts;
  }

  /**
   * 确保至少有3个部分
   */
  private ensureMinimumParts(parts: string[]): string[] {
    if (parts.length >= 3) return parts;
    
    const result: string[] = [];
    
    for (const part of parts) {
      if (part.length > MIN_SPLIT_LENGTH * 2) {
        // 尝试将较长的部分再拆分
        const mid = Math.floor(part.length / 2);
        result.push(this.cleanText(part.slice(0, mid)));
        result.push(this.cleanText(part.slice(mid)));
      } else {
        result.push(part);
      }
    }

    // 如果还是不够3个，复制最后一个
    while (result.length < 3) {
      const lastPart = result[result.length - 1];
      if (lastPart.length > MIN_SPLIT_LENGTH) {
        const mid = Math.floor(lastPart.length / 2);
        result[result.length - 1] = this.cleanText(lastPart.slice(0, mid));
        result.push(this.cleanText(lastPart.slice(mid)));
      } else {
        // 添加提示文字
        result.push('更多精彩内容，请继续关注~');
      }
    }

    return result;
  }

  /**
   * 合并过多的部分
   */
  private mergeExcessParts(parts: string[]): string[] {
    const result: string[] = [];
    let i = 0;

    while (i < parts.length && result.length < 8) {
      if (result.length === 7 && i < parts.length - 1) {
        // 最后一个位置，合并剩余所有内容
        let merged = parts[i];
        for (let j = i + 1; j < parts.length; j++) {
          if (merged.length + parts[j].length <= MAX_SPLIT_LENGTH * 1.5) {
            merged += '\n' + parts[j];
          } else {
            break;
          }
        }
        result.push(this.cleanText(merged));
        break;
      } else if (i < parts.length - 1 && 
                 parts[i].length + parts[i + 1].length <= MAX_SPLIT_LENGTH) {
        // 合并两个较短的部分
        result.push(this.cleanText(parts[i] + '\n' + parts[i + 1]));
        i += 2;
      } else {
        result.push(parts[i]);
        i++;
      }
    }

    return result;
  }

  /**
   * 清理文本
   */
  private cleanText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n');
  }
}

/**
 * 导出的拆分函数 - 支持AI拆分和规则拆分
 */
export async function splitText(
  text: string, 
  useAI: boolean = true,
  modelId?: string,
  customPrompt?: string
): Promise<SplitResult[]> {
  // 如果启用AI拆分，先尝试AI
  if (useAI) {
    try {
      console.log('尝试使用AI智能拆分...');
      const aiResults = await splitTextWithAI(text, modelId, customPrompt);
      console.log('AI拆分成功，返回', aiResults.length, '个部分');
      return aiResults;
    } catch (error: any) {
      console.warn('AI拆分失败，降级到规则拆分:', error.message);
      // AI失败，降级到规则拆分
    }
  }

  // 使用规则拆分
  console.log('使用规则拆分...');
  const splitter = new TextSplitter(text);
  return splitter.split();
}

/**
 * 同步的规则拆分函数
 */
export function splitTextByRules(text: string): SplitResult[] {
  const splitter = new TextSplitter(text);
  return splitter.split();
}