import { supabase, type AuthUser, type SignUpData, type SignInData, type UserProfile } from './supabaseClient';
import { message } from 'antd';

export class AuthService {
  // 用户注册
  async signUp(data: SignUpData): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      // 验证密码确认
      if (data.password !== data.confirmPassword) {
        return { success: false, error: '两次输入的密码不一致' };
      }

      // 验证密码强度
      if (data.password.length < 6) {
        return { success: false, error: '密码长度至少6位' };
      }

      // 验证用户名
      if (data.username.length < 2) {
        return { success: false, error: '用户名长度至少2位' };
      }

      // 检查用户名是否已存在
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', data.username)
        .single();

      if (existingUser) {
        return { success: false, error: '用户名已存在' };
      }

      // 使用用户名作为邮箱（Supabase需要邮箱格式）
      const email = `${data.username}@local.app`;

      // 创建用户账户
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: data.password,
        options: {
          data: {
            username: data.username
          },
          emailRedirectTo: undefined // 禁用邮箱确认重定向
        }
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: '注册失败，请重试' };
      }

      // 创建用户档案并赠送100积分
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          username: data.username,
          credits: 100, // 首次注册赠送100积分
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // 如果档案创建失败，删除已创建的用户
        await supabase.auth.admin.deleteUser(authData.user.id);
        return { success: false, error: '用户档案创建失败' };
      }

      // 返回用户信息
      const user: AuthUser = {
        id: authData.user.id,
        email: authData.user.email,
        username: data.username,
        credits: 100
      };

      return { success: true, user };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: '注册过程中发生错误' };
    }
  }

  // 用户登录
  async signIn(data: SignInData): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      // 使用用户名作为邮箱格式
      const email = `${data.username}@local.app`;

      // 登录验证
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: data.password
      });

      if (authError) {
        console.error('Auth signin error:', authError);
        return { success: false, error: '用户名或密码错误' };
      }

      if (!authData.user) {
        return { success: false, error: '登录失败，请重试' };
      }

      // 获取用户档案信息
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile fetch error:', profileError);
        return { success: false, error: '获取用户信息失败' };
      }

      // 返回用户信息
      const user: AuthUser = {
        id: authData.user.id,
        email: authData.user.email,
        username: profile.username,
        credits: profile.credits
      };

      return { success: true, user };
    } catch (error) {
      console.error('Signin error:', error);
      return { success: false, error: '登录过程中发生错误' };
    }
  }

  // 用户登出
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Signout error:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      console.error('Signout error:', error);
      return { success: false, error: '登出过程中发生错误' };
    }
  }

  // 获取当前用户
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      // 获取用户档案
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        console.error('Profile fetch error:', error);
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        username: profile.username,
        credits: profile.credits
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // 更新用户积分
  async updateCredits(userId: string, newCredits: number): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          credits: newCredits,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Update credits error:', error);
        return { success: false, error: '积分更新失败' };
      }

      return { success: true };
    } catch (error) {
      console.error('Update credits error:', error);
      return { success: false, error: '积分更新过程中发生错误' };
    }
  }

  // 扣除积分
  async deductCredits(userId: string, amount: number): Promise<{ success: boolean; newCredits?: number; error?: string }> {
    try {
      // 先获取当前积分
      const { data: profile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (fetchError || !profile) {
        return { success: false, error: '获取用户积分失败' };
      }

      const currentCredits = profile.credits;
      if (currentCredits < amount) {
        return { success: false, error: '积分不足' };
      }

      const newCredits = currentCredits - amount;

      // 更新积分
      const updateResult = await this.updateCredits(userId, newCredits);
      if (!updateResult.success) {
        return updateResult;
      }

      return { success: true, newCredits };
    } catch (error) {
      console.error('Deduct credits error:', error);
      return { success: false, error: '扣除积分过程中发生错误' };
    }
  }

  // 增加积分
  async addCredits(userId: string, amount: number): Promise<{ success: boolean; newCredits?: number; error?: string }> {
    try {
      // 先获取当前积分
      const { data: profile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (fetchError || !profile) {
        return { success: false, error: '获取用户积分失败' };
      }

      const newCredits = profile.credits + amount;

      // 更新积分
      const updateResult = await this.updateCredits(userId, newCredits);
      if (!updateResult.success) {
        return updateResult;
      }

      return { success: true, newCredits };
    } catch (error) {
      console.error('Add credits error:', error);
      return { success: false, error: '增加积分过程中发生错误' };
    }
  }

  // 监听认证状态变化
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  }
}

// 导出单例实例
export const authService = new AuthService();