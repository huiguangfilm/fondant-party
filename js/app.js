/**
 * app.js — 前台网站逻辑
 * 从 config.js 读取数据渲染网站，所有内容固化在代码中
 */

let siteData = null;
let currentCategory = null;
let currentGallery = [];
let currentIndex = 0;

// 默认占位图（按品类分配）
const PLACEHOLDER_IMAGES = {
  decor: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80",
  photo: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&q=80",
  zhuazhou: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80",
  engagement: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80",
  video: "https://images.unsplash.com/photo-1478359905291-76d4bd7d1a2e?w=800&q=80",
  host: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&q=80",
  birthday: "https://images.unsplash.com/photo-1530542112616-7a46b83c18a1?w=800&q=80",
  wedding: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80",
};
const DEFAULT_PLACEHOLDER = "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80";

function init() {
  siteData = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

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

// ========== Render Hero ==========
function renderHero() {
  const s = siteData.site;
  if (s.heroTag) document.getElementById("heroTag").textContent = s.heroTag;
  if (s.brandName) document.getElementById("heroTitle").textContent = s.brandName;
  if (s.heroTitleEn) document.getElementById("heroTitleEn").textContent = s.heroTitleEn;
  if (s.tagline) document.getElementById("heroSub").textContent = s.tagline;
  if (s.location) document.getElementById("heroLocation").textContent = s.location;
}

// ========== Render About ==========
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
  if (a.image) img.src = a.image;
}

// ========== Render Reasons ==========
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

// ========== Render Services ==========
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

// ========== Render Categories (pills + gallery) ==========
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
    grid.innerHTML = `
      <div class="gallery-empty">
        <div class="icon">${ICONS[cat.icon] ? "" : "📷"}</div>
        <p>该品类暂无样片，请在后台上传</p>
      </div>
    `;
    return;
  }

  items.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "gallery-item";
    if (i === 0 && items.length >= 3) div.classList.add("feature");
    const imgSrc = item.image || PLACEHOLDER_IMAGES[cat.id] || DEFAULT_PLACEHOLDER;
    div.innerHTML = `
      <img src="${imgSrc}" alt="${item.label || cat.name}" loading="lazy">
      <span class="gallery-item-label">${item.label || cat.name}</span>
    `;
    div.addEventListener("click", () => openLightbox(cat, i));
    grid.appendChild(div);
  });
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

// ========== Render Promises ==========
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
    card.innerHTML = `
      <div class="num">${item.num}</div>
      <div class="title">${item.title}</div>
    `;
    grid.appendChild(card);
  });
}

// ========== Render Contact ==========
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
    el.innerHTML = `
      <div class="contact-icon">${item.icon}</div>
      <div class="label">${item.label}</div>
      <div class="value">${item.value}</div>
    `;
    container.appendChild(el);
  });

  const cta = document.getElementById("contactCta");
  if (cta) cta.textContent = "添加微信 · 预约咨询 · 定制属于你的派对";
}

// ========== Lightbox ==========
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lbImg");
const lbLabel = document.getElementById("lbLabel");
const lbCounter = document.getElementById("lbCounter");

function openLightbox(cat, index) {
  currentGallery = (cat.items || []).map((item) => ({
    src: item.image || PLACEHOLDER_IMAGES[cat.id] || DEFAULT_PLACEHOLDER,
    label: item.label || cat.name,
  }));
  currentIndex = index;
  updateLightbox();
  lightbox.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.classList.remove("active");
  document.body.style.overflow = "";
}

function updateLightbox() {
  if (currentGallery.length === 0) return;
  const item = currentGallery[currentIndex];
  lbImg.src = item.src;
  lbImg.alt = item.label;
  lbLabel.textContent = item.label;
  lbLabel.classList.add("show");
  lbCounter.textContent = `${currentIndex + 1} / ${currentGallery.length}`;
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
lightbox.addEventListener("touchstart", (e) => {
  touchStartX = e.touches[0].clientX;
});
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

// ========== Nav Scroll ==========
const nav = document.getElementById("nav");
window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 50);
});

// ========== Scroll Reveal ==========
let fadeObserver = null;
function observeFadeIn() {
  if (!fadeObserver) {
    fadeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            fadeObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
  }
  document.querySelectorAll(".fade-in:not(.visible)").forEach((el) => {
    fadeObserver.observe(el);
  });
}

// ========== Init ==========
init();
