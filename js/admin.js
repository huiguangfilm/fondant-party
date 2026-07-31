/**
 * admin.js — 后台管理逻辑
 * 数据流：admin 操作 → GitHub API（跨设备同步） + IndexedDB（本地缓存）
 * 同事上传 = 所有客户立即可见
 */

let adminData = null;
let currentPhotoCat = null;

// ========== Init ==========
async function init() {
  const loggedIn = sessionStorage.getItem("fp_admin_logged_in");
  if (loggedIn === "true") {
    showAdmin();
  }

  document.getElementById("loginBtn").addEventListener("click", handleLogin);
  document.getElementById("loginInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleLogin();
  });

  document.querySelectorAll(".sidebar-nav a[data-section]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      switchSection(a.dataset.section);
    });
  });

  document.getElementById("menuBtn").addEventListener("click", () => {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("sidebarBackdrop").classList.add("show");
  });
  document.getElementById("sidebarBackdrop").addEventListener("click", () => {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sidebarBackdrop").classList.remove("show");
  });

  document.getElementById("exportBtn").addEventListener("click", exportData);

  document.getElementById("addCatBtn").addEventListener("click", () => openCategoryModal(null));
  document.getElementById("addServiceBtn").addEventListener("click", () => openServiceModal(null));
  document.getElementById("saveSiteBtn").addEventListener("click", saveSiteText);
  document.getElementById("saveContactBtn").addEventListener("click", saveContact);
  document.getElementById("changePwdBtn").addEventListener("click", changePassword);
  document.getElementById("exportDataBtn").addEventListener("click", exportData);
  document.getElementById("importDataBtn").addEventListener("click", () => {
    document.getElementById("importFileInput").click();
  });
  document.getElementById("importFileInput").addEventListener("change", importData);
  document.getElementById("resetBtn").addEventListener("click", resetData);

  // Token 管理
  const saveTokenBtn = document.getElementById("saveTokenBtn");
  if (saveTokenBtn) saveTokenBtn.addEventListener("click", saveToken);
  const testTokenBtn = document.getElementById("testTokenBtn");
  if (testTokenBtn) testTokenBtn.addEventListener("click", testToken);
  const syncBtn = document.getElementById("syncFromGithubBtn");
  if (syncBtn) syncBtn.addEventListener("click", syncFromGithub);

  // 照片 / 视频上传
  const uploadZone = document.getElementById("uploadZone");
  const fileInput = document.getElementById("fileInput");
  uploadZone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", handleFileUpload);
  uploadZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadZone.classList.add("dragover");
  });
  uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("dragover"));
  uploadZone.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadZone.classList.remove("dragover");
    handleFiles(e.dataTransfer.files);
  });

  // 视频 URL 添加
  document.getElementById("addVideoBtn").addEventListener("click", addVideoUrl);

  document.getElementById("photoCatSelect").addEventListener("change", (e) => {
    currentPhotoCat = e.target.value;
    renderPhotos();
  });

  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("modalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "modalOverlay") closeModal();
  });
}

// ========== Login ==========
async function handleLogin() {
  const input = document.getElementById("loginInput").value.trim();
  const errorEl = document.getElementById("loginError");

  // 尝试从 GitHub 拉取最新数据
  try {
    adminData = await loadAdminData();
  } catch (e) {
    adminData = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }

  const password = adminData.adminPassword || DEFAULT_CONFIG.adminPassword;
  if (input === password) {
    sessionStorage.setItem("fp_admin_logged_in", "true");
    showAdmin();
  } else {
    errorEl.textContent = "密码错误，请重试";
    document.getElementById("loginInput").value = "";
  }
}

/** 加载管理数据：GitHub 优先 → IndexedDB → 默认 */
async function loadAdminData() {
  // 1. 尝试从 GitHub 加载
  if (githubAPI.hasToken) {
    try {
      const remoteData = await githubAPI.loadDataJSON();
      if (remoteData && remoteData.categories) {
        // 缓存到本地
        try { await db.saveData(remoteData); } catch (e) {}
        return remoteData;
      }
    } catch (e) {
      console.warn("GitHub 加载失败，使用本地数据", e.message);
    }
  }

  // 2. IndexedDB 缓存
  try {
    const saved = await db.getData();
    if (saved) return saved;
  } catch (e) {}

  // 3. 默认配置
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

function showAdmin() {
  document.getElementById("loginWrap").style.display = "none";
  document.getElementById("adminPanel").style.display = "flex";
  renderAll();
}

function logout() {
  sessionStorage.removeItem("fp_admin_logged_in");
  location.reload();
}

// ========== Render All ==========
async function renderAll() {
  if (!adminData) {
    adminData = await loadAdminData();
  }
  normalizeItems();
  renderDashboard();
  renderCategories();
  renderPhotoCatSelect();
  renderSiteText();
  renderContact();
  renderServices();
  renderTokenStatus();
}

function normalizeItems() {
  (adminData.categories || []).forEach(cat => {
    if (!cat.items) cat.items = [];
    cat.items = cat.items.map(item => {
      if (!item.type) {
        return { type: "photo", src: item.image || item.src || "", label: item.label || "" };
      }
      if (!item.src) item.src = item.image || "";
      return item;
    });
  });
}

// ========== Dashboard ==========
function renderDashboard() {
  const cats = adminData.categories || [];
  const totalItems = cats.reduce((sum, c) => sum + (c.items ? c.items.length : 0), 0);
  const totalPhotos = cats.reduce((s, c) => s + ((c.items || []).filter(i => (i.type || "photo") === "photo")).length, 0);
  const totalVideos = cats.reduce((s, c) => s + ((c.items || []).filter(i => i.type === "video")).length, 0);

  const grid = document.getElementById("statsGrid");
  grid.innerHTML = `
    <div class="stat-card">
      <div class="label">品类数量</div>
      <div class="num gold">${cats.length}</div>
    </div>
    <div class="stat-card">
      <div class="label">样片总数</div>
      <div class="num">${totalItems}</div>
    </div>
    <div class="stat-card">
      <div class="label">图片 / 视频</div>
      <div class="num" style="font-size:18px;padding-top:6px">${totalPhotos} / ${totalVideos}</div>
    </div>
    <div class="stat-card">
      <div class="label">同步状态</div>
      <div class="num" style="font-size:16px;padding-top:8px">${githubAPI.hasToken ? '🟢 GitHub' : '🟡 仅本地'}</div>
    </div>
  `;

  const catsContainer = document.getElementById("dashboardCats");
  catsContainer.innerHTML = "";
  cats.forEach((cat) => {
    const items = cat.items || [];
    const pCount = items.filter(i => (i.type || "photo") === "photo").length;
    const vCount = items.filter(i => i.type === "video").length;
    let countStr = `${pCount} 张`;
    if (vCount > 0) countStr += ` + ${vCount} 视频`;

    const row = document.createElement("div");
    row.className = "cat-row";
    const iconHtml = ICONS[cat.icon] ? ICONS[cat.icon].replace('stroke="currentColor"','stroke="var(--gold)"') : "";
    row.innerHTML = `
      <div class="cat-icon">${iconHtml || "📷"}</div>
      <div class="cat-info">
        <div class="cat-name">${cat.name}</div>
        <div class="cat-meta">${cat.nameEn || ""}</div>
      </div>
      <div class="cat-count">${countStr}</div>
    `;
    catsContainer.appendChild(row);
  });
}

// ========== Categories ==========
function renderCategories() {
  const list = document.getElementById("catList");
  list.innerHTML = "";
  const cats = adminData.categories || [];

  cats.forEach((cat, index) => {
    const items = cat.items || [];
    const pCount = items.filter(i => (i.type || "photo") === "photo").length;
    const vCount = items.filter(i => i.type === "video").length;
    let countStr = `${pCount} 张`;
    if (vCount > 0) countStr += ` + ${vCount} 视频`;

    const row = document.createElement("div");
    row.className = "cat-row";
    row.draggable = true;
    row.dataset.index = index;
    row.innerHTML = `
      <div class="drag-handle" title="拖拽排序"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg></div>
      <div class="cat-icon">${ICONS[cat.icon] || "📷"}</div>
      <div class="cat-info">
        <div class="cat-name">${cat.name}</div>
        <div class="cat-meta">${cat.nameEn || ""} · ${countStr}</div>
      </div>
      <div class="cat-count">${items.length}</div>
      <div class="cat-actions">
        <button class="btn-icon" onclick="openCategoryModal(${index})" title="编辑"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button>
        <button class="btn-icon" onclick="deleteCategory(${index})" title="删除" style="color:var(--danger)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </div>
    `;
    row.addEventListener("dragstart", handleDragStart);
    row.addEventListener("dragover", handleDragOver);
    row.addEventListener("drop", handleDrop);
    row.addEventListener("dragend", handleDragEnd);
    list.appendChild(row);
  });
}

let dragSrcIndex = null;
function handleDragStart(e) { dragSrcIndex = parseInt(this.dataset.index); this.classList.add("dragging"); }
function handleDragOver(e) { e.preventDefault(); }
function handleDrop(e) {
  e.preventDefault();
  const targetIndex = parseInt(this.dataset.index);
  if (dragSrcIndex === null || dragSrcIndex === targetIndex) return;
  const cats = adminData.categories;
  const moved = cats.splice(dragSrcIndex, 1)[0];
  cats.splice(targetIndex, 0, moved);
  saveData();
  renderCategories();
  renderDashboard();
}
function handleDragEnd() { this.classList.remove("dragging"); dragSrcIndex = null; }

function openCategoryModal(index) {
  const isEdit = index !== null && index !== undefined;
  const cat = isEdit ? adminData.categories[index] : { id: "", name: "", nameEn: "", icon: "camera", description: "", items: [] };
  const iconOptions = Object.keys(ICONS).map((k) => `<option value="${k}" ${cat.icon === k ? "selected" : ""}>${k}</option>`).join("");

  document.getElementById("modalTitle").textContent = isEdit ? "编辑品类" : "新增品类";
  document.getElementById("modalBody").innerHTML = `
    <div class="form-group">
      <label class="form-label">品类ID<span class="req">*</span></label>
      <input type="text" class="form-input" id="catId" value="${cat.id}" placeholder="英文ID" ${isEdit ? "disabled" : ""}>
      <div class="form-hint">唯一标识，创建后不可修改</div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">中文名称<span class="req">*</span></label>
        <input type="text" class="form-input" id="catName" value="${cat.name}" placeholder="订婚布置">
      </div>
      <div class="form-group">
        <label class="form-label">英文名称</label>
        <input type="text" class="form-input" id="catNameEn" value="${cat.nameEn}" placeholder="ENGAGEMENT">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">图标</label>
      <select class="form-select" id="catIcon">${iconOptions}</select>
    </div>
    <div class="form-group">
      <label class="form-label">描述</label>
      <textarea class="form-textarea" id="catDesc" placeholder="品类描述文字">${cat.description}</textarea>
    </div>
  `;
  document.getElementById("modalFooter").innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">取消</button>
    <button class="btn btn-primary" onclick="saveCategory(${index})">${isEdit ? "保存" : "创建"}</button>
  `;
  openModal();
}

function saveCategory(index) {
  const id = document.getElementById("catId").value.trim();
  const name = document.getElementById("catName").value.trim();
  const nameEn = document.getElementById("catNameEn").value.trim();
  const icon = document.getElementById("catIcon").value;
  const desc = document.getElementById("catDesc").value.trim();
  if (!id || !name) { showToast("请填写必填项", "error"); return; }
  if (index !== null && index !== undefined) {
    adminData.categories[index] = { ...adminData.categories[index], name, nameEn, icon, description: desc };
  } else {
    if (adminData.categories.some((c) => c.id === id)) { showToast("品类ID已存在", "error"); return; }
    adminData.categories.push({ id, name, nameEn, icon, description: desc, items: [] });
  }
  saveData();
  renderCategories();
  renderDashboard();
  renderPhotoCatSelect();
  closeModal();
  showToast("保存成功", "success");
}

function deleteCategory(index) {
  const cat = adminData.categories[index];
  if (!confirm(`确定删除品类「${cat.name}」吗？该品类下的所有内容也会被删除。`)) return;
  adminData.categories.splice(index, 1);
  saveData();
  renderCategories();
  renderDashboard();
  renderPhotoCatSelect();
  showToast("已删除", "success");
}

// ========== Photos & Videos — 推送到 GitHub ==========
function renderPhotoCatSelect() {
  const select = document.getElementById("photoCatSelect");
  const cats = adminData.categories || [];
  select.innerHTML = cats.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
  if (!currentPhotoCat && cats.length > 0) currentPhotoCat = cats[0].id;
  select.value = currentPhotoCat;
  renderPhotos();
}

function renderPhotos() {
  const cat = adminData.categories.find((c) => c.id === currentPhotoCat);
  if (!cat) {
    document.getElementById("photoGrid").innerHTML = "";
    document.getElementById("photoCatName").textContent = "";
    document.getElementById("photoCount").textContent = "";
    return;
  }
  document.getElementById("photoCatName").textContent = cat.name;
  const items = cat.items || [];
  const pCount = items.filter(i => (i.type || "photo") === "photo").length;
  const vCount = items.filter(i => i.type === "video").length;
  let countStr = `共 ${pCount} 张图片`;
  if (vCount > 0) countStr += ` + ${vCount} 个视频`;
  document.getElementById("photoCount").textContent = countStr;

  const grid = document.getElementById("photoGrid");
  if (items.length === 0) {
    grid.innerHTML = `<div class="photo-empty" style="grid-column:1/-1"><div class="icon">📷</div><p>还没有样片，请上传图片或添加视频</p></div>`;
    return;
  }

  grid.innerHTML = "";
  items.forEach((item, i) => {
    const isVideo = item.type === "video";
    const src = item.src || item.image || "";
    // 如果是相对路径，拼接 raw URL 用于预览
    const previewSrc = (!/^https?:\/\//.test(src) && !/^data:/.test(src))
      ? `https://raw.githubusercontent.com/huiguangfilm/fondant-party/main/${src}`
      : src;

    const div = document.createElement("div");
    div.className = "photo-item";
    div.innerHTML = `
      <div class="photo-num">${i + 1}</div>
      <div class="photo-type-badge ${isVideo ? "video" : "photo"}">${isVideo ? "🎬" : "��"}</div>
      ${isVideo
        ? `<div class="video-thumb"><video src="${previewSrc}" muted preload="metadata" onmouseenter="this.play()" onmouseleave="this.pause();this.currentTime=0"></video><div class="play-overlay"></div></div>`
        : `<img src="${previewSrc}" alt="${item.label || ""}" loading="lazy">`
      }
      <div class="photo-overlay">
        <input type="text" class="photo-label-input" value="${item.label || ""}" placeholder="${isVideo ? '视频标注' : '标注'}" onchange="updatePhotoLabel(${i}, this.value)">
        <button class="photo-delete" onclick="deletePhoto(${i})" title="删除">&times;</button>
      </div>
    `;
    grid.appendChild(div);
  });
}

function handleFileUpload(e) {
  handleFiles(e.target.files);
  e.target.value = "";
}

async function handleFiles(files) {
  if (!githubAPI.hasToken) {
    showToast("请先在「系统设置」中配置 GitHub Token", "error");
    switchSection("settings");
    return;
  }

  const fileList = Array.from(files);
  const imageFiles = fileList.filter(f => f.type.startsWith("image/"));
  const videoFiles = fileList.filter(f => f.type.startsWith("video/"));

  if (imageFiles.length === 0 && videoFiles.length === 0) {
    showToast("请选择图片或视频文件", "error");
    return;
  }

  const cat = adminData.categories.find((c) => c.id === currentPhotoCat);
  if (!cat) { showToast("请先选择品类", "error"); return; }
  if (!cat.items) cat.items = [];

  showToast(`正在上传 ${imageFiles.length + videoFiles.length} 个文件到云端...`, "");

  let uploaded = 0;
  const total = imageFiles.length + videoFiles.length;
  const errors = [];

  // 处理图片 — 上传到 GitHub
  for (const file of imageFiles) {
    try {
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name} 超过 10MB`);
        uploaded++;
        continue;
      }
      const base64 = await readFileAsDataURL(file);
      const compressed = await compressImage(base64, 1200, 0.85);

      // 生成文件路径
      const ts = Date.now();
      const rand = Math.random().toString(36).slice(2, 6);
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `uploads/${cat.id}/${ts}_${rand}.${ext}`;

      // 上传到 GitHub
      await githubAPI.uploadMediaFile(filePath, compressed, `Upload ${file.name} to ${cat.name}`);

      // 添加到本地数据
      cat.items.push({
        type: "photo",
        src: filePath,  // 相对路径，前端自动拼接 raw URL
        label: "",
        _githubPath: filePath,
      });
      uploaded++;
    } catch (e) {
      errors.push(`${file.name}: ${e.message}`);
      uploaded++;
    }
  }

  // 处理视频 — 视频太大不适合 GitHub，只保存 base64 到 IndexedDB
  for (const file of videoFiles) {
    try {
      if (file.size > 100 * 1024 * 1024) {
        errors.push(`${file.name} 超过 100MB`);
        uploaded++;
        continue;
      }
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 视频 base64 太大不上传 GitHub，仅存本地
      cat.items.push({
        type: "video",
        src: base64,
        label: file.name.replace(/\.[^.]+$/, ""),
      });
      uploaded++;
    } catch (e) {
      errors.push(`${file.name}: ${e.message}`);
      uploaded++;
    }
  }

  // 保存 data.json 到 GitHub（图片上传后需要更新引用）
  try {
    await syncToGithub();
  } catch (e) {
    console.warn("GitHub 同步失败", e);
  }

  // 保存到本地
  await db.saveData(adminData);
  renderPhotos();
  renderDashboard();
  renderCategories();

  if (errors.length > 0) {
    showToast(`完成，${errors.length} 个问题：${errors.slice(0, 2).join("；")}`, "error");
  } else {
    showToast(`成功上传 ${uploaded} 个文件到云端，所有客户可见`, "success");
  }
}

async function addVideoUrl() {
  const url = document.getElementById("videoUrlInput").value.trim();
  if (!url) { showToast("请输入视频链接", "error"); return; }
  const cat = adminData.categories.find((c) => c.id === currentPhotoCat);
  if (!cat) { showToast("请先选择品类", "error"); return; }
  if (!cat.items) cat.items = [];
  cat.items.push({ type: "video", src: url, label: "" });
  saveData();
  renderPhotos();
  renderDashboard();
  renderCategories();
  document.getElementById("videoUrlInput").value = "";
  showToast("视频链接已添加", "success");
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function compressImage(dataUrl, maxWidth, quality) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth; }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function updatePhotoLabel(index, label) {
  const cat = adminData.categories.find((c) => c.id === currentPhotoCat);
  if (cat && cat.items[index]) { cat.items[index].label = label; saveData(); }
}

async function deletePhoto(index) {
  const cat = adminData.categories.find((c) => c.id === currentPhotoCat);
  if (!cat || !cat.items[index]) return;
  const item = cat.items[index];
  const itemLabel = item.type === "video" ? "视频" : "照片";
  if (!confirm(`确定删除这个${itemLabel}吗？`)) return;

  // 如果是 GitHub 上的文件，尝试删除
  if (githubAPI.hasToken && item.src && !item.src.startsWith("data:") && !item.src.startsWith("http")) {
    try {
      const fileData = await githubAPI.readRepoFile(item.src);
      if (fileData && fileData.sha) {
        await githubAPI.deleteFile(item.src, fileData.sha, `Delete ${item.src}`);
      }
    } catch (e) {
      console.warn("无法删除 GitHub 文件", e);
    }
  }

  cat.items.splice(index, 1);
  saveData();
  renderPhotos();
  renderDashboard();
  renderCategories();
  showToast("已删除", "success");
}

// ========== Site Text ==========
function renderSiteText() {
  const s = adminData.site || {};
  document.getElementById("siteBrandName").value = s.brandName || "";
  document.getElementById("siteBrandNameEn").value = s.brandNameEn || "";
  document.getElementById("siteHeroTag").value = s.heroTag || "";
  document.getElementById("siteTagline").value = s.tagline || "";

  const a = adminData.about || {};
  document.getElementById("aboutTitle").value = a.title || "";
  document.getElementById("aboutParagraphs").value = (a.paragraphs || []).join("\n");
  document.getElementById("aboutStats").value = (a.stats || []).map((s) => `${s.num}|${s.label}`).join("\n");
}

function saveSiteText() {
  adminData.site = {
    brandName: document.getElementById("siteBrandName").value.trim(),
    brandNameEn: document.getElementById("siteBrandNameEn").value.trim(),
    heroTag: document.getElementById("siteHeroTag").value.trim(),
    tagline: document.getElementById("siteTagline").value.trim(),
  };
  adminData.about = {
    title: document.getElementById("aboutTitle").value.trim(),
    paragraphs: document.getElementById("aboutParagraphs").value.split("\n").filter((l) => l.trim()),
    stats: document.getElementById("aboutStats").value.split("\n").filter((l) => l.trim()).map((l) => {
      const [num, label] = l.split("|");
      return { num: (num || "").trim(), label: (label || "").trim() };
    }),
  };
  saveData();
  showToast("文案保存成功", "success");
}

// ========== Contact ==========
function renderContact() {
  const c = adminData.contact || {};
  document.getElementById("contactWechat").value = c.wechat || "";
  document.getElementById("contactPhone").value = c.phone || "";
  document.getElementById("contactXhs").value = c.xiaohongshu || "";
  document.getElementById("contactEmail").value = c.email || "";
}

function saveContact() {
  adminData.contact = {
    wechat: document.getElementById("contactWechat").value.trim(),
    phone: document.getElementById("contactPhone").value.trim(),
    xiaohongshu: document.getElementById("contactXhs").value.trim(),
    email: document.getElementById("contactEmail").value.trim(),
  };
  saveData();
  showToast("联系方式保存成功", "success");
}

// ========== Services ==========
function renderServices() {
  const list = document.getElementById("servicesList");
  list.innerHTML = "";
  const services = adminData.services || [];
  if (services.length === 0) {
    list.innerHTML = `<p style="color:var(--ink-light);text-align:center;padding:24px">暂无服务项目，点击右上角新增</p>`;
    return;
  }
  services.forEach((s, i) => {
    const div = document.createElement("div");
    div.className = "cat-row";
    div.innerHTML = `
      <div class="cat-icon">${ICONS[s.icon] || "📷"}</div>
      <div class="cat-info"><div class="cat-name">${s.title}</div><div class="cat-meta">${s.price || ""}</div></div>
      <div class="cat-actions" style="opacity:1">
        <button class="btn-icon" onclick="openServiceModal(${i})" title="编辑"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button>
        <button class="btn-icon" onclick="deleteService(${i})" title="删除" style="color:var(--danger)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </div>
    `;
    list.appendChild(div);
  });
}

function openServiceModal(index) {
  const isEdit = index !== null && index !== undefined;
  const s = isEdit ? adminData.services[index] : { icon: "camera", title: "", desc: "", price: "" };
  const iconOptions = Object.keys(ICONS).map((k) => `<option value="${k}" ${s.icon === k ? "selected" : ""}>${k}</option>`).join("");
  document.getElementById("modalTitle").textContent = isEdit ? "编辑服务" : "新增服务";
  document.getElementById("modalBody").innerHTML = `
    <div class="form-group"><label class="form-label">图标</label><select class="form-select" id="svcIcon">${iconOptions}</select></div>
    <div class="form-group"><label class="form-label">服务名称<span class="req">*</span></label><input type="text" class="form-input" id="svcTitle" value="${s.title}" placeholder="场景布置"></div>
    <div class="form-group"><label class="form-label">服务描述</label><textarea class="form-textarea" id="svcDesc" placeholder="服务详细描述">${s.desc}</textarea></div>
    <div class="form-group"><label class="form-label">价格 / 标注</label><input type="text" class="form-input" id="svcPrice" value="${s.price || ""}" placeholder="详情请咨询"></div>
  `;
  document.getElementById("modalFooter").innerHTML = `<button class="btn btn-outline" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="saveService(${index})">${isEdit ? "保存" : "创建"}</button>`;
  openModal();
}

function saveService(index) {
  const title = document.getElementById("svcTitle").value.trim();
  if (!title) { showToast("请填写服务名称", "error"); return; }
  const data = { icon: document.getElementById("svcIcon").value, title, desc: document.getElementById("svcDesc").value.trim(), price: document.getElementById("svcPrice").value.trim() };
  if (index !== null && index !== undefined) adminData.services[index] = data;
  else { if (!adminData.services) adminData.services = []; adminData.services.push(data); }
  saveData(); renderServices(); renderDashboard(); closeModal(); showToast("保存成功", "success");
}

function deleteService(index) {
  if (!confirm("确定删除这个服务项目吗？")) return;
  adminData.services.splice(index, 1);
  saveData(); renderServices(); renderDashboard(); showToast("已删除", "success");
}

// ========== Settings ==========
function renderTokenStatus() {
  const statusEl = document.getElementById("ghTokenStatus");
  if (!statusEl) return;
  if (githubAPI.hasToken) {
    statusEl.innerHTML = '<span style="color:#22c55e">🟢 已连接 GitHub</span> — 上传的照片所有客户可见';
  } else {
    statusEl.innerHTML = '<span style="color:#f59e0b">🟡 未配置 Token</span> — 上传的照片仅本机可见，其他客户看不到';
  }

  const input = document.getElementById("ghTokenInput");
  if (input && !input.value) {
    input.value = githubAPI.token;
  }
}

function saveToken() {
  const input = document.getElementById("ghTokenInput");
  const token = input.value.trim();
  if (!token) {
    githubAPI.token = "";
    renderTokenStatus();
    showToast("Token 已清除", "success");
    return;
  }
  if (!token.startsWith("ghp_") && !token.startsWith("github_pat_")) {
    showToast("Token 格式不正确，应以 ghp_ 或 github_pat_ 开头", "error");
    return;
  }
  githubAPI.token = token;
  renderTokenStatus();
  showToast("Token 已保存，现在上传照片所有客户可见", "success");
}

async function testToken() {
  const token = document.getElementById("ghTokenInput").value.trim();
  if (!token) { showToast("请先输入 Token", "error"); return; }
  try {
    const resp = await fetch("https://api.github.com/user", {
      headers: { "Authorization": `token ${token}` }
    });
    if (resp.ok) {
      const user = await resp.json();
      showToast(`Token 有效 — GitHub 用户：${user.login}`, "success");
    } else {
      showToast("Token 无效，请检查", "error");
    }
  } catch (e) {
    showToast("网络错误，无法连接 GitHub", "error");
  }
}

async function syncFromGithub() {
  if (!githubAPI.hasToken) {
    showToast("请先配置 GitHub Token", "error");
    return;
  }
  try {
    showToast("正在从 GitHub 同步...", "");
    const remoteData = await githubAPI.loadDataJSON();
    if (remoteData && remoteData.categories) {
      adminData = remoteData;
      normalizeItems();
      await db.saveData(adminData);
      renderAll();
      showToast("同步成功！已从云端拉取最新数据", "success");
    }
  } catch (e) {
    showToast("同步失败：" + e.message, "error");
  }
}

async function syncToGithub() {
  if (!githubAPI.hasToken) return;
  const dataToSave = JSON.parse(JSON.stringify(adminData));
  // 清理 base64 数据，只保留文件路径
  dataToSave._updatedAt = new Date().toISOString();
  // 清理 items 中的 base64 视频数据
  (dataToSave.categories || []).forEach(cat => {
    (cat.items || []).forEach(item => {
      if (item.src && item.src.startsWith("data:video")) {
        // 视频 base64 不上传 GitHub，保留在本地
        item.src = "";
      }
    });
  });
  await githubAPI.saveDataJSON(dataToSave);
}

function changePassword() {
  const newPwd = document.getElementById("newPassword").value.trim();
  if (!newPwd) { showToast("请输入新密码", "error"); return; }
  if (newPwd.length < 4) { showToast("密码至少4位", "error"); return; }
  adminData.adminPassword = newPwd;
  saveData();
  document.getElementById("newPassword").value = "";
  showToast("密码修改成功", "success");
}

function exportData() {
  const dataStr = JSON.stringify(adminData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `fondant-party-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click(); URL.revokeObjectURL(url);
  showToast("数据已导出", "success");
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data.categories || !data.site) { showToast("文件格式不正确", "error"); return; }
      if (!confirm("导入将覆盖现有所有数据，确定继续吗？")) return;
      adminData = data;
      normalizeItems();
      await db.saveData(adminData);
      // 也推送到 GitHub
      try { await syncToGithub(); } catch (e) { console.warn("GitHub sync failed", e); }
      renderAll();
      showToast("数据导入成功", "success");
    } catch (err) { showToast("导入失败：" + err.message, "error"); }
  };
  reader.readAsText(file);
  e.target.value = "";
}

async function resetData() {
  if (!confirm("⚠️ 确定要重置所有数据吗？\n\n这将清除所有已上传的内容。此操作不可撤销！")) return;
  if (!confirm("再次确认：真的要重置所有数据吗？")) return;
  await db.clearData();
  adminData = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  // 也推送到 GitHub
  try { await syncToGithub(); } catch (e) {}
  renderAll();
  showToast("已重置为初始状态", "success");
}

async function saveData() {
  // 1. 保存到 IndexedDB（本地缓存）
  try { await db.saveData(adminData); } catch (e) { console.error("IndexedDB 保存失败", e); }

  // 2. 推送到 GitHub（跨设备同步）
  if (githubAPI.hasToken) {
    try {
      await syncToGithub();
    } catch (e) {
      console.warn("GitHub 同步失败（本地已保存）", e.message);
    }
  }
}

// ========== Section Switch ==========
function switchSection(section) {
  document.querySelectorAll(".admin-section").forEach((s) => s.classList.remove("active"));
  document.getElementById(`section-${section}`).classList.add("active");
  document.querySelectorAll(".sidebar-nav a").forEach((a) => a.classList.remove("active"));
  document.querySelector(`.sidebar-nav a[data-section="${section}"]`).classList.add("active");
  const titles = { dashboard: "数据概览", categories: "品类管理", photos: "样片上传", site: "网站文案", contact: "联系方式", services: "服务项目", settings: "系统设置" };
  document.getElementById("pageTitle").textContent = titles[section] || "";
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebarBackdrop").classList.remove("show");
  if (section === "settings") renderTokenStatus();
}

function openModal() { document.getElementById("modalOverlay").classList.add("active"); }
function closeModal() { document.getElementById("modalOverlay").classList.remove("active"); }

function showToast(msg, type = "") {
  const toast = document.getElementById("toast");
  toast.textContent = msg; toast.className = "toast " + type;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function formatDate(ts) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

init();
