/* GuruAgasthiya revamp: the place picker in every tool folds to one line ("Tiruchirappalli · 10.816, 78.697 · Change"). */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  // Text with values goes through the translation layer (revamp/i18n.js); {name} marks a value.
  function T(text, v) {
    var t = window.rvT ? window.rvT(text) : text;
    return t.replace(/\{(\w+)\}/g, function (m, k) { return v && v[k] != null ? v[k] : m; });
  }
  if (!$('stage')) return;
  /* ---------- Place picker folds to one line: "Tiruchirappalli · 10.816, 78.697 · Change" ---------- */
  // Fields are found by their control ids first, since labels change with the chosen language.
  var IDRE = { City: /(city|^place)$/i, Recent: /recent/i, Latitude: /lat$/i, Longitude: /lon$/i, Time: /tz$/i, Country: /(country|state|city|^place)$/i };
  function cellBy(group, re) {
    var key = (re.source.match(/[A-Z][a-z]+/) || [''])[0], idre = IDRE[key];
    var cells = [].slice.call(group.querySelectorAll('.cell'));
    return (idre && cells.find(function (c) {
      return [].some.call(c.querySelectorAll('input,select'), function (x) { return idre.test(x.id); });
    })) || cells.find(function (c) {
      var l = c.querySelector('.cl'); return l && re.test(l.textContent);
    });
  }
  function ctrlVal(cell) {
    if (!cell) return '';
    var sel = cell.querySelector('select');
    if (sel && sel.selectedIndex >= 0) return (sel.options[sel.selectedIndex].text || '').trim();
    var inp = cell.querySelector('input'); return inp ? (inp.value || '').trim() : '';
  }
  var PIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/></svg>';
  var places = [];
  document.querySelectorAll('.sheet .group').forEach(function (g) {
    if (!g.querySelector('.cell.search') || g.closest('details.rv-place')) return;
    // Take the following place groups too (country/state/city, then coordinates), up to the latitude group.
    var extra = [], coords = null, n = g.nextElementSibling;
    while (n && !coords) {
      if (n.classList.contains('group')) {
        if (cellBy(n, /Latitude/i)) { coords = n; extra.push(n); break; }
        if (cellBy(n, /Country|State|City|Town|Place/i)) { extra.push(n); n = n.nextElementSibling; continue; }
        break;
      }
      if (n.tagName === 'DETAILS' || n.classList.contains('btns')) break;
      n = n.nextElementSibling;
    }
    if (!coords) extra = [];
    var det = document.createElement('details');
    det.className = 'rv-place';
    det.innerHTML = '<summary><span class="rv-pin">' + PIN + '</span><span class="rv-place-t"><b></b><span></span></span><span class="rv-place-c">Change</span></summary>';
    g.parentNode.insertBefore(det, g);
    det.appendChild(g);
    extra.forEach(function (x) { det.appendChild(x); });
    var placeGroups = [g].concat(extra.filter(function (x) { return x !== coords; }));
    var p = { det: det, place: { querySelectorAll: function (s) { return placeGroups.reduce(function (a, x) { return a.concat([].slice.call(x.querySelectorAll(s))); }, []); }, querySelector: function (s) { return g.querySelector(s); } }, coords: coords };
    places.push(p);
    det.addEventListener('toggle', function () {
      det.querySelector('.rv-place-c').textContent = T(det.open ? 'Done' : 'Change');
      if (det.open) { var s = g.querySelector('.cell.search input'); if (s) s.focus(); }
      updatePlace(p);
    });
    det.addEventListener('change', function () { updatePlace(p); });
    det.addEventListener('input', function () { updatePlace(p); });
    updatePlace(p);
  });
  function updatePlace(p) {
    var name = ctrlVal(cellBy(p.place, /City|Town/i)) || ctrlVal(cellBy(p.place, /Recent/i)) || '';
    if (/^(choose|select|—|-|all )/i.test(name)) name = ctrlVal(cellBy(p.place, /Recent/i)) || name;
    // 10.5's city list answers a miss with a sentence ("No match in the offline list. Type the latitude…"):
    // that is advice, not a place. Show what was searched for, or say the place is set by coordinates.
    var citySel = (cellBy(p.place, /City|Town/i) || p.det).querySelector('select');
    var noMatch = citySel && citySel.selectedIndex >= 0 && citySel.options[citySel.selectedIndex].value === '';
    if (noMatch || /no match|type the latitude|search online/i.test(name)) name = ctrlVal(cellBy(p.place, /Search/i)) || '';
    var c = p.coords || p.place, lat = ctrlVal(cellBy(c, /Latitude/i)), lon = ctrlVal(cellBy(c, /Longitude/i));
    var tz = ctrlVal(cellBy(c, /Time Zone/i));
    p.det.querySelector('.rv-place-t b').textContent = name || (lat && lon ? T('Place by coordinates') : T('Choose a place'));
    p.det.querySelector('.rv-place-t span').textContent =
      [lat && lon ? lat + ', ' + lon : '', tz].filter(Boolean).join(' · ') || T('Search any city or town');
  }
  // The engine fills places in code (recent places, "use my location"), so refresh while a tool is open.
  setInterval(function () {
    places.forEach(function (p) { if (!p.det.open && p.det.offsetParent) updatePlace(p); });
  }, 1200);
})();
