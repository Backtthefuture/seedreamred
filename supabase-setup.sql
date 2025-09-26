-- 创建用户档案表
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  credits INTEGER DEFAULT 100 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);

-- 启用行级安全策略 (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略：用户只能查看和修改自己的档案
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 创建触发器函数：自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 创建函数：自动创建用户档案（当用户注册时）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, credits)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    100
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：当新用户注册时自动创建档案
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 创建积分历史记录表（可选，用于追踪积分变化）
CREATE TABLE IF NOT EXISTS credit_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL, -- 正数为增加，负数为扣除
  reason TEXT NOT NULL, -- 积分变化原因
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 为积分历史表创建索引
CREATE INDEX IF NOT EXISTS idx_credit_history_user_id ON credit_history(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_history_created_at ON credit_history(created_at);

-- 为积分历史表启用RLS
ALTER TABLE credit_history ENABLE ROW LEVEL SECURITY;

-- 积分历史表的RLS策略
CREATE POLICY "Users can view own credit history" ON credit_history
  FOR SELECT USING (user_id IN (SELECT id FROM user_profiles WHERE auth.uid() = id));

CREATE POLICY "System can insert credit history" ON credit_history
  FOR INSERT WITH CHECK (true); -- 允许系统插入记录

-- 创建支付订单表
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  out_trade_no TEXT UNIQUE NOT NULL, -- 订单编号
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL, -- 商品名称
  amount DECIMAL(10,2) NOT NULL, -- 订单金额
  credits INTEGER NOT NULL, -- 购买的积分数量
  status TEXT DEFAULT 'pending' NOT NULL, -- pending, paid, failed, cancelled
  payment_method TEXT DEFAULT 'wxpay', -- 支付方式
  subscription_start_date TIMESTAMP WITH TIME ZONE, -- 订阅开始时间（如果是订阅商品）
  subscription_end_date TIMESTAMP WITH TIME ZONE, -- 订阅结束时间（如果是订阅商品）
  zpay_trade_no TEXT, -- Z-Pay平台的交易号
  paid_at TIMESTAMP WITH TIME ZONE, -- 支付完成时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 创建支付订单表的索引
CREATE INDEX IF NOT EXISTS idx_payment_orders_out_trade_no ON payment_orders(out_trade_no);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON payment_orders(created_at);

-- 为支付订单表启用RLS
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- 支付订单表的RLS策略
CREATE POLICY "Users can view own orders" ON payment_orders
  FOR SELECT USING (user_id IN (SELECT id FROM user_profiles WHERE auth.uid() = id));

CREATE POLICY "Users can insert own orders" ON payment_orders
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM user_profiles WHERE auth.uid() = id));

CREATE POLICY "System can update orders" ON payment_orders
  FOR UPDATE WITH CHECK (true); -- 允许系统更新订单状态

-- 创建触发器：自动更新订单的 updated_at 字段
CREATE TRIGGER update_payment_orders_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();