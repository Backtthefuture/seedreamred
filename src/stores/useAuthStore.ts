import { create } from 'zustand';
import { authService } from '../services/authService';
import type { AuthUser, SignUpData, SignInData } from '../services/supabaseClient';
import { message } from 'antd';

interface AuthStore {
  // 状态
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  signUp: (data: SignUpData) => Promise<boolean>;
  signIn: (data: SignInData) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateCredits: (newCredits: number) => void;
  deductCredits: (amount: number) => Promise<boolean>;
  addCredits: (amount: number) => Promise<boolean>;
  initializeAuth: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // 初始状态
  user: null,
  isLoading: false,
  isAuthenticated: false,

  // 用户注册
  signUp: async (data: SignUpData) => {
    set({ isLoading: true });
    try {
      const result = await authService.signUp(data);
      
      if (result.success && result.user) {
        set({ 
          user: result.user, 
          isAuthenticated: true,
          isLoading: false 
        });
        message.success('注册成功！已为您赠送100积分');
        return true;
      } else {
        message.error(result.error || '注册失败');
        set({ isLoading: false });
        return false;
      }
    } catch (error) {
      console.error('SignUp error:', error);
      message.error('注册过程中发生错误');
      set({ isLoading: false });
      return false;
    }
  },

  // 用户登录
  signIn: async (data: SignInData) => {
    set({ isLoading: true });
    try {
      const result = await authService.signIn(data);
      
      if (result.success && result.user) {
        set({ 
          user: result.user, 
          isAuthenticated: true,
          isLoading: false 
        });
        message.success(`欢迎回来，${result.user.username}！`);
        return true;
      } else {
        message.error(result.error || '登录失败');
        set({ isLoading: false });
        return false;
      }
    } catch (error) {
      console.error('SignIn error:', error);
      message.error('登录过程中发生错误');
      set({ isLoading: false });
      return false;
    }
  },

  // 用户登出
  signOut: async () => {
    set({ isLoading: true });
    try {
      const result = await authService.signOut();
      
      if (result.success) {
        set({ 
          user: null, 
          isAuthenticated: false,
          isLoading: false 
        });
        message.success('已成功登出');
      } else {
        message.error(result.error || '登出失败');
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('SignOut error:', error);
      message.error('登出过程中发生错误');
      set({ isLoading: false });
    }
  },

  // 更新积分（本地状态）
  updateCredits: (newCredits: number) => {
    const { user } = get();
    if (user) {
      set({ 
        user: { ...user, credits: newCredits }
      });
    }
  },

  // 扣除积分
  deductCredits: async (amount: number) => {
    const { user } = get();
    if (!user) {
      message.error('请先登录');
      return false;
    }

    try {
      const result = await authService.deductCredits(user.id, amount);
      
      if (result.success && result.newCredits !== undefined) {
        get().updateCredits(result.newCredits);
        return true;
      } else {
        message.error(result.error || '积分扣除失败');
        return false;
      }
    } catch (error) {
      console.error('Deduct credits error:', error);
      message.error('积分扣除过程中发生错误');
      return false;
    }
  },

  // 增加积分
  addCredits: async (amount: number) => {
    const { user } = get();
    if (!user) {
      message.error('请先登录');
      return false;
    }

    try {
      const result = await authService.addCredits(user.id, amount);
      
      if (result.success && result.newCredits !== undefined) {
        get().updateCredits(result.newCredits);
        message.success(`成功获得${amount}积分`);
        return true;
      } else {
        message.error(result.error || '积分增加失败');
        return false;
      }
    } catch (error) {
      console.error('Add credits error:', error);
      message.error('积分增加过程中发生错误');
      return false;
    }
  },

  // 初始化认证状态
  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      const user = await authService.getCurrentUser();
      set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false 
      });

      // 监听认证状态变化
      authService.onAuthStateChange((user) => {
        set({ 
          user, 
          isAuthenticated: !!user 
        });
      });
    } catch (error) {
      console.error('Initialize auth error:', error);
      set({ 
        user: null, 
        isAuthenticated: false,
        isLoading: false 
      });
    }
  },

  // 设置用户（用于外部更新）
  setUser: (user: AuthUser | null) => {
    set({ 
      user, 
      isAuthenticated: !!user 
    });
  }
}));