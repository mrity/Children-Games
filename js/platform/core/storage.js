/**
 * 存储管理模块（多游戏版本）
 * 提供 localStorage 降级方案和多游戏进度管理功能
 */

// 新版本存储键（多游戏集合）
const MULTI_GAME_STORAGE_KEY = 'logic-park-games';

// 旧版本存储键（用于数据迁移）
const OLD_STORAGE_KEY = 'ferris-wheel-park-progress-v2';

// ========== 存储系统 ==========

/**
 * 存储系统对象，提供 localStorage 降级到内存存储的功能
 */
export const storageSystem = {
  type: "unknown",
  memoryStore: {},

  init() {
    if (this.testLocalStorage()) {
      this.type = "localStorage";
    } else {
      this.type = "memory";
      console.warn("localStorage 不可用，使用内存存储作为降级方案。刷新页面后进度将丢失。");
    }
  },

  testLocalStorage() {
    try {
      const testKey = "__storage_test__";
      window.localStorage.setItem(testKey, "test");
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  },

  getItem(key) {
    if (this.type === "localStorage") {
      try {
        return window.localStorage.getItem(key);
      } catch (error) {
        console.error("读取 localStorage 失败，切换到内存存储:", error);
        this.type = "memory";
        return this.memoryStore[key] || null;
      }
    }
    return this.memoryStore[key] || null;
  },

  setItem(key, value) {
    if (this.type === "localStorage") {
      try {
        window.localStorage.setItem(key, value);
        return true;
      } catch (error) {
        console.error("写入 localStorage 失败，切换到内存存储:", error);
        this.type = "memory";
        this.memoryStore[key] = value;
        return false;
      }
    }
    this.memoryStore[key] = value;
    return true;
  }
};

// ========== 进度数据结构 ==========

/**
 * 创建空的进度对象
 * @returns {Object} 空进度对象
 */
export function createEmptyProgress() {
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

/**
 * 规范化进度数据格式（支持旧版本数据迁移）
 * @param {Object} parsed - 解析后的进度数据
 * @returns {Object} 规范化后的进度对象
 */
export function normalizeProgress(parsed, LEVELS) {
  const fallback = createEmptyProgress();

  if (!parsed || typeof parsed !== "object") {
    return fallback;
  }

  // 新版本格式
  if (Array.isArray(parsed.completedLevelIds)) {
    try {
      return {
        ...fallback,
        ...parsed,
        stats: { ...fallback.stats, ...parsed.stats },
        starsByLevel: { ...fallback.starsByLevel, ...parsed.starsByLevel },
        recordsByLevel: { ...fallback.recordsByLevel, ...parsed.recordsByLevel }
      };
    } catch (error) {
      console.error("进度数据格式错误，使用默认值:", error);
      return fallback;
    }
  }

  // 旧版本格式迁移
  const legacyIds = LEVELS.map((level) => level.id).filter((id) => parsed[id] && typeof parsed[id] === "object");
  if (!legacyIds.length) {
    return fallback;
  }

  const migrated = createEmptyProgress();
  legacyIds.forEach((id) => {
    try {
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
    } catch (error) {
      console.error(`迁移关卡 ${id} 数据失败:`, error);
    }
  });
  return migrated;
}

/**
 * 验证进度数据的有效性
 * @param {Object} data - 待验证的进度数据
 * @param {Array} LEVELS - 关卡列表
 * @returns {Object} 验证结果 { valid, errors, warnings, repaired }
 */
export function validateProgressData(data, LEVELS) {
  const errors = [];
  const warnings = [];

  if (!data || typeof data !== "object") {
    errors.push("数据格式无效");
    return { valid: false, errors, warnings, repaired: null };
  }

  const repaired = { ...data };

  if (!Array.isArray(repaired.completedLevelIds)) {
    warnings.push("已完成关卡列表缺失，已修复");
    repaired.completedLevelIds = [];
  } else {
    const validIds = repaired.completedLevelIds.filter((id) => LEVELS.some((level) => level.id === id));
    if (validIds.length !== repaired.completedLevelIds.length) {
      warnings.push(`移除了 ${repaired.completedLevelIds.length - validIds.length} 个无效关卡ID`);
      repaired.completedLevelIds = validIds;
    }
  }

  if (!repaired.starsByLevel || typeof repaired.starsByLevel !== "object") {
    warnings.push("星星记录缺失，已修复");
    repaired.starsByLevel = {};
  }

  if (!repaired.stats || typeof repaired.stats !== "object") {
    warnings.push("统计数据缺失，已修复");
    repaired.stats = { hintsUsed: 0, solutionsViewed: 0, totalAttempts: 0 };
  }

  if (!repaired.recordsByLevel || typeof repaired.recordsByLevel !== "object") {
    warnings.push("关卡记录缺失，已修复");
    repaired.recordsByLevel = {};
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    repaired
  };
}

// ========== 多游戏进度管理 ==========

/**
 * 加载所有游戏的进度数据
 * @returns {Object} 所有游戏的进度对象
 */
export function loadAllGamesProgress() {
  try {
    const raw = storageSystem.getItem(MULTI_GAME_STORAGE_KEY);
    if (!raw) {
      // 尝试迁移旧数据
      return migrateOldData();
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error("加载进度失败:", error);
    return {};
  }
}

/**
 * 保存所有游戏的进度数据
 * @param {Object} allProgress - 所有游戏的进度对象
 */
export function saveAllGamesProgress(allProgress) {
  try {
    const success = storageSystem.setItem(MULTI_GAME_STORAGE_KEY, JSON.stringify(allProgress));
    if (!success && storageSystem.type === "memory") {
      console.warn("进度已保存到内存，刷新页面后将丢失");
    }
  } catch (error) {
    console.error("保存进度失败:", error);
  }
}

/**
 * 获取指定游戏的进度
 * @param {string} gameId - 游戏 ID
 * @returns {Object} 游戏进度对象
 */
export function getGameProgress(gameId) {
  const allProgress = loadAllGamesProgress();
  return allProgress[gameId] || createEmptyProgress();
}

/**
 * 保存指定游戏的进度
 * @param {string} gameId - 游戏 ID
 * @param {Object} progress - 游戏进度对象
 */
export function saveGameProgress(gameId, progress) {
  const allProgress = loadAllGamesProgress();
  allProgress[gameId] = progress;
  saveAllGamesProgress(allProgress);
}

/**
 * 迁移旧版本数据
 * @returns {Object} 迁移后的进度对象
 */
function migrateOldData() {
  try {
    const oldRaw = storageSystem.getItem(OLD_STORAGE_KEY);
    if (!oldRaw) {
      console.log("未找到旧版本数据");
      return {};
    }

    console.log("检测到旧版本数据，开始迁移...");
    const oldProgress = JSON.parse(oldRaw);

    // 将旧数据放入新格式
    const newFormat = {
      'ferris-wheel': oldProgress
    };

    // 保存新格式数据
    saveAllGamesProgress(newFormat);

    // 备份旧数据（不删除）
    const backupKey = `${OLD_STORAGE_KEY}-backup-${Date.now()}`;
    storageSystem.setItem(backupKey, oldRaw);

    console.log("数据迁移成功，旧数据已备份到:", backupKey);
    return newFormat;

  } catch (error) {
    console.error("数据迁移失败:", error);
    return {};
  }
}

// ========== 向后兼容的进度加载与保存 ==========

/**
 * 从存储系统加载游戏进度（向后兼容）
 * @param {Array} LEVELS - 关卡列表
 * @param {string} gameId - 游戏 ID，默认为 'ferris-wheel'
 * @returns {Object} 进度对象
 */
export function loadProgress(LEVELS, gameId = 'ferris-wheel') {
  try {
    const progress = getGameProgress(gameId);
    return normalizeProgress(progress, LEVELS);
  } catch (error) {
    console.error("加载进度失败，使用默认进度:", error);
    return createEmptyProgress();
  }
}

/**
 * 保存当前游戏进度到存储系统（向后兼容）
 * @param {Object} progress - 进度对象
 * @param {string} gameId - 游戏 ID，默认为 'ferris-wheel'
 */
export function saveProgress(progress, gameId = 'ferris-wheel') {
  try {
    saveGameProgress(gameId, progress);
  } catch (error) {
    console.error("保存进度失败:", error);
  }
}

// ========== 进度导入导出 ==========

/**
 * 导出进度为 JSON 文件
 * @param {Object} progress - 进度对象
 */
export function exportProgress(progress) {
  try {
    const exportData = {
      version: progress.version || 1,
      exportDate: new Date().toISOString(),
      data: progress
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

/**
 * 从文件导入进度
 * @param {File} file - 进度文件
 * @param {Array} LEVELS - 关卡列表
 * @param {Function} onSuccess - 导入成功回调
 */
export function importProgress(file, LEVELS, onSuccess) {
  const reader = new FileReader();

  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);

      if (!imported.data) {
        throw new Error("导入文件中没有找到进度数据。");
      }

      const validation = validateProgressData(imported.data, LEVELS);

      if (!validation.valid) {
        throw new Error(`数据验证失败：${validation.errors.join(", ")}`);
      }

      const normalized = normalizeProgress(validation.repaired, LEVELS);

      let confirmMessage = `确定要导入进度吗？\n\n导出时间：${imported.exportDate ? new Date(imported.exportDate).toLocaleString() : "未知"}\n已完成关卡：${normalized.completedLevelIds.length} / ${LEVELS.length}`;

      if (validation.warnings.length > 0) {
        confirmMessage += `\n\n数据修复：\n${validation.warnings.join("\n")}`;
      }

      confirmMessage += "\n\n当前进度会被覆盖。";

      const confirmed = window.confirm(confirmMessage);

      if (!confirmed) {
        return;
      }

      const successMessage = validation.warnings.length > 0
        ? `进度导入成功。已自动修复 ${validation.warnings.length} 个问题。`
        : "进度导入成功。";

      onSuccess(normalized, successMessage);
    } catch (error) {
      console.error("导入进度失败:", error);
      alert(`导入失败：${error.message}`);
    }
  };

  reader.onerror = () => {
    console.error("读取文件失败");
    alert("读取文件失败，请检查文件是否损坏。");
  };

  reader.readAsText(file);
}

// ========== 进度查询 ==========

/**
 * 获取关卡记录
 * @param {Object} progress - 进度对象
 * @param {string} levelId - 关卡ID
 * @returns {Object} 关卡记录
 */
export function getLevelRecord(progress, levelId) {
  if (!progress.recordsByLevel[levelId]) {
    progress.recordsByLevel[levelId] = {
      attempts: 0,
      hintsUsed: 0,
      solutionViewed: false,
      lastPlayedAt: ""
    };
  }
  return progress.recordsByLevel[levelId];
}

/**
 * 获取关卡最高星数
 * @param {Object} progress - 进度对象
 * @param {string} levelId - 关卡ID
 * @returns {number} 星数
 */
export function getBestStars(progress, levelId) {
  return progress.starsByLevel[levelId] || 0;
}

/**
 * 检查关卡是否完成
 * @param {Object} progress - 进度对象
 * @param {string} levelId - 关卡ID
 * @returns {boolean} 是否完成
 */
export function isLevelComplete(progress, levelId) {
  return progress.completedLevelIds.includes(levelId);
}

/**
 * 获取已解锁关卡数量
 * @param {Object} progress - 进度对象
 * @param {number} totalLevels - 总关卡数
 * @returns {number} 已解锁关卡数
 */
export function getUnlockedLevelCount(progress, totalLevels) {
  return Math.min(totalLevels, progress.completedLevelIds.length + 1);
}

// ========== 浏览器兼容性检查 ==========

/**
 * 检查浏览器兼容性
 */
export function checkBrowserCompatibility() {
  const warnings = [];

  if (typeof window.requestAnimationFrame !== "function") {
    warnings.push("浏览器不支持动画 API，动画效果可能不流畅");
  }

  if (storageSystem.type === "memory") {
    warnings.push("浏览器存储不可用，刷新页面后进度将丢失");
  }

  if (warnings.length > 0) {
    console.warn("浏览器兼容性警告:", warnings.join("; "));
  }
}
