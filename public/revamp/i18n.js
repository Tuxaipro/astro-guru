/* GuruAgasthiya revamp: translations for the text the revamp adds, and for engine labels the
   v7.7 language engine leaves in English.

   The engine (I18N60) translates 109 labels into 44 languages and, in Tamil mode, swaps an
   English line for the Tamil line printed beside it. This file follows the same rules:
   - "English + தமிழ்" (bi) and "English only" (en): nothing changes here.
   - Tamil (ta): every revamp text, plus the engine's short labels (fields, buttons, options,
     planets, signs, stars), with patterns for dates, lord chains and the rising-now line, and the
     long help paragraphs, translated whole (their Tamil is in i18n-ta.js).
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
    'Names and numbers|பெயர், எண்|नाम और अंक|పేరు, సంఖ్యలు|ಹೆಸರು ಮತ್ತು ಸಂಖ್ಯೆಗಳು|പേരും സംഖ്യകളും|नाव आणि अंक|નામ અને અંક|নাম ও সংখ্যা|ਨਾਮ ਅਤੇ ਅੰਕ|ନାମ ଓ ସଂଖ୍ୟା|نام اور اعداد|नाम र अङ्क|නම සහ අංක|नाम अङ्काः च|Nombres y números|Noms et nombres|Namen und Zahlen|Nomes e números|Nomi e numeri|Namen en getallen|Namn och siffror|Navne og tal|Nimet ja numerot|Imiona i liczby|Jména a čísla|Nume și numere|Nevek és számok|Имена и числа|Імена та числа|Ονόματα και αριθμοί|İsimler ve sayılar|الأسماء والأرقام|نام‌ها و اعداد|שמות ומספרים|名字与数字|名字與數字|名前と数字|이름과 숫자|ชื่อและตัวเลข|Nama dan angka|Nama dan nombor|Tên và con số|Majina na namba|Mga pangalan at numero',
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
    // Revamp: What's new page (its paragraphs are in i18n-ta.js)
    "What's new": 'புதியவை', 'New in the engine 11.2': 'இயந்திரம் 11.2-இல் புதியவை', 'Earlier, in 10.5': 'முன்பு, 10.5-இல்', 'New in the engine 10.5': 'இயந்திரம் 10.5-இல் புதியவை', 'New on the web': 'இணையப் பதிப்பில் புதியவை',
    "What's new in 11.2 and on the web": '11.2-இலும் இணையப் பதிப்பிலும் புதியவை', "What's new in 10.5 and on the web": '10.5-இலும் இணையப் பதிப்பிலும் புதியவை',
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
    'Finding your location… The browser may ask for permission.': 'உங்கள் இருப்பிடத்தைத் தேடுகிறது… உலாவி அனுமதி கேட்கலாம்.',
    'Location is not available in this browser. Search for a city instead.': 'இந்த உலாவியில் இருப்பிடம் கிடைக்காது. அதற்குப் பதிலாக ஒரு நகரத்தைத் தேடவும்.',
    'Location permission was denied or blocked. Allow location for this site in the browser (the icon beside the address), then try again, or search for a city.': 'இருப்பிட அனுமதி மறுக்கப்பட்டது அல்லது தடுக்கப்பட்டது. உலாவியில் (முகவரிக்கு அருகில் உள்ள ஐகான்) இந்தத் தளத்திற்கு இருப்பிடத்தை அனுமதித்து மீண்டும் முயலவும், அல்லது ஒரு நகரத்தைத் தேடவும்.',
    'Your device gave no position. On a computer, allow location for the browser in the system settings (Mac: System Settings → Privacy & Security → Location Services) and keep Wi‑Fi on. On a phone, switch on Location. Then try again, or search for a city.': 'உங்கள் சாதனம் இருப்பிடத்தைத் தரவில்லை. கணினியில், கணினி அமைப்புகளில் உலாவிக்கு இருப்பிடத்தை அனுமதிக்கவும் (Mac: System Settings → Privacy & Security → Location Services); Wi‑Fi இயக்கத்தில் இருக்கட்டும். தொலைபேசியில் Location-ஐ இயக்கவும். பிறகு மீண்டும் முயலவும், அல்லது ஒரு நகரத்தைத் தேடவும்.',
    'Could not get your location. Try again, or search for a city.': 'உங்கள் இருப்பிடத்தைப் பெற முடியவில்லை. மீண்டும் முயலவும், அல்லது ஒரு நகரத்தைத் தேடவும்.',
    'Finding your location took too long. Try again, or search for a city.': 'இருப்பிடத்தைத் தேட நீண்ட நேரமாகிறது. மீண்டும் முயலவும், அல்லது ஒரு நகரத்தைத் தேடவும்.',
    'My location': 'என் இருப்பிடம்',
    'Looking up the approximate place of your connection…': 'உங்கள் இணைப்பின் தோராய இடத்தைத் தேடுகிறது…',
    'The approximate place could not be found either. Search for a city.': 'தோராய இடமும் கிடைக்கவில்லை. ஒரு நகரத்தைத் தேடவும்.',
    'Your connection seems to be near {place} (approximate). ': 'உங்கள் இணைப்பு {place} அருகில் இருப்பது போல் தெரிகிறது (தோராயம்). ',
    'Use {place}': '{place} பயன்படுத்து',
    'Home place: {place} (approximate, from your connection)': 'சொந்த இடம்: {place} (தோராயம், உங்கள் இணைப்பிலிருந்து)',
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
    'Android phone:': 'ஆண்ட்ராய்டு போன்:', 'Windows:': 'விண்டோஸ்:', 'twice': 'இருமுறை',
    // Revamp: long result lists
    'Showing {shown} of {total}': '{total}இல் {shown} காட்டப்படுகிறது',
    'Show {n} more': 'மேலும் {n} காட்டு',
    'Show all': 'அனைத்தையும் காட்டு',

    // Engine 10.5: Guru Agasthiya Muhurtham, Natal Chart Trade, Ask GuruAgasthiya
    'Guru Agasthiya Muhurtham': 'குரு அகஸ்திய முகூர்த்தம்',
    'Natal Chart Trade': 'ஜாதக வர்த்தக பலன்',
    'Ask GuruAgasthiya': 'குருஅகஸ்தியாவிடம் கேளுங்கள்',
    'Mundane Astrology': 'உலகியல் ஜோதிடம்',
    'How It Works · Marks': 'எப்படி செயல்படுகிறது · மதிப்பெண்கள்',
    'Place where you want the muhurtham': 'முகூர்த்தம் தேவைப்படும் இடம்',
    'My places · என் இடங்கள் (save a village or a spot once, find it offline)': 'என் இடங்கள் (ஒரு கிராமத்தை அல்லது இடத்தை ஒருமுறை சேமித்தால், இணையம் இன்றியும் கிடைக்கும்)',
    'State / Province / County': 'மாநிலம் / மாகாணம் / மாவட்டம்',
    'City / Town / Village': 'நகரம் / ஊர் / கிராமம்',
    'Place name': 'இடத்தின் பெயர்',
    'State / County': 'மாநிலம் / மாவட்டம்',
    'Least marks to list': 'பட்டியலிடக் குறைந்தபட்ச மதிப்பெண்',
    'Skip retrograde lords': 'வக்கிர அதிபதிகளைத் தவிர்',
    'Highly auspicious only': 'மிக உத்தமமானவை மட்டும்',
    'Type it for any village': 'எந்தக் கிராமத்தையும் தட்டச்சு செய்யலாம்',
    'Name like America/New_York, or hours like 5.5': 'America/New_York போன்ற பெயர், அல்லது 5.5 போன்ற மணிகள்',
    'Local time of the place': 'அந்த இடத்தின் உள்ளூர் நேரம்',
    // Revamp: Ask GuruAgasthiya, when no rule matched the question
    'Closest to your question:': 'உங்கள் கேள்விக்கு நெருக்கமானவை:',
    'You can ask me about…': 'நீங்கள் என்னிடம் கேட்கலாம்…',
    'Muhurtham': 'முகூர்த்தம்', 'Birth chart': 'ஜாதகம்', 'Horary question': 'பிரசன்னக் கேள்வி', 'Lost items': 'தொலைந்த பொருள்',
    'Money': 'பணம்', 'Trade and markets': 'வர்த்தகம், சந்தை', 'Lottery': 'லாட்டரி', 'Cricket': 'கிரிக்கெட்',
    'Horse race': 'குதிரைப் பந்தயம்', 'World events': 'உலக நிகழ்வுகள்', 'About astrology': 'ஜோதிடம் பற்றி',
    'Muhurtham for marriage next week': 'அடுத்த வாரம் திருமண முகூர்த்தம்',
    'Read my birth chart': 'என் ஜாதகத்தைப் பார்',
    'Will I clear my exam?': 'நான் தேர்வில் வெற்றி பெறுவேனா?',
    'Will I find my lost item?': 'தொலைந்த பொருள் கிடைக்குமா?',
    'When will my money problems end?': 'என் பணக் கஷ்டம் எப்போது தீரும்?',
    'Is today good for share trading?': 'இன்று பங்கு வர்த்தகம் செய்யலாமா?',
    'Lottery muhurtham and numbers': 'லாட்டரி முகூர்த்தம், எண்கள்',
    'Who will win today’s cricket match?': 'இன்றைய கிரிக்கெட் போட்டியில் யார் வெல்வார்?',
    'Horse race timings for today': 'இன்றைய குதிரைப் பந்தய நேரங்கள்',
    'Any earthquake in the next 3 months?': 'அடுத்த 3 மாதத்தில் நிலநடுக்கம் வருமா?',
    'Explain the 12 houses': '12 பாவங்களை விளக்கு',
    // Engine 11.2: Chandra Muhurtham, personal Tara Bala and Chandra Bala
    'Personal Tara Bala, Chandra Bala and best time (one or more people)': 'தனிப்பட்ட தாரா பலம், சந்திர பலம், சிறந்த நேரம் (ஒருவர் அல்லது பலர்)',
    'Add one or more people by birth details or by birth star only, or add nobody to use the general rules. The date range and place come from the form above. The tool checks the Moon’s star (Tara Bala), the Moon’s sign (Chandra Bala), Panchaka, the five parts of the panchanga, Rahu kalam, Yamagandam, Gulika and Durmuhurta and the rising sign, then lists the best date and time.': 'பிறப்பு விவரங்களால் அல்லது பிறந்த நட்சத்திரத்தால் மட்டும் ஒருவரையோ பலரையோ சேர்க்கலாம்; பொது விதிகளைப் பயன்படுத்த யாரையும் சேர்க்காமலும் விடலாம். தேதி வரம்பும் இடமும் மேலே உள்ள படிவத்திலிருந்து எடுக்கப்படும். சந்திரனின் நட்சத்திரம் (தாரா பலம்), சந்திரனின் ராசி (சந்திர பலம்), பஞ்சகம், பஞ்சாங்கத்தின் ஐந்து அங்கங்கள், ராகு காலம், எமகண்டம், குளிகை, துர்முகூர்த்தம், உதய லக்னம் ஆகியவற்றைச் சரிபார்த்து, சிறந்த தேதியையும் நேரத்தையும் இந்தக் கருவி பட்டியலிடும்.',
    'Purpose': 'நோக்கம்',
    'What the muhurtham is for': 'முகூர்த்தம் எதற்காக',
    'Time of day': 'நாளின் நேரம்',
    'Recommend only these hours': 'இந்த மணிநேரங்களை மட்டும் பரிந்துரை',
    'Daytime (sunrise to sunset)': 'பகல் (சூரிய உதயம் முதல் அஸ்தமனம் வரை)',
    'Any time, day or night': 'எந்த நேரமும், பகல் அல்லது இரவு',
    'Rahu kalam, Yamagandam, Gulika, Durmuhurta': 'ராகு காலம், எமகண்டம், குளிகை, துர்முகூர்த்தம்',
    'Whether to avoid them': 'அவற்றைத் தவிர்க்க வேண்டுமா',
    'Avoid them (recommended)': 'தவிர் (பரிந்துரைக்கப்படுகிறது)',
    'Do not apply these rules': 'இந்த விதிகளைப் பயன்படுத்த வேண்டாம்',
    'Also use the KP Chandra muhurtham rule': 'KP சந்திர முகூர்த்த விதியையும் பயன்படுத்து',
    'Adds points when the KP rule is met': 'KP விதி நிறைவேறும்போது புள்ளிகள் சேர்க்கும்',
    'Best choices to list': 'பட்டியலிட வேண்டிய சிறந்த தேர்வுகள்',
    'All Timings': 'எல்லா நேரங்களும்',
    'Highly Auspicious Only': 'மிக உத்தமமானவை மட்டும்',
    'Money Muhurtham and Flow': 'பண முகூர்த்தமும் பண ஓட்டமும்',
    // Engine 11.2: Practical Electional, traditional rules
    'Traditional rules': 'பாரம்பரிய விதிகள்',
    'nakshatra, tithi, weekday, lagna, planets': 'நட்சத்திரம், திதி, கிழமை, லக்னம், கிரகங்கள்',
    'Full (day + lagna + planets)': 'முழுமை (நாள் + லக்னம் + கிரகங்கள்)',
    'Day rules only': 'நாள் விதிகள் மட்டும்',
    'Off (KP cusp test only)': 'இல்லை (KP பாவ முனைச் சோதனை மட்டும்)',
    '0 · Method': '0 · முறை',
    '1 · What do you want to begin?': '1 · எதைத் தொடங்க விரும்புகிறீர்கள்?',
    '2 · Place, dates and time': '2 · இடம், தேதிகள், நேரம்',
    'Tropical (as in the books)': 'சாயனம் (நூல்களில் உள்ளபடி)',
    'Sidereal (KP / Lahiri)': 'நிராயனம் (KP / லாஹிரி)',
    'Strict – avoid (as the books say)': 'கண்டிப்பு – தவிர் (நூல்கள் சொல்வதுபோல்)',
    'Relaxed – allow with a penalty': 'தளர்வு – குறைந்த மதிப்பெண்ணுடன் அனுமதி',
    '15 minutes': '15 நிமிடங்கள்',
    '30 minutes': '30 நிமிடங்கள்',
    '90 minutes': '90 நிமிடங்கள்',
    '1 hour': '1 மணி நேரம்',
    // Engine 11.2: Market Transit forecast report
    'Forecast report: instruments and your own chart': 'முன்னறிவிப்பு அறிக்கை: வர்த்தகப் பொருட்களும் உங்கள் ஜாதகமும்',
    'Instruments to forecast': 'முன்னறிவிக்க வேண்டியவை',
    'Nifty, Bank Nifty, Sensex, sectors, gold, silver, crude oil, dollar-rupee': 'நிஃப்டி, பேங்க் நிஃப்டி, சென்செக்ஸ், துறைகள், தங்கம், வெள்ளி, கச்சா எண்ணெய், டாலர்-ரூபாய்',
    'PSU and Power': 'பொதுத்துறை, மின்சாரம்',
    'Media and Telecom': 'ஊடகம், தொலைத்தொடர்பு',
    'Gold': 'தங்கம்',
    'Silver': 'வெள்ளி',
    'Crude oil': 'கச்சா எண்ணெய்',
    'Select all': 'அனைத்தையும் தேர்',
    'Add my trading days from my birth chart': 'என் ஜாதகத்திலிருந்து எனக்கான வர்த்தக நாட்களைச் சேர்',
    'Uses dasha, bhukti, antara, Moon and Jupiter / Saturn transits': 'தசை, புக்தி, அந்தரம், சந்திரன், குரு / சனி கோசாரத்தைப் பயன்படுத்தும்',
    'Hours such as 5.5 or a name': '5.5 போன்ற மணிகள் அல்லது ஒரு பெயர்',
    'Copy from my Birth Chart entries': 'என் பிறப்பு ஜாதகப் பதிவுகளிலிருந்து நகலெடு',
    'Compare with your real prices (optional)': 'உங்கள் உண்மையான விலைகளுடன் ஒப்பிடுக (விருப்பம்)',
    'Daily': 'தினசரி',
    'Calm · 0.5%': 'அமைதி · 0.5%',
    'Normal · 1%': 'இயல்பு · 1%',
    'Active · 1.5%': 'சுறுசுறுப்பு · 1.5%',
    'Wild · 2.5%': 'கடும் ஏற்ற இறக்கம் · 2.5%',
    'None': 'இல்லை',
    'My own date, time and place': 'என் சொந்தத் தேதி, நேரம், இடம்',
    'NSE / Nifty (3 Nov 1994, 09:00, assumed)': 'NSE / நிஃப்டி (3 நவ 1994, 09:00, அனுமானம்)',
    'Exchange city: Mumbai, New York, London': 'பங்குச்சந்தை நகரம்: Mumbai, New York, London',
    // Engine 11.1: Lottery number studio (inside Lottery Rules)
    'Lottery number studio · 4, 5, 6 digits and number sets': 'லாட்டரி எண் கூடம் · 4, 5, 6 இலக்கங்கள், எண் தொகுப்புகள்',
    'Choose the game, enter your birth details if you want a personal reading, and get ticket numbers that combine your chart (lucky planets, Part of Fortune, running dasha), numerology, the planets of the draw day and mathematical selection rules, plus the best times to buy. The place where the ticket will be bought is the one set at the top of this panel.': 'விளையாட்டைத் தேர்ந்தெடுங்கள்; தனிப்பட்ட பலன் வேண்டுமெனில் பிறப்பு விவரங்களை இடுங்கள். உங்கள் ஜாதகம் (அதிர்ஷ்டக் கிரகங்கள், அதிர்ஷ்டப் புள்ளி (Part of Fortune), நடப்புத் தசை), எண் கணிதம், குலுக்கல் நாளின் கிரகங்கள், கணிதத் தேர்வு விதிகள் ஆகியவற்றை இணைத்த சீட்டு எண்களும், வாங்குவதற்கான சிறந்த நேரங்களும் கிடைக்கும். சீட்டு வாங்கப்படும் இடம், இந்தப் பலகத்தின் மேலே அமைத்த இடமே.',
    '3-digit game (000-999)': '3 இலக்க விளையாட்டு (000-999)',
    '4-digit game (0000-9999)': '4 இலக்க விளையாட்டு (0000-9999)',
    '5-digit game (00000-99999)': '5 இலக்க விளையாட்டு (00000-99999)',
    '6-digit game (000000-999999)': '6 இலக்க விளையாட்டு (000000-999999)',
    '5 numbers from 1-49 + 1 play ball from 1-26': '1-49இல் 5 எண்கள் + 1-26இல் 1 கூடுதல் பந்து',
    '6 numbers from 1-64 + 1 play ball from 1-74': '1-64இல் 6 எண்கள் + 1-74இல் 1 கூடுதல் பந்து',
    '5 numbers from 1-50 + 2 play balls from 1-12': '1-50இல் 5 எண்கள் + 1-12இல் 2 கூடுதல் பந்துகள்',
    '6 numbers from 1-49 + 2 play balls from 1-10': '1-49இல் 6 எண்கள் + 1-10இல் 2 கூடுதல் பந்துகள்',
    'Custom: set the numbers below': 'தனிப்பயன்: கீழே எண்களை அமைக்கவும்',
    'Independent tickets': 'தனித்தனிச் சீட்டுகள்',
    'Wheel: cover my best numbers (sets only)': 'சக்கரம்: என் சிறந்த எண்களை உள்ளடக்கு (தொகுப்புகளுக்கு மட்டும்)',
    'Wheel list size (8-14)': 'சக்கரப் பட்டியல் அளவு (8-14)',
    'Numbers per ticket (1-12)': 'ஒரு சீட்டுக்கு எண்கள் (1-12)',
    'Highest number (1 to …)': 'அதிகபட்ச எண் (1 முதல் …)',
    'Play balls (0-3)': 'கூடுதல் பந்துகள் (0-3)',
    'Highest play ball (1 to …)': 'அதிகபட்ச கூடுதல் பந்து (1 முதல் …)',
    'Birth time zone (hours or name)': 'பிறந்த இட நேர மண்டலம் (மணிகள் அல்லது பெயர்)',
    'Draw time (local)': 'குலுக்கல் நேரம் (உள்ளூர்)',
    'Buy to (up to 31 days)': 'வாங்கும் கடைசி நாள் (31 நாட்கள் வரை)',
    'Use the mathematical selection rules': 'கணிதத் தேர்வு விதிகளைப் பயன்படுத்து',
    'Sum band, odd/even, low/high, spread, no patterns': 'கூட்டுத்தொகை வரம்பு, ஒற்றை/இரட்டை, குறைவு/அதிகம், பரவல், வடிவங்கள் இல்லை',
    'Spread numbers across the tickets': 'எண்களைச் சீட்டுகளில் பரவலாக்கு',
    'Avoid repeating the same number everywhere': 'ஒரே எண் எல்லாச் சீட்டிலும் வருவதைத் தவிர்',
    'Save file': 'கோப்பைச் சேமி',
    'Good (50 and above)': 'நல்லது (50 மற்றும் மேல்)',
    'Strong (65 and above)': 'வலுவானது (65 மற்றும் மேல்)',
    'Very strong (80 and above)': 'மிக வலுவானது (80 மற்றும் மேல்)',
    'Ticket place: Tiruchirappalli, Las Vegas, Dubai': 'சீட்டு வாங்கும் இடம்: Tiruchirappalli, Las Vegas, Dubai',
    // Birth Chart: months and report options
    'January': 'ஜனவரி',
    'February': 'பிப்ரவரி',
    'March': 'மார்ச்',
    'April': 'ஏப்ரல்',
    'May': 'மே',
    'June': 'ஜூன்',
    'July': 'ஜூலை',
    'August': 'ஆகஸ்ட்',
    'September': 'செப்டம்பர்',
    'October': 'அக்டோபர்',
    'November': 'நவம்பர்',
    'December': 'டிசம்பர்',
    'English only': 'ஆங்கிலம் மட்டும்',
    'Name of the native': 'ஜாதகரின் பெயர்',
    'Today’s sky': 'இன்றைய வானம்', 'Planets': 'கிரகங்கள்',
    'Rahu kalam today': 'இன்று ராகு காலம்', 'Planet positions today': 'இன்றைய கிரக நிலைகள்',
    'Vehicles': 'வாகனங்கள்', 'Farming': 'விவசாயம்', 'Vehicle muhurtham': 'வாகன முகூர்த்தம்', 'Agriculture muhurtham': 'விவசாய முகூர்த்தம்',
    'Name numerology': 'பெயர் எண் கணிதம்',
    // 11.2 leftovers: Practical Electional's KP rows, close buttons' spoken name, the shared farming panel
    'Lagna': 'லக்னம்', '· favourable': '· சாதகம்', '7th cusp': '7-ஆம் பாவ முனை', '11th cusp': '11-ஆம் பாவ முனை',
    'Close': 'மூடு', 'Agriculture Muhurtham': 'விவசாய முகூர்த்தம்', 'Vehicle Muhurtham': 'வாகன முகூர்த்தம்',
    'Name and number readings are in two tools: Nameology & Numerology for a name (yours, a baby’s or a business’s), and Mobile Numerology for a mobile or vehicle number.': 'பெயர், எண் பலன்கள் இரண்டு கருவிகளில் உள்ளன: ஒரு பெயருக்கு (உங்களுடையது, குழந்தையுடையது அல்லது தொழிலுடையது) பெயர் மற்றும் எண் கணிதம்; மொபைல் அல்லது வாகன எண்ணுக்கு மொபைல் எண் கணிதம்.',
    'Open: Nameology & Numerology': 'திற: பெயர் மற்றும் எண் கணிதம்', 'Open: Mobile Numerology': 'திற: மொபைல் எண் கணிதம்',
    'You are welcome. Ask me another question whenever you like.': 'மகிழ்ச்சி. எப்போது வேண்டுமானாலும் இன்னொரு கேள்வி கேளுங்கள்.',
    'I am this app’s question guide. I answer from its own KP rules and databases, fully offline, with no AI behind me. I understand questions phrased like these best:': 'நான் இந்தச் செயலியின் கேள்வி வழிகாட்டி. இதன் சொந்த KP விதிகள், தரவுகளிலிருந்தே பதில் சொல்கிறேன்; முழுவதும் ஆஃப்லைன், பின்னால் AI எதுவும் இல்லை. இவை போன்ற வடிவில் கேட்டால் நன்றாகப் புரிந்துகொள்வேன்:',
    'Go ahead and ask your question, or tap one of these:': 'உங்கள் கேள்வியைக் கேளுங்கள், அல்லது இவற்றில் ஒன்றைத் தொடுங்கள்:',
    'Goodbye. Come back whenever you have a question.': 'போய் வாருங்கள். கேள்வி இருக்கும்போது மீண்டும் வாருங்கள்.',
    'Lagna and sub-lord timings for a day are in the Lagna Timings tool. It lists every change of lagna, star lord and sub lord at your place.': 'ஒரு நாளின் லக்ன, உப அதிபதி நேரங்கள் லக்ன நேரங்கள் கருவியில் உள்ளன. உங்கள் இடத்தில் லக்னம், நட்சத்திர அதிபதி, உப அதிபதி மாறும் ஒவ்வொரு நேரத்தையும் அது பட்டியலிடும்.',
    'Open: Lagna Timings': 'திற: லக்ன நேரங்கள்',
    'Questions I could not match': 'பொருத்த முடியாத கேள்விகள்',
    'Nothing yet. Every question I could not match will be listed here.': 'இன்னும் எதுவும் இல்லை. நான் பொருத்த முடியாத ஒவ்வொரு கேள்வியும் இங்கே பட்டியலிடப்படும்.',
    'Saved on this device only. Copy the list and share it, so the rules can learn these phrasings.': 'இந்தச் சாதனத்தில் மட்டும் சேமிக்கப்படும். பட்டியலை நகலெடுத்துப் பகிர்ந்தால், இந்த வடிவங்களை விதிகளில் சேர்க்கலாம்.',
    '{n} times': '{n} முறை', 'Copy list': 'பட்டியலை நகலெடு', 'List copied': 'பட்டியல் நகலெடுக்கப்பட்டது', 'Could not copy': 'நகலெடுக்க முடியவில்லை',
    'Ascendant lord, star lord, sub lord (Rahu, Ketu excepted)': 'லக்னாதிபதி, நட்சத்திர அதிபதி, உப அதிபதி (ராகு, கேது தவிர)',
    'Copy from the place above': 'மேலே உள்ள இடத்திலிருந்து நகலெடு',
    'Save this place': 'இந்த இடத்தைச் சேமி',
    'No saved places yet.': 'சேமித்த இடங்கள் இன்னும் இல்லை.',
    'Find Muhurtham': 'முகூர்த்தம் காண்',
    'Analyse My Chart': 'என் ஜாதகத்தை ஆராய்',
    'Search a city, town or village': 'நகரம், ஊர் அல்லது கிராமத்தைத் தேடு',
    'City, town or village: Sendurai, North Brunswick, Chennai': 'நகரம், ஊர் அல்லது கிராமம்: Sendurai, North Brunswick, Chennai',
    '3 marks': '3 மதிப்பெண்கள்',
    '4 marks': '4 மதிப்பெண்கள்',
    '5 marks': '5 மதிப்பெண்கள்',
    '6 marks': '6 மதிப்பெண்கள்',
    '8 marks': '8 மதிப்பெண்கள்',
    '10 marks': '10 மதிப்பெண்கள்',
    '12 marks': '12 மதிப்பெண்கள்',
    '14 marks': '14 மதிப்பெண்கள்',
    'By time': 'நேர வரிசையில்',
    'Best first': 'சிறந்தவை முதலில்',
    '1 mark each:': 'ஒவ்வொன்றுக்கும் 1 மதிப்பெண்:',
    '2 marks each:': 'ஒவ்வொன்றுக்கும் 2 மதிப்பெண்கள்:',
    'Square trio:': 'சதுர மும்மை:',
    'Place of birth': 'பிறந்த இடம்',
    'Dates to analyse': 'ஆய்வு செய்யும் தேதிகள்',
    'Birth details': 'பிறப்பு விவரங்கள்',
    'Local clock time, with seconds if known': 'உள்ளூர் கடிகார நேரம்; தெரிந்தால் வினாடிகளுடன்',
    'Where you trade; name like Asia/Kolkata or hours like 5.5': 'நீங்கள் வர்த்தகம் செய்யும் இடம்; Asia/Kolkata போன்ற பெயர் அல்லது 5.5 போன்ற மணிகள்',
    'Trading time zone': 'வர்த்தக நேர மண்டலம்',
    'Also show mild windows': 'மிதமான நேரங்களையும் காட்டு',
    'No match in the offline list. Type the latitude and longitude below, save the place under “My places”, or search online when connected': 'இணையமில்லாப் பட்டியலில் பொருத்தம் இல்லை. கீழே அட்சரேகை, தீர்க்கரேகையை உள்ளிடவும், “என் இடங்கள்” கீழ் இடத்தைச் சேமிக்கவும், அல்லது இணைப்பு இருக்கும்போது ஆன்லைனில் தேடவும்',
    'Place by coordinates': 'ஆயத்தொலைவுகளால் இடம்',
    '👤 Birth details': '👤 பிறப்பு விவரங்கள்',
    '📜 Horary Answers · 174': '📜 ஹோரரி விடைகள் · 174',
    '🔮 GMP Prasnam': '🔮 ஜிஎம்பி பிரசன்னம்',
    '⏱ 3·11 Muhurtham': '⏱ 3·11 முகூர்த்தம்',
    '🔔 Horary muhurtham': '🔔 ஹோரரி முகூர்த்தம்',
    '🔊 Read replies aloud': '🔊 பதில்களை வாசித்துக் காட்டு',
    '🎧 Hands-free conversation': '🎧 கைகள் இன்றி உரையாடல்',
    '⏹ Stop': '⏹ நிறுத்து',

    // Engine 10.5: additions inside older tools
    // Mundane Astrology: city-level indications
    'Show indications': 'காட்டும் குறிப்புகள்', 'Watch and above': 'கவனம் மற்றும் மேல்', 'Elevated and above': 'கூடுதல் மற்றும் மேல்', 'High only': 'உயர் மட்டும்',
    'Search Chennai, Tokyo, Istanbul': 'Chennai, Tokyo, Istanbul எனத் தேடுங்கள்', 'Search a city or town': 'நகரம் அல்லது ஊரைத் தேடு',
    'All countries (use search)': 'எல்லா நாடுகளும் (தேடலைப் பயன்படுத்துங்கள்)', 'No match in the offline list': 'இணையமில்லாப் பட்டியலில் பொருத்தம் இல்லை',
    'Month': 'மாதம்', 'Tendency': 'போக்கு', 'Event': 'நிகழ்வு', 'Events': 'நிகழ்வுகள்', 'Kind': 'வகை', 'Level': 'நிலை', 'Area': 'பகுதி', 'Show': 'காட்டுவது',
    'Earth tremors': 'நில அதிர்வு', 'Heavy rain': 'கனமழை', 'Cyclones': 'புயல்', 'Drought': 'வறட்சி', 'Conflict': 'மோதல்', 'Economic': 'பொருளாதாரம்', 'Epidemic': 'தொற்று', 'Accidents (air': 'விபத்துகள்',
    'Watch': 'கவனம்', 'Elevated': 'கூடுதல்', 'High indication': 'வலுவான குறிப்பு', 'Marked stress': 'தெளிவான அழுத்தம்', 'Mild stress': 'லேசான அழுத்தம்', 'No special stress': 'சிறப்பு அழுத்தம் இல்லை',
    '(local)': '(உள்ளூர்)', 'Balanced or mixed': 'சமநிலை / கலவை',
    'Choose the first and last date.': 'முதல், கடைசித் தேதிகளைத் தேர்ந்தெடுங்கள்.', 'The last date must be after the first date.': 'கடைசித் தேதி முதல் தேதிக்குப் பின் இருக்க வேண்டும்.',
    'The last date must not be before the first date.': 'கடைசித் தேதி முதல் தேதிக்கு முன் இருக்கக்கூடாது.', 'Please choose at most about 26 months at a time.': 'ஒரு முறைக்கு சுமார் 26 மாதங்கள் வரை மட்டும் தேர்ந்தெடுங்கள்.',
    'Please choose at most 15 days at a time.': 'ஒரு முறைக்கு 15 நாட்கள் வரை மட்டும் தேர்ந்தெடுங்கள்.', 'Enter the south, north, west and east limits of the area.': 'பகுதியின் தெற்கு, வடக்கு, மேற்கு, கிழக்கு எல்லைகளை உள்ளிடுங்கள்.',
    'Planet positions need the astronomy library, which did not load.': 'கிரக நிலைகளுக்கு வானியல் நூலகம் தேவை; அது ஏற்றப்படவில்லை.',
    'Location is not available here.': 'இங்கு இருப்பிடம் கிடைக்கவில்லை.', 'Finding your location…': 'உங்கள் இருப்பிடம் தேடப்படுகிறது…', 'Could not get your location.': 'உங்கள் இருப்பிடத்தைப் பெற முடியவில்லை.',
    'Copied.': 'நகலெடுக்கப்பட்டது.', 'Copy is not available here.': 'இங்கு நகலெடுக்க முடியாது.', 'Setting the alarms…': 'அலாரங்கள் அமைக்கப்படுகின்றன…', 'No upcoming window to set.': 'அமைக்க வரவிருக்கும் சாளரம் இல்லை.',
    // Mundane Astrology: aircraft accidents
    'South': 'தெற்கு', 'North': 'வடக்கு', 'West': 'மேற்கு', 'East': 'கிழக்கு',
    'Pattern': 'அமைப்பு', 'In the 20 crashes': '20 விபத்துகளில்', 'Expected by chance': 'தற்செயல் எதிர்பார்ப்பு', 'Chance of such a result': 'இப்படி வர வாய்ப்பு',
    'Date (local)': 'தேதி (உள்ளூர்)', 'Event and place': 'நிகழ்வு, இடம்', 'Lost': 'உயிரிழப்பு', 'Hard planets': 'கடின கிரகங்கள்', 'Rule score': 'விதி மதிப்பெண்', 'What the rules found': 'விதிகள் கண்டவை',
    'Hard planet on an angle of the site': 'இடத்தின் கோணத்தில் கடின கிரகம்', 'Hard planet on a chart angle there': 'அங்கு கோணத்தில் கடின கிரகம்', 'Moment (UTC)': 'தருணம் (UTC)', 'Latitude, longitude': 'அட்சரேகை, தீர்க்கரேகை', 'City or town': 'நகரம் / ஊர்', 'Lines': 'கோடுகள்',
    'Ari': 'மேஷ', 'Tau': 'ரிஷ', 'Gem': 'மிது', 'Can': 'கடக', 'Vir': 'கன்', 'Lib': 'துலா', 'Sco': 'விரு', 'Sag': 'தனு', 'Cap': 'மகர', 'Aqu': 'கும்', 'Pis': 'மீன',
    'World map (works offline)': 'உலக வரைபடம் (இணையம் இன்றி)', 'Zoom in': 'பெரிதாக்கு', 'Zoom out': 'சிறிதாக்கு', 'Reset': 'மீட்டமை',
    'Saturn on the Rahu–Ketu axis': 'சனி ராகு–கேது அச்சில்', 'Eclipse season: new or full Moon near the Rahu–Ketu axis': 'கிரகண காலம்: ராகு–கேது அச்சில் அமாவாசை / பௌர்ணமி', 'Eclipse season': 'கிரகண காலம்',
    'Mercury afflicted by Mars, Saturn, Rahu or Ketu': 'புதன் செவ்வாய், சனி, ராகு, கேதுவால் பாதிப்பு', 'Mercury afflicted by a hard planet': 'புதன் கடின கிரகத்தால் பாதிப்பு', 'Mercury burnt near the Sun': 'புதன் அஸ்தங்கம்',
    'Mars–Saturn hard aspect': 'செவ்வாய்–சனி கடின பார்வை', 'Mars with Rahu or Ketu': 'செவ்வாய் ராகு / கேதுவுடன்', 'Two or more hard planets in air signs': 'இரு அல்லது மேற்பட்ட கடின கிரகங்கள் காற்று ராசிகளில்',
    // Mundane Astrology: astrocartography study
    'With exact time': 'சரியான நேரத்துடன்', 'Rule-score level (50% = chance)': 'விதி மதிப்பெண் நிலை (50% = தற்செயல்)', 'Hard-planet line within 2° of the site': 'இடத்துக்கு 2°க்குள் கடின கிரகக் கோடு',
    'Strongest single pattern (chance of such a result)': 'வலுவான தனி அமைப்பு (இப்படி வர வாய்ப்பு)', 'Nearest hard-planet line': 'அருகிலுள்ள கடின கிரகக் கோடு', 'Patterns present': 'உள்ள அமைப்புகள்', '(day only)': '(நாள் மட்டும்)',
    'Aircraft accident': 'விமான விபத்து', 'Earthquake': 'நில அதிர்வு', 'Flood': 'வெள்ளம்', 'Leader death': 'தலைவர் மரணம்', 'Market shock': 'சந்தை அதிர்ச்சி', 'Mass casualty': 'பெருமளவு உயிரிழப்பு', 'Political violence': 'அரசியல் வன்முறை', 'All': 'எல்லாம்',
    'Flood and heavy rain': 'வெள்ளம், கனமழை', 'Cyclone and storm': 'புயல்', 'Political violence and unrest': 'அரசியல் வன்முறை, கலகம்', 'Market shock (stock exchanges)': 'சந்தை அதிர்ச்சி (பங்குச் சந்தைகள்)',
    'Death of a senior leader (place and date only)': 'மூத்த தலைவரின் மரணம் (இடம், தேதி மட்டும்)', 'Industrial or transport accident': 'தொழிற்சாலை, போக்குவரத்து விபத்து',
    'Moment at the place (local, hh:mm:ss)': 'அந்த இடத்தின் தருணம் (உள்ளூர், hh:mm:ss)', 'Place (latitude, longitude)': 'இடம் (அட்சரேகை, தீர்க்கரேகை)', 'Planet lines over the place': 'இடத்தின் மேல் கிரகக் கோடுகள்',
    'Time zone (hours from UTC)': 'நேர மண்டலம் (UTC இலிருந்து மணிகள்)',
    // Horary Answers: winning muhurtham
    'What will you do': 'என்ன செய்யப் போகிறீர்கள்', 'Pick one stage at a time': 'ஒரு நிலையை மட்டும் தேர்ந்தெடுங்கள்', 'From date': 'தொடக்கத் தேதி', 'To date': 'முடிவுத் தேதி', 'Up to 15 days': '15 நாட்கள் வரை',
    'Earliest time of day': 'நாளின் தொடக்க நேரம்', 'Latest time of day': 'நாளின் கடைசி நேரம்', 'For example when the exam starts': 'உதாரணம்: தேர்வு தொடங்கும் நேரம்',
    'Day': 'நாள்', 'Window': 'சாளரம்', 'Min': 'நிமி', 'Lagna lords': 'லக்ன அதிபதிகள்', 'Ruling planets': 'ஆளும் கிரகங்கள்',
    'Alarm before the window': 'சாளரத்துக்கு முன் அலாரம்', 'Gives you time to get ready': 'தயாராக நேரம் தரும்', 'Exact start: 2 melodies (+1 melody 2 min before)': 'சரியான தொடக்கம்: 2 இசைகள் (+1 இசை 2 நிமிடம் முன்)',
    // Practical Electional Muhurtham: Method and KP question rules
    'Western books, or the KP question rules': 'மேற்கத்திய நூல்கள், அல்லது KP கேள்வி விதிகள்', 'Western classical': 'மேற்கத்திய செவ்வியல்', 'KP question rules (sub-lord method)': 'KP கேள்வி விதிகள் (உப அதிபதி முறை)',
    'Rule strictness': 'விதிக் கடுமை', 'Strict also keeps 8 and 12 away': 'கடுமை முறை 8, 12-ஐயும் விலக்கும்', 'Strict (8 and 12 kept out)': 'கடுமை (8, 12 விலக்கி)', 'Standard (book rule only)': 'வழக்கம் (நூல் விதி மட்டும்)',
    'Shortest window': 'குறைந்தபட்ச சாளரம்', 'Any': 'ஏதேனும்', '1 minute': '1 நிமிடம்', '3 minutes': '3 நிமிடங்கள்', '6 minutes': '6 நிமிடங்கள்', '10 minutes': '10 நிமிடங்கள்', '20 minutes': '20 நிமிடங்கள்',
    'Sort by': 'வரிசை', 'Best confidence': 'நம்பிக்கை வரிசை', 'Date & time': 'தேதி, நேரம்', 'Show Details': 'விவரங்களைக் காட்டு', 'Hide Details': 'விவரங்களை மறை',
    'Rules are from the KP question method; results are tendencies, not guarantees. Touch a window for its star-lord totals.': 'விதிகள் KP கேள்வி முறையிலிருந்து; முடிவுகள் போக்குகளே, உத்தரவாதம் அல்ல. நட்சத்திர அதிபதியின் மொத்த நேரத்துக்கு ஒரு சாளரத்தைத் தொடுங்கள்.',
    'Alarm OFF. Tap to switch it on. Press and hold to choose what it is for.': 'அலாரம் அணைந்துள்ளது. இயக்கத் தட்டுங்கள். எதற்காக என்பதைத் தேர்ந்தெடுக்க அழுத்திப் பிடியுங்கள்.',
    'Alarm ON. Tap to switch it off. Press and hold to change what it is for.': 'அலாரம் இயங்குகிறது. அணைக்கத் தட்டுங்கள். எதற்காக என்பதை மாற்ற அழுத்திப் பிடியுங்கள்.',
    // Birth Chart: print options
    'Font size': 'எழுத்து அளவு', 'Font style': 'எழுத்து வடிவம்', 'App default': 'செயலியின் இயல்பு', 'Clean sans': 'எளிய சான்ஸ்', 'Serif': 'செரிஃப்', 'Monospace': 'ஒற்றை அகலம்', 'Rounded': 'வட்ட வடிவம்', 'Humanist': 'ஹியூமனிஸ்ட்', 'Handwriting': 'கையெழுத்து', 'Classic book': 'பழைய நூல் வடிவம்',
    'For printing or PDF': 'அச்சு அல்லது PDFக்கு', 'Narrow 6 mm': 'குறுகிய 6 மிமீ', 'Normal 11 mm': 'வழக்கம் 11 மிமீ', 'Wide 16 mm': 'அகலம் 16 மிமீ', 'Extra wide 22 mm': 'மிக அகலம் 22 மிமீ', 'Fit to page width': 'பக்க அகலத்துக்குப் பொருத்து',
    'Print or save as PDF button': 'அச்சிடு / PDF சேமி பொத்தான்', 'Everything': 'எல்லாம்', 'Charts and predictions': 'சக்கரங்கள், பலன்கள்', 'Predictions only': 'பலன்கள் மட்டும்', 'New page for each section': 'ஒவ்வொரு பகுதிக்கும் புதிய பக்கம்', 'Continuous': 'தொடர்ச்சி',
    // Birth Chart: predictions and Moon windows
    'Matter': 'விஷயம்', 'Promise / risk': 'உறுதி / அபாயம்', 'Next supportive (or care) period': 'அடுத்த சாதக (அல்லது கவன) காலம்', 'Year': 'ஆண்டு', 'Dasha / bhukti': 'தசை / புக்தி',
    'Matters that are supported': 'ஆதரவு பெறும் விஷயங்கள்', 'Take extra care': 'கூடுதல் கவனம்', 'Star / sub': 'நட்சத்திரம் / உப', 'Natal house': 'ஜாதக பாவம்', 'Star lord gives': 'நட்சத்திர அதிபதி தருவது',
    'Answer': 'விடை', 'Best period (dasha / bhukti, transit month)': 'சிறந்த காலம் (தசை / புக்தி, கோசார மாதம்)', 'Profit': 'லாபம்', 'Best months': 'சிறந்த மாதங்கள்',
    'Weak / delayed': 'பலவீனம் / தாமதம்', 'Mixed': 'கலவை', 'Promised': 'உறுதி', 'Strongly promised': 'வலுவான உறுதி', 'Low risk': 'குறைந்த அபாயம்', 'Some risk': 'சிறு அபாயம்', 'Elevated risk': 'கூடுதல் அபாயம்', 'High risk': 'அதிக அபாயம்',
    'e.g. apply for a job, visa or exam': 'உதா.: வேலை, விசா அல்லது தேர்வு விண்ணப்பம்', 'Time zone for the times': 'நேரங்களுக்கான நேர மண்டலம்', 'Up to 31 days': '31 நாட்கள் வரை',
    'No Excellent or Good window in these dates. Try other dates.': 'இந்த நாட்களில் சிறப்பு அல்லது நல்ல சாளரம் இல்லை. வேறு தேதிகளை முயலுங்கள்.', 'Set alarms for the earliest 30 windows': 'முதல் 30 சாளரங்களுக்கு அலாரம் அமை',
    // Lost & Found: horary number
    'Horary number (optional)': 'ஹோரரி எண் (விருப்பம்)', '1 to 249; leave empty to use the time now': '1 முதல் 249; இப்போதைய நேரத்துக்கு வெறுமையாக விடுங்கள்',
    // Birth Chart predictions: the 120 matters, as the engine names them in Tamil
    'Good health and vitality': 'நல்ல ஆரோக்கியம், உயிர்ச்சக்தி', 'Recovery from illness': 'நோய் குணமாகுதல்', 'Control of a long-term illness': 'நீண்டகால நோய் கட்டுப்பாடு',
    'Fame and public recognition': 'புகழ், பொது அங்கீகாரம்', 'Success of your own efforts': 'சுய முயற்சியின் வெற்றி', 'Leadership and authority': 'தலைமை, அதிகாரம்',
    'Peace of mind and confidence': 'மன அமைதி, தன்னம்பிக்கை', 'Spiritual life and inner change': 'ஆன்மிக வாழ்வு, உள் மாற்றம்', 'Safety from danger and mishaps': 'ஆபத்து, விபத்திலிருந்து பாதுகாப்பு',
    'A fresh start or change of lifestyle': 'புதிய தொடக்கம் / வாழ்க்கை மாற்றம்', 'Steady earnings and savings': 'நிலையான வருமானம், சேமிப்பு', 'Bank balance and deposits': 'வங்கி இருப்பு, வைப்புத் தொகை',
    'Gold, jewels and ornaments': 'தங்கம், நகை, ஆபரணம்', 'Family harmony and growth': 'குடும்ப ஒற்றுமை, வளர்ச்சி', 'Success through speech and voice': 'பேச்சு, குரல் மூலம் வெற்றி',
    'Eye trouble': 'கண் பிரச்சினை', 'Loss of money or savings': 'பணம் / சேமிப்பு இழப்பு', 'Wealth through family support': 'குடும்பம் மூலம் செல்வம்',
    'Separation from family': 'குடும்பப் பிரிவு', 'Extra income from side sources': 'பக்க வருமானம்', 'Support and happiness through siblings': 'சகோதர ஆதரவு, மகிழ்ச்சி',
    'Short journeys and local travel': 'குறுகிய, உள்ளூர்ப் பயணம்', 'Communication, writing and media': 'தகவல் தொடர்பு, எழுத்து, ஊடகம்', 'Successful negotiation': 'வெற்றிகரமான பேச்சுவார்த்தை',
    'Signing contracts and agreements': 'ஒப்பந்தம் கையெழுத்து', 'Courage to start and compete': 'தொடங்கும், போட்டியிடும் துணிவு', 'Success in interviews': 'நேர்முகத் தேர்வு வெற்றி',
    'Good news and letters': 'நல்ல செய்தி, கடிதம்', 'Publishing a book or creative writing': 'நூல் வெளியீடு / படைப்பு எழுத்து', 'Sales, marketing and brokerage': 'விற்பனை, சந்தைப்படுத்தல், தரகு',
    'Buying a house': 'வீடு வாங்குதல்', 'Buying land or a plot': 'நிலம் / மனை வாங்குதல்', 'Constructing a house': 'வீடு கட்டுதல்',
    'Buying a vehicle': 'வாகனம் வாங்குதல்', 'Comforts, furniture and appliances': 'சுகம், தளவாடம், உபகரணம்', 'Mother’s support and wellbeing': 'தாயின் ஆதரவு, நலம்',
    'Peace and harmony at home': 'வீட்டில் அமைதி, இணக்கம்', 'Change of residence': 'குடியிருப்பு மாற்றம்', 'School and college studies': 'பள்ளி / கல்லூரிப் படிப்பு',
    'Selling property': 'சொத்து விற்பனை', 'Child birth': 'குழந்தை பாக்கியம்', 'Child’s health and progress': 'குழந்தையின் நலம், முன்னேற்றம்',
    'A love affair turning into marriage': 'காதல் திருமணமாக மாறுதல்', 'Romance and love luck': 'காதல் அதிர்ஷ்டம்', 'Intelligence and creative success': 'புத்திக்கூர்மை, படைப்பு வெற்றி',
    'Worship, mantra and devotion': 'வழிபாடு, மந்திரம், பக்தி', 'Music, arts and performing success': 'இசை, கலை, நிகழ்த்து வெற்றி', 'Gains in speculation and shares': 'ஊகம், பங்குகளில் லாபம்',
    'Lottery and prize money': 'லாட்டரி, பரிசுப் பணம்', 'Success in sports and games': 'விளையாட்டில் வெற்றி', 'Getting a job': 'வேலை கிடைத்தல்',
    'Promotion and salary rise': 'பதவி / சம்பள உயர்வு', 'Success in competitive exams': 'போட்டித் தேர்வு வெற்றி', 'Getting a loan': 'கடன் கிடைத்தல்',
    'Victory over enemies and rivals': 'பகைவர், போட்டியாளரை வெல்லுதல்', 'Success in litigation': 'வழக்கில் வெற்றி', 'A government or secure job': 'அரசு / பாதுகாப்பான வேலை',
    'Illness and medical trouble': 'நோய், மருத்துவச் சிக்கல்', 'Getting a tenant or letting property': 'வாடகைதாரர் / வாடகைக்கு விடுதல்', 'Reliable employees and helpers': 'நம்பகமான பணியாளர், உதவியாளர்',
    'Marriage': 'திருமணம்', 'Engagement and match-finding': 'நிச்சயதார்த்தம், வரன் அமைதல்', 'Harmonious married life': 'இணக்கமான திருமண வாழ்வு',
    'Separation or divorce risk': 'பிரிவு / விவாகரத்து அபாயம்', 'Reunion after a separation': 'பிரிவுக்குப் பின் சேர்தல்', 'Spouse from abroad or far away': 'வெளிநாட்டு / தொலைவு வாழ்க்கைத் துணை',
    'Second marriage': 'மறுமணம்', 'Business partnership': 'கூட்டுத் தொழில்', 'Success in public dealings': 'பொதுமக்கள் தொடர்பில் வெற்றி',
    'Gain through customers and clients': 'வாடிக்கையாளர் மூலம் லாபம்', 'Inheritance and ancestral property': 'பூர்வீகச் சொத்து, வாரிசு', 'Insurance, gratuity and claims': 'காப்பீடு, பணிக்கொடை, உரிமைத் தொகை',
    'Sudden or unexpected gains': 'திடீர் / எதிர்பாராத லாபம்', 'Wealth through the spouse': 'துணை மூலம் செல்வம்', 'Accident risk': 'விபத்து அபாயம்',
    'Surgery risk': 'அறுவை சிகிச்சை அபாயம்', 'Long illness or prolonged treatment': 'நீண்ட நோய் / நீடித்த சிகிச்சை', 'Occult, research and hidden knowledge': 'மறைபொருள், ஆராய்ச்சி',
    'Sudden setbacks and obstacles': 'திடீர் தடை, பின்னடைவு', 'Heavy borrowing and debts': 'அதிகக் கடன்', 'Higher education': 'உயர் கல்வி',
    'Doctorate and further studies': 'முனைவர் பட்டம் / மேல்படிப்பு', 'Success in research': 'ஆராய்ச்சியில் வெற்றி', 'Good luck and fortune': 'நல்ல அதிர்ஷ்டம், பாக்கியம்',
    'Father’s support and wellbeing': 'தந்தையின் ஆதரவு, நலம்', 'Pilgrimage and holy journeys': 'புனிதப் பயணம், யாத்திரை', 'A guru and spiritual guidance': 'குரு, ஆன்மிக வழிகாட்டல்',
    'Becoming a teacher, scholar or adviser': 'ஆசிரியர், அறிஞர், ஆலோசகர் ஆதல்', 'Publishing technical or research work': 'தொழில்நுட்ப / ஆய்வு நூல் வெளியீடு', 'Charity and religious work': 'தர்மம், சமயப் பணி',
    'Starting your own business': 'சொந்தத் தொழில் தொடங்குதல்', 'Profit in business': 'தொழில் லாபம்', 'Share-market business': 'பங்குச் சந்தைத் தொழில்',
    'Job and business together': 'வேலை, தொழில் இரண்டும்', 'Import and export business': 'இறக்குமதி, ஏற்றுமதித் தொழில்', 'Awards and professional recognition': 'விருது, தொழில் அங்கீகாரம்',
    'Change of job': 'வேலை மாற்றம்', 'Transfer of place': 'இடமாற்றம்', 'Loss of job or suspension': 'வேலை இழப்பு / இடைநீக்கம்',
    'Politics and public life': 'அரசியல் / பொது வாழ்வு', 'High income and wealth': 'உயர் வருமானம், செல்வம்', 'Fulfilment of desires and goals': 'ஆசை, இலக்கு நிறைவேறல்',
    'Helpful friends and network': 'உதவும் நண்பர்கள், தொடர்பு வட்டம்', 'Support of elders and elder siblings': 'மூத்தோர், மூத்த சகோதர ஆதரவு', 'Recovery of lost money or property': 'இழந்த பணம் / சொத்து மீட்பு',
    'Winning elections and competitions': 'தேர்தல், போட்டியில் வெற்றி', 'Profit from investments': 'முதலீட்டில் லாபம்', 'Scholarship and financial aid': 'உதவித்தொகை, நிதி உதவி',
    'Income from several sources': 'பல வழிகளில் வருமானம்', 'Success of an organisation or team': 'நிறுவனம் / குழு வெற்றி', 'Going abroad': 'வெளிநாடு செல்லுதல்',
    'Visa, passport and permit success': 'விசா, பாஸ்போர்ட், அனுமதி வெற்றி', 'Settling abroad (PR or citizenship)': 'வெளிநாட்டில் குடியேற்றம்', 'Study abroad': 'வெளிநாட்டுக் கல்வி',
    'Job or posting abroad': 'வெளிநாட்டு வேலை / பணி', 'Earning abroad': 'வெளிநாட்டு வருமானம்', 'Returning to the home country': 'தாயகம் திரும்புதல்',
    'Hospital stay': 'மருத்துவமனையில் சேர்தல்', 'Heavy expenses and losses': 'அதிகச் செலவு, இழப்பு', 'Becoming free of debt': 'கடன் தீருதல்',

    // Engine: short help lines and table cells (whole text nodes)
    'Kaushik; off follows Khullar and Bosmia': 'Kaushik முறை; அணைத்தால் Khullar, Bosmia முறை',
    'Daily: up to 120 days · intraday: up to 7': 'தினசரி: 120 நாட்கள் வரை · நாளுக்குள்: 7 நாட்கள் வரை',
    'When this box has prices, the From and To dates are ignored and the candles are for these days.': 'இந்தப் பெட்டியில் விலைகள் இருந்தால், தொடக்க, முடிவுத் தேதிகள் புறக்கணிக்கப்பட்டு, இந்த நாட்களுக்கான மெழுகுவர்த்திகள் காட்டப்படும்.',
    'Bars: bias per candle (stronger colour = more rules agree) · line: running index from 100': 'பட்டைகள்: ஒவ்வொரு மெழுகுவர்த்தியின் போக்கு (அடர்ந்த நிறம் = அதிக விதிகள் ஒப்புகின்றன) · கோடு: 100 இலிருந்து தொடரும் குறியீடு',
    'Condition at the purchase time': 'வாங்கிய நேரத்தின் நிபந்தனை',
    'Cusp sub lords: 2nd, 5th, 6th, 8th, 11th and the houses each signifies': 'பாவ முனை உப அதிபதிகள்: 2, 5, 6, 8, 11 மற்றும் ஒவ்வொன்றும் குறிக்கும் பாவங்கள்',
    'Ascendant sub lord signifies the 11th with the 2nd, 5th, 6th or 8th': 'லக்ன உப அதிபதி 2, 5, 6 அல்லது 8-உடன் 11-ஐக் குறிக்கிறார்',
    '2nd cusp sub lord signifies the 11th with the 2nd, 5th, 6th or 8th': '2-ஆம் பாவ முனை உப அதிபதி 2, 5, 6 அல்லது 8-உடன் 11-ஐக் குறிக்கிறார்',
    'Moon’s star lord signifies the 11th with the 2nd, 5th, 6th or 8th': 'சந்திரனின் நட்சத்திர அதிபதி 2, 5, 6 அல்லது 8-உடன் 11-ஐக் குறிக்கிறார்',
    'Ascendant sub lord signifies the 11th': 'லக்ன உப அதிபதி 11-ஐக் குறிக்கிறார்',
    '2nd cusp sub lord signifies the 11th': '2-ஆம் பாவ முனை உப அதிபதி 11-ஐக் குறிக்கிறார்',
    '5th cusp sub lord: 11th with 2nd, 5th, 6th or 8th': '5-ஆம் பாவ முனை உப அதிபதி: 2, 5, 6 அல்லது 8-உடன் 11',
    '11th cusp sub lord: 11th with 2nd, 5th, 6th or 8th': '11-ஆம் பாவ முனை உப அதிபதி: 2, 5, 6 அல்லது 8-உடன் 11',
    '6th cusp sub lord: 11th with 2nd, 5th, 6th or 8th': '6-ஆம் பாவ முனை உப அதிபதி: 2, 5, 6 அல்லது 8-உடன் 11',
    '8th cusp sub lord: 11th with 2nd, 5th, 6th or 8th': '8-ஆம் பாவ முனை உப அதிபதி: 2, 5, 6 அல்லது 8-உடன் 11',
    'Ascendant star lord: 11th with 2nd, 5th, 6th or 8th': 'லக்ன நட்சத்திர அதிபதி: 2, 5, 6 அல்லது 8-உடன் 11',
    'Ascendant lord: 11th with 2nd, 5th, 6th or 8th': 'லக்னாதிபதி: 2, 5, 6 அல்லது 8-உடன் 11',
    'Ascendant sub lord signifies the 12th without the 11th (loss)': 'லக்ன உப அதிபதி 11 இல்லாமல் 12-ஐக் குறிக்கிறார் (நஷ்டம்)',
    'Ascendant star lord signifies the 12th without the 11th (loss)': 'லக்ன நட்சத்திர அதிபதி 11 இல்லாமல் 12-ஐக் குறிக்கிறார் (நஷ்டம்)',
    'Ascendant sub lord retrograde': 'லக்ன உப அதிபதி வக்கிரம்',
    'Position · lord/star/sub': 'நிலை · ராசி/நட்சத்திர/உப அதிபதி', 'House (cusp)': 'பாவம் (பாவ முனை)', 'Cusp': 'பாவ முனை',
    'Sub lord signifies': 'உப அதிபதி குறிப்பவை', 'Rule': 'விதி',
  };

  /* ---------- Tamil patterns for text that carries values ---------- */
  var TA_DAY = { Sun: 'ஞாயிறு', Mon: 'திங்கள்', Tue: 'செவ்வாய்', Wed: 'புதன்', Thu: 'வியாழன்', Fri: 'வெள்ளி', Sat: 'சனி' };
  var TA_MON = { Jan: 'ஜன', Feb: 'பிப்', Mar: 'மார்', Apr: 'ஏப்', May: 'மே', Jun: 'ஜூன்', Jul: 'ஜூலை', Aug: 'ஆக', Sep: 'செப்', Oct: 'அக்', Nov: 'நவ', Dec: 'டிச' };
  var PLANET = 'Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu';
  // Sign names as they read before "லக்னம்" (கும்ப லக்னம், not கும்பம் லக்னம்)
  var TA_LAGNA = { Aries: 'மேஷ', Taurus: 'ரிஷப', Gemini: 'மிதுன', Cancer: 'கடக', Leo: 'சிம்ம', Virgo: 'கன்னி', Libra: 'துலா',
    Scorpio: 'விருச்சிக', Sagittarius: 'தனுசு', Capricorn: 'மகர', Aquarius: 'கும்ப', Pisces: 'மீன' };
  function dur(s) { return s.replace(/(\d+)h/g, '$1ம').replace(/(\d+)m/g, '$1நி').replace(/(\d+)s/g, '$1வி'); }
  var CHAIN = '(?:' + PLANET + ')(?:/(?:' + PLANET + '))+';
  var SIGN_RX = /^(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)$/;
  var GRADE = { Fair: 'சுமார்', Good: 'நல்லது', 'Very good': 'மிக நல்லது', Excellent: 'மிகச் சிறந்தது', Neutral: 'நடுநிலை' };
  var ANGLE = { rising: 'உதயத்தில்', culminating: 'உச்சத்தில்', setting: 'அஸ்தமனத்தில்', 'at the lowest point': 'பாதாளத்தில்' };
  var TA_DAYL = { Sunday: 'ஞாயிறு', Monday: 'திங்கள்', Tuesday: 'செவ்வாய்', Wednesday: 'புதன்', Thursday: 'வியாழன்', Friday: 'வெள்ளி', Saturday: 'சனி' };
  var WORDS = { none: 'இல்லை', Sept: 'செப்' };
  var TOKEN = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|Sun|Mon|Tue|Wed|Thu|Fri|Sat|Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|none)\b/g;
  function chain(x) { return x.split('/').map(function (p) { return TA[p] || p; }).join('/'); }
  // Tamil for a text whose only English words are month and weekday names (and "none"); null when other English remains.
  function datesOnly(s) {
    if (/[A-Za-z]/.test(s.replace(TOKEN, '').replace(/\b(UTC|IST|GMT)\b/g, ''))) return null;
    return s.replace(TOKEN, function (w) { return TA_MON[w] || TA_DAY[w] || TA_DAYL[w] || WORDS[w] || w; });
  }
  var TA_RX = [
    // Mobile Numerology's header line: "Meena · 1990-06-15 · Age 36"
    [/^(.+) · (\d{4}-\d{2}-\d{2}) · Age (\d+)$/, function (m) { return m[1] + ' · ' + m[2] + ' · வயது ' + m[3]; }],
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
    [/^[^஀-௿]*[A-Za-z][^஀-௿]* · ((?:\d+-)?[஀-௿][\s\S]*)$/, function (m) { return m[1]; }],
    // "பணம் (வரவு) · houses 2, 6, 11"
    [/^(.*?)\s*· houses ([\d, ]+)$/, function (m) { return m[1] + ' · பாவங்கள் ' + m[2]; }],
    [/^(\d+)(st|nd|rd|th) lord$/, function (m) { return m[1] + '-ஆம் அதிபதி'; }],
    [/^(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})(.*)$/, function (m) {
      var rest = m[4];
      if (/[A-Za-z]/.test(rest)) { var core = rest.replace(/^\s*·\s*/, ''), t = translate(core, 'ta'); if (!t) return null; rest = rest.slice(0, rest.indexOf(core)) + t; }
      return m[1] + ' ' + TA_MON[m[2]] + ' ' + m[3] + rest; }],
    [/^(Rules|விதிகள்) \(a timing is listed only if every ticked rule is met\)$/, function () { return 'விதிகள் (தேர்ந்த எல்லா விதிகளும் பொருந்தும் நேரம் மட்டுமே பட்டியலிடப்படும்)'; }],
    [/^Time zone now: (.+)$/, function (m) { return 'இப்போதைய நேர மண்டலம்: ' + m[1]; }],
    [/^Using the place you chose \(or your saved place\)\. Time zone now: (.+)$/, function (m) { return 'நீங்கள் தேர்ந்தெடுத்த (அல்லது சேமித்த) இடம் பயன்படுத்தப்படுகிறது. இப்போதைய நேர மண்டலம்: ' + m[1]; }],
    [/^Place set: (.+)\. Latitude, longitude and UTC offset were filled in\. Tap Show timings\.$/, function (m) { return 'இடம் அமைக்கப்பட்டது: ' + m[1] + '. அட்சரேகை, தீர்க்கரேகை, UTC வேறுபாடு நிரப்பப்பட்டன. நேரங்களைக் காட்டு என்பதைத் தட்டுங்கள்.'; }],
    [/^Place: entered coordinates · UTC offset at birth: (.+)$/, function (m) { return 'இடம்: உள்ளிட்ட ஆயத்தொலைவுகள் · பிறந்த நேர UTC வேறுபாடு: ' + m[1]; }],
    // cusp sub lords in the ticket table: "5: Mercury [2,3,4,10,11,12]"
    [new RegExp('^(\\d{1,2}): (' + PLANET + ') (\\[[\\d,]+\\])$'), function (m) { return m[1] + ': ' + TA[m[2]] + ' ' + m[3]; }],
    [new RegExp('^(' + PLANET + ') \\(R\\)$'), function (m) { return TA[m[1]] + ' (வ)'; }],
    [/^Trade (\d+): (\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}), ([\d:]+) IST · (.+)$/, function (m) { return 'வர்த்தகம் ' + m[1] + ': ' + m[2] + ' ' + TA_MON[m[3]] + ' ' + m[4] + ', ' + m[5] + ' IST · ' + m[6]; }],
    [/^💰 Money profit (A\+B|A|B) · 2·11 cusp-lord link( ✓)?$/, function (m) { return '💰 பண லாபம் ' + m[1] + ' · 2·11 பாவ முனை அதிபதித் தொடர்பு' + (m[2] || ''); }],
    // "Aquarius 18°51′ · Saturn/Rahu/Moon ·"
    [new RegExp('^(\\w+) ([\\d°′″]+) · ((?:' + PLANET + ')(?:/(?:' + PLANET + '))*)( ·)?$'), function (m) {
      return TA[m[1]] ? TA[m[1]] + ' ' + m[2] + ' · ' + m[3].split('/').map(function (x) { return TA[x]; }).join('/') + (m[4] || '') : null; }],

    /* ---- Engine 10.5: additions inside older tools ---- */
    // Chains and grades in result tables: "Capricorn Saturn/Mars/Rahu", "Libra 22°48′23″", "3/3 Excellent", "Good (1)", "Moon · Venus/Mars"
    [new RegExp('^(\\w+) (' + CHAIN + ')$'), function (m) { return TA[m[1]] && SIGN_RX.test(m[1]) ? TA[m[1]] + ' ' + chain(m[2]) : null; }],
    [/^(\w+) ([\d°′″]+)$/, function (m) { return TA[m[1]] && SIGN_RX.test(m[1]) ? TA[m[1]] + ' ' + m[2] : null; }],
    [/^(\d)\/(\d) (Fair|Good|Very good|Excellent)$/, function (m) { return m[1] + '/' + m[2] + ' ' + GRADE[m[3]]; }],
    [/^(Good|Fair|Neutral) \((\d+)\)$/, function (m) { return GRADE[m[1]] + ' (' + m[2] + ')'; }],
    [new RegExp('^Moon · (' + CHAIN + ')$'), function (m) { return 'சந்திரன் · ' + chain(m[1]); }],
    [/^ruling planets (\d)\/(\d)$/, function (m) { return 'ஆளும் கிரகங்கள் ' + m[1] + '/' + m[2]; }],
    // Timing rows: "Ketu star lord", "· Mula · 08:09:47 – 09:07:37 · total", "lasts 5m 37s", "Venus star lord total: 10:00:00 – 10:40:00 (40m 0s)"
    [new RegExp('^(' + PLANET + ') star lord$'), function (m) { return TA[m[1]] + ' நட்சத்திர அதிபதி'; }],
    [/^· ([A-Za-z ]+) · ([\d:]+) – ([\d:]+) · total$/, function (m) { return TA[m[1]] ? '· ' + TA[m[1]] + ' · ' + m[2] + ' – ' + m[3] + ' · மொத்தம்' : null; }],
    [/^lasts ((?:\d+h )?(?:\d+m )?\d+s|(?:\d+h )?\d+m|\d+h)$/, function (m) { return dur(m[1]) + ' நீடிக்கும்'; }],
    [new RegExp('^(' + PLANET + ') star lord total: ([\\d:]+) – ([\\d:]+) \\(([\\dhms ]+)\\)$'), function (m) { return TA[m[1]] + ' நட்சத்திர அதிபதி மொத்தம்: ' + m[2] + ' – ' + m[3] + ' (' + dur(m[4]) + ')'; }],
    // "20 Nov 2026 · Sagittarius ascendant · Jupiter/Ketu/Saturn", with any date or time before it
    [new RegExp('^(.*?)(\\w+) ascendant · (' + CHAIN + ')$'), function (m) {
      if (!TA_LAGNA[m[2]]) return null; var pre = m[1] ? datesOnly(m[1]) : '';
      return pre == null ? null : pre + TA_LAGNA[m[2]] + ' லக்னம் · ' + chain(m[3]); }],
    [/^(.+)\. Press Enter for details\.$/, function (m) { var t = translate(m[1], 'ta') || datesOnly(m[1]); return t == null ? null : t + '. விவரங்களுக்கு Enter அழுத்துங்கள்.'; }],
    // KP question rules (Practical Electional Muhurtham)
    [/^· KP question rules · (\S+) to (\S+) · (\d+) window\(s\)$/, function (m) { return '· KP கேள்வி விதிகள் · ' + m[1] + ' முதல் ' + m[2] + ' வரை · ' + m[3] + ' சாளரம்(கள்)'; }],
    [/^(\d+) window\(s\)\. Excellent (\d+) · Very good (\d+) · Good (\d+) · Fair (\d+)\. Times are local to the place\.$/,
      function (m) { return m[1] + ' சாளரம்(கள்). மிகச் சிறந்தது ' + m[2] + ' · மிக நல்லது ' + m[3] + ' · நல்லது ' + m[4] + ' · சுமார் ' + m[5] + '. நேரங்கள் அந்த இடத்தின் உள்ளூர் நேரம்.'; }],
    [new RegExp('^(\\d+)(?:st|nd|rd|th) cusp star/sub: (' + PLANET + ')/(' + PLANET + ') · 11th cusp star/sub: (' + PLANET + ')/(' + PLANET + ') · (\\d+)(?:st|nd|rd|th) lord (' + PLANET + '), 11th lord (' + PLANET + ') \\(checked at the middle of the window\\)$'),
      function (m) { return m[1] + '-ஆம் பாவ முனை நட்சத்திர/உப அதிபதி: ' + TA[m[2]] + '/' + TA[m[3]] + ' · 11-ஆம் பாவ முனை நட்சத்திர/உப அதிபதி: ' + TA[m[4]] + '/' + TA[m[5]] + ' · ' + m[6] + '-ஆம் அதிபதி ' + TA[m[7]] + ', 11-ஆம் அதிபதி ' + TA[m[8]] + ' (சாளரத்தின் நடுவில் சோதித்தது)'; }],
    [/^Ruling planets now: (.+?) · lagna (✔|✘) (\d+)(?:st|nd|rd|th) (✔|✘)(?: 11th (✔|✘))?$/, function (m) {
      return 'இப்போதைய ஆளும் கிரகங்கள்: ' + m[1].split(', ').map(function (x) { return TA[x] || x; }).join(', ') + ' · லக்னம் ' + m[2] + ' · ' + m[3] + '-ஆம் ' + m[4] + (m[5] ? ' · 11-ஆம் ' + m[5] : ''); }],
    [/^(\d+) alarms? set\. Stop each one with Success\.(?: (\d+) could not be set\.)?$/, function (m) { return m[1] + ' அலாரம் அமைக்கப்பட்டது. ஒவ்வொன்றையும் Success என்று நிறுத்துங்கள்.' + (m[2] ? ' ' + m[2] + ' அமைக்க முடியவில்லை.' : ''); }],
    // Birth Chart: Moon windows
    [/^(\d+) windows · Excellent (\d+) · Good (\d+)$/, function (m) { return m[1] + ' சாளரங்கள் · சிறப்பு ' + m[2] + ' · நல்லது ' + m[3]; }],
    [/^Checking day (\d+) of (\d+)…$/, function (m) { return 'நாள் ' + m[1] + ' / ' + m[2] + ' சோதிக்கப்படுகிறது…'; }],
    [/^Reading the sky for (\d+) days…$/, function (m) { return m[1] + ' நாட்களின் வானம் படிக்கப்படுகிறது…'; }],
    // Mundane Astrology: aircraft and astrocartography studies
    [new RegExp('^Mercury \\(air travel\\) (joined by|opposed by|squared by) (' + PLANET + ')$'), function (m) { return 'புதன் (வான்வழி) ' + TA[m[2]] + ' ' + { 'joined by': 'உடன் இணைவு', 'opposed by': 'எதிர்ப் பார்வை', 'squared by': 'சதுரப் பார்வை' }[m[1]]; }],
    [/^Mercury burnt up near the Sun \(([\d.]+)°\)$/, function (m) { return 'புதன் சூரியனுக்கு அருகில் அஸ்தங்கம் (' + m[1] + '°)'; }],
    [/^Mars joined with (Rahu|Ketu)$/, function (m) { return 'செவ்வாய் ' + TA[m[1]] + ' உடன் இணைவு'; }],
    [/^(\d) hard planets in air signs \(Gemini, Libra, Aquarius\)$/, function (m) { return m[1] + ' கடின கிரகங்கள் காற்று ராசிகளில் (மிதுனம், துலாம், கும்பம்)'; }],
    [/^Mars and Saturn (squared|opposed|joined)$/, function (m) { return 'செவ்வாய்–சனி ' + { squared: 'சதுரப் பார்வை', opposed: 'எதிர்ப் பார்வை', joined: 'இணைவு' }[m[1]]; }],
    // "Rahu setting, Ketu rising" and "Mars culminating · Saturn rising"
    [new RegExp('^(' + PLANET + ') (rising|culminating|setting|at the lowest point)((?:, | · )(?:' + PLANET + ') (?:rising|culminating|setting|at the lowest point))*$'), function (m) {
      return m[0].replace(new RegExp('(' + PLANET + ') (rising|culminating|setting|at the lowest point)', 'g'), function (x, p, a) { return TA[p] + ' ' + ANGLE[a]; }); }],
    // "Mars Sagittarius · Saturn Taurus · Rahu Gemini"
    [new RegExp('^(' + PLANET + ') (\\w+)(?: · (?:' + PLANET + ') \\w+)*$'), function (m) {
      var ok = true, r = m[0].split(' · ').map(function (x) { var y = x.split(' '); if (!TA[y[0]] || !TA[y[1]] || !SIGN_RX.test(y[1])) ok = false; return TA[y[0]] + ' ' + TA[y[1]]; });
      return ok ? r.join(' · ') : null; }],
    [/^(\d+) of (\d+) \(([\d.]+) expected\)$/, function (m) { return m[2] + 'இல் ' + m[1] + ' (' + m[3] + ' எதிர்பார்ப்பு)'; }],
    [/^(.+): (\d+) vs ([\d.]+) expected \(p ([\d.]+)\)$/, function (m) { var t = translate(m[1], 'ta'); return t ? t + ': ' + m[2] + ' / எதிர்பார்ப்பு ' + m[3] + ' (p ' + m[4] + ')' : null; }],
    [/^Lines for (.+) UTC\. Solid: culminating\. Dashed: lowest point\. Fine line: rising \(left\) and setting \(right\)\.$/, function (m) {
      return 'கோடுகள்: ' + (datesOnly(m[1]) || m[1]) + ' UTC. தடித்த கோடு: உச்சம். புள்ளிக் கோடு: பாதாளம். மெல்லிய கோடு: உதயம் (இடது), அஸ்தமனம் (வலது).'; }],
    // Several phrases joined with "; " (patterns found on one day): each one is translated on its own
    [/^[^;]+(?:; [^;]+)+$/, function (m) { var ok = true, r = m[0].split('; ').map(function (x) { var t = translate(x, 'ta'); if (!t) ok = false; return t; }); return ok ? r.join('; ') : null; }],
    // Text whose only English is dates, weekdays or a few fixed words: "Wednesday 11 Nov 2026,", "குரு/ராகு 18 May 2036 → 11 Oct 2038", "சாதகம் none"
    [/[A-Za-z]/, function (m) { return datesOnly(m.input); }]
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
  function translate(core, l, node) {
    var hit = MAP[l][core];
    if (hit) return hit;
    if (l === 'ta') for (var i = 0; i < TA_RX.length; i++) {
      var m = core.match(TA_RX[i][0]); if (m) { var r = TA_RX[i][1](m); if (r) return r; }
    }
    // 11.2 reports printed in English only (i18n-ta-reports.js), inside their own boxes
    var REP = window.RV_TA_REPORTS, el = node && node.parentNode;
    if (l === 'ta' && REP && el && el.closest && el.closest(REP.scope)) {
      var t = REP.tr(core, function (s) { return translate(s, 'ta'); });
      if (t && t !== core) return t;
    }
    return null;
  }
  function tr(text, l, node) {
    var core = text.trim(); if (!core || !/[A-Za-z]/.test(core)) return text;
    var out = translate(core, l, node); if (out == null) return text;
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
  // Tamil for a given text whatever the page language: the chat uses it when its own "Reply in" is Tamil.
  window.rvTa = function (text) { var t = translate(text, 'ta'); if (t) OUT.add(t.replace(/\{\w+\}/g, '').trim()); return t || text; };
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
    var v = tr(r.o, l, n);
    if (v !== n.nodeValue) n.nodeValue = v;
    r.t = v; rec.set(n, r);
    if (v !== r.o) { touched.add(n); mine(n.parentNode); }
    else if (n.parentNode && n.parentNode.nodeType === 1 && ours(n.parentNode)) mine(n.parentNode);
  }
  // The engine marks elements whose text is all Tamil as "Tamil copies" (class tam60) and hides them
  // in single-language modes, and never unmarks them. Text translated here is the main text, not a copy.
  // 11.2: in Tamil the engine writes its reports in Tamil, then its older language layer marks every all-Tamil
  // element as a "Tamil copy" and hides it. It exempts Ask, Agriculture and Mobile Numerology, but not
  // Nameology or the 11.2 reports inside older tools, where titles, headings and instrument names vanished.
  // There, only the <small> lines under a translated name are real copies.
  function mainTamil(el) {
    var REP = window.RV_TA_REPORTS;
    return current === 'ta' && !!REP && el.tagName !== 'SMALL' && !!el.closest && !!el.closest(REP.main);
  }
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
  // Whole Tamil paragraphs the engine prints after an English one (10.5 blocks): shown in place of the English.
  var TWINP = 'p[style*="var(--ta)"],p[style*="var(--tamil)"]';
  // The engine hides its Tamil copies in single-language modes with display:none!important inside its
  // cascade layer, which no revamp stylesheet rule can override; an inline !important can.
  function showTwin(e, disp) {
    [e].concat([].slice.call(e.querySelectorAll(TWIN + ',.tam60'))).forEach(function (x) {
      if (x.hasAttribute('data-rvshow')) return;
      // keep the element's own style attribute, to put back exactly as it was
      x.setAttribute('data-rvshow', x.hasAttribute('style') ? 's' + x.getAttribute('style') : 'n');
      x.style.setProperty('display', x === e && disp || 'inline', 'important');
    });
  }
  function twins(on) {
    document.querySelectorAll('.rv-ta-only').forEach(function (p) { if (!on) p.classList.remove('rv-ta-only'); });
    document.querySelectorAll('.rv-ta-twin').forEach(function (e) { if (!on) e.classList.remove('rv-ta-twin'); });
    if (!on) document.querySelectorAll('.rv-ta-hide').forEach(function (p) { p.classList.remove('rv-ta-hide'); });
    if (!on) {
      document.querySelectorAll('[data-rvshow]').forEach(function (x) {
        var o = x.getAttribute('data-rvshow');
        if (o.charAt(0) === 's') x.setAttribute('style', o.slice(1)); else x.removeAttribute('style');
        x.removeAttribute('data-rvshow');
      });
      return;
    }
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
      e.classList.add('rv-ta-twin'); p.classList.add('rv-ta-only'); showTwin(e);
    });
    document.querySelectorAll(TWINP).forEach(function (e) {
      var p = e.previousElementSibling;
      while (p && p.tagName === 'BUTTON' && p.classList.contains('rv-more')) p = p.previousElementSibling; // the revamp's Read more button
      if (!p || p.tagName !== 'P' || p.matches(TWINP) || p.classList.contains('rv-ta-hide')) return;
      if (!/[஀-௿]/.test(e.textContent) || (p.textContent.match(/[A-Za-z]/g) || []).length < 12) return;
      if (paraKept(p, paraRec.get(p))) return; // already translated from i18n-ta.js
      p.classList.add('rv-ta-hide'); showTwin(e, 'block');
    });
  }
  /* Tamil mode: long help paragraphs. A paragraph is split into several text nodes around <b>/<i>,
     so it is translated whole. Its own nodes move into a hidden holder inside the paragraph and a
     Tamil copy (with the same emphasis) is shown beside it; in every other language the very same
     nodes move back. They stay in the page meanwhile, so the engine and the text-node layer above
     still find and restore the text they changed. The Tamil is in i18n-ta.js (window.RV_TA_HELP):
     [selector, English key, Tamil HTML], where the key is a phrase from the paragraph's English text,
     or a RegExp whose match feeds a function that returns the Tamil HTML. */
  var HELP = [], paraRec = new WeakMap(), paraOn = new Set(), paraT;
  function helpList(list) {
    HELP = (list || []).filter(function (e) { return e && e[0] && e[1] && e[2]; });
    if (current === 'ta') paras(true);
  }
  function paraKept(el, r) { return !!r && r.w.parentNode === el && r.hold.parentNode === el; }
  function paras(on) {
    if (!on) {
      paraOn.forEach(function (el) {
        var r = paraRec.get(el); paraRec.delete(el);
        if (!paraKept(el, r)) return;
        while (r.hold.firstChild) el.insertBefore(r.hold.firstChild, r.hold);
        el.removeChild(r.hold); el.removeChild(r.w);
        // a class added and removed meanwhile (tam60) leaves an empty attribute behind
        r.bare.forEach(function (n) { if (n.getAttribute('class') === '') n.removeAttribute('class'); });
        if (!r.had) el.removeAttribute('data-rvtr');
      });
      paraOn.clear();
      return;
    }
    HELP.forEach(function (e) {
      document.querySelectorAll(e[0]).forEach(function (el) {
        if (paraKept(el, paraRec.get(el)) || el.classList.contains('rv-ta-hide')) return;
        var text = el.textContent.replace(/\s+/g, ' ').trim(), html = null;
        if (typeof e[1] === 'string') { if (text.indexOf(e[1]) >= 0) html = typeof e[2] === 'function' ? e[2]() : e[2]; }
        else { var m = text.match(e[1]); if (m) html = e[2](m); }
        if (html == null) return;
        var hold = document.createElement('span');
        hold.className = 'rv-ta-hold'; hold.setAttribute('aria-hidden', 'true'); hold.style.setProperty('display', 'none', 'important');
        while (el.firstChild) hold.appendChild(el.firstChild);
        // Text written here is the main text, not a Tamil copy for the engine to hide (class tam60).
        var w = document.createElement('span');
        w.className = 'rv-ta-para'; w.innerHTML = html;
        // The engine's Tamil mode keeps only the Tamil after a " · " in a line ("English · தமிழ்").
        // An invisible word joiner after the dot keeps whole Tamil lines whole.
        var tw = document.createTreeWalker(w, NodeFilter.SHOW_TEXT), tn;
        while ((tn = tw.nextNode())) if (tn.nodeValue.indexOf('·') >= 0) tn.nodeValue = tn.nodeValue.replace(/·(\s*)(?=[\u0B80-\u0BFF])/g, '·$1\u2060');
        w.setAttribute('data-rvtr', ''); w.querySelectorAll('*').forEach(function (c) { c.setAttribute('data-rvtr', ''); });
        var r = { w: w, hold: hold, had: el.hasAttribute('data-rvtr'),
          bare: [].filter.call(hold.querySelectorAll('*'), function (n) { return !n.hasAttribute('class'); }) };
        el.appendChild(w); el.appendChild(hold);
        el.setAttribute('data-rvtr', '');
        el.classList.remove('tam60', 'rv-ta-only');
        paraRec.set(el, r); paraOn.add(el);
      });
    });
  }
  window.rvTaHelp = helpList;

  var current = null;
  function apply() {
    var l = lang();
    clearTimeout(paraT); clearTimeout(twinT);
    paras(false);
    restore();
    current = l;
    twins(l === 'ta');
    if (l === 'ta') paras(true);
    if (active(l)) walk(document.body, l);
    document.dispatchEvent(new CustomEvent('rv-lang', { detail: l }));
  }
  new MutationObserver(function (ms) {
    if (!active(current)) return;
    ms.forEach(function (m) {
      if (m.type === 'characterData') { if (!skipped(m.target.parentNode)) doText(m.target, current); return; }
      if (m.type === 'attributes') {
        if (m.attributeName === 'class') { if (m.target.classList.contains('tam60') && (ours(m.target) || mainTamil(m.target))) mine(m.target); return; }
        if (!skipped(m.target)) doAttrs(m.target, current); return;
      }
      m.addedNodes.forEach(function (a) { walk(a, current); });
    });
    if (current === 'ta') {
      // The language may change before these run: they act only while Tamil is still on.
      if (HELP.length && ms.some(function (m) { return m.type === 'childList' && m.addedNodes.length; })) { clearTimeout(paraT); paraT = setTimeout(function () { if (current === 'ta') paras(true); }, 60); }
      clearTimeout(twinT); twinT = setTimeout(function () { if (current === 'ta') twins(true); }, 300);
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS.concat('class') });
  new MutationObserver(function () { if (lang() !== current) apply(); })
    .observe(document.body, { attributes: true, attributeFilter: ['data-lang'] });
  helpList(window.RV_TA_HELP);
  apply();
})();
