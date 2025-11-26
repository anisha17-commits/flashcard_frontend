// frontend/js/login.js
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const res = await fetch('https://flashcard-backend-cllv.onrender.com//api/auth/login', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok && data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user || {}));
      window.location.href = 'dashboard.html';
    } else {
      alert(data.msg || 'Login failed');
    }
  } catch (err) {
    console.error(err);
    alert('Cannot reach server');
  }
});

