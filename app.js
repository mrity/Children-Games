"use strict";

const STORAGE_KEY = "ferris-wheel-park-progress-v2";
const ROTATE_MS = 520;
const AUTO_ADVANCE_DELAY_MS = 1100;
const PLAYBACK_STEP_DELAY_MS = 1700;
const ROTATION_STEP_INTERVAL_MS = 80;

const WHEEL_SLOT_COUNT = 8;
const BOTTOM_SLOT_INDEX = 4;

const STARS_PERFECT = 3;
const STARS_GOOD = 2;
const STARS_PASS = 1;

const COACH_DEFAULT = "先看看摩天轮上的小动物都坐在哪里。";
const BASE_WHEEL = ["兔子", "青蛙", "小熊", "小松鼠", "狐狸", "熊猫", "小猴子", "小浣熊"];
const QUEUE_ANIMALS = ["小老鼠", "小狗", "小猪"];
const SAME_HEIGHT_SLOT = {
  1: 7,
  2: 6,
  3: 5,
  5: 3,
  6: 2,
  7: 1
};

const ANIMAL_STYLES = {
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

const ZONES = [
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

const QUESTION_TYPES = createQuestionTypes();
const LEVELS = flattenQuestionTypes(QUESTION_TYPES);

const dom = {};
const state = {
  currentScreen: "home",
  currentLevelId: LEVELS[0].id,
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
  progress: createEmptyProgress()
};

document.addEventListener("DOMContentLoaded", () => {
  state.progress = loadProgress();
  cacheDom();
  renderWheelSpokes();
  bindEvents();
  navigateTo("home");
  renderAll();
});

function cacheDom() {
  dom.screens = document.querySelectorAll(".screen");
  dom.navButtons = document.querySelectorAll("[data-nav]");
  dom.startJourneyButton = document.querySelector("#start-journey-button");
  dom.homeProgressButton = document.querySelector("#home-progress-button");
  dom.mapSummary = document.querySelector("#map-summary");
  dom.zoneList = document.querySelector("#zone-list");
  dom.backToMapButton = document.querySelector("#back-to-map-button");
  dom.gameZoneLabel = document.querySelector("#game-zone-label");
  dom.gameTitle = document.querySelector("#game-title");
  dom.gameLevelBadge = document.querySelector("#game-level-badge");
  dom.challengeZoneText = document.querySelector("#challenge-zone-text");
  dom.answerStatusBadge = document.querySelector("#answer-status-badge");
  dom.challengeTitle = document.querySelector("#challenge-title");
  dom.challengePrompt = document.querySelector("#challenge-prompt");
  dom.answerGrid = document.querySelector("#answer-grid");
  dom.feedbackBox = document.querySelector("#feedback-box");
  dom.hintButton = document.querySelector("#hint-button");
  dom.hintCounter = document.querySelector("#hint-counter");
  dom.hintBox = document.querySelector("#hint-box");
  dom.rotateNowButton = document.querySelector("#rotate-now-button");
  dom.rotateDirection = document.querySelector("#rotate-direction");
  dom.rotateSpeed = document.querySelector("#rotate-speed");
  dom.rotateCircles = document.querySelector("#rotate-circles");
  dom.rotateSteps = document.querySelector("#rotate-steps");
  dom.resetSceneButton = document.querySelector("#reset-scene-button");
  dom.solutionButton = document.querySelector("#solution-button");
  dom.coachStatus = document.querySelector("#coach-status");
  dom.coachBubble = document.querySelector("#coach-bubble");
  dom.wheelBody = document.querySelector("#wheel-body");
  dom.wheelSpokes = document.querySelector("#wheel-spokes");
  dom.cabinLayer = document.querySelector("#cabin-layer");
  dom.queueLine = document.querySelector("#queue-line");
  dom.queueTip = document.querySelector("#queue-tip");
  dom.miniProgressText = document.querySelector("#mini-progress-text");
  dom.miniProgressGrid = document.querySelector("#mini-progress-grid");
  dom.progressStats = document.querySelector("#progress-stats");
  dom.recordList = document.querySelector("#record-list");
  dom.resultOverlay = document.querySelector("#result-overlay");
  dom.resultCaption = document.querySelector("#result-caption");
  dom.resultTitle = document.querySelector("#result-title");
  dom.resultStars = document.querySelector("#result-stars");
  dom.resultText = document.querySelector("#result-text");
  dom.reviewLevelButton = document.querySelector("#review-level-button");
  dom.nextLevelButton = document.querySelector("#next-level-button");
  dom.resultMapButton = document.querySelector("#result-map-button");
  dom.exportProgressButton = document.querySelector("#export-progress-button");
  dom.importProgressButton = document.querySelector("#import-progress-button");
  dom.importProgressFile = document.querySelector("#import-progress-file");
}

function bindEvents() {
  dom.navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      navigateTo(button.dataset.nav);
    });
  });

  dom.answerGrid.addEventListener("click", (event) => {
    const button = event.target.closest(".answer-button");
    if (button && button.dataset.answer) {
      submitAnswer(button.dataset.answer);
    }
  });

  dom.startJourneyButton.addEventListener("click", () => navigateTo("map"));
  dom.homeProgressButton.addEventListener("click", () => navigateTo("progress"));
  dom.backToMapButton.addEventListener("click", () => navigateTo("map"));
  dom.rotateNowButton.addEventListener("click", () => advanceScene());
  dom.rotateSpeed.addEventListener("change", () => {
    state.rotateDuration = Number(dom.rotateSpeed.value) || ROTATE_MS;
    renderScene();
  });
  dom.resetSceneButton.addEventListener("click", () => resetCurrentLevelScene());
  dom.hintButton.addEventListener("click", () => revealHint());
  dom.solutionButton.addEventListener("click", () => playSolution());
  dom.reviewLevelButton.addEventListener("click", () => {
    hideResultOverlay();
    playSolution();
  });
  dom.nextLevelButton.addEventListener("click", () => startNextLevel());
  dom.resultMapButton.addEventListener("click", () => {
    hideResultOverlay();
    navigateTo("map");
  });
  dom.exportProgressButton.addEventListener("click", () => exportProgress());
  dom.importProgressButton.addEventListener("click", () => {
    dom.importProgressFile.click();
  });
  dom.importProgressFile.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      importProgress(file);
    }
  });

  window.addEventListener("resize", () => {
    if (state.currentScreen === "game") {
      renderScene();
    }
  });
}

function renderAll() {
  renderNav();
  renderMap();
  renderGame();
  renderProgress();
}

function renderNav() {
  dom.navButtons.forEach((button) => {
    const isActive = button.dataset.nav === state.currentScreen;
    button.classList.toggle("is-active", isActive);
  });
}

function navigateTo(screenName) {
  if (screenName !== "game") {
    clearPlayback();
  }

  state.currentScreen = screenName;
  document.body.classList.toggle("is-game-screen", screenName === "game");

  dom.screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.id === `screen-${screenName}`);
  });

  renderNav();

  if (screenName === "map") {
    renderMap();
  }
  if (screenName === "progress") {
    renderProgress();
  }
  if (screenName === "game") {
    renderGame();
  }
}

function renderMap() {
  const completed = state.progress.completedLevelIds.length;
  const totalStars = LEVELS.reduce((sum, level) => sum + getBestStars(level.id), 0);
  const unlocked = getUnlockedLevelCount();

  dom.mapSummary.innerHTML = [
    summaryCardHtml("已完成", `${completed} / ${LEVELS.length}`),
    summaryCardHtml("已解锁", `${unlocked} 题`),
    summaryCardHtml("星星", `${totalStars} 颗`)
  ].join("");

  dom.zoneList.innerHTML = ZONES.map((zone) => renderZoneCard(zone)).join("");
  dom.zoneList.querySelectorAll(".question-chip").forEach((button) => {
    button.addEventListener("click", () => {
      const level = levelById(button.dataset.levelId);
      if (level && isLevelUnlocked(level.number)) {
        startLevel(level.id);
      }
    });
  });
}

function renderZoneCard(zone) {
  const zoneLevels = LEVELS.filter((level) => level.zoneId === zone.id);
  const zoneTypes = QUESTION_TYPES.filter((type) => type.zoneId === zone.id);
  const completedCount = zoneLevels.filter((level) => isLevelComplete(level.id)).length;

  return `
    <article class="zone-card">
      <div class="zone-card-header">
        <div>
          <h3>${zone.name}</h3>
          <p>${zone.subtitle}</p>
        </div>
        <span class="zone-theme-band" style="background:${zone.color};">${zone.band}</span>
      </div>
      <div class="type-card-grid">
        ${zoneTypes.map((type) => renderTypeCard(type)).join("")}
      </div>
      <p>本区域已完成 ${completedCount} / ${zoneLevels.length} 题。</p>
    </article>
  `;
}

function renderTypeCard(type) {
  const typeLevels = levelsByType(type.id);
  const completedCount = typeLevels.filter((level) => isLevelComplete(level.id)).length;

  return `
    <div class="type-card">
      <div class="type-card-header">
        <strong>第 ${type.typeNumber} 类</strong>
        <span>${completedCount} / ${typeLevels.length}</span>
      </div>
      <h4>${type.title}</h4>
      <p>${type.summary}</p>
      <div class="question-chip-grid">
        ${typeLevels.map((level) => renderQuestionChip(level)).join("")}
      </div>
    </div>
  `;
}

function renderQuestionChip(level) {
  const unlocked = isLevelUnlocked(level.number);
  const done = isLevelComplete(level.id);
  const classNames = ["question-chip"];

  if (!unlocked) {
    classNames.push("is-locked");
  }
  if (done) {
    classNames.push("is-done");
  }
  if (level.id === state.currentLevelId && state.currentScreen === "game") {
    classNames.push("is-current");
  }

  return `
    <button class="${classNames.join(" ")}" data-level-id="${level.id}" ${unlocked ? "" : "disabled"}>
      ${level.questionNumber}
    </button>
  `;
}

function renderGame() {
  const level = currentLevel();
  if (!level) {
    return;
  }

  if (!state.scene) {
    state.scene = createSceneForLevel(level);
  }

  hideAnswerStatusBadge();
  dom.gameZoneLabel.textContent = `${level.zoneName} · 第 ${level.typeNumber} 类题型`;
  dom.gameTitle.textContent = `${level.typeTitle} · 第 ${level.questionNumber} 题`;
  dom.gameLevelBadge.textContent = `${level.number} / ${LEVELS.length}`;
  dom.challengeZoneText.textContent = `第 ${level.typeNumber} 类 · ${level.zoneName}`;
  dom.challengeTitle.textContent = level.typeTitle;
  dom.challengePrompt.textContent = `第 ${level.questionNumber} 题：${level.prompt}`;

  renderAnswers();
  renderScene();
  renderHintPanel();
  renderMiniProgress();
  setCoach("观察中", COACH_DEFAULT);
}

function renderAnswers() {
  const level = currentLevel();
  dom.answerGrid.innerHTML = level.choices.map((choice) => `
    <button class="answer-button" data-answer="${choice}">${choice}</button>
  `).join("");
  setAnswerButtonsDisabled(state.isAutoAdvancing);
}

function renderScene() {
  if (!state.scene) {
    return;
  }

  const slots = getSlotLayout();
  dom.cabinLayer.style.setProperty("--rotate-duration", `${state.rotateDuration}ms`);
  dom.wheelBody.style.transform = "rotate(0deg)";
  dom.cabinLayer.innerHTML = state.scene.wheel.map((animal, slotIndex) => renderCabin(animal, slotIndex, slots[slotIndex])).join("");
  dom.queueLine.innerHTML = state.scene.queue.map((animal) => renderQueueAnimal(animal)).join("");
  dom.queueTip.textContent = state.scene.queue.length ? "等候中的小动物" : "排队区暂时空了";
}

function renderCabin(animal, slotIndex, slot) {
  const style = ANIMAL_STYLES[animal] || { color: "#ffffff", short: animal, avatar: "🐾" };
  return `
    <div class="animal-cabin" data-slot-index="${slotIndex}" data-animal="${animal}" style="--slot-x:${slot.x}px; --slot-y:${slot.y}px; background:${style.color};">
      <div class="animal-cabin-inner">
        <span class="animal-avatar" aria-hidden="true">${style.avatar}</span>
        <span class="animal-name">${animal}</span>
      </div>
    </div>
  `;
}

function renderQueueAnimal(animal) {
  const style = ANIMAL_STYLES[animal] || { color: "#ffffff", avatar: "🐾" };
  return `
    <div class="queue-animal" data-queue-animal="${animal}" style="background:${style.color};">
      <span class="queue-avatar" aria-hidden="true">${style.avatar}</span>
      <span class="queue-name">${animal}</span>
    </div>
  `;
}

function renderWheelSpokes() {
  dom.wheelSpokes.innerHTML = Array.from({ length: WHEEL_SLOT_COUNT }, (_, index) => {
    const angle = index * 45;
    return `<div class="wheel-spoke" style="transform: rotate(${angle}deg);"></div>`;
  }).join("");
}

function renderHintPanel() {
  const level = currentLevel();
  dom.hintCounter.textContent = `提示 ${state.hintsShown} / ${level.hints.length}`;
  if (!state.hintsShown) {
    dom.hintBox.textContent = "需要的时候点一下“看提示”，系统会一步一步提醒你。";
    return;
  }
  dom.hintBox.innerHTML = `<ul>${level.hints.slice(0, state.hintsShown).map((hint) => `<li>${hint}</li>`).join("")}</ul>`;
}

function renderMiniProgress() {
  const currentTypeLevels = levelsByType(currentLevel().typeId);
  const completed = currentTypeLevels.filter((level) => isLevelComplete(level.id)).length;
  dom.miniProgressText.textContent = `${completed} / ${currentTypeLevels.length}`;
  dom.miniProgressGrid.innerHTML = currentTypeLevels.map((level) => {
    const classNames = ["mini-level-dot"];
    if (level.id === state.currentLevelId) {
      classNames.push("is-current");
    } else if (isLevelComplete(level.id)) {
      classNames.push("is-done");
    } else if (!isLevelUnlocked(level.number)) {
      classNames.push("is-locked");
    }
    return `<div class="${classNames.join(" ")}">${level.questionNumber}</div>`;
  }).join("");
}

function renderProgress() {
  const totalStars = LEVELS.reduce((sum, level) => sum + getBestStars(level.id), 0);
  dom.progressStats.innerHTML = [
    progressCardHtml("闯关完成", `${state.progress.completedLevelIds.length} / ${LEVELS.length}`),
    progressCardHtml("收集星星", `${totalStars} 颗`),
    progressCardHtml("用了提示", `${state.progress.stats.hintsUsed} 次`)
  ].join("");

  dom.recordList.innerHTML = ZONES.map((zone) => renderRecordCard(zone)).join("");
}

function renderRecordCard(zone) {
  const zoneTypes = QUESTION_TYPES.filter((type) => type.zoneId === zone.id);
  return `
    <article class="record-card">
      <div class="record-card-header">
        <div>
          <h3>${zone.name}</h3>
          <p>${zone.subtitle}</p>
        </div>
      </div>
      <div class="type-card-grid">
        ${zoneTypes.map((type) => renderRecordTypeCard(type)).join("")}
      </div>
    </article>
  `;
}

function renderRecordTypeCard(type) {
  const typeLevels = levelsByType(type.id);
  const completedCount = typeLevels.filter((level) => isLevelComplete(level.id)).length;
  const starCount = typeLevels.reduce((sum, level) => sum + getBestStars(level.id), 0);

  return `
    <div class="record-chip">
      <strong>第 ${type.typeNumber} 类</strong>
      <div>${type.title}</div>
      <div>已完成 ${completedCount} / ${typeLevels.length} 题</div>
      <div>累计 ${starCount} 颗星</div>
    </div>
  `;
}

function summaryCardHtml(label, value) {
  return `<div class="summary-card"><strong>${value}</strong><p>${label}</p></div>`;
}

function progressCardHtml(label, value) {
  return `<div class="progress-card"><strong>${value}</strong><p>${label}</p></div>`;
}

function startLevel(levelId) {
  hideResultOverlay();
  state.currentLevelId = levelId;
  resetLevelState();
  state.scene = createSceneForLevel(currentLevel());
  navigateTo("game");
}

function resetLevelState() {
  clearPlayback();
  state.selectedAnswer = "";
  state.wrongAttempts = 0;
  state.hintsShown = 0;
  state.solutionViewed = false;
  state.rotateDuration = Number(dom.rotateSpeed.value) || ROTATE_MS;
  hideAnswerStatusBadge();
  setFeedback("选一个你认为正确的答案吧。");
  renderHintPanel();
}

function resetCurrentLevelScene() {
  if (state.isAutoAdvancing) {
    return;
  }

  clearPlayback();
  state.scene = createSceneForLevel(currentLevel());
  setCoach("观察中", COACH_DEFAULT);
  setFeedback("已经回到最开始的样子，可以重新观察啦。");
  renderScene();
}

function currentLevel() {
  return levelById(state.currentLevelId);
}

function levelById(levelId) {
  return LEVELS.find((level) => level.id === levelId);
}

function levelsByType(typeId) {
  return LEVELS.filter((level) => level.typeId === typeId);
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

function createEmptyProgress() {
  return {
    version: 1,
    completedLevelIds: [],
    starsByLevel: {},
    stats: {
      hintsUsed: 0,
      solutionsViewed: 0,
      totalAttempts: 0
    },
    recordsByLevel: {}
  };
}

function normalizeProgress(parsed) {
  const fallback = createEmptyProgress();

  if (!parsed || typeof parsed !== "object") {
    return fallback;
  }

  if (Array.isArray(parsed.completedLevelIds)) {
    return {
      ...fallback,
      ...parsed,
      stats: { ...fallback.stats, ...parsed.stats },
      starsByLevel: { ...fallback.starsByLevel, ...parsed.starsByLevel },
      recordsByLevel: { ...fallback.recordsByLevel, ...parsed.recordsByLevel }
    };
  }

  const legacyIds = LEVELS.map((level) => level.id).filter((id) => parsed[id] && typeof parsed[id] === "object");
  if (!legacyIds.length) {
    return fallback;
  }

  const migrated = createEmptyProgress();
  legacyIds.forEach((id) => {
    const item = parsed[id];
    if (item.completed) {
      migrated.completedLevelIds.push(id);
    }
    migrated.starsByLevel[id] = Number(item.stars) || 0;
    migrated.recordsByLevel[id] = {
      attempts: Number(item.wrongAttempts || 0) + (item.completed ? 1 : 0),
      hintsUsed: Number(item.hintsShown) || 0,
      solutionViewed: Boolean(item.solutionViewed),
      lastPlayedAt: ""
    };
    migrated.stats.hintsUsed += Number(item.hintsShown) || 0;
    migrated.stats.solutionsViewed += item.solutionViewed ? 1 : 0;
  });
  return migrated;
}

function loadProgress() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createEmptyProgress();
    }
    return normalizeProgress(JSON.parse(raw));
  } catch (error) {
    return createEmptyProgress();
  }
}

function saveProgress() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
}

function exportProgress() {
  try {
    const exportData = {
      version: state.progress.version || 1,
      exportDate: new Date().toISOString(),
      data: state.progress
    };
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ferris-wheel-progress-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert("进度已经导出成功。");
  } catch (error) {
    alert(`导出失败：${error.message}`);
  }
}

function importProgress(file) {
  const reader = new FileReader();

  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (!imported.data) {
        throw new Error("导入文件中没有找到进度数据。");
      }

      const normalized = normalizeProgress(imported.data);
      const confirmed = window.confirm(
        `确定要导入进度吗？\n\n导出时间：${imported.exportDate ? new Date(imported.exportDate).toLocaleString() : "未知"}\n已完成关卡：${normalized.completedLevelIds.length} / ${LEVELS.length}\n\n当前进度会被覆盖。`
      );

      if (!confirmed) {
        dom.importProgressFile.value = "";
        return;
      }

      state.progress = normalized;
      saveProgress();
      renderAll();
      dom.importProgressFile.value = "";
      alert("进度导入成功。");
    } catch (error) {
      alert(`导入失败：${error.message}`);
      dom.importProgressFile.value = "";
    }
  };

  reader.onerror = () => {
    alert("读取文件失败。");
    dom.importProgressFile.value = "";
  };

  reader.readAsText(file);
}

function getLevelRecord(levelId) {
  if (!state.progress.recordsByLevel[levelId]) {
    state.progress.recordsByLevel[levelId] = {
      attempts: 0,
      hintsUsed: 0,
      solutionViewed: false,
      lastPlayedAt: ""
    };
  }
  return state.progress.recordsByLevel[levelId];
}

function getBestStars(levelId) {
  return state.progress.starsByLevel[levelId] || 0;
}

function isLevelComplete(levelId) {
  return state.progress.completedLevelIds.includes(levelId);
}

function getUnlockedLevelCount() {
  return Math.min(LEVELS.length, state.progress.completedLevelIds.length + 1);
}

function isLevelUnlocked(levelNumber) {
  return levelNumber <= getUnlockedLevelCount();
}

function getSlotLayout() {
  const size = dom.wheelBody.clientWidth || 380;
  const radius = size * 0.38;
  return Array.from({ length: WHEEL_SLOT_COUNT }, (_, slotIndex) => {
    const angle = (-90 + slotIndex * 45) * (Math.PI / 180);
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  });
}

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

function advanceScene() {
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

  const level = currentLevel();
  let finishedSteps = 0;

  state.isRotating = true;
  setMotionDisabled(true);

  const runOneStep = () => {
    animateWheelTurn(direction, () => {
      applyRotationByDirection(level, direction);
      finishedSteps += 1;
      renderScene();
      setCoach("转动中", buildRotationMessage(level.mode, direction, finishedSteps, steps));
      if (finishedSteps >= steps) {
        state.isRotating = false;
        setMotionDisabled(false);
        return;
      }
      state.rotationTimer = window.setTimeout(runOneStep, ROTATION_STEP_INTERVAL_MS);
    });
  };

  runOneStep();
}

function revealHint() {
  if (state.isAutoAdvancing) {
    return;
  }

  const level = currentLevel();
  if (state.hintsShown >= level.hints.length) {
    setFeedback("提示已经全部看完啦，试着自己想一想。");
    return;
  }

  state.hintsShown += 1;
  state.progress.stats.hintsUsed += 1;
  getLevelRecord(level.id).hintsUsed += 1;
  saveProgress();
  renderHintPanel();
  setCoach("提示中", level.hints[state.hintsShown - 1]);
}

function submitAnswer(answer) {
  if (state.isPlayingSolution || state.isRotating || state.isAutoAdvancing) {
    return;
  }

  const level = currentLevel();
  state.selectedAnswer = answer;
  state.progress.stats.totalAttempts += 1;

  const record = getLevelRecord(level.id);
  record.attempts += 1;
  record.lastPlayedAt = new Date().toISOString();

  const buttons = [...dom.answerGrid.querySelectorAll(".answer-button")];
  buttons.forEach((button) => {
    button.classList.remove("is-correct", "is-wrong");
    if (button.dataset.answer === answer) {
      button.classList.add(answer === level.answer ? "is-correct" : "is-wrong");
    }
    if (button.dataset.answer === level.answer && answer === level.answer) {
      button.classList.add("is-correct");
    }
  });

  if (answer === level.answer) {
    const stars = computeStars();
    finishLevel(level.id, stars);
    state.isAutoAdvancing = true;
    setCoach("答对啦", `做得对，答案是${level.answer}。`);
    setFeedback(`答对了。${buildCorrectReason(level)}`);
    showAnswerStatusBadge(stars);
    setMotionDisabled(true);
    setAnswerButtonsDisabled(true);
    queueAutoAdvance();
  } else {
    state.wrongAttempts += 1;
    hideAnswerStatusBadge();
    saveProgress();
    setCoach("再想想", "这次不对，先回到题目里找关键位置。");
    setFeedback("还不对哦。先看看题目里是谁在移动，再找最后要看的位置。");
  }
}

function playSolution() {
  if (state.isAutoAdvancing) {
    return;
  }

  const level = currentLevel();
  clearPlayback();
  state.solutionViewed = true;
  state.progress.stats.solutionsViewed += 1;
  getLevelRecord(level.id).solutionViewed = true;
  saveProgress();
  setFeedback("正在回放思路，请跟着高亮位置一起看。");
  setMotionDisabled(true);
  state.isPlayingSolution = true;

  const steps = level.solutionSteps || [];
  let currentStep = 0;

  const showStep = () => {
    if (currentStep >= steps.length) {
      state.isPlayingSolution = false;
      setMotionDisabled(false);
      setCoach("讲解完成", "讲解看完了，现在可以自己试着回答。");
      return;
    }

    const step = steps[currentStep];
    applySolutionStep(step, level);
    currentStep += 1;
    state.playbackTimer = window.setTimeout(showStep, PLAYBACK_STEP_DELAY_MS);
  };

  showStep();
}

function applySolutionStep(step, level) {
  let previewScene = cloneScene(createSceneForLevel(level));

  if (typeof step.sceneSteps === "number") {
    if (level.mode === "queue") {
      for (let index = 0; index < step.sceneSteps; index += 1) {
        rotateQueueScene(previewScene);
      }
    } else {
      previewScene.wheel = applyRotationSteps(previewScene.wheel, step.sceneSteps);
      previewScene.rotationCount = step.sceneSteps;
    }
  }

  if (step.sceneQueueTarget) {
    previewScene = simulateQueueUntilWithOrder(level.queueAnimals || QUEUE_ANIMALS, step.sceneQueueTarget.animal, step.sceneQueueTarget.slot);
  }

  state.scene = previewScene;
  renderScene();
  clearHighlights();

  if (typeof step.slotIndex === "number") {
    highlightSlot(step.slotIndex, step.answer ? "is-answer" : "is-highlighted");
  }
  if (step.queueAnimal) {
    highlightQueueAnimal(step.queueAnimal);
    highlightCabinAnimal(step.queueAnimal, step.answer ? "is-answer" : "is-highlighted");
  }
  if (step.answer) {
    highlightAnswerButton(step.answer);
  }

  setCoach("讲解中", step.text);
}

function finishLevel(levelId, stars) {
  if (!state.progress.completedLevelIds.includes(levelId)) {
    state.progress.completedLevelIds.push(levelId);
  }
  state.progress.starsByLevel[levelId] = Math.max(getBestStars(levelId), stars);
  saveProgress();
  renderAll();
}

function computeStars() {
  if (state.wrongAttempts === 1) {
    return STARS_GOOD;
  }
  if (state.wrongAttempts >= 2) {
    return STARS_PASS;
  }
  return STARS_PERFECT;
}

function buildCorrectReason(level) {
  if (level.mode === "queue" && level.answer.includes("位置")) {
    return "排队区的小动物会从最下面上车，再跟着摩天轮一起转动。";
  }
  if (level.mode === "rotate") {
    return "先算转了几格，再看目标位置上的小动物。";
  }
  return "先找准位置，再按题目要求去看对应的小动物。";
}

function showResultOverlay(level, stars) {
  dom.resultCaption.textContent = `${level.zoneName}完成`;
  dom.resultTitle.textContent = `第 ${level.typeNumber} 类 · 第 ${level.questionNumber} 题完成啦`;
  dom.resultStars.innerHTML = Array.from({ length: 3 }, (_, index) => {
    const active = index < stars;
    return `<span class="star-token${active ? "" : " is-off"}">★</span>`;
  }).join("");
  dom.resultText.textContent = stars === 3
    ? "一遍就观察对了，真厉害。"
    : stars === 2
      ? "已经答对啦，再多观察一点还能拿更多星星。"
      : "看完讲解也能学会，继续加油。";
  dom.resultOverlay.classList.remove("hidden");

  const nextLevel = LEVELS[level.index + 1];
  dom.nextLevelButton.disabled = !nextLevel;
}

function hideResultOverlay() {
  dom.resultOverlay.classList.add("hidden");
}

function startNextLevel() {
  hideResultOverlay();
  const nextLevel = LEVELS[currentLevel().index + 1];
  if (!nextLevel) {
    navigateTo("map");
    return;
  }
  startLevel(nextLevel.id);
}

function setFeedback(text) {
  dom.feedbackBox.textContent = text;
}

function showAnswerStatusBadge(stars) {
  dom.answerStatusBadge.innerHTML = `
    <span class="answer-status-text">答对啦</span>
    <span class="answer-status-stars" aria-hidden="true">
      ${Array.from({ length: 3 }, (_, index) => {
        const active = index < stars;
        return `<span class="star-token${active ? "" : " is-off"}">★</span>`;
      }).join("")}
    </span>
  `;
  dom.answerStatusBadge.setAttribute("aria-label", `回答正确，本题获得${stars}颗星。`);
  dom.answerStatusBadge.classList.remove("is-hidden");
}

function hideAnswerStatusBadge() {
  dom.answerStatusBadge.innerHTML = "";
  dom.answerStatusBadge.classList.add("is-hidden");
}

function setAnswerButtonsDisabled(disabled) {
  dom.answerGrid.querySelectorAll(".answer-button").forEach((button) => {
    button.disabled = disabled;
  });
}

function queueAutoAdvance() {
  if (state.autoAdvanceTimer) {
    window.clearTimeout(state.autoAdvanceTimer);
  }
  state.autoAdvanceTimer = window.setTimeout(() => {
    state.autoAdvanceTimer = 0;
    state.isAutoAdvancing = false;
    startNextLevel();
  }, AUTO_ADVANCE_DELAY_MS);
}

function setCoach(status, text) {
  dom.coachStatus.textContent = status;
  dom.coachBubble.textContent = text;
}

function clearPlayback() {
  if (state.playbackTimer) {
    window.clearTimeout(state.playbackTimer);
    state.playbackTimer = 0;
  }
  if (state.rotationTimer) {
    window.clearTimeout(state.rotationTimer);
    state.rotationTimer = 0;
  }
  if (state.autoAdvanceTimer) {
    window.clearTimeout(state.autoAdvanceTimer);
    state.autoAdvanceTimer = 0;
  }
  if (state.animationFrameId) {
    window.cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = 0;
  }
  if (state.wheelAnimation) {
    try {
      state.wheelAnimation.cancel();
    } catch (error) {
      // Ignore browser-specific animation cancel issues.
    }
    state.wheelAnimation = null;
  }

  if (dom.wheelBody) {
    dom.wheelBody.style.transform = "rotate(0deg)";
  }

  state.isPlayingSolution = false;
  state.isRotating = false;
  state.isAutoAdvancing = false;
  setMotionDisabled(false);
  setAnswerButtonsDisabled(false);
  hideAnswerStatusBadge();
  clearHighlights();
}

function clearHighlights() {
  dom.cabinLayer.querySelectorAll(".animal-cabin").forEach((item) => {
    item.classList.remove("is-highlighted", "is-answer", "is-faded");
  });
  dom.queueLine.querySelectorAll(".queue-animal").forEach((item) => {
    item.classList.remove("is-highlighted", "is-boarded");
  });
  dom.answerGrid.querySelectorAll(".answer-button").forEach((item) => {
    item.classList.remove("is-correct", "is-wrong");
  });
}

function highlightSlot(slotIndex, className) {
  const node = dom.cabinLayer.querySelector(`[data-slot-index="${slotIndex}"]`);
  if (node) {
    node.classList.add(className);
  }
}

function highlightQueueAnimal(animal) {
  const queueNode = [...dom.queueLine.querySelectorAll(".queue-animal")]
    .find((node) => node.dataset.queueAnimal === animal);
  if (queueNode) {
    queueNode.classList.add("is-highlighted");
  }
}

function highlightCabinAnimal(animal, className) {
  const cabinNode = dom.cabinLayer.querySelector(`[data-animal="${animal}"]`);
  if (cabinNode) {
    cabinNode.classList.add(className);
  }
}

function highlightAnswerButton(answer) {
  const answerNode = dom.answerGrid.querySelector(`[data-answer="${answer}"]`);
  if (answerNode) {
    answerNode.classList.add("is-correct");
  }
}

function rotateWheelClockwise(wheel) {
  return [wheel[WHEEL_SLOT_COUNT - 1], ...wheel.slice(0, WHEEL_SLOT_COUNT - 1)];
}

function rotateWheelCounterclockwise(wheel) {
  return [...wheel.slice(1), wheel[0]];
}

function applyRotationSteps(wheel, steps) {
  let nextWheel = [...wheel];
  for (let index = 0; index < steps; index += 1) {
    nextWheel = rotateWheelClockwise(nextWheel);
  }
  return nextWheel;
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
    scene.wheel = rotateWheelCounterclockwise(scene.wheel);
    scene.rotationCount -= 1;
    return;
  }

  scene.wheel = rotateWheelClockwise(scene.wheel);
  scene.rotationCount += 1;
  boardNextQueueAnimal(scene);
}

function cloneScene(scene) {
  return {
    wheel: [...scene.wheel],
    queue: [...scene.queue],
    boarded: [...scene.boarded],
    rotationCount: scene.rotationCount
  };
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

function applyRotationByDirection(level, direction) {
  if (level.mode === "queue") {
    rotateQueueScene(state.scene, direction);
    return;
  }

  if (direction === "counterclockwise") {
    state.scene.wheel = rotateWheelCounterclockwise(state.scene.wheel);
    state.scene.rotationCount -= 1;
    return;
  }

  state.scene.wheel = rotateWheelClockwise(state.scene.wheel);
  state.scene.rotationCount += 1;
}

function buildRotationMessage(mode, direction, currentStep, totalSteps) {
  const directionText = direction === "clockwise" ? "顺时针" : "逆时针";
  if (mode === "queue" && direction === "counterclockwise") {
    return `正在${directionText}观察，第 ${currentStep} / ${totalSteps} 格。排队题的上车规则仍然以顺时针为准。`;
  }
  return `正在${directionText}转动，第 ${currentStep} / ${totalSteps} 格。继续观察小动物位置变化。`;
}

function setMotionDisabled(disabled) {
  dom.solutionButton.disabled = disabled;
  dom.resetSceneButton.disabled = disabled;
  dom.hintButton.disabled = disabled;
  dom.rotateDirection.disabled = disabled;
  dom.rotateSpeed.disabled = disabled;
  dom.rotateCircles.disabled = disabled;
  dom.rotateSteps.disabled = disabled;
  dom.rotateNowButton.disabled = disabled;
}

function animateWheelTurn(direction, onFinish) {
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

function cubicBezier(t, p1x, p1y, p2x, p2y) {
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

function createQuestionTypes() {
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

function flattenQuestionTypes(types) {
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
