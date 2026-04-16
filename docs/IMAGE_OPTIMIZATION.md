# 图片资源优化说明

## 当前图片资源

1. **pic.png** - 2.4MB
   - 原始题目插图
   - 建议压缩到 500KB 以下

2. **docs/game-screen-preview.png** - 535KB
   - 游戏截图
   - 建议压缩到 200KB 以下

## 优化建议

### 使用在线工具压缩

推荐工具：
- [TinyPNG](https://tinypng.com/) - PNG 压缩
- [Squoosh](https://squoosh.app/) - 多格式图片压缩
- [ImageOptim](https://imageoptim.com/) - 本地压缩工具（Mac）

### 使用命令行工具

```bash
# 安装 imagemin-cli
npm install -g imagemin-cli imagemin-pngquant

# 压缩 PNG 图片
imagemin pic.png --plugin=pngquant --out-dir=.
imagemin docs/game-screen-preview.png --plugin=pngquant --out-dir=docs/
```

### 使用 npm 脚本

在 package.json 中添加：

```json
{
  "scripts": {
    "optimize:images": "imagemin pic.png docs/*.png --plugin=pngquant --out-dir=optimized"
  },
  "devDependencies": {
    "imagemin-cli": "^7.0.0",
    "imagemin-pngquant": "^9.0.2"
  }
}
```

## 优化目标

- pic.png: 2.4MB → 500KB（压缩 80%）
- game-screen-preview.png: 535KB → 200KB（压缩 63%）

## 注意事项

- 保持图片质量，避免过度压缩
- 压缩后检查视觉效果
- 备份原始图片
- 更新 Git 仓库中的图片

## 手动操作步骤

由于图片压缩需要外部工具或在线服务，请按以下步骤手动完成：

1. 访问 https://tinypng.com/
2. 上传 pic.png 和 docs/game-screen-preview.png
3. 下载压缩后的图片
4. 替换原文件
5. 提交到 Git

或者运行：
```bash
npm install
npm run optimize:images
```
