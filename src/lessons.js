(() => {
'use strict';
const labels=['مبتدئ','متوسط','متقدّم'];
const english=['Beginner','Intermediate','Advanced'];
const G=()=>window.Game;
const state=()=>G().state;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ar=n=>Number(n).toLocaleString('ar-OM',{numberingSystem:'arab'});
const norm=s=>s.normalize('NFKC').replace(/[\u064b-\u065f\u0670ـ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[^\p{L}\p{N}\s]/gu,'').trim().replace(/\s+/g,' ');
const voices=()=>window.Sound?.voicesReady?.()??window.speechSynthesis?.getVoices?.().some(v=>/^ar(?:[-_]|$)/i.test(v.lang));
const zone={
lane:{
 title:'الحارة القديمة',speaker:'أحد أهل الحارة',ability:'أستطيع أن أحيّي وأعرّف بنفسي وأقرأ لافتة.',
 intro:['مَرْحَبًا! أَنَا سَالِمٌ. هٰذِهِ حَارَتِي. مَا اسْمُكَ؟','أهلًا بك في الحارة. سيسألك جارنا عن اسمك، ثم يدلّك على بيته.','في هذه الحارة يعرف الجيران وقع خطوات بعضهم. أما أنت فوجه جديد. كيف تقدّم نفسك لمن يفتح لك بابه؟'],
 roman:'Marḥaban! Anā Sālim. Hādhihi ḥāratī. Mā ismuk?',en:'Welcome! I am Salim. This is my neighbourhood. What is your name?',enMid:'Our neighbour will ask your name, then show you where he lives.',
 words:[
 ['مَرْحَبًا','welcome','marḥaban','عِنْدَ الْبَابِ أَقُولُ: مَرْحَبًا!','أبدأ بها لقاء جاري.'],
 ['اِسْم','name','ism','اِسْمُ جَارِي سَالِمٌ.','ماذا تكتب على بطاقة التعارف؟'],
 ['بَيْت','house','bayt','هٰذَا بَيْتُ جَارِي.','أين يعيش الجار؟'],
 ['بَاب','door','bāb','أَقِفُ عِنْدَ الْبَابِ.','ماذا أطرق عند وصولي؟'],
 ['حَارَة','neighbourhood','ḥāra','فِي الْحَارَةِ بُيُوتٌ.','ما اسم المكان الذي يضم بيوت الجيران؟'],
 ['لَافِتَة','sign','lāfita','أَقْرَأُ لَافِتَةَ الْبَيْتِ.','ما الذي أقرؤه لأعرف المكان؟']],
 scene:'عند باب الجار',name:true,
 acts:[
 ['اِقْرَأِ اللَّافِتَاتِ. أَيُّ كَلِمَةٍ تَبْدَأُ بِحَرْفِ الْبَاءِ؟','أي لافتة تبدأ بحرف الباء؟','أرشد زائرًا يتعلّم الحروف إلى اللافتة التي تبدأ بالباء.',['بَاب','حَارَة','لَافِتَة'],0,'انظر إلى النقطة تحت الحرف الأول.','Which sign starts with the letter bāʾ?','تعرّف الزائر إلى الباء على الباب.'],
 ['هٰذَا بَيْتُ سَالِمٍ. أَيْنَ تَقِفُ؟','يقول جارك: انتظرني عند باب بيتي. أي لافتة تتبع؟','وصف لك الجار مكان اللقاء فقال: سألقاك عند مدخل مسكني. اختر الوجهة.',['باب بيت سالم','باب المسجد','مدخل البستان'],0,'ابحث عن اسم صاحب البيت.','Meet Salim at his own front door.','وجدت باب سالم، فخرج لاستقبالك.']],
 speech:[['مَرْحَبًا، اِسْمِي','مَرْحَبًا، اِسْمِي','مرحبًا، اسمي'],['أَهْلًا بِكَ','أهلًا بك في الحارة','يسعدني أن ألتقي بك في الحارة']],
 quiz:['أَيُّ لَافِتَةٍ تَدُلُّ عَلَى مَسْكَنٍ؟',['بَيْتُ خَالِدٍ','مَدْخَلُ الْبُسْتَانِ','رَفُّ الْأَحْذِيَةِ'],0,'خالد يسكن في بيت.','Which sign names a residence?'],
 grammar:'نقول «هذا بيت» لأنّ بيتًا مذكّر، و«هذه حارة» لأنّ حارة مؤنّثة.',
 trace:'ب', post:['اكتب تحية واسمك لصديق في الحارة.','عرّف بنفسك، ثم صِف المكان الذي قابلت فيه سالمًا.','احكِ كيف بدأ لقاؤك بالجار، وما الذي ساعدك على فهم وصفه.'],
 example:['مَرْحَبًا، اسْمِي …','أنا … وقد التقيت سالمًا عند …','حين وصلت إلى الحارة …']
},
majlis:{
 title:'السبلة',speaker:'مضيف السبلة',ability:'أستطيع أن أقبل الضيافة أو أعتذر عنها بأدب.',
 intro:['تَفَضَّلْ، أَنْتَ ضَيْفُنَا. هَلْ تُرِيدُ قَهْوَةً؟','تفضّل بالجلوس. سأصبّ القهوة في فنجانك إن رغبت.','حين دخلنا السبلة، فسح لنا المضيف مكانًا ومدّ يده إلى الدلّة. كيف ترد على دعوته؟'],
 en:'Please come in. You are our guest. Would you like coffee?',enMid:'Please sit down. I will pour coffee into your cup if you like.',roman:'Tafaḍḍal, anta ḍayfunā. Hal turīdu qahwa?',
 words:[
 ['سَبْلَة','village meeting room','sabla','فِي السَّبْلَةِ نَسْتَقْبِلُ الضَّيْفَ.','أين يجتمع أهل الحارة لاستقبال ضيوفهم؟'],
 ['ضَيْف','guest','ḍayf','أَنَا ضَيْفٌ فِي الْحَارَةِ.','مَن يستقبله المضيف؟'],
 ['قَهْوَة','coffee','qahwa','يَصُبُّ الْمُضِيفُ الْقَهْوَةَ.','ما الشراب الذي عرضه المضيف؟'],
 ['فِنْجَان','coffee cup','finjān','هٰذَا فِنْجَانُ الْقَهْوَةِ.','فيمَ يقدّم المضيف القهوة؟'],
 ['تَفَضَّلْ','please, go ahead','tafaḍḍal','يَقُولُ الْمُضِيفُ: تَفَضَّلْ.','ماذا يقول المضيف وهو يدعوك للجلوس؟'],
 ['شُكْرًا','thank you','shukran','أَقُولُ لِلْمُضِيفِ: شُكْرًا.','كيف أعبّر عن امتناني بكلمة؟']],
 scene:'دعوة إلى القهوة',
 acts:[
 ['أَيْنَ تَجْلِسُ مَعَ الْمُضِيفِ؟','دعاك جارنا إلى مجلس الحارة. أي لافتة تقصد؟','يريد زائر أن يتعرّف إلى مجلس يجتمع فيه أهل الحارة لاستقبال ضيوفهم. أين تدلّه؟',['السَّبْلَة','الْبُسْتَان','الْكَهْف'],0,'تقول بطاقة المكان: مجلس أهل الحارة.','Choose the village meeting room.','رحّب بك المضيف وأشار إلى مكان للجلوس.'],
 ['هَلْ تُرِيدُ فِنْجَانًا؟','يسألك المضيف: هل أصبّ لك فنجانًا؟ اختر ما تفضّل.','عرض المضيف القهوة وأمهلك لتختار. كيف تبيّن له رغبتك؟',['نَعَمْ، شُكْرًا','شُكْرًا، أَكْتَفِي'],[0,1],'يمكنك قبول العرض أو الاعتذار عنه.','Both accepting and politely declining are welcome.',['صبّ لك المضيف فنجانًا.','ابتسم المضيف ووضع الدلّة جانبًا.']]],
 speech:[['نَعَمْ، شُكْرًا','نعم، أودّ فنجانًا، شكرًا','يسرّني أن أشارككم القهوة، شكرًا على الضيافة'],['شُكْرًا، أَكْتَفِي','شكرًا، أكتفي بهذا القدر','أشكرك على كرمك، وأكتفي بما تفضّلت به']],
 quiz:['قَالَ الضَّيْفُ: شُكْرًا، أَكْتَفِي. مَاذَا يَفْعَلُ الْمُضِيفُ؟',['يضع الدلّة جانبًا','يصبّ فنجانًا آخر','يسأل عن الطريق'],0,'اكتفى الضيف بما لديه.','The guest has had enough. What should the host do?'],
 grammar:'تسبق «هل» سؤالًا يمكن أن نجيب عنه بنعم أو لا. وتصلح «شكرًا» للقبول والاعتذار بحسب ما يأتي معها.',
 trace:'ف',post:['اكتب شكرًا لمضيفك.','اشكر المضيف واذكر ما اخترته في السبلة.','وفي ثقافتك؟ قارن طريقة قبول الضيافة أو الاعتذار عنها بما جرى في السبلة.'],
 example:['شُكْرًا لَكَ …','شكرًا على … وقد اخترت …','في السبلة … أما في ثقافتي …']
},
mosque:{
 title:'المسجد',speaker:'مرافق الزيارة',ability:'أستطيع أن أقرأ تعليمات المدخل وأطلب الإذن.',
 intro:['هٰذَا مَدْخَلُ الْمَسْجِدِ. هُنَا رَفٌّ لِلْأَحْذِيَةِ.','نقف عند المدخل. اقرأ اللوحة، ثم اسألني أين تضع حذاءك.','توقّفنا عند المدخل حتى نقرأ تعليمات المكان. اسأل مرافقك عمّا أشكل عليك، وانتظر جوابه.'],
 en:'This is the entrance to the mosque. Here is a shoe rack.',enMid:'At the entrance, read the sign and ask me where to put your shoes.',roman:'Hādhā madkhalu l-masjid. Hunā raffun lil-aḥdhiya.',
 words:[
 ['مَسْجِد','mosque','masjid','هٰذَا مَسْجِدُ الْحَارَةِ.','ما المكان الذي يقصده أهل الحارة للصلاة؟'],
 ['مَدْخَل','entrance','madkhal','نَقِفُ عِنْدَ الْمَدْخَلِ.','أين تبدأ الزيارة قبل الدخول؟'],
 ['حِذَاء','shoe','ḥidhāʾ','أَخْلَعُ حِذَائِي.','ماذا تخلع قبل دخول موضع الصلاة؟'],
 ['رَفّ','shelf','raff','أَضَعُ حِذَائِي عَلَى الرَّفِّ.','على أي شيء تضع الحذاء هنا؟'],
 ['هُدُوء','quiet','hudūʾ','تَطْلُبُ اللَّافِتَةُ الْهُدُوءَ.','ماذا تطلب لافتة «اخفض صوتك»؟'],
 ['إِذْن','permission','idhn','أَطْلُبُ الْإِذْنَ قَبْلَ التَّصْوِيرِ.','ماذا تطلب قبل التصوير؟']],
 scene:'عند المدخل',
 acts:[
 ['اِقْرَأْ: «هُدُوءٌ». مَاذَا تَفْعَلُ؟','تطلب اللوحة المحافظة على الهدوء. اختر التصرّف المناسب.','أراد رفيقك أن ينادي صديقه من بعيد. ما التصرف الذي يوافق تعليمات المدخل؟',['أخفض صوتي','أرفع صوتي','أطرق الباب بقوة'],0,'يريد أهل المكان أن يسمعوا صوتًا منخفضًا.','The sign asks visitors to keep quiet.','خفضت صوتك وتابعت الحديث بهدوء.'],
 ['ضَعْ حِذَاءَكَ عَلَى الرَّفِّ. أَيْنَ تَضَعُهُ؟','قال المرافق: ضع حذاءك على الرفّ بجانب المدخل. اختر الموضع.','أشار المرافق إلى الرفّ كي يبقى الممر خاليًا. أين تضع حذاءك؟',['على الرفّ','في وسط المدخل','أمام الباب'],0,'اتبع تعليمات المرافق عن رفّ الأحذية.','Place your shoes on the rack.','وضعت الحذاء على الرفّ وبقي المدخل خاليًا.']],
 speech:[['أَيْنَ أَضَعُ حِذَائِي؟','أين أضع حذائي، من فضلك؟','هل تدلّني من فضلك على الموضع المخصّص للأحذية؟']],
 quiz:['قُلْتَ: «هَلْ تَسْمَحُ لِي بِالتَّصْوِيرِ؟». قَالَ الْمُرَافِقُ: «أَرْجُو أَنْ تَتْرُكَ الْكَامِيرَا». مَاذَا تَفْعَلُ؟',['أضع الكاميرا في حقيبتي','ألتقط صورة الآن','أطلب من صديقي أن يصوّر بدلًا مني'],0,'طلب المرافق ترك الكاميرا.','Your companion asks you to put the camera away.'],
 grammar:'في «هل تسمح لي بالتصوير؟» نطلب الإذن. وفي «أين أضع حذائي؟» نسأل عن المكان.',
 trace:'م',post:['اكتب لصديق أين يضع حذاءه.','اكتب تعليمين لزائر يصل إلى المدخل.','اشرح كيف ساعدك الاستئذان على فهم عادات المكان، وقارنها بما تعرفه.'],
 example:['ضَعْ حِذَاءَكَ عَلَى …','عند المدخل … وقبل التصوير …','عندما طلبت الإذن … وفي ثقافتي …']
}};
const stages=['لقاء','كلمات المكان','موقف','حوار','موقف','لغز سالم','بطاقة بريدية'];
for(const z of Object.values(zone))for(const w of z.words)Gloss.add(w[0],Gloss.plain(w[2]),w[1]);
const gl=t=>current?Gloss.html(t):'';
const css=document.createElement('style');css.textContent=`
.lsn{display:grid;gap:14px;line-height:1.6;color:inherit;text-align:start}.lsn *{box-sizing:border-box}.lsn p,.lsn h3,.lsn h4{margin:0}.lsn h3{font-size:1.25em}.lsn small{font-size:.82em}.lsn .sub{opacity:.78}.lsn .latin{direction:ltr;text-align:left;font-family:system-ui,sans-serif;font-size:.87em}.lsn button,.lsn select{font:inherit;cursor:pointer;min-height:40px}.lsn button:focus-visible,.lsn input:focus-visible,.lsn textarea:focus-visible,.lsn summary:focus-visible{outline:3px solid #bd782d;outline-offset:2px}.lsn button{border-radius:11px;border:1px solid #ac9b76;background:#fffaf0;color:#2c3e32;padding:6px 13px}.lsn button:hover{background:#f0e8d4}.lsn button.lesson-main,.lsn button[aria-pressed=true]{background:#204b3e;color:#fff;border-color:#204b3e}.lsn button:disabled{opacity:.58;cursor:default}.lsn .row{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.lsn .trail{display:flex;gap:4px;margin:0}.lsn .trail i{height:4px;flex:1;background:#cecabb;border-radius:5px}.lsn .trail .hit{background:#2e755f}.lsn .paper{background:#fbf5e8;color:#273e32;border:1px solid #d6c8ab;border-inline-start:4px solid #b27644;border-radius:12px;padding:13px 16px}.lsn .utter{font-size:1.17em;font-weight:650;line-height:1.85}.lsn input,.lsn textarea{font:inherit;border:1px solid #a99d82;border-radius:8px;background:#fffef8;color:#29392d;padding:8px;width:100%;direction:rtl}.lsn .keys{display:flex;flex-wrap:wrap;gap:4px;margin-block:8px}.lsn .keys button{min-height:32px;padding:2px 9px}.lsn .fb{background:#e7efe5;border-radius:8px;color:#274a35;padding:8px 12px}.lsn .fb:empty{display:none}.lsn .signs{display:grid;gap:7px;grid-template-columns:repeat(auto-fit,minmax(min(130px,100%),1fr))}.lsn .signs button{font-weight:650;padding:11px 6px}.lsn .mini{min-height:32px;font-size:.86em}.lsn summary{cursor:pointer}.lsn .trace{width:min(100%,320px);height:115px;touch-action:none;border:1px solid #bfb89d;background:#fffdf4;border-radius:10px}.lsn .icon{width:50px;height:50px;display:block;color:#8c5733}.lsn .lex{display:grid;grid-template-columns:50px 1fr;gap:12px;align-items:center}.lsn .entry{border-bottom:1px solid #bdae92;padding-block:10px}.lsn .order{font-size:.82em;font-weight:700;color:#665635}.lsn [hidden]{display:none!important}
`;document.head.append(css);
const picts={
 house:'M4 16 16 5l12 11M7 15v13h18V15M13 28v-9h6v9',
 door:'M7 28V5h18v23M11 28V9h10v19M17 18h1',sign:'M16 29V5M5 6h18l5 4-5 4H5z',people:'M6 27v-4a6 6 0 0112 0v4m3-10a5 5 0 015 5v5M15 10a4 4 0 11-8 0 4 4 0 018 0zm7 4a4 4 0 100-8',cup:'M4 12h18v4a9 9 0 01-18 0zm18 1h3a3 3 0 010 6h-4M5 27h19M11 9q3-3 0-6',text:'M5 6h22v16H14l-7 5v-5H5zM10 12h12M10 16h8',mosque:'M3 27h26M6 27V15h15v12m-15-12q0-4 7-9 7 5 8 9M24 27V9h4v18M23 9l3-5 3 5M11 27v-5a2 2 0 014 0v5',shoe:'M4 22q5 0 10-8l4 3 2 1 3-1 4 4v4H4z',shelf:'M4 8v19M28 8v19M4 13h24M4 22h24M9 9h5v4H9z',card:'M4 7h24v18H4zM7 11h6v7H7zM17 12h7M17 17h7',quiet:'M4 14h5l7-6v16l-7-6H4zm18-2 6 8m0-8-6 8',hand:'M9 17V9a2 2 0 014 0v7-10a2 2 0 014 0v9-8a2 2 0 014 0v9-5a2 2 0 014 0v8q0 7-6 9h-3q-4 0-7-4l-5-7q-2-4 2-4z'};
const art=(zoneId,i)=>{let k=({lane:['hand','card','house','door','house','sign'],majlis:['house','people','cup','cup','hand','text'],mosque:['mosque','door','shoe','shelf','quiet','text']})[zoneId][i];return '<svg class="icon" viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="'+picts[k]+'"/></svg>'};
const bare=s=>s.replace(/[\u064b-\u065f\u0670]/g,'');
let session=0,ask=null,current='',currentCaption='',currentSlow=false,quizPos=0,quizResults=[];
function el(id){return document.getElementById('ls-'+id)}
function btn(text,action,style=''){return '<button type="button" class="'+style+'" data-ls="'+action+'">'+esc(text)+'</button>'}
function scene(title,html){ask=null;session++;G().show(title,'<section class="lsn" id="ls-root">'+html+'</section>');const root=el('root');root.addEventListener('click',onClick);
 if(current&&state().level===2){let walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(walker.nextNode())walker.currentNode.nodeValue=bare(walker.currentNode.nodeValue)}}
function bind(id,f){el(id)?.addEventListener('click',f)}
function say(text,target,slow=false){if(current&&state().level===2)text=bare(text);currentCaption=text;currentSlow=slow;G().say(text,slow,target)}
function fb(msg){const n=el('fb');if(n)n.textContent=msg}
function save(){G().save()}
function rec(){let r=state().lessons[current];if(!r||typeof r!=='object')r=state().lessons[current]={};r.step??=0;r.word??=0;r.attempts??=0;r.evidence??={};return r}
function attempt(){rec().attempts++;state().xp=(state().xp||0)+1;save()}
function step(n){rec().step=n;save();render()}
function cap(text){return '<p class="utter" id="ls-cap">'+esc(text)+'</p>'+gl(text)}
function speaker(){return btn('اسمع','play','mini')+' '+btn('ببطء','slow','mini')}
function msg(){return '<p class="fb" role="status" aria-live="polite" id="ls-fb"></p>'}
function header(i){return '<div><p class="order">'+esc(zone[current].title)+' · '+esc(stages[i])+' · '+ar(i+1)+' / '+ar(stages.length)+'</p><div class="trail" aria-hidden="true">'+stages.map((_,n)=>'<i class="'+(n<=i?'hit':'')+'"></i>').join('')+'</div></div>'}
function translation(t){return '<details><summary>المعنى بالإنجليزية</summary><p class="latin" lang="en">'+esc(t)+'</p></details>'}
function forms(input='write'){return '<details><summary>لوحة مفاتيح عربية</summary><div class="keys" data-for="'+input+'">'+Array.from('ابتثجحخدذرزسشصضطظعغفقكلمنهويءآأإؤئاةى').filter((x,i,a)=>a.indexOf(x)===i).concat(['مسافة','حذف']).map(c=>btn(c,'key')).join('')+'</div></details>'}
function drawKeys(b){let t=el(b.closest('.keys').dataset.for),k=b.textContent,p=t.selectionStart,q=t.selectionEnd;if(k==='حذف'&&p===q)p=Math.max(0,p-1);t.setRangeText(k==='مسافة'?' ':k==='حذف'?'':k,p,q,'end');t.focus();t.dispatchEvent(new Event('input'))}
function choices(opts){return '<div class="signs">'+opts.map((s,i)=>'<button type="button" data-ls="pick-'+i+'"><span>'+esc(s)+'</span>'+gl(s)+'</button>').join('')+'</div>'}
function ordered(opts,answer,seed){let shift=1+(seed%(opts.length-1||1));let p=opts.map((_,i)=>(i+shift)%opts.length);return {opts:p.map(k=>opts[k]),lookup:p,answers:Array.isArray(answer)?answer:[answer]}}
function hints(){return btn('ساعدني','hint','mini')+'<div class="sub" id="ls-help" aria-live="polite"></div>'}
function addHint(a){if(!ask)return;ask.h=(ask.h||0)+1;let i=Math.min(2,ask.h-1);el('help').textContent=ask.hints[i];let r=rec();r.help=Math.max(r.help||0,i+1);save()}
function question({prompt,options,right,hint,en,success,next,seed=0,heard=false,participate}){
 let list=ordered(options,right,seed),s=rec().step;
 scene(zone[current].title,header(s)+'<div class="paper">'+cap(prompt)+'<div class="row">'+speaker()+'</div></div>'+choices(list.opts)+msg()+hints()+'<div id="ls-next"></div>');
 currentCaption=prompt;ask={hints:[hint,en,'يمكنك اختيار «'+options[list.answers[0]]+'». '+hint],pick:i=>{
  if(ask.resolved)return;attempt();const choice=list.lookup[i];if(!list.answers.includes(choice)){fb('جرّب مرة أخرى. '+hint);return}
  ask.resolved=true;rec().evidence[s===5?'quiz':('act'+s)]=true;if(participate)participate(choice);save();const note=Array.isArray(success)?success[choice]:success;fb(note);el('next').innerHTML=btn('متابعة','continue','lesson-main');ask.next=next;
 }};
 if(heard)say(prompt,el('cap'));
}
function intro(){
 const z=zone[current],l=state().level,t=z.intro[l];scene(z.title,header(0)+'<div class="paper"><small>'+esc(current==='lane'?'سالم':z.speaker)+'</small>'+cap(t)+'<div class="row">'+speaker()+'</div></div>'+
 (l===2?'<details><summary>ساعدني · simpler version</summary><p>'+esc(z.intro[0])+'</p>'+Gloss.html(z.intro[0])+'</details>':'')+
 '<p class="sub">'+esc(z.ability)+'</p>'+btn('اكتشف كلمات المكان','next','lesson-main'));say(t,el('cap'));
}
function word(){
 const z=zone[current],r=rec(),l=state().level,i=r.word,w=z.words[i],idx=[i,(i+2)%6,(i+4)%6],list=ordered(idx.map(j=>z.words[j][0]),0,i);
 scene(z.title,header(1)+'<div class="paper"><small>كلمة '+ar(i+1)+' من ٦</small><div class="lex">'+art(current,i)+'<div><h3>'+esc(w[0])+'</h3>'+Gloss.html(w[0],'big')+'</div></div>'+cap(l===2?w[3].replace(/[\u064b-\u065f\u0670]/g,''):w[3])+'<div class="row">'+speaker()+' '+btn('🎤 انطقها · Say it','sayWord','mini')+'</div></div>'+
 (current==='majlis'&&i===0?'<details><summary>السَّبْلَة · معنى ثقافي</summary><p>مجلس يلتقي فيه أهل الحارة ويستقبلون الضيوف.</p><p class="latin" lang="en">A communal meeting room where neighbours gather and receive guests.</p></details>':'')+
 '<h3>'+esc(w[4])+'</h3>'+gl(w[4])+choices(list.opts)+msg()+hints()+'<div id="ls-next"></div>');
 currentCaption=el('cap').textContent;ask={sayTarget:l===0?w[0]:w[3],hints:[w[3],w[1],'الكلمة المناسبة: '+w[0]+'، ومعناها '+w[1]+'.'],pick:j=>{
 if(ask.resolved)return;attempt();if(list.lookup[j]!==0){fb('اسمع سالمًا مرة أخرى. '+w[3]);return}
 ask.resolved=true;fb('أحسنت. '+w[3]);el('next').innerHTML=btn(i===5?'إلى الموقف':'الكلمة التالية','continue','lesson-main');ask.next=()=>{if(i===5){r.evidence.words=true;step(2)}else{r.word++;save();word()}}}};
 say(currentCaption,el('cap'));
}
function action(index){
 const z=zone[current],a=z.acts[index],r=rec();
 if(current==='lane'&&index===1&&G().findDoor){let text=a[state().level];scene(z.title,header(4)+'<div class="paper">'+cap(text)+'<div class="row">'+speaker()+'</div></div><p>ابحث عن لافتة «بيت سالم»، ثم تفاعل مع الباب.</p>'+btn('أبحث عن الباب في الحارة','findDoor','lesson-main'));say(text,el('cap'));return}
 if(current==='majlis'&&index===1){question({prompt:['مَا الَّذِي فَهِمَهُ الْمُضِيفُ مِنْ رَدِّكَ؟','أيّ عبارة تروي ما فعله المضيف بعد ردّك؟','انقل إلى زائر آخر ما حدث حين عرض عليك المضيف القهوة.'][state().level],options:['صَبَّ لِي الْقَهْوَةَ','وَضَعَ الدَّلَّةَ جَانِبًا'],right:r.intent?1:0,hint:r.intent?'اعتذرتَ عن القهوة.':'قبلتَ عرض القهوة.',en:r.intent?'You declined the coffee.':'You accepted the coffee.',success:'فهم الزائر ما جرى في المجلس.',next:()=>step(5),seed:1,heard:true});return}
 question({prompt:a[state().level],options:a[3],right:a[4],hint:a[5],en:a[6],success:a[7],next:()=>step(index===0?3:5),seed:index+1,heard:true,participate:k=>{if(current==='mosque'&&index===1)window.World?.outcome?.('mosque','shelf');if(current==='lane'&&index===1)window.World?.outcome?.('lane','welcome')}});
}
function targetSpeech(){
 const z=zone[current],r=rec(),l=state().level;
 if(current==='lane')return z.speech[0][l]+' '+(state().learnerName||'سالم');
 return z.speech[current==='majlis'?(r.intent||0):0][l];
}
function speech(){
 const r=rec(),l=state().level,z=zone[current];let name=current==='lane'&&!state().learnerName;
 if(name){
 scene(z.title,header(3)+'<h3>مَا اسْمُكَ؟</h3><p class="latin">Type your name in Arabic, or choose the practice name نور.</p><label>اسمك<input id="ls-write" maxlength="30" autocomplete="off"></label>'+forms()+msg()+'<div class="row">'+btn('استخدم اسمي','useName','lesson-main')+btn('أتدرّب باسم نور','demoName')+'</div>');return}
 let target=targetSpeech(),caption=current==='lane'?'حيِّ الجار وعرِّف بنفسك.':current==='majlis'?'اختر ردّك، ثم قله للمضيف.':'اسأل مرافقك عن مكان الحذاء.';
 scene(z.title,header(3)+'<h3>'+caption+'</h3>'+(current==='majlis'?'<div class="row">'+btn('أقبل القهوة','intent0',!r.intent?'lesson-main':'')+btn('أعتذر بلطف','intent1',r.intent?'lesson-main':'')+'</div>':'')+'<div class="paper">'+cap(target)+'<div class="row">'+speaker()+'</div></div><div class="row">'+btn('🎤 أتحدّث · Speak','speak','lesson-main')+btn('أكتب الرد','type')+'</div><div id="ls-alt" hidden><label>ردّي<input id="ls-write" maxlength="200" autocomplete="off"></label>'+forms()+btn('أرسل الرد','submitTyped')+'</div>'+msg()+hints()+'<div id="ls-next"></div>');
 currentCaption=target;ask={hints:[caption,current==='lane'?'Say hello and introduce yourself.':current==='majlis'?'Tell your host whether you want coffee.':'Ask where you can put your shoes.',target],next:()=>step(4)};
}
function speechResult(res){
 if(!res)return;attempt();let text=res.text||'',mode=res.mode||'text';let pass=res.match===true;
 if(mode==='text')pass=pass||norm(text)===norm(targetSpeech());
 if(!pass){fb((text?'سمعتُ أو قرأتُ: «'+text+'». ':'')+'حاول مرة أخرى. استمع إلى النموذج، ثم قل العبارة أو اكتبها.');return}
 rec().evidence.reply=mode;if(current==='majlis')window.World?.outcome?.('majlis',rec().intent?'decline':'accept');save();const response=current==='lane'?'قال الجار: أهلًا بك يا '+state().learnerName+'!':current==='mosque'?'أشار المرافق إلى رفّ الأحذية.':rec().intent?'ابتسم المضيف ووضع الدلّة جانبًا.':'صبّ لك المضيف فنجانًا.';
 fb((res.score?'دقّة النطق '+ar(res.score)+'٪. ':'')+(text?'ردّك: «'+text+'». ':'')+response+(mode==='text'?' سُجّل الردّ كتابةً.':mode==='self'?' سُجّلت ملاحظتك الذاتية.':''));el('next').innerHTML=btn('متابعة','continue','lesson-main');
}
function riddle(){let z=zone[current],q=z.quiz;question({prompt:q[0],options:q[1],right:q[2],hint:q[3],en:q[4],success:'حللت لغز سالم. '+z.grammar,next:()=>step(6),seed:2})}
function postcard(){let z=zone[current],r=rec(),l=state().level;scene(z.title,header(6)+'<h3>بطاقة من '+z.title+'</h3><p>'+z.post[l]+'</p><div class="paper"><small>بداية ممكنة</small><p>'+z.example[l]+'</p></div><label>رسالتي<textarea id="ls-write" rows="3" maxlength="1400"></textarea></label>'+forms()+
 (l===0?'<details id="ls-trace"><summary>أتتبّع حرف '+z.trace+' بإصبعي</summary><canvas id="ls-canvas" class="trace" width="600" height="220"></canvas><div class="row">'+btn('أمسح وأحاول','clearTrace','mini')+'</div></details>':'')+
 '<details><summary>لمحة نحوية</summary><p>'+z.grammar+'</p></details>'+msg()+btn('احفظ بطاقتي في الدفتر','post','lesson-main'));
 el('write').value=r.draft||state().entries[current]||'';el('write').addEventListener('input',()=>{r.draft=el('write').value;save()});if(el('canvas'))trace();
}
function trace(){let c=el('canvas'),cx=c.getContext('2d');if(!cx)return;let run=false;
 const reset=()=>{cx.clearRect(0,0,c.width,c.height);cx.fillStyle='#ded1ae';cx.font='155px serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(zone[current].trace,300,105);cx.lineWidth=8;cx.lineJoin='round';cx.lineCap='round';cx.strokeStyle='#37694e'};
 const pos=e=>{let b=c.getBoundingClientRect();return [(e.clientX-b.left)*c.width/b.width,(e.clientY-b.top)*c.height/b.height]};
 c.onpointerdown=e=>{run=true;c.setPointerCapture(e.pointerId);let [x,y]=pos(e);cx.beginPath();cx.moveTo(x,y);cx.lineTo(x+.1,y+.1);cx.stroke()};c.onpointermove=e=>{if(run){cx.lineTo(...pos(e));cx.stroke()}};c.onpointerup=c.onpointercancel=()=>run=false;ask={reset};reset()}
function post(){
 const value=el('write').value.trim(),wc=value.match(/[\u0621-\u064A]+(?:[\u064B-\u065F\u0670\u0621-\u064A]+)*/g)||[];if(wc.length<[2,3,5][state().level]){fb('اكتب '+['كلمتين عربيّتين على الأقل.','ثلاث كلمات عربية على الأقل.','خمس كلمات عربية على الأقل.'][state().level]);return}
 const r=rec();attempt();state().entries[current]=value;r.draft=value;r.done=true;r.replaying=false;r.evidence.writing=true;save();complete();
}
function complete(){const z=zone[current];scene(z.title,'<p class="order">اكتملت الزيارة</p><h3>'+z.ability+'</h3><div class="paper"><small>بطاقتي البريدية</small><p>'+esc(state().entries[current]||'')+'</p></div><div class="row">'+btn('العودة إلى الحارة','close','lesson-main')+btn('دفتر الرحلة','journal')+btn('تدريب جديد','replay')+'</div>')}
function render(){let r=rec();if(r.done&&!r.replaying)return complete();[intro,word,()=>action(0),speech,()=>action(1),riddle,postcard][Math.min(r.step,6)]()}
const pq=[
 ['استماع','مَرْحَبًا، اِسْمِي سَالِمٌ.','مَا اسْمُ الْمُتَحَدِّثِ؟',['سَالِم','خَالِد','عَلِيّ'],0],
 ['قراءة','هٰذَا بَابُ الْبَيْتِ.','إِلَى أَيْنَ يُؤَدِّي الْبَابُ؟',['إِلَى السُّوقِ','إِلَى الْبَيْتِ','إِلَى الْمَسْجِدِ'],1],
 ['استماع','عند باب السبلة انعطف يسارًا، ثم قف بجانب النخلة.','أين تنتظر؟',['أمام باب السبلة','عند نهاية السوق','بجانب النخلة'],2],
 ['قراءة','موعد الرّي في السابعة مساءً. احضر قبل الموعد بساعة.','متى تحضر؟',['في السادسة مساءً','في الثامنة مساءً','في السادسة صباحًا'],0],
 ['استماع','هممت بمواصلة الطريق، لولا أن سالمًا دعاني إلى السبلة فلبّيت دعوته.','ما الذي حدث؟',['واصل المتحدّث سيره','استجاب المتحدّث للدعوة','اعتذر سالم عن الزيارة'],1],
 ['قراءة','كلما ابتعدت عن الحارة، خُيّل إليّ أن صوت الماء يتبعني.','أيّ معنى يقصده الراوي؟',['أنّ مجرى الفلج تغيّر','أنّ سالمًا ناداه','أنّ أثر المكان بقي في ذاكرته'],2]
];
function placement(){current='';quizPos=0;quizResults=[];placementQ()}
function placementQ(){let q=pq[quizPos],audio=q[0]==='استماع',has=voices()&&state().voice!==false;
 scene('اختبار تحديد المستوى','<p class="order">'+q[0]+' · '+ar(quizPos+1)+' / ٦</p><p class="sub">ثلاثة أسئلة استماع وثلاثة قراءة، في نحو دقيقتين. يمكنك تغيير المستوى بعد الاختبار.</p><p class="latin" lang="en">Choose one answer. Use “لا أعرف” (I don’t know) to skip. You can choose your level at the end.</p><div class="paper">'+(audio&&has?'<div class="row">'+btn('استمع إلى العبارة','play','lesson-main')+btn('ببطء','slow','mini')+btn('عرض النص','reveal','mini')+'</div><p class="utter" id="ls-cap" hidden>'+q[1]+'</p>':cap(q[1])+(audio?'<small>النص متاح للقراءة عند تعذّر النطق. يُسجَّل السؤال بوصفه قراءة.</small>':''))+'</div><h3>'+q[2]+'</h3>'+choices(q[3])+'<div class="row">'+btn('لا أعرف','skip','mini')+'</div>');
 currentCaption=q[1];const heard=audio&&has;ask={heard:false,eligible:heard,pick:i=>{if(ask.resolved)return;ask.resolved=true;quizResults.push({correct:i===q[4],mode:ask.heard?'listening':ask.eligible?'unmeasured':'reading'});quizPos++;if(quizPos<6)placementQ();else placementResult()}};
 if(heard)say(q[1],el('cap'));
}
function placementResult(){let score=quizResults.filter(a=>a.correct).length;
 let level=score>=5&&quizResults[4].correct&&quizResults[5].correct?2:score>=3?1:0;
 if(!quizResults.length)level=state().level||0;
 let count=quizResults.filter(x=>x.mode==='listening').length;
 scene('اختر مستوى الرحلة','<h3>يقترح سالم المستوى '+labels[level]+'</h3><p>أجبت عن '+ar(score)+' من ٦ إجابات صحيحة. أسئلة الاستماع التي أُنجزت دون النص: '+ar(count)+'.</p><label>مستوى الرحلة<select id="ls-level">'+labels.map((v,i)=>'<option value="'+i+'" '+(level===i?'selected':'')+'>'+v+' · '+english[i]+'</option>').join('')+'</select></label>'+btn('ابدأ رحلتي','placed','lesson-main'));
}
function journal(){current='';let cards=Object.entries(zone).map(([id,z])=>{let r=state().lessons[id]||{},reply=({recognition:'تعرّف صوتي',self:'تقييم ذاتي',text:'رد مكتوب'})[r.evidence?.reply];return '<article class="entry"><h3>'+z.title+'</h3><p>'+ (r.done?z.ability:r.step||r.attempts?'الزيارة جارية':'بانتظار الزيارة')+'</p>'+(reply?'<small>'+reply+' · </small>':'')+'<small>محاولات: '+ar(r.attempts||0)+'</small>'+(state().entries[id]?'<div class="paper">'+esc(state().entries[id])+'</div>':'')+'</article>'}).join('');
 scene('دفتر الرحلة','<p class="order">'+ar(Object.values(state().lessons).filter(r=>r?.done).length)+' / ٣ زيارات مكتملة · '+ar(state().xp||0)+' نقطة جهد · كلمات اكتشفتها في القرية: '+ar(Object.keys(state().words||{}).length)+' / '+ar(window.World?.words?.length||0)+'</p>'+cards+'<label>مستواي <select id="ls-jlevel">'+labels.map((v,i)=>'<option value="'+i+'" '+(state().level===i?'selected':'')+'>'+v+' · '+english[i]+'</option>').join('')+'</select></label><div class="row">'+btn('العودة إلى الرحلة','close','lesson-main')+btn('إعادة تحديد المستوى','placement','mini')+'</div>');
 el('jlevel').onchange=()=>{state().level=Number(el('jlevel').value);save()};
}
function onClick(e){
 const b=e.target.closest('button[data-ls]');if(!b)return;const a=b.dataset.ls;
 if(a.startsWith('pick-')){ask?.pick?.(Number(a.slice(5)));return}
 switch(a){
 case 'next':step(rec().step+1);break;
 case 'continue':ask?.next?.();break;
 case 'play':case 'slow':say(currentCaption,el('cap'),a==='slow');break;
 case 'hint':addHint();break;
 case 'key':drawKeys(b);break;
 case 'demoName':state().learnerName='نُور';save();speech();break;
 case 'useName':{const n=el('write').value.trim();if(!/^[\p{Script=Arabic}\s]{1,30}$/u.test(n)||!/[\u0621-\u064A]/.test(n)){fb('اكتب الاسم بحروف عربية، أو اختر اسم نور للتدريب.');break}state().learnerName=n;save();speech();break}
 case 'intent0':case 'intent1':rec().intent=Number(a.slice(-1));save();speech();break;
 case 'speak':{const token=session;G().listen(targetSpeech(),res=>{if(token===session&&el('root'))speechResult(res)});break}
 case 'sayWord':{const token=session,target=ask?.sayTarget;if(!target)break;G().listen(target,res=>{if(token!==session||!el('root')||!res?.match)return;attempt();state().xp+=2;rec().evidence.spoken=(rec().evidence.spoken||0)+1;save();fb('نطق جميل! '+(res.score?ar(res.score)+'٪ · ':'')+'Great pronunciation.')});break}
 case 'type':el('alt').hidden=false;el('write').focus();break;
 case 'submitTyped':speechResult({text:el('write').value,match:false,mode:'text'});break;
 case 'post':post();break;
 case 'close':session++;G().close();break;
 case 'journal':journal();break;
 case 'replay':{let r=rec();r.replaying=true;r.step=0;r.word=0;save();render();break}
 case 'clearTrace':ask?.reset?.();break;
 case 'skip':ask?.pick?.(-1);break;
 case 'reveal':el('cap').hidden=false;if(ask){ask.heard=false;ask.eligible=false}break;
 case 'findDoor':G().findDoor(()=>{current='lane';rec().evidence.act4=true;attempt();window.World?.outcome?.('lane','welcome');step(5)});break;
 case 'placement':placement();break;
 case 'placed':{state().level=Number(el('level').value);state().placed=true;state().placement={date:Date.now(),responses:quizResults};save();G().close();G().notice('اقترب من باب أو اختر وجهتك من الخريطة.');break}
 }
}
window.addEventListener('salem-utterance',event=>{
 const d=event.detail||{};if(current||!ask?.eligible||d.text!==pq[quizPos]?.[1]||!el('cap')?.hidden)return;
 if(d.status==='end')ask.heard=true;
 if(d.status==='error'){ask.heard=false;ask.eligible=false;el('cap').hidden=false}
});
window.Lessons={placement,journal,start(id){if(!Object.prototype.hasOwnProperty.call(zone,id))return;current=id;render()}};
})();
