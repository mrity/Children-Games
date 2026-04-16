/**
 * 摩天轮游戏入口
 * 实现游戏插件接口,封装所有游戏逻辑
 */

// ========== 平台层导入 ==========
import {
  loadProgress,
  saveProgress,
  exportProgress,
  importProgress,
  getLevelRecord,
  getBestStars,
  isLevelComplete,
  getUnlockedLevelCount,
  checkBrowserCompatibility
} from '../../platform/core/storage.js';

import { SoundManager } from '../../platform/core/sound.js';

// ========== 游戏核心模块导入 ==========
import {
  ROTATE_MS,
  AUTO_ADVANCE_DELAY_MS,
  PLAYBACK_STEP_DELAY_MS,
  ROTATION_STEP_INTERVAL_MS,
  WHEEL_SLOT_COUNT,
  BOTTOM_SLOT_INDEX,
  STARS_PERFECT,
  STARS_GOOD,
  STARS_PASS,
  COACH_DEFAULT,
  BASE_WHEEL,
  QUEUE_ANIMALS,
  ANIMAL_STYLES,
  ZONES
} from './core/constants.js';

import { createQuestionTypes, flattenQuestionTypes } from './core/questions.js';

// ========== 游戏逻辑模块导入 ==========
import {
  getSlotLayout,
  applyRotationSteps,
  boardNextQueueAnimal,
  rotateQueueScene,
  cloneScene,
  applyRotationByDirection,
  buildRotationMessage,
  simulateQueueUntilWithOrder,
  computeSameHeightAnimal,
  findAnimalOriginalPositionOwner,
  animalSlot,
  rotationStepsForAnimalToSlot
} from './game/wheel.js';

// ========== 动画模块导入 ==========
import { animateWheelTurn } from './animation/wheel-animation.js';

// ========== 生成题库数据 ==========
const QUESTION_TYPES = createQuestionTypes();
const LEVELS = flattenQuestionTypes(QUESTION_TYPES);

/**
 * 摩天轮游戏类
 * 实现完整的游戏生命周期管理
 */
export class FerrisWheelGame {
  constructor() {
    // 游戏状态
    this._state = null;

    // DOM 元素缓存
    this._dom = null;

    // 容器引用
    this._container = null;

    // 事件监听器引用(用于清理)
    this._eventListeners = [];
  }

  /**
   * 生成游戏 HTML 结构
   * @returns {string} HTML 字符串
   */
  _generateGameHTML() {
    return `
      <!-- 导航栏 -->
      <nav class="nav-bar" role="navigation" aria-label="主导航">
        <button class="nav-button" data-screen="home" aria-label="返回首页" tabindex="0">首页</button>
        <button class="nav-button" data-screen="map" aria-label="查看地图" tabindex="0">地图</button>
        <button class="nav-button" data-screen="progress" aria-label="查看进度" tabindex="0">进度</button>
        <button class="nav-button" id="sound-toggle" aria-label="音效开关" aria-pressed="true" tabindex="0">🔊</button>
      </nav>

      <main class="main-content">
        <!-- 地图页 -->
        <section class="screen" id="screen-map" aria-labelledby="map-title">
          <div class="section-header">
            <div>
              <p class="eyebrow">主题乐园地图</p>
              <h2 id="map-title">从观察到推理，按顺序解锁每个小区域。</h2>
            </div>
            <div class="summary-strip" id="map-summary"></div>
          </div>
          <div class="zone-list" id="zone-list"></div>
        </section>

        <!-- 游戏页 -->
        <section class="screen" id="screen-game" aria-labelledby="game-title">
          <div class="game-topbar">
            <button class="ghost-button" id="back-to-map-button" aria-label="返回乐园地图" tabindex="0">返回地图</button>
            <div class="game-meta">
              <p class="eyebrow" id="game-zone-label">摩天轮乐园</p>
              <h2 id="game-title">第 1 关</h2>
            </div>
            <div class="badge-pill" id="game-level-badge" role="status" aria-label="当前进度">1 / 12</div>
          </div>

          <div class="game-layout">
            <section class="scene-panel">
              <div class="coach-panel" role="status" aria-live="polite" aria-atomic="true">
                <span class="badge-pill" id="coach-status">观察中</span>
                <p id="coach-bubble">先看看摩天轮上的小动物都坐在哪里。</p>
              </div>

              <div class="scene-card">
                <div class="scene-sky"></div>
                <div class="scene-main-layout">
                  <div class="scene-board">
                    <div class="wheel-stage">
                      <div class="wheel-base"></div>
                      <div class="wheel-body" id="wheel-body">
                        <div class="wheel-ring"></div>
                        <div class="wheel-spokes" id="wheel-spokes"></div>
                        <div class="wheel-hub"></div>
                        <div class="cabin-layer" id="cabin-layer"></div>
                      </div>
                      <div class="scene-arrow">顺时针</div>
                    </div>
                  </div>
                  <aside class="queue-side-panel">
                    <div class="queue-card">
                      <div class="queue-header">
                        <h3>排队区</h3>
                        <span id="queue-tip">等候中的小动物</span>
                      </div>
                      <div class="queue-line" id="queue-line"></div>
                    </div>
                  </aside>
                </div>

                <div class="scene-controls">
                  <div class="wheel-control-panel" aria-label="摩天轮控制菜单" role="group">
                    <label class="control-field">
                      <span id="rotate-direction-label">转动方向</span>
                      <select class="control-select" id="rotate-direction" aria-labelledby="rotate-direction-label" tabindex="0">
                        <option value="clockwise">顺时针</option>
                        <option value="counterclockwise">逆时针</option>
                      </select>
                    </label>
                    <label class="control-field">
                      <span id="rotate-speed-label">转动速度</span>
                      <select class="control-select" id="rotate-speed" aria-labelledby="rotate-speed-label" tabindex="0">
                        <option value="900">慢慢转</option>
                        <option value="520" selected>普通速度</option>
                        <option value="280">快速转</option>
                      </select>
                    </label>
                    <label class="control-field">
                      <span id="rotate-circles-label">转动圈数</span>
                      <select class="control-select" id="rotate-circles" aria-labelledby="rotate-circles-label" tabindex="0">
                        <option value="0" selected>0 圈</option>
                        <option value="1">1 圈</option>
                        <option value="2">2 圈</option>
                        <option value="3">3 圈</option>
                        <option value="4">4 圈</option>
                        <option value="5">5 圈</option>
                        <option value="6">6 圈</option>
                        <option value="7">7 圈</option>
                        <option value="8">8 圈</option>
                        <option value="9">9 圈</option>
                      </select>
                    </label>
                    <label class="control-field">
                      <span id="rotate-steps-label">转动格数</span>
                      <select class="control-select" id="rotate-steps" aria-labelledby="rotate-steps-label" tabindex="0">
                        <option value="0">0 格</option>
                        <option value="1" selected>1 格</option>
                        <option value="2">2 格</option>
                        <option value="3">3 格</option>
                        <option value="4">4 格</option>
                        <option value="5">5 格</option>
                        <option value="6">6 格</option>
                        <option value="7">7 格</option>
                        <option value="8">8 格</option>
                        <option value="9">9 格</option>
                      </select>
                    </label>
                    <div class="control-action-cell">
                      <button class="primary-button control-action-button" id="rotate-now-button" type="button" aria-label="开始转动摩天轮" tabindex="0">开始转动</button>
                    </div>
                    <div class="control-action-cell">
                      <button class="secondary-button control-action-button" id="reset-scene-button" type="button" aria-label="重置摩天轮到初始状态" tabindex="0">重置</button>
                    </div>
                  </div>
                  <p class="control-note">总转动步数 = 圈数 × 8 + 格数。题目默认按箭头的顺时针理解，逆时针可以用来辅助观察位置变化。</p>
                </div>
              </div>
            </section>

            <aside class="challenge-panel">
              <div class="challenge-card">
                <div class="challenge-status-row">
                  <p class="eyebrow" id="challenge-zone-text">观察小舞台</p>
                  <div class="answer-status-badge is-hidden" id="answer-status-badge" aria-live="polite"></div>
                </div>
                <h3 id="challenge-title">先学会看位置</h3>
                <p class="challenge-prompt" id="challenge-prompt" role="heading" aria-level="4"></p>
                <div class="challenge-action-row">
                  <button class="primary-button" id="solution-button" type="button" aria-label="查看分步讲解" tabindex="0">分步讲解</button>
                </div>
                <div class="answer-grid" id="answer-grid" role="radiogroup" aria-label="答案选项" aria-required="true"></div>
                <div class="feedback-box" id="feedback-box" role="status" aria-live="polite" aria-atomic="true">选一个你认为正确的答案吧。</div>
                <div class="help-row" role="group" aria-label="帮助工具">
                  <button class="ghost-button" id="hint-button" aria-label="查看提示" tabindex="0">看提示</button>
                  <span id="hint-counter" role="status" aria-live="polite" aria-atomic="true">提示 0 / 0</span>
                </div>
                <div class="hint-box" id="hint-box" role="region" aria-label="提示内容" aria-live="polite"></div>
              </div>

              <div class="mini-progress-card">
                <div class="mini-progress-header">
                  <h3>闯关进度</h3>
                  <span id="mini-progress-text">0 / 12</span>
                </div>
                <div class="mini-progress-grid" id="mini-progress-grid"></div>
              </div>
            </aside>
          </div>
        </section>

        <!-- 进度页 -->
        <section class="screen" id="screen-progress" aria-labelledby="progress-title">
          <div class="section-header">
            <div>
              <p class="eyebrow">成长记录</p>
              <h2 id="progress-title">看看今天已经会做多少题了。</h2>
            </div>
            <div class="summary-strip" role="group" aria-label="进度管理操作">
              <button class="secondary-button" id="export-progress-button" aria-label="导出学习进度到文件" tabindex="0">导出进度</button>
              <button class="secondary-button" id="import-progress-button" aria-label="从文件导入学习进度" tabindex="0">导入进度</button>
              <input type="file" id="import-progress-file" accept=".json" aria-label="选择进度文件" aria-describedby="import-help" style="display: none;">
              <span id="import-help" class="sr-only">支持导入 JSON 格式的进度文件</span>
            </div>
          </div>
          <div class="progress-stats" id="progress-stats"></div>
          <div class="record-list" id="record-list"></div>
        </section>
      </main>

      <!-- 结果弹窗 -->
      <div class="overlay hidden" id="result-overlay" role="dialog" aria-modal="true" aria-labelledby="result-title" aria-live="polite">
        <div class="result-card">
          <p class="eyebrow" id="result-caption">闯关完成</p>
          <h2 id="result-title">这一关完成啦</h2>
          <div class="star-row" id="result-stars" role="img" aria-label="获得星星数"></div>
          <p class="result-text" id="result-text"></p>
          <div class="result-actions" role="group" aria-label="完成后操作">
            <button class="secondary-button" id="review-level-button" aria-label="再次查看本关讲解" tabindex="0">再看讲解</button>
            <button class="primary-button" id="next-level-button" aria-label="进入下一关" tabindex="0">下一关</button>
            <button class="ghost-button" id="result-map-button" aria-label="返回乐园地图" tabindex="0">回地图</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 缓存 DOM 元素引用
   */
  _cacheDom() {
    const c = this._container;
    this._dom = {
      // 导航栏
      navButtons: c.querySelectorAll('.nav-button:not(#sound-toggle)'),
      soundToggle: c.querySelector('#sound-toggle'),

      // 地图页
      mapSummary: c.querySelector('#map-summary'),
      zoneList: c.querySelector('#zone-list'),

      // 游戏页
      backToMapButton: c.querySelector('#back-to-map-button'),
      gameZoneLabel: c.querySelector('#game-zone-label'),
      gameTitle: c.querySelector('#game-title'),
      gameLevelBadge: c.querySelector('#game-level-badge'),
      challengeZoneText: c.querySelector('#challenge-zone-text'),
      answerStatusBadge: c.querySelector('#answer-status-badge'),
      challengeTitle: c.querySelector('#challenge-title'),
      challengePrompt: c.querySelector('#challenge-prompt'),
      answerGrid: c.querySelector('#answer-grid'),
      feedbackBox: c.querySelector('#feedback-box'),
      hintButton: c.querySelector('#hint-button'),
      hintCounter: c.querySelector('#hint-counter'),
      hintBox: c.querySelector('#hint-box'),
      rotateNowButton: c.querySelector('#rotate-now-button'),
      rotateDirection: c.querySelector('#rotate-direction'),
      rotateSpeed: c.querySelector('#rotate-speed'),
      rotateCircles: c.querySelector('#rotate-circles'),
      rotateSteps: c.querySelector('#rotate-steps'),
      resetSceneButton: c.querySelector('#reset-scene-button'),
      solutionButton: c.querySelector('#solution-button'),
      coachStatus: c.querySelector('#coach-status'),
      coachBubble: c.querySelector('#coach-bubble'),
      wheelBody: c.querySelector('#wheel-body'),
      wheelSpokes: c.querySelector('#wheel-spokes'),
      cabinLayer: c.querySelector('#cabin-layer'),
      queueLine: c.querySelector('#queue-line'),
      queueTip: c.querySelector('#queue-tip'),
      miniProgressText: c.querySelector('#mini-progress-text'),
      miniProgressGrid: c.querySelector('#mini-progress-grid'),

      // 进度页
      progressStats: c.querySelector('#progress-stats'),
      recordList: c.querySelector('#record-list'),
      exportProgressButton: c.querySelector('#export-progress-button'),
      importProgressButton: c.querySelector('#import-progress-button'),
      importProgressFile: c.querySelector('#import-progress-file'),

      // 结果弹窗
      resultOverlay: c.querySelector('#result-overlay'),
      resultCaption: c.querySelector('#result-caption'),
      resultTitle: c.querySelector('#result-title'),
      resultStars: c.querySelector('#result-stars'),
      resultText: c.querySelector('#result-text'),
      reviewLevelButton: c.querySelector('#review-level-button'),
      nextLevelButton: c.querySelector('#next-level-button'),
      resultMapButton: c.querySelector('#result-map-button'),

      // 页面容器
      screens: {
        map: c.querySelector('#screen-map'),
        game: c.querySelector('#screen-game'),
        progress: c.querySelector('#screen-progress')
      }
    };
  }

  /**
   * 绑定事件监听器
   */
  _bindEvents() {
    // 导航按钮
    this._dom.navButtons.forEach((button) => {
      const handler = () => this._navigateTo(button.dataset.screen);
      button.addEventListener('click', handler);
      this._eventListeners.push({ element: button, type: 'click', handler });
    });

    // 答案按钮(事件委托)
    const answerGridHandler = (event) => {
      const button = event.target.closest('.answer-button');
      if (button && button.dataset.answer) {
        this._submitAnswer(button.dataset.answer);
      }
    };
    this._dom.answerGrid.addEventListener('click', answerGridHandler);
    this._eventListeners.push({ element: this._dom.answerGrid, type: 'click', handler: answerGridHandler });

    // 返回地图按钮
    const backToMapHandler = () => this._navigateTo('map');
    this._dom.backToMapButton.addEventListener('click', backToMapHandler);
    this._eventListeners.push({ element: this._dom.backToMapButton, type: 'click', handler: backToMapHandler });

    // 转动按钮
    const rotateNowHandler = () => this._advanceScene();
    this._dom.rotateNowButton.addEventListener('click', rotateNowHandler);
    this._eventListeners.push({ element: this._dom.rotateNowButton, type: 'click', handler: rotateNowHandler });

    // 转动速度选择
    const rotateSpeedHandler = () => {
      this._state.rotateDuration = Number(this._dom.rotateSpeed.value) || ROTATE_MS;
      this._renderScene();
    };
    this._dom.rotateSpeed.addEventListener('change', rotateSpeedHandler);
    this._eventListeners.push({ element: this._dom.rotateSpeed, type: 'change', handler: rotateSpeedHandler });

    // 重置场景按钮
    const resetSceneHandler = () => this._resetCurrentLevelScene();
    this._dom.resetSceneButton.addEventListener('click', resetSceneHandler);
    this._eventListeners.push({ element: this._dom.resetSceneButton, type: 'click', handler: resetSceneHandler });

    // 提示按钮
    const hintHandler = () => this._revealHint();
    this._dom.hintButton.addEventListener('click', hintHandler);
    this._eventListeners.push({ element: this._dom.hintButton, type: 'click', handler: hintHandler });

    // 讲解按钮
    const solutionHandler = () => this._playSolution();
    this._dom.solutionButton.addEventListener('click', solutionHandler);
    this._eventListeners.push({ element: this._dom.solutionButton, type: 'click', handler: solutionHandler });

    // 结果弹窗 - 再看讲解按钮
    const reviewLevelHandler = () => {
      this._hideResultOverlay();
      this._playSolution();
    };
    this._dom.reviewLevelButton.addEventListener('click', reviewLevelHandler);
    this._eventListeners.push({ element: this._dom.reviewLevelButton, type: 'click', handler: reviewLevelHandler });

    // 结果弹窗 - 下一关按钮
    const nextLevelHandler = () => this._startNextLevel();
    this._dom.nextLevelButton.addEventListener('click', nextLevelHandler);
    this._eventListeners.push({ element: this._dom.nextLevelButton, type: 'click', handler: nextLevelHandler });

    // 结果弹窗 - 回地图按钮
    const resultMapHandler = () => {
      this._hideResultOverlay();
      this._navigateTo('map');
    };
    this._dom.resultMapButton.addEventListener('click', resultMapHandler);
    this._eventListeners.push({ element: this._dom.resultMapButton, type: 'click', handler: resultMapHandler });

    // 导出进度按钮
    const exportProgressHandler = () => this._exportProgress();
    this._dom.exportProgressButton.addEventListener('click', exportProgressHandler);
    this._eventListeners.push({ element: this._dom.exportProgressButton, type: 'click', handler: exportProgressHandler });

    // 导入进度按钮
    const importProgressHandler = () => this._dom.importProgressFile.click();
    this._dom.importProgressButton.addEventListener('click', importProgressHandler);
    this._eventListeners.push({ element: this._dom.importProgressButton, type: 'click', handler: importProgressHandler });

    // 文件上传
    const importFileHandler = (event) => {
      const file = event.target.files[0];
      if (file) {
        this._importProgress(file);
      }
    };
    this._dom.importProgressFile.addEventListener('change', importFileHandler);
    this._eventListeners.push({ element: this._dom.importProgressFile, type: 'change', handler: importFileHandler });

    // 音效开关按钮
    const soundToggleHandler = () => {
      const enabled = SoundManager.toggle();
      this._dom.soundToggle.classList.toggle('is-muted', !enabled);
      this._dom.soundToggle.setAttribute('aria-label', enabled ? '音效已开启' : '音效已关闭');
      SoundManager.play('click');
    };
    this._dom.soundToggle.addEventListener('click', soundToggleHandler);
    this._eventListeners.push({ element: this._dom.soundToggle, type: 'click', handler: soundToggleHandler });

    // 窗口 resize 事件
    const resizeHandler = () => {
      if (this._state.currentScreen === 'game') {
        this._renderScene();
      }
    };
    window.addEventListener('resize', resizeHandler);
    this._eventListeners.push({ element: window, type: 'resize', handler: resizeHandler });
  }

  /**
   * 初始化游戏状态
   */
  _initState() {
    this._state = {
      currentScreen: 'map',
      currentLevelId: null,
      scene: null,
      selectedAnswer: '',
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
  }

  /**
   * 加载进度
   */
  _loadProgress() {
    checkBrowserCompatibility();
    this._state.progress = loadProgress(LEVELS, 'ferris-wheel');
  }

  /**
   * 保存进度
   */
  _saveProgress() {
    saveProgress(this._state.progress, 'ferris-wheel');
  }

  /**
   * 为指定关卡创建初始场景
   * @param {Object} level - 关卡对象
   * @returns {Object} 场景对象
   */
  _createSceneForLevel(level) {
    const scene = {
      wheel: [...BASE_WHEEL],
      queue: [...(level.queueAnimals || QUEUE_ANIMALS)],
      boarded: [],
      rotationCount: 0
    };

    if (level.mode === 'queue') {
      boardNextQueueAnimal(scene);
    }

    return scene;
  }

  /**
   * 获取当前关卡对象
   * @returns {Object|null} 关卡对象
   */
  _currentLevel() {
    return LEVELS.find((level) => level.id === this._state.currentLevelId);
  }

  /**
   * 根据关卡ID获取关卡对象
   * @param {string} levelId - 关卡ID
   * @returns {Object|undefined} 关卡对象
   */
  _levelById(levelId) {
    return LEVELS.find((level) => level.id === levelId);
  }

  /**
   * 启动关卡
   * @param {string} levelId - 关卡ID
   */
  _startLevel(levelId) {
    this._hideResultOverlay();
    this._state.currentLevelId = levelId;
    this._resetLevelState();
    this._state.scene = this._createSceneForLevel(this._currentLevel());
    this._navigateTo('game');
  }

  /**
   * 重置关卡状态
   */
  _resetLevelState() {
    this._clearPlayback();
    this._state.selectedAnswer = '';
    this._state.wrongAttempts = 0;
    this._state.hintsShown = 0;
    this._state.solutionViewed = false;
    this._state.rotateDuration = Number(this._dom.rotateSpeed.value) || ROTATE_MS;
    this._hideAnswerStatusBadge();
    this._setFeedback('选一个你认为正确的答案吧。');
    this._renderHintPanel();
  }

  /**
   * 重置当前关卡场景
   */
  _resetCurrentLevelScene() {
    if (this._state.isAutoAdvancing) {
      return;
    }
    this._clearPlayback();
    this._state.scene = this._createSceneForLevel(this._currentLevel());
    this._setCoach('观察中', COACH_DEFAULT);
    this._setFeedback('已经回到最开始的样子，可以重新观察啦。');
    this._renderScene();
  }

  /**
   * 提交答案
   * @param {string} answer - 用户选择的答案
   */
  _submitAnswer(answer) {
    if (this._state.isPlayingSolution || this._state.isRotating || this._state.isAutoAdvancing) {
      return;
    }

    const level = this._currentLevel();
    this._state.selectedAnswer = answer;
    this._state.progress.stats.totalAttempts += 1;

    const record = getLevelRecord(this._state.progress, level.id);
    record.attempts += 1;
    record.lastPlayedAt = new Date().toISOString();

    const buttons = [...this._dom.answerGrid.querySelectorAll('.answer-button')];
    buttons.forEach((button) => {
      button.classList.remove('is-correct', 'is-wrong');
      if (button.dataset.answer === answer) {
        button.classList.add(answer === level.answer ? 'is-correct' : 'is-wrong');
      }
      if (button.dataset.answer === level.answer && answer === level.answer) {
        button.classList.add('is-correct');
      }
    });

    if (answer === level.answer) {
      SoundManager.play('correct');
      const stars = this._computeStars();
      this._finishLevel(level.id, stars);
      this._state.isAutoAdvancing = true;
      this._setCoach('答对啦', `做得对，答案是${level.answer}。`);
      this._setFeedback(`答对了。${this._buildCorrectReason(level)}`);
      this._showAnswerStatusBadge(stars);
      this._setMotionDisabled(true);
      this._setAnswerButtonsDisabled(true);
      this._queueAutoAdvance();
    } else {
      SoundManager.play('wrong');
      this._state.wrongAttempts += 1;
      this._hideAnswerStatusBadge();
      this._saveProgress();
      this._setCoach('再想想', '这次不对，先回到题目里找关键位置。');
      this._setFeedback('还不对哦。先看看题目里是谁在移动，再找最后要看的位置。');
    }
  }

  /**
   * 显示提示
   */
  _revealHint() {
    if (this._state.isAutoAdvancing) {
      return;
    }

    const level = this._currentLevel();
    if (this._state.hintsShown >= level.hints.length) {
      this._setFeedback('提示已经全部看完啦，试着自己想一想。');
      return;
    }

    SoundManager.play('hint');
    this._state.hintsShown += 1;
    this._state.progress.stats.hintsUsed += 1;
    getLevelRecord(this._state.progress, level.id).hintsUsed += 1;
    this._saveProgress();
    this._renderHintPanel();
    this._setCoach('提示中', level.hints[this._state.hintsShown - 1]);
  }

  /**
   * 播放讲解
   */
  _playSolution() {
    if (this._state.isAutoAdvancing) {
      return;
    }

    const level = this._currentLevel();
    this._clearPlayback();
    this._state.solutionViewed = true;
    this._state.progress.stats.solutionsViewed += 1;
    getLevelRecord(this._state.progress, level.id).solutionViewed = true;
    this._saveProgress();
    this._setFeedback('正在回放思路，请跟着高亮位置一起看。');
    this._setMotionDisabled(true);
    this._state.isPlayingSolution = true;

    const steps = level.solutionSteps || [];
    let currentStep = 0;

    const showStep = () => {
      if (currentStep >= steps.length) {
        this._state.isPlayingSolution = false;
        this._setMotionDisabled(false);
        this._setCoach('讲解完成', '讲解看完了，现在可以自己试着回答。');
        return;
      }

      const step = steps[currentStep];
      this._applySolutionStep(step, level);
      currentStep += 1;
      this._state.playbackTimer = window.setTimeout(showStep, PLAYBACK_STEP_DELAY_MS);
    };

    showStep();
  }

  /**
   * 应用讲解步骤
   * @param {Object} step - 讲解步骤
   * @param {Object} level - 关卡对象
   */
  _applySolutionStep(step, level) {
    let previewScene = cloneScene(this._createSceneForLevel(level));

    if (typeof step.sceneSteps === 'number') {
      if (level.mode === 'queue') {
        for (let index = 0; index < step.sceneSteps; index += 1) {
          rotateQueueScene(previewScene);
        }
      } else {
        previewScene.wheel = applyRotationSteps(previewScene.wheel, step.sceneSteps);
        previewScene.rotationCount = step.sceneSteps;
      }
    }

    if (step.sceneQueueTarget) {
      previewScene = simulateQueueUntilWithOrder(
        level.queueAnimals || QUEUE_ANIMALS,
        step.sceneQueueTarget.animal,
        step.sceneQueueTarget.slot,
        this._createSceneForLevel.bind(this)
      );
    }

    this._state.scene = previewScene;
    this._renderScene();
    this._clearHighlights();

    if (typeof step.slotIndex === 'number') {
      this._highlightSlot(step.slotIndex, step.answer ? 'is-answer' : 'is-highlighted');
    }
    if (step.queueAnimal) {
      this._highlightQueueAnimal(step.queueAnimal);
      this._highlightCabinAnimal(step.queueAnimal, step.answer ? 'is-answer' : 'is-highlighted');
    }
    if (step.answer) {
      this._highlightAnswerButton(step.answer);
    }

    this._setCoach('讲解中', step.text);
  }

  /**
   * 推进场景(转动摩天轮)
   */
  _advanceScene() {
    if (this._state.isRotating || this._state.isPlayingSolution || this._state.isAutoAdvancing) {
      return;
    }

    this._clearPlayback();
    this._state.rotateDuration = Number(this._dom.rotateSpeed.value) || ROTATE_MS;

    const direction = this._dom.rotateDirection.value;
    const circles = Number(this._dom.rotateCircles.value) || 0;
    const slots = Number(this._dom.rotateSteps.value) || 0;
    let steps = circles * WHEEL_SLOT_COUNT + slots;

    if (!steps) {
      steps = 1;
      this._dom.rotateSteps.value = '1';
      this._setFeedback('当前是 0 圈 0 格，系统先按 1 格帮你转动。');
    }

    const level = this._currentLevel();
    let finishedSteps = 0;

    this._state.isRotating = true;
    this._setMotionDisabled(true);

    const runOneStep = () => {
      SoundManager.play('rotate');
      animateWheelTurn(direction, () => {
        applyRotationByDirection(level, this._state.scene, direction);
        finishedSteps += 1;
        this._renderScene();
        this._setCoach('转动中', buildRotationMessage(level.mode, direction, finishedSteps, steps));
        if (finishedSteps >= steps) {
          this._state.isRotating = false;
          this._setMotionDisabled(false);
          return;
        }
        this._state.rotationTimer = window.setTimeout(runOneStep, ROTATION_STEP_INTERVAL_MS);
      }, this._state, this._dom);
    };

    runOneStep();
  }

  /**
   * 渲染所有页面
   */
  _renderAll() {
    this._renderNav();
    this._renderMap();
    this._renderGame();
    this._renderProgress();
  }

  /**
   * 渲染导航栏
   */
  _renderNav() {
    this._dom.navButtons.forEach((button) => {
      const isActive = button.dataset.screen === this._state.currentScreen;
      button.classList.toggle('is-active', isActive);
    });
  }

  /**
   * 渲染地图页
   */
  _renderMap() {
    const completed = this._state.progress.completedLevelIds.length;
    const totalStars = LEVELS.reduce((sum, level) => sum + getBestStars(this._state.progress, level.id), 0);
    const unlocked = getUnlockedLevelCount(this._state.progress, LEVELS.length);

    this._dom.mapSummary.innerHTML = [
      this._summaryCardHtml('已完成', `${completed} / ${LEVELS.length}`),
      this._summaryCardHtml('已解锁', `${unlocked} 题`),
      this._summaryCardHtml('星星', `${totalStars} 颗`)
    ].join('');

    this._dom.zoneList.innerHTML = ZONES.map((zone) => this._renderZoneCard(zone)).join('');
    this._dom.zoneList.querySelectorAll('.question-chip').forEach((button) => {
      button.addEventListener('click', () => {
        const level = this._levelById(button.dataset.levelId);
        if (level && isLevelUnlocked(this._state.progress, level.number, LEVELS.length)) {
          this._startLevel(level.id);
        }
      });
    });
  }

  /**
   * 渲染摩天轮场景
   */
  _renderScene() {
    if (!this._state.scene) {
      return;
    }

    const slots = getSlotLayout(this._dom.wheelBody);
    this._dom.cabinLayer.style.setProperty('--rotate-duration', `${this._state.rotateDuration}ms`);
    this._dom.wheelBody.style.transform = 'rotate(0deg)';
    this._dom.cabinLayer.innerHTML = this._state.scene.wheel
      .map((animal, slotIndex) => this._renderCabin(animal, slotIndex, slots[slotIndex]))
      .join('');
    this._dom.queueLine.innerHTML = this._state.scene.queue
      .map((animal) => this._renderQueueAnimal(animal))
      .join('');
    this._dom.queueTip.textContent = this._state.scene.queue.length ? '等候中的小动物' : '排队区暂时空了';
  }

  /**
   * 渲染座舱
   * @param {string} animal - 动物名称
   * @param {number} slotIndex - 座位索引
   * @param {Object} slot - 座位坐标
   * @returns {string} HTML 字符串
   */
  _renderCabin(animal, slotIndex, slot) {
    const style = ANIMAL_STYLES[animal] || { color: '#ffffff', short: animal, avatar: '🐾' };
    return `
      <div class="animal-cabin" data-slot-index="${slotIndex}" data-animal="${animal}" style="--slot-x:${slot.x}px; --slot-y:${slot.y}px; background:${style.color};">
        <div class="animal-cabin-inner">
          <span class="animal-avatar" aria-hidden="true">${style.avatar}</span>
          <span class="animal-name">${animal}</span>
        </div>
      </div>
    `;
  }

  /**
   * 渲染排队动物
   * @param {string} animal - 动物名称
   * @returns {string} HTML 字符串
   */
  _renderQueueAnimal(animal) {
    const style = ANIMAL_STYLES[animal] || { color: '#ffffff', avatar: '🐾' };
    return `
      <div class="queue-animal" data-queue-animal="${animal}" style="background:${style.color};">
        <span class="queue-avatar" aria-hidden="true">${style.avatar}</span>
        <span class="queue-name">${animal}</span>
      </div>
    `;
  }

  /**
   * 渲染摩天轮辐条
   */
  _renderWheelSpokes() {
    this._dom.wheelSpokes.innerHTML = Array.from({ length: WHEEL_SLOT_COUNT }, (_, index) => {
      const angle = index * 45;
      return `<div class="wheel-spoke" style="transform: rotate(${angle}deg);"></div>`;
    }).join('');
  }

  /**
   * 渲染游戏页
   */
  _renderGame() {
    const level = this._currentLevel();
    if (!level) {
      return;
    }

    if (!this._state.scene) {
      this._state.scene = this._createSceneForLevel(level);
    }

    this._hideAnswerStatusBadge();
    this._dom.gameZoneLabel.textContent = `${level.zoneName} · 第 ${level.typeNumber} 类题型`;
    this._dom.gameTitle.textContent = `${level.typeTitle} · 第 ${level.questionNumber} 题`;
    this._dom.gameLevelBadge.textContent = `${level.number} / ${LEVELS.length}`;
    this._dom.challengeZoneText.textContent = `第 ${level.typeNumber} 类 · ${level.zoneName}`;
    this._dom.challengeTitle.textContent = level.typeTitle;
    this._dom.challengePrompt.textContent = `第 ${level.questionNumber} 题：${level.prompt}`;

    this._renderAnswers();
    this._renderScene();
    this._renderHintPanel();
    this._renderMiniProgress();
    this._setCoach('观察中', COACH_DEFAULT);
  }

  /**
   * 渲染答案按钮
   */
  _renderAnswers() {
    const level = this._currentLevel();
    this._dom.answerGrid.innerHTML = level.choices.map((choice) => `
      <button class="answer-button" data-answer="${choice}">${choice}</button>
    `).join('');
    this._setAnswerButtonsDisabled(this._state.isAutoAdvancing);
  }

  /**
   * 渲染提示面板
   */
  _renderHintPanel() {
    const level = this._currentLevel();
    this._dom.hintCounter.textContent = `提示 ${this._state.hintsShown} / ${level.hints.length}`;
    if (!this._state.hintsShown) {
      this._dom.hintBox.textContent = '需要的时候点一下"看提示"，系统会一步一步提醒你。';
      return;
    }
    this._dom.hintBox.innerHTML = `<ul>${level.hints.slice(0, this._state.hintsShown).map((hint) => `<li>${hint}</li>`).join('')}</ul>`;
  }

  /**
   * 渲染小进度条
   */
  _renderMiniProgress() {
    const currentTypeLevels = LEVELS.filter((level) => level.typeId === this._currentLevel().typeId);
    const completed = currentTypeLevels.filter((level) => isLevelComplete(this._state.progress, level.id)).length;
    this._dom.miniProgressText.textContent = `${completed} / ${currentTypeLevels.length}`;
    this._dom.miniProgressGrid.innerHTML = currentTypeLevels.map((level) => {
      const classNames = ['mini-level-dot'];
      if (level.id === this._state.currentLevelId) {
        classNames.push('is-current');
      } else if (isLevelComplete(this._state.progress, level.id)) {
        classNames.push('is-done');
      } else if (!isLevelUnlocked(this._state.progress, level.number, LEVELS.length)) {
        classNames.push('is-locked');
      }
      return `<div class="${classNames.join(' ')}">${level.questionNumber}</div>`;
    }).join('');
  }

  /**
   * 渲染进度页
   */
  _renderProgress() {
    const totalStars = LEVELS.reduce((sum, level) => sum + getBestStars(this._state.progress, level.id), 0);
    this._dom.progressStats.innerHTML = [
      this._progressCardHtml('闯关完成', `${this._state.progress.completedLevelIds.length} / ${LEVELS.length}`),
      this._progressCardHtml('收集星星', `${totalStars} 颗`),
      this._progressCardHtml('用了提示', `${this._state.progress.stats.hintsUsed} 次`)
    ].join('');

    this._dom.recordList.innerHTML = ZONES.map((zone) => this._renderRecordCard(zone)).join('');
  }

  // ========== 辅助渲染方法 ==========

  /**
   * 渲染区域卡片
   */
  _renderZoneCard(zone) {
    const zoneLevels = LEVELS.filter((level) => level.zoneId === zone.id);
    const zoneTypes = QUESTION_TYPES.filter((type) => type.zoneId === zone.id);
    const completedCount = zoneLevels.filter((level) => isLevelComplete(this._state.progress, level.id)).length;

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
          ${zoneTypes.map((type) => this._renderTypeCard(type)).join('')}
        </div>
        <p>本区域已完成 ${completedCount} / ${zoneLevels.length} 题。</p>
      </article>
    `;
  }

  /**
   * 渲染题型卡片
   */
  _renderTypeCard(type) {
    const typeLevels = LEVELS.filter((level) => level.typeId === type.id);
    const completedCount = typeLevels.filter((level) => isLevelComplete(this._state.progress, level.id)).length;

    return `
      <div class="type-card">
        <div class="type-card-header">
          <strong>第 ${type.typeNumber} 类</strong>
          <span>${completedCount} / ${typeLevels.length}</span>
        </div>
        <h4>${type.title}</h4>
        <p>${type.summary}</p>
        <div class="question-chip-row">
          ${typeLevels.map((level) => this._renderQuestionChip(level)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 渲染关卡芯片
   */
  _renderQuestionChip(level) {
    const unlocked = isLevelUnlocked(this._state.progress, level.number, LEVELS.length);
    const done = isLevelComplete(this._state.progress, level.id);
    const classNames = ['question-chip'];

    if (!unlocked) {
      classNames.push('is-locked');
    }
    if (done) {
      classNames.push('is-done');
    }
    if (level.id === this._state.currentLevelId && this._state.currentScreen === 'game') {
      classNames.push('is-current');
    }

    return `
      <button class="${classNames.join(' ')}" data-level-id="${level.id}" ${unlocked ? '' : 'disabled'}>
        ${level.questionNumber}
      </button>
    `;
  }

  /**
   * 渲染记录卡片
   */
  _renderRecordCard(zone) {
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
          ${zoneTypes.map((type) => this._renderRecordTypeCard(type)).join('')}
        </div>
      </article>
    `;
  }

  /**
   * 渲染记录题型卡片
   */
  _renderRecordTypeCard(type) {
    const typeLevels = LEVELS.filter((level) => level.typeId === type.id);
    const completedCount = typeLevels.filter((level) => isLevelComplete(this._state.progress, level.id)).length;
    const starCount = typeLevels.reduce((sum, level) => sum + getBestStars(this._state.progress, level.id), 0);

    return `
      <div class="record-chip">
        <strong>第 ${type.typeNumber} 类</strong>
        <div>${type.title}</div>
        <div>已完成 ${completedCount} / ${typeLevels.length} 题</div>
        <div>累计 ${starCount} 颗星</div>
      </div>
    `;
  }

  /**
   * 生成摘要卡片 HTML
   */
  _summaryCardHtml(label, value) {
    return `<div class="summary-card"><strong>${value}</strong><p>${label}</p></div>`;
  }

  /**
   * 生成进度卡片 HTML
   */
  _progressCardHtml(label, value) {
    return `<div class="progress-card"><strong>${value}</strong><p>${label}</p></div>`;
  }

  // ========== 辅助方法 ==========

  /**
   * 页面导航
   */
  _navigateTo(screenName) {
    if (screenName !== 'game') {
      this._clearPlayback();
    }

    this._state.currentScreen = screenName;
    document.body.classList.toggle('is-game-screen', screenName === 'game');

    Object.values(this._dom.screens).forEach((screen) => {
      screen.classList.toggle('is-active', screen.id === `screen-${screenName}`);
    });

    this._renderNav();

    if (screenName === 'map') {
      this._renderMap();
    }
    if (screenName === 'progress') {
      this._renderProgress();
    }
    if (screenName === 'game') {
      this._renderGame();
    }
  }

  /**
   * 清除播放状态
   */
  _clearPlayback() {
    if (this._state.playbackTimer) {
      window.clearTimeout(this._state.playbackTimer);
      this._state.playbackTimer = 0;
    }
    if (this._state.rotationTimer) {
      window.clearTimeout(this._state.rotationTimer);
      this._state.rotationTimer = 0;
    }
    if (this._state.autoAdvanceTimer) {
      window.clearTimeout(this._state.autoAdvanceTimer);
      this._state.autoAdvanceTimer = 0;
    }
    if (this._state.animationFrameId) {
      window.cancelAnimationFrame(this._state.animationFrameId);
      this._state.animationFrameId = 0;
    }
    if (this._state.wheelAnimation) {
      try {
        this._state.wheelAnimation.cancel();
      } catch (error) {
        // Ignore browser-specific animation cancel issues
      }
      this._state.wheelAnimation = null;
    }

    if (this._dom.wheelBody) {
      this._dom.wheelBody.style.transform = 'rotate(0deg)';
    }

    this._state.isPlayingSolution = false;
    this._state.isRotating = false;
    this._state.isAutoAdvancing = false;
    this._setMotionDisabled(false);
    this._setAnswerButtonsDisabled(false);
    this._hideAnswerStatusBadge();
    this._clearHighlights();
  }

  /**
   * 设置反馈文本
   */
  _setFeedback(text) {
    this._dom.feedbackBox.textContent = text;
  }

  /**
   * 设置教练提示
   */
  _setCoach(status, text) {
    this._dom.coachStatus.textContent = status;
    this._dom.coachBubble.textContent = text;
  }

  /**
   * 显示答案状态徽章
   */
  _showAnswerStatusBadge(stars) {
    this._dom.answerStatusBadge.innerHTML = `
      <span class="answer-status-text">答对啦</span>
      <span class="answer-status-stars" aria-hidden="true">
        ${Array.from({ length: 3 }, (_, index) => {
          const active = index < stars;
          return `<span class="star-token${active ? '' : ' is-off'}">★</span>`;
        }).join('')}
      </span>
    `;
    this._dom.answerStatusBadge.setAttribute('aria-label', `回答正确，本题获得${stars}颗星。`);
    this._dom.answerStatusBadge.classList.remove('is-hidden');
  }

  /**
   * 隐藏答案状态徽章
   */
  _hideAnswerStatusBadge() {
    this._dom.answerStatusBadge.innerHTML = '';
    this._dom.answerStatusBadge.classList.add('is-hidden');
  }

  /**
   * 设置答案按钮禁用状态
   */
  _setAnswerButtonsDisabled(disabled) {
    this._dom.answerGrid.querySelectorAll('.answer-button').forEach((button) => {
      button.disabled = disabled;
    });
  }

  /**
   * 设置操作按钮禁用状态
   */
  _setMotionDisabled(disabled) {
    this._dom.rotateNowButton.disabled = disabled;
    this._dom.rotateDirection.disabled = disabled;
    this._dom.rotateSpeed.disabled = disabled;
    this._dom.rotateCircles.disabled = disabled;
    this._dom.rotateSteps.disabled = disabled;
    this._dom.resetSceneButton.disabled = disabled;
    this._dom.hintButton.disabled = disabled;
    this._dom.solutionButton.disabled = disabled;
  }

  /**
   * 队列自动推进
   */
  _queueAutoAdvance() {
    if (this._state.autoAdvanceTimer) {
      window.clearTimeout(this._state.autoAdvanceTimer);
    }
    this._state.autoAdvanceTimer = window.setTimeout(() => {
      this._state.autoAdvanceTimer = 0;
      this._state.isAutoAdvancing = false;
      this._startNextLevel();
    }, AUTO_ADVANCE_DELAY_MS);
  }

  /**
   * 开始下一关
   */
  _startNextLevel() {
    const currentLevel = this._currentLevel();
    const nextLevel = LEVELS[currentLevel.index + 1];
    if (nextLevel) {
      this._startLevel(nextLevel.id);
    } else {
      this._hideResultOverlay();
      this._navigateTo('map');
    }
  }

  /**
   * 清除高亮
   */
  _clearHighlights() {
    this._dom.cabinLayer.querySelectorAll('.animal-cabin').forEach((item) => {
      item.classList.remove('is-highlighted', 'is-answer', 'is-faded');
    });
    this._dom.queueLine.querySelectorAll('.queue-animal').forEach((item) => {
      item.classList.remove('is-highlighted', 'is-boarded');
    });
    this._dom.answerGrid.querySelectorAll('.answer-button').forEach((item) => {
      item.classList.remove('is-correct', 'is-wrong');
    });
  }

  /**
   * 高亮座位
   */
  _highlightSlot(slotIndex, className) {
    const node = this._dom.cabinLayer.querySelector(`[data-slot-index="${slotIndex}"]`);
    if (node) {
      node.classList.add(className);
    }
  }

  /**
   * 高亮排队动物
   */
  _highlightQueueAnimal(animal) {
    const queueNode = [...this._dom.queueLine.querySelectorAll('.queue-animal')]
      .find((node) => node.dataset.queueAnimal === animal);
    if (queueNode) {
      queueNode.classList.add('is-highlighted');
    }
  }

  /**
   * 高亮座舱动物
   */
  _highlightCabinAnimal(animal, className) {
    const cabinNode = this._dom.cabinLayer.querySelector(`[data-animal="${animal}"]`);
    if (cabinNode) {
      cabinNode.classList.add(className);
    }
  }

  /**
   * 高亮答案按钮
   */
  _highlightAnswerButton(answer) {
    const answerNode = this._dom.answerGrid.querySelector(`[data-answer="${answer}"]`);
    if (answerNode) {
      answerNode.classList.add('is-correct');
    }
  }

  /**
   * 显示结果弹窗
   */
  _showResultOverlay() {
    this._dom.resultOverlay.classList.remove('hidden');
  }

  /**
   * 隐藏结果弹窗
   */
  _hideResultOverlay() {
    this._dom.resultOverlay.classList.add('hidden');
  }

  /**
   * 计算星级
   */
  _computeStars() {
    if (this._state.wrongAttempts === 0) {
      return STARS_PERFECT;
    }
    if (this._state.wrongAttempts === 1) {
      return STARS_GOOD;
    }
    return STARS_PASS;
  }

  /**
   * 完成关卡
   */
  _finishLevel(levelId, stars) {
    if (!this._state.progress.completedLevelIds.includes(levelId)) {
      this._state.progress.completedLevelIds.push(levelId);
    }
    const currentBest = getBestStars(this._state.progress, levelId);
    if (stars > currentBest) {
      this._state.progress.starsByLevel[levelId] = stars;
    }
    this._saveProgress();
    this._renderAll();
  }

  /**
   * 构建正确答案原因
   */
  _buildCorrectReason(level) {
    if (level.mode === 'queue') {
      return '排队的小动物会按顺序上车，每转一格就有一只新的小动物坐到最下面。';
    }
    return '所有小动物会一起转动，保持相对位置不变。';
  }

  /**
   * 导出进度
   */
  _exportProgress() {
    exportProgress(this._state.progress);
  }

  /**
   * 导入进度
   */
  _importProgress(file) {
    importProgress(file, LEVELS, (normalized, successMessage) => {
      this._state.progress = normalized;
      this._saveProgress();
      this._renderAll();
      this._dom.importProgressFile.value = '';
      alert(successMessage);
    });
  }

  /**
   * 挂载游戏到容器
   * @param {HTMLElement} container - 游戏容器元素
   */
  async mount(container) {
    this._container = container;

    // 注入游戏 HTML
    container.innerHTML = this._generateGameHTML();

    // 缓存 DOM 元素
    this._cacheDom();

    // 初始化状态
    this._initState();

    // 加载进度
    this._loadProgress();

    // 绑定事件
    this._bindEvents();

    // 渲染摩天轮辐条
    this._renderWheelSpokes();

    // 初始渲染
    this._renderAll();

    console.log('摩天轮游戏已挂载');
  }

  /**
   * 卸载游戏
   */
  async unmount() {
    // 清除所有定时器和动画
    this._clearPlayback();

    // 保存进度
    if (this._state && this._state.progress) {
      this._saveProgress();
    }

    // 解绑所有事件监听器
    this._eventListeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
    this._eventListeners = [];

    // 清空容器
    if (this._container) {
      this._container.innerHTML = '';
    }

    // 重置状态和 DOM 引用
    this._state = null;
    this._dom = null;
    this._container = null;

    console.log('摩天轮游戏已卸载');
  }
}
