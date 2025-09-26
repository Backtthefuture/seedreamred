#!/bin/bash

echo "================================"
echo "  文字转小红书 Pro v1.0.1"
echo "================================"
echo ""
echo "检查依赖..."

# 检查node是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装，请先安装npm"
    exit 1
fi

echo "✅ Node.js版本: $(node -v)"
echo "✅ npm版本: $(npm -v)"
echo ""

# 检查是否需要安装依赖
if [ ! -d "node_modules" ]; then
    echo "首次运行，正在安装依赖..."
    npm install --registry https://registry.npmmirror.com
    echo "✅ 依赖安装完成"
    echo ""
fi

# 启动应用
echo "正在启动应用..."
echo "================================"
npm run dev