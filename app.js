// =============================
// CONFIG WhatsApp + Precios
// =============================
const WHATSAPP_NUMBER = "593995641660";
const money = (n) => `$${n.toFixed(2)}`;
const waLink = (msg) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

// Precios por presentación
const PRICE_BY_ML = { 30: 10, 50: 15, 100: 20 };

// Textos por categoría (modal 1)
const CATEGORY_INFO = {
  dama: {
    title: "DAMA",
    desc: "Aquí encontrarás las fragancias más exquisitas para destacar tu lado más sensual, con un 99% de similitud con los perfumes originales."
  },
  caballero: {
    title: "CABALLERO",
    desc: "Aromas amaderados, especiados y frescos para transmitir carácter y seguridad, con un 99% de similitud con perfumes originales."
  },
  nicho: {
    title: "NICHO",
    desc: "Fragancias exclusivas e intensas para quienes buscan distinción y originalidad, con un 99% de similitud con perfumes originales."
  },
  unisex: {
    title: "UNISEX",
    desc: "Composiciones modernas y equilibradas para cualquier estilo, con un 99% de similitud con perfumes originales."
  }
};

// =============================
// DATA (desde perfumes.json)
// =============================
let PERFUMES = [];
let SEARCH_INDEX = [];

// Construye string de búsqueda “premium”
function buildSearchText(p){
  const notes = (p.notes || []).join(" ");
  const recs  = (p.recs  || []).join(" ");
  return `${p.name} ${p.category} ${notes} ${recs}`.toLowerCase();
}

async function loadPerfumes(){
  try{
    const res = await fetch("perfumes.json", { cache: "no-store" });
    if(!res.ok) throw new Error("No se pudo cargar perfumes.json");
    PERFUMES = await res.json();

    SEARCH_INDEX = PERFUMES.map(p => ({ p, text: buildSearchText(p) }));
    console.log("✅ Perfumes cargados:", PERFUMES.length);
  }catch(err){
    console.error(err);
    alert("Error cargando perfumes.json. Revisa que exista y esté bien escrito.");
  }
}

// =============================
// Estado Carrito (items únicos por id+ml)
// =============================
let cart = loadCart(); // [{id, ml, qty, category}]
function keyOf(id, ml){ return `${id}__${ml}`; }

function loadCart(){
  try{
    const raw = localStorage.getItem("esenciajj_cart");
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}
function saveCart(){
  localStorage.setItem("esenciajj_cart", JSON.stringify(cart));
}

// =============================
// Helpers UI
// =============================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function showToast(text){
  const el = $("#toast");
  if(!el) return;
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> el.classList.remove("show"), 1600);
}

function openModal(modalEl){
  modalEl.style.display = "block";
  modalEl.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeModal(modalEl){
  modalEl.style.display = "none";
  modalEl.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
function isOpen(modalEl){
  return modalEl.style.display === "block";
}

// =============================
// Año
// =============================
$("#year").textContent = new Date().getFullYear();

// =============================
// Modales
// =============================
const categoryModal = $("#categoryModal");
const perfumeModal  = $("#perfumeModal");
const cartModal     = $("#cartModal");

$("#closeCategoryModal").addEventListener("click", ()=> closeModal(categoryModal));
$("#closePerfumeModal").addEventListener("click", ()=> closeModal(perfumeModal));
$("#closeCartModal").addEventListener("click", ()=> closeModal(cartModal));

[categoryModal, perfumeModal, cartModal].forEach(m=>{
  m.addEventListener("click", (e)=>{ if(e.target === m) closeModal(m); });
});

// =============================
// Modal 1: Catálogo por categoría + buscador interno
// =============================
const catTitle = $("#catTitle");
const catDesc  = $("#catDesc");
const perfGrid = $("#perfGrid");

const catSearch = $("#catSearch");
const catSearchClear = $("#catSearchClear");
const catResultCount = $("#catResultCount");
const catNoResults = $("#catNoResults");

let currentCategory = null;
let currentCatList = [];
let currentCatFiltered = [];

function renderPerfGrid(list){
  perfGrid.innerHTML = "";
  catNoResults.hidden = list.length !== 0;

  if(list.length === 0){
    catResultCount.textContent = "Mostrando 0";
    return;
  }

  list.forEach(p=>{
    const card = document.createElement("div");
    card.className = "perfCard";
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <div class="perfCard__body">
        <span class="perfBadge">${p.category.toUpperCase()}</span>
        <h3 class="perfCard__name">${p.name}</h3>
        <p class="perfCard__desc">${p.shortDesc}</p>
        <button class="btn" data-open-perf="${p.id}">Ver más</button>
      </div>
    `;
    perfGrid.appendChild(card);
  });

  catResultCount.textContent = `Mostrando ${list.length}`;

  // listeners “Ver más”
  $$("[data-open-perf]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-open-perf");
      openPerfume(id);
    });
  });
}

function applyCategorySearch(){
  const q = (catSearch.value || "").trim().toLowerCase();
  if(!q){
    currentCatFiltered = [...currentCatList];
    renderPerfGrid(currentCatFiltered);
    return;
  }
  currentCatFiltered = currentCatList.filter(p => buildSearchText(p).includes(q));
  renderPerfGrid(currentCatFiltered);
}

function renderCategory(category){
  currentCategory = category;

  const info = CATEGORY_INFO[category];
  catTitle.textContent = info?.title || category.toUpperCase();
  catDesc.textContent  = info?.desc || "";

  catSearch.value = "";
  catNoResults.hidden = true;

  currentCatList = PERFUMES.filter(p => p.category === category);
  currentCatFiltered = [...currentCatList];

  renderPerfGrid(currentCatFiltered);
}

// abrir modal categoría
$$(".openCategory").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const cat = btn.dataset.category;
    renderCategory(cat);
    openModal(categoryModal);
    setTimeout(()=> catSearch.focus(), 0);
  });
});

catSearch.addEventListener("input", applyCategorySearch);
catSearchClear.addEventListener("click", ()=>{
  catSearch.value = "";
  applyCategorySearch();
  catSearch.focus();
});

// =============================
// Modal 2: Detalle perfume + ml + add cart
// =============================
let currentPerfumeId = null;
let selectedML = null;

const pCatKicker = $("#pCatKicker");
const pTitle     = $("#pTitle");
const pFullDesc  = $("#pFullDesc");
const pImg       = $("#pImg");
const pNotes     = $("#pNotes");
const pRecs      = $("#pRecs");
const pPrice     = $("#pPrice");
const addToCartBtn = $("#addToCartBtn");

function resetSizeButtons(){
  $$(".sizeBtn").forEach(b=> b.classList.remove("active"));
  selectedML = null;
  pPrice.textContent = "—";
  addToCartBtn.disabled = true;
}

function openPerfume(id){
  const p = PERFUMES.find(x=>x.id === id);
  if(!p) return;

  currentPerfumeId = id;
  resetSizeButtons();

  pCatKicker.textContent = (p.category || "Perfume").toUpperCase();
  pTitle.textContent = p.name;
  pFullDesc.textContent = p.fullDesc;
  pImg.src = p.image;
  pImg.alt = p.name;

  pNotes.innerHTML = "";
  (p.notes || []).forEach(n=>{
    const chip = document.createElement("span");
    chip.className = "chipMini";
    chip.textContent = n;
    pNotes.appendChild(chip);
  });

  pRecs.innerHTML = "";
  (p.recs || []).forEach(r=>{
    const li = document.createElement("li");
    li.textContent = r;
    pRecs.appendChild(li);
  });

  openModal(perfumeModal);
}

// selección ml
$$(".sizeBtn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    $$(".sizeBtn").forEach(b=> b.classList.remove("active"));
    btn.classList.add("active");
    selectedML = parseInt(btn.dataset.ml, 10);

    const price = PRICE_BY_ML[selectedML] ?? 0;
    pPrice.textContent = money(price);

    addToCartBtn.disabled = !currentPerfumeId || !selectedML;
  });
});

addToCartBtn.addEventListener("click", ()=>{
  if(!currentPerfumeId || !selectedML) return;
  const p = PERFUMES.find(x=>x.id === currentPerfumeId);
  if(!p) return;

  addToCart(currentPerfumeId, selectedML, p.category);
  showToast(`Agregado al carrito: ${p.name} (${selectedML} ml)`);
  renderCartUI();
});

// =============================
// Carrito
// =============================
function addToCart(id, ml, category){
  const k = keyOf(id, ml);
  const idx = cart.findIndex(i => keyOf(i.id, i.ml) === k);

  if(idx >= 0) cart[idx].qty += 1;
  else cart.push({ id, ml, qty: 1, category });

  saveCart();
  updateCartCount();
}

function removeItem(id, ml){
  const k = keyOf(id, ml);
  cart = cart.filter(i => keyOf(i.id, i.ml) !== k);
  saveCart();
  updateCartCount();
  renderCartUI();
}

function setQty(id, ml, newQty){
  const idx = cart.findIndex(i => i.id===id && String(i.ml)===String(ml));
  if(idx < 0) return;

  if(newQty <= 0){
    const ok = confirm("¿Eliminar este producto del carrito?");
    if(ok) removeItem(id, ml);
    return;
  }

  cart[idx].qty = newQty;
  saveCart();
  updateCartCount();
  renderCartUI();
}

function unitPrice(ml){
  return PRICE_BY_ML[ml] ?? 0;
}

function calcTotals(){
  let total = 0;
  const rows = cart.map(item=>{
    const p = PERFUMES.find(x=>x.id === item.id);
    const price = unitPrice(item.ml);
    const sub = price * item.qty;
    total += sub;
    return { ...item, name: p?.name || item.id, price, sub };
  });
  return { rows, total };
}

function updateCartCount(){
  const units = cart.reduce((acc,i)=> acc + (i.qty || 0), 0);
  $("#cartCount").textContent = units;
}

// UI carrito
const cartList  = $("#cartList");
const cartTotal = $("#cartTotal");
const checkoutBtn = $("#checkoutBtn");

function renderCartUI(){
  const { rows, total } = calcTotals();
  cartList.innerHTML = "";

  if(rows.length === 0){
    cartList.innerHTML = `<div style="opacity:.85;">Tu carrito está vacío.</div>`;
    cartTotal.textContent = money(0);
    checkoutBtn.disabled = true;
    return;
  }

  rows.forEach(r=>{
    const el = document.createElement("div");
    el.className = "cartItem";
    el.innerHTML = `
      <div>
        <p class="cartItem__title">${r.name}</p>
        <p class="cartItem__meta">${(r.category || "").toUpperCase()} • ${r.ml} ml • Unit: ${money(r.price)}</p>
        <div class="qtyRow">
          <button class="qtyBtn" data-minus="${r.id}__${r.ml}">-</button>
          <div class="qtyVal">${r.qty}</div>
          <button class="qtyBtn" data-plus="${r.id}__${r.ml}">+</button>
        </div>
      </div>
      <div class="cartItem__right">
        <button class="trashBtn" data-del="${r.id}__${r.ml}">🗑️ Eliminar</button>
        <div class="subTotal">${money(r.sub)}</div>
      </div>
    `;
    cartList.appendChild(el);
  });

  cartTotal.textContent = money(total);
  checkoutBtn.disabled = false;

  $$("[data-plus]").forEach(b=>{
    b.addEventListener("click", ()=>{
      const [id, ml] = b.dataset.plus.split("__");
      const item = cart.find(i=> i.id===id && String(i.ml)===String(ml));
      setQty(id, parseInt(ml,10), (item?.qty || 0) + 1);
    });
  });

  $$("[data-minus]").forEach(b=>{
    b.addEventListener("click", ()=>{
      const [id, ml] = b.dataset.minus.split("__");
      const item = cart.find(i=> i.id===id && String(i.ml)===String(ml));
      setQty(id, parseInt(ml,10), (item?.qty || 0) - 1);
    });
  });

  $$("[data-del]").forEach(b=>{
    b.addEventListener("click", ()=>{
      const [id, ml] = b.dataset.del.split("__");
      removeItem(id, parseInt(ml,10));
    });
  });
}

// abrir carrito
$("#openCartBtn").addEventListener("click", ()=>{
  renderCartUI();
  openModal(cartModal);
});

// checkout WhatsApp
checkoutBtn.addEventListener("click", ()=>{
  const { rows, total } = calcTotals();
  if(rows.length === 0) return;

  let msg = "Hola, deseo realizar la compra de:\n\n";
  rows.forEach(r=>{
    msg += `${r.name} – ${r.ml} ml (x${r.qty}) → ${money(r.sub)}\n`;
  });
  msg += `\nTotal: ${money(total)}\n`;

  window.location.href = waLink(msg);
});

// =============================
// BUSCADOR GLOBAL
// =============================
const globalSearch = $("#globalSearch");
const globalClear  = $("#globalClear");

const globalResults = $("#globalResults");
const globalResultGrid = $("#globalResultGrid");
const globalNoResults = $("#globalNoResults");
const globalResultCount = $("#globalResultCount");

function searchPerfumes(query){
  const q = (query || "").trim().toLowerCase();
  if(!q) return [];
  return SEARCH_INDEX
    .filter(x => x.text.includes(q))
    .map(x => x.p);
}

function renderGlobalResults(list){
  globalResultGrid.innerHTML = "";
  globalNoResults.hidden = list.length !== 0;
  globalResultCount.textContent = `Mostrando ${list.length} resultados`;

  if(list.length === 0) return;

  list.forEach(p=>{
    const card = document.createElement("div");
    card.className = "perfCard";
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <div class="perfCard__body">
        <span class="perfBadge">${p.category.toUpperCase()}</span>
        <h3 class="perfCard__name">${p.name}</h3>
        <p class="perfCard__desc">${p.shortDesc}</p>
        <button class="btn" data-open-perf="${p.id}">Ver más</button>
      </div>
    `;
    globalResultGrid.appendChild(card);
  });

  $$("[data-open-perf]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-open-perf");
      openPerfume(id);
    });
  });
}

function showGlobalResults(){ globalResults.hidden = false; }
function hideGlobalResults(){
  globalResults.hidden = true;
  globalResultGrid.innerHTML = "";
  globalNoResults.hidden = true;
  globalResultCount.textContent = "Mostrando 0 resultados";
}

globalSearch.addEventListener("input", ()=>{
  const q = globalSearch.value;
  if(!q.trim()){
    hideGlobalResults();
    return;
  }
  const found = searchPerfumes(q);
  showGlobalResults();
  renderGlobalResults(found);
});

globalSearch.addEventListener("keydown", (e)=>{
  if(e.key === "Enter"){
    const found = searchPerfumes(globalSearch.value);
    if(found.length === 1){
      openPerfume(found[0].id);
    }else{
      showGlobalResults();
      renderGlobalResults(found);
    }
  }
});

globalClear.addEventListener("click", ()=>{
  globalSearch.value = "";
  hideGlobalResults();
  globalSearch.focus();
});

// =============================
// UX PREMIUM: ESC
// =============================
document.addEventListener("keydown", (e)=>{
  if(e.key !== "Escape") return;

  if(isOpen(perfumeModal)) return closeModal(perfumeModal);
  if(isOpen(cartModal)) return closeModal(cartModal);

  if(isOpen(categoryModal)){
    if((catSearch.value || "").trim()){
      catSearch.value = "";
      applyCategorySearch();
      return;
    }
    return closeModal(categoryModal);
  }

  if((globalSearch.value || "").trim()){
    globalSearch.value = "";
    hideGlobalResults();
  }
});

// =============================
// INICIALIZACIÓN
// =============================
(async function init(){
  await loadPerfumes();
  if(!PERFUMES.length){
    hideGlobalResults();
    return;
  }
  updateCartCount();
  renderCartUI();
})();
