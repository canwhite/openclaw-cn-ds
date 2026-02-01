# Gateway 连接故障排除指南

本文档记录了 Moltbot-CN 网关连接常见问题的诊断和解决方案。

**创建时间**: 2026-01-30
**适用版本**: 2026.1.24-cn.3
**部署方式**: Docker

---

## 目录

- [问题 1：Gateway 连接失败 (1006)](#问题-1gateway-连接失败-1006)
- [问题 2：Token 认证失败](#问题-2token-认证失败)
- [问题 3：设备配对要求 (1008)](#问题-3设备配对要求-1008)
- [快速解决方案](#快速解决方案)
- [预防措施](#预防措施)

---

## 问题 1：Gateway 连接失败 (1006)

### 错误信息

```
Health check failed: gateway closed (1006 abnormal closure (no close frame)): no close reason
Gateway target: ws://127.0.0.1:18789
Source: local loopback
```

### 症状

- 浏览器控制台显示 WebSocket 连接失败
- 错误码：`1006 abnormal closure`
- Gateway 健康检查失败

### 根本原因

**Docker 容器未运行**

检查命令：
```bash
docker ps | grep clawdbot-gateway
# 如果没有输出，说明容器未运行
```

### 诊断步骤

1. **检查容器状态**
   ```bash
   docker ps -a | grep clawdbot-gateway
   ```

2. **检查端口占用**
   ```bash
   lsof -i :18789
   # 应该显示 docker-proxy 或无输出
   ```

3. **检查镜像是否存在**
   ```bash
   docker images | grep moltbot-cn
   ```

### 解决方案

启动 Docker 服务：

```bash
# 启动网关服务
docker-compose up -d clawdbot-gateway

# 查看启动日志
docker logs moltbot-cn-clawdbot-gateway-1 -f
```

### 验证修复

```bash
# 检查容器是否运行
docker ps | grep clawdbot-gateway

# 测试 HTTP 连接
curl -I http://127.0.0.1:18789/

# 应该返回：HTTP/1.1 200 OK
```

---

## 问题 2：Token 认证失败

### 错误信息

```
disconnected (1008): unauthorized: gateway token missing
(open a tokenized dashboard URL or paste token in Control UI settings)
```

### 症状

- WebSocket 连接立即断开
- 错误码：`1008`
- 错误原因：`unauthorized: gateway token missing`

### 根本原因

Gateway 配置为 **Token 认证模式**，访问时必须携带有效的 token。

配置位置：`data/config/clawdbot.json`
```json
{
  "gateway": {
    "auth": {
      "mode": "token",
      "token": "YOUR_TOKEN_HERE"
    }
  }
}
```

### 解决方案

#### 方法 1：使用带 Token 的 URL（推荐）

1. **查找 Token**
   ```bash
   cat data/config/clawdbot.json | grep -A2 '"auth"'
   ```

2. **构建带 Token 的 URL**
   ```
   http://127.0.0.1:18789/?token=YOUR_TOKEN_HERE
   ```

3. **在浏览器中打开完整 URL**

#### 方法 2：在控制界面中输入 Token

1. 打开 `http://127.0.0.1:18789/`
2. 点击设置 → 网关配置
3. 在 Token 字段中粘贴 token
4. 保存设置

### 验证修复

浏览器控制台应显示：
```
✅ WebSocket connected
✅ Authentication successful
```

---

## 问题 3：设备配对要求 (1008)

### 错误信息

```
disconnected (1008): pairing required
与网关断开连接。
```

### 症状

- Token 认证成功后立即断开
- 错误码：`1008`
- 错误原因：`pairing required`
- 控制界面显示："与网关断开连接"

### 根本原因

Gateway 默认启用了**设备身份验证**机制：
- 首次连接的设备需要完成配对流程
- 配对需要网关管理员批准
- 这是安全机制，防止未授权设备访问

代码位置：`src/gateway/server/ws-connection/message-handler.ts:660-673`

### 解决方案

#### 方案 A：禁用设备认证（推荐用于本地开发）

**适用场景**：
- ✅ 本地开发环境
- ✅ 个人使用
- ✅ 可信网络环境
- ❌ 生产环境
- ❌ 公网部署

**操作步骤**：

1. **编辑配置文件**
   ```bash
   vim data/config/clawdbot.json
   ```

2. **在 `gateway` 部分添加 `controlUi` 配置**
   ```json
   {
     "gateway": {
       "port": 18789,
       "mode": "local",
       "bind": "loopback",
       "auth": {
         "mode": "token",
         "token": "YOUR_TOKEN_HERE"
       },
       "controlUi": {
         "dangerouslyDisableDeviceAuth": true
       },
       "tailscale": {
         "mode": "off",
         "resetOnExit": false
       }
     }
   }
   ```

3. **重启服务使配置生效**
   ```bash
   docker-compose restart clawdbot-gateway
   ```

4. **等待 3-5 秒**，然后刷新浏览器

#### 方案 B：完成设备配对流程（生产环境推荐）

**适用场景**：
- ✅ 生产环境
- ✅ 多用户环境
- ✅ 需要细粒度权限控制

**操作步骤**：

1. **首次连接会触发配对请求**
   - 在日志中看到：`device.pair.requested`

2. **批准配对请求**
   - 方法 1：通过 CLI 批准
     ```bash
     docker exec -it moltbot-cn-clawdbot-gateway-1 node dist/index.js device pair approve <request-id>
     ```

   - 方法 2：通过已配对的设备批准
     - 在控制界面：设置 → 设备 → 批准请求

3. **设置设备角色和权限**
   ```json
   {
     "role": "admin", // or "user", "viewer"
     "scopes": ["chat", "control", "exec"]
   }
   ```

### 验证修复

浏览器控制台应显示：
```
✅ WebSocket connected
✅ Device authenticated
✅ Ready to chat
```

---

## 快速解决方案

### 一键修复脚本

如果您遇到了上述所有问题，可以使用以下脚本一键修复：

```bash
#!/bin/bash

echo "=== Moltbot-CN Gateway 故障修复 ==="

# 1. 检查容器状态
echo "[1/4] 检查容器状态..."
if ! docker ps | grep -q clawdbot-gateway; then
    echo "容器未运行，正在启动..."
    docker-compose up -d clawdbot-gateway
    sleep 5
else
    echo "✅ 容器正在运行"
fi

# 2. 获取 Token
echo "[2/4] 获取 Gateway Token..."
TOKEN=$(cat data/config/clawdbot.json | grep -oP '"token":\s*"\K[^"]+')
if [ -n "$TOKEN" ]; then
    echo "✅ Token: $TOKEN"
else
    echo "❌ 未找到 Token"
    exit 1
fi

# 3. 检查设备认证配置
echo "[3/4] 检查设备认证配置..."
if ! grep -q "dangerouslyDisableDeviceAuth" data/config/clawdbot.json; then
    echo "添加设备认证禁用配置..."
    # 需要手动编辑或使用 jq 工具
    echo "请在 data/config/clawdbot.json 的 gateway 部分添加："
    echo '"controlUi": { "dangerouslyDisableDeviceAuth": true }'
    read -p "按 Enter 继续（假设已编辑）..."
fi

# 4. 重启服务
echo "[4/4] 重启服务..."
docker-compose restart clawdbot-gateway
sleep 3

# 5. 显示访问 URL
echo ""
echo "=== 修复完成 ==="
echo "请使用以下 URL 访问："
echo ""
echo "🔗 控制界面："
echo "   http://127.0.0.1:18789/?token=$TOKEN"
echo ""
echo "🔗 WebSocket："
echo "   ws://127.0.0.1:18789/?token=$TOKEN"
echo ""

# 检查服务状态
docker ps | grep clawdbot-gateway
```

保存为 `fix-gateway.sh`，然后运行：
```bash
chmod +x fix-gateway.sh
./fix-gateway.sh
```

---

## 预防措施

### 1. 自动启动容器

在 `docker-compose.yml` 中已配置：
```yaml
services:
  clawdbot-gateway:
    restart: unless-stopped
```

确保 Docker 服务开机自启：
```bash
# macOS
brew services start docker

# Linux
sudo systemctl enable docker
sudo systemctl start docker
```

### 2. 健康检查脚本

创建定时任务检查服务状态：

```bash
#!/bin/bash
# check-gateway.sh

if ! curl -sf http://127.0.0.1:18789/ > /dev/null; then
    echo "Gateway 不健康，尝试重启..."
    docker-compose restart clawdbot-gateway
    echo "已重启服务"
else
    echo "✅ Gateway 运行正常"
fi
```

添加到 crontab（每 5 分钟检查一次）：
```bash
*/5 * * * * /path/to/check-gateway.sh
```

### 3. 日志监控

实时监控日志：
```bash
docker logs moltbot-cn-clawdbot-gateway-1 -f
```

查看最近 100 行日志：
```bash
docker logs moltbot-cn-clawdbot-gateway-1 --tail 100
```

### 4. 配置备份

定期备份配置文件：
```bash
cp data/config/clawdbot.json data/config/clawdbot.json.backup.$(date +%Y%m%d)
```

---

## 常用命令速查

### Docker 管理命令

```bash
# 启动服务
docker-compose up -d clawdbot-gateway

# 停止服务
docker-compose stop clawdbot-gateway

# 重启服务
docker-compose restart clawdbot-gateway

# 查看日志
docker logs moltbot-cn-clawdbot-gateway-1 -f

# 进入容器
docker exec -it moltbot-cn-clawdbot-gateway-1 sh

# 查看容器状态
docker ps | grep clawdbot-gateway

# 查看资源占用
docker stats moltbot-cn-clawdbot-gateway-1
```

### 配置管理命令

```bash
# 编辑配置
vim data/config/clawdbot.json

# 查看配置
cat data/config/clawdbot.json | jq .

# 查找 Token
cat data/config/clawdbot.json | grep -oP '"token":\s*"\K[^"]+'

# 验证配置 JSON 语法
cat data/config/clawdbot.json | jq . > /dev/null
```

### 网络诊断命令

```bash
# 测试 HTTP 连接
curl -I http://127.0.0.1:18789/

# 测试端口监听
lsof -i :18789

# 测试 DNS 解析
nslookup 127.0.0.1

# 测试网络连通性
ping -c 3 127.0.0.1
```

---

## 故障排查检查清单

遇到问题时，按顺序检查：

- [ ] Docker 服务是否运行？
  ```bash
  docker ps
  ```

- [ ] 容器是否正在运行？
  ```bash
  docker ps | grep clawdbot-gateway
  ```

- [ ] 端口是否被监听？
  ```bash
  lsof -i :18789
  ```

- [ ] 配置文件是否存在且有效？
  ```bash
  cat data/config/clawdbot.json | jq .
  ```

- [ ] Token 是否正确？
  ```bash
  cat data/config/clawdbot.json | grep token
  ```

- [ ] 容器日志是否有错误？
  ```bash
  docker logs moltbot-cn-clawdbot-gateway-1 --tail 50
  ```

- [ ] 浏览器控制台是否有错误？
  - 打开开发者工具 (F12)
  - 查看 Console 标签

- [ ] 设备认证配置是否正确？
  ```bash
  cat data/config/clawdbot.json | grep dangerouslyDisableDeviceAuth
  ```

---

## 获取帮助

如果以上方案都无法解决问题：

1. **查看完整日志**
   ```bash
   docker logs moltbot-cn-clawdbot-gateway-1 > gateway.log
   ```

2. **收集系统信息**
   ```bash
   docker version
   docker-compose version
   uname -a
   ```

3. **检查 GitHub Issues**
   - https://github.com/jiulingyun/moltbot-cn/issues

4. **提交新 Issue**
   - 包含完整的错误信息
   - 附上日志文件
   - 说明操作步骤
   - 提供系统环境信息

---

**文档版本**: 1.0
**最后更新**: 2026-01-30
**维护者**: Moltbot-CN 团队
