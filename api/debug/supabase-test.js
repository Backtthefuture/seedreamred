// Supabase 连接测试工具
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // 启用 CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const testResults = {
      timestamp: new Date().toISOString(),
      environment_variables: {},
      connection_tests: {},
      recommendations: []
    };

    // 检查环境变量
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    testResults.environment_variables = {
      VITE_SUPABASE_URL: {
        status: supabaseUrl ? 'configured' : 'missing',
        value_preview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'not set'
      },
      VITE_SUPABASE_ANON_KEY: {
        status: supabaseAnonKey ? 'configured' : 'missing',
        length: supabaseAnonKey ? supabaseAnonKey.length : 0
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        status: supabaseServiceKey ? 'configured' : 'missing',
        length: supabaseServiceKey ? supabaseServiceKey.length : 0
      }
    };

    // 测试匿名连接
    if (supabaseUrl && supabaseAnonKey) {
      try {
        const anonClient = createClient(supabaseUrl, supabaseAnonKey);
        const { data, error } = await anonClient.from('user_profiles').select('count').limit(1);
        
        testResults.connection_tests.anon_client = {
          status: error ? 'failed' : 'success',
          error: error?.message,
          test: 'SELECT count from user_profiles'
        };
      } catch (err) {
        testResults.connection_tests.anon_client = {
          status: 'failed',
          error: err.message,
          test: 'SELECT count from user_profiles'
        };
      }
    } else {
      testResults.connection_tests.anon_client = {
        status: 'skipped',
        reason: 'Missing URL or ANON_KEY'
      };
    }

    // 测试服务端连接
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
        const { data, error } = await serviceClient.from('user_profiles').select('user_id').limit(1);
        
        testResults.connection_tests.service_client = {
          status: error ? 'failed' : 'success',
          error: error?.message,
          data_sample: data?.[0] || null,
          test: 'SELECT user_id from user_profiles'
        };
      } catch (err) {
        testResults.connection_tests.service_client = {
          status: 'failed',
          error: err.message,
          test: 'SELECT user_id from user_profiles'
        };
      }
    } else {
      testResults.connection_tests.service_client = {
        status: 'skipped',
        reason: 'Missing URL or SERVICE_ROLE_KEY'
      };
    }

    // 生成建议
    if (!supabaseUrl) {
      testResults.recommendations.push({
        issue: 'VITE_SUPABASE_URL 未配置',
        solution: '在 Vercel 环境变量中添加您的 Supabase 项目 URL'
      });
    }

    if (!supabaseAnonKey) {
      testResults.recommendations.push({
        issue: 'VITE_SUPABASE_ANON_KEY 未配置',
        solution: '在 Vercel 环境变量中添加 Supabase 匿名密钥'
      });
    }

    if (!supabaseServiceKey) {
      testResults.recommendations.push({
        issue: 'SUPABASE_SERVICE_ROLE_KEY 未配置',
        solution: '在 Vercel 环境变量中添加 Supabase 服务端密钥'
      });
    }

    if (testResults.connection_tests.service_client?.status === 'failed') {
      testResults.recommendations.push({
        issue: '服务端连接失败',
        solution: '检查 SUPABASE_SERVICE_ROLE_KEY 是否正确，或检查数据库表是否存在'
      });
    }

    // 生成总结
    const failedTests = Object.values(testResults.connection_tests).filter(test => test.status === 'failed').length;
    const totalTests = Object.values(testResults.connection_tests).filter(test => test.status !== 'skipped').length;

    testResults.summary = {
      total_tests: totalTests,
      failed_tests: failedTests,
      success_rate: totalTests > 0 ? ((totalTests - failedTests) / totalTests * 100).toFixed(1) + '%' : 'N/A',
      overall_status: failedTests === 0 && totalTests > 0 ? 'healthy' : 'needs_fix'
    };

    res.status(200).json({
      success: true,
      ...testResults
    });

  } catch (error) {
    console.error('Supabase 测试失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
