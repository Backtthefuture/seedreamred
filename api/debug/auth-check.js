// 用户认证状态检查工具
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
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const result = {
      timestamp: new Date().toISOString(),
      auth_check: {},
      token_validation: {},
      recommendations: []
    };

    // 检查是否有 Authorization header
    const authHeader = req.headers.authorization;
    result.auth_check.authorization_header = {
      present: !!authHeader,
      format: authHeader ? (authHeader.startsWith('Bearer ') ? 'correct' : 'incorrect') : 'missing',
      preview: authHeader ? `${authHeader.substring(0, 20)}...` : 'not provided'
    };

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      try {
        // 验证 token
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        result.token_validation = {
          token_length: token.length,
          validation_status: authError ? 'invalid' : 'valid',
          error: authError?.message,
          user_info: user ? {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            email_confirmed_at: user.email_confirmed_at
          } : null
        };

        if (user) {
          // 检查用户档案
          const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          result.user_profile = {
            exists: !profileError && !!userProfile,
            error: profileError?.message,
            data: userProfile ? {
              user_id: userProfile.user_id,
              credits: userProfile.credits,
              created_at: userProfile.created_at
            } : null
          };
        }

      } catch (tokenError) {
        result.token_validation = {
          status: 'error',
          error: tokenError.message
        };
      }
    }

    // 生成建议
    if (!authHeader) {
      result.recommendations.push({
        issue: '缺少 Authorization header',
        solution: '前端需要在请求中添加 Authorization: Bearer <token>'
      });
    } else if (!authHeader.startsWith('Bearer ')) {
      result.recommendations.push({
        issue: 'Authorization header 格式错误',
        solution: '应该使用格式: Authorization: Bearer <token>'
      });
    } else if (result.token_validation.validation_status === 'invalid') {
      result.recommendations.push({
        issue: 'Token 无效或已过期',
        solution: '用户需要重新登录获取新的 token'
      });
    }

    if (result.user_profile && !result.user_profile.exists) {
      result.recommendations.push({
        issue: '用户档案不存在',
        solution: '检查用户注册流程，确保创建了 user_profiles 记录'
      });
    }

    // 模拟支付请求测试
    if (req.method === 'POST') {
      const { test_payment = false } = req.body;
      
      if (test_payment && result.token_validation.validation_status === 'valid') {
        result.payment_test = {
          message: '认证验证通过，支付API应该能正常工作',
          next_steps: [
            '1. 确认前端正确传递了 Authorization header',
            '2. 检查 RealPaymentService 中的 token 获取逻辑',
            '3. 确认 Supabase 客户端配置正确'
          ]
        };
      }
    }

    res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('认证检查错误:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
