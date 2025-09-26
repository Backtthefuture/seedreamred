import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 验证环境变量
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase 环境变量未配置，使用占位符值');
  console.warn('请创建 .env 文件并配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
  console.warn('参考 env.example 文件和 SUPABASE_SETUP.md 文档');
}

// 检查是否为示例值
if (supabaseUrl?.includes('your-project-id') || supabaseAnonKey?.includes('your-anon-key')) {
  console.warn('⚠️ 检测到示例配置值，请替换为真实配置');
}

// 创建Supabase客户端，如果环境变量无效则使用占位符避免错误
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// 数据库表类型定义
export interface UserProfile {
  id: string;
  username: string;
  credits: number;
  created_at: string;
  updated_at: string;
}

// 认证相关类型
export interface AuthUser {
  id: string;
  email?: string;
  username: string;
  credits: number;
}

export interface SignUpData {
  username: string;
  password: string;
  confirmPassword: string;
}

export interface SignInData {
  username: string;
  password: string;
}