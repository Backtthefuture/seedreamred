// 测试真实Z-Pay支付配置
import crypto from 'crypto';

// 您的真实商户信息
const ZPAY_PID = '2025062920440492';
const ZPAY_KEY = 'tNeFjVxC3b8IlgNJvqFA9oRNxy9ShaA1';

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

// 生成测试订单
function testRealPayment() {
  console.log('🔥 真实Z-Pay支付配置测试');
  console.log('================================\n');
  
  const testOrder = {
    pid: ZPAY_PID,
    money: '0.01', // 测试金额：1分钱
    name: '积分充值测试',
    notify_url: 'http://localhost:5173/api/payment/zpay-webhook',
    out_trade_no: 'TEST' + Date.now(),
    return_url: 'http://localhost:5173/payment/success',
    sitename: '文字转小红书',
    type: 'alipay', // 支付宝测试
    param: '测试订单-100积分'
  };
  
  console.log('📋 支付参数:');
  console.log(JSON.stringify(testOrder, null, 2));
  
  const paramString = getVerifyParams(testOrder);
  const sign = generateSign(paramString, ZPAY_KEY);
  
  console.log('\n🔐 签名信息:');
  console.log('参数字符串:', paramString);
  console.log('MD5签名:', sign);
  
  const fullParams = {
    ...testOrder,
    sign: sign,
    sign_type: 'MD5'
  };
  
  const paymentUrl = `https://z-pay.cn/submit.php?${new URLSearchParams(fullParams).toString()}`;
  
  console.log('\n🚀 完整支付链接:');
  console.log(paymentUrl);
  
  console.log('\n✅ 配置验证结果:');
  console.log(`商户ID: ${ZPAY_PID} (${ZPAY_PID.length} 位)`);
  console.log(`商户密钥: ${ZPAY_KEY.substring(0, 8)}... (${ZPAY_KEY.length} 位)`);
  console.log('支付方式: 支付宝 (alipay)');
  console.log('测试金额: ¥0.01');
  
  console.log('\n💡 测试建议:');
  console.log('1. 复制上面的支付链接到浏览器测试');
  console.log('2. 使用小额金额 (0.01元) 进行测试');
  console.log('3. 确认支付页面能正常显示');
  console.log('4. 测试完成后再在应用中使用');
  
  return paymentUrl;
}

// 运行测试
const testUrl = testRealPayment();

console.log('\n🎯 下一步操作:');
console.log('1. 在浏览器中访问 http://localhost:5173');
console.log('2. 点击积分购买页面的支付按钮');
console.log('3. 应该能正常跳转到Z-Pay支付页面');
console.log('4. 如果出现错误，请检查商户ID和密钥是否正确');

export { testRealPayment };
