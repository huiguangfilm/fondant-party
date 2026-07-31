/**
 * app.js — 前台网站逻辑
 * 数据加载链：GitHub data.json → IndexedDB 缓存 → 默认配置
 * 客户打开链接 = 所有人看到同步内容
 */

let siteData = null;
let currentCategory = null;
let currentGallery = [];
let currentIndex = 0;

// 默认占位图（当 data.json 和 IndexedDB 都没数据时）
const PLACEHOLDER_IMAGES = {
  "engagement-decor": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80",
  "birthday-decor": "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80",
  "wedding-photo": "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
  "event-photo": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
  "birthday-photo": "https://images.unsplash.com/photo-1530542112616-7a46b83c18a1?w=800&q=80",
  "engagement-photo": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80",
  "wedding-video": "https://images.unsplash.com/photo-1478359905291-76d4bd7d1a2e?w=800&q=80",
  "prewedding-film": "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80",
};
const DEFAULT_PLACEHOLDER = "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80";

// 获取兼容的 item 数据
function getItemSrc(item) {
  const src = item.src || item.image || "";
  // 如果是相对路径（如 uploads/xxx.jpg），拼接 raw GitHub 地址
  if (src && !/^https?:\/\//.test(src) && !/^data:/.test(src)) {
    return `https://raw.githubusercontent.com/huiguangfilm/fondant-party/main/${src}`;
  }
  return src;
}
function getItemType(item) {
  return item.type || "photo";
}

async function init() {
  let loaded = false;

  // 1. 尝试从 GitHub 加载 data.json（所有客户都能看到的最新内容，无需 Token）
  try {
    const remoteData = await githubAPI.loadDataJSON();
    if (remoteData && remoteData.categories) {
      siteData = remoteData;
      // 缓存到本地 IndexedDB，下次加载更快
      try { await db.saveData(remoteData); } catch (e) {}
      loaded = true;
    }
  } catch (e) {
    console.warn("无法从 GitHub 加载数据，尝试本地缓存", e.message);
  }

  // 2. 回退到 IndexedDB 缓存
  if (!loaded) {
    try {
      const saved = await db.getData();
      if (saved && saved.categories) {
        siteData = saved;
        loaded = true;
      }
    } catch (e) {
      console.warn("无法加载 IndexedDB 缓存", e);
    }
  }

  // 3. 最终回退到默认配置
  if (!loaded) {
    siteData = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }

  normalizeItems();
  renderHero();
  renderAbout();
  renderReasons();
  renderServices();
  renderCategories();
  renderProcess();
  renderPromises();
  renderContact();
  observeFadeIn();
}

// 兼容旧数据格式
function normalizeItems() {
  (siteData.categories || []).forEach(cat => {
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

// ========== Render Hero ==========
function renderHero() {
  const s = siteData.site;
  if (s.heroTag) document.getElementById("heroTag").textContent = s.heroTag;
  if (s.brandName) document.getElementById("heroTitle").textContent = s.brandName;
  if (s.heroTitleEn) document.getElementById("heroTitleEn").textContent = s.heroTitleEn;
  if (s.tagline) document.getElementById("heroSub").textContent = s.tagline;
  if (s.location) document.getElementById("heroLocation").textContent = s.location;
}

function renderAbout() {
  const a = siteData.about;
  if (a.title) document.getElementById("aboutTitle").textContent = a.title;

  const pContainer = document.getElementById("aboutParagraphs");
  pContainer.innerHTML = "";
  (a.paragraphs || []).forEach((p) => {
    const el = document.createElement("p");
    el.textContent = p;
    pContainer.appendChild(el);
  });

  const sContainer = document.getElementById("aboutStats");
  sContainer.innerHTML = "";
  (a.stats || []).forEach((s) => {
    const el = document.createElement("div");
    el.className = "about-stat";
    el.innerHTML = `<div class="num">${s.num}</div><div class="label">${s.label}</div>`;
    sContainer.appendChild(el);
  });

  const img = document.getElementById("aboutImg");
  if (a.image) {
    // 如果是相对路径，也用 raw GitHub
    img.src = /^https?:\/\//.test(a.image) ? a.image : `https://raw.githubusercontent.com/huiguangfilm/fondant-party/main/${a.image}`;
  }
}

function renderReasons() {
  const r = siteData.reasons || {};
  const grid = document.getElementById("reasonsGrid");
  if (!grid) return;
  grid.innerHTML = "";
  (r.items || []).forEach((item, i) => {
    const tag = document.createElement("div");
    tag.className = "reason-tag fade-in";
    if (i === 0 || i === 4 || i === 8) tag.classList.add("highlight");
    tag.textContent = item;
    grid.appendChild(tag);
  });
  const footer = document.getElementById("reasonsFooter");
  if (footer) footer.textContent = r.footer || "";
}

function renderServices() {
  const grid = document.getElementById("serviceGrid");
  grid.innerHTML = "";
  (siteData.services || []).forEach((s) => {
    const card = document.createElement("div");
    card.className = "service-card fade-in";
    const iconHtml = ICONS[s.icon] || ICONS.camera;
    card.innerHTML = `
      <div class="service-icon">${iconHtml}</div>
      <h3>${s.title}</h3>
      <p>${s.desc}</p>
      <div class="price">${s.price || ""}</div>
    `;
    grid.appendChild(card);
  });
}

// ========== Render Categories ==========
function renderCategories() {
  const cats = siteData.categories || [];
  const pillsContainer = document.getElementById("catPills");
  pillsContainer.innerHTML = "";

  cats.forEach((cat, i) => {
    const pill = document.createElement("button");
    pill.className = "cat-pill" + (i === 0 ? " active" : "");
    pill.textContent = cat.name;
    pill.dataset.catId = cat.id;
    pill.addEventListener("click", () => selectCategory(cat.id));
    pillsContainer.appendChild(pill);
  });

  if (cats.length > 0) selectCategory(cats[0].id);
}

function selectCategory(catId) {
  document.querySelectorAll(".cat-pill").forEach((p) => {
    p.classList.toggle("active", p.dataset.catId === catId);
  });
  const cat = siteData.categories.find((c) => c.id === catId);
  if (!cat) return;
  currentCategory = cat;
  renderGallery(cat);
}

function renderGallery(cat) {
  const grid = document.getElementById("galleryGrid");
  grid.innerHTML = "";

  const items = cat.items || [];
  if (items.length === 0) {
    const iconHtml = ICONS[cat.icon] || "";
    grid.innerHTML = `
      <div class="gallery-empty">
        <div class="icon">${iconHtml ? iconHtml.replace(/<svg/, '<svg style="width:48px;height:48px;opacity:.3"') : "📷"}</div>
        <p>该品类暂无样片，请在后台上传</p>
      </div>
    `;
    return;
  }

  items.forEach((item, i) => {
    const isVideo = getItemType(item) === "video";
    const src = getItemSrc(item);
    const label = item.label || cat.name;

    const div = document.createElement("div");
    div.className = "gallery-item";
    if (i === 0 && items.length >= 3) div.classList.add("feature");
    if (isVideo) div.classList.add("video-item");

    if (isVideo) {
      div.innerHTML = `
        <img src="${getVideoThumb(src)}" alt="${label}" loading="lazy">
        <span class="gallery-play-btn" aria-hidden="true"></span>
        <span class="gallery-item-label">${label}</span>
      `;
    } else {
      div.innerHTML = `
        <img src="${src}" alt="${label}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <span class="gallery-img-fallback" style="display:none;position:absolute;inset:0;align-items:center;justify-content:center;background:var(--bg-warm);font-size:32px">📷</span>
        <span class="gallery-item-label">${label}</span>
      `;
    }
    div.addEventListener("click", () => openLightbox(cat, i));
    grid.appendChild(div);
  });
}

function getVideoThumb(src) {
  if (!src || /^https?:\/\//.test(src) || /^data:image/.test(src)) return src;
  const catId = currentCategory ? currentCategory.id : "";
  return PLACEHOLDER_IMAGES[catId] || DEFAULT_PLACEHOLDER;
}

// ========== Render Process ==========
function renderProcess() {
  const p = siteData.process || {};
  const label = document.getElementById("processLabel");
  if (label && p.titleEn) label.textContent = p.titleEn;
  const title = document.getElementById("processTitle");
  if (title && p.title) title.textContent = p.title;
  const sub = document.getElementById("processSub");
  if (sub && p.subtitle) sub.textContent = p.subtitle;

  const stepsContainer = document.getElementById("processSteps");
  if (!stepsContainer) return;
  stepsContainer.innerHTML = "";
  (p.steps || []).forEach((step) => {
    const div = document.createElement("div");
    div.className = "process-step fade-in";
    div.innerHTML = `
      <div class="num">${step.num}</div>
      <div class="title">${step.title}</div>
      <div class="desc">${step.desc}</div>
    `;
    stepsContainer.appendChild(div);
  });
  const footer = document.getElementById("processFooter");
  if (footer && p.footer) footer.textContent = p.footer;
}

function renderPromises() {
  const p = siteData.promises || {};
  const label = document.getElementById("promisesLabel");
  if (label && p.titleEn) label.textContent = p.titleEn;
  const title = document.getElementById("promisesTitle");
  if (title && p.title) title.textContent = p.title;
  const sub = document.getElementById("promisesSub");
  if (sub) sub.textContent = p.subtitle || "Your Satisfaction, Our Priority";

  const grid = document.getElementById("promisesGrid");
  if (!grid) return;
  grid.innerHTML = "";
  (p.items || []).forEach((item) => {
    const card = document.createElement("div");
    card.className = "promise-card fade-in";
    card.innerHTML = `<div class="num">${item.num}</div><div class="title">${item.title}</div>`;
    grid.appendChild(card);
  });
}

function renderContact() {
  const c = siteData.contact || {};
  const container = document.getElementById("contactInfo");
  container.innerHTML = "";
  const items = [
    c.wechat && { icon: "💬", label: "微信咨询", value: c.wechat },
    c.phone && { icon: "📞", label: "电话预约", value: c.phone },
    c.phone2 && { icon: "📱", label: "备用电话", value: c.phone2 },
    c.xiaohongshu && { icon: "📕", label: "小红书", value: c.xiaohongshu },
  ].filter(Boolean);
  items.forEach((item) => {
    const el = document.createElement("div");
    el.className = "contact-item fade-in";
    el.innerHTML = `<div class="contact-icon">${item.icon}</div><div class="label">${item.label}</div><div class="value">${item.value}</div>`;
    container.appendChild(el);
  });
  const cta = document.getElementById("contactCta");
  if (cta) cta.textContent = "添加微信 · 预约咨询 · 定制属于你的派对";
}

// ========== Lightbox ==========
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lbImg");
const lbVideo = document.getElementById("lbVideo");
const lbLabel = document.getElementById("lbLabel");
const lbCounter = document.getElementById("lbCounter");

function openLightbox(cat, index) {
  currentGallery = (cat.items || []).map((item) => ({
    type: getItemType(item),
    src: getItemSrc(item),
    label: item.label || cat.name,
    catId: cat.id,
  }));
  currentIndex = index;
  updateLightbox();
  lightbox.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.classList.remove("active");
  document.body.style.overflow = "";
  if (lbVideo) {
    lbVideo.pause();
    lbVideo.src = "";
    lbVideo.style.display = "none";
  }
}

function updateLightbox() {
  if (currentGallery.length === 0) return;
  const item = currentGallery[currentIndex];
  lbLabel.textContent = item.label;
  lbLabel.classList.add("show");
  lbCounter.textContent = `${currentIndex + 1} / ${currentGallery.length}`;

  if (item.type === "video") {
    lbImg.style.display = "none";
    lbVideo.style.display = "block";
    lbVideo.src = item.src;
    lbVideo.play().catch(() => {});
  } else {
    lbVideo.style.display = "none";
    lbVideo.pause();
    lbVideo.src = "";
    lbImg.style.display = "block";
    const fallback = PLACEHOLDER_IMAGES[item.catId] || DEFAULT_PLACEHOLDER;
    lbImg.src = item.src || fallback;
    lbImg.alt = item.label;
  }
}

document.getElementById("lbClose").addEventListener("click", closeLightbox);
document.getElementById("lbPrev").addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
  updateLightbox();
});
document.getElementById("lbNext").addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % currentGallery.length;
  updateLightbox();
});
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("active")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") document.getElementById("lbPrev").click();
  if (e.key === "ArrowRight") document.getElementById("lbNext").click();
});

// Touch swipe
let touchStartX = 0;
lightbox.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; });
lightbox.addEventListener("touchend", (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) {
    if (dx > 0) document.getElementById("lbPrev").click();
    else document.getElementById("lbNext").click();
  }
});

// ========== Mobile Nav ==========
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
navToggle.addEventListener("click", () => {
  navToggle.classList.toggle("active");
  navLinks.classList.toggle("active");
});
navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navToggle.classList.remove("active");
    navLinks.classList.remove("active");
  });
});

// Nav Scroll
const nav = document.getElementById("nav");
window.addEventListener("scroll", () => { nav.classList.toggle("scrolled", window.scrollY > 50); });

// Scroll Reveal
let fadeObserver = null;
function observeFadeIn() {
  if (!fadeObserver) {
    fadeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          fadeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
  }
  document.querySelectorAll(".fade-in:not(.visible)").forEach((el) => fadeObserver.observe(el));
}

init();
