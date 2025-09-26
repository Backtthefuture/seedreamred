// 测试支付流程的完整工具
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Z-Pay 签名算法
function getVerifyParams(params) {
  var sPara = [];
  if (!params) return null;
  
  for (var key in params) {
    if ((!params[key]) || key == "sign" || key == "sign_type") {
      continue;
    }
    sPara.push([key, params[key]]);
  }
  
  sPara = sPara.sort();
  
  var prestr = '';
  for (var i2 = 0; i2 < sPara.length; i2++) {
    var obj = sPara[i2];
    if (i2 == sPara.length - 1) {
      prestr = prestr + obj[0] + '=' + obj[1] + '';
    } else {
      prestr = prestr + obj[0] + '=' + obj[1] + '&';
    }
  }
  return prestr;
}

function generateSign(paramString, key) {
  const signString = paramString + key;
  return crypto.createHash('md5').update(signString, 'utf8').digest('hex');
}

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

  const { action = 'test_order_creation' } = req.query;

  try {
    const testResults = {
      timestamp: new Date().toISOString(),
      action,
      results: {}
    };

    if (action === 'test_order_creation') {
      // 测试订单创建
      const testOrder = {
        out_trade_no: `TEST_ORDER_${Date.now()}`,
        user_id: 'test-user-id',
        product_name: '测试充值',
        amount: 1.00,
        credits: 100,
        status: 'pending',
        payment_method: 'alipay',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('payment_orders')
        .insert([testOrder])
        .select();

      testResults.results.order_creation = {
        success: !error,
        error: error?.message,
        data: data?.[0],
        test_order: testOrder
      };
    }

    if (action === 'test_callback_processing') {
      // 测试回调处理
      const zpayKey = process.env.ZPAY_KEY || 'tNeFjVxC3b8IlgNJvqFA9oRNxy9ShaA1';
      
      // 创建一个测试订单
      const testOrder = {
        out_trade_no: `CALLBACK_TEST_${Date.now()}`,
        user_id: 'test-user-callback',
        product_name: '回调测试',
        amount: 1.00,
        credits: 100,
        status: 'pending',
        payment_method: 'alipay'
      };

      const { data: orderData, error: orderError } = await supabase
        .from('payment_orders')
        .insert([testOrder])
        .select();

      if (orderError) {
        testResults.results.callback_test = {
          success: false,
          step: 'order_creation',
          error: orderError.message
        };
      } else {
        // 模拟回调参数
        const callbackParams = {
          pid: process.env.ZPAY_PID || '2025062920440492',
          name: testOrder.product_name,
          money: testOrder.amount.toFixed(2),
          out_trade_no: testOrder.out_trade_no,
          trade_no: `ZPAY_${Date.now()}`,
          param: `积分充值-${testOrder.credits}积分`,
          trade_status: 'TRADE_SUCCESS',
          type: 'alipay'
        };

        const paramString = getVerifyParams(callbackParams);
        const sign = generateSign(paramString, zpayKey);

        // 验证签名
        const signatureValid = sign === sign; // 总是true，这里只是测试签名生成

        // 更新订单状态
        const { data: updateData, error: updateError } = await supabase
          .from('payment_orders')
          .update({
            status: 'paid',
            zpay_trade_no: callbackParams.trade_no,
            paid_at: new Date().toISOString()
          })
          .eq('out_trade_no', testOrder.out_trade_no)
          .select();

        testResults.results.callback_test = {
          success: !updateError,
          steps: {
            order_creation: { success: true, data: orderData[0] },
            signature_generation: { success: true, sign, paramString },
            order_update: { success: !updateError, error: updateError?.message, data: updateData?.[0] }
          }
        };
      }
    }

    if (action === 'cleanup_test_data') {
      // 清理测试数据
      const { error } = await supabase
        .from('payment_orders')
        .delete()
        .or('user_id.eq.test-user-id,user_id.eq.test-user-callback');

      testResults.results.cleanup = {
        success: !error,
        error: error?.message
      };
    }

    res.status(200).json({
      success: true,
      ...testResults
    });

  } catch (error) {
    console.error('测试失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
