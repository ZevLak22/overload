'use strict';
(() => {
/* ================= pomocné ================= */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const clone = o => JSON.parse(JSON.stringify(o));
const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.').trim()); return isFinite(n) ? n : null; };
const r2 = n => Math.round(n * 100) / 100;
const fmt = n => n == null ? '' : String(r2(n)).replace('.', ',');
const DAY = 864e5;
const dm = iso => { const d = new Date(iso); return `${d.getDate()}. ${d.getMonth() + 1}.`; };
const DN = ['ne', 'po', 'út', 'st', 'čt', 'pá', 'so'];
const dmw = iso => { const d = new Date(iso); return `${DN[d.getDay()]} ${d.getDate()}. ${d.getMonth() + 1}.`; };
const pl = (n, a, b, c) => n === 1 ? a : n >= 2 && n <= 4 ? b : c;
const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const e1 = s => s && s.r > 0 ? (s.w || 0) * (1 + s.r / 30) : 0;
const KEY = 'overload_v1', DKEY = 'overload_draft_v1';
const PAL = ['#ff6b4a', '#4d9cff', '#a77bff', '#36c98e', '#f5c542', '#ff5c9a', '#5fd0e6', '#c0c4cc'];
const CHEV = '<svg class="chev" width="10" height="16" viewBox="0 0 10 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 2l6 6-6 6"/></svg>';
const CHECK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const GEAR = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
const LOGO = '<svg viewBox="0 0 1024 1024" aria-hidden="true"><defs><linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1c20"/><stop offset="1" stop-color="#0b0b0d"/></linearGradient><linearGradient id="lg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8a5c"/><stop offset="1" stop-color="#ff4d3a"/></linearGradient></defs><rect width="1024" height="1024" fill="url(#lg1)"/><circle cx="512" cy="512" r="292" fill="none" stroke="url(#lg2)" stroke-width="124"/><path d="M392 600L512 474L632 600" fill="none" stroke="#fff" stroke-width="92" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* ================= data ================= */
let lsOK = true;
function load() {
  try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v && v.plan && Array.isArray(v.sessions)) return v; } catch (e) { lsOK = false; }
  return { v: 1, plan: { workouts: [] }, sessions: [], settings: {} };
}
let S = load(); S.settings = S.settings || {};
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { if (lsOK) { lsOK = false; toast('Data se nedaří uložit do telefonu'); } } }
let D = null; try { D = JSON.parse(localStorage.getItem(DKEY) || 'null'); } catch (e) {}
function saveD() { try { D ? localStorage.setItem(DKEY, JSON.stringify(D)) : localStorage.removeItem(DKEY); } catch (e) {} }

let R = { v: S.plan.workouts.length ? 'home' : 'welcome' };
let armed = null, E = null, roC = null;

const W = id => S.plan.workouts.find(w => w.id === id);
const exById = id => { for (const w of S.plan.workouts) { const e = w.exercises.find(x => x.id === id); if (e) return e; } return null; };
const byDate = (a, b) => b.date.localeCompare(a.date);
const sorted = () => S.sessions.slice().sort(byDate);
const deloadOn = () => !!S.settings.deloadUntil && Date.now() < S.settings.deloadUntil;
function nextW() {
  const ws = S.plan.workouts; if (!ws.length) return null;
  const last = sorted().find(s => W(s.wid)); if (!last) return ws[0];
  return ws[(ws.findIndex(w => w.id === last.wid) + 1) % ws.length];
}

/* ================= doporučování ================= */
function exHist(id, skip) {
  return S.sessions.filter(s => !s.deload && s.id !== skip && s.ex[id] && s.ex[id].sets.some(x => x && x.r > 0)).sort(byDate);
}
function metric(s, id) {
  const a = ((s.ex[id] || {}).sets || []).filter(x => x && x.r > 0); if (!a.length) return 0;
  return a.some(x => x.w > 0) ? Math.max(...a.map(e1)) : Math.max(...a.map(x => x.r));
}
function status(id, skip) {
  const h = exHist(id, skip); if (!h.length) return 'none'; if (h.length < 3) return 'cal';
  const t = h.slice(0, 3).map(s => metric(s, id));
  if (t[0] > t[2] * 1.01) return 'up';
  if (t[0] < t[2] * 0.97) return 'reg';
  return 'stag';
}
const roundTo = (x, inc) => inc > 0 ? Math.round(x / inc) * inc : x;
function rec(ex, skip, deload) {
  const h = exHist(ex.id, skip), n = h.length, inc = ex.inc || 2.5, lo = ex.lo, hi = ex.hi;
  const last = h[0] ? h[0].ex[ex.id] : null, rir = last ? last.rir : null;
  const cnt = deload ? Math.max(1, Math.ceil(ex.sets / 2)) : ex.sets;
  const sets = [];
  for (let i = 0; i < cnt; i++) {
    let a = null, b = null;
    for (const s of h) { const v = s.ex[ex.id].sets[i]; if (v && v.r > 0) { if (!a) a = v; else { b = v; break; } } }
    const p = last ? last.sets[i] || null : null;
    if (!a && last) { const ls = last.sets.filter(Boolean); a = ls[ls.length - 1] || null; }
    if (!a) { sets.push({ k: 'new', w: null, r: lo, p }); continue; }
    if (deload) { let w = roundTo(a.w * 0.9, inc); if (w >= a.w && a.w > 0) w = a.w - inc; sets.push({ k: 'dl', w: Math.max(0, r2(w)), r: lo, a, p }); continue; }
    if (n < 2) { sets.push({ k: 'cal', w: a.w, r: a.r, a, p }); continue; }
    const big = a.w > 0 && inc / a.w > 0.1;
    let need = big ? hi + 2 : hi;
    if (big && rir != null && rir >= 2) need = hi;
    if (a.r >= need || (rir != null && rir >= 3 && a.r >= hi - 1)) sets.push({ k: 'up', w: r2(a.w + inc), r: lo, a, p });
    else if (a.r >= lo) sets.push({ k: 'hold', w: a.w, r: Math.min(a.r + 1, need), a, p });
    else if (((b && b.w === a.w && b.r < lo) || (rir === 0 && a.r <= lo - 2)) && a.w - inc > 0) sets.push({ k: 'down', w: r2(a.w - inc), r: Math.min(hi, lo + 2), a, p });
    else sets.push({ k: 'hold', w: a.w, r: lo, a, p });
  }
  return { n, sets, last: h[0] || null, st: status(ex.id, skip) };
}
const u = x => x.w > 0 ? `${fmt(x.w)} kg × ${x.r}` : `${x.r} opak.`;
const ARROW = { up: '↑', down: '↓', hold: '→', cal: '·', dl: '↓', new: '' };
function recText(ex, rc) {
  const s = rc.sets[0]; if (!s) return { t: '', k: 'new' };
  let t = '';
  if (s.k === 'new') t = `První trénink tohohle cviku. Zvol váhu, se kterou dáš ${ex.lo}–${ex.hi} opakování a 1–2 ti ještě zbydou.`;
  else if (s.k === 'cal') t = `Kalibrace ${rc.n}/2: zopakuj minulý výkon (${u(s.a)}), ať appka pozná tvůj základ. Hodnotit začne po dalším tréninku.`;
  else if (s.k === 'dl') t = `Deload: lehčí váha, méně sérií a 3–4 opakování v záloze. Tělo se zregeneruje a pak pojedeš silnější.`;
  else if (s.k === 'up') t = `Minule ${u(s.a)} – horní hranice. Přidej na ${fmt(s.w)} kg a jeď ${ex.lo}–${Math.min(ex.hi, ex.lo + 2)} opakování.`;
  else if (s.k === 'down') t = `Podruhé pod ${ex.lo} opakování. Uber na ${fmt(s.w)} kg, dej ${s.r} čistých opakování a odsud zase stoupej.`;
  else t = s.r > s.a.r ? `Minule ${u(s.a)}. Drž váhu a zkus ${s.r} opakování.` : `Minule ${u(s.a)}, pod rozsahem. Stejná váha, cíl ${s.r} opakování.`;
  const rest = rc.sets.slice(1).filter(x => x.k !== s.k && x.a);
  if (rest.length && s.k !== 'dl') t += ' Ostatní série podle šipek v tabulce.';
  let w = '';
  if (s.k === 'up' || s.k === 'down') w = '';
  else if (rc.st === 'stag') w = '3 tréninky bez posunu. Zkus pomalejší negativ nebo pauzu o 30 s delší; když se to nehne, vyměň cvik.';
  else if (rc.st === 'reg') w = 'Výkon klesá. Hlídej spánek a jídlo; pokud to bude pokračovat, appka navrhne deload.';
  return { t, k: s.k, w };
}
function deloadAdvice() {
  if (deloadOn() || !S.plan.workouts.length) return null;
  const ss = S.sessions.filter(s => !s.deload); if (ss.length < 6) return null;
  const first = Math.min(...ss.map(s => +new Date(s.date)));
  const ref = Math.max(first, S.settings.lastDeloadEnd || 0);
  const days = (Date.now() - ref) / DAY;
  if (days < 28) return null;
  if (S.settings.snooze && Date.now() < S.settings.snooze) return null;
  let ev = 0, bad = 0;
  for (const w of S.plan.workouts) for (const e of w.exercises) { const st = status(e.id); if (st === 'cal' || st === 'none') continue; ev++; if (st === 'stag' || st === 'reg') bad++; }
  if (ev < 3) return null;
  if (bad / ev >= 0.4) return { bad, ev, t: `${bad} z ${ev} cviků se zasekly nebo klesají. Týden lehčího tréninku ti pomůže znovu se rozjet.` };
  if (days >= 49 && bad / ev >= 0.25) return { bad, ev, t: `Trénuješ ${Math.round(days / 7)} týdnů v kuse a ${bad} cviků se zpomaluje. Preventivní deload teď dává smysl.` };
  return null;
}

/* ================= pohledy ================= */
function vWelcome() {
  return `<div class="welcome">${LOGO}<div class="logo">OVERLOAD<span>.</span></div>
   <p>Zapisuj váhy, odškrtávej série a appka ti řekne, kolik dát příště.</p>
   <button class="btn pri wide" data-a="quick">Začít s 3× Fullbody (A, B, C)</button>
   <button class="btn wide" data-a="blank">Postavit plán od nuly</button>
   <p class="credit">made by David Drápela</p></div>`;
}
function exPreview(w, max) {
  const items = w.exercises.slice(0, max).map(e => {
    const rc = rec(e, null, deloadOn()), s = rc.sets[0];
    const v = s && s.w != null ? `<span class="k-${s.k}">${ARROW[s.k] || ''} ${fmt(s.w)} kg × ${s.r}</span>` : '<span class="k-new">nový</span>';
    return `<li><span>${esc(e.name)}</span>${v}</li>`;
  }).join('');
  const more = w.exercises.length > max ? `<li class="more">+ ${w.exercises.length - max} další</li>` : '';
  return `<ul class="prev">${items}${more}</ul>`;
}
function lastOf(wid) { return sorted().find(s => s.wid === wid); }
function vHome() {
  const nw = nextW();
  const now = new Date(), mon = new Date(now); mon.setHours(0, 0, 0, 0); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  const wkCnt = S.sessions.filter(s => new Date(s.date) >= mon).length;
  let h = `<header class="hd"><div class="logo">OVERLOAD<span>.</span></div><button class="icon" data-a="go" data-r="set" aria-label="Nastavení">${GEAR}</button></header>
   <p class="sub">Tento týden ${wkCnt} ${pl(wkCnt, 'trénink', 'tréninky', 'tréninků')} · celkem ${S.sessions.length}</p>`;
  if (D && W(D.wid) && !D.edit) h += `<div class="banner res"><b>Rozjetý trénink: ${esc(W(D.wid).name)}</b>Začal jsi v ${new Date(D.start).toLocaleTimeString('cs', { hour: '2-digit', minute: '2-digit' })}.<div class="row"><button class="btn pri" data-a="resume">Pokračovat</button></div></div>`;
  if (deloadOn()) h += `<div class="banner dl"><b class="k-hold">Deload týden do ${dm(new Date(S.settings.deloadUntil).toISOString())}</b>Lehčí váhy, méně sérií. Návrhy v tréninku jsou už upravené.<div class="row"><button class="btn" data-a="dlEnd">Ukončit deload</button></div></div>`;
  else { const adv = deloadAdvice(); if (adv) h += `<div class="banner dl"><b class="k-hold">Doporučuju deload</b>${esc(adv.t)}<div class="row"><button class="btn pri" data-a="dlStart">Zapnout na týden</button><button class="btn ghost" data-a="dlSnooze">Teď ne</button></div></div>`; }
  if (nw) {
    const l = lastOf(nw.id);
    h += `<button class="next" style="--c:${esc(nw.color)}" data-a="start" data-w="${nw.id}"><div class="lbl">Další trénink</div><h1>${esc(nw.name)}</h1>
      <div class="meta">${nw.exercises.length} ${pl(nw.exercises.length, 'cvik', 'cviky', 'cviků')}${l ? ' · minule ' + dmw(l.date) : ''}</div>${nw.exercises.length ? exPreview(nw, 4) : '<ul class="prev"><li class="more">Zatím žádné cviky – přidej je v plánu.</li></ul>'}
      <span class="btn pri wide" style="display:grid;place-items:center;background:var(--c)">Začít trénink</span></button>`;
    const others = S.plan.workouts.filter(w => w.id !== nw.id);
    if (others.length) h += `<div class="h2">Další v pořadí</div>` + others.map(w => { const l2 = lastOf(w.id); return `<button class="wrow" style="--c:${esc(w.color)}" data-a="start" data-w="${w.id}"><i></i><div><b>${esc(w.name)}</b><span>${w.exercises.length} ${pl(w.exercises.length, 'cvik', 'cviky', 'cviků')}${l2 ? ' · minule ' + dmw(l2.date) : ''}</span></div>${CHEV}</button>`; }).join('');
  }
  return h + '<p class="credit">made by David Drápela</p>';
}

function vLog() {
  const w = W(D.wid) || { name: D.wname || 'Trénink', color: PAL[0] };
  const doneSets = D.list.reduce((a, e) => a + D.ex[e.id].sets.filter(s => s.done).length, 0);
  let h = `<div style="--c:${esc(w.color)}"><header class="lh"><button class="back" data-a="leave" aria-label="Zpět">‹</button><div class="t"><h1>${esc(w.name)}</h1><small>${D.edit ? 'Úprava ' + dm(D.date) : `<span id="elapsed">0:00</span> · ${doneSets} ${pl(doneSets, 'série', 'série', 'sérií')}`}</small></div>
    ${D.edit ? '' : `<button class="chip ${D.deload ? 'on' : ''}" data-a="dlToggle">Deload</button>`}</header>`;
  for (const e of D.list) {
    const x = D.ex[e.id], done = x.sets.filter(s => s.done).length, open = D.open === e.id, all = x.sets.length && done === x.sets.length;
    h += `<section class="exc ${open ? 'open' : ''}" id="ex-${e.id}"><button class="exh" data-a="openex" data-ex="${e.id}"><span class="nm">${esc(e.name)}</span><span class="pr ${all ? 'ok' : ''}">${all ? '✓ hotovo' : `${done}/${x.sets.length}`}</span></button>`;
    if (open) {
      const rc = e.lo ? rec(e, D.edit, D.deload) : { sets: [], st: 'none', n: 0 };
      const rt = e.lo ? recText(e, rc) : null;
      h += `<div class="exb"><div class="target">Cíl ${e.lo}–${e.hi} opakování · krok ${fmt(e.inc)} kg${e.note ? ' · ' + esc(e.note) : ''}</div>`;
      if (rt && !D.edit) h += `<div class="rec k-${rt.k}"><b>Doporučení</b><p>${esc(rt.t)}</p>${rt.w ? `<div class="w">${esc(rt.w)}</div>` : ''}</div>`;
      h += `<div class="grid gh"><span></span><span>Minule</span><span>kg</span><span>Opak.</span><span></span></div>`;
      x.sets.forEach((s, i) => {
        const rs = rc.sets[i], p = rs && rs.p;
        h += `<div class="grid sr ${s.done ? 'done' : ''}"><span class="n">${i + 1}</span><span class="pv">${p ? u(p).replace(' kg', '') : '—'}${rs && rs.a && !D.edit ? `<i class="k-${rs.k}">${ARROW[rs.k] || ''}</i>` : ''}</span>
          <input inputmode="decimal" enterkeyhint="next" value="${esc(s.w)}" placeholder="kg" data-f="w" data-ex="${e.id}" data-i="${i}" aria-label="Série ${i + 1} kg">
          <input inputmode="numeric" enterkeyhint="done" value="${esc(s.r)}" placeholder="0" data-f="r" data-ex="${e.id}" data-i="${i}" aria-label="Série ${i + 1} opakování">
          <button class="tick" data-a="tick" data-ex="${e.id}" data-i="${i}" aria-label="Hotovo série ${i + 1}">${CHECK}</button></div>`;
      });
      h += `<div class="exa"><button class="btn" data-a="addset" data-ex="${e.id}">+ Série</button>${x.sets.length > 1 ? `<button class="btn" data-a="rmset" data-ex="${e.id}">− Série</button>` : ''}</div>`;
      if (all) h += `<div class="rir"><p>Kolik opakování ti v poslední sérii ještě zbylo? (nepovinné, zpřesní doporučení)</p><div class="row">${[0, 1, 2, 3].map(v => `<button class="${x.rir === v ? 'on' : ''}" data-a="rir" data-ex="${e.id}" data-v="${v}">${v === 3 ? '3+' : v}</button>`).join('')}</div></div>`;
      h += `<input class="note" data-note="${e.id}" value="${esc(exById(e.id) ? exById(e.id).note || '' : '')}" placeholder="Poznámka (např. sedačka na 4)" aria-label="Poznámka ke cviku"></div>`;
    }
    h += `</section>`;
  }
  h += `<button class="discard" data-a="discard">${armed === 'disc' ? 'Opravdu zahodit?' : D.edit ? 'Zrušit úpravy' : 'Zahodit trénink'}</button></div>`;
  return h;
}
function footLog() {
  const w = W(D.wid) || { color: PAL[0] };
  return `<div class="foot" style="--c:${esc(w.color)}"><div class="in"><button class="btn pri wide" style="background:var(--c)" data-a="finish">${armed === 'fin' ? 'Neodškrtnuté série se neuloží – dokončit?' : D.edit ? 'Uložit změny' : 'Dokončit trénink'}</button></div></div>`;
}

function vSum() {
  const s = S.sessions.find(x => x.id === R.sid); if (!s) return vHome();
  let sets = 0, vol = 0; for (const x of Object.values(s.ex)) for (const v of x.sets) if (v) { sets++; vol += (v.w || 0) * v.r; }
  const nw = nextW();
  return `<div class="welcome" style="text-align:left;justify-content:flex-start;padding-top:30px"><div class="lbl" style="color:var(--up)">Trénink hotový</div><div class="big">Dobrá práce.</div>
   <div class="stats"><div class="stat"><b>${s.dur || 0} min</b><span>čas</span></div><div class="stat"><b>${sets}</b><span>sérií</span></div><div class="stat"><b>${Math.round(vol).toLocaleString('cs')}</b><span>kg celkem</span></div></div>
   ${R.prs && R.prs.length ? `<div class="sd" style="box-shadow:inset 0 0 0 1.5px var(--up)"><b class="k-up">Nové rekordy</b><span>${R.prs.map(esc).join(' · ')}</span></div>` : ''}
   ${nw ? `<div class="sd"><b>Příště: ${esc(nw.name)}</b><span>Appka už má připravené návrhy vah.</span></div>` : ''}
   <button class="btn pri wide" data-a="tab" data-v="home" style="margin-top:10px">Hotovo</button></div>`;
}

function vEdit() {
  return `<header class="lh"><button class="back" data-a="editCancel" aria-label="Zpět">‹</button><div class="t"><h1>Plán tréninků</h1></div></header>
   <p class="hint">Poskládej si tréninky. Pořadí tady = pořadí, ve kterém je appka nabízí jako „další“. Po potvrzení se plán zamkne a v tréninku už jen zapisuješ.</p>
   ${E.workouts.map((w, wi) => `<section class="ed" style="--c:${esc(w.color)}">
     <div class="edt"><input value="${esc(w.name)}" data-e="name" data-wi="${wi}" placeholder="Název tréninku" aria-label="Název tréninku"><button class="ic" data-a="wmv" data-wi="${wi}" data-d="-1" aria-label="Posunout nahoru">↑</button><button class="ic" data-a="wmv" data-wi="${wi}" data-d="1" aria-label="Posunout dolů">↓</button></div>
     <div class="pal">${PAL.map(c => `<button class="sw ${c === w.color ? 'on' : ''}" style="background:${c}" data-a="wcol" data-wi="${wi}" data-c="${c}" aria-label="Barva ${c}"></button>`).join('')}</div>
     ${w.exercises.map((e, ei) => `<div class="ee"><div class="eet"><input value="${esc(e.name)}" data-e="name" data-wi="${wi}" data-ei="${ei}" placeholder="Název cviku" aria-label="Název cviku">
        <button class="ic" data-a="emv" data-wi="${wi}" data-ei="${ei}" data-d="-1" aria-label="Nahoru">↑</button><button class="ic" data-a="emv" data-wi="${wi}" data-ei="${ei}" data-d="1" aria-label="Dolů">↓</button><button class="ic del" data-a="edel" data-wi="${wi}" data-ei="${ei}" aria-label="Smazat cvik">${armed === `e${wi}_${ei}` ? '?' : '✕'}</button></div>
        <div class="een">${[['sets', 'Série'], ['lo', 'Opak. od'], ['hi', 'Opak. do'], ['inc', 'Krok kg']].map(([k, l]) => `<label>${l}<input inputmode="${k === 'inc' ? 'decimal' : 'numeric'}" value="${esc(k === 'inc' ? fmt(e[k]) : e[k])}" data-e="${k}" data-wi="${wi}" data-ei="${ei}"></label>`).join('')}</div></div>`).join('')}
     <div class="edb"><button class="btn" data-a="eadd" data-wi="${wi}">+ Přidat cvik</button><button class="btn ghost danger" data-a="wdel" data-wi="${wi}">${armed === 'w' + wi ? 'Opravdu smazat?' : 'Smazat trénink'}</button></div></section>`).join('')}
   <button class="btn wide" data-a="wadd" style="margin-top:14px">+ Přidat trénink</button>
   <details><summary>Jak nastavit čísla</summary><p><b>Opak. od–do:</b> velké cviky (tlaky, přítahy, leg press) 6–10, izolované 8–12, předloktí a břicho 10–15.<br><b>Krok kg:</b> o kolik jde nejmíň přidat – podle stacku na stroji (2,5 / 5 / 7 kg).</p></details>
   <div class="sticky"><button class="btn pri wide" data-a="editSave">Potvrdit plán</button></div>`;
}

function vSet() {
  return `<header class="lh"><button class="back" data-a="tab" data-v="${S.plan.workouts.length ? 'home' : 'welcome'}" aria-label="Zpět">‹</button><div class="t"><h1>Nastavení</h1></div></header>
   <div class="set"><h3>Plán tréninků</h3><p>${S.plan.workouts.length} ${pl(S.plan.workouts.length, 'trénink', 'tréninky', 'tréninků')}, ${(n => n + ' ' + pl(n, 'cvik', 'cviky', 'cviků'))(S.plan.workouts.reduce((a, w) => a + w.exercises.length, 0))}.</p><div class="row"><button class="btn pri" data-a="editOpen">Upravit plán</button></div></div>
   <div class="set"><h3>Deload</h3><p>${deloadOn() ? 'Běží do ' + dm(new Date(S.settings.deloadUntil).toISOString()) + '.' : 'Appka ho navrhne sama, až bude potřeba (nejdřív po 4 týdnech). Můžeš ho zapnout i ručně.'}</p><div class="row">${deloadOn() ? '<button class="btn" data-a="dlEnd">Ukončit deload</button>' : '<button class="btn" data-a="dlStart">Začít deload týden</button>'}</div></div>
   <details><summary>Jak appka doporučuje váhy</summary>
     <p><b>Dvojitá progrese.</b> Každý cvik má rozsah opakování. Každá série se porovná se stejnou sérií z minula: dáš horní hranici → přidej krok váhy a začni dole; jsi v rozsahu → stejná váha, +1 opakování; dvakrát po sobě pod spodní hranicí → uber.</p>
     <p><b>Kalibrace.</b> První 2 tréninky cviku appka jen sbírá data, hodnotit začne až potom.</p>
     <p><b>Rezerva (RIR).</b> Když po poslední sérii ťukneš, kolik ti zbylo, návrh je přesnější – se 3+ v záloze přidá váhu dřív.</p>
     <p><b>Stagnace a deload.</b> Cvik bez posunu odhadované síly 3 tréninky = stagnace. Když se zasekne 40 % cviků (nejdřív po 4 týdnech), nebo po 7 týdnech čtvrtina, appka navrhne týden deloadu: −10 % váhy, polovina sérií.</p>
     <p>Vychází z doporučení ACSM: přidat 2–10 % zátěže, když zvládneš o 1–2 opakování víc, než je cíl.</p></details>
   <details><summary>Instalace na iPhone</summary><p>Otevři appku v Safari → tlačítko Sdílet → <b>Přidat na plochu</b>. Pak se spouští přes celou obrazovku jako normální aplikace a funguje i bez signálu.</p><p>Data jsou uložená v appce na ploše. Když ji z plochy smažeš, smažou se i data.</p></details>
   <button class="discard" data-a="wipe" style="color:var(--down)">${armed === 'wipe' ? 'Opravdu smazat úplně všechno?' : 'Smazat všechna data'}</button>
   <p class="credit">Overload · made by David Drápela</p>`;
}

function spark(vals) {
  if (vals.length < 2) return '<svg class="spark"></svg>';
  const mn = Math.min(...vals), mx = Math.max(...vals), sp = mx - mn || 1;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1) * 100).toFixed(1)},${(26 - (v - mn) / sp * 22).toFixed(1)}`).join(' ');
  return `<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2.2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`;
}
const ST = { up: ['Roste', 'k-up'], stag: ['Stagnuje', 'k-stag'], reg: ['Klesá', 'k-reg'], cal: ['Kalibrace', 'k-cal'], none: ['Bez dat', 'k-none'] };
function bestSet(s, id) { let b = null; for (const v of (s.ex[id] || {}).sets || []) if (v && (!b || e1(v) > e1(b) || (e1(v) === e1(b) && v.r > b.r))) b = v; return b; }
function vProg() {
  if (!S.sessions.length) return `<h1 style="margin-top:8px">Progres</h1><div class="empty">Tady uvidíš grafy a rekordy každého cviku.<br>Stačí odjet první trénink.</div>`;
  let h = `<h1 style="margin-top:8px">Progres</h1>`;
  for (const w of S.plan.workouts) {
    if (!w.exercises.length) continue;
    h += `<div class="h2" style="color:${esc(w.color)}">${esc(w.name)}</div>`;
    for (const e of w.exercises) {
      const hs = exHist(e.id).reverse(), st = ST[status(e.id)], l = hs[hs.length - 1], bs = l && bestSet(l, e.id);
      h += `<button class="prow" data-a="exd" data-id="${e.id}"><div class="t"><b>${esc(e.name)}</b><small>${bs ? 'Naposledy ' + u(bs) : 'Zatím bez záznamu'}</small></div><span class="${st[1]}">${spark(hs.slice(-8).map(s => metric(s, e.id)))}</span><span class="tag ${st[1]}">${st[0]}</span></button>`;
    }
  }
  return h;
}
let chartPts = [], chartBw = false;
function vExd() {
  const e = exById(R.id); if (!e) { R = { v: 'prog' }; return vProg(); }
  const all = S.sessions.filter(s => s.ex[e.id] && s.ex[e.id].sets.some(Boolean)).sort(byDate).reverse();
  const real = all.filter(s => !s.deload);
  chartBw = !real.some(s => s.ex[e.id].sets.some(v => v && v.w > 0));
  chartPts = all.map(s => ({ t: +new Date(s.date), d: s.date, v: r2(metric(s, e.id)), dl: s.deload }));
  let best = null, bestS = null; for (const s of real) { const b = bestSet(s, e.id); if (b && (!best || e1(b) > e1(best))) { best = b; bestS = s; } }
  const lastM = real.length ? metric(real[real.length - 1], e.id) : 0;
  const lastT = real.length ? +new Date(real[real.length - 1].date) : 0;
  const base = real.filter(s => +new Date(s.date) <= lastT - 27 * DAY).pop() || real[0];
  const ch = base && real.length > 1 && base !== real[real.length - 1] ? (lastM / metric(base, e.id) - 1) * 100 : null;
  const st = ST[status(e.id)];
  return `<header class="lh"><button class="back" data-a="tab" data-v="prog" aria-label="Zpět">‹</button><div class="t"><h1>${esc(e.name)}</h1><small>${e.lo}–${e.hi} opakování · <span class="${st[1]}">${st[0]}</span></small></div></header>
   <div class="stats"><div class="stat"><b class="k-up">${best ? u(best) : '–'}</b><span>nejlepší série${bestS ? ' · ' + dm(bestS.date) : ''}</span></div>
    <div class="stat"><b>${lastM ? (chartBw ? Math.round(lastM) + '×' : Math.round(lastM) + ' kg') : '–'}</b><span>${chartBw ? 'max opakování' : 'odhad 1RM'}</span></div>
    <div class="stat"><b class="${ch > 0 ? 'k-up' : ch < 0 ? 'k-down' : ''}">${ch == null ? '–' : (ch > 0 ? '+' : '') + fmt(Math.round(ch * 10) / 10) + ' %'}</b><span>za ~4 týdny</span></div></div>
   <div class="fig"><svg id="chart" role="img" aria-label="Vývoj síly"></svg></div>
   <p class="hint">${chartBw ? 'Graf ukazuje nejvíc opakování v tréninku.' : 'Graf ukazuje odhad maxima na 1 opakování z nejlepší série – spojí váhu i opakování do jednoho čísla.'} Prázdné body = deload.</p>
   <table><thead><tr><th>Datum</th><th>Série</th><th class="r">RIR</th></tr></thead><tbody>
   ${all.slice().reverse().map(s => `<tr><td>${dm(s.date)}${s.deload ? '<br><small class="k-hold">deload</small>' : ''}</td><td>${s.ex[e.id].sets.filter(Boolean).map(u).join(', ')}</td><td class="r">${s.ex[e.id].rir == null ? '–' : s.ex[e.id].rir === 3 ? '3+' : s.ex[e.id].rir}</td></tr>`).join('') || '<tr><td colspan="3" class="k-none">Zatím nic</td></tr>'}</tbody></table>`;
}
function drawChart() {
  const s = document.getElementById('chart'); if (!s) return;
  const pts = chartPts;
  const draw = () => {
    const Wd = s.clientWidth, H = s.clientHeight; if (!Wd) return;
    if (!pts.length) { s.innerHTML = `<text x="${Wd / 2}" y="${H / 2}" text-anchor="middle" fill="#9a9aa3" font-size="14">Zatím žádná data</text>`; return; }
    const p = { l: 40, r: 16, t: 26, b: 28 };
    let mn = Math.min(...pts.map(d => d.v)), mx = Math.max(...pts.map(d => d.v));
    if (mx - mn < 2) { mn -= 2; mx += 2; } const pad = (mx - mn) * .15; mn = Math.max(0, mn - pad); mx += pad;
    const t0 = pts[0].t, sp = (pts[pts.length - 1].t - t0) || 1;
    const X = t => p.l + (pts.length === 1 ? (Wd - p.l - p.r) / 2 : (t - t0) / sp * (Wd - p.l - p.r));
    const Y = v => p.t + (1 - (v - mn) / (mx - mn)) * (H - p.t - p.b);
    let g = '';
    for (let i = 0; i <= 3; i++) { const v = mn + (mx - mn) * i / 3, y = Y(v); g += `<line x1="${p.l}" x2="${Wd - p.r}" y1="${y}" y2="${y}" stroke="#fff" stroke-opacity=".07"/><text x="${p.l - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#9a9aa3">${Math.round(v)}</text>`; }
    const real = pts.filter(d => !d.dl);
    if (real.length > 1) {
      const line = real.map((d, i) => `${i ? 'L' : 'M'}${X(d.t).toFixed(1)},${Y(d.v).toFixed(1)}`).join('');
      g += `<defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6b4a" stop-opacity=".35"/><stop offset="1" stop-color="#ff6b4a" stop-opacity="0"/></linearGradient></defs>`;
      g += `<path d="${line}L${X(real[real.length - 1].t)},${H - p.b}L${X(real[0].t)},${H - p.b}Z" fill="url(#cg)"/><path d="${line}" fill="none" stroke="#ff6b4a" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`;
    }
    g += pts.map(d => `<circle cx="${X(d.t)}" cy="${Y(d.v)}" r="${d.dl ? 4 : 4.5}" fill="${d.dl ? '#17171a' : '#ff6b4a'}" stroke="#ff6b4a" stroke-width="2"/>`).join('');
    const L = pts[pts.length - 1];
    g += `<text x="${Math.min(X(L.t), Wd - p.r)}" y="${Math.max(14, Y(L.v) - 12)}" text-anchor="${pts.length === 1 ? 'middle' : 'end'}" font-size="13" font-weight="700" fill="#f4f4f6">${Math.round(L.v)}${chartBw ? '×' : ' kg'}</text>`;
    g += `<text x="${X(pts[0].t)}" y="${H - 9}" font-size="11" fill="#9a9aa3" text-anchor="${pts.length === 1 ? 'middle' : 'start'}">${dm(pts[0].d)}</text>`;
    if (pts.length > 1) g += `<text x="${X(L.t)}" y="${H - 9}" font-size="11" fill="#9a9aa3" text-anchor="end">${dm(L.d)}</text>`;
    s.innerHTML = g;
  };
  if (roC) roC.disconnect(); roC = new ResizeObserver(draw); roC.observe(s); draw();
}
function vHist() {
  const ss = sorted();
  if (!ss.length) return `<h1 style="margin-top:8px">Historie</h1><div class="empty">Zatím žádné tréninky.</div>`;
  return `<h1 style="margin-top:8px">Historie</h1>` + ss.map(s => {
    const w = W(s.wid); let n = 0; for (const x of Object.values(s.ex)) n += x.sets.filter(Boolean).length;
    return `<button class="hrow" style="--c:${esc(w ? w.color : '#888')}" data-a="sd" data-id="${s.id}"><i></i><div class="t"><b>${esc(w ? w.name : s.wname || 'Trénink')}${s.deload ? ' <span class="tag k-hold">deload</span>' : ''}</b><small>${dmw(s.date)} · ${n} ${pl(n, 'série', 'série', 'sérií')}${s.dur ? ' · ' + s.dur + ' min' : ''}</small></div>${CHEV}</button>`;
  }).join('');
}
function vSd() {
  const s = S.sessions.find(x => x.id === R.id); if (!s) { R = { v: 'hist' }; return vHist(); }
  const w = W(s.wid);
  return `<header class="lh"><button class="back" data-a="tab" data-v="hist" aria-label="Zpět">‹</button><div class="t"><h1>${esc(w ? w.name : s.wname || 'Trénink')}</h1><small>${dmw(s.date)}${s.dur ? ' · ' + s.dur + ' min' : ''}${s.deload ? ' · deload' : ''}</small></div></header>
   ${Object.entries(s.ex).map(([id, x]) => `<div class="sd"><b>${esc((exById(id) || {}).name || x.n || 'Cvik')}</b><span>${x.sets.filter(Boolean).map(u).join(' · ')}${x.rir != null ? ' · RIR ' + (x.rir === 3 ? '3+' : x.rir) : ''}</span></div>`).join('')}
   <div class="row" style="display:flex;gap:8px;margin-top:16px"><button class="btn" style="flex:1" data-a="sEdit" data-id="${s.id}">Upravit</button><button class="btn danger" style="flex:1" data-a="sDel" data-id="${s.id}">${armed === 'sd' ? 'Opravdu smazat?' : 'Smazat'}</button></div>`;
}

/* ================= render ================= */
function render() {
  const v = R.v;
  const map = { welcome: vWelcome, home: vHome, log: vLog, sum: vSum, edit: vEdit, set: vSet, prog: vProg, exd: vExd, hist: vHist, sd: vSd };
  $('#app').innerHTML = (map[v] || vHome)();
  $('#foot').innerHTML = v === 'log' && D ? footLog() : '';
  const tabs = $('#tabs'); tabs.hidden = !['home', 'prog', 'exd', 'hist', 'sd', 'set'].includes(v) || !S.plan.workouts.length;
  const tv = v === 'exd' ? 'prog' : v === 'sd' ? 'hist' : v;
  tabs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === tv));
  if (v === 'exd') drawChart(); else if (roC) { roC.disconnect(); roC = null; }
  if (v === 'log') uiElapsed();
}
function go(r) { R = r; armed = null; render(); scrollTo(0, 0); }

/* ================= trénink ================= */
function buildEx(e, dl, skip) {
  const rc = rec(e, skip, dl);
  return { sets: rc.sets.map(s => ({ w: s.w != null ? fmt(s.w) : '', r: s.w != null && s.r != null ? String(s.r) : '', done: false })), rir: null };
}
function startW(wid) {
  if (D && !D.edit && D.wid === wid) { go({ v: 'log' }); return; }
  const w = W(wid); if (!w) return;
  if (!w.exercises.length) { toast('Tenhle trénink nemá cviky – přidej je v plánu'); return; }
  const dl = deloadOn();
  D = { wid, start: Date.now(), deload: dl, edit: null, date: new Date().toISOString(), list: clone(w.exercises), open: w.exercises[0].id, ex: {} };
  for (const e of D.list) D.ex[e.id] = buildEx(e, dl, null);
  saveD(); go({ v: 'log' });
}
function editSession(sid) {
  const s = S.sessions.find(x => x.id === sid); if (!s) return;
  const w = W(s.wid);
  const list = w ? clone(w.exercises) : [];
  for (const id of Object.keys(s.ex)) if (!list.some(e => e.id === id)) list.push({ id, name: s.ex[id].n || 'Cvik', sets: s.ex[id].sets.length, lo: 0, hi: 0, inc: 0, rest: 0 });
  const ex = {};
  for (const e of list) {
    const x = s.ex[e.id];
    ex[e.id] = x ? { sets: x.sets.map(v => v ? { w: fmt(v.w), r: String(v.r), done: true } : { w: '', r: '', done: false }), rir: x.rir ?? null }
      : { sets: Array.from({ length: e.sets || 1 }, () => ({ w: '', r: '', done: false })), rir: null };
  }
  D = { wid: s.wid, wname: s.wname, start: Date.now(), deload: !!s.deload, edit: s.id, date: s.date, dur: s.dur, list, open: list[0] ? list[0].id : null, ex };
  go({ v: 'log' });
}
function nextOpen(from) {
  const i = D.list.findIndex(e => e.id === from);
  const nx = D.list.slice(i + 1).concat(D.list.slice(0, i)).find(e => D.ex[e.id].sets.some(s => !s.done));
  return nx ? nx.id : null;
}
function scrollToEx(id) { requestAnimationFrame(() => { const el = document.getElementById('ex-' + id); if (el) el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }); }
function finish() {
  const ex = {}; let undone = 0, cnt = 0;
  for (const e of D.list) {
    const x = D.ex[e.id];
    const sets = x.sets.map(s => { if (!s.done) { if (s.r !== '') undone++; return null; } const r = Math.round(num(s.r) || 0); if (r <= 0) return null; cnt++; return { w: num(s.w) || 0, r }; });
    while (sets.length && !sets[sets.length - 1]) sets.pop();
    if (sets.some(Boolean)) ex[e.id] = { n: e.name, sets, rir: x.rir };
  }
  if (!cnt) { toast('Odškrtni aspoň jednu sérii ✓'); return; }
  if (undone && armed !== 'fin') { armed = 'fin'; render(); return; }
  const id = D.edit || uid();
  const prs = [];
  if (!D.edit && !D.deload) for (const [eid, x] of Object.entries(ex)) {
    const prev = S.sessions.filter(s => s.ex[eid]).map(s => metric(s, eid));
    const now = metric({ ex: { [eid]: x } }, eid);
    if (prev.length && now > Math.max(...prev) + 0.01) { const b = bestSet({ ex: { [eid]: x } }, eid); prs.push(`${x.n} ${u(b)}`); }
  }
  const sess = { id, wid: D.wid, wname: (W(D.wid) || {}).name || D.wname || '', date: D.date, dur: D.edit ? D.dur || 0 : Math.max(1, Math.round((Date.now() - D.start) / 60000)), deload: !!D.deload, ex };
  const i = S.sessions.findIndex(s => s.id === id); if (i >= 0) S.sessions[i] = sess; else S.sessions.push(sess);
  save();
  const wasEdit = !!D.edit; D = null; saveD();
  if (wasEdit) { toast('Změny uložené'); go({ v: 'sd', id }); } else go({ v: 'sum', sid: id, prs });
}

/* ================= čas tréninku ================= */
function uiElapsed() { const el = document.getElementById('elapsed'); if (el && D) el.textContent = mmss(Math.max(0, Math.floor((Date.now() - D.start) / 1000))); }
setInterval(() => { if (R.v === 'log') uiElapsed(); }, 1000);

let tt = null;
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('on'), 2600); }

/* ================= plán ================= */
function normPlan(ws) {
  return ws.map(w => ({ id: w.id || uid(), name: String(w.name || 'Trénink').slice(0, 40), color: PAL.includes(w.color) ? w.color : PAL[0],
    exercises: (w.exercises || []).filter(e => String(e.name || '').trim()).map(e => {
      const lo = Math.max(1, Math.round(num(e.lo) || 8)), hi = Math.max(lo, Math.round(num(e.hi) || lo + 4));
      return { id: e.id || uid(), name: String(e.name).trim().slice(0, 50), sets: Math.max(1, Math.min(10, Math.round(num(e.sets) || 3))), lo, hi, inc: Math.max(0.25, num(e.inc) || 2.5), rest: Math.max(0, Math.min(600, Math.round(num(e.rest) ?? 90))), note: String(e.note || '').slice(0, 80) };
    }) }));
}
const newEx = () => ({ id: uid(), name: '', sets: 3, lo: 8, hi: 12, inc: 2.5, rest: 90, note: '' });

/* ================= události ================= */
document.addEventListener('click', async ev => {
  const b = ev.target.closest('[data-a]'); if (!b) return;
  const a = b.dataset.a, d = b.dataset;
  const keepArm = ['discard', 'finish', 'edel', 'wdel', 'wipe', 'sDel'].includes(a);
  if (!keepArm) armed = null;
  const arm = k => { if (armed === k) { armed = null; return true; } armed = k; render(); return false; };
  switch (a) {
    case 'tab': go({ v: d.v }); break;
    case 'go': go({ v: d.r }); break;
    case 'quick': E = { workouts: ['A', 'B', 'C'].map((l, i) => ({ id: uid(), name: 'Fullbody ' + l, color: PAL[[0, 1, 3][i]], exercises: [newEx()] })), back: 'welcome' }; go({ v: 'edit' }); break;
    case 'blank': E = { workouts: [{ id: uid(), name: 'Trénink A', color: PAL[0], exercises: [newEx()] }], back: 'welcome' }; go({ v: 'edit' }); break;
    case 'editOpen': E = { workouts: clone(S.plan.workouts), back: 'set' }; if (!E.workouts.length) E.workouts.push({ id: uid(), name: 'Trénink A', color: PAL[0], exercises: [newEx()] }); go({ v: 'edit' }); break;
    case 'editCancel': { const bk = E && E.back; E = null; go({ v: S.plan.workouts.length ? (bk === 'welcome' ? 'home' : bk || 'home') : 'welcome' }); break; }
    case 'editSave': {
      const ws = normPlan(E.workouts).filter(w => w.name.trim());
      if (!ws.length) { toast('Přidej aspoň jeden trénink'); break; }
      if (ws.some(w => !w.exercises.length)) { toast('Každý trénink potřebuje aspoň jeden cvik s názvem'); break; }
      S.plan.workouts = ws; save(); E = null; toast('Plán uložený'); go({ v: 'home' }); break;
    }
    case 'wadd': E.workouts.push({ id: uid(), name: 'Trénink ' + String.fromCharCode(65 + E.workouts.length), color: PAL[E.workouts.length % PAL.length], exercises: [newEx()] }); render(); break;
    case 'wdel': if (arm('w' + d.wi)) { E.workouts.splice(+d.wi, 1); render(); } break;
    case 'wmv': { const i = +d.wi, j = i + +d.d; if (j >= 0 && j < E.workouts.length) { [E.workouts[i], E.workouts[j]] = [E.workouts[j], E.workouts[i]]; render(); } break; }
    case 'wcol': E.workouts[+d.wi].color = d.c; render(); break;
    case 'eadd': E.workouts[+d.wi].exercises.push(newEx()); render(); requestAnimationFrame(() => { const ins = document.querySelectorAll(`[data-wi="${d.wi}"][data-e="name"][data-ei]`); const l = ins[ins.length - 1]; if (l) l.focus(); }); break;
    case 'edel': if (arm(`e${d.wi}_${d.ei}`)) { E.workouts[+d.wi].exercises.splice(+d.ei, 1); render(); } break;
    case 'emv': { const ex = E.workouts[+d.wi].exercises, i = +d.ei, j = i + +d.d; if (j >= 0 && j < ex.length) { [ex[i], ex[j]] = [ex[j], ex[i]]; render(); } break; }
    case 'start': startW(d.w); break;
    case 'resume': if (D) { go({ v: 'log' }); if (D.open) scrollToEx(D.open); } break;
    case 'leave': if (D && D.edit) { D = null; go({ v: 'hist' }); } else go({ v: 'home' }); break;
    case 'openex': D.open = D.open === d.ex ? null : d.ex; saveD(); render(); if (D.open) scrollToEx(D.open); break;
    case 'tick': {
      const x = D.ex[d.ex], s = x.sets[+d.i];
      if (!s.done && !(num(s.r) > 0)) { toast('Doplň počet opakování'); break; }
      s.done = !s.done;
      saveD(); render(); break;
    }
    case 'rir': { const x = D.ex[d.ex]; x.rir = x.rir === +d.v ? null : +d.v; const nx = nextOpen(d.ex); if (nx && x.rir != null) { D.open = nx; saveD(); render(); scrollToEx(nx); } else { saveD(); render(); } break; }
    case 'addset': { const x = D.ex[d.ex], l = x.sets[x.sets.length - 1] || {}; x.sets.push({ w: l.w || '', r: l.r || '', done: false }); saveD(); render(); break; }
    case 'rmset': { const x = D.ex[d.ex]; if (x.sets.length > 1) x.sets.pop(); saveD(); render(); break; }
    case 'dlToggle': {
      D.deload = !D.deload;
      for (const e of D.list) if (!D.ex[e.id].sets.some(s => s.done)) D.ex[e.id] = buildEx(e, D.deload, null);
      saveD(); render(); toast(D.deload ? 'Deload: lehčí váhy, méně sérií' : 'Deload vypnutý'); break;
    }
    case 'finish': finish(); break;
    case 'discard': if (arm('disc')) { const ed = D && D.edit; D = null; saveD(); go({ v: ed ? 'hist' : 'home' }); } break;
    case 'dlStart': S.settings.deloadUntil = Date.now() + 7 * DAY; S.settings.lastDeloadEnd = S.settings.deloadUntil; save(); toast('Deload zapnutý na 7 dní'); render(); break;
    case 'dlEnd': S.settings.deloadUntil = Date.now(); S.settings.lastDeloadEnd = Date.now(); save(); render(); break;
    case 'dlSnooze': S.settings.snooze = Date.now() + 7 * DAY; save(); render(); break;
    case 'exd': go({ v: 'exd', id: d.id }); break;
    case 'sd': go({ v: 'sd', id: d.id }); break;
    case 'sEdit': editSession(d.id); break;
    case 'sDel': if (arm('sd')) { S.sessions = S.sessions.filter(s => s.id !== d.id); save(); toast('Trénink smazaný'); go({ v: 'hist' }); } break;
    case 'wipe': if (arm('wipe')) { S = { v: 1, plan: { workouts: [] }, sessions: [], settings: {} }; D = null; saveD(); save(); go({ v: 'welcome' }); } break;
  }
});
document.addEventListener('input', ev => {
  const t = ev.target, d = t.dataset;
  if (d.f && D) { const s = D.ex[d.ex].sets[+d.i]; s[d.f] = t.value; saveD(); }
  else if (d.e && E) { const w = E.workouts[+d.wi]; if (d.ei != null) w.exercises[+d.ei][d.e] = d.e === 'name' ? t.value : t.value; else w[d.e] = t.value; }
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.dataset.note) { const e = exById(t.dataset.note); if (e) { e.note = t.value.trim().slice(0, 80); save(); const le = D && D.list.find(x => x.id === e.id); if (le) le.note = e.note; } }
});
document.addEventListener('keydown', ev => {
  const t = ev.target;
  if (ev.key === 'Enter' && t.dataset && t.dataset.f) { ev.preventDefault(); const ins = [...document.querySelectorAll('.sr input')]; const i = ins.indexOf(t); if (ins[i + 1]) ins[i + 1].focus(); else t.blur(); }
});
document.addEventListener('focusin', ev => { const t = ev.target; if (t.dataset && t.dataset.f) setTimeout(() => { try { t.select(); } catch (e) {} }, 0); });

/* ================= start ================= */
if (D && !D.list) D = null;
render();
try { if ('serviceWorker' in navigator && location.protocol === 'https:' && window.top === window) navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {}
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {}
})();
