/**
 * 数据迁移脚本
 * 用于将单游戏进度数据迁移到多游戏集合格式
 */

// 旧版本存储键
const OLD_STORAGE_KEY = 'ferris-wheel-park-progress-v2';

// 新版本存储键
const NEW_STORAGE_KEY = 'logic-park-games';

/**
 * 迁移进度数据
 * 将旧格式的摩天轮进度数据迁移到新的多游戏格式
 */
function migrateProgressData() {
  console.log('开始迁移进度数据...');

  try {
    // 1. 检查是否已经迁移过
    const newData = localStorage.getItem(NEW_STORAGE_KEY);
    if (newData) {
      console.log('检测到新格式数据，跳过迁移');
      return { success: true, skipped: true };
    }

    // 2. 读取旧版本数据
    const oldData = localStorage.getItem(OLD_STORAGE_KEY);
    if (!oldData) {
      console.log('未找到旧版本数据，创建空数据');
      const emptyData = {
        'ferris-wheel': createEmptyProgress()
      };
      localStorage.setItem(NEW_STORAGE_KEY, JSON.stringify(emptyData));
      return { success: true, created: true };
    }

    // 3. 解析旧数据
    const parsed = JSON.parse(oldData);
    console.log('成功读取旧版本数据');

    // 4. 转换为新格式
    const newFormat = {
      'ferris-wheel': parsed
    };

    // 5. 保存新格式数据
    localStorage.setItem(NEW_STORAGE_KEY, JSON.stringify(newFormat));
    console.log('成功保存新格式数据');

    // 6. 备份旧数据（不删除，以防需要回滚）
    const backupKey = `${OLD_STORAGE_KEY}-backup-${Date.now()}`;
    localStorage.setItem(backupKey, oldData);
    console.log(`旧数据已备份到: ${backupKey}`);

    return {
      success: true,
      migrated: true,
      backupKey: backupKey
    };

  } catch (error) {
    console.error('迁移失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 创建空的进度对象
 */
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

/**
 * 回滚迁移
 * 将数据恢复到旧格式
 */
function rollbackMigration(backupKey) {
  console.log('开始回滚迁移...');

  try {
    // 1. 读取备份数据
    const backupData = localStorage.getItem(backupKey);
    if (!backupData) {
      throw new Error('未找到备份数据');
    }

    // 2. 恢复旧格式数据
    localStorage.setItem(OLD_STORAGE_KEY, backupData);
    console.log('成功恢复旧格式数据');

    // 3. 删除新格式数据
    localStorage.removeItem(NEW_STORAGE_KEY);
    console.log('已删除新格式数据');

    return { success: true };

  } catch (error) {
    console.error('回滚失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 验证迁移结果
 */
function validateMigration() {
  console.log('验证迁移结果...');

  try {
    // 1. 读取新格式数据
    const newData = localStorage.getItem(NEW_STORAGE_KEY);
    if (!newData) {
      return {
        valid: false,
        error: '未找到新格式数据'
      };
    }

    // 2. 解析数据
    const parsed = JSON.parse(newData);

    // 3. 验证数据结构
    if (!parsed['ferris-wheel']) {
      return {
        valid: false,
        error: '缺少摩天轮游戏数据'
      };
    }

    const ferrisData = parsed['ferris-wheel'];

    // 4. 验证必需字段
    const requiredFields = ['version', 'completedLevelIds', 'starsByLevel', 'stats', 'recordsByLevel'];
    for (const field of requiredFields) {
      if (!(field in ferrisData)) {
        return {
          valid: false,
          error: `缺少必需字段: ${field}`
        };
      }
    }

    console.log('迁移验证通过');
    return {
      valid: true,
      data: parsed
    };

  } catch (error) {
    console.error('验证失败:', error);
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * 导出进度数据（用于手动备份）
 */
function exportProgress() {
  try {
    const data = localStorage.getItem(NEW_STORAGE_KEY) || localStorage.getItem(OLD_STORAGE_KEY);
    if (!data) {
      alert('没有找到进度数据');
      return;
    }

    const exportData = {
      version: 1,
      exportDate: new Date().toISOString(),
      data: JSON.parse(data)
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logic-park-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert('进度数据已导出');
  } catch (error) {
    alert(`导出失败: ${error.message}`);
  }
}

// 如果在浏览器环境中运行，自动执行迁移
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  // 在页面加载时自动执行迁移
  window.addEventListener('DOMContentLoaded', () => {
    const result = migrateProgressData();
    if (result.success && result.migrated) {
      console.log('✅ 进度数据迁移成功');
      console.log(`备份键: ${result.backupKey}`);

      // 验证迁移结果
      const validation = validateMigration();
      if (validation.valid) {
        console.log('✅ 迁移验证通过');
      } else {
        console.error('❌ 迁移验证失败:', validation.error);
      }
    }
  });
}

// 导出函数供外部使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    migrateProgressData,
    rollbackMigration,
    validateMigration,
    exportProgress
  };
}
