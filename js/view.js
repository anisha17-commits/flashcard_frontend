let cards = [];
let currentIndex = 0;
let showingFront = true;

const modal = document.getElementById("cardModal");
const cardText = document.getElementById("cardText");
const flashcardModal = document.getElementById("flashcardModal"); // Optional container
const closeModal = document.getElementById("closeModal");
const flipBtn = document.getElementById("flipBtn");

// Load generated cards from localStorage
window.onload = () => {
    let stored = localStorage.getItem("generated_cards");
    if (!stored) {
        alert("No cards found. Generate flashcards first.");
        window.location.href = "flashcards.html";
        return;
    }
    cards = JSON.parse(stored);
    displayCardList();
};

// Display list of flashcards
function displayCardList() {
    const container = document.getElementById("cardContainer");
    container.innerHTML = "";

    cards.forEach((c, i) => {
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `<strong>${c.question}</strong>`;
        div.onclick = () => openModal(i);
        container.appendChild(div);
    });
}

// Open modal
function openModal(i) {
    currentIndex = i;
    showingFront = true;
    showCard(cards[i]);
    modal.classList.add("show");
}

// Close modal
function closeModalFn() {
    modal.classList.remove("show");
}
closeModal.onclick = closeModalFn;

// Show front/back of card
function showCard(card) {
    cardText.textContent = showingFront ? card.question : card.answer;
    flipBtn.textContent = showingFront ? "Show Answer" : "Show Question";
}

// Flip button
flipBtn.onclick = () => {
    showingFront = !showingFront;
    showCard(cards[currentIndex]);
};

// Optional: flip card by clicking card content
if (flashcardModal) {
    flashcardModal.onclick = (e) => {
        // Prevent closing modal when clicking buttons
        if (!["flipBtn", "speakBtn", "favBtn", "saveBtn"].includes(e.target.id)) {
            showingFront = !showingFront;
            showCard(cards[currentIndex]);
        }
    };
}

// Speak text
document.getElementById("speakBtn").onclick = () => {
    const msg = new SpeechSynthesisUtterance(cardText.textContent);
    speechSynthesis.speak(msg);
};

// Favorite placeholder
document.getElementById("favBtn").onclick = () => {
    alert("Favorite saved locally (backend optional)");
};

// Save placeholder
document.getElementById("saveBtn").onclick = () => {
    alert("Card saved.");
};

// Close modal when clicking outside modal-content
modal.onclick = (e) => {
    if (e.target === modal) closeModalFn();
};
