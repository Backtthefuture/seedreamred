import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// 初始化 Supabase 客户端
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // 需要服务端密钥
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Z-Pay 签名算法（按照官方Node.js示例实现，与生成支付链接时相同）
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

export default async function handler(req, res) {
  // 启用 CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // 支持 GET 请求（Z-Pay官方文档明确说明使用GET）
  if (req.method !== 'GET') {
    res.status(405).send('FAIL');
    return;
  }
  
  try {
    // 获取回调参数（Z-Pay使用GET方式发送通知）
    const callbackParams = req.query;
    
    console.log('收到Z-Pay回调:', callbackParams);
    console.log('回调时间:', new Date().toISOString());
    
    // 验证必需参数（按照Z-Pay官方文档）
    const { 
      pid, 
      name, 
      money, 
      out_trade_no, 
      trade_no, 
      param, 
      trade_status, 
      type, 
      sign, 
      sign_type 
    } = callbackParams;
    
    if (!out_trade_no || !money || !sign || !trade_status || !pid) {
      console.error('缺少必需的回调参数');
      res.status(400).send('FAIL');
      return;
    }
    
    // 签名验证 - 关键安全步骤
    const zpayKey = process.env.ZPAY_KEY || 'demo_key';
    const paramString = getVerifyParams(callbackParams);
    const expectedSign = generateSign(paramString, zpayKey);
    
    if (sign.toLowerCase() !== expectedSign.toLowerCase()) {
      console.error('签名验证失败:', {
        received: sign,
        expected: expectedSign,
        paramString
      });
      res.status(400).send('SIGN_FAIL');
      return;
    }
    
    console.log('签名验证通过');
    
    // 查询数据库中的订单
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('out_trade_no', out_trade_no)
      .single();
    
    if (orderError || !order) {
      console.error('订单不存在:', out_trade_no);
      res.status(404).send('ORDER_NOT_FOUND');
      return;
    }
    
    // 金额验证
    const orderAmount = parseFloat(order.amount);
    const callbackAmount = parseFloat(money);
    
    if (Math.abs(orderAmount - callbackAmount) > 0.01) { // 允许0.01的浮点误差
      console.error('金额不匹配:', {
        orderAmount,
        callbackAmount
      });
      res.status(400).send('AMOUNT_MISMATCH');
      return;
    }
    
    console.log('金额验证通过');
    
    // 处理重复通知（按照官方建议）
    if (order.status !== 'pending') {
      console.log('订单状态已非pending，可能是重复通知:', order.status);
      // 对于重复通知，直接返回success
      res.status(200).send('success');
      return;
    }
    
    // 验证商户ID
    const expectedPid = process.env.ZPAY_PID || 'demo_pid';
    if (pid !== expectedPid) {
      console.error('商户ID不匹配:', {
        received: pid,
        expected: expectedPid
      });
      res.status(400).send('PID_MISMATCH');
      return;
    }
    
    // 只有当支付成功时才处理（按照官方文档，只有TRADE_SUCCESS是成功）
    if (trade_status === 'TRADE_SUCCESS') {
      console.log('开始处理支付成功逻辑');
      
      // 开始事务处理
      const { error: updateError } = await supabase
        .from('payment_orders')
        .update({
          status: 'paid',
          zpay_trade_no: trade_no || '',
          paid_at: new Date().toISOString()
        })
        .eq('out_trade_no', out_trade_no)
        .eq('status', 'pending'); // 确保只更新pending状态的订单
      
      if (updateError) {
        console.error('更新订单状态失败:', updateError);
        res.status(500).send('UPDATE_FAILED');
        return;
      }
      
      // 给用户增加积分
      // 先获取当前积分
      const { data: currentProfile, error: getProfileError } = await supabase
        .from('user_profiles')
        .select('credits')
        .eq('id', order.user_id)
        .single();
      
      if (getProfileError) {
        console.error('获取用户当前积分失败:', getProfileError);
        res.status(500).send('GET_PROFILE_FAILED');
        return;
      }
      
      // 计算新积分并更新
      const newCredits = currentProfile.credits + order.credits;
      const { error: creditError } = await supabase
        .from('user_profiles')
        .update({
          credits: newCredits,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.user_id);
      
      if (creditError) {
        console.error('增加用户积分失败:', creditError);
        // 这里可以考虑回滚订单状态，或者记录错误日志
        res.status(500).send('CREDIT_UPDATE_FAILED');
        return;
      }
      
      // 记录积分历史
      const { error: historyError } = await supabase
        .from('credit_history')
        .insert({
          user_id: order.user_id,
          amount: order.credits,
          reason: `购买积分: ${order.product_name}`
        });
      
      if (historyError) {
        console.error('记录积分历史失败:', historyError);
        // 积分历史记录失败不影响主流程
      }
      
      console.log(`支付成功处理完成: 订单${out_trade_no}, 用户获得${order.credits}积分`);
      
    } else {
      console.log('支付状态非成功:', trade_status);
      
      // 更新订单状态为失败
      await supabase
        .from('payment_orders')
        .update({
          status: 'failed',
          zpay_trade_no: trade_no || ''
        })
        .eq('out_trade_no', out_trade_no);
    }
    
    // 向Z-Pay返回成功响应（必须返回纯字符串"success"）
    res.status(200).send('success');
    
  } catch (error) {
    console.error('支付回调处理错误:', error);
    console.error('错误堆栈:', error.stack);
    console.error('回调参数:', req.query);
    
    // 即使发生错误，也要返回success避免重复通知
    // 但在实际生产中，应该根据具体错误类型决定返回值
    res.status(500).send('INTERNAL_ERROR');
  }
}
