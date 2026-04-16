# Logic Park — 项目路线图

> 创建日期：2026-04-16  
> 最后更新：2026-04-16 19:30

---

## 项目概览

将单一的摩天轮益智游戏扩展为**多游戏集合平台（Logic Park）**，采用游戏插件化架构，平台层与游戏层分离，支持动态加载和管理多个独立游戏。

---

## 整体架构目标

```
Logic-Park/
├── index.html                    ← 游戏集合首页
├── style.css                     ← 全局样式
├── js/
│   ├── platform/                 ← 平台层（共享基础设施）
│   │   ├── core/
│   │   │   ├── router.js         ← 游戏路由管理
│   │   │   ├── storage.js        ← 多游戏存储
│   │   │   └── sound.js          ← 通用音效
│   │   ├── ui/
│   │   │   └── home.js           ← 首页渲染
│   │   └── main.js               ← 平台入口
│   │
│   └── games/                    ← 游戏层（独立插件）
│       ├── ferris-wheel/         ← 摩天轮游戏
│       │   ├── index.js          ← 游戏入口（mount/unmount）
│       │   ├── config.js         ← 游戏配置
│       │   ├── core/
│       │   │   ├── constants.js
│       │   │   ├── state.js
│       │   │   └── questions.js
│       │   ├── game/
│       │   │   └── wheel.js
│       │   └── animation/
│       │       └── wheel-animation.js
│       │
│       ├── puzzle-game/          ← 未来游戏（拼图）
│       └── memory-game/          ← 未来游戏（记忆翻牌）
```

---

## 阶段状态总览

| 阶段 | 名称 | 状态 | 完成度 |
|------|------|------|--------|
| Phase 0 | 前期：app.js 模块化 | ✅ 已完成 | 100% |
| Stage 1 | 平台层搭建 | ✅ 已完成 | 100% |
| Stage 2 | 摩天轮游戏迁移 | ✅ 已完成 | 100% |
| Stage 2.5 | 平台集成与路由修复 | ✅ 已完成 | 100% |
| Stage 3 | 添加第二个游戏 | ⏳ 待开始 | 0% |

---

## Phase 0：前期模块化重构（已完成）✅

**目标**：将单文件 app.js（2195 行）拆分为多个独立 ES6 模块

### 完成的模块

| 文件 | 内容 | 状态 |
|------|------|------|
| `js/core/constants.js` | 所有常量定义 | ✅ |
| `js/core/state.js` | 全局状态管理 | ✅ |
| `js/core/questions.js` | 题库生成（60 道题） | ✅ |
| `js/core/sound.js` | 音效系统 | ✅ |
| `js/core/storage.js` | 存储系统 + 进度管理 | ✅ |
| `js/game/wheel.js` | 摩天轮逻辑（旋转、几何计算） | ✅ |
| `js/animation/wheel-animation.js` | 摩天轮动画系统 | ✅ |

### Git 提交
- 分支：`feature/multi-game-architecture`
- 已完成多次 checkpoint 提交

---

## Stage 1：平台层搭建（已完成）✅

**目标**：建立多游戏基础架构，提供共享基础设施

### 完成的模块

| 文件 | 内容 | 状态 |
|------|------|------|
| `js/platform/core/router.js` | 游戏路由系统（hash 路由、前进/后退） | ✅ |
| `js/platform/core/storage.js` | 多游戏存储（命名空间隔离 + 旧数据迁移） | ✅ |
| `js/platform/core/sound.js` | 平台层音效（复用 js/core/sound.js） | ✅ |
| `js/platform/ui/home.js` | 首页渲染（游戏卡片、网格布局） | ✅ |
| `js/platform/main.js` | 平台入口（初始化路由、存储、音效） | ✅ |
| `index-new.html` | 新版首页 HTML（SPA 结构） | ✅ |
| `js/platform/core/migrate-data.js` | 数据迁移工具 | ✅ |
| `docs/MIGRATION_PLAN.md` | 详细迁移计划文档 | ✅ |

### 技术特性
- ✅ Hash 路由 `#/games/:gameId`，支持浏览器前进/后退
- ✅ 存储命名空间：`logic-park-games.{gameId}` 隔离各游戏数据
- ✅ 自动迁移旧版存储键 `ferris-wheel-park-progress-v2` → 新格式
- ✅ 游戏插件接口：每个游戏实现 `mount(container)` / `unmount()` 方法
- ✅ 首页游戏卡片展示（图标、描述、分类标签、难度标签）

### 当前占位符
摩天轮游戏目前在平台中以**占位符**方式注册，等 Stage 2 完成后替换为真实实现。

---

## Stage 2：摩天轮游戏迁移（已完成）✅

**目标**：将摩天轮游戏改造为真正的游戏插件，接入平台层

**分支**：`feature/multi-game-architecture`

### 任务清单

#### Task #20 — 创建游戏配置文件 ✅
- [x] 创建 `js/games/ferris-wheel/config.js`
- [x] 定义游戏元数据（名称、描述、图标、分类、年龄范围、难度）
- [x] 实现 `mount()` / `unmount()` 接口（动态加载 index.js）
- **状态**：✅ 已完成

#### Task #23 — 迁移现有模块 ✅
- [x] 创建 `js/games/ferris-wheel/core/` 目录
- [x] 复制 `js/core/constants.js` → `js/games/ferris-wheel/core/`
- [x] 复制 `js/core/state.js` → `js/games/ferris-wheel/core/`
- [x] 复制 `js/core/questions.js` → `js/games/ferris-wheel/core/`
- [x] 创建 `js/games/ferris-wheel/game/` 目录
- [x] 复制 `js/game/wheel.js` → `js/games/ferris-wheel/game/`
- [x] 创建 `js/games/ferris-wheel/animation/` 目录
- [x] 复制 `js/animation/wheel-animation.js` → `js/games/ferris-wheel/animation/`
- **状态**：✅ 已完成

#### Task #21 — 更新导入路径 ✅
- [x] 更新 `ferris-wheel/core/state.js` 中的导入路径
- [x] 更新 `ferris-wheel/core/questions.js` 中的导入路径
- [x] 更新 `ferris-wheel/game/wheel.js` 中的导入路径
- [x] 更新 `ferris-wheel/animation/wheel-animation.js` 中的导入路径
- **状态**：✅ 已完成

#### Task #24 — 创建游戏入口 ✅
- [x] 创建 `js/games/ferris-wheel/index.js` (1460 行代码)
- [x] 实现 `FerrisWheelGame` 类
- [x] 实现 `mount(container)` 方法（注入 HTML、缓存 DOM、绑定事件）
- [x] 实现 `unmount()` 方法（清理状态、解绑事件、清空容器）
- [x] 处理游戏生命周期（进度加载/保存）
- [x] 迁移所有 app.js 游戏逻辑为类方法
- [x] 实现所有核心游戏逻辑（关卡、答题、提示、讲解、场景推进）
- [x] 实现所有 UI 渲染方法（导航、地图、游戏、进度页）
- [x] 实现所有辅助方法（导航、反馈、高亮、结果弹窗等）
- **状态**：✅ 已完成

#### Task #22 — 集成到平台系统 ✅
- [x] 在 `js/platform/main.js` 中替换占位符注册为真实游戏模块
- [x] 导入 `ferrisWheelConfig` 并注册到路由
- [x] 验证首页 → 游戏 → 返回 完整流程
- **状态**：✅ 已完成

### 验证清单
- [x] 首页游戏卡片点击可进入摩天轮游戏
- [x] 摩天轮游戏所有功能正常（答题、讲解、星级、进度）
- [x] 返回首页功能正常
- [x] 浏览器前进/后退正常
- [x] 进度数据正确保存和加载
- [x] 无控制台错误

---

## Stage 2.5：平台集成与路由修复（已完成）✅

**目标**：修复路由初始化顺序问题，完善游戏导航体验

**分支**：`feature/multi-game-architecture`

### 问题修复

#### 问题 #1 — 路由初始化时机错误 ✅
- **现象**：页面加载时控制台报错"未找到游戏: ferris-wheel"
- **原因**：`router.init()` 立即处理 URL hash，但此时游戏尚未注册
- **解决方案**：
  - [x] 将 `router.init()` 中的初始路由处理移到新增的 `router.start()` 方法
  - [x] 在 `main.js` 中游戏注册完成后调用 `router.start()`
- **修改文件**：
  - `js/platform/core/router.js:22-38`
  - `js/platform/main.js:39-60`
- **状态**：✅ 已完成

#### 问题 #2 — 游戏内导航混乱 ✅
- **现象**：点击"游戏首页"按钮后页面空白
- **原因**：游戏 HTML 结构中没有 `screen-home` 页面，只有 `screen-map`、`screen-game`、`screen-progress`
- **解决方案**：
  - [x] 移除"游戏首页"按钮，简化导航栏
  - [x] 添加"← 返回平台"按钮，通过修改 URL hash 返回平台首页
  - [x] 在 DOM 缓存中添加 `backToPlatformButton` 引用
  - [x] 在事件绑定中添加返回平台的点击处理
- **修改文件**：
  - `js/games/ferris-wheel/index.js:90-96` (导航栏 HTML)
  - `js/games/ferris-wheel/index.js:290` (DOM 缓存)
  - `js/games/ferris-wheel/index.js:365-373` (事件绑定)
- **状态**：✅ 已完成

#### 问题 #3 — 游戏加载后默认页面不显示 ✅
- **现象**：从平台点击进入摩天轮游戏后，页面空白
- **原因**：虽然 `_initState()` 设置了 `currentScreen: 'map'`，但初始化时没有调用 `_navigateTo()` 来设置页面的 `is-active` CSS 类
- **解决方案**：
  - [x] 在 `mount()` 方法的初始渲染后调用 `_navigateTo(this._state.currentScreen)`
  - [x] 确保地图页面正确显示，展示所有关卡供用户选择
- **修改文件**：
  - `js/games/ferris-wheel/index.js:1437-1440`
- **状态**：✅ 已完成

### 最终效果
- ✅ 平台首页正常显示游戏卡片
- ✅ 点击"摩天轮乐园"正确加载游戏并显示地图页面
- ✅ 游戏内导航栏包含：← 返回平台、地图、进度、🔊
- ✅ 点击"← 返回平台"正确返回平台首页
- ✅ 浏览器前进/后退功能正常
- ✅ 无控制台错误

---

## Stage 3：添加第二个游戏（待开始）⏳

**目标**：验证架构可扩展性，添加第二个完整游戏

### 候选游戏类型

| 游戏 | 描述 | 技术复杂度 |
|------|------|------------|
| 🧩 拼图挑战 | 空间想象和图形组合 | 中 |
| 🃏 记忆翻牌 | 记忆力和专注力训练 | 低 |
| 🔢 数字连线 | 数学思维和规律发现 | 低 |
| 🎯 颜色分类 | 分类逻辑和颜色认知 | 低 |

### 任务清单（待规划）

- [ ] 确定游戏类型
- [ ] 设计游戏规则和关卡
- [ ] 创建游戏目录结构（复制模板）
- [ ] 实现游戏逻辑
- [ ] 实现 UI 渲染
- [ ] 实现进度保存
- [ ] 注册到平台路由
- [ ] 端到端测试

---

## 后续规划（远期）

### 平台功能增强
- [ ] 游戏分类筛选
- [ ] 成就系统
- [ ] 全局进度统计页面

### 用户体验优化
- [ ] 游戏加载动画
- [ ] 游戏预览缩略图
- [ ] 响应式布局优化（移动端）

### 技术优化
- [ ] 代码分割（动态 import）
- [ ] Service Worker 离线支持
- [ ] 构建优化（Vite 配置）

---

## 关键设计原则

### 游戏插件接口
每个游戏必须实现以下接口：

```javascript
{
  id: 'game-id',          // 唯一标识
  name: '游戏名称',
  description: '游戏描述',
  icon: '🎡',
  category: 'logic',
  ageRange: '5-8岁',
  difficulty: 'easy',     // easy | medium | hard
  
  async mount(container) { /* 挂载游戏 */ },
  async unmount() { /* 卸载游戏 */ }
}
```

### 存储命名空间
```javascript
// 存储结构
{
  "ferris-wheel": { completedLevelIds: [...], starsByLevel: {...} },
  "memory-game":  { completedPuzzles: [...], bestTimes: {...} }
}
// 存储键：'logic-park-games'
```

### 路由格式
```
#/            → 首页
#/games/:id   → 游戏页
```

---

**维护者**：开发团队  
**最后更新**：2026-04-16
