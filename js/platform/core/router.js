/**
 * 游戏路由系统
 * 管理游戏切换、URL 路由、浏览器历史记录
 */

export class GameRouter {
  constructor() {
    this.games = new Map();
    this.currentGame = null;
    this.homeContainer = null;
    this.gameContainer = null;
    this.onRouteChange = null;
  }

  /**
   * 初始化路由系统
   * @param {Object} options - 配置选项
   * @param {HTMLElement} options.homeContainer - 首页容器
   * @param {HTMLElement} options.gameContainer - 游戏容器
   * @param {Function} options.onRouteChange - 路由变化回调
   */
  init(options) {
    this.homeContainer = options.homeContainer;
    this.gameContainer = options.gameContainer;
    this.onRouteChange = options.onRouteChange;

    // 监听浏览器前进/后退
    window.addEventListener('hashchange', () => this.handleHashChange());
    window.addEventListener('popstate', () => this.handleHashChange());

    // 不在这里处理初始路由，等待游戏注册完成后再处理
  }

  /**
   * 启动路由（在游戏注册完成后调用）
   */
  start() {
    // 处理初始路由
    this.handleHashChange();
  }

  /**
   * 注册游戏
   * @param {Object} gameConfig - 游戏配置对象
   */
  register(gameConfig) {
    if (!gameConfig.id) {
      throw new Error('游戏配置必须包含 id 字段');
    }
    this.games.set(gameConfig.id, gameConfig);
    console.log(`游戏已注册: ${gameConfig.id}`);
  }

  /**
   * 获取所有已注册的游戏
   * @returns {Array} 游戏配置数组
   */
  getAllGames() {
    return Array.from(this.games.values());
  }

  /**
   * 获取指定游戏配置
   * @param {string} gameId - 游戏 ID
   * @returns {Object|null} 游戏配置对象
   */
  getGame(gameId) {
    return this.games.get(gameId) || null;
  }

  /**
   * 导航到首页
   */
  async goHome() {
    console.log('导航到首页');

    // 卸载当前游戏
    if (this.currentGame) {
      await this.unloadCurrentGame();
    }

    // 显示首页，隐藏游戏容器
    if (this.homeContainer) {
      this.homeContainer.style.display = 'block';
    }
    if (this.gameContainer) {
      this.gameContainer.style.display = 'none';
    }

    // 更新 URL
    window.location.hash = '#/';

    // 触发路由变化回调
    if (this.onRouteChange) {
      this.onRouteChange({ type: 'home' });
    }
  }

  /**
   * 导航到指定游戏
   * @param {string} gameId - 游戏 ID
   */
  async navigateTo(gameId) {
    console.log(`导航到游戏: ${gameId}`);

    // 获取游戏配置
    const gameConfig = this.games.get(gameId);
    if (!gameConfig) {
      console.error(`未找到游戏: ${gameId}`);
      return;
    }

    try {
      // 卸载当前游戏
      if (this.currentGame && this.currentGame.id !== gameId) {
        await this.unloadCurrentGame();
      }

      // 隐藏首页，显示游戏容器
      if (this.homeContainer) {
        this.homeContainer.style.display = 'none';
      }
      if (this.gameContainer) {
        this.gameContainer.style.display = 'block';
        this.gameContainer.innerHTML = ''; // 清空容器
      }

      // 加载游戏
      if (gameConfig.mount && typeof gameConfig.mount === 'function') {
        await gameConfig.mount(this.gameContainer);
        this.currentGame = gameConfig;
        console.log(`游戏已加载: ${gameId}`);
      } else {
        throw new Error(`游戏 ${gameId} 缺少 mount 方法`);
      }

      // 更新 URL
      window.location.hash = `#/games/${gameId}`;

      // 触发路由变化回调
      if (this.onRouteChange) {
        this.onRouteChange({ type: 'game', gameId, game: gameConfig });
      }

    } catch (error) {
      console.error(`加载游戏失败: ${gameId}`, error);
      alert(`加载游戏失败: ${error.message}`);
      // 失败时返回首页
      this.goHome();
    }
  }

  /**
   * 卸载当前游戏
   */
  async unloadCurrentGame() {
    if (!this.currentGame) {
      return;
    }

    console.log(`卸载游戏: ${this.currentGame.id}`);

    try {
      // 调用游戏的 unmount 方法
      if (this.currentGame.unmount && typeof this.currentGame.unmount === 'function') {
        await this.currentGame.unmount();
      }

      // 清空游戏容器
      if (this.gameContainer) {
        this.gameContainer.innerHTML = '';
      }

      this.currentGame = null;
      console.log('游戏已卸载');

    } catch (error) {
      console.error('卸载游戏失败:', error);
      // 即使卸载失败，也要清空状态
      this.currentGame = null;
      if (this.gameContainer) {
        this.gameContainer.innerHTML = '';
      }
    }
  }

  /**
   * 处理 hash 变化
   */
  async handleHashChange() {
    const hash = window.location.hash || '#/';
    console.log('Hash 变化:', hash);

    // 解析路由
    const route = this.parseHash(hash);

    if (route.type === 'home') {
      await this.goHome();
    } else if (route.type === 'game' && route.gameId) {
      await this.navigateTo(route.gameId);
    } else {
      // 未知路由，返回首页
      await this.goHome();
    }
  }

  /**
   * 解析 hash 路由
   * @param {string} hash - URL hash
   * @returns {Object} 路由对象
   */
  parseHash(hash) {
    // 移除开头的 #
    const path = hash.replace(/^#/, '');

    // 首页: #/ 或 #
    if (path === '/' || path === '') {
      return { type: 'home' };
    }

    // 游戏页: #/games/:gameId
    const gameMatch = path.match(/^\/games\/([^\/]+)/);
    if (gameMatch) {
      return {
        type: 'game',
        gameId: gameMatch[1]
      };
    }

    // 未知路由
    return { type: 'unknown', path };
  }

  /**
   * 获取当前路由信息
   * @returns {Object} 当前路由对象
   */
  getCurrentRoute() {
    return this.parseHash(window.location.hash || '#/');
  }

  /**
   * 检查是否在首页
   * @returns {boolean}
   */
  isHome() {
    const route = this.getCurrentRoute();
    return route.type === 'home';
  }

  /**
   * 检查是否在游戏页
   * @returns {boolean}
   */
  isInGame() {
    return this.currentGame !== null;
  }

  /**
   * 获取当前游戏 ID
   * @returns {string|null}
   */
  getCurrentGameId() {
    return this.currentGame ? this.currentGame.id : null;
  }
}

// 创建全局路由实例
export const router = new GameRouter();
