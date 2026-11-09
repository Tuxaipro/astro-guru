/* GuruAgasthiya revamp: new app shell on top of the unchanged v7.7 engine.
   Only moves and decorates existing elements (ids and listeners stay intact). */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  // Text with values goes through the translation layer (revamp/i18n.js); {name} marks a value.
  function T(text, v) {
    var t = window.rvT ? window.rvT(text) : text;
    return t.replace(/\{(\w+)\}/g, function (m, k) { return v && v[k] != null ? v[k] : m; });
  }
  var stage = $('stage'), root = document.documentElement;
  if (!stage) return;

  /* ---------- One shared page watcher ----------
     Several parts of the revamp tidy up what the engine draws (folding long text, date chips, keyboard
     access). One observer for the whole page, run once after the page settles, instead of one each. */
  var changeFns = [], changeT = null;
  window.rvOnChange = function (fn) { changeFns.push(fn); };
  new MutationObserver(function () {
    if (changeT) return;
    changeT = setTimeout(function () {
      changeT = null;
      changeFns.forEach(function (fn) { try { fn(); } catch (e) { report(e); } });
    }, 150);
  }).observe(document.body, { childList: true, subtree: true });

  /* ---------- Problems are shown, not silent ----------
     A script error shows one short notice with a Reload button, and is kept (last 20) so it can be
     copied from Settings and sent for a fix. */
  var ERR_KEY = 'rvErrors', errNote = null;
  function report(err, where) {
    var msg = String((err && (err.message || err.reason)) || err || 'Unknown error').split('\n')[0].slice(0, 300);
    if (/ResizeObserver loop|Script error\.?$/.test(msg)) return;
    try {
      var log = JSON.parse(localStorage.getItem(ERR_KEY) || '[]');
      log.unshift({ at: new Date().toISOString(), page: location.hash, msg: msg, where: where || '' });
      localStorage.setItem(ERR_KEY, JSON.stringify(log.slice(0, 20)));
    } catch (e) {}
    if (errNote) return;
    errNote = document.createElement('div');
    errNote.className = 'rv-errnote'; errNote.setAttribute('role', 'alert');
    errNote.innerHTML = '<span></span><button type="button" data-a="reload"></button><button type="button" data-a="x" aria-label="Close">✕</button>';
    errNote.querySelector('span').textContent = T('Something went wrong on this page. Reload to try again.');
    errNote.querySelector('[data-a=reload]').textContent = T('Reload');
    errNote.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.a === 'reload') location.reload(); else { errNote.remove(); }
    });
    document.body.appendChild(errNote);
  }
  window.rvReport = report;
  window.addEventListener('error', function (e) { report(e.error || e.message, (e.filename || '').split('/').pop() + ':' + e.lineno); });
  window.addEventListener('unhandledrejection', function (e) { report(e.reason, 'promise'); });
  document.body.classList.add('rv');

  /* ---------- Layout follows the window, no phone mock-up ---------- */
  var WIDE = 900;
  function wantView() { return window.innerWidth >= WIDE ? 'desktop' : 'mobile'; }
  function applyView() {
    var v = wantView();
    if (stage.dataset.view !== v) {
      var b = stage.querySelector('.viewswitch button[data-v="' + v + '"]') || document.querySelector('.viewswitch button[data-v="' + v + '"]');
      if (b) b.click(); else stage.dataset.view = v;
    }
    document.body.classList.toggle('rv-m', v === 'mobile');
    placeNow();
  }
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(applyView, 120); });
  // The old Mobile/Desktop switch could save "desktop" and widen a phone's viewport to 1100px,
  // which would make the window look wide. Drop that choice and restore the device viewport first.
  try { localStorage.removeItem('gaView2'); } catch (e) {}
  var vpMeta = document.querySelector('meta[name=viewport]');
  if (vpMeta && /width=1100/.test(vpMeta.getAttribute('content') || '')) {
    vpMeta.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover');
  }
  setTimeout(applyView, 300);

  /* ---------- Tool groups ---------- */
  var GROUPS = [
    { id: 'today', name: 'Timings', ta: 'நேரங்கள்', tools: ['homeBtn', 'clBtn', 'm3Btn', 'cmBtn', 'rangeBtn', 'epBtn', 'gamBtn', 'ftBtn'] },
    { id: 'charts', name: 'Charts', ta: 'ஜாதகங்கள்', tools: ['bpBtn', 'cuspBtn', 'acBtn'] },
    { id: 'ask', name: 'Questions', ta: 'கேள்விகள்', tools: ['akBtn', 'gpBtn', 'hqBtn', 'lostBtn'] },
    { id: 'wealth', name: 'Money and markets', ta: 'பணம், சந்தை', tools: ['mmBtn', 'mpBtn', 'tpBtn', 'ntBtn', 'mkBtn', 'spBtn', 'ltBtn'] },
    { id: 'sport', name: 'Sport', ta: 'விளையாட்டு', tools: ['ckBtn', 'raceBtn'] },
    { id: 'research', name: 'Research', ta: 'ஆய்வு', tools: ['eqBtn'] },
  ];
  var nav = document.querySelector('nav.tools'), grid = nav && nav.querySelector('.tgrid');
  var groupsEl = document.createElement('div');
  groupsEl.className = 'rv-groups';
  if (grid) {
    var placed = {};
    GROUPS.forEach(function (g) {
      var sec = document.createElement('section');
      sec.className = 'rv-group'; sec.dataset.g = g.id;
      sec.innerHTML = '<h3 class="rv-gh">' + g.name + ' <span class="tm">' + g.ta + '</span></h3><div class="rv-gl"></div>';
      var list = sec.lastChild;
      g.tools.forEach(function (id) { var b = $(id); if (b) { list.appendChild(b); placed[id] = 1; } });
      groupsEl.appendChild(sec);
    });
    // Anything not listed (future tools from a newer APK) lands in "More".
    var rest = [].slice.call(grid.querySelectorAll('.tool')).filter(function (b) { return !placed[b.id] && b.id !== 'abBtn'; });
    var about = $('abBtn');
    var more = document.createElement('section');
    more.className = 'rv-group'; more.dataset.g = 'more';
    more.innerHTML = '<h3 class="rv-gh">More <span class="tm">மேலும்</span></h3><div class="rv-gl"></div>';
    rest.forEach(function (b) { more.lastChild.appendChild(b); });
    if (about) more.lastChild.appendChild(about);
    groupsEl.appendChild(more);
    grid.replaceWith(groupsEl);
    var h = nav.querySelector('h2.sec'); if (h) h.remove();
    // Every tool's icon tile gets its own hue (revamp.css turns --ich into the tile and stroke colours
    // for each theme). Hues step round the wheel by the golden angle, so neighbours never look alike,
    // and a tool keeps its hue wherever it is listed.
    [].slice.call(groupsEl.querySelectorAll('.tool')).forEach(function (b, i) {
      b.style.setProperty('--ich', String(Math.round((25 + i * 137.5) % 360)));
    });
  }

  /* ---------- Tool search ---------- */
  var search = document.createElement('div');
  search.className = 'rv-search';
  search.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg>' +
    '<input type="search" id="rvFind" placeholder="Find a tool" aria-label="Find a tool" autocomplete="off">' +
    '<kbd class="rv-kbd">/</kbd>';
  var find = search.querySelector('input');
  if (nav) nav.insertBefore(search, nav.firstChild);
  var empty = document.createElement('p');
  empty.className = 'rv-empty hide';
  empty.textContent = 'No tool matches that. Try a word like muhurtham, chart or market.';
  groupsEl.appendChild(empty);
  function norm(s) { return (s || '').toLowerCase().replace(/[^a-z0-9஀-௿]+/g, ' '); }
  find.addEventListener('input', function () {
    var q = norm(find.value).trim(), any = false;
    groupsEl.querySelectorAll('.rv-group').forEach(function (sec) {
      var n = 0;
      sec.querySelectorAll('.tool').forEach(function (b) {
        var hit = !q || q.split(' ').every(function (w) { return norm(b.textContent + ' ' + (b.dataset.s || '')).indexOf(w) >= 0; });
        b.classList.toggle('rv-hide', !hit); if (hit) n++;
      });
      sec.classList.toggle('rv-hide', !n); if (n) any = true;
    });
    empty.classList.toggle('hide', any);
  });
  find.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      var b = groupsEl.querySelector('.tool:not(.rv-hide)');
      if (b) { b.click(); closeTools(); find.value = ''; find.dispatchEvent(new Event('input')); find.blur(); }
    }
    if (e.key === 'Escape') { find.value = ''; find.dispatchEvent(new Event('input')); find.blur(); }
  });
  document.addEventListener('keydown', function (e) {
    var t = e.target, typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    if (!typing && (e.key === '/' || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)))) {
      e.preventDefault(); if (stage.dataset.view === 'mobile') openTools(); find.focus(); find.select();
    }
  });

  /* ---------- Current tool highlight ---------- */
  var current = 'homeBtn';
  function mark(id) {
    current = id;
    document.querySelectorAll('.rv-groups .tool').forEach(function (b) {
      var on = b.id === id; b.classList.toggle('rv-on', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
  }
  document.querySelectorAll('.rv-groups .tool').forEach(function (b) {
    b.addEventListener('click', function () { mark(b.id); if (stage.dataset.view === 'mobile') closeTools(); });
  });
  /* ---------- Desktop pages: "Now" (home) and "Lagna Timings"; other tools fill the same workspace ---------- */
  var page = 'now';
  try { if (localStorage.getItem('rvPage') === 'lagna') page = 'lagna'; } catch (e) {}
  function pageBtn() { return page === 'now' ? 'rvNowBtn' : 'homeBtn'; }
  function setPage(p) {
    page = p;
    document.body.classList.toggle('rv-p-now', p === 'now');
    document.body.classList.toggle('rv-p-lagna', p === 'lagna');
    try { localStorage.setItem('rvPage', p); } catch (e) {}
    var sc = $('scroller'), ca = $('colA');
    if (sc) sc.scrollTop = 0;
    if (ca) ca.scrollTop = 0;
    renderNext();
  }
  var nowBtn = document.createElement('button');
  nowBtn.type = 'button'; nowBtn.id = 'rvNowBtn'; nowBtn.className = 'tool rv-nowbtn';
  nowBtn.innerHTML = '<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg></span>' +
    '<span class="tx">Now<span class="tm">இப்போது</span></span>';
  nowBtn.style.setProperty('--ich', '238'); // the app's indigo, like the other tiles when Now is not the page shown
  groupsEl.insertBefore(nowBtn, groupsEl.firstChild);
  nowBtn.addEventListener('click', function () { setPage('now'); mark('rvNowBtn'); }); // the engine closes any open tool
  var homeBtn = $('homeBtn');
  if (homeBtn) homeBtn.addEventListener('click', function () { setPage('lagna'); });
  // One tool at a time: the engine's own close list misses a few tools (Practical Electional, Horary),
  // which would stay open underneath, so close every other open tool before the new one opens.
  if (nav) nav.addEventListener('click', function (e) {
    var b = e.target.closest('.tool'); if (!b) return;
    var target = b.id.replace(/Btn$/, 'Panel');
    document.querySelectorAll('.sheet:not(.hide)').forEach(function (s) {
      if (s.id === target) return;
      var x = s.querySelector('.sh-head .xbtn, [id$="Close"]'); if (x) x.click(); else s.classList.add('hide');
    });
  }, true);
  // Tool names show as tooltips when the sidebar is narrowed to icons.
  groupsEl.querySelectorAll('.tool').forEach(function (b) {
    var t = b.querySelector('.tx'); if (t && !b.title) b.title = (t.firstChild && t.firstChild.textContent || t.textContent).trim();
  });

  /* ---------- Routes: every sidebar item is its own page, at #/<name> ----------
     Tools render in the page area, in the normal flow of the page, instead of as panels over it.
     The browser's back and forward buttons, reload and bookmarks all work. */
  var ROUTES = {}, BTN_ROUTE = {};
  function slugOf(t) { return t.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  // Each tool's address is fixed here, so a link works whatever language the sidebar starts in (with Tamil
  // stored, the engine has already translated the button titles by the time the routes are built, and a
  // slug made from a Tamil title is empty). A tool from a newer APK falls back to its English title, then
  // to its id.
  var SLUGS = {
    homeBtn: 'lagna-timings', clBtn: 'live-transit-clock', m3Btn: '3-11-muhurtham', cmBtn: 'chandra-muhurtham',
    rangeBtn: 'date-range-muhurtham', epBtn: 'practical-electional-muhurtham', gamBtn: 'guru-agasthiya-muhurtham',
    ftBtn: 'fortuna-timing', bpBtn: 'birth-chart', cuspBtn: 'cuspal-chart', acBtn: 'astrocartography',
    akBtn: 'ask-guruagasthiya', gpBtn: 'gmp-prasnam', hqBtn: 'horary-answers', lostBtn: 'lost-and-found',
    mmBtn: 'money-manifestation', mpBtn: 'money-profit-muhurtham', tpBtn: 'trade-profit', ntBtn: 'natal-chart-trade',
    mkBtn: 'market-transit', spBtn: 'speculation-research', ltBtn: 'lottery-rules', ckBtn: 'cricket-wicket',
    raceBtn: 'horse-race', eqBtn: 'mundane-astrology', abBtn: 'about'
  };
  groupsEl.querySelectorAll('.tool').forEach(function (b) {
    var r = b.id === 'rvNowBtn' ? 'now' : SLUGS[b.id] || slugOf(b.title || '') || slugOf(b.id.replace(/Btn$/, ''));
    ROUTES[r] = b.id; BTN_ROUTE[b.id] = r; b.dataset.route = r;
  });
  function isBase(r) { return r === 'now' || r === 'lagna-timings'; }
  function baseRoute() { return page === 'lagna' ? 'lagna-timings' : 'now'; }
  // Tools move into one page area; the timing-detail popup (chartPop) stays a popup.
  var pagesEl = document.createElement('main');
  pagesEl.id = 'rvPages'; pagesEl.className = 'rv-pages';
  var appEl = document.querySelector('.app');
  if (appEl) appEl.appendChild(pagesEl);
  document.querySelectorAll('.sheet').forEach(function (sh) { if (sh.id !== 'chartPop') pagesEl.appendChild(sh); });
  function openTool() {
    var o = [].slice.call(pagesEl.querySelectorAll('.sheet:not(.hide)'));
    return o.filter(function (x) { return !x.classList.contains('under'); }).pop() || o.pop() || null;
  }
  function routeOfSheet(sh) { return sh ? BTN_ROUTE[sh.id.replace(/Panel$/, 'Btn')] : null; }
  var route = null, routing = false;
  function readRoute() { var h = decodeURIComponent(location.hash.replace(/^#\/?/, '')); return ROUTES[h] ? h : null; }
  function setUrl(r, push) {
    var url = '#/' + r; if (location.hash === url) return;
    if (push) history.pushState({ rv: 1 }, '', url); else history.replaceState(history.state, '', url);
  }
  function titleOf(r) {
    var b = $(ROUTES[r]), t = b && b.querySelector('.tx');
    var name = t ? ((t.firstChild && t.firstChild.textContent) || t.textContent).trim() : '';
    return (name ? name + ' · ' : '') + 'GuruAgasthiya';
  }
  function show(r) {
    var changed = r !== route; route = r;
    if (isBase(r)) {
      routing = true; closeSheets(); routing = false;
      document.body.classList.remove('rv-p-tool');
      setPage(r === 'now' ? 'now' : 'lagna');
    } else {
      var id = ROUTES[r], panel = $(id.replace(/Btn$/, 'Panel'));
      if (panel && panel.classList.contains('hide')) { routing = true; $(id).click(); routing = false; }
      document.body.classList.add('rv-p-tool');
      if (changed) {
        var sc = $('scroller'); if (sc) sc.scrollTop = 0;
        // Keyboard and screen-reader users start at the page's heading (after the engine focuses ✕).
        setTimeout(function () {
          var h = panel && panel.querySelector('.sh-head h2');
          if (h && !panel.classList.contains('hide')) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
        }, 120);
      }
    }
    mark(ROUTES[r]); document.title = titleOf(r); syncTabs();
    if (stage.dataset.view === 'mobile') closeTools();
  }
  function go(r) { setUrl(r, true); show(r); }
  // A click in the sidebar moves to that tool's address (the engine opens the tool as usual).
  groupsEl.addEventListener('click', function (e) {
    var b = e.target.closest('.tool'); if (!b || routing) return;
    var r = BTN_ROUTE[b.id]; if (r) go(r);
  });
  window.addEventListener('popstate', function () { show(readRoute() || baseRoute()); });
  window.addEventListener('hashchange', function () { var r = readRoute(); if (r && r !== route) show(r); });
  // Tools also open and close from inside the engine (✕, Esc, Astro Map from Birth Chart):
  // the address follows whichever tool is showing, or the page underneath when none is.
  function discOpen() { var d = $('gaDisc'); return !!(d && !d.classList.contains('hide')); }
  new MutationObserver(function () {
    if (routing || discOpen()) return;
    var sh = openTool(), r = routeOfSheet(sh);
    if (r && r !== route) { setUrl(r, false); show(r); }
    else if (!sh && route && !isBase(route)) {
      // ✕ or Esc closed the tool: return to the page underneath (Now or Lagna Timings).
      setUrl(baseRoute(), false); show(baseRoute());
    }
    syncTabs();
  }).observe(pagesEl, { subtree: true, attributes: true, attributeFilter: ['class'] });

  /* "Next timings" card on the Now page, read from the Lagna Timings list. */
  var nextCard = document.createElement('section');
  nextCard.id = 'rvNext'; nextCard.className = 'rv-next';
  nextCard.setAttribute('aria-labelledby', 'rvNextH');
  nextCard.innerHTML = '<div class="rv-next-head"><h2 id="rvNextH">Next timings <span class="tm">அடுத்த நேரங்கள்</span></h2><span class="rv-next-sub"></span></div>' +
    '<ol class="rv-next-list"></ol><button type="button" class="rv-next-all">See all Lagna timings</button>';
  if ($('colA') && $('nowcard')) $('colA').insertBefore(nextCard, $('nowcard').nextSibling);
  nextCard.querySelector('.rv-next-all').addEventListener('click', function () { if (homeBtn) homeBtn.click(); });
  // Text of an element without its bilingual copies (.tm, .ta), which the language setting shows or hides.
  function txt(el) {
    if (!el) return '';
    var c = el.cloneNode(true);
    c.querySelectorAll('.tm,.ta,.tt').forEach(function (x) { x.remove(); });
    return c.textContent.replace(/\s+/g, ' ').trim();
  }
  function renderNext() {
    if (page !== 'now' || stage.dataset.view !== 'desktop') return;
    var rows = [].slice.call(document.querySelectorAll('#list > li.row'));
    var t = Date.now(), i = rows.findIndex(function (r) { return +r.dataset.e > t; });
    var ol = nextCard.querySelector('.rv-next-list'), sub = nextCard.querySelector('.rv-next-sub');
    var day = txt($('fsDate')).replace(/ · from.*/, ''), live = i >= 0 && +rows[i].dataset.ms <= t;
    if (!rows.length) { ol.innerHTML = ''; sub.textContent = T('Open Lagna Timings and choose a day.'); return; }
    if (i < 0) i = 0;
    sub.textContent = live ? day : T('The list is set to {day}. Change the day in Lagna Timings.', { day: day });
    ol.innerHTML = '';
    rows.slice(i, i + 6).forEach(function (r, k) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'rv-next-row' + (k === 0 && live ? ' rv-cur' : '');
      var tags = [].slice.call(r.querySelectorAll('.pill')).map(txt).filter(Boolean).slice(0, 2);
      b.innerHTML = '<span class="rv-nt"><b></b><small></small></span><span class="rv-nl"><b></b><small></small></span>';
      b.querySelector('.rv-nt b').textContent = txt(r.querySelector('.t b'));
      b.querySelector('.rv-nt small').textContent = k === 0 && live ? T('now') : txt(r.querySelector('.t span'));
      b.querySelector('.rv-nl b').textContent = txt(r.querySelector('.l .n'));
      b.querySelector('.rv-nl small').textContent = [txt(r.querySelector('.l .c')).replace(/ ascendant.*/, '')].concat(tags).join(' · ');
      b.addEventListener('click', function () {
        if (homeBtn) homeBtn.click();
        setTimeout(function () {
          r.scrollIntoView({ block: 'center' });
          r.classList.remove('rv-flash'); void r.offsetWidth; r.classList.add('rv-flash');
          r.focus({ preventScroll: true });
        }, 80);
      });
      b.querySelectorAll('b,small').forEach(function (x) { x.setAttribute('data-rvtr', ''); });
      li.appendChild(b); ol.appendChild(li);
    });
  }
  var nt;
  if ($('list')) new MutationObserver(function () { clearTimeout(nt); nt = setTimeout(renderNext, 150); }).observe($('list'), { childList: true });
  setInterval(renderNext, 20000);
  document.addEventListener('rv-lang', renderNext);

  /* Lagna Timings has no chart beside it. Tapping a row still sets the chart to that time,
     so the chart slides in from the right only then. */
  var colBEl = $('colB');
  function peek(on) {
    document.body.classList.toggle('rv-peek', on);
    if (on && colBEl) colBEl.scrollTop = 0;
  }
  if (colBEl) {
    var peekX = document.createElement('button');
    peekX.type = 'button'; peekX.className = 'rv-x rv-peek-x'; peekX.setAttribute('aria-label', 'Close chart');
    peekX.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg>';
    peekX.addEventListener('click', function () { peek(false); });
    colBEl.insertBefore(peekX, colBEl.firstChild);
  }
  if ($('list')) $('list').addEventListener('click', function (e) {
    if (page !== 'lagna' || stage.dataset.view !== 'desktop') return;
    if (e.target.closest('button,details,summary,a,input,select') || !e.target.closest('li.row')) return;
    peek(true);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('rv-peek') && !document.querySelector('.sheet:not(.hide)')) peek(false);
  });
  if (nav) nav.addEventListener('click', function (e) { if (e.target.closest('.tool')) peek(false); });

  /* The engine's live muhurtham alert (bottom corner) shows as one line; tap it for the details. */
  var live = $('gaMpLive');
  if (live) {
    live.classList.add('rv-chiplive');
    live.setAttribute('title', T('Tap for details'));
    live.addEventListener('click', function (e) {
      if (e.target.closest('.galx')) return;
      live.classList.toggle('rv-open');
    });
  }

  /* Sidebar narrows to icons (desktop). */
  var brand = document.querySelector('.side .brand');
  if (brand) {
    var sideBtn = document.createElement('button');
    sideBtn.type = 'button'; sideBtn.className = 'rv-sidebtn';
    sideBtn.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="3.5" width="15" height="13" rx="2.5"/><path d="M7.5 3.5v13"/></svg>';
    brand.appendChild(sideBtn);
    var setSide = function (min) {
      document.body.classList.toggle('rv-side-min', min);
      sideBtn.setAttribute('aria-label', T(min ? 'Show tool names' : 'Show icons only'));
      sideBtn.title = sideBtn.getAttribute('aria-label');
      sideBtn.setAttribute('aria-pressed', String(min));
      try { min ? localStorage.setItem('rvSideMin', '1') : localStorage.removeItem('rvSideMin'); } catch (e) {}
    };
    var min0 = false; try { min0 = localStorage.getItem('rvSideMin') === '1'; } catch (e) {}
    setSide(min0);
    sideBtn.addEventListener('click', function () { setSide(!document.body.classList.contains('rv-side-min')); });
    // Searching needs the names, so "/" opens the sidebar again.
    find.addEventListener('focus', function () { if (document.body.classList.contains('rv-side-min')) setSide(false); });
  }

  setPage(page);
  mark(pageBtn());
  // Start on the address in the link, or on the last page used.
  // Start once every script on the page has run (a timer could fire between two script files).
  function startRoutes() { setTimeout(function () {
    var r = readRoute(); if (!r) { r = baseRoute(); setUrl(r, false); } show(r);
    // The new layout is in place: reveal the page (it was kept behind a splash so the original layout never shows).
    requestAnimationFrame(function () { root.classList.remove('rv-boot'); });
  }, 0); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startRoutes); else startRoutes();

  /* ---------- "Rising now" leads the page ---------- */
  var nowcard = $('nowcard'), colA = $('colA'), colB = $('colB');
  if (nowcard) {
    var k = nowcard.querySelector('.k');
    if (k) k.innerHTML = '<span class="rv-pulse" aria-hidden="true"></span>Rising now <span class="tm">இப்போது உதயம்</span>';
  }
  function placeNow() {
    if (!nowcard) return;
    var host = colA; // desktop pages place it with CSS; on phones it sits under the heading
    if (!host) return;
    var after = host.querySelector('.a-head');
    var ref = after ? after.nextSibling : host.firstChild;
    if (nowcard.parentNode !== host || nowcard.previousSibling !== after) host.insertBefore(nowcard, ref);
  }

  /* ---------- Phone: bottom tab bar ---------- */
  var tabs = document.createElement('nav');
  tabs.className = 'rv-tabs';
  tabs.setAttribute('aria-label', 'Main');
  var TABS = [
    { id: 'now', label: 'Now', icon: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>' },
    { id: 'timings', label: 'Timings', icon: '<path d="M4 6h16M4 12h16M4 18h10"/>' },
    { id: 'chart', label: 'Chart', icon: '<rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M4 4l16 16M20 4 4 20"/>' },
    { id: 'tools', label: 'Tools', icon: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>' },
  ];
  tabs.innerHTML = TABS.map(function (t) {
    return '<button type="button" data-t="' + t.id + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + t.icon + '</svg><span>' + t.label + '</span></button>';
  }).join('');
  $('screen').appendChild(tabs);
  var scroller = $('scroller');
  function scrollToEl(el) {
    if (!el || !scroller) return;
    var top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 64;
    scroller.scrollTo({ top: Math.max(0, top), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  function closeSheets() {
    document.querySelectorAll('.sheet:not(.hide)').forEach(function (s) {
      var c = s.querySelector('[id$="Close"], .close, button[aria-label="Close"]'); if (c) c.click();
    });
  }
  function openTools() { stage.classList.add('rv-tools-open'); syncTabs(); }
  function closeTools() { stage.classList.remove('rv-tools-open'); syncTabs(); }
  var activeTab = 'now';
  function syncTabs() {
    var t = stage.classList.contains('rv-tools-open') || document.body.classList.contains('rv-p-tool') ? 'tools' : activeTab;
    tabs.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.t === t)); });
  }
  tabs.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var t = b.dataset.t;
    if (t === 'tools') { stage.classList.contains('rv-tools-open') ? closeTools() : openTools(); return; }
    closeTools(); if (route && !isBase(route)) { setUrl('now', true); show('now'); } activeTab = t;
    if (t === 'now') scroller.scrollTo({ top: 0, behavior: 'smooth' });
    if (t === 'timings') scrollToEl($('mainForm'));
    if (t === 'chart') scrollToEl($('chartPanel'));
    syncTabs();
  });
  var toolsHead = document.createElement('div');
  toolsHead.className = 'rv-tools-head';
  toolsHead.innerHTML = '<h2>All tools</h2><button type="button" class="rv-x" aria-label="Close tools"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg></button>';
  toolsHead.querySelector('button').addEventListener('click', closeTools);
  if (nav) nav.insertBefore(toolsHead, nav.firstChild);
  var toolsScrim = document.createElement('div');
  toolsScrim.className = 'rv-tools-scrim';
  toolsScrim.addEventListener('click', closeTools);
  $('screen').appendChild(toolsScrim);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && stage.classList.contains('rv-tools-open')) closeTools(); });

  /* ---------- Settings: language, chart colour, appearance ---------- */
  var side = document.querySelector('.side');
  var rows = side ? [].slice.call(side.querySelectorAll(':scope > .langrow')) : [];
  var intro = side && side.querySelector(':scope > p.sub');
  var GEAR = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="2.6"/><path d="M10 2.5v2.2M10 15.3v2.2M2.5 10h2.2M15.3 10h2.2M4.7 4.7l1.6 1.6M13.7 13.7l1.6 1.6M4.7 15.3l1.6-1.6M13.7 6.3l1.6-1.6"/></svg>';
  if (side && rows.length) {
    // Settings open in a popup dialog.
    var setBtn = document.createElement('button');
    setBtn.type = 'button'; setBtn.className = 'rv-settings rv-setbtn';
    setBtn.setAttribute('aria-haspopup', 'dialog');
    setBtn.innerHTML = GEAR + '<span>Settings</span>';
    side.insertBefore(setBtn, side.querySelector('.sidefoot') || null);

    var dlg = document.createElement('dialog');
    dlg.className = 'rv-dialog'; dlg.id = 'rvSettings';
    dlg.setAttribute('aria-labelledby', 'rvSetT');
    dlg.innerHTML =
      '<div class="rv-dlg-head"><span class="rv-dlg-ic">' + GEAR + '</span><h2 id="rvSetT">Settings <span class="tm">அமைப்புகள்</span></h2>' +
      '<button type="button" class="rv-x" data-close aria-label="Close settings"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg></button></div>' +
      '<div class="rv-dlg-body">' +
        '<section class="rv-set-sec"><h3>Appearance</h3><div class="rv-seg3" role="group" aria-label="Appearance">' +
          '<button type="button" data-ap="">Match device</button><button type="button" data-ap="light">Light</button><button type="button" data-ap="dark">Dark</button>' +
        '</div></section>' +
        '<section class="rv-set-sec rv-set-rows"><h3>Language and charts</h3></section>' +
      '</div>' +
      '<div class="rv-dlg-foot"><span class="rv-dlg-ver"></span><button type="button" class="rv-done" data-close>Done</button></div>';
    var rowsHost = dlg.querySelector('.rv-set-rows');
    rows.forEach(function (r) { rowsHost.appendChild(r); });
    var ver = document.querySelector('.brand .ver');
    dlg.querySelector('.rv-dlg-ver').textContent = 'GuruAgasthiya ' + (ver ? ver.textContent.trim() : '');
    document.body.appendChild(dlg);

    function setAppear(v) {
      if (v) root.setAttribute('data-theme', v); else root.removeAttribute('data-theme');
      try { v ? localStorage.setItem('rvAppear', v) : localStorage.removeItem('rvAppear'); } catch (e) {}
      dlg.querySelectorAll('[data-ap]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.ap === v)); });
    }
    var ap0 = ''; try { ap0 = localStorage.getItem('rvAppear') || ''; } catch (e) {}
    setAppear(ap0);
    dlg.querySelectorAll('[data-ap]').forEach(function (b) { b.addEventListener('click', function () { setAppear(b.dataset.ap); }); });

    function openSettings() {
      if (stage.dataset.view === 'mobile') closeTools();
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      setBtn.setAttribute('aria-expanded', 'true');
    }
    function closeSettings() { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
    dlg.addEventListener('close', function () { setBtn.setAttribute('aria-expanded', 'false'); setBtn.focus(); });
    setBtn.addEventListener('click', openSettings);
    dlg.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', closeSettings); });
    // A click on the dimmed backdrop (outside the panel) closes it.
    dlg.addEventListener('click', function (e) {
      if (e.target !== dlg) return;
      var r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeSettings();
    });
  }
  if (intro) intro.classList.add('rv-intro');


  applyView();
  syncTabs();
})();
