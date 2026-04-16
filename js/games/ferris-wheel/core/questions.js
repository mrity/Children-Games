import {
  BASE_WHEEL,
  QUEUE_ANIMALS,
  WHEEL_SLOT_COUNT,
  SAME_HEIGHT_SLOT,
  BOTTOM_SLOT_INDEX,
  ZONES
} from './constants.js';

// ========== 题库数据生成 ==========

function animalSlot(animal) {
  return BASE_WHEEL.indexOf(animal);
}

function rotationStepsForAnimalToSlot(animal, targetSlot) {
  const start = animalSlot(animal);
  return (targetSlot - start + WHEEL_SLOT_COUNT) % WHEEL_SLOT_COUNT;
}

function stepText(text, options = {}) {
  return {
    text,
    ...options
  };
}

function rotateWheelClockwise(wheel) {
  return [wheel[WHEEL_SLOT_COUNT - 1], ...wheel.slice(0, WHEEL_SLOT_COUNT - 1)];
}

function applyRotationSteps(wheel, steps) {
  let nextWheel = [...wheel];
  for (let index = 0; index < steps; index += 1) {
    nextWheel = rotateWheelClockwise(nextWheel);
  }
  return nextWheel;
}

function findAnimalSlotAfterSteps(animal, steps) {
  return (animalSlot(animal) + steps) % WHEEL_SLOT_COUNT;
}

function buildPositionPool() {
  return BASE_WHEEL.map((animal) => `${animal}的位置`);
}

function computeSameHeightAnimal(wheel, animal) {
  const slotIndex = wheel.indexOf(animal);
  const targetSlot = SAME_HEIGHT_SLOT[slotIndex];
  return targetSlot === undefined ? "" : wheel[targetSlot];
}

function findAnimalOriginalPositionOwner(wheel, animal) {
  const slotIndex = wheel.indexOf(animal);
  return slotIndex === -1 ? "" : BASE_WHEEL[slotIndex];
}

function buildChoiceSet(answer, pool) {
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

function boardNextQueueAnimal(scene) {
  if (!scene.queue.length) {
    return;
  }
  const nextAnimal = scene.queue.shift();
  scene.wheel[BOTTOM_SLOT_INDEX] = nextAnimal;
  scene.boarded.push(nextAnimal);
}

function rotateQueueScene(scene, direction = "clockwise") {
  if (direction === "counterclockwise") {
    scene.wheel = [scene.wheel[0], ...scene.wheel.slice(1)].slice(1).concat(scene.wheel[0]);
    scene.rotationCount -= 1;
    return;
  }

  scene.wheel = rotateWheelClockwise(scene.wheel);
  scene.rotationCount += 1;
  boardNextQueueAnimal(scene);
}

function createSceneForLevel(level) {
  const scene = {
    wheel: [...BASE_WHEEL],
    queue: [...(level.queueAnimals || QUEUE_ANIMALS)],
    boarded: [],
    rotationCount: 0
  };

  if (level.mode === "queue") {
    boardNextQueueAnimal(scene);
  }

  return scene;
}

function simulateQueueUntilWithOrder(queueAnimals, targetAnimal, targetSlot) {
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

function computeBoardingOwner(queueAnimals, boardAnimal) {
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

function buildRotateSameHeightSteps(movingAnimal, targetAnimal, sameHeightAnimal, answerAnimal) {
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

function buildQueuePositionSteps(targetAnimal, targetOwner, watchAnimal, answerOwner) {
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

// ========== 题目生成函数 ==========

function createObserveNextQuestion(animal) {
  const startSlot = animalSlot(animal);
  const targetSlot = (startSlot + 1) % WHEEL_SLOT_COUNT;
  const answer = BASE_WHEEL[targetSlot];
  return {
    title: "顺时针下一格",
    prompt: `现在谁坐在${animal}的顺时针下一格？`,
    mode: "observe",
    choices: buildChoiceSet(answer, BASE_WHEEL),
    answer,
    hints: [
      `先找到${animal}现在坐的位置。`,
      "顺时针就是跟着箭头方向往前走。",
      "只看前面一格，不要多走。"
    ],
    solutionSteps: [
      stepText(`先找到${animal}的位置。`, { slotIndex: startSlot }),
      stepText("顺着箭头往前看一格。", { slotIndex: targetSlot }),
      stepText(`那个位置上是${answer}，所以答案是${answer}。`, { slotIndex: targetSlot, answer })
    ]
  };
}

function createSameHeightQuestion(animal) {
  const slotIndex = animalSlot(animal);
  const targetSlot = SAME_HEIGHT_SLOT[slotIndex];
  const answer = BASE_WHEEL[targetSlot];
  return {
    title: "找同样高的位置",
    prompt: `现在谁和${animal}一样高？`,
    mode: "observe",
    choices: buildChoiceSet(answer, BASE_WHEEL),
    answer,
    hints: [
      `先找到${animal}的位置。`,
      "一样高，就是看它左右同一条横线上的位置。",
      "找到和它同高的那个座位。"
    ],
    solutionSteps: [
      stepText(`先找到${animal}的位置。`, { slotIndex }),
      stepText("和它一样高的位置在另一边同一条横线上。", { slotIndex: targetSlot }),
      stepText(`坐在那里的是${answer}，所以答案是${answer}。`, { slotIndex: targetSlot, answer })
    ]
  };
}

function createTopQuestion(steps) {
  const rotatedWheel = applyRotationSteps(BASE_WHEEL, steps);
  const answer = rotatedWheel[0];
  return {
    title: "看最上面的位置",
    prompt: steps
      ? `摩天轮顺时针转 ${steps} 格后，最上面是谁？`
      : "现在谁坐在最上面？",
    mode: steps ? "rotate" : "observe",
    targetSteps: steps,
    choices: buildChoiceSet(answer, BASE_WHEEL),
    answer,
    hints: [
      "最上面只有一个位置。",
      steps ? `先想清楚顺时针一共转了 ${steps} 格。` : "先看最上面的座位。",
      "最后再看最上面坐的是谁。"
    ],
    solutionSteps: [
      stepText("先关注最上面的座位。", { slotIndex: 0 }),
      steps
        ? stepText(`摩天轮顺时针转 ${steps} 格以后，再看最上面。`, { slotIndex: 0, sceneSteps: steps })
        : stepText("现在还没有转动，直接看最上面。", { slotIndex: 0 }),
      stepText(`最上面是${answer}，所以答案是${answer}。`, { slotIndex: 0, sceneSteps: steps || undefined, answer })
    ]
  };
}

function createCounterclockwiseQuestion(animal) {
  const startSlot = animalSlot(animal);
  const targetSlot = (startSlot + WHEEL_SLOT_COUNT - 1) % WHEEL_SLOT_COUNT;
  const answer = BASE_WHEEL[targetSlot];
  return {
    title: "逆时针前一格",
    prompt: `现在${animal}的逆时针一格是谁？`,
    mode: "observe",
    choices: buildChoiceSet(answer, BASE_WHEEL),
    answer,
    hints: [
      `先找到${animal}的位置。`,
      "逆时针就是和箭头相反的方向。",
      "只往回退一格。"
    ],
    solutionSteps: [
      stepText(`先找到${animal}的位置。`, { slotIndex: startSlot }),
      stepText("逆时针就是往回退一格。", { slotIndex: targetSlot }),
      stepText(`那个位置上是${answer}，所以答案是${answer}。`, { slotIndex: targetSlot, answer })
    ]
  };
}

function createRotateSameHeightQuestion(movingAnimal, targetOwner, sameHeightAnimal) {
  const steps = rotationStepsForAnimalToSlot(movingAnimal, animalSlot(targetOwner));
  const rotatedWheel = applyRotationSteps(BASE_WHEEL, steps);
  const answer = computeSameHeightAnimal(rotatedWheel, sameHeightAnimal);
  return {
    title: "转到指定位置后找同高",
    prompt: `如果${movingAnimal}转到${targetOwner}的位置上，那么谁与${sameHeightAnimal}一样高呢？`,
    mode: "rotate",
    targetSteps: steps,
    choices: buildChoiceSet(answer, BASE_WHEEL),
    answer,
    hints: [
      `先看${movingAnimal}要转几格，才能到${targetOwner}原来的位置。`,
      "全部小动物会一起顺时针转相同的格数。",
      `转完以后，再去找和${sameHeightAnimal}一样高的位置。`
    ],
    solutionSteps: buildRotateSameHeightSteps(movingAnimal, targetOwner, sameHeightAnimal, answer)
  };
}

function createRotateOccupyQuestion(positionOwner, steps) {
  const rotatedWheel = applyRotationSteps(BASE_WHEEL, steps);
  const targetSlot = animalSlot(positionOwner);
  const answer = rotatedWheel[targetSlot];
  return {
    title: "谁来到这个位置",
    prompt: `摩天轮顺时针转 ${steps} 格后，谁坐到${positionOwner}原来的位置上？`,
    mode: "rotate",
    targetSteps: steps,
    choices: buildChoiceSet(answer, BASE_WHEEL),
    answer,
    hints: [
      `先找到${positionOwner}原来的位置。`,
      `顺时针一共转 ${steps} 格。`,
      "转完以后看谁来到这个座位。"
    ],
    solutionSteps: [
      stepText(`先记住${positionOwner}原来的位置。`, { slotIndex: targetSlot }),
      stepText(`顺时针转 ${steps} 格以后，再看这个位置。`, { slotIndex: targetSlot, sceneSteps: steps }),
      stepText(`来到这里的是${answer}，所以答案是${answer}。`, { slotIndex: targetSlot, sceneSteps: steps, answer })
    ]
  };
}

function createRotateDestinationQuestion(animal, steps) {
  const rotatedWheel = applyRotationSteps(BASE_WHEEL, steps);
  const slotIndex = rotatedWheel.indexOf(animal);
  const answer = BASE_WHEEL[slotIndex];
  return {
    title: "会转到谁的位置",
    prompt: `摩天轮顺时针转 ${steps} 格后，${animal}会转到谁原来的位置上？`,
    mode: "rotate",
    targetSteps: steps,
    choices: buildChoiceSet(answer, BASE_WHEEL),
    answer,
    hints: [
      `先找到${animal}的起点。`,
      `再顺时针数 ${steps} 格。`,
      "最后看停下来的那个座位原来是谁的。"
    ],
    solutionSteps: [
      stepText(`先找到${animal}一开始的位置。`, { slotIndex: animalSlot(animal) }),
      stepText(`顺时针数 ${steps} 格。`, { slotIndex, sceneSteps: steps }),
      stepText(`${animal}最后停在${answer}原来的位置，所以答案是${answer}。`, { slotIndex, sceneSteps: steps, answer })
    ]
  };
}

function createQueueWatcherPositionQuestion(queueAnimals, targetAnimal, targetOwner, watchAnimal) {
  const scene = simulateQueueUntilWithOrder(queueAnimals, targetAnimal, animalSlot(targetOwner));
  const answerOwner = findAnimalOriginalPositionOwner(scene.wheel, watchAnimal);
  const answer = `${answerOwner}的位置`;
  return {
    title: "排队后看另一个位置",
    prompt: `如果排队的${targetAnimal}坐到${targetOwner}的位置上，那么${watchAnimal}会坐到哪个位置上？`,
    mode: "queue",
    queueAnimals,
    queueTargetAnimal: targetAnimal,
    queueTargetSlot: animalSlot(targetOwner),
    choices: buildChoiceSet(answer, buildPositionPool()),
    answer,
    hints: [
      "排队的小动物先从最下面上车。",
      "每转一格，下一只排队的小动物会补到最下面。",
      `等${targetAnimal}转到${targetOwner}原来的位置时，再看${watchAnimal}。`
    ],
    solutionSteps: buildQueuePositionSteps(targetAnimal, targetOwner, watchAnimal, answerOwner)
  };
}

function createQueueBoardQuestion(queueAnimals, boardAnimal) {
  const answerOwner = computeBoardingOwner(queueAnimals, boardAnimal);
  const answer = `${answerOwner}的位置`;
  return {
    title: "刚上车时坐哪里",
    prompt: `排队的${boardAnimal}刚坐上摩天轮时，它坐到哪个位置上？`,
    mode: "queue",
    queueAnimals,
    queueTargetAnimal: boardAnimal,
    queueTargetBoardingOnly: true,
    choices: buildChoiceSet(answer, buildPositionPool()),
    answer,
    hints: [
      "先看队伍顺序，谁先上车谁后上车。",
      "每次上车都坐到最下面的位置。",
      `轮到${boardAnimal}上车时，看看最下面原来是谁的位置。`
    ],
    solutionSteps: [
      stepText("先按排队顺序让前面的动物依次上车。"),
      stepText(`轮到${boardAnimal}时，它会坐到最下面。`, { slotIndex: BOTTOM_SLOT_INDEX, queueAnimal: boardAnimal }),
      stepText(`最下面原来是${answerOwner}的位置，所以答案是${answerOwner}的位置。`, {
        slotIndex: BOTTOM_SLOT_INDEX,
        queueAnimal: boardAnimal,
        answer
      })
    ]
  };
}

function createQueueTopQuestion(queueAnimals, targetAnimal, targetOwner) {
  const scene = simulateQueueUntilWithOrder(queueAnimals, targetAnimal, animalSlot(targetOwner));
  const answer = scene.wheel[0];
  return {
    title: "排队后看最上面",
    prompt: `如果排队的${targetAnimal}坐到${targetOwner}的位置上，那么最上面是谁？`,
    mode: "queue",
    queueAnimals,
    queueTargetAnimal: targetAnimal,
    queueTargetSlot: animalSlot(targetOwner),
    choices: buildChoiceSet(answer, [...BASE_WHEEL, ...queueAnimals]),
    answer,
    hints: [
      "先让排队的小动物按顺序上车。",
      `等${targetAnimal}转到${targetOwner}原来的位置。`,
      "再去看最上面的那个座位。"
    ],
    solutionSteps: [
      stepText(`先让${targetAnimal}按队伍顺序上车。`, { queueAnimal: targetAnimal }),
      stepText(`继续顺时针转，直到${targetAnimal}来到${targetOwner}原来的位置。`, {
        sceneQueueTarget: { animal: targetAnimal, slot: animalSlot(targetOwner) }
      }),
      stepText(`这时最上面是${answer}，所以答案是${answer}。`, {
        sceneQueueTarget: { animal: targetAnimal, slot: animalSlot(targetOwner) },
        slotIndex: 0,
        answer
      })
    ]
  };
}

// ========== 题库结构 ==========

export function createQuestionTypes() {
  const queueOrders = {
    A: ["小老鼠", "小狗", "小猪"],
    B: ["小狗", "小猪", "小老鼠"],
    C: ["小猪", "小老鼠", "小狗"],
    D: ["小老鼠", "小猪", "小狗"],
    E: ["小狗", "小老鼠", "小猪"]
  };

  return [
    {
      id: "T1",
      zoneId: "observe",
      title: "先学会看位置",
      summary: "找顺时针下一格",
      questions: ["兔子", "青蛙", "小熊", "熊猫", "小浣熊"].map((animal) => createObserveNextQuestion(animal))
    },
    {
      id: "T2",
      zoneId: "observe",
      title: "找同样高的小伙伴",
      summary: "看谁和谁一样高",
      questions: ["青蛙", "小熊", "小松鼠", "熊猫", "小猴子"].map((animal) => createSameHeightQuestion(animal))
    },
    {
      id: "T3",
      zoneId: "observe",
      title: "认识最高的位置",
      summary: "看最上面的位置",
      questions: [0, 1, 2, 3, 4].map((steps) => createTopQuestion(steps))
    },
    {
      id: "T4",
      zoneId: "observe",
      title: "认识前后位置",
      summary: "找逆时针前一格",
      questions: ["熊猫", "小猴子", "小浣熊", "狐狸", "小松鼠"].map((animal) => createCounterclockwiseQuestion(animal))
    },
    {
      id: "T5",
      zoneId: "rotate",
      title: "转到指定位置",
      summary: "转到目标后再找同高",
      questions: [
        createRotateSameHeightQuestion("狐狸", "小猴子", "小松鼠"),
        createRotateSameHeightQuestion("兔子", "小熊", "熊猫"),
        createRotateSameHeightQuestion("小松鼠", "狐狸", "小猴子"),
        createRotateSameHeightQuestion("熊猫", "小浣熊", "青蛙"),
        createRotateSameHeightQuestion("青蛙", "熊猫", "小猴子")
      ]
    },
    {
      id: "T6",
      zoneId: "rotate",
      title: "转动后再找同高",
      summary: "换一组动物继续推理",
      questions: [
        createRotateSameHeightQuestion("兔子", "狐狸", "小松鼠"),
        createRotateSameHeightQuestion("小猴子", "小熊", "小松鼠"),
        createRotateSameHeightQuestion("小浣熊", "小松鼠", "小猴子"),
        createRotateSameHeightQuestion("小熊", "小浣熊", "熊猫"),
        createRotateSameHeightQuestion("狐狸", "青蛙", "小熊")
      ]
    },
    {
      id: "T7",
      zoneId: "rotate",
      title: "转几格看谁来",
      summary: "谁坐到某个原来的位置上",
      questions: [
        createRotateOccupyQuestion("兔子", 1),
        createRotateOccupyQuestion("青蛙", 2),
        createRotateOccupyQuestion("小熊", 3),
        createRotateOccupyQuestion("熊猫", 4),
        createRotateOccupyQuestion("小猴子", 5)
      ]
    },
    {
      id: "T8",
      zoneId: "rotate",
      title: "转几格看终点",
      summary: "某只动物会到谁原来的位置",
      questions: [
        createRotateDestinationQuestion("小猴子", 3),
        createRotateDestinationQuestion("狐狸", 2),
        createRotateDestinationQuestion("熊猫", 4),
        createRotateDestinationQuestion("小浣熊", 1),
        createRotateDestinationQuestion("兔子", 6)
      ]
    },
    {
      id: "T9",
      zoneId: "queue",
      title: "排队后看位置",
      summary: "目标动物到了以后再看别人的位置",
      questions: [
        createQueueWatcherPositionQuestion(queueOrders.A, "小老鼠", "小熊", "小猪"),
        createQueueWatcherPositionQuestion(queueOrders.B, "小狗", "兔子", "小老鼠"),
        createQueueWatcherPositionQuestion(queueOrders.C, "小老鼠", "小猴子", "小狗"),
        createQueueWatcherPositionQuestion(queueOrders.D, "小狗", "熊猫", "小老鼠"),
        createQueueWatcherPositionQuestion(queueOrders.E, "小猪", "小熊", "小老鼠")
      ]
    },
    {
      id: "T10",
      zoneId: "queue",
      title: "谁先坐到底部",
      summary: "看刚上车时坐在哪个位置",
      questions: [
        createQueueBoardQuestion(queueOrders.A, "小老鼠"),
        createQueueBoardQuestion(queueOrders.A, "小狗"),
        createQueueBoardQuestion(queueOrders.A, "小猪"),
        createQueueBoardQuestion(queueOrders.B, "小老鼠"),
        createQueueBoardQuestion(queueOrders.C, "小老鼠")
      ]
    },
    {
      id: "T11",
      zoneId: "queue",
      title: "第二只小动物去哪儿",
      summary: "目标动物到位后再看另一只",
      questions: [
        createQueueWatcherPositionQuestion(queueOrders.A, "小老鼠", "小熊", "小狗"),
        createQueueWatcherPositionQuestion(queueOrders.B, "小猪", "兔子", "小狗"),
        createQueueWatcherPositionQuestion(queueOrders.C, "小狗", "小猴子", "小猪"),
        createQueueWatcherPositionQuestion(queueOrders.D, "小猪", "熊猫", "小狗"),
        createQueueWatcherPositionQuestion(queueOrders.E, "小老鼠", "小猴子", "小猪")
      ]
    },
    {
      id: "T12",
      zoneId: "queue",
      title: "最上面的新朋友",
      summary: "目标动物到位后看最上面",
      questions: [
        createQueueTopQuestion(queueOrders.A, "小老鼠", "小熊"),
        createQueueTopQuestion(queueOrders.B, "小狗", "小猴子"),
        createQueueTopQuestion(queueOrders.C, "小猪", "熊猫"),
        createQueueTopQuestion(queueOrders.D, "小狗", "兔子"),
        createQueueTopQuestion(queueOrders.B, "小老鼠", "兔子")
      ]
    }
  ].map((type, index) => ({
    ...type,
    typeNumber: index + 1
  }));
}

export function flattenQuestionTypes(types) {
  let globalIndex = 0;
  return types.flatMap((type) => {
    const zone = ZONES.find((item) => item.id === type.zoneId);
    return type.questions.map((question, questionIndex) => {
      const level = {
        ...question,
        id: `${type.id}-Q${questionIndex + 1}`,
        typeId: type.id,
        typeTitle: type.title,
        typeSummary: type.summary,
        typeNumber: type.typeNumber,
        questionNumber: questionIndex + 1,
        zoneId: zone.id,
        zoneName: zone.name,
        number: globalIndex + 1,
        index: globalIndex
      };
      globalIndex += 1;
      return level;
    });
  });
}
