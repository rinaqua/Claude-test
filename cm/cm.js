/*
 * Web Aqua合同会社 30秒 モーショングラフィックスCM
 * 1920x1080 / 30fps / 30.0s
 *
 * CM.draw(ctx, t) は時間 t(秒) に対して決定的にフレームを描画する。
 * 書き出し(tools/render.cjs)とブラウザでのプレビュー(index.html)の両方で使う。
 *
 * 使用している事実はすべて Web Aqua 公式サイト(web-aqua.jp)の記載に基づく。
 * 出典は README.md を参照。
 */
(function () {
  'use strict';

  const W = 1920, H = 1080;
  const JP = '"Zen Kaku Gothic New"';
  const EN = '"Montserrat"';

  const C = {
    bgTop: '#041530', bgBot: '#01060F',
    aqua: '#3FB5C8', aquaL: '#A6E6F0', blue: '#2D8FB8', brand: '#3FB5C8', deep: '#073A6B', navy: '#021026',
    white: '#F4FBFF', mute: 'rgba(214,236,255,0.62)',
  };

  // ---------------------------------------------------------------- copy
  const COPY = {
    s1a: 'あなたのホームページに、',
    s1b: 'お客様は、喜んで訪れていますか？',
    s2q: '集客できるホームページ',
    s2a: '検索にも、AIにも。',
    s2b: '見つけてもらえるホームページへ。',
    s2c: 'AI SEO ／ AI検索対策',
    s3label: '美容・健康業界の Web 戦略',
    s3law: '薬機法・景表法',
    s3seo: 'SEO',
    s3sub: '法令への配慮と、SEOによる集客を両立。',
    s3a: '売りにくい商品を、',
    s3b: '売れる仕組みへ。',
    s4h: '企画から運用まで、ずっと伴走。',
    services: [
      ['企画・制作', 'PLANNING & PRODUCTION', 'browser'],
      ['保守・管理', 'MAINTENANCE', 'cycle'],
      ['Webコンサルティング', 'CONSULTING', 'chat'],
      ['内製化支援', 'IN-HOUSE SUPPORT', 'layers'],
      ['セミナー', 'SEMINAR', 'screen'],
      ['AI開発', 'AI DEVELOPMENT', 'spark'],
    ],
    s5a: 'その日に作って、',
    s5b: 'その日に公開。',
    s5c: '編集方法のレクチャー付き',
    s5d: '1Day ホームページ',
    s5btn: '公開する',
    s5done: '公開しました',
    history: [
      ['2009', '個人事業として', '創業'],
      ['2017', 'Wix 大阪地区', 'アンバサダー'],
      ['2020', 'Wix パートナー最上位', '「Legend」取得'],
      ['2023', 'Web Aqua合同会社', '設立'],
    ],
    s6a: '年以上',
    s6b: 'ITが苦手な事業者のWebマーケティングを支援。',
    s7a: 'AIが登場しても、',
    s7b: '最後は、人と人とのつながり。',
    s8tag: 'お客様が喜んで訪れるホームページを。',
    s8co: 'Web Aqua合同会社',
    s8addr: '大阪市西区西本町',
    s8url: 'web-aqua.jp',
  };

  // ---------------------------------------------------------------- utils
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, k) => a + (b - a) * k;
  const TAU = Math.PI * 2;
  const E = {
    lin: k => k,
    outExpo: k => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k)),
    inExpo: k => (k <= 0 ? 0 : Math.pow(2, 10 * k - 10)),
    inOutExpo: k => k <= 0 ? 0 : k >= 1 ? 1 : k < 0.5 ? Math.pow(2, 20 * k - 10) / 2 : (2 - Math.pow(2, -20 * k + 10)) / 2,
    outCubic: k => 1 - Math.pow(1 - k, 3),
    inCubic: k => k * k * k,
    inOutCubic: k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    outQuint: k => 1 - Math.pow(1 - k, 5),
    outBack: k => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); },
    outElastic: k => k <= 0 ? 0 : k >= 1 ? 1 : Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * (TAU / 3)) + 1,
  };
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const font = (w, s, f) => `${w} ${s}px ${f}`;

  function aquaGrad(ctx, x0, y0, x1, y1) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, C.aquaL);
    g.addColorStop(0.45, C.aqua);
    g.addColorStop(1, C.blue);
    return g;
  }

  // 1文字ずつ動くキネティック・タイポグラフィ
  function kt(ctx, str, x, y, o) {
    const size = o.size || 80, weight = o.weight || 900, fam = o.fam || JP;
    const t = o.t, t0 = o.t0 || 0, st = o.st == null ? 0.035 : o.st, dur = o.dur || 0.6;
    const align = o.align || 'center', spacing = o.spacing || 0;
    const out = o.out == null ? null : o.out, outSt = o.outSt == null ? 0.012 : o.outSt, outDur = o.outDur || 0.35;
    if (t < t0) return null;
    ctx.save();
    ctx.font = font(weight, size, fam);
    ctx.textBaseline = 'alphabetic';
    const chars = [...str];
    const ws = chars.map(c => ctx.measureText(c).width + spacing);
    const total = ws.reduce((a, b) => a + b, 0) - spacing;
    const sx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    const mk = (c) => c === 'aqua' ? aquaGrad(ctx, sx, y - size, sx + total, y) : c;
    const base = mk(o.color || C.white);
    const hl = o.hl, hlFill = hl ? mk(o.hlColor || 'aqua') : null;
    if (o.mask) {
      ctx.beginPath();
      ctx.rect(sx - 40, y - size * 1.15, total + 80, size * 1.5);
      ctx.clip();
    }
    let cx = sx;
    for (let i = 0; i < chars.length; i++) {
      const k = clamp((t - t0 - i * st) / dur);
      const ko = out != null ? clamp((t - out - i * outSt) / outDur) : 0;
      if (k <= 0 || ko >= 1 || chars[i] === ' ') { cx += ws[i]; continue; }
      const e = E.outExpo(k), eo = E.inCubic(ko);
      let dy = (1 - e) * size * (o.mask ? 1.1 : 0.55) - eo * size * 0.45;
      let dx = 0;
      if (o.from === 'right') { dx = (1 - e) * size * 1.2; dy = 0; }
      ctx.globalAlpha = (o.alpha == null ? 1 : o.alpha) * Math.min(1, k * 2.2) * (1 - eo);
      const bl = o.noBlur ? 0 : (1 - e) * 12 + eo * 10;
      ctx.filter = bl > 0.3 ? `blur(${bl.toFixed(2)}px)` : 'none';
      const inHl = hl && i >= hl[0] && i < hl[1];
      ctx.fillStyle = inHl ? hlFill : base;
      if (o.glow || inHl) {
        ctx.shadowColor = inHl || o.color === 'aqua' ? 'rgba(63,181,200,0.55)' : 'rgba(180,240,255,0.35)';
        ctx.shadowBlur = o.glow || 28;
      } else ctx.shadowBlur = 0;
      ctx.fillText(chars[i], cx + dx, y + dy);
      cx += ws[i];
    }
    ctx.restore();
    return { x: sx, w: total };
  }

  function measure(ctx, str, w, s, f) {
    ctx.save(); ctx.font = font(w, s, f); const m = ctx.measureText(str).width; ctx.restore(); return m;
  }

  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  // パスを「線で描く」アニメーション
  function drawStroke(ctx, pathFn, p, len = 400) {
    if (p <= 0) return;
    ctx.save();
    ctx.setLineDash([len, len]);
    ctx.lineDashOffset = len * (1 - clamp(p));
    ctx.beginPath(); pathFn(ctx); ctx.stroke();
    ctx.restore();
  }

  // ---------------------------------------------------------------- icons (中心 0,0 / 約64px)
  const ICON = {
    browser(ctx) { ctx.roundRect(-30, -23, 60, 46, 7); ctx.moveTo(-30, -10); ctx.lineTo(30, -10); ctx.moveTo(-20, 2); ctx.lineTo(8, 2); ctx.moveTo(-20, 12); ctx.lineTo(18, 12); },
    cycle(ctx) {
      ctx.arc(0, 0, 22, -Math.PI * 0.15, Math.PI * 0.85); ctx.moveTo(-26, 4); ctx.lineTo(-20.5, 10.5); ctx.lineTo(-13, 5);
      ctx.moveTo(22 * Math.cos(Math.PI * 1.0), 0); ctx.arc(0, 0, 22, Math.PI * 1.0, Math.PI * 1.75); ctx.moveTo(26, -4); ctx.lineTo(20.5, -10.5); ctx.lineTo(13, -5);
    },
    chat(ctx) { ctx.roundRect(-30, -24, 60, 38, 12); ctx.moveTo(-12, 14); ctx.lineTo(-18, 26); ctx.lineTo(0, 14); ctx.moveTo(-15, -5); ctx.lineTo(15, -5); },
    layers(ctx) {
      for (let i = 0; i < 3; i++) { const y = -14 + i * 13; ctx.moveTo(-28, y); ctx.lineTo(0, y - 11); ctx.lineTo(28, y); ctx.lineTo(0, y + 11); ctx.closePath(); }
    },
    screen(ctx) { ctx.rect(-30, -24, 60, 36); ctx.moveTo(0, 12); ctx.lineTo(0, 22); ctx.moveTo(-14, 26); ctx.lineTo(0, 20); ctx.lineTo(14, 26); ctx.moveTo(-18, 2); ctx.lineTo(-6, -8); ctx.lineTo(4, -2); ctx.lineTo(18, -14); },
    spark(ctx) {
      const star = (cx, cy, r) => { ctx.moveTo(cx, cy - r); ctx.quadraticCurveTo(cx, cy, cx + r, cy); ctx.quadraticCurveTo(cx, cy, cx, cy + r); ctx.quadraticCurveTo(cx, cy, cx - r, cy); ctx.quadraticCurveTo(cx, cy, cx, cy - r); };
      star(-4, 4, 24); star(20, -18, 10);
    },
    shield(ctx) { ctx.moveTo(0, -34); ctx.lineTo(30, -22); ctx.lineTo(30, 2); ctx.bezierCurveTo(30, 22, 14, 32, 0, 38); ctx.bezierCurveTo(-14, 32, -30, 22, -30, 2); ctx.lineTo(-30, -22); ctx.closePath(); ctx.moveTo(-13, 2); ctx.lineTo(-3, 12); ctx.lineTo(15, -8); },
    chart(ctx) { ctx.moveTo(-32, 34); ctx.lineTo(34, 34); ctx.rect(-24, 10, 12, 24); ctx.rect(-4, -4, 12, 38); ctx.rect(16, -20, 12, 54); ctx.moveTo(-30, -6); ctx.lineTo(-8, -24); ctx.lineTo(4, -16); ctx.lineTo(26, -36); ctx.moveTo(14, -36); ctx.lineTo(26, -36); ctx.lineTo(26, -24); },
    search(ctx) { ctx.arc(-4, -4, 15, 0, TAU); ctx.moveTo(7, 7); ctx.lineTo(18, 18); },
    check(ctx) { ctx.moveTo(-14, 0); ctx.lineTo(-4, 10); ctx.lineTo(16, -12); },
  };

  function icon(ctx, name, x, y, p, scale = 1, color = C.aqua, lw = 3.2) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(63,181,200,0.7)'; ctx.shadowBlur = 14;
    drawStroke(ctx, ICON[name], p, 520);
    ctx.restore();
  }

  // ---------------------------------------------------------------- 共通レイヤー
  let noiseCanvases = [];
  function makeNoise() {
    const r = rng(7);
    for (let n = 0; n < 4; n++) {
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const x = c.getContext('2d'); const id = x.createImageData(256, 256);
      for (let i = 0; i < id.data.length; i += 4) {
        const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255;
      }
      x.putImageData(id, 0, 0); noiseCanvases.push(c);
    }
  }

  function bg(ctx, t, o = {}) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, o.top || C.bgTop); g.addColorStop(1, o.bot || C.bgBot);
    ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3);
    // 水中の光(コースティクス)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const gl = o.glow == null ? 0.14 : o.glow;
    for (let i = 0; i < 4; i++) {
      const x = W * (0.15 + 0.7 * (Math.sin(t * 0.21 + i * 1.7) + 1) / 2);
      const y = H * (0.2 + 0.6 * (Math.cos(t * 0.17 + i * 2.3) + 1) / 2);
      const r = 520 + 140 * Math.sin(t * 0.33 + i);
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      const col = i % 2 ? '45,143,184' : '63,181,200';
      rg.addColorStop(0, `rgba(${col},${gl})`); rg.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = rg; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.restore();
    // Webを想起させるドットグリッド
    if (o.grid !== false) {
      ctx.save();
      ctx.fillStyle = 'rgba(160,230,255,0.07)';
      const off = (t * 12) % 60;
      for (let y = -60 + off; y < H + 60; y += 60) for (let x = 30; x < W; x += 60) ctx.fillRect(x - 1, y - 1, 2, 2);
      ctx.restore();
    }
  }

  const bubbleData = (() => {
    const r = rng(42); const a = [];
    for (let i = 0; i < 46; i++) a.push({ x: r() * W, sp: 40 + r() * 110, s: 2 + r() * 7, ph: r() * TAU, off: r() * 2000 });
    return a;
  })();
  function bubbles(ctx, t, alpha = 1) {
    ctx.save();
    for (const b of bubbleData) {
      const y = H + 40 - ((t * b.sp + b.off) % (H + 80));
      const x = b.x + Math.sin(t * 1.1 + b.ph) * 18;
      ctx.globalAlpha = alpha * 0.35 * clamp(y / 300);
      ctx.strokeStyle = C.aquaL; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(x, y, b.s, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(200,250,255,0.5)';
      ctx.beginPath(); ctx.arc(x - b.s * 0.35, y - b.s * 0.35, b.s * 0.25, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  function ripple(ctx, x, y, t, t0, o = {}) {
    const n = o.n || 5, life = o.life || 2.2, maxR = o.maxR || 1100;
    ctx.save();
    for (let i = 0; i < n; i++) {
      const tt = t - t0 - i * (o.gap || 0.13);
      if (tt < 0 || tt > life) continue;
      const k = tt / life;
      const r = maxR * E.outCubic(k) * (1 - i * 0.07) + 4;
      ctx.globalAlpha = (1 - k) * (o.alpha || 0.9) * (1 - i * 0.12);
      ctx.strokeStyle = i === 0 ? C.aquaL : C.aqua;
      ctx.lineWidth = (o.lw || 3) * (1 - k * 0.6);
      ctx.shadowColor = C.aqua; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.ellipse(x, y, r, r * (o.flat || 1), 0, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }

  function chip(ctx, text, x, y, t, t0, o = {}) {
    const k = E.outBack(prog(t, t0, t0 + 0.5));
    if (k <= 0) return;
    const size = o.size || 30;
    const w = measure(ctx, text, o.weight || 700, size, o.fam || JP) + (o.pad || 34) * 2, h = size * 1.9;
    ctx.save();
    ctx.globalAlpha = clamp(prog(t, t0, t0 + 0.25)) * (o.alpha == null ? 1 : o.alpha);
    ctx.translate(x, y); ctx.scale(k, k);
    rrect(ctx, -w / 2, -h / 2, w, h, h / 2);
    if (o.fill) { ctx.fillStyle = o.fillColor || aquaGrad(ctx, -w / 2, 0, w / 2, 0); ctx.shadowColor = 'rgba(63,181,200,0.6)'; ctx.shadowBlur = 30; ctx.fill(); ctx.shadowBlur = 0; }
    else { ctx.fillStyle = 'rgba(63,181,200,0.08)'; ctx.fill(); ctx.strokeStyle = 'rgba(63,181,200,0.85)'; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.fillStyle = o.textColor || (o.fill ? C.navy : C.aquaL);
    ctx.font = font(o.weight || 700, size, o.fam || JP);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, size * 0.04);
    ctx.restore();
  }

  function glass(ctx, x, y, w, h, r, a = 1) {
    ctx.save();
    ctx.globalAlpha *= a;
    rrect(ctx, x, y, w, h, r);
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(1, 'rgba(255,255,255,0.03)');
    ctx.fillStyle = g; ctx.fill();
    const s = ctx.createLinearGradient(x, y, x + w, y + h);
    s.addColorStop(0, 'rgba(166,230,240,0.75)'); s.addColorStop(0.5, 'rgba(63,181,200,0.18)'); s.addColorStop(1, 'rgba(45,143,184,0.5)');
    ctx.strokeStyle = s; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();
  }

  function speedLines(ctx, cx, cy, t, t0, o = {}) {
    const k = prog(t, t0, t0 + (o.life || 0.7));
    if (k <= 0 || k >= 1) return;
    const r = rng(o.seed || 3);
    ctx.save();
    ctx.strokeStyle = C.aquaL; ctx.lineCap = 'round';
    for (let i = 0; i < (o.n || 28); i++) {
      const a = r() * TAU, len = 80 + r() * 220, d0 = 160 + r() * 200;
      const d = d0 + E.outExpo(k) * (500 + r() * 400);
      ctx.globalAlpha = (1 - k) * 0.8; ctx.lineWidth = 1 + r() * 3;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.6);
      ctx.lineTo(cx + Math.cos(a) * (d + len * (1 - k)), cy + Math.sin(a) * (d + len * (1 - k)) * 0.6);
      ctx.stroke();
    }
    ctx.restore();
  }

  function sparks(ctx, x, y, t, t0, o = {}) {
    const life = o.life || 1.2, k = (t - t0) / life;
    if (k <= 0 || k >= 1) return;
    const r = rng(o.seed || 11);
    ctx.save();
    for (let i = 0; i < (o.n || 26); i++) {
      const a = r() * TAU, sp = (o.speed || 700) * (0.4 + r() * 0.8), g = o.gravity == null ? 900 : o.gravity;
      const tt = k * life;
      const px = x + Math.cos(a) * sp * tt * (1 - k * 0.4);
      const py = y + Math.sin(a) * sp * tt * (1 - k * 0.4) + 0.5 * g * tt * tt;
      ctx.globalAlpha = (1 - k);
      ctx.fillStyle = i % 3 ? C.aqua : C.white;
      ctx.beginPath(); ctx.arc(px, py, (1 - k) * (2 + r() * 4), 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  // 液体ワイプ(帯状の波が画面を覆って抜ける)
  function waveBand(ctx, t, tc, angle, d = 0.34) {
    if (t < tc - d - 0.2 || t > tc + d + 0.25) return;
    const L = 2300;
    const layers = [
      { col: C.deep, lead: 0.12 },
      { col: C.aqua, lead: 0.06 },
      { col: C.blue, lead: 0.0 },
    ];
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.rotate(angle);
    for (let li = 0; li < layers.length; li++) {
      const Ly = layers[li];
      const kIn = E.inCubic(prog(t, tc - d - Ly.lead, tc - Ly.lead * 0.3));
      const kOut = E.outCubic(prog(t, tc + Ly.lead * 0.6, tc + d + Ly.lead * 0.6));
      const ext = (Math.abs(Math.sin(angle)) > 0.5 ? W : H) / 2 + 150;
      const top = lerp(ext, -ext, kIn);
      const bot = lerp(ext, -ext, kOut);
      if (bot - top < 1) continue;
      const wv = (x, base, ph) => base + Math.sin(x * 0.0042 + t * 7 + ph) * 38 + Math.sin(x * 0.011 - t * 5 + ph * 1.7) * 16 + x * 0.06;
      ctx.beginPath();
      for (let x = -L / 2; x <= L / 2; x += 40) ctx.lineTo(x, wv(x, top, li));
      for (let x = L / 2; x >= -L / 2; x -= 40) ctx.lineTo(x, wv(x, bot, li + 3));
      ctx.closePath();
      ctx.fillStyle = Ly.col;
      if (li > 0) { ctx.shadowColor = 'rgba(63,181,200,0.7)'; ctx.shadowBlur = 40; } else ctx.shadowBlur = 0;
      ctx.fill();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- シーン
  // S1: 0.0–3.5  水滴 → 問いかけ
  function s1(ctx, t) {
    bg(ctx, t, { glow: 0.06 + 0.1 * prog(t, 0.6, 1.6) });
    bubbles(ctx, t, prog(t, 0.8, 2));
    const tImp = 0.62, cx = W / 2, cy = 560;
    if (t < tImp) {
      const k = prog(t, 0.08, tImp);
      const y = lerp(-80, cy, k * k);
      ctx.save();
      const tr = ctx.createLinearGradient(cx, y - 260 * k, cx, y);
      tr.addColorStop(0, 'rgba(63,181,200,0)'); tr.addColorStop(1, 'rgba(166,230,240,0.55)');
      ctx.strokeStyle = tr; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, y - 260 * k); ctx.lineTo(cx, y - 20); ctx.stroke();
      ctx.translate(cx, y);
      ctx.shadowColor = C.aqua; ctx.shadowBlur = 30;
      ctx.fillStyle = aquaGrad(ctx, -14, -30, 14, 16);
      ctx.beginPath(); ctx.moveTo(0, -34); ctx.bezierCurveTo(8, -18, 16, -6, 16, 4); ctx.arc(0, 4, 16, 0, Math.PI); ctx.bezierCurveTo(-16, -6, -8, -18, 0, -34); ctx.fill();
      ctx.restore();
    }
    // 着水フラッシュ
    const fk = prog(t, tImp, tImp + 0.5);
    if (fk > 0 && fk < 1) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 700);
      rg.addColorStop(0, `rgba(180,236,244,${0.7 * (1 - fk)})`); rg.addColorStop(1, 'rgba(63,181,200,0)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    ripple(ctx, cx, cy, t, tImp, { n: 6, life: 2.6, maxR: 1250, gap: 0.12 });
    sparks(ctx, cx, cy, t, tImp, { n: 30, life: 0.9, speed: 820, gravity: 1400, seed: 5 });
    // 問いかけ
    kt(ctx, COPY.s1a, W / 2, 470, { t, t0: 1.0, size: 62, weight: 700, color: C.mute, out: 3.05, mask: true });
    kt(ctx, COPY.s1b, W / 2, 610, { t, t0: 1.45, size: 96, weight: 900, hl: [5, 11], st: 0.04, out: 3.1, mask: true });
  }

  // S2: 3.5–7.5  検索 → AI SEO
  const netNodes = (() => { const r = rng(9); const a = []; for (let i = 0; i < 52; i++) a.push({ x: r() * W, y: r() * H, vx: (r() - 0.5) * 40, vy: (r() - 0.5) * 30, s: 1.5 + r() * 2.5 }); return a; })();
  function network(ctx, t, a) {
    if (a <= 0) return;
    const pts = netNodes.map(n => ({ x: n.x + n.vx * t, y: n.y + n.vy * t, s: n.s }));
    ctx.save();
    ctx.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.hypot(dx, dy);
      if (d < 250) { ctx.strokeStyle = `rgba(63,181,200,${(1 - d / 250) * 0.28 * a})`; ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke(); }
    }
    ctx.fillStyle = C.aquaL;
    for (const p of pts) { ctx.globalAlpha = 0.6 * a; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  function s2(ctx, t) {
    const u = t - 3.5;
    bg(ctx, t, { glow: 0.16 });
    network(ctx, t, prog(u, 1.6, 2.4));
    // 検索バー
    const bw = lerp(120, 1080, E.outExpo(prog(u, 0.05, 0.55))), bh = 120;
    const dive = E.inExpo(prog(u, 1.62, 2.05));
    if (dive < 1) {
      ctx.save();
      ctx.globalAlpha = (1 - dive) * clamp(prog(u, 0, 0.2));
      ctx.translate(W / 2, H / 2); ctx.scale(1 + dive * 1.8, 1 + dive * 1.8); ctx.translate(-W / 2, -H / 2);
      const x = W / 2 - bw / 2, y = H / 2 - bh / 2;
      ctx.save(); ctx.shadowColor = 'rgba(63,181,200,0.45)'; ctx.shadowBlur = 50; glass(ctx, x, y, bw, bh, bh / 2); ctx.restore();
      const press = prog(u, 1.5, 1.62);
      if (press > 0) { ctx.save(); ctx.globalAlpha *= (1 - press) * 0.6 + 0.2; rrect(ctx, x, y, bw, bh, bh / 2); ctx.fillStyle = 'rgba(63,181,200,0.35)'; ctx.fill(); ctx.restore(); }
      if (bw > 400) {
        icon(ctx, 'search', x + 70, H / 2, prog(u, 0.3, 0.7), 1.2);
        const n = Math.floor(clamp((u - 0.4) / 1.05) * [...COPY.s2q].length);
        const typed = [...COPY.s2q].slice(0, n).join('');
        ctx.font = font(500, 50, JP); ctx.fillStyle = C.white; ctx.textBaseline = 'middle';
        ctx.fillText(typed, x + 130, H / 2 + 2);
        const cw = ctx.measureText(typed).width;
        if (Math.floor(u * 3.2) % 2 === 0 || (u > 0.4 && u < 1.45)) { ctx.fillStyle = C.aqua; ctx.fillRect(x + 136 + cw, H / 2 - 28, 4, 56); }
        // 送信ボタン
        const bx = x + bw - 62;
        ctx.save(); ctx.fillStyle = aquaGrad(ctx, bx - 40, 0, bx + 40, 0); ctx.shadowColor = C.aqua; ctx.shadowBlur = 24;
        ctx.beginPath(); ctx.arc(bx, H / 2, 40 * (1 - press * 0.15), 0, TAU); ctx.fill(); ctx.restore();
        ctx.strokeStyle = C.navy; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(bx - 14, H / 2); ctx.lineTo(bx + 14, H / 2); ctx.moveTo(bx + 2, H / 2 - 12); ctx.lineTo(bx + 14, H / 2); ctx.lineTo(bx + 2, H / 2 + 12); ctx.stroke();
      }
      ctx.restore();
    }
    // AI SEO
    const zoomIn = 1 + 0.05 * E.outCubic(prog(u, 1.9, 4));
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(zoomIn, zoomIn); ctx.translate(-W / 2, -H / 2);
    icon(ctx, 'spark', W / 2, 262, prog(u, 1.95, 2.6), 1.6);
    kt(ctx, COPY.s2a, W / 2, 480, { t, t0: 5.4, size: 132, weight: 900, hl: [5, 9], st: 0.05 });
    kt(ctx, COPY.s2b, W / 2, 610, { t, t0: 5.95, size: 64, weight: 700, st: 0.03 });
    chip(ctx, COPY.s2c, W / 2, 740, t, 6.35, { size: 34 });
    ctx.restore();
    waveBand(ctx, t, 7.5, -Math.PI / 2);
  }

  // S3: 7.5–11.5  美容・健康業界 × 薬機法・景表法 × SEO → 売れる仕組み
  function s3(ctx, t) {
    const u = t - 7.5;
    bg(ctx, t, { glow: 0.12, top: '#051a3a' });
    chip(ctx, COPY.s3label, W / 2, 196, t, 7.6, { size: 30, alpha: 1 - prog(u, 2.0, 2.3) });
    // Part A
    const sep = E.inCubic(prog(u, 1.95, 2.3));
    if (sep < 1) {
      ctx.save();
      ctx.globalAlpha = 1 - sep;
      const inL = E.outExpo(prog(u, 0.15, 0.75)), inR = E.outExpo(prog(u, 0.55, 1.15));
      // 左: 薬機法・景表法
      ctx.save(); ctx.translate(lerp(-300, 0, inL) - sep * 260, 0); ctx.globalAlpha *= clamp(inL * 1.5);
      icon(ctx, 'shield', 540, 440, prog(u, 0.2, 0.9), 1.7);
      kt(ctx, COPY.s3law, 540, 640, { t, t0: 7.75, size: 88, weight: 900, st: 0.03, noBlur: true });
      ctx.restore();
      // ×
      const xk = E.outBack(prog(u, 0.45, 0.9));
      ctx.save(); ctx.translate(W / 2, 560); ctx.rotate((1 - xk) * Math.PI); ctx.scale(xk, xk);
      ctx.strokeStyle = C.aqua; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.shadowColor = C.aqua; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.moveTo(-34, -34); ctx.lineTo(34, 34); ctx.moveTo(34, -34); ctx.lineTo(-34, 34); ctx.stroke();
      ctx.restore();
      // 右: SEO
      ctx.save(); ctx.translate(lerp(300, 0, inR) + sep * 260, 0); ctx.globalAlpha *= clamp(inR * 1.5);
      icon(ctx, 'chart', 1380, 440, prog(u, 0.6, 1.3), 1.7);
      kt(ctx, COPY.s3seo, 1380, 648, { t, t0: 8.15, size: 124, weight: 900, fam: EN, color: 'aqua', st: 0.06, noBlur: true, glow: 26 });
      ctx.restore();
      kt(ctx, COPY.s3sub, W / 2, 850, { t, t0: 8.55, size: 50, weight: 700, color: C.white, st: 0.022, mask: true });
      ctx.restore();
    }
    // Part B
    const slam = 10.2;
    kt(ctx, COPY.s3a, W / 2, 440, { t, t0: 9.85, size: 92, weight: 900, color: C.mute, st: 0.035, mask: true });
    if (t >= slam) {
      const k = E.outExpo(prog(t, slam, slam + 0.5));
      ctx.save();
      ctx.translate(W / 2, 640); const sc = lerp(1.9, 1, k); ctx.scale(sc, sc); ctx.translate(-W / 2, -640);
      ctx.globalAlpha = clamp(prog(t, slam, slam + 0.12));
      ctx.filter = k < 0.98 ? `blur(${((1 - k) * 14).toFixed(1)}px)` : 'none';
      kt(ctx, COPY.s3b, W / 2, 680, { t, t0: slam, size: 176, weight: 900, color: 'aqua', st: 0, dur: 0.01, noBlur: true, glow: 44 });
      ctx.restore();
      // シャイン
      const sh = prog(t, slam + 0.35, slam + 1.0);
      if (sh > 0 && sh < 1) {
        ctx.save();
        ctx.font = font(900, 176, JP);
        const tw = ctx.measureText(COPY.s3b).width;
        ctx.beginPath(); ctx.rect(W / 2 - tw / 2, 500, tw, 220); ctx.clip();
        ctx.globalCompositeOperation = 'lighter';
        const sx = lerp(W / 2 - tw / 2 - 200, W / 2 + tw / 2 + 200, sh);
        const g = ctx.createLinearGradient(sx - 120, 0, sx + 120, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.fillText(COPY.s3b, W / 2 - tw / 2, 680);
        ctx.restore();
      }
      speedLines(ctx, W / 2, 620, t, slam, { n: 36, seed: 8 });
      ripple(ctx, W / 2, 620, t, slam, { n: 3, life: 1.3, maxR: 1100, flat: 0.45, lw: 2.5 });
    }
  }

  // S4: 11.5–15.0  サービス
  function s4(ctx, t) {
    const u = t - 11.5;
    bg(ctx, t, { glow: 0.13 });
    const push = 1 + 0.035 * E.inOutCubic(prog(u, 0, 3.5));
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(push, push); ctx.translate(-W / 2, -H / 2);
    kt(ctx, COPY.s4h, W / 2, 250, { t, t0: 11.55, size: 74, weight: 900, hl: [9, 15], st: 0.03, mask: true });
    const tw = 470, th = 216, gap = 36, x0 = (W - (tw * 3 + gap * 2)) / 2, y0 = 356;
    COPY.services.forEach((sv, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const ts = 11.85 + i * 0.12;
      const k = prog(t, ts, ts + 0.6);
      if (k <= 0) return;
      const e = E.outBack(k);
      const x = x0 + col * (tw + gap), y = y0 + row * (th + gap);
      ctx.save();
      ctx.globalAlpha = clamp(k * 2.5);
      ctx.translate(x + tw / 2, y + th / 2 + (1 - e) * 90);
      ctx.scale(lerp(0.86, 1, e), lerp(0.86, 1, e));
      ctx.translate(-tw / 2, -th / 2);
      glass(ctx, 0, 0, tw, th, 28);
      // アイコン円
      ctx.save();
      const cg = ctx.createRadialGradient(90, th / 2, 0, 90, th / 2, 64);
      cg.addColorStop(0, 'rgba(63,181,200,0.28)'); cg.addColorStop(1, 'rgba(63,181,200,0.02)');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(90, th / 2, 60, 0, TAU); ctx.fill();
      ctx.restore();
      icon(ctx, sv[2], 90, th / 2, prog(t, ts + 0.15, ts + 0.85), 1.05);
      const avail = tw - 176 - 28;
      const lsz = Math.min(44, 44 * avail / measure(ctx, sv[0], 900, 44, JP));
      ctx.font = font(900, lsz, JP); ctx.fillStyle = C.white; ctx.textBaseline = 'alphabetic';
      ctx.fillText(sv[0], 176, th / 2 + 4);
      ctx.letterSpacing = '2px';
      const esz = Math.min(17, 17 * avail / (measure(ctx, sv[1], 600, 17, EN) + sv[1].length * 2));
      ctx.font = font(600, esz, EN); ctx.fillStyle = 'rgba(63,181,200,0.85)';
      ctx.fillText(sv[1], 178, th / 2 + 46);
      ctx.letterSpacing = '0px';
      // シャイン
      const sh = prog(t, 13.35 + (col + row) * 0.1, 13.95 + (col + row) * 0.1);
      if (sh > 0 && sh < 1) {
        ctx.save(); rrect(ctx, 0, 0, tw, th, 28); ctx.clip();
        ctx.globalCompositeOperation = 'lighter';
        const sx = lerp(-200, tw + 200, sh);
        const g = ctx.createLinearGradient(sx - 90, 0, sx + 90, th);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(180,236,244,0.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, tw, th);
        ctx.restore();
      }
      ctx.restore();
    });
    ctx.restore();
    waveBand(ctx, t, 15, 0);
  }

  // S5: 15.0–19.0  1Day
  function s5(ctx, t) {
    const u = t - 15;
    bg(ctx, t, { glow: 0.14 });
    // クロックリング
    const cx = 520, cy = 410, R = 238;
    const ring = E.inOutCubic(prog(u, 0.2, 2.8));
    const rin = E.outExpo(prog(u, 0, 0.6));
    ctx.save();
    ctx.globalAlpha = rin;
    ctx.translate(cx, cy); ctx.scale(lerp(0.6, 1, rin), lerp(0.6, 1, rin));
    ctx.strokeStyle = 'rgba(166,230,240,0.12)'; ctx.lineWidth = 16;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * TAU - Math.PI / 2, on = i / 24 <= ring + 0.001;
      ctx.strokeStyle = on ? 'rgba(166,230,240,0.9)' : 'rgba(166,230,240,0.25)';
      ctx.lineWidth = i % 6 === 0 ? 4 : 2;
      const r0 = R + 26, r1 = R + (i % 6 === 0 ? 46 : 38);
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); ctx.stroke();
    }
    if (ring > 0) {
      ctx.strokeStyle = aquaGrad(ctx, -R, -R, R, R); ctx.lineWidth = 16; ctx.lineCap = 'round';
      ctx.shadowColor = C.aqua; ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.arc(0, 0, R, -Math.PI / 2, -Math.PI / 2 + ring * TAU); ctx.stroke();
      const ha = -Math.PI / 2 + ring * TAU;
      ctx.fillStyle = C.white; ctx.shadowBlur = 40;
      ctx.beginPath(); ctx.arc(Math.cos(ha) * R, Math.sin(ha) * R, 13, 0, TAU); ctx.fill();
    }
    ctx.restore();
    // 1Day
    const k1 = E.outExpo(prog(u, 0.15, 0.8));
    if (k1 > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(k1 * 1.5);
      ctx.translate(cx, cy + 50); const sc = lerp(1.6, 1, k1); ctx.scale(sc, sc);
      ctx.filter = k1 < 0.98 ? `blur(${((1 - k1) * 16).toFixed(1)}px)` : 'none';
      ctx.font = font(900, 150, EN); ctx.textAlign = 'center';
      ctx.fillStyle = aquaGrad(ctx, -200, -120, 200, 0); ctx.shadowColor = 'rgba(63,181,200,0.6)'; ctx.shadowBlur = 40;
      ctx.fillText('1Day', 0, 0);
      ctx.restore();
    }
    kt(ctx, COPY.s5a, cx, 800, { t, t0: 15.55, size: 66, weight: 900, st: 0.035, mask: true });
    kt(ctx, COPY.s5b, cx, 892, { t, t0: 15.95, size: 66, weight: 900, color: 'aqua', st: 0.035, mask: true });
    kt(ctx, COPY.s5c, cx, 972, { t, t0: 16.45, size: 30, weight: 700, color: C.mute, st: 0.02 });

    // ブラウザモック
    const bk = E.outExpo(prog(u, 0.25, 0.9));
    const bx = 1000, by = 170, bw = 790, bh = 640;
    ctx.save();
    ctx.globalAlpha = bk; ctx.translate(lerp(160, 0, bk), 0);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 20;
    rrect(ctx, bx, by, bw, bh, 22); ctx.fillStyle = 'rgba(6,28,58,0.92)'; ctx.fill(); ctx.restore();
    glass(ctx, bx, by, bw, bh, 22);
    ['#ff6b6b', '#ffd166', '#2EE6F0'].forEach((c, i) => { ctx.fillStyle = c; ctx.globalAlpha = bk * 0.85; ctx.beginPath(); ctx.arc(bx + 34 + i * 26, by + 30, 7, 0, TAU); ctx.fill(); });
    ctx.globalAlpha = bk;
    rrect(ctx, bx + 130, by + 16, 540, 28, 14); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.moveTo(bx, by + 60); ctx.lineTo(bx + bw, by + 60); ctx.stroke();
    const pop = (tt, fn) => {
      const k = prog(u, tt, tt + 0.45); if (k <= 0) return;
      const e = E.outBack(k);
      ctx.save(); ctx.globalAlpha = bk * clamp(k * 3); fn(e); ctx.restore();
    };
    const cxB = bx + 30, cw = bw - 60;
    pop(0.55, e => { rrect(ctx, cxB, by + 80, 130 * e, 26, 6); ctx.fillStyle = aquaGrad(ctx, cxB, 0, cxB + 130, 0); ctx.fill(); for (let i = 0; i < 4; i++) { rrect(ctx, cxB + cw - 380 + i * 96, by + 88, 70 * e, 10, 5); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill(); } });
    pop(0.8, e => {
      const hy = by + 128, hh = 226;
      ctx.save(); ctx.translate(bx + bw / 2, hy + hh / 2); ctx.scale(e, e); ctx.translate(-(bx + bw / 2), -(hy + hh / 2));
      rrect(ctx, cxB, hy, cw, hh, 14); ctx.save(); ctx.clip();
      const g = ctx.createLinearGradient(cxB, hy, cxB + cw, hy + hh); g.addColorStop(0, '#1F6F8F'); g.addColorStop(1, '#3FB5C8'); ctx.fillStyle = g; ctx.fillRect(cxB, hy, cw, hh);
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.moveTo(cxB, hy + hh);
      for (let x = 0; x <= cw; x += 20) ctx.lineTo(cxB + x, hy + hh - 60 - Math.sin(x * 0.012 + t * 3) * 18); ctx.lineTo(cxB + cw, hy + hh); ctx.fill();
      ctx.restore(); ctx.restore();
    });
    pop(1.05, e => { rrect(ctx, cxB + 40, by + 178, 380 * e, 30, 8); ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill(); rrect(ctx, cxB + 40, by + 224, 270 * e, 16, 8); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill(); });
    pop(1.25, e => { rrect(ctx, cxB + 40, by + 268, 150 * e, 42, 21); ctx.fillStyle = C.white; ctx.fill(); });
    for (let i = 0; i < 3; i++) pop(1.45 + i * 0.14, e => {
      const w = (cw - 40) / 3, x = cxB + i * (w + 20), y = by + 376;
      ctx.save(); ctx.translate(x + w / 2, y + 80); ctx.scale(e, e); ctx.translate(-(x + w / 2), -(y + 80));
      rrect(ctx, x, y, w, 160, 12); ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fill();
      rrect(ctx, x + 14, y + 14, w - 28, 72, 8); ctx.fillStyle = 'rgba(63,181,200,0.35)'; ctx.fill();
      rrect(ctx, x + 14, y + 102, w * 0.7, 12, 6); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
      rrect(ctx, x + 14, y + 126, w * 0.45, 10, 5); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill();
      ctx.restore();
    });
    pop(1.95, e => { rrect(ctx, cxB, by + 560, cw * e, 50, 10); ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill(); });
    ctx.restore();

    // 公開ボタン + カーソル
    const px = 1395, py = 890, pressT = 2.8;
    const bkk = E.outBack(prog(u, 2.1, 2.5));
    if (bkk > 0) {
      const pressed = u >= pressT;
      const squash = pressed ? 1 + 0.12 * Math.sin(clamp((u - pressT) / 0.3) * Math.PI) * (1 - clamp((u - pressT) / 0.3)) - 0.06 * (1 - clamp((u - pressT) / 0.08)) : 1;
      const label = pressed ? COPY.s5done : COPY.s5btn;
      ctx.save();
      ctx.translate(px, py); ctx.scale(bkk * squash, bkk * squash);
      const w = pressed ? 380 : 300, h = 84;
      rrect(ctx, -w / 2, -h / 2, w, h, h / 2);
      if (pressed) { ctx.fillStyle = aquaGrad(ctx, -w / 2, 0, w / 2, 0); ctx.shadowColor = C.aqua; ctx.shadowBlur = 50; ctx.fill(); ctx.shadowBlur = 0; }
      else { ctx.fillStyle = 'rgba(63,181,200,0.1)'; ctx.fill(); ctx.strokeStyle = C.aqua; ctx.lineWidth = 3; ctx.stroke(); }
      ctx.font = font(900, 38, JP); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = pressed ? C.navy : C.aquaL;
      ctx.fillText(label, pressed ? 24 : 0, 2);
      if (pressed) { ctx.translate(-w / 2 + 62, 0); icon(ctx, 'check', 0, 0, prog(u, pressT, pressT + 0.3), 1.3, C.navy, 5); }
      ctx.restore();
      // カーソル
      const ck = E.inOutCubic(prog(u, 2.2, 2.72));
      if (u < 3.4) {
        const mx = lerp(1720, px + 40, ck), my = lerp(1080, py + 12, ck);
        const clickS = u >= pressT - 0.06 && u < pressT + 0.12 ? 0.85 : 1;
        ctx.save(); ctx.translate(mx, my); ctx.scale(clickS * 1.3, clickS * 1.3);
        ctx.globalAlpha = 1 - prog(u, 3.1, 3.4);
        ctx.fillStyle = C.white; ctx.strokeStyle = C.navy; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 34); ctx.lineTo(9, 26); ctx.lineTo(16, 40); ctx.lineTo(22, 37); ctx.lineTo(15, 24); ctx.lineTo(26, 24); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      ripple(ctx, px, py, t, 15 + pressT, { n: 3, life: 1.2, maxR: 520, lw: 3 });
      sparks(ctx, px, py, t, 15 + pressT, { n: 34, life: 1.1, speed: 900, gravity: 1100, seed: 21 });
    }
  }

  // S6: 19.0–23.0  歩み → 15年以上
  function s6(ctx, t) {
    const u = t - 19;
    bg(ctx, t, { glow: 0.12, top: '#04173a' });
    const tlOut = E.inCubic(prog(u, 2.05, 2.45));
    if (tlOut < 1) {
      ctx.save();
      ctx.globalAlpha = 1 - tlOut;
      ctx.translate(lerp(50, -50, prog(u, 0, 2.4)), -tlOut * 120);
      ctx.font = font(800, 22, EN); ctx.letterSpacing = '10px'; ctx.fillStyle = C.aqua;
      ctx.globalAlpha *= clamp(prog(u, 0.05, 0.4)); ctx.fillText('SINCE 2009', 160, 220); ctx.letterSpacing = '0px';
      ctx.globalAlpha = 1 - tlOut;
      const ly = 560, lk = E.inOutCubic(prog(u, 0.0, 1.5));
      const lg = ctx.createLinearGradient(160, 0, 1760, 0); lg.addColorStop(0, 'rgba(63,181,200,0.1)'); lg.addColorStop(0.5, C.aqua); lg.addColorStop(1, 'rgba(45,143,184,0.3)');
      ctx.strokeStyle = lg; ctx.lineWidth = 3; ctx.shadowColor = C.aqua; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.moveTo(160, ly); ctx.lineTo(lerp(160, 1760, lk), ly); ctx.stroke(); ctx.shadowBlur = 0;
      COPY.history.forEach((h, i) => {
        const nx = 330 + i * 420, tt = 0.25 + i * 0.36;
        const k = prog(u, tt, tt + 0.5);
        if (k <= 0) return;
        const e = E.outBack(k);
        ctx.save();
        ctx.fillStyle = C.navy; ctx.strokeStyle = C.aqua; ctx.lineWidth = 4; ctx.shadowColor = C.aqua; ctx.shadowBlur = 24;
        ctx.beginPath(); ctx.arc(nx, ly, 14 * e, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = C.aquaL; ctx.beginPath(); ctx.arc(nx, ly, 5 * e, 0, TAU); ctx.fill();
        ctx.restore();
        ripple(ctx, nx, ly, t, 19 + tt, { n: 2, life: 0.8, maxR: 90, lw: 2 });
        // 年(ロールアップ)
        ctx.save();
        ctx.beginPath(); ctx.rect(nx - 200, 400, 400, 110); ctx.clip();
        ctx.globalAlpha = clamp(k * 2);
        ctx.font = font(800, 92, EN); ctx.textAlign = 'center'; ctx.fillStyle = i === 3 ? aquaGrad(ctx, nx - 140, 420, nx + 140, 500) : C.white;
        ctx.fillText(h[0], nx, 500 + (1 - E.outExpo(k)) * 110);
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = clamp((k - 0.2) * 2);
        ctx.textAlign = 'center';
        ctx.font = font(700, 32, JP); ctx.fillStyle = C.mute; ctx.fillText(h[1], nx, 636 + (1 - E.outExpo(k)) * 20);
        ctx.font = font(900, 38, JP); ctx.fillStyle = C.white; ctx.fillText(h[2], nx, 688 + (1 - E.outExpo(k)) * 30);
        ctx.restore();
      });
      ctx.restore();
    }
    // 15年以上
    if (u >= 2.25) {
      const k = E.outExpo(prog(u, 2.25, 2.95));
      const n = Math.round(15 * E.outCubic(prog(u, 2.25, 2.85)));
      ctx.save();
      const numW = measure(ctx, '15', 900, 300, EN), subW = measure(ctx, COPY.s6a, 900, 104, JP);
      const total = numW + 24 + subW, sx = W / 2 - total / 2;
      ctx.globalAlpha = clamp(k * 1.5);
      ctx.translate(W / 2, 560); const sc = lerp(1.35, 1, k); ctx.scale(sc, sc); ctx.translate(-W / 2, -560);
      ctx.font = font(900, 300, EN); ctx.textAlign = 'right';
      ctx.fillStyle = aquaGrad(ctx, sx, 360, sx + numW, 640); ctx.shadowColor = 'rgba(63,181,200,0.55)'; ctx.shadowBlur = 50;
      ctx.fillText(String(n), sx + numW, 640);
      ctx.restore();
      kt(ctx, COPY.s6a, sx + numW + 24, 632, { t, t0: 21.45, size: 104, weight: 900, align: 'left', st: 0.06, mask: true });
      kt(ctx, COPY.s6b, W / 2, 800, { t, t0: 21.65, size: 52, weight: 700, color: C.white, hl: [0, 6], st: 0.018, mask: true });
      speedLines(ctx, W / 2, 540, t, 21.25, { n: 30, seed: 17 });
    }
    // 暗転
    const f = prog(u, 3.7, 4.0);
    if (f > 0) { ctx.fillStyle = `rgba(1,6,15,${f})`; ctx.fillRect(0, 0, W, H); }
  }

  // S7: 23.0–26.5  人と人とのつながり
  const dust = (() => { const r = rng(77); const a = []; for (let i = 0; i < 70; i++) a.push({ x: r() * W, y: r() * H, vx: (r() - 0.5) * 16, vy: -6 - r() * 14, s: 0.8 + r() * 2.2 }); return a; })();
  function s7(ctx, t) {
    const u = t - 23;
    bg(ctx, t, { glow: 0.07, top: '#031027', bot: '#010409' });
    const fin = prog(u, 0, 0.35);
    const meet = 3.5, my = 690;
    const k = E.inOutCubic(prog(u, 0.2, meet));
    const A = { x: lerp(-60, W / 2 - 6, k), y: my + Math.sin(u * 2.2) * 30 * (1 - k) };
    const B = { x: lerp(W + 60, W / 2 + 6, k), y: my - Math.sin(u * 2.0 + 1) * 30 * (1 - k) };
    // コンステレーション
    ctx.save();
    const pts = dust.map(d => ({ x: d.x + d.vx * u, y: d.y + d.vy * u, s: d.s }));
    for (const p of pts) {
      for (const L of [A, B]) {
        const dd = Math.hypot(p.x - L.x, p.y - L.y);
        if (dd < 320) { ctx.strokeStyle = `rgba(63,181,200,${(1 - dd / 320) * 0.4 * fin})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(L.x, L.y); ctx.stroke(); }
      }
      ctx.fillStyle = `rgba(200,245,255,${0.55 * fin})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, TAU); ctx.fill();
    }
    // 2つの光
    const dAB = B.x - A.x;
    ctx.globalCompositeOperation = 'lighter';
    for (const L of [A, B]) {
      const rg = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, 160);
      rg.addColorStop(0, `rgba(235,250,252,${0.95 * fin})`); rg.addColorStop(0.12, `rgba(150,225,238,${0.6 * fin})`); rg.addColorStop(1, 'rgba(63,181,200,0)');
      ctx.fillStyle = rg; ctx.fillRect(L.x - 160, L.y - 160, 320, 320);
    }
    // 引き合う光の糸
    if (dAB < 1400) {
      const a = (1 - dAB / 1400) * fin;
      ctx.strokeStyle = `rgba(166,230,240,${a * 0.8})`; ctx.lineWidth = 2 + a * 2;
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.quadraticCurveTo(W / 2, my - 60 * (1 - k), B.x, B.y); ctx.stroke();
    }
    ctx.restore();
    kt(ctx, COPY.s7a, W / 2, 360, { t, t0: 23.3, size: 60, weight: 700, color: C.mute, out: 25.95, mask: true });
    kt(ctx, COPY.s7b, W / 2, 500, { t, t0: 23.8, size: 98, weight: 900, hl: [4, 13], st: 0.05, out: 26.0, mask: true });
  }

  // S8: 26.5–30.0  エンドカード(ブランドカラー + 公式ロゴ)
  let logoWhite = null;
  function s8(ctx, t) {
    const u = t - 26.5;
    const ox = W / 2, oy = 690;
    bg(ctx, t, { glow: 0.2, top: '#062a52', bot: '#020a18' });
    // ブランドアクアが波紋の中心から広がる
    const R = 2300 * E.outCubic(prog(u, 0.0, 0.8));
    ctx.save();
    ctx.beginPath(); ctx.arc(ox, oy, R, 0, TAU); ctx.clip();
    const ag = ctx.createRadialGradient(W / 2, 470, 0, W / 2, 470, 1250);
    ag.addColorStop(0, '#52C3D4'); ag.addColorStop(0.55, C.brand); ag.addColorStop(1, '#2A97AB');
    ctx.fillStyle = ag; ctx.fillRect(0, 0, W, H);
    // 水面の光
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const x = W * (0.2 + 0.6 * (Math.sin(t * 0.4 + i * 2.1) + 1) / 2), y = H * (0.25 + 0.5 * (Math.cos(t * 0.33 + i * 1.3) + 1) / 2);
      const rg = ctx.createRadialGradient(x, y, 0, x, y, 480);
      rg.addColorStop(0, 'rgba(255,255,255,0.10)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = rg; ctx.fillRect(x - 480, y - 480, 960, 960);
    }
    ctx.globalCompositeOperation = 'source-over';
    // 白い波紋と泡
    ctx.save();
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 6; i++) {
      const tt = u - 0.2 - i * 0.28; if (tt < 0) continue;
      const k = (tt % 3.2) / 3.2, r = 60 + 1500 * E.outCubic(k);
      ctx.strokeStyle = `rgba(255,255,255,${(1 - k) * 0.9})`; ctx.lineWidth = 2.5 * (1 - k) + 0.5;
      ctx.beginPath(); ctx.arc(ox, oy, r, 0, TAU); ctx.stroke();
    }
    ctx.restore();
    for (const b of bubbleData) {
      const y = H + 40 - ((t * b.sp + b.off) % (H + 80)), x = b.x + Math.sin(t * 1.1 + b.ph) * 18;
      ctx.globalAlpha = 0.35 * clamp(y / 300); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.arc(x, y, b.s, 0, TAU); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    // 広がる縁の白いリング
    if (R > 0 && R < 2300) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 8; ctx.shadowColor = '#fff'; ctx.shadowBlur = 40;
      ctx.beginPath(); ctx.arc(ox, oy, R, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    // フラッシュ
    const fk = prog(u, 0, 0.5);
    if (fk < 1) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const rg = ctx.createRadialGradient(ox, oy, 0, ox, oy, 900);
      rg.addColorStop(0, `rgba(255,255,255,${(1 - fk) * 0.9})`); rg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H); ctx.restore();
    }

    const drift = 1 + 0.02 * prog(u, 0.6, 3.5);
    ctx.save();
    ctx.translate(W / 2, 520); ctx.scale(drift, drift); ctx.translate(-W / 2, -520);
    // 公式ロゴ: 筆記体を書くように左から右へ現れる
    if (logoWhite) {
      const lw = 1150, lh = lw * logoWhite.height / logoWhite.width, lx = (W - lw) / 2, ly = 290;
      const k = E.inOutCubic(prog(u, 0.45, 1.55));
      if (k > 0) {
        const ex = lx - 60 + (lw + 120) * k;
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, ex, H); ctx.clip();
        const sc = lerp(1.04, 1, E.outCubic(prog(u, 0.45, 1.8)));
        ctx.translate(W / 2, ly + lh / 2); ctx.scale(sc, sc); ctx.translate(-W / 2, -(ly + lh / 2));
        ctx.shadowColor = 'rgba(10,70,90,0.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 8;
        ctx.drawImage(logoWhite, lx, ly, lw, lh);
        ctx.restore();
        // ペン先の光
        if (k < 1) {
          const py = ly + lh * (0.5 + 0.18 * Math.sin(k * 18));
          ctx.save();
          const pg = ctx.createRadialGradient(ex, py, 0, ex, py, 90);
          pg.addColorStop(0, 'rgba(255,255,255,0.9)'); pg.addColorStop(0.25, 'rgba(255,255,255,0.35)'); pg.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = pg; ctx.fillRect(ex - 90, py - 90, 180, 180);
          ctx.restore();
        }
        // 書き終わりのきらめき
        const gk = prog(u, 1.55, 2.3);
        if (gk > 0 && gk < 1) {
          ctx.save(); ctx.globalAlpha = Math.sin(gk * Math.PI) * 0.6; ctx.globalCompositeOperation = 'lighter';
          ctx.filter = 'blur(14px)'; ctx.drawImage(logoWhite, lx, ly, lw, lh); ctx.restore();
        }
      }
    }
    kt(ctx, COPY.s8tag, W / 2, 668, { t, t0: 27.55, size: 56, weight: 900, color: C.white, st: 0.028, mask: true });
    ctx.restore();
    // 区切り線
    const lk = E.outExpo(prog(u, 1.4, 2.0));
    if (lk > 0) {
      const lg = ctx.createLinearGradient(W / 2 - 300, 0, W / 2 + 300, 0);
      lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,0.9)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = lg; ctx.fillRect(W / 2 - 300 * lk, 722, 600 * lk, 2);
    }
    kt(ctx, COPY.s8co, W / 2, 792, { t, t0: 27.95, size: 42, weight: 900, color: C.white, st: 0.025, mask: true });
    kt(ctx, COPY.s8addr, W / 2, 838, { t, t0: 28.1, size: 28, weight: 700, color: 'rgba(255,255,255,0.88)', st: 0.02 });
    chip(ctx, COPY.s8url, W / 2, 930, t, 28.25, { size: 40, fam: EN, weight: 800, fill: true, fillColor: '#FFFFFF', textColor: '#1F8196', pad: 50 });
  }

  // ---------------------------------------------------------------- 合成
  const SCENES = [
    [0, 3.5, s1], [3.5, 7.5, s2], [7.5, 11.5, s3], [11.5, 15, s4],
    [15, 19, s5], [19, 23, s6], [23, 26.5, s7], [26.5, 30.5, s8],
  ];
  const sceneAt = (t) => SCENES.find(s => t >= s[0] && t < s[1]) || SCENES[SCENES.length - 1];

  function drawScene(ctx, fn, t, sc = 1, a = 1) {
    ctx.save();
    ctx.globalAlpha = a;
    if (sc !== 1) { ctx.translate(W / 2, H / 2); ctx.scale(sc, sc); ctx.translate(-W / 2, -H / 2); }
    fn(ctx, t);
    ctx.restore();
  }

  function post(ctx, t) {
    // ビネット
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
    const va = t >= 26.5 ? lerp(0.6, 0.16, prog(t, 26.5, 27.2)) : 0.6;
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,3,10,${va})`);
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    // フィルムグレイン
    if (noiseCanvases.length) {
      const f = Math.floor(t * 30);
      const nc = noiseCanvases[f % 4];
      ctx.save();
      ctx.globalAlpha = 0.045; ctx.globalCompositeOperation = 'overlay';
      const pat = ctx.createPattern(nc, 'repeat');
      const r = rng(f + 1);
      ctx.translate(-r() * 256, -r() * 256);
      ctx.fillStyle = pat; ctx.fillRect(0, 0, W + 256, H + 256);
      ctx.restore();
    }
  }

  function draw(ctx, t) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, W, H);
    const cur = sceneAt(t);

    // S3 → S4 : ズームスルー
    const zc = 11.5, zd = 0.32;
    // S5 → S6 : 波紋サークルリビール
    const cc = 19, cd = 0.7;
    if (t >= zc - zd && t < zc) {
      const k = E.inExpo(prog(t, zc - zd, zc));
      drawScene(ctx, s3, t, 1 + k * 2.2, 1);
      ctx.fillStyle = `rgba(225,246,250,${k * 0.9})`; ctx.fillRect(0, 0, W, H);
    } else if (t >= zc && t < zc + zd) {
      const k = E.outExpo(prog(t, zc, zc + zd));
      drawScene(ctx, s4, t, lerp(0.7, 1, k), 1);
      ctx.fillStyle = `rgba(225,246,250,${(1 - k) * 0.9})`; ctx.fillRect(0, 0, W, H);
    } else if (t >= cc && t < cc + cd) {
      const k = E.inOutCubic(prog(t, cc, cc + cd));
      drawScene(ctx, s5, t);
      const ox = 1395, oy = 890, R = k * 2300;
      ctx.save();
      ctx.beginPath(); ctx.arc(ox, oy, R, 0, TAU); ctx.clip();
      drawScene(ctx, s6, t);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = C.aquaL; ctx.lineWidth = 10 * (1 - k) + 2; ctx.shadowColor = C.aqua; ctx.shadowBlur = 40;
      ctx.beginPath(); ctx.arc(ox, oy, R, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 0.5; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ox, oy, R * 0.86, 0, TAU); ctx.stroke();
      ctx.restore();
    } else {
      drawScene(ctx, cur[2], t);
    }
    // S1 → S2 の液体ワイプ(S1側でも描く)
    if (t < 3.5) waveBand(ctx, t, 3.5, 0);
    if (t >= 3.5 && t < 4.2) waveBand(ctx, t, 3.5, 0);
    // S2→S3 / S4→S5 はシーン内 + 次シーン側
    if (t >= 7.5 && t < 8.2) waveBand(ctx, t, 7.5, -Math.PI / 2);
    if (t >= 15 && t < 15.7) waveBand(ctx, t, 15, 0);
    // S6 → S7 : 暗転明け
    if (t >= 23 && t < 23.3) { ctx.fillStyle = `rgba(1,6,15,${1 - prog(t, 23, 23.3)})`; ctx.fillRect(0, 0, W, H); }

    post(ctx, t);
    ctx.restore();
  }

  async function ready() {
    const all = Object.values(COPY).flat(3).join('') + '0123456789SINCEWebAquaDay';
    const loads = [];
    for (const w of [500, 700, 900]) loads.push(document.fonts.load(font(w, 40, JP), all));
    for (const w of [600, 800, 900]) loads.push(document.fonts.load(font(w, 40, EN), 'Web Aqua 1Day SEO SINCE 2009 2017 2020 2023 15 web-aqua.jp PLANNING & PRODUCTION MAINTENANCE CONSULTING IN-HOUSE SUPPORT SEMINAR AI DEVELOPMENT'));
    await Promise.all(loads);
    await document.fonts.ready;
    makeNoise();
    const img = new Image();
    img.src = (window.CM_ASSET_BASE || '') + 'assets/webaqua-logo.png';
    await img.decode();
    // 透過PNGを白抜きにする(アクア背景用)
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, c.width, c.height);
    logoWhite = c;
  }

  window.CM = { draw, ready, W, H, DURATION: 30, FPS: 30 };
})();
