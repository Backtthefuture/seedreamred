import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { GeneratedImage } from '../types';
import { convertToProxyUrl } from '../utils/urlConverter';

export class DownloadService {
  /**
   * 下载单张图片（带重试机制）
   */
  static async downloadImage(url: string, filename: string): Promise<void> {
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        // 转换URL以使用代理
        const proxyUrl = convertToProxyUrl(url);
        console.log('Downloading from:', proxyUrl);
        
        const response = await fetch(proxyUrl, {
          credentials: 'omit',
          cache: 'no-cache',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        saveAs(blob, filename);
        return; // 成功下载，退出
      } catch (error) {
        console.error(`Download attempt ${i + 1} failed:`, error);
        lastError = error as Error;
        
        if (i < maxRetries - 1) {
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }
    
    throw new Error(`图片下载失败: ${lastError?.message || '未知错误'}`);
  }

  /**
   * 批量下载图片为ZIP
   */
  static async downloadImagesAsZip(
    images: GeneratedImage[],
    zipFilename: string = 'xiaohongshu_images.zip'
  ): Promise<void> {
    const zip = new JSZip();
    const successfulImages = images.filter(img => img.status === 'success' && img.url);
    
    if (successfulImages.length === 0) {
      throw new Error('没有可下载的图片');
    }

    // 创建图片文件夹
    const imgFolder = zip.folder('images');
    if (!imgFolder) {
      throw new Error('创建文件夹失败');
    }

    // 下载并添加每张图片到ZIP（带重试机制）
    const downloadPromises = successfulImages.map(async (image) => {
      const maxRetries = 3;
      let lastError: Error | null = null;
      
      for (let retry = 0; retry < maxRetries; retry++) {
        try {
          // 添加延迟，避免并发过多
          await new Promise(resolve => setTimeout(resolve, retry * 500));
          
          // 转换URL以使用代理
          const proxyUrl = convertToProxyUrl(image.url!);
          console.log(`Downloading image ${image.id} from:`, proxyUrl);
          
          const response = await fetch(proxyUrl, {
            credentials: 'omit',
            cache: 'no-cache',
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const blob = await response.blob();
          
          // 验证blob大小
          if (blob.size === 0) {
            throw new Error('Downloaded file is empty');
          }
          
          // 生成文件名
          const filename = image.type === 'cover' 
            ? '封面.png' 
            : `内容${image.index}.png`;
          
          imgFolder.file(filename, blob);
          break; // 成功，退出重试循环
        } catch (error) {
          console.error(`Download attempt ${retry + 1} for image ${image.id} failed:`, error);
          lastError = error as Error;
          
          if (retry === maxRetries - 1) {
            console.error(`Failed to add image ${image.id} to zip after ${maxRetries} attempts:`, lastError);
            // 继续处理其他图片，不中断整个流程
          }
        }
      }
    });

    await Promise.all(downloadPromises);

    // 生成并下载ZIP文件
    try {
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, zipFilename);
    } catch (error) {
      console.error('Failed to generate zip:', error);
      throw new Error('生成ZIP文件失败');
    }
  }

  /**
   * 将图片URL转换为Blob（带错误处理）
   */
  static async urlToBlob(url: string): Promise<Blob> {
    try {
      // 转换URL以使用代理
      const proxyUrl = convertToProxyUrl(url);
      
      const response = await fetch(proxyUrl, {
        credentials: 'omit',
        cache: 'no-cache',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      return blob;
    } catch (error) {
      console.error('Failed to convert URL to Blob:', error);
      throw new Error(`图片获取失败: ${(error as Error).message}`);
    }
  }

  /**
   * 生成下载文件名
   */
  static generateFilename(type: 'cover' | 'content', index: number): string {
    const timestamp = new Date().toISOString().split('T')[0];
    if (type === 'cover') {
      return `xiaohongshu_cover_${timestamp}.png`;
    }
    return `xiaohongshu_content_${index}_${timestamp}.png`;
  }
}