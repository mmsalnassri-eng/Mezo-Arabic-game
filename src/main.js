'use strict';
const $=id=>document.getElementById(id);
const places={
 lane:{name:'الحارة القديمة',title:'التحية والتعارف',icon:'door',en:'Old quarter',terms:'حارة · old quarter | باب · door | لافتة · sign'},
 majlis:{name:'سبلة الحارة',title:'القهوة وآداب الضيافة',icon:'coffee',en:'Village meeting room',terms:'سبلة · community gathering room | فنجان · small cup | ضيف · guest'},
 mosque:{name:'المسجد',title:'الاستئذان وآداب الزيارة',icon:'mosque',en:'Mosque entrance',terms:'مدخل · entrance | رفّ · shelf | إذن · permission'}
};
const defaults={level:0,placed:false,xp:0,lessons:{},entries:{},voice:true,effects:true,music:false,slow:false,large:false,tr:true,online:true,words:{}};
let state=structuredCopy(defaults),storageOK=true,playing=false,worldOn=false,near=null,pending=null,lessonPlace=null,lastSpeech='',lastEl=null,focusSource=null,toastTimer;
function structuredCopy(v){return JSON.parse(JSON.stringify(v))}
try{const v=JSON.parse(localStorage.getItem('alhamra.journey.v1')||'null');if(v&&typeof v==='object'){state={...state,...v};for(const k of ['entries','lessons'])if(!state[k]||typeof state[k]!=='object')state[k]={};if(![0,1,2].includes(state.level))state.level=0}}catch{storageOK=false}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
const icon=id=>'<svg class="ico" aria-hidden="true"><use href="#i-'+id+'"/></svg>';
function save(){try{localStorage.setItem('alhamra.journey.v1',JSON.stringify(state))}catch{if(storageOK)notice('تعذّر الحفظ في هذا المتصفح. يمكنك متابعة الجلسة الحالية.');storageOK=false}renderHome()}
function notice(text){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,4200)}
function renderHome(){
 document.body.classList.toggle('large',!!state.large);document.body.classList.toggle('notr',state.tr===false);
 $('tally').textContent=Object.keys(places).filter(id=>state.lessons[id]?.done).length.toLocaleString('ar-OM')+' من ٣ مكتملة';
 $('cards').innerHTML=Object.entries(places).map(([id,p])=>'<button class="card" onclick="enter(\''+id+'\')"><span class="medal">'+icon(p.icon)+'</span><span><strong>'+p.name+'</strong><span class="detail">'+p.title+(state.lessons[id]?.done?' · اكتملت':'')+'</span></span><span class="arrow">'+icon('arrow')+'</span></button>').join('');
 $('entry').innerHTML=(state.placed?'تابع الرحلة':'ابدأ الرحلة')+' '+icon('arrow');$('englishStart').textContent=state.placed?'Resume your journey':'Start your journey';
}
function show(title,html){
 if($('overlay').hidden)focusSource=document.activeElement;
 window.Sound?.stop();World.cancelFindDoor?.();lastEl=null;
 if(worldOn)World.setPaused(true);
 $('overlay').hidden=false;$('sheetTitle').textContent=title;$('body').innerHTML=html;inlineGuide();$('body').scrollTop=0;$('dismiss').focus({preventScroll:true});
}
function close(){
 const wasPlacement=!playing&&pending!==null;
 Sound.stop();$('overlay').hidden=true;lastEl=null;
 if(wasPlacement&&state.placed){const id=pending;pending=null;launch(id||null);return}
 if(wasPlacement)pending=null;
 if(worldOn)World.setPaused(!playing);Sound.pause(!playing);
 if(focusSource&&focusSource.isConnected&&focusSource.getClientRects().length)focusSource.focus({preventScroll:true});
}
function say(text,slow=false,element){lastSpeech=text;lastEl=element;Sound.say(text,slow,element)}
window.Game={state,save,show,close,say,listen:(t,cb)=>Sound.listen(t,cb),stopAudio:()=>Sound.stop(),notice};
window.nearPlace=id=>{near=id;$('talk').innerHTML=icon('chat')+' '+(places[id]?'تحدّث في '+places[id].name:'تحدّث إلى سالم')};
window.openPlace=id=>{if(!places[id])return;lessonPlace=id;Lessons.start(id)};
window.environmentTick=env=>Sound.env(env);
function enter(id=null){Sound.unlock();if(!state.placed){pending=id||'';Lessons.placement()}else launch(id)}
function launch(id){playing=true;$('home').hidden=true;$('play').hidden=false;$('overlay').hidden=true;Sound.pause(false);
 const ready=()=>{if(!playing)return;World.setPaused(false);if(id){World.go(id);openPlace(id)}else notice('اقترب من لافتة أو اختر «المحطّات» · Walk to a sign, or tap the 🔊 words around the village.')};
 if(worldOn){ready();return}
 const ld=document.createElement('div');ld.className='loading';ld.innerHTML='<i></i><span>جارٍ بناء القرية…<br><small lang="en" dir="ltr">Building the village…</small></span>';$('play').append(ld);
 setTimeout(()=>{try{World.init()}catch(e){console.error(e)}ld.remove();worldOn=true;
  for(const [k,r] of Object.entries(state.lessons)){if(k==='lane'&&r.evidence?.act4)World.outcome(k,'welcome');if(k==='majlis'&&r.evidence?.reply)World.outcome(k,r.intent?'decline':'accept');if(k==='mosque'&&r.evidence?.act4)World.outcome(k,'shelf')}
  ready()},80);}
function doTalk(){if(near)World.interact();else helpGuide()}
function goPlace(id){close();World.go(id);lessonPlace=id;notice('وصلت إلى '+places[id].name+'، اختر «تحدّث».')}
function atlas(){show('محطّات الحمراء','<p>اختر محطة للانتقال إليها، أو أغلق الخريطة وتابع السير.</p>'+Object.entries(places).map(([k,p])=>'<button class="mapRow" onclick="goPlace(\''+k+'\')"><span>'+icon(p.icon)+' '+p.name+'</span><small>'+p.title+' ←</small></button>').join(''))}
function homePage(){pending=null;playing=false;close();$('play').hidden=true;$('home').hidden=false;renderHome();$('entry').focus()}
function pauseMenu(){show('استراحة قصيرة','<div class="center"><button class="primary" onclick="Game.close()">متابعة التجوّل</button><button onclick="settings()">الإعدادات</button><button onclick="homePage()">العودة إلى البداية</button></div>');Sound.pause(true)}
function settings(){show('إعدادات الرحلة','<div class="prefs">'+[['voice','كلام سالم'],['effects','أصوات المكان'],['music','الموسيقى الهادئة'],['slow','نطق أبطأ'],['tr','الترجمة والنطق بالحروف اللاتينية · Translation & pronunciation'],['online','صوت عربي عبر الإنترنت إن لم يوجد صوت عربي في الجهاز'],['large','تكبير النص']].map(([k,l])=>'<label><input type="checkbox" data-pref="'+k+'" '+(state[k]?'checked':'')+'>'+l+'</label>').join('')+'<label>مستواي <select id="selectLevel" aria-label="مستواي"><option>مبتدئ · A1–A2</option><option>متوسط · B1</option><option>متقدم · B2–C1</option></select></label></div><div class="row"><button onclick="retake()">اختبار تحديد المستوى</button><button onclick="Game.close()">تم</button></div>');
 $('selectLevel').selectedIndex=state.level;$('selectLevel').onchange=e=>{state.level=e.target.selectedIndex;state.placed=true;save()};
 document.querySelectorAll('[data-pref]').forEach(el=>el.onchange=()=>{state[el.dataset.pref]=el.checked;Sound.configure();save()});}
function retake(){if(!playing)pending='';Lessons.placement()}
function about(){show('عن خريطة اللعبة','<p>هذه محاكاة تعليمية مصغّرة لحارة الحمراء. البيوت والأزقة والمجلس والمداخل نماذج مرسومة بالكود. موضع السبلة وتفاصيل مدخل المسجد تمثيلية.</p><p>تضم المرحلة الأولى الحارة والسبلة والمسجد. استلهمت مبانيها من المسح المعماري للحارة، بما فيه البيوت الطينية والفلج والنخيل.</p><p><a href="https://edition-et.de/images/oman.pdf" target="_blank" rel="noopener">المسح المعماري المصوّر</a> · <a href="https://www.openstreetmap.org/node/5287245122" target="_blank" rel="noopener">موقع بيت الصفاة على الخريطة</a></p>')}
function helpGuide(){
 const id=near||lessonPlace||'lane',p=places[id];
 const ask=['أَعِدْ مِنْ فَضْلِكَ','بِبُطْءٍ مِنْ فَضْلِكَ','مَا مَعْنَى هٰذِهِ الْكَلِمَةِ؟','كَيْفَ أَقُولُ…؟'];
 const practice=[['مَرْحَبًا','شُكْرًا','السَّلَامُ عَلَيْكُمْ','نَعَمْ، شُكْرًا','مَعَ السَّلَامَةِ'],
  ['كَيْفَ حَالُكَ؟','أَنَا بِخَيْرٍ، شُكْرًا','صَبَاحُ الْخَيْرِ','هَلْ تَسْمَحُ لِي بِالدُّخُولِ؟','أين أضع حذائي، من فضلك؟'],
  ['يسرّني أن أشارككم القهوة، شكرًا على الضيافة','هل تدلّني من فضلك على الموضع المخصّص للأحذية؟','أشكرك على كرمك، وأكتفي بما تفضّلت به','مَا مَعْنَى هٰذِهِ الْكَلِمَةِ؟']][state.level]||[];
 const sample=lastSpeech||'مَرْحَبًا بِكَ فِي الْحَمْرَاءِ.';
 show('تحدّث إلى سالم · Talk to Salim','<h3>تدرّب على النطق · Speaking practice</h3><p class="micro">اضغط 🎤 وسجّل صوتك، وسيقيّم سالم نطقك كلمةً كلمة. · Tap 🎤, record your voice and get word-by-word feedback.</p><div id="helpPractice"></div><h3>اسأل سالمًا · Ask Salim</h3><div class="center" id="helpBtns"></div><div id="helpAnswer" aria-live="polite"></div>');
 const tap=(container,label,fn)=>{const b=document.createElement('button');b.type='button';b.innerHTML='<span>'+esc(label)+'</span>'+Gloss.html(label.split(' · ').pop());b.onclick=fn;container.append(b);return b};
 practice.forEach(ph=>{const row=document.createElement('div');row.className='practiceRow';const text=document.createElement('div');text.innerHTML='<b>'+esc(ph)+'</b>'+Gloss.html(ph);
  const hear=document.createElement('button');hear.type='button';hear.textContent='🔊';hear.setAttribute('aria-label','اسمع');hear.onclick=()=>Sound.say(ph,true);
  const rec=document.createElement('button');rec.type='button';rec.className='primary';rec.textContent='🎤';rec.setAttribute('aria-label','سجّل نطقي');
  rec.onclick=()=>Sound.listen(ph,res=>{if(!res?.match)return;state.xp=(state.xp||0)+2;save();row.classList.add('done');notice('أحسنت! '+(res.score?res.score+'% · ':'')+'Well done.')});
  row.append(text,hear,rec);$('helpPractice').append(row)});
 ask.forEach((s,i)=>tap($('helpBtns'),s,()=>{Sound.say(s,true);const box=$('helpAnswer');box.replaceChildren();const para=document.createElement('p');para.textContent=i<2?sample:i===2?'':'اختر العبارة التي تريد قولها · Choose a phrase';box.append(para);
  if(i<2){box.insertAdjacentHTML('beforeend',Gloss.html(sample));tap(box,i?'اسمع الجواب ببطء':'اسمع الجواب',()=>say(sample,!!i,para))}
  if(i===2)p.terms.split(' | ').forEach(v=>tap(box,v.split(' · ')[0],()=>say(v.split(' · ')[0],true)));
  if(i===3)['مَرْحَبًا','شُكْرًا','هَلْ تَسْمَحُ لِي بِالدُّخُولِ؟','كَيْفَ حَالُكَ؟','مَعَ السَّلَامَةِ'].forEach(a=>tap(box,a,()=>say(a,true)))}));
}
document.addEventListener('keydown',e=>{if(document.querySelector('#salem-mic,dialog[open]'))return;
 if(e.key==='Escape'){if(!$('overlay').hidden)close();else if(playing)pauseMenu()}
 if(e.key==='Tab'&&!$('overlay').hidden){const xs=[...$('overlay').querySelectorAll('button,input,select,textarea,a,summary,[tabindex="0"]')].filter(n=>!n.disabled&&n.getClientRects().length);if(!xs.length)return;const edge=e.shiftKey?xs[0]:xs[xs.length-1];if(document.activeElement===edge){e.preventDefault();xs[e.shiftKey?xs.length-1:0].focus()}}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing&&$('overlay').hidden)pauseMenu()});
renderHome();if(!storageOK)notice('الحفظ غير متاح في هذه الجلسة.');
Game.findDoor=callback=>{
 close();World.findDoor(callback);
};
function inlineGuide(){
 if(!$('ls-root')||!playing)return;
 const d=document.createElement('details');d.className='gloss';const h=document.createElement('summary');h.textContent='اسأل سالمًا · Ask Salim';d.append(h);
 const group=document.createElement('div');group.className='row';d.append(group);
 const answer=document.createElement('div');d.append(answer);
 const choice=(p,k,f)=>{let b=document.createElement('button');b.type='button';b.textContent=k;b.onclick=f;p.append(b)};
 const caption=()=>$('ls-cap')?.textContent||lastSpeech||'مَرْحَبًا بِكَ!';
 const words=places[lessonPlace||near||'lane'].terms.split(' | ');
 ['أعِدْ من فضلك','ببطء من فضلك','ما معنى هذه الكلمة؟','كيف أقول…؟'].forEach((phrase,i)=>choice(group,phrase,()=>{const txt=caption();Sound.say(phrase,true);answer.replaceChildren();if(i<2)choice(answer,(i?'اسمع ببطء · ':'اسمع · ')+txt,()=>say(txt,!!i,$('ls-cap')));else if(i===2)words.forEach(w=>choice(answer,w,()=>Sound.say(w.split(' · ')[0],true)));else [['Hello','مَرْحَبًا','MARHABAN'],['Thank you','شُكْرًا','SHUKRAN'],['May I?','هَلْ تَسْمَحُ لِي؟','HAL TASMAHU LI?']].forEach(([en,ar,pr])=>choice(answer,ar+' · '+pr+' · '+en,()=>Sound.say(ar,true)))}));
 $('body').append(d);
}

window.wordFound=w=>{Sound.say(w.ar,true);state.words=state.words||{};if(!state.words[w.id]){state.words[w.id]=1;state.xp=(state.xp||0)+2;save()}notice(w.ar+" · "+w.pron+" · "+w.en)};
