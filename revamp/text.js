/* GuruAgasthiya revamp: tidy what the engine prints: long notes fold behind "Read more", each tool page shows its icon,
   repeated date chips are hidden, and the disclaimer is asked once a day. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  // Text with values goes through the translation layer (revamp/i18n.js); {name} marks a value.
  function T(text, v) {
    var t = window.rvT ? window.rvT(text) : text;
    return t.replace(/\{(\w+)\}/g, function (m, k) { return v && v[k] != null ? v[k] : m; });
  }
  if (!$('stage')) return;
  /* ---------- Long explanations fold behind "Read more" ---------- */
  var LONG = 240;
  function fold(el) {
    if (el.dataset.rvFold) return;
    el.dataset.rvFold = '1';
    if ((el.textContent || '').length < LONG) return;
    el.classList.add('rv-folded');
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'rv-more'; b.setAttribute('aria-expanded', 'false');
    b.textContent = 'Read more';
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = el.classList.toggle('rv-folded') === false;
      b.setAttribute('aria-expanded', String(open));
      b.textContent = T(open ? 'Show less' : 'Read more');
    });
    el.insertAdjacentElement('afterend', b);
    var cs = getComputedStyle(el); // line the button up with the text it folds
    b.style.marginLeft = (parseFloat(cs.marginLeft) || 0) + (parseFloat(cs.paddingLeft) || 0) + 'px';
    // The engine shows and hides some notes by id; keep the button in step.
    new MutationObserver(function () { b.classList.toggle('hide', el.classList.contains('hide')); })
      .observe(el, { attributes: true, attributeFilter: ['class'] });
    b.classList.toggle('hide', el.classList.contains('hide'));
  }
  var FOLD_SEL = '.legend, .gmnote, .sheet .sub, .sheet .note, .sheet .intro, .sheet p.hint';
  function foldAll(rootEl) { (rootEl || document).querySelectorAll(FOLD_SEL).forEach(fold); }
  foldAll();
  window.rvOnChange(function () { foldAll(); });

  /* ---------- Long result lists show a first page, then "Show more" ----------
     A wide date range can print thousands of timing rows, often as one list per day. Rows after the
     first page are hidden on screen only, together with any day whose rows are all hidden: Copy, Print
     and Add to calendar still see every row, and Jump to now unfolds first. */
  var PAGE = 60, FOLD_AT = 90;
  function foldOut(out) {
    var rows = [].slice.call(out.querySelectorAll('li.row'));
    // Already done for this render? A re-run with the same row count replaces the rows and drops the bar.
    if (out.getAttribute('data-rvrows') === String(rows.length) && (rows.length <= FOLD_AT || out.querySelector(':scope > .rv-more-bar'))) return;
    out.setAttribute('data-rvrows', String(rows.length));
    var old = out.querySelector(':scope > .rv-more-bar'); if (old) old.remove();
    out.querySelectorAll('.rv-hide-more').forEach(function (el) { el.classList.remove('rv-hide-more'); });
    if (rows.length <= FOLD_AT) return;
    var shown = PAGE;
    var bar = document.createElement('div'); bar.className = 'rv-more-bar';
    var note = document.createElement('span'); note.className = 'rv-more-note';
    var more = document.createElement('button'); more.type = 'button'; more.className = 'rv-more-rows';
    var all = document.createElement('button'); all.type = 'button'; all.className = 'rv-more-rows rv-more-all';
    bar.appendChild(note); bar.appendChild(more); bar.appendChild(all);
    function paint() {
      rows.forEach(function (r, i) { r.classList.toggle('rv-hide-more', i >= shown); });
      // a list with nothing left to show goes too, with the day heading printed just before it
      out.querySelectorAll('ul, ol').forEach(function (ul) {
        var own = ul.querySelectorAll(':scope > li.row'); if (!own.length) return;
        var none = ![].some.call(own, function (li) { return !li.classList.contains('rv-hide-more'); });
        ul.classList.toggle('rv-hide-more', none);
        var h = ul.previousElementSibling;
        if (h && !h.querySelector('li.row') && /^(H[1-6]|DIV|P)$/.test(h.tagName) && h.textContent.trim().length < 80) h.classList.toggle('rv-hide-more', none);
      });
      var left = rows.length - shown;
      note.textContent = T('Showing {shown} of {total}', { shown: Math.min(shown, rows.length), total: rows.length });
      more.textContent = T('Show {n} more', { n: Math.min(PAGE, Math.max(left, 0)) });
      all.textContent = T('Show all');
      bar.classList.toggle('hide', left <= 0);
    }
    more.addEventListener('click', function () { shown += PAGE; paint(); });
    all.addEventListener('click', function () { shown = rows.length; paint(); });
    out.appendChild(bar); paint();
    out.rvUnfold = function () { shown = rows.length; paint(); };
  }
  function foldLists() {
    document.querySelectorAll('[id$="Out"]').forEach(function (out) { if (out.querySelector('li.row')) foldOut(out); });
  }
  foldLists();
  window.rvOnChange(foldLists);
  // Jump to now may target a hidden row: unfold first.
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-act="now"]'); if (!b) return;
    var sheet = b.closest('.sheet') || document;
    sheet.querySelectorAll('[data-rvrows]').forEach(function (out) { if (out.rvUnfold) out.rvUnfold(); });
  }, true);

  /* ---------- Fold-out summaries: one run of text beside the icon ----------
     The summary is a flex row (icon, text, chevron). A summary written as text + <span> + text became
     three flex items that wrapped on their own ("My places ·" / "என் இடங்கள்" / "(save…)"). */
  function wrapSummaries() {
    document.querySelectorAll('.sheet details.howto > summary').forEach(function (s) {
      if (s.querySelector(':scope > .rv-sum')) return;
      var span = document.createElement('span'); span.className = 'rv-sum';
      while (s.firstChild) span.appendChild(s.firstChild);
      s.appendChild(span);
    });
  }
  wrapSummaries();
  window.rvOnChange(wrapSummaries);

  /* ---------- Sheets: the tool's icon leads its header ---------- */
  document.querySelectorAll('.sheet').forEach(function (s) {
    s.classList.add('rv-drawer');
    var btn = $(s.id.replace(/Panel$/, 'Btn')), head = s.querySelector('.sh-head');
    var ic = btn && btn.querySelector('.ic svg');
    if (head && ic && !head.querySelector('.rv-shic')) {
      var box = document.createElement('span');
      box.className = 'rv-shic'; box.setAttribute('aria-hidden', 'true');
      box.appendChild(ic.cloneNode(true));
      head.insertBefore(box, head.firstChild);
    }
  });

  /* ---------- Timing rows: show the date chip only where the date changes ---------- */
  function dedupeDates() {
    document.querySelectorAll('ul').forEach(function (ul) {
      var prev = null;
      for (var li = ul.firstElementChild; li; li = li.nextElementSibling) {
        if (!li.classList.contains('row')) continue;
        var d = li.querySelector(':scope > .rdate span');
        var t = d ? d.textContent : null;
        li.classList.toggle('rv-same', !!t && t === prev);
        if (t) prev = t;
      }
      // A list under a dated section heading does not need the first chip either.
      var first = ul.querySelector(':scope > li.row'), sec = ul.previousElementSibling;
      if (first && sec && sec.classList.contains('lf-sec') && sec.querySelector('h3')) {
        var fd = first.querySelector(':scope > .rdate span');
        if (fd && /\d/.test(sec.textContent) && fd.textContent.indexOf(sec.querySelector('h3').textContent.trim().split(' ')[0]) >= 0) first.classList.add('rv-same');
      }
    });
  }
  window.rvOnChange(dedupeDates);
  dedupeDates();

  /* ---------- Disclaimer: once per day ----------
     The engine shows it before every tool. After it is accepted, it is accepted
     again automatically for the rest of that calendar day, before the box is painted. */
  var disc = $('gaDisc'), discOk = $('gaDiscOk'), DKEY = 'rvDiscDay';
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function acceptedToday() { try { return localStorage.getItem(DKEY) === today(); } catch (e) { return false; } }
  if (disc && discOk) {
    var auto = false;
    discOk.addEventListener('click', function () {
      if (!auto) { try { localStorage.setItem(DKEY, today()); } catch (e) {} }
    });
    var check = function () {
      if (!disc.classList.contains('hide') && acceptedToday()) { auto = true; discOk.click(); auto = false; }
    };
    new MutationObserver(check).observe(disc, { attributes: true, attributeFilter: ['class'] });
    check(); // it may already be showing
  }
})();
