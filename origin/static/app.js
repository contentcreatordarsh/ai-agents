const state = {
  map: null,
  selectedId: null,
  votes: {},
};

const el = {
  mapCanvas: document.getElementById("map-canvas"),
  mapTitle: document.getElementById("map-title"),
  mapDesc: document.getElementById("map-desc"),
  selectedName: document.getElementById("selected-name"),
  voteBtn: document.getElementById("vote-btn"),
  voteStats: document.getElementById("vote-stats"),
  geo: document.getElementById("geo-hint"),
  toast: document.getElementById("toast"),
};

function showToast(message, isError = false) {
  el.toast.textContent = message;
  el.toast.classList.toggle("error", isError);
  el.toast.classList.add("show");
  setTimeout(() => el.toast.classList.remove("show"), 3200);
}

function renderCallouts(callouts) {
  el.mapCanvas.querySelectorAll(".callout").forEach((n) => n.remove());
  for (const c of callouts) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "callout";
    btn.style.left = `${c.x}%`;
    btn.style.top = `${c.y}%`;
    btn.dataset.id = c.id;
    btn.innerHTML = `<span class="dot"></span><span class="tip">${c.label}</span>`;
    btn.addEventListener("click", () => selectCallout(c.id));
    el.mapCanvas.appendChild(btn);
  }
}

function selectCallout(id) {
  state.selectedId = id;
  const callout = state.map.callouts.find((c) => c.id === id);
  el.selectedName.textContent = callout ? callout.label : "—";
  el.voteBtn.disabled = !callout;
  el.mapCanvas.querySelectorAll(".callout").forEach((node) => {
    node.classList.toggle("selected", node.dataset.id === id);
  });
}

function renderStats(votes) {
  state.votes = votes;
  const entries = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  if (!entries.length) {
    el.voteStats.innerHTML = "<li class='muted'>No votes yet — pick a callout.</li>";
    return;
  }
  el.voteStats.innerHTML = entries
    .map(([id, count]) => {
      const label = state.map.callouts.find((c) => c.id === id)?.label || id;
      return `<li><span>${label}</span><strong>${count}</strong></li>`;
    })
    .join("");
}

async function loadGeo() {
  try {
    const res = await fetch("/api/geo");
    if (!res.ok) return;
    const data = await res.json();
    if (data.country) {
      el.geo.textContent = `Edge sees you from ${data.country}${data.colo ? ` (${data.colo})` : ""}`;
    }
  } catch {
    el.geo.textContent = "Geo hint unavailable (load via Cloudflare for Cf-Country).";
  }
}

async function loadMap() {
  const res = await fetch("/api/maps");
  const data = await res.json();
  state.map = data.maps[0];
  el.mapTitle.textContent = state.map.name;
  el.mapDesc.textContent = state.map.description;
  renderCallouts(state.map.callouts);
  selectCallout(state.map.callouts[0]?.id);
}

async function loadVotes() {
  const res = await fetch("/api/votes");
  const data = await res.json();
  renderStats(data.votes || {});
}

async function vote() {
  if (!state.selectedId) return;
  el.voteBtn.disabled = true;
  try {
    const res = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calloutId: state.selectedId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.error || `Vote failed (${res.status})`, true);
      return;
    }
    showToast(`Vote counted for ${data.calloutId}`);
    renderStats(data.votes || {});
  } catch {
    showToast("Network error while voting", true);
  } finally {
    el.voteBtn.disabled = false;
  }
}

el.voteBtn.addEventListener("click", vote);
loadMap().then(loadVotes);
loadGeo();
