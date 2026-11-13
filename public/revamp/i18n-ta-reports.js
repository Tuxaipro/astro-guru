/* GuruAgasthiya revamp: Tamil for the 11.2 reports that the engine prints in English only.

   Two 11.2 reports hold an English and a Tamil text for every reason but print only the English one:
   - the personal muhurtham report (Chandra Muhurtham's personal Tara Bala search, and the lottery number
     studio, which reuses it): #cmpOut and #lnRepAll, with their message lines;
   - the market forecast report (Market Transit): #mkxRep.
   In Tamil mode, revamp/i18n.js hands this file the text of those boxes, after its own map and patterns.
   The market report keeps its result on window.__mkx with the engine's own Tamil for every reason, so those
   are looked up exactly. The muhurtham report keeps nothing, so its reasons are rebuilt from the engine's own
   templates and Tamil words (js/02-app.js, GA_CMP: add(score, English, Tamil)).
   A text that is a list ("a; b" or "a · b") is translated part by part; a part with no match stays as it is. */
(function () {
  'use strict';

  var SCOPE = '#cmpOut, #cmpMsg, #lnRepAll, #lnMsg, #mkxRep';

  /* ---------- the engine's words, English to Tamil ---------- */
  function pairs(en, ta) { var o = {}; en.forEach(function (e, i) { o[e] = ta[i]; }); return o; }
  var NAK = pairs(['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'],
    ['அஸ்வினி', 'பரணி', 'கார்த்திகை', 'ரோகிணி', 'மிருகசீரிடம்', 'திருவாதிரை', 'புனர்பூசம்', 'பூசம்', 'ஆயில்யம்', 'மகம்', 'பூரம்', 'உத்திரம்', 'அஸ்தம்', 'சித்திரை', 'சுவாதி', 'விசாகம்', 'அனுஷம்', 'கேட்டை', 'மூலம்', 'பூராடம்', 'உத்திராடம்', 'திருவோணம்', 'அவிட்டம்', 'சதயம்', 'பூரட்டாதி', 'உத்திரட்டாதி', 'ரேவதி']);
  var SIGN = pairs(['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
    ['மேஷம்', 'ரிஷபம்', 'மிதுனம்', 'கடகம்', 'சிம்மம்', 'கன்னி', 'துலாம்', 'விருச்சிகம்', 'தனுசு', 'மகரம்', 'கும்பம்', 'மீனம்']);
  var PL = pairs(['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'],
    ['சூரியன்', 'சந்திரன்', 'செவ்வாய்', 'புதன்', 'குரு', 'சுக்கிரன்', 'சனி', 'ராகு', 'கேது']);
  var YOGA = pairs(['Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyan', 'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti'],
    ['விஷ்கம்பம்', 'ப்ரீதி', 'ஆயுஷ்மான்', 'சௌபாக்யம்', 'சோபனம்', 'அதிகண்டம்', 'சுகர்மம்', 'திருதி', 'சூலம்', 'கண்டம்', 'விருத்தி', 'துருவம்', 'வியாகாதம்', 'ஹர்ஷணம்', 'வஜ்ரம்', 'சித்தி', 'வியதீபாதம்', 'வரீயான்', 'பரிகம்', 'சிவம்', 'சித்தம்', 'சாத்தியம்', 'சுபம்', 'சுக்லம்', 'பிரம்மம்', 'ஐந்திரம்', 'வைதிருதி']);
  var TITHI = pairs(['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima', 'Amavasya'],
    ['பிரதமை', 'துவிதியை', 'திருதியை', 'சதுர்த்தி', 'பஞ்சமி', 'சஷ்டி', 'சப்தமி', 'அஷ்டமி', 'நவமி', 'தசமி', 'ஏகாதசி', 'துவாதசி', 'திரயோதசி', 'சதுர்த்தசி', 'பௌர்ணமி', 'அமாவாசை']);
  var PAKSHA = { Shukla: 'வளர்பிறை', Krishna: 'தேய்பிறை' };
  var WD = pairs(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி']);
  var WDS = pairs(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி']);
  var MON = pairs(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], ['ஜன', 'பிப்', 'மார்', 'ஏப்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆக', 'செப்', 'அக்', 'நவ', 'டிச']);
  var TARA = pairs(['Janma', 'Sampat', 'Vipat', 'Kshema', 'Pratyak', 'Sadhana', 'Naidhana', 'Mitra', 'Parama Mitra'], ['ஜன்ம', 'சம்பத்', 'விபத்', 'க்ஷேம', 'பிரத்யக்', 'சாதன', 'நைதன', 'மித்ர', 'பரம மித்ர']);
  var PAN = pairs(['Mrityu (danger)', 'Agni (fire)', 'Raja (bad results)', 'Chora (evil events)', 'Roga (disease)'], ['ம்ருத்யு (ஆபத்து)', 'அக்னி (தீ)', 'ராஜ (தீய பலன்)', 'சோர (தீமை)', 'ரோக (நோய்)']);
  var TMON = pairs(['Chithirai', 'Vaikasi', 'Aani', 'Aadi', 'Avani', 'Purattasi', 'Aippasi', 'Karthigai', 'Margazhi', 'Thai', 'Masi', 'Panguni'], ['சித்திரை', 'வைகாசி', 'ஆனி', 'ஆடி', 'ஆவணி', 'புரட்டாசி', 'ஐப்பசி', 'கார்த்திகை', 'மார்கழி', 'தை', 'மாசி', 'பங்குனி']);
  var LMON = pairs(['Chaitra', 'Vaisakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada', 'Ashwin', 'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna'], ['சைத்ரம்', 'வைசாகம்', 'ஜ்யேஷ்டம்', 'ஆஷாடம்', 'ஷ்ராவணம்', 'பாத்ரபதம்', 'ஆஸ்வினம்', 'கார்த்திகம்', 'மார்கழி', 'பௌஷம்', 'மாகம்', 'பால்குனம்']);
  function alt(o) { return '(' + Object.keys(o).sort(function (a, b) { return b.length - a.length; }).map(function (k) { return k.replace(/[()]/g, '\\$&'); }).join('|') + ')'; }
  var R_NAK = alt(NAK), R_SIGN = alt(SIGN), R_PL = alt(PL), R_YOGA = alt(YOGA), R_TITHI = alt(TITHI), R_WD = alt(WD), R_TARA = alt(TARA);
  var R_PLS = R_PL + '(?:, ' + R_PL + ')*';
  function pls(s) { return s.split(', ').map(function (p) { return PL[p] || p; }).join(', '); }
  function tithi(name, pk) { return (pk ? PAKSHA[pk] + ' ' : '') + (TITHI[name] || name); }
  function rx(s) { return new RegExp('^' + s + '$'); }
  // The engine names an unnamed person "Person 1"; a name the user typed stays as typed.
  function nm(s) { var m = s.match(/^Person (\d+)$/); return m ? 'நபர் ' + m[1] : s; }

  /* ---------- whole phrases (headings, labels, fixed reasons) ---------- */
  var FIX = {
    // muhurtham report
    'Janma star': 'ஜன்ம நட்சத்திரம்', 'Janma rashi': 'ஜன்ம ராசி', 'Time': 'நேரம்', 'Rising sign · Moon': 'லக்னம் · சந்திரன்',
    'Verdict': 'தீர்ப்பு', 'Tara and Chandra': 'தாரை, சந்திர பலம்', 'Reasons': 'காரணங்கள்', 'Tithi · star · yoga': 'திதி · நட்சத்திரம் · யோகம்',
    'Best time that day': 'அன்றைய சிறந்த நேரம்', 'Score': 'மதிப்பெண்', 'Date': 'தேதி', 'Moon in star': 'சந்திரன் இருக்கும் நட்சத்திரம்',
    'Tara': 'தாரை', 'Result': 'பலன்', 'Moon in sign': 'சந்திரன் இருக்கும் ராசி', 'Count from birth sign': 'ஜன்ம ராசியிலிருந்து எண்ணிக்கை',
    'Chandra Bala': 'சந்திர பலம்', 'Good': 'நல்லது', 'Avoid': 'தவிர்க்கவும்', 'Half harm': 'பாதி தீமை', 'Negligible harm': 'சிறிய தீமை',
    'Middling': 'சராசரி', 'Bad': 'தீயது', 'none clean': 'குறையற்ற நேரம் இல்லை', 'general': 'பொது', 'Star and pada entered': 'நட்சத்திரமும் பாதமும் இட்டது',
    'From – to': 'முதல் – வரை', 'Why it works': 'ஏன் ஏற்றது', 'Rahu kalam': 'ராகு காலம்', 'Yamagandam': 'எமகண்டம்', 'Gulika kalam': 'குளிகை காலம்',
    'Durmuhurta': 'துர்முகூர்த்தம்', 'Abhijit muhurta': 'அபிஜித் முகூர்த்தம்', 'Vishti (Bhadra) karana': 'விஷ்டி (பத்ரா) கரணம்',
    'Tithi gandanta (junction of tithis)': 'திதி கண்டாந்தம்', 'Nakshatra gandanta (junction of stars)': 'நட்சத்திர கண்டாந்தம்',
    'Pushya has the power to neutralise faults': 'புஷ்யம் தோஷங்களை நீக்கும் வலிமை உடையது',
    'Jupiter or Venus is in the rising sign': 'குரு அல்லது சுக்கிரன் லக்னத்தில்',
    'Karthari dosha: malefics on both sides of the rising sign': 'கர்த்தரி தோஷம்: லக்னத்தின் இருபுறமும் பாவ கிரகங்கள்',
    'The Moon is with another planet (Sagraha Chandra)': 'சந்திரன் வேறு கிரகத்துடன் (சகிரக சந்திரன்)', 'Eclipse period (grahan)': 'கிரகண காலம்',
    'Saturday may bring the risk of theft': 'சனிக்கிழமை திருட்டு அபாயம் தரலாம்', 'Sunday is to be avoided for house entry': 'ஞாயிறு கிரகப்பிரவேசத்துக்கு தவிர்க்கவும்',
    'The dark half is not preferred for house entry': 'தேய்பிறை கிரகப்பிரவேசத்துக்கு உகந்ததல்ல',
    'The Sun is in Uttarayana, the right season for a newly built house': 'சூரியன் உத்தராயணத்தில்: புதிதாகக் கட்டிய வீட்டுக்கு ஏற்ற காலம்',
    'The Sun is in Dakshinayana, which is not preferred for the first entry into a new house': 'சூரியன் தட்சிணாயனத்தில்: புதிய வீட்டின் முதல் பிரவேசத்துக்கு உகந்ததல்ல',
    'Jupiter is combust (Guru asta)': 'குரு அஸ்தமனம்', 'Venus is combust (Shukra asta)': 'சுக்கிரன் அஸ்தமனம்',
    'Janma star is favourable for learning.': 'ஜன்ம நட்சத்திரம் கல்விக்குச் சாதகம்.',
    // market report
    'Instrument': 'வர்த்தகப் பொருள்', 'Bias': 'போக்கு', 'Bullish / bearish days': 'ஏற்ற / இறக்க நாட்கள்', 'Best day to buy': 'வாங்கச் சிறந்த நாள்',
    'Best day to sell': 'விற்கச் சிறந்த நாள்', 'Volatility': 'ஏற்ற இறக்கம்', 'Week': 'வாரம்', 'Main reason': 'முக்கியக் காரணம்',
    'Dhruvank Chakra': 'துருவாங்க சக்கரம்', 'Bullish': 'ஏற்றம்', 'Bearish': 'இறக்கம்', 'Neutral': 'நடுநிலை',
    'Cusp': 'பாவ முனை', 'Sub lord': 'உப அதிபதி', 'Signifies': 'குறிப்பவை', 'Meaning for trading': 'வர்த்தகத்துக்குப் பொருள்',
    'Market': 'சந்தை', 'Action': 'செயல்', 'Dasha · bhukti · antara': 'தசை · புக்தி · அந்தரம்', 'Moon from natal Moon': 'ஜன்ம சந்திரனிலிருந்து சந்திரன்',
    'Trade with the trend (long)': 'போக்குடன் வர்த்தகம் (வாங்கு)', 'Good day for you but the market is weak: sell rallies or stay light': 'உங்களுக்கு நல்ல நாள், ஆனால் சந்தை பலவீனம்: ஏற்றத்தில் விற்கவும் அல்லது குறைவாக வர்த்தகம் செய்யவும்',
    'Stay out or trade very small': 'விலகியிருங்கள் அல்லது மிகக் குறைவாக வர்த்தகம் செய்யுங்கள்', 'Normal care': 'வழக்கமான கவனம்',
    'Excellent': 'மிகச் சிறந்தது', 'Average': 'சராசரி', 'Caution': 'எச்சரிக்கை', 'Fair': 'சுமார்', 'Weak': 'பலவீனம்',
    'Mars conjunction Jupiter (exact)': 'செவ்வாய் – குரு சேர்க்கை (துல்லியம்)'
  };

  /* ---------- templates of the muhurtham report (English pattern, Tamil maker) ---------- */
  var T = [
    [rx('(.+): Tara (\\d) ' + R_TARA + ' \\(cycle (\\d)\\) is harmful'), function (m) { return nm(m[1]) + ': தாரை ' + m[2] + ' ' + TARA[m[3]] + ' (சுற்று ' + m[4] + ') தீமை'; }],
    [rx('(.+): Tara (\\d) ' + R_TARA + ' is weak(?: \\((.+)\\))?'), function (m) { return nm(m[1]) + ': தாரை ' + m[2] + ' ' + TARA[m[3]] + ' பலவீனம்' + (m[4] ? ' (' + note(m[4]) + ')' : ''); }],
    [rx('(.+): Tara (\\d) ' + R_TARA + ' is good'), function (m) { return nm(m[1]) + ': தாரை ' + m[2] + ' ' + TARA[m[3]] + ' நல்லது'; }],
    [rx('(.+): Tara (\\d) ' + R_TARA + '(?: \\(cycle (\\d)\\))?'), function (m) { return nm(m[1]) + ': தாரை ' + m[2] + ' ' + TARA[m[3]] + (m[4] ? ' (சுற்று ' + m[4] + ')' : ''); }],
    [rx('(\\d) ' + R_TARA + ' · (\\S+)(?: \\(cycle (\\d)\\))?'), function (m) { return m[1] + ' ' + TARA[m[2]] + (m[4] ? ' (சுற்று ' + m[4] + ')' : ''); }],
    [/^(.*[\u0B80-\u0BFF].*) \(cycle (\d)\)$/, function (m) { return m[1] + ' (சுற்று ' + m[2] + ')'; }],
    [/^(.*[\u0B80-\u0BFF].*: )Person (\d+)$/, function (m) { return m[1] + 'நபர் ' + m[2]; }],
    [rx('(.*[\\u0B80-\\u0BFF].*) \\(' + R_PL + '\\)'), function (m) { return m[1] + ' (' + PL[m[2]] + ')'; }],
    [/^Chandra (\d+)$/, function (m) { return 'சந்திர பலம் ' + m[1]; }],
    [/^(.+): Chandra Bala is bad \(Moon is the (\d+)\w\w from the birth sign\)$/, function (m) { return nm(m[1]) + ': சந்திர பலம் இல்லை (ஜன்ம ராசியிலிருந்து ' + m[2] + '-ஆம் ராசி)'; }],
    [/^(.+): Chandra Bala is good \(Moon is the (\d+)\w\w from the birth sign\)$/, function (m) { return nm(m[1]) + ': சந்திர பலம் உண்டு (' + m[2] + '-ஆம் ராசி)'; }],
    [/^(.+): Chandra Bala is middling \(the (\d+)\w\w\)$/, function (m) { return nm(m[1]) + ': சந்திர பலம் சராசரி (' + m[2] + '-ஆம்)'; }],
    [rx('Tithi ' + R_TITHI + ' \\((Shukla|Krishna)\\) is to be avoided'), function (m) { return 'திதி ' + tithi(m[1], m[2]) + ' தவிர்க்கவும்'; }],
    [rx('Tithi ' + R_TITHI + ' \\((Shukla|Krishna)\\) is only fair'), function (m) { return 'திதி ' + tithi(m[1], m[2]) + ' சுமார்'; }],
    [rx('Tithi ' + R_TITHI + ' \\((Shukla|Krishna)\\) is good'), function (m) { return 'திதி ' + tithi(m[1], m[2]) + ' நல்லது'; }],
    [rx(R_TITHI + ' \\((Shukla|Krishna)\\)'), function (m) { return tithi(m[1], m[2]); }],
    [rx('Yoga ' + R_YOGA + ' is to be avoided'), function (m) { return 'யோகம் ' + YOGA[m[1]] + ' தவிர்க்கவும்'; }],
    [rx('Yoga ' + R_YOGA + ' is fine'), function (m) { return 'யோகம் ' + YOGA[m[1]] + ' சரி'; }],
    [rx(R_YOGA), function (m) { return YOGA[m[1]]; }],
    [rx(R_WD + ' is not suited to this work( \\(quarrels in the home\\))?'), function (m) { return WD[m[1]] + ' இந்த காரியத்துக்கு ஏற்றதல்ல' + (m[2] ? ' (வீட்டில் சண்டை)' : ''); }],
    [rx(R_WD + ' suits this work'), function (m) { return WD[m[1]] + ' இந்த காரியத்துக்கு ஏற்றது'; }],
    [rx('The Moon is in ' + R_NAK + ', which is condemned for good work'), function (m) { return 'சந்திரன் ' + NAK[m[1]] + ' நட்சத்திரத்தில்: நல்ல காரியத்துக்கு ஆகாது'; }],
    [rx('The Moon is in ' + R_NAK + ', a good star for this work'), function (m) { return 'சந்திரன் ' + NAK[m[1]] + ' நட்சத்திரத்தில்: இந்த காரியத்துக்கு சிறந்தது'; }],
    [rx('The Moon is in ' + R_NAK + ', not among the best stars for this work'), function (m) { return 'சந்திரன் ' + NAK[m[1]] + ': இந்த காரியத்துக்கு சிறந்த நட்சத்திரம் அல்ல'; }],
    [rx('(Amrita )?Siddha yoga: ' + R_WD + ' with ' + R_NAK), function (m) { return (m[1] ? 'அமிர்த ' : '') + 'சித்த யோகம்: ' + WD[m[2]] + ' + ' + NAK[m[3]]; }],
    [rx('Panchaka: (.+) \\(remainder (\\d)\\)'), function (m) { return PAN[m[1]] ? 'பஞ்சகம்: ' + PAN[m[1]] + ' (மீதி ' + m[2] + ')' : null; }],
    [/^Panchaka rahita: remainder (\d) is good$/, function (m) { return 'பஞ்சக ரஹிதம்: மீதி ' + m[1] + ' நல்லது'; }],
    [/^The Moon is in the (\d+)\w\w house from the rising sign$/, function (m) { return 'சந்திரன் லக்னத்திலிருந்து ' + m[1] + '-ஆம் வீட்டில்'; }],
    [rx('The 8th house holds ' + R_PLS), function (m) { return '8-ஆம் வீட்டில் ' + pls(m[0].slice(20)) + ' உள்ளனர்'; }],
    [rx('Malefics in kendra: (' + R_PLS + ')'), function (m) { return 'கேந்திரத்தில் பாவ கிரகங்கள்: ' + pls(m[1]); }],
    [rx('Benefics in kendra or trikona: (' + R_PLS + ')'), function (m) { return 'கேந்திர, கோணத்தில் சுப கிரகங்கள்: ' + pls(m[1]); }],
    [rx('The rising sign ' + R_SIGN + ' suits this work'), function (m) { return 'லக்னம் ' + SIGN[m[1]] + ' இந்த காரியத்துக்கு ஏற்றது'; }],
    [rx('The rising sign ' + R_SIGN + ' is not among the best for this work'), function (m) { return 'லக்னம் ' + SIGN[m[1]] + ' சிறந்தது அல்ல'; }],
    [rx('The rising sign ' + R_SIGN + ' is a fixed sign, ideal for settling in'), function (m) { return 'லக்னம் ' + SIGN[m[1]] + ' ஸ்திர ராசி: நிலையாக குடியேற சிறந்தது'; }],
    [rx('The rising sign ' + R_SIGN + ' is a dual sign \\(average\\)'), function (m) { return 'லக்னம் ' + SIGN[m[1]] + ' உபய ராசி (சராசரி)'; }],
    [rx('The rising sign ' + R_SIGN + ' is a movable sign, best avoided for house entry'), function (m) { return 'லக்னம் ' + SIGN[m[1]] + ' சர ராசி: கிரகப்பிரவேசத்துக்கு தவிர்க்கவும்'; }],
    [/^(.+): the rising sign is the 8th from the birth ascendant( \(Ashtama lagna\))?$/, function (m) { return nm(m[1]) + ': லக்னம் பிறப்பு லக்னத்திலிருந்து 8-ஆம் இடம்' + (m[2] ? ' (அஷ்டம லக்னம்)' : ''); }],
    [/^(.+): the Moon is in or trine to the Indu Lagna \(wealth point\)$/, function (m) { return nm(m[1]) + ': சந்திரன் இந்து லக்னம் அல்லது அதன் கோணத்தில் (செல்வப் புள்ளி)'; }],
    [rx('KP Chandra muhurtham rule is met \\(the Moon’s star owner is the ' + R_PL + ', a gain lord of this rising sign\\)'), function (m) { return 'KP சந்திர முகூர்த்த விதி நிறைவு (சந்திரனின் நட்சத்திர அதிபதி ' + PL[m[1]] + ', இந்த லக்னத்தின் லாப அதிபதி)'; }],
    [/^Bright-half tithi (\d+) is recommended for house entry$/, function (m) { return 'வளர்பிறை ' + m[1] + '-ஆம் திதி கிரகப்பிரவேசத்துக்கு உகந்தது'; }],
    [rx(R_NAK + ' is one of the best stars for entering a house'), function (m) { return 'சந்திரன் ' + NAK[m[1]] + ': கிரகப்பிரவேசத்துக்கு மிகச் சிறந்த நட்சத்திரம்'; }],
    [rx('Tamil month ' + alt(TMON) + ' is (among the best|a good month|among the worst) for house warming'), function (m) {
      return 'தமிழ் மாதம் ' + TMON[m[1]] + ' ' + (m[2] === 'among the best' ? 'கிரகப்பிரவேசத்துக்கு மிகச் சிறந்தது' : m[2] === 'a good month' ? 'நல்ல மாதம்' : 'கிரகப்பிரவேசத்துக்கு உகந்ததல்ல'); }],
    [rx('Lunar month ' + alt(LMON) + ' is (auspicious|fair|inauspicious) for house entry( \\(losses and troubles\\))?'), function (m) {
      return 'சந்திர மாதம் ' + LMON[m[1]] + ' ' + (m[2] === 'auspicious' ? 'கிரகப்பிரவேசத்துக்கு உகந்தது' : m[2] === 'fair' ? 'கிரகப்பிரவேசத்துக்கு சுமார்' : 'கிரகப்பிரவேசத்துக்கு உகந்ததல்ல (இழப்பு, தொல்லை)'); }],
    [rx('The Sun is in ' + R_SIGN + ', which is avoided for entering a new house'), function (m) { return 'சூரியன் ' + SIGN[m[1]] + ' ராசியில்: புதிய வீடு புகுவதற்கு தவிர்க்கவும்'; }],
    // labels and figures
    [rx(R_NAK + ' · Moon in ' + R_SIGN), function (m) { return NAK[m[1]] + ' · சந்திரன் ' + SIGN[m[2]] + ' ராசியில்'; }],
    [rx(R_NAK + ' pada (\\d)'), function (m) { return NAK[m[1]] + ' பாதம் ' + m[2]; }],
    [rx('Birth ascendant ' + R_SIGN + ' · Indu Lagna ' + R_SIGN), function (m) { return 'பிறப்பு லக்னம் ' + SIGN[m[1]] + ' · இந்து லக்னம் ' + SIGN[m[2]]; }],
    [/^(\d+) h (\d+) min$/, function (m) { return m[1] + ' மணி ' + m[2] + ' நிமிடம்'; }],
    [/^(\d+) min$/, function (m) { return m[1] + ' நிமிடம்'; }],
    [/^(\d+) of (\d+)$/, function (m) { return m[2] + '-இல் ' + m[1]; }],
    [/^lowest (\d+)$/, function (m) { return 'குறைந்தது ' + m[1]; }],
    [/^Sunrise ([\d:]+) · sunset ([\d:]+)$/, function (m) { return 'சூரிய உதயம் ' + m[1] + ' · அஸ்தமனம் ' + m[2]; }],
    [/^(\d+) timings checked over (\d+) days?\.$/, function (m) { return m[2] + ' நாட்களில் ' + m[1] + ' நேரங்கள் சரிபார்க்கப்பட்டன.'; }],
    [/^Person (\d+)$/, function (m) { return 'நபர் ' + m[1]; }],
    [rx('([\\d:]+–[\\d:]+) ' + R_SIGN + ' (\\d+)'), function (m) { return m[1] + ' ' + SIGN[m[2]] + ' ' + m[3]; }],
    [rx(R_SIGN), function (m) { return SIGN[m[1]]; }],
    [rx(R_NAK), function (m) { return NAK[m[1]]; }],
    // market report
    [/^(\d+) bullish, (\d+) bearish and (\d+) neutral days of (\d+) · volatility (\d+)%$/, function (m) { return m[4] + ' நாட்களில் ' + m[1] + ' ஏற்றம், ' + m[2] + ' இறக்கம், ' + m[3] + ' நடுநிலை · ஏற்ற இறக்கம் ' + m[5] + '%'; }],
    [/^sum (\d+) · remainder (\d+)$/, function (m) { return 'கூட்டு ' + m[1] + ' · மீதி ' + m[2]; }],
    [/^(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})$/, function (m) { return m[1] + ' ' + MON[m[2]] + ' ' + m[3]; }],
    [/^(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?: (Sun|Mon|Tue|Wed|Thu|Fri|Sat))?$/, function (m) { return m[1] + ' ' + MON[m[2]] + (m[3] ? ' ' + WDS[m[3]] : ''); }]
  ];
  function note(s) {
    var m;
    if ((m = s.match(/^first (\d+) ghatis of the Janma star are the evil part$/))) return 'ஜன்ம நட்சத்திரத்தின் முதல் ' + m[1] + ' நாழிகை தீய பகுதி';
    if ((m = s.match(/^past the first (\d+) ghatis the Janma star can be used only if urgent$/))) return 'முதல் ' + m[1] + ' நாழிகைக்குப் பின் அவசரத்துக்கு மட்டும் ஜன்ம நட்சத்திரம்';
    return FIX[s] || s;
  }

  /* ---------- the market report: the engine's own Tamil, from window.__mkx ---------- */
  var mkxSeen = null, MKX = {};
  function mkx() {
    var r = window.__mkx; if (!r || r === mkxSeen) return MKX;
    mkxSeen = r; MKX = {};
    (r.out || []).forEach(function (o) {
      (o.R || []).forEach(function (x) { (x.why || []).forEach(function (w) { if (w.en && w.ta) MKX[w.en] = w.ta; }); });
      (o.drv || []).forEach(function (w) { if (w.en && w.ta) MKX[w.en] = w.ta; });
      (o.evs || []).forEach(function (e) { if (e.en && e.ta && !MKX[e.en]) MKX[e.en] = e.ta + (/\(exact\)$/.test(e.en) ? ' (துல்லியம்)' : ''); });
    });
    return MKX;
  }

  /* ---------- one phrase, then lists ---------- */
  function one(s, look) {
    if (!s) return null;
    if (FIX[s]) return FIX[s];
    var k = mkx()[s]; if (k) return k;
    for (var i = 0; i < T.length; i++) { var m = s.match(T[i][0]); if (m) { var r = T[i][1](m); if (r) return r; } }
    // market lines: "▲ Venus sextile Jupiter (18 days)", "◆ 16 Nov 2026 · Mars conjunction Jupiter (exact)"
    var d = s.match(/^([▲▼◆]) (.+?) \((\d+) days\)$/);
    if (d) { var w = one(d[2], look); return w ? d[1] + ' ' + w + ' (' + d[3] + ' நாட்கள்)' : null; }
    var e = s.match(/^([▲▼◆]) (\d{1,2} \w{3} \d{4}) · (.+)$/);
    if (e) { var ev = one(e[3], look); return ev ? e[1] + ' ' + one(e[2], look) + ' · ' + ev : null; }
    var w2 = s.match(/^(.+?) → (.+)$/);
    if (w2) { var a = one(w2[1], look), b = one(w2[2], look); return a && b ? a + ' → ' + b : null; }
    var t = look(s); return t && t !== s ? t : null;
  }
  function list(s, look) {
    var whole = one(s, look); if (whole) return whole;
    var sep = s.indexOf('; ') >= 0 ? '; ' : s.indexOf(' · ') >= 0 ? ' · ' : null;
    if (!sep) return null;
    var any = false;
    var out = s.split(sep).map(function (p) {
      var q = p.trim(), t = one(q, look) || (sep === '; ' && q.indexOf(' · ') >= 0 ? list(q, look) : null);
      if (t) { any = true; return t; } return p;
    });
    return any ? out.join(sep) : null;
  }

  window.RV_TA_REPORTS = {
    scope: SCOPE,
    // where the engine's all-Tamil text is main text, not a copy to hide (see mainTamil in i18n.js)
    main: '#cmpOut, #lnRepAll, #mkxRep, #nmPanel',
    // core: the text of one text node; look: i18n.js's own translation of a phrase (map and patterns).
    tr: function (core, look) { return list(core, look); }
  };
})();
