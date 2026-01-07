#!/bin/bash

# 技能翻牌游戏 - 开发模式一键部署脚本
# 使用方法: bash deploy-dev.sh

set -e

echo "🎮 技能翻牌游戏 - 开发模式部署"
echo "================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_NAME="skill-game-dev"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 未检测到 Node.js${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js 版本: $(node -v)${NC}"

# 检查 PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}正在安装 PM2...${NC}"
    npm install -g pm2
fi

# 安装依赖
echo ""
echo -e "${YELLOW}📦 安装依赖...${NC}"
if command -v pnpm &> /dev/null; then
    pnpm install
else
    npm install --legacy-peer-deps
fi

# 启动开发服务器
echo ""
echo -e "${YELLOW}🚀 启动开发服务器...${NC}"

if pm2 list | grep -q "$PROJECT_NAME"; then
    echo "重启服务..."
    pm2 restart $PROJECT_NAME
else
    echo "首次启动..."
    if command -v pnpm &> /dev/null; then
        pm2 start "pnpm run dev" --name $PROJECT_NAME
    else
        pm2 start "npm run dev" --name $PROJECT_NAME
    fi
fi

echo ""
echo "================================"
echo -e "${GREEN}🎉 开发服务器已启动！${NC}"
echo "================================"
echo ""
echo "访问地址: http://localhost:3000"
echo ""
echo "常用命令："
echo "  查看日志: pm2 logs $PROJECT_NAME"
echo "  停止服务: pm2 stop $PROJECT_NAME"
echo "  重启服务: pm2 restart $PROJECT_NAME"
echo ""

pm2 list

