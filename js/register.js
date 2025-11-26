document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        const response = await fetch("http://localhost:5000/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.status === 201) {
            alert("Registration successful! Redirecting to login page...");
            window.location.href = "login.html";
        } else {
            alert(data.msg || "Registration failed");
        }

    } catch (err) {
        console.error("Error:", err);
        alert("Something went wrong while connecting to the server.");
    }
});

