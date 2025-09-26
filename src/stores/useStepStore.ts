import { create } from 'zustand';

export type StepNumber = 1 | 2 | 3 | 4;

interface StepInfo {
  number: StepNumber;
  title: string;
  description: string;
}

interface StepStore {
  // 状态
  currentStep: StepNumber;
  stepHistory: StepNumber[];
  canProceedNext: boolean;
  canGoBack: boolean;
  
  // 步骤信息
  steps: StepInfo[];
  
  // Actions
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: StepNumber) => void;
  setCanProceed: (canProceed: boolean) => void;
  resetSteps: () => void;
  
  // 验证函数
  validateCurrentStep: () => boolean;
}

const STEPS: StepInfo[] = [
  { number: 1, title: '输入文本', description: '输入或粘贴您要转换的文本' },
  { number: 2, title: '智能拆分', description: 'AI智能拆分文本内容' },
  { number: 3, title: '生成图片', description: '选择模板并生成图片' },
  { number: 4, title: '批量下载', description: '预览和下载生成的图片' },
];

export const useStepStore = create<StepStore>((set, get) => ({
  // 初始状态
  currentStep: 1,
  stepHistory: [1],
  canProceedNext: false,
  canGoBack: false,
  steps: STEPS,
  
  // 前进到下一步
  nextStep: () => {
    const { currentStep, validateCurrentStep } = get();
    
    // 验证当前步骤是否可以前进
    if (!validateCurrentStep()) {
      return;
    }
    
    if (currentStep < 4) {
      const nextStep = (currentStep + 1) as StepNumber;
      set((state) => ({
        currentStep: nextStep,
        stepHistory: [...state.stepHistory, nextStep],
        canGoBack: true,
        canProceedNext: false, // 重置，需要新步骤验证
      }));
    }
  },
  
  // 返回上一步
  prevStep: () => {
    const { currentStep, stepHistory } = get();
    
    if (currentStep > 1 && stepHistory.length > 1) {
      const newHistory = [...stepHistory];
      newHistory.pop(); // 移除当前步骤
      const prevStep = newHistory[newHistory.length - 1];
      
      set({
        currentStep: prevStep,
        stepHistory: newHistory,
        canGoBack: prevStep > 1,
        canProceedNext: true, // 返回的步骤应该是已验证的
      });
    }
  },
  
  // 跳转到指定步骤
  goToStep: (step: StepNumber) => {
    const { stepHistory } = get();
    
    // 只能跳转到历史中存在的步骤或第一步
    if (step === 1 || stepHistory.includes(step)) {
      const newHistory = step === 1 ? [1] as StepNumber[] : stepHistory.slice(0, stepHistory.indexOf(step) + 1) as StepNumber[];
      
      set({
        currentStep: step,
        stepHistory: newHistory,
        canGoBack: step > 1,
        canProceedNext: step < 4, // 如果不是最后一步，可能可以前进
      });
    }
  },
  
  // 设置是否可以前进
  setCanProceed: (canProceed: boolean) => {
    set({ canProceedNext: canProceed });
  },
  
  // 重置步骤
  resetSteps: () => {
    set({
      currentStep: 1,
      stepHistory: [1],
      canProceedNext: false,
      canGoBack: false,
    });
  },
  
  // 验证当前步骤（这个函数会在各个步骤组件中被覆盖）
  validateCurrentStep: () => {
    const { canProceedNext } = get();
    return canProceedNext;
  },
}));