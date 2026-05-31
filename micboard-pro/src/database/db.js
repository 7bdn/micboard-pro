/**
 * MicBoard Pro — Database Manager
 * Handles all persistence via electron-store (through IPC) + in-memory cache
 */

import { v4 as uuidv4 } from 'uuid';

class DatabaseManager {
  constructor() {
    this.sounds = [];
    this.categories = [];
    this.hotkeys = {};
    this.profiles = {};
    this.settings = {};
    this._loaded = false;
  }

  async load() {
    if (this._loaded) return;
    try {
      const api = window.electronAPI;
      this.sounds = await api.storeGet('sounds', []);
      this.categories = await api.storeGet('categories', this._defaultCategories());
      this.hotkeys = await api.storeGet('hotkeys', {});
      this.profiles = await api.storeGet('profiles', this._defaultProfiles());
      this.settings = await api.storeGet('appSettings', this._defaultSettings());
      this._loaded = true;
      console.log('[DB] Loaded:', this.sounds.length, 'sounds');
    } catch (e) {
      console.error('[DB] load error:', e);
      this.sounds = [];
      this.categories = this._defaultCategories();
      this.hotkeys = {};
      this.profiles = this._defaultProfiles();
      this.settings = this._defaultSettings();
      this._loaded = true;
    }
  }

  _defaultCategories() {
    return [
      { id: 'all', name: 'All Sounds', icon: 'layout-grid', color: '#c8a86b' },
      { id: 'reactions', name: 'Reactions', icon: 'mood-happy', color: '#e8773a' },
      { id: 'music', name: 'Music', icon: 'music', color: '#5a8fce' },
      { id: 'effects', name: 'Effects', icon: 'wand', color: '#8a6bce' },
      { id: 'custom', name: 'Custom', icon: 'folder', color: '#4aaa6a' },
    ];
  }

  _defaultProfiles() {
    return {
      gaming: { name: 'Gaming', micVol: 0.8, masterVol: 0.9, compressor: true, noiseGate: true, noiseReduction: false },
      streaming: { name: 'Streaming', micVol: 0.9, masterVol: 0.7, compressor: true, noiseGate: true, noiseReduction: true },
      discord: { name: 'Discord', micVol: 0.85, masterVol: 0.8, compressor: false, noiseGate: true, noiseReduction: true },
    };
  }

  _defaultSettings() {
    return {
      theme: 'dark',
      accentColor: '#c8a86b',
      minimizeToTray: true,
      startMinimized: false,
      stopAllKey: 'F8',
      fadeOutDuration: 0.3,
      defaultVolume: 1.0,
      enableHotkeys: true,
      showNotifications: true,
    };
  }

  async save() {
    const api = window.electronAPI;
    await Promise.all([
      api.storeSet('sounds', this.sounds),
      api.storeSet('categories', this.categories),
      api.storeSet('hotkeys', this.hotkeys),
      api.storeSet('profiles', this.profiles),
      api.storeSet('appSettings', this.settings),
    ]);
  }

  // ─── SOUNDS ─────────────────────────────────────────────────────────────────
  async addSound({ filePath, name, category = 'custom', volume = 1.0, hotkey = null, color = null, emoji = '🔊' }) {
    const id = uuidv4();
    const sound = {
      id, filePath, name: name || this._nameFromPath(filePath),
      category, volume, hotkey, color, emoji,
      favorite: false, playCount: 0,
      createdAt: Date.now(), lastUsed: null,
    };
    this.sounds.push(sound);
    await this._saveField('sounds', this.sounds);
    return sound;
  }

  async addSounds(filePaths) {
    const added = [];
    for (const fp of filePaths) {
      const sound = await this.addSound({ filePath: fp });
      added.push(sound);
    }
    return added;
  }

  async updateSound(id, updates) {
    const idx = this.sounds.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.sounds[idx] = { ...this.sounds[idx], ...updates };
    await this._saveField('sounds', this.sounds);
    return this.sounds[idx];
  }

  async deleteSound(id) {
    this.sounds = this.sounds.filter(s => s.id !== id);
    // Remove hotkey
    Object.keys(this.hotkeys).forEach(k => {
      if (this.hotkeys[k] === id) delete this.hotkeys[k];
    });
    await this._saveField('sounds', this.sounds);
    await this._saveField('hotkeys', this.hotkeys);
  }

  async toggleFavorite(id) {
    const sound = this.sounds.find(s => s.id === id);
    if (!sound) return;
    sound.favorite = !sound.favorite;
    await this._saveField('sounds', this.sounds);
    return sound.favorite;
  }

  async recordPlay(id) {
    const sound = this.sounds.find(s => s.id === id);
    if (!sound) return;
    sound.playCount = (sound.playCount || 0) + 1;
    sound.lastUsed = Date.now();
    await this._saveField('sounds', this.sounds);
  }

  getSounds(filter = {}) {
    let list = [...this.sounds];
    if (filter.category && filter.category !== 'all') {
      list = list.filter(s => s.category === filter.category);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q));
    }
    if (filter.favorites) {
      list = list.filter(s => s.favorite);
    }
    if (filter.recent) {
      list = list.filter(s => s.lastUsed).sort((a, b) => b.lastUsed - a.lastUsed).slice(0, 20);
    }
    return list;
  }

  getSoundById(id) { return this.sounds.find(s => s.id === id); }

  // ─── CATEGORIES ─────────────────────────────────────────────────────────────
  async addCategory(name, icon = 'folder', color = '#666') {
    const cat = { id: uuidv4(), name, icon, color };
    this.categories.push(cat);
    await this._saveField('categories', this.categories);
    return cat;
  }

  async deleteCategory(id) {
    this.categories = this.categories.filter(c => c.id !== id);
    this.sounds = this.sounds.map(s => s.category === id ? { ...s, category: 'custom' } : s);
    await this._saveField('categories', this.categories);
    await this._saveField('sounds', this.sounds);
  }

  // ─── HOTKEYS ────────────────────────────────────────────────────────────────
  async setHotkey(accelerator, soundId) {
    // Remove any existing binding for this sound
    Object.keys(this.hotkeys).forEach(k => {
      if (this.hotkeys[k] === soundId) delete this.hotkeys[k];
    });
    if (accelerator) this.hotkeys[accelerator] = soundId;
    await this._saveField('hotkeys', this.hotkeys);
  }

  async removeHotkey(accelerator) {
    delete this.hotkeys[accelerator];
    await this._saveField('hotkeys', this.hotkeys);
  }

  getHotkeyForSound(soundId) {
    return Object.entries(this.hotkeys).find(([, id]) => id === soundId)?.[0] || null;
  }

  getSoundForHotkey(accelerator) {
    const id = this.hotkeys[accelerator];
    return id ? this.getSoundById(id) : null;
  }

  // ─── PROFILES ───────────────────────────────────────────────────────────────
  async saveProfile(id, data) {
    this.profiles[id] = { ...this.profiles[id], ...data };
    await this._saveField('profiles', this.profiles);
  }

  getProfile(id) { return this.profiles[id] || null; }

  // ─── SETTINGS ───────────────────────────────────────────────────────────────
  async updateSettings(updates) {
    this.settings = { ...this.settings, ...updates };
    await this._saveField('appSettings', this.settings);
  }

  getSetting(key, def = null) {
    return this.settings[key] !== undefined ? this.settings[key] : def;
  }

  // ─── HELPERS ────────────────────────────────────────────────────────────────
  async _saveField(key, value) {
    await window.electronAPI.storeSet(key, value);
  }

  _nameFromPath(fp) {
    const base = fp.split(/[\\/]/).pop() || fp;
    return base.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  async exportData() {
    return { sounds: this.sounds, categories: this.categories, hotkeys: this.hotkeys, profiles: this.profiles, settings: this.settings };
  }

  async importData(data) {
    if (data.sounds) this.sounds = data.sounds;
    if (data.categories) this.categories = data.categories;
    if (data.hotkeys) this.hotkeys = data.hotkeys;
    if (data.profiles) this.profiles = data.profiles;
    if (data.settings) this.settings = data.settings;
    await this.save();
  }
}

const db = new DatabaseManager();
export default db;
