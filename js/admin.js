/**
 * admin.js — 后台管理逻辑
 * 功能：登录、品类管理、样片上传、文案编辑、联系方式、服务项目、数据导入导出
 */

let adminData = null;
let currentPhotoCat = null;

// ========== Init ==========
async function init() {
  // 检查登录状态
  const loggedIn = sessionStorage.getItem("fp_admin_logged_in");
  if (loggedIn === "true") {
    showAdmin();
  }

  // 登录事件
  document.getElementById("loginBtn").addEventListener("click", handleLogin);
  document.getElementById("loginInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleLogin();
  });

  // 导航事件
  document.querySelectorAll(".sidebar-nav a[data-section]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      switchSection(a.dataset.section);
    });
  });

  // 移动端菜单
  document.getElementById("menuBtn").addEventListener("click", () => {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("sidebarBackdrop").classList.add("show");
  });
  document.getElementById("sidebarBackdrop").addEventListener("click", () => {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sidebarBackdrop").classList.remove("show");
  });

  // 顶部按钮
  document.getElementById("exportBtn").addEventListener("click", exportData);

  // 各功能事件
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

  // 照片上传
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

  // 品类选择
  document.getElementById("photoCatSelect").addEventListener("change", (e) => {
    currentPhotoCat = e.target.value;
    renderPhotos();
  });

  // Modal 关闭
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("modalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "modalOverlay") closeModal();
  });
}

// ========== Login ==========
async function handleLogin() {
  const input = document.getElementById("loginInput").value.trim();
  const errorEl = document.getElementById("loginError");

  // 加载数据获取密码
  try {
    adminData = await db.getData();
    if (!adminData) {
      adminData = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
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
    try {
      adminData = await db.getData();
      if (!adminData) adminData = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    } catch (e) {
      adminData = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
  }
  renderDashboard();
  renderCategories();
  renderPhotoCatSelect();
  renderSiteText();
  renderContact();
  renderServices();
}

// ========== Dashboard ==========
function renderDashboard() {
  const cats = adminData.categories || [];
  const totalPhotos = cats.reduce((sum, c) => sum + (c.items ? c.items.length : 0), 0);

  const grid = document.getElementById("statsGrid");
  grid.innerHTML = `
    <div class="stat-card">
      <div class="label">品类数量</div>
      <div class="num gold">${cats.length}</div>
    </div>
    <div class="stat-card">
      <div class="label">样片总数</div>
      <div class="num">${totalPhotos}</div>
    </div>
    <div class="stat-card">
      <div class="label">服务项目</div>
      <div class="num">${(adminData.services || []).length}</div>
    </div>
    <div class="stat-card">
      <div class="label">最后更新</div>
      <div class="num" style="font-size:16px;padding-top:8px">${formatDate(Date.now())}</div>
    </div>
  `;

  const catsContainer = document.getElementById("dashboardCats");
  catsContainer.innerHTML = "";
  cats.forEach((cat) => {
    const count = cat.items ? cat.items.length : 0;
    const row = document.createElement("div");
    row.className = "cat-row";
    row.innerHTML = `
      <div class="cat-icon">${ICONS[cat.icon] ? ICONS[cat.icon].replace('stroke="currentColor"','stroke="var(--gold)"') : "📷"}</div>
      <div class="cat-info">
        <div class="cat-name">${cat.name}</div>
        <div class="cat-meta">${cat.nameEn || ""}</div>
      </div>
      <div class="cat-count">${count} 张</div>
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
    const count = cat.items ? cat.items.length : 0;
    const row = document.createElement("div");
    row.className = "cat-row";
    row.draggable = true;
    row.dataset.index = index;
    row.innerHTML = `
      <div class="drag-handle" title="拖拽排序">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
      </div>
      <div class="cat-icon">${ICONS[cat.icon] || "📷"}</div>
      <div class="cat-info">
        <div class="cat-name">${cat.name}</div>
        <div class="cat-meta">${cat.nameEn || ""} · ${count} 张样片</div>
      </div>
      <div class="cat-count">${count}</div>
      <div class="cat-actions">
        <button class="btn-icon" onclick="openCategoryModal(${index})" title="编辑">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
        </button>
        <button class="btn-icon" onclick="deleteCategory(${index})" title="删除" style="color:var(--danger)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `;

    // Drag events
    row.addEventListener("dragstart", handleDragStart);
    row.addEventListener("dragover", handleDragOver);
    row.addEventListener("drop", handleDrop);
    row.addEventListener("dragend", handleDragEnd);

    list.appendChild(row);
  });
}

let dragSrcIndex = null;
function handleDragStart(e) {
  dragSrcIndex = parseInt(this.dataset.index);
  this.classList.add("dragging");
}
function handleDragOver(e) {
  e.preventDefault();
}
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
function handleDragEnd() {
  this.classList.remove("dragging");
  dragSrcIndex = null;
}

function openCategoryModal(index) {
  const isEdit = index !== null && index !== undefined;
  const cat = isEdit ? adminData.categories[index] : { id: "", name: "", nameEn: "", icon: "camera", description: "", items: [] };

  const iconOptions = Object.keys(ICONS).map((k) => `<option value="${k}" ${cat.icon === k ? "selected" : ""}>${k}</option>`).join("");

  document.getElementById("modalTitle").textContent = isEdit ? "编辑品类" : "新增品类";
  document.getElementById("modalBody").innerHTML = `
    <div class="form-group">
      <label class="form-label">品类ID<span class="req">*</span></label>
      <input type="text" class="form-input" id="catId" value="${cat.id}" placeholder="英文ID，如 engagement" ${isEdit ? "disabled" : ""}>
      <div class="form-hint">唯一标识，创建后不可修改</div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">中文名称<span class="req">*</span></label>
        <input type="text" class="form-input" id="catName" value="${cat.name}" placeholder="订婚跟拍">
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

  if (!id || !name) {
    showToast("请填写必填项", "error");
    return;
  }

  if (index !== null && index !== undefined) {
    // 编辑
    adminData.categories[index] = { ...adminData.categories[index], name, nameEn, icon, description: desc };
  } else {
    // 新增
    if (adminData.categories.some((c) => c.id === id)) {
      showToast("品类ID已存在", "error");
      return;
    }
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
  if (!confirm(`确定删除品类「${cat.name}」吗？该品类下的所有样片也会被删除。`)) return;
  adminData.categories.splice(index, 1);
  saveData();
  renderCategories();
  renderDashboard();
  renderPhotoCatSelect();
  showToast("已删除", "success");
}

// ========== Photos ==========
function renderPhotoCatSelect() {
  const select = document.getElementById("photoCatSelect");
  const cats = adminData.categories || [];
  select.innerHTML = cats.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");

  if (!currentPhotoCat && cats.length > 0) {
    currentPhotoCat = cats[0].id;
  }
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
  document.getElementById("photoCount").textContent = `共 ${items.length} 张`;

  const grid = document.getElementById("photoGrid");
  if (items.length === 0) {
    grid.innerHTML = `
      <div class="photo-empty" style="grid-column:1/-1">
        <div class="icon">📷</div>
        <p>还没有样片，请上传</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = "";
  items.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "photo-item";
    div.innerHTML = `
      <div class="photo-num">${i + 1}</div>
      <img src="${item.image}" alt="${item.label || ""}" loading="lazy">
      <div class="photo-overlay">
        <input type="text" class="photo-label-input" value="${item.label || ""}" placeholder="标注" onchange="updatePhotoLabel(${i}, this.value)">
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

function handleFiles(files) {
  const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
  if (imageFiles.length === 0) {
    showToast("请选择图片文件", "error");
    return;
  }

  const cat = adminData.categories.find((c) => c.id === currentPhotoCat);
  if (!cat) {
    showToast("请先选择品类", "error");
    return;
  }

  if (!cat.items) cat.items = [];

  let processed = 0;
  imageFiles.forEach((file) => {
    if (file.size > 10 * 1024 * 1024) {
      showToast(`${file.name} 超过10MB，已跳过`, "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      // 压缩图片
      compressImage(e.target.result, 1200, 0.85).then((compressed) => {
        cat.items.push({
          image: compressed,
          label: "",
        });
        processed++;
        if (processed === imageFiles.filter((f) => f.size <= 10 * 1024 * 1024).length) {
          saveData();
          renderPhotos();
          renderDashboard();
          renderCategories();
          showToast(`成功上传 ${processed} 张图片`, "success");
        }
      });
    };
    reader.readAsDataURL(file);
  });
}

// 图片压缩
function compressImage(dataUrl, maxWidth, quality) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) {
        h = (h * maxWidth) / w;
        w = maxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
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
  if (cat && cat.items[index]) {
    cat.items[index].label = label;
    saveData();
  }
}

function deletePhoto(index) {
  const cat = adminData.categories.find((c) => c.id === currentPhotoCat);
  if (!cat || !cat.items[index]) return;
  if (!confirm("确定删除这张照片吗？")) return;
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
      <div class="cat-info">
        <div class="cat-name">${s.title}</div>
        <div class="cat-meta">${s.price || ""}</div>
      </div>
      <div class="cat-actions" style="opacity:1">
        <button class="btn-icon" onclick="openServiceModal(${i})" title="编辑">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
        </button>
        <button class="btn-icon" onclick="deleteService(${i})" title="删除" style="color:var(--danger)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
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
    <div class="form-group">
      <label class="form-label">图标</label>
      <select class="form-select" id="svcIcon">${iconOptions}</select>
    </div>
    <div class="form-group">
      <label class="form-label">服务名称<span class="req">*</span></label>
      <input type="text" class="form-input" id="svcTitle" value="${s.title}" placeholder="订婚跟拍">
    </div>
    <div class="form-group">
      <label class="form-label">服务描述</label>
      <textarea class="form-textarea" id="svcDesc" placeholder="服务详细描述">${s.desc}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">价格 / 标注</label>
      <input type="text" class="form-input" id="svcPrice" value="${s.price || ""}" placeholder="详情请咨询">
    </div>
  `;
  document.getElementById("modalFooter").innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">取消</button>
    <button class="btn btn-primary" onclick="saveService(${index})">${isEdit ? "保存" : "创建"}</button>
  `;
  openModal();
}

function saveService(index) {
  const title = document.getElementById("svcTitle").value.trim();
  if (!title) {
    showToast("请填写服务名称", "error");
    return;
  }
  const data = {
    icon: document.getElementById("svcIcon").value,
    title,
    desc: document.getElementById("svcDesc").value.trim(),
    price: document.getElementById("svcPrice").value.trim(),
  };

  if (index !== null && index !== undefined) {
    adminData.services[index] = data;
  } else {
    if (!adminData.services) adminData.services = [];
    adminData.services.push(data);
  }
  saveData();
  renderServices();
  renderDashboard();
  closeModal();
  showToast("保存成功", "success");
}

function deleteService(index) {
  if (!confirm("确定删除这个服务项目吗？")) return;
  adminData.services.splice(index, 1);
  saveData();
  renderServices();
  renderDashboard();
  showToast("已删除", "success");
}

// ========== Settings ==========
function changePassword() {
  const newPwd = document.getElementById("newPassword").value.trim();
  if (!newPwd) {
    showToast("请输入新密码", "error");
    return;
  }
  if (newPwd.length < 4) {
    showToast("密码至少4位", "error");
    return;
  }
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
  a.href = url;
  a.download = `fondant-party-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("数据已导出", "success");
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data.categories || !data.site) {
        showToast("文件格式不正确", "error");
        return;
      }
      if (!confirm("导入将覆盖现有所有数据，确定继续吗？")) return;
      adminData = data;
      await db.saveData(adminData);
      renderAll();
      showToast("数据导入成功", "success");
    } catch (err) {
      showToast("导入失败：" + err.message, "error");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}

async function resetData() {
  if (!confirm("⚠️ 确定要重置所有数据吗？\n\n这将清除所有已上传的照片和修改的内容，恢复到初始状态。\n\n此操作不可撤销！")) return;
  if (!confirm("再次确认：真的要重置所有数据吗？")) return;
  await db.clearData();
  adminData = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  renderAll();
  showToast("已重置为初始状态", "success");
}

// ========== Save ==========
async function saveData() {
  try {
    await db.saveData(adminData);
  } catch (e) {
    console.error("保存失败", e);
    showToast("保存失败：" + e.message, "error");
  }
}

// ========== Section Switch ==========
function switchSection(section) {
  document.querySelectorAll(".admin-section").forEach((s) => s.classList.remove("active"));
  document.getElementById(`section-${section}`).classList.add("active");

  document.querySelectorAll(".sidebar-nav a").forEach((a) => a.classList.remove("active"));
  document.querySelector(`.sidebar-nav a[data-section="${section}"]`).classList.add("active");

  const titles = {
    dashboard: "数据概览",
    categories: "品类管理",
    photos: "样片上传",
    site: "网站文案",
    contact: "联系方式",
    services: "服务项目",
    settings: "系统设置",
  };
  document.getElementById("pageTitle").textContent = titles[section] || "";

  // 关闭移动端侧边栏
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebarBackdrop").classList.remove("show");
}

// ========== Modal ==========
function openModal() {
  document.getElementById("modalOverlay").classList.add("active");
}
function closeModal() {
  document.getElementById("modalOverlay").classList.remove("active");
}

// ========== Toast ==========
function showToast(msg, type = "") {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className = "toast " + type;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

// ========== Utils ==========
function formatDate(ts) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ========== Start ==========
init();
