#!/usr/bin/env node

// 临时修复工具：为现有用户创建 user_profiles 记录
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 请设置环境变量：VITE_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserProfiles() {
  try {
    console.log('🔍 检查现有用户和用户档案...');
    
    // 1. 获取所有认证用户
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`获取用户失败: ${authError.message}`);
    }
    
    console.log(`📊 找到 ${authUsers.users.length} 个认证用户`);
    
    // 2. 获取所有用户档案
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id');
    
    if (profileError) {
      throw new Error(`获取用户档案失败: ${profileError.message}`);
    }
    
    console.log(`📊 找到 ${profiles.length} 个用户档案`);
    
    // 3. 找出缺少档案的用户
    const existingProfileIds = new Set(profiles.map(p => p.user_id));
    const missingProfiles = authUsers.users.filter(user => !existingProfileIds.has(user.id));
    
    console.log(`🔧 需要创建档案的用户: ${missingProfiles.length} 个`);
    
    if (missingProfiles.length === 0) {
      console.log('✅ 所有用户都有档案，无需修复');
      return;
    }
    
    // 4. 为缺少档案的用户创建记录
    const newProfiles = missingProfiles.map(user => ({
      user_id: user.id,
      email: user.email,
      credits: 100, // 给新用户 100 积分
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    console.log('🚀 创建用户档案...');
    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert(newProfiles)
      .select();
    
    if (insertError) {
      throw new Error(`创建用户档案失败: ${insertError.message}`);
    }
    
    console.log(`✅ 成功创建 ${insertData.length} 个用户档案`);
    
    // 5. 显示创建的档案
    insertData.forEach(profile => {
      console.log(`  - ${profile.email}: ${profile.credits} 积分`);
    });
    
    console.log('\n🎉 用户档案修复完成！');
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
    process.exit(1);
  }
}

// 运行修复
fixUserProfiles();
