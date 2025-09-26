import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// 初始化 Supabase 客户端
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // 需要服务端密钥
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Z-Pay 签名算法（按照官方Node.js示例实现）
function getVerifyParams(params) {
  var sPara = [];
  if (!params) return null;
  
  for (var key in params) {
    if ((!params[key]) || key == "sign" || key == "sign_type") {
      continue;
    }
    sPara.push([key, params[key]]);
  }
  
  // 参数进行排序
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

// 生成MD5签名
function generateSign(paramString, key) {
  const signString = paramString + key;
  return crypto.createHash('md5').update(signString, 'utf8').digest('hex');
}

// 生成唯一订单号
function generateOrderNo() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORDER${timestamp}${random}`;
}

export default async function handler(req, res) {
  // 启用 CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  
  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // 只处理 POST 请求
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    // 获取请求参数
    const { product_name, amount, credits, payment_type = 'wxpay', subscription_type } = req.body;
    
    // 验证必需参数
    if (!product_name || !amount || !credits) {
      res.status(400).json({ 
        error: '缺少必需参数',
        message: '请提供 product_name, amount 和 credits' 
      });
      return;
    }
    
    // 验证用户认证
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        error: '未授权',
        message: '请先登录' 
      });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    // 验证用户token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      res.status(401).json({ 
        error: '认证失败',
        message: '无效的用户token' 
      });
      return;
    }
    
    // 获取用户档案
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError || !userProfile) {
      res.status(404).json({ 
        error: '用户不存在',
        message: '找不到用户档案' 
      });
      return;
    }
    
    // 处理订阅模式（如果适用）
    let subscriptionStartDate = null;
    let subscriptionEndDate = null;
    
    if (subscription_type) {
      // 检查用户是否有未过期的订阅
      const { data: existingSubscription } = await supabase
        .from('payment_orders')
        .select('subscription_end_date')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .not('subscription_end_date', 'is', null)
        .gte('subscription_end_date', new Date().toISOString())
        .order('subscription_end_date', { ascending: false })
        .limit(1);
      
      const now = new Date();
      
      if (existingSubscription && existingSubscription.length > 0) {
        // 从现有订阅结束时间开始
        subscriptionStartDate = new Date(existingSubscription[0].subscription_end_date);
      } else {
        // 从当前时间开始
        subscriptionStartDate = now;
      }
      
      // 计算订阅结束时间（假设按月订阅）
      subscriptionEndDate = new Date(subscriptionStartDate);
      const months = subscription_type === 'monthly' ? 1 : 
                    subscription_type === 'quarterly' ? 3 : 
                    subscription_type === 'yearly' ? 12 : 1;
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + months);
    }
    
    // 生成订单号
    const outTradeNo = generateOrderNo();
    
    // 创建订单记录
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .insert({
        out_trade_no: outTradeNo,
        user_id: user.id,
        product_name,
        amount: parseFloat(amount),
        credits: parseInt(credits),
        status: 'pending',
        payment_method: 'wxpay',
        subscription_start_date: subscriptionStartDate,
        subscription_end_date: subscriptionEndDate
      })
      .select()
      .single();
    
    if (orderError) {
      console.error('创建订单失败:', orderError);
      res.status(500).json({ 
        error: '创建订单失败',
        message: orderError.message 
      });
      return;
    }
    
    // 构建Z-Pay支付参数（按照官方Node.js示例）
    const zpayParams = {
      pid: process.env.ZPAY_PID || 'demo_pid',
      money: parseFloat(amount).toFixed(2), // 确保最多保留两位小数
      name: product_name,
      notify_url: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/api/payment/zpay-webhook`,
      out_trade_no: outTradeNo,
      return_url: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/payment/success`,
      sitename: process.env.VITE_SITE_NAME || '文字转小红书', // 网站名称
      type: payment_type // 微信支付：wxpay，支付宝：alipay
    };
    
    // 添加可选参数
    if (process.env.ZPAY_CID) {
      zpayParams.cid = process.env.ZPAY_CID; // 支付渠道ID（可选）
    }
    
    // 添加附加内容（可选）
    zpayParams.param = `积分充值-${credits}积分`;
    
    // 生成签名
    const paramString = getVerifyParams(zpayParams);
    const sign = generateSign(paramString, process.env.ZPAY_KEY || 'demo_key');
    
    // 添加签名到参数中
    zpayParams.sign = sign;
    
    // 构建完整的支付URL（使用官方域名）
    const zpayBaseUrl = 'https://z-pay.cn/submit.php';
    const urlParams = new URLSearchParams(zpayParams).toString();
    const paymentUrl = `${zpayBaseUrl}?${urlParams}`;
    
    // 返回支付链接和表单数据
    res.status(200).json({
      success: true,
      payment_url: paymentUrl, // GET方式的完整URL
      form_data: zpayParams, // POST表单数据
      form_action: 'https://z-pay.cn/submit.php', // POST表单提交地址
      out_trade_no: outTradeNo,
      order_id: order.id,
      method: 'POST' // 推荐使用POST方法
    });
    
  } catch (error) {
    console.error('支付URL生成错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误',
      message: error.message 
    });
  }
}
