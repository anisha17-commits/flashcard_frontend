// frontend/js/quiz.js
// Simple MCQ quiz using user's flashcards or latest generated set
const API = "https://flashcard-backend-cllv.onrender.com//api/flashcards";
const QUIZ_API = "http://localhost:5000/api/quiz";
const token = localStorage.getItem("token") || "";

// UI elements
const startBtn = document.getElementById("startQuizBtn");
const numSelect = document.getElementById("numQuestions");
const sourceSelect = document.getElementById("sourceSelect");

const quizArea = document.getElementById("quizArea");
const progressEl = document.getElementById("progress");
const questionText = document.getElementById("questionText");
const optionsBox = document.getElementById("options");

const prevBtn = document.getElementById("prevQ");
const nextBtn = document.getElementById("nextQ");
const submitBtn = document.getElementById("submitQuiz");

const resultArea = document.getElementById("resultArea");
const scoreHeading = document.getElementById("scoreHeading");
const resultDetails = document.getElementById("resultDetails");
const retryBtn = document.getElementById("retryBtn");
const backBtn = document.getElementById("backBtn");

const progressPopup = document.getElementById("progressPopup");

let quiz = [];           // array of {id, question, options:[...], answerIndex}
let answers = {};        // user answer index by question index
let current = 0;

startBtn.addEventListener("click", startQuiz);
prevBtn.addEventListener("click", showPrev);
nextBtn.addEventListener("click", showNext);
submitBtn.addEventListener("click", submitQuiz);
retryBtn.addEventListener("click", retryQuiz);
backBtn.addEventListener("click", ()=> window.location.href = "cards.html");

// fetch and build quiz
async function startQuiz(){
  // number and source
  const n = Number(numSelect.value) || 5;
  const source = sourceSelect.value;

  startBtn.disabled = true;
  startBtn.textContent = "Preparing…";

  try {
    let cardSet = [];

    if (source === "generated") {
      // try localStorage first
      const gen = JSON.parse(localStorage.getItem("generated_cards") || "[]");
      if (gen && gen.length) cardSet = gen;
    }
    if (source === "saved" || !cardSet.length) {
      // fetch saved cards from backend
      const res = await fetch(API, { headers: { Authorization: "Bearer " + token }});
      if (!res.ok) throw new Error("Failed to load saved cards (401?)");
      cardSet = await res.json();
    }

    if (!cardSet || !cardSet.length) {
      alert("No cards found. Generate or save some cards first.");
      return;
    }

    // request generated quiz from backend (it will create good MCQs)
    const res = await fetch(`${QUIZ_API}/generate`, {
      method: "POST",
      headers: { "Content-Type":"application/json", "Authorization": "Bearer " + token },
      body: JSON.stringify({ cards: cardSet, numQuestions: n })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || "Quiz generation failed");
    }
    const data = await res.json(); // { quiz: [...] }
    quiz = data.quiz;
    answers = {};
    current = 0;

    // show quiz area
    quizArea.classList.remove("hidden");
    resultArea.classList.add("hidden");
    renderQuestion(current);
  } catch (err) {
    console.error(err);
    alert("Could not start quiz: " + (err.message || err));
  } finally {
    startBtn.disabled = false;
    startBtn.textContent = "Start Quiz";
  }
}

function renderQuestion(i){
  const q = quiz[i];
  if (!q) return;
  progressEl.textContent = `Question ${i+1} / ${quiz.length}`;
  questionText.textContent = q.question;
  optionsBox.innerHTML = "";

  q.options.forEach((opt, idx) => {
    const b = document.createElement("button");
    b.className = "option-btn";
    b.textContent = opt;
    if (answers[i] === idx) b.classList.add("selected");
    b.addEventListener("click", ()=> {
      answers[i] = idx;
      // mark selection visually
      Array.from(optionsBox.children).forEach((ch, cidx) => ch.classList.toggle("selected", cidx === idx));
    });
    optionsBox.appendChild(b);
  });

  showProgressPopup(i+1, quiz.length);
}

function showPrev(){ if (current>0) { current--; renderQuestion(current); } }
function showNext(){ if (current < quiz.length-1) { current++; renderQuestion(current); } }

async function submitQuiz(){
  // evaluate locally then show details, optionally post to backend for saving progress
  const total = quiz.length;
  let correct = 0;
  const details = [];

  for (let i=0;i<quiz.length;i++){
    const q = quiz[i];
    const selected = answers[i];
    const isCorrect = (selected === q.answerIndex);
    if (isCorrect) correct++;
    details.push({ question: q.question, selected: selected!=null ? q.options[selected] : null, correct: q.options[q.answerIndex], isCorrect });
  }

  // Show results area
  scoreHeading.textContent = `Your score: ${correct} / ${total}`;
  resultDetails.innerHTML = details.map(d=>`
    <div style="margin-bottom:8px;padding:8px;border-radius:8px;background:rgba(255,255,255,0.02)">
      <strong>${escapeHtml(d.question)}</strong>
      <div>Selected: ${escapeHtml(d.selected||"—")}</div>
      <div>Answer: ${escapeHtml(d.correct)}</div>
      <div style="color:${d.isCorrect?'#7cfc9a':'#ff9a9a'}">${d.isCorrect ? 'Correct' : 'Wrong'}</div>
    </div>
  `).join("");

  resultArea.classList.remove("hidden");
  // Optionally: send progress to server (skip for now)
  quizArea.classList.add("hidden");
}

function retryQuiz(){
  answers = {};
  current = 0;
  resultArea.classList.add("hidden");
  quizArea.classList.remove("hidden");
  renderQuestion(0);
}

function showProgressPopup(current, total){
  if (!progressPopup) return;
  progressPopup.textContent = `Question ${current} of ${total}`;
  progressPopup.classList.add("show");
  clearTimeout(window.quizProgressTimeout);
  window.quizProgressTimeout = setTimeout(()=> progressPopup.classList.remove("show"), 900);
}

function escapeHtml(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// keyboard navigation
document.addEventListener("keydown", (e)=> {
  if (quiz.length && !resultArea.classList.contains("hidden")) return;
  if (e.key === "ArrowRight") showNext();
  if (e.key === "ArrowLeft") showPrev();
  if (e.key === "Enter") submitQuiz();
});

