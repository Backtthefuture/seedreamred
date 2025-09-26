#!/usr/bin/env node

// 测试支付回调的脚本
import crypto from 'crypto';

// Z-Pay签名算法
function getVerifyParams(params) {
  const sPara = [];
  if (!params) return null;
  
  for (const key in params) {
    if ((!params[key]) || key === "sign" || key === "sign_type") {
      continue;
    }
    sPara.push([key, params[key]]);
  }
  
  sPara.sort();
  let prestr = '';
  for (let i = 0; i < sPara.length; i++) {
    const obj = sPara[i];
    if (i === sPara.length - 1) {
      prestr = prestr + obj[0] + '=' + obj[1];
    } else {
      prestr = prestr + obj[0] + '=' + obj[1] + '&';
    }
  }
  return prestr;
}

function generateSign(paramString, key) {
  const signStr = paramString + key;
  return crypto.createHash('md5').update(signStr).digest('hex');
}

// 模拟Z-Pay回调参数
const zpayKey = 'tNeFjVxC3b8IlgNJvqFA9oRNxy9ShaA1';
const callbackParams = {
  pid: '2025062920440492',
  name: '体验包',
  money: '1.00',
  out_trade_no: 'ORDER' + Date.now(), // 使用一个测试订单号
  trade_no: 'ZPAY' + Date.now(),
  param: '积分充值-100积分',
  trade_status: 'TRADE_SUCCESS',
  type: 'alipay'
};

// 生成正确的签名
const paramString = getVerifyParams(callbackParams);
const sign = generateSign(paramString, zpayKey);

console.log('🧪 生成测试回调参数:');
console.log('参数字符串:', paramString);
console.log('签名:', sign);

// 构建完整的回调URL
const webhookUrl = 'https://SeeDream.superhuang.me/api/payment/zpay-webhook';
const testParams = new URLSearchParams({
  ...callbackParams,
  sign,
  sign_type: 'MD5'
});

const fullUrl = `${webhookUrl}?${testParams.toString()}`;

console.log('\n🔗 完整测试URL:');
console.log(fullUrl);

console.log('\n📋 手动测试步骤:');
console.log('1. 复制上面的URL到浏览器访问');
console.log('2. 如果返回"success"说明回调处理正常');
console.log('3. 如果返回其他内容，说明有问题需要修复');

// 使用curl测试
console.log('\n🖥️  或者使用以下curl命令测试:');
console.log(`curl -X GET "${fullUrl}"`);
