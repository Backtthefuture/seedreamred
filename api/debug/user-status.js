// 用户状态检查工具
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // 启用 CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { action = 'list_users', email } = req.method === 'GET' ? req.query : req.body;
    
    const result = {
      timestamp: new Date().toISOString(),
      action,
      data: {},
      recommendations: []
    };

    if (action === 'list_users') {
      // 列出最近注册的用户
      const { data: users, error } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 10
      });

      if (error) {
        throw error;
      }

      const userSummary = users.users.map(user => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        email_confirmed_at: user.email_confirmed_at,
        confirmed: !!user.email_confirmed_at,
        status: user.email_confirmed_at ? 'confirmed' : 'pending_confirmation'
      }));

      result.data = {
        total_users: users.users.length,
        confirmed_users: userSummary.filter(u => u.confirmed).length,
        pending_users: userSummary.filter(u => !u.confirmed).length,
        users: userSummary
      };

      // 生成建议
      const pendingCount = userSummary.filter(u => !u.confirmed).length;
      if (pendingCount > 0) {
        result.recommendations.push({
          issue: `${pendingCount} 个用户等待邮箱确认`,
          solution: '在 Supabase 控制台禁用邮箱确认，或手动确认这些用户'
        });
      }
    }

    if (action === 'check_auth_settings') {
      // 检查认证设置（这个需要通过 Supabase 管理 API，这里提供指导）
      result.data = {
        message: '请在 Supabase 控制台检查以下设置',
        steps: [
          '1. 访问 Authentication → Settings',
          '2. 查看 "Enable email confirmations" 是否勾选',
          '3. 如果勾选，建议取消以简化登录流程',
          '4. 检查 SMTP 设置是否正确配置'
        ]
      };
    }

    if (action === 'confirm_user' && email) {
      // 手动确认用户
      const { data: user, error: getUserError } = await supabase.auth.admin.getUserByEmail(email);
      
      if (getUserError || !user) {
        throw new Error(`用户不存在: ${email}`);
      }

      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { 
          email_confirm: true
        }
      );

      if (updateError) {
        throw updateError;
      }

      result.data = {
        message: `用户 ${email} 已手动确认`,
        user_id: user.id,
        updated_at: new Date().toISOString()
      };
    }

    res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('用户状态检查错误:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
