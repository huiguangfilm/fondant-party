/**
 * github-api.js — GitHub REST API 封装
 * 
 * 前台：从 raw.githubusercontent.com 读取 data.json（公开，无需 Token）
 * 后台：通过 GitHub Contents API 上传照片、更新 data.json（需要 Token，存在 localStorage）
 */

const githubAPI = {
  _owner: "huiguangfilm",
  _repo: "fondant-party",
  _branch: "main",
  _rawBase: "https://raw.githubusercontent.com/huiguangfilm/fondant-party/main",
  _apiBase: "https://api.github.com",

  // Token 存储在 localStorage，不写进代码
  get token() {
    return localStorage.getItem("fp_github_token") || "";
  },
  set token(t) {
    if (t) localStorage.setItem("fp_github_token", t);
    else localStorage.removeItem("fp_github_token");
  },
  get hasToken() {
    return !!this.token;
  },

  // ========== 公共读取（无需 Token） ==========

  /** 从 raw 地址加载 data.json（前台使用，即时生效无缓存） */
  async loadDataJSON() {
    const ts = Date.now();
    const url = `${this._rawBase}/data.json?t=${ts}`;
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
  },

  // ========== 后台 API 操作（需要 Token） ==========

  _headers() {
    return {
      "Authorization": `token ${this.token}`,
      "Content-Type": "application/json",
      "Accept": "application/vnd.github.v3+json",
    };
  },

  /** 读取仓库文件（返回 {sha, content}） */
  async readRepoFile(path) {
    const url = `${this._apiBase}/repos/${this._owner}/${this._repo}/contents/${path}?ref=${this._branch}`;
    const resp = await fetch(url, { headers: this._headers() });
    if (!resp.ok) {
      if (resp.status === 404) return null; // 文件不存在
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.message || `GitHub API ${resp.status}`);
    }
    const data = await resp.json();
    // content 是 base64 编码的
    if (data.content) {
      data._decoded = JSON.parse(atob(data.content.replace(/\n/g, "")));
    }
    return data;
  },

  /** 创建或更新仓库文件 */
  async writeRepoFile(path, contentStr, message) {
    // 先尝试获取已有文件的 SHA
    let sha = null;
    try {
      const existing = await this.readRepoFile(path);
      if (existing) sha = existing.sha;
    } catch (e) {
      // 文件不存在，新建
    }

    const body = {
      message: message || `Update ${path}`,
      content: btoa(unescape(encodeURIComponent(contentStr))),
      branch: this._branch,
    };
    if (sha) body.sha = sha;

    const url = `${this._apiBase}/repos/${this._owner}/${this._repo}/contents/${path}`;
    const resp = await fetch(url, {
      method: "PUT",
      headers: this._headers(),
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      if (resp.status === 409) {
        throw new Error("CONFLICT: 数据已被其他人修改，请刷新后重试");
      }
      if (resp.status === 422) {
        throw new Error(`上传失败：${err.message || "请检查文件格式"}`);
      }
      throw new Error(err.message || `GitHub API ${resp.status}`);
    }
    return resp.json();
  },

  /** 上传图片/视频文件到仓库 */
  async uploadMediaFile(filePath, base64Data, message) {
    // 去掉 data:image/jpeg;base64, 前缀
    const b64 = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;

    const url = `${this._apiBase}/repos/${this._owner}/${this._repo}/contents/${filePath}`;
    const body = {
      message: message || `Upload ${filePath}`,
      content: b64,
      branch: this._branch,
    };

    // 检查是否已存在
    try {
      const checkUrl = `${url}?ref=${this._branch}`;
      const checkResp = await fetch(checkUrl, { headers: this._headers() });
      if (checkResp.ok) {
        const existing = await checkResp.json();
        body.sha = existing.sha;
      }
    } catch (e) {}

    const resp = await fetch(url, {
      method: "PUT",
      headers: this._headers(),
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.message || `上传失败 HTTP ${resp.status}`);
    }
    return resp.json();
  },

  /** 更新 data.json 到 GitHub */
  async saveDataJSON(data) {
    const jsonStr = JSON.stringify(data, null, 2);
    // 移除 base64 图片数据，只保留文件路径引用
    const cleanData = this._stripBase64(JSON.parse(jsonStr));
    return this.writeRepoFile("data.json", JSON.stringify(cleanData, null, 2), "Update site data and gallery");
  },

  /** 递归移除对象中的 base64 data URL，只保留路径引用 */
  _stripBase64(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => this._stripBase64(item));
    }
    if (obj && typeof obj === "object") {
      const result = {};
      for (const key of Object.keys(obj)) {
        if (key === "items" && Array.isArray(obj[key])) {
          result[key] = obj[key].map(item => {
            if (typeof item.src === "string" && item.src.startsWith("data:")) {
              // base64 数据已经在独立文件中，data.json 只保留路径
              return { ...item, src: item._githubPath || item.src, _githubPath: undefined };
            }
            return item;
          });
        } else if (typeof obj[key] === "string" && obj[key].startsWith("data:image/") && key !== "image") {
          // 跳过 base64 图片（除了 about.image 这种固定路径）
          continue;
        } else {
          result[key] = this._stripBase64(obj[key]);
        }
      }
      return result;
    }
    return obj;
  },

  /** 删除仓库文件 */
  async deleteFile(path, sha, message) {
    const url = `${this._apiBase}/repos/${this._owner}/${this._repo}/contents/${path}`;
    const resp = await fetch(url, {
      method: "DELETE",
      headers: this._headers(),
      body: JSON.stringify({ message: message || `Delete ${path}`, sha, branch: this._branch }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.message || `删除失败 HTTP ${resp.status}`);
    }
    return resp.json();
  },
};

/** 辅助：安全的 base64 编码（支持中文） */
function safeBtoa(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
