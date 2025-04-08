async function signup() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const msg = document.getElementById('msg');

  msg.textContent = 'Processing...';
  msg.style.color = 'gray';

  try {
    const res = await fetch('https://iot-project-25ym.onrender.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      msg.textContent = 'Signup successful! Redirecting to login...';
      msg.style.color = 'green';

      setTimeout(() => {
        window.location.href = '/iot-project-frontend/login2.html'; // Redirect to signin page
      }, 1500);
    } else {
      msg.textContent = data.message || 'Signup failed.';
      msg.style.color = 'red';
    }
  } catch (err) {
    msg.textContent = 'Server error. Please try again later.';
    msg.style.color = 'red';
    console.error('Signup error:', err);
  }
}
