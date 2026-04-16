# 音效系统文档

> 完成日期：2026-04-16

## 概述

摩天轮乐园项目现已集成完整的音效反馈系统，使用 Web Audio API 生成音效，无需外部音频文件。

---

## 功能特性

### 1. 音效类型

- **答对音效** (`correct`) - 愉快的上升音（C5 → G5 → C6）
- **答错音效** (`wrong`) - 低沉的下降音（G4 → C4）
- **摩天轮转动音效** (`rotate`) - 柔和的旋转音（A3 ↔ A4）
- **按钮点击音效** (`click`) - 短促的点击音（800Hz）
- **提示音效** (`hint`) - 柔和的提示音（E5）

### 2. 音效控制

- **开关按钮** - 位于顶部导航栏右侧
- **状态持久化** - 音效设置保存到 localStorage
- **音量控制** - 默认音量 50%，可通过 API 调整
- **视觉反馈** - 静音时显示 🔇 图标

---

## 技术实现

### 音效管理器

```javascript
const SoundManager = {
  enabled: true,        // 音效开关
  volume: 0.5,          // 音量（0-1）
  
  init() { ... },       // 初始化
  play(soundName) { ... }, // 播放音效
  toggle() { ... },     // 切换开关
  setVolume(volume) { ... } // 设置音量
}
```

### Web Audio API

所有音效使用 Web Audio API 动态生成：

```javascript
createCorrectSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  // 配置振荡器和增益
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
  // ... 更多配置
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
}
```

---

## 集成位置

### 1. 答题反馈

**文件**: `app.js:1218-1235`

```javascript
if (answer === level.answer) {
  SoundManager.play("correct");  // 答对音效
  // ...
} else {
  SoundManager.play("wrong");    // 答错音效
  // ...
}
```

### 2. 提示系统

**文件**: `app.js:1181`

```javascript
function revealHint() {
  SoundManager.play("hint");     // 提示音效
  // ...
}
```

### 3. 摩天轮转动

**文件**: `app.js:1149`

```javascript
const runOneStep = () => {
  SoundManager.play("rotate");   // 转动音效
  animateWheelTurn(direction, () => {
    // ...
  });
};
```

### 4. 音效控制按钮

**文件**: `app.js:370-376`

```javascript
dom.soundToggle.addEventListener("click", () => {
  const enabled = SoundManager.toggle();
  dom.soundToggle.classList.toggle("is-muted", !enabled);
  SoundManager.play("click");    // 点击音效
});
```

---

## 文件清单

### 新增文件

1. **js/core/sound.js** - 音效管理器模块（独立版本）
2. **css/sound.css** - 音效按钮样式
3. **docs/SOUND_SYSTEM.md** - 本文档

### 修改文件

1. **index.html**
   - 添加音效控制按钮
   - 引入 sound.css

2. **app.js**
   - 集成 SoundManager
   - 在关键操作中添加音效播放
   - 添加音效按钮事件监听

---

## 使用方法

### 用户操作

1. **开启/关闭音效**
   - 点击顶部导航栏右侧的音效按钮
   - 图标会在 🔊（开启）和 🔇（关闭）之间切换

2. **音效触发时机**
   - 答对题目 → 播放愉快的上升音
   - 答错题目 → 播放低沉的下降音
   - 点击提示 → 播放柔和的提示音
   - 摩天轮转动 → 播放旋转音
   - 点击音效按钮 → 播放点击音

### 开发者 API

```javascript
// 播放音效
SoundManager.play("correct");
SoundManager.play("wrong");
SoundManager.play("rotate");
SoundManager.play("click");
SoundManager.play("hint");

// 切换音效开关
const enabled = SoundManager.toggle();

// 设置音量（0-1）
SoundManager.setVolume(0.7);

// 检查音效状态
if (SoundManager.enabled) {
  // 音效已开启
}
```

---

## 浏览器兼容性

### 支持的浏览器

- Chrome 35+
- Firefox 25+
- Safari 14.1+
- Edge 79+

### Web Audio API 支持

所有现代浏览器都支持 Web Audio API。对于不支持的浏览器，音效会静默失败，不影响游戏功能。

---

## 性能考虑

### 优化措施

1. **按需创建** - 音效在播放时动态创建，不占用内存
2. **自动清理** - AudioContext 在音效播放完成后自动释放
3. **错误处理** - 播放失败时静默处理，不影响游戏体验
4. **轻量级** - 无需加载外部音频文件，减少网络请求

### 性能影响

- **内存占用** - 几乎为零（动态生成）
- **CPU 占用** - 极低（Web Audio API 硬件加速）
- **网络流量** - 无影响（无外部文件）

---

## 未来扩展

### 可选改进

1. **音效库扩展**
   - 添加更多音效类型
   - 支持自定义音效

2. **音量控制 UI**
   - 添加音量滑块
   - 支持独立控制各类音效音量

3. **音效主题**
   - 支持切换不同风格的音效
   - 节日主题音效

4. **外部音频文件**
   - 支持加载 MP3/OGG 音频文件
   - 更丰富的音效效果

---

## 故障排除

### 常见问题

**问题 1**: 音效无法播放

**解决方案**:
- 检查浏览器是否支持 Web Audio API
- 确认音效开关已开启
- 检查浏览器控制台是否有错误

**问题 2**: 音效延迟

**解决方案**:
- Web Audio API 通常延迟极低
- 如果遇到延迟，可能是浏览器性能问题
- 尝试关闭其他占用资源的标签页

**问题 3**: 音效按钮不显示

**解决方案**:
- 确认 css/sound.css 已正确加载
- 检查 HTML 中是否包含音效按钮元素
- 清除浏览器缓存并刷新

---

## 技术参考

- [Web Audio API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [OscillatorNode - MDN](https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode)
- [GainNode - MDN](https://developer.mozilla.org/en-US/docs/Web/API/GainNode)

---

**最后更新**: 2026-04-16
