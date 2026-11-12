(() => {
  'use strict';
  const settings = () => window.Game?.state || {};
  const notify = text => window.Game?.notice?.(text);
  const synth = window.speechSynthesis;
  const UA = navigator.userAgent || '';
  const isAndroid = /Android/i.test(UA), isIOS = /iPad|iPhone|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isMobile = isAndroid || isIOS;
  let voices = [], speech = null, serial = 0, caption, speechCleanup, onlineAudio = null, keepAlive = 0, warned = false;
  let context, fx, musicBus, waterGain, windGain, engineGain, engineOsc, echoGain, echo, waterPan, windPan, noiseBuffer;
  let nextNote = 0, noteIndex = 0, nextBird = 0, nextStep = 0, paused = false, speaking = false;
  let mic = null, saveFocus = null;
  const defaultEnvironment = {x: 0, z: 0, water: 0, moving: false, surface: 'dirt', engine: 0, cave: false};
  let location = {...defaultEnvironment};
  const strip = str => String(str || '').normalize('NFKC').replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
  function similarity(a, b) {
    a = strip(a).slice(0, 400); b = strip(b).slice(0, 400);
    if (!a || !b) return 0;
    let row = Array.from({length: b.length + 1}, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const next = [i];
      for (let j = 1; j <= b.length; j++) next.push(Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)));
      row = next;
    }
    return 1 - row[b.length] / Math.max(a.length, b.length);
  }
  const passMark = () => [60, 70, 80][Number(settings().level)] || 60;
  // Word-by-word comparison of what the learner said with the model phrase.
  function evaluate(target, heard) {
    const tw = String(target).split(/\s+/).filter(w => strip(w)), hw = strip(heard).split(' ').filter(Boolean);
    const words = tw.map((w, i) => {
      const t = strip(w); let best = 0;
      hw.forEach((h, j) => { const s = similarity(t, h) - Math.min(.2, Math.abs(j - i * hw.length / Math.max(1, tw.length)) * .04); if (s > best) best = s; });
      // the definite article and short particles are often merged by the recogniser
      if (best < .8 && strip(heard).replace(/\s/g, '').includes(t.replace(/\s/g, '')) && t.length > 1) best = .85;
      return {word: w, score: Math.max(0, best)};
    });
    const avg = words.reduce((n, w) => n + w.score, 0) / Math.max(1, words.length);
    const score = Math.round(100 * Math.min(1, .55 * avg + .45 * similarity(target, heard)));
    return {words, score};
  }
  function styles() {
    if (document.getElementById('sound-css')) return;
    const style = document.createElement('style'); style.id = 'sound-css';
    style.textContent = `
      .salem-lit{background:#ffdc88!important;color:#24271e!important;border-radius:.23em}
      #salem-caption{position:fixed;z-index:1100;inset:auto 50% max(14px,env(safe-area-inset-bottom)) auto;transform:translateX(50%);max-width:min(38rem,88vw);width:max-content;pointer-events:none;border-radius:14px;background:#16382ef0;color:#fff;padding:.5em 1.1em;line-height:1.7;text-align:center}
      #salem-caption .tr{justify-content:center}#salem-caption .tr .pr{color:#ffd58a}#salem-caption .tr .en{color:#d9eadf}
      #salem-caption[hidden]{display:none}
      #salem-mic{color:#233c32;background:#fffaf0;border:1px solid #d0c6ad;padding:clamp(14px,4vw,28px);border-radius:24px;width:min(30rem,calc(100vw - 20px));max-height:94vh;max-height:94dvh;overflow:auto;box-sizing:border-box;box-shadow:0 20px 90px #172d2655;text-align:center;direction:rtl;font:inherit;line-height:1.7;margin:auto}
      #salem-mic::backdrop{background:#09271fb0} #salem-mic h2{font-size:1.25em;margin:0 0 .4em}
      #salem-mic p{margin:.35em 0} #salem-mic .model{background:#f1eadb;border-radius:14px;padding:.6em .8em;font-size:1.35em;font-weight:700;line-height:2}
      #salem-mic .model span{border-radius:.3em;padding:0 .12em;transition:background .25s}
      #salem-mic .model .ok{background:#bfe5c3;color:#12491f}#salem-mic .model .near{background:#ffe2a3;color:#6a4500}#salem-mic .model .miss{background:#f6c3ba;color:#7a1d10}
      #salem-mic .tr{justify-content:center;font-size:.85em;margin:.3em 0 .5em}
      #salem-mic .mic-actions{display:flex;gap:.5em;flex-wrap:wrap;margin:.6em 0;justify-content:center}
      #salem-mic button,#salem-mic input{font:inherit;border:1px solid #b9b9a5;border-radius:12px;background:#fffdf7;color:#213c2f;padding:.45em .9em;cursor:pointer;min-height:44px;touch-action:manipulation}
      #salem-mic button.go{background:#245540;color:#fff;border-color:#245540;font-weight:700}
      #salem-mic input{box-sizing:border-box;width:100%;cursor:text;text-align:right} #salem-mic audio{max-width:100%;display:block;margin:.5em auto}
      #salem-mic button:focus-visible,#salem-mic input:focus-visible{outline:3px solid #ae7820;outline-offset:2px}
      #salem-mic .notice{min-height:1.6em;color:#465546;font-size:.92em} #salem-mic .cancel{border:0;background:transparent;text-decoration:underline;min-height:0}
      #salem-mic .bigmic{width:92px;height:92px;border-radius:50%;border:0;background:#c8442f;color:#fff;font-size:38px;line-height:1;display:block;margin:.5em auto .2em;box-shadow:0 6px 22px #c8442f66;position:relative}
      #salem-mic .bigmic.live{background:#1f7a4d;box-shadow:0 0 0 calc(4px + var(--lvl,0)*26px) #1f7a4d33,0 6px 22px #1f7a4d66}
      #salem-mic .bigmic.live:after{content:"";position:absolute;inset:-6px;border-radius:50%;border:3px solid #1f7a4d88;animation:micpulse 1.2s ease-out infinite}
      @keyframes micpulse{from{transform:scale(1);opacity:1}to{transform:scale(1.35);opacity:0}}
      #salem-mic .heard{font-size:1.05em;color:#3d4d43;min-height:1.7em}
      #salem-mic .ring{--p:0;width:96px;height:96px;border-radius:50%;margin:.4em auto;display:grid;place-items:center;background:conic-gradient(var(--c,#1f7a4d) calc(var(--p)*1%),#e5dfcf 0);font:800 1.5em system-ui,sans-serif;color:#213c2f;position:relative}
      #salem-mic .ring:before{content:"";position:absolute;inset:9px;border-radius:50%;background:#fffaf0}#salem-mic .ring b{position:relative}
      #salem-mic .verdict{font-weight:700;font-size:1.1em}
      #salem-mic .legend{font-size:.78em;color:#5b6a5f;display:flex;gap:.9em;justify-content:center;flex-wrap:wrap}
      #salem-mic .legend i{display:inline-block;width:.8em;height:.8em;border-radius:3px;margin-inline-end:.3em;vertical-align:middle}
    `; document.head.append(style);
  }

  /* ---------------- Salim's voice ---------------- */
  function refreshVoices() { try { voices = synth?.getVoices() || [] } catch { voices = [] } }
  function arabicVoice() {
    const lang = v => String(v.lang || '').toLowerCase().replace(/_/g, '-');
    let best = null, bestScore = -1;
    for (const v of voices) {
      const l = lang(v); if (!/^ar(?:-|$)/.test(l)) continue;
      let s = 1 + ({'ar-om': 6, 'ar-sa': 5, 'ar-ae': 4, 'ar-kw': 4, 'ar-qa': 4, 'ar-bh': 4, 'ar-xa': 3, 'ar-eg': 2, 'ar': 3}[l] || 1);
      if (/natural|neural|online|enhanced|premium/i.test(v.name)) s += 5;
      if (/google|microsoft|maged|majed|tarik|laila|hamed|naayf|zariyah|abdullah/i.test(v.name)) s += 2;
      if (/compact|eloquence/i.test(v.name)) s -= 2;
      if (s > bestScore) { best = v; bestScore = s; }
    }
    return best;
  }
  function ramp(node, value, delay = .08) {
    if (node && context && context.state !== 'closed') node.gain.setTargetAtTime(value, context.currentTime, delay);
  }
  function configure() {
    const s = settings();
    ramp(fx, s.effects === false || paused ? 0 : .8);
    ramp(musicBus, s.music && !paused ? (speaking ? .12 : .48) : 0, .15);
    if (s.voice === false && speech) stopSpeech();
  }
  function setSpeaking(on) {
    speaking = on; window.World?.speaking?.(on);
    ramp(musicBus, settings().music && !paused ? (on ? .12 : .48) : 0, .15);
  }
  function stopSpeech() {
    serial++; clearInterval(keepAlive);
    if (synth) { try { synth.cancel() } catch {} }
    if (onlineAudio) { try { onlineAudio.pause(); onlineAudio.removeAttribute('src'); onlineAudio.load() } catch {} onlineAudio = null; }
    speech = null;
    if (speechCleanup) { speechCleanup(); speechCleanup = null }
    if (caption) caption.hidden = true;
    setSpeaking(false);
  }
  const chunks = text => { const out = []; let cur = '';
    for (const part of (text.match(/[^.!؟?،,:؛\n]+[.!؟?،,:؛]*/g) || [text])) { for (const w of part.trim().split(/\s+/)) { if ((cur + ' ' + w).length > 170) { out.push(cur.trim()); cur = '' } cur += ' ' + w } if (cur.length > 90) { out.push(cur.trim()); cur = '' } }
    if (cur.trim()) out.push(cur.trim()); return out.filter(Boolean) };
  function speak(text, slow = false, element) {
    text = String(text || '').trim(); stopSpeech(); if (!text) return;
    styles();
    let box = element instanceof Element ? element : null;
    const useSource = box && box.isConnected && box.textContent.trim() === text && !box.querySelector('*');
    let line = box;
    if (!useSource) {
      if (!caption) { caption = document.createElement('div'); caption.id = 'salem-caption'; caption.dir = 'rtl'; document.body.append(caption) }
      caption.replaceChildren(); line = document.createElement('div'); caption.append(line);
      const g = window.Gloss?.html(text); if (g && !document.body.classList.contains('notr')) caption.insertAdjacentHTML('beforeend', g);
      caption.hidden = false;
    }
    const original = line.textContent;
    line.textContent = '';
    const words = [];
    for (const hit of text.matchAll(/\S+|\s+/g)) {
      if (/^\s/.test(hit[0])) line.append(document.createTextNode(hit[0]));
      else { const span = document.createElement('span'); span.textContent = hit[0]; line.append(span); words.push({span, start: hit.index, end: hit.index + hit[0].length}) }
    }
    const token = serial;
    let linger, timers = [], active, finished = false, gotBoundary = false;
    const light = w => { active?.classList.remove('salem-lit'); active = w?.span || null; active?.classList.add('salem-lit') };
    const clearTimers = () => { timers.forEach(clearTimeout); timers = [] };
    // timed highlighting for engines that do not report word boundaries (Android, online voice)
    const timed = (list, total) => { clearTimers(); const sum = list.reduce((n, w) => n + w.end - w.start + 2, 0); let at = 0;
      for (const w of list) { timers.push(setTimeout(() => { if (token === serial && !gotBoundary) light(w) }, at * 1000)); at += total * (w.end - w.start + 2) / sum } };
    speechCleanup = () => { clearTimers(); clearTimeout(linger); clearInterval(keepAlive); active?.classList.remove('salem-lit'); if (useSource && line.isConnected && line.textContent === text) line.textContent = original };
    const emit = status => window.dispatchEvent(new CustomEvent('salem-utterance', {detail: {text, status}}));
    const finish = () => {
      if (token !== serial || finished) return; finished = true;
      speech = null; clearTimers(); clearInterval(keepAlive); setSpeaking(false); light(null);
      if (!useSource) linger = setTimeout(() => { if (token === serial) caption.hidden = true }, 2600);
    };
    const fail = () => { if (token !== serial || finished) return; emit('error');
      if (!warned) { warned = true; notify('الصوت العربي غير متاح الآن. تابع النص والنطق المكتوب، أو ثبّت صوتًا عربيًا في إعدادات الجهاز. · No Arabic voice available.') }
      finish() };
    const rate = (slow || settings().slow === true) ? .7 : ([.85, .93, 1][Number(settings().level)] || .85);
    if (settings().voice === false) { finish(); return }
    // --- online voice, used when the device has no Arabic voice ---
    const online = () => {
      if (token !== serial || finished) return;
      if (settings().online === false || !navigator.onLine) { fail(); return }
      const parts = chunks(text); let i = 0, wi = 0;
      const a = new Audio(); onlineAudio = a; a.preload = 'auto';
      const next = () => {
        if (token !== serial) return; if (i >= parts.length) { emit('end'); finish(); return }
        const part = parts[i++], n = part.split(/\s+/).length, list = words.slice(wi, wi + n); wi += n;
        a.src = 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ar&ttsspeed=' + (rate < .8 ? '0.24' : '1') + '&q=' + encodeURIComponent(part.replace(/[«»]/g, ''));
        a.onloadedmetadata = () => timed(list.length ? list : words, isFinite(a.duration) ? a.duration : part.length * .09);
        a.play().then(() => { if (token === serial) setSpeaking(true) }).catch(fail);
      };
      a.onended = next; a.onerror = fail; next();
    };
    if (!synth || !window.SpeechSynthesisUtterance) { online(); return }
    refreshVoices();
    const run = () => {
      if (token !== serial || finished) return;
      const voice = arabicVoice(); if (!voice) { online(); return }
      const u = new SpeechSynthesisUtterance(text); speech = u; window.__salimUtterance = u; // keep a reference: some browsers drop events otherwise
      u.voice = voice; u.lang = voice.lang; u.rate = rate; u.pitch = 1; u.volume = 1;
      let started = false;
      u.onstart = () => { if (token !== serial) return; started = true; setSpeaking(true);
        timers.push(setTimeout(() => { if (!gotBoundary && token === serial) timed(words, text.length * .085 / rate) }, 350)) };
      u.onboundary = e => {
        if (token !== serial || e.name === 'sentence') return;
        const word = words.find(w => w.start <= e.charIndex && e.charIndex < w.end);
        if (word) { gotBoundary = true; light(word) }
      };
      u.onend = () => { if (token === serial) { emit('end'); finish() } };
      u.onerror = e => { if (token !== serial) return; if (['interrupted', 'canceled'].includes(e.error)) { finish(); return } if (!started) online(); else { emit('error'); finish() } };
      try { synth.resume?.(); synth.speak(u) } catch { online(); return }
      // desktop Chrome silently stops long utterances; nudging the queue keeps it alive
      if (!isMobile && !voice.localService) keepAlive = setInterval(() => { if (token !== serial || !synth.speaking) { clearInterval(keepAlive); return } synth.pause(); synth.resume() }, 9000);
      // if nothing starts, fall back to the online voice
      timers.push(setTimeout(() => { if (token === serial && !started && !finished) { try { synth.cancel() } catch {} online() } }, 3500));
      // safety net when the end event never arrives
      timers.push(setTimeout(() => { if (token === serial && !finished && !synth.speaking) { emit('end'); finish() } }, (text.length * .14 / rate + 6) * 1000));
    };
    // voices load asynchronously on first use; a short delay after cancel() avoids a dropped utterance in Chrome
    if (arabicVoice() || voices.length) setTimeout(run, 70);
    else { let waited = 0; const poll = setInterval(() => { refreshVoices(); waited += 150; if (voices.length || waited >= 1500) { clearInterval(poll); run() } }, 150); timers.push(poll) }
  }

  /* ---------------- ambience ---------------- */
  function panner(parent) {
    const p = context.createPanner(); p.panningModel = 'equalpower'; p.distanceModel = 'inverse'; p.refDistance = 10; p.rolloffFactor = .28; p.maxDistance = 110; p.connect(parent); return p;
  }
  function position(p, x, y, z) {
    if (!p) return;
    if (p.positionX) { p.positionX.value = x; p.positionY.value = y; p.positionZ.value = z }
    else if (p.setPosition) p.setPosition(x, y, z);
  }
  function filter(type, frequency, q = 1) { const f = context.createBiquadFilter(); f.type = type; f.frequency.value = frequency; f.Q.value = q; return f }
  function noise() {
    if (!noiseBuffer) { const len = Math.ceil(context.sampleRate * 2); noiseBuffer = context.createBuffer(1, len, context.sampleRate); const s = noiseBuffer.getChannelData(0); for (let i = 0; i < len; i++) s[i] = Math.random() * 2 - 1 }
    const source = context.createBufferSource(); source.buffer = noiseBuffer; source.loop = true; return source;
  }
  function gain(value, parent) { const node = context.createGain(); node.gain.value = value; node.connect(parent); return node }
  function tone(pitch, endPitch, duration, volume, wave, parent, spatial) {
    if (!context || context.state !== 'running') return;
    const now = context.currentTime, osc = context.createOscillator(), g = context.createGain();
    osc.type = wave; osc.frequency.setValueAtTime(pitch, now); osc.frequency.exponentialRampToValueAtTime(Math.max(1, endPitch), now + duration);
    g.gain.setValueAtTime(.0001, now); g.gain.exponentialRampToValueAtTime(volume, now + Math.min(duration * .2, .025)); g.gain.exponentialRampToValueAtTime(.0001, now + duration);
    let p;
    if (spatial) { p = panner(parent); position(p, ...spatial); g.connect(p) } else g.connect(parent);
    osc.connect(g); osc.start(); osc.stop(now + duration + .02); osc.onended = () => { osc.disconnect(); g.disconnect(); p?.disconnect() };
  }
  // short filtered noise burst: footsteps on sand or stone
  function thud(freq, duration, volume) {
    if (!context || context.state !== 'running') return;
    const now = context.currentTime, src = noise(), f = filter('bandpass', freq, 1.4), g = context.createGain();
    g.gain.setValueAtTime(.0001, now); g.gain.exponentialRampToValueAtTime(volume, now + .012); g.gain.exponentialRampToValueAtTime(.0001, now + duration);
    src.connect(f); f.connect(g); g.connect(fx); src.start(now, Math.random()); src.stop(now + duration + .03); src.onended = () => { src.disconnect(); f.disconnect(); g.disconnect() };
  }
  function chime(ok) { if (settings().effects === false || !context) return; if (ok) { tone(660, 660, .16, .12, 'sine', fx); setTimeout(() => tone(990, 990, .28, .12, 'sine', fx), 130) } else tone(240, 180, .3, .1, 'triangle', fx) }
  function frame() {
    if (!context || paused || context.state !== 'running' || document.hidden) return;
    const now = context.currentTime, {x, z} = location;
    if (settings().music && now >= nextNote) {
      const sequence = [0, 1, 3, 2, 1, 0, 4, 3, 2, 1, 0, 2];
      const cents = [0, 150, 350, 500, 700];
      const f = 196 * 2 ** (cents[sequence[noteIndex % sequence.length]] / 1200);
      tone(f, f, .85, .105, 'sine', musicBus);
      if (noteIndex % 4 === 0) tone(98, 98, 1.5, .045, 'triangle', musicBus);
      nextNote = now + (noteIndex % 4 === 3 ? 2.2 : 1.1); noteIndex++;
    }
    if (settings().effects === false) return;
    if (!location.cave && now >= nextBird) { const b = 1900 + Math.random() * 900; tone(b, b * 1.5, .11, .04, 'sine', fx, [x + 9, 5, z - 9]); setTimeout(() => tone(b * 1.2, b * 1.7, .1, .035, 'sine', fx, [x + 9, 5, z - 9]), 150); nextBird = now + 3 + Math.random() * 7 }
    if (location.moving && !location.engine && now >= nextStep) {
      const stone = location.surface === 'stone' || location.surface === 'paved';
      thud(stone ? 1500 + Math.random() * 500 : 520 + Math.random() * 200, stone ? .07 : .13, stone ? .2 : .26);
      nextStep = now + .36;
    }
  }
  function environment(data = {}) {
    location = {...location, ...data};
    if (!context) return;
    const {x, z} = location, water = Math.min(1, Math.max(0, Number(location.water) || 0));
    position(context.listener, x, 1.6, z); position(waterPan, x - 2 - (1 - water) * 12, .2, z - 1); position(windPan, x + 4, 4, z + 8);
    ramp(waterGain, .2 * water * water, .2); ramp(windGain, location.cave ? .012 : .07, .3);
    const speed = Math.max(0, Math.min(1, Number(location.engine) || 0));
    ramp(engineGain, speed ? .05 : 0, .12); engineOsc.frequency.setTargetAtTime(32 + speed * 42, context.currentTime, .15);
    ramp(echoGain, location.cave ? .27 : 0, .18);
  }
  function unlock() {
    refreshVoices();
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    try {
      if (!context) {
        context = new C();
        const master = gain(.7, context.destination);
        fx = gain(0, master); musicBus = gain(0, master); waterPan = panner(fx); windPan = panner(fx);
        waterGain = gain(0, waterPan); windGain = gain(0, windPan);
        const n = noise(), waterFilter = filter('bandpass', 1700, .7), windFilter = filter('lowpass', 420);
        n.connect(waterFilter); waterFilter.connect(waterGain); n.connect(windFilter); windFilter.connect(windGain); n.start();
        const lfo = context.createOscillator(), lg = context.createGain(); lfo.frequency.value = .13; lg.gain.value = 160; lfo.connect(lg); lg.connect(windFilter.frequency); lfo.start();
        engineGain = gain(0, fx); engineOsc = context.createOscillator(); engineOsc.type = 'triangle'; engineOsc.connect(engineGain); engineOsc.start();
        echo = context.createDelay(.8); echo.delayTime.value = .22; echoGain = gain(0, fx); echo.connect(echoGain);
        setInterval(frame, 105); environment(); configure();
      }
      if (context.state !== 'running') context.resume().catch(() => {});
    } catch { notify('تعذّر تشغيل المؤثرات الصوتية على هذا الجهاز.') }
  }
  function pause(value) { paused = !!value; configure() }

  /* ---------------- speaking practice: record, recognise, score ---------------- */
  function closeMic() {
    const m = mic; if (!m) return;
    mic = null; m.stopAll?.();
    if (m.url) URL.revokeObjectURL(m.url);
    if (m.dialog.open) m.dialog.close();
    m.dialog.remove(); if (saveFocus?.isConnected) saveFocus.focus(); saveFocus = null;
  }
  // rough rhythm analysis of a recording: voiced time and syllable-like energy peaks
  async function rhythm(blob) {
    try {
      const C = window.AudioContext || window.webkitAudioContext, ctx = context || new C();
      const buf = await new Promise(async (res, rej) => { const ab = await blob.arrayBuffer(); const p = ctx.decodeAudioData(ab, res, rej); if (p?.then) p.then(res, rej) });
      const d = buf.getChannelData(0), hop = Math.floor(buf.sampleRate * .02), env = [];
      for (let i = 0; i + hop <= d.length; i += hop) { let s = 0; for (let j = 0; j < hop; j++) s += d[i + j] * d[i + j]; env.push(Math.sqrt(s / hop)) }
      const sm = env.map((_, i) => (env[i - 1] || 0) * .25 + env[i] * .5 + (env[i + 1] || 0) * .25), max = Math.max(...sm, 1e-6), th = Math.max(.012, max * .22);
      let voiced = 0, peaks = 0, lastPeak = -9;
      for (let i = 1; i < sm.length - 1; i++) { if (sm[i] > th) voiced++; if (sm[i] > th * 1.4 && sm[i] >= sm[i - 1] && sm[i] > sm[i + 1] && i - lastPeak > 5) { peaks++; lastPeak = i } }
      return {voiced: voiced * .02, peaks, loud: max};
    } catch { return null }
  }
  function listen(target, callback) {
    closeMic(); stopSpeech(); styles(); unlock();
    const model = Array.isArray(target) ? target[0] : String(target || '');
    const targets = Array.isArray(target) ? target : [model];
    saveFocus = document.activeElement;
    const mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e };
    const dialog = mk('dialog'); dialog.id = 'salem-mic'; dialog.setAttribute('aria-labelledby', 'salem-mic-title');
    const heading = mk('h2', '', 'قُلْها لسالم · Say it to Salim'); heading.id = 'salem-mic-title';
    const phrase = mk('p', 'model'); phrase.dir = 'rtl';
    const spans = model.split(/(\s+)/).map(tok => { if (!tok.trim()) { phrase.append(tok); return null } const s = mk('span', '', tok); phrase.append(s); return s }).filter(Boolean);
    const glossBox = mk('div'); glossBox.innerHTML = window.Gloss?.html(model) || '';
    const listenRow = mk('div', 'mic-actions');
    const micBtn = mk('button', 'bigmic', '🎤'); micBtn.type = 'button'; micBtn.setAttribute('aria-label', 'ابدأ التسجيل');
    const hint = mk('p', 'notice', 'اضغط الميكروفون وتكلّم · Tap the mic and speak'); hint.setAttribute('role', 'status');
    const heard = mk('p', 'heard'); heard.setAttribute('aria-live', 'polite');
    const result = mk('div'); const region = mk('div');
    const cancel = mk('button', 'cancel', 'العودة إلى المهمة · Back'); cancel.type = 'button';
    dialog.append(heading, phrase, glossBox, listenRow, micBtn, hint, heard, result, region, cancel); document.body.append(dialog);
    const m = {dialog, attempt: 0}; mic = m;
    if (dialog.showModal) dialog.showModal(); else { dialog.setAttribute('open', ''); dialog.style.position = 'fixed'; dialog.style.zIndex = '1500'; dialog.style.inset = '0' }
    dialog.addEventListener('cancel', e => { e.preventDefault(); stopSpeech(); closeMic() });
    cancel.onclick = () => { stopSpeech(); closeMic() };
    const button = (parent, label, fn, cls = '') => { const b = mk('button', cls, label); b.type = 'button'; b.onclick = fn; parent.append(b); return b };
    const sayModel = slow => { stopLive(); speak(model, slow) };
    button(listenRow, '🔊 اسمع سالمًا', () => sayModel(false)); button(listenRow, '🐢 ببطء', () => sayModel(true));
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    const canRecord = !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
    let recogOK = !!R, live = false, stream = null, recorder = null, recog = null, analyser = null, meterRaf = 0, chunksRec = [], finalText = '', alts = [], spoke = false, silence = 0, limit = 0, lastBlob = null, done = false;
    function stopLive() {
      clearTimeout(limit); cancelAnimationFrame(meterRaf); live = false; micBtn.classList.remove('live'); micBtn.textContent = '🎤'; micBtn.style.removeProperty('--lvl');
      if (recog) { const r = recog; recog = null; r.onresult = r.onerror = r.onend = null; try { r.abort() } catch {} }
      if (recorder && recorder.state !== 'inactive') { try { recorder.stop() } catch {} }
      stream?.getTracks().forEach(t => t.stop()); stream = null; analyser = null;
    }
    m.stopAll = () => { m.attempt++; stopLive(); if (m.audio) { m.audio.pause() } };
    const finish = (text, mode, ok, score) => { if (mic !== m) return; stopSpeech(); closeMic(); callback?.({text, match: ok, mode, score}) };
    function show(ev, text, mode, note) {
      done = true; result.replaceChildren(); region.replaceChildren();
      // a good overall score is not enough when a whole word was said wrongly
      const misses = mode === 'recognition' ? ev.words.filter(w => w.score < .55).length : 0;
      if (misses > Math.floor(ev.words.length / 4)) ev.score = Math.min(ev.score, passMark() - 5);
      const pass = ev.score >= passMark();
      spans.forEach((s, i) => { const w = ev.words[i]; s.className = !w ? '' : w.score >= .8 ? 'ok' : w.score >= .55 ? 'near' : 'miss' });
      const ring = mk('div', 'ring'); ring.style.setProperty('--p', ev.score); ring.style.setProperty('--c', pass ? '#1f7a4d' : ev.score >= passMark() - 20 ? '#d59a1b' : '#c8442f'); ring.append(mk('b', '', ev.score + '%'));
      const verdict = mk('p', 'verdict', pass ? (ev.score >= 90 ? 'مُمْتَاز! نطق واضح · Excellent!' : 'أَحْسَنْت! · Well done!') : ev.score >= passMark() - 20 ? 'قريب جدًّا، حاول مرة أخرى · Almost there' : 'حاول مرة أخرى ببطء · Try again slowly');
      const legend = mk('div', 'legend'); legend.innerHTML = '<span><i style="background:#bfe5c3"></i>صحيح</span><span><i style="background:#ffe2a3"></i>قريب</span><span><i style="background:#f6c3ba"></i>أعد نطقها</span>';
      result.append(ring, verdict, legend); if (note) result.append(mk('p', 'notice', note));
      heard.textContent = text ? 'سمعتُ: «' + text + '»' : '';
      chime(pass);
      const acts = mk('div', 'mic-actions'); region.append(acts);
      if (lastBlob) { m.url && URL.revokeObjectURL(m.url); m.url = URL.createObjectURL(lastBlob); const a = new Audio(m.url); m.audio = a; button(acts, '▶ صوتي', () => { stopSpeech(); a.currentTime = 0; a.play().catch(() => {}) }) }
      const weak = ev.words.filter(w => w.score < .8).map(w => w.word);
      if (weak.length && weak.length < ev.words.length) button(acts, '🔊 الكلمات الصعبة', () => speak(weak.join('، '), true));
      button(acts, '↻ أعد المحاولة', start);
      if (pass) button(acts, 'متابعة ✓', () => finish(text || model, mode, true, ev.score), 'go').focus();
      hint.textContent = pass ? '' : 'استمع إلى سالم ثم اضغط الميكروفون من جديد.';
    }
    async function judge(ticket) {
      if (mic !== m || ticket !== m.attempt || done) return;
      const candidates = [...new Set([finalText, ...alts].map(s => (s || '').trim()).filter(Boolean))];
      if (candidates.length) {
        let best = null, bestText = '';
        for (const c of candidates) for (const t of targets) { const ev = evaluate(t, c); if (!best || ev.score > best.score) { best = ev; bestText = c } }
        // colours always refer to the phrase shown on screen
        const shown = evaluate(model, bestText); shown.score = Math.max(shown.score, best.score);
        show(shown, bestText, 'recognition'); return;
      }
      if (lastBlob) {
        const r = await rhythm(lastBlob); if (mic !== m || ticket !== m.attempt) return;
        if (!r || r.voiced < .25) { hint.textContent = 'لم أسمع صوتًا واضحًا. قرّب الميكروفون وحاول مرة أخرى. · I could not hear you.'; return }
        const expect = window.Gloss?.syllables(model) || 4, ratio = r.peaks / expect, close = Math.max(0, 1 - Math.abs(1 - ratio) * 1.1);
        const score = Math.round(40 + 45 * close), ev = {score, words: spans.map(s => ({word: s.textContent, score: close > .7 ? .7 : .4}))};
        show(ev, '', 'self', 'هذا المتصفح لا يتعرّف على الكلام، فالتقييم هنا تقريبي للإيقاع وعدد المقاطع فقط. قارن تسجيلك بصوت سالم. · Approximate rhythm check only.');
        const acts = region.querySelector('.mic-actions'); if (acts && !acts.querySelector('.go')) button(acts, 'نطقي مطابق ✓', () => finish(model, 'self', true, score), 'go');
        return;
      }
      hint.textContent = 'لم أسمع عبارة واضحة. حاول مرة أخرى. · Nothing heard, try again.';
    }
    function meter() {
      if (!analyser || !live) return; const buf = new Uint8Array(analyser.fftSize); analyser.getByteTimeDomainData(buf);
      let s = 0; for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; s += v * v } const lvl = Math.min(1, Math.sqrt(s / buf.length) * 5);
      micBtn.style.setProperty('--lvl', lvl.toFixed(2));
      if (lvl > .12) { spoke = true; silence = 0 } else if (spoke) silence++;
      // without a recogniser, stop automatically after a pause
      if (!recog && spoke && silence > 70) { stopCapture(); return }
      meterRaf = requestAnimationFrame(meter);
    }
    let currentTicket = 0;
    function stopCapture() {
      if (!live) return; const ticket = currentTicket; clearTimeout(limit); live = false; micBtn.classList.remove('live'); micBtn.textContent = '🎤'; cancelAnimationFrame(meterRaf);
      hint.textContent = 'لحظة… أقيّم نطقك · Checking…';
      if (recog) { try { recog.stop() } catch {} }
      const fin = () => { stream?.getTracks().forEach(t => t.stop()); stream = null; setTimeout(() => judge(ticket), recog ? 900 : 60) };
      if (recorder && recorder.state !== 'inactive') { recorder.onstop = () => { if (chunksRec.length) lastBlob = new Blob(chunksRec, {type: recorder.mimeType || chunksRec[0].type}); fin() }; try { recorder.stop() } catch { fin() } } else fin();
    }
    async function start() {
      if (mic !== m) return; stopSpeech(); stopLive();
      const ticket = currentTicket = ++m.attempt; done = false; finalText = ''; alts = []; chunksRec = []; lastBlob = null; spoke = false; silence = 0;
      result.replaceChildren(); region.replaceChildren(); heard.textContent = ''; spans.forEach(s => s.className = '');
      if (!recogOK && !canRecord) { typing(); hint.textContent = 'الميكروفون غير متاح في هذا المتصفح. اكتب العبارة. · Microphone unavailable.'; return }
      // On phones the recogniser and a recorder cannot share the microphone, so the recogniser gets it.
      const wantStream = canRecord && (!recogOK || !isMobile);
      hint.textContent = 'اسمح باستخدام الميكروفون… · Allow the microphone';
      if (wantStream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: true, noiseSuppression: true, autoGainControl: true}});
          if (mic !== m || ticket !== m.attempt) { stream.getTracks().forEach(t => t.stop()); return }
          const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'], type = types.find(t => window.MediaRecorder.isTypeSupported?.(t));
          recorder = new MediaRecorder(stream, type ? {mimeType: type} : undefined);
          recorder.ondataavailable = e => { if (e.data.size) chunksRec.push(e.data) }; recorder.start();
          if (context) { try { const src = context.createMediaStreamSource(stream); analyser = context.createAnalyser(); analyser.fftSize = 1024; src.connect(analyser) } catch { analyser = null } }
        } catch (e) {
          stream = null; recorder = null;
          if (!recogOK) { typing(); hint.textContent = 'لم يُسمح بالميكروفون. اسمح به من إعدادات المتصفح، أو اكتب العبارة. · Microphone blocked.'; return }
        }
      }
      if (recogOK) {
        try {
          const r = new R(); recog = r; r.lang = 'ar-SA'; r.continuous = false; r.interimResults = true; r.maxAlternatives = 5;
          r.onresult = e => { if (mic !== m || ticket !== m.attempt) return; let interim = '';
            for (let i = e.resultIndex; i < e.results.length; i++) { const res = e.results[i]; if (res.isFinal) { finalText = (finalText + ' ' + res[0].transcript).trim(); for (let k = 1; k < res.length; k++) alts.push(res[k].transcript) } else interim += res[0].transcript }
            heard.textContent = (finalText || interim) ? '… ' + (finalText || interim) : ''; spoke = true; if (interim && !finalText) alts[0] = interim };
          r.onerror = e => { if (mic !== m || ticket !== m.attempt) return;
            if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { recogOK = false; stopLive(); hint.textContent = 'لم يُسمح بالميكروفون أو بخدمة التعرّف. اسمح به من إعدادات المتصفح ثم أعد المحاولة. · Microphone permission needed.'; typing(true) }
            else if (e.error === 'network' || e.error === 'language-not-supported') { recogOK = false; if (!stream) { stopLive(); hint.textContent = 'خدمة التعرّف على الكلام غير متاحة الآن. اضغط الميكروفون للتسجيل والمقارنة. · Recognition unavailable; tap to record.' } } };
          r.onend = () => { if (mic !== m || ticket !== m.attempt) return; recog = null; if (live) stopCapture(); };
          r.start();
        } catch { recog = null; recogOK = false; if (!stream) { hint.textContent = 'التعرّف على الكلام غير متاح. اضغط الميكروفون للتسجيل. · Tap to record.'; return } }
      }
      live = true; micBtn.classList.add('live'); micBtn.textContent = '■'; hint.textContent = 'تكلّم الآن… ثم اضغط للإنهاء · Speak now, tap to finish';
      if (analyser) meter();
      limit = setTimeout(stopCapture, 15000);
    }
    function typing(keep) {
      if (!keep) { stopLive(); result.replaceChildren() } region.replaceChildren();
      const label = mk('label', '', 'اكتب العبارة بالعربية · Type it in Arabic'); const input = mk('input'); input.lang = 'ar'; input.dir = 'rtl'; input.maxLength = 400; label.append(input); region.append(label);
      const submit = () => { const text = input.value.trim(); if (!text) { hint.textContent = 'اكتب محاولتك أولًا.'; return } const ev = evaluate(model, text); if (targets.some(t => similarity(t, text) >= .9)) finish(text, 'text', true, ev.score); else { spans.forEach((s, i) => { const w = ev.words[i]; s.className = w.score >= .9 ? 'ok' : w.score >= .6 ? 'near' : 'miss' }); hint.textContent = 'قارن ما كتبت بالنموذج ثم حاول مرة أخرى.' } };
      const row = mk('div', 'mic-actions'); region.append(row); button(row, 'تحقّق ✓', submit, 'go'); input.onkeydown = e => { if (e.key === 'Enter') submit() }; if (!keep) input.focus();
    }
    micBtn.onclick = () => { if (live) stopCapture(); else start() };
    const alt = mk('div', 'mic-actions'); dialog.insertBefore(alt, cancel); button(alt, '⌨ أكتب بدل الكلام', () => { m.attempt++; typing() }, 'cancel');
    if (!window.isSecureContext && window.location.protocol !== 'file:') hint.textContent = 'الميكروفون يحتاج إلى رابط آمن (https). · The microphone needs an https link.';
    setTimeout(() => { if (mic === m && !live && !done) speak(model, false) }, 250);
  }
  if (synth) { synth.addEventListener?.('voiceschanged', refreshVoices); refreshVoices() }
  for (const ev of ['pointerdown', 'keydown', 'touchend']) document.addEventListener(ev, unlock, {capture: true, passive: true});
  window.addEventListener('pagehide', () => { closeMic(); stopSpeech(); context?.suspend().catch(() => {}) });
  window.addEventListener('pageshow', () => { if (context?.state === 'suspended') context.resume().catch(() => {}) });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopSpeech() });
  window.Sound = {unlock, say: speak, listen, evaluate, chime, stop() { closeMic(); stopSpeech() }, env: environment, configure, pause, voicesReady() { refreshVoices(); return !!arabicVoice() || (settings().online !== false && navigator.onLine) }};
})();
