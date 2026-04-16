# Logic Park - 多游戏集合平台

> 版本：2.0  
> 更新日期：2026-04-16  
> 状态：平台架构已完成，摩天轮游戏已集成

---

## 项目简介

Logic Park 是一个儿童益智游戏集合平台，采用游戏插件化架构，将原本单一的摩天轮游戏扩展为可容纳多个独立游戏的平台系统。

### 核心特性

- **游戏插件化架构** - 平台层与游戏层分离，支持动态加载和管理多个独立游戏
- **统一路由系统** - 基于 Hash 路由，支持浏览器前进/后退
- **独立存储空间** - 每个游戏拥有独立的命名空间，数据互不干扰
- **共享基础设施** - 音效系统、存储系统、路由系统等平台层服务
- **响应式设计** - 适配桌面和移动设备

---

## 技术架构

### 目录结构

```
Logic-Park/
├── index-new.html              # 平台入口页面
├── style.css                   # 全局样式
├── js/
│   ├── platform/               # 平台层（共享基础设施）
│   │   ├── core/
│   │   │   ├── router.js       # 游戏路由管理
│   │   │   ├── storage.js      # 多游戏存储系统
│   │   │   └── sound.js        # 通用音效系统
│   │   ├── ui/
│   │   │   └── home.js         # 首页渲染
│   │   └── main.js             # 平台入口
│   │
│   └── games/                  # 游戏层（独立插件）
│       └── ferris-wheel/       # 摩天轮游戏
│           ├── index.js        # 游戏入口（1460+ 行）
│           ├── config.js       # 游戏配置
│           ├── core/           # 核心逻辑
│           │   ├── constants.js
│           │   └── questions.js
│           ├── game/           # 游戏逻辑
│           │   └── wheel.js
│           └── animation/      # 动画系统
│               └── wheel-animation.js
```

### 平台层架构

#### 路由系统 (`js/platform/core/router.js`)

- **Hash 路由**：`#/` (首页) 和 `#/games/:gameId` (游戏页)
- **浏览器历史**：支持前进/后退按钮
- **生命周期管理**：自动调用游戏的 `mount()` 和 `unmount()` 方法
- **初始化顺序**：
  1. `router.init()` - 初始化路由系统，绑定事件监听
  2. 注册所有游戏
  3. `router.start()` - 处理初始 URL，显示对应页面

#### 存储系统 (`js/platform/core/storage.js`)

- **命名空间隔离**：存储键格式 `logic-park-games.{gameId}`
- **自动迁移**：兼容旧版存储格式，自动迁移数据
- **统一接口**：提供 `loadProgress()`, `saveProgress()`, `exportProgress()`, `importProgress()` 等方法

#### 音效系统 (`js/platform/core/sound.js`)

- **全局音效开关**：统一管理所有游戏的音效
- **音效播放**：提供 `playSound()` 方法，支持多种音效类型

### 游戏插件接口

每个游戏必须实现以下接口：

```javascript
{
  // 游戏元数据
  id: 'game-id',              // 唯一标识符
  name: '游戏名称',
  description: '游戏描述',
  icon: '🎡',                 // Emoji 图标
  category: 'logic',          // 分类：logic, puzzle, memory, math, spatial
  ageRange: '5-8岁',
  difficulty: 'easy',         // 难度：easy, medium, hard
  
  // 生命周期方法
  async mount(container) {
    // 挂载游戏到容器
    // 1. 注入 HTML 结构
    // 2. 缓存 DOM 元素
    // 3. 初始化状态
    // 4. 加载进度
    // 5. 绑定事件
    // 6. 渲染初始页面
  },
  
  async unmount() {
    // 卸载游戏
    // 1. 清除定时器和动画
    // 2. 保存进度
    // 3. 解绑事件监听器
    // 4. 清空容器
  }
}
```

---

## 已完成的游戏

### 摩天轮乐园 (Ferris Wheel)

**游戏简介**：跟着小动物坐摩天轮，学会顺序观察和位置推理

**核心功能**：
- 12 种题型，60 道关卡
- 分步讲解系统
- 星级评价（1-3 星）
- 进度保存和导出/导入
- 提示系统
- 场景控制（转动方向、速度、圈数、格数）

**技术实现**：
- 游戏类：`FerrisWheelGame` (1460+ 行代码)
- 生命周期管理：完整的 `mount()` / `unmount()` 实现
- 状态管理：独立的游戏状态对象
- 事件管理：统一的事件监听器注册和清理
- 页面导航：地图页、游戏页、进度页

**导航结构**：
- **← 返回平台** - 返回 Logic Park 平台首页
- **地图** - 查看游戏关卡地图
- **进度** - 查看学习进度
- **🔊** - 音效开关

---

## 使用指南

### 启动平台

1. 打开 `index-new.html` 文件
2. 平台首页显示所有可用游戏的卡片
3. 点击游戏卡片进入对应游戏

### 游戏导航

- **进入游戏**：从平台首页点击游戏卡片
- **返回平台**：点击游戏内的"← 返回平台"按钮
- **浏览器导航**：支持浏览器的前进/后退按钮

### 进度管理

- **自动保存**：游戏进度自动保存到浏览器本地存储
- **导出进度**：在游戏的"进度"页面点击"导出进度"按钮
- **导入进度**：在游戏的"进度"页面点击"导入进度"按钮

---

## 开发指南

### 添加新游戏

1. **创建游戏目录**：`js/games/your-game/`

2. **创建游戏配置**：`js/games/your-game/config.js`
   ```javascript
   export default {
     id: 'your-game',
     name: '游戏名称',
     description: '游戏描述',
     icon: '🎮',
     category: 'puzzle',
     ageRange: '6-10岁',
     difficulty: 'medium',
     
     async mount(container) {
       const { YourGame } = await import('./index.js');
       this._instance = new YourGame();
       await this._instance.mount(container);
     },
     
     async unmount() {
       if (this._instance) {
         await this._instance.unmount();
         this._instance = null;
       }
     }
   };
   ```

3. **创建游戏入口**：`js/games/your-game/index.js`
   ```javascript
   export class YourGame {
     constructor() {
       this._container = null;
       this._state = null;
       this._eventListeners = [];
     }
     
     async mount(container) {
       this._container = container;
       // 注入 HTML
       container.innerHTML = this._generateHTML();
       // 初始化状态
       this._initState();
       // 绑定事件
       this._bindEvents();
       // 渲染页面
       this._render();
     }
     
     async unmount() {
       // 清理资源
       this._eventListeners.forEach(({ element, type, handler }) => {
         element.removeEventListener(type, handler);
       });
       this._eventListeners = [];
       this._container = null;
     }
     
     // ... 其他游戏逻辑
   }
   ```

4. **注册游戏**：在 `js/platform/main.js` 中注册
   ```javascript
   import yourGameConfig from '../games/your-game/config.js';
   
   function registerGames() {
     router.register(yourGameConfig);
     // ... 其他游戏
   }
   ```

### 存储数据

使用平台提供的存储系统：

```javascript
import { loadProgress, saveProgress } from '../../platform/core/storage.js';

// 加载进度
const progress = loadProgress(LEVELS, 'your-game-id');

// 保存进度
saveProgress(progress, 'your-game-id');
```

### 音效系统

使用平台提供的音效系统：

```javascript
import SoundManager from '../../platform/core/sound.js';

// 初始化
SoundManager.init();

// 播放音效
SoundManager.playSound('correct');
SoundManager.playSound('wrong');
SoundManager.playSound('click');
```

---

## 关键修复记录

### 问题 #1：路由初始化时机错误

**现象**：页面加载时控制台报错"未找到游戏: ferris-wheel"

**原因**：`router.init()` 立即处理 URL hash，但此时游戏尚未注册

**解决方案**：
- 将 `router.init()` 中的初始路由处理移到新增的 `router.start()` 方法
- 在 `main.js` 中游戏注册完成后调用 `router.start()`

**修改文件**：
- `js/platform/core/router.js:22-38`
- `js/platform/main.js:39-60`

### 问题 #2：游戏内导航混乱

**现象**：点击"游戏首页"按钮后页面空白

**原因**：游戏 HTML 结构中没有 `screen-home` 页面

**解决方案**：
- 移除"游戏首页"按钮
- 添加"← 返回平台"按钮，通过修改 URL hash 返回平台首页

**修改文件**：
- `js/games/ferris-wheel/index.js:90-96` (导航栏 HTML)
- `js/games/ferris-wheel/index.js:290` (DOM 缓存)
- `js/games/ferris-wheel/index.js:365-373` (事件绑定)

### 问题 #3：游戏加载后默认页面不显示

**现象**：从平台点击进入摩天轮游戏后，页面空白

**原因**：虽然 `_initState()` 设置了 `currentScreen: 'map'`，但初始化时没有调用 `_navigateTo()` 来设置页面的 `is-active` CSS 类

**解决方案**：
- 在 `mount()` 方法的初始渲染后调用 `_navigateTo(this._state.currentScreen)`

**修改文件**：
- `js/games/ferris-wheel/index.js:1437-1440`

---

## 技术栈

- **前端框架**：原生 JavaScript (ES6 模块)
- **路由**：Hash 路由
- **存储**：LocalStorage
- **样式**：CSS3
- **构建工具**：Vite (可选)

---

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 后续规划

### 短期目标（Stage 3）

- [ ] 添加第二个游戏（拼图挑战或记忆翻牌）
- [ ] 验证架构的可扩展性

### 中期目标

- [ ] 游戏分类筛选
- [ ] 成就系统
- [ ] 全局进度统计页面

### 长期目标

- [ ] 游戏加载动画
- [ ] 游戏预览缩略图
- [ ] 响应式布局优化（移动端）
- [ ] Service Worker 离线支持

---

## 贡献指南

欢迎贡献新游戏或改进现有功能！

### 提交规范

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `refactor:` 代码重构
- `style:` 代码格式调整
- `test:` 测试相关
- `chore:` 构建/工具相关

---

## 许可证

MIT License

---

## 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。

---

**最后更新**：2026-04-16  
**维护者**：开发团队
