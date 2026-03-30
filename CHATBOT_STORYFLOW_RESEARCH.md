# Story Writing Chatbot Integration Research

## Goal

把现有 `plot -> structure -> writing` 三段流程整合成一个连续的 chatbot 体验，同时保留当前 AI 版与非 AI 版的功能约束，让学生在同一对话界面里完成写作，不再频繁切页面。

## Current Flow

当前顶层流程是在 [`app/page.tsx`](app/page.tsx) 里按 `stage` 和 `user.noAi` 切换 6 个组件：

- `plot`: [`PlotBrainstorm`](components/stages/plot-brainstorm.tsx) / [`PlotBrainstormNoAi`](components/stages/plot-brainstorm-no-ai.tsx)
- `structure`: [`StoryStructure`](components/stages/story-structure.tsx) / [`StoryStructureNoAi`](components/stages/story-structure-no-ai.tsx)
- `writing`: [`GuidedWriting`](components/stages/guided-writing.tsx) / [`GuidedWritingNoAi`](components/stages/guided-writing-no-ai.tsx)

参考：

- [`app/page.tsx:2037`](app/page.tsx:2037)
- [`app/page.tsx:2101`](app/page.tsx:2101)
- [`app/page.tsx:2127`](app/page.tsx:2127)

## Stage-by-Stage Findings

### 1. Plot

AI 版是“聊天 UI + 后台摘要器”双轨：

- 首条消息由 `/api/dify-chat` 生成，要求模型一问一答并附带 6 个单词建议。
- 学生每发送一次消息，就可能触发 `/api/dify-plot-summary`，从对话里抽取 `setting / conflict / goal`。
- 只有三格都不是空且不是 `unknown` 才能继续。

参考：

- [`components/stages/plot-brainstorm.tsx:228`](components/stages/plot-brainstorm.tsx:228)
- [`components/stages/plot-brainstorm.tsx:266`](components/stages/plot-brainstorm.tsx:266)
- [`components/stages/plot-brainstorm.tsx:311`](components/stages/plot-brainstorm.tsx:311)
- [`components/stages/plot-brainstorm.tsx:566`](components/stages/plot-brainstorm.tsx:566)
- [`app/api/dify-plot-summary/route.ts:71`](app/api/dify-plot-summary/route.ts:71)

非 AI 版不是聊天，而是直接手填三格，填满就过：

- [`components/stages/plot-brainstorm-no-ai.tsx:40`](components/stages/plot-brainstorm-no-ai.tsx:40)
- [`components/stages/plot-brainstorm-no-ai.tsx:45`](components/stages/plot-brainstorm-no-ai.tsx:45)

### 2. Structure

AI 版实际上有两条子路径：

- 可以直接点结构卡片，跳过示例生成。
- 也可以点 “See Structures in Detail”，再调用 `/api/dify-structure-examples` 生成 3 个结构示例故事，并逐个调用 `/api/generate-image` 生成配图。

参考：

- [`components/stages/story-structure.tsx:115`](components/stages/story-structure.tsx:115)
- [`components/stages/story-structure.tsx:157`](components/stages/story-structure.tsx:157)
- [`components/stages/story-structure.tsx:323`](components/stages/story-structure.tsx:323)
- [`components/stages/story-structure.tsx:372`](components/stages/story-structure.tsx:372)

非 AI 版就是直接选卡片：

- [`components/stages/story-structure-no-ai.tsx:38`](components/stages/story-structure-no-ai.tsx:38)
- [`components/stages/story-structure-no-ai.tsx:41`](components/stages/story-structure-no-ai.tsx:41)

### 3. Writing

AI 版核心是“逐 section 通关”：

- 当前 section 输入超过 10 个字符后，2 秒 debounce 调 `/api/dify-writing-evaluation`。
- 评估通过后才会把该 section 标成 `done`。
- 向后切 section 时，会阻止跳过未完成 section。
- 最终要求所有 section 完成，并且总字数至少 20。

参考：

- [`components/stages/guided-writing.tsx:149`](components/stages/guided-writing.tsx:149)
- [`components/stages/guided-writing.tsx:243`](components/stages/guided-writing.tsx:243)
- [`components/stages/guided-writing.tsx:275`](components/stages/guided-writing.tsx:275)
- [`app/api/dify-writing-evaluation/route.ts:165`](app/api/dify-writing-evaluation/route.ts:165)

非 AI 版没有逐 section 评估：

- 所有 section 只要都有内容即可。
- 最终总字数至少 50。

参考：

- [`components/stages/guided-writing-no-ai.tsx:52`](components/stages/guided-writing-no-ai.tsx:52)
- [`components/stages/guided-writing-no-ai.tsx:73`](components/stages/guided-writing-no-ai.tsx:73)

## Important Architecture Issue

当前 `plot` 聊天看起来像连续对话，但实际上没有真正把历史消息传给后端模型：

- 前端调用 `/api/dify-chat` 时没有传 `history`，只传了 `message` 和 `conversation_id`。
- 后端只有在收到 `history` 时才会把旧消息塞进模型上下文。
- `conversation_id` 目前只被记录和原样返回，不参与 DeepSeek 对话记忆。

参考：

- [`components/stages/plot-brainstorm.tsx:228`](components/stages/plot-brainstorm.tsx:228)
- [`components/stages/plot-brainstorm.tsx:266`](components/stages/plot-brainstorm.tsx:266)
- [`app/api/dify-chat/route.ts:12`](app/api/dify-chat/route.ts:12)
- [`app/api/dify-chat/route.ts:31`](app/api/dify-chat/route.ts:31)
- [`app/api/dify-chat/route.ts:57`](app/api/dify-chat/route.ts:57)

这个问题如果不先修，新的 chatbot 只会把“多页面 UI”换成“单页面 UI”，不会真正变成可靠的连续对话。

还有一个次一级问题：`/api/dify-plot-summary` 虽然接收完整 `conversation_history`，但发给模型的 prompt 只用了“最后一条学生消息”和消息数量；完整历史主要只在本地 fallback 提取里使用。

参考：

- [`app/api/dify-plot-summary/route.ts:75`](app/api/dify-plot-summary/route.ts:75)
- [`app/api/dify-plot-summary/route.ts:98`](app/api/dify-plot-summary/route.ts:98)
- [`app/api/dify-plot-summary/route.ts:109`](app/api/dify-plot-summary/route.ts:109)

这代表新的 chatbot 更稳的做法是：

- 用对话持续更新 `plot` slots
- 用摘要 API 做辅助提取
- 最终以累积 state 为准，而不是把单次 LLM 抽取结果当唯一真相

## Recommended Target Design

### Single Chatbot Shell

新增一个统一组件，例如：

- `components/stages/story-chatbot.tsx`

它只负责：

- 渲染对话消息
- 渲染内嵌的结构化控件
- 维护一个统一的 `chatbotState`
- 根据当前 phase 调用对应 handler

建议状态模型：

```ts
type StoryChatPhase = "plot" | "structure" | "writing" | "review"

interface StoryChatbotState {
  phase: StoryChatPhase
  mode: "ai" | "manual"
  messages: Array<{
    role: "assistant" | "user" | "system"
    content: string
    kind?: "text" | "plot-summary" | "structure-options" | "writing-feedback"
  }>
  plot: {
    setting: string
    conflict: string
    goal: string
  }
  structure: {
    type: "freytag" | "threeAct" | "fichtean" | null
    outline: string[]
    examples?: Array<{
      type: string
      story: string
      imageUrl: string
    }>
  }
  writing: {
    currentSection: number
    sectionTexts: Record<number, string>
    sectionDone: Record<number, boolean>
    feedbackBySection: Record<number, string>
    totalWords: number
  }
}
```

### UI Principle

chatbot 不应该只显示纯文本气泡。需要把现有结构化能力嵌进对话流：

- `plot`: 在消息下方显示 `setting / conflict / goal` 实时摘要卡
- `structure`: 在消息流中插入 3 张结构选择卡，必要时展开 AI 示例故事和图片
- `writing`: 在消息流中插入当前 section 编辑器、进度条、反馈卡和 “Next section” 按钮

这比把三个旧页面塞进 iframe 式容器更稳，因为真正的控制点在状态机，不在页面跳转。

## How To Preserve Existing Behavior

### Plot In Chatbot

AI 模式：

- assistant 用提问方式推进。
- 每次学生回复后更新 transcript。
- 调用现有 `/api/dify-plot-summary` 来更新三格。
- 三格齐全后，不自动跳下一步，而是在对话里发一条确认消息：
  `Here is your plot: setting / conflict / goal. Continue or edit?`

手动模式：

- 不再切到独立表单页。
- assistant 依次追问 `setting -> conflict -> goal`。
- 也可以在气泡里插入三格小表单，但仍然留在同一个聊天界面。
- 校验逻辑保持与现在一致：三格非空即可。

### Structure In Chatbot

建议把当前 AI 版的两条路径显式化：

- 默认先发 3 张结构卡，让学生可以直接选。
- 再给一个二级动作：`Show me examples`
- 点了才去调用 `/api/dify-structure-examples` 和 `/api/generate-image`

这样比现在更直观，因为它和当前真实代码一致：当前 AI 版并不是强制先生成示例，而是已经允许直接选。

手动模式：

- 同一套结构卡直接复用。
- 不需要单独页面。

### Writing In Chatbot

建议不要把现有大 textarea 页面整体搬进聊天，而是改成“当前 section 编辑器 + 对话反馈”：

- assistant 明确当前 section，例如 `Now write the Setup section.`
- 学生写完一段，点击 `Check this section` 或停顿后自动评估
- AI 模式继续复用 `/api/dify-writing-evaluation`
- 评估通过后 assistant 回复 `You can move on...`，并激活 `Next section`
- 非 AI 模式不做 AI 评估，只在本地检查：
  - 当前 section 非空
  - 最终所有 section 非空
  - 最终总字数 >= 50

这样可以保留现有规则，但交互会从“切 tab 写作器”变成“对话驱动的分段写作”。

## Recommended Refactor Order

### Step 1. Extract Shared Domain Logic

先把 UI 组件里的业务判断抽出来，避免新 chatbot 再复制一遍：

- `lib/story/plot.ts`
  - `normalizePlotField`
  - `canCompletePlot`
- `lib/story/structure.ts`
  - `STRUCTURES`
  - `getStructureByType`
- `lib/story/writing.ts`
  - `countWords`
  - `canAdvanceSection`
  - `canPublishStory`

### Step 2. Fix Real Conversation Memory

至少做其中一个：

- 方案 A：前端调用 `/api/dify-chat` 时始终传完整 `history`
- 方案 B：新增 `story-chatbot` API，由服务端统一维护和裁剪历史

如果不做这一步，chatbot 只是假聊天。

### Step 3. Build A Chat Orchestrator

建议新增一个 route，例如：

- `app/api/story-chatbot/route.ts`

职责：

- 接收当前 `chatbotState`、用户输入、当前 phase
- 决定下一条 assistant 消息
- 决定是否触发 plot summary / structure example / writing evaluation
- 返回结构化 UI payload，而不只是纯文本

建议返回格式：

```ts
{
  phase: "plot" | "structure" | "writing" | "review",
  message: string,
  uiAction?: {
    type:
      | "update_plot"
      | "show_structure_options"
      | "show_structure_examples"
      | "update_writing_feedback"
      | "unlock_next_section"
  },
  storyStatePatch?: Partial<StoryState>,
  meta?: Record<string, unknown>
}
```

### Step 4. Replace Stage Routing Incrementally

不要一次删旧组件。建议分两层：

- 第一阶段：`app/page.tsx` 新增 `stage === "storyChatbot"`
- 第二阶段：只把 `plot / structure / writing` 入口导向 chatbot
- 第三阶段：旧页面保留为 fallback，确认数据和埋点稳定后再下线

## What Can Be Reused Immediately

可以直接复用：

- `StoryState` 数据结构
- `STRUCTURES` 常量
- `/api/dify-plot-summary`
- `/api/dify-structure-examples`
- `/api/dify-writing-evaluation`
- `/api/interactions` 持久化

不建议原样复用：

- `PlotBrainstorm` 的对话状态管理
- `StoryStructure` 的整页翻页 UI
- `GuidedWriting` 的整页布局

原因不是功能不对，而是它们把“业务判断”和“页面展示”绑得太紧。

## Suggested MVP

如果目标是尽快验证 chatbot 价值，最稳的 MVP 是：

1. 先只整合 `plot + structure + writing`，不改 `character`
2. 统一成一个 `StoryChatbot` 页面
3. `plot` 保留摘要逻辑
4. `structure` 默认直接展示 3 张结构卡，`show examples` 作为可选动作
5. `writing` 改成单 section 对话写作
6. 评估和持久化继续用现有 API

这样改动面最小，但已经能让用户感知到“整个写作过程都在和一个助手对话”。

## Main Risks

- `dify-chat` 目前没有真实上下文记忆，必须先修。
- 现有 `plot`、`writing` 组件里有不少 UI 状态和业务状态耦合，直接复用会让 chatbot 组件非常重。
- `structure` 的图片生成较慢，chatbot 里必须做异步占位，不然会卡住对话节奏。
- `interactions` 现在按 stage 存；如果合并成单页面，需要决定是继续分 stage 存，还是新增 `storyChatbot` stage 并附带 phase。

## Recommendation

推荐方向不是“把三个现有页面包进一个聊天容器”，而是：

- 抽离三段的准入规则和 API 调用
- 新建一个真正有状态机的 `StoryChatbot`
- 用聊天消息承载流程，用内嵌卡片/编辑器承载结构化输入

这样才能既保留现在的教学逻辑，又让学生感觉自己是在和一个连续的写作教练合作，而不是在三个工具页之间来回跳。
