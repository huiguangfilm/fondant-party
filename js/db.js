/**
 * db.js — IndexedDB 数据管理层
 * 负责：读取/保存网站全部数据（包括图片 base64）
 * 同事在后台修改的内容保存在这里，前台从这里读取
 */

const DB_NAME = "fondant-party-db";
const DB_VERSION = 1;
const STORE_NAME = "content";
const DATA_KEY = "site_data";

const db = {
  _db: null,

  async open() {
    if (this._db) return this._db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const database = e.target.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      };
      req.onsuccess = (e) => {
        this._db = e.target.result;
        resolve(this._db);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  },

  async getData() {
    await this.open();
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(DATA_KEY);
      req.onsuccess = () => {
        const result = req.result;
        if (result && result.value) {
          // 合并默认配置（保证新增字段有默认值）
          resolve(this._mergeDefaults(result.value));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  },

  async saveData(data) {
    await this.open();
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put({ key: DATA_KEY, value: data, updatedAt: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },

  async clearData() {
    await this.open();
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.delete(DATA_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },

  // 合并默认配置，确保结构完整
  _mergeDefaults(saved) {
    const d = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    return {
      site: { ...d.site, ...(saved.site || {}) },
      about: { ...d.about, ...(saved.about || {}) },
      contact: { ...d.contact, ...(saved.contact || {}) },
      categories: saved.categories || d.categories,
      services: saved.services || d.services,
      adminPassword: saved.adminPassword || d.adminPassword,
    };
  },
};
