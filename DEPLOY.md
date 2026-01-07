# 技能翻牌游戏 - 部署指南

## 🚀 一键部署（推荐）

### 生产环境部署（构建后运行）

```bash
bash deploy.sh
```

**特点：**
- ✅ 性能最优
- ✅ 内存占用低
- ✅ 适合长期运行
- ✅ 自动构建优化代码

---

### 开发模式部署（快速测试）

```bash
bash deploy-dev.sh
```

**特点：**
- ✅ 部署快速（无需构建）
- ✅ 方便调试
- ⚠️ 性能较差
- ⚠️ 内存占用较高

---

## 📋 部署要求

- **Node.js**: v18+ （推荐 v20）
- **系统**: Linux / macOS / Windows（WSL）
- **内存**: 最低 512MB，推荐 1GB+

---

## 🔧 手动部署（如果脚本不工作）

### 1. 安装 PM2

```bash
npm install -g pm2
```

### 2. 安装依赖

```bash
npm install --legacy-peer-deps
```

### 3. 构建项目（生产环境）

```bash
npm run build:server
```

### 4. 启动服务

**生产模式：**
```bash
pm2 start dist/index.js --name skill-game
pm2 save
pm2 startup
```

**开发模式：**
```bash
pm2 start npm --name skill-game-dev -- run dev
```

---

## 📊 服务管理

### 查看服务状态
```bash
pm2 status
pm2 list
```

### 查看日志
```bash
pm2 logs skill-game
pm2 logs skill-game --lines 100
```

### 重启服务
```bash
pm2 restart skill-game
```

### 停止服务
```bash
pm2 stop skill-game
```

### 删除服务
```bash
pm2 delete skill-game
```

---

## 🌐 配置 Nginx（可选）

如果你想使用域名访问或 80 端口，需要配置 Nginx：

### 1. 安装 Nginx

```bash
sudo apt update
sudo apt install nginx
```

### 2. 创建配置文件

```bash
sudo nano /etc/nginx/sites-available/skill-game
```

### 3. 配置内容

```nginx
server {
    listen 80;
    server_name yourdomain.com;  # 改成你的域名

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 4. 启用配置

```bash
sudo ln -s /etc/nginx/sites-available/skill-game /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. 开放端口

```bash
sudo ufw allow 80
sudo ufw allow 443
```

---

## 🔄 更新部署

当代码有更新时，只需要：

```bash
git pull
bash deploy.sh
```

脚本会自动安装依赖、构建并重启服务。

---

## 🔐 环境变量配置（可选）

创建 `.env` 文件：

```bash
PORT=3000
NODE_ENV=production
```

或者在启动时指定：

```bash
PORT=8080 bash deploy.sh
```

---

## 🐛 常见问题

### 1. 端口被占用

修改端口：
```bash
PORT=8080 bash deploy.sh
```

### 2. 权限不足

```bash
sudo bash deploy.sh
```

### 3. PM2 命令找不到

```bash
npm install -g pm2
# 或者
sudo npm install -g pm2
```

### 4. 构建失败

尝试清理后重新安装：
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### 5. 服务无法访问

检查防火墙：
```bash
sudo ufw allow 3000
```

---

## 📱 访问游戏

部署成功后，通过以下方式访问：

- **本地**: http://localhost:3000
- **局域网**: http://你的内网IP:3000
- **公网**: http://你的公网IP:3000 或 http://yourdomain.com

---

## 💡 性能优化建议

1. **使用生产模式部署**（`deploy.sh`）
2. **配置 Nginx 反向代理** 支持更多并发
3. **使用 CDN** 加速静态资源（如果需要）
4. **开启 gzip 压缩**（Nginx 中配置）

---

## 📞 技术支持

如果遇到问题，请检查：
1. Node.js 版本是否 >= 18
2. PM2 日志：`pm2 logs skill-game`
3. 端口是否被占用：`lsof -i :3000`

---

## 🎉 快速开始

```bash
# 一条命令完成所有操作
bash deploy.sh
```

就这么简单！🚀

