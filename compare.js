let isCurrentlyDragging = false;

// Only initialize ball/animation code if a .ball element and GSAP/Draggable are available.
const ball = document.querySelector(".ball");
if (ball && typeof gsap !== 'undefined' && typeof Draggable !== 'undefined' && typeof InertiaPlugin !== 'undefined') {
  const friction = -0.5;
  const ballProps = gsap.getProperty(ball);
  const radius = ball.getBoundingClientRect().width / 2;
  const tracker = InertiaPlugin.track(ball, "x,y")[0];

  let vw = window.innerWidth;
  let vh = window.innerHeight;

  let lastHitEdge = null;

  gsap.defaults({ overwrite: true });

  gsap.set(ball, { xPercent: -50, yPercent: -50, x: vw / 2, y: vh / 2, rotation: 0 });

  const draggable = new Draggable(ball, {
    bounds: window,
    onPress() { gsap.killTweensOf(ball); this.update(); isCurrentlyDragging = true; },
    onRelease() { isCurrentlyDragging = false; },
    onDragEnd: animateBounce,
    onDragEndParams: []
  });

  window.addEventListener("resize", () => { vw = window.innerWidth; vh = window.innerHeight; });

  function animateBounce(x = "+=0", y = "+=0", vx = "auto", vy = "auto") {
    const velocityX = tracker.get("x");
    const velocityY = tracker.get("y");
    const velocityMagnitude = Math.sqrt(velocityX ** 2 + velocityY ** 2);
    const direction = velocityX >= 0 ? 1 : -1;
    const angularVelocity = direction * velocityMagnitude * 0.25;
    const currentRotation = ballProps("rotation");

    gsap.to(ball, { rotation: currentRotation + angularVelocity, duration: 2, ease: "power2.out", overwrite: false });

    gsap.fromTo(ball, { x, y }, { inertia: { x: vx, y: vy }, onUpdate: checkBounds, overwrite: false });
  }

  function checkBounds() {
    const r = radius;
    let x = ballProps("x");
    let y = ballProps("y");
    let vx = tracker.get("x");
    let vy = tracker.get("y");
    let xPos = x; let yPos = y; let hitEdge = false; let originalVx, originalVy;

    function squash(axis, velocity) {
      gsap.killTweensOf(ball, "scaleX,scaleY");
      const velocityDivisor = 200; const minImpact = 0.01; const maxImpact = 0.1;
      const absVelocity = Math.abs(velocity);
      const impact = gsap.utils.clamp(minImpact, maxImpact, absVelocity / velocityDivisor);
      const squashScale = 1 - impact * 0.9; const stretchScale = 1 + impact * 0.6;
      const squashProps = axis === "x" ? { scaleX: squashScale, scaleY: stretchScale } : { scaleX: stretchScale, scaleY: squashScale };
      gsap.timeline().to(ball, { ...squashProps, duration: 0.1, ease: "power2.out", transformOrigin: "center center", overwrite: true }).to(ball, { scaleX: 1, scaleY: 1, duration: 0.25, ease: "power2.out", overwrite: false });
    }

    if (x + r > vw) { originalVx = vx; xPos = vw - r; vx *= friction; hitEdge = true; squash("x", originalVx); }
    else if (x - r < 0) { originalVx = vx; xPos = r; vx *= friction; hitEdge = true; squash("x", originalVx); }
    if (y + r > vh) { originalVy = vy; yPos = vh - r; vy *= friction; hitEdge = true; squash("y", originalVy); }
    else if (y - r < 0) { originalVy = vy; yPos = r; vy *= friction; hitEdge = true; squash("y", originalVy); }
    if (hitEdge) animateBounce(xPos, yPos, vx, vy);
  }

  document.addEventListener("mouseout", (e) => {
    if (e.relatedTarget === null && isCurrentlyDragging && draggable.isDragging) {
      const x = ballProps("x"); const y = ballProps("y"); const vx = tracker.get("x"); const vy = tracker.get("y");
      const boostFactor = 2.0;
      draggable.endDrag(e); isCurrentlyDragging = false;
      animateBounce(x, y, vx * boostFactor, vy * boostFactor);
    }
  });
}

// --- Simple health-records viewer & comparator (uses data.js -> window.healthRecords)
(function () {
  if (typeof window === 'undefined') return;

  function updateBadge(usePersonal) {
    const el = document.getElementById('dataSourceBadge');
    if (!el) return;
    el.className = usePersonal ? 'data-badge personal' : 'data-badge mock';
    el.textContent = usePersonal ? 'Using personal data' : 'Using mock data';
  }

  function getSourceRecords() {
    // Prefer current user's personal records when available
    try {
      if (typeof getPersonalRecords === 'function') {
        const personal = getPersonalRecords();
        if (Array.isArray(personal) && personal.length) return { records: personal.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)), isPersonal: true };
      }
    } catch (e) { /* ignore */ }

    // Fallback to global mock records
    if (Array.isArray(window.healthRecords) && window.healthRecords.length) {
      return { records: window.healthRecords.slice().sort((a, b) => new Date(b.date) - new Date(a.date)), isPersonal: false };
    }

    return { records: [], isPersonal: false };
  }

  function initPanel() {
    const src = getSourceRecords();
    const records = src.records;
    updateBadge(src.isPersonal);


    const panel = document.createElement('div');
    panel.style.position = 'fixed';
    panel.style.top = '80px';
    panel.style.right = '16px';
    panel.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)';
    panel.style.padding = '18px';
    panel.style.borderRadius = '14px';
    panel.style.boxShadow = '0 12px 32px rgba(132, 78, 222, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08)';
    panel.style.border = '1px solid rgba(132, 78, 222, 0.1)';
    panel.style.zIndex = 1200;
    panel.style.fontFamily = '"Montserrat", "Inter", sans-serif';
    panel.style.fontSize = '13px';
    panel.style.maxWidth = '320px';
    panel.style.maxHeight = '70vh';
    panel.style.overflowY = 'auto';
    panel.innerHTML = `
      <div style="font-weight:700; margin-bottom:12px; color:#2d3436; font-size:14px; letter-spacing:0.3px;">📋 Health Records</div>
      <div id="cmp-latest" style="margin-bottom:12px; padding:10px; background:rgba(132,78,222,0.05); border-radius:10px; border-left:3px solid #854ade;"></div>
      <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:12px;">
        <label style="font-size:12px; font-weight:600; color:#555; text-transform:uppercase; letter-spacing:0.3px;">Compare:</label>
        <select id="cmp-a" style="padding:8px; border:1px solid rgba(132,78,222,0.2); border-radius:8px; font-family:inherit; cursor:pointer; background:white;"></select>
        <span style="text-align:center; color:#999; font-size:11px; font-weight:600;">vs</span>
        <select id="cmp-b" style="padding:8px; border:1px solid rgba(132,78,222,0.2); border-radius:8px; font-family:inherit; cursor:pointer; background:white;"></select>
      </div>
      <div id="cmp-result" style="margin-top:12px; padding:10px; background:rgba(132,78,222,0.05); border-radius:10px; border-left:3px solid #854ade; font-size:12px; line-height:1.6;"></div>
    `;
    
    if (document.body) {
      document.body.appendChild(panel);
    } else {
      return;
    }

    const selA = panel.querySelector('#cmp-a');
    const selB = panel.querySelector('#cmp-b');
    const latestBox = panel.querySelector('#cmp-latest');
    const resultBox = panel.querySelector('#cmp-result');

    records.forEach((r, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = new Date(r.date).toLocaleDateString();
      selA.appendChild(opt);
      selB.appendChild(opt.cloneNode(true));
    });

    selA.selectedIndex = 0;
    selB.selectedIndex = records.length > 1 ? 1 : 0;

    function renderLatest() {
      const r = records[0];
      latestBox.innerHTML = `
        <div style="font-weight:700; margin-bottom:6px; color:#2d3436;">Latest Record</div>
        <div style="font-size:11px; color:#666; margin-bottom:8px;">${new Date(r.date).toLocaleString()}</div>
        <div style="display:grid; gap:6px; color:#555; font-size:12px;">
          <div>🌡️ Temp: <strong>${r.temperature}°C</strong></div>
          <div>❤️ HR: <strong>${r.heartRate} bpm</strong></div>
          <div>💨 SpO₂: <strong>${r.spo2}%</strong></div>
          <div>⚖️ BMI: <strong>${r.bmi}</strong></div>
        </div>
      `;
    }

    function compare() {
      const a = records[selA.value];
      const b = records[selB.value];
      if (!a || !b) return (resultBox.textContent = 'Select two records');
      const selectedMetrics = Array.from(document.querySelectorAll('#metricSelectors input[type=checkbox]:checked')).map((el) => el.value);
      if (!selectedMetrics.length) {
        resultBox.innerHTML = '<div style="color:#dc2626;font-weight:700;">Please select one or more metrics to compare.</div>';
        return;
      }

      const diff = {
        temperature: (b.temperature - a.temperature).toFixed(1),
        heartRate: b.heartRate - a.heartRate,
        spo2: b.spo2 - a.spo2,
        bmi: (b.bmi - a.bmi).toFixed(1)
      };

      resultBox.innerHTML = `
        <div style="font-weight:700; margin-bottom:8px; color:#2d3436; font-size:12px;">Comparison</div>
        <div style="font-size:11px; color:#666; margin-bottom:8px;">${new Date(a.date).toLocaleDateString()} → ${new Date(b.date).toLocaleDateString()}</div>
        <div style="display:grid; gap:6px; color:#555; font-size:12px;">
          ${selectedMetrics.includes('temperature') ? `<div>🌡️ Temp Δ: <strong style="color:${diff.temperature > 0 ? '#dc2626' : '#16a34a'}">${diff.temperature > 0 ? '+' : ''}${diff.temperature}°C</strong></div>` : ''}
          ${selectedMetrics.includes('heartRate') ? `<div>❤️ HR Δ: <strong style="color:${diff.heartRate > 0 ? '#dc2626' : '#16a34a'}">${diff.heartRate > 0 ? '+' : ''}${diff.heartRate} bpm</strong></div>` : ''}
          ${selectedMetrics.includes('spo2') ? `<div>💨 SpO₂ Δ: <strong style="color:${diff.spo2 < 0 ? '#dc2626' : '#16a34a'}">${diff.spo2 > 0 ? '+' : ''}${diff.spo2}%</strong></div>` : ''}
          ${selectedMetrics.includes('bmi') ? `<div>⚖️ BMI Δ: <strong style="color:${diff.bmi > 0 ? '#dc2626' : '#16a34a'}">${diff.bmi > 0 ? '+' : ''}${diff.bmi}</strong></div>` : ''}
        </div>
      `;
    }

    selA.addEventListener('change', compare);
    selB.addEventListener('change', compare);
    renderLatest();
    compare();
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPanel);
  } else {
    initPanel();
  }
})();

// Main compare area: latest vs previous
(function renderMainComparison() {
  const metrics = [
    { key: 'temperature', label: 'Temperature', unit: '°C', decimals: 1, higherBetter: false },
    { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', decimals: 0, higherBetter: false },
    { key: 'spo2', label: 'SpO₂', unit: '%', decimals: 0, higherBetter: true },
    { key: 'bmi', label: 'BMI', unit: '', decimals: 1, higherBetter: false }
  ];

  function buildMetricSelectors() {
    const container = document.getElementById('metricSelectors');
    if (!container) return;
    container.innerHTML = '';
    metrics.forEach((metric) => {
      const label = document.createElement('label');
      label.style.display = 'inline-flex';
      label.style.alignItems = 'center';
      label.style.gap = '6px';
      label.style.fontSize = '0.95rem';
      label.style.color = '#334155';
      label.style.fontWeight = '600';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = metric.key;
      checkbox.checked = true;
      checkbox.addEventListener('change', renderComparison);

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(metric.label));
      container.appendChild(label);
    });
  }

  function buildRecordSelectors(records) {
    const a = document.getElementById('recordA');
    const b = document.getElementById('recordB');
    if (!a || !b) return;
    a.innerHTML = '';
    b.innerHTML = '';
    records.forEach((r, index) => {
      const text = new Date(r.date).toLocaleDateString();
      const optA = document.createElement('option');
      optA.value = index;
      optA.textContent = `${text} — ${r.temperature}°C, ${r.heartRate} bpm`;
      a.appendChild(optA);
      const optB = optA.cloneNode(true);
      b.appendChild(optB);
    });
    if (records.length > 1) {
      b.selectedIndex = 1;
    }
    a.addEventListener('change', renderComparison);
    b.addEventListener('change', renderComparison);
  }

  function getSelectedMetrics() {
    return Array.from(document.querySelectorAll('#metricSelectors input[type="checkbox"]:checked')).map((el) => el.value);
  }

  function renderComparison() {
    const target = document.getElementById('compare-area');
    if (!target) return;
    const records = (function(){
      try { if (typeof getPersonalRecords === 'function') { const p = getPersonalRecords(); if (Array.isArray(p) && p.length) return p.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)); } } catch(e){}
      return Array.isArray(window.healthRecords) ? window.healthRecords.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)) : [];
    })();
    // update badge (if present)
    try { const el = document.getElementById('dataSourceBadge'); if (el) { const isPersonal = (typeof getPersonalRecords === 'function' && Array.isArray(getPersonalRecords()) && getPersonalRecords().length); el.className = isPersonal ? 'data-badge personal' : 'data-badge mock'; el.textContent = isPersonal ? 'Using personal data' : 'Using mock data'; } } catch(e){}
    if (records.length < 2) {
      target.innerHTML = '<p style="color:#666">Not enough records to compare.</p>';
      return;
    }

    const selA = document.getElementById('recordA');
    const selB = document.getElementById('recordB');
    const idxA = selA ? Number(selA.value) : 0;
    const idxB = selB ? Number(selB.value) : 1;
    const a = records[idxA] || records[0];
    const b = records[idxB] || records[1];
    const selectedMetrics = getSelectedMetrics();

    const diff = {
      temperature: (b.temperature - a.temperature).toFixed(1),
      heartRate: b.heartRate - a.heartRate,
      spo2: b.spo2 - a.spo2,
      bmi: (b.bmi - a.bmi).toFixed(1)
    };

    const metricCards = document.createElement('div');
    metricCards.className = 'compare-grid';

    selectedMetrics.forEach((key) => {
      const metric = metrics.find((m) => m.key === key);
      if (!metric) return;
      const x = Number(a[key]);
      const y = Number(b[key]);
      const delta = Number(diff[key]);
      const diffDisplay = metric.decimals >= 1 ? delta.toFixed(metric.decimals) : Math.round(delta);
      const improved = metric.higherBetter ? y > x : y < x;

      const card = document.createElement('div');
      card.className = 'metric-card';
      card.innerHTML = `
        <h3>${metric.label}</h3>
        <div class="metric-values">
          <div>
            <div style="font-size:12px;color:#666">Record A</div>
            <div class="metric-value">${x}${metric.unit}</div>
          </div>
          <div>
            <div style="font-size:12px;color:#666;text-align:right">Record B</div>
            <div class="metric-value" style="text-align:right">${y}${metric.unit}</div>
          </div>
        </div>
        <div class="metric-diff ${improved ? 'improved' : 'declined'}">
          Difference: ${delta >= 0 ? '+' : ''}${diffDisplay} ${metric.unit}
        </div>
      `;
      metricCards.appendChild(card);
    });

    const header = document.createElement('div');
    header.style.marginBottom = '12px';
    header.innerHTML = `<div style="font-weight:700">Comparing: ${new Date(a.date).toLocaleDateString()} → ${new Date(b.date).toLocaleDateString()}</div>`;

    if (!selectedMetrics.length) {
      target.innerHTML = '<p style="color:#dc2626; font-weight:700;">Please select at least one metric to compare.</p>';
      return;
    }

    target.innerHTML = '';
    target.appendChild(header);
    target.appendChild(metricCards);
  }

  function doRender() {
    const target = document.getElementById('compare-area');
    if (!target) return;
    const records = (function(){
      // Use personal records first, then fall back to global mock data
      try { if (typeof getPersonalRecords === 'function') { const p = getPersonalRecords(); if (Array.isArray(p) && p.length) return p.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)); } } catch(e){}
      if (Array.isArray(window.healthRecords)) return window.healthRecords.slice().sort((a,b)=>new Date(b.date)-new Date(a.date));
      return [];
    })();
    if (records.length < 2) {
      target.innerHTML = '<p style="color:#666">Not enough records to compare.</p>';
      return;
    }
    buildRecordSelectors(records);
    buildMetricSelectors();
    renderComparison();
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', doRender);
  } else {
    doRender();
  }
})();
