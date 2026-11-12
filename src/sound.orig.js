(() => {
  'use strict';
  const settings = () => window.Game?.state || {};
  const notify = text => window.Game?.notice?.(text);
  const synth = window.speechSynthesis;
  const locales = ['ar-om', 'ar-sa'];
  let voices = [], speech = null, serial = 0, waitVoice = null, caption, speechCleanup;
  let context, fx, musicBus, waterGain, windGain, engineGain, engineOsc, echoGain, echo, waterPan, windPan;
  let nextNote = 0, noteIndex = 0, nextBird = 0, nextStep = 0, paused = false, speaking = false;
  let mic = null, saveFocus = null;
  const defaultEnvironment = {x: 0, z: 0, water: 0, moving: false, surface: 'dirt', engine: 0, cave: false};
  let location = {...defaultEnvironment};
  const tokens = str => String(str || '').normalize('NFKC').replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06edـ]/g, '')
    .replace(/[أإآٱ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
  function similarity(a,b) {
    a=tokens(a).slice(0,400); b=tokens(b).slice(0,400);
    if (!a || !b) return 0;
    let row = Array.from({length:b.length+1}, (_,i)=>i);
    for(let i=1;i<=a.length;i++){
      const next = [i];
      for(let j=1;j<=b.length;j++) next.push(Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1)));
      row=next;
    }
    return 1 - row[b.length] / Math.max(a.length,b.length);
  }
  function match(target,text) {
    const targets=Array.isArray(target)?target:[target];
    return targets.some(t=>similarity(t,text) >= ([.68,.78,.86][Number(settings().level)] || .68));
  }
  function styles() {
    if(document.getElementById('sound-css')) return;
    const style=document.createElement('style'); style.id='sound-css';
    style.textContent=`
      .salem-lit{background:#ffdc88!important;color:#24271e!important;border-radius:.23em}
      #salem-caption{position:fixed;z-index:1100;inset:auto 50% 14px auto;transform:translateX(50%);max-width:min(38rem,84vw);width:max-content;pointer-events:none;border-radius:14px;background:#16382ef0;color:#fff;padding:.55em 1.1em;line-height:1.85;text-align:center}
      #salem-caption[hidden]{display:none}
      #salem-mic{color:#233c32;background:#fffaf0;border:1px solid #d0c6ad;padding:clamp(16px,4vw,32px);border-radius:24px;max-width:min(28rem,calc(100vw - 26px));max-height:85dvh;overflow:auto;box-sizing:border-box;box-shadow:0 20px 90px #172d2655;text-align:start;direction:rtl;font:inherit;line-height:1.7;margin:auto}
      #salem-mic::backdrop{background:#09271f96} #salem-mic h2{font-size:1.42em;margin:.15em 0 .55em}
      #salem-mic p{margin:.4em 0} #salem-mic .model{background:#f1eadb;border-radius:12px;padding:.65em .85em;font-size:1.12em}
      #salem-mic .mic-actions{display:flex;gap:.5em;flex-wrap:wrap;margin:.85em 0}
      #salem-mic button,#salem-mic input{font:inherit;border:1px solid #b9b9a5;border-radius:10px;background:#fffdf7;color:#213c2f;padding:.42em .74em;cursor:pointer}
      #salem-mic button:first-child{background:#245540;color:white;border-color:#245540}
      #salem-mic input{box-sizing:border-box;width:100%;cursor:text} #salem-mic audio{max-width:100%;display:block;margin:.5em 0}
      #salem-mic button:focus-visible,#salem-mic input:focus-visible{outline:3px solid #ae7820;outline-offset:2px}
      #salem-mic .notice{min-height:1.6em;color:#465546} #salem-mic .cancel{border:0;background:transparent;text-decoration:underline}
    `;document.head.append(style);
  }
  function refreshVoices() {
    try{voices=synth?.getVoices() || []}catch{voices=[]}
    if(arabicVoice() && waitVoice){const run=waitVoice;waitVoice=null;run()}
  }
  function arabicVoice() {
    const lang=v=>String(v.lang||'').toLowerCase().replace(/_/g,'-');
    for(const tag of locales){const best=voices.find(v=>lang(v)===tag);if(best)return best}
    return voices.find(v=>/^ar(?:-|$)/.test(lang(v)));
  }
  function ramp(node, value, delay=.08) {
    if(node && context && context.state!=='closed')node.gain.setTargetAtTime(value,context.currentTime,delay);
  }
  function configure() {
    const s=settings();
    ramp(fx,s.effects===false||paused?0:.75);
    ramp(musicBus,s.music&&!paused?(speaking ? .12 : .48):0,.15);
    if(s.voice===false && (speech || waitVoice))stopSpeech();
  }
  function setSpeaking(on) {
    speaking=on; window.World?.speaking?.(on);
    ramp(musicBus,settings().music&&!paused?(on ? .12 : .48):0,.15);
  }
  function stopSpeech() {
    serial++; waitVoice=null;
    if(synth && speech){try{synth.cancel()}catch{}}
    speech=null;
    if(speechCleanup){speechCleanup();speechCleanup=null}
    if(caption)caption.hidden=true;
    setSpeaking(false);
  }
  function speak(text,slow=false,element) {
    text=String(text||'').trim();stopSpeech(); if(!text)return;
    styles();
    let box=element instanceof Element ? element : null;
    // Preserve interactive word controls in a caller-owned instruction.
    const useSource=box && box.textContent.trim()===text && !box.querySelector('*');
    if(!useSource){
      if(!caption){caption=document.createElement('div');caption.id='salem-caption';caption.dir='rtl';document.body.append(caption)}
      box=caption;box.hidden=false;
    }
    const original=box.textContent;
    box.textContent='';
    const words=[];
    for(const hit of text.matchAll(/\S+|\s+/g)){
      if(/^\s/.test(hit[0]))box.append(document.createTextNode(hit[0]));
      else{const span=document.createElement('span');span.textContent=hit[0];box.append(span);words.push({span,start:hit.index,end:hit.index+hit[0].length})}
    }
    const token=serial;
    let linger,timeout, active;
    speechCleanup=()=>{clearTimeout(timeout);clearTimeout(linger);active?.classList.remove('salem-lit');if(useSource && box.textContent===text)box.textContent=original};
    const finish=()=>{
      if(token!==serial)return;
      speech=null;setSpeaking(false);active?.classList.remove('salem-lit');
      if(!useSource)linger=setTimeout(()=>{if(token===serial)box.hidden=true},2600);
    };
    const emit=status=>window.dispatchEvent(new CustomEvent('salem-utterance',{detail:{text,status}}));
    const fallback=()=>{emit('error');notify('الصوت العربي غير متاح على هذا الجهاز. يمكنك متابعة النص أو تفعيل صوت عربي في إعدادات الجهاز.');finish()};
    if(settings().voice===false){finish();return}
    if(!synth||!window.SpeechSynthesisUtterance){fallback();return}
    refreshVoices();
    const run=()=>{
      if(token!==serial)return;
      waitVoice=null;clearTimeout(timeout);
      const voice=arabicVoice();if(!voice){fallback();return}
      const u=new SpeechSynthesisUtterance(text);speech=u;
      u.voice=voice;u.lang=voice.lang;
      u.rate=(slow || settings().slow === true) ? .68 : ([.82,.92,1][Number(settings().level)]||.82);
      u.onstart=()=>{if(token===serial)setSpeaking(true)};
      u.onboundary=e=>{
        if(token!==serial||e.name==='sentence')return;
        const word=words.find(w=>w.start<=e.charIndex&&e.charIndex<w.end);
        if(word){active?.classList.remove('salem-lit');active=word.span;active.classList.add('salem-lit')}
      };
      u.onend=()=>{if(token===serial)emit('end');finish()};
      u.onerror=e=>{if(token!==serial)return;emit('error');if(!['interrupted','canceled'].includes(e.error))notify('تعذّر تشغيل النطق. اتبع النص المكتوب.');finish()};
      try{synth.speak(u)}catch{fallback()}
    };
    if(arabicVoice()||voices.length)run();
    else{waitVoice=run;timeout=setTimeout(run,1450)}
  }
  function panner(parent) {
    const p=context.createPanner();p.panningModel='equalpower';p.distanceModel='inverse';p.refDistance=10;p.rolloffFactor=.28;p.maxDistance=110;p.connect(parent);return p;
  }
  function position(p,x,y,z) {
    if(!p)return;
    if(p.positionX){p.positionX.value=x;p.positionY.value=y;p.positionZ.value=z}
    else if(p.setPosition)p.setPosition(x,y,z);
  }
  function filter(type,frequency) {
    const f=context.createBiquadFilter();f.type=type;f.frequency.value=frequency;return f;
  }
  function noise() {
    const len=Math.ceil(context.sampleRate*2);
    const b=context.createBuffer(1,len,context.sampleRate),samples=b.getChannelData(0);
    for(let i=0;i<len;i++)samples[i]=Math.random()*2-1;
    const source=context.createBufferSource();source.buffer=b;source.loop=true;return source;
  }
  function gain(value,parent) {const node=context.createGain();node.gain.value=value;node.connect(parent);return node}
  function tone(pitch,endPitch,duration,volume,wave,parent, spatial) {
    if(!context || context.state!=='running')return;
    const now=context.currentTime, osc=context.createOscillator(),g=context.createGain();
    osc.type=wave;osc.frequency.setValueAtTime(pitch,now);osc.frequency.exponentialRampToValueAtTime(Math.max(1,endPitch),now+duration);
    g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(volume,now+Math.min(duration*.2,.025));g.gain.exponentialRampToValueAtTime(.0001,now+duration);
    let p;
    if(spatial){p=panner(parent);position(p,...spatial);g.connect(p)}else g.connect(parent);
    osc.connect(g);osc.start();osc.stop(now+duration+.02);osc.onended=()=>{osc.disconnect();g.disconnect();p?.disconnect()};
  }
  function frame() {
    if(!context || paused || context.state!=='running' || document.hidden)return;
    const now=context.currentTime,{x,z}=location;
    if(settings().music && now>=nextNote){
      const sequence=[0,1,3,2,1,0,4,3,2,1,0,2];
      const cents=[0,150,350,500,700];
      const f=196*2**(cents[sequence[noteIndex%sequence.length]]/1200);
      tone(f,f,.85,.105,'sine',musicBus);
      if(noteIndex%4===0)tone(98,98,1.5,.045,'triangle',musicBus);
      nextNote=now+(noteIndex%4===3?2.2:1.1);noteIndex++;
    }
    if(settings().effects===false)return;
    if(!location.cave && now>=nextBird){tone(1460,2350,.16,.049,'sine',fx,[x+9,5,z-9]);nextBird=now+4+Math.random()*8}
    if(location.moving&&!location.engine && now>=nextStep){
      const stone=location.surface==='stone'||location.surface==='paved';
      tone(stone?220:118,stone?76:52,stone ? .085 : .125,stone ? .09 : .075,'triangle',fx,[x+.4,0,z]);
      if(location.cave)tone(135,51,.16,.08,'triangle',echo);
      nextStep=now+.37;
    }
  }
  function environment(data={}) {
    location={...location,...data};
    if(!context)return;
    const {x,z}=location, water=Math.min(1,Math.max(0,Number(location.water)||0));
    position(context.listener,x,1.6,z);position(waterPan,x-2-(1-water)*12,.2,z-1);position(windPan,x+4,4,z+8);
    ramp(waterGain,.13*water,.2);ramp(windGain,location.cave ? .012 : .063,.3);
    const speed=Math.max(0,Math.min(1,Number(location.engine)||0));
    ramp(engineGain,speed ? .05 : 0,.12);engineOsc.frequency.setTargetAtTime(32+speed*42,context.currentTime,.15);
    ramp(echoGain,location.cave ? .27 : 0,.18);
  }
  function unlock() {
    refreshVoices();
    const C=window.AudioContext||window.webkitAudioContext;
    if(!C)return;
    try{
      if(!context){
        context=new C();
        const master=gain(.68,context.destination);
        fx=gain(0,master);musicBus=gain(0,master);waterPan=panner(fx);windPan=panner(fx);
        waterGain=gain(0,waterPan);windGain=gain(0,windPan);
        const n=noise(),waterFilter=filter('bandpass',1450),windFilter=filter('lowpass',450);
        n.connect(waterFilter);waterFilter.connect(waterGain);n.connect(windFilter);windFilter.connect(windGain);n.start();
        engineGain=gain(0,fx);engineOsc=context.createOscillator();engineOsc.type='triangle';engineOsc.connect(engineGain);engineOsc.start();
        echo=context.createDelay(.8);echo.delayTime.value=.22;echoGain=gain(0,fx);echo.connect(echoGain);
        setInterval(frame,105);environment();configure();
      }
      if(context.state==='suspended')context.resume().catch(()=>{});
    }catch{notify('تعذّر تشغيل المؤثرات الصوتية على هذا الجهاز.')}
  }
  function pause(value) {paused=!!value;configure()}
  function closeMic() {
    const m=mic;if(!m)return;
    mic=null;clearTimeout(m.limit);
    if(m.recognition){m.recognition.onresult=null;m.recognition.onerror=null;m.recognition.onend=null;try{m.recognition.abort()}catch{}}
    if(m.recorder && m.recorder.state!=='inactive'){m.recorder.onstop=null;try{m.recorder.stop()}catch{}}
    if(m.audio){m.audio.pause();m.audio.removeAttribute('src')}
    m.stream?.getTracks().forEach(t=>t.stop());
    if(m.url)URL.revokeObjectURL(m.url);
    if(m.dialog.open) m.dialog.close();
    m.dialog.remove();if(saveFocus?.isConnected)saveFocus.focus();saveFocus=null;
  }
  function listen(target,callback) {
    closeMic();stopSpeech();styles();
    const model=Array.isArray(target)?target[0]:String(target||'');
    saveFocus=document.activeElement;
    const dialog=document.createElement('dialog');dialog.id='salem-mic';dialog.setAttribute('aria-labelledby','salem-mic-title');
    const heading=document.createElement('h2');heading.id='salem-mic-title';heading.textContent='تدرّب على الكلام';
    const phrase=document.createElement('p');phrase.className='model';phrase.textContent=model;
    const detail=document.createElement('p');detail.textContent='نحتاج إلى إذن الميكروفون لسماع محاولتك. قد يستخدم متصفحك خدمة التعرّف الصوتي عبر الإنترنت. يبقى تسجيل المقارنة في جهازك.';
    const toolbar=document.createElement('div'), region=document.createElement('div'), status=document.createElement('p');status.className='notice';status.setAttribute('role','status');
    toolbar.className='mic-actions';const cancel=document.createElement('button');cancel.className='cancel';cancel.textContent='العودة إلى المهمة';cancel.onclick=()=>{stopSpeech();closeMic()};
    dialog.append(heading,phrase,detail,toolbar,region,status,cancel);document.body.append(dialog);
    const m={dialog};mic=m;
    if(dialog.showModal)dialog.showModal();else{dialog.setAttribute('open','');dialog.style.position='fixed';dialog.style.zIndex='1500'}
    dialog.addEventListener('cancel',e=>{e.preventDefault();stopSpeech();closeMic()});
    function button(parent,label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;parent.append(b);return b}
    function finish(text,mode,ok){if(mic!==m)return;stopSpeech();closeMic();callback?.({text,match:ok,mode})}
    function strip(){
      const group=document.createElement('div');group.className='mic-actions';region.append(group);return group;
    }
    function clear(){
      if(m.recognition){m.recognition.onend=null;m.recognition.onerror=null;m.recognition.onresult=null;try{m.recognition.abort()}catch{}m.recognition=null}
      if(m.recorder && m.recorder.state!=='inactive'){m.recorder.onstop=null;try{m.recorder.stop()}catch{}}
      m.stream?.getTracks().forEach(t=>t.stop());m.stream=null;
      if(m.audio){m.audio.pause();m.audio=null}
      if(m.url){URL.revokeObjectURL(m.url);m.url=null}
      clearTimeout(m.limit);stopSpeech();status.textContent='';region.replaceChildren();
    }
    function typing() {
      clear();const label=document.createElement('label');label.textContent='اكتب العبارة بالعربية';const input=document.createElement('input');input.lang='ar';input.dir='rtl';input.maxLength=400;
      label.append(input);region.append(label);const submit=()=>{const text=input.value.trim();if(!text){status.textContent='اكتب محاولتك أولًا.';return} const ok=match(target,text);if(ok)finish(text,'text',true);else status.textContent='قارن ما كتبت بالنموذج ثم حاول مرة أخرى.'};
      button(strip(),'تحقّق من الكتابة',submit);input.onkeydown=e=>{if(e.key==='Enter')submit()};input.focus();
    }
    const R=window.SpeechRecognition||window.webkitSpeechRecognition;
    const canRecord=!!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
    async function recording(){
      clear();
      const ticket=++m.attempt;
      if(!canRecord){typing();status.textContent='التسجيل غير متاح هنا. يمكنك إكمال المهمة كتابةً.';return}
      status.textContent='اسمح للمتصفح باستخدام الميكروفون لبدء التسجيل.';
      let stream;
      try{
        stream=await navigator.mediaDevices.getUserMedia({audio:true});
        if(mic!==m || ticket!==m.attempt){stream.getTracks().forEach(t=>t.stop());return}
        m.stream=stream;const recorder=new MediaRecorder(stream);m.recorder=recorder;const chunks=[];
        recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
        recorder.onerror=()=>{if(mic!==m||ticket!==m.attempt)return;m.attempt++;typing();status.textContent='تعذّر التسجيل. يمكنك كتابة العبارة.'};
        recorder.onstop=()=>{
          stream.getTracks().forEach(t=>t.stop());clearTimeout(m.limit);
          if(mic!==m || ticket!==m.attempt)return;
          region.replaceChildren();
          if(!chunks.length){status.textContent='لم يكتمل التسجيل. حاول مرة أخرى أو اكتب العبارة.';return}
          m.url=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType||chunks[0].type}));const audio=document.createElement('audio');m.audio=audio;audio.controls=true;audio.src=m.url;audio.setAttribute('aria-label','تسجيل محاولتك');audio.onplay=stopSpeech;region.append(audio);
          const actions=strip();button(actions,'استمع إلى سالم',()=>{audio.pause();speak(model,true,phrase)});button(actions,'قيّمت نطقي بنفسي',()=>finish(model,'self',true));button(actions,'أعد التسجيل',recording);
          status.textContent='استمع إلى صوتك، وقارنه بنطق سالم، ثم اختر التقييم الذاتي.';
        };
        recorder.start();status.textContent='جارٍ التسجيل. أوقف التسجيل عندما تنتهي.';
        const stop=()=>{if(recorder.state==='recording')recorder.stop()};button(strip(),'إنهاء التسجيل',stop);m.limit=setTimeout(stop,30000);
      }catch{stream?.getTracks().forEach(t=>t.stop());if(mic!==m||ticket!==m.attempt)return;typing();status.textContent='لم نحصل على تسجيل. يمكنك السماح بالميكروفون لاحقًا وإكمال المهمة كتابةً.'}
    }
    function recognition(){
      clear();const ticket=++m.attempt;
      const current=()=>mic===m&&ticket===m.attempt;
      try{
        const r=new R();m.recognition=r;r.lang='ar-SA';r.continuous=false;r.interimResults=false;r.maxAlternatives=3;
        r.onresult=e=>{if(!current())return;
          const candidates=Array.from(e.results[e.resultIndex]||[]).map(a=>a.transcript.trim());
          const text=candidates.find(t=>match(target,t)) || candidates[0] || '';
          status.textContent='سمع الجهاز: '+(text||'لم يتضح الكلام')+'، '+(match(target,text)?'العبارة مفهومة.':'يمكنك المحاولة مرة أخرى.');
          region.replaceChildren();if(match(target,text))button(strip(),'استخدم هذه الإجابة',()=>finish(text,'recognition',true));
        };
        r.onerror=()=>{if(!current())return;status.textContent=canRecord?'تعذّر التعرّف الصوتي. اختر تسجيل المقارنة أو الكتابة.':'تعذّر التعرّف الصوتي. يمكنك كتابة العبارة.'};
        r.onend=()=>{if(current() && status.textContent==='تحدّث الآن.')status.textContent='لم نسمع عبارة واضحة. حاول مرة أخرى أو اختر الكتابة.'};
        r.start();status.textContent='تحدّث الآن.';
      }catch{status.textContent='التعرّف الصوتي غير متاح. اختر التسجيل أو الكتابة.'}
    }
    m.attempt=0;
    if(R)button(toolbar,'تحدّث الآن',recognition);
    if(canRecord)button(toolbar,'سجّل وقارن',recording);
    button(toolbar,'اكتب الإجابة',()=>{m.attempt++;typing()});
    button(toolbar,'اسمع النموذج',()=>{m.attempt++;clear();speak(model,true,phrase)});
    if(!R && !canRecord){typing();status.textContent='الميكروفون غير متاح هنا. يمكنك كتابة العبارة.'}
    else if(!R)status.textContent='لا يدعم المتصفح التعرّف الصوتي. يمكنك تسجيل محاولتك ومقارنتها.';
  }
  if(synth){synth.addEventListener?.('voiceschanged',refreshVoices);refreshVoices()}
  document.addEventListener('pointerdown',unlock,{once:true,capture:true});
  document.addEventListener('keydown',unlock,{once:true,capture:true});
  window.addEventListener('pagehide',()=>{closeMic();stopSpeech();context?.suspend().catch(()=>{})});
  window.addEventListener('pageshow',()=>{if(context?.state==='suspended')context.resume().catch(()=>{})});
  window.Sound={unlock,say:speak,listen,stop(){closeMic();stopSpeech()},env:environment,configure,pause,voicesReady(){refreshVoices();return !!arabicVoice()}};
})();
