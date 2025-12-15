# 项目说明：Drone Monitoring Platform Demo

本说明旨在帮助新同事快速理解平台的目标、核心组件与运行方式。项目聚焦无人机遥测数据的采集、校验、存储与实时可视化，提供本地与容器化两套体验，方便在实验、演示或 PoC 中快速落地。

## 设计目标
- 提供**稳定的遥测入口**，既支持 HTTP 也可通过 MQTT 订阅。
- 将数据写入 InfluxDB，便于后续时序查询、看板或告警扩展。
- 通过 WebSocket 将最新数据推送给前端面板，便于实时监控。
- 以最少的依赖和脚本完成「安装—运行—演示」全流程。

## 架构与组件
| 模块 | 作用 | 主要位置 |
| --- | --- | --- |
| HTTP API | 负责接收 `POST /api/v1/uas/telemetry` 请求，校验并入库/广播 | `src/api/router.js`, `src/api/telemetryHandler.js` |
| WebSocket 网关 | 将遥测消息广播给订阅者，支持令牌认证与限流 | `src/services/ws.ts` |
| MQTT 订阅 | 可选；从指定主题消费遥测后复用同一条处理链 | `src/services/mqtt.js` |
| 遥测校验与处理 | 验证 payload、规范时间戳、调度写库与广播 | `src/validation/telemetry.js`, `src/services/telemetryPipeline.js` |
| InfluxDB 写入 | 将遥测写入 measurement `uas_telemetry` | `src/services/influx.ts` |
| 前端仪表盘 | 基于 React + Vite + Leaflet 的地图与状态视图 | `client/`（入口 `client/src`） |
| 编排/脚本 | Make 目标、Docker Compose、示例脚本与数据 | `Makefile`, `docker-compose.yml`, `scripts/`, `examples/` |

### 数据流（HTTP/MQTT → InfluxDB/WebSocket）
1. **入口**：
   - HTTP：`src/api/router.js` 捕获 `POST /api/v1/uas/telemetry` 并委托 `telemetryHandler`。
   - MQTT：`src/services/mqtt.js` 监听 `MQTT_TOPIC`，将消息转为 JSON 并走同样的校验流程。
2. **校验**：`src/validation/telemetry.js` 确保 `timestamp`、`latitude`、`longitude`、`trackStatus` 必填，并返回格式化 payload。
3. **处理管道**：`src/services/telemetryPipeline.js` 记录日志、调用 Influx 写入（`writeTelemetry`）并触发 WebSocket 广播。
4. **存储**：`src/services/influx.ts` 将数据写入 measurement `uas_telemetry`，字段包含位置、速度、高度、航向等。
5. **推送**：`src/services/ws.ts` 对外暴露 `<WS_PATH>`，校验令牌后发送 `welcome` 消息，并以限流方式广播 `{ type: 'telemetry', payload }`。

### 运行模式
- **本地开发**：使用 `make start` 启动 API/WS，`npm run client:dev` 启动前端；`make dev` 可并行跑两者。
- **容器化**：`make docker-up` 构建并运行 API、Nginx 托管的前端与 InfluxDB（自动初始化组织/桶与示例数据）。

### 关键配置
- HTTP/WS：通过 `HTTP_PORT`、`WS_PATH`、`WS_AUTH_TOKEN`、`WS_RATE_LIMIT_MS` 控制端口、路径、认证令牌与广播节流。
- InfluxDB：`INFLUX_HOST`、`INFLUX_PORT`、`INFLUX_PROTOCOL`、`INFLUX_ORG`、`INFLUX_BUCKET`、`INFLUX_TOKEN` 对应连接与权限。
- MQTT（可选）：`MQTT_BROKER_URL`、`MQTT_TOPIC` 控制来源；未配置则默认不启用订阅。

## 示例与验证
- **HTTP 示例**：`examples/telemetry.json` 与 `scripts/curl-telemetry.sh`/`.ps1` 可直接发送标准载荷。
- **WebSocket Demo**：`examples/ws-client.js` 展示如何在 Node 环境订阅并打印实时消息。
- **Influx 初始化**：`examples/init-influx.sh` 会在 Compose 启动时创建组织/桶，并导入 `examples/sample-lineprotocol.lp`。

## 前端特性速览
- 通过 `VITE_WS_URL` 配置 WebSocket 地址（默认为本地 API）。
- 地图组件基于 Leaflet，可显示轨迹与状态；支持切换模拟/实时模式。
- Vite 构建：`npm run client:build`，预览：`npm run client:preview -- --host 0.0.0.0 --port 4173`。

## 开发与质量控制
- 后端单测：`npm test`
- 前端单测：`npm run test:client`
- 类型检查：`npm run lint`
- 代码格式化：`npm run format`

## 常见问题
- **WS 连接被拒绝**：检查令牌是否与 `WS_AUTH_TOKEN` 匹配，或路径是否与 `WS_PATH` 一致。
- **Influx 写入失败**：确认组织/桶/Token 一致，且网络可达；本地可使用默认配置或 Compose 内置的初始化脚本。
- **端口冲突**：确保 3000（API/WS）、5173（前端 dev）、4173（前端预览）和 8086（InfluxDB）未被占用。

## 许可证
项目基于 ISC 许可证发布，详情见仓库根目录的 [LICENSE](../LICENSE)。
