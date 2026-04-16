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

    // 初始渲染
    this._renderAll();

    console.log('摩天轮游戏已挂载');
  }

  /**
   * 卸载游戏
   */
  async unmount() {
    // TODO: Task #34 - 实现卸载逻辑

    console.log('摩天轮游戏已卸载');
  }
}
