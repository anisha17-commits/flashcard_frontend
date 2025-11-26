// frontend/js/dashboard.js
// Modern Dashboard Modal Controller (AI Gradient Glass)

// Basic auth check - optional
const token = localStorage.getItem("token") || "";

// Elements
const recentBox = document.getElementById("recentCards");
const userNameEl = document.getElementById("userName");
const logoutBtn = document.getElementById("logoutBtn");
const themeToggle = document.getElementById("themeToggle");

// Modal elements
const modal = document.getElementById("flashcardModal");
const closeModalBtn = document.getElementById("closeModal");
const ffFront = document.getElementById("ffFront");
const ffBack = document.getElementById("ffBack");
const ffPrev = document.getElementById("ffPrev");
const ffNext = document.getElementById("ffNext");
const ffFlip = document.getElementById("ffFlip");
const ffSpeak = document.getElementById("ffSpeak");
const ffCardCounter = document.getElementById("ffCardCounter");
const progressPopup = document.getElementById("ffProgressPopup");

let cards = []; // will hold { question / answer / _id / favorited }
let currentIndex = 0;

// FETCH user's recent flashcards and render preview tiles
async function loadRecentCards() {
  try {
    const res = await fetch("/api/flashcards", {
      headers: { Authorization: token ? "Bearer " + token : "" }
    });
    if (!res.ok) {
      // if unauthorized, still show nothing (or prompt login)
      console.warn("Could not load cards:", res.status);
      return;
    }
    const data = await res.json();
    cards = Array.isArray(data) ? data : [];
    renderRecentPreview(cards.slice(0, 8)); // show up to 8
    // set username if available
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        userNameEl.textContent = u.name || "";
      } catch {}
    }
  } catch (err) {
    console.error("Load recent cards failed:", err);
  }
}

function renderRecentPreview(list) {
  recentBox.innerHTML = "";
  list.forEach((c, i) => {
    const el = document.createElement("div");
    el.className = "preview-card";
    el.style.width = "220px";
    el.style.padding = "12px";
    el.style.borderRadius = "12px";
    el.style.background = "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))";
    el.style.border = "1px solid rgba(255,255,255,0.04)";
    el.style.cursor = "pointer";
    el.style.minHeight = "120px";
    el.innerHTML = `<strong style="display:block">${escapeHtml(c.question).slice(0,60)}</strong>
                    <p style="margin-top:8px;color:rgba(255,255,255,0.7)">${escapeHtml(c.answer).slice(0,100)}</p>`;
    el.addEventListener("click", () => openFlashcardModal(list, i));
    recentBox.appendChild(el);
  });
}

// OPEN modal and load array + start index
function openFlashcardModal(list, startIndex = 0) {
  if (!Array.isArray(list) || list.length === 0) return;
  cards = list;
  currentIndex = startIndex;
  updateModalCard();
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  showProgress();
}

// CLOSE modal
closeModalBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
});

// UPDATE the modal card content
function updateModalCard() {
  const c = cards[currentIndex];
  // accept both question/answer and frontText/backText fields
  const q = c.question || c.frontText || c._id || "No question";
  const a = c.answer || c.backText || "";
  ffFront.textContent = q;
  ffBack.textContent = a;
  ffFront.classList.remove("hidden");
  ffBack.classList.add("hidden");
  ffCardCounter.textContent = `${currentIndex + 1} / ${cards.length}`;
  showProgress();
}

// Flip button
ffFlip.addEventListener("click", () => {
  ffFront.classList.toggle("hidden");
  ffBack.classList.toggle("hidden");
});

// Prev / Next controls
ffPrev.addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + cards.length) % cards.length;
  updateModalCard();
});
ffNext.addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % cards.length;
  updateModalCard();
});

// TTS (speak current card)
ffSpeak.addEventListener("click", () => {
  const text = `${ffFront.textContent}. ${ffBack.textContent}`;
  if (!("speechSynthesis" in window)) return alert("Text-to-Speech not supported in this browser.");
  const u = new SpeechSynthesisUtterance(text);
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
});

// keyboard: Esc to close, left/right arrows to navigate, space to flip
document.addEventListener("keydown", (e) => {
  if (modal.classList.contains("hidden")) return;
  if (e.key === "Escape") {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  } else if (e.key === "ArrowRight") {
    currentIndex = (currentIndex + 1) % cards.length; updateModalCard();
  } else if (e.key === "ArrowLeft") {
    currentIndex = (currentIndex - 1 + cards.length) % cards.length; updateModalCard();
  } else if (e.key === " ") {
    e.preventDefault(); ffFront.classList.toggle("hidden"); ffBack.classList.toggle("hidden");
  }
});

// small progress popup
function showProgress() {
  if (!progressPopup) return;
  progressPopup.textContent = `Card ${currentIndex + 1} of ${cards.length}`;
  progressPopup.classList.add("show");
  clearTimeout(window.ffProgressTimeout);
  window.ffProgressTimeout = setTimeout(() => progressPopup.classList.remove("show"), 1200);
}

// simple login/logout flows (optional)
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
});

// theme toggle
themeToggle.addEventListener("click", () => document.body.classList.toggle("light"));

// util
function escapeHtml(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// initial load
loadRecentCards();
