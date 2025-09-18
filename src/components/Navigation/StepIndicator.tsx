import React from 'react';
import { Steps } from 'antd';
import { 
  EditOutlined, 
  ScissorOutlined, 
  PictureOutlined, 
  DownloadOutlined 
} from '@ant-design/icons';
import { useStepStore } from '../../stores/useStepStore';
import type { StepNumber } from '../../stores/useStepStore';

const stepIcons = {
  1: <EditOutlined />,
  2: <ScissorOutlined />,
  3: <PictureOutlined />,
  4: <DownloadOutlined />,
};

export const StepIndicator: React.FC = () => {
  const { currentStep, steps, goToStep, stepHistory } = useStepStore();
  
  const handleStepClick = (stepNumber: number) => {
    // 只能点击已经访问过的步骤
    if (stepHistory.includes(stepNumber as StepNumber)) {
      goToStep(stepNumber as StepNumber);
    }
  };
  
  return (
    <div className="w-full px-8 py-4 bg-white border-b shadow-sm transition-all duration-300">
      <Steps
        current={currentStep - 1}
        items={steps.map((step) => ({
          title: step.title,
          description: step.description,
          icon: stepIcons[step.number],
          disabled: !stepHistory.includes(step.number),
        }))}
        onChange={handleStepClick}
        className="max-w-4xl mx-auto"
      />
    </div>
  );
};