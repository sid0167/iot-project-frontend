async function register() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const msg = document.getElementById("msg");
  
    try {
      const res = await fetch('https://iot-project-25ym.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
  
      const data = await res.json();
  
      if (res.ok) {
        msg.innerText = "✅ User registered successfully!";
        msg.style.color = "green";
      } else {
        msg.innerText = `❌ ${data.message || 'Error registering'}`;
        msg.style.color = "red";
      }
    } catch (err) {
      msg.innerText = "❌ Server error. Try again.";
      msg.style.color = "red";
    }
  }
  