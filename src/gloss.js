/* Pronunciation (simple Latin spelling) and English meaning for every Arabic phrase in the game. */
window.Gloss = (() => {
  'use strict';
  const key = s => String(s || '').normalize('NFKC').replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
  const map = new Map();
  const add = (ar, pron, en) => { const k = key(ar); if (k && !map.has(k)) map.set(k, {pron: pron || '', en: en || ''}); };
  // scholarly transliteration (marḥaban) -> simple capitals (MARHABAN)
  const plain = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ʾʿ]/g, '’').toUpperCase();
  const data = [
    // ---- lane ----
    ['مَرْحَبًا! أَنَا سَالِمٌ. هٰذِهِ حَارَتِي. مَا اسْمُكَ؟', 'MARHABAN! ANA SALIM. HADHIHI HARATI. MA ISMUK?', 'Welcome! I am Salim. This is my neighbourhood. What is your name?'],
    ['أهلًا بك في الحارة. سيسألك جارنا عن اسمك، ثم يدلّك على بيته.', 'AHLAN BIKA FIL-HARA. SA-YAS’ALUKA JARUNA ‘AN ISMIK, THUMMA YADULLUKA ‘ALA BAYTIH.', 'Welcome to the quarter. Our neighbour will ask your name, then show you to his house.'],
    ['في هذه الحارة يعرف الجيران وقع خطوات بعضهم. أما أنت فوجه جديد. كيف تقدّم نفسك لمن يفتح لك بابه؟', 'FI HADHIHIL-HARA YA‘RIFUL-JIRAN WAQ‘A KHUTUWATI BA‘DIHIM. AMMA ANTA FA-WAJHUN JADID. KAYFA TUQADDIMU NAFSAKA LIMAN YAFTAHU LAKA BABAH?', 'In this quarter the neighbours know the sound of each other’s footsteps. You are a new face. How do you introduce yourself to whoever opens his door to you?'],
    ['عِنْدَ الْبَابِ أَقُولُ: مَرْحَبًا!', '‘INDAL-BAB AQUL: MARHABAN!', 'At the door I say: Welcome!'],
    ['اِسْمُ جَارِي سَالِمٌ.', 'ISMU JARI SALIM.', 'My neighbour’s name is Salim.'],
    ['هٰذَا بَيْتُ جَارِي.', 'HADHA BAYTU JARI.', 'This is my neighbour’s house.'],
    ['أَقِفُ عِنْدَ الْبَابِ.', 'AQIFU ‘INDAL-BAB.', 'I stand at the door.'],
    ['فِي الْحَارَةِ بُيُوتٌ.', 'FIL-HARATI BUYUT.', 'There are houses in the quarter.'],
    ['أَقْرَأُ لَافِتَةَ الْبَيْتِ.', 'AQRA’U LAFITATAL-BAYT.', 'I read the sign on the house.'],
    ['أبدأ بها لقاء جاري.', 'ABDA’U BIHA LIQA’A JARI.', 'I start meeting my neighbour with it.'],
    ['ماذا تكتب على بطاقة التعارف؟', 'MADHA TAKTUBU ‘ALA BITAQATIT-TA‘ARUF?', 'What do you write on a name card?'],
    ['أين يعيش الجار؟', 'AYNA YA‘ISHUL-JAR?', 'Where does the neighbour live?'],
    ['ماذا أطرق عند وصولي؟', 'MADHA ATRUQU ‘INDA WUSULI?', 'What do I knock on when I arrive?'],
    ['ما اسم المكان الذي يضم بيوت الجيران؟', 'MASMUL-MAKANIL-LADHI YADUMMU BUYUTAL-JIRAN?', 'What do we call the place that holds the neighbours’ houses?'],
    ['ما الذي أقرؤه لأعرف المكان؟', 'MALLADHI AQRA’UHU LI-A‘RIFAL-MAKAN?', 'What do I read to know where I am?'],
    ['اِقْرَأِ اللَّافِتَاتِ. أَيُّ كَلِمَةٍ تَبْدَأُ بِحَرْفِ الْبَاءِ؟', 'IQRA’IL-LAFITAT. AYYU KALIMATIN TABDA’U BI-HARFIL-BA’?', 'Read the signs. Which word begins with the letter B (ب)?'],
    ['أي لافتة تبدأ بحرف الباء؟', 'AYYU LAFITATIN TABDA’U BI-HARFIL-BA’?', 'Which sign begins with the letter B (ب)?'],
    ['أرشد زائرًا يتعلّم الحروف إلى اللافتة التي تبدأ بالباء.', 'ARSHID ZA’IRAN YATA‘ALLAMUL-HURUF ILAL-LAFITATIL-LATI TABDA’U BIL-BA’.', 'Guide a visitor who is learning the letters to the sign that begins with B (ب).'],
    ['هٰذَا بَيْتُ سَالِمٍ. أَيْنَ تَقِفُ؟', 'HADHA BAYTU SALIM. AYNA TAQIF?', 'This is Salim’s house. Where do you stand?'],
    ['يقول جارك: انتظرني عند باب بيتي. أي لافتة تتبع؟', 'YAQULU JARUK: INTADHIRNI ‘INDA BABI BAYTI. AYYA LAFITATIN TATBA‘?', 'Your neighbour says: wait for me at my front door. Which sign do you follow?'],
    ['وصف لك الجار مكان اللقاء فقال: سألقاك عند مدخل مسكني. اختر الوجهة.', 'WASAFA LAKAL-JARU MAKANAL-LIQA’ FA-QAL: SA-ALQAKA ‘INDA MADKHALI MASKANI. IKHTARIL-WIJHA.', 'The neighbour described the meeting place: “I will meet you at the entrance of my home.” Choose the destination.'],
    ['باب بيت سالم', 'BAB BAYT SALIM', 'Salim’s front door'], ['باب المسجد', 'BABUL-MASJID', 'the mosque door'], ['مدخل البستان', 'MADKHALUL-BUSTAN', 'the garden entrance'],
    ['مَرْحَبًا، اِسْمِي', 'MARHABAN, ISMI', 'Hello, my name is'],
    ['أَهْلًا بِكَ', 'AHLAN BIK', 'Welcome to you'],
    ['أَيُّ لَافِتَةٍ تَدُلُّ عَلَى مَسْكَنٍ؟', 'AYYU LAFITATIN TADULLU ‘ALA MASKAN?', 'Which sign points to a home?'],
    ['بَيْتُ خَالِدٍ', 'BAYTU KHALID', 'Khalid’s house'], ['رَفُّ الْأَحْذِيَةِ', 'RAFFUL-AHDHIYA', 'the shoe rack'],
    // ---- majlis ----
    ['تَفَضَّلْ، أَنْتَ ضَيْفُنَا. هَلْ تُرِيدُ قَهْوَةً؟', 'TAFADDAL, ANTA DAYFUNA. HAL TURIDU QAHWA?', 'Please come in, you are our guest. Would you like coffee?'],
    ['تفضّل بالجلوس. سأصبّ القهوة في فنجانك إن رغبت.', 'TAFADDAL BIL-JULUS. SA-ASUBBUL-QAHWATA FI FINJANIKA IN RAGHIBT.', 'Please sit down. I will pour coffee into your cup if you like.'],
    ['حين دخلنا السبلة، فسح لنا المضيف مكانًا ومدّ يده إلى الدلّة. كيف ترد على دعوته؟', 'HINA DAKHALNAS-SABLA, FASAHA LANAL-MUDIFU MAKANAN WA MADDA YADAHU ILAD-DALLA. KAYFA TARUDDU ‘ALA DA‘WATIH?', 'When we entered the sabla, the host made room for us and reached for the coffee pot. How do you answer his invitation?'],
    ['فِي السَّبْلَةِ نَسْتَقْبِلُ الضَّيْفَ.', 'FIS-SABLATI NASTAQBILUD-DAYF.', 'In the sabla we receive the guest.'],
    ['أَنَا ضَيْفٌ فِي الْحَارَةِ.', 'ANA DAYFUN FIL-HARA.', 'I am a guest in the quarter.'],
    ['يَصُبُّ الْمُضِيفُ الْقَهْوَةَ.', 'YASUBBUL-MUDIFUL-QAHWA.', 'The host pours the coffee.'],
    ['هٰذَا فِنْجَانُ الْقَهْوَةِ.', 'HADHA FINJANUL-QAHWA.', 'This is the coffee cup.'],
    ['يَقُولُ الْمُضِيفُ: تَفَضَّلْ.', 'YAQULUL-MUDIF: TAFADDAL.', 'The host says: please, go ahead.'],
    ['أَقُولُ لِلْمُضِيفِ: شُكْرًا.', 'AQULU LIL-MUDIF: SHUKRAN.', 'I say to the host: thank you.'],
    ['أين يجتمع أهل الحارة لاستقبال ضيوفهم؟', 'AYNA YAJTAMI‘U AHLUL-HARA LI-STIQBALI DUYUFIHIM?', 'Where do the people of the quarter gather to receive their guests?'],
    ['مَن يستقبله المضيف؟', 'MAN YASTAQBILUHUL-MUDIF?', 'Whom does the host receive?'],
    ['ما الشراب الذي عرضه المضيف؟', 'MASH-SHARABUL-LADHI ‘ARADAHUL-MUDIF?', 'Which drink did the host offer?'],
    ['فيمَ يقدّم المضيف القهوة؟', 'FIMA YUQADDIMUL-MUDIFUL-QAHWA?', 'In what does the host serve the coffee?'],
    ['ماذا يقول المضيف وهو يدعوك للجلوس؟', 'MADHA YAQULUL-MUDIFU WA HUWA YAD‘UKA LIL-JULUS?', 'What does the host say when he invites you to sit?'],
    ['كيف أعبّر عن امتناني بكلمة؟', 'KAYFA U‘ABBIRU ‘AN IMTINANI BI-KALIMA?', 'How do I say thanks in one word?'],
    ['أَيْنَ تَجْلِسُ مَعَ الْمُضِيفِ؟', 'AYNA TAJLISU MA‘AL-MUDIF?', 'Where do you sit with the host?'],
    ['دعاك جارنا إلى مجلس الحارة. أي لافتة تقصد؟', 'DA‘AKA JARUNA ILA MAJLISIL-HARA. AYYA LAFITATIN TAQSID?', 'Our neighbour invited you to the quarter’s meeting room. Which sign do you head for?'],
    ['يريد زائر أن يتعرّف إلى مجلس يجتمع فيه أهل الحارة لاستقبال ضيوفهم. أين تدلّه؟', 'YURIDU ZA’IRUN AN YATA‘ARRAFA ILA MAJLISIN YAJTAMI‘U FIHI AHLUL-HARA LI-STIQBALI DUYUFIHIM. AYNA TADULLUH?', 'A visitor wants to see the room where the people gather to receive guests. Where do you direct him?'],
    ['السَّبْلَة', 'AS-SABLA', 'the sabla (meeting room)'], ['الْبُسْتَان', 'AL-BUSTAN', 'the garden'], ['الْكَهْف', 'AL-KAHF', 'the cave'],
    ['مَا الَّذِي فَهِمَهُ الْمُضِيفُ مِنْ رَدِّكَ؟', 'MALLADHI FAHIMAHUL-MUDIFU MIN RADDIK?', 'What did the host understand from your reply?'],
    ['أيّ عبارة تروي ما فعله المضيف بعد ردّك؟', 'AYYU ‘IBARATIN TARWI MA FA‘ALAHUL-MUDIFU BA‘DA RADDIK?', 'Which phrase tells what the host did after your reply?'],
    ['انقل إلى زائر آخر ما حدث حين عرض عليك المضيف القهوة.', 'UNQUL ILA ZA’IRIN AKHAR MA HADATHA HINA ‘ARADA ‘ALAYKAL-MUDIFUL-QAHWA.', 'Tell another visitor what happened when the host offered you coffee.'],
    ['صَبَّ لِي الْقَهْوَةَ', 'SABBA LIL-QAHWA', 'He poured me coffee'], ['وَضَعَ الدَّلَّةَ جَانِبًا', 'WADA‘AD-DALLATA JANIBAN', 'He put the coffee pot aside'],
    ['نَعَمْ، شُكْرًا', 'NA‘AM, SHUKRAN', 'Yes, thank you'],
    ['نعم، أودّ فنجانًا، شكرًا', 'NA‘AM, AWADDU FINJANAN, SHUKRAN', 'Yes, I would like a cup, thank you'],
    ['يسرّني أن أشارككم القهوة، شكرًا على الضيافة', 'YASURRUNI AN USHARIKAKUMUL-QAHWA, SHUKRAN ‘ALAD-DIYAFA', 'I would be glad to share coffee with you; thank you for the hospitality'],
    ['شُكْرًا، أَكْتَفِي', 'SHUKRAN, AKTAFI', 'Thank you, I have had enough'],
    ['شكرًا، أكتفي بهذا القدر', 'SHUKRAN, AKTAFI BI-HADHAL-QADR', 'Thank you, this much is enough for me'],
    ['أشكرك على كرمك، وأكتفي بما تفضّلت به', 'ASHKURUKA ‘ALA KARAMIK, WA AKTAFI BIMA TAFADDALTA BIH', 'Thank you for your generosity; what you kindly offered is enough'],
    ['قَالَ الضَّيْفُ: شُكْرًا، أَكْتَفِي. مَاذَا يَفْعَلُ الْمُضِيفُ؟', 'QALAD-DAYF: SHUKRAN, AKTAFI. MADHA YAF‘ALUL-MUDIF?', 'The guest said: thank you, I have had enough. What does the host do?'],
    ['يضع الدلّة جانبًا', 'YADA‘UD-DALLATA JANIBAN', 'He puts the coffee pot aside'], ['يصبّ فنجانًا آخر', 'YASUBBU FINJANAN AKHAR', 'He pours another cup'], ['يسأل عن الطريق', 'YAS’ALU ‘ANIT-TARIQ', 'He asks for directions'],
    // ---- mosque ----
    ['هٰذَا مَدْخَلُ الْمَسْجِدِ. هُنَا رَفٌّ لِلْأَحْذِيَةِ.', 'HADHA MADKHALUL-MASJID. HUNA RAFFUN LIL-AHDHIYA.', 'This is the mosque entrance. Here is a rack for shoes.'],
    ['نقف عند المدخل. اقرأ اللوحة، ثم اسألني أين تضع حذاءك.', 'NAQIFU ‘INDAL-MADKHAL. IQRA’IL-LAWHA, THUMMA IS’ALNI AYNA TADA‘U HIDHA’AK.', 'We stop at the entrance. Read the sign, then ask me where to put your shoes.'],
    ['توقّفنا عند المدخل حتى نقرأ تعليمات المكان. اسأل مرافقك عمّا أشكل عليك، وانتظر جوابه.', 'TAWAQQAFNA ‘INDAL-MADKHAL HATTA NAQRA’A TA‘LIMATIL-MAKAN. IS’AL MURAFIQAKA ‘AMMA ASHKALA ‘ALAYK, WANTADHIR JAWABAH.', 'We stopped at the entrance to read the rules of the place. Ask your companion about anything unclear, and wait for his answer.'],
    ['هٰذَا مَسْجِدُ الْحَارَةِ.', 'HADHA MASJIDUL-HARA.', 'This is the quarter’s mosque.'],
    ['نَقِفُ عِنْدَ الْمَدْخَلِ.', 'NAQIFU ‘INDAL-MADKHAL.', 'We stand at the entrance.'],
    ['أَخْلَعُ حِذَائِي.', 'AKHLA‘U HIDHA’I.', 'I take off my shoes.'],
    ['أَضَعُ حِذَائِي عَلَى الرَّفِّ.', 'ADA‘U HIDHA’I ‘ALAR-RAFF.', 'I put my shoes on the rack.'],
    ['تَطْلُبُ اللَّافِتَةُ الْهُدُوءَ.', 'TATLUBUL-LAFITATUL-HUDU’.', 'The sign asks for quiet.'],
    ['أَطْلُبُ الْإِذْنَ قَبْلَ التَّصْوِيرِ.', 'ATLUBUL-IDHNA QABLAT-TASWIR.', 'I ask permission before taking photos.'],
    ['ما المكان الذي يقصده أهل الحارة للصلاة؟', 'MAL-MAKANUL-LADHI YAQSIDUHU AHLUL-HARA LIS-SALAH?', 'Where do the people of the quarter go to pray?'],
    ['أين تبدأ الزيارة قبل الدخول؟', 'AYNA TABDA’UZ-ZIYARA QABLAD-DUKHUL?', 'Where does the visit begin before going in?'],
    ['ماذا تخلع قبل دخول موضع الصلاة؟', 'MADHA TAKHLA‘U QABLA DUKHULI MAWDI‘IS-SALAH?', 'What do you take off before entering the prayer area?'],
    ['على أي شيء تضع الحذاء هنا؟', '‘ALA AYYI SHAY’IN TADA‘UL-HIDHA’A HUNA?', 'What do you put the shoes on here?'],
    ['ماذا تطلب لافتة «اخفض صوتك»؟', 'MADHA TATLUBU LAFITAT “IKHFID SAWTAK”?', 'What does the sign “lower your voice” ask for?'],
    ['ماذا تطلب قبل التصوير؟', 'MADHA TATLUBU QABLAT-TASWIR?', 'What do you ask for before taking photos?'],
    ['اِقْرَأْ: «هُدُوءٌ». مَاذَا تَفْعَلُ؟', 'IQRA’: “HUDU’”. MADHA TAF‘AL?', 'Read: “Quiet”. What do you do?'],
    ['تطلب اللوحة المحافظة على الهدوء. اختر التصرّف المناسب.', 'TATLUBUL-LAWHATUL-MUHAFADHATA ‘ALAL-HUDU’. IKHTARIT-TASARRUFAL-MUNASIB.', 'The sign asks visitors to keep quiet. Choose the right behaviour.'],
    ['أراد رفيقك أن ينادي صديقه من بعيد. ما التصرف الذي يوافق تعليمات المدخل؟', 'ARADA RAFIQUKA AN YUNADIYA SADIQAHU MIN BA‘ID. MAT-TASARRUFUL-LADHI YUWAFIQU TA‘LIMATIL-MADKHAL?', 'Your companion wanted to call his friend from far away. Which behaviour fits the rules at the entrance?'],
    ['أخفض صوتي', 'AKHFIDU SAWTI', 'I lower my voice'], ['أرفع صوتي', 'ARFA‘U SAWTI', 'I raise my voice'], ['أطرق الباب بقوة', 'ATRUQUL-BABA BI-QUWWA', 'I knock hard on the door'],
    ['ضَعْ حِذَاءَكَ عَلَى الرَّفِّ. أَيْنَ تَضَعُهُ؟', 'DA‘ HIDHA’AKA ‘ALAR-RAFF. AYNA TADA‘UH?', 'Put your shoes on the rack. Where do you put them?'],
    ['قال المرافق: ضع حذاءك على الرفّ بجانب المدخل. اختر الموضع.', 'QALAL-MURAFIQ: DA‘ HIDHA’AKA ‘ALAR-RAFFI BI-JANIBIL-MADKHAL. IKHTARIL-MAWDI‘.', 'The companion said: put your shoes on the rack beside the entrance. Choose the spot.'],
    ['أشار المرافق إلى الرفّ كي يبقى الممر خاليًا. أين تضع حذاءك؟', 'ASHARAL-MURAFIQU ILAR-RAFFI KAY YABQAL-MAMARRU KHALIYAN. AYNA TADA‘U HIDHA’AK?', 'The companion pointed to the rack so that the passage stays clear. Where do you put your shoes?'],
    ['على الرفّ', '‘ALAR-RAFF', 'on the rack'], ['في وسط المدخل', 'FI WASATIL-MADKHAL', 'in the middle of the entrance'], ['أمام الباب', 'AMAMAL-BAB', 'in front of the door'],
    ['أَيْنَ أَضَعُ حِذَائِي؟', 'AYNA ADA‘U HIDHA’I?', 'Where do I put my shoes?'],
    ['أين أضع حذائي، من فضلك؟', 'AYNA ADA‘U HIDHA’I, MIN FADLIK?', 'Where do I put my shoes, please?'],
    ['هل تدلّني من فضلك على الموضع المخصّص للأحذية؟', 'HAL TADULLUNI MIN FADLIKA ‘ALAL-MAWDI‘IL-MUKHASSASI LIL-AHDHIYA?', 'Could you please show me the place set aside for shoes?'],
    ['قُلْتَ: «هَلْ تَسْمَحُ لِي بِالتَّصْوِيرِ؟». قَالَ الْمُرَافِقُ: «أَرْجُو أَنْ تَتْرُكَ الْكَامِيرَا». مَاذَا تَفْعَلُ؟', 'QULTA: “HAL TASMAHU LI BIT-TASWIR?” QALAL-MURAFIQ: “ARJU AN TATRUKAL-KAMIRA.” MADHA TAF‘AL?', 'You said: “May I take photos?” The companion said: “Please leave the camera.” What do you do?'],
    ['أضع الكاميرا في حقيبتي', 'ADA‘UL-KAMIRA FI HAQIBATI', 'I put the camera in my bag'], ['ألتقط صورة الآن', 'ALTAQITU SURATAN AL-AN', 'I take a photo now'], ['أطلب من صديقي أن يصوّر بدلًا مني', 'ATLUBU MIN SADIQI AN YUSAWWIRA BADALAN MINNI', 'I ask my friend to take photos instead of me'],
    // ---- everyday helpers ----
    ['أَعِدْ مِنْ فَضْلِكَ', 'A‘ID MIN FADLIK', 'Please repeat'], ['بِبُطْءٍ مِنْ فَضْلِكَ', 'BI-BUT’ MIN FADLIK', 'Slowly, please'],
    ['مَا مَعْنَى هٰذِهِ الْكَلِمَةِ؟', 'MA MA‘NA HADHIHIL-KALIMA?', 'What does this word mean?'], ['كَيْفَ أَقُولُ…؟', 'KAYFA AQUL…?', 'How do I say…?'],
    ['مَرْحَبًا بِكَ فِي الْحَمْرَاءِ.', 'MARHABAN BIKA FIL-HAMRA’', 'Welcome to Al Hamra'], ['مَرْحَبًا بِكَ!', 'MARHABAN BIK!', 'Welcome!'],
    ['هَلْ تَسْمَحُ لِي بِالدُّخُولِ؟', 'HAL TASMAHU LI BID-DUKHUL?', 'May I come in?'], ['هَلْ تَسْمَحُ لِي؟', 'HAL TASMAHU LI?', 'May I?'],
    ['السَّلَامُ عَلَيْكُمْ', 'AS-SALAMU ‘ALAYKUM', 'Peace be upon you (hello)'], ['وَعَلَيْكُمُ السَّلَامُ', 'WA ‘ALAYKUMUS-SALAM', 'And upon you be peace'],
    ['كَيْفَ حَالُكَ؟', 'KAYFA HALUK?', 'How are you?'], ['أَنَا بِخَيْرٍ، شُكْرًا', 'ANA BI-KHAYR, SHUKRAN', 'I am fine, thank you'],
    ['مَعَ السَّلَامَةِ', 'MA‘AS-SALAMA', 'Goodbye'], ['صَبَاحُ الْخَيْرِ', 'SABAHUL-KHAYR', 'Good morning'], ['مَسَاءُ الْخَيْرِ', 'MASA’UL-KHAYR', 'Good evening'],
    ['نور', 'NUR', 'Nur (a name)'], ['سالم', 'SALIM', 'Salim (a name)']
  ];
  for (const d of data) add(...d);
  function get(text) {
    const k = key(text); if (!k) return null;
    if (map.has(k)) return map.get(k);
    // phrase + a name the learner typed ("مرحبًا، اسمي نور")
    for (const [p, v] of map) if (p.length > 6 && k.startsWith(p + ' ') && k.length - p.length < 34) return {pron: v.pron + ' …', en: v.en + ' …'};
    return null;
  }
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  function html(text, cls = '') {
    const g = get(text); if (!g) return '';
    return '<span class="tr ' + cls + '" lang="en" dir="ltr">' + (g.pron ? '<span class="pr">' + esc(g.pron) + '</span>' : '') + (g.en ? '<span class="en">' + esc(g.en) + '</span>' : '') + '</span>';
  }
  // rough syllable count, used for the rhythm check when speech recognition is unavailable
  function syllables(text) {
    const g = get(text);
    if (g?.pron) return (g.pron.match(/[AEIOU]+/g) || []).length || 1;
    return Math.max(1, Math.round(key(text).replace(/\s/g, '').length / 2.1));
  }
  return {add, get, html, key, plain, syllables};
})();
