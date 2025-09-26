import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { SplitResult } from '../types';
import { AI_MODEL, AI_TIMEOUT } from '../utils/constants';

// 豆包Chat API配置 - 使用代理端点避免CORS问题
const DOUBAO_CHAT_API_BASE = '';

// AI响应接口
interface AIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// AI拆分结果接口
interface AISplitResult {
  cover: string;
  contents: string[];
}

class DoubaoAIService {
  private client: AxiosInstance | null = null;
  private apiKey: string | null = null;

  constructor() {
    // 初始化客户端，不再硬编码 API Key
    // 开发环境：由 Vite 代理处理
    // 生产环境：由 Vercel Functions 处理
    this.initClient();
  }

  private initClient() {
    this.client = axios.create({
      baseURL: DOUBAO_CHAT_API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: AI_TIMEOUT, // 使用配置的超时时间
    });
  }

  setApiKey(key: string) {
    this.apiKey = key;
    // 更新客户端，添加 API Key 头（用于向后兼容）
    this.client = axios.create({
      baseURL: DOUBAO_CHAT_API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: AI_TIMEOUT, // 使用配置的超时时间
    });
  }

  /**
   * 使用AI智能拆分文本 - 添加密钥验证保护
   */
  async splitTextWithAI(text: string, modelId: string = AI_MODEL, customPrompt?: string): Promise<SplitResult[]> {
    if (!this.client) {
      throw new Error('AI客户端未初始化');
    }
    
    // v1.6.1 安全修复：功能调用前验证API密钥
    if (!this.apiKey) {
      throw new Error('AI文本拆分功能需要API密钥。请在设置中配置您的豆包API密钥。');
    }
    
    // 格式验证（基础检查）
    if (typeof this.apiKey !== 'string' || this.apiKey.trim().length < 20) {
      throw new Error('API密钥格式错误。请检查API密钥是否正确。');
    }

    const prompt = this.buildSplitPrompt(text, customPrompt);
    
    try {
      // 重试机制
      let lastError: Error | null = null;
      for (let i = 0; i < 3; i++) {
        try {
          const response = await this.callAI(prompt, modelId);
          const aiResult = this.parseAIResponse(response);
          return this.formatToSplitResults(aiResult);
        } catch (error: any) {
          console.warn(`AI拆分尝试 ${i + 1} 失败:`, error.message);
          lastError = error;
          if (i < 2) {
            // 等待后重试
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      // 所有重试都失败，抛出最后的错误
      throw lastError || new Error('AI拆分失败');
    } catch (error: any) {
      console.error('AI拆分服务错误:', error);
      throw error;
    }
  }

  /**
   * 构建拆分提示词
   */
  private buildSplitPrompt(text: string, customPrompt?: string): string {
    if (customPrompt) {
      // 使用自定义提示词，替换其中的{text}占位符
      return customPrompt.replace('{text}', text);
    }
    
    // 使用默认提示词
    return `你是一个小红书内容专家，擅长将长文本拆分成吸引人的小红书笔记格式。

请将以下文本智能拆分为小红书笔记：

要求：
1. 提取一个吸引眼球的封面标题（20-50字），要有号召力和吸引力
2. 将剩余内容拆分为3-8个内容段落，每段50-200字
3. 每个段落要有明确的主题，内容连贯有重点
4. 适合小红书的风格，轻松活泼，容易阅读
5. 注意：请确保JSON字符串中的特殊字符已正确转义，避免使用未转义的引号、换行符等

请严格按照以下JSON格式返回（只返回JSON对象，不要包含任何其他内容、解释或markdown标记）：
{
  "cover": "封面标题文字",
  "contents": [
    "第一段内容",
    "第二段内容",
    "第三段内容"
  ]
}

待拆分的文本：
${text}`;
  }

  /**
   * 调用AI API
   */
  private async callAI(prompt: string, modelId: string = AI_MODEL): Promise<string> {
    if (!this.client) {
      throw new Error('AI客户端未初始化');
    }

    const headers: any = {};
    // 如果有 API Key，则添加到请求头（用于向后兼容）
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    try {
      const response = await this.client.post<AIResponse>('/api/chat', {
        model: modelId,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }, {
        headers: headers.length > 0 ? headers : undefined
      });

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('AI响应格式错误');
      }

      return response.data.choices[0].message.content;
    } catch (error: any) {
      console.error('AI调用错误:', error);
      
      // 处理特定的API错误
      if (error.response?.status === 429) {
        const errorData = error.response?.data;
        if (errorData?.type === 'RATE_LIMIT_EXCEEDED') {
          const message = errorData.message || '请求过于频繁';
          const retryAfter = errorData.retryAfter;
          if (retryAfter > 3600) {
            throw new Error(`${message}。明天再试或使用自己的API密钥。`);
          } else {
            throw new Error(`${message}。请${Math.ceil(retryAfter/60)}分钟后再试。`);
          }
        }
        throw new Error('免费额度已用完，请稍后再试或使用自己的API密钥');
      } else if (error.response?.status === 413) {
        const errorData = error.response?.data;
        if (errorData?.type === 'PAYLOAD_TOO_LARGE') {
          throw new Error('文本过长。免费用户请缩短文本，或使用自己的API密钥。');
        }
        throw new Error('请求内容过大，请缩短文本');
      } else if (error.response?.status === 401) {
        throw new Error('AI服务暂时不可用，请稍后重试或使用自己的API密钥');
      }
      
      // 其他网络错误
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        throw new Error('网络连接失败，请检查网络连接');
      }
      
      throw new Error(error.message || 'AI拆分服务错误');
    }
  }

  /**
   * 清理响应文本中的控制字符
   */
  private cleanAIResponse(text: string): string {
    // 移除所有控制字符（除了换行和制表符）
    return text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // 移除控制字符
      .replace(/\u0000/g, '') // 移除NULL字符
      .replace(/\\x[0-9a-fA-F]{2}/g, '') // 移除十六进制转义
      .replace(/```json/gi, '') // 移除markdown代码块标记
      .replace(/```/g, '') // 移除markdown代码块结束标记
      .trim();
  }

  /**
   * 解析AI响应
   */
  private parseAIResponse(response: string): AISplitResult {
    try {
      // 清理响应文本
      const cleanedResponse = this.cleanAIResponse(response);
      
      // 尝试提取JSON部分
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('未找到JSON格式响应');
      }

      // 再次清理提取的JSON字符串
      const cleanedJson = this.cleanAIResponse(jsonMatch[0]);
      
      const result = JSON.parse(cleanedJson) as AISplitResult;
      
      // 验证结果格式
      if (!result.cover || !Array.isArray(result.contents)) {
        throw new Error('AI响应格式不正确');
      }

      // 验证内容长度
      if (result.cover.length < 10 || result.cover.length > 100) {
        console.warn('封面标题长度不符合要求，将进行调整');
        result.cover = result.cover.slice(0, 50);
      }

      if (result.contents.length < 3) {
        throw new Error('内容段落太少');
      }

      if (result.contents.length > 8) {
        console.warn('内容段落太多，截取前8段');
        result.contents = result.contents.slice(0, 8);
      }

      return result;
    } catch (error: any) {
      console.error('解析AI响应失败:', response);
      throw new Error(`解析AI响应失败: ${error.message}`);
    }
  }

  /**
   * 格式化为SplitResult数组
   */
  private formatToSplitResults(aiResult: AISplitResult): SplitResult[] {
    const results: SplitResult[] = [];

    // 添加封面
    results.push({
      type: 'cover',
      text: aiResult.cover.trim(),
      index: 0,
      charCount: aiResult.cover.length,
    });

    // 添加内容段落
    aiResult.contents.forEach((content, index) => {
      results.push({
        type: 'content',
        text: content.trim(),
        index: index + 1,
        charCount: content.length,
      });
    });

    return results;
  }

  /**
   * 测试AI连接 - 使用专用测试端点
   */
  async testConnection(): Promise<{ success: boolean; message: string; error?: string }> {
    if (!this.apiKey) {
      return {
        success: false,
        message: '请先设置API密钥',
        error: 'API_KEY_MISSING'
      };
    }

    try {
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(15000) // 15秒超时
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Connection test failed:', data);
        
        // 处理特定错误类型
        switch (data.type) {
          case 'API_KEY_MISSING':
            return {
              success: false,
              message: '请提供API密钥',
              error: 'API_KEY_MISSING'
            };
          case 'API_KEY_FORMAT_ERROR':
            return {
              success: false,
              message: 'API密钥格式错误',
              error: 'API_KEY_FORMAT_ERROR'
            };
          case 'API_KEY_INVALID':
            return {
              success: false,
              message: 'API密钥无效或已过期',
              error: 'API_KEY_INVALID'
            };
          case 'PERMISSION_DENIED':
            return {
              success: false,
              message: 'API密钥权限不足',
              error: 'PERMISSION_DENIED'
            };
          case 'RATE_LIMIT_EXCEEDED':
            return {
              success: false,
              message: '测试请求过于频繁，请稍后再试',
              error: 'RATE_LIMIT_EXCEEDED'
            };
          case 'RATE_LIMIT':
            return {
              success: false,
              message: 'API调用频率过高，请稍后再试',
              error: 'RATE_LIMIT'
            };
          case 'TIMEOUT':
            return {
              success: false,
              message: '连接超时，请检查网络连接',
              error: 'TIMEOUT'
            };
          case 'NETWORK_ERROR':
            return {
              success: false,
              message: '网络连接失败',
              error: 'NETWORK_ERROR'
            };
          default:
            return {
              success: false,
              message: data.message || '连接测试失败',
              error: data.type || 'UNKNOWN_ERROR'
            };
        }
      }

      if (data.success) {
        let message = '连接测试成功';
        
        // 添加功能详情
        if (data.capabilities) {
          const features = [];
          if (data.capabilities.chat) {
            features.push('AI文本拆分');
          }
          if (data.capabilities.imageGeneration) {
            features.push('图片生成');
          }
          if (features.length > 0) {
            message += `，支持功能：${features.join('、')}`;
          }
        }
        
        return {
          success: true,
          message: message
        };
      } else {
        return {
          success: false,
          message: data.message || '连接测试失败',
          error: data.error || 'UNKNOWN_ERROR'
        };
      }

    } catch (error: any) {
      console.error('Connection test error:', error);
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: '连接测试超时',
          error: 'TIMEOUT'
        };
      }
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return {
          success: false,
          message: '网络连接失败，请检查网络连接',
          error: 'NETWORK_ERROR'
        };
      }
      
      return {
        success: false,
        message: '连接测试失败',
        error: 'UNKNOWN_ERROR'
      };
    }
  }
}

// 导出单例
export const aiService = new DoubaoAIService();

// 导出拆分函数
export async function splitTextWithAI(text: string, modelId?: string, customPrompt?: string): Promise<SplitResult[]> {
  return aiService.splitTextWithAI(text, modelId, customPrompt);
}