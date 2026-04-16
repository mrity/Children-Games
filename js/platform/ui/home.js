/**
 * 首页 UI 模块
 * 负责渲染游戏集合首页
 */

/**
 * 渲染首页
 * @param {HTMLElement} container - 首页容器
 * @param {Array} games - 游戏配置数组
 * @param {Function} onGameClick - 游戏点击回调
 */
export function renderHome(container, games, onGameClick) {
  if (!container) {
    console.error('首页容器不存在');
    return;
  }

  // 清空容器
  container.innerHTML = '';

  // 创建首页内容
  const homeContent = document.createElement('div');
  homeContent.className = 'home-page';
  homeContent.innerHTML = `
    <div class="hero-section">
      <div class="hero-content">
        <p class="eyebrow">儿童益智游戏集合</p>
        <h1>Logic Park</h1>
        <p class="hero-description">
          精选多款益智游戏，帮助孩子培养逻辑思维、空间想象和问题解决能力。
          每个游戏都经过精心设计，寓教于乐。
        </p>
      </div>
    </div>

    <div class="games-section">
      <h2 class="section-title">选择一个游戏开始</h2>
      <div class="games-grid" id="games-grid"></div>
    </div>
  `;

  container.appendChild(homeContent);

  // 渲染游戏卡片
  const gamesGrid = homeContent.querySelector('#games-grid');
  games.forEach(game => {
    const gameCard = createGameCard(game, onGameClick);
    gamesGrid.appendChild(gameCard);
  });
}

/**
 * 创建游戏卡片
 * @param {Object} game - 游戏配置
 * @param {Function} onGameClick - 点击回调
 * @returns {HTMLElement} 游戏卡片元素
 */
function createGameCard(game, onGameClick) {
  const card = document.createElement('div');
  card.className = 'game-card';
  card.dataset.gameId = game.id;

  // 游戏图标
  const icon = document.createElement('div');
  icon.className = 'game-icon';
  icon.textContent = game.icon || '🎮';

  // 游戏信息
  const info = document.createElement('div');
  info.className = 'game-info';

  const title = document.createElement('h3');
  title.className = 'game-title';
  title.textContent = game.name;

  const description = document.createElement('p');
  description.className = 'game-description';
  description.textContent = game.description;

  info.appendChild(title);
  info.appendChild(description);

  // 游戏元数据
  const meta = document.createElement('div');
  meta.className = 'game-meta';

  if (game.category) {
    const category = document.createElement('span');
    category.className = 'game-tag';
    category.textContent = getCategoryName(game.category);
    meta.appendChild(category);
  }

  if (game.ageRange) {
    const age = document.createElement('span');
    age.className = 'game-tag';
    age.textContent = game.ageRange;
    meta.appendChild(age);
  }

  if (game.difficulty) {
    const difficulty = document.createElement('span');
    difficulty.className = `game-tag difficulty-${game.difficulty}`;
    difficulty.textContent = getDifficultyName(game.difficulty);
    meta.appendChild(difficulty);
  }

  // 开始按钮
  const button = document.createElement('button');
  button.className = 'game-button';
  button.textContent = '开始游戏';
  button.onclick = (e) => {
    e.stopPropagation();
    if (onGameClick) {
      onGameClick(game.id);
    }
  };

  // 组装卡片
  card.appendChild(icon);
  card.appendChild(info);
  card.appendChild(meta);
  card.appendChild(button);

  // 整个卡片也可点击
  card.onclick = () => {
    if (onGameClick) {
      onGameClick(game.id);
    }
  };

  return card;
}

/**
 * 获取分类名称
 * @param {string} category - 分类 ID
 * @returns {string} 分类名称
 */
function getCategoryName(category) {
  const categories = {
    'logic': '逻辑推理',
    'puzzle': '拼图游戏',
    'memory': '记忆训练',
    'math': '数学思维',
    'spatial': '空间想象'
  };
  return categories[category] || category;
}

/**
 * 获取难度名称
 * @param {string} difficulty - 难度 ID
 * @returns {string} 难度名称
 */
function getDifficultyName(difficulty) {
  const difficulties = {
    'easy': '简单',
    'medium': '中等',
    'hard': '困难'
  };
  return difficulties[difficulty] || difficulty;
}

/**
 * 添加首页样式
 */
export function addHomeStyles() {
  // 检查是否已经添加过样式
  if (document.getElementById('home-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'home-styles';
  style.textContent = `
    .home-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .hero-section {
      text-align: center;
      padding: 3rem 0;
      margin-bottom: 3rem;
    }

    .hero-content .eyebrow {
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #666;
      margin-bottom: 0.5rem;
    }

    .hero-content h1 {
      font-size: 3rem;
      margin: 0.5rem 0;
      color: #333;
    }

    .hero-description {
      font-size: 1.125rem;
      color: #666;
      max-width: 600px;
      margin: 1rem auto 0;
      line-height: 1.6;
    }

    .games-section {
      margin-top: 2rem;
    }

    .section-title {
      font-size: 1.5rem;
      margin-bottom: 1.5rem;
      color: #333;
    }

    .games-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .game-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .game-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    .game-icon {
      font-size: 3rem;
      text-align: center;
    }

    .game-info {
      flex: 1;
    }

    .game-title {
      font-size: 1.25rem;
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .game-description {
      font-size: 0.875rem;
      color: #666;
      line-height: 1.5;
      margin: 0;
    }

    .game-meta {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .game-tag {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: #f0f0f0;
      border-radius: 12px;
      font-size: 0.75rem;
      color: #666;
    }

    .game-tag.difficulty-easy {
      background: #d4edda;
      color: #155724;
    }

    .game-tag.difficulty-medium {
      background: #fff3cd;
      color: #856404;
    }

    .game-tag.difficulty-hard {
      background: #f8d7da;
      color: #721c24;
    }

    .game-button {
      width: 100%;
      padding: 0.75rem;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.2s;
    }

    .game-button:hover {
      background: #0056b3;
    }

    @media (max-width: 768px) {
      .games-grid {
        grid-template-columns: 1fr;
      }

      .hero-content h1 {
        font-size: 2rem;
      }
    }
  `;

  document.head.appendChild(style);
}
