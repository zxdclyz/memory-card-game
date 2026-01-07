#!/bin/bash

# 技能翻牌游戏 - 一键部署脚本
# 使用方法: bash deploy.sh

set -e  # 遇到错误立即退出

echo "🎮 技能翻牌游戏 - 一键部署脚本"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 配置项
PROJECT_NAME="skill-card-game"
PORT=${PORT:-3000}
NODE_ENV=${NODE_ENV:-production}

# 检查 Node.js
check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ 未检测到 Node.js，请先安装 Node.js${NC}"
        echo "安装方法: https://nodejs.org/"
        exit 1
    fi
    echo -e "${GREEN}✅ Node.js 版本: $(node -v)${NC}"
}

# 检查 PM2
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        echo -e "${YELLOW}⚠️  未检测到 PM2，正在安装...${NC}"
        npm install -g pm2
        echo -e "${GREEN}✅ PM2 安装完成${NC}"
    else
        echo -e "${GREEN}✅ PM2 已安装${NC}"
    fi
}

# 安装依赖
install_deps() {
    echo ""
    echo -e "${YELLOW}📦 正在安装依赖...${NC}"
    
    # 优先使用 pnpm，如果没有就用 npm
    if command -v pnpm &> /dev/null; then
        echo "使用 pnpm 安装依赖"
        pnpm install
    else
        echo "使用 npm 安装依赖"
        npm install --legacy-peer-deps
    fi
    
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
}

# 构建项目
build_project() {
    echo ""
    echo -e "${YELLOW}🔨 正在构建项目...${NC}"
    
    # 使用 build:server 命令构建（包含前端和服务器）
    if command -v pnpm &> /dev/null; then
        pnpm run build:server
    else
        npm run build:server
    fi
    
    echo -e "${GREEN}✅ 项目构建完成${NC}"
}

# 启动/重启服务
start_service() {
    echo ""
    echo -e "${YELLOW}🚀 正在启动服务...${NC}"
    
    # 检查是否已经在运行
    if pm2 list | grep -q "$PROJECT_NAME"; then
        echo "检测到服务正在运行，正在重启..."
        pm2 restart $PROJECT_NAME
        echo -e "${GREEN}✅ 服务已重启${NC}"
    else
        echo "首次部署，正在启动服务..."
        PORT=$PORT NODE_ENV=$NODE_ENV pm2 start dist/index.js --name $PROJECT_NAME
        echo -e "${GREEN}✅ 服务已启动${NC}"
        
        # 询问是否设置开机自启
        echo ""
        read -p "是否设置开机自启动？(y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            pm2 save
            pm2 startup
            echo -e "${GREEN}✅ 已配置开机自启动${NC}"
        fi
    fi
}

# 显示服务状态
show_status() {
    echo ""
    echo "================================"
    echo -e "${GREEN}🎉 部署完成！${NC}"
    echo "================================"
    echo ""
    echo "服务信息："
    echo "  项目名称: $PROJECT_NAME"
    echo "  运行端口: $PORT"
    echo "  访问地址: http://localhost:$PORT"
    echo "  环境变量: $NODE_ENV"
    echo ""
    echo "常用命令："
    echo "  查看状态: pm2 status"
    echo "  查看日志: pm2 logs $PROJECT_NAME"
    echo "  重启服务: pm2 restart $PROJECT_NAME"
    echo "  停止服务: pm2 stop $PROJECT_NAME"
    echo "  删除服务: pm2 delete $PROJECT_NAME"
    echo ""
    
    # 显示 PM2 状态
    pm2 list
}

# 主流程
main() {
    echo "开始部署流程..."
    echo ""
    
    check_node
    check_pm2
    install_deps
    build_project
    start_service
    show_status
}

# 执行主流程
main

