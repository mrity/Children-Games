/**
 * 摩天轮游戏配置
 * 定义游戏元数据和插件接口
 */

/**
 * 摩天轮游戏配置对象
 * 实现平台游戏插件接口
 */
const ferrisWheelConfig = {
  // ========== 游戏元数据 ==========

  /** 游戏唯一标识符 */
  id: 'ferris-wheel',

  /** 游戏显示名称 */
  name: '摩天轮乐园',

  /** 游戏简介 */
  description: '跟着小动物坐摩天轮，学会顺序观察和位置推理',

  /** 游戏图标（emoji） */
  icon: '🎡',

  /** 游戏分类 */
  category: 'logic',

  /** 适合年龄范围 */
  ageRange: '5-8岁',

  /** 难度等级：easy | medium | hard */
  difficulty: 'easy',

  /** 游戏统计信息 */
  stats: {
    zones: 3,          // 游戏区域数量
    questionTypes: 12, // 题型数量
    totalLevels: 60    // 总关卡数
  },

  // ========== 游戏生命周期方法 ==========
  // 这些方法由 index.js 中的游戏类提供，
  // 在平台注册时会被替换为真实实现

  /**
   * 挂载游戏
   * @param {HTMLElement} container - 游戏容器元素
   */
  async mount(container) {
    // 动态导入游戏入口
    const { FerrisWheelGame } = await import('./index.js');
    this._instance = new FerrisWheelGame();
    await this._instance.mount(container);
  },

  /**
   * 卸载游戏
   */
  async unmount() {
    if (this._instance) {
      await this._instance.unmount();
      this._instance = null;
    }
  }
};

export default ferrisWheelConfig;
