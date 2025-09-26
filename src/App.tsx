import { useEffect, useState } from 'react';
import { ConfigProvider, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';

// Navigation Components
import { StepIndicator } from './components/Navigation/StepIndicator';

// Step Components
import { InputStep } from './components/Steps/InputStep';
import { SplitStep } from './components/Steps/SplitStep';
import { GenerateStep } from './components/Steps/GenerateStep';
import { DownloadStep } from './components/Steps/DownloadStep';

// Modal Components
import { SettingsModal } from './components/Settings/SettingsModal';
import { TemplateModal } from './components/Template/TemplateModal';
import { CreditsModal } from './components/Credits';

// Layout Components
import { Footer } from './components/Layout/Footer';

// Auth Components
import { AuthButton } from './components/Auth';

// Stores
import { useAppStore } from './stores/useAppStore';
import { useTemplateStore } from './stores/useTemplateStore';
import { useStepStore } from './stores/useStepStore';
import { useAuthStore } from './stores/useAuthStore';

// Services
import { doubaoAPI } from './services/apiClient';
import { aiService } from './services/aiService';

// Utils
import { storage } from './utils/storage';


function App() {
  // App Store
  const {
    imageSize,
    setImageSize,
    watermarkEnabled,
    setWatermarkEnabled,
    selectedTemplateId,
    setSelectedTemplateId,
    initializeApp,
  } = useAppStore();

  // Template Store
  const {
    templates,
    loadTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    setTemplateModalOpen,
    isTemplateModalOpen,
  } = useTemplateStore();

  // Step Store
  const { currentStep } = useStepStore();

  // Auth Store
  const { initializeAuth, isAuthenticated, user } = useAuthStore();

  // Local State
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [creditsModalVisible, setCreditsModalVisible] = useState(false);

  // Initialize
  useEffect(() => {
    initializeApp();
    loadTemplates();
    initializeAuth(); // 初始化认证状态
  }, []);

  // Handle template selection
  useEffect(() => {
    // 如果没有模板，自动弹出模板创建对话框
    if (templates.length === 0 && currentStep === 3) {
      setTemplateModalOpen(true);
    } else if (!selectedTemplateId && templates.length > 0) {
      // 检查是否有保存的模板选择
      const savedTemplateId = storage.getSelectedTemplateId();
      
      if (savedTemplateId && templates.find(t => t.id === savedTemplateId)) {
        // 使用保存的选择
        setSelectedTemplateId(savedTemplateId);
      } else {
        // 默认选择黄叔模板（如果存在），否则选择第一个
        const huangshuTemplate = templates.find(t => t.id === 'preset_huangshu_blue');
        setSelectedTemplateId(huangshuTemplate ? huangshuTemplate.id : templates[0].id);
      }
    }
  }, [templates, selectedTemplateId, currentStep]);

  // Configure API client settings
  useEffect(() => {
    // 只使用环境变量配置API Key
    const apiKey = import.meta.env.VITE_DOUBAO_API_KEY;
    
    console.log('🔧 配置API服务:', {
      apiKeyStatus: apiKey ? '已配置' : '未配置',
      imageSize,
      watermarkEnabled
    });
    
    if (apiKey) {
      doubaoAPI.setApiKey(apiKey);
      doubaoAPI.setImageSize(imageSize);
      doubaoAPI.setWatermarkEnabled(watermarkEnabled);
      
      // 同时为AI拆分服务设置API Key
      aiService.setApiKey(apiKey);
      console.log('✅ AI拆分服务已配置');
    } else {
      console.warn('⚠️ 未找到 VITE_DOUBAO_API_KEY 环境变量');
    }
  }, [imageSize, watermarkEnabled]);


  const handleSaveSettings = (settings: {
    imageSize: string;
    watermarkEnabled: boolean;
  }) => {
    setImageSize(settings.imageSize);
    setWatermarkEnabled(settings.watermarkEnabled);
    doubaoAPI.setImageSize(settings.imageSize);
    doubaoAPI.setWatermarkEnabled(settings.watermarkEnabled);
  };

  const handleHelp = () => {
    message.info('使用帮助：1.输入文本 2.智能拆分 3.选择模板生成图片 4.下载保存');
  };

  // Render current step component
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <InputStep />;
      case 2:
        return <SplitStep />;
      case 3:
        return <GenerateStep />;
      case 4:
        return <DownloadStep />;
      default:
        return <InputStep />;
    }
  };

  return (
    <ConfigProvider locale={zhCN}>
      <div className="flex flex-col min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-white shadow-sm px-6 py-3 flex justify-between items-center">
          <div className="text-xl font-semibold">
            🌸 文字转小红书
          </div>
          <div className="flex items-center space-x-3">
            {/* 用户积分显示和入口 */}
            {isAuthenticated && user && (
              <button
                onClick={() => setCreditsModalVisible(true)}
                className="flex items-center px-3 py-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                💎 {user.credits} 积分
              </button>
            )}
            
            {/* 积分入口按钮 */}
            <button
              onClick={() => setCreditsModalVisible(true)}
              className="px-3 py-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              💰 积分
            </button>
            
            <button
              onClick={() => setSettingsModalVisible(true)}
              className="px-3 py-1 text-gray-600 hover:text-gray-900"
            >
              ⚙️ 设置
            </button>
            <button
              onClick={handleHelp}
              className="px-3 py-1 text-gray-600 hover:text-gray-900"
            >
              ❓ 帮助
            </button>
            
            {/* 认证按钮 */}
            <AuthButton onOpenSettings={() => setSettingsModalVisible(true)} />
          </div>
        </div>
        
        {/* Step Indicator */}
        <StepIndicator />
        
        {/* Step Content */}
        <div className="flex-1 overflow-auto">
          {renderStepContent()}
        </div>
        
        {/* Footer */}
        <Footer />
        
        {/* Modals */}
        <SettingsModal
          visible={settingsModalVisible}
          imageSize={imageSize}
          watermarkEnabled={watermarkEnabled}
          onClose={() => setSettingsModalVisible(false)}
          onSave={handleSaveSettings}
        />
        
        <TemplateModal
          visible={isTemplateModalOpen}
          templates={templates}
          onClose={() => setTemplateModalOpen(false)}
          onAdd={addTemplate}
          onUpdate={updateTemplate}
          onDelete={deleteTemplate}
        />
        
        <CreditsModal
          visible={creditsModalVisible}
          onClose={() => setCreditsModalVisible(false)}
        />
      </div>
    </ConfigProvider>
  );
}

export default App;