/* GuruAgasthiya revamp: translations for the text the revamp adds, and for engine labels the
   v7.7 language engine leaves in English.

   The engine (I18N60) translates 109 labels into 44 languages and, in Tamil mode, swaps an
   English line for the Tamil line printed beside it. This file follows the same rules:
   - "English + தமிழ்" (bi) and "English only" (en): nothing changes here.
   - Tamil (ta): every revamp text, plus the engine's short labels (fields, buttons, options,
     planets, signs, stars), with patterns for dates, lord chains and the rising-now line.
   - Every other language: the main revamp labels (sidebar, pages, settings, result buttons).
     Long help text stays English there, as it does in the engine.
   Text is matched whole (a full text node, or a placeholder / title / aria-label), so a word
   inside a sentence is never changed. The original is kept and comes back when the language
   changes. Scripts call window.rvT(text) for text that carries values ({name} placeholders). */
(function () {
  'use strict';

  var LANGS = 'ta hi te kn ml mr gu bn pa or ur ne si sa es fr de pt it nl sv da fi pl cs ro hu ru uk el tr ar fa he zh zh-Hant ja ko th id ms vi sw fil'.split(' ');

  /* ---------- Main labels in every language (columns follow LANGS) ---------- */
  var MULTI = [
    'Now|இப்போது|अभी|ఇప్పుడు|ಈಗ|ഇപ്പോൾ|आता|હમણાં|এখন|ਹੁਣ|ବର୍ତ୍ତମାନ|ابھی|अहिले|දැන්|अधुना|Ahora|Maintenant|Jetzt|Agora|Adesso|Nu|Nu|Nu|Nyt|Teraz|Nyní|Acum|Most|Сейчас|Зараз|Τώρα|Şimdi|الآن|اکنون|עכשיו|现在|現在|現在|지금|ตอนนี้|Sekarang|Sekarang|Bây giờ|Sasa|Ngayon',
    'now|இப்போது|अभी|ఇప్పుడు|ಈಗ|ഇപ്പോൾ|आता|હમણાં|এখন|ਹੁਣ|ବର୍ତ୍ତମାନ|ابھی|अहिले|දැන්|अधुना|ahora|maintenant|jetzt|agora|adesso|nu|nu|nu|nyt|teraz|nyní|acum|most|сейчас|зараз|τώρα|şimdi|الآن|اکنون|עכשיו|现在|現在|現在|지금|ตอนนี้|sekarang|sekarang|bây giờ|sasa|ngayon',
    'Timings|நேரங்கள்|समय|సమయాలు|ಸಮಯಗಳು|സമയങ്ങൾ|वेळा|સમય|সময়|ਸਮੇਂ|ସମୟ|اوقات|समयहरू|වේලාවන්|समयाः|Horarios|Horaires|Zeiten|Horários|Orari|Tijden|Tider|Tider|Ajat|Godziny|Časy|Ore|Időpontok|Время|Час|Ώρες|Zamanlar|الأوقات|زمان‌ها|זמנים|时间|時間|時刻|시간|เวลา|Waktu|Masa|Thời gian|Nyakati|Oras',
    'Charts|ஜாதகங்கள்|कुंडली|జాతకాలు|ಜಾತಕಗಳು|ജാതകങ്ങൾ|कुंडल्या|કુંડળી|কুষ্ঠি|ਕੁੰਡਲੀਆਂ|କୁଣ୍ଡଳୀ|زائچے|कुण्डलीहरू|කේන්දර|कुण्डल्यः|Cartas|Thèmes|Horoskope|Mapas|Carte|Horoscopen|Horoskop|Horoskoper|Kartat|Horoskopy|Horoskopy|Hărți|Képletek|Карты|Карти|Χάρτες|Haritalar|الخرائط|زایچه‌ها|מפות|星盘|星盤|チャート|차트|ดวง|Bagan|Carta|Biểu đồ|Chati|Tsart',
    'Questions|கேள்விகள்|प्रश्न|ప్రశ్నలు|ಪ್ರಶ್ನೆಗಳು|ചോദ്യങ്ങൾ|प्रश्न|પ્રશ્નો|প্রশ্ন|ਸਵਾਲ|ପ୍ରଶ୍ନ|سوالات|प्रश्नहरू|ප්‍රශ්න|प्रश्नाः|Preguntas|Questions|Fragen|Perguntas|Domande|Vragen|Frågor|Spørgsmål|Kysymykset|Pytania|Otázky|Întrebări|Kérdések|Вопросы|Питання|Ερωτήσεις|Sorular|الأسئلة|پرسش‌ها|שאלות|问题|問題|質問|질문|คำถาม|Pertanyaan|Soalan|Câu hỏi|Maswali|Mga tanong',
    'Money and markets|பணம், சந்தை|धन और बाज़ार|డబ్బు, మార్కెట్|ಹಣ ಮತ್ತು ಮಾರುಕಟ್ಟೆ|പണം, വിപണി|पैसा आणि बाजार|નાણાં અને બજાર|অর্থ ও বাজার|ਪੈਸਾ ਅਤੇ ਬਾਜ਼ਾਰ|ଅର୍ଥ ଓ ବଜାର|پیسہ اور بازار|पैसा र बजार|මුදල් සහ වෙළඳපොළ|धनं विपणिः च|Dinero y mercados|Argent et marchés|Geld und Märkte|Dinheiro e mercados|Denaro e mercati|Geld en markten|Pengar och marknader|Penge og markeder|Raha ja markkinat|Pieniądze i rynki|Peníze a trhy|Bani și piețe|Pénz és piacok|Деньги и рынки|Гроші та ринки|Χρήμα και αγορές|Para ve piyasalar|المال والأسواق|پول و بازار|כסף ושווקים|财富与市场|財富與市場|お金と相場|돈과 시장|การเงินและตลาด|Uang dan pasar|Wang dan pasaran|Tiền và thị trường|Pesa na masoko|Pera at merkado',
    'Sport|விளையாட்டு|खेल|క్రీడలు|ಕ್ರೀಡೆ|കായികം|खेळ|રમત|খেলা|ਖੇਡ|କ୍ରୀଡ଼ା|کھیل|खेलकुद|ක්‍රීඩා|क्रीडा|Deporte|Sport|Sport|Esporte|Sport|Sport|Sport|Sport|Urheilu|Sport|Sport|Sport|Sport|Спорт|Спорт|Αθλητισμός|Spor|الرياضة|ورزش|ספורט|体育|體育|スポーツ|스포츠|กีฬา|Olahraga|Sukan|Thể thao|Michezo|Palakasan',
    'Research|ஆய்வு|शोध|పరిశోధన|ಸಂಶೋಧನೆ|ഗവേഷണം|संशोधन|સંશોધન|গবেষণা|ਖੋਜ|ଗବେଷଣା|تحقیق|अनुसन्धान|පර්යේෂණ|अनुसन्धानम्|Investigación|Recherche|Forschung|Pesquisa|Ricerca|Onderzoek|Forskning|Forskning|Tutkimus|Badania|Výzkum|Cercetare|Kutatás|Исследования|Дослідження|Έρευνα|Araştırma|بحث|پژوهش|מחקר|研究|研究|研究|연구|การวิจัย|Riset|Penyelidikan|Nghiên cứu|Utafiti|Pananaliksik',
    'More|மேலும்|और|మరిన్ని|ಇನ್ನಷ್ಟು|കൂടുതൽ|अधिक|વધુ|আরও|ਹੋਰ|ଅଧିକ|مزید|थप|තවත්|अधिकम्|Más|Plus|Mehr|Mais|Altro|Meer|Mer|Mere|Lisää|Więcej|Více|Mai mult|Továbbiak|Ещё|Більше|Περισσότερα|Diğer|المزيد|بیشتر|עוד|更多|更多|その他|더 보기|เพิ่มเติม|Lainnya|Lagi|Thêm|Zaidi|Iba pa',
    'Find a tool|கருவியைத் தேடு|टूल खोजें|సాధనం వెతకండి|ಸಾಧನ ಹುಡುಕಿ|ടൂൾ തിരയുക|साधन शोधा|સાધન શોધો|টুল খুঁজুন|ਟੂਲ ਲੱਭੋ|ଟୁଲ୍ ଖୋଜନ୍ତୁ|ٹول تلاش کریں|उपकरण खोज्नुहोस्|මෙවලමක් සොයන්න|साधनम् अन्विष्यताम्|Buscar herramienta|Chercher un outil|Werkzeug suchen|Buscar ferramenta|Cerca uno strumento|Hulpmiddel zoeken|Sök verktyg|Søg værktøj|Etsi työkalu|Znajdź narzędzie|Najít nástroj|Caută un instrument|Eszköz keresése|Найти инструмент|Знайти інструмент|Εύρεση εργαλείου|Araç bul|ابحث عن أداة|جستجوی ابزار|חיפוש כלי|查找工具|尋找工具|ツールを検索|도구 찾기|ค้นหาเครื่องมือ|Cari alat|Cari alat|Tìm công cụ|Tafuta zana|Maghanap ng tool',
    'Settings|அமைப்புகள்|सेटिंग्स|సెట్టింగ్‌లు|ಸೆಟ್ಟಿಂಗ್‌ಗಳು|ക്രമീകരണങ്ങൾ|सेटिंग्ज|સેટિંગ્સ|সেটিংস|ਸੈਟਿੰਗਾਂ|ସେଟିଂସ୍|ترتیبات|सेटिङहरू|සැකසුම්|विन्यासाः|Ajustes|Réglages|Einstellungen|Configurações|Impostazioni|Instellingen|Inställningar|Indstillinger|Asetukset|Ustawienia|Nastavení|Setări|Beállítások|Настройки|Налаштування|Ρυθμίσεις|Ayarlar|الإعدادات|تنظیمات|הגדרות|设置|設定|設定|설정|การตั้งค่า|Pengaturan|Tetapan|Cài đặt|Mipangilio|Mga setting',
    'Appearance|தோற்றம்|रूप|రూపం|ಗೋಚರತೆ|രൂപം|स्वरूप|દેખાવ|চেহারা|ਦਿੱਖ|ରୂପ|ظاہری شکل|रूप|පෙනුම|रूपम्|Apariencia|Apparence|Darstellung|Aparência|Aspetto|Weergave|Utseende|Udseende|Ulkoasu|Wygląd|Vzhled|Aspect|Megjelenés|Оформление|Вигляд|Εμφάνιση|Görünüm|المظهر|ظاهر|מראה|外观|外觀|外観|모양|รูปลักษณ์|Tampilan|Penampilan|Giao diện|Mwonekano|Hitsura',
    'Match device|சாதனம் போல|डिवाइस जैसा|పరికరం లాగా|ಸಾಧನದಂತೆ|ഉപകരണം പോലെ|डिव्हाइसप्रमाणे|ઉપકરણ મુજબ|ডিভাইস অনুযায়ী|ਡਿਵਾਈਸ ਵਾਂਗ|ଡିଭାଇସ୍ ଅନୁଯାୟୀ|ڈیوائس کے مطابق|यन्त्र अनुसार|උපාංගයට අනුව|यन्त्रानुसारम्|Como el dispositivo|Comme l’appareil|Wie Gerät|Como o dispositivo|Come il dispositivo|Zoals apparaat|Som enheten|Som enheden|Kuten laite|Jak urządzenie|Podle zařízení|Ca dispozitivul|Eszköz szerint|Как на устройстве|Як на пристрої|Όπως η συσκευή|Cihaza göre|حسب الجهاز|مانند دستگاه|לפי המכשיר|跟随设备|跟隨裝置|端末に合わせる|기기 설정|ตามอุปกรณ์|Ikuti perangkat|Ikut peranti|Theo thiết bị|Kama kifaa|Ayon sa device',
    'Light|வெளிர்|हल्का|లైట్|ತಿಳಿ|ലൈറ്റ്|फिकट|આછું|হালকা|ਹਲਕਾ|ହାଲୁକା|ہلکا|उज्यालो|ආලෝක|प्रकाशः|Claro|Clair|Hell|Claro|Chiaro|Licht|Ljust|Lyst|Vaalea|Jasny|Světlý|Luminos|Világos|Светлая|Світла|Φωτεινό|Açık|فاتح|روشن|בהיר|浅色|淺色|ライト|밝게|สว่าง|Terang|Cerah|Sáng|Mwanga|Maliwanag',
    'Dark|இருண்ட|गहरा|డార్క్|ಗಾಢ|ഡാർക്ക്|गडद|ઘાટું|গাঢ়|ਗੂੜ੍ਹਾ|ଗାଢ଼|گہرا|अँध्यारो|අඳුරු|तमः|Oscuro|Sombre|Dunkel|Escuro|Scuro|Donker|Mörkt|Mørkt|Tumma|Ciemny|Tmavý|Întunecat|Sötét|Тёмная|Темна|Σκοτεινό|Koyu|داكن|تیره|כהה|深色|深色|ダーク|어둡게|มืด|Gelap|Gelap|Tối|Giza|Madilim',
    'Language and charts|மொழி, சக்கரங்கள்|भाषा और कुंडली|భాష, చక్రాలు|ಭಾಷೆ ಮತ್ತು ಚಕ್ರಗಳು|ഭാഷയും ചക്രങ്ങളും|भाषा आणि कुंडली|ભાષા અને કુંડળી|ভাষা ও চক্র|ਭਾਸ਼ਾ ਅਤੇ ਚਾਰਟ|ଭାଷା ଓ ଚକ୍ର|زبان اور زائچے|भाषा र चक्र|භාෂාව සහ සටහන්|भाषा चक्राणि च|Idioma y cartas|Langue et thèmes|Sprache und Horoskope|Idioma e mapas|Lingua e carte|Taal en horoscopen|Språk och horoskop|Sprog og horoskoper|Kieli ja kartat|Język i horoskopy|Jazyk a horoskopy|Limbă și hărți|Nyelv és képletek|Язык и карты|Мова та карти|Γλώσσα και χάρτες|Dil ve haritalar|اللغة والخرائط|زبان و زایچه|שפה ומפות|语言和星盘|語言和星盤|言語とチャート|언어와 차트|ภาษาและดวง|Bahasa dan bagan|Bahasa dan carta|Ngôn ngữ và biểu đồ|Lugha na chati|Wika at tsart',
    'Done|முடிந்தது|हो गया|పూర్తి|ಮುಗಿದಿದೆ|പൂർത്തിയായി|झाले|થઈ ગયું|সম্পন্ন|ਹੋ ਗਿਆ|ହୋଇଗଲା|ہو گیا|सम्पन्न|හරි|सम्पन्नम्|Listo|OK|Fertig|Concluído|Fatto|Klaar|Klar|Færdig|Valmis|Gotowe|Hotovo|Gata|Kész|Готово|Готово|Τέλος|Bitti|تم|انجام شد|סיום|完成|完成|完了|완료|เสร็จ|Selesai|Selesai|Xong|Imekamilika|Tapos',
    'Next timings|அடுத்த நேரங்கள்|अगले समय|తదుపరి సమయాలు|ಮುಂದಿನ ಸಮಯಗಳು|അടുത്ത സമയങ്ങൾ|पुढील वेळा|આગળના સમય|পরবর্তী সময়|ਅਗਲੇ ਸਮੇਂ|ପରବର୍ତ୍ତୀ ସମୟ|اگلے اوقات|अर्को समय|ඊළඟ වේලාවන්|अग्रिमसमयाः|Próximos horarios|Prochains horaires|Nächste Zeiten|Próximos horários|Prossimi orari|Volgende tijden|Nästa tider|Næste tider|Seuraavat ajat|Następne godziny|Další časy|Următoarele ore|Következő időpontok|Ближайшее время|Найближчий час|Επόμενες ώρες|Sonraki zamanlar|الأوقات التالية|زمان‌های بعدی|הזמנים הבאים|接下来的时间|接下來的時間|次の時刻|다음 시간|เวลาถัดไป|Waktu berikutnya|Masa seterusnya|Thời điểm tiếp theo|Nyakati zijazo|Mga susunod na oras',
    'See all Lagna timings|எல்லா லக்ன நேரங்களையும் காண்க|सभी लग्न समय देखें|అన్ని లగ్న సమయాలు చూడండి|ಎಲ್ಲ ಲಗ್ನ ಸಮಯಗಳನ್ನು ನೋಡಿ|എല്ലാ ലഗ്ന സമയങ്ങളും കാണുക|सर्व लग्न वेळा पाहा|બધા લગ્ન સમય જુઓ|সব লগ্ন সময় দেখুন|ਸਾਰੇ ਲਗਨ ਸਮੇਂ ਵੇਖੋ|ସମସ୍ତ ଲଗ୍ନ ସମୟ ଦେଖନ୍ତୁ|تمام لگن اوقات دیکھیں|सबै लग्न समय हेर्नुहोस्|සියලු ලග්න වේලාවන් බලන්න|सर्वान् लग्नसमयान् पश्यतु|Ver todos los horarios de Lagna|Voir tous les horaires du Lagna|Alle Lagna-Zeiten anzeigen|Ver todos os horários do Lagna|Vedi tutti gli orari del Lagna|Alle Lagna-tijden bekijken|Visa alla Lagna-tider|Se alle Lagna-tider|Näytä kaikki Lagna-ajat|Zobacz wszystkie godziny Lagna|Zobrazit všechny časy Lagny|Vezi toate orele Lagna|Összes Lagna-időpont|Все времена лагны|Усі часи лагни|Όλες οι ώρες Lagna|Tüm Lagna zamanlarını gör|عرض كل أوقات اللاغنا|دیدن همه زمان‌های لگنا|כל זמני הלגנה|查看全部上升时间|查看全部上升時間|すべてのラグナ時刻を見る|모든 라그나 시간 보기|ดูเวลาลัคนาทั้งหมด|Lihat semua waktu Lagna|Lihat semua masa Lagna|Xem tất cả giờ Lagna|Tazama nyakati zote za Lagna|Tingnan ang lahat ng oras ng Lagna',
    'Rising now|இப்போது உதயம்|अभी उदय|ఇప్పుడు ఉదయం|ಈಗ ಉದಯ|ഇപ്പോൾ ഉദയം|आता उदय|હમણાં ઉદય|এখন উদয়|ਹੁਣ ਉਦੇ|ବର୍ତ୍ତମାନ ଉଦୟ|ابھی طلوع|अहिले उदय|දැන් උදාවන|अधुना उदयः|Ascendente ahora|Ascendant actuel|Jetzt aufsteigend|Ascendente agora|Ascendente ora|Nu rijzend|Stiger nu|Stiger nu|Nousee nyt|Wschodzi teraz|Nyní vychází|Ascendent acum|Most kel|Восходит сейчас|Сходить зараз|Ανατέλλει τώρα|Şimdi yükselen|الطالع الآن|طالع اکنون|עולה כעת|当前上升|當前上升|現在の上昇|지금 상승|กำลังขึ้นตอนนี้|Terbit sekarang|Terbit sekarang|Đang mọc|Linachomoza sasa|Sumisikat ngayon',
    'Jump to now|இப்போதைய நேரத்துக்குச் செல்|अभी पर जाएँ|ఇప్పటి సమయానికి వెళ్ళు|ಈಗಿನ ಸಮಯಕ್ಕೆ ಹೋಗಿ|ഇപ്പോഴത്തെ സമയത്തേക്ക്|आताच्या वेळेवर जा|હમણાંના સમય પર જાઓ|এখনকার সময়ে যান|ਹੁਣ ਦੇ ਸਮੇਂ ਤੇ ਜਾਓ|ବର୍ତ୍ତମାନ ସମୟକୁ ଯାଆନ୍ତୁ|ابھی کے وقت پر جائیں|अहिलेको समयमा जानुहोस्|දැන් වේලාවට යන්න|अधुनातनं समयं गच्छतु|Ir a ahora|Aller à maintenant|Zu jetzt springen|Ir para agora|Vai ad adesso|Naar nu|Gå till nu|Gå til nu|Siirry nykyhetkeen|Przejdź do teraz|Přejít na teď|Salt la acum|Ugrás a mostanira|Перейти к текущему|Перейти до поточного|Μετάβαση στο τώρα|Şimdiye git|انتقل إلى الآن|برو به اکنون|קפוץ לעכשיו|跳到现在|跳到現在|現在へ移動|지금으로 이동|ไปที่ตอนนี้|Ke sekarang|Ke sekarang|Đến hiện tại|Nenda sasa|Pumunta sa ngayon',
    'Tagged timings only|குறியிட்ட நேரங்கள் மட்டும்|केवल चिह्नित समय|గుర్తించిన సమయాలు మాత్రమే|ಗುರುತಿಸಿದ ಸಮಯಗಳು ಮಾತ್ರ|അടയാളമിട്ട സമയങ്ങൾ മാത്രം|फक्त खूण केलेल्या वेळा|ફક્ત ચિહ્નિત સમય|শুধু চিহ্নিত সময়|ਸਿਰਫ਼ ਨਿਸ਼ਾਨਬੱਧ ਸਮੇਂ|କେବଳ ଚିହ୍ନିତ ସମୟ|صرف نشان زدہ اوقات|चिन्हित समय मात्र|ලකුණු කළ වේලාවන් පමණි|केवलं चिह्नितसमयाः|Solo horarios marcados|Horaires marqués seulement|Nur markierte Zeiten|Só horários marcados|Solo orari contrassegnati|Alleen gemarkeerde tijden|Endast märkta tider|Kun markerede tider|Vain merkityt ajat|Tylko oznaczone godziny|Jen označené časy|Doar orele marcate|Csak a jelölt időpontok|Только отмеченные|Лише позначені|Μόνο σημειωμένες ώρες|Yalnızca etiketli zamanlar|الأوقات الموسومة فقط|فقط زمان‌های برچسب‌دار|רק זמנים מסומנים|仅标记的时间|僅標記的時間|タグ付きの時刻のみ|태그된 시간만|เฉพาะเวลาที่ติดแท็ก|Hanya waktu bertanda|Masa bertanda sahaja|Chỉ giờ được gắn thẻ|Nyakati zilizowekwa alama tu|Mga oras na may tag lang',
    'Copy|நகலெடு|कॉपी करें|కాపీ|ನಕಲಿಸಿ|പകർത്തുക|कॉपी करा|કૉપિ કરો|কপি করুন|ਕਾਪੀ ਕਰੋ|କପି କରନ୍ତୁ|کاپی کریں|प्रतिलिपि|පිටපත් කරන්න|प्रतिलिपिः|Copiar|Copier|Kopieren|Copiar|Copia|Kopiëren|Kopiera|Kopiér|Kopioi|Kopiuj|Kopírovat|Copiază|Másolás|Копировать|Копіювати|Αντιγραφή|Kopyala|نسخ|کپی|העתקה|复制|複製|コピー|복사|คัดลอก|Salin|Salin|Sao chép|Nakili|Kopyahin',
    'Print|அச்சிடு|प्रिंट करें|ప్రింట్|ಮುದ್ರಿಸಿ|പ്രിന്റ്|प्रिंट करा|પ્રિન્ટ કરો|প্রিন্ট করুন|ਪ੍ਰਿੰਟ ਕਰੋ|ପ୍ରିଣ୍ଟ କରନ୍ତୁ|پرنٹ کریں|छाप्नुहोस्|මුද්‍රණය|मुद्रणम्|Imprimir|Imprimer|Drucken|Imprimir|Stampa|Afdrukken|Skriv ut|Udskriv|Tulosta|Drukuj|Tisk|Tipărește|Nyomtatás|Печать|Друк|Εκτύπωση|Yazdır|طباعة|چاپ|הדפסה|打印|列印|印刷|인쇄|พิมพ์|Cetak|Cetak|In|Chapisha|I-print',
    'Share|பகிர்|साझा करें|షేర్|ಹಂಚಿಕೊಳ್ಳಿ|പങ്കിടുക|शेअर करा|શેર કરો|শেয়ার করুন|ਸਾਂਝਾ ਕਰੋ|ସେୟାର କରନ୍ତୁ|شیئر کریں|साझा गर्नुहोस्|බෙදාගන්න|विभजतु|Compartir|Partager|Teilen|Compartilhar|Condividi|Delen|Dela|Del|Jaa|Udostępnij|Sdílet|Distribuie|Megosztás|Поделиться|Поділитися|Κοινοποίηση|Paylaş|مشاركة|اشتراک‌گذاری|שיתוף|分享|分享|共有|공유|แชร์|Bagikan|Kongsi|Chia sẻ|Shiriki|Ibahagi',
    'Save as text|உரையாகச் சேமி|टेक्स्ट के रूप में सहेजें|టెక్స్ట్‌గా సేవ్ చేయండి|ಪಠ್ಯವಾಗಿ ಉಳಿಸಿ|ടെക്സ്റ്റായി സേവ് ചെയ്യുക|मजकूर म्हणून जतन करा|લખાણ તરીકે સાચવો|টেক্সট হিসেবে সংরক্ষণ করুন|ਟੈਕਸਟ ਵਜੋਂ ਸੰਭਾਲੋ|ଟେକ୍ସଟ୍ ଭାବେ ସେଭ୍ କରନ୍ତୁ|متن کے طور پر محفوظ کریں|पाठको रूपमा सुरक्षित गर्नुहोस्|පෙළ ලෙස සුරකින්න|पाठरूपेण रक्षतु|Guardar como texto|Enregistrer en texte|Als Text speichern|Salvar como texto|Salva come testo|Opslaan als tekst|Spara som text|Gem som tekst|Tallenna tekstinä|Zapisz jako tekst|Uložit jako text|Salvează ca text|Mentés szövegként|Сохранить как текст|Зберегти як текст|Αποθήκευση ως κείμενο|Metin olarak kaydet|حفظ كنص|ذخیره به‌صورت متن|שמירה כטקסט|保存为文本|儲存為文字|テキストで保存|텍스트로 저장|บันทึกเป็นข้อความ|Simpan sebagai teks|Simpan sebagai teks|Lưu dạng văn bản|Hifadhi kama maandishi|I-save bilang text',
    'Add to calendar|நாட்காட்டியில் சேர்|कैलेंडर में जोड़ें|క్యాలెండర్‌కు జోడించు|ಕ್ಯಾಲೆಂಡರ್‌ಗೆ ಸೇರಿಸಿ|കലണ്ടറിൽ ചേർക്കുക|कॅलेंडरमध्ये जोडा|કૅલેન્ડરમાં ઉમેરો|ক্যালেন্ডারে যোগ করুন|ਕੈਲੰਡਰ ਵਿੱਚ ਜੋੜੋ|କ୍ୟାଲେଣ୍ଡରରେ ଯୋଡ଼ନ୍ତୁ|کیلنڈر میں شامل کریں|पात्रोमा थप्नुहोस्|දින දර්ශනයට එක් කරන්න|पञ्चाङ्गे योजयतु|Añadir al calendario|Ajouter au calendrier|Zum Kalender hinzufügen|Adicionar ao calendário|Aggiungi al calendario|Toevoegen aan agenda|Lägg till i kalender|Føj til kalender|Lisää kalenteriin|Dodaj do kalendarza|Přidat do kalendáře|Adaugă în calendar|Hozzáadás a naptárhoz|Добавить в календарь|Додати до календаря|Προσθήκη στο ημερολόγιο|Takvime ekle|أضف إلى التقويم|افزودن به تقویم|הוספה ליומן|添加到日历|新增至日曆|カレンダーに追加|캘린더에 추가|เพิ่มในปฏิทิน|Tambah ke kalender|Tambah ke kalendar|Thêm vào lịch|Ongeza kwenye kalenda|Idagdag sa kalendaryo',
    'Read more|மேலும் படிக்க|और पढ़ें|మరింత చదవండి|ಇನ್ನಷ್ಟು ಓದಿ|കൂടുതൽ വായിക്കുക|अधिक वाचा|વધુ વાંચો|আরও পড়ুন|ਹੋਰ ਪੜ੍ਹੋ|ଅଧିକ ପଢ଼ନ୍ତୁ|مزید پڑھیں|थप पढ्नुहोस्|තව කියවන්න|अधिकं पठतु|Leer más|Lire la suite|Weiterlesen|Ler mais|Leggi di più|Lees meer|Läs mer|Læs mere|Lue lisää|Czytaj więcej|Číst dál|Citește mai mult|Tovább|Читать дальше|Читати далі|Περισσότερα|Devamını oku|اقرأ المزيد|بیشتر بخوانید|קרא עוד|阅读更多|閱讀更多|続きを読む|더 읽기|อ่านเพิ่มเติม|Baca selengkapnya|Baca lagi|Đọc thêm|Soma zaidi|Magbasa pa',
    'Show less|குறைவாகக் காட்டு|कम दिखाएँ|తక్కువ చూపు|ಕಡಿಮೆ ತೋರಿಸಿ|കുറച്ച് കാണിക്കുക|कमी दाखवा|ઓછું બતાવો|কম দেখান|ਘੱਟ ਵੇਖਾਓ|କମ୍ ଦେଖାନ୍ତୁ|کم دکھائیں|कम देखाउनुहोस्|අඩුවෙන් පෙන්වන්න|न्यूनं दर्शयतु|Ver menos|Voir moins|Weniger anzeigen|Ver menos|Mostra meno|Minder tonen|Visa mindre|Vis mindre|Näytä vähemmän|Pokaż mniej|Zobrazit méně|Arată mai puțin|Kevesebb|Свернуть|Згорнути|Λιγότερα|Daha az göster|عرض أقل|نمایش کمتر|הצג פחות|收起|收起|閉じる|접기|แสดงน้อยลง|Lebih sedikit|Kurangkan|Thu gọn|Onyesha kidogo|Ipakita ang kaunti',
    'Change|மாற்று|बदलें|మార్చు|ಬದಲಿಸಿ|മാറ്റുക|बदला|બદલો|পরিবর্তন করুন|ਬਦਲੋ|ବଦଳାନ୍ତୁ|تبدیل کریں|परिवर्तन गर्नुहोस्|වෙනස් කරන්න|परिवर्तयतु|Cambiar|Modifier|Ändern|Alterar|Cambia|Wijzigen|Ändra|Skift|Muuta|Zmień|Změnit|Schimbă|Módosítás|Изменить|Змінити|Αλλαγή|Değiştir|تغيير|تغییر|שינוי|更改|變更|変更|변경|เปลี่ยน|Ubah|Tukar|Thay đổi|Badilisha|Baguhin',
    'Chart|சக்கரம்|कुंडली|చక్రం|ಚಕ್ರ|ചക്രം|कुंडली|કુંડળી|চক্র|ਚਾਰਟ|ଚକ୍ର|زائچہ|चक्र|සටහන|चक्रम्|Carta|Thème|Horoskop|Mapa|Carta|Horoscoop|Horoskop|Horoskop|Kartta|Horoskop|Horoskop|Hartă|Képlet|Карта|Карта|Χάρτης|Harita|الخريطة|زایچه|מפה|星盘|星盤|チャート|차트|ดวง|Bagan|Carta|Biểu đồ|Chati|Tsart',
    'All tools|எல்லா கருவிகளும்|सभी टूल|అన్ని సాధనాలు|ಎಲ್ಲ ಸಾಧನಗಳು|എല്ലാ ടൂളുകളും|सर्व साधने|બધાં સાધનો|সব টুল|ਸਾਰੇ ਟੂਲ|ସମସ୍ତ ଟୁଲ୍|تمام ٹولز|सबै उपकरण|සියලු මෙවලම්|सर्वाणि साधनानि|Todas las herramientas|Tous les outils|Alle Werkzeuge|Todas as ferramentas|Tutti gli strumenti|Alle hulpmiddelen|Alla verktyg|Alle værktøjer|Kaikki työkalut|Wszystkie narzędzia|Všechny nástroje|Toate instrumentele|Összes eszköz|Все инструменты|Усі інструменти|Όλα τα εργαλεία|Tüm araçlar|كل الأدوات|همه ابزارها|כל הכלים|全部工具|全部工具|すべてのツール|모든 도구|เครื่องมือทั้งหมด|Semua alat|Semua alat|Tất cả công cụ|Zana zote|Lahat ng tool',
    'Set up home place|சொந்த இடத்தை அமை|घर का स्थान सेट करें|ఇంటి స్థలం సెట్ చేయండి|ಮನೆಯ ಸ್ಥಳ ಹೊಂದಿಸಿ|വീട്ടിലെ സ്ഥലം ക്രമീകരിക്കുക|घराचे ठिकाण सेट करा|ઘરનું સ્થળ સેટ કરો|বাড়ির স্থান ঠিক করুন|ਘਰ ਦੀ ਥਾਂ ਸੈੱਟ ਕਰੋ|ଘର ସ୍ଥାନ ସେଟ୍ କରନ୍ତୁ|گھر کی جگہ مقرر کریں|घरको स्थान सेट गर्नुहोस्|නිවෙස් ස්ථානය සකසන්න|गृहस्थानं स्थापयतु|Configurar lugar de casa|Définir le lieu d’origine|Heimatort festlegen|Definir local de casa|Imposta il luogo di casa|Thuislocatie instellen|Ange hemort|Angiv hjemsted|Aseta kotipaikka|Ustaw miejsce domowe|Nastavit domovské místo|Setează locul de acasă|Otthoni hely beállítása|Указать домашнее место|Вказати домашнє місце|Ορισμός τόπου κατοικίας|Ev konumunu ayarla|تعيين المكان الأساسي|تنظیم محل سکونت|הגדרת מקום הבית|设置常用地点|設定常用地點|自宅の場所を設定|집 위치 설정|ตั้งสถานที่บ้าน|Atur tempat asal|Tetapkan tempat asal|Đặt nơi ở|Weka mahali pa nyumbani|Itakda ang lugar ng tahanan'
  ];

  /* ---------- Tamil: revamp text and the engine labels it leaves in English ---------- */
  var TA = {
    // Revamp: pages, sidebar, settings
    'Show tool names': 'கருவிப் பெயர்களைக் காட்டு', 'Show icons only': 'படவுருக்கள் மட்டும்',
    'Close chart': 'சக்கரத்தை மூடு', 'Close tools': 'கருவிகளை மூடு', 'Close settings': 'அமைப்புகளை மூடு',
    'Main': 'முதன்மை', 'Result actions': 'முடிவுச் செயல்கள்',
    'No tool matches that. Try a word like muhurtham, chart or market.': 'அப்படி ஒரு கருவி இல்லை. முகூர்த்தம், சக்கரம், சந்தை போன்ற சொல்லில் தேடுங்கள்.',
    'Open Lagna Timings and choose a day.': 'லக்ன நேரங்களைத் திறந்து ஒரு நாளைத் தேர்ந்தெடுக்கவும்.',
    'The list is set to {day}. Change the day in Lagna Timings.': 'பட்டியல் {day} நாளுக்கு உள்ளது. நாளை லக்ன நேரங்களில் மாற்றவும்.',
    'Choose a place': 'இடத்தைத் தேர்ந்தெடுக்கவும்', 'Search any city or town': 'எந்த நகரத்தையும் ஊரையும் தேடலாம்',
    'Search a city or town': 'நகரம் அல்லது ஊரைத் தேடுக',
    // Revamp: results, list tools, toasts
    '{n} tagged': '{n} குறியிட்டவை', 'No tagged timings on this day': 'இந்த நாளில் குறியிட்ட நேரம் இல்லை',
    'Every timing in this list is already in the past.': 'இந்தப் பட்டியலில் உள்ள எல்லா நேரங்களும் கடந்துவிட்டன.',
    'There are no timings to jump to.': 'செல்வதற்கு நேரங்கள் இல்லை.',
    'This timing is running now.': 'இந்த நேரம் இப்போது நடக்கிறது.',
    'Next timing: it has not started yet.': 'அடுத்த நேரம்: இன்னும் தொடங்கவில்லை.',
    'Made {when}': 'உருவாக்கியது {when}',
    'Printing is blocked here. Use Copy or Share instead.': 'இங்கே அச்சிட முடியாது. நகலெடு அல்லது பகிர் பயன்படுத்தவும்.',
    'There are no upcoming timings in this list to add.': 'சேர்க்க இந்தப் பட்டியலில் வரவிருக்கும் நேரம் இல்லை.',
    ' (tagged timings only)': ' (குறியிட்ட நேரங்கள் மட்டும்)',
    '1 timing{note} saved as a calendar file. Open it to add it to your calendar.': '1 நேரம்{note} நாட்காட்டிக் கோப்பாகச் சேமிக்கப்பட்டது. அதைத் திறந்து உங்கள் நாட்காட்டியில் சேர்க்கவும்.',
    '{n} timings{note} saved as a calendar file. Open it to add them to your calendar.': '{n} நேரங்கள்{note} நாட்காட்டிக் கோப்பாகச் சேமிக்கப்பட்டன. அதைத் திறந்து உங்கள் நாட்காட்டியில் சேர்க்கவும்.',
    'Saved as a text file.': 'உரைக் கோப்பாகச் சேமிக்கப்பட்டது.',
    'Copied. Paste it into a message or a note.': 'நகலெடுக்கப்பட்டது. செய்தி அல்லது குறிப்பில் ஒட்டவும்.',
    'Copying is blocked here. Use Share or Print instead.': 'இங்கே நகலெடுக்க முடியாது. பகிர் அல்லது அச்சிடு பயன்படுத்தவும்.',
    // Revamp: birth chart clock-change warning
    'This time did not exist in {place}.': 'இந்த நேரம் {place} இல் இருக்கவில்லை.',
    'Clocks jumped forward that night, from {a} to {b}, so {time} was skipped. The chart below uses {used}. Check the recorded birth time.': 'அன்று இரவு கடிகாரம் {a} இலிருந்து {b} க்கு முன்னே தள்ளப்பட்டது; ஆகவே {time} வரவே இல்லை. கீழே உள்ள சக்கரம் {used} ஐப் பயன்படுத்துகிறது. பதிவு செய்த பிறந்த நேரத்தைச் சரிபாருங்கள்.',
    'This time happened twice in {place}.': 'இந்த நேரம் {place} இல் இரண்டு முறை வந்தது.',
    'Clocks went back that night, so {time} came once at {a} and again at {b}. The chart below uses {used}. If the birth was in the second hour, enter {tz} as the time zone and calculate again.': 'அன்று இரவு கடிகாரம் பின்னே தள்ளப்பட்டது; ஆகவே {time} ஒருமுறை {a} இலும் மறுமுறை {b} இலும் வந்தது. கீழே உள்ள சக்கரம் {used} ஐப் பயன்படுத்துகிறது. பிறப்பு இரண்டாவது மணியில் என்றால், நேர மண்டலமாக {tz} ஐ உள்ளிட்டு மீண்டும் கணக்கிடுங்கள்.',
    'one of the two offsets': 'இரண்டில் ஒரு வேறுபாட்டை', 'the first': 'முதலாவதை',
    // Revamp: Fortuna saved people
    'Fill from a saved person': 'சேமித்த நபரிடமிருந்து நிரப்பு', 'Choose a person…': 'ஒருவரைத் தேர்ந்தெடுக்கவும்…',
    'No saved people yet. Save one in Birth Chart.': 'இன்னும் யாரும் சேமிக்கப்படவில்லை. பிறப்பு ஜாதகத்தில் சேமிக்கவும்.',
    'Birth details filled in for {name}.': '{name} அவர்களின் பிறப்பு விவரங்கள் நிரப்பப்பட்டன.', 'this person': 'இவர்',
    'Unnamed': 'பெயரில்லை',
    // Revamp: question log
    'Your question log': 'உங்கள் கேள்விப் பதிவேடு', 'empty': 'காலி', '{a} of {b} came true': '{b} இல் {a} நடந்தது',
    'Each answer you get here is saved on this device. Come back later and mark whether it happened to see how often the readings come true.': 'இங்கே கிடைக்கும் ஒவ்வொரு பதிலும் இந்தச் சாதனத்தில் சேமிக்கப்படும். பிறகு வந்து அது நடந்ததா எனக் குறித்தால், கணிப்புகள் எத்தனை முறை பலிக்கின்றன என்று தெரியும்.',
    'What happened': 'என்ன நடந்தது', 'Not known yet': 'இன்னும் தெரியவில்லை', 'It happened': 'நடந்தது', 'It did not happen': 'நடக்கவில்லை',
    'Note': 'குறிப்பு', 'Delete': 'நீக்கு', 'Delete this entry': 'இந்தப் பதிவை நீக்கு',
    'Lost article': 'தொலைந்த பொருள்', 'GMP question': 'ஜி.எம்.பி கேள்வி',
    // Revamp: alarms note
    'Alarms ring while GuruAgasthiya is open': 'குருஅகஸ்தியா திறந்திருக்கும்போது அலாரங்கள் ஒலிக்கும்',
    'on this device, in a tab or as an installed app. For alerts when it is closed, use': '(இந்தச் சாதனத்தில், உலாவித் தாவலிலோ நிறுவிய செயலியாகவோ). மூடியிருக்கும்போதும் நினைவூட்டல் வேண்டுமெனில்,',
    'Add to Calendar': 'நாட்காட்டியில் சேர்',
    'This browser cannot show notifications.': 'இந்த உலாவியால் அறிவிப்புகளைக் காட்ட முடியாது.',
    'Notifications are on.': 'அறிவிப்புகள் இயக்கத்தில் உள்ளன.',
    'Notifications are blocked. Allow them in your browser\'s site settings to see alarms outside this tab.': 'அறிவிப்புகள் தடுக்கப்பட்டுள்ளன. இந்தத் தாவலுக்கு வெளியேயும் அலாரங்களைக் காண, உலாவியின் தள அமைப்புகளில் அனுமதியுங்கள்.',
    'Allow notifications': 'அறிவிப்புகளை அனுமதி',
    // Revamp: first-run setup
    'Welcome to GuruAgasthiya': 'குருஅகஸ்தியாவுக்கு வரவேற்கிறோம்',
    'Three quick choices and the app is ready. You can change them later in Settings.': 'மூன்று எளிய தேர்வுகள் போதும். இவற்றைப் பின்னர் அமைப்புகளில் மாற்றலாம்.',
    'Your home place': 'உங்கள் சொந்த இடம்', 'Use my location': 'என் இருப்பிடத்தைப் பயன்படுத்து',
    'Language and system': 'மொழியும் முறையும்', 'Skip for now': 'இப்போது வேண்டாம்', 'Start': 'தொடங்கு',
    'Home place: {place}': 'சொந்த இடம்: {place}',
    'Home place: your current location (the browser will ask for permission).': 'சொந்த இடம்: உங்கள் தற்போதைய இருப்பிடம் (உலாவி அனுமதி கேட்கும்).',
    'All set. Your choices are saved on this device.': 'எல்லாம் தயார். உங்கள் தேர்வுகள் இந்தச் சாதனத்தில் சேமிக்கப்பட்டன.',

    // Engine: Lagna Timings page
    'Choose a day and a place.': 'நாளையும் இடத்தையும் தேர்ந்தெடுக்கவும்.', 'Edit': 'திருத்து',
    'Early reminder': 'முன் நினைவூட்டல்', 'Add All': 'அனைத்தையும் சேர்', 'Import': 'இறக்குமதி',
    'All 249 Sub-Lords': 'அனைத்து 249 உப அதிபதிகள்',
    'GMP 3,11 · Gurumurthy Guruji Muhurtham': 'ஜி.எம்.பி 3,11 · குருமூர்த்தி குருஜி முகூர்த்தம்',
    'Muhurtham Part 1 · Day’s 249 Transits': 'முகூர்த்தம் பகுதி 1 · அன்றைய 249 கோசாரங்கள்',
    'Muhurtham on Rules': 'விதிகளின்படி முகூர்த்தம்',
    'Place set': 'இடம் அமைக்கப்பட்டது', 'Fortuna Timing': 'போர்ச்சூனா நேரம்',
    'Highly auspicious muhurtham': 'மிகச் சுப முகூர்த்தம்',
    // Engine: planets, signs, stars, chart words
    'Sun': 'சூரியன்', 'Moon': 'சந்திரன்', 'Mars': 'செவ்வாய்', 'Mercury': 'புதன்', 'Jupiter': 'குரு', 'Venus': 'சுக்கிரன்',
    'Saturn': 'சனி', 'Rahu': 'ராகு', 'Ketu': 'கேது', 'Fortuna': 'போர்ச்சூனா', 'Uranus': 'யுரேனஸ்', 'Neptune': 'நெப்டியூன்', 'Pluto': 'புளூட்டோ',
    'Aries': 'மேஷம்', 'Taurus': 'ரிஷபம்', 'Gemini': 'மிதுனம்', 'Cancer': 'கடகம்', 'Leo': 'சிம்மம்', 'Virgo': 'கன்னி',
    'Libra': 'துலாம்', 'Scorpio': 'விருச்சிகம்', 'Sagittarius': 'தனுசு', 'Capricorn': 'மகரம்', 'Aquarius': 'கும்பம்', 'Pisces': 'மீனம்',
    'Ashwini': 'அஸ்வினி', 'Bharani': 'பரணி', 'Krittika': 'கிருத்திகை', 'Rohini': 'ரோகிணி', 'Mrigashira': 'மிருகசீரிஷம்', 'Mrigashirsha': 'மிருகசீரிஷம்',
    'Ardra': 'திருவாதிரை', 'Punarvasu': 'புனர்பூசம்', 'Pushya': 'பூசம்', 'Ashlesha': 'ஆயில்யம்', 'Magha': 'மகம்',
    'Purva Phalguni': 'பூரம்', 'Uttara Phalguni': 'உத்திரம்', 'Hasta': 'அஸ்தம்', 'Chitra': 'சித்திரை', 'Swati': 'சுவாதி',
    'Vishakha': 'விசாகம்', 'Anuradha': 'அனுஷம்', 'Jyeshtha': 'கேட்டை', 'Mula': 'மூலம்', 'Purva Ashadha': 'பூராடம்',
    'Uttara Ashadha': 'உத்திராடம்', 'Shravana': 'திருவோணம்', 'Dhanishta': 'அவிட்டம்', 'Shatabhisha': 'சதயம்',
    'Purva Bhadrapada': 'பூரட்டாதி', 'Uttara Bhadrapada': 'உத்திரட்டாதி', 'Revati': 'ரேவதி',
    'Asc': 'லக்', 'ASC': 'லக்', 'DSC': 'சப்', 'Good': 'நல்லது', 'Strong': 'வலிமை', 'Default': 'இயல்பு', 'Recommended': 'பரிந்துரை',
    'Present transit time:': 'தற்போதைய கோசார நேரம்:', 'Rising:': 'உதயம்:', 'Optional': 'விருப்பம்', 'North is +': 'வடக்கு +',
    'East is +': 'கிழக்கு +', 'Name, or UTC hours like 5.5': 'பெயர், அல்லது 5.5 போன்ற UTC மணி', 'All offsets': 'எல்லா வேறுபாடுகளும்',
    // Engine: shared form labels
    'Search a city': 'நகரத்தைத் தேடுக', 'City': 'நகரம்', 'From date': 'தொடக்கத் தேதி', 'To date': 'இறுதித் தேதி',
    'From Time': 'தொடக்க நேரம்', 'To Time': 'இறுதி நேரம்', 'From time': 'தொடக்க நேரம்', 'To time': 'இறுதி நேரம்',
    'Local time': 'உள்ளூர் நேரம்', 'Local': 'உள்ளூர்', 'Name or hours like 5.5': 'பெயர் அல்லது 5.5 போன்ற மணி',
    'Set by city, or hours like 5.5': 'நகரத்தால் அமையும், அல்லது 5.5 போன்ற மணி', 'e.g. Asia/Kolkata or 5.5': 'எ.கா. Asia/Kolkata அல்லது 5.5',
    'Up to 7 days': '7 நாள் வரை', 'Up to 14 days': '14 நாள் வரை', 'Up to 15 days': '15 நாள் வரை', 'Up to 31 days': '31 நாள் வரை',
    'up to 31 days': '31 நாள் வரை', 'Up to 62 days': '62 நாள் வரை', 'Up to 366 days': '366 நாள் வரை',
    'Daily from': 'தினமும் இருந்து', 'Daily until': 'தினமும் வரை', 'Period from': 'காலம் இருந்து', 'Period to': 'காலம் வரை',
    'Tick all': 'அனைத்தையும் தேர்', 'Untick all': 'அனைத்தையும் நீக்கு', 'Clear': 'அழி', 'Order': 'வரிசை',
    'Use Transit Settings Place': 'கோசார அமைப்பின் இடத்தைப் பயன்படுத்து',
    'Find my place automatically when online': 'இணையம் இருக்கும்போது என் இடத்தைத் தானாகக் கண்டறி',
    // Engine: tool buttons
    'Find 3 11 Timings': '3 11 நேரங்களைக் கண்டறி', 'Find Chandra Muhurtham': 'சந்திர முகூர்த்தம் கண்டறி',
    'Find Auspicious Lagna': 'சுப லக்னம் கண்டறி', 'Find Fortuna Timings': 'போர்ச்சூனா நேரங்களைக் கண்டறி',
    'Find Trade Profit Timings': 'வர்த்தக லாப நேரங்களைக் கண்டறி', 'Draw Planetary Candles': 'கிரக மெழுகுவர்த்தி வரைபடம் வரை',
    'Analyse the Race': 'பந்தயத்தை ஆய்வு செய்', 'Show my Fortuna': 'என் போர்ச்சூனாவைக் காட்டு',
    'Change Birth Details': 'பிறப்பு விவரங்களை மாற்று', 'Copy Lists': 'பட்டியல்களை நகலெடு', 'Note the question time': 'கேள்வி நேரத்தைக் குறி',
    // Engine: Live Transit Clock
    'Background photo': 'பின்னணிப் படம்', 'Saved on this device, works offline': 'இந்தச் சாதனத்தில் சேமிக்கப்படும், இணையமின்றியும் இயங்கும்',
    'Choose a photo': 'படத்தைத் தேர்ந்தெடு', 'Remove photo': 'படத்தை நீக்கு', 'Colour theme': 'வண்ணக் கருப்பொருள்',
    'Used when there is no photo': 'படம் இல்லாதபோது பயன்படும்', 'Photo darkness': 'படத்தின் இருள்', 'Makes the text easy to read': 'எழுத்தை எளிதாகப் படிக்க உதவும்',
    'Uses the event chosen in that tool': 'அந்தக் கருவியில் தேர்ந்த நிகழ்வைப் பயன்படுத்தும்', 'Uses the rules ticked in that tool': 'அந்தக் கருவியில் தேர்ந்த விதிகளைப் பயன்படுத்தும்',
    'Market hours set in that tool': 'அந்தக் கருவியில் அமைத்த சந்தை நேரம்', 'Uses the purposes ticked in that tool': 'அந்தக் கருவியில் தேர்ந்த நோக்கங்களைப் பயன்படுத்தும்',
    'Speculation Research Muhurtham': 'ஊக ஆய்வு முகூர்த்தம்', 'Trade Profit Muhurtham': 'வர்த்தக லாப முகூர்த்தம்',
    '3 · 11 Muhurtham': '3 · 11 முகூர்த்தம்', 'Fortuna Timing Muhurtham': 'போர்ச்சூனா நேர முகூர்த்தம்', 'All the muhurthams': 'எல்லா முகூர்த்தங்களும்',
    'Plan ahead': 'முன்கூட்டியே திட்டமிடு', 'Most alarms': 'அதிகபட்ச அலாரங்கள்', 'Keep these alarms topped up whenever the app opens': 'செயலி திறக்கும்போதெல்லாம் இந்த அலாரங்களை நிரப்பி வை',
    'Test Alarm (10 s)': 'சோதனை அலாரம் (10 வி)', 'Install app': 'செயலியை நிறுவு', 'Install': 'நிறுவு', 'Add to Home Screen': 'முகப்புத் திரையில் சேர்',
    // Engine: 3 11, Electional
    '3 11 All Timings': '3 11 எல்லா நேரங்களும்', 'Author’s Muhurtham': 'ஆசிரியரின் முகூர்த்தம்', 'Should:': 'இருக்க வேண்டியவை:', 'Should not:': 'இருக்கக் கூடாதவை:',
    'Trade / Buy & Sell (shares, goods, forex)': 'வர்த்தகம் / வாங்கல் விற்றல் (பங்குகள், பொருட்கள், அந்நியச் செலாவணி)',
    'Buy a Vehicle (car, bike, truck)': 'வாகனம் வாங்குதல் (கார், பைக், லாரி)', 'Purchase Land / House / Flat': 'நிலம் / வீடு / அடுக்ககம் வாங்குதல்',
    'Start Building / Foundation / Construction': 'கட்டடம் தொடங்குதல் / அடிக்கல் / கட்டுமானம்', 'Begin Agriculture (tilling & sowing)': 'விவசாயம் தொடங்குதல் (உழவு, விதைப்பு)',
    'Plant Trees / Grafting': 'மரம் நடுதல் / ஒட்டுக் கட்டுதல்', 'Win a Game / Match / Contest': 'விளையாட்டு / போட்டியில் வெல்லுதல்',
    'Horse Race / Racing': 'குதிரைப் பந்தயம் / பந்தயம்', 'Lottery / Speculation (chance)': 'லாட்டரி / ஊகம் (வாய்ப்பு)',
    'Start a Business / Open a Shop / Register Firm': 'தொழில் தொடங்குதல் / கடை திறத்தல் / நிறுவனப் பதிவு',
    'Sign Contract / Agreement / Lease / Partnership': 'ஒப்பந்தம் / உடன்படிக்கை / குத்தகை / கூட்டாண்மை கையெழுத்து',
    'Borrow / Lend / Invest (others’ money)': 'கடன் வாங்குதல் / கொடுத்தல் / முதலீடு (பிறர் பணம்)', 'Marriage / Engagement': 'திருமணம் / நிச்சயதார்த்தம்',
    'Begin a Journey / Travel': 'பயணம் தொடங்குதல்', 'Exam / Test / Interview / Licence': 'தேர்வு / சோதனை / நேர்காணல் / உரிமம்',
    'Enter a New House (house-warming)': 'புதுமனை புகுதல் (கிரகப்பிரவேசம்)', 'Get a Pet / Buy Animals': 'செல்லப்பிராணி / கால்நடை வாங்குதல்',
    'Start a New Job / Take a Post': 'புதிய வேலையில் சேருதல் / பதவி ஏற்றல்', 'Planetary positions recommended by the authors': 'ஆசிரியர்கள் பரிந்துரைக்கும் கிரக நிலைகள்',
    'Shortest window': 'குறைந்தபட்ச நேர அளவு', 'Zodiac': 'ராசிச் சக்கரம்', 'Strictness': 'கண்டிப்பு', 'Retrograde key planet': 'வக்கிர முக்கிய கிரகம்',
    // Engine: Fortuna
    'Quality:': 'தரம்:', 'Powerful sign:': 'வலிமையான ராசி:', 'Timing.': 'நேரம்.',
    'Money (receive, invest, bank)': 'பணம் (பெறுதல், முதலீடு, வங்கி)', 'Exam (write, appear)': 'தேர்வு (எழுதுதல், கலந்துகொள்ளுதல்)',
    'Job (apply, interview, join)': 'வேலை (விண்ணப்பம், நேர்காணல், சேருதல்)', 'Visa (apply)': 'விசா (விண்ணப்பம்)',
    'Medicine (start taking)': 'மருந்து (உட்கொள்ளத் தொடங்குதல்)', 'Travel (start a journey)': 'பயணம் (தொடங்குதல்)',
    'House (start building, move in)': 'வீடு (கட்டத் தொடங்குதல், குடிபுகுதல்)', 'Purchase (buy)': 'கொள்முதல் (வாங்குதல்)',
    'Only when Fortuna is good': 'போர்ச்சூனா நல்லதாக இருக்கும்போது மட்டும்', 'Skip medium and neutral moments': 'நடுத்தர, நடுநிலை நேரங்களைத் தவிர்',
    'Only in my Fortuna sign': 'என் போர்ச்சூனா ராசியில் மட்டும்', 'Needs the birth details below': 'கீழே உள்ள பிறப்பு விவரங்கள் தேவை',
    'Birth date': 'பிறந்த தேதி', 'Birth time': 'பிறந்த நேரம்', 'Birth latitude': 'பிறந்த இட அட்சரேகை', 'Birth longitude': 'பிறந்த இட தீர்க்கரேகை',
    'Birth time zone': 'பிறந்த இட நேர மண்டலம்', 'Birth place is the place above': 'பிறந்த இடம் மேலே உள்ள இடமே',
    // Engine: Astrocartography, GMP, Horary
    'City Search Radius': 'நகரத் தேடல் ஆரம்', 'Around a crossing': 'சந்திப்பைச் சுற்றி', 'Money Zone Width': 'பண மண்டல அகலம்',
    'Beside 2nd lord lines': '2-ஆம் அதிபதி கோடுகளுக்கு அருகில்', 'Line Types': 'கோட்டு வகைகள்', 'Used for the crossings': 'சந்திப்புகளுக்குப் பயன்படும்',
    'Question': 'கேள்வி', 'Question is about': 'கேள்வி எதைப் பற்றியது', 'Rotates the chart for relatives': 'உறவினர்களுக்காகச் சக்கரத்தைச் சுழற்றும்',
    'Cusp judged:': 'ஆய்ந்த பாவ முனை:', 'Chart by': 'சக்கர முறை', 'Horary number': 'பிரசன்ன எண்',
    'Think of your question, then give a number from 1 to 249': 'உங்கள் கேள்வியை நினைத்து, 1 முதல் 249 வரை ஒரு எண்ணைத் தாருங்கள்',
    'Time of question': 'கேள்வி நேரம்', 'Look ahead': 'முன்னோக்கிப் பார்', 'Retrograde rule': 'வக்கிர விதி', 'YES / NO': 'ஆம் / இல்லை',
    // Engine: Money, markets, lottery
    'How the rules were chosen.': 'விதிகள் தேர்ந்த முறை.', 'Be careful:': 'கவனம்:', 'Rules used.': 'பயன்படுத்திய விதிகள்.',
    'Lunar cycle': 'சந்திரச் சுழற்சி', 'Planet strength': 'கிரக வலிமை', 'Classic pairs': 'பாரம்பரிய இணைகள்', 'Other aspects': 'பிற பார்வைகள்',
    'Transit ascendant and cusps': 'கோசார லக்னமும் பாவ முனைகளும்', 'Turning-point windows': 'திருப்புமுனை நேரங்கள்',
    'Check the rules on real prices.': 'உண்மையான விலைகளில் விதிகளைச் சரிபாருங்கள்.', 'Patterns': 'வடிவங்கள்', 'Candle': 'மெழுகுவர்த்தி',
    'Session start': 'அமர்வு தொடக்கம்', 'Session end': 'அமர்வு முடிவு', 'Start level': 'தொடக்க நிலை', 'Your index level, or 100': 'உங்கள் குறியீட்டு நிலை, அல்லது 100',
    'Daily move': 'தினசரி அசைவு', 'Include Saturday and Sunday': 'சனி, ஞாயிறு சேர்', 'Market natal chart': 'சந்தையின் பிறப்புச் சக்கரம்',
    'Used for transit contacts': 'கோசாரத் தொடர்புகளுக்குப் பயன்படும்', 'Daily prices: date, open, high, low, close': 'தினசரி விலைகள்: தேதி, திறப்பு, உயர்வு, தாழ்வு, முடிவு',
    'What this is, honestly.': 'உண்மையில் இது என்ன.', 'Please read:': 'தயவுசெய்து படிக்கவும்:', 'Please read first.': 'முதலில் படிக்கவும்.',
    'Place where the ticket will be bought': 'சீட்டு வாங்கும் இடம்', 'Minimum Strength': 'குறைந்தபட்ச வலிமை', 'Minimum strength': 'குறைந்தபட்ச வலிமை',
    'Skip Unfavourable Times': 'சாதகமற்ற நேரங்களைத் தவிர்', 'Skip unfavourable times': 'சாதகமற்ற நேரங்களைத் தவிர்',
    'Draw day(s) of the month': 'மாதத்தின் குலுக்கல் நாள்(கள்)', 'For example 3': 'எடுத்துக்காட்டு 3', 'Draw time (Dubai, GST)': 'குலுக்கல் நேரம் (துபாய், GST)',
    'Places to check for buying': 'வாங்கச் சரிபார்க்கும் இடங்கள்', 'My place (above)': 'என் இடம் (மேலே)', 'Best windows to show': 'காட்ட வேண்டிய சிறந்த நேரங்கள்',
    'Number sets per moment': 'ஒரு நேரத்திற்கான எண் தொகுப்புகள்', 'Numbers in a set': 'தொகுப்பில் உள்ள எண்கள்', 'Highest number': 'அதிகபட்ச எண்', 'Highest play ball': 'அதிகபட்ச பந்து எண்',
    // Engine: sport, research
    'WICKET POSSIBILITY': 'விக்கெட் வாய்ப்பு', 'ADVERT BREAK': 'விளம்பர இடைவேளை', 'Ground: search a city or town': 'மைதானம்: நகரம் அல்லது ஊரைத் தேடுக',
    'Play Starts': 'ஆட்டம் தொடக்கம்', 'Play Ends': 'ஆட்டம் முடிவு', 'Search a city or racecourse': 'நகரம் அல்லது பந்தய மைதானத்தைத் தேடுக',
    'City or Course': 'நகரம் அல்லது மைதானம்', 'Race Date': 'பந்தயத் தேதி', 'Start Time': 'தொடக்க நேரம்', 'Horses': 'குதிரைகள்',
    'It does not forecast earthquakes.': 'இது நிலநடுக்கங்களை முன்னறிவிக்காது.', 'What to scan': 'எதைச் சோதிக்க', 'Minimum matches': 'குறைந்தபட்சப் பொருத்தங்கள்',
    // Engine: About
    'Our Gurus and Benefactors': 'எங்கள் குருமார்களும் உபகாரிகளும்', 'Works Fully Offline': 'முழுமையாக இணையமின்றி இயங்கும்', 'The Author': 'ஆசிரியர்',
    'Contact': 'தொடர்புக்கு', 'The great guru': 'மகா குரு', 'Revered guru': 'மதிப்பிற்குரிய குரு', 'Author of this application': 'இந்தச் செயலியின் ஆசிரியர்',
    'Founder of the KP system (1908 – 1972)': 'கே.பி முறையின் நிறுவனர் (1908 – 1972)', 'Inventor of the 3, 11 concept': '3, 11 கோட்பாட்டைக் கண்டறிந்தவர்',
    // Settings rows
    'Chart Colour': 'சக்கர வண்ணம்', 'Something went wrong on this page. Reload to try again.': 'இந்தப் பக்கத்தில் ஒரு பிழை ஏற்பட்டது. மீண்டும் ஏற்றிப் பாருங்கள்.',
    'Reload': 'மீண்டும் ஏற்று', 'Problem log': 'பிழைப் பதிவு', 'Copy problem log': 'பிழைப் பதிவை நகலெடு', 'Clear': 'அழி',
    '1 problem was recorded on this device.': 'இந்தச் சாதனத்தில் 1 பிழை பதிவானது.', '{n} problems were recorded on this device.': 'இந்தச் சாதனத்தில் {n} பிழைகள் பதிவாயின.',
    'Problem log copied. Paste it into a message to the developer.': 'பிழைப் பதிவு நகலெடுக்கப்பட்டது. உருவாக்குநருக்கான செய்தியில் ஒட்டவும்.', 'Copying is blocked here.': 'இங்கே நகலெடுக்க முடியாது.', 'Tap for details': 'விவரங்களுக்குத் தட்டவும்', '(a timing is listed only if every ticked rule is met)': '(தேர்ந்த எல்லா விதிகளும் பொருந்தும் நேரம் மட்டுமே பட்டியலிடப்படும்)',
    'Next 12 hours': 'அடுத்த 12 மணி நேரம்', 'Next 24 hours': 'அடுத்த 24 மணி நேரம்', 'Next 48 hours': 'அடுத்த 48 மணி நேரம்', 'Next 3 days': 'அடுத்த 3 நாள்', '31 days (or 366 for one place)': '31 நாள் (ஓர் இடத்திற்கு 366)',
    'Rahu kalam, Amavasya, Rikta, Vishti': 'ராகு காலம், அமாவாசை, ரிக்தை, விஷ்டி', 'Rahu kalam, Amavasya, Rikta tithi, Vishti karana': 'ராகு காலம், அமாவாசை, ரிக்தா திதி, விஷ்டி கரணம்',
    'Android phone:': 'ஆண்ட்ராய்டு போன்:', 'Windows:': 'விண்டோஸ்:', 'twice': 'இருமுறை'
  };

  /* ---------- Tamil patterns for text that carries values ---------- */
  var TA_DAY = { Sun: 'ஞாயிறு', Mon: 'திங்கள்', Tue: 'செவ்வாய்', Wed: 'புதன்', Thu: 'வியாழன்', Fri: 'வெள்ளி', Sat: 'சனி' };
  var TA_MON = { Jan: 'ஜன', Feb: 'பிப்', Mar: 'மார்', Apr: 'ஏப்', May: 'மே', Jun: 'ஜூன்', Jul: 'ஜூலை', Aug: 'ஆக', Sep: 'செப்', Oct: 'அக்', Nov: 'நவ', Dec: 'டிச' };
  var PLANET = 'Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu';
  // Sign names as they read before "லக்னம்" (கும்ப லக்னம், not கும்பம் லக்னம்)
  var TA_LAGNA = { Aries: 'மேஷ', Taurus: 'ரிஷப', Gemini: 'மிதுன', Cancer: 'கடக', Leo: 'சிம்ம', Virgo: 'கன்னி', Libra: 'துலா',
    Scorpio: 'விருச்சிக', Sagittarius: 'தனுசு', Capricorn: 'மகர', Aquarius: 'கும்ப', Pisces: 'மீன' };
  function dur(s) { return s.replace(/(\d+)h/g, '$1ம').replace(/(\d+)m/g, '$1நி').replace(/(\d+)s/g, '$1வி'); }
  var TA_RX = [
    // "Sat, 7 Nov 2026" and "Sat, 7 Nov 2026 · from 22:00"
    [/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat), (\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})( · from (\d{1,2}:\d{2}))?$/,
      function (m) { return TA_DAY[m[1]] + ', ' + m[2] + ' ' + TA_MON[m[3]] + ' ' + m[4] + (m[6] ? ' · ' + m[6] + ' முதல்' : ''); }],
    // Lord chains such as "Jupiter/Ketu/Rahu"
    [new RegExp('^(' + PLANET + ')(/(' + PLANET + '))+$'), function (m) { return m[0].split('/').map(function (p) { return TA[p]; }).join('/'); }],
    // Rising-now line
    [/^(\w+) ascendant · lagna lord \/ star lord \/ sub lord · changes in (.+?) \(at (\d{1,2}:\d{2}(:\d{2})?)\)$/,
      function (m) { return (TA_LAGNA[m[1]] || m[1]) + ' லக்னம் · லக்ன அதிபதி / நட்சத்திர அதிபதி / உப அதிபதி · ' + dur(m[2]) + ' இல் மாறும் (' + m[3] + ' மணிக்கு)'; }],
    [/^(\w+) ascendant$/, function (m) { return TA_LAGNA[m[1]] ? TA_LAGNA[m[1]] + ' லக்னம்' : null; }],
    // Row details: "Aquarius 19°13′20″ – 20°00′00″ · Shatabhisha" and "2m 39s · division 221 of 249"
    [/^(\w+) ([\d°′″]+) – ([\d°′″]+) · ([A-Za-z ]+)$/, function (m) { return TA[m[1]] && TA[m[4]] ? TA[m[1]] + ' ' + m[2] + ' – ' + m[3] + ' · ' + TA[m[4]] : null; }],
    [/^((?:\d+h )?(?:\d+m )?\d+s) · division (\d+) of (\d+)$/, function (m) { return dur(m[1]) + ' · பிரிவு ' + m[2] + ' / ' + m[3]; }],
    [/^(\d+) sub-lord changes in 24 hours$/, function (m) { return '24 மணி நேரத்தில் ' + m[1] + ' உப அதிபதி மாற்றங்கள்'; }],
    [/^to (\d{1,2}:\d{2}(:\d{2})?)$/, function (m) { return m[1] + ' வரை'; }],
    // "English · தமிழ்" labels: keep the Tamil half
    [/^[^஀-௿]*[A-Za-z][^஀-௿]* · ([஀-௿][\s\S]*)$/, function (m) { return m[1]; }],
    // "பணம் (வரவு) · houses 2, 6, 11"
    [/^(.*?)\s*· houses ([\d, ]+)$/, function (m) { return m[1] + ' · பாவங்கள் ' + m[2]; }],
    [/^(\d+)(st|nd|rd|th) lord$/, function (m) { return m[1] + '-ஆம் அதிபதி'; }],
    [/^(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})(.*)$/, function (m) { return m[1] + ' ' + TA_MON[m[2]] + ' ' + m[3] + m[4]; }],
    [/^(Rules|விதிகள்) \(a timing is listed only if every ticked rule is met\)$/, function () { return 'விதிகள் (தேர்ந்த எல்லா விதிகளும் பொருந்தும் நேரம் மட்டுமே பட்டியலிடப்படும்)'; }],
    [/^Time zone now: (.+)$/, function (m) { return 'இப்போதைய நேர மண்டலம்: ' + m[1]; }],
    // "Aquarius 18°51′ · Saturn/Rahu/Moon ·"
    [new RegExp('^(\\w+) ([\\d°′″]+) · ((?:' + PLANET + ')(?:/(?:' + PLANET + '))*)( ·)?$'), function (m) {
      return TA[m[1]] ? TA[m[1]] + ' ' + m[2] + ' · ' + m[3].split('/').map(function (x) { return TA[x]; }).join('/') + (m[4] || '') : null; }]
  ];

  /* ---------- Dictionaries ---------- */
  var MAP = {};
  LANGS.forEach(function (l) { MAP[l] = {}; });
  MULTI.forEach(function (row) {
    var v = row.split('|'), en = v.shift();
    LANGS.forEach(function (l, i) { if (v[i]) MAP[l][en] = v[i]; });
  });
  Object.keys(TA).forEach(function (k) { MAP.ta[k] = TA[k]; });

  function lang() { return document.body.getAttribute('data-lang') || 'bi'; }
  function active(l) { return l !== 'bi' && l !== 'en' && !!MAP[l]; }
  function translate(core, l) {
    var hit = MAP[l][core];
    if (hit) return hit;
    if (l === 'ta') for (var i = 0; i < TA_RX.length; i++) {
      var m = core.match(TA_RX[i][0]); if (m) { var r = TA_RX[i][1](m); if (r) return r; }
    }
    return null;
  }
  function tr(text, l) {
    var core = text.trim(); if (!core || !/[A-Za-z]/.test(core)) return text;
    var out = translate(core, l); if (out == null) return text;
    var at = text.indexOf(core);
    return text.slice(0, at) + out + text.slice(at + core.length);
  }
  // Remember what scripts were handed, so text they write already translated is known as main text.
  var OUT = new Set();
  window.rvT = function (text) {
    var l = lang(); if (!active(l)) return text;
    var t = translate(text, l); if (!t) return text;
    OUT.add(t.replace(/\{\w+\}/g, '').trim()); return t;
  };
  function ours(el) {
    if (el.hasAttribute('data-rvtr')) return true;
    if (el.matches('.ta,.tm,.tt,.gt,.gta')) return false; // the engine's own Tamil copies stay as they are
    var t = el.textContent.trim(); if (!t) return false;
    for (var k of OUT) { if (k && (t === k || (k.length > 3 && t.indexOf(k) >= 0))) return true; }
    return false;
  }

  /* ---------- Applying to the page (text nodes and a few attributes) ---------- */
  var rec = new WeakMap(), touched = new Set(), ATTRS = ['placeholder', 'title', 'aria-label'];
  var SKIP = /^(SCRIPT|STYLE|TEXTAREA|svg|SVG|NOSCRIPT)$/;
  function skipped(el) {
    for (var e = el; e && e !== document.body; e = e.parentNode) {
      if (e.nodeType === 1 && (SKIP.test(e.nodeName) || e.namespaceURI === 'http://www.w3.org/2000/svg' || e.isContentEditable)) return true;
    }
    return false;
  }
  function doText(n, l) {
    var r = rec.get(n);
    if (!r || n.nodeValue !== r.t) r = { o: n.nodeValue };
    var v = tr(r.o, l);
    if (v !== n.nodeValue) n.nodeValue = v;
    r.t = v; rec.set(n, r);
    if (v !== r.o) { touched.add(n); mine(n.parentNode); }
    else if (n.parentNode && n.parentNode.nodeType === 1 && ours(n.parentNode)) mine(n.parentNode);
  }
  // The engine marks elements whose text is all Tamil as "Tamil copies" (class tam60) and hides them
  // in single-language modes, and never unmarks them. Text translated here is the main text, not a copy.
  function mine(el) {
    if (!el || el.nodeType !== 1) return;
    el.setAttribute('data-rvtr', '');
    if (el.classList.contains('tam60')) el.classList.remove('tam60');
  }
  function doAttrs(el, l) {
    var r = rec.get(el) || {};
    ATTRS.forEach(function (a) {
      if (!el.hasAttribute(a)) return;
      var cur = el.getAttribute(a), x = r[a];
      if (!x || cur !== x.t) x = { o: cur };
      var v = tr(x.o, l);
      if (v !== cur) el.setAttribute(a, v);
      x.t = v; r[a] = x;
      if (v !== x.o) touched.add(el);
    });
    rec.set(el, r);
  }
  function walk(root, l) {
    if (!root) return;
    if (root.nodeType === 3) { if (!skipped(root.parentNode)) doText(root, l); return; }
    if (root.nodeType !== 1 || skipped(root)) return;
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (n.nodeType === 1 && (SKIP.test(n.nodeName) || n.namespaceURI === 'http://www.w3.org/2000/svg')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var list = [root], n; while ((n = tw.nextNode())) list.push(n);
    list.forEach(function (x) { if (x.nodeType === 3) doText(x, l); else if (x.attributes && x.attributes.length) doAttrs(x, l); });
  }
  function restore() {
    touched.forEach(function (n) {
      var r = rec.get(n); if (!r) return;
      if (n.nodeType === 3) { if (n.nodeValue === r.t) n.nodeValue = r.o; rec.delete(n); if (n.parentNode && n.parentNode.removeAttribute) n.parentNode.removeAttribute('data-rvtr'); return; }
      ATTRS.forEach(function (a) { var x = r[a]; if (x && n.getAttribute(a) === x.t) n.setAttribute(a, x.o); });
      rec.delete(n);
    });
    touched.clear();
  }
  /* Tamil mode: the engine prints many rules and notes in English with a Tamil copy inside the
     same paragraph, and hides the copy in every single-language mode. Show the copy instead. */
  var TWIN = '.ta,.tm,.tt,.gt,.gta', twinT;
  function twins(on) {
    document.querySelectorAll('.rv-ta-only').forEach(function (p) { if (!on) p.classList.remove('rv-ta-only'); });
    document.querySelectorAll('.rv-ta-twin').forEach(function (e) { if (!on) e.classList.remove('rv-ta-twin'); });
    if (!on) return;
    document.querySelectorAll(TWIN).forEach(function (e) {
      var p = e.parentElement, t = e.textContent.trim();
      if (!p || t.length < 20 || !/[஀-௿]/.test(t)) return;
      if (!/^(P|LI|LABEL|DIV|SPAN)$/.test(p.tagName) || p.querySelector('select,textarea,button,input:not([type=checkbox]):not([type=radio])')) return;
      var other = p.textContent;
      [].forEach.call(p.children, function (c) { if (c.matches(TWIN)) other = other.replace(c.textContent, ''); });
      if ((other.match(/[A-Za-z]/g) || []).length < 12) return;
      // Measure the paragraph's own size once, before it is shrunk (a later pass would read 0px).
      if (!p.classList.contains('rv-ta-only')) {
        p.style.setProperty('--rv-fs', getComputedStyle(p).fontSize);
        // keep a short lead label such as "R1" or "3." beside the Tamil text
        var lead = p.firstElementChild;
        if (lead && lead !== e && /^(B|STRONG)$/.test(lead.tagName) && /^[A-Z]?\d+[.):]?$/.test(lead.textContent.trim())) lead.classList.add('rv-ta-keep');
      }
      e.classList.add('rv-ta-twin'); p.classList.add('rv-ta-only');
    });
  }
  var current = null;
  function apply() {
    var l = lang();
    restore();
    current = l;
    twins(l === 'ta');
    if (active(l)) walk(document.body, l);
    document.dispatchEvent(new CustomEvent('rv-lang', { detail: l }));
  }
  new MutationObserver(function (ms) {
    if (!active(current)) return;
    ms.forEach(function (m) {
      if (m.type === 'characterData') { if (!skipped(m.target.parentNode)) doText(m.target, current); return; }
      if (m.type === 'attributes') {
        if (m.attributeName === 'class') { if (m.target.classList.contains('tam60') && ours(m.target)) mine(m.target); return; }
        if (!skipped(m.target)) doAttrs(m.target, current); return;
      }
      m.addedNodes.forEach(function (a) { walk(a, current); });
    });
    if (current === 'ta') { clearTimeout(twinT); twinT = setTimeout(function () { twins(true); }, 300); }
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS.concat('class') });
  new MutationObserver(function () { if (lang() !== current) apply(); })
    .observe(document.body, { attributes: true, attributeFilter: ['data-lang'] });
  apply();
})();
