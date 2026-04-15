import { ROTATE_MS } from './constants.js';

// ========== 全局状态管理 ==========

export const dom = {};

export const state = {
  currentScreen: "home",
  currentLevelId: null,
  scene: null,
  selectedAnswer: "",
  wrongAttempts: 0,
  hintsShown: 0,
  solutionViewed: false,
  isPlayingSolution: false,
  isRotating: false,
  isAutoAdvancing: false,
  playbackTimer: 0,
  rotationTimer: 0,
  autoAdvanceTimer: 0,
  animationFrameId: 0,
  wheelAnimation: null,
  rotateDuration: ROTATE_MS,
  progress: null
};

// 初始化状态
export function initState(progress) {
  state.progress = progress;
}
