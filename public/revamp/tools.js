/* GuruAgasthiya web: tools of the web version's own, built on the engine's calculation core.

   window.GA_CORE (shared by a build patch, scripts/import-apk.mjs) gives the engine's own positions,
   ayanamsa, ascendant, KP sub table and Vimshottari dasha, so these tools agree with every engine tool and
   are covered by the accuracy test (npm run test:accuracy). Six tools:

     Marriage Matching (10 poruthams)      Gowri Panchangam (Nalla Neram)
     Sade Sati and Guru Transit            My Transits Today (gochara)
     KP Birth Time Rectification           Dasha Timeline

   Each tool is a sidebar button and a page (a .sheet), like the engine's tools; this file runs before
   revamp.js, which lists them in GROUPS and gives them addresses. Text follows the language in Settings:
   English with Tamil under it (default), Tamil only, or English; a page is redrawn when it changes.
   The rules are the common Tamil almanac rules; where schools differ, the page says which rule is used.
   window.GA_RVTOOLS exposes the pure rule functions for the tests. */
(function () {
  'use strict';
  var C = window.GA_CORE, A = window.Astronomy;
  var grid = document.querySelector('nav.tools .tgrid'), anchor = document.getElementById('cmPanel');
  if (!C || !A || !grid || !anchor) return;
  var $ = function (id) { return document.getElementById(id); };
  var DAY = 86400000, HOUR = 3600000, NAKW = 360 / 27, PADW = NAKW / 4;

  /* ---------- language ---------- */
  function lg() { return document.body.getAttribute('data-lang') || 'bi'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // Inline label (Tamil beside), block text (Tamil on the next line), plain text (attributes, options).
  function T(en, ta) { var l = lg(); return l === 'ta' ? ta : l === 'bi' ? en + ' <span class="tm">' + ta + '</span>' : en; }
  function B(en, ta) { var l = lg(); return l === 'ta' ? ta : l === 'bi' ? en + '<span class="rvt-ta">' + ta + '</span>' : en; }
  function S(en, ta) { return lg() === 'ta' ? ta : en; }

  var NAK_TA = ['அசுவினி', 'பரணி', 'கார்த்திகை', 'ரோகிணி', 'மிருகசீரிடம்', 'திருவாதிரை', 'புனர்பூசம்', 'பூசம்', 'ஆயில்யம்', 'மகம்', 'பூரம்', 'உத்திரம்', 'அஸ்தம்', 'சித்திரை', 'சுவாதி', 'விசாகம்', 'அனுஷம்', 'கேட்டை', 'மூலம்', 'பூராடம்', 'உத்திராடம்', 'திருவோணம்', 'அவிட்டம்', 'சதயம்', 'பூரட்டாதி', 'உத்திரட்டாதி', 'ரேவதி'];
  var WD_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var WD_TA = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];
  var MON_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MON_TA = ['ஜன.', 'பிப்.', 'மார்ச்', 'ஏப்.', 'மே', 'ஜூன்', 'ஜூலை', 'ஆக.', 'செப்.', 'அக்.', 'நவ.', 'டிச.'];
  var WD_LORD = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'];
  function nak(i) { return S(C.NAKS[i], NAK_TA[i]); }
  function sign(i) { return S(C.SIGNS[i][0], C.TSIGN[i]); }
  function pl(c) { return S(C.NAME[c], C.TA[c]); }
  function ord(n) { return n + (lg() === 'ta' ? '-ஆம்' : (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th')); }

  /* ---------- place, time and people ---------- */
  function home() {
    var p = (window.GA_PLACE && GA_PLACE.state && GA_PLACE.state.cur) || null;
    if (!p) { try { p = JSON.parse(localStorage.getItem('ga_place') || 'null'); } catch (e) {} }
    return p && isFinite(p.lat) ? p : { lat: 13.0827, lon: 80.2707, tz: 'Asia/Kolkata', name: 'Chennai' };
  }
  function kind() { var a = $('ayan'); return (a && a.value) || 'kp'; }
  function off(ms, tz) { return /^-?\d+(\.\d+)?$/.test(String(tz)) ? parseFloat(tz) : C.offsetAt(ms, tz); }
  function parts(ms, tz) { var d = new Date(ms + off(ms, tz) * HOUR); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes(), wd: d.getUTCDay() }; }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function hm(ms, tz) { var p = parts(ms, tz); return p2(p.h) + ':' + p2(p.mi); }
  function dt(ms, tz) { var p = parts(ms, tz); return p.d + ' ' + S(MON_EN[p.m - 1], MON_TA[p.m - 1]) + ' ' + p.y; }
  function dayName(ms, tz) { var w = parts(ms, tz).wd; return S(WD_EN[w], WD_TA[w]); }
  function isoDay(ms, tz) { var p = parts(ms, tz); return p.y + '-' + p2(p.m) + '-' + p2(p.d); }
  function midnight(iso, tz) { var a = iso.split('-').map(Number); return C.localToUtc(a[0], a[1], a[2], 0, 0, tz).ms; }
  function saved() { try { var l = JSON.parse(localStorage.getItem('gaBirthList') || '[]'); return Array.isArray(l) ? l : []; } catch (e) { return []; } }
  function birthMs(date, time, tz) {
    var d = String(date || '').split('-').map(Number), t = String(time || '00:00').split(':').map(Number);
    if (d.length < 3 || !d[0] || !d[1] || !d[2]) return NaN;
    return C.localToUtc(d[0], d[1], d[2], t[0] || 0, t[1] || 0, String(tz)).ms + (t[2] || 0) * 1000;
  }
  function moonInfo(ms, k) {
    var mo = C.lon('Mo', ms, k || kind()), n = Math.floor(mo / NAKW);
    return { lon: mo, nak: n, pada: Math.floor((mo % NAKW) / PADW) + 1, rasi: Math.floor(mo / 30) };
  }
  function rasiOf(n, pada) { return Math.floor((n * 4 + pada - 1) / 9); }
  function sunTimes(fromMs, lat, lon) {
    var o = new A.Observer(lat, lon, 0);
    var r = A.SearchRiseSet(A.Body.Sun, o, +1, A.MakeTime(new Date(fromMs)), 1.2);
    var s = r && A.SearchRiseSet(A.Body.Sun, o, -1, r, 1.2);
    var r2 = s && A.SearchRiseSet(A.Body.Sun, o, +1, s, 1.2);
    return r && s && r2 ? { rise: r.date.getTime(), set: s.date.getTime(), next: r2.date.getTime() } : null;
  }
  // When a planet changes sign, between two moments: [{sign, s, e}], each a stay in one sign.
  function signRuns(code, from, to, step, k) {
    var out = [], t = from, sg = Math.floor(C.lon(code, t, k) / 30), s = from;
    while (t < to) {
      var t2 = Math.min(t + step, to), g2 = Math.floor(C.lon(code, t2, k) / 30);
      if (g2 !== sg) {
        var a = t, b = t2;
        while (b - a > 600000) { var m = (a + b) / 2; if (Math.floor(C.lon(code, m, k) / 30) === sg) a = m; else b = m; }
        out.push({ sign: sg, s: s, e: b }); s = b; sg = g2;
      }
      t = t2;
    }
    out.push({ sign: sg, s: s, e: to, open: true });
    return out;
  }

  /* ---------- 1. Marriage matching (10 poruthams) ----------
     Counts run from the bride's star (or sign) to the groom's, both counted, as in Tamil almanacs. */
  var GANA = 'DMRMDMDDRRMMDRDRDRRMMDRRMMD'; // Deva, Manushya, Rakshasa, by star
  var GANA_N = { D: ['Deva', 'தேவ'], M: ['Manushya', 'மனித'], R: ['Rakshasa', 'ராட்சச'] };
  var YONI = [['horse', 'M'], ['elephant', 'M'], ['sheep', 'F'], ['serpent', 'M'], ['serpent', 'F'], ['dog', 'F'], ['cat', 'F'], ['sheep', 'M'], ['cat', 'M'], ['rat', 'M'], ['rat', 'F'], ['cow', 'M'], ['buffalo', 'F'], ['tiger', 'F'], ['buffalo', 'M'], ['tiger', 'M'], ['deer', 'F'], ['deer', 'M'], ['dog', 'M'], ['monkey', 'M'], ['mongoose', 'M'], ['monkey', 'F'], ['lion', 'F'], ['horse', 'F'], ['lion', 'M'], ['cow', 'F'], ['elephant', 'F']];
  var ANIMAL_TA = { horse: 'குதிரை', elephant: 'யானை', sheep: 'ஆடு', serpent: 'பாம்பு', dog: 'நாய்', cat: 'பூனை', rat: 'எலி', cow: 'பசு', buffalo: 'எருமை', tiger: 'புலி', deer: 'மான்', monkey: 'குரங்கு', mongoose: 'கீரி', lion: 'சிங்கம்' };
  var YONI_ENEMY = [['horse', 'buffalo'], ['elephant', 'lion'], ['sheep', 'monkey'], ['serpent', 'mongoose'], ['dog', 'deer'], ['cat', 'rat'], ['cow', 'tiger']];
  var RAJJU = [['Pada (feet)', 'பாத', [0, 8, 9, 17, 18, 26]], ['Ooru (thigh)', 'ஊரு', [1, 7, 10, 16, 19, 25]], ['Nabhi (navel)', 'நாபி', [2, 6, 11, 15, 20, 24]], ['Kanta (neck)', 'கண்ட', [3, 5, 12, 14, 21, 23]], ['Siro (head)', 'சிரசு', [4, 13, 22]]];
  var VEDHA = [[0, 17], [1, 16], [2, 15], [3, 14], [5, 21], [6, 20], [7, 19], [8, 18], [9, 26], [10, 25], [11, 24], [12, 23], [4, 22], [4, 13], [13, 22]];
  // Vasya, by the bride's sign (ePanchang's table; Prokerala's partial list agrees).
  var VASYA = [[4, 7], [3, 6], [5], [7, 8], [6], [2, 11], [9], [3, 5], [11], [0], [0], [9]];
  var DINA_GOOD = [2, 4, 6, 8, 9, 11, 13, 15, 18, 20, 24, 26];
  var SAME_STAR_GOOD = [3, 5, 9, 12, 15, 21, 25, 26]; // Rohini, Ardra, Magha, Hasta, Vishakha, Shravana, U.Bhadra, Revati
  var FRIEND = { Su: { f: 'Mo Ma Ju', e: 'Ve Sa' }, Mo: { f: 'Su Me', e: '' }, Ma: { f: 'Su Mo Ju', e: 'Me' }, Me: { f: 'Su Ve', e: 'Mo' }, Ju: { f: 'Su Mo Ma', e: 'Me Ve' }, Ve: { f: 'Me Sa', e: 'Su Mo' }, Sa: { f: 'Me Ve', e: 'Su Mo Ma' } };
  function rel(a, b) { if (a === b) return 'same'; return FRIEND[a].f.indexOf(b) >= 0 ? 'friend' : FRIEND[a].e.indexOf(b) >= 0 ? 'enemy' : 'neutral'; }
  function rajjuOf(n) { for (var i = 0; i < RAJJU.length; i++) if (RAJJU[i][2].indexOf(n) >= 0) return i; return -1; }

  // g, b: {nak 0-26, rasi 0-11}. Returns [{key, en, ta, res: 'good'|'avg'|'no', why}] and a verdict.
  function match(g, b) {
    var n = ((b.nak - g.nak + 27) % 27) + 1, r = ((b.rasi - g.rasi + 12) % 12) + 1, out = [];
    function add(key, en, ta, res, whyEn, whyTa) { out.push({ key: key, en: en, ta: ta, res: res, whyEn: whyEn, whyTa: whyTa }); }
    var same = g.nak === b.nak;
    add('dina', 'Dina', 'தினம்', same ? (SAME_STAR_GOOD.indexOf(g.nak) >= 0 ? 'good' : 'no') : DINA_GOOD.indexOf(n) >= 0 ? 'good' : 'no',
      same ? 'Both have the same star; it agrees only for Rohini, Ardra, Magha, Hasta, Vishakha, Shravana, Uttara Bhadrapada and Revati.' : 'The groom’s star is the ' + ord(n) + ' from the bride’s; it agrees for 2, 4, 6, 8, 9, 11, 13, 15, 18, 20, 24 and 26.',
      same ? 'இருவருக்கும் ஒரே நட்சத்திரம்; ரோகிணி, திருவாதிரை, மகம், அஸ்தம், விசாகம், திருவோணம், உத்திரட்டாதி, ரேவதிக்கு மட்டும் பொருந்தும்.' : 'பெண் நட்சத்திரத்திலிருந்து ஆண் நட்சத்திரம் ' + n + '-ஆவது; 2, 4, 6, 8, 9, 11, 13, 15, 18, 20, 24, 26 என்றால் பொருந்தும்.');
    var gg = GANA[g.nak], bg = GANA[b.nak];
    add('gana', 'Gana', 'கணம்', gg === bg ? 'good' : (gg !== 'R' && bg !== 'R') ? 'avg' : 'no',
      'Bride ' + GANA_N[gg][0] + ', groom ' + GANA_N[bg][0] + '. The same gana is best; Deva with Manushya agrees; Rakshasa with another gana does not.',
      'பெண் ' + GANA_N[gg][1] + ' கணம், ஆண் ' + GANA_N[bg][1] + ' கணம். ஒரே கணம் உத்தமம்; தேவ-மனித பொருந்தும்; ராட்சசத்துடன் மற்ற கணம் பொருந்தாது.');
    add('mahendra', 'Mahendra', 'மகேந்திரம்', [4, 7, 10, 13, 16, 19, 22, 25].indexOf(n) >= 0 ? 'good' : 'no',
      'Count ' + n + '; it agrees for 4, 7, 10, 13, 16, 19, 22 and 25.', 'எண்ணிக்கை ' + n + '; 4, 7, 10, 13, 16, 19, 22, 25 என்றால் பொருந்தும்.');
    add('stree', 'Stree Deergha', 'ஸ்திரீ தீர்க்கம்', n > 13 ? 'good' : n > 7 ? 'avg' : 'no',
      'Count ' + n + '. More than 13 is good, 8 to 13 is average, 7 or less does not agree.', 'எண்ணிக்கை ' + n + '. 13-க்கு மேல் உத்தமம், 8 முதல் 13 மத்திமம், 7 அல்லது குறைவு பொருந்தாது.');
    var ya = YONI[g.nak], yb = YONI[b.nak], enemy = YONI_ENEMY.some(function (p) { return (p[0] === ya[0] && p[1] === yb[0]) || (p[1] === ya[0] && p[0] === yb[0]); });
    add('yoni', 'Yoni', 'யோனி', enemy ? 'no' : ya[0] === yb[0] || (yb[1] === 'M' && ya[1] === 'F') ? 'good' : 'avg',
      'Bride ' + ya[0] + ', groom ' + yb[0] + '. ' + (enemy ? 'These animals are enemies.' : ya[0] === yb[0] ? 'The same animal agrees best.' : 'Not enemies.'),
      'பெண் ' + ANIMAL_TA[ya[0]] + ', ஆண் ' + ANIMAL_TA[yb[0]] + '. ' + (enemy ? 'இவை பகை விலங்குகள்.' : ya[0] === yb[0] ? 'ஒரே விலங்கு உத்தமம்.' : 'பகை இல்லை.'));
    add('rasi', 'Rasi', 'ராசி', [2, 6, 8, 12].indexOf(r) >= 0 ? 'no' : 'good',
      'The groom’s sign is the ' + ord(r) + ' from the bride’s. 2nd/12th and 6th/8th do not agree (some almanacs allow 6/8 when the sign lords are friends).',
      'பெண் ராசியிலிருந்து ஆண் ராசி ' + r + '-ஆவது. 2/12, 6/8 பொருந்தாது (ராசி அதிபதிகள் நட்பானால் 6/8-ஐ சில பஞ்சாங்கங்கள் ஏற்கின்றன).');
    var la = C.SIGNS[g.rasi][1], lb = C.SIGNS[b.rasi][1], r1 = rel(la, lb), r2 = rel(lb, la);
    var ra = r1 === 'same' || (r1 === 'friend' && r2 === 'friend') ? 'good' : (r1 === 'enemy' || r2 === 'enemy') ? 'no' : 'avg';
    add('lord', 'Rasi Adhipathi', 'ராசி அதிபதி', ra,
      'Sign lords ' + C.NAME[la] + ' and ' + C.NAME[lb] + ': ' + (r1 === 'same' ? 'the same planet' : r1 + ' / ' + r2) + '.',
      'ராசி அதிபதிகள் ' + C.TA[la] + ', ' + C.TA[lb] + ': ' + (r1 === 'same' ? 'ஒரே கிரகம்' : ({ friend: 'நட்பு', enemy: 'பகை', neutral: 'சமம்' }[r1] + ' / ' + { friend: 'நட்பு', enemy: 'பகை', neutral: 'சமம்' }[r2])) + '.');
    var va = VASYA[g.rasi].indexOf(b.rasi) >= 0 ? 'good' : VASYA[b.rasi].indexOf(g.rasi) >= 0 ? 'avg' : 'no';
    add('vasya', 'Vasya', 'வசியம்', va, va === 'good' ? 'The groom’s sign is vasya to the bride’s.' : va === 'avg' ? 'The bride’s sign is vasya to the groom’s.' : 'Neither sign is vasya to the other.',
      va === 'good' ? 'ஆண் ராசி பெண் ராசிக்கு வசியம்.' : va === 'avg' ? 'பெண் ராசி ஆண் ராசிக்கு வசியம்.' : 'இரு ராசிகளும் ஒன்றுக்கொன்று வசியமில்லை.');
    var ja = rajjuOf(g.nak), jb = rajjuOf(b.nak);
    add('rajju', 'Rajju', 'ரஜ்ஜு', ja === jb ? 'no' : 'good', ja === jb ? 'Both stars are ' + RAJJU[ja][0] + ' rajju: Rajju dosham.' : 'Bride ' + RAJJU[ja][0] + ', groom ' + RAJJU[jb][0] + ' rajju.',
      ja === jb ? 'இருவரும் ' + RAJJU[ja][1] + ' ரஜ்ஜு: ரஜ்ஜு தோஷம்.' : 'பெண் ' + RAJJU[ja][1] + ', ஆண் ' + RAJJU[jb][1] + ' ரஜ்ஜு.');
    var vd = VEDHA.some(function (p) { return (p[0] === g.nak && p[1] === b.nak) || (p[1] === g.nak && p[0] === b.nak); });
    add('vedha', 'Vedha', 'வேதை', vd ? 'no' : 'good', vd ? 'These two stars obstruct each other (vedha).' : 'The stars do not obstruct each other.', vd ? 'இந்த இரு நட்சத்திரங்களும் வேதை.' : 'நட்சத்திரங்கள் வேதையில்லை.');
    var score = out.filter(function (x) { return x.res !== 'no'; }).length;
    var block = out.filter(function (x) { return (x.key === 'rajju' || x.key === 'vedha') && x.res === 'no'; });
    var verdict = block.length ? 'block' : score >= 7 ? 'good' : score >= 5 ? 'ok' : 'weak';
    return { list: out, score: score, verdict: verdict, count: n };
  }
  // Chevvai (Mars) dosham from a full birth chart: Mars in the 2nd, 4th, 7th, 8th or 12th from the
  // ascendant or the Moon. Mars in Aries, Scorpio (own) or Capricorn (exalted) cancels it, as most
  // Tamil almanacs say; other exceptions vary and are not applied.
  function chevvai(ms, lat, lon, k) {
    var asc = Math.floor(C.sidAsc(ms, lat, lon, k) / 30), ma = Math.floor(C.lon('Ma', ms, k) / 30), mo = Math.floor(C.lon('Mo', ms, k) / 30);
    var hL = ((ma - asc + 12) % 12) + 1, hM = ((ma - mo + 12) % 12) + 1, bad = [2, 4, 7, 8, 12];
    var has = bad.indexOf(hL) >= 0 || bad.indexOf(hM) >= 0, cancel = has && [0, 7, 9].indexOf(ma) >= 0;
    return { fromLagna: hL, fromMoon: hM, has: has && !cancel, cancelled: cancel, marsSign: ma };
  }

  /* ---------- 2. Gowri Panchangam ----------
     Sunrise to sunset and sunset to the next sunrise are each cut into eight equal parts. The order of
     the eight Gowris for each weekday is Drik Panchang's (read for 15-21 Nov 2026). */
  var GOWRI = { U: ['Uthi', 'உத்தி', 'good'], A: ['Amirdha', 'அமிர்தம்', 'best'], R: ['Rogam', 'ரோகம்', 'bad'], L: ['Laabam', 'லாபம்', 'good'], D: ['Dhanam', 'தனம்', 'good'], S: ['Sugam', 'சுகம்', 'good'], C: ['Soram', 'சோரம்', 'bad'], V: ['Visham', 'விஷம்', 'bad'] };
  var GOWRI_DAY = ['UARLDSCV', 'AVRLDSCU', 'RLDSCUVA', 'LDSCVUAR', 'DSCUAVRL', 'SCUVARLD', 'CUVARLDS'];
  var GOWRI_NIGHT = ['DSCVUARL', 'SCUAVRLD', 'CUVARLDS', 'UARLDSCV', 'AVRLDSCU', 'RLDSCUVA', 'LDSCVUAR'];
  function gowri(iso, place) {
    var tz = place.tz, from = midnight(iso, tz), st = sunTimes(from, place.lat, place.lon);
    if (!st) return null;
    var wd = parts(st.rise, tz).wd, dl = (st.set - st.rise) / 8, nl = (st.next - st.set) / 8, day = [], night = [];
    for (var i = 0; i < 8; i++) {
      day.push({ k: GOWRI_DAY[wd][i], s: st.rise + i * dl, e: st.rise + (i + 1) * dl });
      night.push({ k: GOWRI_NIGHT[wd][i], s: st.set + i * nl, e: st.set + (i + 1) * nl });
    }
    // Rahu kalam, Yamagandam and Gulikai: the engine's own eighths of the day.
    var part = function (p) { return [st.rise + (p - 1) * dl, st.rise + p * dl]; };
    return { wd: wd, rise: st.rise, set: st.set, next: st.next, day: day, night: night,
      rahu: part([8, 2, 7, 5, 6, 4, 3][wd]), yama: part([5, 4, 3, 2, 1, 7, 6][wd]), guli: part([7, 6, 5, 4, 3, 2, 1][wd]) };
  }

  /* ---------- 3. Sade Sati, Ashtama Sani and Guru transit ---------- */
  function saturnStudy(moonRasi, now, k) {
    var from = now - 32 * 365.25 * DAY, to = now + 32 * 365.25 * DAY;
    var runs = signRuns('Sa', from, to, 5 * DAY, k);
    function blocks(set) { // consecutive stays in any of these signs, counted from the Moon sign
      var out = [], cur = null;
      runs.forEach(function (x) {
        var h = ((x.sign - moonRasi + 12) % 12) + 1;
        if (set.indexOf(h) >= 0) {
          if (!cur) cur = { s: x.s, e: x.e, phases: [] };
          cur.e = x.e; if (!cur.phases.some(function (p) { return p.h === h; })) cur.phases.push({ h: h, s: x.s });
        } else if (cur) { out.push(cur); cur = null; }
      });
      if (cur) out.push(cur);
      // A retrograde step back (Saturn leaves the signs and returns within about a year) is part of the
      // same period: join them, and note the return.
      var joined = [];
      out.forEach(function (b) {
        var last = joined[joined.length - 1];
        if (last && b.s - last.e < 400 * DAY) {
          last.returns = (last.returns || []).concat([{ s: last.e, e: b.s }]); last.e = b.e;
          b.phases.forEach(function (p) { if (!last.phases.some(function (q) { return q.h === p.h; })) last.phases.push(p); });
        } else joined.push(b);
      });
      return joined.filter(function (b) { return b.s > from + DAY && b.e < to - DAY; });
    }
    var satNow = Math.floor(C.lon('Sa', now, k) / 30), jupNow = Math.floor(C.lon('Ju', now, k) / 30);
    var jr = signRuns('Ju', now, now + 2 * 365.25 * DAY, 3 * DAY, k);
    return { sadeSati: blocks([12, 1, 2]), ashtama: blocks([8]), kantaka: blocks([7]), ardha: blocks([4]),
      satHouse: ((satNow - moonRasi + 12) % 12) + 1, satSign: satNow, jupSign: jupNow,
      jupHouse: ((jupNow - moonRasi + 12) % 12) + 1, jupNext: jr.length > 1 ? jr[1] : null,
      satNext: runs.filter(function (x) { return x.s > now; })[0] || null };
  }

  /* ---------- 4. Transits from the Moon sign (gochara) ---------- */
  var GOCHARA_GOOD = { Su: [3, 6, 10, 11], Mo: [1, 3, 6, 7, 10, 11], Ma: [3, 6, 11], Me: [2, 4, 6, 8, 10, 11], Ju: [2, 5, 7, 9, 11], Ve: [1, 2, 3, 4, 5, 8, 9, 11, 12], Sa: [3, 6, 11], Ra: [3, 6, 11], Ke: [3, 6, 11] };
  var TARA = [['Janma', 'ஜன்ம', 'mixed'], ['Sampat', 'சம்பத்', 'good'], ['Vipat', 'விபத்', 'bad'], ['Kshema', 'க்ஷேம', 'good'], ['Pratyak', 'பிரத்யக்', 'bad'], ['Sadhana', 'சாதக', 'good'], ['Naidhana', 'நைதன', 'bad'], ['Mitra', 'மித்ர', 'good'], ['Parama Mitra', 'பரம மித்ர', 'good']];
  function tara(birthNak, nowNak) { var c = ((nowNak - birthNak + 27) % 27) + 1; return { count: c, i: (c - 1) % 9 }; }
  function transits(birth, ms, k) {
    var mo = moonInfo(ms, k), list = C.planets(ms, k).map(function (p) {
      var sg = Math.floor(p.lon / 30), h = ((sg - birth.rasi + 12) % 12) + 1;
      return { c: p.c, sign: sg, house: h, retro: p.retro && p.c !== 'Ra' && p.c !== 'Ke', good: GOCHARA_GOOD[p.c].indexOf(h) >= 0 };
    });
    var t = tara(birth.nak, mo.nak), mh = ((mo.rasi - birth.rasi + 12) % 12) + 1;
    return { moon: mo, tara: t, moonHouse: mh, chandrashtama: mh === 8, chandraBala: [1, 3, 6, 7, 10, 11].indexOf(mh) >= 0, list: list };
  }
  function nextChandrashtama(birthRasi, from, k) {
    var target = (birthRasi + 7) % 12, runs = signRuns('Mo', from, from + 31 * DAY, 2 * HOUR, k);
    for (var i = 0; i < runs.length; i++) if (runs[i].sign === target) return runs[i];
    return null;
  }

  /* ---------- 5. KP birth time rectification (ruling planets) ----------
     The ruling planets at the moment of judgment (ascendant sign, star and sub lords, Moon sign and star
     lords, and the day lord, whose day starts at sunrise) are compared with the ascendant's sign, star and
     sub lords for each minute of the birth window. The sub whose lords agree best is the likely one. */
  function rulingPlanets(ms, place, k) {
    var a = C.SEGS[C.findSeg(C.sidAsc(ms, place.lat, place.lon, k))], m = C.SEGS[C.findSeg(C.lon('Mo', ms, k))];
    var p = parts(ms, place.tz), st = sunTimes(midnight(p.y + '-' + p2(p.m) + '-' + p2(p.d), place.tz), place.lat, place.lon);
    var wd = st && ms < st.rise ? (p.wd + 6) % 7 : p.wd;
    return { ascSign: a.lord, ascStar: a.star, ascSub: a.sub, moonSign: m.lord, moonStar: m.star, day: WD_LORD[wd] };
  }
  function rectify(center, mins, place, rp, k) {
    var set = {}; ['ascSign', 'ascStar', 'ascSub', 'moonSign', 'moonStar', 'day'].forEach(function (x) { set[rp[x]] = 1; });
    var rows = [], cur = null;
    for (var t = center - mins * 60000; t <= center + mins * 60000; t += 30000) {
      var i = C.findSeg(C.sidAsc(t, place.lat, place.lon, k));
      if (!cur || cur.k !== i) { if (cur) rows.push(cur); cur = { k: i, s: t, e: t }; } else cur.e = t;
    }
    if (cur) rows.push(cur);
    rows.forEach(function (r) {
      var g = C.SEGS[r.k]; r.sign = g.lord; r.star = g.star; r.sub = g.sub; r.ascSign = g.sign;
      r.score = (set[g.sub] ? 3 : 0) + (set[g.star] ? 2 : 0) + (set[g.lord] ? 1 : 0);
      r.mid = (r.s + r.e) / 2;
    });
    var best = rows.slice().sort(function (a, b) { return b.score - a.score || Math.abs(a.mid - center) - Math.abs(b.mid - center); })[0];
    return { rows: rows, best: best, set: Object.keys(set) };
  }

  /* ---------- 6. Dasha timeline ---------- */
  function dashaNow(d, now) {
    var m = d.list.filter(function (x) { return now >= x.s && now < x.e; })[0], b = m && m.ant.filter(function (x) { return now >= x.s && now < x.e; })[0], a = b && b.pr.filter(function (x) { return now >= x.s && now < x.e; })[0];
    return { maha: m, bhukti: b, antara: a };
  }

  window.GA_RVTOOLS = { match: match, chevvai: chevvai, gowri: gowri, saturnStudy: saturnStudy, transits: transits, tara: tara, nextChandrashtama: nextChandrashtama,
    rulingPlanets: rulingPlanets, rectify: rectify, dashaNow: dashaNow, moonInfo: moonInfo, rasiOf: rasiOf, birthMs: birthMs, signRuns: signRuns };

  /* ================= pages ================= */
  var X_SVG = '<svg viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12"/></svg>';
  var tools = [];
  function sel(id, opts, val) { return '<select id="' + id + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'; }
  function cell(id, en, ta, input) { return '<label class="cell" for="' + id + '"><span class="cl">' + T(en, ta) + '</span>' + input + '</label>'; }
  function starOpts() { return C.NAKS.map(function (n, i) { return [i, nak(i)]; }); }
  function padaOpts() { return [1, 2, 3, 4].map(function (p) { return [p, S('Pada ', 'பாதம் ') + p]; }); }
  function peopleOpts(none) {
    var l = saved();
    return [['', l.length ? S(none || 'Choose a saved person…', 'சேமித்த நபரைத் தேர்ந்தெடுங்கள்…') : S('No saved people yet (save one in Birth Chart)', 'சேமித்த நபர்கள் இல்லை (பிறப்பு ஜாதகத்தில் சேமியுங்கள்)')]]
      .concat(l.map(function (r, i) { return [i, (r.name || S('Unnamed', 'பெயரில்லை')) + ' · ' + r.date + ' ' + String(r.time || '').slice(0, 5)]; }));
  }
  var RES = { good: ['Agrees', 'பொருந்தும்', 'good'], best: ['Best', 'உத்தமம்', 'good'], avg: ['Average', 'மத்திமம்', 'avg'], mixed: ['Mixed', 'கலப்பு', 'avg'],
    no: ['Does not agree', 'பொருந்தாது', 'bad'], bad: ['Avoid', 'தவிர்க்கவும்', 'bad'], fine: ['Good', 'நல்லது', 'good'], fav: ['Favourable', 'சாதகம்', 'good'],
    unfav: ['Unfavourable', 'சாதகமில்லை', 'bad'], dosham: ['Chevvai dosham', 'செவ்வாய் தோஷம்', 'bad'], free: ['No dosham', 'தோஷம் இல்லை', 'good'],
    cancel: ['Cancelled (Mars in its own or exalted sign)', 'நீங்கியது (செவ்வாய் ஆட்சி/உச்சம்)', 'good'] };
  function res(r) {
    var m = RES[r];
    return '<span class="rvt-res rvt-' + m[2] + '">' + (m[2] === 'good' ? '✓ ' : m[2] === 'bad' ? '✗ ' : '◐ ') + S(m[0], m[1]) + '</span>';
  }
  function table(head, rows, cls) {
    return '<div class="tblw"><table class="rvt-tbl' + (cls ? ' ' + cls : '') + '"><thead><tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
  }
  function note(en, ta) { return '<p class="rvt-note">' + B(en, ta) + '</p>'; }
  function msg(t, text, isErr) { var m = $(t.p + 'Msg'); if (m) { m.className = 'msg' + (isErr ? ' err' : ''); m.innerHTML = text || ''; } }

  // Birth details: a saved person, or date, time and place (the home place is filled in).
  function birthForm(p, opt) {
    var h = home();
    return '<div class="group">' + cell(p + 'Who', 'Saved person', 'சேமித்த நபர்', sel(p + 'Who', peopleOpts())) + '</div>' +
      '<div class="group">' + cell(p + 'Date', 'Date of birth', 'பிறந்த தேதி', '<input type="date" id="' + p + 'Date">') +
      cell(p + 'Time', 'Time of birth', 'பிறந்த நேரம்', '<input type="time" step="1" id="' + p + 'Time" value="' + (opt && opt.time || '') + '">') + '</div>' +
      '<details class="rvt-place"><summary>' + T('Place of birth', 'பிறந்த இடம்') + ': <span id="' + p + 'PlaceName">' + esc(h.name || '') + '</span></summary><div class="group">' +
      cell(p + 'Lat', 'Latitude', 'அட்சரேகை', '<input type="number" step="0.0001" id="' + p + 'Lat" value="' + h.lat + '">') +
      cell(p + 'Lon', 'Longitude', 'தீர்க்கரேகை', '<input type="number" step="0.0001" id="' + p + 'Lon" value="' + h.lon + '">') +
      cell(p + 'Tz', 'Time zone', 'நேர மண்டலம்', '<input type="text" id="' + p + 'Tz" value="' + esc(h.tz) + '" placeholder="Asia/Kolkata or 5.5">') + '</div>' +
      note('Your home place is filled in. A saved person fills in their own place.', 'உங்கள் வீட்டு இடம் நிரப்பப்பட்டுள்ளது. சேமித்த நபரைத் தேர்ந்தால் அவரது இடம் நிரம்பும்.') + '</details>';
  }
  function wireBirth(p) {
    var w = $(p + 'Who'); if (!w) return;
    w.addEventListener('focus', function () { var v = w.value; w.innerHTML = sel('x', peopleOpts(), v).replace(/^<select id="x">|<\/select>$/g, ''); });
    w.addEventListener('change', function () {
      var r = saved()[+w.value]; if (!r) return;
      $(p + 'Date').value = r.date || ''; $(p + 'Time').value = String(r.time || '').slice(0, 8);
      $(p + 'Lat').value = r.lat; $(p + 'Lon').value = r.lon; $(p + 'Tz').value = r.tz;
      $(p + 'PlaceName').textContent = r.place || (r.lat + ', ' + r.lon);
    });
  }
  function readBirth(p) {
    var ms = birthMs($(p + 'Date').value, $(p + 'Time').value || '12:00', $(p + 'Tz').value.trim());
    var lat = parseFloat($(p + 'Lat').value), lon = parseFloat($(p + 'Lon').value), tz = $(p + 'Tz').value.trim();
    if (!isFinite(ms)) return { err: S('Enter the date of birth, or choose a saved person.', 'பிறந்த தேதியை உள்ளிடுங்கள், அல்லது சேமித்த நபரைத் தேர்ந்தெடுங்கள்.') };
    if (!isFinite(lat) || !isFinite(lon) || !tz) return { err: S('Enter the place of birth: latitude, longitude and time zone.', 'பிறந்த இடத்தை உள்ளிடுங்கள்: அட்சரேகை, தீர்க்கரேகை, நேர மண்டலம்.') };
    var who = saved()[+$(p + 'Who').value];
    return { ms: ms, lat: lat, lon: lon, tz: tz, name: who && who.name, timeGiven: !!$(p + 'Time').value };
  }
  // Star-and-pada, or a saved person (whose Moon gives the star): for tools that need only the Moon.
  function moonForm(p) {
    return '<div class="group">' + cell(p + 'Who', 'Saved person', 'சேமித்த நபர்', sel(p + 'Who', peopleOpts())) + '</div>' +
      '<div class="group">' + cell(p + 'Nak', 'Birth star', 'ஜன்ம நட்சத்திரம்', sel(p + 'Nak', starOpts(), 0)) + cell(p + 'Pada', 'Pada', 'பாதம்', sel(p + 'Pada', padaOpts(), 1)) +
      '<span class="cell rvt-derived"><span class="cl">' + T('Moon sign', 'ராசி') + '</span><b id="' + p + 'Rasi"></b></span></div>';
  }
  function wireMoon(p) {
    var w = $(p + 'Who'), n = $(p + 'Nak'), pa = $(p + 'Pada'), out = $(p + 'Rasi');
    function show() { out.textContent = sign(rasiOf(+n.value, +pa.value)); }
    n.addEventListener('change', show); pa.addEventListener('change', show); show();
    w.addEventListener('focus', function () { var v = w.value; w.innerHTML = sel('x', peopleOpts(), v).replace(/^<select id="x">|<\/select>$/g, ''); });
    w.addEventListener('change', function () {
      var r = saved()[+w.value]; if (!r) return;
      var ms = birthMs(r.date, r.time, r.tz); if (!isFinite(ms)) return;
      var m = moonInfo(ms, r.ayan || kind()); n.value = m.nak; pa.value = m.pada; show();
    });
  }
  function readMoon(p) {
    var w = $(p + 'Who'), r = saved()[+w.value], n = +$(p + 'Nak').value, pa = +$(p + 'Pada').value, full = null;
    if (r) { var ms = birthMs(r.date, r.time, r.tz); if (isFinite(ms)) full = { ms: ms, lat: +r.lat, lon: +r.lon, tz: r.tz, name: r.name, ayan: r.ayan }; }
    return { nak: n, pada: pa, rasi: rasiOf(n, pa), full: full, name: r && r.name };
  }

  function makeTool(t) {
    var btn = document.createElement('button');
    btn.type = 'button'; btn.id = t.p + 'Btn'; btn.className = 'tool'; btn.dataset.s = t.search;
    btn.innerHTML = '<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + t.icon + '</svg></span><span class="tx">' + t.en + '<span class="tm">' + t.ta + '</span></span>';
    grid.appendChild(btn);
    var panel = document.createElement('div');
    panel.className = 'panel sheet hide rvt'; panel.id = t.p + 'Panel';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', t.p + 'T');
    anchor.parentNode.appendChild(panel);
    t.panel = panel; t.ran = false;
    function head() {
      return '<div class="sh-head"><div><h2 id="' + t.p + 'T">' + S(t.en, t.ta) + '</h2>' + (lg() === 'bi' ? '<span class="tt">' + t.ta + '</span>' : '') + '</div>' +
        '<button class="xbtn" id="' + t.p + 'Close" type="button" aria-label="' + S('Close', 'மூடு') + '">' + X_SVG + '</button></div>';
    }
    t.render = function () {
      // Keep what was entered across a language change.
      var keep = {}; panel.querySelectorAll('input,select').forEach(function (e) { if (e.id) keep[e.id] = e.type === 'checkbox' ? e.checked : e.value; });
      var openDetails = {}; panel.querySelectorAll('details[id]').forEach(function (d) { openDetails[d.id] = d.open; });
      panel.innerHTML = head() + '<details class="howto"><summary>' + T('How It Works', 'இது எப்படி செயல்படுகிறது') + '</summary>' + t.how() + '</details>' +
        t.form() + '<div class="btns"><button class="primary" id="' + t.p + 'Go" type="button">' + S(t.go[0], t.go[1]) + '</button></div>' +
        '<div class="msg" id="' + t.p + 'Msg" role="status"></div><div id="' + t.p + 'Out" class="rvt-out"></div>';
      Object.keys(keep).forEach(function (id) { var e = $(id); if (e) { if (e.type === 'checkbox') e.checked = keep[id]; else if (keep[id] !== '' || e.tagName === 'SELECT') e.value = keep[id]; } });
      Object.keys(openDetails).forEach(function (id) { var d = $(id); if (d) d.open = openDetails[id]; });
      $(t.p + 'Close').addEventListener('click', function () { panel.classList.add('hide'); });
      $(t.p + 'Go').addEventListener('click', function () { t.ran = true; go(); });
      if (t.wire) t.wire();
      if (t.ran) go();
    };
    function go() {
      msg(t, ''); var out = $(t.p + 'Out');
      try { out.innerHTML = t.run() || ''; }
      catch (e) { out.innerHTML = ''; msg(t, S('Could not work this out: ', 'கணிக்க முடியவில்லை: ') + esc(e.message), true); if (window.rvReport) rvReport(e, 'tools ' + t.p); }
    }
    t.go_ = go;
    btn.addEventListener('click', function () {
      panel.classList.remove('hide');
      if (!t.ran && t.auto) { t.ran = true; go(); }
    });
    tools.push(t);
    t.render();
  }

  /* ----- Marriage Matching ----- */
  makeTool({
    p: 'rvMt', en: 'Marriage Matching', ta: 'திருமணப் பொருத்தம்', go: ['Check the 10 poruthams', '10 பொருத்தம் பார்'],
    search: 'Marriage matching porutham 10 poruthams kalyana porutham horoscope match rajju vedha chevvai dosham mangal dosha jathaka porutham திருமணப் பொருத்தம் ஜாதகப் பொருத்தம்',
    icon: '<path d="M8.5 9.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM15.5 9.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/><path d="M12 5.5l1.2-1.5h-2.4z"/>',
    how: function () {
      return '<p class="legend">' + B('Choose the birth star and pada of the bride and the groom, or a saved person each (their Moon gives the star). The ten traditional poruthams are counted from the bride’s star and sign to the groom’s. Rajju and Vedha are deciding: if either does not agree, the match is not recommended whatever the total. When both people come from saved birth details, Chevvai (Mars) dosham is checked too. Schools differ on a few rules (for example 6/8 signs with friendly lords); the rule used is stated in each row.',
        'மணமகள், மணமகனின் ஜன்ம நட்சத்திரம், பாதத்தைத் தேர்ந்தெடுங்கள், அல்லது சேமித்த நபரைத் தேர்ந்தெடுங்கள். பத்து பொருத்தங்களும் பெண் நட்சத்திரம், ராசியிலிருந்து ஆண் நட்சத்திரம், ராசி வரை எண்ணப்படும். ரஜ்ஜு, வேதை முக்கியமானவை: இவற்றில் ஒன்று பொருந்தாவிட்டால் மொத்தம் எதுவாயினும் பரிந்துரைக்கப்படாது. இருவரும் சேமித்த பிறப்பு விவரங்களிலிருந்து வந்தால் செவ்வாய் தோஷமும் பார்க்கப்படும்.') + '</p>';
    },
    form: function () {
      return '<div class="rvt-two"><section><h3>' + T('Bride', 'மணமகள்') + '</h3>' + moonForm('rvMtG') + '</section><section><h3>' + T('Groom', 'மணமகன்') + '</h3>' + moonForm('rvMtB') + '</section></div>';
    },
    wire: function () { wireMoon('rvMtG'); wireMoon('rvMtB'); },
    run: function () {
      var g = readMoon('rvMtG'), b = readMoon('rvMtB'), m = match(g, b);
      var head = [S('Porutham', 'பொருத்தம்'), S('Result', 'முடிவு'), S('Why', 'காரணம்')];
      var rows = m.list.map(function (x) { return '<tr' + ((x.key === 'rajju' || x.key === 'vedha') ? ' class="rvt-key"' : '') + '><td><b>' + T(x.en, x.ta) + '</b></td><td>' + res(x.res) + '</td><td>' + esc(S(x.whyEn, x.whyTa)) + '</td></tr>'; });
      var V = { block: ['Not recommended: ' + m.list.filter(function (x) { return (x.key === 'rajju' || x.key === 'vedha') && x.res === 'no'; }).map(function (x) { return x.en; }).join(' and ') + ' does not agree.', 'பரிந்துரைக்கப்படவில்லை: ' + m.list.filter(function (x) { return (x.key === 'rajju' || x.key === 'vedha') && x.res === 'no'; }).map(function (x) { return x.ta; }).join(', ') + ' பொருந்தவில்லை.', 'bad'],
        good: ['A good match.', 'நல்ல பொருத்தம்.', 'good'], ok: ['An acceptable match.', 'ஏற்கத்தக்க பொருத்தம்.', 'avg'], weak: ['A weak match.', 'பொருத்தம் குறைவு.', 'bad'] }[m.verdict];
      var who = function (x, en, ta) { return esc(x.name || S(en, ta)) + ': ' + nak(x.nak) + ' ' + S('pada', 'பாதம்') + ' ' + x.pada + ', ' + sign(x.rasi); };
      var h = '<div class="rvt-card rvt-score rvt-' + V[2] + '"><div class="rvt-big">' + m.score + '<small>/10</small></div><div><b>' + B(V[0], V[1]) + '</b><p>' + who(g, 'Bride', 'மணமகள்') + '<br>' + who(b, 'Groom', 'மணமகன்') + '</p></div></div>';
      h += table(head, rows);
      if (g.full && b.full) {
        var cg = chevvai(g.full.ms, g.full.lat, g.full.lon, g.full.ayan || kind()), cb = chevvai(b.full.ms, b.full.lat, b.full.lon, b.full.ayan || kind());
        var line = function (c, en, ta) { return '<li>' + T(en, ta) + ': ' + res(c.has ? 'dosham' : c.cancelled ? 'cancel' : 'free') + ' · ' + S('Mars in the ', 'செவ்வாய் லக்னத்திலிருந்து ') + S(ord(c.fromLagna) + ' from the ascendant and the ' + ord(c.fromMoon) + ' from the Moon', c.fromLagna + '-ஆம், சந்திரனிலிருந்து ' + c.fromMoon + '-ஆம் வீட்டில்') + '</li>'; };
        var bal = cg.has === cb.has;
        h += '<h3>' + T('Chevvai (Mars) dosham', 'செவ்வாய் தோஷம்') + '</h3><ul class="rvt-list">' + line(cg, 'Bride', 'மணமகள்') + line(cb, 'Groom', 'மணமகன்') + '</ul>' +
          note(bal ? (cg.has ? 'Both have Chevvai dosham, so it balances out.' : 'Neither has Chevvai dosham.') : 'Only one has Chevvai dosham: most almanacs advise caution or a matching partner.',
            bal ? (cg.has ? 'இருவருக்கும் செவ்வாய் தோஷம் உள்ளதால் சமமாகிறது.' : 'இருவருக்கும் செவ்வாய் தோஷம் இல்லை.') : 'ஒருவருக்கு மட்டும் செவ்வாய் தோஷம்: பெரும்பாலான பஞ்சாங்கங்கள் கவனம் தேவை என்கின்றன.');
      } else h += note('For Chevvai (Mars) dosham, choose both people from saved birth details.', 'செவ்வாய் தோஷம் பார்க்க, இருவரையும் சேமித்த பிறப்பு விவரங்களிலிருந்து தேர்ந்தெடுங்கள்.');
      return h + note('Matching is a traditional guide. Families also weigh the full charts and the dasha periods.', 'பொருத்தம் ஒரு பாரம்பரிய வழிகாட்டி. முழு ஜாதகமும் தசா காலங்களும் சேர்த்துப் பார்க்கப்படும்.');
    }
  });

  /* ----- Gowri Panchangam ----- */
  makeTool({
    p: 'rvGw', en: 'Gowri Panchangam', ta: 'கௌரி பஞ்சாங்கம்', go: ['Show Gowri timings', 'கௌரி நேரங்களைக் காட்டு'], auto: true,
    search: 'Gowri panchangam nalla neram good time today gowri nalla neram rahu kalam yamagandam kuligai கௌரி நல்ல நேரம் இன்று',
    icon: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17M3.5 12h17"/><path d="M6 6l12 12M18 6L6 18" stroke-opacity=".45"/>',
    how: function () {
      return '<p class="legend">' + B('The day from sunrise to sunset, and the night from sunset to the next sunrise, are each cut into eight equal parts, each ruled by a Gowri. Amirdha, Uthi, Laabam, Dhanam and Sugam are good (Nalla Neram); Rogam, Soram and Visham are avoided. The order for each weekday follows Drik Panchang. Sunrise and sunset are for your home place (change it in Settings). Rahu kalam, Yamagandam and Gulikai are shown too.',
        'சூரிய உதயம் முதல் அஸ்தமனம் வரை பகலும், அஸ்தமனம் முதல் மறுநாள் உதயம் வரை இரவும் தலா எட்டு சம பாகங்களாகப் பிரிக்கப்படுகின்றன. அமிர்தம், உத்தி, லாபம், தனம், சுகம் நல்ல நேரம்; ரோகம், சோரம், விஷம் தவிர்க்கப்படும். ஒவ்வொரு கிழமைக்குமான வரிசை திருக் பஞ்சாங்கப்படி. உதயம், அஸ்தமனம் உங்கள் வீட்டு இடத்திற்கு (அமைப்புகளில் மாற்றலாம்). ராகு காலம், எமகண்டம், குளிகையும் காட்டப்படும்.') + '</p>';
    },
    form: function () {
      var h = home();
      return '<div class="group">' + cell('rvGwDate', 'Date', 'தேதி', '<input type="date" id="rvGwDate" value="' + isoDay(Date.now(), h.tz) + '">') +
        '<span class="cell rvt-derived"><span class="cl">' + T('Place', 'இடம்') + '</span><b>' + esc(h.name || (h.lat + ', ' + h.lon)) + '</b></span></div>';
    },
    run: function () {
      var h = home(), iso = $('rvGwDate').value || isoDay(Date.now(), h.tz), g = gowri(iso, h), now = Date.now();
      if (!g) throw new Error(S('The Sun does not rise or set at this place on this day.', 'இந்த நாளில் இந்த இடத்தில் சூரியன் உதிக்கவோ மறையவோ இல்லை.'));
      var tz = h.tz, row = function (x) {
        var G = GOWRI[x.k], on = now >= x.s && now < x.e;
        return '<tr class="' + (on ? 'rvt-on ' : '') + 'rvt-g-' + G[2] + '"><td class="rvt-time">' + hm(x.s, tz) + ' – ' + hm(x.e, tz) + (on ? ' <span class="rvt-now">' + S('now', 'இப்போது') + '</span>' : '') + '</td><td><b>' + T(G[0], G[1]) + '</b></td><td>' + res(G[2] === 'bad' ? 'bad' : G[2] === 'best' ? 'best' : 'fine') + '</td></tr>';
      };
      var head = [S('Time', 'நேரம்'), S('Gowri', 'கௌரி'), ''];
      var kal = function (en, ta, p) { return '<li><b>' + T(en, ta) + '</b> ' + hm(p[0], tz) + ' – ' + hm(p[1], tz) + '</li>'; };
      return '<div class="rvt-card"><b>' + dayName(g.rise, tz) + ', ' + dt(g.rise, tz) + '</b> · ' + esc(h.name || '') + '<p>' + T('Sunrise', 'சூரிய உதயம்') + ' ' + hm(g.rise, tz) + ' · ' + T('Sunset', 'சூரிய அஸ்தமனம்') + ' ' + hm(g.set, tz) + '</p>' +
        '<ul class="rvt-inline">' + kal('Rahu kalam', 'ராகு காலம்', g.rahu) + kal('Yamagandam', 'எமகண்டம்', g.yama) + kal('Gulikai', 'குளிகை', g.guli) + '</ul></div>' +
        '<h3>' + T('Day', 'பகல்') + '</h3>' + table(head, g.day.map(row), 'rvt-gowri') +
        '<h3>' + T('Night', 'இரவு') + '</h3>' + table(head, g.night.map(row), 'rvt-gowri');
    }
  });

  /* ----- Sade Sati and Guru Transit ----- */
  makeTool({
    p: 'rvSs', en: 'Sade Sati and Guru Transit', ta: 'ஏழரைச் சனி, குரு பெயர்ச்சி', go: ['Check Saturn and Jupiter', 'சனி, குருவைப் பார்'],
    search: 'Sade sati elarai sani ezharai sani ashtama sani ardhashtama kantaka sani saturn transit guru peyarchi jupiter transit sani peyarchi ஏழரைச் சனி அஷ்டம சனி குரு பெயர்ச்சி சனி பெயர்ச்சி',
    icon: '<circle cx="12" cy="12" r="4.5"/><path d="M3 15.5c3.5-1.2 14.5-5.8 18-7"/>',
    how: function () {
      return '<p class="legend">' + B('From your Moon sign (rasi), Saturn’s stays in the 12th, 1st and 2nd signs make Sade Sati (about seven and a half years, in three phases); in the 8th, Ashtama Sani; in the 4th, Ardhashtama Sani; in the 7th, Kantaka Sani. Dates come from the engine’s own Saturn, including retrograde returns, about 30 years each way. Jupiter’s present sign is read from the Moon sign too: the 2nd, 5th, 7th, 9th and 11th are favourable.',
        'உங்கள் ராசியிலிருந்து சனி 12, 1, 2-ஆம் ராசிகளில் இருக்கும் காலம் ஏழரைச் சனி (மூன்று கட்டங்கள், சுமார் ஏழரை ஆண்டு); 8-இல் அஷ்டம சனி; 4-இல் அர்த்தாஷ்டம சனி; 7-இல் கண்டகச் சனி. தேதிகள் வக்கிர திரும்புதல்கள் உட்பட இருபுறமும் சுமார் 30 ஆண்டுகளுக்கு. குருவின் தற்போதைய ராசியும் உங்கள் ராசியிலிருந்து பார்க்கப்படும்: 2, 5, 7, 9, 11 சாதகமானவை.') + '</p>';
    },
    form: function () { return moonForm('rvSs'); },
    wire: function () { wireMoon('rvSs'); },
    run: function () {
      var me = readMoon('rvSs'), k = (me.full && me.full.ayan) || kind(), now = Date.now(), r = saturnStudy(me.rasi, now, k), tz = home().tz;
      var PH = { 12: ['Rising phase (12th): expenses, travel, sleep', 'விரய சனி (12): செலவு, பயணம், உறக்கம்'], 1: ['Peak phase (1st, Janma Sani): health and pressure of mind', 'ஜன்ம சனி (1): உடல்நலம், மன அழுத்தம்'], 2: ['Setting phase (2nd): family and money', 'பாத சனி (2): குடும்பம், பணம்'] };
      var status = function () {
        var h = r.satHouse;
        if ([12, 1, 2].indexOf(h) >= 0) return ['bad', 'You are in Sade Sati now: ' + PH[h][0] + '.', 'இப்போது ஏழரைச் சனி நடக்கிறது: ' + PH[h][1] + '.'];
        if (h === 8) return ['bad', 'You are in Ashtama Sani now (Saturn in the 8th from your Moon).', 'இப்போது அஷ்டம சனி நடக்கிறது (ராசிக்கு 8-இல் சனி).'];
        if (h === 4) return ['avg', 'You are in Ardhashtama Sani now (Saturn in the 4th).', 'இப்போது அர்த்தாஷ்டம சனி (4-இல் சனி).'];
        if (h === 7) return ['avg', 'You are in Kantaka Sani now (Saturn in the 7th).', 'இப்போது கண்டகச் சனி (7-இல் சனி).'];
        if ([3, 6, 11].indexOf(h) >= 0) return ['good', 'Saturn is in the ' + ord(h) + ' from your Moon: a favourable stay.', 'சனி உங்கள் ராசிக்கு ' + h + '-இல்: சாதகமான காலம்.'];
        return ['avg', 'Saturn is in the ' + ord(h) + ' from your Moon.', 'சனி உங்கள் ராசிக்கு ' + h + '-இல்.'];
      }();
      var period = function (b, en, ta) {
        var cur = now >= b.s && now < b.e, past = b.e <= now;
        return '<tr class="' + (cur ? 'rvt-on' : past ? 'rvt-past' : '') + '"><td><b>' + T(en, ta) + '</b>' + (cur ? ' <span class="rvt-now">' + S('now', 'இப்போது') + '</span>' : '') + '</td><td><span class="rvt-time">' + dt(b.s, tz) + ' – ' + dt(b.e, tz) + '</span>' +
          (b.phases.length > 1 ? '<br><span class="rvt-age">' + b.phases.map(function (p) { return ord(p.h) + ' ' + S('from', 'முதல்') + ' ' + dt(p.s, tz); }).join(' · ') + '</span>' : '') +
          (b.returns ? '<br><span class="rvt-age">' + b.returns.map(function (g) { return S('Saturn steps out (retrograde) ', 'சனி வக்கிரத்தில் விலகல் ') + dt(g.s, tz) + ' – ' + dt(g.e, tz); }).join('<br>') + '</span>' : '') + '</td></tr>';
      };
      var rows = [];
      r.sadeSati.forEach(function (b) { rows.push({ s: b.s, h: period(b, 'Sade Sati', 'ஏழரைச் சனி') }); });
      r.ashtama.forEach(function (b) { rows.push({ s: b.s, h: period(b, 'Ashtama Sani', 'அஷ்டம சனி') }); });
      r.ardha.forEach(function (b) { rows.push({ s: b.s, h: period(b, 'Ardhashtama Sani', 'அர்த்தாஷ்டம சனி') }); });
      r.kantaka.forEach(function (b) { rows.push({ s: b.s, h: period(b, 'Kantaka Sani', 'கண்டகச் சனி') }); });
      rows.sort(function (a, b) { return a.s - b.s; });
      var jg = [2, 5, 7, 9, 11].indexOf(r.jupHouse) >= 0;
      var h = '<div class="rvt-card rvt-' + status[0] + '"><b>' + sign(me.rasi) + (me.name ? ' · ' + esc(me.name) : '') + '</b><p>' + B(status[1], status[2]) + '</p>' +
        (r.satNext ? '<p>' + T('Saturn moves into', 'சனி அடுத்து') + ' ' + sign(r.satNext.sign) + ' ' + S('on', '') + ' ' + dt(r.satNext.s, tz) + '.</p>' : '') + '</div>';
      h += '<h3>' + T('Saturn periods', 'சனி காலங்கள்') + '</h3>' + table([S('Period', 'காலம்'), S('Dates and phases', 'தேதிகள், கட்டங்கள்')], rows.map(function (x) { return x.h; }));
      h += '<h3>' + T('Jupiter (Guru) now', 'குரு இப்போது') + '</h3><div class="rvt-card rvt-' + (jg ? 'good' : 'avg') + '"><p>' + B('Jupiter is in ' + C.SIGNS[r.jupSign][0] + ', the ' + ord(r.jupHouse) + ' from your Moon: ' + (jg ? 'a favourable transit (growth, family, money, good events).' : 'a less favourable transit; patience and care help.'),
        'குரு ' + C.TSIGN[r.jupSign] + ' ராசியில், உங்கள் ராசிக்கு ' + r.jupHouse + '-இல்: ' + (jg ? 'சாதகமான பெயர்ச்சி (வளர்ச்சி, குடும்பம், பணம், சுப நிகழ்வுகள்).' : 'குறைந்த சாதகம்; பொறுமையும் கவனமும் உதவும்.')) + '</p>' +
        (r.jupNext ? '<p>' + T('Next Guru peyarchi', 'அடுத்த குரு பெயர்ச்சி') + ': ' + sign(r.jupNext.sign) + ', ' + dt(r.jupNext.s, tz) + '.</p>' : '') + '</div>';
      return h + note('Dates are when Saturn or Jupiter enters or leaves the sign by the chosen ayanamsa; almanacs using another ayanamsa may differ by some days.', 'தேதிகள் தேர்ந்த அயனாம்சப்படி கிரகம் ராசி மாறும் நேரம்; வேறு அயனாம்சம் கொண்ட பஞ்சாங்கங்கள் சில நாட்கள் மாறுபடலாம்.');
    }
  });

  /* ----- My Transits Today ----- */
  makeTool({
    p: 'rvGc', en: 'My Transits Today', ta: 'இன்றைய கோசார பலன்', go: ['Show my transits', 'என் கோசாரத்தைக் காட்டு'],
    search: 'My transits today gochara palan daily horoscope rasi palan tarabalam chandrashtamam chandrashtama chandra bala dasha today கோசார பலன் இன்றைய ராசி பலன் சந்திராஷ்டமம் தாரா பலம்',
    icon: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8.5"/><circle cx="20.5" cy="12" r="1.3" fill="currentColor"/>',
    how: function () {
      return '<p class="legend">' + B('From your birth star and Moon sign: today’s Tara Bala (the count from your star to the Moon’s star), Chandra Bala and Chandrashtama (the Moon in the 8th from your sign), the next Chandrashtama days, and each planet’s house from your Moon with the classical good houses (for example Jupiter in the 2nd, 5th, 7th, 9th or 11th). With a saved person, the running dasha and bhukti are shown too.',
        'உங்கள் ஜன்ம நட்சத்திரம், ராசியிலிருந்து: இன்றைய தாரா பலம், சந்திர பலம், சந்திராஷ்டமம் (ராசிக்கு 8-இல் சந்திரன்), அடுத்த சந்திராஷ்டம நாட்கள், ஒவ்வொரு கிரகமும் உங்கள் ராசிக்கு எத்தனையாவது வீட்டில் உள்ளது என்பதும் அதன் பாரம்பரிய பலனும். சேமித்த நபரைத் தேர்ந்தால் நடப்பு தசா புக்தியும் காட்டப்படும்.') + '</p>';
    },
    form: function () { return moonForm('rvGc') + '<div class="group">' + cell('rvGcDate', 'Date', 'தேதி', '<input type="date" id="rvGcDate" value="' + isoDay(Date.now(), home().tz) + '">') + '</div>'; },
    wire: function () { wireMoon('rvGc'); },
    run: function () {
      var me = readMoon('rvGc'), k = (me.full && me.full.ayan) || kind(), h0 = home(), tz = h0.tz;
      var iso = $('rvGcDate').value || isoDay(Date.now(), tz), today = iso === isoDay(Date.now(), tz);
      var ms = today ? Date.now() : midnight(iso, tz) + 12 * HOUR, t = transits(me, ms, k), T9 = TARA[t.tara.i];
      var h = '<div class="rvt-card"><b>' + dayName(ms, tz) + ', ' + dt(ms, tz) + (today ? ' · ' + hm(ms, tz) : '') + '</b> · ' + nak(me.nak) + ', ' + sign(me.rasi) + (me.name ? ' (' + esc(me.name) + ')' : '') +
        '<ul class="rvt-inline"><li>' + T('Moon now', 'சந்திரன் இப்போது') + ': ' + nak(t.moon.nak) + ', ' + sign(t.moon.rasi) + '</li>' +
        '<li>' + T('Tara Bala', 'தாரா பலம்') + ': <b>' + S(T9[0], T9[1]) + '</b> (' + t.tara.count + ') ' + res(T9[2] === 'good' ? 'fine' : T9[2]) + '</li>' +
        '<li>' + T('Chandra Bala', 'சந்திர பலம்') + ': ' + S('Moon in the ' + ord(t.moonHouse), 'சந்திரன் ' + t.moonHouse + '-இல்') + ' ' + res(t.chandrashtama ? 'bad' : t.chandraBala ? 'fine' : 'avg') + '</li></ul>' +
        (t.chandrashtama ? '<p class="rvt-warn">' + B('Chandrashtama today: the Moon is in the 8th from your sign. Avoid new beginnings and arguments.', 'இன்று சந்திராஷ்டமம்: சந்திரன் உங்கள் ராசிக்கு 8-இல். புதிய தொடக்கங்கள், வாக்குவாதங்களைத் தவிர்க்கவும்.') + '</p>' : '') + '</div>';
      var nc = nextChandrashtama(me.rasi, today ? ms : midnight(iso, tz), k);
      if (nc) h += '<p>' + T('Next Chandrashtama', 'அடுத்த சந்திராஷ்டமம்') + ': ' + dayName(nc.s, tz) + ' ' + dt(nc.s, tz) + ' ' + hm(nc.s, tz) + ' – ' + dayName(nc.e, tz) + ' ' + dt(nc.e, tz) + ' ' + hm(nc.e, tz) + '</p>';
      h += '<h3>' + T('Planets from your Moon sign', 'உங்கள் ராசியிலிருந்து கிரகங்கள்') + '</h3>' + table([S('Planet', 'கிரகம்'), S('Sign', 'ராசி'), S('House', 'வீடு'), S('Transit', 'பலன்')], t.list.map(function (p) {
        return '<tr><td><b>' + T(C.NAME[p.c], C.TA[p.c]) + '</b>' + (p.retro ? ' ℞' : '') + '</td><td>' + sign(p.sign) + '</td><td>' + p.house + '</td><td>' + res(p.good ? 'fav' : 'unfav') + '</td></tr>';
      }));
      var week = [];
      for (var i = 0; i < 7; i++) {
        var d = midnight(iso, tz) + (i * 24 + 12) * HOUR, x = transits(me, d, k), tt = TARA[x.tara.i];
        week.push('<tr' + (x.chandrashtama ? ' class="rvt-g-bad"' : '') + '><td>' + dayName(d, tz) + ' ' + dt(d, tz) + '</td><td>' + nak(x.moon.nak) + '</td><td>' + S(tt[0], tt[1]) + ' ' + res(tt[2] === 'good' ? 'fine' : tt[2]) + '</td><td>' + (x.chandrashtama ? '<b>' + S('Chandrashtama', 'சந்திராஷ்டமம்') + '</b>' : '') + '</td></tr>');
      }
      h += '<h3>' + T('The week ahead (at noon)', 'வரும் வாரம் (நண்பகல்)') + '</h3>' + table([S('Day', 'நாள்'), S('Moon’s star', 'நட்சத்திரம்'), S('Tara Bala', 'தாரா பலம்'), ''], week);
      if (me.full) {
        var d0 = C.bpDasha(C.lon('Mo', me.full.ms, k), me.full.ms), dn = dashaNow(d0, ms);
        if (dn.maha) h += '<h3>' + T('Running dasha', 'நடப்பு தசை') + '</h3><p>' + pl(dn.maha.c) + ' ' + S('dasha', 'தசை') + ' · ' + pl(dn.bhukti.c) + ' ' + S('bhukti', 'புக்தி') + ' ' + S('until', 'வரை') + ' ' + dt(dn.bhukti.e, tz) + ' · ' + pl(dn.antara.c) + ' ' + S('antara', 'அந்தரம்') + ' ' + S('until', 'வரை') + ' ' + dt(dn.antara.e, tz) + '</p>';
      }
      return h + note('These are the classical transit rules, read from the Moon sign only; a full reading also weighs the birth chart and the dasha.', 'இவை ராசியிலிருந்து மட்டும் பார்க்கும் பாரம்பரிய கோசார விதிகள்; முழுப் பலனுக்கு ஜாதகமும் தசையும் சேர்த்துப் பார்க்க வேண்டும்.');
    }
  });

  /* ----- KP Birth Time Rectification ----- */
  makeTool({
    p: 'rvRt', en: 'KP Birth Time Rectification', ta: 'KP பிறப்பு நேரத் திருத்தம்', go: ['Find the likely birth time', 'சரியான பிறப்பு நேரத்தைக் காண்'],
    search: 'KP birth time rectification ruling planets correct birth time exact time of birth rectify lagna sub lord பிறப்பு நேரம் திருத்தம் ஆளும் கிரகங்கள்',
    icon: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 1.5M9.5 2.5h5M12 2.5v3"/>',
    how: function () {
      return '<p class="legend">' + B('KP’s ruling planets method. The ruling planets at the moment of judgment (now, at your home place) are the ascendant’s sign, star and sub lords, the Moon’s sign and star lords, and the lord of the day (the day starts at sunrise). For every minute of the window around the recorded birth time, the ascendant’s sub is found; a sub whose sub lord, star lord and sign lord are ruling planets (3, 2 and 1 points) is the likely one. Confirm the result with known events, such as the date of marriage.',
        'KP ஆளும் கிரக முறை. தீர்ப்பு நேரத்தின் (இப்போது, உங்கள் வீட்டு இடத்தில்) ஆளும் கிரகங்கள்: லக்ன ராசி, நட்சத்திர, உப அதிபதிகள், சந்திரனின் ராசி, நட்சத்திர அதிபதிகள், கிழமை அதிபதி (நாள் சூரிய உதயத்தில் தொடங்கும்). குறித்த பிறப்பு நேரத்தைச் சுற்றியுள்ள ஒவ்வொரு நிமிடத்திற்கும் லக்ன உப பிரிவு காணப்படும்; அதன் உப, நட்சத்திர, ராசி அதிபதிகள் ஆளும் கிரகங்களாக இருந்தால் (3, 2, 1 புள்ளிகள்) அதுவே பெரும்பாலும் சரியான நேரம். திருமண தேதி போன்ற நிகழ்வுகளுடன் சரிபாருங்கள்.') + '</p>';
    },
    form: function () {
      return birthForm('rvRt') + '<div class="group">' + cell('rvRtWin', 'Search window', 'தேடும் காலம்', sel('rvRtWin', [[15, S('± 15 minutes', '± 15 நிமிடம்')], [30, S('± 30 minutes', '± 30 நிமிடம்')], [60, S('± 1 hour', '± 1 மணி')], [120, S('± 2 hours', '± 2 மணி')]], 30)) + '</div>';
    },
    wire: function () { wireBirth('rvRt'); },
    run: function () {
      var b = readBirth('rvRt'); if (b.err) { msg(this, b.err, true); return ''; }
      var k = kind(), place = { lat: b.lat, lon: b.lon, tz: b.tz }, judge = home(), now = Date.now();
      var rp = rulingPlanets(now, judge, k), r = rectify(b.ms, +$('rvRtWin').value, place, rp, k), tz = b.tz;
      var rpRow = function (en, ta, c) { return '<li>' + T(en, ta) + ': <b>' + pl(c) + '</b></li>'; };
      var h = '<div class="rvt-card"><b>' + T('Ruling planets now', 'இப்போதைய ஆளும் கிரகங்கள்') + '</b> · ' + dayName(now, judge.tz) + ' ' + hm(now, judge.tz) + ', ' + esc(judge.name || '') + '<ul class="rvt-inline">' +
        rpRow('Ascendant sign lord', 'லக்ன ராசி அதிபதி', rp.ascSign) + rpRow('star lord', 'நட்சத்திர அதிபதி', rp.ascStar) + rpRow('sub lord', 'உப அதிபதி', rp.ascSub) +
        rpRow('Moon sign lord', 'சந்திர ராசி அதிபதி', rp.moonSign) + rpRow('Moon star lord', 'சந்திர நட்சத்திர அதிபதி', rp.moonStar) + rpRow('Day lord', 'கிழமை அதிபதி', rp.day) + '</ul></div>';
      var best = r.best;
      h += '<div class="rvt-card rvt-good"><p>' + B('Likely birth time: ' + hm(best.s, tz) + ' to ' + hm(best.e + 30000, tz) + ' (' + C.SIGNS[best.ascSign][0] + ' rising, ' + C.NAME[best.sign] + ' / ' + C.NAME[best.star] + ' / ' + C.NAME[best.sub] + ').',
        'பெரும்பாலும் சரியான பிறப்பு நேரம்: ' + hm(best.s, tz) + ' முதல் ' + hm(best.e + 30000, tz) + ' வரை (' + C.TSIGN[best.ascSign] + ' லக்னம், ' + C.TA[best.sign] + ' / ' + C.TA[best.star] + ' / ' + C.TA[best.sub] + ').') + '</p></div>';
      h += table([S('From – to', 'நேரம்'), S('Ascendant', 'லக்னம்'), S('Sign / star / sub lord', 'ராசி / நட்சத்திர / உப அதிபதி'), S('Agreement', 'பொருத்தம்')], r.rows.map(function (x) {
        var mark = function (c) { return r.set.indexOf(c) >= 0 ? '<b class="rvt-good">' + pl(c) + '</b>' : pl(c); };
        return '<tr class="' + (x === best ? 'rvt-on' : '') + '"><td class="rvt-time">' + hm(x.s, tz) + ' – ' + hm(x.e + 30000, tz) + '</td><td>' + sign(x.ascSign) + '</td><td>' + mark(x.sign) + ' / ' + mark(x.star) + ' / ' + mark(x.sub) + '</td><td>' + x.score + '/6</td></tr>';
      }));
      return h + note('Ruling planets change with the moment you ask. Run it when the question is sincere, and check the result against life events.', 'ஆளும் கிரகங்கள் கேட்கும் நேரத்துடன் மாறும். உண்மையான தேவையின் போது பாருங்கள்; வாழ்க்கை நிகழ்வுகளுடன் சரிபாருங்கள்.');
    }
  });

  /* ----- Dasha Timeline ----- */
  var HUE = { Ke: 25, Ve: 330, Su: 40, Mo: 190, Ma: 2, Ra: 268, Ju: 75, Sa: 225, Me: 145 };
  makeTool({
    p: 'rvDt', en: 'Dasha Timeline', ta: 'தசா காலவரிசை', go: ['Show the timeline', 'காலவரிசையைக் காட்டு'],
    search: 'Dasha timeline vimshottari dasa bhukti antara mahadasha periods life timeline current dasa தசா புக்தி அந்தரம் காலவரிசை நடப்பு தசை',
    icon: '<path d="M3.5 12h17"/><path d="M6.5 8.5v7M11 9.5v5M15 8v8M19 10v4"/>',
    how: function () {
      return '<p class="legend">' + B('Vimshottari dasha from the Moon’s star at birth, as in Birth Chart: nine periods over 120 years, each split into bhuktis and antaras. The bar shows your whole life with today marked; tap a period to see its bhuktis. The running dasha opens by itself.',
        'பிறப்பின் போது சந்திரனின் நட்சத்திரத்திலிருந்து விம்சோத்தரி தசை, பிறப்பு ஜாதகத்தில் உள்ளது போல்: 120 ஆண்டுகளில் ஒன்பது தசைகள், ஒவ்வொன்றும் புக்தி, அந்தரங்களாக. பட்டை முழு வாழ்க்கையையும் இன்றைய இடத்துடன் காட்டும்; ஒரு தசையைத் தட்டினால் அதன் புக்திகள் தெரியும்.') + '</p>';
    },
    form: function () { return birthForm('rvDt'); },
    wire: function () { wireBirth('rvDt'); },
    run: function () {
      var b = readBirth('rvDt'); if (b.err) { msg(this, b.err, true); return ''; }
      var k = kind(), mo = C.lon('Mo', b.ms, k), d = C.bpDasha(mo, b.ms), now = Date.now(), dn = dashaNow(d, now), tz = b.tz;
      // The bar and the first period start at birth (the first dasha began before it; its balance remains).
      var start = b.ms, end = d.list[8].e, span = end - start, age = function (ms) { return Math.max(0, (ms - b.ms) / (365.25 * DAY)); };
      var from = function (m) { return Math.max(m.s, b.ms); };
      var bar = d.list.map(function (m) {
        var w = (m.e - from(m)) / span * 100;
        return '<span class="rvt-seg" style="width:' + w.toFixed(3) + '%;--h:' + HUE[m.c] + '" title="' + esc(pl(m.c)) + '"><i>' + (w > 6 ? pl(m.c) : '') + '</i></span>';
      }).join('');
      var you = now > start && now < end ? '<span class="rvt-you" style="left:' + ((now - start) / span * 100).toFixed(2) + '%"><b>' + S('Today', 'இன்று') + '</b></span>' : '';
      var birthMark = '';
      var h = '<div class="rvt-card"><b>' + esc(b.name || '') + (b.name ? ' · ' : '') + S('Born', 'பிறப்பு') + ' ' + dt(b.ms, tz) + ' ' + hm(b.ms, tz) + '</b><p>' + T('Moon', 'சந்திரன்') + ': ' + nak(Math.floor(mo / NAKW)) + ', ' + sign(Math.floor(mo / 30)) + ' · ' +
        S('Balance at birth: ', 'பிறப்பில் இருப்பு: ') + pl(d.lord) + ' ' + d.balance.toFixed(2) + ' ' + S('years', 'ஆண்டுகள்') + '</p>' +
        (dn.maha ? '<p><b>' + S('Now', 'இப்போது') + ':</b> ' + pl(dn.maha.c) + ' ' + S('dasha', 'தசை') + ' · ' + pl(dn.bhukti.c) + ' ' + S('bhukti', 'புக்தி') + ' · ' + pl(dn.antara.c) + ' ' + S('antara', 'அந்தரம்') + ' ' + S('until', 'வரை') + ' ' + dt(dn.antara.e, tz) + '</p>' : '') + '</div>';
      h += '<div class="rvt-bar" role="img" aria-label="' + esc(S('Dasha periods across life', 'வாழ்நாள் தசா காலங்கள்')) + '">' + bar + birthMark + you + '</div>';
      h += d.list.map(function (m, i) {
        var cur = dn.maha === m, past = m.e <= now;
        var rows = m.ant.filter(function (a) { return a.e > b.ms; }).map(function (a) {
          var on = dn.bhukti === a, ants = on ? '<tr class="rvt-sub"><td colspan="3">' + a.pr.map(function (q) { return '<span class="' + (dn.antara === q ? 'rvt-on' : '') + '">' + pl(q.c) + ' ' + S('to', 'வரை') + ' ' + dt(q.e, tz) + '</span>'; }).join(' · ') + '</td></tr>' : '';
          return '<tr class="' + (on ? 'rvt-on' : a.e <= now ? 'rvt-past' : '') + '"><td><b>' + pl(a.c) + '</b> ' + S('bhukti', 'புக்தி') + '</td><td class="rvt-time">' + dt(Math.max(a.s, b.ms), tz) + ' – ' + dt(a.e, tz) + '</td><td>' + S('age', 'வயது') + ' ' + age(a.s).toFixed(1) + '</td></tr>' + ants;
        });
        return '<details class="rvt-dasha' + (cur ? ' rvt-on' : past ? ' rvt-past' : '') + '" id="rvDtM' + i + '"' + (cur ? ' open' : '') + ' style="--h:' + HUE[m.c] + '"><summary><b>' + pl(m.c) + ' ' + S('dasha', 'தசை') + '</b> <span class="rvt-time">' + dt(from(m), tz) + ' – ' + dt(m.e, tz) + '</span> <span class="rvt-age">' + S('age', 'வயது') + ' ' + age(m.s).toFixed(1) + '–' + age(m.e).toFixed(1) + '</span>' + (cur ? ' <span class="rvt-now">' + S('now', 'இப்போது') + '</span>' : '') + '</summary>' + table([S('Bhukti', 'புக்தி'), S('Dates', 'தேதிகள்'), S('Age', 'வயது')], rows) + '</details>';
      }).join('');
      return h + (b.timeGiven ? '' : note('No birth time was given, so 12:00 was used; the dasha balance can be off by a few months.', 'பிறப்பு நேரம் இல்லாததால் 12:00 எடுக்கப்பட்டது; தசா இருப்பு சில மாதங்கள் மாறலாம்.'));
    }
  });

  /* ---------- language changes redraw the pages; Esc closes the open one ---------- */
  new MutationObserver(function () { tools.forEach(function (t) { t.render(); }); })
    .observe(document.body, { attributes: true, attributeFilter: ['data-lang'] });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    tools.forEach(function (t) { if (!t.panel.classList.contains('hide')) t.panel.classList.add('hide'); });
  });
})();
