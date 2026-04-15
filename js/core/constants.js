// ========== 配置常量 ==========

// 本地存储键名
export const STORAGE_KEY = "ferris-wheel-park-progress-v2";

// 动画时长（毫秒）
export const ROTATE_MS = 520; // 摩天轮单格转动动画时长
export const AUTO_ADVANCE_DELAY_MS = 1100; // 答对后自动进入下一关的延迟
export const PLAYBACK_STEP_DELAY_MS = 1700; // 讲解模式每步间隔
export const ROTATION_STEP_INTERVAL_MS = 80; // 连续转动时每格之间的间隔

// 摩天轮结构常量
export const WHEEL_SLOT_COUNT = 8; // 摩天轮座位数量
export const BOTTOM_SLOT_INDEX = 4; // 最下方座位索引（排队上车位置）

// 星级评分阈值
export const STARS_PERFECT = 3; // 一次答对
export const STARS_GOOD = 2; // 错误1次
export const STARS_PASS = 1; // 错误2次及以上

// 默认提示文本
export const COACH_DEFAULT = "先看看摩天轮上的小动物都坐在哪里。";

// 摩天轮基础配置
export const BASE_WHEEL = ["兔子", "青蛙", "小熊", "小松鼠", "狐狸", "熊猫", "小猴子", "小浣熊"];
export const QUEUE_ANIMALS = ["小老鼠", "小狗", "小猪"];

// 同高位置映射表
export const SAME_HEIGHT_SLOT = {
  1: 7,
  2: 6,
  3: 5,
  5: 3,
  6: 2,
  7: 1
};

// 动物样式配置
export const ANIMAL_STYLES = {
  "兔子": { color: "#f7d7ef", short: "兔子", avatar: "🐰" },
  "青蛙": { color: "#a8ddb1", short: "青蛙", avatar: "🐸" },
  "小熊": { color: "#d8b189", short: "小熊", avatar: "🐻" },
  "小松鼠": { color: "#f3c28a", short: "松鼠", avatar: "🐿️" },
  "狐狸": { color: "#f6a66f", short: "狐狸", avatar: "🦊" },
  "熊猫": { color: "#eff1f3", short: "熊猫", avatar: "🐼" },
  "小猴子": { color: "#f2d06d", short: "猴子", avatar: "🐵" },
  "小浣熊": { color: "#cdd7e4", short: "浣熊", avatar: "🦝" },
  "小老鼠": { color: "#d9d5f1", short: "老鼠", avatar: "🐭" },
  "小狗": { color: "#f0d4bf", short: "小狗", avatar: "🐶" },
  "小猪": { color: "#f6bfd0", short: "小猪", avatar: "🐷" }
};

// 区域配置
export const ZONES = [
  {
    id: "observe",
    name: "观察小舞台",
    subtitle: "先认识位置、上下左右和谁跟谁一样高。",
    band: "认识摩天轮的座位",
    color: "rgba(241, 184, 75, 0.2)"
  },
  {
    id: "rotate",
    name: "摩天轮乐园",
    subtitle: "学会顺时针转动后的位置变化和同高关系。",
    band: "看一看转了几格",
    color: "rgba(77, 176, 164, 0.2)"
  },
  {
    id: "queue",
    name: "排队小广场",
    subtitle: "排队的小动物也会加入摩天轮，一起来找位置。",
    band: "排队上车也要会推理",
    color: "rgba(245, 127, 141, 0.18)"
  }
];
