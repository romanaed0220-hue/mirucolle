# ミルコレ（パレイドリア／見立て App）—— 交给 Claude Code 的交付包

```
pareidolia-app-handoff/
├── CLAUDE.md                          Claude Code 的工作指引（放在项目根目录即自动加载）
├── README.md                          本文件
└── docs/
    ├── 01-app-spec.md                 完整需求规格（概念、屏幕、功能、技术、验证）
    ├── 02-design-principles.md        硬性约束、已否决方向、措辞规则
    ├── 03-feedback-log.md             四次会议的反馈与设计演变
    ├── 04-open-questions-and-roadmap.md  未定事项、调研项、实现路线、验收要点
    ├── 05-dev-and-test-workflow.md    发布链路、分支、真机测试与测试期节奏
    └── source/                        原始会议记录 PDF（进捗1/2/3、中間発表）
```

## 使用方式
1. 解压后在该文件夹里启动 Claude Code。
2. 第一句可以直接说：「读完 CLAUDE.md 和 docs/，按 04 里的路线先搭骨架和发布链路，并先给我 2–3 个视觉风格方向。」

## 注意
- 技术约定已改为：纯静态前端（不再要求单文件）、手机真机 + GitHub Pages 测试，详见规格第 7 节。
- 旧版 HTML 原型（図鑑概念，已废弃）和玻璃瓶物理 demo 的代码**不在本包内**，它们只出现在 Project 的对话里。新概念要求重建，从头实现即可；想参考的话请额外放进 `reference/` 目录（见规格 7.6）。
- 会议记录为语音转写，存在识别错误；规格文档里已对明显错误做了解释并标注【假设】。
