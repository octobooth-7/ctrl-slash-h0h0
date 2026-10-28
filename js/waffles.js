'use strict';
/* waffles.js — diner waffle pile and whipped-cream landings */

const waffleLanders = [];
const waffleDollops = [];
let wafflePileCanvas = null;
let waffleSurface = new Float32Array(0);
let waffleFloor = 0;
let waffleArtPx = 0;
let waffleSprite = null;

function makeWaffleSprite() {
  const c = document.createElement('canvas');
  c.width = 13; c.height = 8;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  const rows = [[3, 7], [2, 8], [1, 9], [0, 10], [0, 10], [0, 10], [1, 9], [2, 8]];
  g.fillStyle = '#6b3510';
  rows.forEach(([x, r], y) => g.fillRect(x, y, r - x + 1, 1));
  g.fillStyle = '#e7a447';
  g.fillRect(2, 1, 9, 4);
  g.fillStyle = '#f7cf7f';
  g.fillRect(3, 1, 7, 1);
  g.fillStyle = '#9a531a';
  for (const x of [3, 6, 9]) g.fillRect(x, 2, 1, 1);
  g.fillStyle = '#b06a26';
  for (const x of [4, 7, 9]) g.fillRect(x, 4, 1, 1);
  g.fillStyle = '#e7a447';
  g.fillRect(2, 3, 9, 1);
  g.fillStyle = '#d99137';
  g.fillRect(1, 5, 11, 1);
  g.fillStyle = '#c27a2c';
  g.fillRect(2, 6, 9, 1);
  g.fillStyle = '#b46d25';
  g.fillRect(3, 7, 7, 1);
  return c;
}

function waffleRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawWaffle(g, sprite, x, top, rotation, px, topping = null) {
  g.save();
  g.translate(x, top + 4 * px);
  g.rotate(rotation);
  g.scale(px, px);
  g.drawImage(sprite, -6.5, -4);
  if (topping === 'butter') {
    g.fillStyle = '#c27a2c'; g.fillRect(3, -2, 4, 3);
    g.fillStyle = '#ffe283'; g.fillRect(3, -3, 4, 2);
    g.fillStyle = '#fff2b0'; g.fillRect(4, -3, 2, 1);
  } else if (topping === 'syrup') {
    g.fillStyle = '#7d360d'; g.fillRect(-3, -2, 2, 2);
    g.fillStyle = '#b95618'; g.fillRect(-2, 0, 1, 3);
    g.fillStyle = '#e79b30'; g.fillRect(-2, 0, 1, 1);
  }
  g.restore();
}

function markWaffleSurface(x, top, rotation, px) {
  const left = Math.max(0, Math.floor(x - 7 * px));
  const right = Math.min(waffleSurface.length - 1, Math.ceil(x + 7 * px));
  for (let ix = left; ix <= right; ix++) {
    const y = top + (ix - x) * Math.sin(rotation);
    if (y < waffleSurface[ix]) waffleSurface[ix] = y;
  }
}

function drawWaffleLayer(g, sprite, rng, x0, x1, top, px, options = {}) {
  const width = 13 * px;
  const step = width * 0.8;
  const count = Math.max(1, Math.ceil((x1 - x0) / step));
  const first = (x0 + x1) / 2 - (count - 1) * step / 2;
  for (let n = 0; n < count; n++) {
    const cx = first + n * step + (rng() - 0.5) * 0.45 * px;
    const y = top + (rng() - 0.5) * 0.5 * px;
    const rotation = (rng() - 0.5) * 0.14;
    const topping = options.toppings && n === options.butterAt ? 'butter' :
      options.toppings && n === options.syrupAt ? 'syrup' : null;
    drawWaffle(g, sprite, cx, y, rotation, px, topping);
    markWaffleSurface(cx, y, rotation, px);
  }
}

function resizeWafflePile() {
  waffleFloor = Math.max(0, (document.getElementById('statusbar')?.offsetTop || H) - 6);
  waffleArtPx = 8 * K;
  waffleSurface = new Float32Array(Math.ceil(W) + 1);
  waffleSurface.fill(waffleFloor - 4 * waffleArtPx);
  wafflePileCanvas = document.createElement('canvas');
  wafflePileCanvas.width = Math.max(1, Math.round(W * DPR));
  wafflePileCanvas.height = Math.max(1, Math.round(H * DPR));
  const g = wafflePileCanvas.getContext('2d');
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  g.imageSmoothingEnabled = false;

  if (!waffleSprite) waffleSprite = makeWaffleSprite();
  const seed = (Math.round(W * 73856093) ^ Math.round(H * 19349663) ^ Math.round(K * 83492791)) >>> 0;
  const rng = waffleRandom(seed);
  const px = waffleArtPx;
  g.fillStyle = '#6b3510';
  g.fillRect(0, waffleFloor - 2 * px, W, H - waffleFloor + 2 * px);

  drawWaffleLayer(g, waffleSprite, rng, 0, W, waffleFloor - 4 * px, px);
  drawWaffleLayer(g, waffleSprite, rng, W * 0.2, W * 0.8, waffleFloor - 7 * px, px);
  drawWaffleLayer(g, waffleSprite, rng, W * 0.375, W * 0.625, waffleFloor - 10 * px, px,
    { toppings: true, butterAt: 1, syrupAt: 2 });
}

function pileTop(x) {
  if (!waffleSurface.length) return H;
  return waffleSurface[Math.round(clamp(x, 0, waffleSurface.length - 1))];
}

function landBuddy(e) {
  const x = clamp(e.x, 0, W);
  const y = pileTop(x);
  const tint = e.special === 'agent' ? ['#a970ff', 0.28] :
    e.special === 'monolith' ? ['#6b3f1f', 0.25] : null;
  waffleLanders.push({ x, y, scale: e.scale, hat: e.hat, tint, t: 0, life: 1.6, c: mkCanvas(96, 96) });
  if (waffleLanders.length > 8) waffleLanders.shift();
  waffleDollops.push({ x, y, cherry: Math.random() < 1 / 3, life: rand(32, 38), max: 38 });
  if (waffleDollops.length > 14) waffleDollops.shift();

  for (let i = 0; i < 7; i++) {
    emit({
      k: 0, x: x + rand(-10, 10) * K, y: y - 2 * K,
      vx: rand(-0.7, 0.7) * S, vy: -rand(0.35, 1.1) * S,
      size: rand(2, 5) * K, color: pick([BUDDY_PAL[0], BUDDY_PAL[2], BUDDY_PAL[3]]),
      max: rand(0.35, 0.65), g: G * 0.15, drag: 1,
    });
  }
  Sfx.pop();
}

function updateWaffles(dt) {
  for (let i = waffleLanders.length - 1; i >= 0; i--) {
    const l = waffleLanders[i];
    l.t += dt; l.life -= dt;
    if (l.life <= 0) waffleLanders.splice(i, 1);
  }
  for (let i = waffleDollops.length - 1; i >= 0; i--) {
    const d = waffleDollops[i];
    d.life -= dt;
    if (d.life <= 0) waffleDollops.splice(i, 1);
  }
}

function drawWafflePile() {
  if (wafflePileCanvas) ctx.drawImage(wafflePileCanvas, 0, 0, W, H);
}

function drawWaffleDollops() {
  const px = waffleArtPx;
  const swirl = ['0011100', '0122210', '1233321', '2333332', '2233322'];
  const colors = [null, BUDDY_PAL[3], BUDDY_PAL[2], BUDDY_PAL[0]];
  for (const d of waffleDollops) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, d.life / 6);
    ctx.fillStyle = 'rgba(107,53,16,.65)';
    ctx.fillRect(d.x - 3.5 * px, d.y - 0.4 * px, 7 * px, 1.2 * px);
    for (let y = 0; y < swirl.length; y++) {
      for (let x = 0; x < swirl[y].length; x++) {
        const col = colors[Number(swirl[y][x])];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(d.x + (x - 3.5) * px, d.y - (5 - y) * px, px, px);
      }
    }
    if (d.cherry) {
      ctx.fillStyle = '#ff4f81';
      ctx.fillRect(d.x - 0.5 * px, d.y - 5.5 * px, 2 * px, 2 * px);
      ctx.fillStyle = '#79d6c1';
      ctx.fillRect(d.x + 0.5 * px, d.y - 6 * px, px, px);
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawWaffleLanders() {
  const anim = ANIMS.splat;
  for (const l of waffleLanders) {
    const k = K * l.scale;
    compose(l.c, 'splat', frameOf(anim, l.t * 1000, false), l.hat, l.tint);
    ctx.save();
    ctx.globalAlpha = Math.min(1, l.life / 0.4);
    ctx.drawImage(l.c, l.x - 48 * k, l.y - 96 * k, 96 * k, 96 * k);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
