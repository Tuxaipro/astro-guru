
(function(){
"use strict";
var stage=document.getElementById('stage'),
    scr=document.getElementById('screen'), scroller=document.getElementById('scroller');

/* ---------- scrollIntoView: keep sheets self-contained ---------- */
var origSIV=Element.prototype.scrollIntoView;
Element.prototype.scrollIntoView=function(o){
  if(this.classList&&this.classList.contains('sheet')){this.scrollTop=0;return;}
  return origSIV.call(this,o);
};

/* ---------- View modes: Mobile / Desktop ---------- */
var KEY='gaView2', vp=document.querySelector('meta[name=viewport]');
var VP_NATIVE='width=device-width, initial-scale=1, viewport-fit=cover';
function smallDevice(){return Math.min(screen.width,screen.height)<700;}
function stored(){try{return localStorage.getItem(KEY);}catch(e){return null;}}
function save(v){try{localStorage.setItem(KEY,v);}catch(e){}}
function setView(v,persist){
  stage.dataset.view=v;
  document.querySelectorAll('.viewswitch button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.v===v));});
  /* On a phone, Desktop lays the page out on a wide landscape canvas and lets the phone zoom it to fit */
  if(vp&&smallDevice())vp.setAttribute('content',v==='desktop'?'width=1100, viewport-fit=cover':VP_NATIVE);
  if(persist)save(v);
}
document.querySelectorAll('.viewswitch button').forEach(function(b){
  b.addEventListener('click',function(){setView(b.dataset.v,true);});
});
var pref=stored();
setView(pref==='mobile'||pref==='desktop'?pref:(smallDevice()||window.innerWidth<760?'mobile':'desktop'),false);

document.querySelectorAll('.tool').forEach(function(t){var x=t.querySelector('.tx');if(x)t.title=x.firstChild.textContent.trim();});

/* ---------- Slider fill, time readout and scale ---------- */
var sl=document.getElementById('slider'), slT=document.getElementById('slTime')||{}, slS=document.getElementById('slScale'), last=null;
function hhmm(m){m=((m%1440)+1440)%1440;return ('0'+Math.floor(m/60)).slice(-2)+':'+('0'+(m%60)).slice(-2);}
function startMin(){var t=(document.getElementById('time').value||'00:00').split(':');return (+t[0])*60+(+t[1]||0);}
function slUpd(force){
  var v=+sl.value, mx=+sl.max||1440;
  if(!force&&v===last)return; last=v;
  sl.style.setProperty('--p',(v/mx*100)+'%');
  slT.textContent=hhmm(startMin()+v);
  sl.setAttribute('aria-valuetext',slT.textContent);
}
function slScale(){var s0=startMin(),mx=+sl.max||1440;slS.innerHTML=[0,.25,.5,.75,1].map(function(f){return '<span>'+(f===1&&s0===0?'24:00':hhmm(s0+Math.round(mx*f)))+'</span>';}).join('');slUpd(true);}
sl.addEventListener('input',function(){slUpd();});
setInterval(slUpd,200);
document.getElementById('go').addEventListener('click',function(){setTimeout(slScale,60);});
slScale();

/* ---------- Reasons collapse behind a Details button ---------- */
function addWhy(root){
  if(root.nodeType!==1)return;
  var list=root.matches&&root.matches('.chk')?[root]:[].slice.call(root.querySelectorAll?root.querySelectorAll('li.row .chk'):[]);
  list.forEach(function(chk){
    if(chk.dataset.why||!chk.closest('li.row'))return;
    chk.dataset.why='1'; chk.classList.add('folded');
    var b=document.createElement('button');
    b.type='button'; b.className='whybtn'; b.setAttribute('aria-expanded','false');
    b.innerHTML='<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.6"/><path d="M8 7.2v4M8 4.9v.1"/></svg><span>Show Details</span>';
    b.addEventListener('click',function(ev){
      ev.stopPropagation(); ev.preventDefault();
      var open=chk.classList.toggle('folded')===false;
      b.setAttribute('aria-expanded',String(open));
      b.querySelector('span').textContent=open?'Hide Details':'Show Details';
    });
    chk.parentNode.insertBefore(b,chk);
  });
}
addWhy(document.body);
new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(addWhy);});}).observe(document.body,{childList:true,subtree:true});

/* ---------- Large title collapses into the nav bar ---------- */
var nav=document.getElementById('navbar'), big=document.getElementById('bigTitle');
if('IntersectionObserver' in window){
  new IntersectionObserver(function(es){es.forEach(function(e){nav.classList.toggle('scrolled',!e.isIntersecting);});},
    {root:scroller,rootMargin:'-44px 0px 0px 0px',threshold:0}).observe(big);
}

/* ---------- Tamil runs get Mukta Malar ---------- */
var TA_RE=/[\u0B80-\u0BFF]+(?:[\s\-,.\/()0-9\u200C\u200D]*[\u0B80-\u0BFF]+)*/g;
var SKIP={SCRIPT:1,STYLE:1,TEXTAREA:1,OPTION:1,SELECT:1,INPUT:1,title:1,TITLE:1};
function wrapNode(t){
  var p=t.parentNode; if(!p||SKIP[p.nodeName]||p.namespaceURI==='http://www.w3.org/2000/svg')return;
  if(p.classList&&p.classList.contains('tm'))return;
  if(document.body.getAttribute('data-lang')==='ta')return;
  var s=t.nodeValue; TA_RE.lastIndex=0; if(!TA_RE.test(s))return; TA_RE.lastIndex=0;
  var frag=document.createDocumentFragment(), last=0, m;
  while((m=TA_RE.exec(s))){
    if(m.index>last)frag.appendChild(document.createTextNode(s.slice(last,m.index)));
    var sp=document.createElement('span');sp.className='tm';sp.textContent=m[0];frag.appendChild(sp);
    last=m.index+m[0].length;
  }
  if(last<s.length)frag.appendChild(document.createTextNode(s.slice(last)));
  p.replaceChild(frag,t);
}
function walk(root){
  if(root.nodeType===3){wrapNode(root);return;}
  if(root.nodeType!==1||SKIP[root.nodeName]||root.namespaceURI==='http://www.w3.org/2000/svg')return;
  if(root.classList.contains('tm'))return;
  var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null), list=[], n;
  while((n=w.nextNode()))list.push(n);
  list.forEach(wrapNode);
}
walk(document.body);
new MutationObserver(function(ms){
  ms.forEach(function(m){
    if(m.type==='characterData'){wrapNode(m.target);return;}
    m.addedNodes.forEach(walk);
  });
}).observe(document.body,{childList:true,subtree:true,characterData:true});

/* ---------- Sheets ---------- */
var sheets=[].slice.call(document.querySelectorAll('.sheet'));
var CLOSE={chartPop:'cpClose',lostPanel:'lostClose',rangePanel:'rgClose',racePanel:'rcClose',gpPanel:'gpClose',cmPanel:'cmClose',abPanel:'abClose',cuspPanel:'cuspClose',bpPanel:'bpClose',acPanel:'acClose',ltPanel:'ltClose',mmPanel:'mmClose',ckPanel:'ckClose',m3Panel:'m3Close',tpPanel:'tpClose',mkPanel:'mkClose',clPanel:'clClose',spPanel:'spClose',mpPanel:'mpClose',eqPanel:'eqClose',ftPanel:'ftClose',gamPanel:'gamClose',ntPanel:'ntClose'};
var lastFocus=null;
var STACK=[];
function restack(){STACK=STACK.filter(function(s){var h=s.classList.contains('hide');if(h)s.classList.remove('under');return !h;});var top=null;STACK.forEach(function(s,i){s.style.zIndex=s.id==='chartPop'?80:50+i;if(s.id!=='chartPop')top=s;});STACK.forEach(function(s){s.classList.toggle('under',s.id!=='chartPop'&&s!==top);});}
function openSheet(){return STACK.filter(function(s){return !s.classList.contains('hide');});}
function sync(){
  var open=openSheet();
  scr.classList.toggle('has-sheet',open.length>0);stage.classList.toggle('sheet-open',open.length>0);
  var popEl=document.getElementById('chartPop'),top=open.indexOf(popEl)>=0?popEl:open[open.length-1];
  if(open.length){var x=document.getElementById(CLOSE[top.id]);if(x&&document.activeElement&&!top.contains(document.activeElement))setTimeout(function(){x.focus({preventScroll:true});},60);}
  else if(lastFocus){try{lastFocus.focus({preventScroll:true});}catch(e){} lastFocus=null;}
}
sheets.forEach(function(s){new MutationObserver(function(){if(!s.classList.contains('hide')&&STACK.indexOf(s)<0)STACK.push(s);restack();sync();}).observe(s,{attributes:true,attributeFilter:['class']});});
function closeAll(except){openSheet().forEach(function(s){if(s!==except){var b=document.getElementById(CLOSE[s.id]);if(b)b.click();}});}
document.querySelector('.tools').addEventListener('click',function(e){
  var b=e.target.closest('.tool'); if(!b)return;
  lastFocus=b;
  var map={lostBtn:'lostPanel',rangeBtn:'rangePanel',raceBtn:'racePanel',gpBtn:'gpPanel',cmBtn:'cmPanel',abBtn:'abPanel',cuspBtn:'cuspPanel',bpBtn:'bpPanel',acBtn:'acPanel',ltBtn:'ltPanel',mmBtn:'mmPanel',ckBtn:'ckPanel',m3Btn:'m3Panel',tpBtn:'tpPanel',mkBtn:'mkPanel',clBtn:'clPanel',spBtn:'spPanel',mpBtn:'mpPanel',eqBtn:'eqPanel',ftBtn:'ftPanel',gamBtn:'gamPanel',ntBtn:'ntPanel'};
  closeAll(document.getElementById(map[b.id]));
},true);
function closeTop(){var pop=document.getElementById('chartPop');if(!pop.classList.contains('hide')){pop.classList.add('hide');return;}var o=openSheet(),t=o[o.length-1];if(t){var b=document.getElementById(CLOSE[t.id]);if(b)b.click();}}
document.getElementById('scrim').addEventListener('click',closeTop);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&openSheet().length)closeTop();});

/* ---------- Home button and post-run scroll ---------- */
document.getElementById('homeBtn').addEventListener('click',function(){
  closeAll(null);
  var a=document.getElementById('colA');
  (a.scrollHeight>a.clientHeight?a:scroller).scrollTo({top:0,behavior:'smooth'});
});
document.getElementById('go').addEventListener('click',function(){
  if(quietRun)return;
  setTimeout(function(){
    if(stage.dataset.view==='mobile'){
      var c=document.getElementById('nowcard');
      if(c.style.display==='block'){
        var sr=scroller.getBoundingClientRect(), k=sr.height/scroller.clientHeight||1;
        var y=scroller.scrollTop+(c.getBoundingClientRect().top-sr.top)/k-nav.offsetHeight-12;
        scroller.scrollTo({top:Math.max(0,y),behavior:'smooth'});
      }
    } else {
      var b=document.getElementById('colB'); b.scrollTo({top:0,behavior:'smooth'});
    }
  },120);
});

/* ---------- Journey: summary of the chosen day and place ---------- */
var mf=document.getElementById('mainForm'), res=document.getElementById('results'), quietRun=false;
var DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], MO=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function v(id){return document.getElementById(id).value;}
function summary(){
  var d=(v('date')||'').split('-'), dt=new Date(Date.UTC(+d[0],+d[1]-1,+d[2]));
  var t=v('time')||'00:00', pl=document.getElementById('place'), tz=parseFloat(v('tz'))||0;
  var pn=(window.GA_PL&&window.GA_PL())||'';
  var place=(!pn||/entered/.test(pn))?(parseFloat(v('lat')).toFixed(2)+', '+parseFloat(v('lon')).toFixed(2)):pn;
  var off='UTC'+(tz>=0?'+':'−')+Math.floor(Math.abs(tz))+(Math.abs(tz)%1?':'+('0'+Math.round(Math.abs(tz)%1*60)).slice(-2):'');
  document.getElementById('fsDate').textContent=DOW[dt.getUTCDay()]+', '+dt.getUTCDate()+' '+MO[dt.getUTCMonth()]+' '+dt.getUTCFullYear()+(t!=='00:00'?' · from '+t:'');
  document.getElementById('fsPlace').textContent=place+' · '+off+' · '+(v('ayan')==='kp'?'KP':'Lahiri');
}
document.getElementById('go').addEventListener('click',function(){
  setTimeout(function(){ var bad=document.getElementById('msg').classList.contains('err'); if(!res.classList.contains('hide')&&!bad){summary();mf.classList.add('collapsed');} else if(bad){mf.classList.remove('collapsed');} syncJump(); },30);
});
document.getElementById('fsEdit').addEventListener('click',function(){
  mf.classList.remove('collapsed'); setTimeout(function(){document.getElementById('date').focus();},30);
});

/* ---------- Journey: phone navigation bar ---------- */
var jb=document.getElementById('jumpbar');
function syncJump(){
  var on=stage.dataset.view==='mobile'&&!res.classList.contains('hide');
  jb.classList.toggle('hide',!on); nav.classList.toggle('has-jump',on);
}
jb.addEventListener('click',function(e){
  var b=e.target.closest('button'); if(!b)return;
  var t=b.dataset.j==='tools'?document.querySelector('.tools'):document.getElementById(b.dataset.j);
  t.scrollIntoView({behavior:'smooth',block:'start'});
});
function markJump(){
  if(jb.classList.contains('hide'))return;
  var top=scroller.getBoundingClientRect().top+120, cur='nowcard';
  ['nowcard','results','tools'].forEach(function(k){var el=k==='tools'?document.querySelector('.tools'):document.getElementById(k);if(el.getBoundingClientRect().top<=top)cur=k;});
  jb.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.j===cur));});
}
scroller.addEventListener('scroll',markJump,{passive:true});
document.getElementById('toDesk').addEventListener('click',function(){setView('desktop',true);syncJump();});
document.querySelectorAll('.viewswitch button').forEach(function(b){b.addEventListener('click',function(){setTimeout(syncJump,0);});});

/* ---------- Journey: show today's timings straight away ---------- */
if(res.classList.contains('hide')){ quietRun=true; document.getElementById('go').click(); quietRun=false; setTimeout(markJump,100); }

/* ---------- Every timing shows its date ---------- */
var DPAL=['#007AFF','#FF9500','#34C759','#AF52DE','#FF2D55','#30B0C7','#5856D6'];
function dateOf(ms,tz){var d=new Date(ms+tz*3600000);return {txt:DOW[d.getUTCDay()]+', '+d.getUTCDate()+' '+MO[d.getUTCMonth()]+' '+d.getUTCFullYear(),k:Math.floor((ms+tz*3600000)/86400000)};}
var CAL='<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3" width="12" height="11" rx="2.2"/><path d="M2 6.5h12M5.5 1.8v2.6M10.5 1.8v2.6"/></svg>';
function addDate(root){
  if(root.nodeType!==1)return;
  var rows=root.matches&&root.matches('li.row')?[root]:[].slice.call(root.querySelectorAll?root.querySelectorAll('li.row'):[]);
  rows.forEach(function(li){
    if(li.querySelector(':scope > .rdate'))return;
    var ms=+(li.dataset.s||li.dataset.ms), tz=parseFloat(li.dataset.tz);
    if(!ms||isNaN(tz))return;
    var d=dateOf(ms,tz), el=document.createElement('div');
    el.className='rdate'; el.style.setProperty('--dc',DPAL[((d.k%7)+7)%7]);
    el.innerHTML=CAL+'<span>'+d.txt+'</span>';
    li.insertBefore(el,li.firstChild);
  });
}
addDate(document.body);
new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(addDate);});}).observe(document.body,{childList:true,subtree:true});
})();

