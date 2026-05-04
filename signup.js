async function signup() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const msg = document.getElementById('msg');

  msg.textContent = 'Processing...';
  msg.style.color = 'gray';
  msg.style.visibility = 'visible';

  try {
    const res = await fetch('https://iot-project-25ym.onrender.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    // Try to parse JSON safely, fall back to text
    let data = null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      try { data = await res.json(); } catch (e) { data = null; }
    } else {
      try { data = await res.text(); } catch (e) { data = null; }
    }

    if (res.ok) {
      msg.textContent = 'Registered successfully.';
      msg.style.color = 'green';

      // keep message visible briefly, then redirect to signin
      setTimeout(() => { window.location.href = '/login2.html'; }, 1500);
    } else {
      // Prefer server-provided message when available
      const serverMsg = (data && data.message) ? data.message : (typeof data === 'string' ? data : null);
      msg.textContent = serverMsg || `Signup failed (status ${res.status}).`;
      msg.style.color = 'red';
    }
  } catch (err) {
    msg.textContent = 'Network or server error. Check console.';
    msg.style.color = 'red';
    console.error('Signup error:', err);
  }
}






