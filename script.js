const API_BASE = "https://iot-project-25ym.onrender.com"; // e.g. https://iot-health.onrender.com

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
  window.location.href = "login2.html";
}