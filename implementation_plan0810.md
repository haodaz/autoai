# 📋 今日需求整理 & 推进计划

## 需求总览

| # | 需求 | 难度 | 耗时预估 | 优先级 | 依赖 |
|---|------|------|---------|--------|------|
| 0 | **登录页** (账号密码 → localStorage) | ⭐ 简单 | 30min | 🔴 高 | 无 |
| 4 | **侧边栏改浅色科技风 UI** | ⭐ 简单 | 30-40min | 🔴 高 | 无 |
| 5 | **AI 装配可视化** (改名/persona/prompt 编辑) | ⭐⭐ 中等 | 1-1.5h | 🔴 高 | #4 后更统一 |
| 6 | **Claude 模型接入 & 多模型切换** | ⭐⭐ 中等 | 45min-1h | 🟡 中 | 需要 Anthropic API Key |
| 3 | **细化 PPT 生成器 & 法律文书** | ⭐⭐⭐ 较高 | 1.5-2h | 🟡 中 | 需要你的 AI Studio 项目参考 |
| 1 | **响应式适配** | ⭐⭐ 中等 | 1-1.5h | 🟡 中 | #4 之后做，避免重复改 |
| 2 | **语音输入** | ⭐⭐ 中等 | 45min | 🟢 低 | 无 |
| 7 | **Outlook 邮箱连接** | ⭐⭐⭐ 较高 | 1-2h | 🟢 低 | 需要 Azure AD / OAuth 配置 |

---

## 推荐执行顺序

> 原则：**先搭骨架再填肉，先 UI 再功能，有依赖的排后面**

### 🔵 Phase 1 — 基础门面 (先解决"进得去"和"好看")

#### Step 1: `#0 登录页`
- 做一个简约的登录界面，账号 `haoz214` 密码 `198749`
- 存 localStorage，刷新保持登录状态
- 未登录时阻断所有页面

#### Step 2: `#4 侧边栏浅色科技风`
- 当前是 `bg-gray-900` 深色暗黑风
- 改为浅色 + 科技感（半透明/毛玻璃/渐变线条/微光动画）
- 同步调整 Logo 区域和底部用户信息区

### 🟢 Phase 2 — 核心能力强化

#### Step 3: `#5 AI 装配可视化`
- 把现在硬编码的 `SUB_AIS` 数组改成可配置的
- Settings 页面实装：每个 Agent 支持改名、编辑 persona/system prompt、切换启用状态
- 数据先存 localStorage，后续可迁移到数据库

#### Step 4: `#6 Claude 模型接入 & 切换`
- 在 `.env.local` 加 `ANTHROPIC_API_KEY`
- 后端 Agent 路由抽象出模型切换层
- Settings 中加模型选择下拉框（DeepSeek-v3 / Claude Sonnet / Claude Opus 等）

### 🟡 Phase 3 — 功能细化

#### Step 5: `#3 PPT 生成器 & 法律文书细化`
- 当前 Edda：仅生成简单蓝色主题 PPT，需要参考你的 AI Studio 项目增强
- 当前 Eric：纯文本 Markdown 输出，可以增加文书模板选择、变量自动填充等

> [!IMPORTANT]
> 这一步需要你提供 AI Studio 项目的 PPT 生成器代码供参考

#### Step 6: `#1 响应式适配`
- 主页面当前完全没有响应式断点（0 个 `sm:/md:/lg:` 类名）
- 需要处理：侧边栏折叠/汉堡菜单、三栏→单栏、Copilot Modal 全屏化等

### 🔵 Phase 4 — 锦上添花

#### Step 7: `#2 语音输入`
- 使用浏览器原生 Web Speech API (`SpeechRecognition`)
- 在虚拟办公室的文本输入框旁加麦克风按钮

#### Step 8: `#7 Outlook 连接`
- 需要 Microsoft Azure AD 注册应用获取 OAuth 凭证
- 使用 Microsoft Graph API 读取邮件
- 替换/扩展当前的 Gmail IMAP 方案

> [!WARNING]
> Outlook 集成需要你先在 Azure Portal 注册应用并获取 Client ID/Secret。这个可能需要你手动操作，我可以指导流程。

---

## 今日可完成量预估

如果顺利推进，**Phase 1 + Phase 2（Step 1~4）** 大约 3-4 小时可以全部搞定，是今天的核心目标。

Phase 3 的 PPT/法务细化取决于你提供参考代码的时间点，可以穿插做。

Phase 4 属于锦上添花，有余力就做。

---

**请确认这个顺序是否 OK，或者你想调整优先级？确认后我立刻从 Step 1（登录页）开始动手。**
