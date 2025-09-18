import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-3">
      <div className="max-w-6xl mx-auto px-6">
        {/* 桌面端布局 - 三栏水平排列 */}
        <div className="hidden sm:flex justify-between items-center">
          {/* 左侧：版权信息 */}
          <div className="text-sm text-gray-500">
            © 2025 文字转小红书
          </div>
          
          {/* 中间：流量统计 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">访问量:</span>
            <a 
              href="https://hits.sh/seedream.superhuang.me/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center hover:opacity-80 transition-opacity"
            >
              <img 
                alt="Hits" 
                src="https://hits.sh/seedream.superhuang.me.svg"
                className="h-5"
                loading="lazy"
              />
            </a>
          </div>
          
          {/* 右侧：品牌标识 */}
          <div className="text-sm text-gray-500">
            Powered by AI产品黄叔
          </div>
        </div>
        
        {/* 移动端布局 - 垂直居中排列 */}
        <div className="sm:hidden flex flex-col items-center gap-2 text-center">
          <div className="text-sm text-gray-500">
            © 2025 文字转小红书
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">访问量:</span>
            <a 
              href="https://hits.sh/seedream.superhuang.me/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center hover:opacity-80 transition-opacity"
            >
              <img 
                alt="Hits" 
                src="https://hits.sh/seedream.superhuang.me.svg"
                className="h-5"
                loading="lazy"
              />
            </a>
          </div>
          
          <div className="text-sm text-gray-500">
            Powered by AI产品黄叔
          </div>
        </div>
      </div>
    </footer>
  );
};