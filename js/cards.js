// frontend/js/cards.js
const API = "https://flashcard-backend-cllv.onrender.com//api/flashcards";
const token = localStorage.getItem("token");

const carousel = document.getElementById("carousel");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const themeToggle = document.getElementById("themeToggle");

let cards = JSON.parse(localStorage.getItem("generated_cards")) || [];
let centerIndex = 0;

async function init(){
  if (!cards.length){
    try {
      const res = await fetch(API, { headers: { Authorization: "Bearer " + token }});
      if (res.ok) cards = await res.json();
      else cards = [];
    } catch(e){ console.error(e); cards = []; }
  }
  renderCarousel();
}
init();

function renderCarousel(){
  carousel.innerHTML = "";
  if (!cards.length) { carousel.innerHTML = "<div style='color:#fff;padding:20px'>No cards</div>"; return; }
  cards.forEach((c,i)=>{
    const div = document.createElement("div");
    div.className = "card";
    const offset = i - centerIndex;
    div.style.transform = `translateX(${offset * 380}px)`;
    if (i === centerIndex) div.classList.add("center");
    div.innerHTML = `<div class="inner"><div class="front">${escapeHtml(c.question || c.frontText)}</div><div class="back">${escapeHtml(c.answer || c.backText)}</div></div>`;
    div.addEventListener("click", ()=> openModal(i));
    carousel.appendChild(div);
  });
}

function slide(direction){
  if (!cards.length) return;
  centerIndex = (centerIndex + direction + cards.length) % cards.length;
  renderCarousel();
  showProgress();
}
prevBtn.onclick = ()=> slide(-1);
nextBtn.onclick = ()=> slide(1);

themeToggle?.addEventListener("click", ()=>{
  document.body.classList.toggle("light");
  themeToggle.textContent = document.body.classList.contains("light") ? "🌤️" : "Theme";
});

function escapeHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// modal
const modal = document.getElementById("cardModal");
const modalCard = document.getElementById("modalCard");
const modalFront = document.getElementById("modalFront");
const modalBack = document.getElementById("modalBack");
const closeModalBtn = document.getElementById("closeModal");
const ttsBtn = document.getElementById("ttsBtn");
const favBtn = document.getElementById("favBtn");
const saveBtn = document.getElementById("saveBtn");
const progress = document.getElementById("progressPopup");

let currentIndex = 0;
function openModal(idx){
  currentIndex = idx;
  updateModal();
  modal.hidden = false;
}
function closeModal(){ modal.hidden = true; }
closeModalBtn.addEventListener("click", closeModal);

function updateModal(){
  const c = cards[currentIndex];
  modalFront.innerHTML = escapeHtml(c.question || c.frontText);
  modalBack.innerHTML = escapeHtml(c.answer || c.backText);
  modalCard.classList.remove("flipped");
  favBtn.textContent = (c.favorited ? "♥ Favorited" : "♡ Favorite");
  showProgress();
}
modalCard.addEventListener("click", ()=> modalCard.classList.toggle("flipped"));

document.addEventListener("keydown",(e)=>{
  if (modal.hidden) return;
  if (e.key === "ArrowRight"){ currentIndex = (currentIndex+1)%cards.length; updateModal();}
  if (e.key === "ArrowLeft"){ currentIndex = (currentIndex-1+cards.length)%cards.length; updateModal();}
  if (e.key === " "){ modalCard.classList.toggle("flipped"); e.preventDefault(); }
});

// TTS
ttsBtn?.addEventListener("click", ()=>{
  const c = cards[currentIndex];
  const text = `${c.question || c.frontText}. ${c.answer || c.backText}`;
  if (!('speechSynthesis' in window)) return alert("TTS not supported");
  const u = new SpeechSynthesisUtterance(text);
  speechSynthesis.cancel(); speechSynthesis.speak(u);
});

// favorite
favBtn?.addEventListener("click", async ()=>{
  const c = cards[currentIndex];
  try{
    const res = await fetch(`${API}/${c._id}/favorite`, { method: "PATCH", headers: { Authorization: "Bearer "+token }});
    const data = await res.json();
    c.favorited = data.favorited;
    favBtn.textContent = c.favorited ? "♥ Favorited" : "♡ Favorite";
    favBtn.classList.add("fav-pulse");
    setTimeout(()=>favBtn.classList.remove("fav-pulse"),500);
    renderCarousel();
  }catch(e){ console.error(e); alert("Favorite failed"); }
});

// save single
saveBtn?.addEventListener("click", async ()=>{
  const c = cards[currentIndex];
  try {
    if (c._id) return alert("Already saved");
    const res = await fetch(`${API}/saveMany`, {
      method: "POST", headers: { "Content-Type":"application/json", Authorization: "Bearer "+token },
      body: JSON.stringify({ cards: [{ frontText: c.question, backText: c.answer, tags: c.tags||[] }] })
    });
    const data = await res.json();
    if (data.created && data.created.length) {
      cards[currentIndex] = data.created[0];
      localStorage.setItem("generated_cards", JSON.stringify(cards));
      renderCarousel(); updateModal();
      alert("Saved");
    } else alert("Saved");
  } catch(e){ console.error(e); alert("Save failed"); }
});

function showProgress(){
  progress.textContent = `Card ${currentIndex + 1} of ${cards.length}`;
  progress.classList.add("show");
  clearTimeout(window.progressTimeout);
  window.progressTimeout = setTimeout(()=>progress.classList.remove("show"),1200);
}

// mobile swipe
let startX = null;
document.getElementById("carousel").addEventListener("touchstart", e=> startX = e.touches[0].clientX);
document.getElementById("carousel").addEventListener("touchend", e=>{
  if (startX === null) return;
  const dx = e.changedTouches[0].clientX - startX;
  startX = null;
  if (dx < -60) slide(1);
  else if (dx > 60) slide(-1);
});

