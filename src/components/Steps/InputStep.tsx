import React, { useEffect } from 'react';
import { message } from 'antd';
import { useAppStore } from '../../stores/useAppStore';
import { useStepStore } from '../../stores/useStepStore';
import { StepContainer } from '../Navigation/StepContainer';
import { validators } from '../../utils/validators';

// Import new components
import { HeroSection } from '../Home/HeroSection';
import { GlassInput } from '../Home/GlassInput';
import { InspirationPanel } from '../Home/InspirationPanel';
import { ProjectHistory } from '../Home/ProjectHistory';

export const InputStep: React.FC = () => {
  const { 
    inputText, 
    setInputText, 
    recentProjects, 
    loadRecentProject,
    clearRecentProjects 
  } = useAppStore();
  const { setCanProceed, nextStep } = useStepStore();
  
  // 验证是否可以进入下一步
  useEffect(() => {
    setCanProceed(validators.isValidTextLength(inputText));
  }, [inputText, setCanProceed]);
  
  const handleHistoryClick = (projectId: string) => {
    loadRecentProject(projectId);
    message.success('已加载历史记录');
  };
  
  const handleClearHistory = () => {
    clearRecentProjects();
    message.success('已清空历史记录');
  };
  
  const handleNext = () => {
    if (validators.isValidTextLength(inputText)) {
      nextStep();
    }
  };
  
  return (
    <StepContainer
      title=""
      nextDisabled={!validators.isValidTextLength(inputText)}
      onNext={handleNext}
      showNavigation={false}
    >
      <div className="space-y-0">
        {/* Hero Section */}
        <HeroSection />
        
        {/* Glass Input Area */}
        <GlassInput
          inputText={inputText}
          onTextChange={setInputText}
          onNext={handleNext}
        />
        
        {/* AI Inspiration Panel */}
        <InspirationPanel />
        
        {/* Project History */}
        <ProjectHistory
          projects={recentProjects}
          onProjectClick={handleHistoryClick}
          onClearHistory={handleClearHistory}
        />
      </div>
    </StepContainer>
  );
};