/* Jahreszeiten-Styles: Winter, Herbst, Ostern, Sommer – als Pixel-Deko über der App.
   Eigenständige Zusatzdatei. Welcher Style gilt, legt der Admin für alle fest
   (Profil & Verwaltung → „Jahreszeiten-Style“). Gespeichert wird das in Supabase
   über app_v49_style_get / app_v49_style_set.
   Ganz entfernen: die Zeile mit saison.js aus index.html löschen. */
(function () {
  'use strict';
  if (window.__mvSaison) return;
  window.__mvSaison = true;

  var STYLES = ['aus', 'winter', 'herbst', 'ostern', 'sommer'];
  var LABEL = { aus: 'Aus', winter: 'Winter', herbst: 'Herbst', ostern: 'Ostern', sommer: 'Sommer' };
  var KEY = 'mv-saison';
  var style = 'aus';
  try { var saved = localStorage.getItem(KEY); if (STYLES.indexOf(saved) >= 0) style = saved; } catch (e) {}
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- Pixel-Bilder ---------- */
  var TREE = [
    '.......Y.......', '......YYY......', '.......G.......', '......GGG......', '.....GGRGG.....',
    '....WGGGGGW....', '......GGG......', '.....GGGGG.....', '....GGBGGGG....', '...GGGGGGRGG...',
    '..WWGGGGGGGWW..', '.....GGGGG.....', '....GGGGGGG....', '...GGRGGGBGG...', '..GGGGGGGGGGG..',
    '.WWGGGYGGGGGWW.', '......TTT......', '......TTT......'
  ];
  var SANTA = [
    '....RRRR....', '...RRRRRR...', '..RRRRRRRWW.', '..WWWWWWWWW.', '..SSSSSSSS..',
    '..SKSSSSKS..', '..WWSSSSWW..', '..WWWWWWWW..', '...WWWWWW...', '.RRRWWWWRRR.',
    'RRRRRWWRRRRR', 'SRRKKYYKKRRS', '.RRRRRRRRRR.', '..RRR..RRR..', '..KKK..KKK..'
  ];
  var SANTA_WAVE = [SANTA.slice(), SANTA.slice()];
  SANTA_WAVE[0][7] = '..WWWWWWWW.S'; SANTA_WAVE[0][8] = '...WWWWWW..R';
  SANTA_WAVE[1][6] = '..WWSSSSWW.S'; SANTA_WAVE[1][7] = '..WWWWWWWW.R'; SANTA_WAVE[1][8] = '...WWWWWW..R';
  for (var wi = 0; wi < 2; wi++) {
    SANTA_WAVE[wi][9] = '.RRRWWWWRRRR'; SANTA_WAVE[wi][10] = 'RRRRRWWRRRR.'; SANTA_WAVE[wi][11] = 'SRRKKYYKKRR.';
  }
  var SLEIGH = [
    '.......RRR......', '..GGG.RRRRW.....', '.GGGGGWWWW......', '.GGGGGSSSS......', '.GGGGGWWWW......',
    'RGGGGRRRRRR....R', 'RRRRRRRRRRRR..RR', 'RRRRRRRRRRRRRRR.', '.RRRRRRRRRRRRR..', '..Y....Y....Y...',
    '.YYYYYYYYYYYYYYY'
  ];
  var DEER_TOP = [
    '.........D.D.', '..........D..', '.........BBB.', '.........BBBN', 'WBBBBBBBBBB..', '.BBBBBBBBB...', '.BBBBBBBBB...'
  ];
  var DEER_LEGS = [
    ['.B.B....B.B..', '.B.B....B.B..', '.K.K....K.K..'],
    ['.B.B....B.B..', 'B...B..B...B.', 'K...K..K...K.']
  ];
  var GIFT = ['.Y.Y.', 'CCYCC', 'YYYYY', 'CCYCC', 'CCYCC'];
  var SNOWMAN = [
    '...KKK...', '..KKKKK..', '...WWW...', '..WKWKW..', '..WWOWW..', '...WWW...',
    '..RRRRR..', '.WWWWWWW.', 'WWWWKWWWW', 'WWWWWWWWW', 'WWWWKWWWW', '.WWWWWWW.'
  ];
  var BOOT = [
    '..R..G...', '.RW.GG...', 'WWWWWW...', 'WWWWWW...', '.RRRR....', '.RRRR....',
    '.RRRR....', '.RRRRR...', '.RRRRRRR.', '.RRRRRRRR', '.RRRRRRRR', '.KKKKKKKK'
  ];
  var MOON = ['..MMM..', '.MM....', 'MM.....', 'MM.....', 'MM.....', '.MM....', '..MMM..'];
  var SUN = [
    '....Y....', '.Y.....Y.', '...YYY...', '..YYYYY..', 'Y.YYYYY.Y', '..YYYYY..', '...YYY...', '.Y.....Y.', '....Y....'
  ];
  var LEAFTREE = [
    '....CCCCC....', '..CCCCCCCCC..', '.CCCcCCCCCCC.', 'CCCCCCCcCCCCC', 'CCcCCCCCCCCCC', 'CCCCCCCCCcCCC',
    'CCCCcCCCCCCCC', '.CCCCCCCcCCC.', '..CCCCCCCCC..', '....CTTTC....', '.....TTT.....', '.....TTT.....',
    '.....TTT.....', '.....TTT.....', '.....TTT.....', '....TTTTT....'
  ];
  var PUMPKIN = ['...G...', '.OOOOO.', 'OOoOoOO', 'OOoOoOO', 'OOoOoOO', '.OOOOO.'];
  var BUNNY = [
    '.W.W....', '.W.W....', '.W.W....', '.WWW....', 'WKWKW...', 'WWPWW...', '.WWWWWW.', '.WWWWWWW', '.WWWWWWW', '.WW..WW.'
  ];
  var EGG = ['.CC.', 'CCCC', 'cccc', 'CCCC', '.CC.'];
  var FLOWER = ['.P.', 'PYP', '.P.', '.G.', '.G.'];
  var BUTTERFLY = [['P.K.P', 'PPKPP', 'P.K.P'], ['..K..', '.PKP.', '..K..']];

  var TREE_COL = { G: '#2F9E5B', g: '#237A46', T: '#7A4E2D', Y: '#F6D25A', R: '#E5534B', B: '#6EA8FF', W: '#F4F6F8' };
  var LIGHT_ON = { R: '#FF8A80', B: '#B5D3FF', Y: '#FFF1A8' };
  var SANTA_COL = { R: '#D8443C', W: '#F4F6F8', S: '#F1C29B', K: '#3A3F4A', Y: '#F2C14E' };
  var SLEIGH_COL = { R: '#C93A33', W: '#F4F6F8', S: '#F1C29B', G: '#2F9E5B', Y: '#F2C14E' };
  var DEER_COL = { B: '#9A6A3C', D: '#6B4A2A', N: '#9A6A3C', K: '#3A3F4A', W: '#F4F6F8' };
  var LEAD_COL = { B: '#9A6A3C', D: '#6B4A2A', N: '#FF5A4F', K: '#3A3F4A', W: '#F4F6F8' };
  var SNOWMAN_COL = { W: '#F4F6F8', K: '#5A6170', O: '#F2994A', R: '#D8443C' };
  var BOOT_COL = { R: '#D8443C', W: '#F4F6F8', G: '#2F9E5B', K: '#5A6170' };
  /* Geschenke: Abstand vom Baum in Pixel-Einheiten (x) und Höhe über dem Boden (up). */
  var GIFTS = [
    { x: 10, up: 0, c: '#E5534B', y: '#F6D25A' }, { x: 0, up: 0, c: '#6EA8FF', y: '#F4F6F8' },
    { x: -31, up: 0, c: '#B48CF2', y: '#F6D25A' }, { x: -37, up: 0, c: '#2F9E5B', y: '#F4F6F8' },
    { x: -34, up: 5, c: '#F2994A', y: '#F4F6F8' }, { x: -43, up: 0, c: '#E5534B', y: '#F4F6F8' }
  ];
  var CARDS = '.card,.stat-card,.desk31-metric,.home-tile,.site-card,.vehicle-card,.material-card,.note-card';
  var LEAF_COLORS = ['#E0862F', '#C2611F', '#F2C14E', '#B5462B', '#9A6A3C'];
  var PETAL_COLORS = ['#F7B6D2', '#FBD3E4', '#F4F6F8'];
  var SPARK_COLORS = ['#FF8A80', '#F6D25A', '#B5D3FF', '#B48CF2', '#7BE0A6', '#F4F6F8'];

  var canvas, ctx;
  var W = 0, H = 0, px = 4, raf = 0, last = 0, lastT = 0, frame = 0, navOff = 0;
  var parts = [], stars = [], extras = [];
  var fly = null, nextFly = 0, gifts = 1, special = '';
  var snowEls = [], snowInfo = new WeakMap(), snowSeed = 0;
  var waveUntil = 0, wind = { start: 0, dur: 0, dir: 1, next: 0 }, fwNext = 0;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function snap(v) { return Math.round(v / px) * px; }

  /* ---------- Datum ---------- */
  function specialDay() {
    var n = new Date(), m = n.getMonth(), d = n.getDate();
    if (m === 11 && d === 6) return 'nikolaus';
    if ((m === 11 && d === 31) || (m === 0 && d === 1)) return 'silvester';
    return '';
  }
  /* Je näher Heiligabend rückt, desto mehr Geschenke: 1 bis 6, nach dem 26.12. keine mehr. */
  function giftCount() {
    var now = new Date(), y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
    if (m === 11 && d >= 24 && d <= 26) return GIFTS.length;
    if (m <= 1 || (m === 11 && d > 26)) return 0;
    var days = Math.ceil((new Date(y, 11, 24) - now) / 86400000);
    return Math.max(1, Math.min(GIFTS.length, GIFTS.length - Math.ceil(days / 7)));
  }

  /* ---------- Zeichnen ---------- */
  function sprite(rows, col, x, y, o) {
    o = o || {};
    var p = o.p || px;
    for (var r = 0; r < rows.length; r++) {
      var line = rows[r], n = line.length;
      for (var c = 0; c < n; c++) {
        var ch = line.charAt(c);
        if (ch === '.') continue;
        var color = col[ch];
        if (o.shade && ch === o.shade && c > n / 2) color = o.dark;
        if (o.lights && !reduce && LIGHT_ON[ch] && (Math.floor(o.lights / 600) + r + c) % 2 === 0) color = LIGHT_ON[ch];
        ctx.fillStyle = color;
        ctx.fillRect(x + (o.flip ? n - 1 - c : c) * p, y + r * p, p, p);
      }
    }
  }

  function navOffset() {
    var el = document.querySelector('.v38-bottom, .bottom-nav');
    if (!el) return 0;
    var r = el.getBoundingClientRect();
    if (r.height > 0 && r.top > H / 2 && r.top < H) return Math.round(H - r.top);
    return 0;
  }

  function makeParts() {
    parts = []; stars = []; extras = []; fly = null; nextFly = 0; fwNext = 0;
    var i, n;
    if (style === 'winter') {
      n = Math.min(130, Math.round(W * H / 11000));
      for (i = 0; i < n; i++) parts.push({ x: rnd(0, W), y: rnd(0, H), v: rnd(14, 48), ph: rnd(0, 6.28), amp: rnd(6, 20), big: Math.random() < 0.18, a: rnd(0.3, 0.85) });
      n = Math.min(40, Math.round(W / 40));
      for (i = 0; i < n; i++) stars.push({ x: snap(rnd(0, W)), y: snap(rnd(70, H * 0.45)), ph: rnd(0, 6.28) });
    } else if (style === 'herbst') {
      n = Math.min(45, Math.round(W * H / 30000));
      for (i = 0; i < n; i++) parts.push({ x: rnd(0, W), y: rnd(0, H), v: rnd(18, 40), ph: rnd(0, 6.28), amp: rnd(20, 45), col: pick(LEAF_COLORS), big: Math.random() < 0.5, a: 0.9 });
    } else if (style === 'ostern') {
      n = Math.min(40, Math.round(W * H / 32000));
      for (i = 0; i < n; i++) parts.push({ x: rnd(0, W), y: rnd(0, H), v: rnd(10, 24), ph: rnd(0, 6.28), amp: rnd(15, 35), col: pick(PETAL_COLORS), big: Math.random() < 0.3, a: 0.75 });
    } else if (style === 'sommer') {
      n = Math.min(22, Math.round(W * H / 60000));
      for (i = 0; i < n; i++) parts.push({ x: rnd(0, W), y: rnd(0, H), v: rnd(3, 8), vx: rnd(8, 20), ph: rnd(0, 6.28), amp: rnd(8, 18), col: '#F4F6F8', big: false, a: 0.5 });
    }
  }

  function windForce(t) {
    if (style !== 'winter' || reduce) return 0;
    if (!wind.next) wind.next = t + rnd(12000, 25000);
    if (t > wind.next) { wind.start = t; wind.dur = rnd(3500, 6000); wind.dir = Math.random() < 0.5 ? -1 : 1; wind.next = t + wind.dur + rnd(20000, 45000); }
    var k = (t - wind.start) / wind.dur;
    return k > 0 && k < 1 ? Math.sin(Math.PI * k) * 110 * wind.dir : 0;
  }

  function ambient(t, dt) {
    var floor = H - navOff, force = windForce(t);
    for (var i = 0; i < parts.length; i++) {
      var f = parts[i];
      f.y += f.v * dt;
      f.x += ((f.vx || 0) + force * (0.5 + f.a)) * dt;
      if (f.y > floor) { f.y = -3 * px; f.x = rnd(0, W); }
      if (f.x > W + 30) f.x = -20; else if (f.x < -30) f.x = W + 20;
      var x = snap(f.x + Math.sin(f.ph + t / 1400) * f.amp), y = snap(f.y);
      ctx.globalAlpha = f.a;
      ctx.fillStyle = f.col || '#FFFFFF';
      if (style === 'winter') {
        if (f.big) { ctx.fillRect(x, y - px, px, 3 * px); ctx.fillRect(x - px, y, 3 * px, px); }
        else ctx.fillRect(x, y, px, px);
      } else if (f.big) {
        ctx.fillRect(x, y, 2 * px, px); ctx.fillRect(x + px, y + px, 2 * px, px);
      } else {
        ctx.fillRect(x, y, px, px); ctx.fillRect(x + px, y + px, px, px);
      }
    }
    ctx.globalAlpha = 1;
  }

  function sky(t) {
    if (style === 'winter') {
      ctx.fillStyle = '#FFFFFF';
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        ctx.globalAlpha = reduce ? 0.3 : 0.18 + 0.22 * (1 + Math.sin(s.ph + t / 900)) / 2;
        ctx.fillRect(s.x, s.y, px, px);
      }
      ctx.globalAlpha = 0.6;
      sprite(MOON, { M: '#F2E9B8' }, W - 7 * px - 20, 76);
    } else if (style === 'sommer') {
      ctx.globalAlpha = 0.8;
      sprite(SUN, { Y: '#F6D25A' }, W - 9 * px - 20, 76);
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- Schnee, der auf den Karten liegen bleibt ---------- */
  function collectSnowEls() {
    if (style !== 'winter') { snowEls = []; return; }
    var list = document.querySelectorAll(CARDS), out = [], i, el;
    for (i = 0; i < list.length && out.length < 60; i++) {
      el = list[i];
      if (el.parentElement && el.parentElement.closest(CARDS)) continue;
      out.push(el);
    }
    el = document.querySelector('.v38-bottom, .bottom-nav');
    if (el) out.push(el);
    for (i = 0; i < out.length; i++) {
      if (!snowInfo.has(out[i])) snowInfo.set(out[i], { t: Date.now(), seed: ++snowSeed, nav: out[i] === el, cleared: {}, box: null });
    }
    snowEls = out;
  }
  function hash(n) {
    n = Math.imul(n ^ (n >>> 15), 2246822519);
    n = Math.imul(n ^ (n >>> 13), 3266489917);
    return (n ^ (n >>> 16)) >>> 0;
  }
  function capHeight(info, c, now) {
    var h = hash(info.seed * 7919 + (c >> 1));
    var since = info.cleared[c] || info.t;
    var age = (now - since) / 1000 - (info.cleared[c] ? 0 : (h >> 4) % 25);
    return Math.max(0, Math.floor((1 + h % 3) * Math.min(1, age / 60)));
  }
  function snowCaps() {
    if (reduce) return;
    var now = Date.now(), step = 2 * px;
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = '#F4F6F8';
    for (var i = 0; i < snowEls.length; i++) {
      var info = snowInfo.get(snowEls[i]);
      if (!info) continue;
      var r = snowEls[i].getBoundingClientRect();
      info.box = null;
      if (r.width < 120 || r.bottom < 0 || r.top > H || r.top < 4 * px) continue;
      var inset = info.nav ? 0 : 12;
      var x0 = snap(r.left + inset), cols = Math.floor((r.width - 2 * inset) / step), top = Math.round(r.top);
      info.box = { x0: x0, cols: cols, top: top };
      for (var c = 0; c < cols; c++) {
        var g = capHeight(info, c, now);
        if (g > 0) ctx.fillRect(x0 + c * step, top - g * px, step, g * px);
      }
    }
    ctx.globalAlpha = 1;
  }
  /* Mit Finger oder Maus über die Schneekante fahren: der Schnee fällt herunter. */
  function wipe(x, y) {
    if (style !== 'winter' || reduce) return;
    var now = Date.now(), step = 2 * px;
    for (var i = 0; i < snowEls.length; i++) {
      var info = snowInfo.get(snowEls[i]);
      if (!info || !info.box) continue;
      var b = info.box;
      if (y < b.top - 4 * px - 6 || y > b.top + 12) continue;
      var c0 = Math.floor((x - b.x0) / step);
      for (var c = c0 - 2; c <= c0 + 2; c++) {
        if (c < 0 || c >= b.cols) continue;
        var g = capHeight(info, c, now);
        if (g <= 0) continue;
        info.cleared[c] = now;
        if (extras.length < 400) extras.push({ kind: 'clump', x: b.x0 + c * step, y: b.top - g * px, w: step, h: g * px, vx: rnd(-12, 12), vy: rnd(10, 40) });
      }
    }
  }

  /* ---------- Fliegende und fallende Teile ---------- */
  function dropGift(x, y) {
    if (extras.length < 400) extras.push({ kind: 'gift', x: x, y: y, vx: 0, vy: 20, g: pick(GIFTS) });
  }
  function firework(t) {
    if (special !== 'silvester' || reduce) return;
    if (!fwNext) fwNext = t + 800;
    if (t < fwNext) return;
    fwNext = t + rnd(1200, 3400);
    var x = rnd(W * 0.15, W * 0.85), y = rnd(H * 0.12, H * 0.42), col = pick(SPARK_COLORS);
    var col2 = pick(SPARK_COLORS);
    for (var i = 0; i < 44 && extras.length < 400; i++) {
      var a = (i / 44) * 6.283, sp = i % 2 ? rnd(110, 170) : rnd(50, 90);
      extras.push({ kind: 'spark', x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rnd(1.4, 2.2), col: i % 2 ? col : col2 });
    }
  }
  function drawExtras(dt) {
    var floor = H - navOff;
    for (var i = extras.length - 1; i >= 0; i--) {
      var e = extras[i];
      e.vy += (e.kind === 'spark' ? 45 : 320) * dt;
      e.x += e.vx * dt; e.y += e.vy * dt;
      if (e.kind === 'spark') {
        e.life -= dt;
        if (e.life <= 0) { extras.splice(i, 1); continue; }
        ctx.globalAlpha = Math.min(1, e.life);
        ctx.fillStyle = e.col;
        ctx.fillRect(snap(e.x), snap(e.y), px, px);
        ctx.globalAlpha = Math.min(1, e.life) * 0.45;
        ctx.fillRect(snap(e.x - e.vx * 0.06), snap(e.y - e.vy * 0.06), px, px);
        e.vx *= 1 - 1.2 * dt; e.vy *= 1 - 1.2 * dt;
      } else if (e.y > floor) {
        extras.splice(i, 1);
      } else if (e.kind === 'clump') {
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = '#F4F6F8';
        ctx.fillRect(snap(e.x), snap(e.y), e.w, e.h);
      } else {
        ctx.globalAlpha = 1;
        sprite(GIFT, { C: e.g.c, Y: e.g.y }, snap(e.x), snap(e.y));
      }
    }
    ctx.globalAlpha = 1;
  }

  /* Schlitten mit zwei Rentieren, fliegt ab und zu quer über den Bildschirm. */
  var FLY_W = 46;
  function flight(t, dt) {
    if (reduce) return;
    if (!nextFly) nextFly = t + 6000;
    if (!fly) {
      if (t < nextFly) return;
      var dir = Math.random() < 0.5 ? 1 : -1;
      fly = { dir: dir, x: dir > 0 ? -FLY_W * px : W, y: Math.round(H * rnd(0.1, 0.35)), drop: rnd(W * 0.3, W * 0.7), dropped: false, x0: 0, y0: 0 };
    }
    fly.x += fly.dir * Math.max(60, W / 9) * dt;
    if (fly.x > W || fly.x < -FLY_W * px) { fly = null; nextFly = t + rnd(45000, 100000); return; }
    var flip = fly.dir < 0;
    var x0 = snap(fly.x), y0 = snap(fly.y + Math.sin(t / 700) * 3 * px);
    fly.x0 = x0; fly.y0 = y0;
    function at(off, w) { return x0 + (flip ? FLY_W - off - w : off) * px; }
    if (!fly.dropped && (fly.x - fly.drop) * fly.dir > 0) { fly.dropped = true; dropGift(at(2, 5), y0 + 6 * px); }
    var legs = DEER_LEGS[Math.floor(t / 180) % 2];
    ctx.fillStyle = '#C9A15A';
    ctx.fillRect(at(15, 19), y0 + 6 * px, 19 * px, px);
    sprite(SLEIGH, SLEIGH_COL, at(0, 16), y0, { flip: flip });
    for (var i = 0; i < 2; i++) {
      var dx = at(18 + i * 15, 13), dy = y0 + px + (Math.floor(t / 360 + i) % 2) * px;
      var col = i === 1 ? LEAD_COL : DEER_COL;
      sprite(DEER_TOP, col, dx, dy, { flip: flip });
      sprite(legs, col, dx, dy + DEER_TOP.length * px, { flip: flip });
    }
  }

  /* ---------- Szene unten rechts ---------- */
  function winterBox() {
    var gh = 2 * px, base = H - navOff - gh, treeX = W - 17 * px, santaX = treeX - 13 * px;
    var left = treeX - 26 * px;
    for (var i = 0; i < gifts; i++) left = Math.min(left, treeX + (GIFTS[i].x - 2) * px);
    return { base: base, gh: gh, treeX: treeX, santaX: santaX, left: left };
  }
  function ground(left, base, gh, top, shade) {
    ctx.fillStyle = top;
    ctx.fillRect(left, base, W - left, gh);
    ctx.fillStyle = shade;
    ctx.fillRect(left, base + px, W - left, px);
  }
  function sceneWinter(t) {
    var s = winterBox();
    ground(s.left, s.base, s.gh, '#F4F6F8', '#C9D3E2');
    ctx.fillStyle = '#F4F6F8';
    ctx.fillRect(s.left + 3 * px, s.base - px, 9 * px, px);
    ctx.fillRect(s.treeX - px, s.base - px, 14 * px, px);
    sprite(SNOWMAN, SNOWMAN_COL, s.treeX - 24 * px, s.base - SNOWMAN.length * px);
    var waving = t < waveUntil;
    var santa = waving ? SANTA_WAVE[Math.floor(t / 220) % 2] : SANTA;
    sprite(santa, SANTA_COL, s.santaX, s.base - SANTA.length * px);
    if (waving) {
      ctx.font = 'bold ' + (px * 3 + 2) + 'px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#F4F6F8';
      ctx.fillText('Ho ho ho!', s.santaX + 6 * px, s.base - (SANTA.length + 2) * px);
    }
    if (special === 'nikolaus') sprite(BOOT, BOOT_COL, s.treeX + 3 * px, s.base - BOOT.length * px);
    else sprite(TREE, TREE_COL, s.treeX, s.base - TREE.length * px, { shade: 'G', dark: TREE_COL.g, lights: t || 1 });
    for (var i = 0; i < gifts; i++) {
      var g = GIFTS[i];
      sprite(GIFT, { C: g.c, Y: g.y }, s.treeX + g.x * px, s.base - (GIFT.length + g.up) * px);
    }
  }
  function sceneLeafy(t) {
    var gh = 2 * px, base = H - navOff - gh, treeX = W - 15 * px, left = treeX - 30 * px, i;
    var treeAt = base - LEAFTREE.length * px;
    if (style === 'herbst') {
      ground(left, base, gh, '#9A6A3C', '#6B4A2A');
      for (i = 0; i < 9; i++) { ctx.fillStyle = LEAF_COLORS[i % 4]; ctx.fillRect(left + (2 + i * 5) * px, base - (i % 2) * px, 2 * px, px); }
      sprite(LEAFTREE, { C: '#E0862F', c: '#F2C14E', T: '#7A4E2D' }, treeX, treeAt, { shade: 'C', dark: '#C2611F' });
      sprite(PUMPKIN, { O: '#F2994A', o: '#D9772B', G: '#2F9E5B' }, treeX - 10 * px, base - PUMPKIN.length * px);
      sprite(PUMPKIN, { O: '#F2994A', o: '#D9772B', G: '#2F9E5B' }, treeX - 17 * px, base - PUMPKIN.length * px + px);
    } else if (style === 'ostern') {
      ground(left, base, gh, '#5DBB63', '#3F9A4B');
      sprite(LEAFTREE, { C: '#5DBB63', c: '#F7B6D2', T: '#7A4E2D' }, treeX, treeAt, { shade: 'C', dark: '#3F9A4B' });
      sprite(BUNNY, { W: '#F4F6F8', K: '#3A3F4A', P: '#F7B6D2' }, treeX - 11 * px, base - BUNNY.length * px - (reduce ? 0 : (Math.floor(t / 500) % 6 === 0 ? px : 0)));
      var eggs = [['#6EA8FF', '#F6D25A'], ['#F7B6D2', '#F4F6F8'], ['#B48CF2', '#7BE0A6']];
      for (i = 0; i < 3; i++) sprite(EGG, { C: eggs[i][0], c: eggs[i][1] }, treeX - (17 + i * 6) * px, base - EGG.length * px);
    } else {
      ground(left, base, gh, '#5DBB63', '#3F9A4B');
      sprite(LEAFTREE, { C: '#3FA654', c: '#E5534B', T: '#7A4E2D' }, treeX, treeAt, { shade: 'C', dark: '#2F8743' });
      var fl = ['#F7B6D2', '#F4F6F8', '#F2994A', '#B48CF2'];
      for (i = 0; i < 4; i++) sprite(FLOWER, { P: fl[i], Y: '#F6D25A', G: '#2F9E5B' }, treeX - (6 + i * 6) * px, base - FLOWER.length * px);
      var bx = treeX - 16 * px + (reduce ? 0 : Math.sin(t / 900) * 12 * px), by = base - 12 * px + (reduce ? 0 : Math.sin(t / 520) * 4 * px);
      sprite(BUTTERFLY[reduce ? 0 : Math.floor(t / 160) % 2], { P: '#F2994A', K: '#3A3F4A' }, snap(bx), snap(by));
    }
  }

  function draw(t, dt) {
    ctx.clearRect(0, 0, W, H);
    sky(t);
    ambient(t, dt);
    if (style === 'winter') {
      snowCaps();
      firework(t);
      flight(t, dt);
      drawExtras(dt);
      sceneWinter(t);
    } else {
      sceneLeafy(t);
    }
  }

  /* ---------- Antippen ---------- */
  function onDown(ev) {
    if (style !== 'winter') return;
    var x = ev.clientX, y = ev.clientY, s = winterBox();
    if (x >= s.santaX - px && x <= s.santaX + 13 * px && y >= s.base - 16 * px && y <= s.base + s.gh) waveUntil = lastT + 2000;
    if (fly && x >= fly.x0 - 10 && x <= fly.x0 + FLY_W * px + 10 && y >= fly.y0 - 10 && y <= fly.y0 + 12 * px + 10) dropGift(snap(x), fly.y0 + 6 * px);
    wipe(x, y);
  }
  function onMove(ev) {
    var p = ev.touches ? ev.touches[0] : ev;
    if (p) wipe(p.clientX, p.clientY);
  }

  /* ---------- Ablauf ---------- */
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    px = W < 700 ? 3 : 4;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    refresh();
    makeParts();
    if (style !== 'aus' && reduce) draw(0, 0);
  }
  function refresh() {
    navOff = navOffset();
    gifts = giftCount();
    special = style === 'winter' ? specialDay() : '';
    collectSnowEls();
  }
  function loop(t) {
    raf = 0;
    if (style === 'aus' || document.hidden) return;
    if (t - last >= 40) {
      var dt = last ? Math.min((t - last) / 1000, 0.1) : 0;
      last = t; lastT = t;
      if (++frame % 30 === 0) refresh();
      draw(t, dt);
    }
    raf = window.requestAnimationFrame(loop);
  }
  function start() {
    canvas.style.display = style === 'aus' ? 'none' : 'block';
    if (style === 'aus') { ctx.clearRect(0, 0, W, H); return; }
    if (reduce) { draw(0, 0); return; }
    last = 0;
    if (!raf) raf = window.requestAnimationFrame(loop);
  }
  function apply(next) {
    if (STYLES.indexOf(next) < 0) return;
    var changed = next !== style;
    style = next;
    try { localStorage.setItem(KEY, style); } catch (e) {}
    if (changed) { refresh(); makeParts(); start(); }
    paintAdmin();
  }

  /* ---------- Einstellung vom Server ---------- */
  var loaded = false, lastFetch = 0, busy = false;
  function signedIn() {
    try { return typeof rpc === 'function' && typeof currentUserProfile !== 'undefined' && !!currentUserProfile; } catch (e) { return false; }
  }
  function fetchStyle() {
    if (busy || !signedIn()) return;
    busy = true; lastFetch = Date.now();
    rpc('app_v49_style_get', {}).then(function (v) { loaded = true; apply(String(v || 'aus')); })
      .catch(function () {}).then(function () { busy = false; });
  }
  function tick() {
    ensureAdmin();
    if (!loaded || Date.now() - lastFetch > 300000) fetchStyle();
  }

  /* ---------- Auswahl für den Admin ---------- */
  var adminBox = null, adminMsg = null, adminBtns = {};
  function ensureAdmin() {
    var host = document.getElementById('saisonAdmin');
    if (!host || adminBox) return;
    adminBox = document.createElement('div');
    adminBox.style.cssText = 'margin-top:16px;padding:14px;background:var(--card2);border-radius:14px;border:1px solid var(--border)';
    var h = document.createElement('h3');
    h.style.cssText = 'margin:0 0 4px;font-size:15px';
    h.textContent = 'Jahreszeiten-Style';
    var sub = document.createElement('div');
    sub.className = 'muted';
    sub.style.cssText = 'font-size:12px;margin-bottom:10px';
    sub.textContent = 'Gilt für alle Nutzer der App.';
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap';
    STYLES.forEach(function (s) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = LABEL[s];
      b.addEventListener('click', function () { saveStyle(s); });
      adminBtns[s] = b;
      row.appendChild(b);
    });
    adminMsg = document.createElement('p');
    adminMsg.className = 'muted';
    adminMsg.setAttribute('role', 'status');
    adminMsg.style.cssText = 'margin:8px 0 0;font-size:12px;min-height:1em';
    adminBox.appendChild(h); adminBox.appendChild(sub); adminBox.appendChild(row); adminBox.appendChild(adminMsg);
    host.appendChild(adminBox);
    paintAdmin();
  }
  function paintAdmin() {
    STYLES.forEach(function (s) {
      var b = adminBtns[s];
      if (!b) return;
      b.className = 'btn small' + (s === style ? ' primary' : '');
      b.setAttribute('aria-pressed', s === style ? 'true' : 'false');
    });
  }
  function saveStyle(s) {
    if (typeof rpc !== 'function') return;
    adminMsg.textContent = 'Speichere …';
    rpc('app_v49_style_set', { p_style: s }).then(function () {
      loaded = true; lastFetch = Date.now();
      apply(s);
      adminMsg.textContent = 'Gespeichert: ' + LABEL[s] + '. Andere Geräte übernehmen es innerhalb von fünf Minuten.';
    }).catch(function (e) {
      adminMsg.textContent = 'Speichern fehlgeschlagen: ' + (e && e.message ? e.message : 'unbekannter Fehler');
    });
  }

  function init() {
    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:50;image-rendering:pixelated';
    ctx = canvas.getContext('2d');
    if (!ctx) return;
    document.body.appendChild(canvas);
    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('pointerdown', onDown, { capture: true, passive: true });
    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) return;
      if (Date.now() - lastFetch > 60000) fetchStyle();
      start();
    });
    window.setInterval(tick, 3000);
    tick();
    start();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
