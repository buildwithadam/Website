import React, { useEffect, useRef, useState } from "react";

/**
 * Bug Hunter DX+ is a web based MMO bug defense game with always-on online play.
 */

export default function BugHunter() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [ui, setUi] = useState({
    started: false,
    paused: false,
    muted: false,
    mode: "classic", // classic | zen | bossrush
    score: 0,
    high: Number(localStorage.getItem("bughunt-high") || 0),
    timeLeft: 60,
    presenceCount: 1,
    isFullscreen: false,
    theme: localStorage.getItem("bughunt-theme") || "cyber",
    showSettings: false,
    partyError: null,
  });

  // Theme tokens
  const THEMES = {
    cyber: { hue: 210, accent: "#60a5fa", glow: "#93c5fd" },
    sunset: { hue: 12, accent: "#fb7185", glow: "#fdba74" },
    mint: { hue: 160, accent: "#34d399", glow: "#a7f3d0" },
  };

  // Tunables
  const TOKENS = useRef({
    maxTime: 60,
    gridAlpha: 0.06,
    baseSpeed: 100,
    particleCount: 18,
    comboWindow: 650,
    dprCap: 2,
    bossEvery: 20,
    coreHP: 8,
    hazardEvery: 10,
    mutatorEvery: 22,
  });

  const stateRef = useRef({
    ctx: /** @type {CanvasRenderingContext2D|null} */ (null),
    w: 0,
    h: 0,
    dpr: 1,
    lastT: performance.now(),
    pointer: { x: 0, y: 0, down: false, touch: false },
    clicks: [],
    started: false,
    paused: false,
    ended: false,
    mode: "classic",
    timeLeft: TOKENS.current.maxTime,
    score: 0,
    high: Number(localStorage.getItem("bughunt-high") || 0),
    combo: 0,
    comboTimer: 0,
    bugs: [],
    particles: [],
    texts: [],
    shake: 0,
    audio: { ctx: null, enabled: true, music: null },
    spawnTimer: 0,
    wave: 1,
    bossTimer: TOKENS.current.bossEvery,
    powerups: [],
    slowMo: 0,
    doublePts: 0,
    bombs: 0,
    hp: 3,
    presence: { peers: new Map(), send: () => {}, destroy: () => {} },
    party: { socket: null, id: null, cursors: new Map() },
    raf: 0,
    core: { x: 0, y: 0, r: 28, hp: TOKENS.current.coreHP, max: TOKENS.current.coreHP },
    hazards: [], // {angle, dist, pulseIn}
    hazardTimer: TOKENS.current.hazardEvery,
    mutator: null, // {type, time}
    mutTimer: TOKENS.current.mutatorEvery,
    quests: initQuests(),
  });

  function initQuests() {
    return [
      { id: "combo4", label: "Reach combo 4x", done: false },
      { id: "gold3", label: "Squash 3 gold", done: false, count: 0, need: 3 },
      { id: "core5", label: "Keep core above 5 HP", done: false },
    ];
  }

  // Bootstrapping
  useEffect(() => {
    const canvas = canvasRef.current; const container = containerRef.current; if (!canvas || !container) return;
    const ctx = canvas.getContext("2d", { alpha: true }); stateRef.current.ctx = ctx;

    // Theme apply
    applyTheme(ui.theme);

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, TOKENS.current.dprCap);
      stateRef.current.w = Math.max(360, rect.width || 360);
      stateRef.current.h = Math.max(420, rect.height || 420);
      stateRef.current.dpr = dpr;
      stateRef.current.core.x = stateRef.current.w / 2;
      stateRef.current.core.y = stateRef.current.h / 2;
      canvas.style.width = `${stateRef.current.w}px`;
      canvas.style.height = `${stateRef.current.h}px`;
      canvas.width = Math.round(stateRef.current.w * dpr);
      canvas.height = Math.round(stateRef.current.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    let ro = null;
    if ("ResizeObserver" in window) { ro = new ResizeObserver(resize); ro.observe(container); } else { window.addEventListener("resize", resize); }

    // Pointer events
    const toLocal = (e) => { const rect = canvas.getBoundingClientRect(); return { x: e.clientX - rect.left, y: e.clientY - rect.top }; };
    const onMove = (e) => { const p = toLocal(e); stateRef.current.pointer = { ...stateRef.current.pointer, ...p, touch: e.pointerType === 'touch' }; };
    const onDown = (e) => {
      const p = toLocal(e); stateRef.current.pointer = { x: p.x, y: p.y, down: true, touch: e.pointerType === 'touch' };
      stateRef.current.clicks.push({ x: p.x, y: p.y, t: performance.now() });
      if (!stateRef.current.audio.ctx && stateRef.current.audio.enabled) { try { const AC = window.AudioContext || window.webkitAudioContext; stateRef.current.audio.ctx = new AC(); } catch {} }
      if (!stateRef.current.started && !stateRef.current.ended) startGame();
    };
    const onUp = () => (stateRef.current.pointer.down = false);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    // Keys
    const onKey = (e) => { if (e.repeat) return; const k = e.key.toLowerCase(); if (k === " ") { if (!stateRef.current.started || stateRef.current.ended) startGame(); } else if (k === "p") togglePause(); else if (k === "m") toggleMute(); else if (k === "r") startGame(); else if (k === "f") toggleFullscreen(); else if (k === "b") useBomb(); };
    window.addEventListener("keydown", onKey);

    // Presence (BroadcastChannel)
    setupPresence(stateRef.current, setUi);

    // MMO connection
    connectMMO().catch((e) => setUi((u) => ({ ...u, partyError: e.message || 'Online unavailable' })));

    // Party cursor heartbeat
    const heartbeat = setInterval(() => {
      const p = stateRef.current.pointer;
      sendParty({ type: 'cursor', x: p.x, y: p.y });
    }, 120);

    // Loop
    const loop = (t) => {
      const s = stateRef.current; let dt = Math.min(0.033, (t - s.lastT) / 1000 || 0.016); s.lastT = t;
      if (s.slowMo > 0) { dt *= 0.35; s.slowMo -= dt; }
      if (s.doublePts > 0) { s.doublePts -= dt; if (s.doublePts < 0) s.doublePts = 0; }
      if (s.mutator) { s.mutator.time -= dt; if (s.mutator.time <= 0) s.mutator = null; }
      if (s.started && !s.paused && !s.ended) update(dt);
      draw();
      s.raf = requestAnimationFrame(loop);
    };
    stateRef.current.raf = requestAnimationFrame(loop);

    return () => {
      if (ro) ro.disconnect(); else window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKey);
      clearInterval(heartbeat);
      cancelAnimationFrame(stateRef.current.raf);
      stateRef.current.presence.destroy();
      const ps = stateRef.current.party;
      try { ps.socket?.close(); } catch {}
      ps.cursors.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Theme apply
  function applyTheme(name) {
    const t = THEMES[name] || THEMES.cyber;
    TOKENS.current.theme = t; // store
  }

  // Lifecycle
  function startGame() {
    const s = stateRef.current; s.started = true; s.paused = false; s.ended = false; s.mode = ui.mode;
    s.timeLeft = s.mode === "classic" ? TOKENS.current.maxTime : Infinity; s.score = 0; s.combo = 0; s.comboTimer = 0; s.wave = 1; s.bossTimer = TOKENS.current.bossEvery; s.hazardTimer = TOKENS.current.hazardEvery; s.mutTimer = TOKENS.current.mutatorEvery; s.mutator = null;
    s.bugs = []; s.particles = []; s.texts = []; s.powerups = []; s.hp = 3; s.bombs = 1; s.slowMo = 0; s.doublePts = 0; s.core.hp = s.core.max;
    setUi((u) => ({ ...u, started: true, paused: false, timeLeft: Number.isFinite(s.timeLeft) ? s.timeLeft : Infinity, score: 0 }));
    startMusic();
  }
  function endGame(reason = "Time up") {
    const s = stateRef.current; s.ended = true; s.started = false; if (s.score > s.high) { s.high = s.score; localStorage.setItem("bughunt-high", String(s.score)); }
    setUi((u) => ({ ...u, started: false, paused: false, timeLeft: 0, score: s.score, high: s.high, endReason: reason }));
    stopMusic();
  }
  function togglePause() { const s = stateRef.current; if (!s.started || s.ended) return; s.paused = !s.paused; setUi((u) => ({ ...u, paused: s.paused })); setMusicPaused(s.paused); }
  function toggleMute() { const s = stateRef.current; s.audio.enabled = !s.audio.enabled; try { if (s.audio.ctx) s.audio.enabled ? s.audio.ctx.resume() : s.audio.ctx.suspend(); } catch {} setUi((u) => ({ ...u, muted: !u.muted })); }
  function toggleFullscreen() { const el = containerRef.current; if (!el) return; const fs = document.fullscreenElement != null; if (!fs) el.requestFullscreen?.(); else document.exitFullscreen?.(); setUi((u) => ({ ...u, isFullscreen: !fs })); }

  // Update
  function update(dt) {
    const s = stateRef.current;

    // Timers
    if (s.mode === "classic") { s.timeLeft -= dt; if (s.timeLeft <= 0) return endGame("Time up"); }
    setUi((u) => (u.timeLeft !== Math.ceil(s.timeLeft) || u.score !== s.score ? { ...u, timeLeft: Math.max(0, Math.ceil(s.timeLeft)), score: s.score } : u));

    // Spawning rules by mode
    let desired = 10; // baseline density
    if (s.mode === "classic") desired = 12;
    if (s.mode === "zen") desired = 9;
    if (s.mode === "bossrush") desired = 4;

    s.spawnTimer -= dt;
    if (s.mode === "bossrush") {
      if (s.spawnTimer <= 0) { s.spawnTimer = 2.6; s.bugs.push(makeBoss()); }
    } else {
      if (s.bugs.length < desired && s.spawnTimer <= 0) { s.spawnTimer = Math.max(0.08, 0.6 - s.bugs.length * 0.01); s.bugs.push(makeBug()); }
      s.bossTimer -= dt; if (s.bossTimer <= 0) { s.bossTimer = TOKENS.current.bossEvery + Math.random() * 6; s.bugs.push(makeBoss()); floatText("Boss incoming", s.w / 2 - 60, 90, "#ffd76a"); }
    }

    // Hazards
    s.hazardTimer -= dt; if (s.hazardTimer <= 0) { s.hazardTimer = TOKENS.current.hazardEvery + Math.random() * 3; spawnHazard(); }
    for (let i = s.hazards.length - 1; i >= 0; i--) { const H = s.hazards[i]; H.pulseIn -= dt; if (H.pulseIn <= 0) { s.core.hp -= 1; s.hazards.splice(i, 1); floatText("Hazard pulse", s.core.x - 40, s.core.y - 40, "#fca5a5"); screenShake(8); if (s.core.hp <= 0) return endGame("Core destroyed"); } }

    // Mutators
    s.mutTimer -= dt; if (s.mutTimer <= 0) { s.mutTimer = TOKENS.current.mutatorEvery + 4; s.mutator = { type: pick(["bigHits", "hyper", "swarm", "tiny", "richGold"]), time: 12 }; floatText(`Mutator ${s.mutator.type}`, s.w/2 - 60, 110, "#c2e9ff"); }

    // Process clicks with aim assist
    if (s.clicks.length) {
      const click = s.clicks.shift();
      const assist = s.pointer.touch ? 18 : 12; // mobile friendly
      const hitIndex = findHitIndex(click.x, click.y, assist);
      if (hitIndex >= 0) {
        const b = s.bugs[hitIndex]; b.hp -= 1; screenShake(6);
        if (navigator.vibrate) try { navigator.vibrate(15); } catch {}
        if (b.kind === "shield" && b.shieldTimer == null) b.shieldTimer = 0.4; // requires quick second hit
        if (b.shieldTimer != null) { if (b.shieldTimer > 0) { b.hp -= 1; b.shieldTimer = 0; } }
        if (b.hp <= 0) {
          s.bugs.splice(hitIndex, 1); scoreHit(b, click); spawnSplat(b, click); soundPop(220 + Math.random() * 240, 0.08); maybeDropPowerup(b);
          if (b.kind === "split") { for (let i=0;i<2;i++){ const nb = makeBug("mini"); nb.r = 10; nb.speed *= 1.6; s.bugs.push(nb); } }
          if (b.kind === "boss") { spawnMinions(b); }
          if (b.kind === "gold") { markQuest("gold3", (q)=>{ q.count=(q.count||0)+1; if(q.count>=q.need) q.done=true; }); }
        } else { floatText("Hit", b.x, b.y - b.r - 6, "#fff"); soundPop(140, 0.04); }
        if (s.comboTimer > 0) s.combo += 1; else s.combo = 1; s.comboTimer = TOKENS.current.comboWindow; if (s.combo >= 4) markQuest("combo4", q=>q.done=true);
      } else {
        s.combo = 0; s.comboTimer = 0; soundPop(90, 0.03);
      }

      // collect powerups by click proximity
      { const x = click.x, y = click.y; 
        // powerups
        for (let i = s.powerups.length - 1; i >= 0; i--) { const p = s.powerups[i]; const dx = p.x - x, dy = p.y - y; if (dx*dx + dy*dy < 26*26) { if (p.type === "bomb") s.bombs += 1; else if (p.type === "slow") s.slowMo = 4; else if (p.type === "double") s.doublePts = 6; else if (p.type === "heal") s.core.hp = Math.min(s.core.max, s.core.hp + 1); s.powerups.splice(i, 1); floatText('Pickup', x, y-10, '#c2e9ff'); break; } }
        // hazards clear
        for (let i = s.hazards.length - 1; i >= 0; i--) { const H = s.hazards[i]; const hx = s.core.x + Math.cos(H.angle)*H.dist; const hy = s.core.y + Math.sin(H.angle)*H.dist; const dx = hx - x, dy = hy - y; if (dx*dx + dy*dy < 14*14) { s.hazards.splice(i,1); s.score += 5; floatText('Disarmed +5', hx, hy-8, '#a7f3d0'); break; } }
      }

      sendParty({ type: 'click', x: click.x, y: click.y });
    }

    // Move enemies toward the core with behaviors
    for (const b of s.bugs) {
      const toCoreX = s.core.x - b.x, toCoreY = s.core.y - b.y; const dist = Math.max(1, Math.hypot(toCoreX, toCoreY));
      const spMul = (s.mutator?.type === 'hyper' ? 1.4 : 1) * (s.mutator?.type === 'tiny' ? 1.2 : 1);
      const base = b.speed * spMul;
      let vx = (toCoreX / dist) * base; let vy = (toCoreY / dist) * base;

      if (b.kind === 'fast') { /* already fast */ }
      else if (b.kind === 'tank') { /* slower by default */ }
      else if (b.kind === 'charger') { b.wind = (b.wind||0) - dt; if (b.wind <= 0) { b.wind = 1.6 + Math.random(); b.burst = 0.4; } if (b.burst>0){ b.burst -= dt; vx*=2.4; vy*=2.4; }
      }
      else if (b.kind === 'cloak') { b.cloak = Math.max(0, (b.cloak||1) - dt*0.2); }
      else if (b.kind === 'split') { /* normal until death */ }
      else if (b.kind === 'shield') { b.shieldTimer = Math.max(0, (b.shieldTimer||0)-dt); }
      else if (b.kind === 'boss') { b.phase -= dt; if (b.phase <= 0) { b.phase = 2 + Math.random() * 2; spawnMinions(b); } }

      b.x += vx * dt; b.y += vy * dt;

      // Bounds bounce
      if (b.x < b.r || b.x > s.w - b.r) { b.x = Math.max(b.r, Math.min(s.w - b.r, b.x)); }
      if (b.y < b.r || b.y > s.h - b.r) { b.y = Math.max(b.r, Math.min(s.h - b.r, b.y)); }

      // Blink
      if (Math.random() < 0.004) b.blink = 0.2; if (b.blink > 0) b.blink -= dt;

      // Hit core
      const hitCore = (b.x - s.core.x)**2 + (b.y - s.core.y)**2 <= (b.r + s.core.r) ** 2;
      if (hitCore) {
        s.core.hp -= b.dmg || 1; screenShake(b.kind==='boss'?14:6); floatText("Core hit", s.core.x - 24, s.core.y - 28, "#fca5a5");
        if (navigator.vibrate) try { navigator.vibrate([20,40,20]); } catch {}
        // splitter spawns on impact too
        if (b.kind === 'split') { for (let i=0;i<2;i++){ const nb = makeBug('mini'); nb.r = 10; nb.speed *= 1.6; s.bugs.push(nb);} }
        removeBug(b);
        if (s.core.hp <= 0) return endGame("Core destroyed");
      }
    }

    // Particles
    for (let i = s.particles.length - 1; i >= 0; i--) { const p = s.particles[i]; p.vy += 240 * dt * 0.35; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; if (p.life <= 0) s.particles.splice(i, 1); }
    for (let i = s.texts.length - 1; i >= 0; i--) { const t = s.texts[i]; t.y -= 20 * dt; t.a -= 1.2 * dt; if (t.a <= 0) s.texts.splice(i, 1); }

    // Combo decay
    if (s.combo > 0) { s.comboTimer -= dt * 1000; if (s.comboTimer <= 0) s.combo = 0; }
    if (s.shake > 0) s.shake *= 0.9;

    // Quest 3: core HP > 5 mid run
    if (!getQuest("core5").done && s.core.hp > 5) markQuest("core5", q=>q.done=true);

    // Presence ping
    s.presence.send({ score: s.score, t: Date.now() });
  }

  // Helpers
  function pick(arr){ return arr[(Math.random()*arr.length)|0]; }
  function screenShake(v){ stateRef.current.shake = Math.min(12, stateRef.current.shake + v); }
  function removeBug(b){ const s = stateRef.current; const idx = s.bugs.indexOf(b); if (idx>=0) s.bugs.splice(idx,1); }
  function markQuest(id, fn){ const q = getQuest(id); if (!q) return; fn(q); }
  function getQuest(id){ return stateRef.current.quests.find(q=>q.id===id); }

  // Aim assist: returns index of hit bug or -1
  function findHitIndex(x, y, assist=12){
    const s = stateRef.current; let best = -1; let bestD = Infinity;
    for (let i=0;i<s.bugs.length;i++){
      const b = s.bugs[i];
      const pad = assist + (b.kind==='fast'?4:0) + (b.r < 14 ? 4 : 0);
      const R = (b.r * (b.hit||1.1)) + pad;
      const dx = b.x - x, dy = b.y - y; const d2 = dx*dx + dy*dy;
      if (d2 <= R*R && d2 < bestD){ best = i; bestD = d2; }
    }
    return best;
  }

  // Entities
  function makeBug(forceKind=null) {
    const s = stateRef.current; const margin = 30; const roll = Math.random();
    const themeHue = TOKENS.current.theme?.hue ?? 210;
    let kind = forceKind || "normal", hp = 1, speed = TOKENS.current.baseSpeed, r = 16, color = `hsl(${themeHue + 140}, 90%, 55%)`, hit = 1.1, dmg = 1;
    if (!forceKind){
      if (roll > 0.86 && roll <= 0.93) { kind = "fast"; speed *= 1.8; r = 13; color = `hsl(${themeHue + 70}, 90%, 55%)`; }
      else if (roll > 0.93 && roll <= 0.965) { kind = "split"; r = 15; color = `hsl(${themeHue + 40}, 90%, 58%)`; }
      else if (roll > 0.965 && roll <= 0.985) { kind = "cloak"; r = 16; color = `hsl(${themeHue + 120}, 85%, 60%)`; }
      else if (roll > 0.985 && roll <= 0.993) { kind = "shield"; hp = 2; r = 18; color = `hsl(${themeHue + 180}, 70%, 60%)`; }
      else if (roll > 0.993 && roll <= 0.998) { kind = "gold"; speed *= 1.2; r = 15; hp = 1; color = `hsl(46, 92%, 60%)`; }
      else if (roll > 0.998) { kind = "charger"; r = 16; color = `hsl(${themeHue + 200}, 85%, 64%)`; }
      else if (roll < 0.12) { kind = "tank"; hp = 3; speed *= 0.7; r = 20; color = `hsl(${themeHue + 180}, 70%, 60%)`; dmg = 2; }
    }

    // Mutator effects
    if (stateRef.current.mutator?.type === 'tiny') { r *= 0.7; }
    if (stateRef.current.mutator?.type === 'bigHits') { hit = 1.35; }
    if (stateRef.current.mutator?.type === 'swarm') { speed *= 1.15; }
    if (stateRef.current.mutator?.type === 'richGold' && kind==='gold') { hp = 1; }

    return { kind, hp, speed, r, color, hit, dmg,
      x: margin + Math.random() * (s.w - margin * 2),
      y: margin + Math.random() * (s.h - margin * 2),
      vx: 0, vy: 0, dirT: 0, blink: 0 };
  }
  function makeBoss() { const s = stateRef.current; const r = 34; return { kind: "boss", hp: 12, speed: TOKENS.current.baseSpeed * 0.9, r, color: "#ff6ad5", hit: 1.05, x: s.w / 2, y: s.h / 2, vx: 0, vy: 0, dirT: 0, blink: 0, phase: 2.5, dmg: 3 }; }
  function spawnMinions(boss) { const s = stateRef.current; const n = 3 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) s.bugs.push(makeBug()); floatText("Minions", boss.x - 24, boss.y - boss.r - 10, "#ffd6ff"); }

  // Hazards
  function spawnHazard(){ const s=stateRef.current; const a = Math.random()*Math.PI*2; const dist = s.core.r + 110 + Math.random()*50; s.hazards.push({ angle:a, dist, pulseIn: 4 + Math.random()*2 }); }

  // Scoring and feedback
  function scoreHit(b, click) {
    const s = stateRef.current; const base = b.kind === "gold" ? 60 : b.kind === "tank" ? 25 : b.kind === "fast" ? 15 : b.kind === "boss" ? 140 : b.kind === 'shield' ? 25 : b.kind==='split'?18:10;
    if (s.comboTimer > 0) s.combo += 1; else s.combo = 1; s.comboTimer = TOKENS.current.comboWindow; const multBase = 1 + Math.min(4, Math.floor((s.combo - 1) / 2)) * 0.5; const mult = multBase * (s.doublePts > 0 ? 2 : 1); const pts = Math.round(base * mult); s.score += pts; floatText(`+${pts}${mult > 1 ? ` x${mult.toFixed(1)}` : ""}`, click.x, click.y, b.kind === "gold" ? "#ffd76a" : "#fff"); }
  function floatText(txt, x, y, color) { stateRef.current.texts.push({ txt, x, y, a: 1, color }); }
  function spawnSplat(b, click) { const s = stateRef.current; const N = TOKENS.current.particleCount + Math.floor(Math.random() * 6); for (let i = 0; i < N; i++) { const ang = (i / N) * Math.PI * 2 + Math.random() * 0.3; const spd = 60 + Math.random() * 180; s.particles.push({ x: b.x, y: b.y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, life: 0.5 + Math.random() * 0.6, color: b.kind === "gold" ? `hsla(46, 92%, ${50 + Math.random() * 20}%, 1)` : `hsla(${(TOKENS.current.theme?.hue??210) + 150}, 90%, ${45 + Math.random() * 20}%, 1)`, r: 2 + Math.random() * 2 }); } }
  function maybeDropPowerup(b) { const roll = Math.random(); if (roll < 0.12) stateRef.current.powerups.push(makePower("bomb", b.x, b.y)); else if (roll < 0.24) stateRef.current.powerups.push(makePower("slow", b.x, b.y)); else if (roll < 0.36) stateRef.current.powerups.push(makePower("double", b.x, b.y)); else if (roll < 0.44) stateRef.current.powerups.push(makePower("heal", b.x, b.y)); }
  function makePower(type, x, y) { const icon = type === "bomb" ? "💣" : type === "slow" ? "🌀" : type === "double" ? "✖" : "❤"; return { type, x, y, life: 8, seed: Math.random() * 10, icon }; }
  function useBomb() { const s = stateRef.current; if (s.bombs <= 0) return; s.bombs -= 1; soundPop(80, 0.2); const removed = s.bugs.splice(0, s.bugs.length); for (const b of removed) { spawnSplat(b, { x: b.x, y: b.y }); s.score += 2; } floatText("Bomb", s.w / 2 - 20, s.h / 2 - 24, "#fca5a5"); }

  // Music
  function startMusic(){ const s = stateRef.current; try { const ctx = s.audio.ctx || new (window.AudioContext||window.webkitAudioContext)(); s.audio.ctx = ctx; const master = ctx.createGain(); master.gain.value = 0.18; const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 1200; const bass = ctx.createOscillator(); bass.type = 'sawtooth'; const bassGain = ctx.createGain(); bassGain.gain.value = 0.02; bass.frequency.value = 55; bass.connect(bassGain).connect(lpf); const lead = ctx.createOscillator(); lead.type = 'triangle'; const leadGain = ctx.createGain(); leadGain.gain.value = 0.008; lead.frequency.value = 220; lead.connect(leadGain).connect(lpf); lpf.connect(master).connect(ctx.destination); bass.start(); lead.start(); s.audio.music = { master, lpf, bassGain, leadGain, bass, lead }; } catch {} }
  function stopMusic(){ const m = stateRef.current.audio.music; if(!m) return; try{ m.bass.stop(); m.lead.stop(); }catch{} stateRef.current.audio.music = null; }
  function setMusicPaused(p){ const ctx = stateRef.current.audio.ctx; if(!ctx) return; if(p) ctx.suspend?.(); else ctx.resume?.(); }
  // Small reactive tweak
  useEffect(()=>{ const s=stateRef.current; const m=s.audio.music; if(!m) return; const combo = Math.min(6, Math.max(0, Math.floor(s.combo/2))); const boss = s.bugs.some(b=>b.kind==='boss'); const targetFreq = boss? 2400 : 1200 + combo*300; m.lpf.frequency.setTargetAtTime(targetFreq, s.audio.ctx.currentTime, 0.2); m.leadGain.gain.setTargetAtTime(0.008 + combo*0.002, s.audio.ctx.currentTime, 0.2); }, [ui.score]);

  // Audio FX
  function soundPop(freq = 220, dur = 0.06) { const s = stateRef.current; if (!s.audio.enabled) return; const ctx = s.audio.ctx; if (!ctx) return; const now = ctx.currentTime + 0.001; const osc = ctx.createOscillator(); osc.type = "triangle"; osc.frequency.setValueAtTime(freq, now); osc.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 0.6), now + dur); const gain = ctx.createGain(); gain.gain.setValueAtTime(0.001, now); gain.gain.exponentialRampToValueAtTime(0.25, now + 0.01); gain.gain.exponentialRampToValueAtTime(0.0001, now + dur); osc.connect(gain).connect(ctx.destination); osc.start(now); osc.stop(now + dur + 0.02); }

  // Draw
  function draw() {
    const s = stateRef.current; const ctx = s.ctx; if (!ctx) return; const { w, h } = s; const hue = (TOKENS.current.theme?.hue ?? 210) + Math.sin(performance.now()*0.00025)*8;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h); grad.addColorStop(0, `hsl(${hue}, 70%, 10%)`); grad.addColorStop(1, `hsl(${hue + 30}, 70%, 14%)`); ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);

    // Subtle grid
    ctx.save(); ctx.globalAlpha = TOKENS.current.gridAlpha; ctx.strokeStyle = `hsl(${hue + 10}, 40%, 70%)`; ctx.lineWidth = 1; const grid = 44; for (let x = 0; x <= w; x += grid) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); } for (let y = 0; y <= h; y += grid) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); } ctx.restore();

    // Screen shake
    const shakeX = (Math.random() * 2 - 1) * s.shake; const shakeY = (Math.random() * 2 - 1) * s.shake; ctx.save(); ctx.translate(shakeX, shakeY);

    // Particles glow
    ctx.save(); ctx.globalCompositeOperation = "lighter"; for (const p of s.particles) { ctx.beginPath(); ctx.fillStyle = p.color; ctx.shadowBlur = 16; ctx.shadowColor = p.color; ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; } ctx.restore();

    // Hazards render
    for(const H of s.hazards){ const ax = s.core.x + Math.cos(H.angle)*H.dist; const ay = s.core.y + Math.sin(H.angle)*H.dist; H.angle += 0.7/60; const glow = TOKENS.current.theme?.glow || '#93c5fd'; ctx.save(); ctx.fillStyle = glow; ctx.shadowBlur = 12; ctx.shadowColor = glow; ctx.beginPath(); ctx.arc(ax, ay, 8, 0, Math.PI*2); ctx.fill(); ctx.restore(); // click to clear happens in update via click pass
      // small tether line
      ctx.save(); ctx.globalAlpha = 0.2; ctx.strokeStyle = glow; ctx.beginPath(); ctx.moveTo(s.core.x, s.core.y); ctx.lineTo(ax, ay); ctx.stroke(); ctx.restore(); }

    // Core
    drawCore(ctx);

    // Bugs
    for (const b of s.bugs) drawBug(ctx, b);

    // Powerups
    for (const p of s.powerups) drawPower(ctx, p);

    ctx.restore(); // end shake

    drawHud(ctx);
    if (!s.started && !s.ended) drawStart(ctx);
    if (s.paused) drawPause(ctx);
    if (s.ended) drawGameOver(ctx);

    drawPartyCursors(ctx);
    drawReticle(ctx, s.pointer.x, s.pointer.y);
    drawBottomBar();
  }

  function drawCore(ctx){ const s=stateRef.current; const glow = TOKENS.current.theme?.accent || '#60a5fa'; ctx.save(); ctx.shadowBlur = 30; ctx.shadowColor = glow; ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(s.core.x, s.core.y, s.core.r, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur=0; // HP ring
    const pct = Math.max(0, s.core.hp / s.core.max); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(s.core.x, s.core.y, s.core.r+10, -Math.PI/2, -Math.PI/2 + Math.PI*2*pct); ctx.stroke(); ctx.restore(); }

  function drawPartyCursors(ctx){ const ps = stateRef.current.party || { cursors: new Map() }; if (!ps.cursors) return; ctx.save(); ctx.font = "600 11px ui-sans-serif, system-ui"; ctx.fillStyle = "#fff"; for (const [id, c] of ps.cursors) { if (!c) continue; if (Date.now() - (c.t || 0) > 3000) continue; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(c.x, c.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 0.8; ctx.fillText(id.slice(-4), c.x + 8, c.y - 8); } ctx.restore(); }

  function drawHud(ctx) {
    const s = stateRef.current; const pad = 12; ctx.save(); const barH = 56; const r = 14; ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1; roundRect(ctx, pad, pad, s.w - pad * 2, barH, r, true, true);
    ctx.fillStyle = "#fff"; ctx.font = "600 16px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto"; ctx.textBaseline = "middle";
    ctx.fillText(`Score: ${s.score}`, pad + 16, pad + barH / 2);
    const timeTxt = s.mode === "classic" ? `Time: ${Math.max(0, Math.ceil(s.timeLeft))}s` : s.mode === 'zen' ? 'Zen' : 'Boss Rush'; const timeW = ctx.measureText(timeTxt).width; ctx.fillText(timeTxt, s.w / 2 - timeW / 2, pad + barH / 2);
    const hiTxt = `Best: ${s.high}`; const hiW = ctx.measureText(hiTxt).width; ctx.fillText(hiTxt, s.w - pad - 16 - hiW, pad + barH / 2);

    const iconY = pad + barH + 8; ctx.font = "700 18px ui-sans-serif, system-ui"; ctx.fillText(`Core: ${s.core.hp}/${s.core.max}`, pad + 16, iconY); ctx.fillText(`Bombs: ${s.bombs}`, pad + 160, iconY);

    if (s.combo > 1) { const pct = Math.max(0, Math.min(1, s.comboTimer / TOKENS.current.comboWindow)); const w = 160, h = 6; const x = s.w / 2 - w / 2; const y = iconY; ctx.fillStyle = "rgba(255,255,255,0.1)"; roundRect(ctx, x, y, w, h, 4, true, false); ctx.fillStyle = s.doublePts > 0 ? "#a7f3d0" : "#7dd3fc"; roundRect(ctx, x, y, w * pct, h, 4, true, false); ctx.fillStyle = "#c2e9ff"; ctx.font = "600 12px ui-sans-serif, system-ui"; const label = `Combo x${1 + Math.min(4, Math.floor((s.combo - 1) / 2)) * 0.5}`; const lw = ctx.measureText(label).width; ctx.fillText(label, s.w / 2 - lw / 2, y - 10); }

    for (const t of s.texts) { ctx.save(); ctx.globalAlpha = t.a; ctx.fillStyle = t.color; ctx.font = "700 16px ui-sans-serif, system-ui"; ctx.fillText(t.txt, t.x, t.y); ctx.restore(); }

    const prs = ui.presenceCount || 1; const chip = `Players online: ${prs}`; const cw = ctx.measureText(chip).width; ctx.fillText(chip, s.w - pad - 16 - cw, iconY);
    if (s.mutator) { const m = `Mutator: ${s.mutator.type}`; ctx.fillText(m, pad + 300, iconY); }
    ctx.restore();
  }

  function drawStart(ctx) { const s = stateRef.current; ctx.save(); ctx.textAlign = "center"; ctx.fillStyle = "rgba(0,0,0,0.35)"; roundRect(ctx, s.w / 2 - 280, s.h / 2 - 170, 560, 300, 18, true, false); ctx.fillStyle = "#fff"; ctx.shadowBlur = 30; ctx.shadowColor = TOKENS.current.theme?.accent || "#60a5fa"; ctx.font = "800 48px ui-sans-serif, system-ui"; ctx.fillText("BUG HUNTER DX+", s.w / 2, s.h / 2 - 70); ctx.shadowBlur = 0; ctx.font = "500 16px ui-sans-serif, system-ui"; ctx.fillText("Click or Space to start", s.w / 2, s.h / 2 - 24); ctx.fillText("P pause  M mute  R restart  F fullscreen  B bomb", s.w / 2, s.h / 2 + 4); ctx.restore(); }
  function drawPause(ctx) { const s = stateRef.current; ctx.save(); ctx.textAlign = "center"; ctx.fillStyle = "rgba(0,0,0,0.35)"; roundRect(ctx, s.w / 2 - 160, 24 + 56 + 10, 320, 86, 12, true, false); ctx.fillStyle = "#fff"; ctx.font = "700 24px ui-sans-serif, system-ui"; ctx.fillText("Paused", s.w / 2, 24 + 56 + 54); ctx.restore(); }
  function drawGameOver(ctx) { const s = stateRef.current; ctx.save(); ctx.textAlign = "center"; ctx.fillStyle = "rgba(0,0,0,0.35)"; roundRect(ctx, s.w / 2 - 320, s.h / 2 - 140, 640, 260, 18, true, false); ctx.fillStyle = "#fff"; ctx.shadowBlur = 24; ctx.shadowColor = "#34d399"; ctx.font = "800 40px ui-sans-serif, system-ui"; ctx.fillText(ui.endReason || "Game over", s.w / 2, s.h / 2 - 40); ctx.shadowBlur = 0; ctx.font = "600 18px ui-sans-serif, system-ui"; ctx.fillText(`Score: ${s.score}  Best: ${s.high}`, s.w / 2, s.h / 2 + 2); ctx.fillText("Press Space or R to play again", s.w / 2, s.h / 2 + 30); ctx.restore(); }

  function drawBug(ctx, b) {
    ctx.save(); const isCloak = b.kind === 'cloak'; const alpha = isCloak ? 0.35 : 1; ctx.globalAlpha = alpha; ctx.shadowBlur = 18; ctx.shadowColor = b.kind === "gold" ? "#ffd76a" : b.kind === "boss" ? "#ff6ad5" : b.color; ctx.fillStyle = b.kind === "gold" ? "#ffd76a" : b.kind === "boss" ? "#ff6ad5" : b.color; ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r, b.r * 0.78, 0, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; ctx.save(); ctx.globalAlpha = 0.25 * alpha; ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r * 0.4, b.r * 0.75, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); ctx.fillStyle = "#0b0f14"; ctx.beginPath(); ctx.arc(b.x, b.y - b.r * 0.9, b.r * 0.35, 0, Math.PI * 2); ctx.fill(); const eyeA = b.blink > 0 ? 0.15 : 1; ctx.globalAlpha = alpha * eyeA; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(b.x - b.r * 0.15, b.y - b.r * 1.0, b.r * 0.08, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(b.x + b.r * 0.15, b.y - b.r * 1.0, b.r * 0.08, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = alpha; ctx.fillStyle = "rgba(0,0,0,0.35)"; for (let i = -1; i <= 1; i += 2) { ctx.beginPath(); ctx.arc(b.x + i * b.r * 0.35, b.y, b.r * 0.18, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(b.x + i * b.r * 0.22, b.y + b.r * 0.28, b.r * 0.14, 0, Math.PI * 2); ctx.fill(); } ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.lineWidth = 2; for (let i = -1; i <= 1; i += 2) { ctx.beginPath(); ctx.moveTo(b.x + i * b.r * 0.5, b.y + b.r * 0.2); ctx.lineTo(b.x + i * b.r * 0.9, b.y + b.r * 0.5); ctx.lineTo(b.x + i * b.r * 1.1, b.y + b.r * 0.8); ctx.stroke(); } ctx.restore(); }
  function drawPower(ctx, p) { ctx.save(); ctx.fillStyle = "#fff"; ctx.font = "700 18px ui-sans-serif, system-ui"; ctx.globalAlpha = 0.95; ctx.fillText(p.icon, p.x, p.y); ctx.restore(); }
  function drawReticle(ctx, x, y) { const glow = TOKENS.current.theme?.glow || '#93c5fd'; ctx.save(); ctx.translate(x, y); ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 1.5; ctx.shadowBlur = 10; ctx.shadowColor = glow; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-8, 0); ctx.moveTo(8, 0); ctx.lineTo(20, 0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(0, -8); ctx.moveTo(0, 8); ctx.lineTo(0, 20); ctx.stroke(); ctx.shadowBlur = 0; ctx.restore(); }
  function roundRect(ctx, x, y, w, h, r, fill, stroke) { const rr = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + rr, y); ctx.arcTo(x + w, y, x + w, y + h, rr); ctx.arcTo(x + w, y + h, x, y + h, rr); ctx.arcTo(x, y + h, x, y, rr); ctx.arcTo(x, y, x + w, y, rr); if (fill) ctx.fill(); if (stroke) ctx.stroke(); }

  // Presence: BroadcastChannel only
  function setupPresence(s, setUi) {
    let peers = new Map(); let onTick = () => {};
    try {
      const bc = new BroadcastChannel("bughunter-presence");
      bc.onmessage = (e) => { const { id, score, t } = e.data || {}; if (!id) return; peers.set(id, { score, t }); cleanup(); push(); };
      onTick = () => bc.postMessage({ id: presenceId, score: s.score, t: Date.now() });
      s.presence.destroy = () => { try { bc.close(); } catch {} };
    } catch {}

    const presenceId = `${Math.random().toString(36).slice(2, 8)}`;
    const cleanup = () => { const cut = Date.now() - 8000; for (const [k, v] of peers) if (v.t < cut) peers.delete(k); };
    const push = () => setUi((u) => ({ ...u, presenceCount: Math.max(1, peers.size + 1) }));

    s.presence.send = () => onTick();
  }

  // MMO via WebSocket
  function partyState() { return stateRef.current.party; }
  async function connectMMO() {
    const ps = partyState();
    ps.id = Math.random().toString(36).slice(2, 8);
    const url = import.meta.env.VITE_BUGHUNTER_WS || 'wss://bughunter-mmo.fly.dev';
    const ws = new WebSocket(url);
    ps.socket = ws;
    ps.cursors = new Map();
    ws.addEventListener('open', () => {
      floatText('Connected online', stateRef.current.w / 2 - 60, 120, '#a7f3d0');
    });
    ws.addEventListener('message', (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }
      if (msg.id === ps.id) return;
      onPartyMsg(msg);
    });
    ws.addEventListener('close', () => {
      floatText('Connection lost', stateRef.current.w / 2 - 60, 120, '#fca5a5');
    });
    ws.addEventListener('error', () => {
      setUi((u) => ({ ...u, partyError: 'Connection error' }));
    });
  }
  function sendParty(msg) {
    const ps = partyState();
    if (!ps.socket || ps.socket.readyState !== WebSocket.OPEN) return;
    const out = { ...msg, id: ps.id };
    try { ps.socket.send(JSON.stringify(out)); } catch {}
  }
  function onPartyMsg(msg) {
    const ps = partyState();
    if (msg.type === 'click') {
      stateRef.current.clicks.push({ x: msg.x, y: msg.y, t: performance.now() });
    } else if (msg.type === 'cursor') {
      ps.cursors.set(msg.id, { x: msg.x, y: msg.y, t: Date.now() });
    }
  }

  // Bottom controls and UI overlays (DOM)
  function drawBottomBar(){ /* handled by DOM below */ }

  // JSX
  const theme = ui.theme;
  return (
    <div ref={containerRef} className="relative w-full h-[100dvh] bg-black select-none">
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />

      {/* Top right controls */}
      <div className="pointer-events-auto absolute right-3 top-3 flex gap-2 text-[12px] text-white/90 z-10">
        <button className="bg-white/10 hover:bg-white/20 transition rounded-full px-3 py-1" onClick={togglePause}>{ui.paused ? "Resume" : "Pause"}</button>
        <button className="bg-white/10 hover:bg-white/20 transition rounded-full px-3 py-1" onClick={toggleMute}>{ui.muted ? "Unmute" : "Mute"}</button>
        <button className="bg-white/10 hover:bg-white/20 transition rounded-full px-3 py-1" onClick={() => setUi(u=>({ ...u, showSettings: !u.showSettings }))}>Settings</button>
        <button className="bg-white/10 hover:bg-white/20 transition rounded-full px-3 py-1" onClick={toggleFullscreen}>{ui.isFullscreen ? "Exit full" : "Fullscreen"}</button>
      </div>

      {ui.partyError && (
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-3 text-[12px] text-red-400 z-10">
          {ui.partyError}
        </div>
      )}

      {/* Mode selector visible when not started */}
      {!ui.started && (
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-[10px] mt-24 flex gap-2 z-10">
          <button onClick={() => setUi((u) => ({ ...u, mode: "classic" }))} className={`rounded-full px-4 py-2 text-sm ${ui.mode === "classic" ? "bg-sky-400/30 text-white" : "bg-white/10 text-white/80"}`}>Classic 60s</button>
          <button onClick={() => setUi((u) => ({ ...u, mode: "zen" }))} className={`rounded-full px-4 py-2 text-sm ${ui.mode === "zen" ? "bg-sky-400/30 text-white" : "bg-white/10 text-white/80"}`}>Zen</button>
          <button onClick={() => setUi((u) => ({ ...u, mode: "bossrush" }))} className={`rounded-full px-4 py-2 text-sm ${ui.mode === "bossrush" ? "bg-sky-400/30 text-white" : "bg-white/10 text-white/80"}`}>Boss Rush</button>
        </div>
      )}

      {/* Bottom control bar */}
      <div className="pointer-events-auto absolute left-0 right-0 bottom-0 p-2 sm:p-3">
        <div className="mx-auto max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px] text-white/90">
          <div className="bg-white/10 rounded-xl px-3 py-2">Click to squash<br/><span className="text-white/60">B bomb  P pause</span></div>
          <div className="bg-white/10 rounded-xl px-3 py-2">F fullscreen<br/><span className="text-white/60">M mute</span></div>
          <div className="bg-white/10 rounded-xl px-3 py-2">MMO<br/><span className="text-white/60">Players {ui.presenceCount}</span></div>
          <div className="bg-white/10 rounded-xl px-3 py-2 flex items-center justify-between">
            <span>Hire Adam</span>
            <div className="flex gap-1">
              <a className="bg-emerald-400/30 hover:bg-emerald-400/40 rounded-full px-2 py-1" href="/hire-me" target="_blank" rel="noreferrer">Discuss game</a>
              <a className="bg-sky-400/30 hover:bg-sky-400/40 rounded-full px-2 py-1" href="/contact" target="_blank" rel="noreferrer">SEO help</a>
            </div>
          </div>
        </div>
      </div>

      {/* Quests display */}
      <div className="pointer-events-none absolute left-3 bottom-24 z-10 text-[12px] text-white/90 space-y-1">
        {stateRef.current.quests.map((q)=> (
          <div key={q.id} className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${q.done? 'bg-emerald-400/30' : 'bg-white/10'}`}>
            <span>{q.done ? '✓' : '•'}</span>
            <span>{q.label}{q.need? ` (${q.count||0}/${q.need})`: ''}</span>
          </div>
        ))}
      </div>

      {/* Settings drawer */}
      {ui.showSettings && (
        <div className="pointer-events-auto absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur rounded-2xl p-4 text-white/90 w-[92%] max-w-xl z-10">
          <div className="flex items-center justify-between mb-2"><div className="font-semibold">Settings</div><button className="text-white/70" onClick={()=>setUi(u=>({...u, showSettings:false}))}>Close</button></div>
          <div className="grid grid-cols-3 gap-2">
            {Object.keys(THEMES).map(name => (
              <button key={name} onClick={()=>{ localStorage.setItem('bughunt-theme', name); setUi(u=>({...u, theme:name})); applyTheme(name); }} className={`rounded-xl px-3 py-2 ${theme===name?'bg-white/20':'bg-white/10'}`}>{name}</button>
            ))}
          </div>
          <div className="mt-3 text-[12px] text-white/70">Themes change palette and glow. Saved locally.</div>
        </div>
      )}

      {/* Join flow and room invite removed for MMO mode */}
    </div>
  );
}

