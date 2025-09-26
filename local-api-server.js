// 本地API服务器，用于开发环境
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());

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

function generateOrderNo() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORDER${timestamp}${random}`;
}

// 支付URL生成接口
app.post('/api/payment/zpay-url-simple', (req, res) => {
  try {
    console.log('收到支付请求:', req.body);
    
    const { product_name, amount, credits, payment_type = 'wxpay' } = req.body;
    
    if (!product_name || !amount || !credits) {
      return res.status(400).json({ 
        error: '缺少必需参数',
        message: '请提供 product_name, amount 和 credits' 
      });
    }
    
    const outTradeNo = generateOrderNo();
    
    const zpayParams = {
      pid: process.env.ZPAY_PID || 'demo_pid',
      money: parseFloat(amount).toFixed(2),
      name: product_name,
      notify_url: 'http://localhost:5173/api/payment/zpay-webhook',
      out_trade_no: outTradeNo,
      return_url: 'http://localhost:5173/payment/success',
      sitename: '文字转小红书',
      type: payment_type,
      param: `积分充值-${credits}积分`
    };
    
    const paramString = getVerifyParams(zpayParams);
    const sign = generateSign(paramString, process.env.ZPAY_KEY || 'demo_key');
    
    zpayParams.sign = sign;
    zpayParams.sign_type = 'MD5';
    
    const paymentUrl = `https://z-pay.cn/submit.php?${new URLSearchParams(zpayParams).toString()}`;
    
    console.log('生成支付URL成功');
    
    res.json({
      success: true,
      payment_url: paymentUrl,
      form_data: zpayParams,
      form_action: 'https://z-pay.cn/submit.php',
      out_trade_no: outTradeNo,
      method: 'POST',
      debug_info: {
        param_string: paramString,
        sign: sign
      }
    });
    
  } catch (error) {
    console.error('支付URL生成错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误',
      message: error.message
    });
  }
});

// 测试接口
app.post('/api/test-payment', (req, res) => {
  console.log('收到测试请求:', req.body);
  res.json({
    success: true,
    message: '测试API正常工作',
    received_data: req.body,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`本地API服务器运行在 http://localhost:${PORT}`);
  console.log('支付API端点: http://localhost:3001/api/payment/zpay-url-simple');
});
