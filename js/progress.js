// frontend/js/progress.js
const token = localStorage.getItem('token');
if (!token) { window.location.href='login.html'; }

async function loadProgress(){
  try {
    const res = await fetch('http://localhost:5000/api/progress', { headers:{ 'Authorization': token } });
    if (!res.ok) { document.getElementById('progressList').innerText = 'No progress yet'; return; }
    const data = await res.json();
    const el = document.getElementById('progressList'); el.innerHTML = '';
    // Example format: { totalReviewed, correctAnswers, byDate: [...] }
    const card = document.createElement('div'); card.className = 'progress-card';
    card.innerHTML = `<strong>Total reviewed:</strong> ${data.totalReviewed || 0}<br><strong>Correct answers:</strong> ${data.correctAnswers || 0}`;
    el.appendChild(card);
    if (data.byDate && data.byDate.length) {
      data.byDate.slice().reverse().forEach(d => {
        const row = document.createElement('div'); row.className='progress-card';
        const date = new Date(d.date).toLocaleString();
        row.innerHTML = `<strong>${date}</strong><div>Correct: ${d.correct}, Total: ${d.total}</div>`;
        el.appendChild(row);
      });
    }
  } catch (e) { console.error(e); document.getElementById('progressList').innerText = 'Could not load progress'; }
}
loadProgress();
