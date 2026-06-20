let isCurrentlyDragging = false;

const friction = -0.5;
const ball = document.querySelector(".ball");
const ballProps = gsap.getProperty(ball);
const radius = ball.getBoundingClientRect().width / 2;
const tracker = InertiaPlugin.track(ball, "x,y")[0];

let vw = window.innerWidth;
let vh = window.innerHeight;

let lastHitEdge = null;

gsap.defaults({
  overwrite: true
});

gsap.set(ball, {
  xPercent: -50,
  yPercent: -50,
  x: vw / 2,
  y: vh / 2,
  rotation: 0
});

const draggable = new Draggable(ball, {
  bounds: window,
  onPress() {
    gsap.killTweensOf(ball);
    this.update();
    isCurrentlyDragging = true;
  },
  onRelease() {
    isCurrentlyDragging = false;
  },
  onDragEnd: animateBounce,
  onDragEndParams: []
});

window.addEventListener("resize", () => {
  vw = window.innerWidth;
  vh = window.innerHeight;
});

function animateBounce(x = "+=0", y = "+=0", vx = "auto", vy = "auto") {
  const velocityX = tracker.get("x");
  const velocityY = tracker.get("y");

  const velocityMagnitude = Math.sqrt(velocityX ** 2 + velocityY ** 2);
  const direction = velocityX >= 0 ? 1 : -1;
  const angularVelocity = direction * velocityMagnitude * 0.25;

  const currentRotation = ballProps("rotation");

  gsap.to(ball, {
    rotation: currentRotation + angularVelocity,
    duration: 2,
    ease: "power2.out",
    overwrite: false
  });

  gsap.fromTo(
    ball,
    { x, y },
    {
      inertia: {
        x: vx,
        y: vy
      },
      onUpdate: checkBounds,
      overwrite: false
    }
  );
}

function checkBounds() {
  const r = radius;
  let x = ballProps("x");
  let y = ballProps("y");
  let vx = tracker.get("x");
  let vy = tracker.get("y");
  let xPos = x;
  let yPos = y;
  let hitEdge = false;
  let originalVx, originalVy; // To capture velocity before friction

  function squash(axis, velocity) {
    gsap.killTweensOf(ball, "scaleX,scaleY");

    const velocityDivisor = 200;
    const minImpact = 0.01;
    const maxImpact = 0.1;

    const absVelocity = Math.abs(velocity);
    const impact = gsap.utils.clamp(
      minImpact,
      maxImpact,
      absVelocity / velocityDivisor
    );

    const squashScale = 1 - impact * 0.9;
    const stretchScale = 1 + impact * 0.6;

    // Correct axis scaling
    const squashProps =
      axis === "x"
        ? { scaleX: squashScale, scaleY: stretchScale }
        : { scaleX: stretchScale, scaleY: squashScale };

    gsap
      .timeline()
      .to(ball, {
        ...squashProps,
        duration: 0.1,
        ease: "power2.out",
        transformOrigin: "center center",
        overwrite: true
      })
      .to(ball, {
        scaleX: 1,
        scaleY: 1,
        duration: 0.25,
        ease: "power2.out",
        overwrite: false
      });
  }

  if (x + r > vw) {
    originalVx = vx; // Capture before applying friction
    xPos = vw - r;
    vx *= friction;
    hitEdge = true;
    squash("x", originalVx); // Pass original velocity
  } else if (x - r < 0) {
    originalVx = vx;
    xPos = r;
    vx *= friction;
    hitEdge = true;
    squash("x", originalVx);
  }

  if (y + r > vh) {
    originalVy = vy;
    yPos = vh - r;
    vy *= friction;
    hitEdge = true;
    squash("y", originalVy);
  } else if (y - r < 0) {
    originalVy = vy;
    yPos = r;
    vy *= friction;
    hitEdge = true;
    squash("y", originalVy);
  }

  if (hitEdge) {
    animateBounce(xPos, yPos, vx, vy);
  }
}

document.addEventListener("mouseout", (e) => {
  // Check if mouse left the document to the outside window
  if (e.relatedTarget === null && isCurrentlyDragging && draggable.isDragging) {
    // Get current position and velocity before ending drag
    const x = ballProps("x");
    const y = ballProps("y");
    const vx = tracker.get("x");
    const vy = tracker.get("y");
    
    // Apply a velocity boost in the direction the mouse was moving
    const boostFactor = 2.0; // Increase boost for more dramatic effect
    
    // Force end the drag operation
    draggable.endDrag(e);
    isCurrentlyDragging = false;
    
    // Animate the bounce with boosted velocity
    animateBounce(x, y, vx * boostFactor, vy * boostFactor);
  }
}
);

// --- Simple health-records viewer & comparator (uses data.js -> window.healthRecords)
(function () {
  if (typeof window === 'undefined' || !Array.isArray(window.healthRecords)) return;
  const records = window.healthRecords.slice().sort((a, b) => new Date(b.date) - new Date(a.date));

  const panel = document.createElement('div');
  panel.style.position = 'fixed';
  panel.style.top = '80px';
  panel.style.right = '16px';
  panel.style.background = 'white';
  panel.style.padding = '10px';
  panel.style.borderRadius = '8px';
  panel.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
  panel.style.zIndex = 1200;
  panel.style.fontFamily = 'Arial, sans-serif';
  panel.style.fontSize = '13px';
  panel.innerHTML = `
    <div style="font-weight:700; margin-bottom:6px">Health Records</div>
    <div id="cmp-latest" style="margin-bottom:8px"></div>
    <div style="display:flex; gap:6px; align-items:center">
      <select id="cmp-a"></select>
      <select id="cmp-b"></select>
    </div>
    <div id="cmp-result" style="margin-top:8px"></div>
  `;
  document.body.appendChild(panel);

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
      <div><strong>${new Date(r.date).toLocaleString()}</strong></div>
      <div>Temp: ${r.temperature} °C</div>
      <div>HR: ${r.heartRate} bpm</div>
      <div>SpO₂: ${r.spo2}%</div>
      <div>BMI: ${r.bmi}</div>
    `;
  }

  function compare() {
    const a = records[selA.value];
    const b = records[selB.value];
    if (!a || !b) return (resultBox.textContent = 'Select two records');
    const diff = {
      temperature: (a.temperature - b.temperature).toFixed(1),
      heartRate: a.heartRate - b.heartRate,
      spo2: a.spo2 - b.spo2,
      bmi: (a.bmi - b.bmi).toFixed(1)
    };
    resultBox.innerHTML = `
      <div style="font-weight:600">${new Date(a.date).toLocaleDateString()} vs ${new Date(b.date).toLocaleDateString()}</div>
      <div>Temp Δ: ${diff.temperature} °C</div>
      <div>HR Δ: ${diff.heartRate} bpm</div>
      <div>SpO₂ Δ: ${diff.spo2}%</div>
      <div>BMI Δ: ${diff.bmi}</div>
    `;
  }

  selA.addEventListener('change', compare);
  selB.addEventListener('change', compare);
  renderLatest();
  compare();

})();

// Main compare area: latest vs previous
(function renderMainComparison() {
  const target = document.getElementById('compare-area');
  if (!target) return;
  if (typeof window === 'undefined' || !Array.isArray(window.healthRecords) || window.healthRecords.length < 2) {
    target.innerHTML = '<p style="color:#666">Not enough records to compare.</p>';
    return;
  }

  const records = window.healthRecords.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  const current = records[0];
  const previous = records[1];

  const metrics = [
    { key: 'temperature', label: 'Temperature', unit: '°C', decimals: 1, higherBetter: false },
    { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', decimals: 0, higherBetter: false },
    { key: 'spo2', label: 'SpO₂', unit: '%', decimals: 0, higherBetter: true },
    { key: 'bmi', label: 'BMI', unit: '', decimals: 1, higherBetter: false }
  ];

  const grid = document.createElement('div');
  grid.className = 'compare-grid';

  metrics.forEach(m => {
    const a = Number(previous[m.key]);
    const b = Number(current[m.key]);
    const diff = (b - a);
    const diffDisplay = m.decimals >= 1 ? diff.toFixed(m.decimals) : Math.round(diff);
    const improved = m.higherBetter ? b > a : b < a;

    const card = document.createElement('div');
    card.className = 'metric-card';
    card.innerHTML = `
      <h3>${m.label}</h3>
      <div class="metric-values">
        <div>
          <div style="font-size:12px;color:#666">Previous</div>
          <div class="metric-value">${a}${m.unit}</div>
        </div>
        <div>
          <div style="font-size:12px;color:#666;text-align:right">Current</div>
          <div class="metric-value" style="text-align:right">${b}${m.unit}</div>
        </div>
      </div>
      <div class="metric-diff ${improved ? 'improved' : 'declined'}">
        Difference: ${diff >= 0 ? '+' : ''}${diffDisplay} ${m.unit}
      </div>
    `;

    grid.appendChild(card);
  });

  // header summary
  const header = document.createElement('div');
  header.style.marginBottom = '12px';
  header.innerHTML = `<div style="font-weight:700">Comparing: ${new Date(previous.date).toLocaleDateString()} → ${new Date(current.date).toLocaleDateString()}</div>`;

  target.innerHTML = '';
  target.appendChild(header);
  target.appendChild(grid);
})();