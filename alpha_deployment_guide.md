# 🚀 Bristh AI Alpha 部署与配置清单

这份清单梳理了目前系统运行所需的所有外部依赖、API 密钥、以及系统配置项。请工程师在部署 Alpha 版本时参照此清单进行环境配置。

## 1. 环境变量配置 (`.env.local`)

在项目根目录创建 `.env.local`（或在部署平台的配置中注入），需要以下变量：

```env
# ==========================================
# AI 模型 API 密钥
# ==========================================
# 1. 阿里云百炼 (DashScope) - 包含 DeepSeek 模型
DASHSCOPE_API_KEY=sk-xxxxxxx
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# 2. Anthropic (Claude 家族)
ANTHROPIC_API_KEY=sk-ant-xxxxxxx

# 3. Google Gemini
GEMINI_API_KEY=AQ.xxxxxxx

# ==========================================
# 邮件系统集成 (Outlook/Gmail IMAP & SMTP)
# ==========================================
# 接收邮箱账户与应用专用密码（用于读取和发送邮件）
IMAP_USER=elodieliu214@gmail.com
IMAP_PASSWORD=xxxxxxx
```

> [!WARNING]
> **邮件安全提示**：请勿使用普通登录密码。无论是 Gmail 还是 Outlook，都必须在账户安全设置中开启 **两步验证 (2FA)**，然后生成并使用 **应用专用密码 (App Password)** 填入 `IMAP_PASSWORD`。

## 2. 数据库配置 (Prisma + SQLite)

当前 Alpha 采用轻量级的 SQLite 存储。后续若需迁移 Postgres，可修改 `prisma/schema.prisma` 中的 `provider`。

**初始化指令：**
```bash
# 1. 安装依赖
npm install

# 2. 生成 Prisma Client
npx prisma generate

# 3. 推送/初始化数据库结构（会在 prisma/ 目录下生成 dev.db）
npx prisma db push
```

## 3. AI Agent 及模型映射池

如果工程师后续需要调整、增加模型或 Agent，所有的路由和配置逻辑均硬编码在以下两个核心库文件中：

### A. 模型注册中心 
[src/lib/model-registry.ts](file:///Users/aisandbox/Documents/myAI/src/lib/model-registry.ts)

负责统一定义所有可用的模型，以及提供统一的请求方法（处理兼容性）：
- `deepseek-r1` / `deepseek-v3` (通过阿里云 DashScope)
- `claude-sonnet-5` (Claude 3.5 Sonnet)
- `gemini-flash-3.5` / `gemini-pro-3.1` (Gemini Flash & Pro)

### B. Agent 人格与配置 
[src/lib/bristh-config.ts](file:///Users/aisandbox/Documents/myAI/src/lib/bristh-config.ts)

所有的 Agent（Chief, Alice, Bob, David, Edda, Eric, Fiona, Grace）的人格 Prompt、头像、角色描述均在此配置。
如果需要增加新角色，需在此处补充。

## 4. 邮件集成机制说明

对于 `Grace` (邮件收发 AI)，相关逻辑位于：
- [src/app/api/bristh/agents/grace/route.ts](file:///Users/aisandbox/Documents/myAI/src/app/api/bristh/agents/grace/route.ts)

**打包机制：** 
它会自动扫描同一批次下并发生成的其他 Agent 产物，将其打包为相应的格式发送给用户：
- **Edda (PPT)** -> `.pptx` 
- **Bob (日程)** -> `.ics`
- **Alice/David/Eric/Fiona (文档类)** -> `.doc` (支持 Word 打开的富文本 HTML)

> [!NOTE]
> 目前测试接收邮箱硬编码为 `haoz214@gmail.com`，当项目上线或接入实际用户 CRM 系统时，工程师需要将这部分硬编码改为从 CRM 数据库或前端请求中动态获取。

## 5. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式打包与运行
npm run build
npm run start
```
