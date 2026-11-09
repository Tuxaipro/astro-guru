(function(){
  var b=document.getElementById('gaMaster'); if(!b)return;
  function paint(){ var on=GA_ALARM.on(), n=GA_ALARM.count(); b.textContent=(on?'\uD83D\uDD14 All alarms ON':'\uD83D\uDD15 All alarms OFF')+' \u00B7 '+n+' waiting'; b.style.color=on?'':'#c0392b'; b.setAttribute('aria-pressed',on?'true':'false'); }
  b.addEventListener('click',function(){ var on=!GA_ALARM.on(); b.disabled=true; GA_ALARM.setAll(on).then(function(){ b.disabled=false; paint(); }); });
  paint(); setInterval(paint,5000); window.gaAlmPaint=paint;
})();