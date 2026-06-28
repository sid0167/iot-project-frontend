const API_BASE = "https://iot-project-25ym.onrender.com";

function readStoredArray(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
}

function getCurrentUserId() {
  const user = (localStorage.getItem("currentUser") || "guest").toString().trim();
  return user.toLowerCase().replace(/[^a-z0-9]+/g, "_") || "guest";
}

function getCurrentUserName() {
  return localStorage.getItem("currentUser") || "Guest";
}

function getUserRecordsKey() {
  return `user_health_records_${getCurrentUserId()}`;
}

function getGeneralRecords() {
  const fallback = (typeof window !== "undefined" && Array.isArray(window.healthRecords)) ? window.healthRecords : [];
  const stored = readStoredArray("general_health_records", fallback);
  const source = stored.length ? stored : fallback;

  if (!stored.length && fallback.length) {
    localStorage.setItem("general_health_records", JSON.stringify(fallback));
  }

  return source
    .map((record) => ({
      date: record.date || record.timestamp || new Date().toISOString(),
      temperature: Number(record.temperature) || 0,
      heartRate: Number(record.heartRate) || 0,
      spo2: Number(record.spo2) || 0,
      bmi: record.bmi != null ? Number(record.bmi) : null,
      source: "general"
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function getPersonalRecords() {
  return readStoredArray(getUserRecordsKey(), [])
    .map((record) => ({
      id: record.id || Date.now(),
      date: record.date || record.timestamp || new Date().toISOString(),
      temperature: Number(record.temperature) || 0,
      heartRate: Number(record.heartRate) || 0,
      spo2: Number(record.spo2) || 0,
      bmi: record.bmi != null ? Number(record.bmi) : null,
      note: record.note || "",
      source: "personal"
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function savePersonalRecord(record) {
  const entry = {
    id: Date.now(),
    date: record.date || new Date().toISOString(),
    temperature: Number(record.temperature) || 0,
    heartRate: Number(record.heartRate) || 0,
    spo2: Number(record.spo2) || 0,
    bmi: record.bmi != null ? Number(record.bmi) : null,
    note: record.note || "",
    source: "personal"
  };

  const existing = readStoredArray(getUserRecordsKey(), []);
  const updated = [...existing, entry].sort((a, b) => new Date(a.date) - new Date(b.date));
  localStorage.setItem(getUserRecordsKey(), JSON.stringify(updated));
  return entry;
}

function clearPersonalRecords() {
  localStorage.removeItem(getUserRecordsKey());
}

function getDeviceConnectedKey() {
  return `user_device_connected_${getCurrentUserId()}`;
}

function setDeviceConnected(connected) {
  localStorage.setItem(getDeviceConnectedKey(), JSON.stringify(Boolean(connected)));
}

function isDeviceConnected() {
  return JSON.parse(localStorage.getItem(getDeviceConnectedKey()) || 'false');
}

function updateManualFormState() {
  const connected = isDeviceConnected();
  const form = document.querySelector('.form-grid');
  const inputs = form ? [...form.querySelectorAll('input, textarea, button[type="submit"]')] : [];
  inputs.forEach((el) => {
    if (el.tagName.toLowerCase() === 'button') {
      el.disabled = !connected;
      el.style.opacity = connected ? '1' : '0.55';
      el.style.cursor = connected ? 'pointer' : 'not-allowed';
    } else {
      el.readOnly = !connected;
      el.style.background = connected ? '' : '#f3f4f6';
    }
  });
  const hint = document.getElementById('manualHint');
  if (hint) {
    hint.innerText = connected
      ? 'Device is connected. You may add a manual reading if needed.'
      : 'Manual entry is disabled until the device is connected and data is available.';
  }
}

async function recordDeviceReading() {
  const statusEl = document.getElementById('deviceStatus');
  const token = localStorage.getItem('token');
  if (!token) {
    if (statusEl) statusEl.innerText = 'No device token available. Please login again.';
    return;
  }

  if (statusEl) {
    statusEl.innerText = 'Connecting to device...';
    statusEl.className = 'muted';
  }

  try {
    const res = await fetch(`${API_BASE}/api/health/latest`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.temperature == null || data.heartRate == null || data.spo2 == null) {
      throw new Error(data.message || 'Device data unavailable');
    }

    savePersonalRecord({
      temperature: data.temperature,
      heartRate: data.heartRate,
      spo2: data.spo2,
      note: 'Automatic device sync',
      date: new Date().toISOString()
    });

    setDeviceConnected(true);
    updateManualFormState();

    if (statusEl) {
      statusEl.innerText = 'Device data recorded successfully. Manual entry is now enabled.';
      statusEl.className = 'success-status';
    }
  } catch (error) {
    setDeviceConnected(false);
    updateManualFormState();
    if (statusEl) {
      statusEl.innerText = 'Device sync failed. Please check your connection.';
      statusEl.className = 'error-status';
    }
    console.warn('Device sync failed', error);
  }
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (data.token) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("currentUser", email);
    window.location.href = "dashboard.html";
  } else {
    document.getElementById("msg").textContent = "Login failed";
  }
}

async function fetchHealthData() {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/api/health/latest`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  document.getElementById("temperature").textContent = data.temperature ?? "--";
  document.getElementById("spo2").textContent = data.spo2 ?? "--";
  document.getElementById("heartRate").textContent = data.heartRate ?? "--";
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("currentUser");
  window.location.href = "login2.html";
}