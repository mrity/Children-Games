/**
 * 摩天轮逻辑模块
 * 提供摩天轮旋转、场景模拟、几何计算等核心功能
 */

import { BASE_WHEEL, WHEEL_SLOT_COUNT, SAME_HEIGHT_SLOT, BOTTOM_SLOT_INDEX } from '../core/constants.js';

// ========== 几何计算 ==========

/**
 * 计算摩天轮座位的布局坐标
 * @param {HTMLElement} wheelBody - 摩天轮主体元素
 * @returns {Array} 座位坐标数组
 */
export function getSlotLayout(wheelBody) {
  const size = wheelBody.clientWidth || 380;
  const radius = size * 0.38;
  return Array.from({ length: WHEEL_SLOT_COUNT }, (_, slotIndex) => {
    const angle = (-90 + slotIndex * 45) * (Math.PI / 180);
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  });
}

/**
 * 获取动物在摩天轮上的位置索引
 * @param {string} animal - 动物名称
 * @returns {number} 位置索引（0-7），如果未找到返回 -1
 */
export function animalSlot(animal) {
  return BASE_WHEEL.indexOf(animal);
}

/**
 * 计算动物转到目标位置需要的步数
 * @param {string} animal - 动物名称
 * @param {number} targetSlot - 目标位置索引
 * @returns {number} 需要转动的步数
 */
export function rotationStepsForAnimalToSlot(animal, targetSlot) {
  const start = animalSlot(animal);
  return (targetSlot - start + WHEEL_SLOT_COUNT) % WHEEL_SLOT_COUNT;
}

/**
 * 计算转动后动物的位置
 * @param {string} animal - 动物名称
 * @param {number} steps - 转动步数
 * @returns {number} 转动后的位置索引
 */
export function findAnimalSlotAfterSteps(animal, steps) {
  return (animalSlot(animal) + steps) % WHEEL_SLOT_COUNT;
}

/**
 * 计算与指定动物同高的动物
 * @param {Array} wheel - 摩天轮数组
 * @param {string} animal - 动物名称
 * @returns {string} 同高的动物名称
 */
export function computeSameHeightAnimal(wheel, animal) {
  const slotIndex = wheel.indexOf(animal);
  const targetSlot = SAME_HEIGHT_SLOT[slotIndex];
  return targetSlot === undefined ? "" : wheel[targetSlot];
}

/**
 * 查找动物原位置的主人
 * @param {Array} wheel - 摩天轮数组
 * @param {string} animal - 动物名称
 * @returns {string} 原位置主人的名称
 */
export function findAnimalOriginalPositionOwner(wheel, animal) {
  const slotIndex = wheel.indexOf(animal);
  return slotIndex === -1 ? "" : BASE_WHEEL[slotIndex];
}

// ========== 旋转逻辑 ==========

/**
 * 顺时针旋转摩天轮
 * @param {Array} wheel - 摩天轮数组
 * @returns {Array} 旋转后的摩天轮数组
 */
export function rotateWheelClockwise(wheel) {
  return [wheel[WHEEL_SLOT_COUNT - 1], ...wheel.slice(0, WHEEL_SLOT_COUNT - 1)];
}

/**
 * 逆时针旋转摩天轮
 * @param {Array} wheel - 摩天轮数组
 * @returns {Array} 旋转后的摩天轮数组
 */
export function rotateWheelCounterclockwise(wheel) {
  return [...wheel.slice(1), wheel[0]];
}

/**
 * 应用多步旋转
 * @param {Array} wheel - 摩天轮数组
 * @param {number} steps - 旋转步数
 * @returns {Array} 旋转后的摩天轮数组
 */
export function applyRotationSteps(wheel, steps) {
  let nextWheel = [...wheel];
  for (let index = 0; index < steps; index += 1) {
    nextWheel = rotateWheelClockwise(nextWheel);
  }
  return nextWheel;
}

// ========== 场景模拟 ==========

/**
 * 让下一只排队动物上车
 * @param {Object} scene - 场景对象
 */
export function boardNextQueueAnimal(scene) {
  if (!scene.queue.length) {
    return;
  }
  const nextAnimal = scene.queue.shift();
  scene.wheel[BOTTOM_SLOT_INDEX] = nextAnimal;
  scene.boarded.push(nextAnimal);
}

/**
 * 旋转排队场景
 * @param {Object} scene - 场景对象
 * @param {string} direction - 旋转方向
 */
export function rotateQueueScene(scene, direction = "clockwise") {
  if (direction === "counterclockwise") {
    scene.wheel = rotateWheelCounterclockwise(scene.wheel);
    scene.rotationCount -= 1;
    return;
  }

  scene.wheel = rotateWheelClockwise(scene.wheel);
  scene.rotationCount += 1;
  boardNextQueueAnimal(scene);
}

/**
 * 深拷贝场景对象
 * @param {Object} scene - 场景对象
 * @returns {Object} 拷贝后的场景对象
 */
export function cloneScene(scene) {
  return {
    wheel: [...scene.wheel],
    queue: [...scene.queue],
    boarded: [...scene.boarded],
    rotationCount: scene.rotationCount
  };
}

/**
 * 模拟排队直到目标位置
 * @param {Array} queueAnimals - 排队动物列表
 * @param {string} targetAnimal - 目标动物
 * @param {number} targetSlot - 目标位置
 * @param {Function} createSceneForLevel - 创建场景的函数
 * @returns {Object} 模拟后的场景
 */
export function simulateQueueUntilWithOrder(queueAnimals, targetAnimal, targetSlot, createSceneForLevel) {
  const level = {
    mode: "queue",
    queueAnimals
  };
  const scene = createSceneForLevel(level);
  let guard = 0;
  while (scene.wheel[targetSlot] !== targetAnimal && guard < 24) {
    rotateQueueScene(scene);
    guard += 1;
  }
  return scene;
}

/**
 * 计算上车时的位置主人
 * @param {Array} queueAnimals - 排队动物列表
 * @param {string} boardAnimal - 上车动物
 * @returns {string} 位置主人名称
 */
export function computeBoardingOwner(queueAnimals, boardAnimal) {
  const scene = {
    wheel: [...BASE_WHEEL],
    queue: [...queueAnimals],
    boarded: [],
    rotationCount: 0
  };

  let guard = 0;
  while (scene.queue.length && guard < 24) {
    const nextAnimal = scene.queue[0];
    const owner = scene.wheel[BOTTOM_SLOT_INDEX];
    boardNextQueueAnimal(scene);
    if (nextAnimal === boardAnimal) {
      return owner;
    }
    scene.wheel = rotateWheelClockwise(scene.wheel);
    scene.rotationCount += 1;
    guard += 1;
  }

  return BASE_WHEEL[BOTTOM_SLOT_INDEX];
}

/**
 * 根据方向应用旋转
 * @param {Object} level - 关卡对象
 * @param {Object} scene - 场景对象
 * @param {string} direction - 旋转方向
 */
export function applyRotationByDirection(level, scene, direction) {
  if (level.mode === "queue") {
    rotateQueueScene(scene, direction);
    return;
  }

  if (direction === "counterclockwise") {
    scene.wheel = rotateWheelCounterclockwise(scene.wheel);
    scene.rotationCount -= 1;
    return;
  }

  scene.wheel = rotateWheelClockwise(scene.wheel);
  scene.rotationCount += 1;
}

// ========== 辅助函数 ==========

/**
 * 创建步骤文本对象
 * @param {string} text - 文本内容
 * @param {Object} options - 选项
 * @returns {Object} 步骤对象
 */
export function stepText(text, options = {}) {
  return {
    text,
    ...options
  };
}

/**
 * 构建位置池
 * @returns {Array} 位置池数组
 */
export function buildPositionPool() {
  return BASE_WHEEL.map((animal) => `${animal}的位置`);
}

/**
 * 构建答案选项集
 * @param {string} answer - 正确答案
 * @param {Array} pool - 选项池
 * @returns {Array} 选项集
 */
export function buildChoiceSet(answer, pool) {
  const uniquePool = [...new Set(pool)];
  const candidates = [answer];
  const answerIndex = Math.max(0, uniquePool.indexOf(answer));

  for (let offset = 1; offset < uniquePool.length && candidates.length < 4; offset += 1) {
    const candidate = uniquePool[(answerIndex + offset) % uniquePool.length];
    if (!candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  }

  const rotateBy = answerIndex % candidates.length;
  return [...candidates.slice(rotateBy), ...candidates.slice(0, rotateBy)];
}

/**
 * 构建旋转同高步骤
 * @param {string} movingAnimal - 移动的动物
 * @param {string} targetAnimal - 目标动物
 * @param {string} sameHeightAnimal - 同高动物
 * @param {string} answerAnimal - 答案动物
 * @returns {Array} 步骤数组
 */
export function buildRotateSameHeightSteps(movingAnimal, targetAnimal, sameHeightAnimal, answerAnimal) {
  const steps = rotationStepsForAnimalToSlot(movingAnimal, animalSlot(targetAnimal));
  return [
    stepText(`先找到${movingAnimal}和${targetAnimal}原来的位置。`, {
      slotIndex: animalSlot(movingAnimal)
    }),
    stepText(`${movingAnimal}要顺时针转 ${steps} 格，才能到${targetAnimal}原来的位置。`, {
      slotIndex: animalSlot(targetAnimal),
      sceneSteps: steps
    }),
    stepText(`全部一起转完以后，再去找和${sameHeightAnimal}一样高的位置。`, {
      slotIndex: findAnimalSlotAfterSteps(sameHeightAnimal, steps)
    }),
    stepText(`那个位置上是${answerAnimal}，所以答案是${answerAnimal}。`, {
      slotIndex: findAnimalSlotAfterSteps(answerAnimal, steps),
      answer: answerAnimal
    })
  ];
}

/**
 * 构建排队位置步骤
 * @param {string} targetAnimal - 目标动物
 * @param {string} targetOwner - 目标位置主人
 * @param {string} watchAnimal - 观察动物
 * @param {string} answerOwner - 答案位置主人
 * @returns {Array} 步骤数组
 */
export function buildQueuePositionSteps(targetAnimal, targetOwner, watchAnimal, answerOwner) {
  return [
    stepText(`排队的小动物先从最下面上车，所以先让${targetAnimal}坐到底部。`, {
      slotIndex: BOTTOM_SLOT_INDEX,
      queueAnimal: targetAnimal
    }),
    stepText(`继续顺时针转，直到${targetAnimal}来到${targetOwner}原来的位置。`, {
      sceneQueueTarget: { animal: targetAnimal, slot: animalSlot(targetOwner) }
    }),
    stepText(`这时再看${watchAnimal}停在哪里。`, {
      queueAnimal: watchAnimal
    }),
    stepText(`${watchAnimal}停在${answerOwner}原来的位置，所以答案是${answerOwner}的位置。`, {
      answer: `${answerOwner}的位置`
    })
  ];
}

/**
 * 构建旋转消息
 * @param {string} mode - 模式
 * @param {string} direction - 方向
 * @param {number} currentStep - 当前步数
 * @param {number} totalSteps - 总步数
 * @returns {string} 消息文本
 */
export function buildRotationMessage(mode, direction, currentStep, totalSteps) {
  const directionText = direction === "clockwise" ? "顺时针" : "逆时针";
  if (mode === "queue" && direction === "counterclockwise") {
    return `正在${directionText}观察，第 ${currentStep} / ${totalSteps} 格。排队题的上车规则仍然以顺时针为准。`;
  }
  return `正在${directionText}转动，第 ${currentStep} / ${totalSteps} 格。继续观察小动物位置变化。`;
}
