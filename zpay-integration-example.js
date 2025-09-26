// Z-Pay 完整集成示例
// 按照官方Node.js示例实现

import crypto from 'crypto';

// Z-Pay 签名算法（官方标准实现）
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

// MD5签名
function generateSign(paramString, key) {
  return crypto.createHash('md5').update(paramString + key, 'utf8').digest('hex');
}

// 生成支付链接示例
function generatePaymentUrl() {
  console.log('=== Z-Pay 支付链接生成示例 ===');
  
  // 支付参数（按照官方示例格式）
  let data = {
    pid: "你的pid",
    money: "5.00",
    name: "积分充值-标准包",
    notify_url: "http://localhost:5173/api/payment/zpay-webhook", // 异步通知地址
    out_trade_no: generateOrderNo(), // 订单号
    return_url: "http://localhost:5173/payment/success", // 跳转通知地址
    sitename: "文字转小红书", // 网站名称
    type: "wxpay" // 支付方式：alipay:支付宝, wxpay:微信支付, qqpay:QQ钱包, tenpay:财付通
  };
  
  // 参数进行排序拼接字符串(非常重要)
  let str = getVerifyParams(data);
  
  let key = "你的key"; // 密钥，易支付注册会提供pid和秘钥
  
  // MD5加密--进行签名
  let sign = generateSign(str, key); // 注意支付宝规定签名时:待签名字符串后要加key
  
  // 最后要将参数返回给前端，前端访问url发起支付
  let result = `https://z-pay.cn/submit.php?${str}&sign=${sign}&sign_type=MD5`;
  
  console.log('支付参数:', data);
  console.log('参数字符串:', str);
  console.log('签名:', sign);
  console.log('完整URL:', result);
  
  return {
    payment_url: result,
    form_data: {
      ...data,
      sign: sign,
      sign_type: 'MD5'
    }
  };
}

// 验证支付回调示例
function verifyCallback(callbackParams) {
  console.log('\n=== Z-Pay 支付回调验证示例 ===');
  
  // 从回调参数中获取签名
  const receivedSign = callbackParams.sign;
  
  // 生成本地签名进行对比
  const paramString = getVerifyParams(callbackParams);
  const key = "你的key"; // 与生成支付链接时使用相同的密钥
  const expectedSign = generateSign(paramString, key);
  
  console.log('回调参数:', callbackParams);
  console.log('参数字符串:', paramString);
  console.log('接收签名:', receivedSign);
  console.log('期望签名:', expectedSign);
  console.log('签名验证:', receivedSign === expectedSign ? '✅ 通过' : '❌ 失败');
  
  return receivedSign === expectedSign;
}

// 生成订单号
function generateOrderNo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${year}${month}${day}${hour}${minute}${second}${random}`;
}

// 完整流程演示
function fullDemo() {
  console.log('Z-Pay 完整集成演示');
  console.log('====================\n');
  
  // 1. 生成支付链接
  const paymentResult = generatePaymentUrl();
  
  // 2. 模拟支付回调
  const mockCallback = {
    pid: "你的pid",
    name: "积分充值-标准包",
    money: "5.00",
    out_trade_no: "20241226123456789",
    trade_no: "2024122622001418111011411195",
    param: "积分充值-500积分",
    trade_status: "TRADE_SUCCESS",
    type: "wxpay",
    sign: "mock_signature_here", // 实际由Z-Pay生成
    sign_type: "MD5"
  };
  
  // 3. 验证回调签名
  verifyCallback(mockCallback);
  
  console.log('\n=== 集成要点 ===');
  console.log('1. 参数排序：按键名进行字典序排序');
  console.log('2. 字符串拼接：key=value&key=value格式');
  console.log('3. 签名生成：MD5(参数字符串 + 密钥)');
  console.log('4. 空值过滤：移除空值、sign、sign_type参数');
  console.log('5. 回调验证：使用相同算法验证签名');
  
  console.log('\n=== 环境变量配置 ===');
  console.log('ZPAY_PID=你的商户ID');
  console.log('ZPAY_KEY=你的商户密钥');
  console.log('VITE_SITE_NAME=网站名称');
  console.log('VITE_APP_URL=应用域名');
}

// 运行演示
fullDemo();
