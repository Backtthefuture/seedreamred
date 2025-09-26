// 支付系统综合诊断工具
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // 启用 CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const diagnosis = {
      timestamp: new Date().toISOString(),
      environment: {
        supabase_url: supabaseUrl ? 'configured' : 'missing',
        supabase_service_key: supabaseServiceKey ? 'configured' : 'missing',
      },
      database_checks: {},
      api_tests: {},
      recommendations: []
    };

    // 1. 检查数据库表结构
    try {
      // 检查 payment_orders 表
      const { data: paymentOrders, error: paymentError } = await supabase
        .from('payment_orders')
        .select('*')
        .limit(5);
      
      diagnosis.database_checks.payment_orders = {
        status: paymentError ? 'error' : 'ok',
        count: paymentOrders ? paymentOrders.length : 0,
        error: paymentError?.message,
        sample: paymentOrders?.[0] || null
      };

      // 检查 user_profiles 表
      const { data: userProfiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, credits')
        .limit(5);
      
      diagnosis.database_checks.user_profiles = {
        status: profileError ? 'error' : 'ok',
        count: userProfiles ? userProfiles.length : 0,
        error: profileError?.message,
        sample: userProfiles?.[0] || null
      };

      // 检查 credit_history 表
      const { data: creditHistory, error: historyError } = await supabase
        .from('credit_history')
        .select('*')
        .limit(5);
      
      diagnosis.database_checks.credit_history = {
        status: historyError ? 'error' : 'ok',
        count: creditHistory ? creditHistory.length : 0,
        error: historyError?.message,
        sample: creditHistory?.[0] || null
      };

    } catch (dbError) {
      diagnosis.database_checks.error = dbError.message;
    }

    // 2. 分析问题并提供建议
    if (diagnosis.database_checks.payment_orders?.count === 0) {
      diagnosis.recommendations.push({
        issue: 'payment_orders表为空',
        cause: '支付时订单创建失败',
        solution: '检查zpay-url.js接口是否正常工作'
      });
    }

    if (diagnosis.database_checks.user_profiles?.count === 0) {
      diagnosis.recommendations.push({
        issue: 'user_profiles表为空',
        cause: '用户注册时没有创建profile记录',
        solution: '检查用户注册流程和触发器'
      });
    }

    if (!supabaseServiceKey) {
      diagnosis.recommendations.push({
        issue: 'SUPABASE_SERVICE_ROLE_KEY未配置',
        cause: 'API无法写入数据库',
        solution: '在Vercel环境变量中添加SUPABASE_SERVICE_ROLE_KEY'
      });
    }

    // 3. 生成诊断报告
    diagnosis.summary = {
      critical_issues: diagnosis.recommendations.filter(r => r.issue.includes('未配置') || r.issue.includes('表为空')).length,
      total_issues: diagnosis.recommendations.length,
      status: diagnosis.recommendations.length === 0 ? 'healthy' : 'needs_attention'
    };

    res.status(200).json({
      success: true,
      diagnosis
    });

  } catch (error) {
    console.error('诊断失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
