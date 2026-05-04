async function signup() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const msg = document.getElementById('msg');

  msg.textContent = 'Processing...';
  msg.style.color = 'gray';
  msg.style.visibility = 'visible';
  // add an AbortController so we don't remain stuck on 'Processing...'
  const controller = new AbortController();
  const timeoutMs = 12000; // 12s
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  console.log('signup: sending request', { email });

  try {
    const res = await fetch('https://iot-project-25ym.onrender.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('signup: response status', res.status);

    // Try to parse JSON safely, fall back to text
    let data = null;
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('application/json')) {
      try { data = await res.json(); } catch (e) { data = null; }
    } else {
      try { data = await res.text(); } catch (e) { data = null; }
    }

    console.log('signup: parsed response', data);

    if (res.ok) {
      msg.textContent = 'Registered successfully.';
      msg.style.color = 'green';
      console.log('signup: success, redirecting');
      setTimeout(() => { window.location.href = '/login2.html'; }, 1500);
    } else {
      const serverMsg = (data && data.message) ? data.message : (typeof data === 'string' ? data : null);
      msg.textContent = serverMsg || `Signup failed (status ${res.status}).`;
      msg.style.color = 'red';
      console.warn('signup: server error', res.status, serverMsg);
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      msg.textContent = 'Request timed out. Please try again.';
      msg.style.color = 'red';
      console.error('signup: request aborted (timeout)');
    } else {
      msg.textContent = 'Network or server error. Check console.';
      msg.style.color = 'red';
      console.error('Signup error:', err);
    }
  }
}






