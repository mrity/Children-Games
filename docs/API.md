# API 文档

> 摩天轮乐园 - 核心函数 API 参考

## 目录

- [初始化函数](#初始化函数)
- [导航函数](#导航函数)
- [渲染函数](#渲染函数)
- [游戏逻辑函数](#游戏逻辑函数)
- [进度管理函数](#进度管理函数)
- [工具函数](#工具函数)

---

## 初始化函数

### `init()`

初始化应用程序。

**调用时机**：页面加载完成后自动调用

**执行流程**：
1. 缓存 DOM 元素
2. 检查浏览器兼容性
3. 初始化存储系统
4. 加载游戏进度
5. 生成题库数据
6. 绑定事件监听器
7. 渲染首页

**返回值**：`void`

---

### `cacheDom()`

缓存所有需要频繁访问的 DOM 元素到 `dom` 对象。

**返回值**：`void`

---

### `bindEvents()`

绑定所有事件监听器。

**返回值**：`void`

---

## 导航函数

### `navigateTo(screenName)`

切换到指定页面。

**参数**：
- `screenName` (string) - 页面名称，可选值：`"home"`, `"map"`, `"game"`, `"progress"`

**返回值**：`void`

**示例**：
```javascript
navigateTo("map"); // 切换到乐园地图页面
```

---

## 渲染函数

### `renderAll()`

重新渲染所有页面内容。

**返回值**：`void`

---

### `renderNav()`

渲染顶部导航栏，更新激活状态。

**返回值**：`void`

---

### `renderMap()`

渲染乐园地图页面，包括所有区域和关卡。

**返回值**：`void`

---

### `renderGame(levelId)`

渲染游戏页面。

**参数**：
- `levelId` (string) - 关卡 ID

**返回值**：`void`

**副作用**：
- 更新 `state.currentLevelId`
- 重置游戏状态
- 渲染场景、题目、答案选项

---

### `renderScene()`

渲染摩天轮场景（座舱和排队区）。

**返回值**：`void`

**优化**：使用增量更新，仅更新变化的元素

---

### `renderProgress()`

渲染成长记录页面，显示进度统计和关卡记录。

**返回值**：`void`

---

## 游戏逻辑函数

### `submitAnswer(answer)`

提交答案并处理结果。

**参数**：
- `answer` (string) - 用户选择的答案

**返回值**：`void`

**执行流程**：
1. 验证答案正确性
2. 更新 UI 反馈
3. 计算星级（如果答对）
4. 更新进度数据
5. 保存进度
6. 自动进入下一关（如果答对）

---

### `computeStars()`

根据错误次数计算星级。

**返回值**：`number` - 星级（1-3）

**计算规则**：
- 0 次错误：3 星
- 1 次错误：2 星
- 2+ 次错误：1 星

---

### `advanceScene()`

执行摩天轮转动。

**返回值**：`void`

**执行流程**：
1. 读取转动参数（方向、圈数、格数）
2. 计算总转动步数
3. 执行动画循环
4. 更新场景数据
5. 重新渲染场景

---

### `revealHint()`

显示下一条提示。

**返回值**：`void`

**副作用**：
- 增加 `state.hintsShown`
- 更新统计数据
- 保存进度

---

### `playSolution()`

播放分步讲解。

**返回值**：`void`

**执行流程**：
1. 重置场景到初始状态
2. 按步骤播放讲解
3. 每步间隔 1700ms
4. 应用场景变化和高亮

---

## 进度管理函数

### `loadProgress()`

从存储系统加载游戏进度。

**返回值**：`Object` - 进度对象

**返回值结构**：
```javascript
{
  version: 1,
  completedLevelIds: [],
  starsByLevel: {},
  stats: {
    totalAttempts: 0,
    hintsUsed: 0,
    solutionsViewed: 0
  },
  recordsByLevel: {}
}
```

**错误处理**：
- 如果加载失败，返回空进度对象
- 自动迁移旧版本数据格式

---

### `saveProgress()`

保存当前游戏进度到存储系统。

**返回值**：`void`

**错误处理**：
- 如果 localStorage 不可用，自动降级到内存存储
- 保存失败时在控制台输出警告

---

### `exportProgress()`

导出进度为 JSON 文件。

**返回值**：`void`

**导出格式**：
```javascript
{
  version: 1,
  exportDate: "2026-04-16T12:00:00.000Z",
  data: { /* 进度对象 */ }
}
```

---

### `importProgress(file)`

从文件导入进度。

**参数**：
- `file` (File) - 要导入的 JSON 文件

**返回值**：`void`

**执行流程**：
1. 读取文件内容
2. 验证数据格式
3. 显示确认对话框
4. 导入数据并保存
5. 重新渲染界面

**错误处理**：
- 数据格式错误时显示错误提示
- 文件读取失败时显示错误提示

---

### `finishLevel(levelId, stars)`

完成关卡并更新进度。

**参数**：
- `levelId` (string) - 关卡 ID
- `stars` (number) - 获得的星级（1-3）

**返回值**：`void`

**副作用**：
- 添加到已完成关卡列表
- 更新星级记录（仅保存最高星级）
- 更新统计数据
- 保存进度

---

## 工具函数

### `currentLevel()`

获取当前关卡对象。

**返回值**：`Object|null` - 关卡对象，如果未找到返回 `null`

---

### `getLevelById(levelId)`

根据 ID 获取关卡对象。

**参数**：
- `levelId` (string) - 关卡 ID

**返回值**：`Object|null` - 关卡对象，如果未找到返回 `null`

---

### `animalSlot(animal)`

获取动物在摩天轮上的位置索引。

**参数**：
- `animal` (string) - 动物名称

**返回值**：`number` - 位置索引（0-7），如果未找到返回 -1

---

### `rotationStepsForAnimalToSlot(animal, targetSlot)`

计算动物转到目标位置需要的步数。

**参数**：
- `animal` (string) - 动物名称
- `targetSlot` (number) - 目标位置索引

**返回值**：`number` - 需要转动的步数

---

### `findAnimalSlotAfterSteps(animal, steps)`

计算动物转动指定步数后的位置。

**参数**：
- `animal` (string) - 动物名称
- `steps` (number) - 转动步数

**返回值**：`number` - 转动后的位置索引

---

### `animateWheelTurn(direction, onFinish)`

执行摩天轮转动动画。

**参数**：
- `direction` (string) - 转动方向，`"clockwise"` 或 `"counterclockwise"`
- `onFinish` (Function) - 动画完成后的回调函数

**返回值**：`void`

**实现细节**：
- 优先使用 Web Animations API
- 降级使用 requestAnimationFrame
- 使用三次贝塞尔缓动函数

---

## 存储系统

### `storageSystem`

统一的存储接口，自动处理 localStorage 降级。

**属性**：
- `type` (string) - 存储类型，`"localStorage"` 或 `"memory"`

**方法**：

#### `getItem(key)`

获取存储的值。

**参数**：
- `key` (string) - 存储键名

**返回值**：`string|null` - 存储的值，如果不存在返回 `null`

---

#### `setItem(key, value)`

设置存储的值。

**参数**：
- `key` (string) - 存储键名
- `value` (string) - 要存储的值

**返回值**：`boolean` - 是否成功保存

---

## 数据验证

### `validateProgressData(data)`

验证和修复进度数据。

**参数**：
- `data` (Object) - 要验证的进度数据

**返回值**：`Object` - 验证结果
```javascript
{
  isValid: boolean,
  errors: string[],
  warnings: string[],
  fixed: Object  // 修复后的数据
}
```

**验证规则**：
- 检查必需字段是否存在
- 验证数据类型
- 过滤无效的关卡 ID
- 自动修复缺失字段

---

## 常量

### 动画时长

- `ROTATE_MS` - 摩天轮单格转动动画时长（520ms）
- `AUTO_ADVANCE_DELAY_MS` - 答对后自动进入下一关的延迟（1100ms）
- `PLAYBACK_STEP_DELAY_MS` - 讲解模式每步间隔（1700ms）
- `ROTATION_STEP_INTERVAL_MS` - 连续转动时每格之间的间隔（80ms）

### 摩天轮结构

- `WHEEL_SLOT_COUNT` - 摩天轮座位数量（8）
- `BOTTOM_SLOT_INDEX` - 最下方座位索引（4）

### 星级评分

- `STARS_PERFECT` - 一次答对（3 星）
- `STARS_GOOD` - 错误 1 次（2 星）
- `STARS_PASS` - 错误 2 次及以上（1 星）

---

## 事件

### 页面导航事件

```javascript
// 导航按钮点击
dom.navChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    navigateTo(chip.dataset.nav);
  });
});
```

### 答题事件

```javascript
// 答案按钮点击（使用事件委托）
dom.answerGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".answer-button");
  if (button && button.dataset.answer) {
    submitAnswer(button.dataset.answer);
  }
});
```

### 摩天轮控制事件

```javascript
// 转动按钮点击
dom.advanceButton.addEventListener("click", () => {
  advanceScene();
});
```

---

## 错误处理

### localStorage 不可用

```javascript
// 自动降级到内存存储
if (!storageSystem.isLocalStorageAvailable()) {
  console.warn("localStorage 不可用，使用内存存储");
  storageSystem.type = "memory";
}
```

### 数据加载失败

```javascript
// 返回空进度对象
try {
  const progress = loadProgress();
} catch (error) {
  console.error("加载进度失败:", error);
  const progress = createEmptyProgress();
}
```

### 动画 API 不支持

```javascript
// 自动降级到 requestAnimationFrame
if (typeof dom.wheelBody.animate !== "function") {
  // 使用 requestAnimationFrame 实现动画
}
```

---

## 性能优化

### DOM 渲染优化

- 使用增量更新，仅更新变化的元素
- 避免全量重绘
- 使用 DocumentFragment 批量插入

### 动画性能优化

- 优先使用 Web Animations API
- 降级使用 requestAnimationFrame
- 避免使用 setTimeout 轮询

### 事件处理优化

- 使用事件委托减少监听器数量
- 防抖和节流（窗口 resize）

---

## 浏览器兼容性

### 最低要求

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 降级方案

- Web Animations API → requestAnimationFrame
- localStorage → 内存存储

---

## 调试

### 控制台日志

```javascript
// 存储系统状态
console.log("存储类型:", storageSystem.type);

// 进度数据
console.log("当前进度:", state.progress);

// 关卡信息
console.log("当前关卡:", currentLevel());
```

### 常见问题

**问题**：进度保存失败
**解决**：检查 localStorage 是否可用，查看控制台警告

**问题**：动画卡顿
**解决**：检查是否使用了 Web Animations API，查看浏览器兼容性

**问题**：关卡无法解锁
**解决**：检查进度数据是否正确，验证关卡依赖关系

---

## 示例代码

### 手动触发关卡完成

```javascript
// 完成指定关卡并获得 3 星
finishLevel("observe-1-1", 3);
saveProgress();
renderAll();
```

### 重置所有进度

```javascript
// 清空进度
state.progress = createEmptyProgress();
saveProgress();
renderAll();
```

### 跳转到指定关卡

```javascript
// 跳转到游戏页面并加载指定关卡
navigateTo("game");
renderGame("observe-1-1");
```

---

## 扩展开发

### 添加新题型

1. 在 `createQuestionTypes()` 中添加新题型生成逻辑
2. 定义题目结构（prompt, choices, answer, hints, solution）
3. 更新 `LEVELS` 数组
4. 测试新题型

### 添加新动画效果

1. 在 `animateWheelTurn()` 中添加新动画逻辑
2. 使用 Web Animations API 或 requestAnimationFrame
3. 添加降级方案
4. 测试动画性能

### 添加新存储后端

1. 实现 `getItem()` 和 `setItem()` 方法
2. 添加可用性检测
3. 更新 `storageSystem` 初始化逻辑
4. 测试存储功能

---

## 许可证

MIT License
