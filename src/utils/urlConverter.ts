/**
 * URL转换工具
 * 用于处理TOS服务器URL到代理URL的转换，解决CORS问题
 */

/**
 * 检查是否为生产环境
 */
function isProduction(): boolean {
  // 在生产环境中，Vite会将 import.meta.env.PROD 设置为 true
  // 同时检查hostname，确保在Vercel部署的环境
  return import.meta.env?.PROD === true || 
         (typeof window !== 'undefined' && !window.location.hostname.includes('localhost'));
}

/**
 * 转换TOS URL为代理URL
 * @param url 原始URL
 * @returns 转换后的代理URL
 */
export function convertToProxyUrl(url: string): string {
  // 检查是否是TOS的URL
  if (url.includes('ark-content-generation') && url.includes('.tos-cn-beijing.volces.com')) {
    try {
      if (isProduction()) {
        // 生产环境：使用查询参数传递完整URL
        // Vercel Function会从查询参数中获取URL并代理请求
        return `/api/tos-proxy?url=${encodeURIComponent(url)}`;
      } else {
        // 开发环境：使用路径代理
        // Vite会将 /proxy/tos/* 代理到TOS服务器
        const urlObj = new URL(url);
        const path = urlObj.pathname + urlObj.search;
        return `/proxy/tos${path}`;
      }
    } catch (error) {
      console.error('Failed to convert URL:', error);
      return url; // 转换失败则返回原URL
    }
  }
  return url; // 非TOS URL直接返回
}