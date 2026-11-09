/* GuruAgasthiya revamp: features added on top of the v7.7 engine.
   Birth date default, jump to now, result sharing (copy, print, share, calendar),
   saved people in Fortuna, a question log, first-run setup, alarm guidance,
   keyboard access and a lighter start-up. Engine ids and listeners stay as they are. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var VERSION = ((document.querySelector('.brand .ver') || {}).textContent || '').trim();
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function fire(el, t) { el.dispatchEvent(new Event(t, { bubbles: true })); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function slug(s) { return (s || 'guruagasthiya').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  // Text with values goes through the translation layer (revamp/i18n.js); {name} marks a value.
  function T(text, v) {
    var t = window.rvT ? window.rvT(text) : text;
    return t.replace(/\{(\w+)\}/g, function (m, k) { return v && v[k] != null ? v[k] : m; });
  }

  /* ---------- Browser housekeeping ---------- */
  // Browsers block vibration until the page has been tapped; skip it until then instead of failing.
  if (navigator.vibrate && navigator.userActivation) {
    var vib = navigator.vibrate.bind(navigator);
    navigator.vibrate = function (p) { return navigator.userActivation.hasBeenActive ? vib(p) : false; };
  }

  /* ---------- Toast ---------- */
  var toastEl = document.createElement('div');
  toastEl.className = 'rv-toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastEl);
  var toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 3200);
  }
  window.rvToast = toast;

  /* ---------- 1. Birth Chart opens on today's date, not 1 January 2100 ---------- */
  (function () {
    var y = $('bpYear'), m = $('bpMonth'), d = $('bpDay');
    if (!y || !m || !d) return;
    if (y.value === '2100' && m.value === '1' && d.value === '1') {
      var t = new Date();
      y.value = String(t.getFullYear()); m.value = String(t.getMonth() + 1); d.value = String(t.getDate());
      [y, m, d].forEach(function (el) { fire(el, 'change'); });
    }
  })();

  /* ---------- Birth Chart: warn about clock-change times ----------
     On a daylight-saving change a local time can be missing (clocks jump forward) or happen twice
     (clocks fall back). The engine silently picks one offset, so say which one it used. */
  (function () {
    var out = $('bpOut'); if (!out || !window.Intl) return;
    function wall(ms, tz) {
      var p = {}; new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
        .formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = x.value; });
      return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
    }
    function offStr(min) { var s = min < 0 ? '−' : '+', a = Math.abs(min); return 'UTC' + s + Math.floor(a / 60) + ':' + pad(a % 60); }
    function check() {
      var old = out.querySelector('.rv-dst'); if (old) old.remove();
      var tz = ($('bpTz') || {}).value || '';
      if (!/^[A-Za-z_]+\/[A-Za-z_\-\/]+$/.test(tz)) return; // only named time zones change their clocks
      var y = +$('bpYear').value, mo = +$('bpMonth').value, d = +$('bpDay').value;
      var h = (+$('bpHour').value % 12) + ($('bpAmpm').value === 'PM' ? 12 : 0), mi = +$('bpMin').value, se = +$('bpSec').value;
      var L = Date.UTC(y, mo - 1, d, h, mi, se), offs;
      try { offs = [L - 12 * 3600000, L + 12 * 3600000].map(function (t) { return Math.round((wall(t, tz) - t) / 60000); }); } catch (e) { return; }
      var hits = offs.filter(function (o, i) { return offs.indexOf(o) === i && wall(L - o * 60000, tz) === L; });
      var place = tz.split('/').pop().replace(/_/g, ' '), msg = '';
      var used = (out.textContent.match(/UTC[+\-−]\d{1,2}:\d{2}/) || [''])[0];
      var hm = pad(h) + ':' + pad(mi);
      if (!hits.length) msg = '<b>' + esc(T('This time did not exist in {place}.', { place: place })) + '</b> ' +
        esc(T('Clocks jumped forward that night, from {a} to {b}, so {time} was skipped. The chart below uses {used}. Check the recorded birth time.',
          { a: offStr(offs[0]), b: offStr(offs[1]), time: hm, used: used || T('one of the two offsets') }));
      else if (hits.length > 1) msg = '<b>' + esc(T('This time happened twice in {place}.', { place: place })) + '</b> ' +
        esc(T('Clocks went back that night, so {time} came once at {a} and again at {b}. The chart below uses {used}. If the birth was in the second hour, enter {tz} as the time zone and calculate again.',
          { time: hm, a: offStr(hits[0]), b: offStr(hits[1]), used: used || T('the first'), tz: hits[1] / 60 }));
      if (!msg) return;
      var n = document.createElement('div'); n.className = 'rv-dst'; n.setAttribute('role', 'note'); n.innerHTML = msg;
      out.insertBefore(n, out.firstChild);
    }
    var t;
    new MutationObserver(function (ms) {
      if (ms.every(function (m) { return [].every.call(m.addedNodes, function (x) { return x.classList && x.classList.contains('rv-dst'); }); })) return;
      clearTimeout(t); t = setTimeout(check, 200);
    }).observe(out, { childList: true });
  })();

  /* ---------- Rows with times ---------- */
  function rowTimes(li) {
    var s = +li.dataset.ms || +li.dataset.s, e = +li.dataset.e;
    return s && e ? { s: s, e: e } : null;
  }
  function timedRows(root) {
    return [].slice.call(root.querySelectorAll('li.row')).filter(function (li) { return li.offsetParent !== null && rowTimes(li); });
  }
  function jumpToNow(root) {
    var rows = timedRows(root), now = Date.now(), hit = null, next = null;
    rows.forEach(function (li) {
      var t = rowTimes(li);
      if (!hit && t.s <= now && now < t.e) hit = li;
      if (!next && t.s > now) next = li;
    });
    var li = hit || next;
    if (!li) { toast(rows.length ? 'Every timing in this list is already in the past.' : 'There are no timings to jump to.'); return; }
    li.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    li.classList.remove('rv-flash'); void li.offsetWidth; li.classList.add('rv-flash');
    li.focus({ preventScroll: true });
    toast(hit ? 'This timing is running now.' : 'Next timing: it has not started yet.');
  }

  /* ---------- Timings list: jump to now, tagged rows only ---------- */
  (function () {
    var results = $('results'), bar = results && results.querySelector('.bar');
    if (!bar) return;
    var tools = document.createElement('div');
    tools.className = 'rv-listtools';
    tools.innerHTML = '<button type="button" class="rv-chip" data-act="now"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="M10 6v4l2.5 1.5"/></svg>Jump to now</button>' +
      '<button type="button" class="rv-chip" data-act="tag" aria-pressed="false"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 10.5V4h6.5l6.5 6.5-6 6z"/><circle cx="7" cy="7.5" r="1.2"/></svg>Tagged timings only</button>' +
      '<span class="rv-shown" aria-live="polite"></span>';
    bar.insertAdjacentElement('afterend', tools);
    var tagBtn = tools.querySelector('[data-act="tag"]'), shown = tools.querySelector('.rv-shown');
    function countShown() {
      if (!results.classList.contains('rv-tagged')) { shown.textContent = ''; return; }
      var n = [].slice.call(results.querySelectorAll('#list > li.row')).filter(function (li) { return li.querySelector('.pill'); }).length;
      shown.textContent = n ? T('{n} tagged', { n: n }) : T('No tagged timings on this day');
    }
    tools.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.act === 'now') jumpToNow(results);
      if (b.dataset.act === 'tag') {
        var on = results.classList.toggle('rv-tagged');
        tagBtn.setAttribute('aria-pressed', String(on)); countShown();
      }
    });
    new MutationObserver(countShown).observe($('list'), { childList: true });
  })();

  /* ---------- Share, print, calendar for every result ---------- */
  function placeLine(scope) {
    var p = scope && scope.querySelector('.rv-place-t');
    if (p) return [].map.call(p.children, function (c) { return c.textContent.trim(); }).filter(Boolean).join(' · ');
    var f = $('fsPlace'); return f ? f.textContent.trim() : '';
  }
  function titleOf(scope) {
    var h = scope && scope.querySelector('.sh-head h2');
    return h ? h.textContent.trim() : 'Lagna Timings';
  }
  function plainText(target) {
    document.body.classList.add('rv-copying');
    var t = target.innerText || target.textContent || '';
    document.body.classList.remove('rv-copying');
    return t.replace(/\n{3,}/g, '\n\n').trim();
  }
  function header(scope) {
    var d = new Date();
    return [titleOf(scope), placeLine(scope), T('Made {when}', { when: d.toLocaleString() })].filter(Boolean).join('\n');
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (ok, no) {
      var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? ok() : no(); } catch (e) { no(e); } ta.remove();
    });
  }
  function download(name, type, text) {
    var url = URL.createObjectURL(new Blob([text], { type: type })), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
  }
  function printPart(scope, target) {
    var root = document.createElement('div'); root.id = 'rvPrintRoot';
    var clone = target.cloneNode(true);
    clone.querySelectorAll('button, .rv-actions, .rv-listtools').forEach(function (b) { b.remove(); });
    clone.querySelectorAll('.chk.folded').forEach(function (c) { c.classList.remove('folded'); });
    root.innerHTML = '<h1>' + esc(titleOf(scope)) + '</h1><p class="rv-print-meta">' + esc(placeLine(scope)) + ' · ' + esc(new Date().toLocaleString()) + '</p>';
    root.appendChild(clone);
    var st = document.createElement('style'); st.id = 'rvPrintStyle';
    st.textContent = '#rvPrintRoot{display:none}@media print{body>*:not(#rvPrintRoot){display:none!important}#rvPrintRoot{display:block!important}html,body{height:auto!important;overflow:visible!important;background:#fff!important}}';
    var theme = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', 'light');
    document.head.appendChild(st); document.body.appendChild(root);
    var done = false;
    function clean() {
      if (done) return; done = true; root.remove(); st.remove();
      if (theme === null) document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', theme);
    }
    window.addEventListener('afterprint', clean, { once: true }); setTimeout(clean, 120000);
    try { window.print(); } catch (e) { clean(); toast('Printing is blocked here. Use Copy or Share instead.'); }
  }
  function icsDate(ms) {
    var d = new Date(ms);
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
  }
  function icsText(s) { return String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, function (c) { return '\\' + c; }); }
  // Fold long calendar lines by whole characters, so emoji and Tamil letters are never cut in half.
  function fold75(line) { var ch = Array.from(line), out = []; while (ch.length > 60) { out.push(ch.splice(0, 60).join('')); ch.unshift(' '); } out.push(ch.join('')); return out.join('\r\n'); }
  function toCalendar(scope, target) {
    var now = Date.now();
    var rows = timedRows(target).filter(function (li) { return rowTimes(li).e > now; });
    if (!rows.length) { toast('There are no upcoming timings in this list to add.'); return; }
    var tagged = rows.filter(function (li) { return li.querySelector('.pill'); });
    var note = '';
    if (rows.length > 60 && tagged.length) { rows = tagged; note = T(' (tagged timings only)'); }
    rows = rows.slice(0, 150);
    var title = titleOf(scope), place = placeLine(scope), stamp = icsDate(now);
    var ev = rows.map(function (li, i) {
      var t = rowTimes(li), n = li.querySelector('.n, .ckt'), pills = [].slice.call(li.querySelectorAll('.pill')).map(function (p) { return p.textContent.trim(); });
      var sum = title + (n ? ': ' + n.textContent.trim() : '') + (pills.length ? ' · ' + pills.join(', ') : '');
      document.body.classList.add('rv-copying'); var desc = (li.innerText || '').trim(); document.body.classList.remove('rv-copying');
      return ['BEGIN:VEVENT', 'UID:ga-' + t.s + '-' + i + '@guruagasthiya', 'DTSTAMP:' + stamp, 'DTSTART:' + icsDate(t.s), 'DTEND:' + icsDate(t.e),
        fold75('SUMMARY:' + icsText(sum)), fold75('DESCRIPTION:' + icsText(desc)), place ? fold75('LOCATION:' + icsText(place)) : '',
        'BEGIN:VALARM', 'ACTION:DISPLAY', fold75('DESCRIPTION:' + icsText(sum)), 'TRIGGER:-PT0M', 'END:VALARM', 'END:VEVENT'].filter(Boolean).join('\r\n');
    });
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GuruAgasthiya//Revamp//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'].concat(ev, ['END:VCALENDAR']).join('\r\n');
    download(slug(title) + '-' + new Date().toISOString().slice(0, 10) + '.ics', 'text/calendar;charset=utf-8', ics);
    toast(T(rows.length === 1 ? '1 timing{note} saved as a calendar file. Open it to add it to your calendar.' : '{n} timings{note} saved as a calendar file. Open it to add them to your calendar.', { n: rows.length, note: note }));
  }
  function shareOrSave(scope, target) {
    var title = titleOf(scope), text = header(scope) + '\n\n' + plainText(target) + '\n\nGuruAgasthiya ' + VERSION;
    if (navigator.share) {
      navigator.share({ title: title, text: text }).catch(function (e) { if (e && e.name !== 'AbortError') download(slug(title) + '.txt', 'text/plain;charset=utf-8', text); });
    } else { download(slug(title) + '.txt', 'text/plain;charset=utf-8', text); toast('Saved as a text file.'); }
  }
  var ICON = {
    copy: '<rect x="6.5" y="6.5" width="10" height="11" rx="2"/><path d="M13.5 6.5V4.5a1.5 1.5 0 0 0-1.5-1.5H5a1.5 1.5 0 0 0-1.5 1.5V13A1.5 1.5 0 0 0 5 14.5h1.5"/>',
    print: '<path d="M5.5 7.5V3h9v4.5M5.5 14H3.5V8.5h13V14h-2"/><rect x="5.5" y="11.5" width="9" height="5.5" rx="1"/>',
    share: '<path d="M10 3v10M6 7l4-4 4 4"/><path d="M4 11v4.5A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5V11"/>',
    cal: '<rect x="3" y="4.5" width="14" height="12.5" rx="2"/><path d="M3 8.5h14M7 3v3M13 3v3M10 11v4M8 13h4"/>',
    now: '<circle cx="10" cy="10" r="7"/><path d="M10 6v4l2.5 1.5"/>'
  };
  function actionBar(scope, target) {
    if (target.dataset.rvActions) return;
    target.dataset.rvActions = '1';
    var bar = document.createElement('div');
    bar.className = 'rv-actions hide'; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Result actions');
    function btn(k, label) { return '<button type="button" data-a="' + k + '"><svg viewBox="0 0 20 20" aria-hidden="true">' + ICON[k] + '</svg><span>' + label + '</span></button>'; }
    bar.innerHTML = btn('now', 'Jump to now') + btn('copy', 'Copy') + btn('print', 'Print') + btn('share', navigator.share ? 'Share' : 'Save as text') + btn('cal', 'Add to calendar');
    target.parentNode.insertBefore(bar, target);
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var a = b.dataset.a;
      if (a === 'copy') copyText(header(scope) + '\n\n' + plainText(target) + '\n\nGuruAgasthiya ' + VERSION)
        .then(function () { toast('Copied. Paste it into a message or a note.'); }, function () { toast('Copying is blocked here. Use Share or Print instead.'); });
      if (a === 'print') printPart(scope, target);
      if (a === 'share') shareOrSave(scope, target);
      if (a === 'cal') toCalendar(scope, target);
      if (a === 'now') jumpToNow(target);
    });
    var t;
    function sync() {
      var has = (target.textContent || '').trim().length > 0 && !target.classList.contains('hide');
      bar.classList.toggle('hide', !has);
      var timed = has && target.querySelector('li.row[data-e]');
      bar.querySelector('[data-a="cal"]').classList.toggle('hide', !timed);
      bar.querySelector('[data-a="now"]').classList.toggle('hide', !timed);
    }
    new MutationObserver(function () { clearTimeout(t); t = setTimeout(sync, 150); })
      .observe(target, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    sync();
  }
  document.querySelectorAll('.sheet [id$="Out"]').forEach(function (out) {
    if (out.id === 'bpOut') return; // the Birth Chart has its own copy, print and save buttons
    actionBar(out.closest('.sheet'), out);
  });
  if ($('list') && $('results')) {
    // The main timings list: actions sit with the list, not the mode notes.
    var wrap = $('list');
    actionBar(null, wrap);
    var mainBar = wrap.previousElementSibling;
    if (mainBar && mainBar.classList.contains('rv-actions')) mainBar.classList.add('rv-actions-main');
  }

  /* ---------- Saved people in Fortuna's birth details ---------- */
  function people() { var l = store('gaBirthList'); return Array.isArray(l) ? l : []; }
  (function () {
    var bd = $('ftBD');
    var grp = bd && bd.closest('.group');
    if (!grp) return;
    var box = document.createElement('div');
    box.className = 'rv-people';
    box.innerHTML = '<label for="rvFtPerson">Fill from a saved person</label><select id="rvFtPerson"></select>';
    grp.parentNode.insertBefore(box, grp);
    var sel = box.querySelector('select');
    function fill() {
      var l = people();
      sel.innerHTML = l.length
        ? '<option value="">Choose a person…</option>' + l.map(function (r, i) { return '<option value="' + i + '">' + esc((r.name || 'Unnamed') + ' · ' + r.date + ' ' + (r.time || '').slice(0, 5)) + '</option>'; }).join('')
        : '<option value="">No saved people yet. Save one in Birth Chart.</option>';
      sel.disabled = !l.length;
    }
    fill();
    sel.addEventListener('focus', fill);
    sel.addEventListener('change', function () {
      var r = people()[+sel.value]; if (!r) return;
      var set = function (id, v) { var el = $(id); if (el && v !== undefined && v !== null) { el.value = v; fire(el, 'input'); fire(el, 'change'); } };
      set('ftBD', r.date); set('ftBT', (r.time || '').slice(0, 8)); set('ftBLat', r.lat); set('ftBLon', r.lon); set('ftBTz', r.tz);
      toast(T('Birth details filled in for {name}.', { name: r.name || T('this person') }));
    });
    var ft = $('ftPanel');
    if (ft) new MutationObserver(function () { if (!ft.classList.contains('hide')) fill(); }).observe(ft, { attributes: true, attributeFilter: ['class'] });
  })();

  /* ---------- Saved people in Natal Chart Trade (10.5) ---------- */
  function peopleSelect(fillRow) {
    var box = document.createElement('div');
    box.className = 'rv-people';
    box.innerHTML = '<label>Fill from a saved person</label><select></select>';
    var sel = box.querySelector('select');
    function fill() {
      var l = people();
      sel.innerHTML = l.length
        ? '<option value="">Choose a person…</option>' + l.map(function (r, i) { return '<option value="' + i + '">' + esc((r.name || 'Unnamed') + ' · ' + r.date + ' ' + (r.time || '').slice(0, 5)) + '</option>'; }).join('')
        : '<option value="">No saved people yet. Save one in Birth Chart.</option>';
      sel.disabled = !l.length;
    }
    fill();
    sel.addEventListener('focus', fill);
    sel.addEventListener('change', function () {
      var r = people()[+sel.value]; if (!r) return;
      fillRow(r);
      toast(T('Birth details filled in for {name}.', { name: r.name || T('this person') }));
    });
    box.refresh = fill;
    return box;
  }
  (function () {
    var dob = $('ntDob'), grp = dob && dob.closest('.group');
    if (!grp) return;
    var box = peopleSelect(function (r) {
      var set = function (id, v) { var el = $(id); if (el && v !== undefined && v !== null) { el.value = v; fire(el, 'input'); fire(el, 'change'); } };
      set('ntName', r.name || ''); set('ntDob', r.date); set('ntTob', (r.time || '').slice(0, 8));
      set('ntLat', r.lat); set('ntLon', r.lon); set('ntTz', r.tz);
      // Name the place in the folded place line without running a search (which would move the coordinates).
      var q = $('ntSearch'); if (q && r.place) { q.value = r.place; var det = q.closest('details'); if (det) det.dispatchEvent(new Event('change')); }
    });
    grp.parentNode.insertBefore(box, grp);
    var nt = $('ntPanel');
    if (nt) new MutationObserver(function () { if (!nt.classList.contains('hide')) box.refresh(); }).observe(nt, { attributes: true, attributeFilter: ['class'] });
  })();
  /* Ask GuruAgasthiya draws its birth form inside the chat; offer the saved people there too. */
  (function () {
    var log = $('akLog'); if (!log) return;
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        [].forEach.call(m.addedNodes, function (n) {
          if (n.nodeType !== 1) return;
          var form = n.querySelector && n.querySelector('.ak-bn') ? n : null;
          if (!form || form.querySelector('.rv-people') || !people().length) return;
          var box = peopleSelect(function (r) {
            var q = function (c) { return form.querySelector(c); };
            if (q('.ak-bn')) q('.ak-bn').value = r.name || '';
            if (q('.ak-bd')) q('.ak-bd').value = r.date || '';
            if (q('.ak-bt')) q('.ak-bt').value = (r.time || '12:00:00').slice(0, 8);
            // The place goes in through the form's own coordinate entry, so the chat records it as picked.
            if (q('.ak-la') && q('.ak-lo') && q('.ak-tz') && q('.ak-go2')) {
              q('.ak-la').value = r.lat; q('.ak-lo').value = r.lon; q('.ak-tz').value = r.tz || ''; q('.ak-go2').click();
              if (q('.ak-in2')) q('.ak-in2').value = r.place || r.city || '';
            }
          });
          form.insertBefore(box, form.firstChild.nextSibling || null);
        });
      });
    }).observe(log, { childList: true });
  })();

  /* ---------- Question log for GMP Prasnam, Horary and Lost and Found ---------- */
  var QKEY = 'rvQLog';
  function qlog() { var l = store(QKEY); return Array.isArray(l) ? l : []; }
  function qsave(l) { store(QKEY, l.slice(0, 300)); }
  var QTOOLS = [
    { panel: 'gpPanel', out: 'gpOut', name: 'GMP Prasnam', find: function (o) { return o.querySelector('.lf-verdict'); } },
    { panel: 'hqPanel', out: 'hqOut', name: 'Horary', find: function (o) { return o.querySelector('.hqv'); } },
    { panel: 'lostPanel', out: 'lostOut', name: 'Lost and Found', find: function (o) { return o.querySelector('.lf-verdict'); } }
  ];
  function leaning(v) {
    var c = v.className;
    if (/\b(yes|good)\b/.test(c)) return 'yes';
    if (/\b(no|hard|bad)\b/.test(c)) return 'no';
    return 'mixed';
  }
  function qEntry(tool, out, v) {
    var verdict = (v.querySelector('.hqvt, b') || v).textContent.trim();
    var q = tool.out === 'hqOut' ? ((v.querySelector('.hqvq') || {}).firstChild || {}).textContent : (tool.out === 'lostOut' ? 'Lost article' : 'GMP question');
    var timeEl = out.querySelector('.lf-time'), asked = '';
    if (timeEl) { var m = timeEl.textContent.match(/Question time:\s*([^·(]+)/); asked = m ? m[1].trim() : ''; }
    var hm = v.querySelector('.hqvm'); if (!asked && hm) { var mm = hm.textContent.match(/Asked:\s*(.+)$/); asked = mm ? mm[1].trim() : ''; }
    return { id: Date.now(), tool: tool.name, q: (q || '').trim(), verdict: verdict, lean: leaning(v), asked: asked || new Date().toLocaleString(), place: placeLine($(tool.panel)), outcome: '', note: '' };
  }
  function logUI(tool) {
    var panel = $(tool.panel), out = $(tool.out);
    if (!panel || !out) return;
    var det = document.createElement('details');
    det.className = 'rv-log';
    det.innerHTML = '<summary><span class="rv-log-t">Your question log</span><span class="rv-log-n"></span></summary><div class="rv-log-b"></div>';
    out.insertAdjacentElement('afterend', det);
    function render() {
      var all = qlog().filter(function (e) { return e.tool === tool.name; });
      var judged = all.filter(function (e) { return e.outcome && e.lean !== 'mixed'; });
      var match = judged.filter(function (e) { return (e.outcome === 'yes') === (e.lean === 'yes'); }).length;
      det.querySelector('.rv-log-n').textContent = all.length ? all.length + (judged.length ? ' · ' + T('{a} of {b} came true', { a: match, b: judged.length }) : '') : T('empty');
      var body = det.querySelector('.rv-log-b');
      if (!all.length) { body.innerHTML = '<p class="rv-log-empty">Each answer you get here is saved on this device. Come back later and mark whether it happened to see how often the readings come true.</p>'; return; }
      body.innerHTML = '<ul>' + all.map(function (e) {
        return '<li data-id="' + e.id + '"><div class="rv-log-h"><b>' + esc(e.q) + '</b><span class="rv-lean rv-lean-' + e.lean + '">' + esc(e.verdict) + '</span></div>' +
          '<div class="rv-log-m">' + esc(e.asked) + (e.place ? ' · ' + esc(e.place.split(' · ')[0]) : '') + '</div>' +
          '<div class="rv-log-a"><label>What happened <select data-k="outcome"><option value="">Not known yet</option><option value="yes"' + (e.outcome === 'yes' ? ' selected' : '') + '>It happened</option><option value="no"' + (e.outcome === 'no' ? ' selected' : '') + '>It did not happen</option></select></label>' +
          '<input data-k="note" placeholder="Note" value="' + esc(e.note || '') + '"><button type="button" data-k="del" aria-label="Delete this entry">Delete</button></div></li>';
      }).join('') + '</ul>';
    }
    det.addEventListener('change', function (ev) {
      var li = ev.target.closest('li[data-id]'); if (!li) return;
      var l = qlog(), e = l.find(function (x) { return String(x.id) === li.dataset.id; }); if (!e) return;
      e[ev.target.dataset.k] = ev.target.value; qsave(l); if (ev.target.dataset.k === 'outcome') render();
    });
    det.addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-k="del"]'); if (!b) return;
      var id = b.closest('li').dataset.id; qsave(qlog().filter(function (x) { return String(x.id) !== id; })); render();
    });
    var t;
    new MutationObserver(function () {
      clearTimeout(t);
      t = setTimeout(function () {
        var v = tool.find(out); if (!v || v.dataset.rvLogged) return;
        var e = qEntry(tool, out, v);
        v.dataset.rvLogged = String(e.id);
        var l = qlog();
        var dup = l.find(function (x) { return x.tool === e.tool && x.asked === e.asked && x.verdict === e.verdict && x.q === e.q; });
        if (!dup) { l.unshift(e); qsave(l); }
        render();
      }, 300);
    }).observe(out, { childList: true, subtree: true });
    render();
  }
  QTOOLS.forEach(logUI);

  /* ---------- Alarms: say what works with the app closed ---------- */
  (function () {
    var panel = $('alarmPanel'); if (!panel || !window.GA_ALARM || GA_ALARM.kind() !== 'web') return;
    var note = document.createElement('div');
    note.className = 'rv-anote';
    note.innerHTML = '<p><b>Alarms ring while GuruAgasthiya is open</b> on this device, in a tab or as an installed app. For alerts when it is closed, use <b>Add to Calendar</b>.</p><div class="rv-anote-b"></div>';
    var first = panel.querySelector('.cell'); (first || panel.firstChild).insertAdjacentElement('afterend', note);
    var b = note.querySelector('.rv-anote-b');
    function sync() {
      if (!('Notification' in window)) { b.innerHTML = '<span>This browser cannot show notifications.</span>'; return; }
      var p = Notification.permission;
      if (p === 'granted') b.innerHTML = '<span class="rv-ok">Notifications are on.</span>';
      else if (p === 'denied') b.innerHTML = '<span>Notifications are blocked. Allow them in your browser\'s site settings to see alarms outside this tab.</span>';
      else { b.innerHTML = '<button type="button">Allow notifications</button>'; b.querySelector('button').addEventListener('click', function () { Notification.requestPermission().then(sync); }); }
    }
    sync();
  })();

  /* ---------- Keyboard: timing rows can be reached and opened ---------- */
  function keyRows() {
    document.querySelectorAll('li.row:not([tabindex])').forEach(function (li) {
      li.tabIndex = 0;
      var n = li.querySelector('.n, .ckt'), t = li.querySelector('.t b, .t2 b');
      if (n || t) li.setAttribute('aria-label', [t && t.textContent, n && n.textContent].filter(Boolean).join(', ') + '. Press Enter for details.');
    });
  }
  document.addEventListener('keydown', function (e) {
    var li = e.target;
    if ((e.key === 'Enter' || e.key === ' ') && li.matches && li.matches('li.row[tabindex]')) { e.preventDefault(); li.click(); }
  });
  if (window.rvOnChange) window.rvOnChange(keyRows);
  keyRows();

  /* ---------- First-run setup: language, ayanamsa, home place ---------- */
  var setup = (function () {
    var lang = $('gaLang'), ayan = $('ayan');
    var dlg = document.createElement('dialog');
    dlg.className = 'rv-dialog rv-setup'; dlg.id = 'rvSetup'; dlg.setAttribute('aria-labelledby', 'rvSetupT');
    dlg.innerHTML =
      '<div class="rv-dlg-head"><img class="rv-setup-logo" alt="" src="' + ((document.querySelector('.brand .logo') || {}).src || '') + '"><h2 id="rvSetupT">Welcome to GuruAgasthiya <span class="tm">வணக்கம்</span></h2></div>' +
      '<div class="rv-dlg-body">' +
        '<p class="rv-setup-lead">Three quick choices and the app is ready. You can change them later in Settings.</p>' +
        '<section class="rv-set-sec"><h3>Your home place</h3><div class="rv-setup-place"><input type="search" id="rvSetupQ" placeholder="Search a city or town" autocomplete="off"><button type="button" id="rvSetupLoc">Use my location</button></div><ul class="rv-setup-res" id="rvSetupRes"></ul><p class="rv-setup-pick" id="rvSetupPick"></p><p class="rv-setup-approx" id="rvSetupApprox"></p></section>' +
        '<section class="rv-set-sec rv-set-rows"><h3>Language and system</h3><div class="langrow"><label for="rvSetupLang">Language</label><select id="rvSetupLang"></select></div><div class="langrow"><label for="rvSetupAyan">Ayanamsa</label><select id="rvSetupAyan"></select></div></section>' +
      '</div>' +
      '<div class="rv-dlg-foot"><button type="button" class="rv-skip" data-close>Skip for now</button><button type="button" class="rv-done" id="rvSetupGo">Start</button></div>';
    document.body.appendChild(dlg);
    var sl = dlg.querySelector('#rvSetupLang'), sa = dlg.querySelector('#rvSetupAyan');
    var q = dlg.querySelector('#rvSetupQ'), res = dlg.querySelector('#rvSetupRes'), pickEl = dlg.querySelector('#rvSetupPick');
    var chosen = null;
    var C = window.GA_CITY, idx = null;
    function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
    function search(text) {
      if (!C) return [];
      if (!idx) idx = C.c.map(function (r) { return norm(r[0]); });
      var k = norm(text.trim()); if (k.length < 2) return [];
      var a = [], b = [];
      for (var i = 0; i < idx.length && a.length < 8; i++) { var at = idx[i].indexOf(k); if (at === 0) a.push(i); else if (at > 0 && b.length < 8) b.push(i); }
      return a.concat(b).slice(0, 8).map(function (i) { var r = C.c[i]; return { name: r[0], cc: C.cc[r[1]], lat: r[2], lon: r[3], tz: C.tz[r[4]], st: (C.st && C.st[r[5]]) || '' }; });
    }
    q.addEventListener('input', function () {
      if (chosen && chosen.loc) { chosen = null; pick(''); }
      approxN++; approxEl.textContent = '';
      var list = search(q.value);
      res.innerHTML = list.map(function (x, i) { return '<li><button type="button" data-i="' + i + '">' + esc(x.name) + '<span>' + esc([x.st, x.cc].filter(Boolean).join(', ')) + '</span></button></li>'; }).join('');
      res._list = list;
    });
    res.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-i]'); if (!b) return;
      chosen = res._list[+b.dataset.i];
      pickEl.textContent = T('Home place: {place}', { place: chosen.name + ', ' + [chosen.st, chosen.cc].filter(Boolean).join(', ') });
      res.innerHTML = ''; q.value = chosen.name;
    });
    // "Use my location" asks the browser at once, through the engine's own button, and shows the
    // answer here: the place found, or why it failed. The engine reports in #msg ("Location set: …",
    // or an error), so watch that rather than refreshing the timings blindly.
    var locBtn = dlg.querySelector('#rvSetupLoc'), goBtn = dlg.querySelector('#rvSetupGo'), locWatch = null;
    function pick(text, bad) { pickEl.textContent = text; pickEl.classList.toggle('err', !!bad); }
    var approxEl = dlg.querySelector('#rvSetupApprox'), approxN = 0;
    function cityAt(i) { var r = C.c[i]; return { name: r[0], cc: C.cc[r[1]], lat: r[2], lon: r[3], tz: C.tz[r[4]], st: (C.st && C.st[r[5]]) || '' }; }
    function nearest(p) {
      // The listed city with the name the lookup gave, if there is one near those coordinates (the
      // lookup names the town the connection belongs to); otherwise the closest listed place within 60 km.
      if (!C) return null;
      var k = Math.cos(p.lat * Math.PI / 180), want = p.city ? norm(p.city) : '';
      var best = -1, bd = Infinity, named = -1, nd = Infinity;
      for (var i = 0; i < C.c.length; i++) {
        var r = C.c[i], dy = r[2] - p.lat, dx = (r[3] - p.lon) * k, d = dy * dy + dx * dx;
        if (d < bd) { bd = d; best = i; }
        if (want && d < nd && norm(r[0]) === want) { nd = d; named = i; }
      }
      if (named >= 0 && Math.sqrt(nd) * 111 < 60) return cityAt(named);
      return best >= 0 && Math.sqrt(bd) * 111 < 60 ? cityAt(best) : null;
    }
    // When the browser gives no position, ask where the network connection is from (city-level, often
    // off by some distance) and offer the nearest listed city, clearly marked as approximate.
    function fromNetwork(url, read) {
      return fetch(url, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
        var p = j && read(j);
        return p && isFinite(p.lat) && isFinite(p.lon) ? p : null;
      });
    }
    function suggestApprox() {
      var n = ++approxN;
      approxEl.textContent = T('Looking up the approximate place of your connection…');
      fromNetwork('https://ipwho.is/', function (j) { return j.success === false ? null : { lat: +j.latitude, lon: +j.longitude, city: j.city }; })
        .catch(function () { return null; })
        .then(function (p) { return p || fromNetwork('https://get.geojs.io/v1/ip/geo.json', function (j) { return { lat: +j.latitude, lon: +j.longitude, city: j.city }; }); })
        .catch(function () { return null; })
        .then(function (p) {
          if (n !== approxN) return;
          var city = p && nearest(p);
          if (!city) { approxEl.textContent = T('The approximate place could not be found either. Search for a city.'); return; }
          var label = city.name + ', ' + [city.st, city.cc].filter(Boolean).join(', ');
          approxEl.textContent = '';
          approxEl.appendChild(document.createTextNode(T('Your connection seems to be near {place} (approximate). ', { place: label })));
          var b = document.createElement('button'); b.type = 'button'; b.textContent = T('Use {place}', { place: city.name });
          b.addEventListener('click', function () {
            chosen = city; res.innerHTML = ''; q.value = city.name; approxEl.textContent = '';
            pick(T('Home place: {place} (approximate, from your connection)', { place: label }));
          });
          approxEl.appendChild(b);
        });
    }
    function stopWatch() { if (locWatch) { locWatch(); locWatch = null; } locBtn.disabled = false; goBtn.disabled = false; }
    locBtn.addEventListener('click', function () {
      var lb = $('loc'), m = $('msg');
      stopWatch(); chosen = null; res.innerHTML = ''; q.value = ''; approxN++; approxEl.textContent = '';
      if (!lb || !m || !navigator.geolocation) { pick(T('Location is not available in this browser. Search for a city instead.'), true); suggestApprox(); return; }
      pick(T('Finding your location… The browser may ask for permission.'));
      locBtn.disabled = true; goBtn.disabled = true;
      var mo = new MutationObserver(check);
      // The engine tries twice (12 s, then 25 s with high accuracy) before it gives up.
      var t = setTimeout(function () { stopWatch(); pick(T('Finding your location took too long. Try again, or search for a city.'), true); suggestApprox(); }, 45000);
      locWatch = function () { mo.disconnect(); clearTimeout(t); };
      function check() {
        var text = m.textContent;
        if (m.classList.contains('err')) {
          stopWatch();
          // The engine's three cases: permission refused (1), no position from the device (2), timed out (3).
          var why = /denied|blocked/i.test(text) ? 'denied' : /not available/i.test(text) ? 'unavailable' : 'other';
          pick(why === 'denied'
            ? T('Location permission was denied or blocked. Allow location for this site in the browser (the icon beside the address), then try again, or search for a city.')
            : why === 'unavailable'
              ? T('Your device gave no position. On a computer, allow location for the browser in the system settings (Mac: System Settings → Privacy & Security → Location Services) and keep Wi‑Fi on. On a phone, switch on Location. Then try again, or search for a city.')
              : T('Could not get your location. Try again, or search for a city.'), true);
          if (why !== 'denied') suggestApprox();
        } else if (/^Location set/.test(text)) {
          stopWatch();
          var name = (text.match(/^Location set: (.+?) · /) || [])[1] || T('My location');
          chosen = { loc: true }; pick(T('Home place: {place}', { place: name }));
        }
      }
      mo.observe(m, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class'] });
      lb.click();
    });
    function applyPlace(x) {
      // Same steps the engine uses: all countries, the name in the search box, then pick the city.
      var co = $('plCountry'), se = $('plSearch'), ci = $('place');
      if (co) { for (var i = 0; i < co.options.length; i++) if (co.options[i].value === '*a') { co.value = '*a'; fire(co, 'change'); break; } }
      if (se) { se.value = x.name; fire(se, 'input'); }
      if (ci) {
        var hit = -1;
        for (var j = 0; j < ci.options.length; j++) { var t = ci.options[j].text; if (t.indexOf(x.name) === 0 && t.indexOf(x.cc) >= 0 && (!x.st || t.indexOf(x.st) >= 0)) { hit = j; break; } }
        if (hit < 0) for (var k = 0; k < ci.options.length; k++) if (ci.options[k].text.indexOf(x.name) === 0) { hit = k; break; }
        if (hit >= 0) { ci.selectedIndex = hit; fire(ci, 'change'); }
      }
    }
    goBtn.addEventListener('click', function () {
      if (lang && sl.value && lang.value !== sl.value) { lang.value = sl.value; fire(lang, 'change'); }
      if (ayan && sa.value && ayan.value !== sa.value) { ayan.value = sa.value; fire(ayan, 'change'); }
      // A found location is already set in the engine; a searched city is applied here.
      if (chosen && !chosen.loc) applyPlace(chosen);
      store('rvSetup', 1); dlg.close();
      var go = $('go'); if (go) setTimeout(function () { go.click(); }, 300);
      toast(T('All set. Your choices are saved on this device.'));
    });
    dlg.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', function () { stopWatch(); store('rvSetup', 1); dlg.close(); }); });
    function open() {
      if (lang) sl.innerHTML = lang.innerHTML, sl.value = lang.value;
      if (ayan) sa.innerHTML = ayan.innerHTML, sa.value = ayan.value;
      stopWatch(); chosen = null; pick(''); q.value = ''; res.innerHTML = ''; approxN++; approxEl.textContent = '';
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      setTimeout(function () { q.focus(); }, 50);
    }
    // First visit only: no earlier setup and no place chosen in the engine before.
    if (!store('rvSetup') && !store('ga_place')) setTimeout(open, 600);
    return { open: open };
  })();
  // "Set up again" lives in the Settings popup.
  (function () {
    var foot = document.querySelector('#rvSettings .rv-dlg-foot');
    if (!foot) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'rv-skip'; b.textContent = 'Set up home place';
    b.addEventListener('click', function () { $('rvSettings').close(); setup.open(); });
    foot.insertBefore(b, foot.lastChild);
  })();

  /* ---------- Main buttons show that they are working ----------
     The engine calculates in one go, which freezes the page for a few seconds on big ranges.
     Show "working" on the button first, then let the engine run. */
  (function () {
    var replay = false;
    document.addEventListener('click', function (e) {
      var b = e.target.closest('.sheet .btns > button.primary, #mainForm .btns > button.primary');
      if (!b || replay || b.disabled) return;
      if (b.classList.contains('rv-busy')) { e.stopImmediatePropagation(); e.preventDefault(); return; }
      e.stopImmediatePropagation(); e.preventDefault();
      b.classList.add('rv-busy'); b.setAttribute('aria-busy', 'true');
      requestAnimationFrame(function () {
        setTimeout(function () {
          var t0 = performance.now(); replay = true;
          try { b.click(); } finally { replay = false; }
          var sheet = b.closest('.sheet'), out = sheet && sheet.querySelector('[id$="Out"]');
          var finished = false;
          function done() { if (finished) return; finished = true; b.classList.remove('rv-busy'); b.removeAttribute('aria-busy'); }
          if (performance.now() - t0 > 80 || !out) { done(); return; } // the work already ran
          // The engine works in steps: wait until its result stops changing (at most 20 s).
          var idle, mo = new MutationObserver(function () { clearTimeout(idle); idle = setTimeout(stop, 400); });
          function stop() { mo.disconnect(); done(); }
          mo.observe(out, { childList: true, subtree: true, characterData: true });
          idle = setTimeout(stop, 1200); setTimeout(stop, 20000);
        }, 30);
      });
    }, true);
    // Result summaries ("16 timings listed …") are read out by screen readers.
    document.querySelectorAll('.sheet [id$="Msg"], .sheet .msg, #msg').forEach(function (m) {
      m.setAttribute('role', 'status'); m.setAttribute('aria-live', 'polite');
    });
  })();

  /* ---------- Settings: problem log ---------- */
  (function () {
    var body = document.querySelector('#rvSettings .rv-dlg-body'); if (!body) return;
    var sec = document.createElement('section');
    sec.className = 'rv-set-sec rv-errlog hide';
    sec.innerHTML = '<h3>Problem log</h3><p class="rv-errlog-n"></p><div class="rv-errlog-b"><button type="button" data-a="copy">Copy problem log</button><button type="button" data-a="clear">Clear</button></div>';
    body.appendChild(sec);
    function log() { try { return JSON.parse(localStorage.getItem('rvErrors') || '[]'); } catch (e) { return []; } }
    function sync() {
      var l = log(); sec.classList.toggle('hide', !l.length);
      sec.querySelector('.rv-errlog-n').textContent = T(l.length === 1 ? '1 problem was recorded on this device.' : '{n} problems were recorded on this device.', { n: l.length });
    }
    sec.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.a === 'copy') {
        var text = 'GuruAgasthiya ' + VERSION + ' · ' + navigator.userAgent + '\n' + log().map(function (x) { return x.at + ' ' + x.page + ' ' + x.msg + (x.where ? ' (' + x.where + ')' : ''); }).join('\n');
        copyText(text).then(function () { toast(T('Problem log copied. Paste it into a message to the developer.')); }, function () { toast(T('Copying is blocked here.')); });
      } else { try { localStorage.removeItem('rvErrors'); } catch (x) {} sync(); }
    });
    var d = $('rvSettings'); if (d) d.addEventListener('close', sync);
    document.querySelector('.rv-setbtn') && document.querySelector('.rv-setbtn').addEventListener('click', sync);
    sync();
  })();

  /* ---------- Lighter start-up: the world map outline loads after the page ---------- */
  (function () {
    if (window.GA_LAND) return;
    var loaded = false;
    function load() {
      if (loaded) return; loaded = true;
      var s = document.createElement('script'); s.src = 'data/land.js'; document.body.appendChild(s);
    }
    ['acBtn', 'bpAcg'].forEach(function (id) { var b = $(id); if (b) b.addEventListener('pointerdown', load, { capture: true }); });
    if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 2500 }); else setTimeout(load, 1500);
  })();
})();
