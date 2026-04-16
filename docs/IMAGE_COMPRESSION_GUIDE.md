# 图片压缩指南

## 当前图片状态

- **pic.png**: 2.4MB → 目标 500KB（压缩 80%）
- **game-screen-preview.png**: 535KB → 目标 200KB（压缩 63%）

## 压缩方法

### 方法 1：使用在线工具 TinyPNG（推荐）

1. 访问 https://tinypng.com/
2. 上传 `pic.png` 和 `docs/game-screen-preview.png`
3. 下载压缩后的图片
4. 替换原文件

### 方法 2：使用 npm 包自动压缩

```bash
# 安装依赖
npm install --save-dev imagemin imagemin-pngquant

# 创建压缩脚本
node compress-images.js
```

### 方法 3：使用命令行工具

```bash
# 安装 imagemin-cli
npm install -g imagemin-cli imagemin-pngquant

# 压缩图片
imagemin pic.png --plugin=pngquant --out-dir=.
imagemin docs/game-screen-preview.png --plugin=pngquant --out-dir=docs/
```

## 自动化脚本

我已经创建了 `scripts/compress-images.js` 脚本，可以自动压缩图片。

使用方法：
```bash
npm run compress:images
```

## 验证压缩效果

压缩后检查：
1. 文件大小是否符合目标
2. 图片质量是否可接受
3. 在浏览器中查看效果

## 注意事项

- 压缩前备份原始图片
- 压缩后检查视觉效果
- 提交到 Git 仓库

---

**状态**: 脚本已创建，等待执行压缩
