import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { GeneratedImage } from '../types';
import { IMAGE_MODEL, IMAGE_TIMEOUT, DEFAULT_IMAGE_SIZE } from '../utils/constants';

// 使用本地代理路径，避免CORS问题
const DOUBAO_API_BASE = '/api/images';

class DoubaoAPIClient {
  private client: AxiosInstance | null = null;
  private apiKey: string | null = null; // 保留用于向后兼容，可选使用
  private imageSize: string = DEFAULT_IMAGE_SIZE;
  private watermarkEnabled: boolean = true;

  constructor() {
    // 初始化客户端，不再硬编码 API Key
    // 开发环境：由 Vite 代理处理
    // 生产环境：由 Vercel Functions 处理
    this.initClient();
  }

  private initClient() {
    this.client = axios.create({
      baseURL: DOUBAO_API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: IMAGE_TIMEOUT, // 使用配置的超时时间
    });
  }

  setApiKey(key: string) {
    this.apiKey = key;
    // 更新客户端，添加 API Key 头（用于向后兼容）
    this.client = axios.create({
      baseURL: DOUBAO_API_BASE,
      headers: {
        'X-API-Key': key, // 通过自定义头传递API Key，由代理服务器转换为Authorization
        'Content-Type': 'application/json',
      },
      timeout: IMAGE_TIMEOUT, // 使用配置的超时时间
    });
  }

  setImageSize(size: string) {
    this.imageSize = size;
  }

  setWatermarkEnabled(enabled: boolean) {
    this.watermarkEnabled = enabled;
  }


  async generateImage(prompt: string): Promise<string> {
    if (!this.client) {
      throw new Error('API客户端未初始化');
    }
    
    // v1.6.1 安全修复：功能调用前验证API密钥
    if (!this.apiKey) {
      throw new Error('图片生成功能需要API密钥。请在设置中配置您的豆包API密钥。');
    }
    
    // 格式验证（基础检查）
    if (typeof this.apiKey !== 'string' || this.apiKey.trim().length < 20) {
      throw new Error('API密钥格式错误。请检查API密钥是否正确。');
    }

    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Generating image (attempt ${attempt}/${maxRetries}):`, prompt);
        
        // 构建请求配置
        const requestConfig: any = {};
        // 如果有 API Key，则添加到请求头（用于向后兼容）
        if (this.apiKey) {
          requestConfig.headers = { 'X-API-Key': this.apiKey };
        }
        
        // 调用豆包文生图API
        const response = await this.client.post('', {
          prompt: prompt, // 直接使用原始提示词
          model: IMAGE_MODEL, // 使用配置的模型
          n: 1,
          size: this.imageSize, // 使用配置的尺寸
          watermark: this.watermarkEnabled, // 使用配置的水印设置
          response_format: 'url',
        }, requestConfig);
        
        // 处理响应
        if (response.data && response.data.data && response.data.data[0]) {
          const imageUrl = response.data.data[0].url;
          
          // 验证URL格式
          if (!imageUrl || !imageUrl.startsWith('http')) {
            throw new Error('API返回的URL格式无效');
          }
          
          console.log('Image generated successfully:', imageUrl);
          return imageUrl;
        } else {
          throw new Error('API响应格式错误：缺少图片URL');
        }
      } catch (error: any) {
        console.error(`Error generating image (attempt ${attempt}):`, error);
        lastError = error;
        
        // 处理CORS错误
        if (error.code === 'ERR_NETWORK') {
          throw new Error('网络连接失败，请检查网络连接或刷新页面重试');
        }
        if (error.response?.status === 0) {
          throw new Error('请求被阻止，请确保开发服务器正在运行');
        }
        
        // 处理特定错误码
        if (error.response?.status === 401) {
          const errorData = error.response?.data;
          if (errorData?.type === 'API_KEY_REQUIRED') {
            throw new Error('图片生成需要API密钥。请在设置中配置您的豆包API密钥。');
          }
          throw new Error(errorData?.message || 'API密钥无效或已过期');
        } else if (error.response?.status === 429) {
          // 频率限制，等待后重试
          if (attempt < maxRetries) {
            const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000); // 指数退避
            console.log(`Rate limited, waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          throw new Error('请求过于频繁，请稍后再试');
        } else if (error.response?.status === 500) {
          // 服务器错误，重试
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          throw new Error('服务器错误，请稍后再试');
        }
        
        // 其他错误，重试
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // 所有重试都失败
    throw lastError || new Error('图片生成失败');
  }

  async generateImages(
    prompts: { id: string; prompt: string }[],
    onProgress?: (id: string, status: GeneratedImage['status'], url?: string, error?: string) => void
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    // 并行生成，大幅提升效率
    // 使用Promise.allSettled确保单个失败不影响其他图片
    const promises = prompts.map(async ({ id, prompt }) => {
      try {
        onProgress?.(id, 'generating');
        const url = await this.generateImage(prompt);
        results.set(id, url);
        onProgress?.(id, 'success', url);
        return { id, url, success: true };
      } catch (error: any) {
        console.error(`Failed to generate image ${id}:`, error);
        onProgress?.(id, 'error', undefined, error.message);
        return { id, error: error.message, success: false };
      }
    });
    
    // 等待所有图片生成完成
    const outcomes = await Promise.allSettled(promises);
    
    // 记录结果统计
    const successful = outcomes.filter(o => o.status === 'fulfilled' && o.value.success).length;
    const failed = outcomes.length - successful;
    
    console.log(`图片生成完成: ${successful}/${outcomes.length} 成功${failed > 0 ? `，${failed} 失败` : ''}`);
    
    return results;
  }

  async testConnection(): Promise<boolean> {
    if (!this.client) {
      throw new Error('API客户端未初始化');
    }

    try {
      // 使用一个简单的提示词测试API连接
      console.log('Testing API connection...');
      
      const testPrompt = '测试连接';
      const response = await this.client.post('', {
        prompt: testPrompt,
        model: IMAGE_MODEL,
        n: 1,
        size: this.imageSize,
        watermark: this.watermarkEnabled,
        response_format: 'url',
      }, {
        timeout: 10000, // 10秒超时
      });
      
      // 检查响应
      if (response.data && response.data.data && response.data.data[0]) {
        console.log('API connection test successful');
        return true;
      }
      
      console.error('API connection test failed: Invalid response format');
      return false;
    } catch (error: any) {
      console.error('Connection test failed:', error.message);
      
      if (error.response?.status === 401) {
        console.error('API key is invalid or expired');
      } else if (error.response?.status === 429) {
        console.error('Rate limit exceeded');
      }
      
      return false;
    }
  }
}

export const doubaoAPI = new DoubaoAPIClient();