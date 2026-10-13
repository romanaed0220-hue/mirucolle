# ミルコレ（パレイドリア／見立て App）

先に描く、それから見る。日常の「何かに見える」瞬間を、指でなぞった「形」として集める手机网页 App（毕业设计）。

- 测试者用：`https://<GitHub 用户名>.github.io/mirucolle/`（`main` 分支）
- 作者自测用：`https://<GitHub 用户名>.github.io/mirucolle/dev/`（`dev` 分支）

## 本地开发
```bash
npm install
npm run dev      # 本地预览（--host：同一 Wi-Fi 的手机也能打开，但相机/陀螺仪需要 HTTPS，要用 /dev/ 网址测）
npm run build    # 类型检查 + 构建到 dist/
```

## 目录
```
src/
  main.tsx, app.tsx, router.ts   入口、画面切换（hash 路由）
  screens/                       記録・収集・つながり・裏世界
  components/                    顶栏、底部导航、マイページ抽屉、背景几何装饰
  data/storage.ts                本地保存（带版本号与迁移）
  config/env.ts                  环境（prod / dev / local）与保存前缀
  styles/tokens.css              设计 token（メンフィス配色、裏世界主题）
public/                          manifest、图标
design/                          视觉风格比较页（G＝メンフィス 为采用案）
docs/                            规格与流程（改需求先改这里）
.github/workflows/deploy.yml     push 到 main/dev 时自动发布到 GitHub Pages
```

技术：Vite + Preact + TypeScript，Lucide 图标。注意 Preact 11 的内联 `style` 不会给数字自动加 `px`，尺寸写在 CSS 里。
