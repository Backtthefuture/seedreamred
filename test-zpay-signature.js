// Z-Pay签名算法测试工具
import crypto from 'crypto';

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

// 测试支付请求签名
function testPaymentSignature() {
  console.log('=== 测试支付请求签名 ===');
  
  const paymentParams = {
    name: 'iPhone XS Max 一台',
    money: '0.03',
    type: 'alipay',
    out_trade_no: '201911914837526544601',
    notify_url: 'http://www.aaa.com/notify_url.php',
    pid: '201901151314084206659771',
    param: '金色 256G',
    return_url: 'http://www.baidu.com',
    sign_type: 'MD5'
  };
  
  const key = 'your_zpay_key'; // 替换为实际密钥
  const paramString = getVerifyParams(paymentParams);
  const sign = generateSign(paramString, key);
  
  console.log('参数字符串:', paramString);
  console.log('生成签名:', sign);
  console.log('期望签名: 28f9583617d9caf66834292b6ab1cc89'); // 官方示例签名
  console.log('签名匹配:', sign === '28f9583617d9caf66834292b6ab1cc89');
}

// 测试支付回调签名
function testCallbackSignature() {
  console.log('\n=== 测试支付回调签名 ===');
  
  const callbackParams = {
    pid: '201901151314084206659771',
    name: 'iphone',
    money: '5.67',
    out_trade_no: '201901191324552185692680',
    trade_no: '2019011922001418111011411195',
    param: '金色 256G',
    trade_status: 'TRADE_SUCCESS',
    type: 'alipay',
    sign: 'ef6e3c5c6ff45018e8c82fd66fb056dc',
    sign_type: 'MD5'
  };
  
  const key = 'your_zpay_key'; // 替换为实际密钥
  const paramString = getVerifyParams(callbackParams);
  const expectedSign = generateSign(paramString, key);
  
  console.log('回调参数字符串:', paramString);
  console.log('生成签名:', expectedSign);
  console.log('接收签名:', callbackParams.sign);
  console.log('签名匹配:', expectedSign === callbackParams.sign);
}

// 测试自定义参数
function testCustomParams() {
  console.log('\n=== 测试自定义参数签名 ===');
  
  const customParams = {
    name: '积分充值-标准包',
    money: '5.00',
    type: 'wxpay',
    out_trade_no: 'ORDER' + Date.now(),
    notify_url: 'http://localhost:5173/api/payment/zpay-webhook',
    pid: 'demo_pid',
    return_url: 'http://localhost:5173/payment/success',
    param: '积分充值-500积分',
    sign_type: 'MD5'
  };
  
  const key = 'demo_key';
  const paramString = getVerifyParams(customParams);
  const sign = generateSign(paramString, key);
  
  console.log('自定义参数字符串:', paramString);
  console.log('生成签名:', sign);
  
  // 构建完整URL
  const fullUrl = `https://z-pay.cn/submit.php?${paramString}&sign=${sign}&sign_type=MD5`;
  console.log('完整支付URL:', fullUrl);
}

// 运行所有测试
console.log('Z-Pay 签名算法测试');
console.log('==================');

testPaymentSignature();
testCallbackSignature();
testCustomParams();

console.log('\n注意：请将 your_zpay_key 替换为您的真实Z-Pay密钥进行测试');
