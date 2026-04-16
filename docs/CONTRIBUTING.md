# 贡献指南

感谢你对摩天轮乐园项目的关注！本文档将帮助你了解如何为项目做出贡献。

## 目录

- [开发环境设置](#开发环境设置)
- [项目结构](#项目结构)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [测试指南](#测试指南)
- [问题反馈](#问题反馈)

---

## 开发环境设置

### 前置要求

- Node.js 18+ 
- npm 9+
- Git

### 克隆项目

```bash
git clone https://github.com/mrity/Children-Games.git
cd Children-Games
```

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

---

## 项目结构

```
Ferris wheel/
├── index.html              # 主页面
├── app.js                  # 主应用逻辑
├── style.css               # 样式表
├── js/                     # JavaScript 模块
│   ├── core/              # 核心模块
│   │   ├── constants.js   # 配置常量
│   │   └── state.js       # 状态管理
│   ├── game/              # 游戏逻辑（规划中）
│   ├── ui/                # UI 模块（规划中）
│   └── storage/           # 存储模块（规划中）
├── data/                   # 数据文件（规划中）
│   └── questions.json     # 题库数据
├── docs/                   # 文档
│   ├── ARCHITECTURE.md    # 架构设计
│   ├── CONTRIBUTING.md    # 贡献指南
│   └── API.md             # API 文档
├── .github/
│   └── workflows/
│       └── deploy-pages.yml  # GitHub Pages 部署
├── package.json            # 项目配置
├── vite.config.js         # Vite 配置
├── .eslintrc.json         # ESLint 配置
└── .prettierrc.json       # Prettier 配置
```

---

## 开发流程

### 1. 创建分支

```bash
git checkout -b feature/your-feature-name
```

分支命名规范：
- `feature/` - 新功能
- `fix/` - Bug 修复
- `docs/` - 文档更新
- `refactor/` - 代码重构
- `style/` - 样式调整
- `test/` - 测试相关

### 2. 开发和测试

- 编写代码
- 运行 `npm run lint` 检查代码规范
- 运行 `npm run format` 格式化代码
- 在浏览器中测试功能

### 3. 提交代码

```bash
git add .
git commit -m "feat: add new feature"
```

### 4. 推送分支

```bash
git push origin feature/your-feature-name
```

### 5. 创建 Pull Request

1. 访问 GitHub 仓库
2. 点击 "New Pull Request"
3. 选择你的分支
4. 填写 PR 描述
5. 等待代码审查

---

## 代码规范

### JavaScript 规范

遵循 ESLint 配置：

```javascript
// ✅ 好的示例
function calculateStars(wrongAttempts) {
  if (wrongAttempts === 0) return 3;
  if (wrongAttempts === 1) return 2;
  return 1;
}

// ❌ 不好的示例
function calculateStars(wrongAttempts) {
  if(wrongAttempts==0)return 3
  if(wrongAttempts==1)return 2
  return 1
}
```

### CSS 规范

- 使用 CSS 变量定义颜色和尺寸
- 使用 BEM 命名规范（可选）
- 移动端优先的响应式设计

```css
/* ✅ 好的示例 */
.answer-button {
  min-height: 64px;
  padding: 14px 16px;
  background: var(--bg-card);
}

/* ❌ 不好的示例 */
.btn {
  height: 64px;
  padding: 14px 16px;
  background: #ffffff;
}
```

### HTML 规范

- 使用语义化标签
- 添加 ARIA 属性
- 确保可访问性

```html
<!-- ✅ 好的示例 -->
<button 
  class="answer-button" 
  aria-label="选择答案：位置1"
  tabindex="0">
  位置1
</button>

<!-- ❌ 不好的示例 -->
<div class="button" onclick="submit()">
  位置1
</div>
```

---

## 提交规范

使用 Conventional Commits 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具链相关

### 示例

```bash
# 新功能
git commit -m "feat: add sound effects for correct answers"

# Bug 修复
git commit -m "fix: resolve wheel animation glitch on mobile"

# 文档更新
git commit -m "docs: update README with new features"

# 重构
git commit -m "refactor: extract wheel animation logic to separate module"
```

---

## 测试指南

### 手动测试清单

在提交 PR 前，请确保以下功能正常：

#### 基础功能
- [ ] 页面导航（首页、地图、游戏、进度）
- [ ] 关卡选择和解锁
- [ ] 答题功能
- [ ] 提示系统
- [ ] 讲解系统
- [ ] 进度保存

#### 摩天轮功能
- [ ] 摩天轮转动（顺时针/逆时针）
- [ ] 座舱显示正确
- [ ] 排队区显示正确
- [ ] 动画流畅

#### 进度管理
- [ ] 进度自动保存
- [ ] 进度导出
- [ ] 进度导入
- [ ] 星级显示正确

#### 响应式设计
- [ ] 桌面端显示正常
- [ ] 平板端显示正常
- [ ] 手机端显示正常
- [ ] 横屏模式正常

#### 可访问性
- [ ] 键盘导航正常
- [ ] 屏幕阅读器支持
- [ ] 焦点可见性
- [ ] ARIA 标签正确

### 浏览器兼容性

测试以下浏览器：

- Chrome 最新版
- Firefox 最新版
- Safari 最新版
- Edge 最新版
- 移动端浏览器（iOS Safari, Chrome Mobile）

---

## 问题反馈

### 报告 Bug

在 [GitHub Issues](https://github.com/mrity/Children-Games/issues) 创建新 Issue，包含：

1. **问题描述**：清晰描述问题
2. **复现步骤**：如何触发问题
3. **预期行为**：应该发生什么
4. **实际行为**：实际发生了什么
5. **环境信息**：
   - 浏览器版本
   - 操作系统
   - 设备类型
6. **截图/录屏**：如果可能

### 功能建议

在 [GitHub Issues](https://github.com/mrity/Children-Games/issues) 创建新 Issue，包含：

1. **功能描述**：清晰描述建议的功能
2. **使用场景**：为什么需要这个功能
3. **实现建议**：如何实现（可选）
4. **替代方案**：其他可能的解决方案（可选）

---

## 代码审查

### 审查清单

作为审查者，请检查：

- [ ] 代码符合项目规范
- [ ] 功能实现正确
- [ ] 没有引入新的 Bug
- [ ] 性能没有明显下降
- [ ] 可访问性没有受影响
- [ ] 代码可读性良好
- [ ] 有必要的注释
- [ ] 提交信息清晰

### 审查建议

- 保持友好和建设性
- 提供具体的改进建议
- 解释为什么需要修改
- 认可好的代码

---

## 许可证

通过贡献代码，你同意你的贡献将在 MIT 许可证下发布。

---

## 联系方式

如有任何问题，欢迎通过以下方式联系：

- GitHub Issues: https://github.com/mrity/Children-Games/issues
- Email: [项目维护者邮箱]

---

感谢你的贡献！🎉
