/**
 * 平台主入口
 * 初始化多游戏集合平台
 */

import { router } from './core/router.js';
import { storageSystem } from './core/storage.js';
import SoundManager from './core/sound.js';
import { renderHome, addHomeStyles } from './ui/home.js';
import ferrisWheelConfig from '../games/ferris-wheel/config.js';

/**
 * 初始化平台
 */
async function initPlatform() {
  console.log('初始化 Logic Park 平台...');

  // 1. 初始化存储系统
  storageSystem.init();
  console.log('✓ 存储系统已初始化');

  // 2. 初始化音效系统
  SoundManager.init();
  console.log('✓ 音效系统已初始化');

  // 3. 添加首页样式
  addHomeStyles();
  console.log('✓ 首页样式已加载');

  // 4. 获取容器元素
  const homeContainer = document.getElementById('home-container');
  const gameContainer = document.getElementById('game-container');

  if (!homeContainer || !gameContainer) {
    console.error('未找到必需的容器元素');
    return;
  }

  // 5. 初始化路由系统（不处理初始路由）
  router.init({
    homeContainer,
    gameContainer,
    onRouteChange: (route) => {
      console.log('路由变化:', route);

      // 更新页面标题
      if (route.type === 'home') {
        document.title = 'Logic Park - 儿童益智游戏集合';
      } else if (route.type === 'game' && route.game) {
        document.title = `${route.game.name} - Logic Park`;
      }
    }
  });
  console.log('✓ 路由系统已初始化');

  // 6. 注册游戏（目前只有摩天轮游戏的占位符）
  registerGames();
  console.log('✓ 游戏已注册');

  // 7. 启动路由（处理初始 URL）
  router.start();
  console.log('✓ 路由已启动');

  // 7. 渲染首页
  renderHomePage();
  console.log('✓ 首页已渲染');

  console.log('🎉 Logic Park 平台初始化完成！');
}

/**
 * 注册所有游戏
 */
function registerGames() {
  // 注册摩天轮游戏（真实实现）
  router.register(ferrisWheelConfig);

  // 未来的游戏占位符
  const comingSoonGames = [
    {
      id: 'puzzle',
      name: '拼图挑战',
      description: '锻炼空间想象和图形组合能力',
      icon: '🧩',
      category: 'puzzle',
      ageRange: '6-10岁',
      difficulty: 'medium',
      mount: async (container) => {
        container.innerHTML = '<div style="padding: 2rem; text-align: center;"><h2>🧩 拼图挑战</h2><p>敬请期待...</p></div>';
      },
      unmount: async () => {}
    },
    {
      id: 'memory',
      name: '记忆翻牌',
      description: '提升记忆力和专注力',
      icon: '🃏',
      category: 'memory',
      ageRange: '5-9岁',
      difficulty: 'easy',
      mount: async (container) => {
        container.innerHTML = '<div style="padding: 2rem; text-align: center;"><h2>🃏 记忆翻牌</h2><p>敬请期待...</p></div>';
      },
      unmount: async () => {}
    }
  ];

  // 注册占位符游戏
  comingSoonGames.forEach(game => router.register(game));
}

/**
 * 渲染首页
 */
function renderHomePage() {
  const homeContainer = document.getElementById('home-container');
  const games = router.getAllGames();

  renderHome(homeContainer, games, (gameId) => {
    router.navigateTo(gameId);
  });
}

// 页面加载完成后初始化平台
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPlatform);
} else {
  initPlatform();
}

// 导出供外部使用
export { router, storageSystem, SoundManager };
