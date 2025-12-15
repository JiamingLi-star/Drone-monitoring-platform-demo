# Drone Monitoring Platform Demo

## 项目简介
本项目是一个面向无人机(UAS)遥测数据的端到端演示平台，涵盖数据采集、HTTP 接口、WebSocket 实时推送、时序数据库写入以及 React 可视化面板。仓库内同时提供本地开发脚本与 Docker Compose，一条命令即可启动 API、WebSocket 网关、InfluxDB 与前端仪表盘。

## 核心特性
- **统一数据入口**：`POST /api/v1/uas/telemetry` 接收标准 JSON 遥测载荷，写入 InfluxDB 并广播至 WebSocket 订阅者。
- **实时流式推送**：WebSocket 服务支持协议头或查询参数携带令牌，默认限流 250 ms/次，连接即收到欢迎消息。
- **前端仪表盘**：Vite + React + Leaflet 构建的地图面板，可订阅 WebSocket 流、切换模拟数据、查看轨迹状态。
- **一键编排**：`make docker-up` 启动 API、前端、InfluxDB（预置示例数据）及网关；亦可使用 `make dev` 本地并行跑前后端。
- **脚本与样例**：提供 cURL/PowerShell 脚本、示例载荷、线协议种子与 WebSocket 客户端示例，便于快速验证链路。

## 目录速览
- `src/`：Node/Express 后端与 WebSocket 服务入口。
- `client/`：前端源代码、Vite 配置与 React 组件。
- `examples/`：示例遥测 JSON、InfluxDB line protocol、最小 WebSocket 客户端与初始化脚本。
- `scripts/`：辅助脚本（如 cURL 测试、Influx 初始化）。
- `docker-compose.yml`：API、前端、InfluxDB 的容器化编排。
- `Makefile`：封装安装、启动、测试等常用命令。

## 环境要求
- Node.js 18+（已在 Node 22.x 验证）
- npm
- Docker 与 Docker Compose（仅容器化运行需要）

## 快速开始
### 本地开发（Mac/Linux）
```bash
make install             # 安装依赖
make start               # 启动 API + WebSocket，默认端口 3000
npm run client:dev       # 启动前端 Vite，默认端口 5173
```
或一条命令同时跑前后端：
```bash
make dev
```

### 本地开发（Windows）
**进入项目目录**（每次都要）：`cd D:\中山大学测试\Drone-monitoring-platform-demo`

1. 打开 PowerShell 窗口 1，启动后端（3000）：
   ```pwsh
   npm install
   npm run start:server
   ```
   看到 `Server listening on port 3000` 即成功。
2. 再开 PowerShell 窗口 2，仍在项目根目录，启动前端（5173）：
   ```pwsh
   npm run client:dev
   ```
   看到 `VITE vX.X.X ready` 和 `http://localhost:5173/` 即成功。
3. 浏览器访问 `http://localhost:5173` 查看 UAV Telemetry Console。

> 可选：`npm run dev` 会同时启动前后端，但调试时推荐两个窗口更清晰。

常用验证/排查：
- 端口占用检查：`netstat -ano | findstr 3000`、`netstat -ano | findstr 5173`（无输出代表未占用）。
- 后端是否在线：在浏览器访问 `http://localhost:3000` 或 `http://localhost:3000/api/health`。
- 前端是否在线：访问 `http://localhost:5173`，若 404 多半是前端未启动。
- 发送示例遥测：
  ```pwsh
  ./scripts/curl-telemetry.ps1 -HostName localhost -Port 3000 -FilePath examples/telemetry.json
  ```
- WebSocket 直连：`ws://localhost:3000/ws?token=demo-token`。

### Docker Compose
```bash
make docker-up
```
启动后包含：
- `api`：Express + ws 服务
- `frontend`：Nginx 托管的构建产物
- `influxdb`：预置组织/桶与示例线协议数据

关闭并清理：
```bash
make docker-down
```

## 配置 (环境变量)
| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `HTTP_PORT` | `3000` | HTTP API 端口 |
| `WS_PATH` | `/ws` | WebSocket 升级路径 |
| `WS_AUTH_TOKEN` | `demo-token` | 认证令牌（协议头或查询参数） |
| `WS_RATE_LIMIT_MS` | `250` | WebSocket 广播限流窗口（毫秒） |
| `CORS_ORIGIN` | `*` | 允许的跨域来源 |
| `INFLUX_HOST` | `localhost` | InfluxDB 主机名 |
| `INFLUX_PORT` | `8086` | InfluxDB 端口 |
| `INFLUX_PROTOCOL` | `http` | InfluxDB 协议 |
| `INFLUX_ORG` | `your-org` | Influx 组织 |
| `INFLUX_BUCKET` | `your-bucket` | 目标桶 |
| `INFLUX_TOKEN` | `your-token` | Influx 访问令牌 |

## HTTP API 概览
- **方法/路径**：`POST /api/v1/uas/telemetry`
- **Content-Type**：`application/json`
- **必填字段**：`timestamp`、`latitude`、`longitude`、`trackStatus`
- **可选字段**：`altitude`、`groundSpeed`、`heading`

示例请求位于 [`examples/telemetry.json`](examples/telemetry.json)：
```bash
./scripts/curl-telemetry.sh                     # 默认 http://localhost:3000
HOST=127.0.0.1 PORT=4000 ./scripts/curl-telemetry.sh
```
健康检查：`GET /api/health`。

## WebSocket 流
- **URL**：`ws://<host>:<HTTP_PORT><WS_PATH>`（默认 `ws://localhost:3000/ws`）
- **认证**：`Sec-WebSocket-Protocol: <WS_AUTH_TOKEN>` 头或 `?token=<WS_AUTH_TOKEN>` 查询参数
- **消息格式**：
  - 连接成功：`{ "type": "welcome", "timestamp": "..." }`
  - 遥测广播：`{ "type": "telemetry", "payload": { ... } }`

最小连接示例（Node/WebSocket）：
```js
const ws = new WebSocket('ws://localhost:3000/ws?token=demo-token');
ws.onmessage = (event) => console.log(event.data);
```

## 前端使用
- 默认 WebSocket 地址：`ws://localhost:3000/ws?token=demo-token`
- 自定义地址：在前端运行前设置 `VITE_WS_URL`，如 `VITE_WS_URL=ws://api.example.com/ws?token=abc`。
- 生产构建与预览：
  ```bash
  npm run client:build
  npm run client:preview -- --host 0.0.0.0 --port 4173
  ```

## 测试与质量
- 后端单测：`npm test`
- 前端单测：`npm run test:client`
- 类型检查：`npm run lint`
- 代码格式化：`npm run format`

## 示例与数据
- `examples/telemetry.json`：HTTP 遥测样例
- `examples/sample-lineprotocol.lp`：Compose 启动时导入的 InfluxDB line protocol 数据
- `examples/ws-client.js`：Node 最小 WebSocket 消费者
- `examples/init-influx.sh`：初始化 Influx 组织/桶/数据的脚本

## 故障排查
- 确认 `WS_AUTH_TOKEN` 一致，否则 WebSocket 连接会被拒绝。
- 使用 Docker 时，确保 3000、5173、8086 等端口未被占用。
- 若收到 Influx 401/404，请核对 `INFLUX_ORG`、`INFLUX_BUCKET` 与 `INFLUX_TOKEN`。

## 许可证
项目基于 ISC 许可证发布，详见 [LICENSE](LICENSE)。
