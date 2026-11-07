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
