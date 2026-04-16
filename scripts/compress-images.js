const imagemin = require('imagemin');
const imageminPngquant = require('imagemin-pngquant');
const fs = require('fs');
const path = require('path');

async function compressImages() {
  console.log('开始压缩图片...\n');

  // 备份原始图片
  const backupDir = path.join(__dirname, '../backup-images');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // 备份 pic.png
  if (fs.existsSync('pic.png')) {
    fs.copyFileSync('pic.png', path.join(backupDir, 'pic.png'));
    console.log('✓ 已备份 pic.png');
  }

  // 备份 game-screen-preview.png
  if (fs.existsSync('docs/game-screen-preview.png')) {
    fs.copyFileSync('docs/game-screen-preview.png', path.join(backupDir, 'game-screen-preview.png'));
    console.log('✓ 已备份 game-screen-preview.png');
  }

  console.log('\n开始压缩...\n');

  try {
    // 压缩 pic.png
    const files1 = await imagemin(['pic.png'], {
      destination: '.',
      plugins: [
        imageminPngquant({
          quality: [0.6, 0.8],
          speed: 1
        })
      ]
    });

    if (files1.length > 0) {
      const originalSize = fs.statSync(path.join(backupDir, 'pic.png')).size;
      const compressedSize = files1[0].data.length;
      const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(1);
      console.log(`✓ pic.png: ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (减少 ${reduction}%)`);
    }

    // 压缩 game-screen-preview.png
    const files2 = await imagemin(['docs/game-screen-preview.png'], {
      destination: 'docs',
      plugins: [
        imageminPngquant({
          quality: [0.5, 0.7],
          speed: 1
        })
      ]
    });

    if (files2.length > 0) {
      const originalSize = fs.statSync(path.join(backupDir, 'game-screen-preview.png')).size;
      const compressedSize = files2[0].data.length;
      const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(1);
      console.log(`✓ game-screen-preview.png: ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (减少 ${reduction}%)`);
    }

    console.log('\n✓ 图片压缩完成！');
    console.log(`\n备份文件保存在: ${backupDir}`);
    console.log('\n请在浏览器中检查压缩后的图片质量。');
    console.log('如果满意，可以删除备份文件夹。');

  } catch (error) {
    console.error('压缩失败:', error);
    console.log('\n可以尝试使用在线工具 https://tinypng.com/ 手动压缩');
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

compressImages();
