/* Wintermodus: Pixel-Schnee, Tannenbaum und Weihnachtsmann.
   Eigenständige Zusatzdatei – ändert nichts an der App selbst.
   Ab und zu fliegt der Schlitten mit Rentieren vorbei.
   Ein-/Ausschalten: unten rechts auf den Tannenbaum tippen.
   Ganz entfernen: die Zeile mit winter.js aus index.html löschen. */
(function () {
  'use strict';
  if (window.__mvWinter) return;
  window.__mvWinter = true;

  var KEY = 'mv-wintermodus';
  var on = true;
  try { on = localStorage.getItem(KEY) !== 'aus'; } catch (e) {}
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var TREE = [
    '.......Y.......',
    '......YYY......',
    '.......G.......',
    '......GGG......',
    '.....GGRGG.....',
    '....WGGGGGW....',
    '......GGG......',
    '.....GGGGG.....',
    '....GGBGGGG....',
    '...GGGGGGRGG...',
    '..WWGGGGGGGWW..',
    '.....GGGGG.....',
    '....GGGGGGG....',
    '...GGRGGGBGG...',
    '..GGGGGGGGGGG..',
    '.WWGGGYGGGGGWW.',
    '......TTT......',
    '......TTT......'
  ];
  var SANTA = [
    '....RRRR....',
    '...RRRRRR...',
    '..RRRRRRRWW.',
    '..WWWWWWWWW.',
    '..SSSSSSSS..',
    '..SKSSSSKS..',
    '..WWSSSSWW..',
    '..WWWWWWWW..',
    '...WWWWWW...',
    '.RRRWWWWRRR.',
    'RRRRRWWRRRRR',
    'SRRKKYYKKRRS',
    '.RRRRRRRRRR.',
    '..RRR..RRR..',
    '..KKK..KKK..'
  ];
  var FLAKE = [
    '...W...',
    '.W.W.W.',
    '..WWW..',
    'WWWWWWW',
    '..WWW..',
    '.W.W.W.',
    '...W...'
  ];
  var SLEIGH = [
    '.......RRR......',
    '..GGG.RRRRW.....',
    '.GGGGGWWWW......',
    '.GGGGGSSSS......',
    '.GGGGGWWWW......',
    'RGGGGRRRRRR....R',
    'RRRRRRRRRRRR..RR',
    'RRRRRRRRRRRRRRR.',
    '.RRRRRRRRRRRRR..',
    '..Y....Y....Y...',
    '.YYYYYYYYYYYYYYY'
  ];
  var DEER_TOP = [
    '.........D.D.',
    '..........D..',
    '.........BBB.',
    '.........BBBN',
    'WBBBBBBBBBB..',
    '.BBBBBBBBB...',
    '.BBBBBBBBB...'
  ];
  var DEER_LEGS = [
    ['.B.B....B.B..', '.B.B....B.B..', '.K.K....K.K..'],
    ['.B.B....B.B..', 'B...B..B...B.', 'K...K..K...K.']
  ];
  var SLEIGH_COL = { R: '#C93A33', W: '#F4F6F8', S: '#F1C29B', G: '#2F9E5B', Y: '#F2C14E' };
  var DEER_COL = { B: '#9A6A3C', D: '#6B4A2A', N: '#9A6A3C', K: '#3A3F4A', W: '#F4F6F8' };
  var LEAD_COL = { B: '#9A6A3C', D: '#6B4A2A', N: '#FF5A4F', K: '#3A3F4A', W: '#F4F6F8' };
  var TREE_COL = { G: '#2F9E5B', g: '#237A46', T: '#7A4E2D', Y: '#F6D25A', R: '#E5534B', B: '#6EA8FF', W: '#F4F6F8' };
  var SANTA_COL = { R: '#D8443C', W: '#F4F6F8', S: '#F1C29B', K: '#3A3F4A', Y: '#F2C14E' };
  var LIGHT_ON = { R: '#FF8A80', B: '#B5D3FF', Y: '#FFF1A8' };

  var canvas, ctx, button;
  var W = 0, H = 0, px = 4, flakes = [], raf = 0, last = 0, frame = 0, navOff = 0;
  var fly = null, nextFly = 0;

  function navOffset() {
    var el = document.querySelector('.v38-bottom, .bottom-nav');
    if (!el) return 0;
    var r = el.getBoundingClientRect();
    if (r.height > 0 && r.top > H / 2 && r.top < H) return Math.round(H - r.top);
    return 0;
  }

  function makeFlakes() {
    var n = Math.min(130, Math.round(W * H / 11000));
    flakes = [];
    for (var i = 0; i < n; i++) {
      flakes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        v: 14 + Math.random() * 34,
        ph: Math.random() * 6.28,
        amp: 6 + Math.random() * 14,
        big: Math.random() < 0.18,
        a: 0.3 + Math.random() * 0.55
      });
    }
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    px = W < 700 ? 3 : 4;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    navOff = navOffset();
    makeFlakes();
    placeButton();
    if (!on) drawOff(); else if (reduce) draw(0, 0);
  }

  function sceneBox() {
    var gh = 2 * px;
    var base = H - navOff - gh;
    var treeX = W - 17 * px;
    var santaX = treeX - 13 * px;
    return { base: base, gh: gh, treeX: treeX, santaX: santaX, left: santaX - 2 * px };
  }

  function placeButton() {
    var s = sceneBox();
    button.style.bottom = navOff + 'px';
    if (on) {
      button.style.width = Math.max(44, 17 * px) + 'px';
      button.style.height = Math.max(44, 20 * px) + 'px';
    } else {
      button.style.width = '44px';
      button.style.height = '44px';
    }
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
    button.title = on ? 'Wintermodus ausschalten' : 'Wintermodus einschalten';
    button.setAttribute('aria-label', button.title);
    return s;
  }

  function sprite(rows, col, x, y, t, flip) {
    var tick = Math.floor(t / 600);
    for (var r = 0; r < rows.length; r++) {
      var line = rows[r];
      var n = line.length;
      for (var c = 0; c < n; c++) {
        var ch = line.charAt(c);
        if (ch === '.') continue;
        var color = col[ch];
        if (col === TREE_COL) {
          if (ch === 'G' && c > 7) color = col.g;
          if (!reduce && LIGHT_ON[ch] && (tick + r + c) % 2 === 0) color = LIGHT_ON[ch];
        }
        ctx.fillStyle = color;
        ctx.fillRect(x + (flip ? n - 1 - c : c) * px, y + r * px, px, px);
      }
    }
  }

  /* Schlitten mit zwei Rentieren, fliegt ab und zu quer über den Bildschirm. */
  var FLY_W = 46;
  function flight(t, dt) {
    if (reduce) return;
    if (!nextFly) nextFly = t + 6000;
    if (!fly) {
      if (t < nextFly) return;
      var dir = Math.random() < 0.5 ? 1 : -1;
      fly = { dir: dir, x: dir > 0 ? -FLY_W * px : W, y: Math.round(H * (0.1 + Math.random() * 0.25)) };
    }
    fly.x += fly.dir * Math.max(60, W / 9) * dt;
    if (fly.x > W || fly.x < -FLY_W * px) {
      fly = null;
      nextFly = t + 45000 + Math.random() * 55000;
      return;
    }
    var flip = fly.dir < 0;
    var x0 = Math.round(fly.x / px) * px;
    var y0 = Math.round((fly.y + Math.sin(t / 700) * 3 * px) / px) * px;
    function at(off, w) { return x0 + (flip ? FLY_W - off - w : off) * px; }
    var legs = DEER_LEGS[Math.floor(t / 180) % 2];
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#C9A15A';
    ctx.fillRect(at(15, 19), y0 + 6 * px, 19 * px, px);
    sprite(SLEIGH, SLEIGH_COL, at(0, 16), y0, t, flip);
    for (var i = 0; i < 2; i++) {
      var dx = at(18 + i * 15, 13);
      var dy = y0 + px + (Math.floor(t / 360 + i) % 2) * px;
      var col = i === 1 ? LEAD_COL : DEER_COL;
      sprite(DEER_TOP, col, dx, dy, t, flip);
      sprite(legs, col, dx, dy + DEER_TOP.length * px, t, flip);
    }
  }

  function scene(t) {
    var s = sceneBox();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#F4F6F8';
    ctx.fillRect(s.left, s.base, W - s.left, s.gh);
    ctx.fillRect(s.left + 3 * px, s.base - px, 9 * px, px);
    ctx.fillRect(s.treeX - px, s.base - px, 14 * px, px);
    ctx.fillStyle = '#C9D3E2';
    ctx.fillRect(s.left, s.base + px, W - s.left, px);
    sprite(SANTA, SANTA_COL, s.santaX, s.base - SANTA.length * px, t);
    sprite(TREE, TREE_COL, s.treeX, s.base - TREE.length * px, t);
  }

  function draw(t, dt) {
    ctx.clearRect(0, 0, W, H);
    var floor = H - navOff;
    ctx.fillStyle = '#FFFFFF';
    for (var i = 0; i < flakes.length; i++) {
      var f = flakes[i];
      f.y += f.v * dt;
      if (f.y > floor) { f.y = -3 * px; f.x = Math.random() * W; }
      var x = Math.round((f.x + Math.sin(f.ph + t / 1400) * f.amp) / px) * px;
      var y = Math.round(f.y / px) * px;
      ctx.globalAlpha = f.a;
      if (f.big) {
        ctx.fillRect(x, y - px, px, 3 * px);
        ctx.fillRect(x - px, y, 3 * px, px);
      } else {
        ctx.fillRect(x, y, px, px);
      }
    }
    flight(t, dt);
    scene(t);
  }

  function drawOff() {
    ctx.clearRect(0, 0, W, H);
    var p = 3, x = W - 7 * p - 12, y = H - navOff - 7 * p - 12;
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#FFFFFF';
    for (var r = 0; r < FLAKE.length; r++) {
      for (var c = 0; c < 7; c++) {
        if (FLAKE[r].charAt(c) === 'W') ctx.fillRect(x + c * p, y + r * p, p, p);
      }
    }
    ctx.globalAlpha = 1;
  }

  function loop(t) {
    raf = 0;
    if (!on || document.hidden) return;
    if (t - last >= 40) {
      var dt = last ? Math.min((t - last) / 1000, 0.1) : 0;
      last = t;
      if (++frame % 30 === 0) {
        var off = navOffset();
        if (off !== navOff) { navOff = off; placeButton(); }
      }
      draw(t, dt);
    }
    raf = window.requestAnimationFrame(loop);
  }

  function start() {
    if (!on) { drawOff(); return; }
    if (reduce) { draw(0, 0); return; }
    last = 0;
    if (!raf) raf = window.requestAnimationFrame(loop);
  }

  function toggle() {
    on = !on;
    try { localStorage.setItem(KEY, on ? 'an' : 'aus'); } catch (e) {}
    placeButton();
    start();
  }

  function init() {
    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:50;image-rendering:pixelated';
    ctx = canvas.getContext('2d');
    if (!ctx) return;
    button = document.createElement('button');
    button.type = 'button';
    button.style.cssText = 'position:fixed;right:0;bottom:0;width:44px;height:44px;margin:0;padding:0;border:0;background:transparent;z-index:51;cursor:pointer;-webkit-tap-highlight-color:transparent';
    button.addEventListener('click', toggle);
    document.body.appendChild(canvas);
    document.body.appendChild(button);
    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
    start();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
