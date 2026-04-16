// ========== 音效系统 ==========

import { storageSystem } from './storage.js';

/**
 * 音效管理器
 * 负责加载、播放和控制游戏音效
 */
const SoundManager = {
  enabled: true,
  sounds: {},
  volume: 0.5,

  /**
   * 初始化音效系统
   */
  init() {
    // 从 localStorage 加载音效设置
    const savedEnabled = storageSystem.getItem("sound-enabled");
    if (savedEnabled !== null) {
      this.enabled = savedEnabled === "true";
    }

    const savedVolume = storageSystem.getItem("sound-volume");
    if (savedVolume !== null) {
      this.volume = parseFloat(savedVolume);
    }

    // 使用 Web Audio API 生成简单音效
    this.generateSounds();
  },

  /**
   * 生成音效（使用 Web Audio API）
   */
  generateSounds() {
    // 由于没有音频文件，我们使用 Web Audio API 生成简单的音效
    this.sounds = {
      correct: this.createCorrectSound,
      wrong: this.createWrongSound,
      rotate: this.createRotateSound,
      click: this.createClickSound,
      hint: this.createHintSound,
    };
  },

  /**
   * 播放音效
   * @param {string} soundName - 音效名称
   */
  play(soundName) {
    if (!this.enabled) return;

    try {
      const soundGenerator = this.sounds[soundName];
      if (soundGenerator) {
        soundGenerator.call(this);
      }
    } catch (error) {
      console.warn(`播放音效失败: ${soundName}`, error);
    }
  },

  /**
   * 创建答对音效（愉快的上升音）
   */
  createCorrectSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.exponentialRampToValueAtTime(783.99, audioContext.currentTime + 0.1); // G5
    oscillator.frequency.exponentialRampToValueAtTime(1046.5, audioContext.currentTime + 0.2); // C6

    gainNode.gain.setValueAtTime(this.volume * 0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  },

  /**
   * 创建答错音效（低沉的下降音）
   */
  createWrongSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(392, audioContext.currentTime); // G4
    oscillator.frequency.exponentialRampToValueAtTime(261.63, audioContext.currentTime + 0.15); // C4

    gainNode.gain.setValueAtTime(this.volume * 0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  },

  /**
   * 创建摩天轮转动音效（柔和的旋转音）
   */
  createRotateSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3
    oscillator.frequency.linearRampToValueAtTime(440, audioContext.currentTime + 0.3); // A4
    oscillator.frequency.linearRampToValueAtTime(220, audioContext.currentTime + 0.6); // A3

    gainNode.gain.setValueAtTime(this.volume * 0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.6);
  },

  /**
   * 创建点击音效（短促的点击音）
   */
  createClickSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);

    gainNode.gain.setValueAtTime(this.volume * 0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
  },

  /**
   * 创建提示音效（柔和的提示音）
   */
  createHintSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5

    gainNode.gain.setValueAtTime(this.volume * 0.25, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  },

  /**
   * 切换音效开关
   */
  toggle() {
    this.enabled = !this.enabled;
    storageSystem.setItem("sound-enabled", String(this.enabled));
    return this.enabled;
  },

  /**
   * 设置音量
   * @param {number} volume - 音量（0-1）
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    storageSystem.setItem("sound-volume", String(this.volume));
  },
};

export default SoundManager;
