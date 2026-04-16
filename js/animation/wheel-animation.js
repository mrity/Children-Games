/**
 * 摩天轮动画模块
 * 提供摩天轮转动动画和场景推进功能
 */

import { ROTATE_MS, ROTATION_STEP_INTERVAL_MS, WHEEL_SLOT_COUNT } from '../core/constants.js';
import { applyRotationByDirection, buildRotationMessage } from '../game/wheel.js';

/**
 * 三次贝塞尔曲线计算
 * @param {number} t - 时间进度 (0-1)
 * @param {number} p1x - 控制点1 x坐标
 * @param {number} p1y - 控制点1 y坐标
 * @param {number} p2x - 控制点2 x坐标
 * @param {number} p2y - 控制点2 y坐标
 * @returns {number} 缓动后的进度值
 */
export function cubicBezier(t, p1x, p1y, p2x, p2y) {
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;

  const sampleCurveX = (time) => ((ax * time + bx) * time + cx) * time;
  const sampleCurveY = (time) => ((ay * time + by) * time + cy) * time;

  let time = t;
  for (let index = 0; index < 8; index += 1) {
    const x = sampleCurveX(time) - t;
    if (Math.abs(x) < 0.001) {
      break;
    }
    const dx = (3 * ax * time + 2 * bx) * time + cx;
    if (Math.abs(dx) < 0.000001) {
      break;
    }
    time -= x / dx;
  }

  return sampleCurveY(time);
}

/**
 * 执行摩天轮转动动画
 * @param {string} direction - 转动方向，"clockwise" 或 "counterclockwise"
 * @param {Function} onFinish - 动画完成后的回调函数
 * @param {Object} state - 状态对象
 * @param {Object} dom - DOM 元素对象
 */
export function animateWheelTurn(direction, onFinish, state, dom) {
  const angle = direction === "counterclockwise" ? -45 : 45;
  let finished = false;

  const finishTurn = () => {
    if (finished) {
      return;
    }
    finished = true;
    if (state.rotationTimer) {
      window.clearTimeout(state.rotationTimer);
      state.rotationTimer = 0;
    }
    if (state.animationFrameId) {
      window.cancelAnimationFrame(state.animationFrameId);
      state.animationFrameId = 0;
    }
    dom.wheelBody.style.transform = "rotate(0deg)";
    if (state.wheelAnimation) {
      try {
        state.wheelAnimation.onfinish = null;
        state.wheelAnimation.cancel();
      } catch (error) {
        // Ignore browser-specific animation cleanup issues.
      }
      state.wheelAnimation = null;
    }
    onFinish();
  };

  if (typeof dom.wheelBody.animate === "function") {
    state.wheelAnimation = dom.wheelBody.animate(
      [
        { transform: "rotate(0deg)" },
        { transform: `rotate(${angle}deg)` }
      ],
      {
        duration: state.rotateDuration,
        easing: "cubic-bezier(0.2, 0.82, 0.22, 1)",
        fill: "forwards"
      }
    );
    state.wheelAnimation.onfinish = finishTurn;
    state.rotationTimer = window.setTimeout(finishTurn, state.rotateDuration + ROTATION_STEP_INTERVAL_MS);
    return;
  }

  const startTime = performance.now();
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / state.rotateDuration, 1);
    const easeProgress = cubicBezier(progress, 0.2, 0.82, 0.22, 1);
    const currentAngle = angle * easeProgress;
    dom.wheelBody.style.transform = `rotate(${currentAngle}deg)`;

    if (progress < 1) {
      state.animationFrameId = window.requestAnimationFrame(animate);
    } else {
      finishTurn();
    }
  };

  state.animationFrameId = window.requestAnimationFrame(animate);
}

/**
 * 推进场景，执行摩天轮转动
 * @param {Object} level - 关卡对象
 * @param {Object} state - 状态对象
 * @param {Object} dom - DOM 元素对象
 * @param {Function} clearPlayback - 清除播放状态的函数
 * @param {Function} setMotionDisabled - 设置操作禁用状态的函数
 * @param {Function} renderScene - 渲染场景的函数
 * @param {Function} setCoach - 设置教练提示的函数
 * @param {Function} setFeedback - 设置反馈文本的函数
 * @param {Function} playSound - 播放音效的函数
 */
export function advanceScene(level, state, dom, clearPlayback, setMotionDisabled, renderScene, setCoach, setFeedback, playSound) {
  if (state.isRotating || state.isPlayingSolution || state.isAutoAdvancing) {
    return;
  }

  clearPlayback();
  state.rotateDuration = Number(dom.rotateSpeed.value) || ROTATE_MS;

  const direction = dom.rotateDirection.value;
  const circles = Number(dom.rotateCircles.value) || 0;
  const slots = Number(dom.rotateSteps.value) || 0;
  let steps = circles * WHEEL_SLOT_COUNT + slots;

  if (!steps) {
    steps = 1;
    dom.rotateSteps.value = "1";
    setFeedback("当前是 0 圈 0 格，系统先按 1 格帮你转动。");
  }

  let finishedSteps = 0;

  state.isRotating = true;
  setMotionDisabled(true);

  const runOneStep = () => {
    playSound("rotate");
    animateWheelTurn(direction, () => {
      applyRotationByDirection(level, state.scene, direction);
      finishedSteps += 1;
      renderScene();
      setCoach("default", buildRotationMessage(level.mode, direction, finishedSteps, steps));

      if (finishedSteps < steps) {
        state.rotationTimer = window.setTimeout(runOneStep, ROTATION_STEP_INTERVAL_MS);
      } else {
        state.isRotating = false;
        setMotionDisabled(false);
        setCoach("default", "转动完成，现在可以继续观察或作答。");
      }
    }, state, dom);
  };

  runOneStep();
}
