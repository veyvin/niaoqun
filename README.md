# AeroFlock — AI 鸟群模拟

> 基于 Boids 群体智能算法的多族群鸟群行为可视化与 AI 行为分析平台

## 项目简介

AeroFlock 是一个交互式的**鸟群行为模拟器**，实现了经典的 Boids 算法（Reynolds, 1987），并结合 Google Gemini AI 对群体涌现行为进行智能解读。

每个个体（boid）仅遵循三条简单的局部规则，却能涌现出令人惊叹的复杂群体行为：

- **分离（Separation）**：避免与邻近个体（不论族群）发生碰撞
- **对齐（Alignment）**：与同族群同伴的飞行方向保持一致
- **凝聚（Cohesion）**：向同族群同伴的中心位置靠拢

通过调整参数权重，你可以观察到从「有序迁徙」到「混沌盘旋」等多种涌现状态。

## 在线演示

访问 [https://veyvin.com/niaoqun](https://veyvin.com/niaoqun) 体验在线演示。

## 特性

- **多族群共模拟**：同时模拟多个鸟群（如「红雀」「蓝燕」），不同族群互相避让但只跟随本族群
- **可调物理参数**：分离 / 对齐 / 凝聚力度、最大速度、感知范围
- **双边界模式**：`Wrap`（有界循环，鸟群在边界穿越）与 `Infinite`（无限空间，鸟群自由扩散）
- **2D 画布渲染**：原生 Canvas 2D，自带平移 / 缩放交互
- **3D 场景渲染**（`Scene3D`）：基于 `react-three-fiber` + `InstancedMesh` 的高性能 3D 鸟群
- **AI 行为分析**：点击分析按钮，让 Gemini 解读当前参数下预测的群体行为，并打上「有序 / 混沌 / 流体 / 静态」标签
- **参数平滑插值**：调整滑块时参数会平滑过渡，模拟不会跳变

## 截图

> 启动后默认呈现深色背景下的多色鸟群在 2D 空间中飞行，右侧为参数控制面板。

## 技术栈

| 类别       | 技术                                                     |
| ---------- | -------------------------------------------------------- |
| 框架       | React 19 + TypeScript                                    |
| 构建工具   | Vite 6                                                   |
| 样式       | Tailwind CSS（CDN 引入）                                 |
| 3D 渲染    | three.js · @react-three/fiber · @react-three/drei        |
| AI 能力    | @google/genai（Gemini 2.5 Flash）                        |

## 快速开始

### 环境要求

- Node.js（推荐 18+）
- 一个 Google Gemini API Key（用于「AI 行为分析」功能）

### 安装

```bash
npm install
```

### 配置环境变量

在项目根目录创建 `.env.local`：

```env
GEMINI_API_KEY=你的_Gemini_API_Key
```

> 提示：若仅体验鸟群模拟、不使用 AI 分析，可跳过此步骤；面板会显示「缺少 API Key」。

### 启动开发服务器

```bash
npm run dev
```

浏览器打开 Vite 输出的本地地址（默认 `http://localhost:5173`）即可。

### 构建生产版本

```bash
npm run build
npm run preview
```

## 项目结构

```
.
├── App.tsx                 # 顶层组件，挂载 Scene2D + Controls
├── index.html              # HTML 入口（内含 import map）
├── index.tsx               # React 渲染入口
├── components/
│   ├── Controls.tsx        # 右侧参数面板（滑块、族群、AI 分析按钮）
│   ├── Scene2D.tsx         # 2D Canvas 鸟群渲染 + 平移/缩放
│   └── Scene3D.tsx         # 3D 鸟群渲染（InstancedMesh + Stars）
├── services/
│   └── geminiService.ts    # 调用 Gemini 分析群体行为
├── utils/
│   └── math.ts             # Vec3 向量工具 + Boids 规则实现
├── types.ts                # Boid / Group / Params / AIAnalysisResult 类型
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 关键参数说明

| 参数             | 作用                                 | 取值范围 |
| ---------------- | ------------------------------------ | -------- |
| `separation`     | 避免碰撞的推力强度                   | 0 – 3    |
| `alignment`      | 与同伴方向对齐的权重                 | 0 – 3    |
| `cohesion`       | 靠近同伴的吸引权重                   | 0 – 3    |
| `maxSpeed`       | 个体最大速度                         | 1 – 10   |
| `perceptionRadius` | 个体能感知到的邻域半径             | 10 – 100 |
| `boundaryType`   | `wrap` 循环 / `infinite` 无限        | 二选一   |

## 开发建议

- 当前 `App.tsx` 默认挂载 `Scene2D`，如需切换到 3D，将 `App.tsx` 中 `<Scene2D …>` 替换为 `<Scene3D …>` 即可。
- 调整 `utils/math.ts` 中的 `updateBoid` 可以扩展规则（如加入捕食者、障碍物、风场等）。
- 大量 boid 时建议结合空间分区（如四叉树）以优化邻居查询性能。

## 致谢

- Boids 算法：[Craig Reynolds (1987)](https://www.red3d.com/cwr/boids/)
- 群体智能参考：复杂系统与涌现行为相关研究
