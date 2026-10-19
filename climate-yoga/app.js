(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- breath clock ---------- */
  var CYCLE = 10000;
  function ease(x) { return x * x * (3 - 2 * x); }
  function breathAt(t) {
    var p = (t % CYCLE) / CYCLE;
    if (p < 0.4) return { b: ease(p / 0.4), inhale: true };
    return { b: 1 - ease((p - 0.4) / 0.6), inhale: false };
  }

  /* ---------- lessons ---------- */
  var LESSONS = [
    { name: 'Nature', img: '/climate-yoga/img/nature.jpg', preset: 'forest', ep: '6ZeFwF1SZww5dYU9Kic8ZB',
      text: 'Forests, wetlands, mangroves, seagrass and grasslands store carbon and shelter biodiversity. This lesson covers what they do and what protecting them takes.',
      move: 'Best done outdoors, on the ground. A lot of visualization and slow, repeated movement.',
      q: 'What is growing within ten steps of where you are standing?' },
    { name: 'Oceans', img: '/climate-yoga/img/oceans.jpg', preset: 'shore', ep: '2lLEpGcwcu2yFz95hoxGP7',
      text: 'The ocean covers over 70% of the earth\'s surface and takes in the excess heat we produce, which is why corals are dying. Warming and plastic pollution are the main threats. This lesson covers how to protect marine ecosystems.',
      move: 'Poses inspired by the ocean. Water wheels, and movement like the tides: forward and back, in and out, each breath matched to the rhythm.',
      q: 'What is your first memory of the ocean?' },
    { name: 'Food Waste', img: '/climate-yoga/img/food-waste.jpg', preset: 'ground', ep: '5C46hx76zntVrXY0kp6noo',
      text: 'Food waste adds to greenhouse gas emissions and drains resources. Follow food from farm to fork and see what changes when less of it gets thrown out, at home and in communities.',
      move: 'Mindful eating with an apple, a seed to tree flow, and a composting flow.',
      q: 'What did you throw away this week, and what did it take to grow?' },
    { name: 'Plastics', img: '/climate-yoga/img/plastics.jpg', preset: 'shore', ep: '4PhwOdYj5cNZeWD6I5KnNn',
      text: 'Plastic pollution reaches land, waterways and oceans, and its production and disposal feed climate change. Topics include health effects and alternatives to single-use plastic.',
      move: 'Visualize a plastic water bottle to drive the breath. A quick 30 minute flow.',
      q: 'How much plastic is within arm\'s reach right now?' },
    { name: 'Climate Justice', img: '/climate-yoga/img/climate-justice.jpg', preset: 'wind', ep: '1KSpG5o0IWJwbmftjwlwVq',
      text: 'The people least responsible for warming often suffer its worst effects. Topics include equity, inclusive policy and the grassroots movements working toward fair solutions.',
      move: 'Done against a wall or with a partner, to feel community.',
      q: 'Who carries the cost of the comfort in this room?' }
  ];
  var list = document.getElementById('lessonList');
  LESSONS.forEach(function (L, i) {
    var item = document.createElement('div');
    item.className = 'lesson';
    var open = i === 0;
    var listen = L.ep ? '<a class="chip" href="https://open.spotify.com/episode/' + L.ep + '" target="_blank" rel="noopener">Original recording</a>' : '';
    item.innerHTML =
      '<button type="button" aria-expanded="' + open + '" aria-controls="p' + i + '">' +
        '<span class="n">Lesson ' + (i + 1) + '</span><span class="name">' + L.name + '</span><span class="pm" aria-hidden="true">' + (open ? '−' : '+') + '</span></button>' +
      '<div class="panel" id="p' + i + '"' + (open ? '' : ' hidden') + '>' +
        '<div class="l"><p>' + L.text + '</p></div>' +
        '<div class="r">' +
          '<div><p class="lab">The movement</p><p>' + L.move + '</p></div>' +
          '<div><p class="lab">Share-out question</p><p class="big">' + L.q + '</p></div>' +
          '<div class="acts"><button type="button" class="chip hear" data-preset="' + L.preset + '">Hear this ecosystem</button>' + listen + '</div>' +
        '</div>' +
        '<img class="cover" src="' + L.img + '" alt="Cover art for the ' + L.name + ' episode" width="800" height="800" loading="lazy"></div>';
    list.appendChild(item);
  });
  list.addEventListener('click', function (e) {
    var hear = e.target.closest('.hear');
    if (hear) { applyPreset(hear.getAttribute('data-preset')); setSound(true); return; }
    var btn = e.target.closest('.lesson > button');
    if (!btn) return;
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    var isOpen = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!isOpen));
    btn.querySelector('.pm').textContent = isOpen ? '+' : '−';
    panel.hidden = isOpen;
  });

  /* ---------- sound ---------- */
  var PRESETS = {
    forest: { wind: 45, water: 10, birds: 85, earth: 35 },
    shore: { wind: 40, water: 90, birds: 15, earth: 20 },
    ground: { wind: 15, water: 0, birds: 10, earth: 90 },
    wind: { wind: 75, water: 0, birds: 0, earth: 50 }
  };
  var SCALE = { wind: 0.5, water: 0.45, birds: 0.35, earth: 0.7 };
  var KEYS = ['wind', 'water', 'birds', 'earth'];
  var vals = {};
  KEYS.forEach(function (k) {
    var inp = document.getElementById('v-' + k), out = document.getElementById('o-' + k);
    vals[k] = +inp.value;
    inp.addEventListener('input', function () {
      vals[k] = +inp.value; out.textContent = inp.value;
      markPreset(null); applyLevels(); if (!S.on) setSound(true);
    });
  });
  var S = { ctx: null, on: false, master: null, ch: {}, windMod: null };
  var presetBtns = document.querySelectorAll('.presets .chip');
  function markPreset(name) { Array.prototype.forEach.call(presetBtns, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-preset') === name)); }); }
  function applyPreset(name) {
    var p = PRESETS[name]; if (!p) return;
    KEYS.forEach(function (k) { vals[k] = p[k]; document.getElementById('v-' + k).value = p[k]; document.getElementById('o-' + k).textContent = p[k]; });
    markPreset(name); applyLevels();
  }
  Array.prototype.forEach.call(presetBtns, function (b) {
    b.addEventListener('click', function () { applyPreset(b.getAttribute('data-preset')); setSound(true); });
  });
  function applyLevels() {
    if (!S.ctx) return;
    KEYS.forEach(function (k) { S.ch[k].gain.setTargetAtTime(vals[k] / 100 * SCALE[k], S.ctx.currentTime, 0.2); });
  }
  function noiseBuf(c, brown) {
    var len = c.sampleRate * 3, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0), last = 0;
    for (var i = 0; i < len; i++) {
      var w = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else { d[i] = w; }
    }
    return b;
  }
  function loopSrc(c, buf) { var s = c.createBufferSource(); s.buffer = buf; s.loop = true; s.start(); return s; }
  function initAudio() {
    if (S.ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    var c = S.ctx = new AC();
    S.master = c.createGain(); S.master.gain.value = 0; S.master.connect(c.destination);
    KEYS.forEach(function (k) { var g = c.createGain(); g.gain.value = 0; g.connect(S.master); S.ch[k] = g; });
    var white = noiseBuf(c, false), brown = noiseBuf(c, true);

    var wind = loopSrc(c, white), bp = c.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 600; bp.Q.value = 0.6;
    S.windMod = c.createGain(); S.windMod.gain.value = 0.7;
    wind.connect(bp); bp.connect(S.windMod); S.windMod.connect(S.ch.wind);
    setInterval(function () { if (S.on) bp.frequency.setTargetAtTime(350 + Math.random() * 700, c.currentTime, 1.6); }, 3200);

    var wat = loopSrc(c, white), lp = c.createBiquadFilter(), hp = c.createBiquadFilter(), wg = c.createGain();
    lp.type = 'lowpass'; lp.frequency.value = 2200; hp.type = 'highpass'; hp.frequency.value = 220; wg.gain.value = 0.55;
    wat.connect(lp); lp.connect(hp); hp.connect(wg); wg.connect(S.ch.water);

    var ea = loopSrc(c, brown), elp = c.createBiquadFilter(), eg = c.createGain();
    elp.type = 'lowpass'; elp.frequency.value = 180; eg.gain.value = 1.4;
    ea.connect(elp); elp.connect(eg); eg.connect(S.ch.earth);
    [55, 82.5].forEach(function (f, i) {
      var o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = f; g.gain.value = i ? 0.05 : 0.12; o.connect(g); g.connect(S.ch.earth); o.start();
    });

    (function bubbleLoop() {
      setTimeout(function () {
        if (S.on && vals.water > 3) {
          var t0 = c.currentTime, o = c.createOscillator(), e = c.createGain(), f = 350 + Math.random() * 900;
          o.type = 'sine'; o.frequency.setValueAtTime(f, t0); o.frequency.exponentialRampToValueAtTime(f * 1.8, t0 + 0.09);
          e.gain.setValueAtTime(0.0001, t0); e.gain.exponentialRampToValueAtTime(0.3, t0 + 0.012); e.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
          o.connect(e); e.connect(S.ch.water); o.start(t0); o.stop(t0 + 0.14);
        }
        bubbleLoop();
      }, 140 + Math.random() * 600);
    })();
    (function birdLoop() {
      setTimeout(function () {
        if (S.on && vals.birds > 3) {
          var t0 = c.currentTime, base = 2200 + Math.random() * 2600, n = 1 + Math.floor(Math.random() * 4);
          for (var i = 0; i < n; i++) {
            var st = t0 + i * 0.13, o = c.createOscillator(), e = c.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(base * (0.9 + Math.random() * 0.2), st);
            o.frequency.exponentialRampToValueAtTime(base * (1.25 + Math.random() * 0.5), st + 0.08);
            e.gain.setValueAtTime(0.0001, st); e.gain.exponentialRampToValueAtTime(0.6, st + 0.015); e.gain.exponentialRampToValueAtTime(0.0001, st + 0.1);
            o.connect(e); e.connect(S.ch.birds); o.start(st); o.stop(st + 0.12);
          }
        }
        birdLoop();
      }, 1200 + Math.random() * 4200 / (0.25 + vals.birds / 100));
    })();
    applyLevels();
    return true;
  }
  var pill = document.getElementById('sound'), pillLabel = document.getElementById('soundLabel');
  function setSound(on) {
    if (on && !initAudio()) return;
    S.on = on;
    if (S.ctx) {
      if (on && S.ctx.state === 'suspended') S.ctx.resume();
      S.master.gain.setTargetAtTime(on ? 1 : 0, S.ctx.currentTime, 0.4);
    }
    pill.setAttribute('aria-pressed', String(on));
    pillLabel.textContent = on ? 'Sound on' : 'Sound off';
  }
  pill.addEventListener('click', function () { setSound(!S.on); });

  /* ---------- dot field ---------- */
  var cvs = document.getElementById('field'), ctx = cvs.getContext('2d');
  var hero = document.getElementById('top'), body = document.body;
  var W = 0, H = 0, DPR = 1, groundY = 900, air = [], roots = [], nodes = [], builtW = 0, builtG = 0;
  var mx = -999, my = -999;
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function build() {
    var R = rng(11);
    air = []; roots = []; nodes = []; grown = []; shoots = [];
    var nAir = Math.max(30, Math.round(W * groundY / 16000));
    for (var i = 0; i < nAir; i++) air.push({ x: R() * W, y: R() * (groundY - 70), r: 1.2 + R() * 2.6, p: R() * 6.28, s: 0.3 + R() * 0.7 });
    var bottom = groundY + 7000;
    function grow(x, y, a, depth, w, steps) {
      var trunk = depth === 0;
      for (var s = 0; s < steps; s++) {
        a += (R() - 0.5) * (trunk ? 0.22 : 0.4);
        a += (Math.PI / 2 - a) * (trunk ? 0.04 : 0.025);
        x += Math.cos(a) * 9; y += Math.sin(a) * 9;
        if (y < groundY + 2 || x < -30 || x > W + 30 || roots.length > 42000) return;
        var k = Math.max(1, Math.round(w));
        for (var j = 0; j < k; j++) {
          var off = (j - (k - 1) / 2) * 3.4 + (R() - 0.5) * 1.6;
          roots.push({ x: x - Math.sin(a) * off, y: y + Math.cos(a) * off, r: 0.7 + R() * 0.9 + w * 0.12, a: a, d: depth });
        }
        if (R() < 0.12) {
          var ha = a + (R() < 0.5 ? -1 : 1) * (0.7 + R() * 0.7), hx = x, hy = y, hn = 3 + Math.floor(R() * 6);
          for (var q = 0; q < hn; q++) {
            ha += (R() - 0.5) * 0.5; hx += Math.cos(ha) * 5; hy += Math.sin(ha) * 5;
            if (hy < groundY + 2) break;
            roots.push({ x: hx, y: hy, r: 0.6 + R() * 0.5, a: ha, d: 3 });
          }
        }
        if (depth < 4 && s > 5 && R() < (trunk ? 0.045 : 0.03)) {
          var dir = R() < 0.5 ? -1 : 1;
          grow(x, y, a + dir * (0.5 + R() * 0.6), depth + 1, Math.max(1, w * 0.6), Math.floor((16 + R() * 44) * (1 - depth * 0.15)));
        }
        w = Math.max(1, w - (trunk ? 0.004 : 0.012));
      }
    }
    var trunks = Math.max(3, Math.round(W / 380));
    for (var t = 0; t < trunks; t++) {
      var fx = ((t + 0.5) / trunks + (R() - 0.5) * 0.12) * W;
      grow(fx, groundY + 4, Math.PI / 2 + (R() - 0.5) * 0.5, 0, 3.4, Math.floor((bottom - groundY) / 9 * (0.75 + R() * 0.25)));
    }
    roots.sort(function (a, b) { return a.y - b.y; });
    builtW = W; builtG = groundY;
  }

  function layout() {
    W = window.innerWidth; H = window.innerHeight; DPR = Math.min(window.devicePixelRatio || 1, 2);
    cvs.width = Math.round(W * DPR); cvs.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    groundY = Math.round(hero.getBoundingClientRect().bottom + window.scrollY);
    body.style.setProperty('--ground', groundY + 'px');
    if (Math.abs(W - builtW) > 8 || Math.abs(groundY - builtG) > 40 || !roots.length) build();
  }
  var lt = null;
  function relayout() { clearTimeout(lt); lt = setTimeout(layout, 120); }
  window.addEventListener('resize', relayout);
  if (window.ResizeObserver) new ResizeObserver(relayout).observe(hero);
  window.addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
  window.addEventListener('pointerdown', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
  window.addEventListener('pointerleave', function () { mx = -999; my = -999; });
  layout();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  window.addEventListener('load', layout);

  var orb = document.getElementById('orb'), orbText = document.getElementById('orbText'), orbNote = document.getElementById('orbNote');
  var lastWind = 0;
  function lowerBound(y) { var lo = 0, hi = roots.length; while (lo < hi) { var m = (lo + hi) >> 1; if (roots[m].y < y) lo = m + 1; else hi = m; } return lo; }

  var grown = [], shoots = [], hoverShoot = null, lastStep = 0, HIT = 30;
  function findHit(sy) {
    var docY = my + sy, lim = sy + H * 0.86, best = null, bd = HIT * HIT, d, dx, dy, dd, i;
    for (i = lowerBound(docY - HIT); i < roots.length; i++) {
      d = roots[i]; if (d.y > docY + HIT || d.y > lim) break;
      if (d.d < 2) continue;
      dx = d.x - mx; dy = d.y - docY; dd = dx * dx + dy * dy;
      if (dd < bd) { bd = dd; best = d; }
    }
    for (i = 0; i < grown.length; i++) {
      d = grown[i]; dx = d.x - mx; dy = d.y - docY; dd = dx * dx + dy * dy;
      if (dd < bd) { bd = dd; best = d; }
    }
    return best;
  }
  function stepShoot(s) {
    s.a += (Math.random() - 0.5) * 0.5;
    s.a += (Math.PI / 2 - s.a) * 0.03;
    s.x += Math.cos(s.a) * 5; s.y += Math.sin(s.a) * 5;
    if (s.y < groundY + 2 || s.x < -20 || s.x > W + 20 || s.n > 700) { s.dead = true; return; }
    s.n++; s.w = Math.max(1, s.w - 0.012);
    var k = Math.max(1, Math.round(s.w)), j;
    for (j = 0; j < k; j++) {
      var off = (j - (k - 1) / 2) * 3 + (Math.random() - 0.5) * 1.4;
      grown.push({ x: s.x - Math.sin(s.a) * off, y: s.y + Math.cos(s.a) * off, r: 0.8 + Math.random() * 0.8, sid: s.id });
    }
    if (s.n > 4 && s.kids.length < 40 && Math.random() < 0.1) {
      s.kids.push({ x: s.x, y: s.y, a: s.a + (Math.random() < 0.5 ? -1 : 1) * (0.7 + Math.random() * 0.6), n: 0, max: 6 + Math.floor(Math.random() * 10) });
    }
    for (j = 0; j < s.kids.length; j++) {
      var q = s.kids[j];
      if (q.n >= q.max) continue;
      q.a += (Math.random() - 0.5) * 0.5; q.a += (Math.PI / 2 - q.a) * 0.04;
      q.x += Math.cos(q.a) * 4; q.y += Math.sin(q.a) * 4; q.n++;
      if (q.y < groundY + 2) { q.n = q.max; continue; }
      grown.push({ x: q.x, y: q.y, r: 0.6 + Math.random() * 0.5, sid: s.id });
    }
  }
  function hover(t, sy) {
    hoverShoot = null;
    if (mx < 0) return;
    var hit = findHit(sy);
    if (!hit) return;
    var s;
    if (hit.sid !== undefined) { s = shoots[hit.sid]; }
    else {
      for (var i = shoots.length - 1; i >= 0 && !s; i--) { var q = shoots[i]; if (Math.abs(q.ox - hit.x) < 14 && Math.abs(q.oy - hit.y) < 14) s = q; }
      if (!s) {
        var side = Math.random() < 0.5 ? -1 : 1;
        s = { id: shoots.length, ox: hit.x, oy: hit.y, x: hit.x, y: hit.y, a: hit.a + side * (0.6 + Math.random() * 0.5), n: 0, w: 1.6, kids: [], dead: false };
        shoots.push(s);
      }
    }
    hoverShoot = s;
    if (s.dead || grown.length > 16000) return;
    if (t - lastStep > 60) { lastStep = t; stepShoot(s); }
  }

  function frame(t) {
    var sy = window.scrollY;
    var br = reduce ? { b: 0.5, inhale: true } : breathAt(t);
    var b = br.b;
    ctx.clearRect(0, 0, W, H);
    if (!reduce) hover(t, sy);

    /* air dots above the ground line */
    if (sy < groundY) {
      ctx.fillStyle = 'rgba(11,42,38,0.5)';
      ctx.beginPath();
      for (var i = 0; i < air.length; i++) {
        var a = air[i];
        var y = a.y - sy + (reduce ? 0 : Math.sin(t * 0.0004 * a.s + a.p) * 12 - b * 14 * a.s);
        var x = a.x + (reduce ? 0 : Math.cos(t * 0.0003 * a.s + a.p) * 8);
        if (y < -10 || y > H + 10) continue;
        var r = a.r * (0.75 + 0.55 * b);
        ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 6.2832);
      }
      ctx.fill();
    }

    /* roots grow in as you scroll */
    var front = sy + H * 0.92;
    var lo = lowerBound(sy - 12), top = Math.min(front, sy + H + 12);
    ctx.fillStyle = 'rgba(111,224,197,0.55)';
    ctx.beginPath();
    for (var k = lo; k < roots.length; k++) {
      var d0 = roots[k];
      if (d0.y > top) break;
      var fade = Math.min(1, (front - d0.y) / 280);
      if (fade <= 0) continue;
      var px = d0.x, py = d0.y - sy;
      var rr = d0.r * fade * (0.85 + 0.3 * b);
      ctx.moveTo(px + rr, py); ctx.arc(px, py, rr, 0, 6.2832);
    }
    ctx.fill();

    /* shoots grown by hovering */
    ctx.fillStyle = 'rgba(111,224,197,0.75)';
    ctx.beginPath();
    for (var g = 0; g < grown.length; g++) {
      var gd = grown[g], gy = gd.y - sy;
      if (gy < -10 || gy > H + 10) continue;
      ctx.moveTo(gd.x + gd.r, gy); ctx.arc(gd.x, gy, gd.r, 0, 6.2832);
    }
    ctx.fill();

    /* hero breath guide and wind swell */
    if (!reduce) {
      orb.style.transform = 'scale(' + (0.72 + 0.28 * b).toFixed(3) + ')';
      var label = br.inhale ? 'Breathe in' : 'Breathe out';
      if (orbText.textContent !== label) orbText.textContent = label;
    } else {
      orbText.textContent = 'Breathe slowly';
      orbNote.textContent = 'At your own pace.';
    }
    if (S.on && S.ctx && t - lastWind > 120) { lastWind = t; S.windMod.gain.setTargetAtTime(0.45 + 0.55 * b, S.ctx.currentTime, 0.15); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
