import { Hono } from "hono"
import { db } from "../db/index.js"
import { accounts } from "../db/schema.js"
import { createApiKeyForAccount } from "../services/auth.js"
import { z } from "zod"
import { eq } from "drizzle-orm"

const dashboard = new Hono()

function layout(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Unwrap</title>
<script>
var _key = localStorage.getItem("uw_key") || ""
var _base = window.location.origin
async function api(path, opts) {
  opts = opts || {}
  var headers = { "Content-Type": "application/json" }
  if (_key) headers["x-api-key"] = _key
  var res = await fetch(_base + path, { ...opts, headers })
  return res.json()
}
function logout() {
  localStorage.removeItem("uw_key")
  window.location.href = "/login"
}
</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#08080F;color:#E2E8F0;min-height:100vh}
nav{display:flex;align-items:center;justify-content:space-between;padding:14px 24px;background:#0C0C18;border-bottom:1px solid #1A1A2E}
nav .logo{font-size:1.1rem;font-weight:700;background:linear-gradient(135deg,#6366F1,#A78BFA);-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-decoration:none}
nav .nav-links{display:flex;gap:20px;align-items:center}
nav .nav-links a{color:#94A3B8;text-decoration:none;font-size:.9rem;padding:6px 14px;border-radius:6px;transition:.2s}
nav .nav-links a:hover{color:#E2E8F0;background:#1A1A2E}
nav .nav-links a.active{color:#818CF8;background:rgba(99,102,241,.1)}
.btn{display:inline-block;padding:10px 24px;border-radius:8px;font-weight:600;font-size:.9rem;text-decoration:none;border:none;cursor:pointer;transition:all .2s;text-align:center}
.btn-primary{background:#6366F1;color:#fff}
.btn-primary:hover{background:#4F46E5}
.btn-danger{background:#DC2626;color:#fff}
.btn-danger:hover{background:#B91C1C}
.btn-ghost{background:transparent;color:#94A3B8;border:1px solid #2D2D44}
.btn-ghost:hover{border-color:#6366F1;color:#E2E8F0}
.btn-sm{padding:6px 14px;font-size:.8rem}
.container{max-width:1000px;margin:0 auto;padding:32px 24px}
.card{background:#10101F;border:1px solid #1A1A2E;border-radius:12px;padding:24px;margin-bottom:20px}
.card h2{font-size:1.2rem;font-weight:600;margin-bottom:16px}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.stat{text-align:center;padding:20px}
.stat-value{font-size:2rem;font-weight:700;color:#818CF8;margin-bottom:4px}
.stat-label{font-size:.85rem;color:#64748B}
table{width:100%;border-collapse:collapse}
th{text-align:left;padding:10px 12px;font-size:.8rem;color:#64748B;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1A1A2E}
td{padding:12px;font-size:.9rem;border-bottom:1px solid #1A1A2E}
.badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:.75rem;font-weight:600}
.badge-active{background:rgba(16,185,129,.1);color:#34D399;border:1px solid rgba(16,185,129,.2)}
.badge-inactive{background:rgba(239,68,68,.1);color:#F87171;border:1px solid rgba(239,68,68,.2)}
.badge-pro{background:rgba(99,102,241,.1);color:#818CF8;border:1px solid rgba(99,102,241,.2)}
.badge-starter{background:rgba(251,191,36,.1);color:#FBBF24;border:1px solid rgba(251,191,36,.2)}
.badge-free{background:rgba(148,163,184,.1);color:#94A3B8;border:1px solid #2D2D44}
.form-group{margin-bottom:16px}
.form-group label{display:block;font-size:.85rem;color:#64748B;margin-bottom:6px}
.form-group input{width:100%;padding:10px 14px;border-radius:8px;border:1px solid #2D2D44;background:#0A0A0F;color:#E2E8F0;font-size:.95rem;outline:none;transition:.2s}
.form-group input:focus{border-color:#6366F1}
.alert{padding:14px;border-radius:8px;margin-bottom:16px;font-size:.9rem;line-height:1.5}
.alert-success{background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.2);color:#34D399}
.alert-error{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);color:#F87171}
.alert-info{background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.2);color:#818CF8}
.fade-in{animation:fadeIn .4s ease-out}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.loading{text-align:center;padding:40px;color:#64748B}
.empty{text-align:center;padding:40px;color:#64748B}
.modal{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:200}
.modal-content{background:#10101F;border:1px solid #1A1A2E;border-radius:16px;padding:32px;max-width:480px;width:90%;text-align:center}
.modal-content h3{font-size:1.2rem;margin-bottom:8px}
.modal-content p{color:#64748B;font-size:.9rem;margin-bottom:20px;line-height:1.5}
.modal-content .key-display{background:#0A0A0F;padding:12px;border-radius:8px;font-family:monospace;font-size:.85rem;color:#A5B4FC;word-break:break-all;margin-bottom:16px}
.disclaimer{background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.25);border-radius:10px;padding:16px;text-align:left;font-size:.85rem;color:#FBBF24;line-height:1.6;margin-bottom:16px}
.disclaimer strong{color:#FCD34D}
@media(max-width:640px){.grid-2{grid-template-columns:1fr}}
</style>
</head>
<body>
${body}
</body>
</html>`
}

// ─── Signup page ───
dashboard.get("/signup", (c) => {
  const html = layout("Sign Up", `
<nav><a href="/" class="logo">/// Unwrap</a><div class="nav-links"><a href="https://unwrap-api.mintlify.app">Docs</a><a href="/login">Sign In</a></div></nav>
<div class="container" style="max-width:440px;padding-top:60px">
  <div class="card fade-in">
    <h2 style="text-align:center;font-size:1.5rem;margin-bottom:4px">Get your API key</h2>
    <p style="text-align:center;color:#64748B;font-size:.9rem;margin-bottom:24px">Free tier includes 500 credits. No credit card needed.</p>
    <div id="error" style="display:none"></div>
    <div class="form-group"><label>Name</label><input id="name" placeholder="Your name" /></div>
    <div class="form-group"><label>Email</label><input id="email" type="email" placeholder="you@example.com" /></div>
    <button class="btn btn-primary" style="width:100%" onclick="signup()" id="signupBtn">Create Account & Get API Key</button>
    <p style="text-align:center;margin-top:16px;font-size:.85rem;color:#475569">Already have a key? <a href="/login" style="color:#6366F1;text-decoration:none">Sign in</a></p>
  </div>
</div>
<script>
async function signup() {
  const name = document.getElementById("name").value
  const email = document.getElementById("email").value
  const btn = document.getElementById("signupBtn")
  const err = document.getElementById("error")
  if (!name || !email) { err.style.display="block"; err.className="alert alert-error"; err.textContent="Please fill in all fields"; return }
  err.style.display="none"
  btn.disabled=true; btn.textContent="Creating..."
  const res = await fetch("/api/signup", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name,email}) })
  const data = await res.json()
  if (data.error) { err.style.display="block"; err.className="alert alert-error"; err.textContent=data.message; btn.disabled=false; btn.textContent="Create Account & Get API Key"; return }
  localStorage.setItem("uw_key", data.key)
  document.body.innerHTML = \`
    <div class="modal" style="display:flex">
      <div class="modal-content fade-in">
        <h3>🎉 Your API Key is ready</h3>
        <p>This is the <strong>only time</strong> you will see this key. Copy it now and store it somewhere safe — like a password manager.</p>
        <div class="key-display">\${data.key}</div>
        <button class="btn btn-primary" style="width:100%" onclick="copyKey('\${data.key}')">Copy Key</button>
        <br><br>
        <div class="disclaimer">
          ⚠️ <strong>Important:</strong> This key will be used to log you into your dashboard. <strong>Don't share it</strong> — anyone with this key can use your credits. <strong>Don't lose it</strong> — if you do, generate a new key from the dashboard and revoke this one.
        </div>
        <button class="btn btn-primary" style="width:100%" onclick="window.location.href='/dashboard'">I understand — Continue to Dashboard &rarr;</button>
      </div>
    </div>\`
}
function copyKey(key) { navigator.clipboard.writeText(key); alert("Copied!") }
</script>`)
  return c.html(html)
})

// ─── Login page ───
dashboard.get("/login", (c) => {
  const html = layout("Sign In", `
<nav><a href="/" class="logo">/// Unwrap</a><div class="nav-links"><a href="https://unwrap-api.mintlify.app">Docs</a><a href="/signup">Get API Key</a></div></nav>
<div class="container" style="max-width:440px;padding-top:60px">
  <div class="card fade-in">
    <h2 style="text-align:center;font-size:1.5rem;margin-bottom:4px">Sign in</h2>
    <p style="text-align:center;color:#64748B;font-size:.9rem;margin-bottom:24px">Enter your API key to access the dashboard</p>
    <div id="error" style="display:none"></div>
    <div class="form-group"><label>API Key</label><input id="key" placeholder="uw_demo_..." /></div>
    <button class="btn btn-primary" style="width:100%" onclick="login()" id="loginBtn">Sign in</button>
    <p style="text-align:center;margin-top:16px;font-size:.85rem;color:#475569">Don't have a key? <a href="/signup" style="color:#6366F1;text-decoration:none">Get one free</a></p>
  </div>
</div>
<script>
async function login() {
  const key = document.getElementById("key").value
  const btn = document.getElementById("loginBtn")
  const err = document.getElementById("error")
  if (!key) { err.style.display="block"; err.className="alert alert-error"; err.textContent="Enter your API key"; return }
  err.style.display="none"; btn.disabled=true; btn.textContent="Verifying..."
  const res = await fetch("/dashboard/api/profile", { headers:{"x-api-key":key} })
  if (!res.ok) { err.style.display="block"; err.className="alert alert-error"; err.textContent="Invalid API key"; btn.disabled=false; btn.textContent="Sign in"; return }
  localStorage.setItem("uw_key", key)
  window.location.href = "/dashboard"
}
</script>`)
  return c.html(html)
})

// ─── Dashboard main page ───
dashboard.get("/dashboard", (c) => {
  const html = layout("Dashboard", `
<nav><a href="/" class="logo">/// Unwrap</a><div class="nav-links"><a href="/dashboard" class="active">Dashboard</a><a href="/dashboard/keys">API Keys</a><a href="/dashboard/billing">Billing</a><a href="https://unwrap-api.mintlify.app">Docs</a><a href="#" onclick="logout()" style="color:#F87171">Logout</a></div></nav>
<div class="container">
  <h1 style="font-size:1.5rem;font-weight:700;margin-bottom:24px">Dashboard</h1>
  <div id="content"><div class="loading">Loading...</div></div>
</div>
<script>
async function loadDashboard() {
  try {
    if (!_key) { window.location.href="/login"; return }
    const usage = await api("/dashboard/api/usage")
    const profile = await api("/dashboard/api/profile")
    if (usage.error) { document.getElementById("content").innerHTML='<div class="alert alert-error">Invalid API key. <a href="/login" style="color:#818CF8">Sign in again</a></div>'; return }
    const pct = Math.round((usage.totalCreditsUsed / usage.planLimit) * 100)
    document.getElementById("content").innerHTML = \`
      <div class="grid-2">
        <div class="card stat fade-in"><div class="stat-value">\${usage.totalCreditsUsed.toLocaleString()}</div><div class="stat-label">Credits Used</div></div>
        <div class="card stat fade-in"><div class="stat-value">\${usage.remaining.toLocaleString()}</div><div class="stat-label">Credits Remaining</div></div>
      </div>
      <div class="card fade-in">
        <h2>Usage this month</h2>
        <div style="height:8px;background:#1A1A2E;border-radius:4px;overflow:hidden;margin-bottom:16px"><div style="height:100%;width:\${pct}%;background:linear-gradient(90deg,#6366F1,#818CF8);border-radius:4px;transition:width .6s"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:.85rem;color:#64748B"><span>\${usage.totalCreditsUsed.toLocaleString()} / \${usage.planLimit.toLocaleString()} credits</span><span>\${pct}%</span></div>
      </div>
      <div class="grid-2">
        <div class="card fade-in">
          <h2>Account</h2>
          <table><tr><td style="color:#64748B">Plan</td><td><span class="badge badge-\${profile.tier}">\${usage.planName}</span></td></tr>
          <tr><td style="color:#64748B">Email</td><td>\${profile.email}</td></tr>
          <tr><td style="color:#64748B">Name</td><td>\${profile.name}</td></tr>
          <tr><td style="color:#64748B">Joined</td><td>\${new Date(profile.createdAt).toLocaleDateString()}</td></tr></table>
        </div>
        <div class="card fade-in">
          <h2>Requests by endpoint</h2>
          <div id="endpoints-list">\${Object.entries(usage.byEndpoint).length === 0 ? '<div class="empty">No requests yet. <a href="https://unwrap-api.mintlify.app/quickstart" style="color:#818CF8">Make your first call &rarr;</a></div>' : Object.entries(usage.byEndpoint).map(([ep, credits]) => '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1A1A2E;font-size:.85rem"><span style="color:#94A3B8">' + ep + '</span><span>' + credits + ' credits</span></div>').join('')}</div>
        </div>
      </div>
      <div class="card fade-in" style="text-align:center;padding:16px">
        <span style="color:#64748B;font-size:.85rem">Rate limit: \${usage.planName === 'Free' ? '5' : usage.planName === 'Starter' ? '50' : usage.planName === 'Pro' ? '200' : '1000'} requests/second</span>
      </div>
    \`
  } catch(e) {
    document.getElementById("content").innerHTML = '<div class="alert alert-error">Error loading dashboard: ' + e.message + '</div>'
  }
}
loadDashboard()
</script>`)
  return c.html(html)
})

// ─── API Keys page ───
dashboard.get("/dashboard/keys", (c) => {
  const html = layout("API Keys", `
<nav><a href="/" class="logo">/// Unwrap</a><div class="nav-links"><a href="/dashboard">Dashboard</a><a href="/dashboard/keys" class="active">API Keys</a><a href="/dashboard/billing">Billing</a><a href="https://unwrap-api.mintlify.app">Docs</a><a href="#" onclick="logout()" style="color:#F87171">Logout</a></div></nav>
<div class="container">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
    <h1 style="font-size:1.5rem;font-weight:700">API Keys</h1>
    <button class="btn btn-primary btn-sm" onclick="showCreateKey()">+ New Key</button>
  </div>
  <div id="content"><div class="loading">Loading...</div></div>
</div>
<div id="createModal" style="display:none"></div>
<script>
async function loadKeys() {
  try {
    if (!_key) { window.location.href="/login"; return }
    const data = await api("/dashboard/api/keys")
    if (data.error) { document.getElementById("content").innerHTML='<div class="alert alert-error">Invalid API key. <a href="/login" style="color:#818CF8">Sign in again</a></div>'; return }
    if (!data.keys || data.keys.length === 0) {
      document.getElementById("content").innerHTML='<div class="card empty">No API keys. <a href="#" onclick="showCreateKey()" style="color:#818CF8">Create your first key</a></div>'
      return
    }
    document.getElementById("content").innerHTML = \`
      <div class="card fade-in"><table><tr><th>Label</th><th>Key</th><th>Status</th><th>Last Used</th><th>Created</th><th></th></tr>
      \${data.keys.map(k => '<tr><td>' + k.label + '</td><td style="font-family:monospace;font-size:.8rem;color:#A5B4FC">' + k.keyPrefix + '...</td><td><span class="badge ' + (k.isActive ? 'badge-active' : 'badge-inactive') + '">' + (k.isActive ? 'Active' : 'Revoked') + '</span></td><td style="font-size:.85rem;color:#64748B">' + (k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never') + '</td><td style="font-size:.85rem;color:#64748B">' + new Date(k.createdAt).toLocaleDateString() + '</td><td>' + (k.isActive ? '<button class="btn btn-danger btn-sm" data-id="' + k.id + '" onclick="revokeKey(this.dataset.id)">Revoke</button>' : '') + '</td></tr>').join('')}
      </table></div>
    \`
  } catch(e) {
    document.getElementById("content").innerHTML = '<div class="alert alert-error">Error: ' + e.message + '</div>'
  }
}
async function revokeKey(id) {
  if (!confirm("Revoke this key? It will stop working immediately.")) return
  await api("/dashboard/api/keys/" + id + "/revoke", { method:"POST" })
  loadKeys()
}
function showCreateKey() {
  document.getElementById("createModal").innerHTML = \`
    <div class="modal" style="display:flex"><div class="modal-content fade-in">
      <h3>Create API Key</h3>
      <div class="form-group" style="text-align:left"><label>Label (optional)</label><input id="newKeyLabel" placeholder="e.g. production, dev" /></div>
      <button class="btn btn-primary" style="width:100%" onclick="createKey()">Generate Key</button>
      <button class="btn btn-ghost" style="width:100%;margin-top:8px" onclick="closeModal()">Cancel</button>
    </div></div>\`
}
async function createKey() {
  const label = document.getElementById("newKeyLabel").value || "default"
  const data = await api("/dashboard/api/keys", { method:"POST", body:JSON.stringify({label}) })
  if (data.success) {
    document.getElementById("createModal").innerHTML = \`
      <div class="modal" style="display:flex"><div class="modal-content fade-in">
        <h3>Key created</h3>
        <p>Save this key — you won't see it again.</p>
        <div class="key-display">\${data.key}</div>
        <button class="btn btn-primary" style="width:100%" onclick="navigator.clipboard.writeText('\${data.key}');alert('Copied!')">Copy Key</button>
        <button class="btn btn-ghost" style="width:100%;margin-top:8px" onclick="closeModal();loadKeys()">Done</button>
      </div></div>\`
  }
}
function closeModal() { document.getElementById("createModal").innerHTML = "" }
loadKeys()
</script>`)
  return c.html(html)
})

// ─── Billing page ───
dashboard.get("/dashboard/billing", (c) => {
  const html = layout("Billing", `
<nav><a href="/" class="logo">/// Unwrap</a><div class="nav-links"><a href="/dashboard">Dashboard</a><a href="/dashboard/keys">API Keys</a><a href="/dashboard/billing" class="active">Billing</a><a href="https://unwrap-api.mintlify.app">Docs</a><a href="#" onclick="logout()" style="color:#F87171">Logout</a></div></nav>
<div class="container">
  <h1 style="font-size:1.5rem;font-weight:700;margin-bottom:24px">Billing</h1>
  <div id="content"><div class="loading">Loading plans...</div></div>
</div>
<script>
async function loadBilling() {
  try {
    if (!_key) { window.location.href="/login"; return }
    const usage = await api("/dashboard/api/usage")
    const plans = await api("/dashboard/api/plans")
    if (usage.error) { document.getElementById("content").innerHTML='<div class="alert alert-error">Invalid API key</div>'; return }
    const currentTier = usage.tier
    document.getElementById("content").innerHTML = \`
      <div class="card fade-in">
        <h2>Current Plan: \${usage.planName}</h2>
        <p style="color:#64748B;font-size:.9rem;margin-bottom:16px">\${usage.price === 0 ? 'Free tier — upgrade for more credits and higher limits.' : '\\$' + (usage.price/100).toFixed(2) + '/month — ' + usage.planLimit.toLocaleString() + ' credits/month'}</p>
        <div style="height:8px;background:#1A1A2E;border-radius:4px;overflow:hidden;margin-bottom:8px"><div style="height:100%;width:\${Math.round((usage.totalCreditsUsed/usage.planLimit)*100)}%;background:linear-gradient(90deg,#6366F1,#818CF8);border-radius:4px;transition:width .6s"></div></div>
        <div style="font-size:.85rem;color:#64748B;margin-bottom:20px">\${usage.totalCreditsUsed.toLocaleString()} / \${usage.planLimit.toLocaleString()} credits used</div>
      </div>
      <h2 style="font-size:1.1rem;font-weight:600;margin-bottom:16px;margin-top:32px">Compare Plans</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px">
        \${plans.plans.filter(p => p.tier !== 'enterprise').map(plan => \`
          <div class="card fade-in" style="\${plan.tier === currentTier ? 'border-color:#6366F1' : ''}">
            <div style="font-size:.8rem;color:#64748B;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">\${plan.name}</div>
            <div style="font-size:2rem;font-weight:700;margin-bottom:8px">\${plan.price === 0 ? 'Free' : '\\$' + (plan.price/100).toFixed(2)}</div>
            <div style="font-size:.85rem;color:#94A3B8;margin-bottom:16px">\${plan.price > 0 ? '/month' : ''}</div>
            <table style="font-size:.85rem">
              <tr><td style="color:#64748B;padding:4px 0">Credits</td><td style="padding:4px 0">\${plan.monthlyCredits.toLocaleString()}/mo</td></tr>
              <tr><td style="color:#64748B;padding:4px 0">Rate limit</td><td style="padding:4px 0">\${plan.rateLimit}/s</td></tr>
              <tr><td style="color:#64748B;padding:4px 0">Max file</td><td style="padding:4px 0">\${plan.maxFileSizeMb}MB</td></tr>
              <tr><td style="color:#64748B;padding:4px 0">Overage</td><td style="padding:4px 0">\\$\${(plan.overageCostPer1k/100).toFixed(2)}/1K</td></tr>
            </table>
            \${plan.tier === currentTier ? '<div style="margin-top:16px;text-align:center;font-size:.85rem;color:#818CF8">Current plan</div>' : '<button class="btn btn-primary btn-sm" style="width:100%;margin-top:16px" onclick="alert(\'Stripe checkout coming soon\')">Upgrade</button>'}
          </div>\`).join('')}
      </div>
      <div class="card fade-in" style="margin-top:20px;text-align:center">
        <p style="color:#64748B;font-size:.9rem">Need higher limits? <a href="mailto:support@unwrap.dev" style="color:#818CF8">Contact us</a> about Enterprise.</p>
      </div>
    \`
  } catch(e) {
    document.getElementById("content").innerHTML = '<div class="alert alert-error">Error: ' + e.message + '</div>'
  }
}
loadBilling()
</script>`)
  return c.html(html)
})

export { dashboard }
