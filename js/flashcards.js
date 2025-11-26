// frontend/js/flashcards.js

// Use relative paths so frontend + backend work on Render
const API = "https://flashcard-backend-cllv.onrender.com/api/flashcards";
const UPLOAD_API = "https://flashcard-backend-cllv.onrender.com/api/upload/extract";

// Retrieve token from localStorage
const token = localStorage.getItem("token") || "";

const genBtn = document.getElementById("genBtn");
const saveAllBtn = document.getElementById("saveAll");
const previewBox = document.getElementById("flashcardsPreview");
const langSelect = document.getElementById("targetLang");
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");

// Defensive: remove duplicate listeners
if (genBtn) genBtn.replaceWith(genBtn.cloneNode(true));
const gen = document.getElementById("genBtn");
gen.addEventListener("click", generateAndPreview);
uploadBtn.addEventListener("click", handleUpload);

let lastGenerated = [];

// Check if user is logged in
if (!token) {
    alert("You must be logged in to generate flashcards.");
    window.location.href = "login.html"; // adjust if login page is elsewhere
}

// --------------------
// Upload PDF/TXT and extract text
// --------------------
async function handleUpload() {
    const f = fileInput.files[0];
    if (!f) return alert("Choose a file first");

    uploadBtn.disabled = true;
    uploadBtn.textContent = "Uploading...";

    try {
        const fd = new FormData();
        fd.append("file", f);

        // Fetch using relative path
        const res = await fetch(UPLOAD_API, { method: "POST", body: fd });
        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();
        document.getElementById("content").value = data.text || "";
        alert("Text extracted. You can now generate flashcards.");
    } catch (err) {
        console.error(err);
        alert("Upload failed: " + (err.message || err));
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = "Upload & Extract";
    }
}

// --------------------
// Generate flashcards
// --------------------
async function generateAndPreview() {
    const text = document.getElementById("content").value.trim();
    if (!text) return alert("Enter text first.");

    if (!token) {
        alert("You must be logged in to generate flashcards.");
        window.location.href = "login.html";
        return;
    }

    gen.disabled = true;
    gen.textContent = "Generating…";

    try {
        const res = await fetch(`${API}/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ text, language: langSelect.value })
        });

        if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt || "Failed to generate flashcards.");
        }

        const data = await res.json();
        lastGenerated = data.map(d => ({
            _id: d._id,
            question: d.question,
            answer: d.answer,
            favorited: d.favorited || false
        }));

        renderPreview(lastGenerated);
        saveAllBtn.disabled = false;
        localStorage.setItem("generated_cards", JSON.stringify(lastGenerated));

        // Auto-redirect to viewer
        window.location.href = "view.html";
    } catch (err) {
        console.error(err);
        alert("Generate failed: " + (err.message || err));
    } finally {
        gen.disabled = false;
        gen.textContent = "Generate";
    }
}

// --------------------
// Preview generated cards
// --------------------
function renderPreview(cards) {
    previewBox.innerHTML = "";
    cards.forEach(c => {
        const el = document.createElement("div");
        el.className = "preview-card";
        el.style.width = "220px";
        el.style.padding = "12px";
        el.style.borderRadius = "12px";
        el.style.background = "rgba(255,255,255,0.03)";
        el.style.color = "white";
        el.innerHTML = `<strong>${escapeHtml(c.question)}</strong>
                        <p style="margin-top:8px">${escapeHtml(c.answer).slice(0,120)}...</p>`;
        previewBox.appendChild(el);
    });
}

// --------------------
// Save all generated cards
// --------------------
saveAllBtn.addEventListener("click", async () => {
    if (!lastGenerated.length) return alert("No generated cards to save.");

    if (!token) {
        alert("You must be logged in to save cards.");
        return;
    }

    saveAllBtn.disabled = true;

    try {
        const res = await fetch(`${API}/saveMany`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                cards: lastGenerated.map(c => ({
                    frontText: c.question,
                    backText: c.answer
                }))
            })
        });

        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        alert(`Saved ${data.createdCount || lastGenerated.length} cards to your library.`);
    } catch (err) {
        console.error(err);
        alert("Save failed: " + (err.message || err));
    } finally {
        saveAllBtn.disabled = false;
    }
});

// --------------------
// Utility
// --------------------
function escapeHtml(s){
    return (s||'').replace(/&/g,'&amp;')
                   .replace(/</g,'&lt;')
                   .replace(/>/g,'&gt;');
}



