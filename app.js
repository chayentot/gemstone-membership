const PLANS = [
  { id: "quartz", name: "Quartz", fee: 500, points: 30, maxClaims: 30, icon: "💎" },
  { id: "amethyst", name: "Amethyst", fee: 1000, points: 40, maxClaims: 50, icon: "🔮" },
  { id: "garnet", name: "Garnet", fee: 3000, points: 110, maxClaims: 50, icon: "♦️" },
  { id: "aquamarine", name: "Aquamarine", fee: 7000, points: 240, maxClaims: 50, icon: "🧊" },
  { id: "sapphire", name: "Sapphire", fee: 15000, points: 500, maxClaims: 50, icon: "🔷" },
  { id: "emerald", name: "Emerald", fee: 25000, points: 858, maxClaims: 50, icon: "🟢" },
  { id: "ruby", name: "Ruby", fee: null, points: null, maxClaims: null, icon: "🔴", comingSoon: true },
  { id: "opal", name: "Opal", fee: null, points: null, maxClaims: null, icon: "🌈", comingSoon: true },
  { id: "diamond", name: "Diamond", fee: null, points: null, maxClaims: null, icon: "💠", comingSoon: true },
  { id: "alexandrite", name: "Alexandrite", fee: null, points: null, maxClaims: null, icon: "🟣", comingSoon: true }
];

const state = {
  memberToken: localStorage.getItem("memberToken") || "",
  adminToken: sessionStorage.getItem("adminToken") || "",
  member: null,
  timer: null
};

const $ = (id) => document.getElementById(id);

function apiUrl() {
  const url = window.APP_CONFIG?.API_URL || "";
  if (!url || url.includes("PASTE_YOUR")) throw new Error("Set your Google Apps Script URL in config.js.");
  return url;
}

async function api(action, payload = {}, token = "") {
  const response = await fetch(apiUrl(), {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, payload, token })
  });
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || "Request failed.");
  return data.data;
}

function showNotice(message, isError = false) {
  const el = $("notice");
  el.textContent = message;
  el.className = `notice${isError ? " error" : ""}`;
  setTimeout(() => el.classList.add("hidden"), 5000);
}

function showView(viewId) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  $(viewId).classList.add("active");
  if (viewId === "dashboard" && state.memberToken) loadMember();
}

function renderPlans() {
  $("membershipGrid").innerHTML = PLANS.map(plan => `
    <article class="membership-card">
      <div class="gem-visual">${plan.icon}</div>
      <div class="membership-content">
        <h3>${plan.name}</h3>
        <div class="price">${plan.comingSoon ? "Coming soon" : `₱${plan.fee.toLocaleString()}`}</div>
        <div class="plan-meta">
          <div><small>Daily points</small><strong>${plan.points ?? "—"}</strong></div>
          <div><small>Maximum claims</small><strong>${plan.maxClaims ?? "—"}</strong></div>
        </div>
        <button class="primary full avail-btn" data-plan="${plan.id}" ${plan.comingSoon ? "disabled" : ""}>
          ${plan.comingSoon ? "Not available" : "Avail Membership"}
        </button>
      </div>
    </article>
  `).join("");

  document.querySelectorAll(".avail-btn").forEach(btn => btn.addEventListener("click", () => {
    const plan = PLANS.find(p => p.id === btn.dataset.plan);
    $("selectedPlanId").value = plan.id;
    $("selectedPlanSummary").innerHTML = `<strong>${plan.name}</strong><br>₱${plan.fee.toLocaleString()} · ${plan.points} points per claim · ${plan.maxClaims} claims`;
    showView("register");
  }));
}

document.querySelectorAll("[data-view]").forEach(btn => btn.addEventListener("click", () => showView(btn.dataset.view)));

$("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const data = await api("register", {
      fullName: $("fullName").value.trim(),
      email: $("email").value.trim().toLowerCase(),
      mobile: $("mobile").value.trim(),
      pin: $("pin").value,
      planId: $("selectedPlanId").value
    });
    state.memberToken = data.token;
    localStorage.setItem("memberToken", data.token);
    showNotice("Membership registered and activated. Your first 24-hour timer has started.");
    e.target.reset();
    showView("dashboard");
  } catch (err) { showNotice(err.message, true); }
});

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const data = await api("login", {
      email: $("loginEmail").value.trim().toLowerCase(),
      pin: $("loginPin").value
    });
    state.memberToken = data.token;
    localStorage.setItem("memberToken", data.token);
    await loadMember();
  } catch (err) { showNotice(err.message, true); }
});

$("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("memberToken");
  state.memberToken = "";
  state.member = null;
  clearInterval(state.timer);
  $("memberPanel").classList.add("hidden");
  $("loginPanel").classList.remove("hidden");
});

async function loadMember() {
  try {
    const data = await api("memberDashboard", {}, state.memberToken);
    state.member = data;
    $("loginPanel").classList.add("hidden");
    $("memberPanel").classList.remove("hidden");
    renderMember();
  } catch (err) {
    localStorage.removeItem("memberToken");
    state.memberToken = "";
    $("loginPanel").classList.remove("hidden");
    $("memberPanel").classList.add("hidden");
    showNotice(err.message, true);
  }
}

function renderMember() {
  const m = state.member;
  $("memberName").textContent = m.fullName;
  $("activeStone").textContent = m.planName;
  $("pointBalance").textContent = Number(m.pointsBalance).toLocaleString();
  $("claimProgress").textContent = `${m.claimCount} / ${m.maxClaims}`;
  $("dailyReward").textContent = Number(m.dailyPoints).toLocaleString();
  $("membershipStatus").textContent = m.status;
  $("claimHistory").innerHTML = m.history.length
    ? m.history.map(h => `<div class="history-item"><span>${new Date(h.claimedAt).toLocaleString()}</span><strong>+${h.points}</strong></div>`).join("")
    : `<p class="muted">No claims yet.</p>`;
  startCountdown();
}

function startCountdown() {
  clearInterval(state.timer);
  const update = () => {
    const m = state.member;
    const remaining = Math.max(0, new Date(m.nextClaimAt).getTime() - Date.now());
    const finished = remaining <= 0;
    const completed = Number(m.claimCount) >= Number(m.maxClaims);
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    $("countdown").textContent = completed ? "COMPLETED" : `${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
    $("claimBtn").disabled = !finished || completed;
    $("claimMessage").textContent = completed
      ? "All membership claims have been completed."
      : finished ? "Your points are ready. The timer will stay here until you claim."
      : "Your timer is running.";
  };
  update();
  state.timer = setInterval(update, 1000);
}

$("claimBtn").addEventListener("click", async () => {
  try {
    const data = await api("claimPoints", {}, state.memberToken);
    state.member = data;
    renderMember();
    showNotice(`You claimed ${data.dailyPoints} points. A new 24-hour timer has started.`);
  } catch (err) { showNotice(err.message, true); }
});

$("adminLoginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  state.adminToken = $("adminToken").value;
  try {
    await loadAdmin();
    sessionStorage.setItem("adminToken", state.adminToken);
  } catch (err) { state.adminToken = ""; showNotice(err.message, true); }
});

$("adminLogoutBtn").addEventListener("click", () => {
  state.adminToken = "";
  sessionStorage.removeItem("adminToken");
  $("adminPanel").classList.add("hidden");
  $("adminLoginPanel").classList.remove("hidden");
});

$("refreshAdminBtn").addEventListener("click", loadAdmin);

async function loadAdmin() {
  const members = await api("adminMembers", {}, state.adminToken);
  $("adminLoginPanel").classList.add("hidden");
  $("adminPanel").classList.remove("hidden");
  $("adminMembersBody").innerHTML = members.map(m => `
    <tr>
      <td><strong>${escapeHtml(m.fullName)}</strong><br><span class="muted">${escapeHtml(m.email)}</span></td>
      <td>${escapeHtml(m.planName)}</td>
      <td>${Number(m.pointsBalance).toLocaleString()}</td>
      <td>${m.claimCount}/${m.maxClaims}</td>
      <td>${new Date(m.nextClaimAt).toLocaleString()}</td>
      <td>
        <input id="perk-${m.id}" value="${escapeHtml(m.perkNote || "")}" placeholder="Example: Gift delivered" />
        <button class="secondary small-btn" onclick="savePerk('${m.id}')">Save</button>
      </td>
    </tr>
  `).join("");
}

window.savePerk = async function(memberId) {
  try {
    const perkNote = $(`perk-${memberId}`).value.trim();
    await api("adminSavePerk", { memberId, perkNote }, state.adminToken);
    showNotice("Perk note saved.");
  } catch (err) { showNotice(err.message, true); }
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

renderPlans();
if (state.adminToken) loadAdmin().catch(() => {});
