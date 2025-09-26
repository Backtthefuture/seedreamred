#!/usr/bin/env node

// 诊断webhook积分更新问题
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 请设置环境变量：VITE_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugWebhookIssue() {
  try {
    console.log('🔍 诊断webhook积分更新问题...\n');
    
    const orderId = 'ORDER17588680123565209';
    const userId = '3345232a-51c2-4242-8215-bae97ff19d87';
    
    // 1. 检查订单信息
    console.log('1. 检查订单信息:');
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('out_trade_no', orderId)
      .single();
    
    if (orderError) {
      console.error('❌ 获取订单失败:', orderError);
      return;
    }
    
    console.log('✅ 订单信息:', {
      out_trade_no: order.out_trade_no,
      user_id: order.user_id,
      credits: order.credits,
      status: order.status,
      paid_at: order.paid_at
    });
    
    // 2. 检查用户档案
    console.log('\n2. 检查用户档案:');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('❌ 获取用户档案失败:', profileError);
      return;
    }
    
    console.log('✅ 用户档案:', {
      id: profile.id,
      username: profile.username,
      credits: profile.credits,
      updated_at: profile.updated_at
    });
    
    // 3. 检查积分历史
    console.log('\n3. 检查积分历史:');
    const { data: history, error: historyError } = await supabase
      .from('credit_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (historyError) {
      console.error('❌ 获取积分历史失败:', historyError);
    } else {
      console.log('✅ 积分历史记录:', history.length, '条');
      history.forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.amount} 积分 - ${record.reason} (${record.created_at})`);
      });
    }
    
    // 4. 测试积分更新权限
    console.log('\n4. 测试积分更新权限:');
    const testAmount = 1; // 测试增加1积分
    const { error: testError } = await supabase
      .from('user_profiles')
      .update({
        credits: supabase.sql`credits + ${testAmount}`,
        updated_at: supabase.sql`NOW()`
      })
      .eq('id', userId);
    
    if (testError) {
      console.error('❌ 积分更新权限测试失败:', testError);
    } else {
      console.log('✅ 积分更新权限测试成功，增加了', testAmount, '积分');
      
      // 撤销测试更新
      await supabase
        .from('user_profiles')
        .update({
          credits: supabase.sql`credits - ${testAmount}`,
          updated_at: supabase.sql`NOW()`
        })
        .eq('id', userId);
      console.log('✅ 已撤销测试更新');
    }
    
    // 5. 分析可能的问题
    console.log('\n🎯 问题分析:');
    
    if (order.status !== 'paid') {
      console.log('❌ 订单状态不是 paid，webhook可能没有正确处理');
    } else {
      console.log('✅ 订单状态正确');
    }
    
    if (!order.paid_at) {
      console.log('❌ 订单没有 paid_at 时间，webhook可能没有完全执行');
    } else {
      console.log('✅ 订单有支付时间');
    }
    
    if (history.length === 0) {
      console.log('❌ 没有积分历史记录，说明webhook的积分历史记录部分失败');
    } else {
      console.log('✅ 有积分历史记录');
    }
    
    // 6. 建议修复方案
    console.log('\n🛠️ 建议修复方案:');
    console.log('1. 手动给用户增加', order.credits, '积分');
    console.log('2. 检查webhook日志，查看具体错误信息');
    console.log('3. 测试新的支付流程，验证webhook是否正常工作');
    
  } catch (error) {
    console.error('❌ 诊断失败:', error);
  }
}

debugWebhookIssue();
