
(function(){
"use strict";
const ORDER=['Ke','Ve','Su','Mo','Ma','Ra','Ju','Sa','Me'];
const NAME={Ke:'Ketu',Ve:'Venus',Su:'Sun',Mo:'Moon',Ma:'Mars',Ra:'Rahu',Ju:'Jupiter',Sa:'Saturn',Me:'Mercury'};
const TA={Ke:'கேது',Ve:'சுக்கிரன்',Su:'சூரியன்',Mo:'சந்திரன்',Ma:'செவ்வாய்',Ra:'ராகு',Ju:'குரு',Sa:'சனி',Me:'புதன்'};
const TSIGN=['மேஷம்','ரிஷபம்','மிதுனம்','கடகம்','சிம்மம்','கன்னி','துலாம்','விருச்சிகம்','தனுசு','மகரம்','கும்பம்','மீனம்'];
const TLAG=['மேஷ','ரிஷப','மிதுன','கடக','சிம்ம','கன்னி','துலா','விருச்சிக','தனுசு','மகர','கும்ப','மீன'];
const tl=g=>TA[g.lord]+'/'+TA[g.star]+'/'+TA[g.sub];
const YEARS={Ke:7,Ve:20,Su:6,Mo:10,Ma:7,Ra:18,Ju:16,Sa:19,Me:17};
const HUE={Ke:25,Ve:330,Su:40,Mo:178,Ma:2,Ra:268,Ju:75,Sa:225,Me:145};
const SIGNS=[['Aries','Ma'],['Taurus','Ve'],['Gemini','Me'],['Cancer','Mo'],['Leo','Su'],['Virgo','Me'],['Libra','Ve'],['Scorpio','Ma'],['Sagittarius','Ju'],['Capricorn','Sa'],['Aquarius','Sa'],['Pisces','Ju']];
const NAKS=['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];
const PLACES=[
 ['Chennai',13.0827,80.2707,5.5],['Pudukkottai',10.3833,78.8001,5.5],['Madurai',9.9252,78.1198,5.5],
 ['Tiruchirappalli',10.7905,78.7047,5.5],['Coimbatore',11.0168,76.9558,5.5],['Bengaluru',12.9716,77.5946,5.5],
 ['Hyderabad',17.3850,78.4867,5.5],['Mumbai',19.0760,72.8777,5.5],['Delhi',28.6139,77.2090,5.5],
 ['Kolkata',22.5726,88.3639,5.5],['Colombo',6.9271,79.8612,5.5],['Singapore',1.3521,103.8198,8],
 ['Dubai',25.2048,55.2708,4],['London',51.5074,-0.1278,0],['New York',40.7128,-74.0060,-5]
];
const rad=d=>d*Math.PI/180, deg=r=>r*180/Math.PI, mod=(a,n)=>((a%n)+n)%n;

/* ---------- 249-division KP table ---------- */
function buildTable(){
  const N=360/27, base=[];
  for(let n=0;n<27;n++){
    const si=n%9; let pos=n*N;
    for(let j=0;j<9;j++){
      const sub=ORDER[(si+j)%9], len=N*YEARS[sub]/120;
      base.push({s:pos,e:pos+len,star:ORDER[si],sub,nak:n});
      pos+=len;
    }
  }
  base[base.length-1].e=360;
  const out=[];
  for(const g of base){
    let s=g.s;
    for(let b=Math.floor((g.s+1e-9)/30)+1; b*30<g.e-1e-9; b++){
      out.push(Object.assign({},g,{s:s,e:b*30})); s=b*30;
    }
    out.push(Object.assign({},g,{s:s,e:g.e}));
  }
  out.forEach((g,i)=>{g.i=i+1; g.sign=Math.min(11,Math.floor((g.s+1e-9)/30)); g.lord=SIGNS[g.sign][1];});
  return out;
}
const SEGS=buildTable();

function findSeg(a){
  let lo=0,hi=SEGS.length-1;
  while(lo<hi){const m=(lo+hi+1)>>1; if(SEGS[m].s<=a)lo=m; else hi=m-1;}
  return lo;
}

/* ---------- astronomy ---------- */
function ayanamsa(jd,kind){
  const c=(jd-2451545)/36525;
  if(kind==='lahiri') return 23.853056+c*1.396944;
  return 23.760833+c*1.396944;   // KP, about 5.6' below Lahiri
}
function sidAsc(ms,lat,lon,kind){
  const jd=ms/86400000+2440587.5, d=jd-2451545, T=d/36525;
  const gmst=280.46061837+360.98564736629*d+0.000387933*T*T-T*T*T/38710000;
  const th=rad(mod(gmst+lon,360)), eps=rad(23.4392911-0.0130042*T);
  const y=Math.cos(th), x=-(Math.sin(th)*Math.cos(eps)+Math.tan(rad(lat))*Math.sin(eps));
  return mod(deg(Math.atan2(y,x))-ayanamsa(jd,kind),360);
}

function compute(startMs,endMs,lat,lon,kind){
  const STEP=20000, rows=[];
  let t=startMs, k=findSeg(sidAsc(t,lat,lon,kind)), segStart=t;
  for(let guard=0;guard<600;guard++){
    const target=SEGS[k].e%360;
    const passed=tt=>mod(target-sidAsc(tt,lat,lon,kind),360)>180;
    let lo=t,hi=t,found=false;
    while(hi<endMs){ hi=Math.min(hi+STEP,endMs); if(passed(hi)){found=true;break;} lo=hi; }
    if(!found){ rows.push({k:k,start:segStart,end:endMs}); break; }
    for(let i=0;i<18;i++){ const m=(lo+hi)/2; if(passed(m))hi=m; else lo=m; }
    rows.push({k:k,start:segStart,end:hi});
    segStart=hi; t=hi; k=(k+1)%SEGS.length;
    if(t>=endMs)break;
  }
  return rows;
}

/* ---------- formatting ---------- */
const p2=n=>String(n).padStart(2,'0');
let TZ=5.5, DAY0=0;
function clock(ms){
  const d=new Date(ms+TZ*3600000);
  const dayDiff=Math.floor((ms+TZ*3600000)/86400000)-Math.floor((DAY0+TZ*3600000)/86400000);
  return p2(d.getUTCHours())+':'+p2(d.getUTCMinutes())+':'+p2(d.getUTCSeconds())+(dayDiff>0?' +'+dayDiff+'d':'');
}
function dur(ms){
  const s=Math.round(ms/1000), m=Math.floor(s/60);
  return m+'m '+p2(s%60)+'s';
}
function dms(x){
  let s=Math.round(x*3600), d=Math.floor(s/3600); s-=d*3600;
  return d+'°'+p2(Math.floor(s/60))+'′'+p2(s%60)+'″';
}
function span(g){
  const b=g.sign*30;
  return SIGNS[g.sign][0]+' '+dms(g.s-b)+' – '+dms(g.e-b);
}

/* ---------- UI ---------- */
const $=id=>document.getElementById(id);
let ROWS=[], endAll=0;

(function init(){
  const now=new Date(), tzo=-now.getTimezoneOffset()/60;
  $('tz').value=tzo;
  const loc=new Date(now.getTime()-now.getTimezoneOffset()*60000);
  $('date').value=loc.toISOString().slice(0,10);
  const f=$('filter');
  f.innerHTML='<option value="all">All sub lords</option>'+ORDER.map(c=>'<option value="'+c+'">'+NAME[c]+' sub only</option>').join('');
  f.addEventListener('change',applyFilter);
  $('go').addEventListener('click',run);
  $('copy').addEventListener('click',copyText);
  $('loc').addEventListener('click',()=>plUseLoc());
  const c=Intl.DateTimeFormat().resolvedOptions().timeZone;
  $('msg').textContent='Pick a place, or use your location, then tap Show timings.'+(c?'':'');
})();

function setMsg(t,bad){const m=$('msg');m.textContent=t;m.className='msg'+(bad?' err':'');}

function useLocation(){plUseLoc();}

function run(){
  const lat=parseFloat($('lat').value), lon=parseFloat($('lon').value), tz=parseFloat($('tz').value);
  const ds=$('date').value, ts=$('time').value||'00:00';
  if(!ds||isNaN(lat)||isNaN(lon)||isNaN(tz)){setMsg('Enter a date, latitude, longitude and UTC offset.',true);return;}
  if(Math.abs(lat)>62){setMsg('Latitude beyond 62° is not supported: the ascendant behaves irregularly near the poles.',true);return;}
  const [y,m,d]=ds.split('-').map(Number), [hh,mm]=ts.split(':').map(Number);
  TZ=tz; DAY0=Date.UTC(y,m-1,d,hh,mm)-tz*3600000;
  endAll=DAY0+86400000;
  CFG={lat:lat,lon:lon,kind:$('ayan').value};
  ROWS=compute(DAY0,endAll,lat,lon,$('ayan').value);
  render();
  setMsg('');
  $('filter').value='all';
}

function render(){
  const ul=$('list'); ul.innerHTML='';
  ROWS.forEach((r,idx)=>{
    const g=SEGS[r.k], li=document.createElement('li');
    li.className='row'; li.dataset.sub=g.sub; li.dataset.idx=idx; li.dataset.ms=r.start; li.dataset.e=r.end; li.dataset.tz=TZ;
    li.style.setProperty('--h',HUE[g.sub]);
    li.innerHTML=
      '<div class="t"><b>'+clock(r.start)+'</b><span>to '+clock(r.end)+'</span></div>'+
      '<div class="l"><span class="n">'+NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub]+'</span><span class="ta">'+tl(g)+'</span><span class="c">'+SIGNS[g.sign][0]+' ascendant · '+TLAG[g.sign]+' லக்னம்</span></div>'+
      '<div class="p"><span>'+span(g)+' · '+NAKS[g.nak]+'</span><span>'+dur(r.end-r.start)+' · division '+g.i+' of '+SEGS.length+'</span></div>';
    li.addEventListener('click',()=>{stopPlay();setChartTime(Math.min(r.start+1000,endAll-1));$('chartPanel').scrollIntoView({block:'start'});});
    ul.appendChild(li);
  });
  $('results').classList.remove('hide');
  ANA=null; RUL=null; XT={}; ALM.cache={}; ALM.last=-2; try{$('almPick').classList.add('hide');}catch(e){} buildGmp(); setMode(MODE);
  initChart();
  tick();
}

function applyFilter(){
  const v=$('filter').value; let n=0;
  document.querySelectorAll('#list .row').forEach(li=>{
    const show=v==='all'||li.dataset.sub===v; li.classList.toggle('hide',!show); if(show)n++;
  });
  if(MODE==='all')$('cnt').textContent=(v==='all'?ROWS.length+' sub-lord changes in 24 hours':n+' periods of '+NAME[v]+' sub');
}

function tick(){
  const now=Date.now(), card=$('nowcard');
  let cur=-1;
  if(ROWS.length&&now>=ROWS[0].start&&now<endAll){
    cur=ROWS.findIndex(r=>now>=r.start&&now<r.end);
  }
  try{alarmCheck(cur);}catch(e){}
  document.querySelectorAll('#list .row,#gmpList .row,#anaList .row,#rulList .row').forEach(li=>li.classList.toggle('now',+li.dataset.idx===cur));
  if(cur<0){card.style.display='none';return;}
  const r=ROWS[cur], g=SEGS[r.k], left=Math.max(0,Math.round((r.end-now)/1000));
  $('nowSub').textContent=NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub];
  $('nowTa').textContent=tl(g)+' · '+TLAG[g.sign]+' லக்னம்';
  $('nowMeta').textContent=SIGNS[g.sign][0]+' ascendant · lagna lord / star lord / sub lord · changes in '+Math.floor(left/60)+'m '+p2(left%60)+'s (at '+clock(r.end)+')';
  card.style.display='block';
}
setInterval(tick,1000);

/* ---------- v5.4 live Money-Profit muhurtham: small closable notification ---------- */
var LVB={on:false,closed:false,html:''};
function lvWatch(){
  const box=$('gaMpLive'); if(!box)return;
  let r=null; const c=liveCfg();
  if(c&&typeof Astronomy!=='undefined'){
    const old=CFG; CFG={lat:c.lat,lon:c.lon,kind:c.kind};
    try{ const ms=Date.now(), cu=placidusCusps(ms,c.lat,c.lon,c.kind), P={}; CODES.forEach(k=>P[k]=sidLon(k,ms)); r=lvCore(cu,P); }catch(e){r=null;}
    finally{CFG=old;}
  }
  if(!r||!r.on){ box.style.display='none'; LVB.on=false; LVB.closed=false; LVB.html=''; return; }
  if(!LVB.on){ LVB.on=true; try{ if(navigator.vibrate)navigator.vibrate([200,100,200]); }catch(e){} }
  if(LVB.closed){ box.style.display='none'; return; }
  const g=r.g, nm=a=>a.map(p=>NAME[p]).join(' / ');
  const html='<button type="button" class="galx" aria-label="Close notification">×</button><b><i class="gald"></i>Money profit muhurtham <span class="ta">பண லாப முகூர்த்தம்</span></b>'+
   '<span>'+SIGNS[g.sign][0]+' ascendant · '+NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub]+' · rule '+(r.A&&r.B?'A+B':r.A?'A':'B')+'</span>'+
   '<span>2nd cusp star/sub: '+nm(r.c2)+' · 11th cusp star/sub: '+nm(r.c11)+(r.C?' · <u>2·11 cusp-lord link ✓</u>':'')+'</span>'+
   '<span>2nd lord '+NAME[r.L2]+' (house '+r.h2+') · 11th lord '+NAME[r.L11]+' (house '+r.h11+')</span>';
  if(html!==LVB.html){ box.innerHTML=html; LVB.html=html; }
  box.style.display='block';
}
document.addEventListener('click',e=>{ const x=e.target.closest&&e.target.closest('.galx'); if(x){ const b=$('gaMpLive'); LVB.closed=true; if(b)b.style.display='none'; } });
/* tag muhurtham rows whose 2nd/11th cusp star/sub lords are the 2nd/11th lord (or that meet live rule A/B) */
var LVQ=null;
function lvTagRows(){
  const rows=Array.prototype.slice.call(document.querySelectorAll('li.row[data-e]:not([data-lv]):not(.ckrow):not(.m3row):not(.tprow):not(.mkrow)')).filter(li=>li.dataset.s||li.dataset.ms);
  if(!rows.length||typeof Astronomy==='undefined')return;
  let i=0;
  (function step(){
    const old=CFG, t0=Date.now();
    try{
      while(i<rows.length&&Date.now()-t0<25){
        const li=rows[i++]; li.dataset.lv='1';
        const s=+(li.dataset.s||li.dataset.ms), e=+li.dataset.e, mid=(s+e)/2;
        const lat=li.dataset.lat!==undefined?+li.dataset.lat:old.lat, lon=li.dataset.lon!==undefined?+li.dataset.lon:old.lon, kind=li.dataset.kind||old.kind;
        if(isNaN(lat)||isNaN(lon)||isNaN(mid))continue;
        CFG={lat:lat,lon:lon,kind:kind};
        const cu=placidusCusps(mid,lat,lon,kind), P={}; CODES.forEach(k=>P[k]=sidLon(k,mid)); const r=lvCore(cu,P);
        if(!r.C&&!r.on)continue;
        const sp=document.createElement('span'); sp.className='pill gain lvp';
        sp.textContent=(r.on?'💰 Money profit '+(r.A&&r.B?'A+B':r.A?'A':'B')+' · ':'')+'2·11 cusp-lord link '+(r.C?'✓':'');
        sp.title='2nd cusp star/sub: '+r.c2.map(p=>NAME[p]).join('/')+' · 11th cusp star/sub: '+r.c11.map(p=>NAME[p]).join('/')+' · 2nd lord '+NAME[r.L2]+', 11th lord '+NAME[r.L11]+' (checked at the middle of the window)';
        const host=li.querySelector('.pl')||li.querySelector('.l')||li; host.appendChild(sp);
      }
    }finally{CFG=old;}
    if(i<rows.length)setTimeout(step,10);
  })();
}
new MutationObserver(()=>{ clearTimeout(LVQ); LVQ=setTimeout(lvTagRows,250); }).observe(document.body,{childList:true,subtree:true});
setInterval(lvWatch,1000); setTimeout(lvWatch,1500);


/* ================= v5.6  Practical Electional Muhurtham =================
   Rules gathered from "Electional Astrology" (Vivian E. Robson, 1937) and
   "Electional Astrology" (Joann Hampar, 2005). Western method: transits of the
   Sun..Saturn, Placidus houses, the Moon's aspects, planetary hours, dignities.
   Tropical zodiac is the default (as in both books); a sidereal option is given. */
(function(){
  var EPL=['Su','Mo','Ma','Me','Ju','Ve','Sa'], EPS=['Su','Ma','Me','Ju','Ve','Sa'];
  var DOM={Su:[4],Mo:[3],Ma:[0,7],Me:[2,5],Ju:[8,11],Ve:[1,6],Sa:[9,10]}, EXA={Su:0,Mo:1,Ma:9,Me:5,Ju:3,Ve:11,Sa:6};
  var CH=['Sa','Ju','Ma','Su','Ve','Me','Mo'], DAYR=['Su','Mo','Ma','Me','Ju','Ve','Sa'];
  var BEN={Ju:1,Ve:1}, MAL={Sa:1,Ma:1};
  var ANG=[1,4,7,10], CAD=[3,6,9,12];
  function dd(a,b){var d=Math.abs(mod(a-b,360));return d>180?360-d:d;}
  function sgn(l){return Math.floor(mod(l,360)/30);}
  function sgName(l){return SIGNS[sgn(l)][0];}
  function dg(l){return Math.floor(mod(l,30));}
  function pn(c){return NAME[c];}
  function dig(c,s){
    if(DOM[c].indexOf(s)>=0||EXA[c]===s)return 2;
    if(DOM[c].some(function(d){return (d+6)%12===s;})||(EXA[c]+6)%12===s)return -2;
    return 0;
  }
  function digTxt(c,s){var v=dig(c,s);return v>0?(DOM[c].indexOf(s)>=0?'in own sign':'exalted'):v<0?(DOM[c].some(function(d){return (d+6)%12===s;})?'in detriment':'in fall'):'';}
  var ORD=['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];

  /* ---------- planetary data with caches ---------- */
  var HC={}, RC={}, ECL=[], SUNT=[], TZF=null;
  function epReset(){HC={};RC={};ECL=[];SUNT=[];}
  function hourPos(h){
    if(HC[h])return HC[h]; var o={}, ms=h*3600000;
    EPS.forEach(function(c){o[c]=sidLon(c,ms);}); HC[h]=o; return o;
  }
  function slow(ms){
    var h=Math.floor(ms/3600000), a=hourPos(h), b=hourPos(h+1), f=(ms-h*3600000)/3600000, o={};
    EPS.forEach(function(c){var d=mod(b[c]-a[c]+180,360)-180; o[c]=mod(a[c]+d*f,360);}); return o;
  }
  function retroAt(ms){
    var d=Math.floor(ms/86400000); if(RC[d])return RC[d];
    var mid=d*86400000+43200000, o={Su:false,Mo:false};
    ['Ma','Me','Ju','Ve','Sa'].forEach(function(c){o[c]=isRetro(c,mid);}); RC[d]=o; return o;
  }
  function houseOf(l,cu){
    for(var i=0;i<12;i++){var s=cu[i], e=cu[(i+1)%12]; if(mod(l-s,360)<mod(e-s,360))return i+1;}
    return 1;
  }
  function buildSun(f,t,lat,lon,tzs){
    SUNT=[]; TZF=tzFn(tzs);
    var obs=new Astronomy.Observer(lat,lon,0), cur=f-3*86400000;
    try{
      for(var g=0;g<60&&cur<t+3*86400000;g++){
        var r=Astronomy.SearchRiseSet(Astronomy.Body.Sun,obs,+1,Astronomy.MakeTime(new Date(cur)),2);
        if(!r)break; var rs=r.date.getTime();
        var s=Astronomy.SearchRiseSet(Astronomy.Body.Sun,obs,-1,Astronomy.MakeTime(new Date(rs)),2);
        if(!s)break; var ss=s.date.getTime();
        SUNT.push({r:rs,s:ss,wd:new Date(rs+TZF(rs)*3600000).getUTCDay()}); cur=ss+60000;
      }
    }catch(e){SUNT=[];}
  }
  function hourAt(ms){
    var i=-1; for(var k=0;k<SUNT.length;k++){if(SUNT[k].r<=ms)i=k;else break;}
    if(i<0||i>=SUNT.length-1)return null;
    var d=SUNT[i], day=ms<d.s, k2;
    if(day)k2=Math.floor((ms-d.r)/((d.s-d.r)/12));
    else k2=12+Math.floor((ms-d.s)/((SUNT[i+1].r-d.s)/12));
    k2=Math.max(0,Math.min(23,k2));
    return {ruler:CH[(CH.indexOf(DAYR[d.wd])+k2)%7],day:day,n:k2+1,dayRuler:DAYR[d.wd]};
  }
  function findEclipses(f,t){
    ECL=[];
    try{
      var a=Astronomy.SearchLunarEclipse(new Date(f-9*86400000)), g=0;
      while(a&&g++<6){var p=a.peak.date.getTime(); if(p>t+9*86400000)break; ECL.push(p); a=Astronomy.NextLunarEclipse(a.peak);}
    }catch(e){}
    try{
      var b=Astronomy.SearchGlobalSolarEclipse(new Date(f-9*86400000)), g2=0;
      while(b&&g2++<6){var q=b.peak.date.getTime(); if(q>t+9*86400000)break; ECL.push(q); b=Astronomy.NextGlobalSolarEclipse(b.peak);}
    }catch(e){}
  }

  /* ---------- the chart state at one moment ---------- */
  function make(ms,lat,lon,kind,trop){
    var jd=ms/86400000+2440587.5, a=ayanamsa(jd,kind), z=trop?a:0, sl=slow(ms), P={}, R=retroAt(ms);
    EPS.forEach(function(c){P[c]=mod(sl[c]+z,360);});
    var m0=sidLon('Mo',ms), m1=sidLon('Mo',ms+3600000); P.Mo=mod(m0+z,360);
    var cu=placidusCusps(ms,lat,lon,kind).map(function(x){return mod(x+z,360);});
    var c={ms:ms,P:P,R:R,cu:cu,asc:cu[0],mc:cu[9],H:{},S:{},rul:[null],el:mod(P.Mo-P.Su,360),spd:mod(m1-m0+180,360)-180,
      sidAsc:mod(cu[0]-z,360),trop:trop};
    EPL.forEach(function(p){c.H[p]=houseOf(P[p],cu);c.S[p]=sgn(P[p]);});
    for(var h=1;h<=12;h++)c.rul[h]=SIGNS[sgn(cu[h-1])][1];
    c.day=c.H.Su>=7;
    c.pof=mod(c.day?cu[0]+P.Mo-P.Su:cu[0]+P.Su-P.Mo,360); c.pofH=houseOf(c.pof,cu);
    // Moon's remaining applying aspects before leaving the sign
    var m=P.Mo, rem=30-(m%30), asp=[];
    EPL.forEach(function(p){ if(p==='Mo')return;
      [0,60,90,120,180].forEach(function(A){
        var tg=A===0?[P[p]]:A===180?[P[p]+180]:[P[p]+A,P[p]-A];
        tg.forEach(function(t){var d=mod(t-m,360); if(d<rem&&d>=0)asp.push({p:p,A:A,d:d});});
      });
    });
    asp.sort(function(x,y){return x.d-y.d;}); c.asp=asp;
    c.hr=hourAt(ms);
    c.eclNear=ECL.some(function(p){return Math.abs(p-ms)<7*86400000;});
    return c;
  }
  function aq(x){   /* quality of a Moon aspect, 0..1 */
    if(x.A===60||x.A===120)return MAL[x.p]?0.7:1;
    if(x.A===0)return MAL[x.p]?0.1:BEN[x.p]?1:x.p==='Su'?0.5:0.75;
    return BEN[x.p]?0.35:0.1;
  }
  var ANAME={0:'conjunction',60:'sextile',90:'square',120:'trine',180:'opposition'};
  function strength(c,p){
    var h=c.H[p], s=0.5, d=dig(p,c.S[p]);
    s+=d*0.15; if(c.R[p])s-=0.2;
    if(p!=='Su'&&p!=='Mo'&&p!=='Ma'&&dd(c.P[p],c.P.Su)<8.5)s-=0.25;
    if(ANG.indexOf(h)>=0)s+=0.15; else if(CAD.indexOf(h)>=0)s-=0.08;
    if(h===6||h===8||h===12)s-=0.2;
    return Math.max(0,Math.min(1,s));
  }
  function strTxt(c,p){
    var t=pn(p)+' in '+sgName(c.P[p])+' ('+ORD[c.H[p]-1]+' house)', dt=digTxt(p,c.S[p]);
    if(dt)t+=' '+dt; if(c.R[p])t+=', retrograde';
    if(p!=='Su'&&p!=='Mo'&&p!=='Ma'&&dd(c.P[p],c.P.Su)<8.5)t+=', combust';
    return t;
  }
  function tok(c,t){var m=/^R(\d+)$/.exec(t); return m?c.rul[+m[1]]:t;}
  function pasp(c,a,b){   /* quality of aspect between two planets 0..1, null if none */
    if(a===b)return 1; var d=dd(c.P[a],c.P[b]);
    if(Math.abs(d-120)<=7||Math.abs(d-60)<=6)return 1;
    if(d<=8)return (MAL[a]||MAL[b])?0.45:0.85;
    if(Math.abs(d-90)<=6||Math.abs(d-180)<=7)return 0.12;
    return null;
  }
  function aspName(c,a,b){
    var d=dd(c.P[a],c.P[b]); if(a===b)return 'same planet';
    if(Math.abs(d-120)<=7)return 'trine'; if(Math.abs(d-60)<=6)return 'sextile'; if(d<=8)return 'conjunction';
    if(Math.abs(d-90)<=6)return 'square'; if(Math.abs(d-180)<=7)return 'opposition'; return 'no major aspect';
  }

  /* ---------- the rule library: each returns [score 0..1, text, veto?] ---------- */
  var RL={
    voc:function(c){ if(!c.asp.length)return [0,'Moon is void-of-course (no aspect before she leaves '+sgName(c.P.Mo)+')',1];
      var f=c.asp[0]; return [1,'Moon not void-of-course (next: '+ANAME[f.A]+' to '+pn(f.p)+')']; },
    via:function(c){ var m=mod(c.P.Mo,360); return (m>=195&&m<225)?[0,'Moon in Via Combusta (15° Libra – 15° Scorpio)',1]:[1,'Moon clear of Via Combusta']; },
    mcomb:function(c){ return (c.el<12||c.el>348)?[0,'Moon within 12° of the Sun (combust)',1]:[1,'Moon is not combust']; },
    eclipse:function(c){ return c.eclNear?[0,'An eclipse falls within a week of this date',1]:[1,'No eclipse within a week']; },
    moonLast:function(c,p){ if(!c.asp.length)return [0,'Moon has no further aspect'];
      var l=c.asp[c.asp.length-1], q=aq(l); return [q,'Moon’s last aspect before leaving the sign: '+ANAME[l.A]+' '+pn(l.p)+(q>=0.7?' (favourable)':q>=0.4?' (mixed)':' (unfavourable)')]; },
    moonFirst:function(c){ if(!c.asp.length)return [0,'No applying aspect'];
      var l=c.asp[0], q=aq(l); return [q,'Moon’s first applying aspect: '+ANAME[l.A]+' '+pn(l.p)+(q>=0.7?' (a good start)':q>=0.4?' (mixed)':' (a difficult start)')]; },
    moonDig:function(c){ var d=dig('Mo',c.S.Mo); return [d>0?1:d<0?0.1:0.6,'Moon in '+sgName(c.P.Mo)+(d>0?' (dignified)':d<0?' (weak sign)':'')]; },
    moonHouse:function(c,p){ var h=c.H.Mo, bad=p.bad||[], good=p.good||[];
      var s=bad.indexOf(h)>=0?0:good.indexOf(h)>=0?1:(ANG.indexOf(h)>=0||h===2||h===5||h===11)?0.8:0.5;
      return [s,'Moon in the '+ORD[h-1]+' house'+(s>=0.8?' (well placed)':s===0?' (unfavourable house)':'')]; },
    moonCrit:function(c){ var s=sgn(c.P.Mo), d=dg(c.P.Mo), bad=(d===0||d===29)||(s===1&&(d===24))||(s===7&&d===19);
      return [bad?0.1:1,bad?'Moon in a critical / malefic degree ('+d+'° '+sgName(c.P.Mo)+')':'Moon not in a critical degree']; },
    moonPhase:function(c,p){ var e=c.el, wax=e<180, s;
      if(p.m==='wax')s=wax?(e>=12?1:0):(e>=348?0.3:0.1);
      else s=!wax?(e<=335?1:0.5):(e>170?0.6:0.15);
      return [s,'Moon is '+(wax?'waxing':'waning')+' ('+Math.round(e)+'° from the Sun)'+((p.m==='wax')===wax?' – as advised':' – not as advised')]; },
    moonElong:function(c,p){ var e=c.el, s=(e>=p.a&&e<=p.b)?1:Math.max(0.15,1-Math.min(Math.abs(e-p.a),Math.abs(e-p.b))/60);
      return [s,'Moon is '+Math.round(e)+'° ahead of the Sun'+(s===1?' (in the advised phase)':'')]; },
    moonSign:function(c,p){ var s=c.S.Mo, v=p.map?(p.map[s]!==undefined?p.map[s]:0.5):((p.good||[]).indexOf(s)>=0?1:(p.bad||[]).indexOf(s)>=0?0.1:0.5);
      return [v,'Moon in '+sgName(c.P.Mo)+(v>=0.8?' (favoured)':v<=0.15?' (to be avoided)':'')]; },
    moonHorizon:function(c,p){ var up=c.H.Mo>=7, ok=(p.d==='up')===up; return [ok?1:0.4,'Moon is '+(up?'above':'below')+' the horizon'+(ok?' (as advised)':'')]; },
    moonFast:function(c){ var f=c.spd>0.55; return [f?1:0.4,'Moon is '+(f?'swift':'slow')+' ('+(c.spd*24).toFixed(1)+'°/day)']; },
    moonDeg1:function(c,p){ var bad=p.signs.indexOf(c.S.Mo)>=0&&dg(c.P.Mo)===0; return bad?[0,'Moon in the first degree of '+sgName(c.P.Mo)+' (avoid for lending / borrowing)',1]:[1,'Moon not in a forbidden degree']; },
    moonAspTo:function(c,p){
      var T=p.t.map(function(t){return tok(c,t);}).filter(function(t,i,a){return t!=='Mo'&&a.indexOf(t)===i;}), best=-1, bt='', hard='';
      c.asp.forEach(function(x){ if(T.indexOf(x.p)<0)return; var q=aq(x);
        if(q>best){best=q;bt=ANAME[x.A]+' to '+pn(x.p);} if(q<0.4&&!hard)hard=ANAME[x.A]+' to '+pn(x.p); });
      if(best<0)return [0.3,'Moon is not applying to '+T.map(pn).join(', ')+' in this sign'];
      var s=best; if(hard&&best>=0.7)s-=0.2;
      return [Math.max(0,s),'Moon applying: '+bt+(hard&&best>=0.7?' (but also '+hard+')':'')]; },
    moonFreeMal:function(c){ var bad=c.asp.filter(function(x){return MAL[x.p]&&(x.A===90||x.A===180||x.A===0);});
      return bad.length?[0.1,'Moon applies to a difficult aspect with '+pn(bad[0].p)]:[1,'Moon free of difficult aspects from Saturn / Mars']; },
    ascSign:function(c,p){ var s=sgn(c.asc), v=p.map?(p.map[s]!==undefined?p.map[s]:0.4):((p.good||[]).indexOf(s)>=0?1:0.4);
      return [v,'Ascendant '+sgName(c.asc)+(v>=0.8?' (as advised)':'')]; },
    cuspSign:function(c,p){ var s=sgn(c.cu[p.h-1]), ok=p.good.indexOf(s)>=0; return [ok?1:0.4,'Cusp of the '+ORD[p.h-1]+' house is '+sgName(c.cu[p.h-1])+(ok?' (as advised)':'')]; },
    ascMal:function(c){ var bad=['Sa','Ma'].filter(function(x){return c.H[x]===1;});
      return bad.length?[0,pn(bad[0])+' is in the ascendant']:[1,'No malefic in the ascendant']; },
    ascRuler:function(c){ var r=c.rul[1], s=strength(c,r); return [s,'Ascendant lord: '+strTxt(c,r)]; },
    rulerStrong:function(c,p){ var r=c.rul[p.h], s=strength(c,r); return [s,'Lord of the '+ORD[p.h-1]+' house: '+strTxt(c,r)]; },
    planetStrong:function(c,p){ var s=strength(c,p.c); return [s,strTxt(c,p.c)]; },
    retro:function(c,p){ return c.R[p.c]?[0,pn(p.c)+' is retrograde',1]:[1,pn(p.c)+' is direct']; },
    planetHouse:function(c,p){ var h=c.H[p.c], g=(p.good||[]).indexOf(h)>=0, b=(p.bad||[]).indexOf(h)>=0;
      return [g?1:b?0:0.5,pn(p.c)+' in the '+ORD[h-1]+' house'+(g?' (as advised)':b?' (unfavourable)':'')]; },
    anyIn:function(c,p){ var f=p.pl.filter(function(x){return p.hs.indexOf(c.H[x])>=0;});
      return f.length?[1,f.map(pn).join(', ')+' in the '+ORD[c.H[f[0]]-1]+' house (as advised)']:[0.3,'None of '+p.pl.map(pn).join(', ')+' in the '+p.hs.map(function(h){return ORD[h-1];}).join(' / ')+' house']; },
    beneficAngular:function(c){ var best=0,w='';
      ['Ju','Ve'].forEach(function(x){var h=c.H[x], v=ANG.indexOf(h)>=0?1:(h===5||h===9||h===11)?0.7:0.25; if(v>best){best=v;w=pn(x)+' in the '+ORD[h-1]+' house';}});
      return [best,'Benefic: '+w+(best>=1?' (angular)':'')]; },
    maleficOut:function(c,p){ var pl=p.pl||['Sa','Ma'], bad=pl.filter(function(x){return p.hs.indexOf(c.H[x])>=0;});
      return bad.length?[Math.max(0,1-0.55*bad.length),bad.map(function(x){return pn(x)+' in the '+ORD[c.H[x]-1];}).join(', ')+' – to be kept out of this house']:[1,pl.map(pn).join(' & ')+' kept out of the '+p.hs.map(function(h){return ORD[h-1];}).join('/')+' house']; },
    marsWeak:function(c){ var d=dig('Ma',c.S.Ma), cad=CAD.indexOf(c.H.Ma)>=0, s=d<0?1:(cad?0.6:0.2); if(d>0)s=0.05;
      return [s,'Mars in '+sgName(c.P.Ma)+(d<0?' (debilitated, as advised)':d>0?' (strong – not wanted here)':cad?' (cadent)':'')]; },
    marsNoAsp:function(c){ var a=Math.min(dd(c.P.Ma,c.P.Mo),99), b=dd(c.P.Ma,c.asc), hit=function(d){return d<=7||Math.abs(d-60)<=5||Math.abs(d-90)<=6||Math.abs(d-120)<=6||Math.abs(d-180)<=7;};
      var bad=hit(a)||hit(b); return [bad?0.1:1,bad?'Mars aspects the Moon or the ascendant':'Mars makes no aspect to the Moon or ascendant']; },
    noHard:function(c,p){ var bad=[]; p.pairs.forEach(function(x){var a=tok(c,x[0]), b=tok(c,x[1]); if(a===b)return; var d=dd(c.P[a],c.P[b]); if(d<=6&&(MAL[a]||MAL[b])||Math.abs(d-90)<=6||Math.abs(d-180)<=7)bad.push(pn(a)+'–'+pn(b));});
      return bad.length?[0.1,'Difficult aspect: '+bad.join(', ')]:[1,'No difficult aspect between '+p.pairs.map(function(x){return pn(tok(c,x[0]))+'–'+pn(tok(c,x[1]));}).join(', ')]; },
    rulerAsp:function(c,p){ var a=c.rul[p.a], b=c.rul[p.b], q=pasp(c,a,b);
      return [q===null?0.45:q,'Lords of the '+ORD[p.a-1]+' and '+ORD[p.b-1]+' ('+pn(a)+', '+pn(b)+'): '+aspName(c,a,b)]; },
    pairAsp:function(c,p){ var q=pasp(c,p.a,p.b); return [q===null?0.45:q,pn(p.a)+' and '+pn(p.b)+': '+aspName(c,p.a,p.b)]; },
    oppWeak:function(c,p){ var r=c.rul[p.h], s=1-strength(c,r); return [s,'Opponent ('+ORD[p.h-1]+' house lord) – '+strTxt(c,r)]; },
    fortuna:function(c){ var h=c.pofH, bad=(h===8||h===12); return [bad?0.1:([1,2,4,5,7,10,11].indexOf(h)>=0?1:0.6),'Part of Fortune in '+sgName(c.pof)+' ('+ORD[h-1]+' house)'+(bad?' – unfavourable house':'')]; },
    pofHouse:function(c,p){ var ok=p.good.indexOf(c.pofH)>=0; return [ok?1:0.35,'Part of Fortune in the '+ORD[c.pofH-1]+' house'+(ok?' (as advised)':'')]; },
    hour:function(c,p){ var h=c.hr; if(!h)return [0.5,'Planetary hour not available at this place'];
      var g=(p.good||[]).indexOf(h.ruler)>=0, b=(p.bad||[]).indexOf(h.ruler)>=0; return [g?1:b?0.05:0.5,'Hour of '+pn(h.ruler)+(g?' (favourable)':b?' (to be avoided)':'')]; },
    hourInAsc:function(c){ var h=c.hr; if(!h)return [0.5,'Planetary hour not available']; var ok=c.H[h.ruler]===1; return [ok?1:0.4,'Lord of the hour ('+pn(h.ruler)+') '+(ok?'is in the ascendant':'is not in the ascendant')]; },
    noFall:function(c,p){ var L=p.t.map(function(t){return tok(c,t);}).concat(c.hr?[c.hr.ruler]:[]).filter(function(t,i,a){return a.indexOf(t)===i;}), bad=L.filter(function(x){return dig(x,c.S[x])<0&&(DOM[x][0]+6)%12!==c.S[x]?true:dig(x,c.S[x])<0;});
      var fall=L.filter(function(x){return (EXA[x]+6)%12===c.S[x];}); return fall.length?[0.1,pn(fall[0])+' is in its fall']:[1,'Moon, ascendant lord and hour lord are not in fall']; },
    sunMoon:function(c){ var d=c.el, q=(Math.abs(d-60)<=8||Math.abs(d-300)<=8||Math.abs(d-120)<=8||Math.abs(d-240)<=8)?1:(Math.abs(d-90)<=6||Math.abs(d-270)<=6||Math.abs(d-180)<=7)?0.2:0.55;
      return [q,'Sun–Moon: '+(q===1?'sextile / trine (very good)':q<0.3?'square / opposition':'no major aspect')]; },
    sunDist:function(c){ var d=Math.min(c.el,360-c.el); return d<17?[0,'Moon is within 17° of the Sun (seed will not thrive)',1]:[1,'Moon is more than 17° from the Sun']; },
    above:function(c,p){ var f=p.pl.filter(function(x){return c.H[x]>=7;}); return [f.length/p.pl.length,f.map(pn).join(' & ')+(f.length?' above the horizon':'none of them above the horizon')]; }
  };

  /* ---------- the events: rules [key, weight, params] ---------- */
  var BASE=[['voc',0,{}],['via',0,{}],['mcomb',0,{}],['eclipse',0,{}],
    ['moonLast',8,{}],['moonFirst',3,{}],['moonDig',3,{}],['moonHouse',3,{bad:[1,6,8,12]}],['moonCrit',2,{}],
    ['ascRuler',6,{}],['ascMal',5,{}],['fortuna',2,{}]];
  var X={ven:[1,3,4,7],pn:[1,4,7]};
  var EV=[
   {id:'trade',en:'Trade / Buy & Sell (shares, goods, forex)',ta:'வர்த்தகம் / வாங்கல்–விற்றல்',ic:'#34C759',
    sum:'தன (2), லாப (11) அதிபதிகள், புதன், குரு வலிமையுடன் வளர்பிறைச் சந்திரன்.',
    rec:[['R','Fortify the Moon, Mercury and the lords of the 2nd (own money) and 11th (gains) houses – Robson, buying to resell.'],
     ['R','Moon increasing in light for selling; keep the Moon and Mercury free from Mars.'],
     ['H','Venus (money) and Mercury (agreements) strong, direct and in good aspect; the 2nd house is buying and selling.'],
     ['H','Mercury must not be retrograde at the moment of the first deal.'],
     ['R','Hour of Jupiter or Mercury is good for finance, buying and selling; avoid the hour of Mars.'],
     ['R','Moon in Taurus, Cancer, Virgo or Pisces is preferred; avoid Scorpio and Capricorn.']],
    rules:[['retro',0,{c:'Me'}],['moonPhase',6,{m:'wax'}],['rulerStrong',9,{h:2}],['rulerStrong',8,{h:11}],['rulerAsp',5,{a:2,b:11}],
     ['planetStrong',7,{c:'Me'}],['planetStrong',5,{c:'Ve'}],['planetStrong',4,{c:'Ju'}],['hour',5,{good:['Ju','Me','Ve'],bad:['Ma','Sa']}],
     ['moonSign',3,{good:[1,3,5,11],bad:[7,9]}],['maleficOut',5,{hs:[1,2,11]}],['beneficAngular',3,{}],
     ['moonAspTo',5,{t:['R2','R11','Me','Ve','Ju']}],['noHard',3,{pairs:[['Mo','Ma'],['Me','Ma']]}]]},

   {id:'vehicle',en:'Buy a Vehicle (car, bike, truck)',ta:'வாகனம் வாங்குதல்',ic:'#FF9500',
    sum:'புதன், செவ்வாய், சுக்கிரன் வக்கிரமின்றி; 3, 4-ஆம் அதிபதிகள் இணைவு.',
    rec:[['H','Mercury, Mars and Venus all direct (not retrograde); Mercury and Mars rule vehicles and machinery.'],
     ['H','Moon decreasing helps to lower the price; the Moon in a fixed sign makes it last long.'],
     ['H','Link the 1st (buyer), 3rd (vehicle) and 4th (end of the matter) house lords by good aspects.'],
     ['H','Keep challenging planets (Saturn, Mars) away from the angles and out of the 1st, 4th and 7th houses.'],
     ['R','Buyer is the ascendant, seller the 7th; the Moon and Mercury should be free from Mars.'],
     ['R','Hour of Mercury or Jupiter is good for buying; avoid the hour of Mars and Saturn.']],
    rules:[['retro',0,{c:'Me'}],['retro',0,{c:'Ve'}],['retro',0,{c:'Ma'}],['planetStrong',7,{c:'Me'}],['planetStrong',5,{c:'Ma'}],['planetStrong',5,{c:'Ve'}],
     ['moonPhase',4,{m:'wane'}],['moonSign',4,{good:[1,4,7,10]}],['rulerStrong',6,{h:3}],['rulerStrong',5,{h:4}],['rulerAsp',5,{a:1,b:4}],['rulerAsp',4,{a:3,b:4}],
     ['maleficOut',6,{hs:X.pn}],['noHard',4,{pairs:[['Mo','Ma'],['Me','Ma']]}],['moonAspTo',5,{t:['R1','R3','R4','Me','Ve']}],
     ['hour',4,{good:['Me','Ju','Ve'],bad:['Ma','Sa','Su']}],['rulerAsp',3,{a:1,b:7}]]},

   {id:'property',en:'Purchase Land / House / Flat',ta:'நிலம் / வீடு வாங்குதல்',ic:'#AF52DE',
    sum:'நிலைராசி லக்னம், 4-ஆம் அதிபதி வலிமை, சந்திரன் ரிஷபம்/கடகம்.',
    rec:[['R','A fixed sign rising; fortify the 4th house and its lord; Taurus, Leo or Aquarius on the 4th cusp.'],
     ['R','Moon in Taurus or Cancer; no aspect from Mars.'],
     ['H','Moon (natural ruler of property), and the lords of the 1st, 4th and 7th in good aspect to each other.'],
     ['H','Mercury, Venus and Mars not retrograde; keep difficult planets out of the 1st, 2nd, 4th and 7th houses.'],
     ['H','Fixed angles for long keeping; cardinal angles if you plan a quick resale.'],
     ['R','Hour of Saturn or Jupiter is good for land; Mercury, Sun and Mars hours are poor.']],
    rules:[['retro',0,{c:'Me'}],['retro',0,{c:'Ve'}],['ascSign',7,{good:[1,4,7,10]}],['cuspSign',5,{h:4,good:[1,4,10]}],['rulerStrong',9,{h:4}],
     ['rulerAsp',5,{a:1,b:7}],['rulerAsp',3,{a:1,b:4}],['moonSign',7,{good:[1,3],bad:[7,9]}],['moonAspTo',5,{t:['R4','R1','R7']}],
     ['marsNoAsp',4,{}],['maleficOut',6,{hs:[1,2,4,7]}],['planetStrong',4,{c:'Ve'}],['planetStrong',3,{c:'Me'}],
     ['hour',4,{good:['Sa','Ju','Ve'],bad:['Ma','Su','Me']}]]},

   {id:'build',en:'Start Building / Foundation / Construction',ta:'கட்டுமானம் / அஸ்திவாரம் தொடங்குதல்',ic:'#8E8E93',
    sum:'லக்னம், 4, 2-ஆம் அதிபதிகள் வலிமை; சந்திரன் குருவை நோக்கி; சனி 1, 4-ல் இல்லாமல்.',
    rec:[['R','Fortify the ascendant, the 4th and the 2nd houses.'],
     ['R','Moon applying to Jupiter; Moon increasing in light; best with the Moon in Aquarius.'],
     ['R','Saturn must not be in the ascendant or the 4th house; Mars should be debilitated.'],
     ['R','Fixed signs give a lasting building. Hours of Saturn and Jupiter are good; Sun, Mercury and Moon hours are poor for building.']],
    rules:[['moonPhase',6,{m:'wax'}],['ascSign',5,{good:[1,4,7,10]}],['rulerStrong',7,{h:4}],['rulerStrong',3,{h:2}],['moonAspTo',7,{t:['Ju']}],
     ['maleficOut',6,{pl:['Sa'],hs:[1,4]}],['marsWeak',4,{}],['moonSign',5,{map:{10:1,1:0.9,3:0.85,4:0.7,7:0.4}}],['planetStrong',5,{c:'Ju'}],
     ['hour',3,{good:['Sa','Ju','Ve'],bad:['Su','Ma','Me','Mo']}],['maleficOut',3,{pl:['Ma'],hs:[1,4]}]]},

   {id:'agri',en:'Begin Agriculture (tilling & sowing)',ta:'விவசாயம் தொடங்குதல் (உழவு, விதைப்பு)',ic:'#30B94D',crop:true,
    sum:'வளர்பிறைச் சந்திரன் கடகம்/மகரம்/மேஷம்/துலாம்; சனி நல்ல நிலை; செவ்வாய் பலவீனம்.',
    rec:[['R','Sow a day or two after the New Moon, with the Moon increasing in light, and not within 17° of the Sun.'],
     ['R','Moon in Cancer or Capricorn (best), Aries or Libra; not afflicted by Saturn or Mars. Taurus / Virgo suit seed that stays long in the ground.'],
     ['R','Ascendant and its lord in cardinal signs (or Taurus, Virgo, Aquarius); Saturn, the natural significator of land work, well placed and aspecting the Moon.'],
     ['R','Mars weak and making no aspect to the Moon or the ascendant.'],
     ['R','Upward-growing crops: Moon above the horizon. Root crops: Moon below the horizon. Peas and beans are sown with the Moon decreasing.'],
     ['R','Hour of Saturn is good for agriculture, Mercury for sowing; avoid Mars.']],
    rules:[['sunDist',0,{}],['moonPhase',7,{m:'wax'}],['moonElong',4,{a:17,b:75}],['moonSign',8,{map:{3:1,9:1,0:0.85,6:0.85,1:0.65,5:0.65,11:0.55}}],
     ['ascSign',5,{map:{0:1,3:1,6:1,9:1,1:0.8,5:0.8,10:0.8}}],['planetStrong',5,{c:'Sa'}],['marsWeak',4,{}],['marsNoAsp',4,{}],
     ['moonAspTo',5,{t:['Ju','Ve','Sa']}],['moonFreeMal',5,{}],['hour',4,{good:['Sa','Me','Ju','Ve'],bad:['Ma','Su']}],['pairAsp',2,{a:'Sa',b:'Mo'}]]},

   {id:'trees',en:'Plant Trees / Grafting',ta:'மரம் நடுதல் / ஒட்டு கட்டுதல்',ic:'#248A3D',
    sum:'சந்திரன் ரிஷபம்/கும்பம்/சிம்மம்/மீனம்; சனி நேர்கதி; செவ்வாய் பலவீனம்.',
    rec:[['R','Moon in Taurus, Aquarius, Leo, Pisces or Virgo (in this order), in sextile or trine to Venus; Moon not decreasing.'],
     ['R','Saturn direct and in the ascendant, 11th, 5th or 2nd house, in his dignity. If not, Jupiter in the ascendant.'],
     ['R','Mars debilitated and kept out of the 1st, 2nd, 3rd, 5th, 10th and 11th houses.'],
     ['R','A fixed (or mutable) ascendant; Jupiter unafflicted in an angle or the 5th / 11th.']],
    rules:[['moonPhase',6,{m:'wax'}],['moonSign',9,{map:{1:1,10:0.9,4:0.8,11:0.75,5:0.7,8:0.55}}],['moonAspTo',6,{t:['Ve','Ju']}],
     ['retro',0,{c:'Sa'}],['planetHouse',5,{c:'Sa',good:[1,11,5,2]}],['planetStrong',3,{c:'Sa'}],['marsWeak',4,{}],['maleficOut',5,{pl:['Ma'],hs:[1,2,3,5,10,11]}],
     ['ascSign',4,{good:[1,4,7,10,2,5,8,11]}],['planetHouse',4,{c:'Ju',good:[1,10,11,5,4]}],['moonFreeMal',4,{}],['hour',3,{good:['Sa','Ju','Ve','Me'],bad:['Ma']}]]},

   {id:'game',en:'Win a Game / Match / Contest',ta:'விளையாட்டு / போட்டியில் வெற்றி',ic:'#FF3B30',
    sum:'சர லக்னம்; லக்னாதிபதி 5-ல்; சந்திரன் சுபருடன் இணையும் நிலை.',
    rec:[['R','A cardinal sign rising; the ascendant lord in the 5th house and well aspected.'],
     ['R','Lord of the 5th separating from the 8th lord and applying to the ascendant or 2nd lord.'],
     ['R','Moon above the earth, separating from one benefic and applying to another. Moon applying to a benefic: the beginner wins; to a malefic: loss.'],
     ['H','Strengthen the 5th house (sport / chance) and weaken the 7th (opponent).'],
     ['R','Hours of Venus and Jupiter are good for sport; Mars is bad for most things.']],
    rules:[['ascSign',6,{good:[0,3,6,9]}],['planetHouse',5,{c:'R1',good:[5,1,10,11]}],['rulerStrong',7,{h:5}],['moonAspTo',9,{t:['Ve','Ju']}],
     ['moonHorizon',4,{d:'up'}],['beneficAngular',4,{}],['planetStrong',4,{c:'Ma'}],['planetStrong',3,{c:'Su'}],['oppWeak',4,{h:7}],
     ['hour',3,{good:['Ve','Ju'],bad:['Sa','Ma']}],['moonFreeMal',4,{}]]},

   {id:'race',en:'Horse Race / Racing',ta:'குதிரைப் பந்தயம் / ஓட்டப் போட்டி',ic:'#FF2D55',
    sum:'தனுசு லக்னம், 10-ல்/11-ல் குரு; எதிரி (7) பலவீனம்.',
    rec:[['R','An animal sign (Sagittarius) rising; fortify the Midheaven, the ascendant and the 12th house.'],
     ['R','Debilitate the 7th and 6th houses (the rivals).'],
     ['R','Swift Moon in Sagittarius or Libra, in good aspect to the Sun, Mars, Venus or Jupiter.'],
     ['R','Jupiter in the 11th, the ascendant or the 10th. Hour lord in the ascendant; not the hour of Sun, Mercury, Mars or Saturn.'],
     ['R','Moon, ascendant lord and hour lord must not be in their fall.']],
    rules:[['ascSign',7,{map:{8:1,0:0.6,4:0.6}}],['moonSign',5,{good:[8,6]}],['moonAspTo',7,{t:['Su','Ma','Ve','Ju']}],['planetHouse',6,{c:'Ju',good:[11,1,10]}],
     ['hour',6,{good:['Ju','Ve','Mo'],bad:['Su','Me','Ma','Sa']}],['hourInAsc',3,{}],['noFall',4,{t:['Mo','R1']}],['oppWeak',4,{h:7}],['oppWeak',3,{h:6}],
     ['rulerStrong',5,{h:10}],['moonFast',3,{}]]},

   {id:'lottery',en:'Lottery / Speculation (chance)',ta:'லாட்டரி / ஊக வணிகம் (அதிர்ஷ்டம்)',ic:'#FFCC00',
    sum:'5-ஆம் வீடு, சந்திரன் 5-ஆம் அதிபதியை நோக்கி; சனி 2,5,8,11-ல் இல்லாமல்.',
    rec:[['H','Strengthen the 5th house (gambling, speculation, lotteries). Sun, Venus, Jupiter or Moon in the 5th, trine the ascendant.'],
     ['H','Part of Fortune in the 5th house, or on the ascendant, 2nd or 8th cusp.'],
     ['H','Moon applying to the 5th lord; Saturn out of the 2nd, 5th, 8th and 11th houses.'],
     ['R','Moon in good aspect to the lord of the 5th (not sufficient alone).'],
     ['H','The natal chart must also show luck; the first bet / ticket purchase is the moment of finality. Use the place where it is played.']],
    rules:[['rulerStrong',7,{h:5}],['moonAspTo',9,{t:['R5']}],['anyIn',6,{pl:['Su','Ve','Ju','Mo'],hs:[5]}],['pofHouse',5,{good:[5,1,2,8]}],
     ['maleficOut',6,{pl:['Sa'],hs:[2,5,8,11]}],['planetStrong',4,{c:'Ju'}],['planetStrong',3,{c:'Ve'}],['planetStrong',3,{c:'Su'}],['beneficAngular',3,{}],
     ['hour',3,{good:['Ju','Ve','Su'],bad:['Sa','Ma']}],['moonPhase',3,{m:'wax'}]]},

   {id:'business',en:'Start a Business / Open a Shop / Register Firm',ta:'தொழில் தொடங்குதல் / கடை திறப்பு',ic:'#007AFF',
    sum:'10-ஆம் அதிபதி, சூரியன், குரு, சனி வலிமை; 11-ல் சுபர்; சந்திரன் வளர்பிறை.',
    rec:[['H','Strong 10th house, its ruler and any planet in it; Sun, Saturn and Jupiter (natural rulers of business) strong and in good alignment.'],
     ['H','Venus (money) strong and direct; Venus, Jupiter or the Sun in the 11th house improves cash flow.'],
     ['H','Moon applying to a favourable aspect with a business ruler; Moon in Taurus is particularly good; waxing Moon for growth.'],
     ['H','Mars in the 10th is very good; avoid Saturn in the 10th (it delays growth).'],
     ['R','Benefics angular and malefics cadent; Mercury direct for papers.'],
     ['H','The moment is when the signed papers are filed, or the doors open to the public.']],
    rules:[['retro',0,{c:'Me'}],['rulerStrong',8,{h:10}],['planetStrong',5,{c:'Su'}],['planetStrong',5,{c:'Ju'}],['planetStrong',4,{c:'Sa'}],['planetStrong',4,{c:'Ve'}],
     ['anyIn',4,{pl:['Ve','Ju','Su'],hs:[11]}],['anyIn',4,{pl:['Ju','Ve','Ma'],hs:[10]}],['maleficOut',4,{pl:['Sa'],hs:[10]}],['moonSign',4,{good:[1,3]}],
     ['moonAspTo',7,{t:['Su','Sa','Ju','R10']}],['moonPhase',5,{m:'wax'}],['rulerAsp',5,{a:1,b:10}],['hour',4,{good:['Ju','Ve','Su','Me'],bad:['Ma']}],['beneficAngular',3,{}]]},

   {id:'contract',en:'Sign Contract / Agreement / Lease / Partnership',ta:'ஒப்பந்தம் / குத்தகை / கூட்டாண்மை',ic:'#5856D6',
    sum:'புதன் நேர்கதி; 1, 7-ஆம் அதிபதிகள் நல்ல பார்வை; சந்திரன் அவர்களை நோக்கி.',
    rec:[['H','Mercury (agreements, papers) strong and direct. Signing the paper is the moment of finality.'],
     ['H','Good aspects between the rulers of the 1st (you) and the 7th (the other party); Venus–Jupiter harmony helps partnerships.'],
     ['H','Moon applying to the 7th lord or a planet in the 7th; the 3rd house governs the paper / lease.'],
     ['R','Mutable signs for contracts and partnerships.'],
     ['H','Keep challenging planets out of the 1st, 3rd, 4th and 7th houses.']],
    rules:[['retro',0,{c:'Me'}],['rulerAsp',9,{a:1,b:7}],['rulerStrong',5,{h:3}],['rulerStrong',5,{h:7}],['planetStrong',8,{c:'Me'}],
     ['moonAspTo',7,{t:['R1','R7','Me']}],['ascSign',4,{good:[2,5,8,11]}],['moonPhase',3,{m:'wax'}],['maleficOut',6,{hs:X.ven}],['planetStrong',3,{c:'Ve'}],
     ['pairAsp',3,{a:'Ve',b:'Ju'}],['hour',4,{good:['Me','Ju','Ve'],bad:['Ma','Sa','Su']}]]},

   {id:'loan',en:'Borrow / Lend / Invest (others’ money)',ta:'கடன் வாங்க / கொடுக்க / முதலீடு',ic:'#00A0A0',
    sum:'2, 8-ஆம் அதிபதிகள்; சனி ஹோரை தவிர்; புதன் நேர்கதி; குரு வலிமை.',
    rec:[['R','Avoid the hour of Saturn; avoid the Moon in the ascendant; avoid the first degree of Gemini, Leo and Sagittarius for the Moon.'],
     ['H','The 2nd house is your own money, the 8th other people’s money, loans and insurance; their lords strong and in good aspect.'],
     ['H','Mercury direct for papers; Jupiter strong (finance).'],
     ['H','Moon applying to the 2nd or 8th lord; keep Saturn out of the 2nd and 8th.']],
    rules:[['retro',0,{c:'Me'}],['moonDeg1',0,{signs:[2,4,8]}],['rulerStrong',6,{h:2}],['rulerStrong',6,{h:8}],['rulerAsp',5,{a:2,b:8}],
     ['moonAspTo',6,{t:['R2','R8','Ju','Ve']}],['planetStrong',6,{c:'Ju'}],['hour',5,{good:['Ju','Ve','Me'],bad:['Sa','Ma','Mo']}],
     ['maleficOut',5,{pl:['Sa'],hs:[2,8,1]}],['moonHouse',3,{bad:[1,2,8,12]}],['planetStrong',3,{c:'Me'}]]},

   {id:'marriage',en:'Marriage / Engagement',ta:'திருமணம் / நிச்சயதார்த்தம்',ic:'#FF6482',
    sum:'சுக்கிரன், 7-ஆம் அதிபதி வலிமை; வளர்பிறைச் சந்திரன்; நிலை லக்னம்.',
    rec:[['R','Fortify Venus (chief significator): not cadent, combust, retrograde, in fall or detriment, nor afflicted. Jupiter sextile / trine Venus, or in reception.'],
     ['H','Strengthen the 7th house; Venus and Mars (co-significators) direct and in good aspect to each other and to the Moon.'],
     ['R','Moon increasing in light and motion, past the first quarter; never void-of-course; her last aspect positive; no Moon–malefic conjunction in the ascendant.'],
     ['H','Positive Sun–Moon aspect; Sun, Moon, Venus and Jupiter above the horizon; Saturn, Uranus, Neptune, Pluto cadent or succedent.'],
     ['H','Fixed angles for stability, cardinal angles next best. The moment is when the couple is pronounced married.'],
     ['R','The hour of Venus, Jupiter or the Moon is favourable.']],
    rules:[['retro',0,{c:'Ve'}],['planetStrong',9,{c:'Ve'}],['rulerStrong',8,{h:7}],['planetStrong',4,{c:'Ju'}],['pairAsp',4,{a:'Ve',b:'Ju'}],['rulerAsp',7,{a:1,b:7}],
     ['moonPhase',5,{m:'wax'}],['moonElong',4,{a:80,b:185}],['moonAspTo',8,{t:['R1','R7','Ve','Ju']}],['sunMoon',4,{}],['moonFreeMal',5,{}],
     ['maleficOut',7,{hs:[1,7,8]}],['ascSign',5,{map:{1:1,4:1,7:1,10:1,0:0.8,3:0.8,6:0.8,9:0.8}}],['above',3,{pl:['Su','Mo','Ve']}],['hour',4,{good:['Ve','Ju','Mo'],bad:['Sa','Ma']}],['pairAsp',2,{a:'Ve',b:'Ma'}]]},

   {id:'travel',en:'Begin a Journey / Travel',ta:'பயணம் தொடங்குதல்',ic:'#32ADE6',
    sum:'சந்திரன் 5/10-ல்; புதன் நேர்கதி; சுபர் கேந்திரம்; சனி, செவ்வாய் கேந்திரத்தில் இல்லாமல்.',
    rec:[['R','Moon increasing, best in the 5th or 10th house; avoid the Moon in the 2nd, 4th, 6th, 8th, 12th and in Via Combusta.'],
     ['R','Mercury direct; a benefic in the ascendant or an angle; avoid Saturn or Mars angular; Mars not in the 3rd, 9th or 2nd.'],
     ['H','Mercury and Mars (vehicles) well aligned to Venus / Jupiter for pleasure, or the Sun / Saturn for business. Moon in Gemini, Sagittarius or Leo for recreation.'],
     ['H','Avoid difficult aspects between Mars and Mercury; for long trips also consider the 9th house.'],
     ['R','Water signs for voyages, fixed signs for inland travel. Hours of Venus, Jupiter and Mercury are good.']],
    rules:[['retro',0,{c:'Me'}],['moonPhase',5,{m:'wax'}],['moonHouse',7,{good:[5,10],bad:[2,4,6,8,12]}],['moonSign',3,{good:[2,8,4]}],['beneficAngular',6,{}],
     ['maleficOut',7,{hs:[1,4,7,10]}],['maleficOut',4,{pl:['Ma'],hs:[2,3,9]}],['planetStrong',5,{c:'Me'}],['planetStrong',3,{c:'Ve'}],['planetStrong',3,{c:'Ju'}],
     ['rulerStrong',4,{h:9}],['rulerStrong',3,{h:3}],['moonAspTo',5,{t:['R1','R3','R9','Ju','Ve']}],['hour',4,{good:['Ve','Ju','Me'],bad:['Sa','Ma']}],['noHard',3,{pairs:[['Ma','Me']]}]]},

   {id:'exam',en:'Exam / Test / Interview / Licence',ta:'தேர்வு / நேர்காணல் / உரிமம்',ic:'#FF9F0A',
    sum:'புதன் வலிமை; 3, 4-ஆம் அதிபதிகள்; சந்திரன் புதனை நோக்கி; நல்ல இறுதிப் பார்வை.',
    rec:[['H','Tests belong to the 3rd house and Mercury; licensing to the 9th. The moment is when you pick up the pen (or post the paper).'],
     ['H','The 4th house shows the end result: positive aspects between the 4th lord and the 1st lord.'],
     ['H','Moon applying to the planets ruling the client, the test and the 4th house; her final aspect positive.'],
     ['H','Mercury strong and direct; Sun / Mercury in Gemini or Virgo helps; keep difficult planets out of the 1st, 3rd and 4th.']],
    rules:[['retro',0,{c:'Me'}],['planetStrong',9,{c:'Me'}],['rulerStrong',7,{h:3}],['rulerStrong',3,{h:9}],['rulerAsp',5,{a:1,b:4}],
     ['moonAspTo',8,{t:['R1','R3','Me','R4']}],['moonPhase',3,{m:'wax'}],['ascSign',4,{good:[2,5]}],['planetStrong',3,{c:'Su'}],['planetStrong',3,{c:'Ju'}],
     ['maleficOut',5,{hs:[1,3,4]}],['hour',4,{good:['Me','Ju'],bad:['Ma','Sa']}]]},

   {id:'move',en:'Enter a New House (house-warming)',ta:'புதுமனை புகுவிழா',ic:'#BF5AF2',
    sum:'நிலை லக்னம், 4-ஆம் அதிபதி; சந்திரன் வலிமையுடன் குரு / சுக்கிரனை நோக்கி.',
    rec:[['R','A fixed sign rising when moving in; the Moon in her dignity, aspecting Jupiter or Venus.'],
     ['H','The 4th house is the home: its lord strong; Moon in Taurus or Cancer.'],
     ['H','Keep challenging planets away from the angles and out of the 1st, 4th and 7th houses.'],
     ['R','Hours of Jupiter, Venus and Saturn are suitable; avoid Mars and the Sun.']],
    rules:[['ascSign',7,{good:[1,4,7,10]}],['rulerStrong',8,{h:4}],['moonSign',5,{good:[1,3],bad:[7,9]}],['moonAspTo',8,{t:['Ju','Ve','R4']}],
     ['maleficOut',6,{hs:X.pn}],['planetStrong',4,{c:'Ve'}],['planetStrong',3,{c:'Ju'}],['moonPhase',4,{m:'wax'}],['rulerAsp',4,{a:1,b:4}],
     ['hour',3,{good:['Ju','Ve','Sa'],bad:['Ma','Su']}]]},

   {id:'pet',en:'Get a Pet / Buy Animals',ta:'செல்லப்பிராணி / கால்நடை வாங்குதல்',ic:'#A2845E',
    sum:'6-ஆம் அதிபதி வலிமை; புதன் நேர்கதி; சந்திரன் சுபருடன்.',
    rec:[['H','The 6th house rules pets; Mercury direct; the 11th house shows the pet’s health.'],
     ['R','Fortify the ascendant, the 6th house and their lords, and the Moon; Moon in good aspect to the benefics and free from the malefics.'],
     ['R','Large animals (cow, horse, ox): Moon in Taurus or the last 15° of Sagittarius; sheep: Aries; goats: Capricorn or Taurus; pigs: Taurus.'],
     ['R','The hour of the Moon is bad for animals.']],
    rules:[['retro',0,{c:'Me'}],['rulerStrong',8,{h:6}],['rulerStrong',4,{h:11}],['rulerAsp',5,{a:1,b:6}],['moonAspTo',8,{t:['R6','R1','Ju','Ve']}],
     ['moonSign',5,{map:{1:1,0:0.8,9:0.8,8:0.7}}],['maleficOut',5,{hs:[1,6]}],['moonPhase',3,{m:'wax'}],['hour',3,{good:['Ju','Ve','Me'],bad:['Mo','Ma','Sa']}]]},

   {id:'job',en:'Start a New Job / Take a Post',ta:'புதிய வேலை / பதவி ஏற்பு',ic:'#64D2FF',
    sum:'10-ஆம் அதிபதி, சூரியன் 10-ல், குரு லக்னத்தில்; சந்திரன் வளர்பிறை.',
    rec:[['R','Jupiter in the ascendant and the Sun in the Midheaven when starting employment.'],
     ['H','The 10th house (career) and 6th house (work): their lords strong; Moon applying to the 10th lord or the Sun.'],
     ['H','Avoid Saturn in the 10th; keep the Moon strong and waxing.']],
    rules:[['rulerStrong',8,{h:10}],['rulerStrong',5,{h:6}],['planetHouse',6,{c:'Ju',good:[1,10,11]}],['planetHouse',6,{c:'Su',good:[10,1,11,9]}],
     ['moonAspTo',7,{t:['Su','Ju','R10','R6']}],['moonPhase',4,{m:'wax'}],['maleficOut',3,{pl:['Sa'],hs:[10]}],['maleficOut',5,{hs:[1,10]}],
     ['hour',4,{good:['Su','Ju','Me','Ve'],bad:['Ma']}],['ascSign',3,{good:[0,3,6,9]}]]}
  ];
  var EVB={}; EV.forEach(function(e){EVB[e.id]=e;});

  /* ---------- scoring ---------- */
  function score(c,ev,opt){
    var rules=BASE.concat(ev.rules), tot=0, got=0, veto=[], res=[];
    rules.forEach(function(r){
      var p=r[2]; if(r[0]==='planetStrong'&&p.c==='R1'){p=p;} 
      var q;
      if(r[0]==='planetHouse'&&/^R\d+$/.test(p.c)){p={c:tok(c,p.c),good:p.good,bad:p.bad};}
      q=RL[r[0]](c,p,opt); var w=r[1];
      if(q[2]&&r[0]==='retro'&&opt&&opt.relaxed){q=[0.05,q[1]+' (allowed in relaxed mode, heavy penalty)']; w=8;}
      if(q[2]){veto.push(q[1]);}
      if(w>0){tot+=w;got+=w*q[0];}
      res.push({w:w,s:q[0],t:q[1],v:!!q[2]});
    });
    if(ev.crop&&opt&&opt.crop){   // crop kind: above-ground or root crop
      var q2=RL.moonHorizon(c,{d:opt.crop==='root'?'down':'up'}), w2=4; tot+=w2; got+=w2*q2[0]; res.push({w:w2,s:q2[0],t:q2[1]+(opt.crop==='root'?' (root crop)':' (upward-growing crop)'),v:false});
    }
    return {sc:tot?100*got/tot:0,veto:veto,res:res};
  }

  /* ---------- scan ---------- */
  var ST=10*60000;
  function phaseName(e){ return e<20?'New Moon':e<80?'Waxing crescent':e<100?'First quarter':e<160?'Waxing gibbous':e<200?'Full Moon':e<260?'Waning gibbous':e<280?'Last quarter':e<340?'Waning crescent':'Balsamic (old Moon)'; }
  function scan(o){
    var oldC=CFG; CFG={lat:o.lat,lon:o.lon,kind:o.kind};
    try{
      epReset(); buildSun(o.from,o.to,o.lat,o.lon,o.tz); findEclipses(o.from,o.to);
      var ev=EVB[o.ev], opt={crop:o.crop,relaxed:!!o.relaxed}, cache={};
      function at(ms){ms=Math.round(ms/60000)*60000; if(cache[ms])return cache[ms]; var c=make(ms,o.lat,o.lon,o.kind,o.trop), s=score(c,ev,opt); s.c=c; s.ms=ms; return (cache[ms]=s);}
      var samples=[];
      o.days.forEach(function(d){ for(var t=d.a;t<=d.b;t+=ST){samples.push(at(t));} });
      var top=0; samples.forEach(function(s){if(!s.veto.length&&s.sc>top)top=s.sc;});
      var T=Math.max(58,Math.min(74,top-6)), ideal=top>=58; if(!ideal)T=Math.max(1,top-3);
      var good=function(s){return !s.veto.length&&s.sc>=T;};
      var wins=[], cur=null;
      for(var i=0;i<samples.length;i++){
        var s=samples[i], ok=good(s), cont=cur&&samples[i-1]&&(s.ms-samples[i-1].ms===ST);
        if(ok){ if(cur&&cont){cur.e=s.ms;cur.last=s;if(s.sc>cur.best.sc)cur.best=s;} else{ if(cur)wins.push(cur); cur={s:s.ms,e:s.ms,best:s,first:s,last:s}; } }
        else if(cur){wins.push(cur);cur=null;}
      }
      if(cur)wins.push(cur);
      wins.forEach(function(w){   // refine the edges to the minute
        var a=w.s, b=w.s-ST; if(w.first.ms-ST>=0&&samples.indexOf(w.first)>0&&samples[samples.indexOf(w.first)-1].ms===w.first.ms-ST){
          var lo=w.first.ms-ST, hi=w.first.ms; while(hi-lo>60000){var m=Math.round((lo+hi)/2/60000)*60000; if(m<=lo||m>=hi)break; if(good(at(m)))hi=m;else lo=m;} w.s=hi; }
        var li=samples.indexOf(w.last); if(li>=0&&li<samples.length-1&&samples[li+1].ms===w.last.ms+ST){
          var lo2=w.last.ms, hi2=w.last.ms+ST; while(hi2-lo2>60000){var m2=Math.round((lo2+hi2)/2/60000)*60000; if(m2<=lo2||m2>=hi2)break; if(good(at(m2)))lo2=m2;else hi2=m2;} w.e=lo2+60000; }
        else w.e=w.last.ms;
        w.dur=Math.max(1,Math.round((w.e-w.s)/60000));
      });
      var vr={}; samples.forEach(function(s){s.veto.forEach(function(t){t=t.replace(/\(next[^)]*\)/,'').replace(/\(no aspect before she leaves [A-Za-z]+\)/,'').replace(/ in (Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)/,''); vr[t]=(vr[t]||0)+1;});});
      return {wins:wins,top:top,T:T,ideal:ideal,n:samples.length,vetoed:samples.filter(function(s){return s.veto.length;}).length,vr:vr};
    }finally{CFG=oldC;}
  }
  window.__epScan=scan;   /* for tests */

  /* ---------- UI ---------- */
  function $(i){return document.getElementById(i);}
  var EP_LIST=[], EP_SEL='trade', EP_RES=null, EP_SORT='score';
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
  function drawEvents(){
    $('epEvents').innerHTML=EV.map(function(e){
      return '<button type="button" class="epev'+(e.id===EP_SEL?' on':'')+'" data-ev="'+e.id+'" style="--c:'+e.ic+'"><span class="d"></span><span class="n">'+esc(e.en)+'<small>'+e.ta+'</small></span></button>';
    }).join('');
    showRec();
  }
  function showRec(){
    var e=EVB[EP_SEL];
    $('epRec').innerHTML='<h3>'+esc(e.en)+'<span class="ta">'+e.ta+'</span></h3><p class="ta epsum">'+e.sum+'</p><div class="epl">Planetary positions recommended by the authors</div><ul>'+
      e.rec.map(function(r){return '<li><b class="src '+r[0]+'">'+(r[0]==='R'?'Robson':'Hampar')+'</b> '+esc(r[1])+'</li>';}).join('')+'</ul>';
    $('epCropRow').style.display=e.crop?'':'none';
  }
  function epFill(){
    var q=$('epSearch').value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''), cn=$('epCountry').value, sel=$('epCity'), list, tag=false;
    if(cn==='*a'){list=q?WC.filter(function(x){return plKey(x).indexOf(q)>=0;}).slice(0,400):[];tag=true;}
    else list=WC.filter(function(x){return x.cc===cn&&(!q||plKey(x).indexOf(q)>=0);}).slice(0,600);
    if(!list.length)list=webC(q,epFill);
    EP_LIST=list;
    sel.innerHTML=list.length?list.map(function(x,i){return '<option value="'+i+'">'+x.n+(x.st?', '+x.st:'')+(tag?', '+x.cc:'')+'</option>';}).join(''):'<option value="">No match in the offline list</option>';
    epPick();
  }
  function epPick(){var x=EP_LIST[parseInt($('epCity').value,10)]; if(x){$('epLat').value=x.lat;$('epLon').value=x.lon;$('epTz').value=x.tz;} epOff();}
  function epOff(){
    var el=$('epOff'), t=$('epTz').value.trim(); el.className='msg'; if(!t){el.textContent='';return;}
    try{el.textContent='Time zone now: '+utcTxt(tzFn(t)(Date.now()))+(/^-?[\d.]+$/.test(t)?'':' ('+t+')');}
    catch(e){el.textContent='The time zone was not recognised. Use a name such as Asia/Kolkata or hours such as 5.5.';el.className='msg err';}
  }
  function hhmm(ms,tz){var d=new Date(ms+tz*3600000); return p2(d.getUTCHours())+':'+p2(d.getUTCMinutes());}
  function dayTxt(ms,tz){var d=new Date(ms+tz*3600000); return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getUTCDay()]+', '+d.getUTCDate()+' '+MON[d.getUTCMonth()]+' '+d.getUTCFullYear();}
  function durTxt(m){return m>=60?Math.floor(m/60)+' h '+(m%60?m%60+' min':''):m+' min';}
  function lab(sc){return sc>=82?['Excellent','ex']:sc>=70?['Very good','vg']:sc>=58?['Good','gd']:['Best available','fa'];}
  function chartLine(c){
    var out=[]; EPL.forEach(function(p){out.push(pn(p).slice(0,3)+' '+sgName(c.P[p]).slice(0,3)+' '+dg(c.P[p])+'°'+(c.R[p]?'R':'')+' ('+c.H[p]+')');}); return out.join(' · ');
  }
  function render(){
    var r=EP_RES, out=$('epOut'); if(!r)return;
    var tzf=r.tzf, ev=EVB[r.ev], h='';
    if(!r.scan.wins.length){
      var vr=r.scan.vr||{}, why=Object.keys(vr).sort(function(a,b){return vr[b]-vr[a];}).map(function(k){return '<li>'+esc(k)+' – '+vr[k]+' of '+r.scan.n+' moments</li>';}).join('');
      out.innerHTML='<div class="epnone"><b>No suitable time was found in this range.</b> The books\u2019 must-rules removed these moments:<ul>'+why+'</ul>Try a later or longer date range, a wider daily time window, or switch Strictness to <i>Relaxed</i>.</div>'; return; }
    var wins=r.scan.wins.slice(), vr0=r.scan.vr||{}, vk=Object.keys(vr0).sort(function(a,b){return vr0[b]-vr0[a];});
    var m=parseInt($('epMin').value,10)||0, f=wins.filter(function(w){return w.dur>=m;}); if(f.length)wins=f;
    wins.sort(EP_SORT==='time'?function(a,b){return a.s-b.s;}:function(a,b){return b.best.sc-a.best.sc||b.dur-a.dur;});
    var total=wins.length; wins=wins.slice(0,15);
    h+='<div class="epsum2"><b>'+esc(ev.en)+'</b> · '+(r.trop?'Tropical zodiac (as in the books)':'Sidereal zodiac ('+(r.kind==='kp'?'KP':'Lahiri')+')')+' · '+r.nd+' day(s) scanned · '+total+' window(s) found'+(r.scan.ideal?'':' <span class="bad">(no ideal time – these are the best available)</span>')+'</div>';
    if(vk.length)h+='<div class="epexc">Moments excluded by the must-rules: '+vk.slice(0,3).map(function(k){return esc(k)+' ('+Math.round(100*vr0[k]/r.scan.n)+'%)';}).join('; ')+'</div>';
    h+='<div class="epsort">Sort by <button type="button" data-sort="score" class="'+(EP_SORT==='score'?'on':'')+'">Best score</button><button type="button" data-sort="time" class="'+(EP_SORT==='time'?'on':'')+'">Date &amp; time</button></div>';
    wins.forEach(function(w,i){
      var b=w.best, c=b.c, L=lab(b.sc), pass=b.res.filter(function(x){return x.w>0&&x.s>=0.7;}).sort(function(x,y){return y.w-x.w;}), warn=b.res.filter(function(x){return x.w>0&&x.s<0.4;}).sort(function(x,y){return y.w-x.w;});
      h+='<div class="epc"><div class="eph"><div><div class="epd">'+dayTxt(w.s,r.tz)+'</div><div class="ept">'+hhmm(w.s,r.tz)+' – '+hhmm(w.e,r.tz)+'<span class="epdur">'+durTxt(w.dur)+'</span></div></div>'+
        '<div class="epsc '+L[1]+'"><b>'+Math.round(b.sc)+'</b><span>'+L[0]+'</span></div></div>'+
        '<div class="epm">Best moment <b>'+hhmm(b.ms,r.tz)+'</b> · Rising <b>'+sgName(c.asc)+' '+dg(c.asc)+'°</b> · Moon <b>'+sgName(c.P.Mo)+' '+dg(c.P.Mo)+'°</b> ('+phaseName(c.el)+') · Hour of <b>'+(c.hr?pn(c.hr.ruler):'–')+'</b> · KP lagna <b>'+lordsOf(c.sidAsc)+'</b></div>';
      if(pass.length)h+='<ul class="epok">'+pass.slice(0,5).map(function(x){return '<li>'+esc(x.t)+'</li>';}).join('')+'</ul>';
      if(warn.length)h+='<ul class="epbad">'+warn.slice(0,3).map(function(x){return '<li>'+esc(x.t)+'</li>';}).join('')+'</ul>';
      h+='<details class="epdet"><summary>Full rule check &amp; chart</summary><div class="epch">'+esc(chartLine(c))+'</div><table class="eptb"><tbody>'+
        b.res.filter(function(x){return x.w>0||x.v;}).map(function(x){return '<tr><td class="'+(x.s>=0.7?'g':x.s>=0.4?'m':'r')+'">'+(x.s>=0.7?'✓':x.s>=0.4?'~':'✗')+'</td><td>'+esc(x.t)+'</td><td class="w">'+(x.w||'must')+'</td></tr>';}).join('')+'</tbody></table></details></div>';
    });
    if(total>15)h+='<p class="legend">Showing the best 15 of '+total+' windows. Narrow the dates to see others.</p>';
    out.innerHTML=h;
  }
  function go(){
    var msg=$('epMsg'); msg.className='msg';
    var lat=parseFloat($('epLat').value), lon=parseFloat($('epLon').value), tzs=$('epTz').value.trim();
    var f=$('epFrom').value, t=$('epTo').value;
    if(isNaN(lat)||isNaN(lon)||!tzs){msg.textContent='Choose a place (or enter latitude, longitude and time zone).';msg.className='msg err';return;}
    if(Math.abs(lat)>62){msg.textContent='Latitude must be between -62 and 62.';msg.className='msg err';return;}
    if(!f||!t){msg.textContent='Choose the first and last date.';msg.className='msg err';return;}
    if(typeof Astronomy==='undefined'){msg.textContent='Planet positions need the astronomy library, which did not load.';msg.className='msg err';return;}
    var fp=f.split('-').map(Number), tp=t.split('-').map(Number), d0=Date.UTC(fp[0],fp[1]-1,fp[2]), d1=Date.UTC(tp[0],tp[1]-1,tp[2]), nd=Math.round((d1-d0)/86400000)+1;
    if(nd<1){msg.textContent='The last date must not be before the first date.';msg.className='msg err';return;}
    if(nd>31){msg.textContent='Please choose at most 31 days at a time.';msg.className='msg err';return;}
    var a=$('epT1').value.split(':').map(Number), b=$('epT2').value.split(':').map(Number);
    var days=[], tzf;
    try{tzf=tzFn(tzs);}catch(e){msg.textContent='The time zone was not recognised.';msg.className='msg err';return;}
    for(var i=0;i<nd;i++){var dt=new Date(d0+i*86400000); var y=dt.getUTCFullYear(), m=dt.getUTCMonth()+1, d=dt.getUTCDate();
      var s=localToUtc(y,m,d,a[0],a[1]||0,tzs).ms, e=localToUtc(y,m,d,b[0],b[1]||0,tzs).ms; if(e<=s)e+=86400000; days.push({a:s,b:e});}
    var trop=$('epZod').value==='trop', kind=$('ayan').value;
    var btn=$('epGo'); btn.disabled=true; msg.textContent='Scanning '+nd+' day(s) of transits… please wait.';
    setTimeout(function(){
      try{
        var tz0=tzf(days[0].a);
        var sc=scan({ev:EP_SEL,lat:lat,lon:lon,tz:tzs,kind:kind,trop:trop,from:days[0].a,to:days[days.length-1].b,days:days,crop:$('epCrop').value,relaxed:$('epStrict').value==='relaxed'});
        EP_RES={scan:sc,ev:EP_SEL,tz:tz0,tzf:tzf,trop:trop,kind:kind,nd:nd};
        msg.textContent=''; render();
        $('epOut').scrollIntoView({block:'start',behavior:'smooth'});
      }catch(err){msg.textContent='Could not finish: '+err.message;msg.className='msg err';}
      btn.disabled=false;
    },30);
  }
  function init(){
    var bt=$('epBtn'); if(!bt)return;
    var cs=$('epCountry'); cs.innerHTML='<option value="*a">All countries (use search)</option>'+CITY.cc.map(function(n){return '<option value="'+n.replace(/"/g,'&quot;')+'">'+n+'</option>';}).join('');
    cs.addEventListener('change',epFill); $('epSearch').addEventListener('input',epFill); $('epCity').addEventListener('change',epPick); $('epTz').addEventListener('input',epOff);
    epFill(); drawEvents();
    $('epEvents').addEventListener('click',function(e){var b=e.target.closest('.epev'); if(!b)return; EP_SEL=b.getAttribute('data-ev'); drawEvents(); $('epRec').scrollIntoView({block:'nearest',behavior:'smooth'});});
    $('epOut').addEventListener('click',function(e){var b=e.target.closest('[data-sort]'); if(!b)return; EP_SORT=b.getAttribute('data-sort'); render();});
    $('epMin').addEventListener('change',render);
    $('epGo').addEventListener('click',go);
    $('epClose').addEventListener('click',function(){$('epPanel').classList.add('hide');});
    bt.addEventListener('click',function(){
      var pn2=$('epPanel'); pn2.classList.remove('hide');
      if(!$('epLat').value){$('epLat').value=$('lat').value;$('epLon').value=$('lon').value;$('epTz').value=$('tz').value;epOff();}
      if(!$('epFrom').value){var n=new Date(), z=function(x){return p2(x);}; var s=n.getFullYear()+'-'+z(n.getMonth()+1)+'-'+z(n.getDate()); $('epFrom').value=s; var e=new Date(n.getTime()+13*86400000); $('epTo').value=e.getFullYear()+'-'+z(e.getMonth()+1)+'-'+z(e.getDate());}
      pn2.scrollIntoView({block:'start'});
    });
    $('epLoc').addEventListener('click',function(){
      var el=$('epOff'); if(!navigator.geolocation){el.textContent='Location is not available here. Choose a city or enter latitude and longitude.';el.className='msg err';return;}
      el.textContent='Finding your location…'; el.className='msg';
      navigator.geolocation.getCurrentPosition(function(pos){$('epLat').value=pos.coords.latitude.toFixed(4);$('epLon').value=pos.coords.longitude.toFixed(4);
        try{$('epTz').value=Intl.DateTimeFormat().resolvedOptions().timeZone||$('epTz').value;}catch(e){} epOff();},
        function(){el.textContent='Could not get your location. Choose a city instead.';el.className='msg err';},{timeout:10000});
    });
  }
  setTimeout(function(){try{init();}catch(e){ if(window.console)console.error("EP init",e); }},0);
})();


/* ================= v5.7  Horary Answers (KP) =================
   Method gathered from: S. P. Khullar, "Horary Astrology and Cuspal Interlinks" (Appendix A and the
   five-step procedure), K. B. Bosmia, "Easy Way to Learn KP Horary Astrology" (six-fold significators,
   house groups, 7 ruling planets, joint-period timing) and Rahul Kaushik, "KP Astrology - The Hidden
   Secrets" (rules for timing, ruling planets, transit of Sun / Moon / Lagna / Jupiter).
   No natal chart is used: the chart is cast for the horary number (1-249) or the time of judgment. */
(function(){
  var PL=['Su','Mo','Ma','Me','Ju','Ve','Sa','Ra','Ke'], DAYL=['Su','Mo','Ma','Me','Ju','Ve','Sa'];
  function $(i){return document.getElementById(i);}
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
  function sgL(l){return SIGNS[Math.floor(mod(l,360)/30)][1];}
  function nm(c){return NAME[c];}
  function nms(a){return a.map(nm).join(', ');}
  var ORDH=['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];

  /* ---------- question table ----------
     [cat, id, English, Tamil, key cusps (judged), group houses (the event), opts]
     opts: n = denial houses (default: the 12th from each group house), adv = adverse event (YES = it is indicated),
           sp = special rule, note = the book's hint, w = false when no timing is needed */
  var CATS=['Self, health and life (1st house)','Money and finance (2nd house)','Contracts, journeys, communication (3rd house)','Home, property, vehicle, education (4th house)','Children, love, sports and speculation (5th house)','Job, loans, litigation, competition (6th house)','Marriage, partnership, business with others (7th house)','Sudden gains and losses, inheritance (8th house)','Foreign travel, higher studies, luck (9th house)','Career, status, government (10th house)','Gains, fulfilment of desire, friends (11th house)','Foreign land, investment, secrets, confinement (12th house)','Special questions'];
  var Q=[
  [0,'health','Will my health be normal? (state of health)','என் உடல்நலம் சீராக இருக்குமா?',[1],[1,5,11],{n:[6,8,12],note:'If the sub lord of the ascendant is in the star of an occupant of 1 or 11, health is normal; if it signifies 6, 8 or 12 it is not good (Bosmia).'}],
  [0,'disprone','Am I prone to disease / will I fall ill?','எனக்கு நோய் வருமா?',[1],[1,6,8,12],{adv:1,n:[11,5],note:'Proneness to disease: primary 1, supporting 6, 8, 12 (Khullar).'}],
  [0,'recover','Will I recover from the illness / accident?','நோய் / விபத்திலிருந்து குணமாவேனா?',[1,6],[1,5,11],{n:[6,8,12],note:'Ascendant sub lord signifying 1-5-11 gives recovery; 6th cusp with 5, 11 (Khullar, Bosmia).'}],
  [0,'accident','Will I meet with an accident?','எனக்கு விபத்து நேருமா?',[1,8],[1,4,8,12],{adv:1,n:[11,5],note:'Accident: primary 1 and 8, supporting 4 (Khullar).'}],
  [0,'unnat','Danger of unnatural death / grave danger to life?','உயிருக்கு ஆபத்து உண்டா?',[1,8],[1,2,7,8,12],{adv:1,n:[11,5],note:'Unnatural death: primary 1, 8; supporting 2, 7, Badhaka, 12 (Khullar).'}],
  [0,'longev','How long will life be? (short / medium / long)','ஆயுள் குறுகியதா, நீண்டதா?',[1],[1,5,9,10],{sp:'longevity',w:false,note:'Ascendant sub lord signifying 6, 8, 12: short life; 1, 5, 9, 10: long life (Bosmia).'}],
  [0,'selfeff','Will my own efforts succeed?','என் முயற்சி வெற்றி பெறுமா?',[1,6],[1,6,11],{note:'Success in self efforts: primary 1, 6; supporting 11 (Khullar).'}],
  [0,'status','Will I get status and respect?','மதிப்பும் அந்தஸ்தும் கிடைக்குமா?',[1],[1,10,11],{note:'Status and respect: primary 1; supporting 10, 11 (Khullar).'}],

  [1,'finstat','Will my financial position improve? / earn good money','என் நிதிநிலை மேம்படுமா?',[2],[2,6,11],{note:'If the 2nd cusp sub lord signifies 2-6-11 one earns well (Bosmia). Khullar: 2 with 6, 11.'}],
  [1,'wealth','Level of wealth: will I be rich?','செல்வம் சேருமா?',[2],[2,6,10,11],{n:[5,8,12],note:'No wealth if 2nd signifies 5-8-12 (Bosmia).'}],
  [1,'loan','Will I get a loan?','கடன் கிடைக்குமா?',[2,6],[2,6,11],{note:'Obtaining loans: primary 2, 6; supporting 11 (Khullar). Bosmia: 6th cusp sub lord signifying 2-6-10-11 gives a bank loan.'}],
  [1,'bankloan','Will I get a loan from a bank?','வங்கிக் கடன் கிடைக்குமா?',[7,6],[2,6,7,11],{note:'Loans from bank: primary 7; supporting 6, 2, 11 (Khullar).'}],
  [1,'invest','Is this investment / expenditure right for me?','இந்த முதலீடு / செலவு சரியா?',[2,12],[2,6,11,12],{note:'Investment-expenditure: primary 2, 12 (Khullar).'}],
  [1,'jewel','Will I obtain jewellery?','நகை கிடைக்குமா?',[2],[2,11],{note:'Obtaining jewellery: primary 2; supporting 11 (Khullar).'}],
  [1,'speech','Is there a defect in speech / vision?','பேச்சு / பார்வை குறைபாடு உண்டா?',[2],[2,8,12],{adv:1,n:[11,5],note:'Defect in speech, vision: primary 2; supporting 12, 8 (Khullar).'}],
  [1,'insur','Will my insurance claim be settled?','காப்பீட்டு கோரிக்கை கிடைக்குமா?',[2],[2,8,11],{note:'Insurance claims: primary 2; supporting 8, 11 (Khullar).'}],
  [1,'medclaim','Will my medical claim be paid?','மருத்துவச் செலவு கிடைக்குமா?',[2],[2,6,8,11],{note:'Medical claims: primary 2; supporting 6, 8, 11 (Khullar).'}],
  [1,'bankacc','Will I be able to open a bank account?','வங்கிக் கணக்கு தொடங்க முடியுமா?',[2],[2,6,11],{note:'Opening bank account: primary 2; supporting 6, 11 (Khullar).'}],
  [1,'lost2','Will I recover the lost / stolen article?','தொலைந்த பொருள் கிடைக்குமா?',[2],[2,6,11],{note:'Movable article lost: 2nd cusp sub lord signifying 2-6-11 regains it (Bosmia). Khullar: 2 / 8 / 12 cusp with 2, 6, 11.'}],
  [1,'sale','Will I get money from a sale / a big payment?','விற்பனைத் தொகை கிடைக்குமா?',[2],[2,6,11],{note:'Money coming in is the 2nd house: 2-6-11.'}],

  [2,'contract','Will I be able to sign the contract?','ஒப்பந்தம் கையெழுத்தாகுமா?',[3],[3,6,9,11],{note:'Signing a contract: primary 3; supporting 6, 9, 11 (Khullar).'}],
  [2,'overdraft','Meeting the bank officer for an overdraft','வங்கி அதிகாரியுடன் சந்திப்பு (ஓவர்டிராஃப்ட்)',[3],[3,6,9,11],{note:'Khullar: 3 with 6, 9, 11.'}],
  [2,'courtfile','Filing a court case: will it be accepted / favourable?','வழக்கு தொடுப்பது சாதகமா?',[3],[3,6,11],{note:'Filing a court case: primary 3; supporting 6, 11 (Khullar).'}],
  [2,'passport','Will I get the passport / visa / green card?','கடவுச்சீட்டு / விசா கிடைக்குமா?',[3],[3,9,11,12],{note:'Passport, green card, visa: primary 3; supporting 9, 11, 12 (Khullar).'}],
  [2,'journey','Will I be able to start the journey?','பயணம் தொடங்க முடியுமா?',[3],[3,5,9,11],{note:'Starting journey: primary 3; supporting 5, 9, 11 (Khullar).'}],
  [2,'negot','Will the negotiation succeed?','பேச்சுவார்த்தை வெற்றி பெறுமா?',[3],[3,9,11],{note:'Negotiations: primary 3; supporting 9, 11 and the cusp of the purpose (Khullar).'}],
  [2,'transfer','Will I get a transfer / change of place?','இடமாற்றம் கிடைக்குமா?',[3],[3,10,11,12],{note:'Change of place, transfer: primary 3; supporting 10, 11 (Khullar). Bosmia: 3-12-10.'}],
  [2,'interview','Will the interview / meeting go well?','நேர்காணல் / சந்திப்பு நன்றாக அமையுமா?',[11],[3,9,11],{note:'Interview: 3rd (meeting), 9th (the other person), and 11th for success (Bosmia).'}],
  [2,'dealsucc','Will the deal / transaction succeed?','ஒப்பந்த வர்த்தகம் வெற்றியாகுமா?',[1],[3,9,11],{note:'Ascendant cusp as the deal: sub lord signifying 3-9-11 succeeds (Bosmia).'}],
  [2,'commbus','Commission business: will I earn from it?','கமிஷன் தொழிலில் வருமானம் வருமா?',[3,10],[2,3,6,10,11],{note:'Commission as business: primary 3; supporting 3, 11 (Khullar); 3rd sub lord signifying 2-6-11 (Bosmia).'}],
  [2,'contjob','Contract job / publication / computer work','ஒப்பந்த வேலை / பதிப்பு / கணினித் தொழில்',[3,10],[2,3,6,10,11],{note:'Computer programmer, publication as profession: primary 3, 10; supporting 2, 11 (Khullar).'}],
  [2,'youngsick','Will my younger brother / sister fall sick?','இளைய சகோதரருக்கு நோய் வருமா?',[3],[3,8,10,2],{adv:1,n:[11,5],note:'Younger co-born proneness to sickness: primary 3; supporting 8, 10, 2 (Khullar).'}],
  [2,'rumour','Is the rumour / news true or false?','வதந்தி / செய்தி உண்மையா, பொய்யா?',[3],[3],{sp:'rumour',w:false,note:'3rd cusp sub lord Saturn: false; Mars: mischievous; Jupiter: true; planets connected with Saturn: false, with Jupiter: true (Bosmia).'}],

  [3,'basicedu','Will I complete my basic education / pass?','அடிப்படைக் கல்வி முடியுமா?',[4],[4,9,11],{note:'Basic education: primary 4; supporting 11 (Khullar); 4-9-11 (Bosmia).'}],
  [3,'exam','Will I pass the examination?','தேர்வில் வெற்றி பெறுவேனா?',[4],[4,9,11],{note:'Success in examination: 4th sub lord signifying 4-9-11 while the exam period runs (Bosmia).'}],
  [3,'profexam','Will I pass the professional / competitive examination?','போட்டித் தேர்வில் வெற்றி கிடைக்குமா?',[11],[4,6,9,11],{note:'11th sub lord signifying 4-6-9-11 (Bosmia).'}],
  [3,'buyprop','Will I buy the property / vehicle / furniture?','சொத்து / வாகனம் / தளவாடம் வாங்க முடியுமா?',[4],[4,11,12],{note:'Purchase of property, vehicle, furniture: primary 4; supporting 11, 12 (Khullar, Bosmia).'}],
  [3,'buycar','Will I buy a car / vehicle? (also old vehicle)','கார் / வாகனம் வாங்குவேனா?',[4],[4,11,12],{note:'4th sub lord signifying 4-11-12 buys the car; for an old car also check the 10th (Bosmia).'}],
  [3,'sellprop','Will I be able to sell the house / property?','வீடு / சொத்தை விற்க முடியுமா?',[4,10],[3,5,10],{note:'Sale of property: supporting 3, 5, 10 (Khullar). Bosmia: 10th sub lord signifying 3-5-10.'}],
  [3,'possess','Will I take possession of the flat / house?','வீட்டின் உடைமை கிடைக்குமா?',[4],[4,9,11],{note:'Taking possession of flat, quarter: primary 4; supporting 9, 11 (Khullar).'}],
  [3,'found','Laying the foundation of a house','வீட்டு அஸ்திவாரம் இடுதல்',[4],[4,11],{note:'Laying foundation: primary 4; supporting 11 (Khullar).'}],
  [3,'newhouse','Occupying / moving to a new house','புது வீட்டில் குடியேறுதல்',[4],[4,11],{note:'Occupying a new house: primary 4; supporting 11 (Khullar).'}],
  [3,'chgres','Will I change my residence?','வசிப்பிடம் மாறுவேனா?',[4],[3,12],{note:'4th sub lord signifying 3-12 changes residence (Bosmia).'}],
  [3,'momsick','Will my mother fall sick?','தாய்க்கு நோய் வருமா?',[4],[4,9,11,3],{adv:1,n:[10,5],note:'Mother proneness to sickness: primary 4; supporting 9, 11, 3 (Khullar).'}],
  [3,'engg','Engineering as the subject of study','பொறியியல் படிப்பு',[4],[4,10],{note:'Engineering: primary 4; supporting 10 (Khullar).'}],
  [3,'medst','Medicine as the subject of study','மருத்துவப் படிப்பு',[4],[4,6],{note:'Medicine: primary 4; supporting 6 (Khullar).'}],
  [3,'lawst','Law as the subject of study','சட்டப் படிப்பு',[4],[4,6,9],{note:'Law: primary 4; supporting 6 or 9 (Khullar).'}],
  [3,'artst','Fine arts as the subject of study','நுண்கலைப் படிப்பு',[4],[4,5],{note:'Fine arts: primary 4; supporting 5 (Khullar).'}],
  [3,'teach','Teaching as a profession','ஆசிரியர் தொழில்',[4,10],[2,6,10,4,9],{note:'Teaching: primary 4 or 9 and 10; supporting 2, 6, 10 (Khullar).'}],
  [3,'lawsuit','Will I win the lawsuit? (result of the case)','வழக்கில் வெற்றி கிடைக்குமா?',[4,6],[1,2,6,10,11],{note:'Result of lawsuit: 4th sub lord signifying 2-10-11 (Bosmia); success in litigation: primary 6; supporting 1, 11 (Khullar).'}],

  [4,'child','Will I have a child? / pregnancy (child birth)','குழந்தை பாக்கியம் உண்டா?',[5],[2,5,11],{n:[1,4,10],note:'5th (woman) or 11th (man) cusp sub lord signifying 2-5-11 promises a child; 1-4-10 denies (Bosmia). Khullar: primary 5; supporting 2, 11.'}],
  [4,'caesar','Will a Caesarean be needed?','சிசேரியன் தேவைப்படுமா?',[5],[2,5,8],{adv:1,n:[11],note:'Caesarean: primary 5; supporting 2, 8 (Khullar).'}],
  [4,'gender','Gender of the child (boy / girl)','குழந்தை ஆணா, பெண்ணா?',[5],[5],{sp:'gender',w:false,note:'Sun, Mars, Jupiter male; Moon, Venus, Rahu female; Mercury, Ketu neuter; odd signs male, even signs female (Bosmia).'}],
  [4,'loveaff','Will my love affair succeed?','என் காதல் வெற்றி பெறுமா?',[5],[2,5,7,11],{note:'5th sub lord signifying 2-5-11 or 7 gives a love partner; 5-6-8-12 ends it (Bosmia).'}],
  [4,'lovemar','Will it be a love marriage?','காதல் திருமணமா?',[5,7],[5,7,11],{sp:'lovemarriage',note:'Love marriage if the 5th sub lord signifies 7 and the 7th sub lord signifies 5 (Bosmia). Khullar: primary 5; supporting 7, 11.'}],
  [4,'sport','Will I win the game / sport / contest?','விளையாட்டில் வெற்றி கிடைக்குமா?',[5],[5,6,11],{note:'Success in sports: primary 5; supporting 6, 11 (Khullar).'}],
  [4,'sportprof','Sports, fine arts, film or speculation as a profession','விளையாட்டு / கலை / திரை / ஊக வணிகத் தொழில்',[5,10],[2,5,10,11],{note:'Primary 5, 10; supporting 2, 11 (Khullar). Acting: 5th sub lord signifying 5-6-10 (Bosmia).'}],
  [4,'film','Will my film / show / performance succeed?','என் படம் / நிகழ்ச்சி வெற்றி பெறுமா?',[5],[5,6,10,11],{note:'5th sub lord signifying 5-6-10-11 (Bosmia).'}],
  [4,'speculate','Will I gain from speculation / lottery / shares?','ஊகம் / லாட்டரி / பங்கில் லாபம் வருமா?',[5],[2,5,8,11],{note:'Speculation is 5th; sudden gain 8th; gain 11th (Khullar).'}],

  [5,'job','Will I get a job?','எனக்கு வேலை கிடைக்குமா?',[6,10],[2,6,10,11],{n:[1,5,9,12],note:'6th or 10th sub lord signifying 2-6-10 (-11) promises service (Bosmia).'}],
  [5,'govjob','Will I get a government job?','அரசு வேலை கிடைக்குமா?',[10],[2,6,10],{n:[1,5,9,12],note:'10th sub lord signifying 2-6-10 and connected with 10 (Bosmia).'}],
  [5,'chgjob','Will I change my job?','வேலை மாறுவேனா?',[10,6],[1,5,9,12],{n:[],note:'12th from 2-6-10 is 1-5-9; sub lord of 10 or 6 signifying 1-5-9-12 changes job (Bosmia).'}],
  [5,'betterjob','Will I get a better job as I expect?','எதிர்பார்க்கும் நல்ல வேலை கிடைக்குமா?',[11,10],[2,6,10,11],{n:[1,5,9,12],note:'Add the 11th cusp: sub lord signifying 2-6-10-11 gives the job of expectation (Bosmia).'}],
  [5,'jobbiz','Job or own business: which is better?','வேலையா, சொந்தத் தொழிலா?',[6,10],[2,6,7,10],{sp:'jobbiz',w:false,note:'6th / 10th sub lord signifying 2-6-10 favours service; 10th signifying 2-7-10 favours independent business (Bosmia).'}],
  [5,'promote','Will I get a promotion?','பதவி உயர்வு கிடைக்குமா?',[11,10],[2,6,10,11],{note:'Promotion: 11th sub lord signifying 2-6-10-11 (Bosmia); primary 10; supporting 2, 6, 11 (Khullar).'}],
  [5,'compet','Will I win the competition / election?','போட்டி / தேர்தலில் வெற்றி கிடைக்குமா?',[6],[1,6,11],{note:'Success in competition: primary 6; supporting 1, 11 (Khullar). Election: ascendant sub lord signifying 6-10-11 (Bosmia).'}],
  [5,'arrest','Will the police arrest the person?','காவல்துறை கைது செய்யுமா?',[6],[1,6,11],{note:'6th sub lord signifying 1 and 11: the police arrest the runaway (Bosmia).'}],
  [5,'medprac','Medical practice as a profession','மருத்துவத் தொழில்',[6,10],[2,6,10,11],{note:'Medical practitioner: primary 6, 10; supporting 2, 11 (Khullar).'}],
  [5,'legalprof','Legal profession','வழக்கறிஞர் தொழில்',[6,10],[2,6,9,10,11],{note:'Legal profession: primary 6 or 9, 10; supporting 2, 11 (Khullar).'}],
  [5,'secret','Secret activities of the partner / hidden matter','கூட்டாளியின் மறைவு செயல்கள்',[6],[5,6],{adv:1,n:[11],note:'Secret activities of partner: primary 6; supporting 5 (Khullar).'}],
  [5,'getloan6','Will my loan application be approved?','கடன் விண்ணப்பம் ஏற்கப்படுமா?',[6],[2,6,10,11],{note:'6th sub lord signifying 2-6-10-11: borrowing from the bank is promised (Bosmia).'}],

  [6,'marry','When / will I get married?','எனக்கு திருமணம் நடக்குமா?',[7],[2,7,11],{n:[1,6,10],note:'7th sub lord signifying 2-7-11 gives marriage; 1-6-10 denies or separates (Bosmia, Kaushik). Khullar: primary 7; supporting 5, 11.'}],
  [6,'engage','Will the engagement take place?','நிச்சயதார்த்தம் நடக்குமா?',[7],[3,7,9,11],{note:'Marriage-engagement: primary 7; supporting 3, 9, 11 (Khullar).'}],
  [6,'divorce','Will my marriage end in divorce / separation?','விவாகரத்து / பிரிவு ஏற்படுமா?',[7],[1,6,10],{adv:1,n:[2,7,11],note:'7th sub lord signifying 1-6-10 (12th from 2-7-11): separation or divorce (Bosmia).'}],
  [6,'reunion','Will my spouse return / will we reunite?','துணை திரும்புவாரா?',[7,11],[2,5,7,11],{note:'7th sub lord signifying 2-7-5-11 gives reunion (Bosmia).'}],
  [6,'remarry','Will I have a second marriage?','இரண்டாம் திருமணம் உண்டா?',[9,7],[2,7,9,11],{note:'Second marriage: primary 9; supporting 7, 11 (Khullar). Bosmia: 7th sub lord Mercury or in a dual sign and signifying 2-11.'}],
  [6,'partner','Will I get a business partner / will the partnership work?','கூட்டாளி கிடைப்பாரா? கூட்டுத் தொழில் நிலைக்குமா?',[7],[5,7,11],{note:'Partnership: primary 7; supporting 5, 11 (Khullar). Bosmia: 8th sub lord signifying 6-11 gets a partner.'}],
  [6,'secchild','Will I have a second child?','இரண்டாம் குழந்தை உண்டா?',[7],[2,7,11],{note:'Second child: primary 7; supporting 2, 11 (Khullar).'}],
  [6,'theft','Is there a theft / will I lose to theft?','திருட்டு நடக்குமா?',[7],[2,7,12],{adv:1,n:[11,6],note:'Theft: primary 7; supporting 2, 12 (Khullar).'}],
  [6,'opponent','Is there danger from opponents?','எதிரிகளால் ஆபத்தா?',[7],[7,8,12],{adv:1,n:[11,5],note:'Danger from opponents: primary 7; supporting 8, 12 (Khullar).'}],
  [6,'indbiz','Will an independent business succeed?','சொந்தத் தொழில் வெற்றி பெறுமா?',[10,7],[2,7,10,11],{note:'10th sub lord signifying 2-7-10 gives independent business; 7th signifying 2-10-11 gives gain (Bosmia).'}],
  [6,'redevel','Redevelopment / renovation of the house or factory','வீடு / தொழிற்சாலை புதுப்பித்தல்',[7],[4,7,11],{note:'7th sub lord signifying 4-7-11 (Bosmia).'}],

  [7,'unexp','Will I get an unexpected gain?','எதிர்பாரா லாபம் கிடைக்குமா?',[8],[2,8,11],{note:'Unexpected gains: primary 8; supporting 2, 11 (Khullar).'}],
  [7,'unloss','Is there an unexpected loss?','எதிர்பாரா இழப்பு வருமா?',[8],[5,8,12],{adv:1,n:[2,11],note:'Unexpected loss: primary 8; supporting 5, 12 (Khullar).'}],
  [7,'gifts','Will I receive gifts?','பரிசு கிடைக்குமா?',[8],[6,8,11],{note:'Receipt of gifts: primary 8; supporting 6, 11 (Khullar).'}],
  [7,'inherit','Will I get an inheritance (cash / ornaments)?','பரம்பரைச் சொத்து / பணம் கிடைக்குமா?',[8,9],[2,8,11],{note:'Inheritance: primary 8; supporting 2, 11 (Khullar). Bosmia: 9th sub lord signifying 2-11.'}],
  [7,'inhprop','Will I inherit property / a vehicle?','வாரிசுச் சொத்து / வாகனம் கிடைக்குமா?',[8,9],[4,8,11,2],{note:'Property, vehicle from inheritance: primary 8; supporting 4, 11 (Khullar).'}],
  [7,'lost8','Will the lost article be recovered?','தொலைந்த பொருள் திரும்பக் கிடைக்குமா?',[8,12],[2,6,11],{note:'Recovery of lost articles: primary 8 / 12; supporting 2, 6, 11 (Khullar).'}],
  [7,'deathsick','Death due to sickness','நோயால் மரண அபாயம்',[8],[6,8,12],{adv:1,n:[1,5,11],note:'Death due to sickness: primary 8; supporting 6, 12 (Khullar).'}],
  [7,'deathacc','Death due to accident','விபத்து மரண அபாயம்',[8],[4,8,12],{adv:1,n:[1,5,11],note:'Death due to accident: primary 8; supporting 4, 12 (Khullar).'}],
  [7,'depress','Depression / mental distress','மனச்சோர்வு',[8],[1,3,8,12],{adv:1,n:[11,5],note:'Depression: primary 8; supporting 1, 3, 12 (Khullar).'}],
  [7,'dues','Will I receive the due / donation / pending money?','நிலுவை / நன்கொடைப் பணம் கிடைக்குமா?',[8],[2,6,11],{note:'8th sub lord signifying 2-6-11 (Bosmia).'}],
  [7,'surgeon','Surgery as a profession','அறுவை சிகிச்சைத் தொழில்',[8,10],[2,8,10,11],{note:'Surgeons: primary 8, 10; supporting 2, 11 (Khullar).'}],

  [8,'foreign','Will I travel abroad? (long journey)','வெளிநாட்டுப் பயணம் உண்டா?',[9],[3,9,12],{note:'Long journeys: primary 9; supporting 3, 12 (Khullar). Bosmia: 3-9-12.'}],
  [8,'highedu','Will I get higher education / admission?','உயர்கல்வி / சேர்க்கை கிடைக்குமா?',[9,4],[4,9,11],{note:'Higher education: primary 4, 9; supporting 11 (Khullar). Bosmia: 9th sub lord signifying 4-9-11.'}],
  [8,'thirdchild','Will I have a third child?','மூன்றாம் குழந்தை உண்டா?',[9],[2,9,11],{note:'Third child: primary 9; supporting 2, 11 (Khullar).'}],
  [8,'fathersick','Will my father fall sick?','தந்தைக்கு நோய் வருமா?',[9],[9,2,4,8],{adv:1,n:[10,5],note:'Father proneness to sickness: primary 9; supporting 2, 4, 8 (Khullar).'}],
  [8,'spirit','Success in spiritual discipline','ஆன்மிகப் பயிற்சியில் வெற்றி',[9],[6,9,11],{note:'Success in spiritual discipline: primary 9; supporting 6, 11 (Khullar).'}],
  [8,'politics','Politics as a profession','அரசியல் தொழில்',[9,10],[2,6,9,10,11],{note:'Politics: primary 9, 10; supporting 2, 6, 11 (Khullar).'}],
  [8,'newhome9','Will I be able to shift to the new house?','புதிய வீட்டிற்கு மாற முடியுமா?',[9],[4,11,12],{note:'9th (the house you plan to move to) sub lord signifying 4-11-12 (Bosmia).'}],

  [9,'servbiz','Service or business: will it go well?','வேலை / தொழில் நன்றாக அமையுமா?',[10],[6,7,10],{note:'Service or business: primary 10; supporting 6, 7 (Khullar).'}],
  [9,'fame','Will I get name and fame?','புகழ் கிடைக்குமா?',[10],[1,10,11],{note:'Name and fame: primary 10; supporting 1, 11 (Khullar).'}],
  [9,'volret','Voluntary retirement','விருப்ப ஓய்வு',[10],[1,5,9],{note:'Voluntary retirement: primary 10; supporting 1, 5, 9 (Khullar).'}],
  [9,'retire','Retirement (normal)','ஓய்வு',[10],[5,9],{note:'Retirement: primary 10; supporting 5, 9 (Khullar).'}],
  [9,'break','Break in service / will I be removed from the job?','பணி நீக்கம் / பணி இடைவெளி ஏற்படுமா?',[10,8],[5,9,8],{adv:1,n:[2,6,11],note:'Break in service: 10 with 5, 9; removal from service: 8, 10 with 5, 9 (Khullar).'}],
  [9,'suspend','Suspension from service','பணி இடைநீக்கம்',[8,10],[5,6,8],{adv:1,n:[2,11],note:'Suspension: primary 8, 10; supporting 5, 6 (Khullar).'}],
  [9,'probbiz','Problems in business or service','தொழில் / வேலையில் சிக்கல்கள்',[10],[5,8,10],{adv:1,n:[2,11],note:'Problems in business or service: primary 10; supporting 5, 8 (Khullar).'}],
  [9,'export','Export business','ஏற்றுமதித் தொழில்',[12,10],[2,6,10,11,12],{note:'Export business: primary 12, 10; supporting 2, 6, 11 (Khullar).'}],
  [9,'immig','Will I get permanent residency / immigration / PR?','நிரந்தரக் குடியுரிமை / PR கிடைக்குமா?',[10],[5,9,11],{note:'10th sub lord signifying 5-9-11 gives PR / Green card (Bosmia).'}],
  [9,'electpost','Will I get a political post / minister / chairman?','அரசியல் பதவி / அமைச்சர் பதவி கிடைக்குமா?',[10],[3,10,11],{note:'Position in politics: 10th sub lord signifying 3-10-11 (Bosmia).'}],
  [9,'newbiz','Will I start a new business / venture successfully?','புதிய தொழில் தொடங்கினால் வெற்றி கிடைக்குமா?',[1,11],[1,2,3,6,10,11],{note:'Ascendant or 11th sub lord signifying 1-2-3-6-10-11 promises success of the project (Bosmia).'}],

  [10,'desire','Will my desire be fulfilled?','என் விருப்பம் நிறைவேறுமா?',[11],[1,11],{note:'Satisfaction of desires: primary 11; supporting 1 (Khullar).'}],
  [10,'winlove','Winning in love','காதலில் வெற்றி',[11],[5,7,11],{note:'Winning in love: primary 11; supporting 5, 7 (Khullar).'}],
  [10,'friend','Will relations with the friend improve?','நண்பருடன் உறவு சீராகுமா?',[11],[1,5,11],{note:'11th sub lord signifying 1-5-11 (Bosmia).'}],
  [10,'missing','Will the missing person / pet return home?','காணாமல் போனவர் திரும்புவாரா?',[11],[2,8,11],{note:'11th sub lord signifying 2-8-11 brings the person home (Bosmia). For a pet also check the 4th.'}],
  [10,'machine','Will I gain from the purchase of a machine / advertisement?','இயந்திரம் / விளம்பரத்தால் லாபம் கிடைக்குமா?',[11],[2,6,11],{note:'11th sub lord signifying 2-6-11 (Bosmia).'}],
  [10,'partnerhelp','Will my partner give the promised financial help?','கூட்டாளியின் நிதி உதவி கிடைக்குமா?',[11,8],[2,6,11],{note:'11th sub lord signifying 2-6-11; also check the 8th (Bosmia).'}],
  [10,'sexrel','Relationship with a friend (intimate)','நெருக்கமான உறவு',[11],[5,7,11],{note:'Sexual relationship with friend: primary 11; supporting 7, 5 (Khullar).'}],
  [10,'return','Will the exiled / absent person return to the homeland?','நாடு திரும்புவாரா?',[11],[2,8,11],{note:'11th sub lord signifying 2-8-11 (Bosmia).'}],

  [11,'repay','Will I be able to repay the loan?','கடனை திருப்பிச் செலுத்த முடியுமா?',[12],[5,8,12],{note:'Repayment of loan: primary 12; supporting 5, 8 (Khullar).'}],
  [11,'lost12','Will the lost article be recovered?','தொலைந்த பொருள் கிடைக்குமா?',[12],[2,6,11],{note:'Recovery of lost article: primary 12; supporting 2, 6, 11 (Khullar).'}],
  [11,'invgain','Will I gain from the investment?','முதலீட்டில் லாபம் கிடைக்குமா?',[12],[2,6,11,12],{note:'Gain in investment: primary 12; supporting 2, 6, 11 (Khullar).'}],
  [11,'invloss','Will I lose in the investment?','முதலீட்டில் நஷ்டம் வருமா?',[12],[5,8,12],{adv:1,n:[2,6,11],note:'Loss in investment: primary 12; supporting 5, 8 (Khullar).'}],
  [11,'secprof','Secret activities as a profession','மறைமுகத் தொழில்',[12,10],[2,10,11,12],{note:'Secret activities as profession: primary 12, 10; supporting 2, 11 (Khullar).'}],
  [11,'secdanger','Danger from involvement in secret activities','மறைமுக செயலால் ஆபத்தா?',[12],[7,8,12],{adv:1,n:[2,11],note:'Danger from involvement in secret activities: primary 12; supporting 7, 8 (Khullar).'}],
  [11,'prison','Will I face imprisonment?','சிறைத் தண்டனை உண்டா?',[12],[3,8,12],{adv:1,n:[2,4,11],note:'Imprisonment: primary 12; supporting 3, 8 (Khullar). 12th sub lord signifying 3-8-12 (Bosmia).'}],
  [11,'bail','Will I get bail / release from confinement?','ஜாமீன் / விடுதலை கிடைக்குமா?',[12,2],[2,4,11],{note:'12th (confinement) signifying 2-4-11 gives freedom (Bosmia).'}],
  [11,'secdoc','Receipt of secret documents','ரகசிய ஆவணம் கிடைக்குமா?',[12],[4,11,12],{note:'Receipt of secret documents: primary 12; supporting 4, 11 (Khullar).'}],
  [11,'abscond','Is there absconding / running away?','தலைமறைவு / ஓடிப்போதல் நடக்குமா?',[12],[3,8,12],{adv:1,n:[2,4,11],note:'Absconding: primary 12; supporting 3, 8 (Khullar).'}],
  [11,'research','Success in research','ஆராய்ச்சியில் வெற்றி',[12],[6,11,12],{note:'Success in research: primary 12; supporting 6, 11 (Khullar).'}],
  [11,'settle','Will I settle abroad?','வெளிநாட்டில் குடியேறுவேனா?',[12],[3,9,12],{note:'12th sub lord signifying 3-9-12: foreign travel / stay abroad (Bosmia).'}],
  [11,'buyhouse12','Is buying the house beneficial?','வீடு வாங்குவது நன்மையா?',[12,4],[4,11,12],{note:'Investment in a house: 12th with 4, 11 (Bosmia).'}]
  ];

  Q.push(
  [12,'whereabouts','Where is the missing person, and is he or she safe?','காணாமல் போனவர் எங்கே, பாதுகாப்பாக இருக்கிறாரா?',[3],[3,11],{note:'Information on whereabouts comes when the Moon, Mercury or the 3rd lord influence the 3rd house or the ascendant (Choudhry ch. 14); 3rd cusp sub lord signifying 3-11 gives news.'}],
  [12,'kidnap','Has the missing person been taken against his or her will?','காணாமல் போனவர் கடத்தப்பட்டாரா?',[12],[6,8,12],{adv:1,n:[2,11],note:'Involuntary disappearance: Mars, Ketu and the 6th and 8th lords press the ascendant or its lord; voluntary: Rahu and the 3rd, 5th, 7th and 12th lords (Choudhry ch. 14).'}],
  [12,'stolenrec','Will the stolen or misplaced article be recovered?','திருடப்பட்ட / தவறிய பொருள் கிடைக்குமா?',[11],[2,6,11],{note:'Recovery of stolen or misplaced items: 11th sub lord signifying 2-6-11; timing follows the separation of the afflicting transit (Choudhry).'}],
  [12,'treatrec','Should I take the treatment the doctor has advised? Will it work?','மருத்துவர் பரிந்துரைத்த சிகிச்சை பலன் தருமா?',[1],[1,5,11],{n:[6,8,12],note:'Ascendant sub lord signifying 1-5-11 favours the treatment; 6-8-12 warns of complications or no benefit.'}],
  [12,'taxtrouble','Will tax or government-authority trouble come to me?','வரி / அரசு அதிகாரிகளால் தொல்லை வருமா?',[6],[6,8,12],{adv:1,n:[2,11],note:'Trouble from authorities: 6th sub lord signifying 6-8-12; Rahu or the Sun on the 10th adds government pressure.'}],
  [12,'initiation','Should I accept this spiritual guide or take initiation?','இந்த குருவிடம் தீட்சை பெறலாமா?',[9],[5,9,11],{note:'9th (guru, dharma) and 5th (mantra) with 11th fulfilment; Jupiter is the karaka.'}],
  [12,'marryx','Will marriage with this particular person succeed?','இந்த நபருடன் திருமணம் வெற்றி பெறுமா?',[7],[2,7,11],{n:[1,6,10,12],note:'7th sub lord signifying 2-7-11; 1-6-10-12 shows separation. Venus (and Jupiter for the husband) are the karakas.'}],
  [12,'propdisp','Will I be drawn into a property dispute?','சொத்து தகராறில் சிக்குவேனா?',[4],[4,6,8,12],{adv:1,n:[2,11],note:'6th lord in the houses of property or the property lords in the 6th shows property disputes; the 12th lord on the 4th or 8th shows loss (Choudhry ch. 11).'}],
  [12,'relocate','Will moving to the new city or country bring good results?','புதிய ஊருக்கு / நாட்டுக்கு மாறுவது நன்மையா?',[4,9],[4,9,11],{n:[6,8],note:'4th (change of residence) with 9th and 11th gives a good move; the 12th for a distant land.'}]
  );
  var QB={}; Q.forEach(function(q){QB[q[1]]={cat:q[0],id:q[1],en:q[2],ta:q[3],k:q[4],g:q[5],o:q[6]||{}};});

  /* ---------- sub / sub-sub of a longitude ---------- */
  function hqSub(lon){
    lon=mod(lon,360); var N=360/27, nk=Math.min(26,Math.floor(lon/N)), si=nk%9, pos=nk*N, star=ORDER[si];
    for(var j=0;j<9;j++){
      var sb=ORDER[(si+j)%9], len=N*YEARS[sb]/120;
      if(lon<pos+len||j===8){
        var off=lon-pos, k=ORDER.indexOf(sb), acc=0, ssl=sb;
        for(var i=0;i<9;i++){var c=ORDER[(k+i)%9], w=len*YEARS[c]/120; if(off<acc+w||i===8){ssl=c;break;} acc+=w;}
        return {star:star,sub:sb,ssl:ssl};
      }
      pos+=len;
    }
  }
  function lordsAt(lon){var s=hqSub(lon); return {sign:sgL(lon),star:s.star,sub:s.sub,ssl:s.ssl,lon:lon};}

  /* ---------- the chart ---------- */
  function houseIn(l,cu){for(var i=0;i<12;i++){var s=cu[i], e=cu[(i+1)%12]; if(mod(l-s,360)<mod(e-s,360))return i+1;} return 1;}
  function ascCross(target,ms,lat,lon,kind){
    var best=null, step=120000, prev=null, tt;
    for(tt=ms-13*3600000;tt<=ms+13*3600000;tt+=step){
      var d=mod(sidAsc(tt,lat,lon,kind)-target+180,360)-180;
      if(prev!==null&&prev.d<0&&d>=0&&Math.abs(prev.d)<30){
        var lo=prev.t, hi=tt; for(var i=0;i<30;i++){var m=(lo+hi)/2, dm=mod(sidAsc(m,lat,lon,kind)-target+180,360)-180; if(dm<0)lo=m;else hi=m;}
        var c=(lo+hi)/2; if(best===null||Math.abs(c-ms)<Math.abs(best-ms))best=c;
      }
      prev={t:tt,d:d};
    }
    return best===null?ms:best;
  }
  function buildChart(o){
    var oldC=CFG; CFG={lat:o.lat,lon:o.lon,kind:o.kind};
    try{
      var ms=o.ms, pl={}, ch={ms:ms,lat:o.lat,lon:o.lon,kind:o.kind,pl:pl,num:o.num||0};
      PL.forEach(function(p){var l=sidLon(p,ms); pl[p]={lon:l,retro:isRetro(p,ms)};}); pl.Ra.retro=true; pl.Ke.retro=true;
      var tc=ms, target=null;
      if(o.num){target=SEGS[o.num-1].s+1e-6; tc=ascCross(target,ms,o.lat,o.lon,o.kind);}
      var cu=placidusCusps(tc,o.lat,o.lon,o.kind).slice();
      if(target!==null){var d0=cu[0]-target; cu=cu.map(function(x){return mod(x-d0,360);}); cu[0]=target;}
      ch.cu=cu; ch.tc=tc; ch.real=lordsAt(sidAsc(ms,o.lat,o.lon,o.kind));
      ch.cusp=cu.map(function(l){var s=lordsAt(l); s.sign=sgL(l); return s;});
      ch.own={}; PL.forEach(function(p){ch.own[p]=[];});
      for(var i=0;i<12;i++){ch.own[sgL(cu[i])].push(i+1);}
      PL.forEach(function(p){var l=lordsAt(pl[p].lon); pl[p].sign=l.sign; pl[p].star=l.star; pl[p].sub=l.sub; pl[p].ssl=l.ssl; pl[p].house=houseIn(pl[p].lon,cu); pl[p].sg=Math.floor(pl[p].lon/30);});
      ch.occ={}; for(var h=1;h<=12;h++)ch.occ[h]=[]; PL.forEach(function(p){ch.occ[pl[p].house].push(p);});
      return ch;
    }finally{CFG=oldC;}
  }
  /* Rahu / Ketu act for planets joined with / aspecting them, else for the sign lord (Bosmia ch. 4) */
  function agents(ch,x){
    var s=ch.pl[x].sg, out=[];
    PL.forEach(function(p){ if(p===x||p==='Ra'||p==='Ke')return; if(ch.pl[p].sg===s)out.push(p); });
    if(out.length)return out;
    var asp={Ju:[4,8],Sa:[2,9],Ma:[3,7]};
    Object.keys(asp).forEach(function(p){ asp[p].forEach(function(a){ if((ch.pl[p].sg+a)%12===s)out.push(p); }); });
    if(out.length)return out;
    return [ch.pl[x].sign];
  }
  function hsOf(ch,q,seen){
    var hs=[ch.pl[q].house].concat(ch.own[q]);
    if((q==='Ra'||q==='Ke')&&!(seen&&seen[q])){
      var sn=seen||{}; sn[q]=1;
      agents(ch,q).forEach(function(a){hs=hs.concat(ch.own[a]).concat([ch.pl[a].house]);});
    }
    return hs;
  }
  /* houses signified by planet p, with a weight: star-lord level 1, own level .8, sub level .5 (six-fold) */
  function sigOf(ch,p){
    var m={}; function add(h,w){if(!m[h]||m[h]<w)m[h]=w;}
    hsOf(ch,ch.pl[p].star).forEach(function(h){add(h,1);});
    hsOf(ch,p).forEach(function(h){add(h,0.8);});
    hsOf(ch,ch.pl[p].sub).forEach(function(h){add(h,0.5);});
    for(var i=0;i<12;i++){ if(ch.cusp[i].sub===p)add(i+1,0.8); }   /* a cusp sub lord also signifies that cusp (Bosmia, Kaushik) */
    return m;
  }
  function sigCusp(ch,i){   /* planet-like signification of a cusp lord (sub lord) is taken from the planet itself */ return null; }

  /* ---------- ruling planets ---------- */
  function dayLord(ms,lat,lon,tzs){
    var off=0; try{off=tzFn(tzs)(ms);}catch(e){}
    var loc0=Math.floor((ms+off*3600000)/86400000)*86400000-off*3600000, wd=new Date(ms+off*3600000).getUTCDay();
    try{
      var obs=new Astronomy.Observer(lat,lon,0), r=Astronomy.SearchRiseSet(Astronomy.Body.Sun,obs,+1,Astronomy.MakeTime(new Date(loc0)),1);
      if(r&&ms<r.date.getTime())wd=(wd+6)%7;
    }catch(e){}
    return DAYL[wd];
  }
  function rulingPlanets(ch,day){
    var a=ch.real||ch.cusp[0], m=lordsAt(ch.pl.Mo.lon), rp=[], tag={};
    function add(p,t){ if(rp.indexOf(p)<0)rp.push(p); (tag[p]=tag[p]||[]).push(t); }
    add(day,'Day lord'); add(a.sign,'Lagna sign lord'); add(a.star,'Lagna star lord'); add(a.sub,'Lagna sub lord');
    add(m.sign,'Moon sign lord'); add(m.star,'Moon star lord'); add(m.sub,'Moon sub lord');
    ['Ra','Ke'].forEach(function(x){
      if(rp.indexOf(x)>=0)return; var s=ch.pl[x].sg, why='';
      rp.slice().forEach(function(p){ if(why||p==='Ra'||p==='Ke')return;
        if(ch.pl[p].sg===s)why='conjoined with '+nm(p);
        else if(ch.own[p]&&SIGNS[s][1]===p)why='in the sign of '+nm(p);
        else if(({Ju:[4,8],Sa:[2,9],Ma:[3,7]}[p]||[]).some(function(a){return (ch.pl[p].sg+a)%12===s;}))why='aspected by '+nm(p);
      });
      if(why)add(x,'Added: '+why);
    });
    return {list:rp,tag:tag,moon:m,asc:a,day:day};
  }
  function starRetro(ch,p){return !!(ch.pl[ch.pl[p].star]&&ch.pl[ch.pl[p].star].retro&&ch.pl[p].star!=='Ra'&&ch.pl[p].star!=='Ke');}

  /* ---------- verdict ---------- */
  function rotH(h,rot){return ((h-1+rot)%12)+1;}
  function prevH(h){return h===1?12:h-1;}
  function wmax(m,hs){var w=0; hs.forEach(function(h){if(m[h]>w)w=m[h];}); return w;}
  function cslOf(ch,cusp){return ch.cusp[cusp-1].sub;}
  function houseTxt(m){return Object.keys(m).map(Number).sort(function(a,b){return a-b;}).map(function(h){return h+(m[h]>=1?'':m[h]>=0.8?'':'·');}).join('-');}

  function analyse(qd,ch,o){
    var rot=o.rot||0, ob=qd.o, steps=[], R=function(h){return rotH(h,rot);};
    var G=qd.g.map(R), K=qd.k.map(R);
    var Ng=(ob.n!==undefined?ob.n.map(R):G.map(function(h){return R(prevH(((h-1-rot+12)%12)+1));}).filter(function(h){return G.indexOf(h)<0;}));
    if(ob.n===undefined){Ng=qd.g.map(function(h){return R(prevH(h));}).filter(function(h){return G.indexOf(h)<0;});}
    var res={q:qd,G:G,N:Ng,K:K,steps:steps,rot:rot,pts:0};
    var rp=rulingPlanets(ch,o.day); res.rp=rp;
    // optional retrograde rule (Kaushik)
    var rpl=rp.list.slice();
    if(o.retro){var drop=[]; rpl=rpl.filter(function(p){if(starRetro(ch,p)){drop.push(p);return false;} return true;}); if(drop.length)steps.push({ok:null,t:'Retrograde rule: ruling planet(s) '+nms(drop)+' stand in the star of a retrograde planet and are discarded (Kaushik).'});}
    res.rpl=rpl;
    /* 1. genuineness (Khullar step 2) */
    var mo=ch.pl.Mo, moSt=mo.star, kc=K[0], kcu=ch.cusp[kc-1], gen=false, gw='';
    var asked=G.concat(K);
    if(asked.indexOf(mo.house)>=0){gen=true;gw='Moon stands in house '+mo.house;}
    else if(asked.indexOf(ch.pl[moSt].house)>=0){gen=true;gw='Moon’s star lord '+nm(moSt)+' stands in house '+ch.pl[moSt].house;}
    else if([kcu.sign,kcu.star,kcu.sub,kcu.ssl].indexOf('Mo')>=0||[kcu.sign,kcu.star,kcu.sub,kcu.ssl].indexOf(moSt)>=0){gen=true;gw='Moon or its star lord rules the sign / star / sub of the '+ORDH[kc-1]+' cusp';}
    else if(G.some(function(h){return ch.own[moSt].indexOf(h)>=0;})){gen=true;gw='Moon’s star lord '+nm(moSt)+' owns house '+G.filter(function(h){return ch.own[moSt].indexOf(h)>=0;})[0];}
    steps.push({ok:gen,t:gen?'Chart is genuine for this question: '+gw+' (Khullar step 2).':'Moon and its star lord do not touch the houses of this question. Khullar calls the chart doubtful, though Bosmia does not use this check.'});
    res.gen=gen;
    /* 2. the cusp sub lords */
    var per=[], pos=0, neg=0, any=false;
    K.forEach(function(c){
      var csl=cslOf(ch,c), sg=sigOf(ch,csl), got=G.filter(function(h){return sg[h]>0;}), bad=Ng.filter(function(h){return sg[h]>0;});
      var pw=0; got.forEach(function(h){pw+=sg[h];}); var nw=0; bad.filter(function(h){return G.indexOf(h)<0;}).forEach(function(h){nw+=sg[h];});
      var need=Math.max(1,Math.ceil(G.length/2)), strong=got.filter(function(h){return sg[h]>=0.8;}).length;
      var ratio=pw/Math.max(1,G.length), val=ratio-0.5*nw/Math.max(1,G.length);
      per.push({c:c,csl:csl,sg:sg,got:got,bad:bad,pw:pw,nw:nw,val:val,strong:strong,need:need});
    });
    res.per=per;
    var val=0; per.forEach(function(x){val+=x.val;}); val/=per.length;
    per.forEach(function(x){
      var cu=ch.cusp[x.c-1], t='The '+ORDH[x.c-1]+' cusp ('+SIGNS[cu.lon>=0?Math.floor(cu.lon/30):0][0]+' '+Math.floor(cu.lon%30)+'°'+') has sub lord <b>'+nm(x.csl)+'</b> (star '+nm(ch.pl[x.csl].star)+', sub '+nm(ch.pl[x.csl].sub)+'). It signifies houses '+houseTxt(x.sg)+'.';
      steps.push({ok:x.got.length>=x.need&&x.val>0,t:t+' Houses needed '+G.join('-')+': <b>'+(x.got.length?x.got.join('-'):'none')+'</b> present'+(x.bad.length?'; denial houses '+x.bad.join('-')+' also present':'')+'.'});
    });
    /* special rules */
    var sp=ob.sp, spec=null;
    if(sp==='rumour'){
      var c3=cslOf(ch,3), conn=[c3,ch.pl[c3].star,ch.pl[c3].sub], t='';
      if(c3==='Sa')t='false'; else if(c3==='Ma')t='mischievous'; else if(c3==='Ju')t='true';
      else if(conn.indexOf('Sa')>=0)t='false'; else if(conn.indexOf('Ju')>=0)t='true'; else if(conn.indexOf('Ma')>=0)t='mischievous';
      spec={label:t==='true'?'TRUE':t==='false'?'FALSE':t==='mischievous'?'MISCHIEVOUS (spread with bad intent)':'UNDECIDED',yes:t==='true',no:t==='false'||t==='mischievous',txt:'3rd cusp sub lord is '+nm(c3)+' (star '+nm(ch.pl[c3].star)+', sub '+nm(ch.pl[c3].sub)+'). Saturn / Saturn-linked: false; Mars: mischievous; Jupiter / Jupiter-linked: true.'};
    }else if(sp==='gender'){
      var cu5=ch.cusp[4], pm={Su:1,Ma:1,Ju:1,Mo:-1,Ve:-1,Ra:-1,Me:0,Ke:0}, sc=0, bits=[];
      [cu5.sign,cu5.star,cu5.sub].forEach(function(p){sc+=pm[p]; bits.push(nm(p)+(pm[p]>0?' (male)':pm[p]<0?' (female)':' (neuter)'));});
      sc+=(Math.floor(cu5.lon/30)%2===0)?1:-1; bits.push('sign '+SIGNS[Math.floor(cu5.lon/30)][0]+((Math.floor(cu5.lon/30)%2===0)?' (odd = male)':' (even = female)'));
      spec={label:sc>0?'BOY (male)':sc<0?'GIRL (female)':'UNCERTAIN',yes:sc>0,no:sc<0,txt:'5th cusp sign, star and sub lords: '+bits.join(', ')+'. The book says this is very hard to judge, so treat it as a weak indication.'};
    }else if(sp==='longevity'){
      var a=cslOf(ch,1), sg=sigOf(ch,a), s=wmax(sg,[6,8,12]), l=wmax(sg,[1,5,9,10]);
      var lab=(l>0&&s===0)?'LONG life (about more than 66 years)':(s>0&&l===0)?'SHORT life (about 33 years)':(l>0&&s>0)?'MEDIUM life (about 33 to 66 years)':'UNDECIDED';
      spec={label:lab,yes:l>0&&s===0,no:s>0&&l===0,txt:'Ascendant sub lord '+nm(a)+' signifies houses '+houseTxt(sg)+'. 6-8-12: short; 1-5-9-10: long; both: medium.'};
    }else if(sp==='lovemarriage'){
      var c5=cslOf(ch,5), c7=cslOf(ch,7), s5=sigOf(ch,c5), s7=sigOf(ch,c7), l5=s5[7]>0||s5[11]>0, l7=s7[5]>0;
      spec={label:(s5[7]>0&&s7[5]>0)?'LOVE marriage':(l5||l7)?'Mostly LOVE-linked, but not fully confirmed':'ARRANGED marriage',yes:s5[7]>0&&s7[5]>0,no:!(l5||l7),txt:'5th sub lord '+nm(c5)+' signifies '+houseTxt(s5)+'; 7th sub lord '+nm(c7)+' signifies '+houseTxt(s7)+'. A love marriage needs the 5th to signify 7 and the 7th to signify 5.'};
    }else if(sp==='jobbiz'){
      var c6=cslOf(ch,6), c10=cslOf(ch,10), s6=sigOf(ch,c6), s10=sigOf(ch,c10);
      var jb=[2,6,10].filter(function(h){return s6[h]>0||s10[h]>0;}).length, bz=[2,7,10].filter(function(h){return s10[h]>0;}).length;
      spec={label:(bz>jb)?'Own BUSINESS suits better':(jb>bz)?'SERVICE (job) suits better':'Both are possible',yes:true,no:false,txt:'6th sub lord '+nm(c6)+' signifies '+houseTxt(s6)+'; 10th sub lord '+nm(c10)+' signifies '+houseTxt(s10)+'. Service: 2-6-10; independent business: 2-7-10.'};
    }
    res.spec=spec;
    /* 3. fulfilment: 11th cusp (Khullar step 4) and ascendant */
    var c11=cslOf(ch,11), s11=sigOf(ch,c11), lk11=G.filter(function(h){return s11[h]>0;});
    steps.push({ok:lk11.length>0||s11[R(11)]>0,t:'Fulfilment: the 11th cusp sub lord <b>'+nm(c11)+'</b> signifies '+houseTxt(s11)+(lk11.length?' and links to '+lk11.join('-')+' of the event.':' and does not link to the event houses.')});
    var ca=cslOf(ch,1), sa=sigOf(ch,ca), lka=G.concat([1,11]).filter(function(h){return sa[h]>0;});
    steps.push({ok:lka.length>0,t:'The ascendant sub lord <b>'+nm(ca)+'</b> signifies '+houseTxt(sa)+(lka.length?' and supports the event ('+lka.join('-')+').':' with no link to the event.')});
    /* Khullar sub-sub promise */
    var sa2=ch.cusp[0].ssl, sk=ch.cusp[K[0]-1].ssl, ga=G.concat(K), hit=function(p){var m=sigOf(ch,p); return ga.filter(function(h){return m[h]>=0.8;});};
    var h1=hit(sa2), h2=hit(sk);
    steps.push({ok:h1.length>0&&h2.length>0,t:'Khullar sub-sub check: the sub-sub lord of the ascendant (<b>'+nm(sa2)+'</b>) '+(h1.length?'signifies '+h1.join('-'):'does not signify the event houses')+' and of the '+ORDH[K[0]-1]+' cusp (<b>'+nm(sk)+'</b>) '+(h2.length?'signifies '+h2.join('-'):'does not')+'.'});
    /* retro rule */
    var cs0=per[0].csl, delay=false;
    if(o.retro){
      if(starRetro(ch,cs0)){steps.push({ok:false,t:'Kaushik rule: the star lord of the cusp sub lord is retrograde, so the matter will not fructify.'}); val-=0.5;}
      else if(ch.pl[cs0].retro&&cs0!=='Ra'&&cs0!=='Ke'){steps.push({ok:null,t:'Kaushik rule: the cusp sub lord '+nm(cs0)+' is retrograde, so the event waits until it turns direct.'}); delay=true;}
    }
    /* delay indicators (Khullar step 4: 4, 7, 8, 12 from the primary cusp) */
    var dl=[], sc0=per[0].sg; [4,7,8,12].forEach(function(d){var h=rotH(K[0]+d-1-0,0); h=((K[0]-1+d-1)%12)+1; if(sc0[h]>0&&G.indexOf(h)<0)dl.push(h);});
    if(dl.length)steps.push({ok:null,t:'Delay indicators: the cusp sub lord also signifies '+dl.join('-')+' (4, 7, 8, 12 from the primary cusp). The event may be late or meet obstacles.'});
    /* ruling planet support */
    var cm=rpl.filter(function(p){var m=sigOf(ch,p); return G.some(function(h){return m[h]>=0.8;});});
    steps.push({ok:cm.length>0,t:'Ruling planets: '+nms(rpl)+'. Those that also signify the event houses: <b>'+(cm.length?nms(cm):'none')+'</b>.'});
    /* score */
    var conf=0; conf+=Math.max(0,Math.min(60,Math.round(val*100))); 
    if(lk11.length||s11[R(11)]>0)conf+=15; if(lka.length)conf+=8; if(cm.length)conf+=8; if(gen)conf+=5; if(h1.length&&h2.length)conf+=4;
    if(delay)conf-=5; conf=Math.max(0,Math.min(100,conf)); res.conf=conf; res.delay=delay; res.dl=dl;
    var allZero=per.every(function(x){return x.got.length===0;}), someZero=per.some(function(x){return x.got.length===0;}), lowGot=per.some(function(x){return x.got.length<x.need;});
    if(allZero)conf=Math.min(conf,24); else if(someZero)conf=Math.min(conf,50); else if(per.some(function(x){return x.got.length<x.need&&x.bad.length>0;}))conf=Math.min(conf,36); else if(lowGot)conf=Math.min(conf,61);
    res.conf=conf; var anyOK=!someZero;
    var ev;
    if(ob.adv){ev=conf>=55?'YES':conf>=38?'LIKELY':'NO';}
    else ev=conf>=62?'YES':conf>=45?'LIKELY':conf>=30?'DOUBTFUL':'NO';
    if(!anyOK&&ev!=='NO')ev=(ev==='YES'?'LIKELY':'DOUBTFUL');
    res.ev=ev; res.hasWhen=(ob.w!==false)&&(ev==='YES'||ev==='LIKELY'||(ev==='DOUBTFUL'&&conf>=35));
    // fruitful significators of the event houses
    var F=[], Fw={};
    PL.forEach(function(p){var m=sigOf(ch,p), w=wmax(m,G), c=G.filter(function(h){return m[h]>=0.8;}).length; if(w>=0.8){F.push(p);Fw[p]=c+w;}});
    K.forEach(function(c){var p=cslOf(ch,c); if(F.indexOf(p)<0&&wmax(sigOf(ch,p),G)>0){F.push(p);Fw[p]=0.5;}});
    F.sort(function(a,b){return Fw[b]-Fw[a];});
    res.F=F; res.C=F.filter(function(p){return rpl.indexOf(p)>=0;});
    var needS=Math.max(1,Math.ceil(G.length/2)); res.Fs=F.filter(function(p){var m=sigOf(ch,p); return G.filter(function(h){return m[h]>=0.8;}).length>=needS;});
    K.forEach(function(c){var p=cslOf(ch,c); if(res.Fs.indexOf(p)<0&&F.indexOf(p)>=0)res.Fs.push(p);});
    res.Cs=res.Fs.filter(function(p){return rpl.indexOf(p)>=0;});
    return res;
  }

  /* ---------- timing ---------- */
  var WH=0; function lordPts(p,C,R,F,Cs){return (Cs&&Cs.indexOf(p)>=0)?3:C.indexOf(p)>=0?2:(R.indexOf(p)>=0||F.indexOf(p)>=0)?1:0;}
  function scanWin(getL,t0,t1,step,test){
    var out=[],cur=null;
    for(var t=t0;t<=t1;t+=step){
      var r=test(getL(t),t);
      if(r){ if(cur&&t-cur.last<=step*1.01){cur.e=t;cur.last=t;if(r.sc>cur.sc){cur.sc=r.sc;cur.info=r.info;cur.at=t;}} else{ if(cur)out.push(cur); cur={s:t,e:t,last:t,sc:r.sc,info:r.info,at:t}; } }
      else if(cur){out.push(cur);cur=null;}
    }
    if(cur)out.push(cur); return out;
  }
  function timing(ch,res,o){
    var oldC=CFG; CFG={lat:ch.lat,lon:ch.lon,kind:ch.kind};
    try{
      var C=res.C, Cs=res.Cs, Fs=res.Fs, R=res.rpl, F=res.F, ms=ch.ms, T={}, hor=(o.years||5)*365.25*86400000;
      var test=function(withSsl){return function(L){
        var l=lordsAt(L), a=lordPts(l.sign,C,R,F,Cs), b=lordPts(l.star,C,R,F,Cs), c=lordPts(l.sub,C,R,F,Cs);
        if(a<1||b<1||a+b<3)return null;
        return {sc:a+b+c,info:l};};};
      var asc=scanWin(function(t){return sidAsc(t,ch.lat,ch.lon,ch.kind);},ms,ms+86400000,60000,test());
      var moon=scanWin(function(t){return sidLon('Mo',t);},ms,ms+31*86400000,600000,test());
      var sun=scanWin(function(t){return sidLon('Su',t);},ms,ms+366*86400000,6*3600000,test());
      var jup=scanWin(function(t){return sidLon('Ju',t);},ms,ms+Math.min(hor,12*365.25*86400000),86400000,test());
      T.asc=asc;T.moon=moon;T.sun=sun;T.jup=jup;
      // dasha (Vimshottari from the Moon at the judgment time; no natal chart needed)
      var d=bpDasha(ch.pl.Mo.lon,ms), periods=[], endH=ms+hor;
      d.list.forEach(function(md){ md.ant.forEach(function(an){
        if(an.e<ms||an.s>endH)return;
        var tier=(Cs.indexOf(md.c)>=0&&Cs.indexOf(an.c)>=0)?'S':(C.indexOf(md.c)>=0&&C.indexOf(an.c)>=0)?'A':(F.indexOf(md.c)>=0&&F.indexOf(an.c)>=0)?'B':'';
        if(!tier)return;
        var prs=[]; an.pr.forEach(function(pr){ if(pr.e<ms||pr.s>endH)return;
          var pt=Cs.indexOf(pr.c)>=0?'S':C.indexOf(pr.c)>=0?'A':(F.indexOf(pr.c)>=0)?'B':''; if(pt)prs.push({c:pr.c,s:Math.max(pr.s,ms),e:pr.e,t:pt});});
        periods.push({md:md.c,ad:an.c,s:Math.max(an.s,ms),e:an.e,tier:tier,prs:prs});
      });});
      T.periods=periods; T.dasha=d; 
      var cur=null; d.list.forEach(function(md){md.ant.forEach(function(an){an.pr.forEach(function(pr){if(pr.s<=ms&&ms<pr.e)cur={md:md.c,ad:an.c,pd:pr.c,s:pr.s,e:pr.e};});});}); T.cur=cur;
      // the best (earliest) period and a chain of transits inside it
      var best=null; ['S','A','B'].some(function(t){var f=periods.filter(function(p){return p.tier===t;}); if(f.length){best=f[0];return true;}return false;});
      T.best=best; T.nowOK=cur?{md:Cs.indexOf(cur.md)>=0||C.indexOf(cur.md)>=0,ad:Cs.indexOf(cur.ad)>=0||C.indexOf(cur.ad)>=0,pd:Cs.indexOf(cur.pd)>=0||C.indexOf(cur.pd)>=0}:null;
      if(best){
        var w0=best.s, w1=Math.min(best.e,endH), pdBest=best.prs.filter(function(p){return p.t==='S';})[0]||best.prs.filter(function(p){return p.t==='A';})[0]||best.prs[0]||null;
        T.pd=pdBest; if(pdBest){w0=Math.max(w0,pdBest.s); w1=Math.min(w1,pdBest.e);}
        var sw=sun.filter(function(w){return w.e>=w0&&w.s<=w1;}); T.sunIn=sw;
        var chain={win:[w0,w1]};
        if(sw.length){
          var s1=sw[0], a0=Math.max(s1.s,w0), a1=Math.min(s1.e+6*3600000,w1);
          chain.sun=[a0,a1];
          var mw=scanWin(function(t){return sidLon('Mo',t);},a0,Math.min(a1+86400000,a0+35*86400000),600000,test());
          mw=mw.filter(function(w){return w.sc>=4||mw.length<4;});
          chain.moon=mw.slice(0,4);
          if(mw.length){
            var day0=mw[0].s-6*3600000, ascW=scanWin(function(t){return sidAsc(t,ch.lat,ch.lon,ch.kind);},mw[0].s-3*3600000,mw[0].e+3*3600000,60000,test());
            chain.asc=ascW.slice(0,3); chain.ascDay=mw[0];
          }
        }else{
          var mw2=scanWin(function(t){return sidLon('Mo',t);},w0,Math.min(w1,w0+35*86400000),600000,test());
          chain.moon=mw2.slice(0,4);
          if(mw2.length){var aw=scanWin(function(t){return sidAsc(t,ch.lat,ch.lon,ch.kind);},mw2[0].s-3*3600000,mw2[0].e+3*3600000,60000,test()); chain.asc=aw.slice(0,3);}
        }
        T.chain=chain;
      }
      return T;
    }finally{CFG=oldC;}
  }

  /* ---------- rendering ---------- */
  var HQ_TZ=0;
  function dt(ms){var d=new Date(ms+HQ_TZ*3600000); return d.getUTCDate()+' '+MON[d.getUTCMonth()]+' '+d.getUTCFullYear();}
  function tm(ms){var d=new Date(ms+HQ_TZ*3600000); return p2(d.getUTCHours())+':'+p2(d.getUTCMinutes());}
  function dtm(ms){return dt(ms)+', '+tm(ms);}
  function rng(a,b){ if(b-a<86400000*0.8&&(new Date(a+HQ_TZ*3600000).getUTCDate()===new Date(b+HQ_TZ*3600000).getUTCDate()))return dt(a)+', '+tm(a)+' – '+tm(b); if(b-a<4*86400000)return dtm(a)+' – '+dtm(b); return dt(a)+' – '+dt(b); }
  function wlist(ws,n,fmt){ if(!ws.length)return '<li class="hqn">None found in this span.</li>'; var strong=ws.filter(function(w){return w.sc>=4;}), use=strong.length>=2?strong:ws; return use.slice(0,n).map(function(w){return '<li>'+fmt(w)+(w.sc>=4?' <b class="hqstar">★</b>':'')+'</li>';}).join(''); }
  function lordTxt(l){return nm(l.sign)+' / '+nm(l.star)+' / '+nm(l.sub);}
  function yrs(ms,e){return Math.round((e-ms)/86400000/365.25*10)/10;}
  function render(res,ch,T,o){
    HQ_TZ=o.tz; var q=res.q, cls=res.ev==='YES'?'yes':res.ev==='LIKELY'?'lk':res.ev==='DOUBTFUL'?'db':'no', adv=q.o.adv, spec=res.spec, h='';
    var vt;
    if(spec)vt=spec.label;
    else if(adv)vt=res.ev==='YES'?'YES – this is indicated':res.ev==='LIKELY'?'LIKELY – this is indicated':res.ev==='DOUBTFUL'?'NOT CLEAR':'NO – this is not indicated';
    else vt=res.ev==='YES'?'YES – the event is promised':res.ev==='LIKELY'?'LIKELY YES – promised, with conditions':res.ev==='DOUBTFUL'?'DOUBTFUL – weak promise':'NO – the event is not promised';
    var vcls=spec?(spec.yes?'yes':spec.no?'no':'db'):cls;
    h+='<div class="hqv '+vcls+'"><div class="hqvq">'+esc(q.en)+'<span class="ta">'+q.ta+'</span></div><div class="hqvt">'+esc(vt)+'</div>'+(spec?'<div class="hqvs">'+esc(spec.txt)+'</div>':'')+
      '<div class="hqvm"><span>Strength <b>'+res.conf+'%</b></span><span>Chart: <b>'+(ch.num?'Horary No. '+ch.num:'Time of judgment')+'</b></span><span>Asked: <b>'+dtm(ch.ms)+'</b></span></div></div>';
    h+='<h3 class="eph3">Why — step by step<span class="ta">ஏன் — படிப்படியாக</span></h3><ul class="hqst">'+res.steps.map(function(s){return '<li class="'+(s.ok===true?'g':s.ok===false?'r':'m')+'">'+s.t+'</li>';}).join('')+'</ul>';
    if(q.o.note)h+='<p class="legend hqnote"><b>Rule from the books:</b> '+esc(q.o.note)+'</p>';
    if(res.hasWhen&&T){
      h+='<h3 class="eph3">When will it happen?<span class="ta">எப்போது நடக்கும்?</span></h3>';
      h+='<div class="hqt">';
      h+='<p><b>Fruitful significators</b> of the event houses ('+res.G.join('-')+'): '+(res.F.length?nms(res.F):'none')+'. <b>Common with the ruling planets</b> (the planets that will deliver it): <b>'+(res.C.length?nms(res.C):'none')+'</b>.</p>';
      if(T.cur)h+='<p>Running period at the time of question (from the Moon, no birth chart needed): <b>'+nm(T.cur.md)+' – '+nm(T.cur.ad)+' – '+nm(T.cur.pd)+'</b> until '+dt(T.cur.e)+'. '+(T.nowOK&&T.nowOK.md&&T.nowOK.ad?'<b class="hqgood">The present dasa and bhukti support the event, so it can happen now or soon.</b>':'<b class="hqwait">The present dasa and bhukti do not both support the event, so it will not happen in this running period.</b>')+'</p>';
      if(T.best){
        var b=T.best, tl=b.tier==='S'?'both lords signify most of the event houses and are ruling planets (strongest)':b.tier==='A'?'both lords are among the common planets (ruling planets that signify the event)':'both lords signify the event, but are not confirmed by the ruling planets (approximate)';
        h+='<div class="hqbest"><div class="hqbl">Most probable period (joint period)</div><div class="hqbd">'+nm(b.md)+' dasa – '+nm(b.ad)+' bhukti</div><div class="hqbr">'+dt(b.s)+' to '+dt(b.e)+'</div><div class="hqbn">'+tl+'.</div>';
        if(T.pd)h+='<div class="hqbn">Antara (pratyantar) inside it: <b>'+nm(T.pd.c)+'</b>, '+dt(T.pd.s)+' to '+dt(T.pd.e)+'.</div>';
        if(T.chain&&T.chain.sun)h+='<div class="hqbn">Sun transit confirms: '+rng(T.chain.sun[0],T.chain.sun[1])+'.</div>';
        if(T.chain&&T.chain.moon&&T.chain.moon.length)h+='<div class="hqbn">Moon transit (likely days): '+T.chain.moon.slice(0,3).map(function(w){return rng(w.s,w.e);}).join(' · ')+'.</div>';
        if(T.chain&&T.chain.asc&&T.chain.asc.length)h+='<div class="hqbn">Lagna transit (likely hours): '+T.chain.asc.slice(0,3).map(function(w){return rng(w.s,w.e);}).join(' · ')+'.</div>';
        h+='</div>';
        var others=T.periods.filter(function(p){return p!==b&&p.tier===b.tier;}).slice(0,3);
        if(others.length)h+='<p class="legend">Other periods of the same strength: '+others.map(function(p){return nm(p.md)+'–'+nm(p.ad)+' ('+dt(p.s)+' to '+dt(p.e)+')';}).join('; ')+'.</p>';
      }else h+='<div class="hqbest"><div class="hqbn">No dasa–bhukti in the next '+o.years+' years has both lords linked to the event. The event is not likely to be completed in this span; try a longer look-ahead or ask again later.</div></div>';
      h+='<details class="epdet" open><summary>Quick timing by transit of the ruling planets (Kaushik, Bosmia, Khullar)</summary><div class="hqq">'+
        '<div class="hqqh">Within 24 hours (Lagna transit)</div><ul>'+wlist(T.asc,4,function(w){return rng(w.s,w.e)+' · lagna '+lordTxt(w.info);})+'</ul>'+
        '<div class="hqqh">Within a month (Moon transit)</div><ul>'+wlist(T.moon,5,function(w){return rng(w.s,w.e)+' · Moon '+lordTxt(w.info);})+'</ul>'+
        '<div class="hqqh">Within a year (Sun transit)</div><ul>'+wlist(T.sun,4,function(w){return rng(w.s,w.e)+' · Sun '+lordTxt(w.info);})+'</ul>'+
        '<div class="hqqh">Beyond a year (Jupiter transit)</div><ul>'+wlist(T.jup,4,function(w){return rng(w.s,w.e)+' · Jupiter '+lordTxt(w.info);})+'</ul>'+
        '<p class="legend">★ = the sub lord of the transiting body also belongs to the ruling / fruitful planets (strongest). Sign lord / star lord / sub lord are shown.</p></div></details>';
      h+='</div>';
    }else if(!res.hasWhen&&!spec){
      h+='<p class="legend hqnote">Because the answer is not a clear yes, no time of event is given. If you ask again later with a fresh horary number, the answer may change.</p>';
    }
    // tables
    var ct='<table class="eptb hqtb"><thead><tr><th>Cusp</th><th>Degree</th><th>Sign</th><th>Star</th><th>Sub</th><th>Sub-sub</th></tr></thead><tbody>'+ch.cusp.map(function(c,i){return '<tr><td>'+(i+1)+'</td><td>'+Math.floor(c.lon%30)+'°'+p2(Math.floor((c.lon%1)*60))+'′</td><td>'+SIGNS[Math.floor(c.lon/30)][0]+' ('+nm(c.sign)+')</td><td>'+nm(c.star)+'</td><td><b>'+nm(c.sub)+'</b></td><td>'+nm(c.ssl)+'</td></tr>';}).join('')+'</tbody></table>';
    var pt='<table class="eptb hqtb"><thead><tr><th>Planet</th><th>Degree</th><th>Sign</th><th>Star</th><th>Sub</th><th>House</th><th>Signifies</th></tr></thead><tbody>'+PL.map(function(p){var x=ch.pl[p]; return '<tr><td>'+nm(p)+(x.retro?' (R)':'')+'</td><td>'+Math.floor(x.lon%30)+'°'+p2(Math.floor((x.lon%1)*60))+'′</td><td>'+SIGNS[x.sg][0]+'</td><td>'+nm(x.star)+'</td><td>'+nm(x.sub)+'</td><td>'+x.house+'</td><td>'+houseTxt(sigOf(ch,p))+'</td></tr>';}).join('')+'</tbody></table>';
    var rt='<ul class="hqrp">'+res.rp.list.map(function(p){return '<li><b>'+nm(p)+'</b> – '+res.rp.tag[p].join(', ')+'</li>';}).join('')+'</ul>';
    h+='<details class="epdet"><summary>Horary chart: cusps, planets, ruling planets</summary><div class="epch">Cusps (Placidus, KP ayanamsa)</div>'+ct+'<div class="epch">Planets</div>'+pt+'<div class="epch">Ruling planets at the moment of judgment'+(res.rpl.length!==res.rp.list.length?' (after the retrograde rule: '+nms(res.rpl)+')':'')+'</div>'+rt+'</details>';
    h+='<p class="legend epnote">Horary results are based on traditional KP rules and probability. They are not a guarantee and not advice on betting, investment or any decision; the author and app creator accept no liability. The horary chart is not a substitute for a natal chart.</p>';
    return h;
  }

  /* ---------- UI ---------- */
  var HQ_LIST=[];
  function hqFill(){
    var q=$('hqSearch').value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''), cn=$('hqCountry').value, sel=$('hqCity'), list, tag=false;
    if(cn==='*a'){list=q?WC.filter(function(x){return plKey(x).indexOf(q)>=0;}).slice(0,400):[];tag=true;}
    else list=WC.filter(function(x){return x.cc===cn&&(!q||plKey(x).indexOf(q)>=0);}).slice(0,600);
    if(!list.length)list=webC(q,hqFill);
    HQ_LIST=list;
    sel.innerHTML=list.length?list.map(function(x,i){return '<option value="'+i+'">'+x.n+(x.st?', '+x.st:'')+(tag?', '+x.cc:'')+'</option>';}).join(''):'<option value="">No match in the offline list</option>';
    hqPick();
  }
  function hqPick(){var x=HQ_LIST[parseInt($('hqCity').value,10)]; if(x){$('hqLat').value=x.lat;$('hqLon').value=x.lon;$('hqTz').value=x.tz;} hqOff();}
  function hqOff(){
    var el=$('hqOff'), t=$('hqTz').value.trim(); el.className='msg'; if(!t){el.textContent='';return;}
    try{el.textContent='Time zone now: '+utcTxt(tzFn(t)(Date.now()))+(/^-?[\d.]+$/.test(t)?'':' ('+t+')');}
    catch(e){el.textContent='The time zone was not recognised. Use a name such as Asia/Kolkata or hours such as 5.5.';el.className='msg err';}
  }
  function hqQsel(){
    var h='', last=-1;
    Q.forEach(function(q){ if(q[0]!==last){ if(last>=0)h+='</optgroup>'; h+='<optgroup label="'+CATS[q[0]]+'">'; last=q[0]; }
      h+='<option value="'+q[1]+'">'+q[2]+' · '+q[3]+'</option>'; });
    h+='</optgroup>'; $('hqQ').innerHTML=h; hqQinfo();
  }
  function hqQinfo(){
    var q=QB[$('hqQ').value]; if(!q)return;
    $('hqInfo').innerHTML='<b>'+esc(q.en)+'</b><span class="ta">'+q.ta+'</span><div class="hqig">Cusp judged: <b>'+q.k.join(', ')+'</b> · Houses of the event: <b>'+q.g.join('-')+'</b>'+(q.o.adv?' · adverse event (YES means it is indicated)':'')+'</div>'+(q.o.note?'<div class="hqin">'+esc(q.o.note)+'</div>':'');
  }
  function hqMode(){
    var num=$('hqMode').value==='num'; $('hqNumRow').style.display=num?'':'none'; $('hqNum').disabled=!num;
    var cu=$('hqWhen').value==='custom'; $('hqDRow').style.display=cu?'':'none'; $('hqTRow').style.display=cu?'':'none';
  }
  function hqGo(){
    var msg=$('hqMsg'); msg.className='msg';
    var lat=parseFloat($('hqLat').value), lon=parseFloat($('hqLon').value), tzs=$('hqTz').value.trim();
    if(isNaN(lat)||isNaN(lon)||!tzs){msg.textContent='Choose the place (or enter latitude, longitude and time zone).';msg.className='msg err';return;}
    if(Math.abs(lat)>62){msg.textContent='Latitude must be between -62 and 62.';msg.className='msg err';return;}
    if(typeof Astronomy==='undefined'){msg.textContent='Planet positions need the astronomy library, which did not load.';msg.className='msg err';return;}
    var num=0; if($('hqMode').value==='num'){num=parseInt($('hqNum').value,10); if(!(num>=1&&num<=249)){msg.textContent='Enter a horary number between 1 and 249.';msg.className='msg err';return;}}
    var tzf; try{tzf=tzFn(tzs);}catch(e){msg.textContent='The time zone was not recognised.';msg.className='msg err';return;}
    var ms=Date.now();
    if($('hqWhen').value==='custom'){
      var d=$('hqD').value.split('-').map(Number), t=($('hqT').value||'00:00').split(':').map(Number);
      if(d.length<3||isNaN(d[0])){msg.textContent='Choose the date of the question.';msg.className='msg err';return;}
      ms=localToUtc(d[0],d[1],d[2],t[0],t[1]||0,tzs).ms;
    }
    var qd=QB[$('hqQ').value], kind=$('ayan').value, tz=tzf(ms), rot=parseInt($('hqAbout').value,10)||0;
    var btn=$('hqGo'); btn.disabled=true; msg.textContent='Casting the chart and reading the cusps…';
    setTimeout(function(){
      try{
        var ch=buildChart({ms:ms,lat:lat,lon:lon,kind:kind,num:num});
        var day=dayLord(ms,lat,lon,tzs), o={rot:rot,day:day,retro:$('hqRetro').checked,years:parseInt($('hqYears').value,10)||5,tz:tz};
        var res=analyse(qd,ch,o), T=null;
        if(res.hasWhen){msg.textContent='Finding the time of the event…'; T=timing(ch,res,o);}
        $('hqOut').innerHTML=render(res,ch,T,o); msg.textContent='';
        $('hqOut').scrollIntoView({block:'start',behavior:'smooth'});
        window.__hq={res:res,ch:ch,T:T}; try{ if(window.GA_PRASNA)$('hqOut').insertAdjacentHTML('beforeend',window.GA_PRASNA.render(qd,ch,ms,lat,lon,tzs,kind)); }catch(e2){ if(window.console)console.error('Prasna',e2); }
      }catch(err){msg.textContent='Could not finish: '+err.message;msg.className='msg err'; if(window.console)console.error(err);}
      btn.disabled=false;
    },30);
  }
  function init(){
    var bt=$('hqBtn'); if(!bt)return;
    var cs=$('hqCountry'); cs.innerHTML='<option value="*a">All countries (use search)</option>'+CITY.cc.map(function(n){return '<option value="'+n.replace(/"/g,'&quot;')+'">'+n+'</option>';}).join('');
    cs.addEventListener('change',hqFill); $('hqSearch').addEventListener('input',hqFill); $('hqCity').addEventListener('change',hqPick); $('hqTz').addEventListener('input',hqOff);
    hqFill(); hqQsel(); hqMode();
    $('hqQ').addEventListener('change',hqQinfo); $('hqMode').addEventListener('change',hqMode); $('hqWhen').addEventListener('change',hqMode);
    $('hqGo').addEventListener('click',hqGo);
    $('hqClose').addEventListener('click',function(){$('hqPanel').classList.add('hide');});
    bt.addEventListener('click',function(){
      var pn2=$('hqPanel'); pn2.classList.remove('hide');
      if(!$('hqLat').value){$('hqLat').value=$('lat').value;$('hqLon').value=$('lon').value;$('hqTz').value=$('tz').value;hqOff();}
      pn2.scrollIntoView({block:'start'});
    });
    $('hqLoc').addEventListener('click',function(){
      var el=$('hqOff'); if(!navigator.geolocation){el.textContent='Location is not available here. Choose a city or enter latitude and longitude.';el.className='msg err';return;}
      el.textContent='Finding your location…'; el.className='msg';
      navigator.geolocation.getCurrentPosition(function(pos){$('hqLat').value=pos.coords.latitude.toFixed(4);$('hqLon').value=pos.coords.longitude.toFixed(4);
        try{$('hqTz').value=Intl.DateTimeFormat().resolvedOptions().timeZone||$('hqTz').value;}catch(e){} hqOff();},
        function(){el.textContent='Could not get your location. Choose a city instead.';el.className='msg err';},{timeout:10000});
    });
  }
  window.__hqApi={build:buildChart,analyse:analyse,timing:timing,QB:QB,Q:Q,sig:sigOf,sub:hqSub,day:dayLord};
  setTimeout(function(){try{init();}catch(e){ if(window.console)console.error('HQ init',e); }},0);
})();

/* ---------- v5.5 disclaimer shown whenever a tool icon is opened ---------- */
(function(){
  var pend=null, bypass=false;
  function box(){return document.getElementById('gaDisc');}
  document.addEventListener('click',function(e){
    var t=e.target.closest&&e.target.closest('.tool'); if(!t||bypass)return;
    e.preventDefault(); e.stopImmediatePropagation(); pend=t;
    var b=box(); if(!b)return; b.classList.remove('hide'); var ok=document.getElementById('gaDiscOk'); if(ok)ok.focus();
  },true);
  document.addEventListener('click',function(e){
    if(!(e.target.closest&&e.target.closest('#gaDiscOk')))return;
    var b=box(); if(b)b.classList.add('hide');
    var t=pend; pend=null;
    if(t){ bypass=true; try{t.click();}finally{bypass=false;} }
  });
})();

/* ---------- Muhurtham alarm (v3.1) ---------- */
var ALM={ctx:null,last:-2,cache:{},stopAt:0};
function almGet(k,d){try{const v=localStorage.getItem(k);return v===null?d:v;}catch(e){return d;}}
function almSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function almCtx(){
  if(!ALM.ctx){const C=window.AudioContext||window.webkitAudioContext; if(!C)return null; ALM.ctx=new C();}
  if(ALM.ctx.state==='suspended')ALM.ctx.resume();
  return ALM.ctx;
}
function almTone(c,t,type,f,dur,vol){
  const o=c.createOscillator(), g=c.createGain();
  o.type=type; o.frequency.value=f;
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+0.02);
  g.gain.setValueAtTime(vol,t+dur-0.03); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g); g.connect(c.destination); o.start(t); o.stop(t+dur+0.02);
}
function almPlay(kind){
  const c=almCtx(); if(!c)return; if(kind==0){GA_MELODY.play(c,c.currentTime+0.05);try{if(navigator.vibrate)navigator.vibrate([350,3950,350,3950,350]);}catch(e){}return;} const t0=c.currentTime+0.05, R=4;   // each alarm sounds 4 times
  for(let i=0;i<R;i++){
    const t=t0+i*1.5;
    if(kind==0) almTone(c,t,'sine',880,0.5,0.5);
    else if(kind==1){almTone(c,t,'sine',1000,0.2,0.5);almTone(c,t+0.3,'sine',1000,0.2,0.5);}
    else if(kind==2) almTone(c,t,'sawtooth',140,0.9,0.35);
    else {almTone(c,t,'square',700,0.35,0.25);almTone(c,t+0.35,'square',1000,0.35,0.25);almTone(c,t+0.7,'square',700,0.35,0.25);}
  }
  try{if(navigator.vibrate)navigator.vibrate([400,200,400,200,400]);}catch(e){}
}
function almWhy(idx){
  if(ALM.cache[idx]!==undefined)return ALM.cache[idx];
  let why='';
  try{
    const a=evalRules(ROWS[idx]), g=SEGS[ROWS[idx].k];
    if(a.ok){
      const xt=extraTags(idx);
      if(a.aus)why='Auspicious financial gain';
      else if(a.fin)why='Financial gain';
      else if(xt.high)why='Highly auspicious';
      else if(isGmp(g)&&xt.dhana)why='Dhana muhurtham (GMP 3,11)';
    }
  }catch(e){}
  ALM.cache[idx]=why; return why;
}
function alarmCheck(cur){
  if(!$('almOn')||!$('almOn').checked){ALM.last=cur;return;}
  if(cur===ALM.last)return;
  ALM.last=cur;
  if(cur<0){$('almBanner').classList.add('hide');return;}
  const why=almWhy(cur);
  if(!why){$('almBanner').classList.add('hide');return;}
  const r=ROWS[cur], g=SEGS[r.k];
  $('almMsg').textContent='🔔 '+why+' muhurtham now · '+NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub]+' · until '+clock(r.end);
  $('almBanner').classList.remove('hide');
  almPlay(+$('almSound').value);
}
$('almOn').checked=almGet('gaAlmOn','0')==='1';
$('almSound').value=almGet('gaAlmSnd','0');
$('almOpts').classList.toggle('hide',!$('almOn').checked);
$('almOn').addEventListener('change',()=>{
  almSet('gaAlmOn',$('almOn').checked?'1':'0');
  $('almOpts').classList.toggle('hide',!$('almOn').checked);
  if(!$('almOn').checked){$('almBanner').classList.add('hide');if(ALM.ctx)try{ALM.ctx.close();}catch(e){} ALM.ctx=null;}
  else{almCtx(); ALM.last=-2; tick();}    // rings at once if a good timing is running now
});
$('almSound').addEventListener('change',()=>{almSet('gaAlmSnd',$('almSound').value);almPlay(+$('almSound').value);});
$('almTest').addEventListener('click',()=>almPlay(+$('almSound').value));
$('almStop').addEventListener('click',()=>{
  $('almBanner').classList.add('hide');
  if(ALM.ctx){try{ALM.ctx.close();}catch(e){} ALM.ctx=null;}
});


/* ---------- Muhurtham alarms to the phone Calendar: iPhone and Android (v4.10) ---------- */
window.GA_CAL=function(text,name,title){
  // returns a Promise of 'native' | 'shared' | 'cancelled' | 'downloaded'
  const ua=navigator.userAgent||'', android=/Android/i.test(ua), ios=/iPhone|iPad|iPod/i.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1);
  const G=window.GuruApp;
  if(G){
    try{
      if(G.addToCalendar){G.addToCalendar(text,name);return Promise.resolve('native');}
      if(G.openIcs){G.openIcs(text,name);return Promise.resolve('native');}
      if(G.shareFile){G.shareFile(name,'text/calendar',text);return Promise.resolve('native');}
    }catch(e){}
  }
  const download=()=>{
    const blob=new Blob([text],{type:'text/calendar;charset=utf-8'}), url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url; a.download=name; a.rel='noopener';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    return 'downloaded';
  };
  if(android&&!ios){
    // Android: the share sheet lets you choose the Calendar app directly
    try{
      const f=new File([text],name,{type:'text/calendar'});
      if(navigator.canShare&&navigator.canShare({files:[f]})){
        return navigator.share({files:[f],title:title||'Muhurtham alarm'}).then(()=>'shared',e=>(e&&e.name==='AbortError')?'cancelled':download());
      }
    }catch(e){}
  }
  return Promise.resolve(download());
};
window.GA_CAL_MSG=function(how,n){
  const ua=navigator.userAgent||'', android=/Android/i.test(ua), ios=/iPhone|iPad|iPod/i.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1);
  const what=n>1?n+' muhurtham alarms':'Muhurtham alarm';
  if(how==='cancelled')return 'Not added. Tap Add again when you are ready.';
  if(how==='native')return what+' sent to your Calendar.';
  if(how==='shared')return what+' ready. In your Calendar app tap Save'+(n>1?' or Import':'')+'.';
  if(ios)return what+' ready. The Calendar opens: tap '+(n>1?'Add All':'Add')+'. If it does not open, open the downloaded file.';
  if(android)return what+' downloaded. Open it from the notification or the Files app, choose your Calendar app and tap Save or Import.';
  return what+' downloaded. Open the file to add it to your calendar (Apple Calendar, Outlook, or import into Google Calendar).';
};

const ALM_TA={'Auspicious financial gain':'சுப பண லாபம்','Financial gain':'பண லாபம்','Highly auspicious':'மிகச் சிறந்த சுப முகூர்த்தம்','Dhana muhurtham (GMP 3,11)':'தன முகூர்த்தம் (GMP 3,11)'};
function icsEsc(t){return String(t).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');}
function icsFold(line){
  const enc=new TextEncoder(), out=[]; let cur='', bytes=0;
  for(const ch of line){
    const b=enc.encode(ch).length;
    if(bytes+b>74){out.push(cur);cur=' '+ch;bytes=1+b;} else {cur+=ch;bytes+=b;}
  }
  out.push(cur); return out.join('\r\n');
}
function icsStamp(ms){
  const d=new Date(ms);
  return d.getUTCFullYear()+p2(d.getUTCMonth()+1)+p2(d.getUTCDate())+'T'+p2(d.getUTCHours())+p2(d.getUTCMinutes())+p2(d.getUTCSeconds())+'Z';
}
function icsItems(){
  const now=Date.now(), items=[];
  ROWS.forEach((r,idx)=>{
    if(r.end<=now)return;
    const why=almWhy(idx); if(!why)return;
    items.push({r:r,idx:idx,why:why});
  });
  return items;
}
function icsTitle(why){return /uhurtham/.test(why)?why:why+' muhurtham';}
function icsBuild(lead,items){
  const stamp=icsStamp(Date.now()), L=[];
  if(!items.length)return {text:'',count:0};
  L.push('BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//GuruAgasthiya//Muhurtham Alarms//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH');
  items.forEach(it=>{
    const r=it.r, g=SEGS[r.k], why=it.why, nm=NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub];
    const title=icsTitle(why);
    const desc=title+'\n'+nm+'\n'+(ALM_TA[why]||'')+'\n'+SIGNS[g.sign][0]+' ascendant ('+TLAG[g.sign]+' லக்னம்)\n'+clock(r.start)+' to '+clock(r.end)+' (UTC '+(TZ>=0?'+':'')+TZ+')\nLat '+CFG.lat+', Lon '+CFG.lon+'\nGuruAgasthiya';
    L.push('BEGIN:VEVENT','UID:ga-'+Math.round(r.start)+'-'+it.idx+'@guruagasthiya','DTSTAMP:'+stamp,'DTSTART:'+icsStamp(r.start),'DTEND:'+icsStamp(r.end),
      'SUMMARY:'+icsEsc('\uD83D\uDD14 '+title+' · '+nm),'DESCRIPTION:'+icsEsc(desc),'TRANSP:TRANSPARENT');
    if(lead>0) L.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+icsEsc(title+' starts in '+lead+' min · '+nm),'TRIGGER:-PT'+lead+'M','END:VALARM');
    L.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+icsEsc(title+' now · '+nm),'TRIGGER:PT0S','END:VALARM','END:VEVENT');
  });
  L.push('END:VCALENDAR');
  return {text:L.map(icsFold).join('\r\n')+'\r\n',count:items.length};
}
function almCalMsg(t,bad){const m=$('almCalMsg');m.textContent=t;m.className='msg'+(bad?' err':'');}
$('almLead').value=almGet('gaAlmLead','0');
$('almLead').addEventListener('change',()=>almSet('gaAlmLead',$('almLead').value));
let PICK=[];
function pickCount(){
  const n=document.querySelectorAll('#almPickList input:checked').length;
  $('almCount').textContent=n+' of '+PICK.length+' selected';
  $('almAdd').textContent=n?'Add Selected ('+n+')':'Add Selected';
  $('almAdd').disabled=!n;
  $('almAll').checked=n===PICK.length&&n>0;
}
$('almIcs').addEventListener('click',()=>{
  almCalMsg('');
  if(!ROWS.length){almCalMsg('Tap Show Timings first, then add the alarms.',true);return;}
  try{PICK=icsItems();}catch(e){almCalMsg('Could not prepare the alarms: '+e.message,true);return;}
  if(!PICK.length){$('almPick').classList.add('hide');almCalMsg('No financial gain, auspicious or highly auspicious muhurtham is left on this day.',true);return;}
  const ul=$('almPickList'); ul.innerHTML='';
  PICK.forEach((it,k)=>{
    const g=SEGS[it.r.k], li=document.createElement('li');
    const lb=document.createElement('label'), cb=document.createElement('input');
    cb.type='checkbox'; cb.dataset.k=k; cb.addEventListener('change',pickCount);
    const tx=document.createElement('span'); tx.style.flex='1';
    const t1=document.createElement('span'); t1.className='pt'; t1.textContent=icsTitle(it.why);
    const t2=document.createElement('span'); t2.className='ps'; t2.textContent=clock(it.r.start)+' to '+clock(it.r.end)+' · '+NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub]+' · '+SIGNS[g.sign][0]+' ascendant';
    const t3=document.createElement('span'); t3.className='pa'; t3.textContent=(ALM_TA[it.why]||'')+' · '+tl(g);
    tx.appendChild(t1); tx.appendChild(t2); tx.appendChild(t3);
    lb.appendChild(cb); lb.appendChild(tx); li.appendChild(lb); ul.appendChild(li);
  });
  $('almPick').classList.remove('hide'); pickCount();
});
$('almAll').addEventListener('change',()=>{
  const on=$('almAll').checked;
  document.querySelectorAll('#almPickList input').forEach(c=>{c.checked=on;}); pickCount();
});
$('almCancel').addEventListener('click',()=>{$('almPick').classList.add('hide');almCalMsg('');});
$('almAdd').addEventListener('click',()=>{
  const chosen=[...document.querySelectorAll('#almPickList input:checked')].map(c=>PICK[+c.dataset.k]);
  if(!chosen.length){almCalMsg('Tick at least one muhurtham.',true);return;}
  if(window.GA_ALARM&&GA_ALARM.kind()){
    const lead=+$('almLead').value||0, now=Date.now(); let ok=0, bad=0, jobs=[];
    chosen.forEach(it=>{
      const g=SEGS[it.r.k], nm=NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub], title=icsTitle(it.why), id='ga-b'+Math.round(it.r.start/1000)+'-'+it.idx;
      if(it.r.start<=now+3000){bad++;return;}
      jobs.push(GA_ALARM.set(id,it.r.start,'\uD83D\uDD14 '+title,SIGNS[g.sign][0]+' ascendant\n'+clock(it.r.start)+' to '+clock(it.r.end)+'\n'+nm,title+'. '+SIGNS[g.sign][0]+' ascendant. Starts now.').then(r=>{if(r)ok++;else bad++;}));
      if(lead>0&&it.r.start-lead*60000>now+3000)jobs.push(GA_ALARM.set(id+'p',it.r.start-lead*60000,'\u23F0 In '+lead+' min \u00B7 '+title,nm,title+'. Starts in '+lead+' minutes.'));
    });
    $('almPick').classList.add('hide');
    Promise.all(jobs).then(()=>almCalMsg(ok?ok+' alarm'+(ok>1?'s':'')+' set. They ring with a melody 2 times, fade out by themselves, and show the ascendant and purpose'+(GA_ALARM.kind()==='web'?' while this page is open.':', even when the app is closed.')+(bad?' '+bad+' could not be set (already started or refused).':''):'No alarm could be set. Please allow notifications and alarms for GuruAgasthiya.',!ok));
    return;
  }
  let res;
  try{res=icsBuild(+$('almLead').value||0,chosen);}catch(e){almCalMsg('Could not prepare the alarms: '+e.message,true);return;}
  $('almPick').classList.add('hide');
  window.GA_CAL(res.text,'GuruAgasthiya-Muhurtham-'+$('date').value+'.ics','Muhurtham alarms '+$('date').value)
    .then(how=>almCalMsg(window.GA_CAL_MSG(how,res.count),how==='cancelled'));
});


/* ---------- v6.0: coloured South Indian / North Indian chart engine + language helpers ---------- */
const CH60=(function(){
  const PC={F:'#00A878',Su:'#FF8A00',Mo:'#2F9BE0',Ma:'#E53935',Me:'#22A559',Ju:'#D99A00',Ve:'#DD3F8B',Sa:'#5B5BD6',Ra:'#8E44AD',Ke:'#8D6E63',L:'#FF5A1F',C:'#0B8FA6'};
  const EL=['#FF6B4A','#4FB35A','#F2B632','#3F9BFF'];             // fire, earth, air, water
  const ELD=['#C2402A','#2E7D39','#9A7000','#1C64C2'];            // darker tone for the sign names
  const GLY=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'].map(g=>g+'︎');
  const NORTH={1:[[200,0],[300,100],[200,200],[100,100]],4:[[0,200],[100,100],[200,200],[100,300]],7:[[200,400],[100,300],[200,200],[300,300]],10:[[400,200],[300,300],[200,200],[300,100]],
    2:[[0,0],[200,0],[100,100]],3:[[0,0],[100,100],[0,200]],5:[[0,200],[100,300],[0,400]],6:[[0,400],[100,300],[200,400]],8:[[200,400],[300,300],[400,400]],9:[[400,400],[300,300],[400,200]],11:[[400,200],[300,100],[400,0]],12:[[400,0],[300,100],[200,0]]};
  let uid=0, STYLE='south', LANG='bi';
  const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const ls={get:k=>{try{return localStorage.getItem(k);}catch(e){return null;}},set:(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}}};
  STYLE=ls.get('ga_chstyle')||'south'; if(['south','north','both','west','all'].indexOf(STYLE)<0)STYLE='south';
  LANG=ls.get('ga_lang')||'bi';
  let THEME=ls.get('ga_chtheme')||'pro'; if(['pro','classic','colour'].indexOf(THEME)<0)THEME='pro';

  function defs(id){
    let s='<defs>';
    for(let k=0;k<4;k++)s+='<linearGradient id="'+id+'e'+k+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+EL[k]+'" stop-opacity=".34"/><stop offset="1" stop-color="'+EL[k]+'" stop-opacity=".07"/></linearGradient>';
    s+='<linearGradient id="'+id+'a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFB347" stop-opacity=".75"/><stop offset="1" stop-color="#FF5A1F" stop-opacity=".22"/></linearGradient>'
     +'<linearGradient id="'+id+'b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFB300"/><stop offset=".5" stop-color="#FF5A1F"/><stop offset="1" stop-color="#8E44AD"/></linearGradient>'
     +'<linearGradient id="'+id+'f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8E44AD" stop-opacity=".10"/><stop offset="1" stop-color="#2F9BE0" stop-opacity=".10"/></linearGradient>'
     +'<radialGradient id="'+id+'c" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#FFB300" stop-opacity=".30"/><stop offset="1" stop-color="#8E44AD" stop-opacity=".10"/></radialGradient>'
     +'</defs>';
    return s;
  }
  // one list item: planet label (coloured) + degrees (muted)
  const TAS={Su:'சூ',Mo:'சந்',Ma:'செ',Me:'பு',Ju:'கு',Ve:'சு',Sa:'சனி',Ra:'ரா',Ke:'கே',L:'ல',F:'போ'};
  function item(it,x,y,fs,long){
    if(LANG==='bi'&&long&&TAS[it.k]&&it.t.indexOf(TAS[it.k])<0)it=Object.assign({},it,{t:it.t+' '+TAS[it.k]}); else if(LANG==='ta'&&it.k==='F')it=Object.assign({},it,{t:TAS.F});
    const col=PC[it.k]||PC[(it.k||'').charAt(0)==='C'?'C':'L']||'#888';
    const cs=THEME==='colour'?'fill:'+col+';':THEME==='classic'?'fill:var(--accent);':'fill:var(--ink);';
    return '<text x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'"><tspan class="c60n" style="'+cs+'font-size:'+fs+'px">'+esc(it.t)+'</tspan>'
      +((long&&it.dl)||it.d?'<tspan class="c60d" dx="3" style="font-size:'+(fs-2)+'px">'+esc(long&&it.dl?it.dl:it.d)+'</tspan>':'')
      +(it.r?'<tspan class="c60r" dx="1" style="font-size:'+(fs-3)+'px">R</tspan>':'')+'</text>';
  }
  const WM=(x,y,fs,rot)=>'<text x="'+x+'" y="'+y+'" text-anchor="middle" transform="rotate('+rot+' '+x+' '+y+')" style="fill:var(--ink);fill-opacity:.07;font:800 '+fs+'px var(--sfd);letter-spacing:.04em;pointer-events:none">GuruAgasthiya</text>';
  function southSVG(c){
    const id='c'+(++uid), S=120;
    const CELLS=(typeof CELL!=='undefined')?CELL:{11:[0,0],0:[1,0],1:[2,0],2:[3,0],3:[3,1],4:[3,2],5:[3,3],6:[2,3],7:[1,3],8:[0,3],9:[0,2],10:[0,1]};
    let s='<svg class="ch c60" viewBox="0 0 480 '+(c.caption&&c.caption.length?480+c.caption.length*22+6:480)+'" role="img" aria-label="'+esc(c.aria||'South Indian chart')+'">'+defs(id);
    const PRO=THEME!=='colour';
    s+=PRO?'<rect x="1" y="1" width="478" height="478" rx="2" fill="none" style="stroke:var(--ink)" stroke-width="2"/>':'<rect x="1.5" y="1.5" width="477" height="477" rx="20" fill="url(#'+id+'f)" stroke="url(#'+id+'b)" stroke-width="3"/>';
    for(let sg=0;sg<12;sg++){
      const x=CELLS[sg][0]*S, y=CELLS[sg][1]*S, isA=sg===c.A, k=sg%4;
      if(PRO){
        s+='<rect x="'+x+'" y="'+y+'" width="'+S+'" height="'+S+'" style="fill:var(--surface);stroke:var(--ink)" stroke-opacity=".75" stroke-width="1"/>';
        if(isA)s+='<rect x="'+(x+2)+'" y="'+(y+2)+'" width="'+(S-4)+'" height="'+(S-4)+'" style="fill:var(--accent);stroke:var(--accent)" fill-opacity=".07" stroke-width="2"/><path d="M'+(x+1)+' '+(y+1)+'h26l-26 26z" style="fill:var(--accent)"/>';
        if(c.passed&&c.passed.has(sg))s+='<rect x="'+x+'" y="'+y+'" width="'+S+'" height="'+S+'" style="fill:var(--accent)" fill-opacity=".08"/>';
        s+='<text x="'+(x+(isA?30:7))+'" y="'+(y+14)+'" class="c60s" style="fill:var(--muted);font-size:10.5px;font-weight:600">'+esc(c.signs?c.signs[sg]:sg+1)+'</text>'+(LANG==='bi'?'<text x="'+(x+(isA?30:7))+'" y="'+(y+25)+'" class="c60s tam60" style="fill:var(--muted);font-size:9.5px;font-weight:600">'+esc(TSIGN[sg])+'</text>':'')+'<text x="'+(x+S-7)+'" y="'+(y+16)+'" text-anchor="end" class="c60g" style="fill:var(--muted);font-size:13px">'+GLY[sg]+'</text>';
        const L=c.by[sg]||[], n=L.length, cols=n>5?2:1, rows=Math.ceil(n/cols), rh=Math.min(19,78/Math.max(rows,1)), fs=n>8?12:13;
        L.forEach((it,i)=>{const col=cols===2?Math.floor(i/rows):0,row=cols===2?i%rows:i; s+=item(it,x+(cols===2?8+col*56:12),y+38+row*rh,fs,cols===1);});
        continue;
      }
      s+='<rect x="'+(x+3)+'" y="'+(y+3)+'" width="'+(S-6)+'" height="'+(S-6)+'" rx="9" fill="var(--surface)"/>'
       +'<rect x="'+(x+3)+'" y="'+(y+3)+'" width="'+(S-6)+'" height="'+(S-6)+'" rx="9" fill="url(#'+id+(isA?'a':'e'+k)+')" stroke="'+(isA?'url(#'+id+'b)':EL[k])+'" stroke-opacity="'+(isA?1:.55)+'" stroke-width="'+(isA?4:1.3)+'"/>';
      if(c.passed&&c.passed.has(sg))s+='<rect x="'+(x+3)+'" y="'+(y+3)+'" width="'+(S-6)+'" height="'+(S-6)+'" rx="9" fill="var(--accent)" fill-opacity=".10"/>';
      if(isA)s+='<path d="M'+(x+4)+' '+(y+4)+'h40l-40 40z" fill="'+PC.L+'" opacity=".92"/><text x="'+(x+8)+'" y="'+(y+19)+'" class="c60a">★</text>';
      s+='<text x="'+(x+(isA?30:12))+'" y="'+(y+19)+'" class="c60s" style="fill:'+ELD[k]+'">'+esc(c.signs?c.signs[sg]:sg+1)+'</text>'
       +(LANG==='bi'?'<text x="'+(x+(isA?30:12))+'" y="'+(y+31)+'" class="c60s tam60" style="fill:'+ELD[k]+';font-size:9.5px">'+esc(TSIGN[sg])+'</text>':'')+'<text x="'+(x+S-11)+'" y="'+(y+21)+'" text-anchor="end" class="c60g" style="fill:'+EL[k]+'">'+GLY[sg]+'</text>';
      const L=c.by[sg]||[], n=L.length, cols=n>5?2:1, rows=Math.ceil(n/cols), rh=Math.min(20,76/Math.max(rows,1)), fs=n>8?12:13;
      L.forEach((it,i)=>{
        const col=cols===2?Math.floor(i/rows):0, row=cols===2?i%rows:i;
        s+=item(it,x+(cols===2?11+col*55:16),y+44+row*rh,fs,cols===1);
      });
    }
    // centre panel
    s+=PRO?'<rect x="120" y="120" width="240" height="240" style="fill:var(--surface);stroke:var(--ink)" stroke-opacity=".75" stroke-width="1"/>':'<rect x="127" y="127" width="226" height="226" rx="22" fill="url(#'+id+'c)" stroke="url(#'+id+'b)" stroke-opacity=".5" stroke-width="1.5"/>';
    const cl=c.center||[]; const cy0=240-(cl.length-1)*13;
    cl.forEach((ln,i)=>{ s+='<text x="240" y="'+(cy0+i*26+5).toFixed(0)+'" text-anchor="middle" class="'+(ln.c||'c60t')+'">'+esc(ln.t)+'</text>'; });
    (c.caption||[]).forEach((ln,i)=>{ s+='<text x="240" y="'+(500+i*22)+'" text-anchor="middle" class="'+(ln.c||'c60k')+'">'+esc(ln.t)+'</text>'; });
    return s+WM(240,252,42,-32)+'</svg>';
  }
  function northSVG(c){
    const id='c'+(++uid), A=c.A;
    let s='<svg class="ch c60" viewBox="-6 -6 412 '+(406+(c.caption&&c.caption.length?c.caption.length*22+8:0))+'" role="img" aria-label="'+esc(c.aria||'North Indian chart')+'">'+defs(id);
    const PRO=THEME!=='colour';
    s+=PRO?'<rect x="0" y="0" width="400" height="400" fill="none" style="stroke:var(--ink)" stroke-width="2"/>':'<rect x="-3" y="-3" width="406" height="406" rx="14" fill="url(#'+id+'f)" stroke="url(#'+id+'b)" stroke-width="3"/>';
    for(let h=1;h<=12;h++){
      const V=NORTH[h], sg=(A+h-1)%12, k=sg%4, pts=V.map(v=>v.join(',')).join(' ');
      if(PRO){s+='<polygon points="'+pts+'" style="fill:'+(h===1?'var(--accent)':'var(--surface)')+';stroke:var(--ink)" fill-opacity="'+(h===1?.07:1)+'" stroke-opacity=".75" stroke-width="1" stroke-linejoin="round"/>'; if(c.passed&&c.passed.has(sg))s+='<polygon points="'+pts+'" style="fill:var(--accent)" fill-opacity=".08"/>'; continue;}
      s+='<polygon points="'+pts+'" fill="var(--surface)"/><polygon points="'+pts+'" fill="url(#'+id+(h===1?'a':'e'+k)+')" stroke="'+EL[k]+'" stroke-opacity=".75" stroke-width="1.5" stroke-linejoin="round"/>';
      if(c.passed&&c.passed.has(sg))s+='<polygon points="'+pts+'" fill="var(--accent)" fill-opacity=".10"/>';
    }
    s+=PRO?'<polygon points="'+NORTH[1].map(v=>v.join(',')).join(' ')+'" fill="none" style="stroke:var(--accent)" stroke-width="2.2" stroke-linejoin="round"/>':'<polygon points="'+NORTH[1].map(v=>v.join(',')).join(' ')+'" fill="none" stroke="url(#'+id+'b)" stroke-width="4" stroke-linejoin="round"/>';
    for(let h=1;h<=12;h++){
      const V=NORTH[h], sg=(A+h-1)%12, n=V.length, cx=V.reduce((a,v)=>a+v[0],0)/n, cy=V.reduce((a,v)=>a+v[1],0)/n; let nx,ny;
      if(n===4){nx=cx+0.5*(200-cx);ny=cy+0.5*(200-cy);}else{const iv=V.find(v=>(v[0]===100||v[0]===300)&&(v[1]===100||v[1]===300));nx=cx+0.78*(iv[0]-cx);ny=cy+0.78*(iv[1]-cy);}
      s+=PRO?'<text x="'+nx.toFixed(0)+'" y="'+(ny+4).toFixed(0)+'" text-anchor="middle" class="c60h" style="fill:var(--muted);font-size:11px">'+esc(c.hn?c.hn[h-1]:sg+1)+'</text>':'<circle cx="'+nx.toFixed(0)+'" cy="'+(ny).toFixed(0)+'" r="10" fill="'+EL[sg%4]+'" fill-opacity=".92"/><text x="'+nx.toFixed(0)+'" y="'+(ny+4).toFixed(0)+'" text-anchor="middle" class="c60h">'+esc(c.hn?c.hn[h-1]:sg+1)+'</text>';
      const L=c.by[sg]||[], m=L.length, two=m>5, fs=m>7?11:(m>4?12:13), lh=m>7?13:15;
      L.forEach((it,i)=>{
        let x=cx,y;
                if(two){const col=i%2,row=Math.floor(i/2),rows=Math.ceil(m/2); x=cx+(col?4:-44); y=cy-(rows-1)*lh/2+row*lh+4;}
        else y=cy-(m-1)*lh/2+i*lh+4-(h===1?8:0);
        const wide=(it.t||'').length+(it.d?(it.d.length*.8):0)+(it.r?1:0);
        const xx=two?x:(cx-wide*3.1);
        s+=item(it,xx,y,fs,!two&&m<=4);
      });
    }
    (c.caption||[]).forEach((ln,i)=>{ s+='<text x="200" y="'+(424+i*22)+'" text-anchor="middle" class="'+(ln.c||'c60k')+'">'+esc(ln.t)+'</text>'; });
    return s+WM(200,212,38,-32)+'</svg>';
  }
  /* ---------- v6.8: Western (tropical) wheel chart, offline ---------- */
  const WG={Su:'☉',Mo:'☽',Ma:'♂',Me:'☿',Ju:'♃',Ve:'♀',Sa:'♄',Ra:'☊',Ke:'☋',L:'Asc'};
  const WASP=[['Conjunction','☌',0,8,'#8a8f98'],['Sextile','⚹',60,5,'#2a9d8f'],['Square','□',90,7,'#d1495b'],['Trine','△',120,7,'#2a7de1'],['Opposition','☍',180,8,'#d1495b']];
  const m360=x=>((x%360)+360)%360;
  function westCalc(w){
    const ay=w.ay, T=l=>m360(l+ay);
    const cus=w.cusps.map(T), asc=cus[0];
    const hOf=l=>{l=T(l);for(let i=0;i<12;i++){const a=cus[i],b=cus[(i+1)%12];if(m360(l-a)<m360(b-a))return i+1;}return 1;};
    const pl=w.pl.map(p=>({k:p.k,t:p.t,lon:T(p.lon),r:!!p.r,h:hOf(p.lon)}));
    const pts=pl.filter(p=>p.k!=='Ke').concat([{k:'L',t:'Asc',lon:cus[0]},{k:'MC',t:'MC',lon:cus[9]}]);
    const asp=[];
    for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){
      let d=Math.abs(pts[i].lon-pts[j].lon); if(d>180)d=360-d;
      WASP.forEach(a=>{const o=Math.abs(d-a[2]); if(o<=a[3])asp.push({a:pts[i],b:pts[j],t:a,orb:o});});
    }
    return {cus:cus,asc:asc,pl:pl,asp:asp,T:T};
  }
  function arcPath(cx,cy,r0,r1,a0,a1){
    const P=(r,a)=>(cx+r*Math.cos(a)).toFixed(1)+' '+(cy-r*Math.sin(a)).toFixed(1);
    return 'M'+P(r1,a0)+' A'+r1+' '+r1+' 0 0 0 '+P(r1,a1)+' L'+P(r0,a1)+' A'+r0+' '+r0+' 0 0 1 '+P(r0,a0)+'Z';
  }
  function westHTML(c,W){
    const sn=i=>(c.signs&&c.signs[i])||SIGNS[i][0], dgm=x=>Math.floor(x%30)+'°'+('0'+Math.floor((x%30%1)*60)).slice(-2)+'′';
    let h='<div class="wdet"><table class="wt"><thead><tr><th>Planet</th><th>Tropical position</th><th>House</th></tr></thead><tbody>';
    W.pl.forEach(p=>{h+='<tr><td><b>'+esc(WG[p.k]||'')+'</b> '+esc(p.t)+(p.r?' <i>R</i>':'')+'</td><td>'+GLY[Math.floor(p.lon/30)]+' '+esc(sn(Math.floor(p.lon/30)))+' '+dgm(p.lon)+'</td><td>'+p.h+'</td></tr>';});
    h+='</tbody></table><table class="wt"><thead><tr><th>House cusp (Placidus)</th><th>Tropical position</th></tr></thead><tbody>';
    W.cus.forEach((l,i)=>{h+='<tr><td>'+(i+1)+(i===0?' · Asc':i===9?' · MC':i===3?' · IC':i===6?' · Desc':'')+'</td><td>'+GLY[Math.floor(l/30)]+' '+esc(sn(Math.floor(l/30)))+' '+dgm(l)+'</td></tr>';});
    h+='</tbody></table><table class="wt"><thead><tr><th>Aspect</th><th>Orb</th></tr></thead><tbody>';
    if(!W.asp.length)h+='<tr><td colspan="2">No major aspects</td></tr>';
    W.asp.slice().sort((x,y)=>x.orb-y.orb).forEach(a=>{h+='<tr><td>'+esc(WG[a.a.k]||a.a.t)+' '+a.t[1]+' '+esc(WG[a.b.k]||a.b.t)+' <span class="muted">'+a.t[0]+'</span></td><td>'+a.orb.toFixed(1)+'°</td></tr>';});
    return h+'</tbody></table><p class="wnote">Tropical zodiac · Placidus houses · major aspects · computed offline.</p></div>';
  }
  function westSVG(c){
    if(!c.w)return southSVG(Object.assign({},c,{caption:c.caption}));
    const W=westCalc(c.w), CX=240, CY=240, R0=228, R1=196, R3=108, id='w'+(++uid);
    const ang=l=>Math.PI+(l-W.asc)*Math.PI/180, X=(r,l)=>CX+r*Math.cos(ang(l)), Y=(r,l)=>CY-r*Math.sin(ang(l));
    const cap=(c.caption||[]), H=480+cap.length*22+6;
    let s='<svg class="ch c60 cwest" viewBox="-26 0 532 '+H+'" role="img" aria-label="'+esc(c.aria||'Western chart')+'">';
    for(let k=0;k<12;k++){
      const a0=ang(k*30+30), a1=ang(k*30);   // wedge between sign boundaries
      s+='<path d="'+arcPath(CX,CY,R1,R0,Math.min(a0,a1),Math.max(a0,a1)).replace(/ 0 0 0 /,' 0 0 0 ')+'" '+(THEME==='colour'?'fill="'+EL[k%4]+'" fill-opacity=".22"':'fill="none"')+' style="stroke:var(--ink)" stroke-width=".8"/>';
      s+='<text x="'+X((R0+R1)/2,k*30+15).toFixed(1)+'" y="'+(Y((R0+R1)/2,k*30+15)+6).toFixed(1)+'" text-anchor="middle" style="font:600 18px var(--sf);fill:'+(THEME==='colour'?ELD[k%4]:'var(--ink)')+'">'+GLY[k]+'</text>';
    }
    for(let d=0;d<360;d+=5){const L=d%30===0?0:d%10===0?7:4; if(L)s+='<line x1="'+X(R1,d).toFixed(1)+'" y1="'+Y(R1,d).toFixed(1)+'" x2="'+X(R1-L,d).toFixed(1)+'" y2="'+Y(R1-L,d).toFixed(1)+'" style="stroke:var(--ink)" stroke-opacity=".5" stroke-width=".7"/>';}
    s+='<circle cx="'+CX+'" cy="'+CY+'" r="'+R3+'" fill="none" style="stroke:var(--ink)" stroke-width="1"/>';
    // house cusps
    W.cus.forEach((l,i)=>{
      const big=i%3===0;
      s+='<line x1="'+X(R3,l).toFixed(1)+'" y1="'+Y(R3,l).toFixed(1)+'" x2="'+X(big?R0+0:R1,l).toFixed(1)+'" y2="'+Y(big?R0:R1,l).toFixed(1)+'" style="stroke:var(--ink)" stroke-width="'+(big?2:.9)+'" stroke-opacity="'+(big?1:.55)+'"/>';
      const mid=l+m360(W.cus[(i+1)%12]-l)/2;
      s+='<text x="'+X(R3+11,mid).toFixed(1)+'" y="'+(Y(R3+11,mid)+3.5).toFixed(1)+'" text-anchor="middle" style="font:600 10px var(--sf);fill:var(--muted)">'+(i+1)+'</text>';
    });
    // aspects
    W.asp.forEach(a=>{
      s+='<line x1="'+X(R3-1,a.a.lon).toFixed(1)+'" y1="'+Y(R3-1,a.a.lon).toFixed(1)+'" x2="'+X(R3-1,a.b.lon).toFixed(1)+'" y2="'+Y(R3-1,a.b.lon).toFixed(1)+'" stroke="'+(THEME==='pro'?'currentColor':a.t[4])+'" style="'+(THEME==='pro'?'color:var(--ink);':'')+'" stroke-width="'+(a.orb<2?1.6:.9)+'" stroke-opacity=".75"'+(a.t[2]===60||a.t[2]===0?' stroke-dasharray="4 3"':'')+'/>';
    });
    // planets, spread so glyphs do not overlap
    const ps=W.pl.slice().sort((p,q)=>p.lon-q.lon), disp=ps.map(p=>p.lon);
    for(let it=0;it<60;it++){let moved=false;for(let i=0;i<ps.length;i++){const j=(i+1)%ps.length; let gap=m360(disp[j]-disp[i]); if(ps.length>1&&gap<8.5){const push=(8.5-gap)/2+.05; disp[i]=m360(disp[i]-push); disp[j]=m360(disp[j]+push); moved=true;}} if(!moved)break;}
    ps.forEach((p,i)=>{
      const col=PC[p.k]||'#888', fc=THEME==='colour'?'fill:'+col:'fill:var(--ink)', rg=156, rl=177, rt=R1-5;
      s+='<line x1="'+X(R1,p.lon).toFixed(1)+'" y1="'+Y(R1,p.lon).toFixed(1)+'" x2="'+X(rt,p.lon).toFixed(1)+'" y2="'+Y(rt,p.lon).toFixed(1)+'" style="stroke:var(--ink)" stroke-width="1.2"/>';
      s+='<text x="'+X(rl-1,disp[i]).toFixed(1)+'" y="'+(Y(rl-1,disp[i])+6).toFixed(1)+'" text-anchor="middle" style="font:700 19px var(--sf);'+fc+'">'+esc(WG[p.k])+'</text>';
      s+='<text x="'+X(rg-4,disp[i]).toFixed(1)+'" y="'+(Y(rg-4,disp[i])+3.5).toFixed(1)+'" text-anchor="middle" style="font:600 9.5px var(--sf);fill:var(--ink)">'+Math.floor(p.lon%30)+'°'+(p.r?'R':'')+'</text>';
    });
    ['ASC',3,'DSC',9].forEach(()=>{});
    [['ASC',0],['IC',3],['DSC',6],['MC',9]].forEach(x=>{const l=W.cus[x[1]]; s+='<text x="'+X(R0+0,l).toFixed(1)+'" y="'+Y(R0,l).toFixed(1)+'" dy="'+(x[1]===0||x[1]===6?4:x[1]===3?14:-4)+'" dx="'+(x[1]===0?-1:x[1]===6?1:0)+'" text-anchor="'+(x[1]===0?'end':x[1]===6?'start':'middle')+'" style="font:700 10px var(--sf);fill:var(--accent)">'+x[0]+'</text>';});
    cap.forEach((ln,i)=>{s+='<text x="240" y="'+(498+i*22)+'" text-anchor="middle" class="'+(ln.c||'c60k')+'">'+esc(ln.t)+'</text>';});
    s+=WM(240,244,40,-30)+'</svg>';
    return s+westHTML(c,W);
  }
  function draw(c,style){
    style=style||STYLE;
    const tt=(k,d)=>(typeof T60==='function'?T60(k):d);
    const cs=c.south?Object.assign({},c,c.south):c, cn=c.north?Object.assign({},c,c.north):c, cw=c.west?Object.assign({},c,c.west):c;
    if(style==='west')return c.w?westSVG(cw):southSVG(cs);
    if(style==='all')return '<div class="chboth"><div class="chone"><div class="chs-t">'+esc(tt('South Indian','South Indian'))+'</div>'+southSVG(cs)+'</div><div class="chone"><div class="chs-t">'+esc(tt('North Indian','North Indian'))+'</div>'+northSVG(cn)+'</div>'+(c.w?'<div class="chone"><div class="chs-t">'+esc(tt('Western','Western'))+'</div>'+westSVG(cw)+'</div>':'')+'</div>';
    if(style==='both')return '<div class="chboth"><div class="chone"><div class="chs-t">'+esc(tt('South Indian','South Indian'))+'</div>'+southSVG(cs)+'</div><div class="chone"><div class="chs-t">'+esc(tt('North Indian','North Indian'))+'</div>'+northSVG(cn)+'</div></div>';
    return style==='north'?northSVG(cn):southSVG(cs);
  }
  return {PC:PC,EL:EL,south:southSVG,north:northSVG,draw:draw,esc:esc,ls:ls,
    get style(){return STYLE;}, set style(v){STYLE=v;ls.set('ga_chstyle',v);},
    get theme(){return THEME;}, set theme(v){THEME=v;ls.set('ga_chtheme',v);},
    get lang(){return LANG;}, set lang(v){LANG=v;ls.set('ga_lang',v);}};
})();

/* ---------- v6.0: offline language engine (no internet, no translation service) ---------- */
const I18N60=(function(){
  const KEYS=["Tools", "GMP Prasnam", "Birth Chart", "Astrocartography", "Chandra Muhurtham", "Date-Range Muhurtham", "Money Manifestation", "Lottery Rules", "Cricket Wicket", "Cuspal Chart", "Lost & Found", "Horse Race", "Money Profit Muhurtham", "Speculation Research", "Earthquake Research", "Horary Answers", "Practical Electional Muhurtham", "About", "Lagna Timings", "Transit Chart", "How It Works", "Country", "State / Province", "City / Town", "Latitude", "Longitude", "Time Zone", "UTC Offset", "Ayanamsa", "From", "To", "Use My Location", "Name", "Date of Birth", "Time of Birth", "Chart Style", "Language", "South Indian", "North Indian", "Both charts", "Play Lagna Movement", "Jump to Now", "Live Lagna", "Freeze", "Resume live", "Copy as Text", "Show", "Date", "Time", "Cancel", "Save", "Stop", "Sound", "Rules", "Findings", "Rasi chart", "Navamsa (D-9)", "KP bhava chart", "Cuspal Chart (Bhava)", "Body", "Position", "Star", "Sign", "Sign lord", "Star lord", "Sub lord", "House", "Degree", "rising", "Wicket possibility", "Advert break", "Find Wicket and Break Times", "Calculate Birth Chart", "Save This Chart", "Astro Map", "Important Disclaimer", "Lost and Found", "Cricket Wicket & Breaks", "Present transit time", "Copy all data", "Print / save as PDF", "Save / share file", "Ascendant", "LIVE", "Success", "3 11 Muhurtham", "Trade Profit", "Market Transit", "Live Transit Clock", "Analog", "Digital", "Full screen", "Location", "Muhurtham alarms", "Set the Alarms", "Begin", "End", "Planet", "Rasi", "Recent places", "Font size", "Font style", "Prediction", "Bullish", "Bearish", "Neutral", "Market Predictions", "Choose a place", "Today"];
  const DATA={"ta":{"n":"தமிழ்","P":["சூரியன்","சந்திரன்","செவ்வாய்","புதன்","குரு","சுக்கிரன்","சனி","ராகு","கேது"],"Q":["சூ","சந்","செ","பு","கு","சு","சனி","ரா","கே"],"S":["மேஷம்","ரிஷபம்","மிதுனம்","கடகம்","சிம்மம்","கன்னி","துலாம்","விருச்சிகம்","தனுசு","மகரம்","கும்பம்","மீனம்"],"A":"லக்","U":["கருவிகள்","ஜிஎம்பி பிரசன்னம்","பிறப்பு ஜாதகம்","ஜோதிட வரைபடம்","சந்திர முகூர்த்தம்","தேதி வரம்பு முகூர்த்தம்","பணம் ஈர்ப்பு","லாட்டரி விதிகள்","கிரிக்கெட் விக்கெட்","பாவ கஸ்ப் சக்கரம்","தொலைந்த பொருள் மீட்பு","குதிரைப் பந்தயம்","பண லாப முகூர்த்தம்","ஊக ஆய்வு","நில அதிர்வு ஆய்வு","ஹோரரி விடைகள்","செயல்முறை முகூர்த்தம்","இந்த செயலி பற்றி","லக்ன நேரங்கள்","கோசார சக்கரம்","இது எப்படி செயல்படுகிறது","நாடு","மாநிலம்","நகரம் / ஊர்","அட்சரேகை","தீர்க்கரேகை","நேர மண்டலம்","UTC வேறுபாடு","அயனாம்சம்","முதல்","வரை","என் இடத்தைப் பயன்படுத்து","பெயர்","பிறந்த தேதி","பிறந்த நேரம்","சக்கர பாணி","மொழி","தென்னிந்திய","வட இந்திய","இரண்டு சக்கரங்களும்","லக்ன நகர்வை இயக்கு","இப்போதைக்குச் செல்","நேரலை லக்னம்","நிறுத்து","நேரலை தொடர்","உரையாக நகலெடு","காட்டு","தேதி","நேரம்","ரத்து","சேமி","நிறுத்து","ஒலி","விதிகள்","கண்டுபிடிப்புகள்","ராசி சக்கரம்","நவாம்சம் (D-9)","கே.பி பாவ சக்கரம்","பாவ கஸ்ப் சக்கரம்","கிரகம்","நிலை","நட்சத்திரம்","ராசி","ராசி அதிபதி","நட்சத்திர அதிபதி","உப அதிபதி","பாவம்","பாகை","உதயம்","விக்கெட் வாய்ப்பு","விளம்பர இடைவேளை","விக்கெட், இடைவேளை நேரம் காண்","ஜாதகம் கணி","இந்த ஜாதகத்தைச் சேமி","ஜோதிட வரைபடம்","முக்கிய அறிவிப்பு","தொலைந்த பொருள் மீட்பு","கிரிக்கெட் விக்கெட் & இடைவேளை","தற்போதைய கோசார நேரம்","எல்லாத் தகவலையும் நகலெடு","அச்சிடு / PDF ஆகச் சேமி","கோப்பாகச் சேமி / பகிர்","லக்னம்","நேரலை","வெற்றி","3 11 முகூர்த்தம்","வர்த்தக லாபம்","சந்தை கோசாரம்","நேரடி லக்ன கடிகாரம்","அனலாக்","டிஜிட்டல்","முழுத்திரை","இடம்","முகூர்த்த அலாரம்","அலாரங்களை அமை","தொடக்கம்","முடிவு","கிரகம்","ராசி","சமீபத்திய இடங்கள்","எழுத்து அளவு","எழுத்து பாணி","முன்கணிப்பு","ஏற்றம்","இறக்கம்","நடுநிலை","சந்தை முன்கணிப்புகள்","இடத்தைத் தேர்வு செய்","இன்று"]},"hi":{"n":"हिन्दी","P":["सूर्य","चंद्र","मंगल","बुध","गुरु","शुक्र","शनि","राहु","केतु"],"Q":["सू","चं","मं","बु","गु","शु","श","रा","के"],"S":["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन"],"A":"ल","U":["उपकरण","जीएमपी प्रश्न","जन्म कुंडली","ज्योतिष मानचित्र","चंद्र मुहूर्त","तिथि-सीमा मुहूर्त","धन आकर्षण","लॉटरी नियम","क्रिकेट विकेट","भाव कुसप चार्ट","खोया-पाया","घुड़दौड़","धन लाभ मुहूर्त","सट्टा अनुसंधान","भूकंप अनुसंधान","होरारी उत्तर","व्यावहारिक मुहूर्त","इस ऐप के बारे में","लग्न समय","गोचर कुंडली","यह कैसे काम करता है","देश","राज्य / प्रांत","शहर / कस्बा","अक्षांश","देशांतर","समय क्षेत्र","UTC अंतर","अयनांश","से","तक","मेरा स्थान उपयोग करें","नाम","जन्म तिथि","जन्म समय","चार्ट शैली","भाषा","दक्षिण भारतीय","उत्तर भारतीय","दोनों चार्ट","लग्न गति चलाएँ","अभी पर जाएँ","लाइव लग्न","रोकें","लाइव फिर शुरू करें","पाठ के रूप में कॉपी करें","दिखाएँ","तिथि","समय","रद्द करें","सहेजें","रोकें","ध्वनि","नियम","निष्कर्ष","राशि कुंडली","नवांश (D-9)","केपी भाव कुंडली","भाव कुसप कुंडली","ग्रह","स्थिति","नक्षत्र","राशि","राशि स्वामी","नक्षत्र स्वामी","उप स्वामी","भाव","अंश","उदय","विकेट की संभावना","विज्ञापन विराम","विकेट और ब्रेक का समय खोजें","जन्म कुंडली बनाएँ","यह कुंडली सहेजें","ज्योतिष नक्शा","महत्वपूर्ण सूचना","खोया-पाया","क्रिकेट विकेट और ब्रेक","वर्तमान गोचर समय","सारा डेटा कॉपी करें","प्रिंट / PDF सहेजें","फ़ाइल सहेजें / साझा करें","लग्न","लाइव","सफलता","3 11 मुहूर्त","ट्रेड लाभ","मार्केट गोचर","लाइव गोचर घड़ी","एनालॉग","डिजिटल","पूर्ण स्क्रीन","स्थान","मुहूर्त अलार्म","अलार्म सेट करें","आरंभ","समाप्त","ग्रह","राशि","हाल के स्थान","अक्षर आकार","अक्षर शैली","पूर्वानुमान","तेजी","मंदी","तटस्थ","बाज़ार पूर्वानुमान","स्थान चुनें","आज"]},"te":{"n":"తెలుగు","P":["సూర్యుడు","చంద్రుడు","కుజుడు","బుధుడు","గురుడు","శుక్రుడు","శని","రాహువు","కేతువు"],"Q":["సూ","చం","కు","బు","గు","శు","శ","రా","కే"],"S":["మేషం","వృషభం","మిథునం","కర్కాటకం","సింహం","కన్య","తుల","వృశ్చికం","ధనుస్సు","మకరం","కుంభం","మీనం"],"A":"లగ్","U":["సాధనాలు","జీఎంపీ ప్రశ్న","జన్మ జాతకం","జ్యోతిష పటం","చంద్ర ముహూర్తం","తేదీ పరిధి ముహూర్తం","ధన ఆకర్షణ","లాటరీ నియమాలు","క్రికెట్ వికెట్","భావ కస్ప్ చార్ట్","పోయినవి దొరికినవి","గుర్రపు పందెం","ధన లాభ ముహూర్తం","ఊహా పరిశోధన","భూకంప పరిశోధన","హోరరీ సమాధానాలు","ఆచరణాత్మక ముహూర్తం","ఈ యాప్ గురించి","లగ్న సమయాలు","గోచార చక్రం","ఇది ఎలా పనిచేస్తుంది","దేశం","రాష్ట్రం","నగరం / పట్టణం","అక్షాంశం","రేఖాంశం","సమయ మండలి","UTC తేడా","అయనాంశం","నుండి","వరకు","నా స్థానాన్ని వాడండి","పేరు","పుట్టిన తేదీ","పుట్టిన సమయం","చార్ట్ శైలి","భాష","దక్షిణ భారతీయ","ఉత్తర భారతీయ","రెండు చార్ట్‌లు","లగ్న కదలిక ప్లే","ఇప్పటికి వెళ్ళు","ప్రత్యక్ష లగ్నం","ఆపు","ప్రత్యక్షం కొనసాగించు","టెక్స్ట్‌గా కాపీ చేయి","చూపించు","తేదీ","సమయం","రద్దు","సేవ్","ఆపు","ధ్వని","నియమాలు","ఫలితాలు","రాశి చక్రం","నవాంశ (D-9)","కేపీ భావ చక్రం","భావ కస్ప్ చక్రం","గ్రహం","స్థానం","నక్షత్రం","రాశి","రాశ్యాధిపతి","నక్షత్రాధిపతి","ఉపాధిపతి","భావం","డిగ్రీ","ఉదయం","వికెట్ అవకాశం","ప్రకటన విరామం","వికెట్, విరామ సమయాలు కనుగొను","జాతకం లెక్కించు","ఈ జాతకం సేవ్ చేయి","జ్యోతిష పటం","ముఖ్య గమనిక","పోయినవి దొరికినవి","క్రికెట్ వికెట్ & విరామాలు","ప్రస్తుత గోచార సమయం","మొత్తం డేటా కాపీ","ప్రింట్ / PDF సేవ్","ఫైల్ సేవ్ / షేర్","లగ్నం","ప్రత్యక్ష","విజయం","3 11 ముహూర్తం","ట్రేడ్ లాభం","మార్కెట్ గోచారం","ప్రత్యక్ష గోచార గడియారం","అనలాగ్","డిజిటల్","పూర్తి స్క్రీన్","స్థలం","ముహూర్త అలారాలు","అలారాలు సెట్ చేయి","ప్రారంభం","ముగింపు","గ్రహం","రాశి","ఇటీవలి స్థలాలు","అక్షర పరిమాణం","అక్షర శైలి","అంచనా","పెరుగుదల","తగ్గుదల","తటస్థం","మార్కెట్ అంచనాలు","స్థలాన్ని ఎంచుకోండి","ఈరోజు"]},"kn":{"n":"ಕನ್ನಡ","P":["ಸೂರ್ಯ","ಚಂದ್ರ","ಮಂಗಳ","ಬುಧ","ಗುರು","ಶುಕ್ರ","ಶನಿ","ರಾಹು","ಕೇತು"],"Q":["ಸೂ","ಚಂ","ಮಂ","ಬು","ಗು","ಶು","ಶ","ರಾ","ಕೇ"],"S":["ಮೇಷ","ವೃಷಭ","ಮಿಥುನ","ಕರ್ಕಾಟಕ","ಸಿಂಹ","ಕನ್ಯಾ","ತುಲಾ","ವೃಶ್ಚಿಕ","ಧನುಸ್ಸು","ಮಕರ","ಕುಂಭ","ಮೀನ"],"A":"ಲಗ್","U":["ಉಪಕರಣಗಳು","ಜಿಎಂಪಿ ಪ್ರಶ್ನೆ","ಜನ್ಮ ಕುಂಡಲಿ","ಜ್ಯೋತಿಷ ನಕ್ಷೆ","ಚಂದ್ರ ಮುಹೂರ್ತ","ದಿನಾಂಕ ವ್ಯಾಪ್ತಿ ಮುಹೂರ್ತ","ಧನ ಆಕರ್ಷಣೆ","ಲಾಟರಿ ನಿಯಮಗಳು","ಕ್ರಿಕೆಟ್ ವಿಕೆಟ್","ಭಾವ ಕಸ್ಪ್ ಚಾರ್ಟ್","ಕಳೆದುಹೋದದ್ದು ಸಿಕ್ಕಿದ್ದು","ಕುದುರೆ ರೇಸ್","ಧನ ಲಾಭ ಮುಹೂರ್ತ","ಊಹಾ ಸಂಶೋಧನೆ","ಭೂಕಂಪ ಸಂಶೋಧನೆ","ಹೋರರಿ ಉತ್ತರಗಳು","ಪ್ರಾಯೋಗಿಕ ಮುಹೂರ್ತ","ಈ ಆ್ಯಪ್ ಬಗ್ಗೆ","ಲಗ್ನ ಸಮಯಗಳು","ಗೋಚಾರ ಚಕ್ರ","ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ","ದೇಶ","ರಾಜ್ಯ","ನಗರ / ಪಟ್ಟಣ","ಅಕ್ಷಾಂಶ","ರೇಖಾಂಶ","ಸಮಯ ವಲಯ","UTC ವ್ಯತ್ಯಾಸ","ಅಯನಾಂಶ","ಇಂದ","ವರೆಗೆ","ನನ್ನ ಸ್ಥಳ ಬಳಸಿ","ಹೆಸರು","ಜನ್ಮ ದಿನಾಂಕ","ಜನ್ಮ ಸಮಯ","ಚಾರ್ಟ್ ಶೈಲಿ","ಭಾಷೆ","ದಕ್ಷಿಣ ಭಾರತೀಯ","ಉತ್ತರ ಭಾರತೀಯ","ಎರಡೂ ಚಾರ್ಟ್‌ಗಳು","ಲಗ್ನ ಚಲನೆ ಪ್ಲೇ","ಈಗಿನ ಸಮಯಕ್ಕೆ ಹೋಗಿ","ನೇರ ಲಗ್ನ","ನಿಲ್ಲಿಸಿ","ನೇರ ಮುಂದುವರಿಸಿ","ಪಠ್ಯವಾಗಿ ನಕಲಿಸಿ","ತೋರಿಸಿ","ದಿನಾಂಕ","ಸಮಯ","ರದ್ದು","ಉಳಿಸಿ","ನಿಲ್ಲಿಸಿ","ಧ್ವನಿ","ನಿಯಮಗಳು","ಫಲಿತಾಂಶಗಳು","ರಾಶಿ ಚಕ್ರ","ನವಾಂಶ (D-9)","ಕೆಪಿ ಭಾವ ಚಕ್ರ","ಭಾವ ಕಸ್ಪ್ ಚಕ್ರ","ಗ್ರಹ","ಸ್ಥಾನ","ನಕ್ಷತ್ರ","ರಾಶಿ","ರಾಶ್ಯಧಿಪತಿ","ನಕ್ಷತ್ರಾಧಿಪತಿ","ಉಪಾಧಿಪತಿ","ಭಾವ","ಅಂಶ","ಉದಯ","ವಿಕೆಟ್ ಸಾಧ್ಯತೆ","ಜಾಹೀರಾತು ವಿರಾಮ","ವಿಕೆಟ್, ವಿರಾಮ ಸಮಯ ಹುಡುಕಿ","ಕುಂಡಲಿ ಲೆಕ್ಕಹಾಕಿ","ಈ ಕುಂಡಲಿ ಉಳಿಸಿ","ಜ್ಯೋತಿಷ ನಕ್ಷೆ","ಮುಖ್ಯ ಸೂಚನೆ","ಕಳೆದುಹೋದದ್ದು ಸಿಕ್ಕಿದ್ದು","ಕ್ರಿಕೆಟ್ ವಿಕೆಟ್ ಮತ್ತು ವಿರಾಮ","ಪ್ರಸ್ತುತ ಗೋಚಾರ ಸಮಯ","ಎಲ್ಲಾ ಮಾಹಿತಿ ನಕಲಿಸಿ","ಮುದ್ರಿಸಿ / PDF ಉಳಿಸಿ","ಫೈಲ್ ಉಳಿಸಿ / ಹಂಚಿ","ಲಗ್ನ","ನೇರ","ಯಶಸ್ಸು","3 11 ಮುಹೂರ್ತ","ಟ್ರೇಡ್ ಲಾಭ","ಮಾರುಕಟ್ಟೆ ಗೋಚಾರ","ನೇರ ಗೋಚಾರ ಗಡಿಯಾರ","ಅನಲಾಗ್","ಡಿಜಿಟಲ್","ಪೂರ್ಣ ಪರದೆ","ಸ್ಥಳ","ಮುಹೂರ್ತ ಅಲಾರಂಗಳು","ಅಲಾರಂ ಹೊಂದಿಸಿ","ಆರಂಭ","ಅಂತ್ಯ","ಗ್ರಹ","ರಾಶಿ","ಇತ್ತೀಚಿನ ಸ್ಥಳಗಳು","ಅಕ್ಷರ ಗಾತ್ರ","ಅಕ್ಷರ ಶೈಲಿ","ಮುನ್ಸೂಚನೆ","ಏರಿಕೆ","ಇಳಿಕೆ","ತಟಸ್ಥ","ಮಾರುಕಟ್ಟೆ ಮುನ್ಸೂಚನೆಗಳು","ಸ್ಥಳವನ್ನು ಆಯ್ಕೆಮಾಡಿ","ಇಂದು"]},"ml":{"n":"മലയാളം","P":["സൂര്യൻ","ചന്ദ്രൻ","ചൊവ്വ","ബുധൻ","വ്യാഴം","ശുക്രൻ","ശനി","രാഹു","കേതു"],"Q":["സൂ","ച","ചൊ","ബു","വ്യാ","ശു","ശ","രാ","കേ"],"S":["മേടം","ഇടവം","മിഥുനം","കർക്കടകം","ചിങ്ങം","കന്നി","തുലാം","വൃശ്ചികം","ധനു","മകരം","കുംഭം","മീനം"],"A":"ല","U":["ഉപകരണങ്ങൾ","ജിഎംപി പ്രശ്നം","ജനന ജാതകം","ജ്യോതിഷ ഭൂപടം","ചന്ദ്ര മുഹൂർത്തം","തീയതി പരിധി മുഹൂർത്തം","ധനാകർഷണം","ലോട്ടറി നിയമങ്ങൾ","ക്രിക്കറ്റ് വിക്കറ്റ്","ഭാവ കസ്പ് ചാർട്ട്","നഷ്ടപ്പെട്ടതും കിട്ടിയതും","കുതിരപ്പന്തയം","ധനലാഭ മുഹൂർത്തം","ഊഹ ഗവേഷണം","ഭൂകമ്പ ഗവേഷണം","ഹോററി ഉത്തരങ്ങൾ","പ്രായോഗിക മുഹൂർത്തം","ഈ ആപ്പിനെക്കുറിച്ച്","ലഗ്ന സമയങ്ങൾ","ഗോചര ചക്രം","ഇത് എങ്ങനെ പ്രവർത്തിക്കുന്നു","രാജ്യം","സംസ്ഥാനം","നഗരം / പട്ടണം","അക്ഷാംശം","രേഖാംശം","സമയ മേഖല","UTC വ്യത്യാസം","അയനാംശം","മുതൽ","വരെ","എന്റെ സ്ഥലം ഉപയോഗിക്കുക","പേര്","ജനന തീയതി","ജനന സമയം","ചാർട്ട് ശൈലി","ഭാഷ","ദക്ഷിണേന്ത്യൻ","ഉത്തരേന്ത്യൻ","രണ്ട് ചാർട്ടുകളും","ലഗ്ന ചലനം പ്ലേ ചെയ്യുക","ഇപ്പോഴത്തേക്ക് പോകുക","തത്സമയ ലഗ്നം","നിർത്തുക","തത്സമയം തുടരുക","ടെക്സ്റ്റായി പകർത്തുക","കാണിക്കുക","തീയതി","സമയം","റദ്ദാക്കുക","സേവ് ചെയ്യുക","നിർത്തുക","ശബ്ദം","നിയമങ്ങൾ","കണ്ടെത്തലുകൾ","രാശി ചക്രം","നവാംശം (D-9)","കെപി ഭാവ ചക്രം","ഭാവ കസ്പ് ചക്രം","ഗ്രഹം","സ്ഥാനം","നക്ഷത്രം","രാശി","രാശ്യാധിപൻ","നക്ഷത്രാധിപൻ","ഉപാധിപൻ","ഭാവം","ഡിഗ്രി","ഉദയം","വിക്കറ്റ് സാധ്യത","പരസ്യ ഇടവേള","വിക്കറ്റ്, ഇടവേള സമയങ്ങൾ കണ്ടെത്തുക","ജാതകം കണക്കാക്കുക","ഈ ജാതകം സേവ് ചെയ്യുക","ജ്യോതിഷ ഭൂപടം","പ്രധാന അറിയിപ്പ്","നഷ്ടപ്പെട്ടതും കിട്ടിയതും","ക്രിക്കറ്റ് വിക്കറ്റും ഇടവേളകളും","നിലവിലെ ഗോചര സമയം","എല്ലാ വിവരങ്ങളും പകർത്തുക","പ്രിന്റ് / PDF സേവ്","ഫയൽ സേവ് / പങ്കിടുക","ലഗ്നം","തത്സമയം","വിജയം","3 11 മുഹൂർത്തം","ട്രേഡ് ലാഭം","മാർക്കറ്റ് ഗോചരം","തത്സമയ ഗോചര ക്ലോക്ക്","അനലോഗ്","ഡിജിറ്റൽ","പൂർണ്ണസ്ക്രീൻ","സ്ഥലം","മുഹൂർത്ത അലാറങ്ങൾ","അലാറങ്ങൾ സജ്ജമാക്കുക","ആരംഭം","അവസാനം","ഗ്രഹം","രാശി","സമീപകാല സ്ഥലങ്ങൾ","അക്ഷര വലുപ്പം","അക്ഷര ശൈലി","പ്രവചനം","ഉയർച്ച","താഴ്ച","നിഷ്പക്ഷം","മാർക്കറ്റ് പ്രവചനങ്ങൾ","സ്ഥലം തിരഞ്ഞെടുക്കുക","ഇന്ന്"]},"mr":{"n":"मराठी","P":["सूर्य","चंद्र","मंगळ","बुध","गुरू","शुक्र","शनी","राहू","केतू"],"Q":["सू","चं","मं","बु","गु","शु","श","रा","के"],"S":["मेष","वृषभ","मिथुन","कर्क","सिंह","कन्या","तूळ","वृश्चिक","धनू","मकर","कुंभ","मीन"],"A":"ल","U":["साधने","जीएमपी प्रश्न","जन्मकुंडली","ज्योतिष नकाशा","चंद्र मुहूर्त","तारीख श्रेणी मुहूर्त","धन आकर्षण","लॉटरी नियम","क्रिकेट विकेट","भाव कस्प तक्ता","हरवले-सापडले","घोड्यांची शर्यत","धनलाभ मुहूर्त","सट्टा संशोधन","भूकंप संशोधन","होररी उत्तरे","व्यावहारिक मुहूर्त","या अ‍ॅपबद्दल","लग्न वेळा","गोचर कुंडली","हे कसे कार्य करते","देश","राज्य","शहर / गाव","अक्षांश","रेखांश","वेळ क्षेत्र","UTC फरक","अयनांश","पासून","पर्यंत","माझे स्थान वापरा","नाव","जन्म तारीख","जन्म वेळ","तक्त्याची शैली","भाषा","दक्षिण भारतीय","उत्तर भारतीय","दोन्ही तक्ते","लग्न गती चालवा","आताच्या वेळेवर जा","थेट लग्न","थांबवा","थेट पुन्हा सुरू करा","मजकूर म्हणून कॉपी करा","दाखवा","तारीख","वेळ","रद्द करा","जतन करा","थांबवा","ध्वनी","नियम","निष्कर्ष","रास कुंडली","नवांश (D-9)","केपी भाव कुंडली","भाव कस्प कुंडली","ग्रह","स्थान","नक्षत्र","रास","रास स्वामी","नक्षत्र स्वामी","उप स्वामी","भाव","अंश","उदय","विकेटची शक्यता","जाहिरात विश्रांती","विकेट व विश्रांतीच्या वेळा शोधा","कुंडली काढा","ही कुंडली जतन करा","ज्योतिष नकाशा","महत्त्वाची सूचना","हरवले-सापडले","क्रिकेट विकेट आणि विश्रांती","सध्याची गोचर वेळ","सर्व माहिती कॉपी करा","प्रिंट / PDF जतन करा","फाइल जतन करा / शेअर करा","लग्न","थेट","यशस्वी","3 11 मुहूर्त","ट्रेड नफा","मार्केट गोचर","थेट गोचर घड्याळ","ॲनालॉग","डिजिटल","पूर्ण स्क्रीन","ठिकाण","मुहूर्त अलार्म","अलार्म सेट करा","सुरुवात","शेवट","ग्रह","रास","अलीकडील ठिकाणे","अक्षर आकार","अक्षर शैली","अंदाज","तेजी","मंदी","तटस्थ","बाजार अंदाज","ठिकाण निवडा","आज"]},"gu":{"n":"ગુજરાતી","P":["સૂર્ય","ચંદ્ર","મંગળ","બુધ","ગુરુ","શુક્ર","શનિ","રાહુ","કેતુ"],"Q":["સૂ","ચં","મં","બુ","ગુ","શુ","શ","રા","કે"],"S":["મેષ","વૃષભ","મિથુન","કર્ક","સિંહ","કન્યા","તુલા","વૃશ્ચિક","ધન","મકર","કુંભ","મીન"],"A":"લ","U":["સાધનો","જીએમપી પ્રશ્ન","જન્મકુંડળી","જ્યોતિષ નકશો","ચંદ્ર મુહૂર્ત","તારીખ શ્રેણી મુહૂર્ત","ધન આકર્ષણ","લોટરી નિયમો","ક્રિકેટ વિકેટ","ભાવ કસ્પ ચાર્ટ","ખોવાયેલું-મળેલું","ઘોડાની દોડ","ધનલાભ મુહૂર્ત","સટ્ટા સંશોધન","ભૂકંપ સંશોધન","હોરરી જવાબો","વ્યવહારુ મુહૂર્ત","આ એપ વિશે","લગ્ન સમય","ગોચર કુંડળી","આ કેવી રીતે કામ કરે છે","દેશ","રાજ્ય","શહેર / નગર","અક્ષાંશ","રેખાંશ","સમય ઝોન","UTC તફાવત","અયનાંશ","થી","સુધી","મારું સ્થાન વાપરો","નામ","જન્મ તારીખ","જન્મ સમય","ચાર્ટ શૈલી","ભાષા","દક્ષિણ ભારતીય","ઉત્તર ભારતીય","બંને ચાર્ટ","લગ્ન ગતિ ચલાવો","હમણાં પર જાઓ","જીવંત લગ્ન","રોકો","જીવંત ફરી શરૂ કરો","ટેક્સ્ટ તરીકે કૉપિ કરો","બતાવો","તારીખ","સમય","રદ કરો","સાચવો","રોકો","અવાજ","નિયમો","તારણો","રાશિ કુંડળી","નવાંશ (D-9)","કેપી ભાવ કુંડળી","ભાવ કસ્પ કુંડળી","ગ્રહ","સ્થાન","નક્ષત્ર","રાશિ","રાશિ સ્વામી","નક્ષત્ર સ્વામી","ઉપ સ્વામી","ભાવ","અંશ","ઉદય","વિકેટની શક્યતા","જાહેરાત વિરામ","વિકેટ અને વિરામનો સમય શોધો","કુંડળી ગણો","આ કુંડળી સાચવો","જ્યોતિષ નકશો","મહત્વની સૂચના","ખોવાયેલું-મળેલું","ક્રિકેટ વિકેટ અને વિરામ","હાલનો ગોચર સમય","બધો ડેટા કૉપિ કરો","પ્રિન્ટ / PDF સાચવો","ફાઇલ સાચવો / શેર કરો","લગ્ન","જીવંત","સફળતા","3 11 મુહૂર્ત","ટ્રેડ નફો","માર્કેટ ગોચર","લાઇવ ગોચર ઘડિયાળ","એનાલોગ","ડિજિટલ","પૂર્ણ સ્ક્રીન","સ્થળ","મુહૂર્ત એલાર્મ","એલાર્મ સેટ કરો","શરૂઆત","અંત","ગ્રહ","રાશિ","તાજેતરનાં સ્થળો","અક્ષર કદ","અક્ષર શૈલી","આગાહી","તેજી","મંદી","તટસ્થ","બજાર આગાહીઓ","સ્થળ પસંદ કરો","આજે"]},"bn":{"n":"বাংলা","P":["সূর্য","চন্দ্র","মঙ্গল","বুধ","বৃহস্পতি","শুক্র","শনি","রাহু","কেতু"],"Q":["সূ","চ","ম","বু","বৃ","শু","শ","রা","কে"],"S":["মেষ","বৃষ","মিথুন","কর্কট","সিংহ","কন্যা","তুলা","বৃশ্চিক","ধনু","মকর","কুম্ভ","মীন"],"A":"ল","U":["সরঞ্জাম","জিএমপি প্রশ্ন","জন্মকুণ্ডলী","জ্যোতিষ মানচিত্র","চন্দ্র মুহূর্ত","তারিখ সীমা মুহূর্ত","অর্থ আকর্ষণ","লটারি নিয়ম","ক্রিকেট উইকেট","ভাব কাস্প চার্ট","হারানো-পাওয়া","ঘোড়দৌড়","অর্থলাভ মুহূর্ত","অনুমান গবেষণা","ভূমিকম্প গবেষণা","হোরারি উত্তর","ব্যবহারিক মুহূর্ত","এই অ্যাপ সম্পর্কে","লগ্ন সময়","গোচর চক্র","এটি কীভাবে কাজ করে","দেশ","রাজ্য / প্রদেশ","শহর / নগর","অক্ষাংশ","দ্রাঘিমাংশ","সময় অঞ্চল","UTC পার্থক্য","অয়নাংশ","থেকে","পর্যন্ত","আমার অবস্থান ব্যবহার করুন","নাম","জন্ম তারিখ","জন্ম সময়","চার্টের ধরন","ভাষা","দক্ষিণ ভারতীয়","উত্তর ভারতীয়","দুটি চার্টই","লগ্ন গতি চালান","এখনকার সময়ে যান","সরাসরি লগ্ন","থামান","সরাসরি আবার চালু করুন","লেখা হিসেবে কপি করুন","দেখান","তারিখ","সময়","বাতিল","সংরক্ষণ","থামান","শব্দ","নিয়ম","ফলাফল","রাশি চক্র","নবাংশ (D-9)","কেপি ভাব চক্র","ভাব কাস্প চক্র","গ্রহ","অবস্থান","নক্ষত্র","রাশি","রাশি অধিপতি","নক্ষত্র অধিপতি","উপ অধিপতি","ভাব","অংশ","উদয়","উইকেটের সম্ভাবনা","বিজ্ঞাপন বিরতি","উইকেট ও বিরতির সময় খুঁজুন","জন্মকুণ্ডলী গণনা করুন","এই কুণ্ডলী সংরক্ষণ করুন","জ্যোতিষ মানচিত্র","গুরুত্বপূর্ণ বিজ্ঞপ্তি","হারানো-পাওয়া","ক্রিকেট উইকেট ও বিরতি","বর্তমান গোচর সময়","সব তথ্য কপি করুন","প্রিন্ট / PDF সংরক্ষণ","ফাইল সংরক্ষণ / শেয়ার","লগ্ন","সরাসরি","সফল","3 11 মুহূর্ত","ট্রেড লাভ","মার্কেট গোচর","লাইভ গোচর ঘড়ি","অ্যানালগ","ডিজিটাল","পূর্ণ পর্দা","স্থান","মুহূর্ত অ্যালার্ম","অ্যালার্ম সেট করুন","শুরু","শেষ","গ্রহ","রাশি","সাম্প্রতিক স্থান","অক্ষরের আকার","অক্ষরের ধরন","পূর্বাভাস","তেজি","মন্দা","নিরপেক্ষ","বাজার পূর্বাভাস","স্থান বেছে নিন","আজ"]},"pa":{"n":"ਪੰਜਾਬੀ","P":["ਸੂਰਜ","ਚੰਦਰ","ਮੰਗਲ","ਬੁੱਧ","ਗੁਰੂ","ਸ਼ੁੱਕਰ","ਸ਼ਨੀ","ਰਾਹੂ","ਕੇਤੂ"],"Q":["ਸੂ","ਚੰ","ਮੰ","ਬੁ","ਗੁ","ਸ਼ੁ","ਸ਼","ਰਾ","ਕੇ"],"S":["ਮੇਖ","ਬ੍ਰਿਖ","ਮਿਥੁਨ","ਕਰਕ","ਸਿੰਘ","ਕੰਨਿਆ","ਤੁਲਾ","ਬ੍ਰਿਸ਼ਚਕ","ਧਨੁ","ਮਕਰ","ਕੁੰਭ","ਮੀਨ"],"A":"ਲ","U":["ਸੰਦ","ਜੀਐਮਪੀ ਪ੍ਰਸ਼ਨ","ਜਨਮ ਕੁੰਡਲੀ","ਜੋਤਿਸ਼ ਨਕਸ਼ਾ","ਚੰਦਰ ਮਹੂਰਤ","ਤਾਰੀਖ਼ ਸੀਮਾ ਮਹੂਰਤ","ਧਨ ਖਿੱਚ","ਲਾਟਰੀ ਨਿਯਮ","ਕ੍ਰਿਕਟ ਵਿਕਟ","ਭਾਵ ਕੱਸਪ ਚਾਰਟ","ਗੁਆਚਿਆ-ਮਿਲਿਆ","ਘੋੜ ਦੌੜ","ਧਨ ਲਾਭ ਮਹੂਰਤ","ਸੱਟਾ ਖੋਜ","ਭੂਚਾਲ ਖੋਜ","ਹੋਰਰੀ ਜਵਾਬ","ਵਿਹਾਰਕ ਮਹੂਰਤ","ਇਸ ਐਪ ਬਾਰੇ","ਲਗਨ ਸਮੇਂ","ਗੋਚਰ ਚਾਰਟ","ਇਹ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ","ਦੇਸ਼","ਰਾਜ","ਸ਼ਹਿਰ / ਕਸਬਾ","ਅਕਸ਼ਾਂਸ਼","ਦੇਸ਼ਾਂਤਰ","ਸਮਾਂ ਖੇਤਰ","UTC ਫ਼ਰਕ","ਅਯਨਾਂਸ਼","ਤੋਂ","ਤੱਕ","ਮੇਰੀ ਥਾਂ ਵਰਤੋ","ਨਾਂ","ਜਨਮ ਤਾਰੀਖ਼","ਜਨਮ ਸਮਾਂ","ਚਾਰਟ ਸ਼ੈਲੀ","ਭਾਸ਼ਾ","ਦੱਖਣੀ ਭਾਰਤੀ","ਉੱਤਰੀ ਭਾਰਤੀ","ਦੋਵੇਂ ਚਾਰਟ","ਲਗਨ ਗਤੀ ਚਲਾਓ","ਹੁਣ ਤੇ ਜਾਓ","ਲਾਈਵ ਲਗਨ","ਰੋਕੋ","ਲਾਈਵ ਮੁੜ ਚਾਲੂ ਕਰੋ","ਟੈਕਸਟ ਵਜੋਂ ਕਾਪੀ ਕਰੋ","ਦਿਖਾਓ","ਤਾਰੀਖ਼","ਸਮਾਂ","ਰੱਦ ਕਰੋ","ਸੰਭਾਲੋ","ਰੋਕੋ","ਆਵਾਜ਼","ਨਿਯਮ","ਨਤੀਜੇ","ਰਾਸ਼ੀ ਚਾਰਟ","ਨਵਾਂਸ਼ (D-9)","ਕੇਪੀ ਭਾਵ ਚਾਰਟ","ਭਾਵ ਕੱਸਪ ਚਾਰਟ","ਗ੍ਰਹਿ","ਸਥਿਤੀ","ਨਕਸ਼ਤਰ","ਰਾਸ਼ੀ","ਰਾਸ਼ੀ ਸਵਾਮੀ","ਨਕਸ਼ਤਰ ਸਵਾਮੀ","ਉਪ ਸਵਾਮੀ","ਭਾਵ","ਅੰਸ਼","ਉਦੈ","ਵਿਕਟ ਦੀ ਸੰਭਾਵਨਾ","ਇਸ਼ਤਿਹਾਰ ਬ੍ਰੇਕ","ਵਿਕਟ ਅਤੇ ਬ੍ਰੇਕ ਦਾ ਸਮਾਂ ਲੱਭੋ","ਕੁੰਡਲੀ ਗਿਣੋ","ਇਹ ਕੁੰਡਲੀ ਸੰਭਾਲੋ","ਜੋਤਿਸ਼ ਨਕਸ਼ਾ","ਜ਼ਰੂਰੀ ਸੂਚਨਾ","ਗੁਆਚਿਆ-ਮਿਲਿਆ","ਕ੍ਰਿਕਟ ਵਿਕਟ ਅਤੇ ਬ੍ਰੇਕ","ਮੌਜੂਦਾ ਗੋਚਰ ਸਮਾਂ","ਸਾਰਾ ਡੇਟਾ ਕਾਪੀ ਕਰੋ","ਪ੍ਰਿੰਟ / PDF ਸੰਭਾਲੋ","ਫ਼ਾਈਲ ਸੰਭਾਲੋ / ਸਾਂਝੀ ਕਰੋ","ਲਗਨ","ਲਾਈਵ","ਸਫਲਤਾ","3 11 ਮੁਹੂਰਤ","ਟ੍ਰੇਡ ਮੁਨਾਫ਼ਾ","ਮਾਰਕੀਟ ਗੋਚਰ","ਲਾਈਵ ਗੋਚਰ ਘੜੀ","ਐਨਾਲੌਗ","ਡਿਜੀਟਲ","ਪੂਰੀ ਸਕਰੀਨ","ਥਾਂ","ਮੁਹੂਰਤ ਅਲਾਰਮ","ਅਲਾਰਮ ਲਗਾਓ","ਸ਼ੁਰੂ","ਅੰਤ","ਗ੍ਰਹਿ","ਰਾਸ਼ੀ","ਹਾਲੀਆ ਥਾਵਾਂ","ਅੱਖਰ ਦਾ ਆਕਾਰ","ਅੱਖਰ ਸ਼ੈਲੀ","ਭਵਿੱਖਬਾਣੀ","ਤੇਜ਼ੀ","ਮੰਦੀ","ਨਿਰਪੱਖ","ਮਾਰਕੀਟ ਭਵਿੱਖਬਾਣੀਆਂ","ਥਾਂ ਚੁਣੋ","ਅੱਜ"]},"or":{"n":"ଓଡ଼ିଆ","P":["ସୂର୍ଯ୍ୟ","ଚନ୍ଦ୍ର","ମଙ୍ଗଳ","ବୁଧ","ଗୁରୁ","ଶୁକ୍ର","ଶନି","ରାହୁ","କେତୁ"],"Q":["ସୂ","ଚ","ମ","ବୁ","ଗୁ","ଶୁ","ଶ","ରା","କେ"],"S":["ମେଷ","ବୃଷ","ମିଥୁନ","କର୍କଟ","ସିଂହ","କନ୍ୟା","ତୁଳା","ବୃଶ୍ଚିକ","ଧନୁ","ମକର","କୁମ୍ଭ","ମୀନ"],"A":"ଲ","U":["ଉପକରଣ","ଜିଏମପି ପ୍ରଶ୍ନ","ଜନ୍ମ କୁଣ୍ଡଳୀ","ଜ୍ୟୋତିଷ ମାନଚିତ୍ର","ଚନ୍ଦ୍ର ମୁହୂର୍ତ୍ତ","ତାରିଖ ସୀମା ମୁହୂର୍ତ୍ତ","ଧନ ଆକର୍ଷଣ","ଲଟେରି ନିୟମ","କ୍ରିକେଟ୍ ୱିକେଟ୍","ଭାବ କସ୍ପ ଚାର୍ଟ","ହଜିଥିବା-ମିଳିଥିବା","ଘୋଡ଼ା ଦୌଡ଼","ଧନଲାଭ ମୁହୂର୍ତ୍ତ","ଅନୁମାନ ଗବେଷଣା","ଭୂକମ୍ପ ଗବେଷଣା","ହୋରାରି ଉତ୍ତର","ବ୍ୟବହାରିକ ମୁହୂର୍ତ୍ତ","ଏହି ଆପ୍ ବିଷୟରେ","ଲଗ୍ନ ସମୟ","ଗୋଚର ଚକ୍ର","ଏହା କିପରି କାମ କରେ","ଦେଶ","ରାଜ୍ୟ","ସହର / ନଗର","ଅକ୍ଷାଂଶ","ଦ୍ରାଘିମା","ସମୟ ଅଞ୍ଚଳ","UTC ପାର୍ଥକ୍ୟ","ଅୟନାଂଶ","ଠାରୁ","ପର୍ଯ୍ୟନ୍ତ","ମୋ ସ୍ଥାନ ବ୍ୟବହାର କରନ୍ତୁ","ନାମ","ଜନ୍ମ ତାରିଖ","ଜନ୍ମ ସମୟ","ଚାର୍ଟ ଶୈଳୀ","ଭାଷା","ଦକ୍ଷିଣ ଭାରତୀୟ","ଉତ୍ତର ଭାରତୀୟ","ଦୁଇଟି ଚାର୍ଟ","ଲଗ୍ନ ଗତି ଚଳାନ୍ତୁ","ବର୍ତ୍ତମାନକୁ ଯାଆନ୍ତୁ","ଲାଇଭ୍ ଲଗ୍ନ","ବନ୍ଦ କରନ୍ତୁ","ଲାଇଭ୍ ପୁନଃ ଚାଳୁ","ଟେକ୍ସଟ୍ ଭାବେ କପି","ଦେଖାନ୍ତୁ","ତାରିଖ","ସମୟ","ବାତିଲ","ସେଭ୍","ବନ୍ଦ","ଧ୍ୱନି","ନିୟମ","ଫଳାଫଳ","ରାଶି ଚକ୍ର","ନବାଂଶ (D-9)","କେପି ଭାବ ଚକ୍ର","ଭାବ କସ୍ପ ଚକ୍ର","ଗ୍ରହ","ସ୍ଥିତି","ନକ୍ଷତ୍ର","ରାଶି","ରାଶି ଅଧିପତି","ନକ୍ଷତ୍ର ଅଧିପତି","ଉପ ଅଧିପତି","ଭାବ","ଅଂଶ","ଉଦୟ","ୱିକେଟ୍ ସମ୍ଭାବନା","ବିଜ୍ଞାପନ ବିରତି","ୱିକେଟ୍ ଓ ବିରତି ସମୟ ଖୋଜନ୍ତୁ","କୁଣ୍ଡଳୀ ଗଣନା","ଏହି କୁଣ୍ଡଳୀ ସେଭ୍","ଜ୍ୟୋତିଷ ମାନଚିତ୍ର","ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ସୂଚନା","ହଜିଥିବା-ମିଳିଥିବା","କ୍ରିକେଟ୍ ୱିକେଟ୍ ଓ ବିରତି","ବର୍ତ୍ତମାନ ଗୋଚର ସମୟ","ସମସ୍ତ ତଥ୍ୟ କପି","ପ୍ରିଣ୍ଟ / PDF ସେଭ୍","ଫାଇଲ୍ ସେଭ୍ / ଶେୟାର","ଲଗ୍ନ","ଲାଇଭ୍","ସଫଳତା","3 11 ମୁହୂର୍ତ୍ତ","ଟ୍ରେଡ୍ ଲାଭ","ମାର୍କେଟ୍ ଗୋଚର","ଲାଇଭ୍ ଗୋଚର ଘଡ଼ି","ଆନାଲଗ୍","ଡିଜିଟାଲ୍","ପୂର୍ଣ୍ଣ ସ୍କ୍ରିନ୍","ସ୍ଥାନ","ମୁହୂର୍ତ୍ତ ଆଲାର୍ମ","ଆଲାର୍ମ ସେଟ୍ କରନ୍ତୁ","ଆରମ୍ଭ","ଶେଷ","ଗ୍ରହ","ରାଶି","ସାମ୍ପ୍ରତିକ ସ୍ଥାନ","ଅକ୍ଷର ଆକାର","ଅକ୍ଷର ଶୈଳୀ","ପୂର୍ବାନୁମାନ","ତେଜି","ମନ୍ଦା","ନିରପେକ୍ଷ","ବଜାର ପୂର୍ବାନୁମାନ","ସ୍ଥାନ ବାଛନ୍ତୁ","ଆଜି"]},"ur":{"n":"اردو","P":["سورج","چاند","مریخ","عطارد","مشتری","زہرہ","زحل","راہو","کیتو"],"Q":["سو","چا","مر","عط","مش","زہ","زح","را","کی"],"S":["حمل","ثور","جوزا","سرطان","اسد","سنبلہ","میزان","عقرب","قوس","جدی","دلو","حوت"],"A":"لگ","U":["ٹولز","جی ایم پی پرشن","جنم کنڈلی","نجومی نقشہ","چندر مہورت","تاریخ کی حد مہورت","دولت کی کشش","لاٹری کے اصول","کرکٹ وکٹ","بھاو کسپ چارٹ","گمشدہ اور ملا ہوا","گھڑ دوڑ","مالی منافع مہورت","قیاسی تحقیق","زلزلہ تحقیق","ہوراری جوابات","عملی مہورت","اس ایپ کے بارے میں","لگن کے اوقات","گوچر چارٹ","یہ کیسے کام کرتا ہے","ملک","صوبہ","شہر / قصبہ","عرض البلد","طول البلد","ٹائم زون","UTC فرق","ایانامسا","سے","تک","میرا مقام استعمال کریں","نام","تاریخ پیدائش","وقت پیدائش","چارٹ کا انداز","زبان","جنوبی ہندوستانی","شمالی ہندوستانی","دونوں چارٹ","لگن کی حرکت چلائیں","اب پر جائیں","براہِ راست لگن","روکیں","براہِ راست دوبارہ شروع کریں","متن کے طور پر کاپی کریں","دکھائیں","تاریخ","وقت","منسوخ","محفوظ کریں","روکیں","آواز","اصول","نتائج","راشی چارٹ","نوانش (D-9)","کے پی بھاو چارٹ","بھاو کسپ چارٹ","سیارہ","مقام","نکشتر","برج","برج کا مالک","نکشتر کا مالک","ذیلی مالک","بھاو","درجہ","طلوع","وکٹ کا امکان","اشتہاری وقفہ","وکٹ اور وقفے کے اوقات تلاش کریں","جنم کنڈلی بنائیں","یہ کنڈلی محفوظ کریں","نجومی نقشہ","اہم اطلاع","گمشدہ اور ملا ہوا","کرکٹ وکٹ اور وقفے","موجودہ گوچر وقت","تمام ڈیٹا کاپی کریں","پرنٹ / PDF محفوظ کریں","فائل محفوظ / شیئر کریں","لگن","براہِ راست","کامیابی","3 11 مہورت","ٹریڈ منافع","مارکیٹ گوچر","لائیو گوچر گھڑی","اینالاگ","ڈیجیٹل","مکمل اسکرین","مقام","مہورت الارم","الارم لگائیں","آغاز","اختتام","سیارہ","راشی","حالیہ مقامات","حرف کا سائز","حرف کا انداز","پیش گوئی","تیزی","مندی","غیر جانبدار","مارکیٹ کی پیش گوئیاں","مقام منتخب کریں","آج"]},"ne":{"n":"नेपाली","P":["सूर्य","चन्द्र","मङ्गल","बुध","बृहस्पति","शुक्र","शनि","राहु","केतु"],"Q":["सू","चं","मं","बु","बृ","शु","श","रा","के"],"S":["मेष","वृष","मिथुन","कर्कट","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुम्भ","मीन"],"A":"ल","U":["उपकरणहरू","जीएमपी प्रश्न","जन्म कुण्डली","ज्योतिष नक्सा","चन्द्र मुहूर्त","मिति दायरा मुहूर्त","धन आकर्षण","लटरी नियम","क्रिकेट विकेट","भाव कस्प चार्ट","हराएको-भेटिएको","घोडा दौड","धनलाभ मुहूर्त","अनुमान अनुसन्धान","भूकम्प अनुसन्धान","होररी उत्तर","व्यावहारिक मुहूर्त","यस एपबारे","लग्न समय","गोचर कुण्डली","यसले कसरी काम गर्छ","देश","प्रदेश","सहर / नगर","अक्षांश","देशान्तर","समय क्षेत्र","UTC भिन्नता","अयनांश","देखि","सम्म","मेरो स्थान प्रयोग गर्नुहोस्","नाम","जन्म मिति","जन्म समय","चार्ट शैली","भाषा","दक्षिण भारतीय","उत्तर भारतीय","दुवै चार्ट","लग्न गति चलाउनुहोस्","अहिलेमा जानुहोस्","प्रत्यक्ष लग्न","रोक्नुहोस्","प्रत्यक्ष पुनः सुरु गर्नुहोस्","पाठको रूपमा प्रतिलिपि","देखाउनुहोस्","मिति","समय","रद्द गर्नुहोस्","सुरक्षित गर्नुहोस्","रोक्नुहोस्","ध्वनि","नियम","निष्कर्ष","राशि कुण्डली","नवांश (D-9)","केपी भाव कुण्डली","भाव कस्प कुण्डली","ग्रह","स्थिति","नक्षत्र","राशि","राशि स्वामी","नक्षत्र स्वामी","उप स्वामी","भाव","अंश","उदय","विकेटको सम्भावना","विज्ञापन विश्राम","विकेट र विश्रामको समय खोज्नुहोस्","कुण्डली गणना गर्नुहोस्","यो कुण्डली सुरक्षित गर्नुहोस्","ज्योतिष नक्सा","महत्त्वपूर्ण सूचना","हराएको-भेटिएको","क्रिकेट विकेट र विश्राम","हालको गोचर समय","सबै विवरण प्रतिलिपि","प्रिन्ट / PDF सुरक्षित","फाइल सुरक्षित / साझा","लग्न","प्रत्यक्ष","सफलता","3 11 मुहूर्त","ट्रेड नाफा","बजार गोचर","प्रत्यक्ष गोचर घडी","एनालग","डिजिटल","पूर्ण स्क्रिन","स्थान","मुहूर्त अलार्म","अलार्म सेट गर्नुहोस्","सुरु","अन्त्य","ग्रह","राशि","हालका स्थानहरू","अक्षर आकार","अक्षर शैली","पूर्वानुमान","तेजी","मन्दी","तटस्थ","बजार पूर्वानुमान","स्थान छान्नुहोस्","आज"]},"si":{"n":"සිංහල","P":["සූර්ය","චන්ද්‍ර","කුජ","බුධ","ගුරු","සිකුරු","සෙනසුරු","රාහු","කේතු"],"Q":["සූ","චං","කු","බු","ගු","සි","සෙ","රා","කේ"],"S":["මේෂ","වෘෂභ","මිථුන","කටක","සිංහ","කන්‍යා","තුලා","වෘශ්චික","ධනු","මකර","කුම්භ","මීන"],"A":"ල","U":["මෙවලම්","ජීඑම්පී ප්‍රශ්න","ජන්ම පත්‍රය","ජ්‍යොතිෂ සිතියම","චන්ද්‍ර මුහුර්තය","දින පරාස මුහුර්තය","ධන ආකර්ෂණය","ලොතරැයි නීති","ක්‍රිකට් විකට්","භාව කස්ප් සටහන","නැතිවූ-හමුවූ","අශ්ව ධාවන","ධන ලාභ මුහුර්තය","අනුමාන පර්යේෂණ","භූමිකම්පා පර්යේෂණ","හොරරි පිළිතුරු","ප්‍රායෝගික මුහුර්තය","මෙම යෙදුම ගැන","ලග්න වේලාවන්","ගෝචර සටහන","මෙය ක්‍රියා කරන ආකාරය","රට","පළාත","නගරය / ගම","අක්ෂාංශ","දේශාංශ","වේලා කලාපය","UTC වෙනස","අයනාංශ","සිට","දක්වා","මගේ ස්ථානය භාවිතා කරන්න","නම","උපන් දිනය","උපන් වේලාව","සටහන් විලාසය","භාෂාව","දකුණු ඉන්දීය","උතුරු ඉන්දීය","සටහන් දෙකම","ලග්න චලනය ධාවනය","දැන් වෙත යන්න","සජීවී ලග්නය","නවත්වන්න","සජීවී නැවත ආරම්භ කරන්න","පෙළ ලෙස පිටපත් කරන්න","පෙන්වන්න","දිනය","වේලාව","අවලංගු කරන්න","සුරකින්න","නවත්වන්න","ශබ්දය","නීති","සොයාගැනීම්","රාශි සටහන","නවාංශ (D-9)","කේපී භාව සටහන","භාව කස්ප් සටහන","ග්‍රහයා","පිහිටීම","නැකත","රාශිය","රාශි අධිපති","නැකත් අධිපති","උප අධිපති","භාවය","අංශක","උදාවීම","විකට් ඉඩකඩ","වෙළඳ ප්‍රචාර විවේකය","විකට් සහ විවේක වේලාවන් සොයන්න","ජන්ම පත්‍රය ගණනය කරන්න","මෙම සටහන සුරකින්න","ජ්‍යොතිෂ සිතියම","වැදගත් දැනුම්දීම","නැතිවූ-හමුවූ","ක්‍රිකට් විකට් සහ විවේක","වත්මන් ගෝචර වේලාව","සියලු දත්ත පිටපත් කරන්න","මුද්‍රණය / PDF සුරකින්න","ගොනුව සුරකින්න / බෙදාගන්න","ලග්නය","සජීවී","සාර්ථකයි","3 11 මුහුර්තය","වෙළඳ ලාභය","වෙළඳපොළ ගෝචරය","සජීවී ගෝචර ඔරලෝසුව","ඇනලොග්","ඩිජිටල්","පූර්ණ තිරය","ස්ථානය","මුහුර්ත අනතුරු ඇඟවීම්","අනතුරු ඇඟවීම් සකසන්න","ආරම්භය","අවසානය","ග්‍රහයා","රාශිය","මෑත ස්ථාන","අකුරු ප්‍රමාණය","අකුරු විලාසය","පුරෝකථනය","ඉහළ යාම","පහළ යාම","මධ්‍යස්ථ","වෙළඳපොළ පුරෝකථන","ස්ථානයක් තෝරන්න","අද"]},"sa":{"n":"संस्कृतम्","P":["सूर्यः","चन्द्रः","मङ्गलः","बुधः","गुरुः","शुक्रः","शनिः","राहुः","केतुः"],"Q":["सू","चं","मं","बु","गु","शु","श","रा","के"],"S":["मेषः","वृषभः","मिथुनम्","कर्कः","सिंहः","कन्या","तुला","वृश्चिकः","धनुः","मकरः","कुम्भः","मीनः"],"A":"ल","U":["साधनानि","जीएमपी प्रश्नः","जन्मकुण्डली","ज्योतिषमानचित्रम्","चन्द्रमुहूर्तः","तिथिपरिधिमुहूर्तः","धनाकर्षणम्","लॉटरीनियमाः","क्रिकेट् विकेट्","भावकस्पचक्रम्","नष्टलब्धम्","अश्वदौडः","धनलाभमुहूर्तः","अनुमानसंशोधनम्","भूकम्पसंशोधनम्","होरारीउत्तराणि","व्यावहारिकमुहूर्तः","अस्य विषये","लग्नकालाः","गोचरचक्रम्","इदं कथं कार्यं करोति","देशः","प्रदेशः","नगरम्","अक्षांशः","देशान्तरम्","कालक्षेत्रम्","UTC भेदः","अयनांशः","तः","पर्यन्तम्","मम स्थानं प्रयुङ्क्ताम्","नाम","जन्मतिथिः","जन्मकालः","चक्रशैली","भाषा","दक्षिणभारतीयम्","उत्तरभारतीयम्","उभे चक्रे","लग्नगतिं चालयतु","अधुना गच्छतु","साक्षात् लग्नम्","स्थगयतु","साक्षात् पुनः आरभताम्","पाठरूपेण प्रतिलिखतु","दर्शयतु","तिथिः","कालः","निरस्यतु","रक्षतु","स्थगयतु","ध्वनिः","नियमाः","निष्कर्षाः","राशिचक्रम्","नवांशः (D-9)","केपी भावचक्रम्","भावकस्पचक्रम्","ग्रहः","स्थितिः","नक्षत्रम्","राशिः","राश्यधिपः","नक्षत्राधिपः","उपाधिपः","भावः","अंशः","उदयः","विकेट्सम्भावना","विज्ञापनविरामः","विकेट्विरामकालान् अन्विष्यतु","जन्मकुण्डलीं गणयतु","इमां कुण्डलीं रक्षतु","ज्योतिषमानचित्रम्","महत्त्वपूर्णसूचना","नष्टलब्धम्","क्रिकेट् विकेट् विरामाश्च","वर्तमानगोचरकालः","सर्वं प्रतिलिखतु","मुद्रयतु / PDF रक्षतु","सञ्चिकां रक्षतु / प्रेषयतु","लग्नम्","साक्षात्","सफलता","3 11 मुहूर्तः","व्यापारलाभः","विपणिगोचरः","साक्षाद्गोचरघटिका","अनुरूपम्","अङ्कीयम्","पूर्णपटलम्","स्थानम्","मुहूर्तघण्टिकाः","घण्टिकाः स्थापय","आरम्भः","अन्तः","ग्रहः","राशिः","अधुनातनानि स्थानानि","अक्षरमानम्","अक्षरशैली","पूर्वानुमानम्","वृद्धिः","ह्रासः","तटस्थम्","विपणिपूर्वानुमानानि","स्थानं चिनुत","अद्य"]},"es":{"n":"Español","P":["Sol","Luna","Marte","Mercurio","Júpiter","Venus","Saturno","Rahu","Ketu"],"Q":["Sol","Lun","Mar","Mer","Júp","Ven","Sat","Rah","Ket"],"S":["Aries","Tauro","Géminis","Cáncer","Leo","Virgo","Libra","Escorpio","Sagitario","Capricornio","Acuario","Piscis"],"A":"Asc","U":["Herramientas","Prashna GMP","Carta natal","Astrocartografía","Muhurtham lunar","Muhurtham por rango de fechas","Manifestación del dinero","Reglas de lotería","Wicket de cricket","Carta de cúspides","Objetos perdidos","Carreras de caballos","Muhurtham de ganancia","Investigación especulativa","Investigación sísmica","Respuestas horarias","Muhurtham electivo práctico","Acerca de","Horarios del ascendente","Carta de tránsito","Cómo funciona","País","Estado / Provincia","Ciudad / Pueblo","Latitud","Longitud","Zona horaria","Diferencia UTC","Ayanamsa","Desde","Hasta","Usar mi ubicación","Nombre","Fecha de nacimiento","Hora de nacimiento","Estilo de carta","Idioma","Sudindia","Norindia","Ambas cartas","Reproducir movimiento del ascendente","Ir a ahora","Ascendente en vivo","Congelar","Reanudar en vivo","Copiar como texto","Mostrar","Fecha","Hora","Cancelar","Guardar","Detener","Sonido","Reglas","Resultados","Carta Rasi","Navamsa (D-9)","Carta de casas KP","Carta de cúspides (Bhava)","Cuerpo","Posición","Estrella","Signo","Regente del signo","Regente de estrella","Subregente","Casa","Grado","ascendente","Posibilidad de wicket","Pausa publicitaria","Buscar horas de wicket y pausas","Calcular carta natal","Guardar esta carta","Mapa astral","Aviso importante","Objetos perdidos","Wicket de cricket y pausas","Hora de tránsito actual","Copiar todos los datos","Imprimir / guardar PDF","Guardar / compartir archivo","Ascendente","EN VIVO","Éxito","Muhurtham 3 11","Beneficio comercial","Tránsito del mercado","Reloj de tránsito en vivo","Analógico","Digital","Pantalla completa","Ubicación","Alarmas de muhurtham","Configurar alarmas","Inicio","Fin","Planeta","Rasi","Lugares recientes","Tamaño de letra","Estilo de letra","Predicción","Alcista","Bajista","Neutral","Predicciones del mercado","Elegir un lugar","Hoy"]},"fr":{"n":"Français","P":["Soleil","Lune","Mars","Mercure","Jupiter","Vénus","Saturne","Rahu","Ketu"],"Q":["Sol","Lun","Mar","Mer","Jup","Vén","Sat","Rah","Ket"],"S":["Bélier","Taureau","Gémeaux","Cancer","Lion","Vierge","Balance","Scorpion","Sagittaire","Capricorne","Verseau","Poissons"],"A":"Asc","U":["Outils","Prashna GMP","Thème natal","Astrocartographie","Muhurtham lunaire","Muhurtham par période","Manifestation de l’argent","Règles de loterie","Guichet de cricket","Thème des cuspides","Objets trouvés","Courses de chevaux","Muhurtham de profit","Recherche spéculative","Recherche sismique","Réponses horaires","Muhurtham électif pratique","À propos","Horaires de l’ascendant","Thème de transit","Comment ça marche","Pays","État / Province","Ville","Latitude","Longitude","Fuseau horaire","Décalage UTC","Ayanamsa","De","À","Utiliser ma position","Nom","Date de naissance","Heure de naissance","Style de thème","Langue","Sud-indien","Nord-indien","Les deux thèmes","Lancer le mouvement de l’ascendant","Aller à maintenant","Ascendant en direct","Figer","Reprendre le direct","Copier en texte","Afficher","Date","Heure","Annuler","Enregistrer","Arrêter","Son","Règles","Résultats","Thème Rasi","Navamsa (D-9)","Thème des maisons KP","Thème des cuspides (Bhava)","Corps","Position","Étoile","Signe","Maître du signe","Maître de l’étoile","Sous-maître","Maison","Degré","ascendant","Possibilité de wicket","Pause publicitaire","Trouver les heures de wicket et de pause","Calculer le thème natal","Enregistrer ce thème","Carte astrale","Avis important","Objets trouvés","Wicket de cricket et pauses","Heure de transit actuelle","Copier toutes les données","Imprimer / enregistrer en PDF","Enregistrer / partager le fichier","Ascendant","EN DIRECT","Succès","Muhurtham 3 11","Profit de trading","Transit du marché","Horloge de transit en direct","Analogique","Numérique","Plein écran","Lieu","Alarmes de muhurtham","Régler les alarmes","Début","Fin","Planète","Rasi","Lieux récents","Taille de police","Style de police","Prévision","Haussier","Baissier","Neutre","Prévisions du marché","Choisir un lieu","Aujourd’hui"]},"de":{"n":"Deutsch","P":["Sonne","Mond","Mars","Merkur","Jupiter","Venus","Saturn","Rahu","Ketu"],"Q":["Son","Mon","Mar","Mer","Jup","Ven","Sat","Rah","Ket"],"S":["Widder","Stier","Zwillinge","Krebs","Löwe","Jungfrau","Waage","Skorpion","Schütze","Steinbock","Wassermann","Fische"],"A":"Asz","U":["Werkzeuge","GMP-Prashna","Geburtshoroskop","Astrokartographie","Mond-Muhurtham","Muhurtham nach Zeitraum","Geld-Manifestation","Lotterieregeln","Cricket-Wicket","Häuserspitzen-Horoskop","Fundsachen","Pferderennen","Gewinn-Muhurtham","Spekulationsforschung","Erdbebenforschung","Horary-Antworten","Praktisches Wahl-Muhurtham","Über","Aszendenten-Zeiten","Transit-Horoskop","So funktioniert es","Land","Bundesland / Provinz","Stadt / Ort","Breitengrad","Längengrad","Zeitzone","UTC-Abweichung","Ayanamsa","Von","Bis","Meinen Standort verwenden","Name","Geburtsdatum","Geburtszeit","Horoskopstil","Sprache","Südindisch","Nordindisch","Beide Horoskope","Aszendentenlauf abspielen","Zu jetzt springen","Live-Aszendent","Einfrieren","Live fortsetzen","Als Text kopieren","Anzeigen","Datum","Zeit","Abbrechen","Speichern","Stopp","Ton","Regeln","Ergebnisse","Rasi-Horoskop","Navamsa (D-9)","KP-Häuserhoroskop","Häuserspitzen-Horoskop (Bhava)","Körper","Position","Stern","Zeichen","Zeichenherrscher","Sternherrscher","Unterherrscher","Haus","Grad","aufsteigend","Wicket-Möglichkeit","Werbepause","Wicket- und Pausenzeiten finden","Geburtshoroskop berechnen","Dieses Horoskop speichern","Astro-Karte","Wichtiger Hinweis","Fundsachen","Cricket-Wicket und Pausen","Aktuelle Transitzeit","Alle Daten kopieren","Drucken / als PDF speichern","Datei speichern / teilen","Aszendent","LIVE","Erfolg","Muhurtham 3 11","Handelsgewinn","Markttransit","Live-Transituhr","Analog","Digital","Vollbild","Ort","Muhurtham-Wecker","Wecker stellen","Beginn","Ende","Planet","Rasi","Letzte Orte","Schriftgröße","Schriftart","Prognose","Bullisch","Bärisch","Neutral","Marktprognosen","Ort wählen","Heute"]},"pt":{"n":"Português","P":["Sol","Lua","Marte","Mercúrio","Júpiter","Vênus","Saturno","Rahu","Ketu"],"Q":["Sol","Lua","Mar","Mer","Júp","Vên","Sat","Rah","Ket"],"S":["Áries","Touro","Gêmeos","Câncer","Leão","Virgem","Libra","Escorpião","Sagitário","Capricórnio","Aquário","Peixes"],"A":"Asc","U":["Ferramentas","Prashna GMP","Mapa natal","Astrocartografia","Muhurtham lunar","Muhurtham por intervalo de datas","Manifestação do dinheiro","Regras da loteria","Wicket de críquete","Mapa de cúspides","Achados e perdidos","Corrida de cavalos","Muhurtham de lucro","Pesquisa especulativa","Pesquisa sísmica","Respostas horárias","Muhurtham eletivo prático","Sobre","Horários do ascendente","Mapa de trânsito","Como funciona","País","Estado / Província","Cidade / Vila","Latitude","Longitude","Fuso horário","Diferença UTC","Ayanamsa","De","Até","Usar minha localização","Nome","Data de nascimento","Hora de nascimento","Estilo do mapa","Idioma","Sul-indiano","Norte-indiano","Ambos os mapas","Reproduzir movimento do ascendente","Ir para agora","Ascendente ao vivo","Congelar","Retomar ao vivo","Copiar como texto","Mostrar","Data","Hora","Cancelar","Salvar","Parar","Som","Regras","Resultados","Mapa Rasi","Navamsa (D-9)","Mapa de casas KP","Mapa de cúspides (Bhava)","Corpo","Posição","Estrela","Signo","Regente do signo","Regente da estrela","Sub-regente","Casa","Grau","ascendente","Possibilidade de wicket","Intervalo comercial","Encontrar horários de wicket e intervalos","Calcular mapa natal","Salvar este mapa","Mapa astral","Aviso importante","Achados e perdidos","Wicket de críquete e intervalos","Hora de trânsito atual","Copiar todos os dados","Imprimir / salvar PDF","Salvar / compartilhar arquivo","Ascendente","AO VIVO","Sucesso","Muhurtham 3 11","Lucro de negociação","Trânsito do mercado","Relógio de trânsito ao vivo","Analógico","Digital","Tela cheia","Local","Alarmes de muhurtham","Definir alarmes","Início","Fim","Planeta","Rasi","Locais recentes","Tamanho da fonte","Estilo da fonte","Previsão","Em alta","Em baixa","Neutro","Previsões do mercado","Escolher um local","Hoje"]},"it":{"n":"Italiano","P":["Sole","Luna","Marte","Mercurio","Giove","Venere","Saturno","Rahu","Ketu"],"Q":["Sol","Lun","Mar","Mer","Gio","Ven","Sat","Rah","Ket"],"S":["Ariete","Toro","Gemelli","Cancro","Leone","Vergine","Bilancia","Scorpione","Sagittario","Capricorno","Acquario","Pesci"],"A":"Asc","U":["Strumenti","Prashna GMP","Tema natale","Astrocartografia","Muhurtham lunare","Muhurtham per intervallo di date","Manifestazione del denaro","Regole della lotteria","Wicket del cricket","Carta delle cuspidi","Oggetti smarriti","Corse di cavalli","Muhurtham di profitto","Ricerca speculativa","Ricerca sismica","Risposte orarie","Muhurtham elettivo pratico","Informazioni","Orari dell’ascendente","Carta dei transiti","Come funziona","Paese","Stato / Provincia","Città / Paese","Latitudine","Longitudine","Fuso orario","Differenza UTC","Ayanamsa","Da","A","Usa la mia posizione","Nome","Data di nascita","Ora di nascita","Stile della carta","Lingua","Sud-indiano","Nord-indiano","Entrambe le carte","Avvia movimento dell’ascendente","Vai ad adesso","Ascendente in diretta","Blocca","Riprendi in diretta","Copia come testo","Mostra","Data","Ora","Annulla","Salva","Ferma","Suono","Regole","Risultati","Carta Rasi","Navamsa (D-9)","Carta delle case KP","Carta delle cuspidi (Bhava)","Corpo","Posizione","Stella","Segno","Signore del segno","Signore della stella","Sotto-signore","Casa","Grado","ascendente","Possibilità di wicket","Pausa pubblicitaria","Trova orari di wicket e pause","Calcola tema natale","Salva questa carta","Mappa astrale","Avviso importante","Oggetti smarriti","Wicket del cricket e pause","Ora di transito attuale","Copia tutti i dati","Stampa / salva PDF","Salva / condividi file","Ascendente","IN DIRETTA","Successo","Muhurtham 3 11","Profitto di trading","Transito di mercato","Orologio dei transiti dal vivo","Analogico","Digitale","Schermo intero","Luogo","Sveglie muhurtham","Imposta le sveglie","Inizio","Fine","Pianeta","Rasi","Luoghi recenti","Dimensione carattere","Stile carattere","Previsione","Rialzista","Ribassista","Neutrale","Previsioni di mercato","Scegli un luogo","Oggi"]},"nl":{"n":"Nederlands","P":["Zon","Maan","Mars","Mercurius","Jupiter","Venus","Saturnus","Rahu","Ketu"],"Q":["Zon","Maa","Mar","Mer","Jup","Ven","Sat","Rah","Ket"],"S":["Ram","Stier","Tweelingen","Kreeft","Leeuw","Maagd","Weegschaal","Schorpioen","Boogschutter","Steenbok","Waterman","Vissen"],"A":"Asc","U":["Hulpmiddelen","GMP-Prashna","Geboortehoroscoop","Astrokartografie","Maan-Muhurtham","Muhurtham per periode","Geldmanifestatie","Loterijregels","Cricketwicket","Huisspitsenkaart","Gevonden voorwerpen","Paardenrennen","Winst-Muhurtham","Speculatieonderzoek","Aardbevingsonderzoek","Horary-antwoorden","Praktische keuze-Muhurtham","Over","Ascendanttijden","Transitkaart","Hoe het werkt","Land","Staat / Provincie","Stad / Dorp","Breedtegraad","Lengtegraad","Tijdzone","UTC-verschil","Ayanamsa","Van","Tot","Mijn locatie gebruiken","Naam","Geboortedatum","Geboortetijd","Kaartstijl","Taal","Zuid-Indiaas","Noord-Indiaas","Beide kaarten","Ascendantbeweging afspelen","Naar nu gaan","Live ascendant","Bevriezen","Live hervatten","Kopiëren als tekst","Tonen","Datum","Tijd","Annuleren","Opslaan","Stoppen","Geluid","Regels","Bevindingen","Rasi-kaart","Navamsa (D-9)","KP-huizenkaart","Huisspitsenkaart (Bhava)","Lichaam","Positie","Ster","Teken","Tekenheerser","Sterheerser","Subheerser","Huis","Graad","opkomend","Kans op wicket","Reclamepauze","Wicket- en pauzetijden zoeken","Horoscoop berekenen","Deze kaart opslaan","Astrokaart","Belangrijke mededeling","Gevonden voorwerpen","Cricketwicket en pauzes","Huidige transittijd","Alle gegevens kopiëren","Afdrukken / opslaan als PDF","Bestand opslaan / delen","Ascendant","LIVE","Succes","Muhurtham 3 11","Handelswinst","Markttransit","Live transitklok","Analoog","Digitaal","Volledig scherm","Locatie","Muhurtham-wekkers","Wekkers instellen","Begin","Einde","Planeet","Rasi","Recente plaatsen","Lettergrootte","Lettertype","Voorspelling","Bullish","Bearish","Neutraal","Marktvoorspellingen","Kies een plaats","Vandaag"]},"sv":{"n":"Svenska","P":["Solen","Månen","Mars","Merkurius","Jupiter","Venus","Saturnus","Rahu","Ketu"],"Q":["Sol","Mån","Mar","Mer","Jup","Ven","Sat","Rah","Ket"],"S":["Väduren","Oxen","Tvillingarna","Kräftan","Lejonet","Jungfrun","Vågen","Skorpionen","Skytten","Stenbocken","Vattumannen","Fiskarna"],"A":"Asc","U":["Verktyg","GMP-Prashna","Födelsehoroskop","Astrokartografi","Måne-Muhurtham","Muhurtham för datumintervall","Pengamanifestation","Lotteriregler","Cricketwicket","Husspetskarta","Hittegods","Hästkapplöpning","Vinst-Muhurtham","Spekulationsforskning","Jordbävningsforskning","Horary-svar","Praktisk valt-Muhurtham","Om","Ascendenttider","Transitkarta","Så fungerar det","Land","Delstat / Provins","Stad / Ort","Latitud","Longitud","Tidszon","UTC-skillnad","Ayanamsa","Från","Till","Använd min plats","Namn","Födelsedatum","Födelsetid","Kartstil","Språk","Sydindisk","Nordindisk","Båda kartorna","Spela ascendentrörelse","Gå till nu","Live-ascendent","Frys","Återuppta live","Kopiera som text","Visa","Datum","Tid","Avbryt","Spara","Stopp","Ljud","Regler","Resultat","Rasi-karta","Navamsa (D-9)","KP-huskarta","Husspetskarta (Bhava)","Kropp","Position","Stjärna","Tecken","Teckenherre","Stjärnherre","Underherre","Hus","Grad","stigande","Chans till wicket","Reklampaus","Hitta wicket- och pauståder","Beräkna födelsehoroskop","Spara detta horoskop","Astrokarta","Viktigt meddelande","Hittegods","Cricketwicket och pauser","Aktuell transittid","Kopiera alla data","Skriv ut / spara som PDF","Spara / dela fil","Ascendent","LIVE","Framgång","Muhurtham 3 11","Handelsvinst","Marknadstransit","Live transitklocka","Analog","Digital","Helskärm","Plats","Muhurtham-alarm","Ställ in alarm","Start","Slut","Planet","Rasi","Senaste platser","Teckenstorlek","Teckensnitt","Prognos","Hausse","Baisse","Neutral","Marknadsprognoser","Välj en plats","Idag"]},"da":{"n":"Dansk","P":["Solen","Månen","Mars","Merkur","Jupiter","Venus","Saturn","Rahu","Ketu"],"Q":["Sol","Møn","Mar","Mer","Jup","Ven","Sat","Rah","Ket"],"S":["Vædderen","Tyren","Tvillingerne","Krebsen","Løven","Jomfruen","Vægten","Skorpionen","Skytten","Stenbukken","Vandmanden","Fiskene"],"A":"Asc","U":["Værktøjer","GMP-Prashna","Fødselshoroskop","Astrokartografi","Måne-Muhurtham","Muhurtham for datointerval","Pengemanifestation","Lotteriregler","Cricketwicket","Husspidskort","Hittegods","Hesteløb","Gevinst-Muhurtham","Spekulationsforskning","Jordskælvsforskning","Horary-svar","Praktisk valgt-Muhurtham","Om","Ascendenttider","Transitkort","Sådan virker det","Land","Stat / Provins","By / Sted","Breddegrad","Længdegrad","Tidszone","UTC-forskel","Ayanamsa","Fra","Til","Brug min placering","Navn","Fødselsdato","Fødselstidspunkt","Kortstil","Sprog","Sydindisk","Nordindisk","Begge kort","Afspil ascendentbevægelse","Gå til nu","Live ascendent","Frys","Genoptag live","Kopiér som tekst","Vis","Dato","Tid","Annuller","Gem","Stop","Lyd","Regler","Resultater","Rasi-kort","Navamsa (D-9)","KP-huskort","Husspidskort (Bhava)","Legeme","Position","Stjerne","Tegn","Tegnherre","Stjerneherre","Underherre","Hus","Grad","stigende","Mulighed for wicket","Reklamepause","Find wicket- og pausetidspunkter","Beregn fødselshoroskop","Gem dette kort","Astrokort","Vigtig meddelelse","Hittegods","Cricketwicket og pauser","Aktuel transittid","Kopiér alle data","Udskriv / gem som PDF","Gem / del fil","Ascendant","LIVE","Succes","Muhurtham 3 11","Handelsgevinst","Markedstransit","Live transitur","Analog","Digital","Fuld skærm","Sted","Muhurtham-alarmer","Indstil alarmer","Start","Slut","Planet","Rasi","Seneste steder","Skriftstørrelse","Skrifttype","Prognose","Optimistisk","Pessimistisk","Neutral","Markedsprognoser","Vælg et sted","I dag"]},"fi":{"n":"Suomi","P":["Aurinko","Kuu","Mars","Merkurius","Jupiter","Venus","Saturnus","Rahu","Ketu"],"Q":["Aur","Kuu","Mar","Mer","Jup","Ven","Sat","Rah","Ket"],"S":["Oinas","Härkä","Kaksoset","Rapu","Leijona","Neitsyt","Vaaka","Skorpioni","Jousimies","Kauris","Vesimies","Kalat"],"A":"Asc","U":["Työkalut","GMP-Prashna","Syntymäkartta","Astrokartografia","Kuu-Muhurtham","Päivämääräväli-Muhurtham","Rahan manifestointi","Arpajaissäännöt","Kriketin wicket","Huonekärkikartta","Löytötavarat","Hevoskilpailu","Voitto-Muhurtham","Spekulaatiotutkimus","Maanjäristystutkimus","Horary-vastaukset","Käytännöllinen valinta-Muhurtham","Tietoja","Nousevan merkin ajat","Transit-kartta","Miten se toimii","Maa","Osavaltio / Provinssi","Kaupunki / Kunta","Leveysaste","Pituusaste","Aikavyöhyke","UTC-ero","Ayanamsa","Alkaen","Asti","Käytä sijaintiani","Nimi","Syntymäpäivä","Syntymäaika","Kartan tyyli","Kieli","Eteläintialainen","Pohjoisintialainen","Molemmat kartat","Toista nousevan merkin liike","Siirry nykyhetkeen","Live-nouseva merkki","Pysäytä","Jatka live","Kopioi tekstinä","Näytä","Päivämäärä","Aika","Peruuta","Tallenna","Pysäytä","Ääni","Säännöt","Tulokset","Rasi-kartta","Navamsa (D-9)","KP-huonekartta","Huonekärkikartta (Bhava)","Taivaankappale","Asema","Tähti","Merkki","Merkin hallitsija","Tähden hallitsija","Alahallitsija","Huone","Aste","nouseva","Wicket-mahdollisuus","Mainostauko","Etsi wicket- ja taukoajat","Laske syntymäkartta","Tallenna tämä kartta","Astrokartta","Tärkeä ilmoitus","Löytötavarat","Kriketin wicket ja tauot","Nykyinen transit-aika","Kopioi kaikki tiedot","Tulosta / tallenna PDF","Tallenna / jaa tiedosto","Nouseva merkki","LIVE","Onnistui","Muhurtham 3 11","Kaupankäyntivoitto","Markkinakierto","Reaaliaikainen kiertokello","Analoginen","Digitaalinen","Koko näyttö","Sijainti","Muhurtham-hälytykset","Aseta hälytykset","Alku","Loppu","Planeetta","Rasi","Viimeisimmät paikat","Kirjasinkoko","Kirjasintyyli","Ennuste","Nouseva","Laskeva","Neutraali","Markkinaennusteet","Valitse paikka","Tänään"]},"pl":{"n":"Polski","P":["Słońce","Księżyc","Mars","Merkury","Jowisz","Wenus","Saturn","Rahu","Ketu"],"Q":["Sło","Ksi","Mar","Mer","Jow","Wen","Sat","Rah","Ket"],"S":["Baran","Byk","Bliźnięta","Rak","Lew","Panna","Waga","Skorpion","Strzelec","Koziorożec","Wodnik","Ryby"],"A":"Asc","U":["Narzędzia","GMP Prashna","Horoskop urodzeniowy","Astrokartografia","Muhurtham księżycowy","Muhurtham dla zakresu dat","Manifestacja pieniędzy","Zasady loterii","Wicket krykietowy","Wykres wierzchołków domów","Rzeczy znalezione","Wyścigi konne","Muhurtham zysku","Badania spekulacji","Badania trzęsień ziemi","Odpowiedzi horary","Praktyczny muhurtham wyboru","O aplikacji","Czasy ascendentu","Wykres tranzytów","Jak to działa","Kraj","Stan / Prowincja","Miasto / Miejscowość","Szerokość geograficzna","Długość geograficzna","Strefa czasowa","Różnica UTC","Ayanamsa","Od","Do","Użyj mojej lokalizacji","Imię","Data urodzenia","Godzina urodzenia","Styl wykresu","Język","Południowoindyjski","Północnoindyjski","Oba wykresy","Odtwórz ruch ascendentu","Przejdź do teraz","Ascendent na żywo","Zatrzymaj","Wznów na żywo","Kopiuj jako tekst","Pokaż","Data","Czas","Anuluj","Zapisz","Stop","Dźwięk","Zasady","Wyniki","Wykres Rasi","Navamsa (D-9)","Wykres domów KP","Wykres wierzchołków (Bhava)","Ciało","Pozycja","Gwiazda","Znak","Władca znaku","Władca gwiazdy","Pod-władca","Dom","Stopień","wschodzący","Możliwość wicketu","Przerwa reklamowa","Znajdź czasy wicketów i przerw","Oblicz horoskop urodzeniowy","Zapisz ten wykres","Mapa astrologiczna","Ważna informacja","Rzeczy znalezione","Wicket krykietowy i przerwy","Bieżący czas tranzytu","Kopiuj wszystkie dane","Drukuj / zapisz PDF","Zapisz / udostępnij plik","Ascendent","NA ŻYWO","Sukces","Muhurtham 3 11","Zysk z handlu","Tranzyt rynku","Zegar tranzytów na żywo","Analogowy","Cyfrowy","Pełny ekran","Lokalizacja","Alarmy muhurtham","Ustaw alarmy","Początek","Koniec","Planeta","Rasi","Ostatnie miejsca","Rozmiar czcionki","Styl czcionki","Prognoza","Wzrostowy","Spadkowy","Neutralny","Prognozy rynkowe","Wybierz miejsce","Dziś"]},"cs":{"n":"Čeština","P":["Slunce","Měsíc","Mars","Merkur","Jupiter","Venuše","Saturn","Rahu","Ketu"],"Q":["Slu","Měs","Mar","Mer","Jup","Ven","Sat","Rah","Ket"],"S":["Beran","Býk","Blíženci","Rak","Lev","Panna","Váhy","Štír","Střelec","Kozoroh","Vodnář","Ryby"],"A":"Asc","U":["Nástroje","GMP Prashna","Natální horoskop","Astrokartografie","Měsíční muhurtham","Muhurtham pro rozsah dat","Manifestace peněz","Pravidla loterie","Kriketová branka","Graf hrotů domů","Ztráty a nálezy","Dostihy","Ziskový muhurtham","Výzkum spekulací","Výzkum zemětřesení","Horary odpovědi","Praktický volební muhurtham","O aplikaci","Časy ascendentu","Tranzitní graf","Jak to funguje","Země","Stát / Provincie","Město / Obec","Zeměpisná šířka","Zeměpisná délka","Časové pásmo","Rozdíl UTC","Ayanamsa","Od","Do","Použít mou polohu","Jméno","Datum narození","Čas narození","Styl grafu","Jazyk","Jihoindický","Severoindický","Oba grafy","Přehrát pohyb ascendentu","Přejít na nyní","Živý ascendent","Zmrazit","Obnovit živě","Kopírovat jako text","Zobrazit","Datum","Čas","Zrušit","Uložit","Zastavit","Zvuk","Pravidla","Výsledky","Graf Rasi","Navamsa (D-9)","Graf domů KP","Graf hrotů domů (Bhava)","Těleso","Pozice","Hvězda","Znamení","Vládce znamení","Vládce hvězdy","Podvládce","Dům","Stupeň","vycházející","Možnost branky","Reklamní přestávka","Najít časy branek a přestávek","Vypočítat natální horoskop","Uložit tento graf","Astromapa","Důležité upozornění","Ztráty a nálezy","Kriketové branky a přestávky","Aktuální tranzitní čas","Kopírovat všechna data","Tisk / uložit PDF","Uložit / sdílet soubor","Ascendent","ŽIVĚ","Úspěch","Muhurtham 3 11","Obchodní zisk","Tranzit trhu","Živé tranzitní hodiny","Analogové","Digitální","Celá obrazovka","Poloha","Budíky muhurtham","Nastavit budíky","Začátek","Konec","Planeta","Rasi","Nedávná místa","Velikost písma","Styl písma","Předpověď","Býčí","Medvědí","Neutrální","Tržní předpovědi","Vyberte místo","Dnes"]},"ro":{"n":"Română","P":["Soare","Lună","Marte","Mercur","Jupiter","Venus","Saturn","Rahu","Ketu"],"Q":["Soa","Lun","Mar","Mer","Jup","Ven","Sat","Rah","Ket"],"S":["Berbec","Taur","Gemeni","Rac","Leu","Fecioară","Balanță","Scorpion","Săgetător","Capricorn","Vărsător","Pești"],"A":"Asc","U":["Instrumente","GMP Prashna","Hartă natală","Astrocartografie","Muhurtham lunar","Muhurtham pe interval de date","Manifestarea banilor","Regulile loteriei","Wicket de cricket","Hartă de cuspide","Obiecte pierdute","Curse de cai","Muhurtham de profit","Cercetare speculativă","Cercetare seismică","Răspunsuri horare","Muhurtham electiv practic","Despre","Orele ascendentului","Hartă de tranzit","Cum funcționează","Țara","Stat / Provincie","Oraș / Localitate","Latitudine","Longitudine","Fus orar","Diferență UTC","Ayanamsa","De la","Până la","Folosește locația mea","Nume","Data nașterii","Ora nașterii","Stilul hărții","Limbă","Sud-indian","Nord-indian","Ambele hărți","Redă mișcarea ascendentului","Mergi la acum","Ascendent în direct","Îngheață","Reia în direct","Copiază ca text","Arată","Data","Ora","Anulează","Salvează","Oprește","Sunet","Reguli","Rezultate","Harta Rasi","Navamsa (D-9)","Harta caselor KP","Harta cuspidelor (Bhava)","Corp","Poziție","Stea","Semn","Stăpânul semnului","Stăpânul stelei","Substăpân","Casă","Grad","ascendent","Posibilitate de wicket","Pauză publicitară","Găsește orele de wicket și pauză","Calculează harta natală","Salvează această hartă","Hartă astrală","Aviz important","Obiecte pierdute","Wicket de cricket și pauze","Ora curentă de tranzit","Copiază toate datele","Tipărește / salvează PDF","Salvează / partajează fișierul","Ascendent","LIVE","Succes","Muhurtham 3 11","Profit din tranzacționare","Tranzitul pieței","Ceas de tranzit în direct","Analogic","Digital","Ecran complet","Locație","Alarme muhurtham","Setează alarmele","Început","Sfârșit","Planetă","Rasi","Locuri recente","Dimensiune font","Stil font","Previziune","Optimist","Pesimist","Neutru","Previziuni de piață","Alege un loc","Astăzi"]},"hu":{"n":"Magyar","P":["Nap","Hold","Mars","Merkúr","Jupiter","Vénusz","Szaturnusz","Rahu","Ketu"],"Q":["Nap","Hol","Mar","Mer","Jup","Vén","Szat","Rah","Ket"],"S":["Kos","Bika","Ikrek","Rák","Oroszlán","Szűz","Mérleg","Skorpió","Nyilas","Bak","Vízöntő","Halak"],"A":"Asc","U":["Eszközök","GMP Prashna","Születési horoszkóp","Asztrokartográfia","Hold-Muhurtham","Dátumtartomány-Muhurtham","Pénz-manifesztáció","Lottószabályok","Krikett kapu","Házcsúcs-térkép","Talált tárgyak","Lóverseny","Nyereség-Muhurtham","Spekulációs kutatás","Földrengéskutatás","Horary válaszok","Gyakorlati választási Muhurtham","Névjegy","Aszcendens időpontok","Tranzit térkép","Hogyan működik","Ország","Állam / Tartomány","Város / Település","Szélesség","Hosszúság","Időzóna","UTC-eltérés","Ayanamsa","Tól","Ig","Saját helyzetem használata","Név","Születési dátum","Születési idő","Térkép stílusa","Nyelv","Dél-indiai","Észak-indiai","Mindkét térkép","Aszcendens mozgás lejátszása","Ugrás a mostra","Élő aszcendens","Befagyasztás","Élő folytatása","Másolás szövegként","Mutat","Dátum","Idő","Mégse","Mentés","Leállítás","Hang","Szabályok","Eredmények","Rasi térkép","Navamsa (D-9)","KP házak térképe","Házcsúcs-térkép (Bhava)","Égitest","Pozíció","Csillag","Jegy","Jegyuralkodó","Csillaguralkodó","Alúr","Ház","Fok","emelkedő","Kapu lehetősége","Reklámszünet","Kapu- és szünetidők keresése","Születési horoszkóp számítása","Térkép mentése","Asztrotérkép","Fontos közlemény","Talált tárgyak","Krikett kapu és szünetek","Jelenlegi tranzitidő","Minden adat másolása","Nyomtatás / mentés PDF-be","Fájl mentése / megosztása","Aszcendens","ÉLŐ","Siker","Muhurtham 3 11","Kereskedési nyereség","Piaci tranzit","Élő tranzitóra","Analóg","Digitális","Teljes képernyő","Hely","Muhurtham ébresztők","Ébresztők beállítása","Kezdet","Vég","Bolygó","Rasi","Legutóbbi helyek","Betűméret","Betűtípus","Előrejelzés","Emelkedő","Csökkenő","Semleges","Piaci előrejelzések","Válasszon helyet","Ma"]},"ru":{"n":"Русский","P":["Солнце","Луна","Марс","Меркурий","Юпитер","Венера","Сатурн","Раху","Кету"],"Q":["Сол","Лун","Мар","Мер","Юп","Вен","Сат","Рах","Кет"],"S":["Овен","Телец","Близнецы","Рак","Лев","Дева","Весы","Скорпион","Стрелец","Козерог","Водолей","Рыбы"],"A":"Асц","U":["Инструменты","GMP Прашна","Натальная карта","Астрокартография","Лунная мухурта","Мухурта по диапазону дат","Привлечение денег","Правила лотереи","Крикет, уикет","Карта куспидов","Бюро находок","Скачки","Мухурта прибыли","Исследование спекуляций","Исследование землетрясений","Хорарные ответы","Практическая мухурта","О программе","Время асцендента","Карта транзитов","Как это работает","Страна","Штат / Область","Город / Населённый пункт","Широта","Долгота","Часовой пояс","Смещение UTC","Аянамша","С","По","Использовать моё местоположение","Имя","Дата рождения","Время рождения","Стиль карты","Язык","Южноиндийская","Североиндийская","Обе карты","Запустить движение асцендента","Перейти к текущему","Асцендент в реальном времени","Заморозить","Возобновить","Копировать как текст","Показать","Дата","Время","Отмена","Сохранить","Стоп","Звук","Правила","Результаты","Карта Раши","Навамша (D-9)","Карта домов KP","Карта куспидов (Бхава)","Тело","Положение","Накшатра","Знак","Управитель знака","Управитель накшатры","Суб-управитель","Дом","Градус","восходящий","Возможность уикета","Рекламный перерыв","Найти время уикетов и перерывов","Рассчитать натальную карту","Сохранить эту карту","Астрокарта","Важное уведомление","Бюро находок","Крикет: уикеты и перерывы","Текущее время транзита","Копировать все данные","Печать / сохранить в PDF","Сохранить / отправить файл","Асцендент","ПРЯМО","Успех","Мухурта 3 11","Торговая прибыль","Транзит рынка","Живые часы транзитов","Аналоговые","Цифровые","Во весь экран","Местоположение","Будильники мухурты","Установить будильники","Начало","Конец","Планета","Раши","Недавние места","Размер шрифта","Стиль шрифта","Прогноз","Бычий","Медвежий","Нейтральный","Рыночные прогнозы","Выберите место","Сегодня"]},"uk":{"n":"Українська","P":["Сонце","Місяць","Марс","Меркурій","Юпітер","Венера","Сатурн","Раху","Кету"],"Q":["Сон","Міс","Мар","Мер","Юп","Вен","Сат","Рах","Кет"],"S":["Овен","Телець","Близнюки","Рак","Лев","Діва","Терези","Скорпіон","Стрілець","Козеріг","Водолій","Риби"],"A":"Асц","U":["Інструменти","GMP Прашна","Натальна карта","Астрокартографія","Місячна мухурта","Мухурта за діапазоном дат","Привернення грошей","Правила лотереї","Крикет, вікет","Карта куспідів","Бюро знахідок","Кінні перегони","Мухурта прибутку","Дослідження спекуляцій","Дослідження землетрусів","Хорарні відповіді","Практична мухурта","Про програму","Час асцендента","Карта транзитів","Як це працює","Країна","Штат / Область","Місто / Населений пункт","Широта","Довгота","Часовий пояс","Зсув UTC","Аянамша","Від","До","Використати моє місцезнаходження","Ім’я","Дата народження","Час народження","Стиль карти","Мова","Південноіндійська","Північноіндійська","Обидві карти","Запустити рух асцендента","Перейти до поточного","Асцендент наживо","Заморозити","Відновити","Копіювати як текст","Показати","Дата","Час","Скасувати","Зберегти","Стоп","Звук","Правила","Результати","Карта Раші","Навамша (D-9)","Карта домів KP","Карта куспідів (Бхава)","Тіло","Положення","Накшатра","Знак","Управитель знака","Управитель накшатри","Суб-управитель","Дім","Градус","висхідний","Можливість вікета","Рекламна перерва","Знайти час вікетів і перерв","Обчислити натальну карту","Зберегти цю карту","Астрокарта","Важливе повідомлення","Бюро знахідок","Крикет: вікети й перерви","Поточний час транзиту","Копіювати всі дані","Друк / зберегти в PDF","Зберегти / поділитися файлом","Асцендент","НАЖИВО","Успіх","Мухурта 3 11","Торговий прибуток","Транзит ринку","Живий годинник транзитів","Аналоговий","Цифровий","На весь екран","Місце","Будильники мухурти","Налаштувати будильники","Початок","Кінець","Планета","Раші","Нещодавні місця","Розмір шрифту","Стиль шрифту","Прогноз","Бичачий","Ведмежий","Нейтральний","Ринкові прогнози","Виберіть місце","Сьогодні"]},"el":{"n":"Ελληνικά","P":["Ήλιος","Σελήνη","Άρης","Ερμής","Δίας","Αφροδίτη","Κρόνος","Ράχου","Κέτου"],"Q":["Ηλι","Σελ","Άρη","Ερμ","Δία","Αφρ","Κρο","Ρά","Κέ"],"S":["Κριός","Ταύρος","Δίδυμοι","Καρκίνος","Λέων","Παρθένος","Ζυγός","Σκορπιός","Τοξότης","Αιγόκερως","Υδροχόος","Ιχθύες"],"A":"Άν","U":["Εργαλεία","GMP Πρασνά","Γενέθλιος χάρτης","Αστροχαρτογραφία","Σεληνιακό Μουχούρτα","Μουχούρτα εύρους ημερομηνιών","Έλξη χρημάτων","Κανόνες λαχείου","Κρίκετ γουίκετ","Χάρτης κορυφών οίκων","Απολεσθέντα","Ιπποδρομίες","Μουχούρτα κέρδους","Έρευνα κερδοσκοπίας","Έρευνα σεισμών","Ωροσκοπικές απαντήσεις","Πρακτικό Μουχούρτα","Σχετικά","Ώρες ωροσκόπου","Χάρτης διελεύσεων","Πώς λειτουργεί","Χώρα","Πολιτεία / Επαρχία","Πόλη / Κωμόπολη","Γεωγραφικό πλάτος","Γεωγραφικό μήκος","Ζώνη ώρας","Διαφορά UTC","Αγιανάμσα","Από","Έως","Χρήση της τοποθεσίας μου","Όνομα","Ημερομηνία γέννησης","Ώρα γέννησης","Στυλ χάρτη","Γλώσσα","Νοτιοϊνδικό","Βορειοϊνδικό","Και οι δύο χάρτες","Αναπαραγωγή κίνησης ωροσκόπου","Μετάβαση στο τώρα","Ζωντανός ωροσκόπος","Πάγωμα","Συνέχιση ζωντανά","Αντιγραφή ως κείμενο","Εμφάνιση","Ημερομηνία","Ώρα","Άκυρο","Αποθήκευση","Διακοπή","Ήχος","Κανόνες","Ευρήματα","Χάρτης Ράσι","Ναβάμσα (D-9)","Χάρτης οίκων KP","Χάρτης κορυφών (Μπάβα)","Σώμα","Θέση","Αστέρι","Ζώδιο","Άρχων ζωδίου","Άρχων αστεριού","Υπο-άρχων","Οίκος","Μοίρα","ανατέλλων","Πιθανότητα γουίκετ","Διαφημιστικό διάλειμμα","Εύρεση ωρών γουίκετ και διαλειμμάτων","Υπολογισμός γενέθλιου χάρτη","Αποθήκευση χάρτη","Αστροχάρτης","Σημαντική ειδοποίηση","Απολεσθέντα","Κρίκετ γουίκετ και διαλείμματα","Τρέχουσα ώρα διέλευσης","Αντιγραφή όλων των δεδομένων","Εκτύπωση / αποθήκευση PDF","Αποθήκευση / κοινοποίηση αρχείου","Ωροσκόπος","ΖΩΝΤΑΝΑ","Επιτυχία","Μουχούρτα 3 11","Κέρδος συναλλαγών","Διέλευση αγοράς","Ζωντανό ρολόι διελεύσεων","Αναλογικό","Ψηφιακό","Πλήρης οθόνη","Τοποθεσία","Ξυπνητήρια μουχούρτα","Ορισμός ξυπνητηριών","Έναρξη","Λήξη","Πλανήτης","Ρασί","Πρόσφατα μέρη","Μέγεθος γραμματοσειράς","Στυλ γραμματοσειράς","Πρόβλεψη","Ανοδικό","Καθοδικό","Ουδέτερο","Προβλέψεις αγοράς","Επιλέξτε μέρος","Σήμερα"]},"tr":{"n":"Türkçe","P":["Güneş","Ay","Mars","Merkür","Jüpiter","Venüs","Satürn","Rahu","Ketu"],"Q":["Gün","Ay","Mar","Mer","Jüp","Ven","Sat","Rah","Ket"],"S":["Koç","Boğa","İkizler","Yengeç","Aslan","Başak","Terazi","Akrep","Yay","Oğlak","Kova","Balık"],"A":"Yük","U":["Araçlar","GMP Prashna","Doğum haritası","Astrokartografi","Ay Muhurtham","Tarih aralığı Muhurtham","Para manifestosu","Piyango kuralları","Kriket kalesi","Ev uçları haritası","Kayıp eşya","At yarışı","Kazanç Muhurtham","Spekülasyon araştırması","Deprem araştırması","Horary yanıtları","Pratik seçim Muhurtham","Hakkında","Yükselen zamanları","Transit haritası","Nasıl çalışır","Ülke","Eyalet / İl","Şehir / İlçe","Enlem","Boylam","Saat dilimi","UTC farkı","Ayanamsa","Başlangıç","Bitiş","Konumumu kullan","Ad","Doğum tarihi","Doğum saati","Harita stili","Dil","Güney Hint","Kuzey Hint","Her iki harita","Yükselen hareketini oynat","Şimdiye git","Canlı yükselen","Dondur","Canlıyı sürdür","Metin olarak kopyala","Göster","Tarih","Saat","İptal","Kaydet","Durdur","Ses","Kurallar","Bulgular","Rasi haritası","Navamsa (D-9)","KP ev haritası","Ev uçları haritası (Bhava)","Gök cismi","Konum","Yıldız","Burç","Burç yöneticisi","Yıldız yöneticisi","Alt yönetici","Ev","Derece","yükselen","Kale düşme ihtimali","Reklam arası","Kale ve ara zamanlarını bul","Doğum haritasını hesapla","Bu haritayı kaydet","Astro harita","Önemli uyarı","Kayıp eşya","Kriket kalesi ve aralar","Şimdiki transit zamanı","Tüm verileri kopyala","Yazdır / PDF kaydet","Dosyayı kaydet / paylaş","Yükselen","CANLI","Başarı","Muhurtham 3 11","Ticaret karı","Piyasa transiti","Canlı transit saati","Analog","Dijital","Tam ekran","Konum","Muhurtham alarmları","Alarmları kur","Başlangıç","Bitiş","Gezegen","Rasi","Son yerler","Yazı boyutu","Yazı stili","Tahmin","Boğa","Ayı","Nötr","Piyasa tahminleri","Yer seçin","Bugün"]},"ar":{"n":"العربية","P":["الشمس","القمر","المريخ","عطارد","المشتري","الزهرة","زحل","راهو","كيتو"],"Q":["شم","قم","مر","عط","مش","زه","زح","را","كي"],"S":["الحمل","الثور","الجوزاء","السرطان","الأسد","العذراء","الميزان","العقرب","القوس","الجدي","الدلو","الحوت"],"A":"طا","U":["الأدوات","برشنا GMP","الخريطة الفلكية","الخرائط الفلكية الجغرافية","مهورتهام القمر","مهورتهام لنطاق التواريخ","جذب المال","قواعد اليانصيب","ويكيت الكريكيت","خريطة رؤوس البيوت","المفقودات","سباق الخيل","مهورتهام الربح","بحث المضاربة","بحث الزلازل","إجابات الهوراري","مهورتهام الاختيار العملي","حول","أوقات الطالع","خريطة العبور","كيف يعمل","الدولة","الولاية / المحافظة","المدينة / البلدة","خط العرض","خط الطول","المنطقة الزمنية","فرق UTC","أيانامسا","من","إلى","استخدم موقعي","الاسم","تاريخ الميلاد","وقت الميلاد","نمط الخريطة","اللغة","جنوب هندي","شمال هندي","الخريطتان معاً","تشغيل حركة الطالع","الانتقال إلى الآن","الطالع المباشر","تجميد","استئناف المباشر","نسخ كنص","عرض","التاريخ","الوقت","إلغاء","حفظ","إيقاف","الصوت","القواعد","النتائج","خريطة راسي","نافامسا (D-9)","خريطة بيوت KP","خريطة رؤوس البيوت (بهافا)","الجرم","الموضع","النجم","البرج","حاكم البرج","حاكم النجم","الحاكم الفرعي","البيت","الدرجة","الطالع","احتمال سقوط ويكيت","فاصل إعلاني","ابحث عن أوقات الويكيت والفواصل","احسب الخريطة الفلكية","احفظ هذه الخريطة","خريطة فلكية","إشعار مهم","المفقودات","ويكيت الكريكيت والفواصل","وقت العبور الحالي","نسخ كل البيانات","طباعة / حفظ PDF","حفظ / مشاركة الملف","الطالع","مباشر","نجاح","موهورتام 3 11","ربح التداول","عبور السوق","ساعة العبور المباشرة","تناظرية","رقمية","ملء الشاشة","الموقع","منبهات الموهورتام","ضبط المنبهات","البداية","النهاية","الكوكب","الراشي","الأماكن الأخيرة","حجم الخط","نمط الخط","التوقع","صاعد","هابط","محايد","توقعات السوق","اختر مكانًا","اليوم"]},"fa":{"n":"فارسی","P":["خورشید","ماه","مریخ","عطارد","مشتری","زهره","زحل","راهو","کتو"],"Q":["خو","ما","مر","عط","مش","زه","زح","را","کت"],"S":["حمل","ثور","جوزا","سرطان","اسد","سنبله","میزان","عقرب","قوس","جدی","دلو","حوت"],"A":"طا","U":["ابزارها","پرشنا GMP","زایچه تولد","نقشه نجومی","مهورتهام ماه","مهورتهام بازه تاریخ","جذب پول","قوانین قرعه‌کشی","ویکت کریکت","نمودار رأس خانه‌ها","اشیای گمشده","اسب‌دوانی","مهورتهام سود","پژوهش سفته‌بازی","پژوهش زلزله","پاسخ‌های هورری","مهورتهام انتخاب عملی","درباره","زمان‌های طالع","نمودار عبور","چگونه کار می‌کند","کشور","استان","شهر / شهرک","عرض جغرافیایی","طول جغرافیایی","منطقه زمانی","تفاوت UTC","آیانامسا","از","تا","استفاده از مکان من","نام","تاریخ تولد","ساعت تولد","سبک نمودار","زبان","هند جنوبی","هند شمالی","هر دو نمودار","پخش حرکت طالع","رفتن به اکنون","طالع زنده","ثابت کردن","ادامه زنده","کپی به‌صورت متن","نمایش","تاریخ","زمان","لغو","ذخیره","توقف","صدا","قوانین","یافته‌ها","نمودار راسی","نوامسا (D-9)","نمودار خانه‌های KP","نمودار رأس خانه‌ها (بهاوا)","جرم","موقعیت","ستاره","برج","حاکم برج","حاکم ستاره","زیرحاکم","خانه","درجه","طالع","احتمال ویکت","وقفه تبلیغاتی","یافتن زمان ویکت و وقفه","محاسبه زایچه تولد","ذخیره این نمودار","نقشه نجومی","اطلاعیه مهم","اشیای گمشده","ویکت کریکت و وقفه‌ها","زمان عبور کنونی","کپی همه داده‌ها","چاپ / ذخیره PDF","ذخیره / اشتراک فایل","طالع","زنده","موفقیت","موهورتا 3 11","سود معاملات","گذر بازار","ساعت زنده گذر","آنالوگ","دیجیتال","تمام‌صفحه","مکان","هشدارهای موهورتا","تنظیم هشدارها","شروع","پایان","سیاره","راشی","مکان‌های اخیر","اندازهٔ قلم","سبک قلم","پیش‌بینی","صعودی","نزولی","خنثی","پیش‌بینی‌های بازار","یک مکان انتخاب کنید","امروز"]},"he":{"n":"עברית","P":["שמש","ירח","מאדים","כוכב חמה","צדק","נוגה","שבתאי","ראהו","קטו"],"Q":["שמ","יר","מא","כו","צד","נו","שב","רא","קט"],"S":["טלה","שור","תאומים","סרטן","אריה","בתולה","מאזניים","עקרב","קשת","גדי","דלי","דגים"],"A":"עלי","U":["כלים","פראשנה GMP","מפת לידה","אסטרוקרטוגרפיה","מוהורתהם ירח","מוהורתהם לטווח תאריכים","משיכת כסף","כללי הגרלה","קריקט ויקט","מפת ראשי בתים","אבידות ומציאות","מירוצי סוסים","מוהורתהם רווח","מחקר ספקולציה","מחקר רעידות אדמה","תשובות הורארי","מוהורתהם בחירה מעשי","אודות","זמני האופק העולה","מפת מעברים","איך זה עובד","מדינה","מדינה / מחוז","עיר / יישוב","קו רוחב","קו אורך","אזור זמן","הפרש UTC","איינאמסה","מ־","עד","השתמש במיקום שלי","שם","תאריך לידה","שעת לידה","סגנון מפה","שפה","דרום הודי","צפון הודי","שתי המפות","הפעל תנועת אופק עולה","עבור לעכשיו","אופק עולה חי","הקפא","המשך חי","העתק כטקסט","הצג","תאריך","שעה","ביטול","שמור","עצור","צליל","כללים","ממצאים","מפת ראסי","נאוומשה (D-9)","מפת בתי KP","מפת ראשי בתים (בהאווה)","גוף","מיקום","כוכב","מזל","שליט המזל","שליט הכוכב","שליט משנה","בית","מעלה","עולה","סיכוי לוויקט","הפסקת פרסומות","מצא זמני ויקט והפסקות","חשב מפת לידה","שמור מפה זו","מפה אסטרולוגית","הודעה חשובה","אבידות ומציאות","קריקט ויקט והפסקות","זמן מעבר נוכחי","העתק את כל הנתונים","הדפס / שמור PDF","שמור / שתף קובץ","אסצנדנט","חי","הצלחה","מוהורתה 3 11","רווח מסחר","מעבר שוק","שעון מעבר חי","אנלוגי","דיגיטלי","מסך מלא","מיקום","התראות מוהורתה","הגדרת התראות","התחלה","סוף","כוכב לכת","ראשי","מקומות אחרונים","גודל גופן","סגנון גופן","תחזית","שורי","דובי","ניטרלי","תחזיות שוק","בחר מקום","היום"]},"zh":{"n":"中文（简体）","P":["太阳","月亮","火星","水星","木星","金星","土星","罗睺","计都"],"Q":["日","月","火","水","木","金","土","罗","计"],"S":["白羊座","金牛座","双子座","巨蟹座","狮子座","处女座","天秤座","天蝎座","射手座","摩羯座","水瓶座","双鱼座"],"A":"升","U":["工具","GMP 问卜","出生星盘","占星地图","月亮吉时","日期范围吉时","财富显化","彩票规则","板球门柱","宫头星盘","失物招领","赛马","获利吉时","投机研究","地震研究","时辰问卜解答","实用择日吉时","关于","上升时刻","行运星盘","使用方法","国家","州 / 省","城市 / 镇","纬度","经度","时区","UTC 偏移","岁差值","从","至","使用我的位置","姓名","出生日期","出生时间","星盘样式","语言","南印度式","北印度式","两种星盘","播放上升移动","跳到现在","实时上升","冻结","恢复实时","复制为文本","显示","日期","时间","取消","保存","停止","声音","规则","结果","拉西星盘","九分盘 (D-9)","KP 宫位星盘","宫头星盘 (Bhava)","天体","位置","星宿","星座","星座主星","星宿主星","副主星","宫","度数","上升","可能出现门柱倒下","广告插播","查找门柱与休息时间","计算出生星盘","保存此星盘","占星地图","重要声明","失物招领","板球门柱与休息","当前行运时间","复制全部数据","打印 / 保存为 PDF","保存 / 分享文件","上升点","实时","成功","3·11 吉时","交易获利","市场行运","实时行运时钟","模拟","数字","全屏","位置","吉时闹钟","设置闹钟","开始","结束","行星","星座宫","最近地点","字体大小","字体样式","预测","看涨","看跌","中性","市场预测","选择地点","今天"]},"zh-Hant":{"n":"中文（繁體）","P":["太陽","月亮","火星","水星","木星","金星","土星","羅睺","計都"],"Q":["日","月","火","水","木","金","土","羅","計"],"S":["白羊座","金牛座","雙子座","巨蟹座","獅子座","處女座","天秤座","天蠍座","射手座","摩羯座","水瓶座","雙魚座"],"A":"升","U":["工具","GMP 問卜","出生星盤","占星地圖","月亮吉時","日期範圍吉時","財富顯化","彩券規則","板球門柱","宮頭星盤","失物招領","賽馬","獲利吉時","投機研究","地震研究","時辰問卜解答","實用擇日吉時","關於","上升時刻","行運星盤","使用方法","國家","州 / 省","城市 / 鎮","緯度","經度","時區","UTC 偏移","歲差值","從","至","使用我的位置","姓名","出生日期","出生時間","星盤樣式","語言","南印度式","北印度式","兩種星盤","播放上升移動","跳到現在","即時上升","凍結","恢復即時","複製為文字","顯示","日期","時間","取消","儲存","停止","聲音","規則","結果","拉西星盤","九分盤 (D-9)","KP 宮位星盤","宮頭星盤 (Bhava)","天體","位置","星宿","星座","星座主星","星宿主星","副主星","宮","度數","上升","可能出現門柱倒下","廣告插播","查找門柱與休息時間","計算出生星盤","儲存此星盤","占星地圖","重要聲明","失物招領","板球門柱與休息","目前行運時間","複製全部資料","列印 / 儲存為 PDF","儲存 / 分享檔案","上升點","即時","成功","3·11 吉時","交易獲利","市場行運","即時行運時鐘","類比","數位","全螢幕","位置","吉時鬧鐘","設定鬧鐘","開始","結束","行星","星座宮","最近地點","字型大小","字型樣式","預測","看漲","看跌","中性","市場預測","選擇地點","今天"]},"ja":{"n":"日本語","P":["太陽","月","火星","水星","木星","金星","土星","ラーフ","ケートゥ"],"Q":["日","月","火","水","木","金","土","ラ","ケ"],"S":["牡羊座","牡牛座","双子座","蟹座","獅子座","乙女座","天秤座","蠍座","射手座","山羊座","水瓶座","魚座"],"A":"上昇","U":["ツール","GMP プラシュナ","出生チャート","アストロカートグラフィー","月のムフールタ","日付範囲ムフールタ","金運引き寄せ","宝くじルール","クリケットのウィケット","カスプチャート","落とし物","競馬","利益ムフールタ","投機研究","地震研究","ホラリー回答","実用ムフールタ","このアプリについて","アセンダント時刻","トランジットチャート","使い方","国","州 / 県","市 / 町","緯度","経度","タイムゾーン","UTC オフセット","アヤナムサ","開始","終了","現在地を使用","名前","生年月日","出生時刻","チャート形式","言語","南インド式","北インド式","両方のチャート","アセンダント移動を再生","現在へ移動","ライブアセンダント","固定","ライブ再開","テキストとしてコピー","表示","日付","時刻","キャンセル","保存","停止","サウンド","ルール","結果","ラシチャート","ナヴァムシャ (D-9)","KP ハウスチャート","カスプチャート (バーヴァ)","天体","位置","星宿","サイン","サインの支配星","星宿の支配星","サブ支配星","ハウス","度数","上昇","ウィケットの可能性","広告休憩","ウィケットと休憩の時刻を探す","出生チャートを計算","このチャートを保存","アストロマップ","重要なお知らせ","落とし物","クリケットのウィケットと休憩","現在のトランジット時刻","すべてのデータをコピー","印刷 / PDF 保存","ファイルを保存 / 共有","アセンダント","ライブ","成功","ムフルタ 3 11","トレード利益","マーケット・トランジット","ライブ・トランジット時計","アナログ","デジタル","全画面","場所","ムフルタのアラーム","アラームを設定","開始","終了","惑星","ラーシ","最近の場所","文字サイズ","フォントスタイル","予測","強気","弱気","中立","市場予測","場所を選択","今日"]},"ko":{"n":"한국어","P":["태양","달","화성","수성","목성","금성","토성","라후","케투"],"Q":["태","달","화","수","목","금","토","라","케"],"S":["양자리","황소자리","쌍둥이자리","게자리","사자자리","처녀자리","천칭자리","전갈자리","궁수자리","염소자리","물병자리","물고기자리"],"A":"상승","U":["도구","GMP 프라슈나","출생 차트","점성 지도","달 무후르타","날짜 범위 무후르타","재물 끌어당김","복권 규칙","크리켓 위킷","하우스 커스프 차트","분실물","경마","이익 무후르타","투기 연구","지진 연구","호라리 답변","실용 택일 무후르타","정보","상승점 시간","트랜짓 차트","사용 방법","국가","주 / 도","도시 / 읍","위도","경도","시간대","UTC 오프셋","아야남샤","시작","종료","내 위치 사용","이름","생년월일","출생 시간","차트 스타일","언어","남인도식","북인도식","두 차트 모두","상승점 이동 재생","현재로 이동","실시간 상승점","고정","실시간 계속","텍스트로 복사","표시","날짜","시간","취소","저장","중지","소리","규칙","결과","라시 차트","나밤샤 (D-9)","KP 하우스 차트","하우스 커스프 차트 (바바)","천체","위치","낙샤트라","사인","사인 지배성","별 지배성","하위 지배성","하우스","도","상승","위킷 가능성","광고 휴식","위킷 및 휴식 시간 찾기","출생 차트 계산","이 차트 저장","점성 지도","중요 공지","분실물","크리켓 위킷 및 휴식","현재 트랜짓 시간","모든 데이터 복사","인쇄 / PDF 저장","파일 저장 / 공유","어센던트","실시간","성공","무후르타 3 11","트레이드 수익","시장 트랜짓","실시간 트랜짓 시계","아날로그","디지털","전체 화면","위치","무후르타 알람","알람 설정","시작","종료","행성","라시","최근 장소","글꼴 크기","글꼴 스타일","예측","강세","약세","중립","시장 예측","장소 선택","오늘"]},"th":{"n":"ไทย","P":["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์","ราหู","เกตุ"],"Q":["อา","จ","อ","พ","พฤ","ศ","ส","รา","เก"],"S":["เมษ","พฤษภ","เมถุน","กรกฎ","สิงห์","กันย์","ตุลย์","พิจิก","ธนู","มังกร","กุมภ์","มีน"],"A":"ลัคน์","U":["เครื่องมือ","ประศนะ GMP","ดวงกำเนิด","แผนที่โหราศาสตร์","มุหูรตจันทร์","มุหูรตช่วงวันที่","ดึงดูดเงิน","กฎลอตเตอรี","วิคเก็ตคริกเก็ต","ผังจุดเริ่มเรือน","ของหายและของที่พบ","แข่งม้า","มุหูรตกำไร","วิจัยการเก็งกำไร","วิจัยแผ่นดินไหว","คำตอบโหราริ","มุหูรตเลือกฤกษ์ใช้งานจริง","เกี่ยวกับ","เวลาลัคนา","ผังจรทับ","ใช้งานอย่างไร","ประเทศ","รัฐ / จังหวัด","เมือง / ตำบล","ละติจูด","ลองจิจูด","เขตเวลา","ส่วนต่าง UTC","อายนางศะ","จาก","ถึง","ใช้ตำแหน่งของฉัน","ชื่อ","วันเกิด","เวลาเกิด","รูปแบบผัง","ภาษา","แบบอินเดียใต้","แบบอินเดียเหนือ","ทั้งสองผัง","เล่นการเคลื่อนของลัคนา","ไปที่ตอนนี้","ลัคนาสด","หยุดค้าง","เล่นสดต่อ","คัดลอกเป็นข้อความ","แสดง","วันที่","เวลา","ยกเลิก","บันทึก","หยุด","เสียง","กฎ","ผลลัพธ์","ผังราศี","นวางค์ (D-9)","ผังเรือน KP","ผังจุดเริ่มเรือน (ภาวะ)","ดาว","ตำแหน่ง","นักษัตร","ราศี","เจ้าราศี","เจ้านักษัตร","เจ้าย่อย","เรือน","องศา","ลัคนา","โอกาสวิคเก็ตตก","พักโฆษณา","ค้นหาเวลาวิคเก็ตและช่วงพัก","คำนวณดวงกำเนิด","บันทึกผังนี้","แผนที่ดวงดาว","ประกาศสำคัญ","ของหายและของที่พบ","วิคเก็ตคริกเก็ตและช่วงพัก","เวลาจรปัจจุบัน","คัดลอกข้อมูลทั้งหมด","พิมพ์ / บันทึก PDF","บันทึก / แชร์ไฟล์","ลัคนา","สด","สำเร็จ","มูหูรตะ 3 11","กำไรจากการเทรด","การจรของตลาด","นาฬิกาการจรสด","แอนะล็อก","ดิจิทัล","เต็มหน้าจอ","สถานที่","นาฬิกาปลุกมูหูรตะ","ตั้งนาฬิกาปลุก","เริ่ม","สิ้นสุด","ดาวเคราะห์","ราศี","สถานที่ล่าสุด","ขนาดตัวอักษร","รูปแบบตัวอักษร","การพยากรณ์","ขาขึ้น","ขาลง","เป็นกลาง","พยากรณ์ตลาด","เลือกสถานที่","วันนี้"]},"id":{"n":"Bahasa Indonesia","P":["Matahari","Bulan","Mars","Merkurius","Jupiter","Venus","Saturnus","Rahu","Ketu"],"Q":["Mat","Bul","Mar","Mer","Jup","Ven","Sat","Rah","Ket"],"S":["Aries","Taurus","Gemini","Kanker","Leo","Virgo","Libra","Skorpio","Sagitarius","Kaprikornus","Akuarius","Pisces"],"A":"Asc","U":["Alat","Prashna GMP","Peta kelahiran","Astrokartografi","Muhurtham Bulan","Muhurtham rentang tanggal","Manifestasi uang","Aturan lotre","Gawang kriket","Peta puncak rumah","Barang hilang","Pacuan kuda","Muhurtham keuntungan","Riset spekulasi","Riset gempa bumi","Jawaban horari","Muhurtham pilihan praktis","Tentang","Waktu ascendant","Peta transit","Cara kerja","Negara","Negara bagian / Provinsi","Kota / Kabupaten","Lintang","Bujur","Zona waktu","Selisih UTC","Ayanamsa","Dari","Sampai","Gunakan lokasi saya","Nama","Tanggal lahir","Waktu lahir","Gaya peta","Bahasa","India Selatan","India Utara","Kedua peta","Putar gerakan ascendant","Ke sekarang","Ascendant langsung","Bekukan","Lanjutkan langsung","Salin sebagai teks","Tampilkan","Tanggal","Waktu","Batal","Simpan","Berhenti","Suara","Aturan","Temuan","Peta Rasi","Navamsa (D-9)","Peta rumah KP","Peta puncak rumah (Bhava)","Benda langit","Posisi","Bintang","Zodiak","Penguasa zodiak","Penguasa bintang","Sub-penguasa","Rumah","Derajat","terbit","Kemungkinan gawang jatuh","Jeda iklan","Cari waktu gawang dan jeda","Hitung peta kelahiran","Simpan peta ini","Peta astro","Pemberitahuan penting","Barang hilang","Gawang kriket dan jeda","Waktu transit saat ini","Salin semua data","Cetak / simpan PDF","Simpan / bagikan berkas","Ascendant","LANGSUNG","Sukses","Muhurtham 3 11","Keuntungan trading","Transit pasar","Jam transit langsung","Analog","Digital","Layar penuh","Lokasi","Alarm muhurtham","Atur alarm","Mulai","Selesai","Planet","Rasi","Tempat terbaru","Ukuran font","Gaya font","Prediksi","Bullish","Bearish","Netral","Prediksi pasar","Pilih tempat","Hari ini"]},"ms":{"n":"Bahasa Melayu","P":["Matahari","Bulan","Marikh","Utarid","Musytari","Zuhrah","Zuhal","Rahu","Ketu"],"Q":["Mat","Bul","Mar","Uta","Mus","Zuh","Zul","Rah","Ket"],"S":["Aries","Taurus","Gemini","Kanser","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricornus","Aquarius","Pisces"],"A":"Asc","U":["Alat","Prashna GMP","Carta kelahiran","Astrokartografi","Muhurtham Bulan","Muhurtham julat tarikh","Manifestasi wang","Peraturan loteri","Wiket kriket","Carta puncak rumah","Barang hilang","Lumba kuda","Muhurtham keuntungan","Kajian spekulasi","Kajian gempa bumi","Jawapan horari","Muhurtham pilihan praktikal","Tentang","Waktu ascendant","Carta transit","Cara ia berfungsi","Negara","Negeri / Wilayah","Bandar / Pekan","Latitud","Longitud","Zon masa","Beza UTC","Ayanamsa","Dari","Hingga","Guna lokasi saya","Nama","Tarikh lahir","Masa lahir","Gaya carta","Bahasa","India Selatan","India Utara","Kedua-dua carta","Main pergerakan ascendant","Pergi ke sekarang","Ascendant langsung","Bekukan","Sambung langsung","Salin sebagai teks","Papar","Tarikh","Masa","Batal","Simpan","Berhenti","Bunyi","Peraturan","Dapatan","Carta Rasi","Navamsa (D-9)","Carta rumah KP","Carta puncak rumah (Bhava)","Jasad","Kedudukan","Bintang","Buruj","Penguasa buruj","Penguasa bintang","Sub-penguasa","Rumah","Darjah","naik","Kemungkinan wiket jatuh","Rehat iklan","Cari masa wiket dan rehat","Kira carta kelahiran","Simpan carta ini","Peta astro","Notis penting","Barang hilang","Wiket kriket dan rehat","Masa transit semasa","Salin semua data","Cetak / simpan PDF","Simpan / kongsi fail","Ascendant","LANGSUNG","Berjaya","Muhurtham 3 11","Keuntungan dagangan","Transit pasaran","Jam transit langsung","Analog","Digital","Skrin penuh","Lokasi","Penggera muhurtham","Tetapkan penggera","Mula","Tamat","Planet","Rasi","Tempat terkini","Saiz fon","Gaya fon","Ramalan","Menaik","Menurun","Neutral","Ramalan pasaran","Pilih tempat","Hari ini"]},"vi":{"n":"Tiếng Việt","P":["Mặt Trời","Mặt Trăng","Hỏa Tinh","Thủy Tinh","Mộc Tinh","Kim Tinh","Thổ Tinh","Rahu","Ketu"],"Q":["MTr","MTă","Hỏa","Thủy","Mộc","Kim","Thổ","Rah","Ket"],"S":["Bạch Dương","Kim Ngưu","Song Tử","Cự Giải","Sư Tử","Xử Nữ","Thiên Bình","Bọ Cạp","Nhân Mã","Ma Kết","Bảo Bình","Song Ngư"],"A":"Asc","U":["Công cụ","Prashna GMP","Lá số sinh","Bản đồ chiêm tinh","Muhurtham Mặt Trăng","Muhurtham theo khoảng ngày","Thu hút tiền bạc","Luật xổ số","Wicket cricket","Lá số đỉnh nhà","Đồ thất lạc","Đua ngựa","Muhurtham lợi nhuận","Nghiên cứu đầu cơ","Nghiên cứu động đất","Câu trả lời Horary","Muhurtham chọn giờ thực tế","Giới thiệu","Giờ cung mọc","Lá số quá cảnh","Cách hoạt động","Quốc gia","Bang / Tỉnh","Thành phố / Thị trấn","Vĩ độ","Kinh độ","Múi giờ","Chênh lệch UTC","Ayanamsa","Từ","Đến","Dùng vị trí của tôi","Tên","Ngày sinh","Giờ sinh","Kiểu lá số","Ngôn ngữ","Nam Ấn","Bắc Ấn","Cả hai lá số","Chạy chuyển động cung mọc","Đến hiện tại","Cung mọc trực tiếp","Đóng băng","Tiếp tục trực tiếp","Sao chép dạng văn bản","Hiển thị","Ngày","Giờ","Hủy","Lưu","Dừng","Âm thanh","Quy tắc","Kết quả","Lá số Rasi","Navamsa (D-9)","Lá số nhà KP","Lá số đỉnh nhà (Bhava)","Thiên thể","Vị trí","Chòm sao","Cung","Chủ tinh cung","Chủ tinh chòm sao","Phụ chủ tinh","Nhà","Độ","mọc","Khả năng rơi wicket","Quảng cáo nghỉ","Tìm giờ wicket và giờ nghỉ","Tính lá số sinh","Lưu lá số này","Bản đồ chiêm tinh","Thông báo quan trọng","Đồ thất lạc","Wicket cricket và giờ nghỉ","Giờ quá cảnh hiện tại","Sao chép toàn bộ dữ liệu","In / lưu PDF","Lưu / chia sẻ tệp","Cung mọc","TRỰC TIẾP","Thành công","Muhurtham 3 11","Lợi nhuận giao dịch","Chuyển vận thị trường","Đồng hồ chuyển vận trực tiếp","Analog","Kỹ thuật số","Toàn màn hình","Vị trí","Báo thức muhurtham","Đặt báo thức","Bắt đầu","Kết thúc","Hành tinh","Rasi","Nơi gần đây","Cỡ chữ","Kiểu chữ","Dự đoán","Tăng giá","Giảm giá","Trung lập","Dự đoán thị trường","Chọn địa điểm","Hôm nay"]},"sw":{"n":"Kiswahili","P":["Jua","Mwezi","Mirihi","Utaridi","Mshtarii","Zuhura","Zohali","Rahu","Ketu"],"Q":["Jua","Mwe","Mir","Uta","Msh","Zuh","Zoh","Rah","Ket"],"S":["Hamali","Thauri","Jauza","Saratani","Asadi","Sumbula","Mizani","Akrabu","Qausi","Jadi","Dalu","Hutu"],"A":"Asc","U":["Zana","Prashna ya GMP","Chati ya kuzaliwa","Ramani ya nyota","Muhurtham ya Mwezi","Muhurtham ya kipindi cha tarehe","Kuvutia pesa","Sheria za bahati nasibu","Wiketi ya kriketi","Chati ya vichwa vya nyumba","Vilivyopotea na kupatikana","Mbio za farasi","Muhurtham ya faida","Utafiti wa kubahatisha","Utafiti wa tetemeko la ardhi","Majibu ya horari","Muhurtham ya uchaguzi wa vitendo","Kuhusu","Nyakati za kupanda","Chati ya mpito","Jinsi inavyofanya kazi","Nchi","Jimbo / Mkoa","Mji / Kijiji","Latitudo","Longitudo","Saa za eneo","Tofauti ya UTC","Ayanamsa","Kuanzia","Hadi","Tumia eneo langu","Jina","Tarehe ya kuzaliwa","Saa ya kuzaliwa","Mtindo wa chati","Lugha","Kusini mwa India","Kaskazini mwa India","Chati zote mbili","Cheza mwendo wa kupanda","Nenda sasa","Kupanda moja kwa moja","Gandisha","Endelea moja kwa moja","Nakili kama maandishi","Onyesha","Tarehe","Saa","Ghairi","Hifadhi","Simamisha","Sauti","Sheria","Matokeo","Chati ya Rasi","Navamsa (D-9)","Chati ya nyumba KP","Chati ya vichwa vya nyumba (Bhava)","Mwili","Nafasi","Nyota","Ishara","Mtawala wa ishara","Mtawala wa nyota","Mtawala msaidizi","Nyumba","Digrii","kupanda","Uwezekano wa wiketi","Mapumziko ya matangazo","Tafuta nyakati za wiketi na mapumziko","Kokotoa chati ya kuzaliwa","Hifadhi chati hii","Ramani ya nyota","Ilani muhimu","Vilivyopotea na kupatikana","Wiketi za kriketi na mapumziko","Muda wa mpito wa sasa","Nakili data yote","Chapisha / hifadhi PDF","Hifadhi / shiriki faili","Kupanda","MOJA KWA MOJA","Mafanikio","Muhurtham 3 11","Faida ya biashara","Mpito wa soko","Saa ya mpito ya moja kwa moja","Analogi","Dijitali","Skrini nzima","Mahali","Kengele za muhurtham","Weka kengele","Mwanzo","Mwisho","Sayari","Rasi","Maeneo ya hivi karibuni","Ukubwa wa herufi","Mtindo wa herufi","Utabiri","Kupanda","Kushuka","Wastani","Utabiri wa soko","Chagua mahali","Leo"]},"fil":{"n":"Filipino","P":["Araw","Buwan","Marte","Merkuryo","Hupiter","Benus","Saturno","Rahu","Ketu"],"Q":["Ara","Buw","Mar","Mer","Hup","Ben","Sat","Rah","Ket"],"S":["Aries","Taurus","Gemini","Kanser","Leo","Virgo","Libra","Eskorpiyo","Sagitaryo","Kapricornyo","Akwaryo","Pisces"],"A":"Asc","U":["Mga Kasangkapan","GMP Prashna","Tsart ng kapanganakan","Astrokartograpiya","Muhurtham ng Buwan","Muhurtham sa saklaw ng petsa","Paghahatid ng pera","Mga patakaran ng loterya","Wiket ng kriket","Tsart ng mga cusp","Nawala at Nahanap","Karera ng kabayo","Muhurtham ng tubo","Pananaliksik sa espekulasyon","Pananaliksik sa lindol","Mga sagot sa horary","Praktikal na Muhurtham","Tungkol","Mga oras ng ascendant","Tsart ng transit","Paano ito gumagana","Bansa","Estado / Lalawigan","Lungsod / Bayan","Latitud","Longhitud","Time zone","Pagkakaiba ng UTC","Ayanamsa","Mula","Hanggang","Gamitin ang aking lokasyon","Pangalan","Petsa ng kapanganakan","Oras ng kapanganakan","Estilo ng tsart","Wika","Timog Indian","Hilagang Indian","Parehong tsart","I-play ang galaw ng ascendant","Pumunta sa ngayon","Live na ascendant","I-freeze","Ituloy ang live","Kopyahin bilang teksto","Ipakita","Petsa","Oras","Kanselahin","I-save","Ihinto","Tunog","Mga patakaran","Mga natuklasan","Tsart ng Rasi","Navamsa (D-9)","Tsart ng bahay KP","Tsart ng mga cusp (Bhava)","Katawan","Posisyon","Bituin","Tanda","Pinuno ng tanda","Pinuno ng bituin","Sub-pinuno","Bahay","Digri","sumisikat","Posibilidad ng wiket","Patalastas na pahinga","Hanapin ang oras ng wiket at pahinga","Kalkulahin ang tsart ng kapanganakan","I-save ang tsart na ito","Astro mapa","Mahalagang paunawa","Nawala at Nahanap","Wiket ng kriket at mga pahinga","Kasalukuyang oras ng transit","Kopyahin ang lahat ng datos","I-print / i-save bilang PDF","I-save / ibahagi ang file","Ascendant","LIVE","Tagumpay","Muhurtham 3 11","Tubo sa trading","Transit ng merkado","Live na orasan ng transit","Analog","Digital","Buong screen","Lokasyon","Mga alarma ng muhurtham","Itakda ang mga alarma","Simula","Wakas","Planeta","Rasi","Mga kamakailang lugar","Laki ng font","Estilo ng font","Hula","Bullish","Bearish","Neutral","Mga hula sa merkado","Pumili ng lugar","Ngayon"]}};
  const LOC={bi:'en',en:'en',zh:'zh-Hans','zh-Hant':'zh-Hant',fil:'fil'};
  const ORDER=['bi','en'].concat(Object.keys(DATA));
  const MAPS={};
  function mapOf(c){
    if(MAPS[c])return MAPS[c];
    const d=DATA[c], m={}; if(!d)return (MAPS[c]={});
    for(let i=0;i<KEYS.length;i++)m[KEYS[i]]=d.U[i];
    return (MAPS[c]=m);
  }
  const rec=new WeakMap();
  const TAMIL=/[஀-௿]/;
  function xl(o,lang){
    if(lang==='bi')return o;
    const core=o.trim(); if(!core)return o;
    const lead=o.slice(0,o.indexOf(core)), trail=o.slice(o.indexOf(core)+core.length);
    let base=core, tam=false;
    const m=core.match(/^(.*?)\s*·\s*([஀-௿][\s\S]*)$/);
    let tailTa='';
    if(m&&m[1]){base=m[1];tam=true;tailTa=m[2];}
    if(lang!=='en'){const tr=mapOf(lang)[base]; if(tr)return lead+tr+trail;}
    if(lang==='ta'&&tam&&tailTa)return lead+tailTa+trail;
    return tam?lead+base+trail:o;
  }
  function tnode(n,lang){
    let r=rec.get(n);
    if(!r||n.nodeValue!==r.t){r={o:n.nodeValue,t:n.nodeValue};}
    const v=xl(r.o,lang);
    if(v!==n.nodeValue)n.nodeValue=v;
    if(lang!=='bi'){const c0=r.o.trim(); if(c0&&TAMIL.test(c0.charAt(0))){const p=n.parentNode; if(p&&p.nodeType===1&&!/[A-Za-z]/.test(p.textContent))p.classList.add('tam60');}}
    r.t=v; rec.set(n,r);
  }
  function walk(root,lang){
    if(!root)return;
    if(root.nodeType===3){tnode(root,lang);return;}
    if(root.nodeType!==1)return;
    const tg=root.tagName; if(tg==='SCRIPT'||tg==='STYLE'||tg==='TEXTAREA'||tg==='SVG'||tg==='svg')return;
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const p=n.parentNode&&n.parentNode.nodeName;return (p==='SCRIPT'||p==='STYLE'||p==='TEXTAREA')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}});
    let n; const list=[]; while((n=w.nextNode()))list.push(n);
    list.forEach(x=>tnode(x,lang));
  }
  /* Tamil mode: wherever the page pairs an English line with a Tamil line, the Tamil line takes the English line's place */
  const SWP=new Set(), LAT=/[A-Za-z]{2}/;
  function swapOne(e){
    if(e.__sw||!TAMIL.test(e.textContent)||e.textContent.length>200)return;
    let p=e.previousSibling; while(p&&p.nodeType===3&&!p.nodeValue.trim())p=p.previousSibling;
    if(!p)return; let n=null;
    if(p.nodeType===3)n=p;
    else if(p.nodeType===1&&!/^(SCRIPT|STYLE|SVG|svg|SELECT|INPUT|BUTTON|TEXTAREA)$/.test(p.nodeName)){
      const w=document.createTreeWalker(p,NodeFilter.SHOW_TEXT,null); let t; while((t=w.nextNode())){ if(LAT.test(t.nodeValue)){n=t;break;} }
    }
    if(!n||!LAT.test(n.nodeValue))return;
    const r=rec.get(n)||{o:n.nodeValue,t:n.nodeValue}, core=n.nodeValue.trim(), lead=n.nodeValue.slice(0,n.nodeValue.indexOf(core)), trail=n.nodeValue.slice(n.nodeValue.indexOf(core)+core.length);
    n.nodeValue=lead+e.textContent.trim()+trail; rec.set(n,{o:r.o,t:n.nodeValue}); e.__sw=n; SWP.add(e);
  }
  function swapAll(root){
    if(!root||root.nodeType!==1)return;
    if(root.matches&&root.matches('.tm,.tt,.ta'))swapOne(root);
    root.querySelectorAll('.tm,.tt,.ta').forEach(swapOne);
  }
  function swapClear(){ SWP.forEach(e=>{delete e.__sw;}); SWP.clear(); }
  let obs=null, busy=false;
  function observe(on){
    if(obs){obs.disconnect();obs=null;}
    if(!on||typeof MutationObserver==='undefined')return;
    obs=new MutationObserver(ms=>{
      if(busy)return; busy=true;
      try{ const lang=CH60.lang; ms.forEach(m=>{m.addedNodes.forEach(a=>{walk(a,lang); if(lang==='ta')swapAll(a);});}); }finally{busy=false;}
    });
    obs.observe(document.body,{childList:true,subtree:true});
  }
  const hooks=[];
  function apply(){
    const lang=CH60.lang;
    document.documentElement.lang=LOC[lang]||lang||'en';
    document.body.classList.toggle('lg-x',lang!=='bi');
    document.body.setAttribute('data-lang',lang);
    busy=true; try{swapClear(); walk(document.body,lang); if(lang==='ta')swapAll(document.body);}finally{busy=false;}
    observe(lang!=='bi');
    hooks.forEach(f=>{try{f();}catch(e){}});
  }
  const api={
    KEYS:KEYS, DATA:DATA, ORDER:ORDER, hooks:hooks, apply:apply,
    name(c){return c==='bi'?'English + தமிழ் (default)':c==='en'?'English only':DATA[c].n;},
    has(c){return !!DATA[c];},
    T(k){const l=CH60.lang; if(l==='bi'||l==='en'||!DATA[l])return k; return mapOf(l)[k]||k;},
    pn(c,short){
      const l=CH60.lang, d=DATA[l];
      if(!d){return short?c:(typeof NAME!=='undefined'?NAME[c]:c);}
      const i=CODES.indexOf(c); if(i<0)return c;
      return (short?d.Q:d.P)[i];
    },
    sn(i){const d=DATA[CH60.lang]; return d?d.S[i]:SIGNS[i][0];},
    aw(){const d=DATA[CH60.lang]; return d?d.A:'Asc';},
    loc(){const l=CH60.lang; return LOC[l]||(DATA[l]?l:'en');},
    date(ms,opt){ // ms already shifted by the time-zone offset, read as UTC
      const l=CH60.lang; if(l==='bi'||l==='en')return null;
      try{return new Intl.DateTimeFormat(LOC[l]||l,Object.assign({timeZone:'UTC'},opt||{weekday:'short',day:'numeric',month:'short',year:'numeric'})).format(new Date(ms));}catch(e){return null;}
    },
    fill(sel){
      sel.innerHTML=ORDER.map(c=>'<option value="'+c+'">'+api.name(c)+'</option>').join('');
      sel.value=CH60.lang; if(sel.value!==CH60.lang){sel.value='bi';}
    },
    set(c){
      if(ORDER.indexOf(c)<0)c='bi';
      CH60.lang=c;
      document.querySelectorAll('select.langsel').forEach(s=>{s.value=c;});
      apply();
    }
  };
  return api;
})();
const T60=k=>I18N60.T(k);

let LASTCH=0;
/* ---------- planets & South Indian chart ---------- */
const BODY={Su:'Sun',Mo:'Moon',Ma:'Mars',Me:'Mercury',Ju:'Jupiter',Ve:'Venus',Sa:'Saturn'};
const CODES=['Su','Mo','Ma','Me','Ju','Ve','Sa','Ra','Ke'];
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CELL={11:[0,0],0:[1,0],1:[2,0],2:[3,0],3:[3,1],4:[3,2],5:[3,3],6:[2,3],7:[1,3],8:[0,3],9:[0,2],10:[0,1]};
let CFG={lat:0,lon:0,kind:'kp'}, playTimer=null;

function sidLon(code,ms){
  const jd=ms/86400000+2440587.5;
  if(code==='Ra'||code==='Ke'){            // mean lunar node
    const c=(jd-2451545)/36525; let om=125.04452-1934.136261*c;
    if(code==='Ke')om+=180;
    return mod(om-ayanamsa(jd,CFG.kind),360);
  }
  const t=Astronomy.MakeTime(new Date(ms));
  const e=Astronomy.RotateVector(Astronomy.Rotation_EQJ_ECT(t),Astronomy.GeoVector(BODY[code],t,true));
  return mod(deg(Math.atan2(e.y,e.x))-ayanamsa(jd,CFG.kind),360);
}
function planets(ms){
  return CODES.map(c=>{
    const lon=sidLon(c,ms); let retro=(c==='Ra'||c==='Ke');
    if(!retro&&c!=='Su'&&c!=='Mo'){
      retro=(mod(sidLon(c,ms+3600000)-sidLon(c,ms-3600000)+180,360)-180)<0;
    }
    return {c:c,lon:lon,retro:retro};
  });
}
function inSign(lon){
  const w=lon-Math.floor(lon/30)*30, d=Math.floor(w), m=Math.floor((w-d)*60);
  return d+'°'+p2(m)+'′';
}
function lordsOf(lon){const g=SEGS[findSeg(lon)];return NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub];}

function westPack(ms,cusps,P,R,kind){
  return {ay:ayanamsa(ms/86400000+2440587.5,kind||CFG.kind),cusps:cusps,pl:CODES.map(c=>({k:c,t:I18N60.pn(c,true),lon:P[c],r:!!(R&&R[c])}))};
}
function drawChartS(ms){
  const err=$('chartErr');
  if(typeof Astronomy==='undefined'){err.textContent='Planet positions need the astronomy library, which did not load. Check your connection and reload.';return;}
  err.textContent='';
  const asc=sidAsc(ms,CFG.lat,CFG.lon,CFG.kind), ascSign=Math.floor(asc/30)%12, ag=SEGS[findSeg(asc)];
  const pl=planets(ms);
  let ri=ROWS.findIndex(r=>ms>=r.start&&ms<r.end); if(ri<0)ri=ROWS.length-1;
  const passed=new Set(); for(let i=0;i<=ri;i++)passed.add(SEGS[ROWS[i].k].sign); if(LIVEON)passed.clear();
  const bySign=Array.from({length:12},()=>[]);
  pl.forEach(p=>bySign[Math.floor(p.lon/30)%12].push(p));

  const d=new Date(ms+TZ*3600000);
  const hms=p2(d.getUTCHours())+':'+p2(d.getUTCMinutes())+':'+p2(d.getUTCSeconds());
  const dstr=I18N60.date(ms+TZ*3600000)||(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getUTCDay()]+', '+d.getUTCDate()+' '+MON[d.getUTCMonth()]+' '+d.getUTCFullYear());
  if(!window.CH_POP)LASTCH=ms;
  const items=Array.from({length:12},()=>[]);
  const dg=x=>Math.floor(x%30)+'°', dgl=x=>Math.floor(x%30)+'°'+p2(Math.floor((x%30%1)*60))+'′';
  items[ascSign].push({k:'L',t:I18N60.aw(),d:dg(asc),dl:dgl(asc)});
  pl.forEach(p=>{items[Math.floor(p.lon/30)%12].push({k:p.c,t:I18N60.pn(p.c,true),d:dg(p.lon),dl:dgl(p.lon),r:p.retro});});
  try{ const _f=GA_FT.chartInfo(ms,CFG.lat,CFG.lon,CFG.kind); items[Math.floor(_f.L/30)%12].push({k:'F',t:'Fo',d:dg(_f.L),dl:dgl(_f.L)}); }catch(e){}
  const signs=SIGNS.map((x,i)=>I18N60.sn(i));
  const lords=I18N60.pn(ag.lord,false)+'/'+I18N60.pn(ag.star,false)+'/'+I18N60.pn(ag.sub,false);
  const bi=CH60.lang==='bi', live=LIVEON?' · '+T60('LIVE'):'';
  const rising=signs[ascSign]+' '+inSign(asc)+' '+T60('rising');
  const tamL=TLAG[ascSign]+' லக்னம் · '+tl(ag);
  const center=[{t:dstr+live,c:'c60k'},{t:hms,c:'c60b'},{t:rising,c:'c60t'},{t:lords,c:'c60q'}]; if(bi)center.push({t:tamL,c:'c60q'});
  const cap=[{t:dstr+' · '+hms+live,c:'c60k'},{t:rising+' · '+lords,c:'c60t'}]; if(bi)cap.push({t:tamL,c:'c60q'});
  const useStyle=(window.CH_POP&&(CH60.style==='both'||CH60.style==='all'))?'south':CH60.style;
  $('chartBox').innerHTML=CH60.draw({A:ascSign,by:items,signs:signs,passed:passed,center:center,caption:cap,aria:'Transit chart '+rising,south:{caption:[]},north:{center:[]},w:westPack(ms,placidusCusps(ms,CFG.lat,CFG.lon,CFG.kind),Object.fromEntries(pl.map(p=>[p.c,p.lon])),Object.fromEntries(pl.map(p=>[p.c,p.retro])))},useStyle);
  $('chartTime').innerHTML='<b class="cdate">'+dstr+'</b><span>'+hms+' · '+signs[ascSign]+' '+T60('rising')+live+'</span>';

  const hx=(CH60.lang==='bi'||CH60.lang==='en')?'Sign / Star / Sub Lords':T60('Sign lord')+' / '+T60('Star lord')+' / '+T60('Sub lord');
  let h='<div class="tr th"><span>'+T60('Body')+'<em> · '+T60('Star')+'</em></span><span>'+T60('Position')+'<em> · '+hx+'</em></span><span class="x4">'+T60('Star')+'</span><span class="x4">'+hx+'</span></div>';
  const row=(name,tn,lon,retro)=>{
    const g=SEGS[findSeg(lon)];
    return '<div class="tr"><div class="pb"><b>'+name+'</b><span class="ta">'+tn+'</span></div>'+
      '<div class="pp"><b>'+I18N60.sn(g.sign)+' '+inSign(lon)+(retro?' <i class="rt">R</i>':'')+'</b><span class="ta">'+TSIGN[g.sign]+'</span></div>'+
      '<div class="pn">'+NAKS[g.nak]+'<span class="ta">'+GP_NAKT[g.nak]+'</span></div>'+
      '<div class="pl2">'+NAME[g.lord]+'/<wbr>'+NAME[g.star]+'/<wbr>'+NAME[g.sub]+'<span class="ta">'+TA[g.lord]+'/<wbr>'+TA[g.star]+'/<wbr>'+TA[g.sub]+'</span></div></div>';
  };
  h+=row(I18N60.has(CH60.lang)?T60('Ascendant'):'Lagna','லக்னம்',asc,false);
  pl.forEach(p=>{h+=row(I18N60.pn(p.c,false),TA[p.c],p.lon,p.retro);});
  try{ const _fc=GA_FT.chartInfo(ms,CFG.lat,CFG.lon,CFG.kind); h+=row('Fortuna ⊗ '+GA_FT.qchip(_fc.q),'போர்ச்சுனா',_fc.L,false); }catch(e){}
  $('ptable').innerHTML=h;
}

function setChartTime(ms,fromSlider){
  if(!fromSlider)$('slider').value=Math.round((ms-DAY0)/60000);
  drawChart(ms);
}
function stopPlay(){ if(playTimer){clearInterval(playTimer);playTimer=null;} $('play').textContent='Play Lagna Movement'; }
function initChart(){
  $('chartPanel').classList.remove('hide'); stopPlay();
  const n=Date.now(); setChartTime(n>=DAY0&&n<endAll?n:DAY0);
}
$('slider').addEventListener('input',()=>{stopPlay();setChartTime(DAY0+(+$('slider').value)*60000,true);});
$('play').addEventListener('click',()=>{
  if(playTimer){stopPlay();return;}
  const sl=$('slider'); if(+sl.value>=1440)sl.value=0;
  $('play').textContent='Pause';
  playTimer=setInterval(()=>{
    let v=+sl.value+3; if(v>=1440){v=1440;stopPlay();}
    sl.value=v; setChartTime(DAY0+v*60000,true);
  },120);
});
$('nowBtn').addEventListener('click',()=>{
  const n=Date.now(); stopPlay(); $('chartErr').textContent='';
  if(n>=DAY0&&n<endAll){ setChartTime(n); return; }
  /* The chosen day does not contain the present moment: switch to today at this place, then jump */
  const tz=parseFloat($('tz').value)||0, d=new Date(n+tz*3600000);
  $('date').value=d.toISOString().slice(0,10); $('time').value='00:00';
  run();
  const m=Date.now(); if(m>=DAY0&&m<endAll){ setChartTime(m); $('chartErr').textContent='Switched to today so the present moment is included.'; }
});

/* ---------- GMP 3,11 Gurumurthy Guruji Muhurtham ---------- */
// [sign index, star lord, sub lord]; the sign fixes the lagna lord
const GMP=[[1,'Mo','Ju'],[2,'Ma','Su'],[3,'Me','Ve'],[4,'Ve','Me'],[5,'Mo','Mo'],[5,'Mo','Me'],
  [6,'Ma','Su'],[6,'Ju','Su'],[7,'Sa','Me'],[7,'Me','Sa'],[8,'Ve','Ve'],[8,'Ve','Sa'],
  [9,'Ma','Sa'],[10,'Ju','Ju'],[11,'Sa','Ve']];
const isGmp=g=>GMP.some(c=>c[0]===g.sign&&c[1]===g.star&&c[2]===g.sub);
let MODE='all', GMPN=0;

function buildGmp(){
  const ul=$('gmpList'); ul.innerHTML=''; GMPN=0;
  ROWS.forEach((r,idx)=>{
    const g=SEGS[r.k]; if(!isGmp(g))return;
    const xt=extraTags(idx), tf=$('tagShow').value;
    if((tf==='dhana'&&!xt.dhana)||(tf==='high'&&!xt.high))return;
    GMPN++;
    const li=document.createElement('li');
    li.className='row gm'; li.dataset.idx=idx; li.dataset.s=r.start; li.dataset.e=r.end; li.dataset.tz=TZ; li.style.setProperty('--h',HUE[g.sub]);
    li.innerHTML=
      '<div class="t2"><div><span>Begin</span><b>'+clock(r.start)+'</b></div><div><span>End</span><b>'+clock(r.end)+'</b></div></div>'+
      '<div class="l"><span class="n">'+NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub]+'</span>'+xtPills(xt,true)+'<span class="ta">'+tl(g)+'</span><span class="c">'+SIGNS[g.sign][0]+' ascendant · '+TLAG[g.sign]+' லக்னம்</span></div>'+
      (xtInfo(xt,true)?'<div class="chk">'+xtInfo(xt,true)+'</div>':'')+'<div class="p"><span>'+span(g)+' · '+NAKS[g.nak]+'</span><span>lasts '+dur(r.end-r.start)+'</span></div>';
    li.dataset.s=r.start;li.dataset.e=r.end;li.dataset.tz=TZ;li.addEventListener('click',()=>{stopPlay();setChartTime(Math.min(r.start+1000,endAll-1));GA.open(r.start,r.end,{lat:CFG.lat,lon:CFG.lon,kind:CFG.kind,tz:TZ},li);});
    ul.appendChild(li);
  });
  if(!GMPN) ul.innerHTML='<li class="row"><div class="l">No muhurtham windows fall inside these 24 hours.</div></li>';
}
function setMode(m){
  MODE=m;
  ['All','Gmp','Ana','Rul'].forEach(k=>$('mode'+k).setAttribute('aria-pressed',String(m===k.toLowerCase())));
  $('list').classList.toggle('hide',m!=='all');
  $('gmpList').classList.toggle('hide',m!=='gmp');
  $('anaList').classList.toggle('hide',m!=='ana');
  $('rulList').classList.toggle('hide',m!=='rul');
  $('filter').classList.toggle('hide',m!=='all');
  $('gmpNote').classList.toggle('hide',m!=='gmp');
  $('anaNote').classList.toggle('hide',m!=='ana');
  $('rulNote').classList.toggle('hide',m!=='rul');
  $('anaOpt').classList.toggle('hide',m!=='ana');
  $('rulOpt').classList.toggle('hide',m!=='rul');
  $('cond').classList.toggle('hide',m!=='gmp'&&m!=='ana');
  $('cond2').classList.toggle('hide',m!=='rul');
  $('tagOpt').classList.toggle('hide',m!=='gmp'&&m!=='ana');
  fillTagOpts(m);
  $('cond3').classList.toggle('hide',m!=='gmp'&&m!=='ana'&&m!=='rul');
  if(m==='gmp'){buildGmp();$('cnt').textContent=GMPN+' muhurtham windows in 24 hours';}
  else if(m==='ana') buildAna();
  else if(m==='rul') buildRul();
  else applyFilter();
  tick();
}
$('modeAll').addEventListener('click',()=>setMode('all'));
$('modeGmp').addEventListener('click',()=>setMode('gmp'));
$('modeAna').addEventListener('click',()=>setMode('ana'));
$('modeRul').addEventListener('click',()=>setMode('rul'));
$('rulShow').addEventListener('change',()=>{if(MODE==='rul')buildRul();});
$('showFail2').addEventListener('change',()=>{if(MODE==='rul')buildRul();});
$('showFail').addEventListener('change',()=>{if(MODE==='ana')buildAna();});
$('tagShow').addEventListener('change',()=>{
  if(MODE==='gmp'){buildGmp();$('cnt').textContent=GMPN+' muhurtham windows in 24 hours';tick();}
  else if(MODE==='ana')buildAna();
});

/* ---------- Muhurtham part 1: analyse every ascendant timing ---------- */
let ANA=null;
const ORD=n=>n+(n===1?'st':n===2?'nd':n===3?'rd':'th');
function evalTransit(r){
  const g=SEGS[r.k], A=g.sign, mid=(r.start+r.end)/2, P={};
  CODES.forEach(c=>{P[c]=sidLon(c,mid);});
  const sgn=c=>Math.floor(P[c]/30)%12;
  const house=c=>((sgn(c)-A+12)%12)+1;
  const starOf=c=>SEGS[findSeg(P[c])].star;
  const l8=SIGNS[(A+7)%12][1], l12=SIGNS[(A+11)%12][1];
  const bad=h=>h===8||h===12;
  const occ=CODES.filter(c=>bad(house(c)));
  const fails=[];
  [['Lagna lord',g.lord],['Star lord',g.star],['Sub lord',g.sub]].forEach(a=>{
    const h=house(a[1]);
    if(bad(h)) fails.push(a[0]+' '+NAME[a[1]]+' is in the '+ORD(h)+' house ('+SIGNS[sgn(a[1])][0]+')');
  });
  [['Star lord',g.star],['Sub lord',g.sub]].forEach(a=>{
    const st=starOf(a[1]);
    if(st===l8||st===l12) fails.push(a[0]+' '+NAME[a[1]]+' is in the star of '+NAME[st]+', the '+(st===l8?'8th':'12th')+' lord');
    if(occ.indexOf(st)>=0) fails.push(a[0]+' '+NAME[a[1]]+' is in the star of '+NAME[st]+', which is in the '+ORD(house(st))+' house');
  });
  const pos=c=>NAME[c]+' in '+ORD(house(c))+' ('+SIGNS[sgn(c)][0]+')';
  const info='Lagna lord '+pos(g.lord)+'<br>Star lord '+pos(g.star)+', in star of '+NAME[starOf(g.star)]+'<br>Sub lord '+pos(g.sub)+', in star of '+NAME[starOf(g.sub)]+
    '<br>8th lord '+NAME[l8]+', 12th lord '+NAME[l12]+' · planets in 8th/12th: '+(occ.length?occ.map(c=>NAME[c]+' ('+ORD(house(c))+')').join(', '):'none');
  return {ok:fails.length===0,fails:fails,info:info};
}
function buildAna(){
  if(!ANA) ANA=ROWS.map(evalTransit);
  const show=$('showFail').checked, ul=$('anaList'); ul.innerHTML=''; let n=0;
  ROWS.forEach((r,idx)=>{
    const a=ANA[idx]; if(a.ok)n++; if(!a.ok&&!show)return;
    if(a.ok&&$('tagShow').value==='dhana'&&!extraTags(idx).dhana)return;
    const g=SEGS[r.k], li=document.createElement('li');
    li.className='row gm'+(a.ok?'':' bad'); li.dataset.idx=idx; li.dataset.s=r.start; li.dataset.e=r.end; li.dataset.tz=TZ; li.style.setProperty('--h',HUE[g.sub]);
    li.innerHTML=
      '<div class="t2"><div><span>Begin</span><b>'+clock(r.start)+'</b></div><div><span>End</span><b>'+clock(r.end)+'</b></div></div>'+
      '<div class="l"><span class="n">'+NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub]+'</span>'+(a.ok?'<span class="pl"><span class="pill">Muhurtham part 1</span>'+xtPillsRaw(extraTags(idx),false)+'</span>':'')+'<span class="ta">'+tl(g)+'</span><span class="c">'+SIGNS[g.sign][0]+' ascendant · '+TLAG[g.sign]+' லக்னம்</span></div>'+
      '<div class="chk">'+(a.ok?a.info+(xtInfo(extraTags(idx),false)?'<br>'+xtInfo(extraTags(idx),false):''):a.fails.map(f=>'✗ '+f).join('<br>'))+'</div>'+
      '<div class="p"><span>'+span(g)+' · '+NAKS[g.nak]+'</span><span>lasts '+dur(r.end-r.start)+'</span></div>';
    li.dataset.s=r.start;li.dataset.e=r.end;li.dataset.tz=TZ;li.addEventListener('click',()=>{stopPlay();setChartTime(Math.min(r.start+1000,endAll-1));GA.open(r.start,r.end,{lat:CFG.lat,lon:CFG.lon,kind:CFG.kind,tz:TZ},li);});
    ul.appendChild(li);
  });
  if(!ul.children.length) ul.innerHTML='<li class="row"><div class="l">No timing in these 24 hours fulfils all the conditions.</div></li>';
  $('cnt').textContent=n+' of '+ROWS.length+' timings fulfil all conditions · Muhurtham part 1';
  tick();
}

/* ---------- Muhurtham on rules (a, b, c for lagna lord, star lord, sub lord) + financial gain ---------- */
let RUL=null;
function evalRules(r){
  const g=SEGS[r.k], A=g.sign, mid=(r.start+r.end)/2, P={}, RM={};
  CODES.forEach(c=>{P[c]=sidLon(c,mid);});
  const sgn=c=>Math.floor(P[c]/30)%12;
  const house=c=>((sgn(c)-A+12)%12)+1;
  const starOf=c=>SEGS[findSeg(P[c])].star;
  const retro=c=>{
    if(c==='Su'||c==='Mo'||c==='Ra'||c==='Ke')return false;
    if(!(c in RM)) RM[c]=(mod(sidLon(c,mid+3600000)-sidLon(c,mid-3600000)+180,360)-180)<0;
    return RM[c];
  };
  const l8=SIGNS[(A+7)%12][1], l12=SIGNS[(A+11)%12][1];
  const l2=SIGNS[(A+1)%12][1], l11=SIGNS[(A+10)%12][1];
  const bad=h=>h===8||h===12;
  const occ=CODES.filter(c=>bad(house(c)));
  const fails=[];
  [['Lagna lord',g.lord],['Star lord',g.star],['Sub lord',g.sub]].forEach(a=>{
    const c=a[1], h=house(c), st=starOf(c);
    if(bad(h)) fails.push('a) '+a[0]+' '+NAME[c]+' is in the '+ORD(h)+' house ('+SIGNS[sgn(c)][0]+')');
    if(st===l8||st===l12) fails.push('b) '+a[0]+' '+NAME[c]+' is in the star of '+NAME[st]+', the '+(st===l8?'8th':'12th')+' lord');
    if(occ.indexOf(st)>=0) fails.push('c) '+a[0]+' '+NAME[c]+' is in the star of '+NAME[st]+', which is in the '+ORD(house(st))+' house');
    if(retro(c)) fails.push('d) '+a[0]+' '+NAME[c]+' is retrograde');
  });
  const role=c=>(c===l2&&c===l11)?'2nd and 11th lord':(c===l2?'2nd lord':'11th lord');
  const isGain=c=>c===l2||c===l11;
  const G=[l2,l11].filter(c=>c!==l8&&c!==l12);
  const ok=fails.length===0;
  const fin=ok&&isGain(g.star)&&isGain(g.sub);
  const aus=ok&&[g.lord,g.star,g.sub].every(c=>G.indexOf(starOf(c))>=0);
  const pos=c=>NAME[c]+(retro(c)?' (R)':'')+' in '+ORD(house(c))+' ('+SIGNS[sgn(c)][0]+'), star of '+NAME[starOf(c)];
  let info='Lagna lord '+pos(g.lord)+'<br>Star lord '+pos(g.star)+'<br>Sub lord '+pos(g.sub)+
    '<br>8th lord '+NAME[l8]+', 12th lord '+NAME[l12]+' · planets in 8th/12th: '+(occ.length?occ.map(c=>NAME[c]+' ('+ORD(house(c))+')').join(', '):'none')+
    '<br>2nd lord '+NAME[l2]+', 11th lord '+NAME[l11];
  if(fin) info+='<br><b>Financial gain:</b> star lord '+NAME[g.star]+' is the '+role(g.star)+' and sub lord '+NAME[g.sub]+' is the '+role(g.sub);
  if(aus) info+='<br><b>Auspicious financial gain:</b> '+[['lagna lord',g.lord],['star lord',g.star],['sub lord',g.sub]].map(a=>a[0]+' '+NAME[a[1]]+' is in the star of '+NAME[starOf(a[1])]+' ('+role(starOf(a[1]))+')').join('; ');
  return {ok:ok,fin:fin,aus:aus,fails:fails,info:info};
}
function retroList(){
  if(typeof Astronomy==='undefined')return '';
  const names=planets(DAY0+43200000).filter(p=>p.retro&&p.c!=='Ra'&&p.c!=='Ke').map(p=>NAME[p.c]);
  return 'Retrograde on this day: '+(names.length?names.join(', '):'none')+'.';
}
function buildRul(){
  if(!RUL) RUL=ROWS.map(evalRules);
  const f=$('rulShow').value, show=$('showFail2').checked&&f==='all', ul=$('rulList'); ul.innerHTML='';
  $('rulRetro').textContent=retroList();
  let n=0, nf=0, na=0, nd=0, nh=0;
  ROWS.forEach((r,idx)=>{
    const a=RUL[idx]; if(a.ok)n++; if(a.fin)nf++; if(a.aus)na++;
    let xt=null;
    if(a.ok){ xt=extraTags(idx); if(xt.dhana)nd++; if(xt.high)nh++; if(f==='fin'&&!(a.fin||a.aus))return; if(f==='aus'&&!a.aus)return; if(f==='dhana'&&!xt.dhana)return; if(f==='high'&&!xt.high)return; } else if(!show)return;
    const g=SEGS[r.k], li=document.createElement('li');
    li.className='row gm'+(a.ok?'':' bad'); li.dataset.idx=idx; li.dataset.s=r.start; li.dataset.e=r.end; li.dataset.tz=TZ; li.style.setProperty('--h',HUE[g.sub]);
    li.innerHTML=
      '<div class="t2"><div><span>Begin</span><b>'+clock(r.start)+'</b></div><div><span>End</span><b>'+clock(r.end)+'</b></div></div>'+
      '<div class="l"><span class="n">'+NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub]+'</span>'+
        (a.ok?'<span class="pl"><span class="pill">Muhurtham on rules</span>'+(a.fin?'<span class="pill gain">Financial gain · பண லாபம்</span>':'')+(a.aus?'<span class="pill gain">Auspicious financial gain · சுப பண லாபம்</span>':'')+xtPillsRaw(xt,true)+'</span>':'')+
        '<span class="ta">'+tl(g)+'</span><span class="c">'+SIGNS[g.sign][0]+' ascendant · '+TLAG[g.sign]+' லக்னம்</span></div>'+
      '<div class="chk">'+(a.ok?a.info+(xtInfo(xt,true)?'<br>'+xtInfo(xt,true):''):a.fails.map(f=>'✗ '+f).join('<br>'))+'</div>'+
      '<div class="p"><span>'+span(g)+' · '+NAKS[g.nak]+'</span><span>lasts '+dur(r.end-r.start)+'</span></div>';
    li.dataset.s=r.start;li.dataset.e=r.end;li.dataset.tz=TZ;li.addEventListener('click',()=>{stopPlay();setChartTime(Math.min(r.start+1000,endAll-1));GA.open(r.start,r.end,{lat:CFG.lat,lon:CFG.lon,kind:CFG.kind,tz:TZ},li);});
    ul.appendChild(li);
  });
  if(!ul.children.length) ul.innerHTML='<li class="row"><div class="l">'+(f!=='all'?'No such timing in these 24 hours.':'No timing in these 24 hours fulfils all the rules.')+'</div></li>';
  $('cnt').textContent=n+' of '+ROWS.length+' timings fulfil the rules · '+nf+' financial gain · '+na+' auspicious financial gain · '+nd+' dhana muhurtham · '+nh+' highly auspicious';
  tick();
}

/* ---------- Lost and found (tholaindha porul meetpu): 4th lord at the question time ---------- */
const TH=n=>n+'-ஆம்';
const LF_HOUSE=[null,
 {en:'In the hall, or near the main entrance or front porch.',ta:'கூடத்தில் (ஹால்), அல்லது முன் வாசல், முன் தாழ்வாரம் அருகில்.',pl:'Main entrance (main gate) and front porch.',pt:'பிரதான நுழைவாயில் (மகாதுவாரம்), முன் தாழ்வாரம்.'},
 {en:'In a nearby room: near the safe or locker, or in the dining area.',ta:'அருகிலுள்ள அறையில்; பெட்டகம், லாக்கர் அல்லது சாப்பிடும் இடம் அருகில்.',pl:'Safe, locker room and dining area, where cash, jewellery and food are kept.',pt:'பெட்டகம், லாக்கர் அறை, சாப்பிடும் இடம் (பணம், நகை, உணவு வைக்கும் இடம்).'},
 {en:'Near a communication device (phone, router) or with a brother or sister; corridor, verandah or study desk.',ta:'தொடர்பு சாதனம் (தொலைபேசி, ரூட்டர்) அருகில் அல்லது சகோதரர்/சகோதரியிடம்; தாழ்வாரம், வராண்டா, படிக்கும் மேசை.',pl:'Corridors, verandahs, study desk and the Wi-Fi router.',pt:'தாழ்வாரம், வராண்டா, படிக்கும் மேசை, வைஃபை ரூட்டர்.'},
 {en:'In the same place where it was misplaced, or in a vehicle.',ta:'தொலைத்த அதே இடத்தில், அல்லது வாகனத்தில்.',pl:'Living room or central courtyard (Brahmasthan).',pt:'வரவேற்பறை அல்லது நடுமுற்றம் (பிரம்மஸ்தானம்).'},
 {en:'Near the pooja room, a cinema hall or an entertainment place.',ta:'பூஜை அறை, திரையரங்கு அல்லது பொழுதுபோக்கு இடம் அருகில்.',pl:'Bedroom, pooja room and play areas.',pt:'படுக்கையறை, பூஜை அறை, விளையாடும் இடங்கள்.'},
 {en:'In a bathroom, near a sick person or a hospital.',ta:'குளியலறையில், நோயாளி அல்லது மருத்துவமனை அருகில்.',pl:'Toilets, washrooms, cleaning closet and dustbins.',pt:'கழிப்பறை, குளியலறை, சுத்தம் செய்யும் பொருள் வைக்கும் அலமாரி, குப்பைத் தொட்டிகள்.'},
 {en:'With the spouse or with a thief; possibly in a bathroom.',ta:'வாழ்க்கைத் துணையிடம் அல்லது திருடனிடம்; குளியலறையிலும் இருக்கலாம்.',pl:'Master bedroom and guest living area.',pt:'முதன்மைப் படுக்கையறை, விருந்தினர் அமரும் பகுதி.'},
 {en:'In a hidden place that is not used often, on the ground, in a lavatory or a dark place. Hard to find.',ta:'அடிக்கடி பயன்படுத்தாத மறைவான இடம், தரையில், கழிவறை அல்லது இருட்டான இடம். கண்டுபிடிக்க கடினம்.',pl:'Basement, sewer pipes, underground water tank and attic: hidden, dark zones.',pt:'பாதாள அறை, கழிவுநீர்க் குழாய்கள், நிலத்தடி நீர்த்தொட்டி, மச்சு: மறைவான இருட்டான பகுதிகள்.'},
 {en:'In a temple or an auspicious place. It may be found by the father, or a duplicate may be obtained.',ta:'கோவில் அல்லது புனிதமான இடத்தில். தந்தை மூலம் கிடைக்கலாம்; அல்லது நகல் (duplicate) கிடைக்கலாம்.',pl:'Prayer room (altar), library and rooftop terrace.',pt:'பூஜை அறை, நூலகம், மொட்டை மாடி.'},
 {en:'At the workplace, in an upstairs hall, or with a co-worker.',ta:'பணியிடத்தில், மேல்மாடிக் கூடத்தில், அல்லது உடன் பணிபுரிபவரிடம்.',pl:'Home office, study room and the nameplate area.',pt:'வீட்டு அலுவலகம், படிக்கும் அறை, பெயர்ப்பலகை உள்ள பகுதி.'},
 {en:'Chances of getting it back are good; upstairs.',ta:'பொருள் திரும்பக் கிடைக்க நல்ல வாய்ப்பு; மேல்மாடியில்.',pl:'Entertainment room and gathering halls.',pt:'பொழுதுபோக்கு அறை, நண்பர்கள் கூடும் அரங்கு.'},
 {en:'Hard to find: a bedroom, far away, upstairs, or in a watery place.',ta:'கண்டுபிடிக்க கடினம்: படுக்கையறை, தொலைதூரம், மேல்மாடி அல்லது நீர்ப் பகுதி.',pl:'Bedrooms (for sleeping), isolation rooms and storehouse.',pt:'தூங்கும் படுக்கையறைகள், தனி அறைகள், சேமிப்புக் கிடங்கு.'}];

const LF_SIGN={
 0:{en:'Red surroundings: a red box, a red wall, or near red-coloured things.',ta:'சிவப்பு நிறச் சூழல்: சிவப்புப் பெட்டி, சிவப்புச் சுவர் அல்லது சிவப்பு நிறப் பொருட்கள் அருகில்.'},
 1:{en:'Near perfume, clean cloth, pink-coloured items, belongings of women, or pure water.',ta:'வாசனைத் திரவியம், சுத்தமான துணி, இளஞ்சிவப்பு (பிங்க்) நிறப் பொருட்கள், பெண்களின் பொருட்கள் அல்லது சுத்தமான நீர் அருகில்.'},
 2:{en:'With documents or papers; a green surrounding, a green slab, a wall or a grass area; near a Perumal (Vishnu) idol.',ta:'ஆவணங்கள், காகிதங்களுடன்; பச்சை நிறச் சூழல், பச்சைக் கல் மேடை, சுவர் அல்லது புல்வெளிப் பகுதி; பெருமாள் சிலை அருகில்.'},
 3:{en:'Near a pot or a water source, a bulb, or a white bag.',ta:'பானை அல்லது நீர் ஆதாரம், மின்விளக்கு அல்லது வெள்ளைப் பை அருகில்.'},
 4:{en:'Orange surroundings; near a window, a mirror or a light source; near a Lord Shiva or male god photo.',ta:'ஆரஞ்சு நிறச் சூழல்; ஜன்னல், கண்ணாடி அல்லது ஒளி மூலம் அருகில்; சிவபெருமான் அல்லது ஆண் தெய்வப் படம் அருகில்.'},
 8:{en:'Yellow surroundings, with auspicious things nearby.',ta:'மஞ்சள் நிறச் சூழல்; அருகில் மங்களப் பொருட்கள்.'},
 9:{en:'A back bag, a dark area or black slab, leather or old cloth; near a ditch or running water, a pot, or upstairs.',ta:'முதுகுப் பை, இருட்டான பகுதி அல்லது கருப்புக் கல் மேடை, தோல் அல்லது பழைய துணி; குழி அல்லது ஓடும் நீர் அருகில், பானை, அல்லது மேல்மாடி.'}};
LF_SIGN[5]=LF_SIGN[2]; LF_SIGN[6]=LF_SIGN[1]; LF_SIGN[7]=LF_SIGN[0]; LF_SIGN[11]=LF_SIGN[8]; LF_SIGN[10]=LF_SIGN[9];

const LF_TABLE=[
 {el:'Fire',et:'நெருப்பு',pl:'Kitchen and home gym',pt:'சமையலறை, வீட்டு உடற்பயிற்சி இடம்',ob:'Stove, fireplace, knives, tools, electrical fuse boxes.',ot:'அடுப்பு, நெருப்பிடம், கத்திகள், கருவிகள், மின் உருகிப் பெட்டிகள்.'},
 {el:'Earth',et:'நிலம்',pl:'Dining room and safe',pt:'சாப்பாட்டு அறை, பாதுகாப்புப் பெட்டகம்',ob:'Refrigerators, food pantries, vaults, heavy foundational furniture.',ot:'குளிர்சாதனப் பெட்டி, உணவுப் பொருள் அலமாரி, பெட்டகங்கள், கனமான மரச்சாமான்கள்.'},
 {el:'Air',et:'காற்று',pl:'Hallways and study room',pt:'நடைபாதை, படிக்கும் அறை',ob:'Bookshelves, routers, corridors, computers and desks.',ot:'புத்தக அலமாரிகள், ரூட்டர், தாழ்வாரம், கணினி, மேசைகள்.'},
 {el:'Water',et:'நீர்',pl:'Family room and cellar',pt:'குடும்ப அறை, பாதாள அறை',ob:'Cozy seating, old photo displays, laundry rooms and water pipes.',ot:'வசதியான இருக்கைகள், பழைய புகைப்படங்கள், துணி துவைக்கும் இடம், தண்ணீர்க் குழாய்கள்.'},
 {el:'Fire',et:'நெருப்பு',pl:'Living room and main entrance',pt:'வரவேற்பறை, பிரதான நுழைவாயில்',ob:'Fireplaces, large statement decor, mirrors and brightly lit spaces.',ot:'நெருப்பிடம், பெரிய அலங்காரப் பொருட்கள், கண்ணாடிகள், பிரகாசமான வெளிச்ச இடங்கள்.'},
 {el:'Earth',et:'நிலம்',pl:'Home office and utility closets',pt:'வீட்டு அலுவலகம், பயன்பாட்டு அலமாரிகள்',ob:'Medicine cabinets, cleaning closets, files and pet areas.',ot:'மருந்துப் பெட்டி, சுத்தம் செய்யும் பொருள் அலமாரி, கோப்புகள், செல்லப்பிராணிகள் இடம்.'},
 {el:'Air',et:'காற்று',pl:'Main bedroom and dressing room',pt:'முதன்மைப் படுக்கையறை, உடை மாற்றும் அறை',ob:'Wardrobes, vanity tables, art gallery walls and windows.',ot:'துணி அலமாரிகள், அலங்கார மேசை, ஓவியச் சுவர்கள், ஜன்னல்கள்.'},
 {el:'Water',et:'நீர்',pl:'Bathroom and plumbing',pt:'குளியலறை, குழாய் அமைப்பு',ob:'Toilets, drains, sewage systems, dark hidden spots and safes.',ot:'கழிப்பறைகள், வடிகால்கள், கழிவுநீர் அமைப்பு, இருட்டான மறைவிடங்கள், பெட்டகங்கள்.'},
 {el:'Fire',et:'நெருப்பு',pl:'Balcony, attic and prayer room',pt:'பால்கனி, மச்சு, பூஜை அறை',ob:'High ceilings, upper-level staircases, libraries and altars.',ot:'உயரமான மேற்கூரை, மேல்மாடிப் படிகள், நூலகங்கள், பீடங்கள்.'},
 {el:'Earth',et:'நிலம்',pl:'Basement and structure',pt:'பாதாள அறை, கட்டமைப்பு',ob:'Foundation beams, walls, dark storage spaces and stone surfaces.',ot:'அடித்தளக் கற்றைகள், சுவர்கள், இருட்டான சேமிப்பிடங்கள், கல் பரப்புகள்.'},
 {el:'Air',et:'காற்று',pl:'Entertainment and smart hubs',pt:'பொழுதுபோக்கு, ஸ்மார்ட் மையங்கள்',ob:'Gaming rooms, smart home networks, routers and creative studios.',ot:'விளையாட்டு அறைகள், ஸ்மார்ட் வீட்டு நெட்வொர்க், ரூட்டர்கள், படைப்பு ஸ்டுடியோக்கள்.'},
 {el:'Water',et:'நீர்',pl:'Guest bedrooms and sanctuary',pt:'விருந்தினர் படுக்கையறை, புனித இடம்',ob:'Meditation corners, aquarium areas, baths and abstract art spaces.',ot:'தியான மூலைகள், மீன் தொட்டிப் பகுதிகள், குளியலறைகள், கருத்தியல் கலை இடங்கள்.'}];

const LF_THIEF={
 Su:{en:'Sturdy or round build, wide shoulders, an authoritative presence, thinning hair, or a red-brown complexion.',ta:'உறுதியான அல்லது உருண்ட உடல், அகன்ற தோள்கள், அதிகாரத் தோரணை, மெலிந்த முடி, சிவப்பு கலந்த பழுப்பு நிறம்.'},
 Mo:{en:'Round or pale face, double chin, ample body, soft and emotional features, fine black hair.',ta:'உருண்ட அல்லது வெளிறிய முகம், இரட்டைத் தாடை, பருத்த உடல், மென்மையான உணர்ச்சிகரமான தோற்றம், மெல்லிய கருப்பு முடி.'},
 Ma:{en:'Lean or triangular muscular face, reddish complexion, curly hair, an energetic or sharp look.',ta:'மெலிந்த அல்லது முக்கோண வடிவ தசை முகம், சிவந்த நிறம், சுருள் முடி, சுறுசுறுப்பான கூர்மையான பார்வை.'},
 Me:{en:'Rectangular face, prominent forehead, long nose or chin, symmetrical limbs.',ta:'செவ்வக முகம், பரந்த நெற்றி, நீண்ட மூக்கு அல்லது தாடை, சமச்சீரான கை கால்கள்.'},
 Ju:{en:'Tall, stout or plump body, broad forehead, yellowish complexion, a warm and expansive presence.',ta:'உயரமான, பருத்த அல்லது தடித்த உடல், அகன்ற நெற்றி, மஞ்சள் கலந்த நிறம், கனிவான விரிந்த தோற்றம்.'},
 Ve:{en:'Glowing attractive face, lovely prominent eyes, curly hair, graceful and charming proportions.',ta:'ஒளிரும் அழகான முகம், கவர்ச்சியான கண்கள், சுருள் முடி, நளினமான வசீகரத் தோற்றம்.'},
 Sa:{en:'Lanky or bony face, deep-set eyes, dark complexion, thick hair, a stiff or disciplined posture.',ta:'ஒல்லியான அல்லது எலும்பு தெரியும் முகம், உள்வாங்கிய கண்கள், கருமை நிறம், அடர்ந்த முடி, விறைப்பான ஒழுக்கமான நிலை.'}};

function lfItem(cls,en,ta){return '<div class="lf-item '+cls+'">'+en+'<span class="ta">'+ta+'</span></div>';}

function lostFound(){
  const out=$('lostOut');
  const lat=parseFloat($('lat').value), lon=parseFloat($('lon').value), tz=parseFloat($('tz').value);
  if(isNaN(lat)||isNaN(lon)||isNaN(tz)){out.innerHTML='<p class="msg err">Choose a place (or enter latitude, longitude and UTC offset) above first.</p>';return;}
  if(Math.abs(lat)>62){out.innerHTML='<p class="msg err">Latitude beyond 62° is not supported.</p>';return;}
  if(typeof Astronomy==='undefined'){out.innerHTML='<p class="msg err">Planet positions need the astronomy library, which did not load. Check your connection and reload.</p>';return;}
  const ms=Date.now();
  CFG={lat:lat,lon:lon,kind:$('ayan').value};
  const asc=sidAsc(ms,lat,lon,CFG.kind), A=Math.floor(asc/30)%12, ag=SEGS[findSeg(asc)];
  const P={}; CODES.forEach(c=>{P[c]=sidLon(c,ms);});
  const sgn=c=>Math.floor(P[c]/30)%12, house=c=>((sgn(c)-A+12)%12)+1, starOf=c=>SEGS[findSeg(P[c])].star;
  const lord=h=>SIGNS[(A+h-1)%12][1];
  const lagL=lord(1), c4=lord(4), l7=lord(7), l8=lord(8), l11=lord(11), l12=lord(12);
  const h4=house(c4), st4=starOf(c4), sg4=sgn(c4);
  const occ=CODES.filter(c=>{const h=house(c);return h===8||h===12;});
  const good=[], bad=[];
  if(h4===4) good.push([ '4th lord '+NAME[c4]+' is in the 4th house.', '4-ஆம் அதிபதி '+TA[c4]+' 4-ஆம் வீட்டிலேயே உள்ளார்.' ]);
  if(h4===1&&sgn(lagL)===A) good.push([ '4th lord '+NAME[c4]+' is in the ascendant together with the lagna lord'+(c4===lagL?' (the same planet).':' '+NAME[lagL]+'.'), '4-ஆம் அதிபதி '+TA[c4]+' லக்னாதிபதி'+(c4===lagL?'யாகவே (ஒரே கிரகம்) லக்னத்தில் உள்ளார்.':' '+TA[lagL]+'யுடன் லக்னத்தில் உள்ளார்.') ]);
  if(h4===11) good.push([ '4th lord '+NAME[c4]+' is in the 11th house.', '4-ஆம் அதிபதி '+TA[c4]+' 11-ஆம் வீட்டில் உள்ளார்.' ]);
  if(st4===l11) good.push([ '4th lord '+NAME[c4]+' is in the star of the 11th lord '+NAME[l11]+'.', '4-ஆம் அதிபதி '+TA[c4]+' 11-ஆம் அதிபதி '+TA[l11]+' இன் நட்சத்திரத்தில் உள்ளார்.' ]);
  const nodes11=['Ra','Ke'].filter(c=>house(c)===11);
  if(nodes11.length) good.push([ nodes11.map(c=>NAME[c]).join(' and ')+' in the 11th house at the question time: recovery looks good.', nodes11.map(c=>TA[c]).join(', ')+' 11-ஆம் வீட்டில் உள்ளதால் பொருள் கிடைக்கும் வாய்ப்பு நல்லது.' ]);
  if(h4===8||h4===12) bad.push([ '4th lord '+NAME[c4]+' is in the '+ORD(h4)+' house.', '4-ஆம் அதிபதி '+TA[c4]+' '+TH(h4)+' வீட்டில் உள்ளார்.' ]);
  if(st4===l8||st4===l12) bad.push([ '4th lord '+NAME[c4]+' is in the star of the '+(st4===l8?'8th':'12th')+' lord '+NAME[st4]+'.', '4-ஆம் அதிபதி '+TA[c4]+' '+(st4===l8?'8':'12')+'-ஆம் அதிபதி '+TA[st4]+' இன் நட்சத்திரத்தில் உள்ளார்.' ]);
  if(occ.indexOf(st4)>=0) bad.push([ '4th lord '+NAME[c4]+' is in the star of '+NAME[st4]+', which is placed in the '+ORD(house(st4))+' house.', '4-ஆம் அதிபதி '+TA[c4]+' '+TA[st4]+' இன் நட்சத்திரத்தில் உள்ளார்; அவர் '+TH(house(st4))+' வீட்டில் நிற்கிறார்.' ]);
  let cls,ven,vta;
  if(good.length&&!bad.length){cls='';ven='High chance of getting the lost article back';vta='தொலைந்த பொருள் திரும்பக் கிடைக்க அதிக வாய்ப்பு';}
  else if(bad.length&&!good.length){cls='hard';ven='Hard to recover';vta='மீட்பது கடினம்';}
  else if(good.length&&bad.length){cls='mixed';ven='Mixed signs: recovery is possible with effort';vta='கலவையான அறிகுறிகள்: முயன்றால் மீட்க வாய்ப்பு உண்டு';}
  else{cls='mixed';ven='No strong sign either way: a moderate chance';vta='தெளிவான அறிகுறி இல்லை: நடுத்தர வாய்ப்பு';}

  const d=new Date(ms+tz*3600000), hms=p2(d.getUTCHours())+':'+p2(d.getUTCMinutes())+':'+p2(d.getUTCSeconds());
  let h='<div class="lf-time"><b>Question time:</b> '+d.getUTCDate()+' '+MON[d.getUTCMonth()]+' '+d.getUTCFullYear()+', '+hms+' (UTC'+(tz>=0?'+':'-')+Math.floor(Math.abs(tz))+':'+p2(Math.round((Math.abs(tz)%1)*60))+') · '+lat+', '+lon+'<br>'+
    '<b>Rising:</b> '+SIGNS[A][0]+' '+inSign(asc)+' · '+NAME[ag.lord]+'/'+NAME[ag.star]+'/'+NAME[ag.sub]+' · <span class="ta" style="font-family:var(--ta)">'+TLAG[A]+' லக்னம்</span><br>'+
    '<b>4th house:</b> '+SIGNS[(A+3)%12][0]+', 4th lord <b>'+NAME[c4]+'</b> ('+TA[c4]+') is in '+SIGNS[sg4][0]+', the '+ORD(h4)+' house, star of '+NAME[st4]+'.</div>';
  h+='<div class="lf-verdict '+cls+'" role="status"><b>'+ven+'</b><span class="ta">'+vta+'</span></div>';
  h+='<div class="lf-sec"><h3>Why<span class="ta">காரணங்கள்</span></h3>';
  good.forEach(g=>{h+=lfItem('good',g[0],g[1]);});
  bad.forEach(g=>{h+=lfItem('badc',g[0],g[1]);});
  if(!good.length&&!bad.length) h+=lfItem('info','The 4th lord is not in the 4th, 11th, 8th or 12th house and is not in the star of the 8th, 11th or 12th lord or of a planet in the 8th or 12th house.','4-ஆம் அதிபதி 4, 11, 8, 12-ஆம் வீடுகளில் இல்லை; 8, 11, 12-ஆம் அதிபதிகளின் அல்லது 8, 12-ஆம் வீட்டுக் கிரகங்களின் நட்சத்திரத்திலும் இல்லை.');
  h+='</div>';

  const hl=LF_HOUSE[h4], sl=LF_SIGN[sg4], tb=LF_TABLE[sg4];
  h+='<div class="lf-sec"><h3>Possible location<span class="ta">சாத்தியமான இடம்</span></h3>';
  h+=lfItem('info','<b>By house ('+ORD(h4)+'):</b> '+hl.en+'<br>Inside the house: '+hl.pl,'<b>வீட்டின் அடிப்படையில் ('+TH(h4)+'):</b> '+hl.ta+'<br>வீட்டிற்குள்: '+hl.pt);
  if(h4===7&&['Ra','Ke'].some(c=>house(c)===7)) h+=lfItem('info','Rahu or Ketu is also in the 7th house: look near water pipes.','ராகு அல்லது கேதுவும் 7-ஆம் வீட்டில் உள்ளதால் தண்ணீர்க் குழாய்கள் அருகில் பாருங்கள்.');
  if(h4===7&&house(l7)===7) h+=lfItem('info','The 4th lord and the 7th lord are both in the 7th house: possibly it is with a co-worker.','4-ஆம் அதிபதியும் 7-ஆம் அதிபதியும் 7-ஆம் வீட்டில் உள்ளதால் உடன் பணிபுரிபவரிடம் இருக்கலாம்.');
  h+=lfItem('info','<b>By sign ('+SIGNS[sg4][0]+'):</b> '+(sl?sl.en:'')+'<br>Element: '+tb.el+'. Dominant place: '+tb.pl+'. Objects: '+tb.ob,'<b>ராசியின் அடிப்படையில் ('+TSIGN[sg4]+'):</b> '+(sl?sl.ta:'')+'<br>தத்துவம்: '+tb.et+'. முக்கிய இடம்: '+tb.pt+'. பொருட்கள்: '+tb.ot);
  h+='</div>';

  if(h4===7){
    const t=LF_THIEF[l7];
    h+='<div class="lf-sec"><h3>Possibility of theft<span class="ta">திருட்டு சாத்தியம்</span></h3>'+
      lfItem('badc','The 4th lord is in the 7th house, so the article may have been taken. The 7th lord is <b>'+NAME[l7]+'</b> ('+TA[l7]+'), so the person may look like this: '+t.en,'4-ஆம் அதிபதி 7-ஆம் வீட்டில் உள்ளதால் பொருள் எடுக்கப்பட்டிருக்க வாய்ப்பு உண்டு. 7-ஆம் அதிபதி <b>'+TA[l7]+'</b> என்பதால் அந்த நபரின் தோற்றம்: '+t.ta)+'</div>';
  }
  h+='<details class="lf-det"><summary>Planet positions at the question time</summary>'+CODES.map(c=>'<div class="lf-item info">'+NAME[c]+' · <span class="ta" style="font-family:var(--ta)">'+TA[c]+'</span>: '+SIGNS[sgn(c)][0]+' '+inSign(P[c])+', '+ORD(house(c))+' house, star of '+NAME[starOf(c)]+'</div>').join('')+'</details>';
  h+='<p class="lf-note">Traditional guidance from the 4th lord at the question time. It is not a guarantee, so search patiently as well.<br><span class="ta" style="font-family:var(--ta);color:var(--accent)">கேள்வி நேரத்தின் 4-ஆம் அதிபதி அடிப்படையிலான பாரம்பரிய வழிகாட்டுதல் இது; உறுதியான முடிவு அல்ல. பொறுமையாகத் தேடவும் செய்யுங்கள்.</span></p>';
  out.innerHTML=h;
}
$('lostBtn').addEventListener('click',()=>{
  const pn=$('lostPanel'); pn.classList.remove('hide'); $('lostOut').innerHTML='';
  pn.scrollIntoView({block:'start'});
});
$('lostClose').addEventListener('click',()=>{$('lostPanel').classList.add('hide');});
$('lostTime').addEventListener('click',lostFound);

/* ---------- Cuspal chart (Placidus, sidereal KP) ---------- */
const LUCK_HOUSE=6;
const CUSP_RULES=[
 {h:2,t:[2,11],tag:'Financial gain',ta:'பண லாபம்',blink:true},
 {h:11,t:[11,2],mode:'both',tag:'Financial gain',ta:'பண லாபம்',blink:true},
 {h:11,t:[2,3,11],tag:'Money profit, effort success',ta:'பண லாபம், முயற்சியில் வெற்றி'},
 {h:5,t:[11],tag:'Exam success',ta:'தேர்வில் வெற்றி'},
 {h:3,t:[3,2,11],tag:'Media success',ta:'ஊடகத் துறையில் வெற்றி'},
 {h:4,t:[4,11],tag:'Medicine intake, land property and vehicle purchase success',ta:'மருந்து உட்கொள்ளல், நிலம்-சொத்து, வாகனம் வாங்குவதில் வெற்றி'},
 {h:LUCK_HOUSE,t:[3,11,2],tag:'Luck and speculation possibilities',ta:'அதிர்ஷ்டம், ஊக வணிக வாய்ப்புகள்'},
 {h:7,t:[11],tag:'Friends and profit, media video',ta:'நண்பர்கள், லாபம், ஊடக வீடியோ'},
 {h:8,t:[11],tag:'Gain from society, insurance, pension',ta:'சமூகம், காப்பீடு, ஓய்வூதியம் மூலம் லாபம்'},
 {h:9,t:[11,3],tag:'Good to travel, temple, promotion, higher studies',ta:'பயணம், கோவில், பதவி உயர்வு, உயர்கல்விக்கு நல்லது'},
 {h:10,t:[11],tag:'Business deals, job application',ta:'வியாபார ஒப்பந்தங்கள், வேலை விண்ணப்பம்'},
 {h:12,t:[11,4],tag:'Travel success',ta:'பயணத்தில் வெற்றி'}];

function obliq(jd){const T=(jd-2451545)/36525;return 23.4392911-0.0130042*T;}
function ramcOf(ms,lon){
  const jd=ms/86400000+2440587.5,d=jd-2451545,T=d/36525;
  return mod(280.46061837+360.98564736629*d+0.000387933*T*T-T*T*T/38710000+lon,360);
}
function placidusCusps(ms,lat,lon,kind){
  const jd=ms/86400000+2440587.5, th=ramcOf(ms,lon), e=rad(obliq(jd)), phi=rad(lat);
  const decl=ra=>Math.atan(Math.tan(e)*Math.sin(rad(ra)));
  const sda=ra=>deg(Math.acos(Math.max(-1,Math.min(1,-Math.tan(phi)*Math.tan(decl(ra))))));
  const lam=ra=>mod(deg(Math.atan2(Math.sin(rad(ra)),Math.cos(rad(ra))*Math.cos(e))),360);
  const up=f=>{let ra=th+f*90;for(let i=0;i<40;i++)ra=th+f*sda(ra);return lam(ra);};
  const dn=f=>{let ra=th+180-(1-f)*90;for(let i=0;i<40;i++)ra=th+180-(1-f)*(180-sda(ra));return lam(ra);};
  const asc=mod(deg(Math.atan2(Math.cos(rad(th)),-(Math.sin(rad(th))*Math.cos(e)+Math.tan(phi)*Math.sin(e)))),360);
  const mc=lam(th), c11=up(1/3), c12=up(2/3), c2=dn(1/3), c3=dn(2/3), a=ayanamsa(jd,kind);
  return [asc,c2,c3,mc+180,c11+180,c12+180,asc+180,c2+180,c3+180,mc,c11,c12].map(x=>mod(x-a,360));
}

function cuspBuild(ms){
  const cu=placidusCusps(ms,CFG.lat,CFG.lon,CFG.kind);
  const hs=cu.map((lon,i)=>({n:i+1,lon:lon,g:SEGS[findSeg(lon)]}));
  const A=hs[0].g.sign, P={};
  CODES.forEach(c=>{P[c]=sidLon(c,ms);});
  const houseOf=c=>((Math.floor(P[c]/30)%12-A+12)%12)+1;
  const lordH=n=>hs[n-1].g.lord;
  const roles=(c,t)=>t.filter(h=>lordH(h)===c);
  const rtxt=r=>r.map(h=>ORD(h)).join(' and ')+' lord';
  const rtam=r=>r.map(h=>TH(h)).join(', ')+' அதிபதி';
  const bad8=c=>{const h=houseOf(c);return h===8||h===12;};
  const checks=[2,3,11].map(h=>({h:h,c:lordH(h),pos:houseOf(lordH(h)),bad:bad8(lordH(h))}));
  let rows='<thead><tr><th>House</th><th>Degree</th><th>Sign</th><th>Star</th><th>Sign lord</th><th>Star lord</th><th>Sub lord</th></tr></thead><tbody>';
  let nblink=0;
  hs.forEach(x=>{
    const g=x.g, tags=[];
    CUSP_RULES.filter(r=>r.h===x.n).forEach(r=>{
      const rS=roles(g.star,r.t), rB=roles(g.sub,r.t);
      const hit=r.mode==='both'?(rS.length&&rB.length):(rS.length||rB.length);
      if(!hit)return;
      const used=[];rS.concat(rB).forEach(h=>{if(used.indexOf(h)<0)used.push(h);});
      const cancels=used.filter(h=>(h===2||h===3||h===11)&&bad8(lordH(h)));
      let en=[],ta=[];
      if(rS.length){en.push('star lord '+NAME[g.star]+' is the '+rtxt(rS));ta.push('நட்சத்திராதிபதி '+TA[g.star]+' '+rtam(rS));}
      if(rB.length){en.push('sub lord '+NAME[g.sub]+' is the '+rtxt(rB));ta.push('உப அதிபதி '+TA[g.sub]+' '+rtam(rB));}
      if(r.h===11&&r.t.length===3&&used.indexOf(2)>=0&&used.indexOf(11)>=0){en.push('both the 2nd and 11th lords: strong');ta.push('2, 11-ஆம் அதிபதிகள் இருவரும்: வலுவானது');}
      tags.push({r:r,en:en.join('; '),ta:ta.join('; '),cancel:cancels.map(h=>({h:h,c:lordH(h),pos:houseOf(lordH(h))}))});
    });
    const blink=tags.some(t=>t.r.blink&&!t.cancel.length);
    if(blink)nblink++;
    const cls=blink?' class="blink green" style="--bd:-'+(Date.now()%1000)+'ms"':'';
    rows+='<tr'+cls+'><td class="hn">'+x.n+'</td><td>'+dms(x.lon-g.sign*30)+'</td><td>'+SIGNS[g.sign][0]+'<span class="ta">'+TSIGN[g.sign]+'</span></td><td>'+NAKS[g.nak]+'</td>'+
      '<td>'+NAME[g.lord]+'<span class="ta">'+TA[g.lord]+'</span></td><td>'+NAME[g.star]+'<span class="ta">'+TA[g.star]+'</span></td><td>'+NAME[g.sub]+'<span class="ta">'+TA[g.sub]+'</span></td></tr>';
    if(tags.length){
      rows+='<tr class="tg'+(blink?' blink green':'')+'"'+(blink?' style="--bd:-'+(Date.now()%1000)+'ms"':'')+'><td></td><td colspan="6">'+tags.map(t=>{
        if(t.cancel.length){
          const why=t.cancel.map(k=>ORD(k.h)+' lord '+NAME[k.c]+' is in the '+ORD(k.pos)+' house').join('; ');
          const whyt=t.cancel.map(k=>TH(k.h)+' அதிபதி '+TA[k.c]+' '+TH(k.pos)+' வீட்டில் உள்ளார்').join('; ');
          return '<span class="ctag no">'+t.r.tag+' · '+t.r.ta+'</span><span class="ctd">Cancelled: '+why+'.<span class="ta">ரத்து: '+whyt+'.</span></span>';
        }
        return '<span class="ctag ok">'+t.r.tag+' · '+t.r.ta+'</span><span class="ctd">'+t.en+'.<span class="ta">'+t.ta+'.</span></span>';
      }).join('')+'</td></tr>';
    }
  });
  rows+='</tbody>';
  let lords='<h3>2nd, 3rd and 11th lords from the transit ascendant<span class="ta">லக்னத்திலிருந்து 2, 3, 11-ஆம் அதிபதிகள்</span></h3>'+
    checks.map(k=>lfItem(k.bad?'badc':'good',ORD(k.h)+' lord <b>'+NAME[k.c]+'</b> is in the '+ORD(k.pos)+' house'+(k.bad?': should not be in the 8th or 12th house.':'.'),TH(k.h)+' அதிபதி <b>'+TA[k.c]+'</b> '+TH(k.pos)+' வீட்டில் உள்ளார்'+(k.bad?': 8 அல்லது 12-ஆம் வீட்டில் இருக்கக்கூடாது.':'.'))).join('');
  const bhf=lonv=>{for(let i=0;i<12;i++){const a=cu[i],b=cu[(i+1)%12];if(mod(lonv-a,360)<mod(b-a,360))return i+1;}return 1;};
  const dgx=x=>Math.floor(x%30)+'°', dgl=x=>Math.floor(x%30)+'°'+p2(Math.floor((x%30%1)*60))+'′';
  const bySign=Array.from({length:12},()=>[]), byHouse=Array.from({length:12},()=>[]);
  hs.forEach(x=>{const it={k:'C',t:'C'+x.n,d:dgx(x.lon),dl:dgl(x.lon)}; bySign[Math.floor(x.lon/30)%12].push(it); byHouse[(A+x.n-1)%12].push(Object.assign({},it));});
  CODES.forEach(c=>{const l=P[c]; let rt=false; try{rt=(c!=='Su'&&c!=='Mo')&&isRetro(c,ms);}catch(e){} const it={k:c,t:I18N60.pn(c,true),d:dgx(l),dl:dgl(l),r:rt}; bySign[Math.floor(l/30)%12].push(it); byHouse[(A+bhf(l)-1)%12].push(Object.assign({},it));});
  const csigns=SIGNS.map((x,i)=>I18N60.sn(i)), crise=csigns[A]+' '+T60('rising'), ctl=T60('Cuspal Chart (Bhava)'), cay='Placidus · '+(CFG.kind==='kp'?'KP':'Lahiri');
  const chart=CH60.draw({A:A,by:bySign,signs:csigns,hn:hs.map(x=>x.g.sign+1),center:[{t:ctl,c:'c60t'},{t:crise,c:'c60q'},{t:cay,c:'c60k'}],caption:[{t:ctl+' · '+crise,c:'c60t'},{t:cay,c:'c60k'}],south:{by:bySign,caption:[]},north:{by:byHouse,center:[]},w:westPack(ms,cu,P,Object.fromEntries(CODES.map(c=>{let r=false;try{r=(c!=='Su'&&c!=='Mo')&&isRetro(c,ms);}catch(e){}return [c,r];}))),aria:ctl});
  return {rows:rows,lords:lords,nblink:nblink,asc:hs[0],ms:ms,chart:chart};
}

let CU={on:false,frozen:false,n:0};
function cuspRefresh(full){
  const lat=parseFloat($('lat').value), lon=parseFloat($('lon').value), tz=parseFloat($('tz').value);
  const head=$('cuspHead');
  if(isNaN(lat)||isNaN(lon)||isNaN(tz)){head.innerHTML='<span class="err">Choose a place (or enter latitude, longitude and UTC offset) above first.</span>';return;}
  if(Math.abs(lat)>62){head.innerHTML='<span class="err">Latitude beyond 62° is not supported.</span>';return;}
  if(typeof Astronomy==='undefined'){head.innerHTML='<span class="err">Planet positions need the astronomy library, which did not load. Check your connection and reload.</span>';return;}
  CFG={lat:lat,lon:lon,kind:$('ayan').value};
  if(!CU.frozen)CU.ms=Date.now();
  const d=new Date(CU.ms+tz*3600000), hms=p2(d.getUTCHours())+':'+p2(d.getUTCMinutes())+':'+p2(d.getUTCSeconds());
  const asc=sidAsc(CU.ms,lat,lon,CFG.kind), g=SEGS[findSeg(asc)];
  head.innerHTML='<b>'+(CU.frozen?'Frozen at':'Present transit time')+':</b> '+d.getUTCDate()+' '+MON[d.getUTCMonth()]+' '+d.getUTCFullYear()+', '+hms+' (UTC'+(tz>=0?'+':'-')+Math.floor(Math.abs(tz))+':'+p2(Math.round((Math.abs(tz)%1)*60))+')<br><b>Rising:</b> '+SIGNS[g.sign][0]+' '+inSign(asc)+' · '+NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub]+' · <span style="font-family:var(--ta)">'+TLAG[g.sign]+' லக்னம்</span>';
  if(full||CU.n%5===0||CU.frozen){
    const r=cuspBuild(CU.ms);
    $('cuspTab').innerHTML=r.rows; $('cuspLords').innerHTML=r.lords; $('cuspChart').innerHTML=r.chart;
  }
  CU.n++;
}
$('cuspBtn').addEventListener('click',()=>{
  CU.on=true;CU.n=0;CU.frozen=false;$('cuspFreeze').textContent='Freeze';
  $('cuspPanel').classList.remove('hide'); cuspRefresh(true); $('cuspPanel').scrollIntoView({block:'start'});
});
$('cuspClose').addEventListener('click',()=>{CU.on=false;$('cuspPanel').classList.add('hide');});
$('cuspFreeze').addEventListener('click',()=>{
  CU.frozen=!CU.frozen; $('cuspFreeze').textContent=CU.frozen?'Resume live':'Freeze'; cuspRefresh(true);
});
setInterval(()=>{if(CU.on&&!CU.frozen)cuspRefresh(false);},1000);

/* ---------- Dhana muhurtham and Highly auspicious muhurtham ---------- */
let XT={};
const kendraH=h=>h===1||h===4||h===7||h===10;
const mutualKendra=(a,b)=>[0,3,6,9].indexOf((b-a+12)%12)>=0;
function extraTags(idx){
  if(XT[idx])return XT[idx];
  const r=ROWS[idx], g=SEGS[r.k], A=g.sign, mid=(r.start+r.end)/2, P={};
  CODES.forEach(c=>{P[c]=sidLon(c,mid);});
  const house=c=>((Math.floor(P[c]/30)%12-A+12)%12)+1;
  const starOf=c=>SEGS[findSeg(P[c])].star;
  const lord=h=>SIGNS[(A+h-1)%12][1];
  const L2=lord(2),L3=lord(3),L8=lord(8),L11=lord(11),L12=lord(12);
  const res={dhana:false,high:false,dtxt:'',htxt:''};
  const h2=house(L2),h11=house(L11), own2=starOf(L2)===L2, own11=starOf(L11)===L11;
  const inG=h=>h===1||h===3||h===11;
  const good=(own2&&inG(h2))||(own11&&inG(h11));
  const rel=h2===h11||(kendraH(h2)&&kendraH(h11)&&mutualKendra(h2,h11));
  const ms=starOf('Mo');
  if(good&&rel&&(ms===L2||ms===L11)){
    res.dhana=true;
    res.dtxt='<b>Dhana muhurtham:</b> 2nd lord '+NAME[L2]+' ('+(own2?'own star, ':'')+ORD(h2)+' house) and 11th lord '+NAME[L11]+' ('+(own11?'own star, ':'')+ORD(h11)+' house) '+(h2===h11?'are in the same house':'are both in kendra')+'; Moon is in the star of '+NAME[ms]+', the '+(ms===L2?'2nd':'11th')+' lord.';
  }
  const S=g.star,B=g.sub,hS=house(S),hB=house(B), bad=h=>h===8||h===12, bs=c=>{const t=starOf(c);return t===L8||t===L12;};
  if((S===L3||S===L11)&&(B===L3||B===L11)&&mutualKendra(hS,hB)&&!bad(hS)&&!bad(hB)&&!bs(S)&&!bs(B)){
    res.high=true;
    res.htxt='<b>Highly auspicious:</b> star lord '+NAME[S]+' ('+(S===L3?'3rd':'11th')+' lord, '+ORD(hS)+' house) and sub lord '+NAME[B]+' ('+(B===L3?'3rd':'11th')+' lord, '+ORD(hB)+' house) '+(hS===hB?'are in the same house':'are in kendra to each other')+', not in the 8th or 12th house and not in the star of the 8th or 12th lord.'+((starOf(S)===L3&&starOf(B)===L3)?' Both are also in the star of the 3rd lord.':'');
  }
  XT[idx]=res; return res;
}
function xtPillsRaw(xt,allowHigh){
  if(!xt)return '';
  return (xt.dhana?'<span class="pill gain">Dhana muhurtham · தன முகூர்த்தம்</span>':'')+(allowHigh&&xt.high?'<span class="pill gain">Highly auspicious · மிகச் சிறந்த சுப முகூர்த்தம்</span>':'');
}
function xtPills(xt,allowHigh){const r=xtPillsRaw(xt,allowHigh);return r?'<span class="pl">'+r+'</span>':'';}
function xtInfo(xt,allowHigh){
  if(!xt)return '';
  const a=[]; if(xt.dhana)a.push(xt.dtxt); if(allowHigh&&xt.high)a.push(xt.htxt); return a.join('<br>');
}
function tagOk(i){const t=$('tagShow').value,x=extraTags(i);return t==='all'||(t==='dhana'&&x.dhana)||(t==='high'&&x.high);}
function xtCopy(i){
  if(MODE==='all')return '';
  const x=extraTags(i);
  return (x.dhana?'  [Dhana muhurtham]':'')+(MODE!=='ana'&&x.high?'  [Highly auspicious]':'');
}
function fillTagOpts(m){
  const sel=$('tagShow');
  const want=m==='gmp'?[['all','All muhurtham windows'],['dhana','Dhana muhurtham only'],['high','Highly auspicious only']]:[['all','All timings that pass'],['dhana','Dhana muhurtham only']];
  const key=want.map(x=>x[0]).join();
  if(sel.dataset.k!==key){sel.innerHTML=want.map(x=>'<option value="'+x[0]+'">'+x[1]+'</option>').join('');sel.dataset.k=key;}
}

/* ---------- Date-range muhurtham finder ---------- */
const fmtHMS=(ms,tz)=>{const d=new Date(ms+tz*3600000);return p2(d.getUTCHours())+':'+p2(d.getUTCMinutes())+':'+p2(d.getUTCSeconds());};
const fmtDate=(ms,tz)=>{const d=new Date(ms+tz*3600000);return d.getUTCDate()+' '+MON[d.getUTCMonth()]+' '+d.getUTCFullYear();};
function rangeEval(r){
  const g=SEGS[r.k], A=g.sign;
  const lord=h=>SIGNS[(A+h-1)%12][1];
  const L2=lord(2),L3=lord(3),L11=lord(11),L8=lord(8),L12=lord(12), S=g.star, B=g.sub;
  const set=[L2,L3,L11];
  if(set.indexOf(S)<0||set.indexOf(B)<0)return null;
  const roles=c=>[[2,L2],[3,L3],[11,L11]].filter(x=>x[1]===c).map(x=>x[0]);
  const rr=roles(S).concat(roles(B));
  if(rr.indexOf(3)<0||rr.indexOf(11)<0)return null;
  const mid=(r.start+r.end)/2, P={};
  [L3,L11].forEach(c=>{P[c]=sidLon(c,mid);});
  const house=c=>((Math.floor(P[c]/30)%12-A+12)%12)+1;
  const st=c=>SEGS[findSeg(P[c])].star;
  const h3=house(L3),h11=house(L11);
  if(!mutualKendra(h3,h11))return null;
  if(st(L3)===L8||st(L3)===L12||st(L11)===L8||st(L11)===L12)return null;
  return 'star lord '+NAME[S]+' ('+roles(S).map(ORD).join(' & ')+' lord), sub lord '+NAME[B]+' ('+roles(B).map(ORD).join(' & ')+' lord)<br>3rd lord '+NAME[L3]+' in the '+ORD(h3)+' house, 11th lord '+NAME[L11]+' in the '+ORD(h11)+' house ('+(h3===h11?'same house':'kendra to each other')+'); in the stars of '+NAME[st(L3)]+' and '+NAME[st(L11)];
}
let RG=null;
function rangeRun(){
  const msg=$('rgMsg'), out=$('rgOut');
  const lat=parseFloat($('lat').value), lon=parseFloat($('lon').value), tz=parseFloat($('tz').value), f=$('rgFrom').value, t=$('rgTo').value;
  msg.className='msg err'; out.innerHTML='';
  if(isNaN(lat)||isNaN(lon)||isNaN(tz)){msg.textContent='Choose a place (or enter latitude, longitude and UTC offset) in the form above first.';return;}
  if(Math.abs(lat)>62){msg.textContent='Latitude beyond 62° is not supported.';return;}
  if(typeof Astronomy==='undefined'){msg.textContent='Planet positions need the astronomy library, which did not load. Check your connection and reload.';return;}
  if(!f||!t){msg.textContent='Pick both a from date and a to date.';return;}
  const a=f.split('-').map(Number), b=t.split('-').map(Number);
  const s0=Date.UTC(a[0],a[1]-1,a[2])-tz*3600000, nd=Math.round((Date.UTC(b[0],b[1]-1,b[2])-Date.UTC(a[0],a[1]-1,a[2]))/86400000)+1;
  if(nd<1){msg.textContent='The to date must not be before the from date.';return;}
  if(nd>31){msg.textContent='Please choose at most 31 days.';return;}
  msg.className='msg';
  const kind=$('ayan').value, old=CFG; CFG={lat:lat,lon:lon,kind:kind};
  const items=[]; let day=0;
  $('rgGo').disabled=true;
  (function step(){
    if(day>=nd){
      CFG=old; $('rgGo').disabled=false;
      RG={items:items,tz:tz,f:f,t:t,lat:lat,lon:lon};
      rangeShow(); return;
    }
    const s=s0+day*86400000, rows=compute(s,s+86400000,lat,lon,kind);
    rows.forEach(r=>{const x=rangeEval(r); if(x)items.push({r:r,x:x,day:s});});
    day++; msg.textContent='Checking day '+day+' of '+nd+'…';
    setTimeout(step,0);
  })();
}
function rangeShow(){
  const out=$('rgOut'), tz=RG.tz; let h='', last=-1;
  RG.items.forEach(it=>{
    const g=SEGS[it.r.k];
    if(it.day!==last){h+='<div class="lf-sec"><h3>'+fmtDate(it.day,tz)+'</h3></div>';last=it.day;}
    h+='<ul style="margin-top:6px"><li class="row gm" data-s="'+it.r.start+'" data-e="'+it.r.end+'" data-tz="'+tz+'" data-lat="'+RG.lat+'" data-lon="'+RG.lon+'" data-kind="'+$('ayan').value+'" style="--h:'+HUE[g.sub]+'"><div class="t2"><div><span>Begin</span><b>'+fmtHMS(it.r.start,tz)+'</b></div><div><span>End</span><b>'+fmtHMS(it.r.end,tz)+'</b></div></div>'+
      '<div class="l"><span class="n">'+NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub]+'</span><span class="pl"><span class="pill gain">Auspicious lagna muhurtham · சுப லக்ன முகூர்த்தம்</span></span><span class="ta">'+tl(g)+'</span><span class="c">'+SIGNS[g.sign][0]+' ascendant · '+TLAG[g.sign]+' லக்னம்</span></div>'+
      '<div class="chk">'+it.x+'</div><div class="p"><span>'+span(g)+' · '+NAKS[g.nak]+'</span><span>lasts '+dur(it.r.end-it.r.start)+'</span></div></li></ul>';
  });
  $('rgMsg').textContent=RG.items.length+' auspicious lagna timings from '+RG.f+' to '+RG.t+'.';
  if(!RG.items.length) h='<p class="msg">No timing in this range fulfils the rule.</p>';
  else h+='<div class="btns"><button id="rgCopy" type="button">Copy as text</button></div>';
  out.innerHTML=h;
  const cb=$('rgCopy'); if(cb)cb.addEventListener('click',()=>{
    const tz2=RG.tz;
    const text='Auspicious lagna muhurtham '+RG.f+' to '+RG.t+' ('+RG.lat+', '+RG.lon+')\n'+RG.items.map(it=>{const g=SEGS[it.r.k];return fmtDate(it.day,tz2)+'  '+fmtHMS(it.r.start,tz2)+' - '+fmtHMS(it.r.end,tz2)+'  '+SIGNS[g.sign][0]+' ascendant  '+NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub]+'  ('+TLAG[g.sign]+' லக்னம் '+tl(g)+')';}).join('\n');
    try{navigator.clipboard.writeText(text).then(()=>{$('rgMsg').textContent='Copied.';},()=>{});}catch(e){}
  });
}

/* ---------- Horse race ---------- */
const HN={Su:[1,10],Mo:[2,20],Ma:[9,18],Ra:[4,13],Ju:[3,12],Sa:[8,17],Ve:[6,15],Ke:[7,16],Me:[5,14]};
const RC_HINT={
 Su:{en:'king, administrator, a king name from history',ta:'அரசன், நிர்வாகி, வரலாற்றில் வந்த மன்னர் பெயர்'},
 Mo:{en:'milk-white colour; queen, salt, moon, luna',ta:'பால் வெள்ளை நிறம்; ராணி, உப்பு, நிலா, லூனா'},
 Ma:{en:'warrior, blood, knife, army, lightning, thunder, speed, fire',ta:'போர்வீரன், இரத்தம், கத்தி, படை, மின்னல், இடி, வேகம், நெருப்பு'},
 Ju:{en:'a saint or a saint name, good heart, teacher',ta:'முனிவர் அல்லது துறவி பெயர், நல்ல மனம், ஆசிரியர்'},
 Sa:{en:'satan, knife, dark, night, black, spirit',ta:'சாத்தான், கத்தி, இருள், இரவு, கருப்பு, ஆவி'},
 Ve:{en:'beauty, love, a woman name, perfume',ta:'அழகு, காதல், பெண் பெயர், வாசனைத் திரவியம்'},
 Me:{en:'joker, clown, prince, a comical character',ta:'ஜோக்கர், கோமாளி, இளவரசன், நகைச்சுவைப் பாத்திரம்'},
 Ra:{en:'snake names, blue, Arabic names, tiger',ta:'பாம்பு பெயர்கள், நீலம், அரபு பெயர்கள், புலி'},
 Ke:{en:'elephant, wisdom, net',ta:'யானை, ஞானம், வலை'}};
const CITY=window.GA_CITY;
const WC=CITY.c.map(r=>({n:r[0],cc:CITY.cc[r[1]],lat:r[2],lon:r[3],tz:CITY.tz[r[4]],st:(CITY.st&&CITY.st[r[5]])||''}));
const RCS=[
 ['Guindy Racecourse, Chennai','India',13.0067,80.2206,'Asia/Kolkata'],['Mahalaxmi Racecourse, Mumbai','India',18.9818,72.8180,'Asia/Kolkata'],
 ['Bangalore Turf Club','India',12.9833,77.5833,'Asia/Kolkata'],['Malakpet Racecourse, Hyderabad','India',17.3753,78.5075,'Asia/Kolkata'],
 ['Royal Calcutta Turf Club, Kolkata','India',22.5430,88.3436,'Asia/Kolkata'],['Pune Racecourse','India',18.4986,73.8984,'Asia/Kolkata'],
 ['Mysore Racecourse','India',12.3111,76.6297,'Asia/Kolkata'],['Ooty Racecourse','India',11.4103,76.6957,'Asia/Kolkata'],
 ['Nuwara Eliya Racecourse','Sri Lanka',6.9690,80.7660,'Asia/Colombo'],
 ['Ascot','United Kingdom',51.4072,-0.6770,'Europe/London'],['Epsom Downs','United Kingdom',51.3128,-0.2616,'Europe/London'],
 ['Newmarket','United Kingdom',52.2445,0.3966,'Europe/London'],['Cheltenham','United Kingdom',51.9142,-2.0600,'Europe/London'],
 ['Aintree','United Kingdom',53.4768,-2.9540,'Europe/London'],['York','United Kingdom',53.9444,-1.0978,'Europe/London'],
 ['Goodwood','United Kingdom',50.8990,-0.7527,'Europe/London'],['Doncaster','United Kingdom',53.5130,-1.1035,'Europe/London'],
 ['The Curragh','Ireland',53.1550,-6.7970,'Europe/Dublin'],['Leopardstown','Ireland',53.2713,-6.1993,'Europe/Dublin'],
 ['Longchamp, Paris','France',48.8603,2.2339,'Europe/Paris'],['Chantilly','France',49.1935,2.4660,'Europe/Paris'],['Deauville','France',49.3535,0.0752,'Europe/Paris'],
 ['Churchill Downs, Louisville','United States',38.2031,-85.7700,'America/Kentucky/Louisville'],['Belmont Park, New York','United States',40.7149,-73.7236,'America/New_York'],
 ['Saratoga','United States',43.0720,-73.7737,'America/New_York'],['Pimlico, Baltimore','United States',39.3612,-76.6727,'America/New_York'],
 ['Santa Anita, Arcadia','United States',34.1397,-118.0465,'America/Los_Angeles'],['Keeneland, Lexington','United States',38.0460,-84.6080,'America/New_York'],
 ['Gulfstream Park, Florida','United States',25.9810,-80.1414,'America/New_York'],['Del Mar','United States',32.9747,-117.2603,'America/Los_Angeles'],
 ['Flemington, Melbourne','Australia',-37.7881,144.9120,'Australia/Melbourne'],['Randwick, Sydney','Australia',-33.9054,151.2432,'Australia/Sydney'],
 ['Caulfield, Melbourne','Australia',-37.8788,145.0415,'Australia/Melbourne'],['Eagle Farm, Brisbane','Australia',-27.4308,153.0687,'Australia/Brisbane'],
 ['Ellerslie, Auckland','New Zealand',-36.8873,174.8067,'Pacific/Auckland'],
 ['Sha Tin','Hong Kong',22.4008,114.2037,'Asia/Hong_Kong'],['Happy Valley','Hong Kong',22.2686,114.1826,'Asia/Hong_Kong'],
 ['Tokyo Racecourse, Fuchu','Japan',35.6620,139.4850,'Asia/Tokyo'],['Nakayama','Japan',35.7220,139.9560,'Asia/Tokyo'],
 ['Hanshin','Japan',34.7778,135.3631,'Asia/Tokyo'],['Kyoto Racecourse','Japan',34.9045,135.7450,'Asia/Tokyo'],
 ['Meydan, Dubai','United Arab Emirates',25.1620,55.3000,'Asia/Dubai'],['Kranji, Singapore','Singapore',1.4130,103.7570,'Asia/Singapore'],
 ['Selangor Turf Club, Kuala Lumpur','Malaysia',3.0780,101.7160,'Asia/Kuala_Lumpur'],
 ['Turffontein, Johannesburg','South Africa',-26.2603,28.0372,'Africa/Johannesburg'],['Kenilworth, Cape Town','South Africa',-33.9840,18.4730,'Africa/Johannesburg'],
 ['Palermo, Buenos Aires','Argentina',-34.5750,-58.4300,'America/Argentina/Buenos_Aires'],['Gavea, Rio de Janeiro','Brazil',-22.9780,-43.2280,'America/Sao_Paulo']
].map(r=>({n:r[0],cc:r[1],lat:r[2],lon:r[3],tz:r[4]}));
let RC_LIST=[];
function rcFill(){
  const q=$('rcSearch').value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''), cn=$('rcCountry').value, sel=$('rcCity');
  let list, tag=false;
  if(cn==='*r'){
    list=RCS.filter(x=>!q||(x.n+' '+x.cc).toLowerCase().indexOf(q)>=0); tag=true;
    if(q&&!list.length){list=WC.filter(x=>plKey(x).indexOf(q)>=0).slice(0,400);}
  }else if(cn==='*a'){
    list=q?WC.filter(x=>plKey(x).indexOf(q)>=0).slice(0,400):[]; tag=true;
  }else{
    list=WC.filter(x=>x.cc===cn&&(!q||plKey(x).indexOf(q)>=0)).slice(0,600);
  }
  if(!list.length)list=webC(q,rcFill);
  RC_LIST=list;
  sel.innerHTML=list.length?list.map((x,i)=>'<option value="'+i+'">'+x.n+(x.st?', '+x.st:'')+(tag?', '+x.cc:'')+'</option>').join(''):'<option value="">No match in the offline list. Online search is tried automatically when you are connected</option>';
  rcPick();
}
function rcPick(){
  const x=RC_LIST[parseInt($('rcCity').value,10)];
  if(x){$('rcLat').value=x.lat;$('rcLon').value=x.lon;$('rcTz').value=x.tz;}
}
function offsetAt(ms,tz){
  const f=new Intl.DateTimeFormat('en-US',{timeZone:tz,hourCycle:'h23',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',second:'numeric'});
  const o={}; f.formatToParts(new Date(ms)).forEach(p=>{if(p.type!=='literal')o[p.type]=+p.value;});
  if(o.hour===24)o.hour=0;
  return (Date.UTC(o.year,o.month-1,o.day,o.hour,o.minute,o.second)-Math.floor(ms/1000)*1000)/3600000;
}
function localToUtc(y,m,d,hh,mi,tz){
  if(/^-?\d+(\.\d+)?$/.test(tz)){const off=parseFloat(tz);return {ms:Date.UTC(y,m-1,d,hh,mi)-off*3600000,off:off};}
  const guess=Date.UTC(y,m-1,d,hh,mi);
  let off=offsetAt(guess,tz), u=guess-off*3600000;
  off=offsetAt(u,tz); u=guess-off*3600000;
  return {ms:u,off:off};
}
const rcNum=(c,N,cls)=>{const n=HN[c].filter(x=>x<=N);return n.length?n.map(x=>'<span class="hnum'+(cls?' '+cls:'')+'">'+x+'</span>').join(''):'<span class="ctd" style="display:inline">(no number up to '+N+')</span>';};
const rcRow=(b,en,ta)=>'<div class="lf-item info rc-row">'+b+' '+en+'<span class="ta">'+ta+'</span></div>';
const rcSec=(en,ta)=>'<div class="lf-sec"><h3>'+en+'<span class="ta">'+ta+'</span></h3>';

function raceAnalyse(ms,lat,lon,N,kind,off){
  const old=CFG; CFG={lat:lat,lon:lon,kind:kind};
  try{
    const asc=sidAsc(ms,lat,lon,kind), g=SEGS[findSeg(asc)], A=g.sign;
    const P={}; CODES.forEach(c=>{P[c]=sidLon(c,ms);});
    const sgn=c=>Math.floor(P[c]/30)%12, house=c=>((sgn(c)-A+12)%12)+1, seg=c=>SEGS[findSeg(P[c])], starOf=c=>seg(c).star;
    const lord=h=>SIGNS[(A+h-1)%12][1];
    const L3=lord(3),L6=lord(6),L8=lord(8),L11=lord(11),L12=lord(12);
    const cu=placidusCusps(ms,lat,lon,kind), cuspSub=n=>SEGS[findSeg(cu[n-1])].sub;
    const I={}; CODES.forEach(c=>{I[c]={c:c,h:house(c),pts:0,why:[],ban:null};});
    const add=(c,pts,en,ta)=>{I[c].pts+=pts;I[c].why.push([en,ta]);};
    CODES.forEach(c=>{
      const h=I[c].h, st=starOf(c);
      if(h===1||h===3||h===11) add(c,2,'in the '+ORD(h)+' house: winning chance',TH(h)+' வீட்டில் உள்ளது: வெற்றி வாய்ப்பு');
      else if(h===6) add(c,1,'in the 6th house: supporting','6-ஆம் வீட்டில் உள்ளது: ஆதரவு');
      if(st===c&&[1,3,6,11].indexOf(h)>=0) add(c,3,'in its own star in the '+ORD(h)+' house: more chance of winning','தன் சொந்த நட்சத்திரத்தில் '+TH(h)+' வீட்டில்: வெற்றி வாய்ப்பு அதிகம்');
      [[3,L3],[6,L6],[11,L11]].forEach(x=>{
        if(st===x[1]){
          add(c,2,'in the star of the '+ORD(x[0])+' lord '+NAME[x[1]],TH(x[0])+' அதிபதி '+TA[x[1]]+' நட்சத்திரத்தில்');
          if(kendraH(h)) add(c,3,'in kendra ('+ORD(h)+' house) and in the star of the '+ORD(x[0])+' lord: likely to win','கேந்திரத்தில் ('+TH(h)+' வீடு) '+TH(x[0])+' அதிபதியின் நட்சத்திரத்தில்: வெல்லும் வாய்ப்பு');
        }
      });
      if(st===L8||st===L12) I[c].ban=['in the star of the '+(st===L8?'8th':'12th')+' lord '+NAME[st],(st===L8?'8':'12')+'-ஆம் அதிபதி '+TA[st]+' நட்சத்திரத்தில்'];
    });
    [['ascendant lord',g.lord,'லக்னாதிபதி'],['star lord',g.star,'நட்சத்திராதிபதி'],['sub lord',g.sub,'உப அதிபதி']].forEach(x=>add(x[1],1,'the race begins in its '+x[0],'பந்தயம் தொடங்கும் லக்னத்தின் '+x[2]+' இதுவே'));
    const l11ok=starOf(L11)===L11&&g.sub===L11&&house(L11)!==8&&house(L11)!==12;
    if(l11ok) add(L11,4,'the 11th lord is in its own star and the race begins in its sub lord: high chance','11-ஆம் அதிபதி தன் சொந்த நட்சத்திரத்தில் உள்ளார்; பந்தயம் அவரது உப அதிபதியில் தொடங்குகிறது: வெற்றி வாய்ப்பு உயர்வு');
    const cusp={}; [3,6,11].forEach(n=>{const c=cuspSub(n); cusp[n]=c; add(c,2,'sub lord of the '+ORD(n)+' cusp: cuspal winning horse',TH(n)+' கஸ்ப் உப அதிபதி: கஸ்ப் வெற்றிக் குதிரை');});

    const d=new Date(ms+off*3600000);
    let h='<div class="lf-time"><b>Race start:</b> '+d.getUTCDate()+' '+MON[d.getUTCMonth()]+' '+d.getUTCFullYear()+', '+p2(d.getUTCHours())+':'+p2(d.getUTCMinutes())+' local (UTC'+(off>=0?'+':'-')+Math.floor(Math.abs(off))+':'+p2(Math.round((Math.abs(off)%1)*60))+') · '+lat+', '+lon+' · <b>'+N+' horses</b><br>'+
      '<b>Rising:</b> '+SIGNS[A][0]+' '+inSign(asc)+' · '+NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub]+' · <span style="font-family:var(--ta)">'+TLAG[A]+' லக்னம்</span><br>'+
      '<b>3rd lord</b> '+NAME[L3]+' · <b>6th lord</b> '+NAME[L6]+' · <b>11th lord</b> '+NAME[L11]+' · <b>8th lord</b> '+NAME[L8]+' · <b>12th lord</b> '+NAME[L12]+'</div>';

    h+=rcSec('Race-start lords and horse numbers','பந்தய தொடக்க அதிபதிகளும் குதிரை எண்களும்');
    [['Ascendant lord',g.lord,'லக்னாதிபதி'],['Star lord',g.star,'நட்சத்திராதிபதி'],['Sub lord',g.sub,'உப அதிபதி']].forEach(x=>{h+=rcRow(rcNum(x[1],N),x[0]+' <b>'+NAME[x[1]]+'</b>',x[2]+' <b>'+TA[x[1]]+'</b>');});
    h+='</div>';

    const picks=CODES.filter(c=>!I[c].ban&&I[c].pts>0&&HN[c].some(x=>x<=N)).sort((a,b)=>I[b].pts-I[a].pts);
    const top=picks.length?I[picks[0]].pts:0;
    h+=rcSec('Top picks (strongest first)','முதன்மைத் தேர்வுகள் (வலுவானவை முதலில்)');
    if(!picks.length) h+=rcRow('','No horse number within '+N+' has a winning sign.','வெற்றி அறிகுறி உள்ள குதிரை எண் எதுவும் '+N+'க்குள் இல்லை.');
    picks.forEach(c=>{
      h+='<div class="lf-item info rc-row">'+rcNum(c,N,I[c].pts===top?'top':'')+' <b>'+NAME[c]+'</b> · <span style="font-family:var(--ta)">'+TA[c]+'</span> · score '+I[c].pts+' · '+ORD(I[c].h)+' house'+
        I[c].why.map(w=>'<span class="ctd" style="margin:2px 0 0">'+w[0]+'<span class="ta">'+w[1]+'</span></span>').join('')+'</div>';
    });
    h+='</div>';

    const win=CODES.filter(c=>[1,3,11].indexOf(I[c].h)>=0);
    h+=rcSec('Winning chance horses (planets in the 1st, 3rd and 11th house)','வெற்றி வாய்ப்புள்ள குதிரைகள் (1, 3, 11-ஆம் வீட்டு கிரகங்கள்)');
    if(!win.length) h+=rcRow('','No planet is in the 1st, 3rd or 11th house.','1, 3, 11-ஆம் வீட்டில் கிரகம் இல்லை.');
    win.forEach(c=>{h+=rcRow(rcNum(c,N),'<b>'+NAME[c]+'</b> in the '+ORD(I[c].h)+' house'+(I[c].ban?' (but '+I[c].ban[0]+': do not bet)':''),'<b>'+TA[c]+'</b> '+TH(I[c].h)+' வீட்டில்'+(I[c].ban?' (ஆனால் '+I[c].ban[1]+': பந்தயம் வேண்டாம்)':''));});
    h+='</div>';

    const own=CODES.filter(c=>starOf(c)===c&&[1,3,6,11].indexOf(I[c].h)>=0);
    h+=rcSec('Planets in their own star in the 1st, 3rd, 6th or 11th house: more chance','தன் சொந்த நட்சத்திரத்தில் 1, 3, 6, 11-ஆம் வீட்டில் உள்ளவை: வாய்ப்பு அதிகம்');
    if(!own.length) h+=rcRow('','None.','எதுவும் இல்லை.');
    own.forEach(c=>{h+=rcRow(rcNum(c,N,'top'),'<b>'+NAME[c]+'</b> in the '+ORD(I[c].h)+' house','<b>'+TA[c]+'</b> '+TH(I[c].h)+' வீட்டில்');});
    h+='</div>';

    h+=rcSec('Planets in the star of the 3rd, 6th or 11th lord','3, 6, 11-ஆம் அதிபதியின் நட்சத்திரத்தில் உள்ள கிரகங்கள்');
    let any=false;
    CODES.forEach(c=>{
      const st=starOf(c), r=[[3,L3],[6,L6],[11,L11]].filter(x=>x[1]===st).map(x=>x[0]);
      if(r.length&&!I[c].ban){any=true;h+=rcRow(rcNum(c,N),'<b>'+NAME[c]+'</b> is in the star of '+NAME[st]+' ('+r.map(ORD).join(' & ')+' lord)','<b>'+TA[c]+'</b> '+TA[st]+' நட்சத்திரத்தில் ('+r.map(TH).join(', ')+' அதிபதி)');}
    });
    if(!any) h+=rcRow('','None.','எதுவும் இல்லை.');
    h+='</div>';

    const ken=CODES.filter(c=>kendraH(I[c].h));
    const kw=ken.filter(c=>[L3,L6,L11].indexOf(starOf(c))>=0&&!I[c].ban);
    h+=rcSec('Kendra planets: numbers that may finish close together','கேந்திர கிரகங்கள்: நெருக்கமாக வரக்கூடிய எண்கள்');
    if(!ken.length) h+=rcRow('','No planet is in a kendra.','கேந்திரத்தில் கிரகம் இல்லை.');
    else{
      h+=rcRow(ken.map(c=>rcNum(c,N)).join(''),'Planets in the 1st, 4th, 7th and 10th house: '+ken.map(c=>NAME[c]+' ('+ORD(I[c].h)+')').join(', ')+'. Their horses may come together, close to each other.','1, 4, 7, 10-ஆம் வீட்டு கிரகங்கள்: '+ken.map(c=>TA[c]+' ('+TH(I[c].h)+')').join(', ')+'. இவற்றின் குதிரைகள் ஒன்றாக நெருக்கமாக வரலாம்.');
      if(kw.length) kw.forEach(c=>{h+=rcRow(rcNum(c,N,'top'),'Likely winner among them: <b>'+NAME[c]+'</b>, in the star of '+NAME[starOf(c)]+' ('+[[3,L3],[6,L6],[11,L11]].filter(x=>x[1]===starOf(c)).map(x=>ORD(x[0])).join(' & ')+' lord)','இவற்றில் வெல்ல வாய்ப்பு: <b>'+TA[c]+'</b> ('+TA[starOf(c)]+' நட்சத்திரத்தில்)');});
      else h+=rcRow('','No kendra planet is in the star of the 3rd, 6th or 11th lord.','கேந்திர கிரகம் எதுவும் 3, 6, 11-ஆம் அதிபதியின் நட்சத்திரத்தில் இல்லை.');
    }
    h+='</div>';

    h+=rcSec('11th lord rule','11-ஆம் அதிபதி விதி');
    h+=rcRow(l11ok?rcNum(L11,N,'top'):'',l11ok?'High chance: 11th lord <b>'+NAME[L11]+'</b> is in its own star, the race begins in its sub lord, and it is in the '+ORD(house(L11))+' house (not the 8th or 12th).':'Not met: the 11th lord '+NAME[L11]+(starOf(L11)===L11?' is in its own star':' is not in its own star')+', the race '+(g.sub===L11?'begins':'does not begin')+' in its sub lord, and it is in the '+ORD(house(L11))+' house.',l11ok?'அதிக வாய்ப்பு: 11-ஆம் அதிபதி <b>'+TA[L11]+'</b> சொந்த நட்சத்திரத்தில் உள்ளார்; பந்தயம் அவரது உப அதிபதியில் தொடங்குகிறது; '+TH(house(L11))+' வீட்டில் உள்ளார்.':'பொருந்தவில்லை.');
    h+='</div>';

    h+=rcSec('Cuspal winning horses (sub lords of the 3rd, 6th and 11th cusps)','கஸ்ப் வெற்றிக் குதிரைகள் (3, 6, 11-ஆம் கஸ்ப் உப அதிபதிகள்)');
    [3,6,11].forEach(n=>{h+=rcRow(rcNum(cusp[n],N),ORD(n)+' cusp sub lord <b>'+NAME[cusp[n]]+'</b>',TH(n)+' கஸ்ப் உப அதிபதி <b>'+TA[cusp[n]]+'</b>');});
    h+='</div>';

    const ban=CODES.filter(c=>I[c].ban);
    h+=rcSec('Do not bet on these numbers','இந்த எண்கள் மீது பந்தயம் வேண்டாம்');
    if(!ban.length) h+=rcRow('','No planet is in the star of the 8th or 12th lord.','8, 12-ஆம் அதிபதி நட்சத்திரத்தில் கிரகம் இல்லை.');
    ban.forEach(c=>{h+=rcRow(rcNum(c,N,'ban'),'<b>'+NAME[c]+'</b> is '+I[c].ban[0],'<b>'+TA[c]+'</b> '+I[c].ban[1]);});
    h+='</div>';

    const nm=CODES.filter(c=>[1,3,6,11].indexOf(I[c].h)>=0);
    h+=rcSec('Name hints for the winning horse','வெற்றி பெறும் குதிரையின் பெயர் குறிப்புகள்');
    if(!nm.length) h+=rcRow('','No planet is in the 1st, 3rd, 6th or 11th house.','1, 3, 6, 11-ஆம் வீட்டில் கிரகம் இல்லை.');
    nm.forEach(c=>{h+=rcRow(rcNum(c,N),'<b>'+NAME[c]+'</b> ('+ORD(I[c].h)+' house): '+RC_HINT[c].en+(I[c].ban?' (in the star of the 8th/12th lord: weak)':''),'<b>'+TA[c]+'</b> ('+TH(I[c].h)+' வீடு): '+RC_HINT[c].ta+(I[c].ban?' (8, 12-ஆம் அதிபதி நட்சத்திரத்தில்: பலவீனம்)':''));});
    h+='</div>';

    h+='<details class="lf-det"><summary>Planet positions at the race start</summary>'+CODES.map(c=>'<div class="lf-item info">'+NAME[c]+' · <span style="font-family:var(--ta)">'+TA[c]+'</span>: '+SIGNS[sgn(c)][0]+' '+inSign(P[c])+', '+ORD(I[c].h)+' house, star of '+NAME[starOf(c)]+', sub '+NAME[seg(c).sub]+' · numbers '+HN[c].join(', ')+'</div>').join('')+'</details>';
    h+='<p class="lf-note">Numbers: Sun 1, 10 · Moon 2, 20 · Mars 9, 18 · Rahu 4, 13 · Jupiter 3, 12 · Saturn 8, 17 · Venus 6, 15 · Ketu 7, 16 · Mercury 5, 14 (11 and 19 are not assigned). Numbers above the field size are left out. This is traditional astrology for interest only and cannot guarantee a result; please bet responsibly.<br><span style="font-family:var(--ta);color:var(--accent)">எண்கள்: சூரியன் 1, 10 · சந்திரன் 2, 20 · செவ்வாய் 9, 18 · ராகு 4, 13 · குரு 3, 12 · சனி 8, 17 · சுக்கிரன் 6, 15 · கேது 7, 16 · புதன் 5, 14. குதிரைகளின் எண்ணிக்கையை மீறிய எண்கள் தவிர்க்கப்பட்டுள்ளன. இது ஆர்வத்திற்கான பாரம்பரிய ஜோதிடம் மட்டுமே; முடிவு உறுதி அல்ல; பொறுப்புடன் செயல்படுங்கள்.</span></p>';
    return h;
  }finally{CFG=old;}
}
function raceRun(){
  const out=$('rcOut');
  const ds=$('rcDate').value, ts=$('rcTime').value, lat=parseFloat($('rcLat').value), lon=parseFloat($('rcLon').value), tzs=$('rcTz').value.trim(), N=parseInt($('rcN').value,10);
  const err=m=>{out.innerHTML='<p class="msg err">'+m+'</p>';};
  if(!ds||!ts)return err('Enter the race date and start time.');
  if(isNaN(lat)||isNaN(lon)||!tzs)return err('Choose the race location, or enter its latitude, longitude and time zone.');
  if(Math.abs(lat)>62)return err('Latitude beyond 62° is not supported.');
  if(isNaN(N)||N<2||N>40)return err('Enter the number of horses (2 to 40).');
  if(typeof Astronomy==='undefined')return err('Planet positions need the astronomy library, which did not load. Check your connection and reload.');
  const a=ds.split('-').map(Number), b=ts.split(':').map(Number);
  let loc; try{loc=localToUtc(a[0],a[1],a[2],b[0],b[1],tzs);}catch(e){return err('The time zone was not recognised. Use a name such as Asia/Kolkata or a number of hours such as 5.5.');}
  out.innerHTML=raceAnalyse(loc.ms,lat,lon,N,$('ayan').value,loc.off);
}
(function initRace(){
  const cs=$('rcCountry');
  cs.innerHTML='<option value="*r">★ Racecourses</option><option value="*a">All countries (use search)</option>'+CITY.cc.map(n=>'<option value="'+n.replace(/"/g,'&quot;')+'">'+n+'</option>').join('');
  cs.addEventListener('change',rcFill); $('rcSearch').addEventListener('input',rcFill); $('rcCity').addEventListener('change',rcPick);
  rcFill();
  const now=new Date(), lo=new Date(now.getTime()-now.getTimezoneOffset()*60000), iso=lo.toISOString().slice(0,10);
  $('rcDate').value=iso; $('rgFrom').value=iso;
  $('rgTo').value=new Date(lo.getTime()+6*86400000).toISOString().slice(0,10);
  $('raceBtn').addEventListener('click',()=>{$('racePanel').classList.remove('hide');$('rcOut').innerHTML='';$('racePanel').scrollIntoView({block:'start'});});
  $('rcClose').addEventListener('click',()=>{$('racePanel').classList.add('hide');});
  $('rcGo').addEventListener('click',raceRun);
  $('rangeBtn').addEventListener('click',()=>{$('rangePanel').classList.remove('hide');$('rgOut').innerHTML='';$('rgMsg').textContent='';$('rangePanel').scrollIntoView({block:'start'});});
  $('rgClose').addEventListener('click',()=>{$('rangePanel').classList.add('hide');});
  $('rgGo').addEventListener('click',rangeRun);
})();


/* ---------- GMP Prasnam (v3.2) ---------- */
const GP_NAKT=['அஸ்வினி','பரணி','கார்த்திகை','ரோகிணி','மிருகசீரிடம்','திருவாதிரை','புனர்பூசம்','பூசம்','ஆயில்யம்','மகம்','பூரம்','உத்திரம்','அஸ்தம்','சித்திரை','சுவாதி','விசாகம்','அனுஷம்','கேட்டை','மூலம்','பூராடம்','உத்திராடம்','திருவோணம்','அவிட்டம்','சதயம்','பூரட்டாதி','உத்திரட்டாதி','ரேவதி'];
const relH=(a,b)=>((b-a+12)%12)+1;                 // b counted from a, both signs counted (a itself = 1)
const kenH=h=>h===1||h===4||h===7||h===10;
const gpCat=r=>kenH(r)?'ken':(r===6||r===8)?'68':(r===5||r===9)?'59':(r===2||r===12)?'212':'311';
const GP_MSG={
 pos:['Both are in kendra (1, 4, 7, 10) to the lagna and in kendra to each other: the event will take place. The answer is positive.','இருவரும் லக்னத்திற்கு கேந்திரத்திலும் (1, 4, 7, 10) ஒன்றுக்கொன்று கேந்திரத்திலும் உள்ளனர்: காரியம் நடக்கும். பதில் சாதகம்.','',''],
 ken:['They are in kendra to each other, but they are not both in kendra to the lagna: the chance is moderate, not the full positive combination.','ஒன்றுக்கொன்று கேந்திரத்தில் உள்ளனர், ஆனால் இருவரும் லக்னத்திற்கு கேந்திரத்தில் இல்லை: வாய்ப்பு நடுத்தரம், முழுமையான சாதக அமைப்பு அல்ல.'],
 '68':['They are in 6/8 to each other: the event will not take place, or the chance is very small.','ஒன்றுக்கொன்று 6/8 ஆக உள்ளனர்: காரியம் நடக்காது அல்லது வாய்ப்பு மிகக் குறைவு.'],
 '59':['They are in 5/9 to each other: a duplicate or similar event may take place.','ஒன்றுக்கொன்று 5/9 ஆக உள்ளனர்: அதே போன்ற இரட்டிப்பு அல்லது ஒத்த நிகழ்வு நடக்கலாம்.'],
 '212':['They are in 2/12 to each other: the event needs more effort to take place.','ஒன்றுக்கொன்று 2/12 ஆக உள்ளனர்: காரியம் நடக்க கூடுதல் முயற்சி தேவை.'],
 '311':['They are in 3/11 to each other: the event will be delayed and needs more effort.','ஒன்றுக்கொன்று 3/11 ஆக உள்ளனர்: காரியத்தில் தாமதம் ஏற்படும், கூடுதல் முயற்சி தேவை.']};
// pure evaluation of two planets a,b for a rising sign A; sg(code) = sign index of a planet
function gpPairEval(A,a,b,sg){
  const ha=relH(A,sg(a)), hb=relH(A,sg(b)), r=relH(sg(a),sg(b)), r2=relH(sg(b),sg(a)), s11=(A+10)%12;
  const da=relH(sg(a),s11), db=relH(sg(b),s11), kl=kenH(ha)&&kenH(hb), km=kenH(r);
  return {ha:ha,hb:hb,r:r,r2:r2,da:da,db:db,x:da+db,kenLag:kl,kenMut:km,cat:gpCat(r),positive:kl&&km};
}
let GP_LIST=[];
function gpFill(){
  const q=$('gpSearch').value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''), cn=$('gpCountry').value, sel=$('gpCity');
  let list, tag=false;
  if(cn==='*a'){ list=q?WC.filter(x=>plKey(x).indexOf(q)>=0).slice(0,400):[]; tag=true; }
  else list=WC.filter(x=>x.cc===cn&&(!q||plKey(x).indexOf(q)>=0)).slice(0,600);
  if(!list.length)list=webC(q,gpFill);
  GP_LIST=list;
  sel.innerHTML=list.length?list.map((x,i)=>'<option value="'+i+'">'+x.n+(x.st?', '+x.st:'')+(tag?', '+x.cc:'')+'</option>').join(''):'<option value="">No match in the offline list. Online search is tried automatically when you are connected</option>';
  gpPick();
}
function gpPick(){
  const x=GP_LIST[parseInt($('gpCity').value,10)];
  if(x){$('gpLat').value=x.lat;$('gpLon').value=x.lon;$('gpTz').value=x.tz;}
  gpShowOff();
}
function tzFn(tzs){
  if(/^-?\d+(\.\d+)?$/.test(tzs)){const o=parseFloat(tzs);return ()=>o;}
  offsetAt(Date.now(),tzs);                       // throws for an unknown zone
  return ms=>offsetAt(ms,tzs);
}
const utcTxt=o=>'UTC'+(o>=0?'+':'-')+Math.floor(Math.abs(o))+':'+p2(Math.round((Math.abs(o)%1)*60));
function gpShowOff(){
  const el=$('gpOff'), t=$('gpTz').value.trim(); el.className='msg';
  if(!t){el.textContent='';return;}
  try{el.textContent='Time zone now: '+utcTxt(tzFn(t)(Date.now()))+(/^-?[\d.]+$/.test(t)?'':' ('+t+')');}
  catch(e){el.textContent='The time zone was not recognised. Use a name such as Asia/Kolkata or hours such as 5.5.';el.className='msg err';}
}
function gpUseLoc(){
  const el=$('gpOff');
  if(!navigator.geolocation){el.textContent='Location is not available here. Choose a city or enter latitude and longitude.';el.className='msg err';return;}
  el.textContent='Finding your location…';el.className='msg';
  try{
    navigator.geolocation.getCurrentPosition(pos=>{
      $('gpLat').value=pos.coords.latitude.toFixed(4); $('gpLon').value=pos.coords.longitude.toFixed(4);
      let z=''; try{z=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(e){}
      $('gpTz').value=z||String(-new Date().getTimezoneOffset()/60); $('gpSearch').value=''; gpShowOff();
    },e=>{el.textContent='Could not get your location ('+(e&&e.message?e.message:'denied')+'). Choose a city instead.';el.className='msg err';},{enableHighAccuracy:false,timeout:15000,maximumAge:60000});
  }catch(e){el.textContent='Location is not available here.';el.className='msg err';}
}
function gpMoonSegs(ms,days){
  const N=360/27, step=2*3600000, end=ms+days*86400000;
  const nk=t=>Math.floor(sidLon('Mo',t)/N)%27;
  const segs=[]; let n0=nk(ms), s=ms;
  for(let t=ms+step;t<=end+30*3600000;t+=step){
    const n=nk(t);
    if(n!==n0){
      let lo=t-step, hi=t; for(let i=0;i<14;i++){const m=(lo+hi)/2; if(nk(m)===n0)lo=m; else hi=m;}
      segs.push({n:n0,s:s,e:hi}); s=hi; n0=n;
      if(s>end)break;
    }
  }
  return segs.filter(g=>g.s<end);
}
function gpRun(){const o=CFG;try{gpRun0();}finally{CFG=o;}}
function gpRun0(){
  const out=$('gpOut'), err=m=>{out.innerHTML='<p class="msg err">'+m+'</p>';};
  const lat=parseFloat($('gpLat').value), lon=parseFloat($('gpLon').value), tzs=$('gpTz').value.trim();
  if(isNaN(lat)||isNaN(lon)||!tzs)return err('Choose a city (or use your location), or enter latitude, longitude and time zone.');
  if(Math.abs(lat)>62)return err('Latitude beyond 62° is not supported.');
  if(typeof Astronomy==='undefined')return err('Planet positions need the astronomy library, which did not load. Check your connection and reload.');
  let tf; try{tf=tzFn(tzs);}catch(e){return err('The time zone was not recognised. Use a name such as Asia/Kolkata or hours such as 5.5.');}
  const ms=Date.now(), kind=$('ayan').value; CFG={lat:lat,lon:lon,kind:kind};
  const off=tf(ms);
  const asc=sidAsc(ms,lat,lon,kind), g=SEGS[findSeg(asc)], A=g.sign;
  const P={}; CODES.forEach(c=>{P[c]=sidLon(c,ms);});
  const sgn=c=>Math.floor(P[c]/30)%12, house=c=>relH(A,sgn(c)), starOf=c=>SEGS[findSeg(P[c])].star;
  const lord=h=>SIGNS[(A+h-1)%12][1];
  const L3=lord(3), L11=lord(11), SL=g.star, BL=g.sub, lagL=g.lord;
  const fmt=t=>{const o=tf(t), d=new Date(t+o*3600000);return p2(d.getUTCDate())+' '+MON[d.getUTCMonth()]+' '+d.getUTCFullYear()+', '+p2(d.getUTCHours())+':'+p2(d.getUTCMinutes());};
  const fmtD=t=>{const o=tf(t), d=new Date(t+o*3600000);return d.getUTCDate()+' '+MON[d.getUTCMonth()]+' '+d.getUTCFullYear();};
  const nm=c=>NAME[c]+' ('+TA[c]+')';
  const pos=c=>NAME[c]+' in '+SIGNS[sgn(c)][0]+' '+inSign(P[c])+', '+ORD(house(c))+' house, star of '+NAME[starOf(c)];
  const posTa=c=>TA[c]+' '+TSIGN[sgn(c)]+' '+inSign(P[c])+', '+TH(house(c))+' வீடு, '+TA[starOf(c)]+' நட்சத்திரம்';
  const d0=new Date(ms+off*3600000), hms=p2(d0.getUTCHours())+':'+p2(d0.getUTCMinutes())+':'+p2(d0.getUTCSeconds());
  const E3=gpPairEval(A,L3,L11,sgn), E2=gpPairEval(A,SL,BL,sgn);
  let h='<div class="lf-time"><b>Question time:</b> '+d0.getUTCDate()+' '+MON[d0.getUTCMonth()]+' '+d0.getUTCFullYear()+', '+hms+' ('+utcTxt(off)+') · '+lat+', '+lon+'<br>'+
    '<b>Rising:</b> '+SIGNS[A][0]+' '+inSign(asc)+' · lagna lord / star lord / sub lord: '+NAME[lagL]+'/'+NAME[SL]+'/'+NAME[BL]+' · <span class="ta" style="font-family:var(--ta)">'+TLAG[A]+' லக்னம் · '+TA[lagL]+'/'+TA[SL]+'/'+TA[BL]+'</span></div>';
  // verdict for the 3rd and 11th lords
  const vkey=E3.positive?'pos':E3.cat, vm=GP_MSG[vkey];
  const cls=E3.positive?'':(E3.cat==='68'?'hard':'mixed');
  const verdEn=E3.positive?'Positive: the event will take place':(E3.cat==='68'?'The event will not take place, or the chance is small':E3.cat==='59'?'A duplicate or similar event may take place':E3.cat==='212'?'The event needs more effort':E3.cat==='311'?'The event is delayed and needs more effort':'Moderate chance');
  const verdTa=E3.positive?'சாதகம்: காரியம் நடக்கும்':(E3.cat==='68'?'காரியம் நடக்காது அல்லது வாய்ப்பு குறைவு':E3.cat==='59'?'அதே போன்ற இரட்டிப்பு நிகழ்வு நடக்கலாம்':E3.cat==='212'?'கூடுதல் முயற்சி தேவை':E3.cat==='311'?'தாமதம், கூடுதல் முயற்சி தேவை':'நடுத்தர வாய்ப்பு');
  h+='<div class="lf-verdict '+cls+'" role="status"><b>'+verdEn+'</b><span class="ta">'+verdTa+'</span></div>';
  const pairHtml=(titleEn,titleTa,aE,aT,bE,bT,a,b,E,main)=>{
    let x='<div class="lf-sec"><h3>'+titleEn+'<span class="ta">'+titleTa+'</span></h3>';
    x+=lfItem('info','<b>'+aE+'</b> '+pos(a),'<b>'+aT+'</b> '+posTa(a));
    x+=lfItem('info','<b>'+bE+'</b> '+pos(b),'<b>'+bT+'</b> '+posTa(b));
    x+=lfItem(kenH(E.ha)?'good':'badc',aE+' '+NAME[a]+' is in the '+ORD(E.ha)+' house from the lagna'+(kenH(E.ha)?' (kendra).':' (not kendra).'),aT+' '+TA[a]+' லக்னத்திலிருந்து '+TH(E.ha)+' வீட்டில்'+(kenH(E.ha)?' (கேந்திரம்).':' (கேந்திரம் அல்ல).'));
    x+=lfItem(kenH(E.hb)?'good':'badc',bE+' '+NAME[b]+' is in the '+ORD(E.hb)+' house from the lagna'+(kenH(E.hb)?' (kendra).':' (not kendra).'),bT+' '+TA[b]+' லக்னத்திலிருந்து '+TH(E.hb)+' வீட்டில்'+(kenH(E.hb)?' (கேந்திரம்).':' (கேந்திரம் அல்ல).'));
    x+=lfItem(E.kenMut?'good':'info','Distance between them: '+NAME[b]+' is the '+ORD(E.r)+' from '+NAME[a]+', and '+NAME[a]+' is the '+ORD(E.r2)+' from '+NAME[b]+' ('+Math.min(E.r,E.r2)+'/'+Math.max(E.r,E.r2)+' position).','இருவருக்குமிடையே உள்ள தூரம்: '+TA[b]+' '+TA[a]+' இலிருந்து '+TH(E.r)+', '+TA[a]+' '+TA[b]+' இலிருந்து '+TH(E.r2)+' ('+Math.min(E.r,E.r2)+'/'+Math.max(E.r,E.r2)+' நிலை).');
    const mk=E.positive?GP_MSG.pos:GP_MSG[E.cat];
    x+=lfItem(E.positive?'good':(E.cat==='68'?'badc':'info'),mk[0],mk[1]);
    return x+'</div>';
  };
  h+=pairHtml('3rd lord and 11th lord','3-ஆம், 11-ஆம் அதிபதிகள்','3rd lord','3-ஆம் அதிபதி','11th lord','11-ஆம் அதிபதி',L3,L11,E3,true);
  h+=pairHtml('Star lord and sub lord of the rising degree','லக்ன நட்சத்திர அதிபதி, உப அதிபதி','Star lord','நட்சத்திர அதிபதி','Sub lord','உப அதிபதி',SL,BL,E2,false);
  // timing numbers
  const addMonths=(t,n)=>{const o=tf(t), d=new Date(t+o*3600000); d.setUTCMonth(d.getUTCMonth()+n); return d.getTime()-o*3600000;};
  const timing=(E,aE,bE,aT,bT,a,b)=>{
    let x='<div class="lf-sec"><h3>Timing number: '+aE+' + '+bE+'<span class="ta">கால எண்: '+aT+' + '+bT+'</span></h3>';
    x+=lfItem('info','Distance of '+NAME[a]+' ('+SIGNS[sgn(a)][0]+') to the 11th house ('+SIGNS[(A+10)%12][0]+') = <b>'+E.da+'</b> houses; distance of '+NAME[b]+' ('+SIGNS[sgn(b)][0]+') = <b>'+E.db+'</b> houses. Added: '+E.da+' + '+E.db+' = <b>'+E.x+'</b> (the sign itself is counted as 1).','11-ஆம் வீட்டிற்கு ('+TSIGN[(A+10)%12]+') '+TA[a]+' ('+TSIGN[sgn(a)]+') இருந்து தூரம் = <b>'+E.da+'</b>; '+TA[b]+' ('+TSIGN[sgn(b)]+') இருந்து தூரம் = <b>'+E.db+'</b>. கூட்டுத்தொகை = <b>'+E.x+'</b> (அந்த ராசியே 1 என எண்ணப்படும்).');
    const n=E.x;
    x+=lfItem('info','The event may take place in <b>'+n+' minutes</b> (about '+fmt(ms+n*60000)+'), <b>'+n+' hours</b> ('+fmt(ms+n*3600000)+'), <b>'+n+' days</b> ('+fmtD(ms+n*86400000)+'), <b>'+n+' weeks</b> ('+fmtD(ms+n*7*86400000)+') or <b>'+n+' months</b> ('+fmtD(addMonths(ms,n))+'), or on the days when the Moon moves through the stars listed below.','காரியம் <b>'+n+' நிமிடங்கள்</b> ('+fmt(ms+n*60000)+'), <b>'+n+' மணி</b> ('+fmt(ms+n*3600000)+'), <b>'+n+' நாட்கள்</b> ('+fmtD(ms+n*86400000)+'), <b>'+n+' வாரங்கள்</b> ('+fmtD(ms+n*7*86400000)+') அல்லது <b>'+n+' மாதங்கள்</b> ('+fmtD(addMonths(ms,n))+') ஆகியவற்றில் நடக்கலாம்; அல்லது கீழே உள்ள நட்சத்திரங்களில் சந்திரன் செல்லும் நாட்களில் நடக்கலாம்.');
    return x+'</div>';
  };
  h+=timing(E3,'3rd lord','11th lord','3-ஆம் அதிபதி','11-ஆம் அதிபதி',L3,L11);
  h+=timing(E2,'star lord','sub lord','நட்சத்திர அதிபதி','உப அதிபதி',SL,BL);
  // Moon in the stars of the four planets
  const roles={}; const addRole=(c,en,ta)=>{(roles[c]=roles[c]||[]).push([en,ta]);};
  addRole(L3,'3rd lord','3-ஆம் அதிபதி'); addRole(L11,'11th lord','11-ஆம் அதிபதி'); addRole(SL,'star lord','நட்சத்திர அதிபதி'); addRole(BL,'sub lord','உப அதிபதி');
  const segs=gpMoonSegs(ms,90).filter(sg=>roles[ORDER[sg.n%9]]);
  const marks=[]; [[E3.x,'3rd+11th'],[E2.x,'star+sub']].forEach(m=>{[['days',m[0]*86400000],['weeks',m[0]*7*86400000]].forEach(u=>marks.push([ms+u[1],m[0]+' '+u[0]+' ('+m[1]+')']));marks.push([addMonths(ms,m[0]),m[0]+' months ('+m[1]+')']);});
  h+='<div class="lf-sec"><h3>Moon in the stars of these planets (next 90 days)<span class="ta">இந்த கிரகங்களின் நட்சத்திரங்களில் சந்திரன் (அடுத்த 90 நாட்கள்)</span></h3><div class="tscroll"><table class="ctab"><tr><th>From</th><th>To</th><th>Star</th><th>Star lord · role</th><th>Timing match</th></tr>';
  segs.forEach(sg=>{
    const c=ORDER[sg.n%9], isNow=sg.s<=ms&&ms<sg.e;
    const hit=marks.filter(m=>m[0]>=sg.s&&m[0]<sg.e).map(m=>m[1]);
    h+='<tr'+(isNow?' class="now"':'')+'><td>'+(isNow?'now':fmt(sg.s))+'</td><td>'+fmt(sg.e)+'</td><td>'+NAKS[sg.n]+' · '+GP_NAKT[sg.n]+'</td><td>'+NAME[c]+' ('+TA[c]+') · '+roles[c].map(r=>r[0]).join(', ')+'</td><td>'+(hit.length?'≈ '+hit.join('; '):'')+'</td></tr>';
  });
  h+='</table></div><p class="lf-note">Dates are in the time zone of the place chosen. “Timing match” shows a row that contains the day reached by the timing number counted in days, weeks or months.<br><span class="ta" style="font-family:var(--ta);color:var(--accent)">தேதிகள் தேர்ந்தெடுத்த இடத்தின் நேர மண்டலத்தில் உள்ளன. கால எண்ணை நாட்கள், வாரங்கள், மாதங்களாக எண்ணி வரும் நாள் இருக்கும் வரிசை “Timing match” இல் காட்டப்படும்.</span></p></div>';
  // Saturn delay
  const sS=sgn('Sa'), asp=[(sS+2)%12,(sS+6)%12,(sS+9)%12];
  const tg=[['the ascendant (lagna)','லக்னம்',A],['the 3rd house','3-ஆம் வீடு',(A+2)%12],['the 11th house','11-ஆம் வீடு',(A+10)%12],
            ['the 3rd lord '+NAME[L3],'3-ஆம் அதிபதி '+TA[L3],sgn(L3)],['the 11th lord '+NAME[L11],'11-ஆம் அதிபதி '+TA[L11],sgn(L11)],
            ['the star lord '+NAME[SL],'நட்சத்திர அதிபதி '+TA[SL],sgn(SL)],['the sub lord '+NAME[BL],'உப அதிபதி '+TA[BL],sgn(BL)]];
  const hits=tg.filter(t=>t[2]!==sS&&asp.indexOf(t[2])>=0);
  const inH=CODES.filter(c=>c!=='Sa'&&asp.indexOf(sgn(c))>=0).map(c=>NAME[c]);
  h+='<div class="lf-sec"><h3>Saturn delay<span class="ta">சனி தாமதம்</span></h3>';
  h+=lfItem('info','Saturn is in '+SIGNS[sS][0]+' ('+ORD(house('Sa'))+' house'+(isRetro('Sa',ms)?', retrograde':'')+'). Its aspects (3rd, 7th and 10th from it) fall on '+asp.map(a=>SIGNS[a][0]+' ('+ORD(relH(A,a))+' house)').join(', ')+'.','சனி '+TSIGN[sS]+' ராசியில் ('+TH(house('Sa'))+' வீடு'+(isRetro('Sa',ms)?', வக்ரம்':'')+') உள்ளார். அவரது பார்வை (3, 7, 10-ஆம் இடங்கள்) '+asp.map(a=>TSIGN[a]+' ('+TH(relH(A,a))+' வீடு)').join(', ')+' மீது விழுகிறது.');
  if(hits.length){
    h+=lfItem('badc','Saturn aspects '+hits.map(t=>t[0]).join(', ')+'. This delays the event by about <b>2 minutes, 2 days or 2 months</b> (in the same unit as the timing above).'+(inH.length?' Planets under the aspect: '+inH.join(', ')+'.':''),'சனி '+hits.map(t=>t[1]).join(', ')+' ஐப் பார்க்கிறார். இதனால் காரியம் மேற்கண்ட கால அலகிலேயே சுமார் <b>2 நிமிடங்கள், 2 நாட்கள் அல்லது 2 மாதங்கள்</b> தாமதமாகும்.'+(inH.length?' பார்வையில் உள்ள கிரகங்கள்: '+inH.join(', ')+'.':''));
  }else h+=lfItem('good','Saturn does not aspect the ascendant, the 3rd or 11th house, the 3rd lord, the 11th lord, the star lord or the sub lord: no Saturn delay.','சனி லக்னம், 3, 11-ஆம் வீடுகள், 3, 11-ஆம் அதிபதிகள், நட்சத்திர அதிபதி, உப அதிபதி ஆகியோரைப் பார்க்கவில்லை: சனி தாமதம் இல்லை.');
  h+='</div>';
  h+='<details class="lf-det"><summary>Planet positions at the question time</summary>'+CODES.map(c=>'<div class="lf-item info">'+NAME[c]+' · <span class="ta" style="font-family:var(--ta)">'+TA[c]+'</span>: '+SIGNS[sgn(c)][0]+' '+inSign(P[c])+', '+ORD(house(c))+' house, star of '+NAME[starOf(c)]+'</div>').join('')+'</details>';
  h+='<p class="lf-note">Traditional prasnam guidance from the transit ascendant at the question time. It is a guide, not a guarantee.<br><span class="ta" style="font-family:var(--ta);color:var(--accent)">கேள்வி நேர கோசார லக்னத்தின் அடிப்படையிலான பாரம்பரிய பிரசன்ன வழிகாட்டுதல். இது உறுதியான முடிவு அல்ல.</span></p>';
  out.innerHTML=h;
}
function isRetro(c,ms){
  if(c==='Su'||c==='Mo'||c==='Ra'||c==='Ke')return false;
  return (mod(sidLon(c,ms+3600000)-sidLon(c,ms-3600000)+180,360)-180)<0;
}
(function initGp(){
  const cs=$('gpCountry');
  cs.innerHTML='<option value="*a">All countries (use search)</option>'+CITY.cc.map(n=>'<option value="'+n.replace(/"/g,'&quot;')+'">'+n+'</option>').join('');
  cs.addEventListener('change',gpFill); $('gpSearch').addEventListener('input',gpFill); $('gpCity').addEventListener('change',gpPick);
  $('gpTz').addEventListener('input',gpShowOff);
  gpFill();
  $('gpBtn').addEventListener('click',()=>{
    const pn=$('gpPanel'); pn.classList.remove('hide'); $('gpOut').innerHTML='';
    if(!$('gpLat').value){$('gpLat').value=$('lat').value;$('gpLon').value=$('lon').value;$('gpTz').value=$('tz').value;gpShowOff();}
    pn.scrollIntoView({block:'start'});
  });
  $('gpClose').addEventListener('click',()=>{$('gpPanel').classList.add('hide');});
  $('gpTime').addEventListener('click',gpRun);
  $('gpLoc').addEventListener('click',gpUseLoc);
})();


/* ---------- Chandra muhurtham (v3.3) ---------- */
let CM=null;
function cmEval(r){
  const g=SEGS[r.k], A=g.sign, mid=(r.start+r.end)/2;
  const lord=h=>SIGNS[(A+h-1)%12][1];
  const L2=lord(2),L3=lord(3),L11=lord(11);
  const Pm=sidLon('Mo',mid), mg=SEGS[findSeg(Pm)], MS=mg.star, MB=mg.sub;
  if(MS!==L3&&MS!==L11)return null;
  const S=g.star, B=g.sub, T=[MS,MB,'Mo'];
  if(T.indexOf(S)<0&&T.indexOf(B)<0)return null;
  const Pp=sidLon(MS,mid), sgn=Math.floor(Pp/30)%12, hMS=((sgn-A+12)%12)+1;
  if(hMS===8||hMS===12)return null;
  const msStar=SEGS[findSeg(Pp)].star, own=msStar===MS, moonSign=Math.floor(Pm/30)%12, withMoon=sgn===moonSign;
  const PL=sidLon(g.lord,mid), lordStar=SEGS[findSeg(PL)].star;
  const tags=[], why=[];
  const role=MS===L3&&MS===L11?'3rd and 11th lord':MS===L3?'3rd lord':'11th lord';
  let high=false, money=false, flow=false;
  if(withMoon&&own){high=true;why.push('<b>Highly auspicious:</b> '+NAME[MS]+', the star owner of the Moon, is with the Moon in '+SIGNS[sgn][0]+' ('+ORD(hMS)+' house) and stands in its own star.');}
  if(lordStar===MS&&g.lord!==MS&&g.lord!=='Mo'){high=true;why.push('<b>Highly auspicious:</b> the ascendant lord '+NAME[g.lord]+' is in the star of '+NAME[MS]+', the '+role+' that gives its star to the Moon.');}
  if(hMS===2){money=true;why.push('<b>Money muhurtham:</b> '+NAME[MS]+', the star owner of the Moon, is in the 2nd house.');}
  if(L2==='Mo'&&(S==='Mo'||B==='Mo')){flow=true;why.push('<b>Money flow muhurtham:</b> the Moon is the 2nd lord of '+SIGNS[A][0]+' and is the '+(B==='Mo'?'sub':'star')+' lord of this ascendant timing ('+NAME[g.lord]+'/'+NAME[S]+'/'+NAME[B]+').');}
  const info='Moon in '+NAKS[mg.nak]+' ('+GP_NAKT[mg.nak]+'), '+SIGNS[moonSign][0]+' '+inSign(Pm)+'<br>Star owner of the Moon: '+NAME[MS]+' ('+role+'), in '+SIGNS[sgn][0]+', '+ORD(hMS)+' house'+(own?', in its own star':', star of '+NAME[msStar])+(withMoon?', with the Moon':'')+'<br>Moon\'s sub lord: '+NAME[MB]+'<br>Ascendant star lord '+NAME[S]+', sub lord '+NAME[B]+' ('+[S,B].map(c=>c==='Mo'?'the Moon':c===MS?'the Moon\'s star owner':c===MB?'the Moon\'s sub lord':'').filter(Boolean).join(', ')+')';
  return {high:high,money:money,flow:flow,why:why,info:info,ms:MS,mb:MB,hms:hMS};
}
function cmRun(){
  const msg=$('cmMsg'), out=$('cmOut');
  const lat=parseFloat($('lat').value), lon=parseFloat($('lon').value), tz=parseFloat($('tz').value), f=$('cmFrom').value, t=$('cmTo').value;
  msg.className='msg err'; out.innerHTML='';
  if(isNaN(lat)||isNaN(lon)||isNaN(tz)){msg.textContent='Choose a place (or enter latitude, longitude and UTC offset) in the form above first.';return;}
  if(Math.abs(lat)>62){msg.textContent='Latitude beyond 62° is not supported.';return;}
  if(typeof Astronomy==='undefined'){msg.textContent='Planet positions need the astronomy library, which did not load. Check your connection and reload.';return;}
  if(!f||!t){msg.textContent='Pick both a from date and a to date.';return;}
  const a=f.split('-').map(Number), b=t.split('-').map(Number);
  const s0=Date.UTC(a[0],a[1]-1,a[2])-tz*3600000, nd=Math.round((Date.UTC(b[0],b[1]-1,b[2])-Date.UTC(a[0],a[1]-1,a[2]))/86400000)+1;
  if(nd<1){msg.textContent='The to date must not be before the from date.';return;}
  if(nd>31){msg.textContent='Please choose at most 31 days.';return;}
  msg.className='msg';
  const kind=$('ayan').value, old=CFG; CFG={lat:lat,lon:lon,kind:kind};
  const items=[], days=[]; let day=0;
  $('cmGo').disabled=true;
  (function step(){
    if(day>=nd){
      CFG=old; $('cmGo').disabled=false;
      CM={items:items,days:days,tz:tz,f:f,t:t,lat:lat,lon:lon};
      cmShow(); return;
    }
    const s=s0+day*86400000, e=s+86400000;
    const rows=compute(s,e,lat,lon,kind);
    rows.forEach(r=>{const x=cmEval(r); if(x)items.push({r:r,x:x,day:s});});
    // the Moon's stars through the day
    const N=360/27, nk=m=>Math.floor(sidLon('Mo',m)/N)%27, sg=[]; let n0=nk(s), st=s;
    for(let m=s+3600000;m<=e;m+=3600000){const n=nk(m); if(n!==n0){let lo=m-3600000,hi=m;for(let i=0;i<14;i++){const q=(lo+hi)/2;if(nk(q)===n0)lo=q;else hi=q;} sg.push({n:n0,s:st,e:hi}); st=hi;n0=n;}}
    sg.push({n:n0,s:st,e:e}); days.push({day:s,sg:sg});
    day++; msg.textContent='Checking day '+day+' of '+nd+'…';
    setTimeout(step,0);
  })();
}
function cmShow(){
  const out=$('cmOut'), tz=CM.tz, mode=$('cmShow').value; let h='', last=-1, n=0;
  const keep=it=>mode==='all'||(mode==='high'&&it.x.high)||(mode==='money'&&(it.x.money||it.x.flow));
  CM.days.forEach(d=>{
    const its=CM.items.filter(it=>it.day===d.day&&keep(it));
    if(!its.length)return;
    h+='<div class="lf-sec"><h3>'+fmtDate(d.day,tz)+'</h3><p class="lf-note" style="margin:2px 0">Moon: '+d.sg.map(q=>NAKS[q.n]+' ('+NAME[ORDER[q.n%9]]+') '+fmtHMS(q.s,tz)+'–'+(q.e===d.day+86400000?'24:00:00':fmtHMS(q.e,tz))).join(' · ')+'</p></div>';
    its.forEach(it=>{
      n++; const g=SEGS[it.r.k], x=it.x;
      const pills=(x.high?'<span class="pill gain">Highly auspicious · மிக சுபம்</span>':'<span class="pill gain">Chandra muhurtham · சந்திர முகூர்த்தம்</span>')+(x.money?'<span class="pill gain">Money muhurtham · தன முகூர்த்தம்</span>':'')+(x.flow?'<span class="pill gain">Money flow · தன வரவு</span>':'');
      h+='<ul style="margin-top:6px"><li class="row gm" data-s="'+it.r.start+'" data-e="'+it.r.end+'" data-tz="'+tz+'" data-lat="'+CM.lat+'" data-lon="'+CM.lon+'" data-kind="'+$('ayan').value+'" style="--h:'+HUE[g.sub]+'"><div class="t2"><div><span>Begin</span><b>'+fmtHMS(it.r.start,tz)+'</b></div><div><span>End</span><b>'+fmtHMS(it.r.end,tz)+'</b></div></div>'+
        '<div class="l"><span class="n">'+NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub]+'</span><span class="pl">'+pills+'</span><span class="ta">'+tl(g)+
        '<div class="chk">'+x.info+(x.why.length?'<br>'+x.why.join('<br>'):'')+'</div><div class="p"><span>'+SIGNS[g.sign][0]+' ascendant · '+span(g)+' · '+NAKS[g.nak]+'</span><span>lasts '+dur(it.r.end-it.r.start)+'</span></div></li></ul>';
    });
  });
  $('cmMsg').textContent=n+' Chandra muhurtham timings from '+CM.f+' to '+CM.t+'.';
  if(!n) h='<p class="msg">No timing in this range fulfils the rule.</p>';
  else h+='<div class="btns"><button id="cmCopy" type="button">Copy as text</button></div>';
  out.innerHTML=h;
  const cb=$('cmCopy'); if(cb)cb.addEventListener('click',()=>{
    const text='Chandra muhurtham '+CM.f+' to '+CM.t+' ('+CM.lat+', '+CM.lon+')\n'+CM.items.filter(keep).map(it=>{const g=SEGS[it.r.k],x=it.x;return fmtDate(it.day,tz)+'  '+fmtHMS(it.r.start,tz)+' - '+fmtHMS(it.r.end,tz)+'  '+SIGNS[g.sign][0]+'  '+NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub]+(x.high?'  HIGHLY AUSPICIOUS':'')+(x.money?'  MONEY':'')+(x.flow?'  MONEY FLOW':'');}).join('\n');
    try{navigator.clipboard.writeText(text).then(()=>{$('cmMsg').textContent='Copied.';},()=>{});}catch(e){}
  });
}
(function initCm(){
  const d=new Date(Date.now()+TZ*3600000), iso=d.toISOString().slice(0,10);
  $('cmFrom').value=iso; $('cmTo').value=iso;
  $('cmBtn').addEventListener('click',()=>{$('cmPanel').classList.remove('hide');$('cmPanel').scrollIntoView({block:'start'});});
  $('cmClose').addEventListener('click',()=>$('cmPanel').classList.add('hide'));
  $('cmGo').addEventListener('click',cmRun);
  $('cmShow').addEventListener('change',()=>{if(CM)cmShow();});
  $('abBtn').addEventListener('click',()=>{$('abPanel').classList.remove('hide');$('abPanel').scrollIntoView({block:'start'});});
  $('abClose').addEventListener('click',()=>$('abPanel').classList.add('hide'));
})();


/* ---------- place picker, local clock, live chart (v3.4) ---------- */
const UTCS=[-12,-11,-10,-9.5,-9,-8,-7,-6,-5,-4,-3.5,-3,-2,-1,0,1,2,3,3.5,4,4.5,5,5.5,5.75,6,6.5,7,8,8.75,9,9.5,10,10.5,11,12,12.75,13,13.75,14];
const utcLbl=o=>{const a=Math.abs(o),h=Math.floor(a),m=Math.round((a-h)*60);return 'UTC'+(o<0?'−':'+')+p2(h)+':'+p2(m);};
const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
let PL_TZ=null, PL_NAME='', PL_LIST=[], LIVEON=false, LIVE_T=null;
const WCBY={}; WC.forEach(x=>{(WCBY[x.cc]=WCBY[x.cc]||[]).push(x);});

// ---- online place lookup for villages and small places that are not in the offline list (v4.2)
var WEB_CACHE={}, WEB_T=null;
function webC(q,again){
  q=(q||'').trim(); if(q.length<3)return [];
  if(WEB_CACHE[q])return WEB_CACHE[q];
  if(navigator.onLine!==false){
    clearTimeout(WEB_T);
    WEB_T=setTimeout(()=>{
      fetch('https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(q)+'&count=30&language=en&format=json').then(r=>r.json()).then(j=>{
        WEB_CACHE[q]=(j.results||[]).filter(x=>x.timezone).map(x=>({n:x.name,cc:x.country||'',st:x.admin1||'',lat:+(+x.latitude).toFixed(4),lon:+(+x.longitude).toFixed(4),tz:x.timezone}));
        again();
      }).catch(()=>{WEB_CACHE[q]=[];});
    },700);
  }
  return [];
}
function plKey(x){return x.k||(x.k=x.n.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase());}
function plFill(keep){
  const qr=$('plSearch').value.trim().toLowerCase(), q=qr.normalize('NFD').replace(/[̀-ͯ]/g,''), cn=$('plCountry').value, all=cn==='*a';
  const src=all?WC:(WCBY[cn]||[]); let list=[];
  if(!q){list=src.slice(0,all?300:600);}
  else{
    const a=[],b=[], cap=all?300:600;
    for(let i=0;i<src.length&&a.length<cap;i++){const k=plKey(src[i]), at=k.indexOf(q); if(at===0)a.push(src[i]); else if(at>0&&b.length<cap)b.push(src[i]);}
    list=a.concat(b).slice(0,cap);
  }
  if(!list.length)list=webC(qr,()=>plFill()); PL_LIST=list; const sel=$('place');
  sel.innerHTML=list.length?list.map((x,i)=>'<option value="'+i+'">'+x.n+(x.st?', '+x.st:'')+(all?', '+x.cc:'')+'</option>').join(''):'<option value="">No match in the offline list. Online search is tried automatically when you are connected</option>';
  if(keep!==undefined&&list.length){const k=list.findIndex(x=>x===keep); if(k>=0)sel.value=k;}
  if(list.length)plPick();
}
function plRefMs(){const d=$('date').value; if(d){const a=d.split('-').map(Number); return Date.UTC(a[0],a[1]-1,a[2],12);} return Date.now();}
function plSyncSel(o){
  const sel=$('tzSel'), v=String(o); let hit=false;
  for(let i=0;i<sel.options.length;i++){ if(sel.options[i].value===v){sel.selectedIndex=i;hit=true;break;} }
  if(!hit){sel.selectedIndex=0;}
}
function plSetTz(){
  if(PL_TZ){ try{ const o=offsetAt(plRefMs(),PL_TZ); $('tz').value=o; plSyncSel(o); }catch(e){ PL_TZ=null; setMsg('This device does not know that time zone. Pick the UTC offset from the list.',true); } }
  plClock();
}
function plApply(x){
  $('lat').value=x.lat; $('lon').value=x.lon; PL_TZ=x.tz; PL_NAME=x.n+', '+x.cc; plSetTz();
  setMsg('Place set: '+PL_NAME+'. Latitude, longitude and UTC offset were filled in. Tap Show timings.');
}
function plPick(){ const x=PL_LIST[parseInt($('place').value,10)]; if(x)plApply(x); }
function plClock(){
  const el=$('locClock'); let off=NaN;
  try{off=PL_TZ?offsetAt(Date.now(),PL_TZ):parseFloat($('tz').value);}catch(e){}
  if(isNaN(off)){el.textContent='Enter a valid UTC offset.';return;}
  const d=new Date(Date.now()+off*3600000);
  el.innerHTML='<b>Local time at '+(PL_NAME||'the entered place')+':</b> '+DAYS[d.getUTCDay()]+' '+d.getUTCDate()+' '+MON[d.getUTCMonth()]+' '+d.getUTCFullYear()+', '+p2(d.getUTCHours())+':'+p2(d.getUTCMinutes())+':'+p2(d.getUTCSeconds())+' · '+utcLbl(off)+(PL_TZ?' · '+PL_TZ:' · manual offset')+'<br>Everything is calculated for this place, its local time and the ayanamsa chosen: '+($('ayan').value==='kp'?'KP (Krishnamurti)':'Lahiri')+'.';
}
function plNearest(la,lo){
  let best=null,bd=1e9,c=Math.cos(la*Math.PI/180);
  for(let i=0;i<WC.length;i++){const x=WC[i],dy=x.lat-la,dx=(x.lon-lo)*c,d=dx*dx+dy*dy; if(d<bd){bd=d;best=x;}}
  return {x:best,d:Math.sqrt(bd)};
}
function plUseLoc(){
  const sb=$('locSettings'); sb.classList.add('hide');
  if(!navigator.geolocation){setMsg('Location is not available here. Choose a place or enter coordinates.',true);return;}
  setMsg('Finding your location…');
  const ok=pos=>{
    const la=pos.coords.latitude, lo=pos.coords.longitude, n=plNearest(la,lo);
    $('lat').value=la.toFixed(4); $('lon').value=lo.toFixed(4);
    let z=''; try{z=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(e){}
    PL_TZ=(n.x&&n.d<2.5)?n.x.tz:(z||(n.x&&n.x.tz)||null);
    PL_NAME='My location'+(n.x&&n.d<2.5?' (near '+n.x.n+', '+n.x.cc+')':'');
    if(!PL_TZ){PL_TZ=null;$('tz').value=-new Date().getTimezoneOffset()/60;}
    $('plSearch').value='';
    const now=Date.now(); let off=-new Date().getTimezoneOffset()/60; try{if(PL_TZ)off=offsetAt(now,PL_TZ);}catch(e){}
    const ld=new Date(now+off*3600000); $('date').value=ld.toISOString().slice(0,10);
    plSetTz(); setMsg('Location set: '+PL_NAME+' · '+la.toFixed(4)+', '+lo.toFixed(4)+' · '+utcLbl(off)+'. Tap Show timings.');
  };
  const fail=e=>{
    const c=e&&e.code;
    if(c===1){
      setMsg('Location permission was denied or blocked. In the Android app: Settings → Apps → GuruAgasthiya → Permissions → Location → Allow (Precise or Approximate), then tap Use my location again. Meanwhile choose a place from the list or type coordinates.',true);
      if(window.GuruApp&&GuruApp.openSettings)sb.classList.remove('hide');
    }else if(c===2){setMsg('Your location is not available. Switch on Location (GPS) in the phone settings and try again, or choose a place.',true);}
    else{setMsg('Finding the location took too long. Move to an open place, check that Location is on, and try again, or choose a place.',true);}
  };
  try{
    navigator.geolocation.getCurrentPosition(ok,e=>{
      if(e&&e.code!==1){ navigator.geolocation.getCurrentPosition(ok,fail,{enableHighAccuracy:true,timeout:25000,maximumAge:0}); }
      else fail(e);
    },{enableHighAccuracy:false,timeout:12000,maximumAge:600000});
  }catch(e){setMsg('Location is not available here. Choose a place or enter coordinates.',true);}
}
function plNow(){
  const now=Date.now(); let off=parseFloat($('tz').value);
  try{if(PL_TZ){off=offsetAt(now,PL_TZ);$('tz').value=off;plSyncSel(off);}}catch(e){}
  if(isNaN(off)){setMsg('Enter a valid UTC offset first.',true);return;}
  const d=new Date(now+off*3600000);
  $('date').value=d.toISOString().slice(0,10); $('time').value=p2(d.getUTCHours())+':'+p2(d.getUTCMinutes());
  setMsg('Date and start time set to the local time now at '+(PL_NAME||'the entered place')+'. Tap Show timings.');
}
(function initPlace(){
  const cs=$('plCountry'); cs.innerHTML='<option value="*a">All countries (use search)</option>'+CITY.cc.map(n=>'<option value="'+n.replace(/"/g,'&quot;')+'">'+n+'</option>').join('');
  const ts=$('tzSel'); ts.innerHTML='<option value="">Custom / from place</option>'+UTCS.map(o=>'<option value="'+o+'">'+utcLbl(o)+'</option>').join('');
  cs.addEventListener('change',()=>{$('plSearch').value=$('plSearch').value;plFill();});
  $('plSearch').addEventListener('input',()=>plFill());
  $('place').addEventListener('change',plPick);
  ts.addEventListener('change',()=>{ if(ts.value!==''){$('tz').value=ts.value; PL_TZ=null; plClock();} });
  $('tz').addEventListener('input',()=>{PL_TZ=null; const o=parseFloat($('tz').value); if(!isNaN(o))plSyncSel(o); plClock();});
  ['lat','lon'].forEach(id=>$(id).addEventListener('input',()=>{PL_NAME='the entered coordinates';plClock();}));
  $('date').addEventListener('change',plSetTz);
  $('ayan').addEventListener('change',()=>{plClock(); if(ROWS.length)run();});
  $('nowLocal').addEventListener('click',plNow);
  $('locSettings').addEventListener('click',()=>{try{GuruApp.openSettings();}catch(e){}});
  // starting place: from the device time zone, else Tiruchirappalli
  let dz=''; try{dz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(e){}
  if(dz==='Asia/Calcutta')dz='Asia/Kolkata';
  let start=null;
  if(dz) start=WC.find(x=>x.tz===dz);
  const tru=WC.find(x=>x.cc==='India'&&x.n==='Tiruchirappalli');
  if(dz==='Asia/Kolkata'||!start) start=tru||start||WC[0];
  cs.value=start.cc; plFill(start);
  setInterval(plClock,1000);
})();
function liveCfg(){
  const lat=parseFloat($('lat').value), lon=parseFloat($('lon').value); let tz=parseFloat($('tz').value);
  try{if(PL_TZ)tz=offsetAt(Date.now(),PL_TZ);}catch(e){}
  if(isNaN(lat)||isNaN(lon)||isNaN(tz)||Math.abs(lat)>62)return null;
  return {lat:lat,lon:lon,tz:tz,kind:$('ayan').value};
}
function liveTick(){
  if(!LIVEON)return; const c=liveCfg();
  if(!c){$('chartErr').textContent='Choose a place (latitude between -62 and 62) to see the live chart.';return;}
  const oT=TZ, oC=CFG; TZ=c.tz; CFG={lat:c.lat,lon:c.lon,kind:c.kind};
  try{drawChart(Date.now());}finally{TZ=oT;CFG=oC;}
}
function liveSet(on){
  LIVEON=on; $('chLive').checked=on; if(LIVE_T){clearInterval(LIVE_T);LIVE_T=null;}
  if(on){stopPlay(); liveTick(); LIVE_T=setInterval(liveTick,1000);}
}
function drawNorth(ms){
  const asc=sidAsc(ms,CFG.lat,CFG.lon,CFG.kind), A=Math.floor(asc/30)%12, ag=SEGS[findSeg(asc)], pl=planets(ms);
  const passed=new Set(); if(!LIVEON){let ri=ROWS.findIndex(r=>ms>=r.start&&ms<r.end); if(ri<0)ri=ROWS.length-1; for(let i=0;i<=ri;i++)passed.add(SEGS[ROWS[i].k].sign);}
  const H={1:[[200,0],[300,100],[200,200],[100,100]],4:[[0,200],[100,100],[200,200],[100,300]],7:[[200,400],[100,300],[200,200],[300,300]],10:[[400,200],[300,300],[200,200],[300,100]],
    2:[[0,0],[200,0],[100,100]],3:[[0,0],[100,100],[0,200]],5:[[0,200],[100,300],[0,400]],6:[[0,400],[100,300],[200,400]],8:[[200,400],[300,300],[400,400]],9:[[400,400],[300,300],[400,200]],11:[[400,200],[300,100],[400,0]],12:[[400,0],[300,100],[200,0]]};
  const bySign=Array.from({length:12},()=>[]); pl.forEach(p=>bySign[Math.floor(p.lon/30)%12].push(p));
  let s='<svg class="ch" viewBox="0 0 400 480" role="img" aria-label="North Indian style chart of planets and ascendant">';
  for(let h=1;h<=12;h++){
    const V=H[h], sg=(A+h-1)%12, pts=V.map(v=>v.join(',')).join(' ');
    s+='<polygon class="cell" points="'+pts+'"/>';
    if(passed.has(sg))s+='<polygon class="pass" points="'+pts+'"/>';
  }
  s+='<polygon class="asc" points="'+H[1].map(v=>v.join(',')).join(' ')+'"/>';
  for(let h=1;h<=12;h++){
    const V=H[h], sg=(A+h-1)%12, n=V.length;
    const cx=V.reduce((a,v)=>a+v[0],0)/n, cy=V.reduce((a,v)=>a+v[1],0)/n;
    let nx,ny;
    if(n===4){nx=cx+0.5*(200-cx);ny=cy+0.5*(200-cy);}
    else{const iv=V.find(v=>(v[0]===100||v[0]===300)&&(v[1]===100||v[1]===300)); nx=cx+0.78*(iv[0]-cx); ny=cy+0.78*(iv[1]-cy);}
    s+='<text class="sn" x="'+nx.toFixed(0)+'" y="'+(ny+4).toFixed(0)+'" text-anchor="middle">'+(sg+1)+'</text>';
    const L=[]; if(h===1)L.push({t:'Asc '+Math.floor(asc%30)+'°'+p2(Math.floor((asc%30%1)*60))+'′',a:1});
    bySign[sg].forEach(p=>L.push({t:p.c+' '+Math.floor(p.lon%30)+'°'+(p.retro?'R':'')}));
    const cls=L.length>4?'pt2':'pt', lh=L.length>4?13:15, two=L.length>6;
    L.forEach((ln,i)=>{
      let x=cx, y;
      if(two){const col=i%2,row=Math.floor(i/2),rows=Math.ceil(L.length/2); x=cx+(col?24:-24); y=cy-(rows-1)*lh/2+row*lh+4;}
      else y=cy-(L.length-1)*lh/2+i*lh+(n===4&&h!==1?0:0)+4-(n===4&&(h===1)?10:0);
      s+='<text class="'+cls+(ln.a?' at':'')+'" x="'+x.toFixed(0)+'" y="'+y.toFixed(0)+'" text-anchor="middle">'+ln.t+'</text>';
    });
  }
  const d=new Date(ms+TZ*3600000), hms=p2(d.getUTCHours())+':'+p2(d.getUTCMinutes())+':'+p2(d.getUTCSeconds());
  s+='<text class="c1" x="200" y="424" text-anchor="middle">'+d.getUTCDate()+' '+MON[d.getUTCMonth()]+' '+d.getUTCFullYear()+' · '+hms+(LIVEON?' · LIVE':'')+'</text>'
   +'<text class="c3" x="200" y="446" text-anchor="middle">'+SIGNS[A][0]+' '+inSign(asc)+' rising · '+NAME[ag.lord]+'/'+NAME[ag.star]+'/'+NAME[ag.sub]+'</text>'
   +'<text class="c5" x="200" y="468" text-anchor="middle">'+TLAG[A]+' லக்னம் · '+tl(ag)+'</text></svg>';
  $('chartBox').innerHTML=s;
}
function drawChart(ms){
  drawChartS(ms);
}
(function initLive(){
  $('chLive').addEventListener('change',()=>liveSet($('chLive').checked));
  $('slider').addEventListener('input',()=>{if(LIVEON)liveSet(false);});
  $('play').addEventListener('click',()=>{if(LIVEON)liveSet(false);});
})();


/* ---------- Birth chart / Janma jathagam (v3.6) ---------- */
const bpEsc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const BP_TITHI=['Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami','Ashtami','Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi'];
const BP_TITHI_TA=['பிரதமை','துவிதியை','திருதியை','சதுர்த்தி','பஞ்சமி','சஷ்டி','சப்தமி','அஷ்டமி','நவமி','தசமி','ஏகாதசி','துவாதசி','திரயோதசி','சதுர்த்தசி'];
const BP_YOGA=['Vishkambha','Priti','Ayushman','Saubhagya','Shobhana','Atiganda','Sukarma','Dhriti','Shula','Ganda','Vriddhi','Dhruva','Vyaghata','Harshana','Vajra','Siddhi','Vyatipata','Variyan','Parigha','Shiva','Siddha','Sadhya','Shubha','Shukla','Brahma','Indra','Vaidhriti'];
const BP_YOGA_TA=['விஷ்கம்பம்','ப்ரீதி','ஆயுஷ்மான்','சௌபாக்யம்','சோபனம்','அதிகண்டம்','சுகர்மம்','திருதி','சூலம்','கண்டம்','விருத்தி','துருவம்','வியாகாதம்','ஹர்ஷணம்','வஜ்ரம்','சித்தி','வியதீபாதம்','வரீயான்','பரிகம்','சிவம்','சித்தம்','சாத்தியம்','சுபம்','சுக்லம்','பிரம்மம்','ஐந்திரம்','வைதிருதி'];
const BP_KAR=['Bava','Balava','Kaulava','Taitila','Gara','Vanija','Vishti'], BP_KAR_TA=['பவம்','பாலவம்','கௌலவம்','தைதுலம்','கரசை','வணிசை','பத்திரை'];
const BP_VARA=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], BP_VARA_TA=['ஞாயிறு','திங்கள்','செவ்வாய்','புதன்','வியாழன்','வெள்ளி','சனி'];
const BP_SHORT={en:{Su:'Su',Mo:'Mo',Ma:'Ma',Me:'Me',Ju:'Ju',Ve:'Ve',Sa:'Sa',Ra:'Ra',Ke:'Ke',L:'Asc'},ta:{Su:'சூ',Mo:'சந்',Ma:'செ',Me:'பு',Ju:'கு',Ve:'சு',Sa:'சனி',Ra:'ரா',Ke:'கே',L:'ல'}};
const BP_EX={Su:0,Mo:1,Ma:9,Me:5,Ju:3,Ve:11,Sa:6,Ra:1,Ke:7}, BP_DB={Su:6,Mo:7,Ma:3,Me:11,Ju:9,Ve:5,Sa:0,Ra:7,Ke:1}, BP_OWN={Su:[4],Mo:[3],Ma:[0,7],Me:[2,5],Ju:[8,11],Ve:[1,6],Sa:[9,10]};
const BP_YRS={Ke:7,Ve:20,Su:6,Mo:10,Ma:7,Ra:18,Ju:16,Sa:19,Me:17}, BP_YEAR=365.25*86400000;
const BP_HOUSE=[['Self, body, personality','தன்னைப் பற்றி, உடல், ஆளுமை'],['Wealth, family, speech','செல்வம், குடும்பம், வாக்கு'],['Courage, siblings, short travel, communication','தைரியம், சகோதரர், குறுந்தூரப் பயணம், தொடர்பு'],['Mother, home, property, vehicles, education','தாய், வீடு, சொத்து, வாகனம், கல்வி'],['Children, intelligence, romance, speculation','பிள்ளைகள், புத்தி, காதல், ஊக வணிகம்'],['Debts, disease, enemies, service','கடன், நோய், எதிரி, சேவை'],['Marriage, spouse, partnership, business','திருமணம், துணை, கூட்டாண்மை, வியாபாரம்'],['Longevity, obstacles, sudden events, inheritance','ஆயுள், தடைகள், திடீர் நிகழ்வு, பரம்பரைச் சொத்து'],['Fortune, father, higher learning, long travel','பாக்கியம், தந்தை, உயர்கல்வி, நீண்டதூரப் பயணம்'],['Career, status, profession, authority','தொழில், அந்தஸ்து, அதிகாரம்'],['Gains, income, fulfilment of desires, elder siblings','லாபம், வருமானம், ஆசை நிறைவேறுதல், மூத்த சகோதரர்'],['Loss, expenses, foreign lands, bed pleasures, moksha','விரயம், செலவு, வெளிநாடு, படுக்கை சுகம், மோட்சம்']];
const BP_KARAKA={Su:['Soul, father, authority, government','ஆன்மா, தந்தை, அதிகாரம், அரசு'],Mo:['Mind, mother, emotions, public','மனம், தாய், உணர்வு, மக்கள்'],Ma:['Energy, brothers, land, courage','சக்தி, சகோதரர், நிலம், தைரியம்'],Me:['Intellect, speech, trade, communication','அறிவு, வாக்கு, வணிகம், தொடர்பு'],Ju:['Wisdom, children, wealth, teacher','ஞானம், பிள்ளைகள், செல்வம், குரு'],Ve:['Love, spouse, comforts, arts','காதல், துணை, சுகம், கலை'],Sa:['Karma, delay, service, longevity','கர்மம், தாமதம், சேவை, ஆயுள்'],Ra:['Foreign, sudden gains and losses, illusion','அந்நியம், திடீர் லாபநஷ்டம், மாயை'],Ke:['Detachment, spirituality, moksha','பற்றின்மை, ஆன்மிகம், மோட்சம்']};
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
let BP=null, BP_NAME='', BP_PLACE_NAME='', BP_LIST2=[];
const bpFmtDate=(ms,off)=>{const d=new Date(ms+off*3600000);return p2(d.getUTCDate())+' '+MON[d.getUTCMonth()]+' '+d.getUTCFullYear();};
const bpDeg=x=>Math.floor(x%30)+'°'+p2(Math.floor((x%30%1)*60))+'′';
function bpNavamsa(lon){return Math.floor(lon/(10/3))%12;}
// ---- date and time dropdowns
function bpDateStr(){const y=+$('bpYear').value,m=+$('bpMonth').value,d=+$('bpDay').value; if(!y||!m||!d)return ''; const t=new Date(Date.UTC(y,m-1,d)); if(t.getUTCDate()!==d||t.getUTCMonth()!==m-1)return ''; return y+'-'+p2(m)+'-'+p2(d);}
function bpTimeStr(){const h=(+$('bpHour').value)%12+($('bpAmpm').value==='PM'?12:0); return p2(h)+':'+p2(+$('bpMin').value)+':'+p2(+$('bpSec').value);}
function bpSetDate(str){const a=str.split('-').map(Number); $('bpYear').value=a[0];$('bpMonth').value=a[1];$('bpDay').value=a[2];}
function bpSetTime(str){const a=str.split(':').map(Number),h=a[0]||0; $('bpAmpm').value=h>=12?'PM':'AM'; $('bpHour').value=(h%12)||12; $('bpMin').value=a[1]||0; $('bpSec').value=a[2]||0;}

// ---- charts drawn in plain text (for Notepad, Word, WhatsApp)
function asciiSouth(by,title){
  const W=15, grid=Array.from({length:4},()=>Array(4).fill(null));
  for(let sg=0;sg<12;sg++){const c=CELL[sg][0], r=CELL[sg][1], lines=[]; let cur='';
    by[sg].forEach(w=>{ if((cur+' '+w).trim().length>W-2){lines.push(cur.trim());cur=w;}else cur=(cur+' '+w).trim(); }); if(cur)lines.push(cur);
    grid[r][c]={hd:SIGNS[sg][0].slice(0,3).toUpperCase(),lines:lines};}
  const sep='+'+('-'.repeat(W)+'+').repeat(4), out=[sep];
  for(let r=0;r<4;r++){
    const h=Math.max(3,...grid[r].filter(Boolean).map(c=>c.lines.length+1));
    for(let k=0;k<h;k++){let line='|';
      for(let c=0;c<4;c++){const cell=grid[r][c]; let t='';
        if(cell)t=k===0?cell.hd:(cell.lines[k-1]||''); else if(r===1&&c===1&&k<2)t=(title[k]||'').slice(0,W-2); else if(r===2&&c===1&&k===0)t=(title[2]||'').slice(0,W-2);
        line+=(' '+t).padEnd(W)+'|';}
      out.push(line);}
    out.push(sep);}
  return out;
}
function asciiNorth(A,by,labels,title){
  const Wc=73,Hc=37,g=Array.from({length:Hc},()=>Array(Wc).fill(' '));
  const X=x=>Math.round(x/400*(Wc-1)), Y=y=>Math.round(y/400*(Hc-1));
  const line=(x1,y1,x2,y2)=>{const a=X(x1),b=Y(y1),c=X(x2),d=Y(y2),dx=c-a,dy=d-b,n=Math.max(Math.abs(dx),Math.abs(dy));
    for(let i=0;i<=n;i++){const xx=Math.round(a+dx*i/n),yy=Math.round(b+dy*i/n);g[yy][xx]=dy===0?'-':dx===0?'|':(dx*dy>0?'\\':'/');}};
  line(0,0,400,0);line(400,0,400,400);line(400,400,0,400);line(0,400,0,0);line(0,0,400,400);line(400,0,0,400);
  line(200,0,400,200);line(400,200,200,400);line(200,400,0,200);line(0,200,200,0);
  const H={1:[[200,0],[300,100],[200,200],[100,100]],4:[[0,200],[100,100],[200,200],[100,300]],7:[[200,400],[100,300],[200,200],[300,300]],10:[[400,200],[300,300],[200,200],[300,100]],
    2:[[0,0],[200,0],[100,100]],3:[[0,0],[100,100],[0,200]],5:[[0,200],[100,300],[0,400]],6:[[0,400],[100,300],[200,400]],8:[[200,400],[300,300],[400,400]],9:[[400,400],[300,300],[400,200]],11:[[400,200],[300,100],[400,0]],12:[[400,0],[300,100],[200,0]]};
  const put=(r,c,t)=>{const st=c-Math.floor(t.length/2); for(let i=0;i<t.length;i++){const cc=st+i; if(r>=0&&r<Hc&&cc>=0&&cc<Wc)g[r][cc]=t[i];}};
  for(let h=1;h<=12;h++){
    const V=H[h],sg=(A+h-1)%12,n=V.length,cx=V.reduce((a,v)=>a+v[0],0)/n,cy=V.reduce((a,v)=>a+v[1],0)/n;
    let items=by[sg]||[]; const rows=[]; if(items.length>4){for(let i=0;i<items.length;i+=2)rows.push(items.slice(i,i+2).join(' '));}else items.forEach(t=>rows.push(t));
    const lines=['('+(labels?labels[h-1]:sg+1)+')'].concat(rows), r0=Y(cy)-Math.floor(lines.length/2);
    lines.forEach((t,i)=>put(r0+i,X(cx),t));
  }
  const out=g.map(r=>r.join('').replace(/\s+$/,'')); out.push('   '+title); return out;
}
// ---- charts as pictures (for Word)
function bpSvgPng(svg){
  return new Promise((res,rej)=>{
    const theme=document.documentElement.getAttribute('data-theme'); document.documentElement.setAttribute('data-theme','light');
    const clone=svg.cloneNode(true), src=svg.querySelectorAll('*'), dst=clone.querySelectorAll('*');
    const props=['fill','stroke','stroke-width','font-size','font-family','font-weight','font-style','text-anchor'];
    src.forEach((el,i)=>{const cs=getComputedStyle(el); props.forEach(q=>{const v=cs.getPropertyValue(q); if(v)dst[i].style.setProperty(q,v);});});
    if(theme===null)document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme',theme);
    const vb=svg.viewBox.baseVal, w=vb.width, h=vb.height, sc=2;
    clone.setAttribute('xmlns','http://www.w3.org/2000/svg'); clone.setAttribute('width',w*sc); clone.setAttribute('height',h*sc);
    const img=new Image();
    img.onload=()=>{try{const c=document.createElement('canvas');c.width=w*sc;c.height=h*sc;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0);res(c.toDataURL('image/png'));}catch(e){rej(e);}};
    img.onerror=()=>rej(new Error('image'));
    img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(clone));
  });
}
// ---- charts
function bpDraw(A,by,ttl,labels,w){
  const signs=SIGNS.map((x,i)=>I18N60.sn(i));
  return CH60.draw({A:A,by:by,signs:signs,hn:labels||null,center:[{t:ttl[0],c:'c60t'},{t:ttl[1],c:'c60k'}],caption:[{t:ttl[0]+' · '+ttl[1],c:'c60t'}],south:{caption:[]},north:{center:[]},w:w||null,aria:ttl.join(' ')},$('bpStyle').value);
}
// ---- dasha
function bpDasha(moonLon,birthMs){
  const N=360/27, nak=Math.floor(moonLon/N), lord=ORDER[nak%9], el=(moonLon%N)/N;
  const start0=birthMs-el*BP_YRS[lord]*BP_YEAR, out=[]; let t=start0; const k=ORDER.indexOf(lord);
  for(let i=0;i<9;i++){
    const c=ORDER[(k+i)%9], len=BP_YRS[c]*BP_YEAR, m={c:c,s:t,e:t+len,ant:[]};
    let a=t; for(let j=0;j<9;j++){const d=ORDER[(ORDER.indexOf(c)+j)%9], al=len*BP_YRS[d]/120, an={c:d,s:a,e:a+al,pr:[]};
      let q=a; for(let l=0;l<9;l++){const f=ORDER[(ORDER.indexOf(d)+l)%9], pl=al*BP_YRS[f]/120; an.pr.push({c:f,s:q,e:q+pl}); q+=pl;}
      m.ant.push(an); a+=al;}
    out.push(m); t+=len;
  }
  return {list:out,balance:(1-el)*BP_YRS[lord],lord:lord};
}
const bpYMD=y=>Math.floor(y)+' years '+Math.floor((y%1)*12)+' months '+Math.round((((y%1)*12)%1)*30)+' days';
// ---- main calculation
function bpCalc(){
  const out=$('bpOut'), err=m=>{out.innerHTML='<p class="msg err">'+m+'</p>';BP=null;};
  const ds=bpDateStr(), ts=bpTimeStr(), lat=parseFloat($('bpLat').value), lon=parseFloat($('bpLon').value), tzs=$('bpTz').value.trim(), kind=$('bpAyan').value;
  if(!ds)return err('Choose a valid date of birth (for example, 30 February does not exist).');
  if(isNaN(lat)||isNaN(lon)||!tzs)return err('Choose the place of birth (or enter latitude, longitude and time zone).');
  if(Math.abs(lat)>62)return err('Latitude beyond 62° is not supported.');
  if(typeof Astronomy==='undefined')return err('Planet positions need the astronomy library, which did not load. Check your connection and reload.');
  const [y,m,d]=ds.split('-').map(Number), tp=ts.split(':').map(Number);
  let r; try{r=localToUtc(y,m,d,tp[0]||0,tp[1]||0,tzs);}catch(e){return err('The time zone was not recognised. Use a name such as Asia/Kolkata or hours such as 5.5.');}
  const ms=r.ms+(tp[2]||0)*1000, off=r.off, old=CFG; CFG={lat:lat,lon:lon,kind:kind};
  const T=[]; let h='';
  try{
    const asc=sidAsc(ms,lat,lon,kind), A=Math.floor(asc/30)%12, ag=SEGS[findSeg(asc)];
    const pls=planets(ms), P={},R={}; pls.forEach(p=>{P[p.c]=p.lon;R[p.c]=p.retro&&p.c!=='Ra'&&p.c!=='Ke';});
    const cu=placidusCusps(ms,lat,lon,kind), hs=cu.map((x,i)=>({n:i+1,lon:x,g:SEGS[findSeg(x)]}));
    const bh=lonv=>{for(let i=0;i<12;i++){const a=cu[i],b=cu[(i+1)%12];if(mod(lonv-a,360)<mod(b-a,360))return i+1;}return 1;};
    const rh=lonv=>((Math.floor(lonv/30)%12-A+12)%12)+1;
    const ownH=c=>hs.filter(x=>x.g.lord===c).map(x=>x.n);   // houses whose cusp sign is ruled by the planet
    const starL=c=>SEGS[findSeg(P[c])].star;
    const SH={L:I18N60.aw()}; CODES.forEach(c=>{SH[c]=I18N60.pn(c,true);});
    const mk=useNav=>{const by=Array.from({length:12},()=>[]); const sgOf=l=>useNav?bpNavamsa(l):Math.floor(l/30)%12; const a2=sgOf(asc); by[a2].push({k:'L',t:SH.L});
      CODES.forEach(c=>{const l=P[c];by[sgOf(l)].push({k:c,t:SH[c],d:(useNav?Math.floor((l%(10/3))/(10/3)*30):Math.floor(l%30))+'°',r:R[c]});}); if(!useNav){ const _fl=mod(hs[0].lon+P.Mo-P.Su,360); by[Math.floor(_fl/30)%12].push({k:'F',t:'Fo',d:Math.floor(_fl%30)+'°'}); } return {A:a2,by:by};};
    const rasi=mk(false), nav=mk(true), draw=bpDraw;
    const bhBy=Array.from({length:12},()=>[]); // KP bhava chart: house h is drawn as house h of the north chart
    bhBy[A].push({k:'L',t:SH.L});
    CODES.forEach(c=>{const hh=bh(P[c]); bhBy[(A+hh-1)%12].push({k:c,t:SH[c],d:Math.floor(P[c]%30)+'°',r:R[c]});});
    const labels=hs.map(x=>x.g.sign+1);
    const BPW=westPack(ms,hs.map(x=>x.lon),P,R,kind);
    const nm=(BP_NAME||$('bpName').value.trim())||'Birth chart';
    const dstr=bpFmtDate(ms,off)+', '+p2(tp[0]||0)+':'+p2(tp[1]||0)+':'+p2(tp[2]||0);
    const ayTxt=(kind==='kp'?'KP (Krishnamurti)':'Lahiri')+' ('+dms(ayanamsa(ms/86400000+2440587.5,kind))+')';
    const tzTxt=utcTxt(off)+(/^-?[\d.]+$/.test(tzs)?'':', '+tzs);
    const placeTxt=(BP_PLACE_NAME?BP_PLACE_NAME+' · ':'')+lat+', '+lon;
    T.push('GURUAGASTHIYA · BIRTH CHART (பிறப்பு ஜாதகம்)','Name: '+nm,'Born: '+dstr+' local time ('+tzTxt+')','Place: '+placeTxt,'Ayanamsa: '+ayTxt,'Lagna: '+SIGNS[A][0]+' '+bpDeg(asc)+' ('+TLAG[A]+' லக்னம்)','');
    h+='<div class="btns bpact"><button type="button" class="bpcopy">Copy all data · நகலெடு</button><button type="button" class="bpprint">Print / save as PDF · அச்சிடு</button><button type="button" class="bpsave">Save / share file · சேமி / பகிர்</button></div>';
    h+='<div class="lf-time"><b>'+bpEsc(nm)+'</b><br>Born: '+dstr+' local time ('+bpEsc(tzTxt)+')<br>Place: '+bpEsc(placeTxt)+'<br>Ayanamsa: '+ayTxt+'<br>Lagna: <b>'+SIGNS[A][0]+' '+bpDeg(asc)+'</b> · <span style="font-family:var(--ta)">'+TLAG[A]+' லக்னம்</span></div>';
    h+='<div class="bpc"><div><h3>Rasi chart<span class="ta">ராசி சக்கரம்</span></h3>'+draw(rasi.A,rasi.by,[I18N60.sn(A)+' '+bpDeg(asc),T60('Rasi chart')],null,BPW)+'</div>'+
       '<div><h3>Navamsa (D-9)<span class="ta">நவாம்சம்</span></h3>'+draw(nav.A,nav.by,[I18N60.sn(nav.A),T60('Navamsa (D-9)')])+'</div>'+
       '<div><h3>KP bhava chart<span class="ta">கே.பி பாவ சக்கரம்</span></h3>'+bpDraw(A,bhBy,[T60('KP bhava chart'),'Placidus'],labels,BPW)+'</div></div>';
    // charts drawn in plain text, in the chosen style (English labels so the columns line up)
    const mkE=useNav=>{const by=Array.from({length:12},()=>[]); const sgOf=l=>useNav?bpNavamsa(l):Math.floor(l/30)%12; const a2=sgOf(asc), E=BP_SHORT.en; by[a2].push(E.L);
      CODES.forEach(c=>{const l=P[c];by[sgOf(l)].push(E[c]+' '+(useNav?Math.floor((l%(10/3))/(10/3)*30):Math.floor(l%30))+'\u00b0'+(R[c]?'R':''));}); return {A:a2,by:by};};
    const _FLt=mod(hs[0].lon+P.Mo-P.Su,360); const rE=mkE(false), nE=mkE(true), bhE=Array.from({length:12},()=>[]); bhE[A].push('Asc');
    CODES.forEach(c=>{const hh=bh(P[c]); bhE[(A+hh-1)%12].push(BP_SHORT.en[c]+' '+Math.floor(P[c]%30)+'\u00b0'+(R[c]?'R':''));});
    const sty=$('bpStyle').value, north=sty==='north';
    const txtChart=(title,by,A2,lab,tt)=>{(sty==='both'?[false,true]:[north]).forEach(nn=>{T.push(title.replace('RASI CHART ('+(north?'North':'South'),'RASI CHART ('+(nn?'North':'South')).replace('North/South','')); (nn||lab?asciiNorth(A2,by,lab,tt.replace(/\|/g,' - ')):asciiSouth(by,tt.split('|'))).forEach(l=>T.push(l)); T.push('');});};
    txtChart('RASI CHART ('+(north?'North':'South')+' Indian style; R = retrograde)',rE.by,rE.A,null,'RASI|'+SIGNS[A][0]+'|lagna');
    txtChart('NAVAMSA D-9 CHART',nE.by,nE.A,null,'NAVAMSA D-9|'+SIGNS[nE.A][0]+'|lagna');
    txtChart('KP BHAVA CHART (houses by KP cusps; the number in brackets is the cusp sign)',bhE,A,labels,'KP BHAVA|chart');
    T.push('KP houses and planets:'); for(let i=1;i<=12;i++){T.push('  House '+i+' ('+SIGNS[hs[i-1].g.sign][0]+'): '+(CODES.filter(c=>bh(P[c])===i).map(c=>NAME[c]).join(', ')||'-'));} T.push('');
    // lagna lords
    h+='<div class="lf-sec"><h3>Lagna lord, star lord, sub lord<span class="ta">லக்ன அதிபதி, நட்சத்திர, உப அதிபதி</span></h3>'+lfItem('info','<b>'+NAME[ag.lord]+' / '+NAME[ag.star]+' / '+NAME[ag.sub]+'</b> · '+NAKS[ag.nak]+' ('+GP_NAKT[ag.nak]+')','<b>'+TA[ag.lord]+' / '+TA[ag.star]+' / '+TA[ag.sub]+'</b>')+'</div>';
    T.push('LAGNA LORD / STAR LORD / SUB LORD: '+NAME[ag.lord]+' / '+NAME[ag.star]+' / '+NAME[ag.sub]+' ('+NAKS[ag.nak]+')','');
    // panchanga
    const sunL=P.Su, moonL=P.Mo, el=mod(moonL-sunL,360), ti=Math.floor(el/12), tn=ti%15, pak=ti<15?'Shukla':'Krishna', pakTa=ti<15?'வளர்பிறை':'தேய்பிறை';
    const tiName=ti===14?'Pournami':ti===29?'Amavasya':BP_TITHI[tn], tiTa=ti===14?'பௌர்ணமி':ti===29?'அமாவாசை':BP_TITHI_TA[tn];
    const yo=Math.floor(mod(sunL+moonL,360)/(360/27)), kr=Math.floor(el/6);
    let kn,knt; if(kr===0){kn='Kimstughna';knt='கிம்ஸ்துக்னம்';}else if(kr>=57){kn=['Shakuni','Chatushpada','Naga'][kr-57];knt=['சகுனி','சதுஷ்பாதம்','நாகவம்'][kr-57];}else{kn=BP_KAR[(kr-1)%7];knt=BP_KAR_TA[(kr-1)%7];}
    let sr='',ss='',varaIdx=new Date(ms+off*3600000).getUTCDay();
    try{
      const loc0=Math.floor((ms+off*3600000)/86400000)*86400000-off*3600000, obs=new Astronomy.Observer(lat,lon,0);
      const rise=Astronomy.SearchRiseSet(Astronomy.Body.Sun,obs,+1,Astronomy.MakeTime(new Date(loc0)),1), set=Astronomy.SearchRiseSet(Astronomy.Body.Sun,obs,-1,Astronomy.MakeTime(new Date(loc0)),1);
      const f=t=>{const q=new Date(t.date.getTime()+off*3600000);return p2(q.getUTCHours())+':'+p2(q.getUTCMinutes())+':'+p2(q.getUTCSeconds());};
      if(rise){sr=f(rise); if(ms<rise.date.getTime())varaIdx=(varaIdx+6)%7;} if(set)ss=f(set);
    }catch(e){}
    const mn=Math.floor(moonL/(360/27)), pada=Math.floor((moonL%(360/27))/((360/27)/4))+1;
    h+='<div class="lf-sec"><h3>Panchanga at birth<span class="ta">பிறந்த நேர பஞ்சாங்கம்</span></h3>'+
      lfItem('info','<b>Vara:</b> '+BP_VARA[varaIdx]+(sr?' (the day begins at sunrise '+sr+', sunset '+ss+')':''),'<b>வாரம்:</b> '+BP_VARA_TA[varaIdx]+(sr?' (சூரிய உதயம் '+sr+', அஸ்தமனம் '+ss+')':''))+
      lfItem('info','<b>Tithi:</b> '+pak+' '+tiName+' ('+(el%12/12*100).toFixed(0)+'% elapsed)','<b>திதி:</b> '+pakTa+' '+tiTa)+
      lfItem('info','<b>Nakshatra:</b> '+NAKS[mn]+' pada '+pada+' ('+GP_NAKT[mn]+')','<b>நட்சத்திரம்:</b> '+GP_NAKT[mn]+' பாதம் '+pada)+
      lfItem('info','<b>Yoga:</b> '+BP_YOGA[yo],'<b>யோகம்:</b> '+BP_YOGA_TA[yo])+lfItem('info','<b>Karana:</b> '+kn,'<b>கரணம்:</b> '+knt)+'</div>';
    T.push('PANCHANGA','  Vara: '+BP_VARA[varaIdx]+(sr?' (sunrise '+sr+', sunset '+ss+')':''),'  Tithi: '+pak+' '+tiName,'  Nakshatra: '+NAKS[mn]+' pada '+pada,'  Yoga: '+BP_YOGA[yo],'  Karana: '+kn,'');
    // planet details
    const dig=c=>{const sg=Math.floor(P[c]/30)%12;return BP_EX[c]===sg?'Exalted':BP_DB[c]===sg?'Debilitated':(BP_OWN[c]&&BP_OWN[c].indexOf(sg)>=0)?'Own sign':'';};
    let t='<div class="tscroll"><table class="ctab bpd"><thead><tr><th>Body</th><th>Position</th><th>Nakshatra · pada</th><th>Star lord</th><th>Sub lord</th><th>Rasi house</th><th>KP house</th><th>Navamsa</th><th>Status</th></tr></thead><tbody>';
    T.push('PLANET DETAILS (position | nakshatra pada | star lord | sub lord | rasi house | KP house | navamsa | status)');
    const prow=(lbl,lt,lonv,c)=>{const g=SEGS[findSeg(lonv)], nk=Math.floor(lonv/(360/27)), pd=Math.floor((lonv%(360/27))/((360/27)/4))+1, stt=c?((R[c]?'Retrograde ':'')+dig(c)).trim():'Lagna';
      T.push('  '+lbl+' | '+SIGNS[g.sign][0]+' '+dms(lonv-g.sign*30)+' | '+NAKS[nk]+' '+pd+' | '+NAME[g.star]+' | '+NAME[g.sub]+' | '+rh(lonv)+' | '+bh(lonv)+' | '+SIGNS[bpNavamsa(lonv)][0]+' | '+stt);
      return '<tr><td><b>'+lbl+'</b><span class="ta">'+lt+'</span></td><td>'+SIGNS[g.sign][0]+' '+dms(lonv-g.sign*30)+'<span class="ta">'+TSIGN[g.sign]+'</span></td><td>'+NAKS[nk]+' · '+pd+'<span class="ta">'+GP_NAKT[nk]+'</span></td><td>'+NAME[g.star]+'<span class="ta">'+TA[g.star]+'</span></td><td>'+NAME[g.sub]+'<span class="ta">'+TA[g.sub]+'</span></td><td>'+rh(lonv)+'</td><td>'+bh(lonv)+'</td><td>'+SIGNS[bpNavamsa(lonv)][0]+'</td><td>'+stt+'</td></tr>';};
    t+=prow('Lagna','லக்னம்',asc,null); CODES.forEach(c=>{t+=prow(NAME[c],TA[c],P[c],c);}); t+='</tbody></table></div>'; T.push('');
    h+='<div class="lf-sec"><h3>Planetary details<span class="ta">கிரக விவரங்கள்</span></h3>'+t+'<p class="lf-note">Rahu and Ketu are the mean nodes. The KP house uses the Placidus cusps; the Rasi house counts whole signs from the lagna.</p></div>';
    // cusps
    let ct='<div class="tscroll"><table class="ctab bpd"><thead><tr><th>Cusp</th><th>Degree</th><th>Sign</th><th>Sign lord</th><th>Star lord</th><th>Sub lord</th><th>Planets in the house</th></tr></thead><tbody>';
    T.push('CUSPAL DETAILS (cusp | degree | sign lord | star lord | sub lord | planets in the house)');
    hs.forEach(x=>{const g=x.g, occ=CODES.filter(c=>bh(P[c])===x.n).map(c=>NAME[c]).join(', ')||'-';
      T.push('  '+x.n+' | '+SIGNS[g.sign][0]+' '+dms(x.lon-g.sign*30)+' | '+NAME[g.lord]+' | '+NAME[g.star]+' | '+NAME[g.sub]+' | '+occ);
      ct+='<tr><td class="hn">'+x.n+'</td><td>'+dms(x.lon-g.sign*30)+'</td><td>'+SIGNS[g.sign][0]+'<span class="ta">'+TSIGN[g.sign]+'</span></td><td>'+NAME[g.lord]+'</td><td>'+NAME[g.star]+'</td><td>'+NAME[g.sub]+'</td><td>'+occ+'</td></tr>';});
    ct+='</tbody></table></div>'; T.push('');
    h+='<div class="lf-sec"><h3>Cuspal details (KP, Placidus)<span class="ta">கஸ்ப் விவரங்கள்</span></h3>'+ct+'</div>';
    // Lord of / In table: the planet, the houses it owns, "/" and the house it stands in (KP cusps)
    const LAB={Su:'Sun',Mo:'Moo',Ma:'Mar',Me:'Mer',Ju:'Jup',Ve:'Ven',Sa:'Sat',Ra:'Rah',Ke:'Ket'}, ROM=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
    const LI=c=>LAB[c]+' '+((c==='Ra'||c==='Ke')?'-':(ownH(c).join(',')||'-'))+'/'+bh(P[c]);
    const lrows=[['Lagna',hs[0].lon]]; for(let i=1;i<12;i++)lrows.push([ROM[i],hs[i].lon]); CODES.forEach(c=>lrows.push([LI(c),P[c]])); lrows.push(['Fortuna ⊗',mod(hs[0].lon+P.Mo-P.Su,360)]);
    let lt='<div class="tscroll"><table class="ctab bpd"><thead><tr><th>Lagna / Planet<span class="ta">Lord of/In</span></th><th>Degree</th><th>Rasi Lord<span class="ta">Lord of/In</span></th><th>Star Lord<span class="ta">Lord of/In</span></th><th>Sub Lord<span class="ta">Lord of/In</span></th></tr></thead><tbody>';
    T.push('LORD OF / IN TABLE (lagna or planet | degree | rasi lord | star lord | sub lord; each shows the houses owned, then / and the house occupied)');
    lrows.forEach(function(rw){const lv=rw[1], g=SEGS[findSeg(lv)], dg=SIGNS[g.sign][0]+' '+dms(lv-g.sign*30);
      T.push('  '+rw[0]+' | '+dg+' | '+LI(g.lord)+' | '+LI(g.star)+' | '+LI(g.sub));
      lt+='<tr><td class="hn"><b>'+rw[0]+'</b></td><td>'+dg+'<span class="ta">'+TSIGN[g.sign]+'</span></td><td>'+LI(g.lord)+'</td><td>'+LI(g.star)+'</td><td>'+LI(g.sub)+'</td></tr>';});
    lt+='</tbody></table></div>'; T.push('');
    h+='<div class="lf-sec"><h3>Lord of / In table (KP)<span class="ta">அதிபதி / நிற்கும் பாவ அட்டவணை</span></h3>'+lt+'<p class="lf-note">Each entry is the planet, the houses it owns (from the KP cusp signs), then “/” and the house it stands in. Example: Mer 1,4/5 means Mercury owns houses 1 and 4 and stands in house 5. Rahu and Ketu own no house (-). Rows II to XII are the cusps; the planets follow.</p></div>';
    try{ const _fr=GA_FT.natalHtml({ms:ms,cusp:hs.map(x=>x.lon),lon:P},kind,off); h+='<div class="lf-sec"><h3>Fortuna (Asc + Moon − Sun)<span class="ta">போர்ச்சுனா (பாக்கிய புள்ளி)</span></h3>'+_fr.html+'<p class="lf-note">Quality: the star of the Fortuna sub lord signifying 2, 6, 11 is good; 5, 8, 12 is bad; both is medium. The ten fortunate elements come from the supplied notes (the author’s own experience, not from the classical texts). Open Fortuna Timing in the tools to find the fortunate times.</p></div>'; _fr.text.forEach(x=>T.push(x)); }catch(e2){ if(window.console)console.error('Fortuna',e2); }
    // planet links and significations
    let st='<div class="tscroll"><table class="ctab bpd"><thead><tr><th>Planet</th><th>Star lord</th><th>House of star lord</th><th>Houses owned by star lord</th><th>House occupied</th><th>Houses owned</th><th>Signifies houses</th><th>Natural significations</th></tr></thead><tbody>';
    T.push('PLANET LINKS AND SIGNIFICATIONS (star lord | house of star lord | houses it owns | house occupied | houses owned | signifies | natural significations)');
    CODES.forEach(c=>{const sl=starL(c), a=[bh(P[sl])], b=ownH(sl), cc=[bh(P[c])], dd=(c==='Ra'||c==='Ke')?[]:ownH(c);
      const all=[...new Set(a.concat(b,cc,dd))].sort((x,y)=>x-y);
      T.push('  '+NAME[c]+' | '+NAME[sl]+' | '+a.join(',')+' | '+(b.join(',')||'-')+' | '+cc.join(',')+' | '+(dd.join(',')||'-')+' | '+all.join(', ')+' | '+BP_KARAKA[c][0]);
      st+='<tr><td><b>'+NAME[c]+'</b><span class="ta">'+TA[c]+'</span></td><td>'+NAME[sl]+'</td><td>'+a.join(', ')+'</td><td>'+(b.join(', ')||'—')+'</td><td>'+cc.join(', ')+'</td><td>'+(dd.join(', ')||'—')+'</td><td><b>'+all.join(', ')+'</b></td><td style="white-space:normal;min-width:200px">'+BP_KARAKA[c][0]+'<span class="ta">'+BP_KARAKA[c][1]+'</span></td></tr>';});
    st+='</tbody></table></div>'; T.push('');
    h+='<div class="lf-sec"><h3>House links and signification of every planet (KP)<span class="ta">ஒவ்வொரு கிரகத்தின் பாவத் தொடர்பும் குறிப்பும்</span></h3>'+st+'<p class="lf-note">Counted from the KP cusps: the house the planet\'s star lord occupies and owns, and the house the planet occupies and owns. Rahu and Ketu own no house here.</p></div>';
    // house significators
    let hh='<div class="tscroll"><table class="ctab bpd"><thead><tr><th>House</th><th>Signification</th><th>House lord</th><th>A: planets in star of occupants</th><th>B: occupants</th><th>C: planets in star of house lord</th><th>D: house lord</th><th>Significators in order</th></tr></thead><tbody>';
    T.push('HOUSE SIGNIFICATORS (A star of occupants, B occupants, C star of house lord, D house lord)');
    for(let n=1;n<=12;n++){
      const lord=hs[n-1].g.lord, occ=CODES.filter(c=>bh(P[c])===n), Aa=CODES.filter(c=>occ.indexOf(starL(c))>=0), Cc=CODES.filter(c=>starL(c)===lord);
      const order=[...new Set(Aa.concat(occ,Cc,[lord]))], nn=l=>l.map(c=>NAME[c]).join(', ')||'—';
      T.push('  House '+n+' ('+BP_HOUSE[n-1][0]+') | lord '+NAME[lord]+' | A: '+nn(Aa)+' | B: '+nn(occ)+' | C: '+nn(Cc)+' | D: '+NAME[lord]+' | order: '+nn(order));
      hh+='<tr><td class="hn">'+n+'</td><td style="white-space:normal;min-width:190px">'+BP_HOUSE[n-1][0]+'<span class="ta">'+BP_HOUSE[n-1][1]+'</span></td><td>'+NAME[lord]+'</td><td>'+nn(Aa)+'</td><td>'+nn(occ)+'</td><td>'+nn(Cc)+'</td><td>'+NAME[lord]+'</td><td><b>'+nn(order)+'</b></td></tr>';
    }
    hh+='</tbody></table></div>'; T.push('');
    h+='<div class="lf-sec"><h3>Signification and significators of every house (KP)<span class="ta">ஒவ்வொரு பாவத்தின் குறிப்பும் காரகர்களும்</span></h3>'+hh+'<p class="lf-note">KP strength order: A is the strongest, then B, C and D. The house lord is the lord of the cusp sign.</p></div>';
    // dasha
    const D=bpDasha(moonL,ms), now=Date.now(), cur=D.list.find(x=>now>=x.s&&now<x.e);
    T.push('VIMSHOTTARI DASHA (as per '+(kind==='kp'?'KP':'Lahiri')+' ayanamsa)','  Moon nakshatra: '+NAKS[mn]+' (lord '+NAME[D.lord]+')','  Balance of '+NAME[D.lord]+' dasha at birth: '+D.balance.toFixed(2)+' years ('+bpYMD(D.balance)+')');
    let dh='<p>Moon is in <b>'+NAKS[mn]+'</b>, ruled by <b>'+NAME[D.lord]+'</b>. Dasha balance at birth: <b>'+NAME[D.lord]+' '+bpYMD(D.balance)+'</b> ('+D.balance.toFixed(2)+' years).</p>';
    if(cur){const ca=cur.ant.find(x=>now>=x.s&&now<x.e), cp=ca.pr.find(x=>now>=x.s&&now<x.e);
      T.push('  Running now: '+NAME[cur.c]+' dasha > '+NAME[ca.c]+' bhukti (until '+bpFmtDate(ca.e,off)+') > '+NAME[cp.c]+' antara (until '+bpFmtDate(cp.e,off)+')','');
      dh+=lfItem('good','<b>Running now:</b> '+NAME[cur.c]+' dasha (until '+bpFmtDate(cur.e,off)+') → '+NAME[ca.c]+' bhukti (until '+bpFmtDate(ca.e,off)+') → '+NAME[cp.c]+' antara (until '+bpFmtDate(cp.e,off)+')','<b>இப்போது நடப்பது:</b> '+TA[cur.c]+' தசை ('+bpFmtDate(cur.e,off)+' வரை) → '+TA[ca.c]+' புக்தி ('+bpFmtDate(ca.e,off)+' வரை) → '+TA[cp.c]+' அந்தரம் ('+bpFmtDate(cp.e,off)+' வரை)');}
    else T.push('');
    T.push('  DASHA, BHUKTI AND ANTARA PERIODS');
    D.list.forEach(mm=>{
      const isNow=cur===mm;
      T.push('  '+NAME[mm.c].toUpperCase()+' dasha: '+(mm.s<ms?'birth':bpFmtDate(mm.s,off))+' to '+bpFmtDate(mm.e,off)+' ('+BP_YRS[mm.c]+' years)');
      dh+='<details class="lf-det"'+(isNow?' open':'')+'><summary><b>'+NAME[mm.c]+'</b> ('+TA[mm.c]+') dasha · '+(mm.s<ms?'birth':bpFmtDate(mm.s,off))+' to '+bpFmtDate(mm.e,off)+' · '+BP_YRS[mm.c]+' years'+(isNow?' · running':'')+'</summary>';
      mm.ant.filter(a=>a.e>ms).forEach(a=>{
        const aNow=now>=a.s&&now<a.e;
        T.push('    '+NAME[mm.c]+'-'+NAME[a.c]+' bhukti: '+(a.s<ms?'birth':bpFmtDate(a.s,off))+' to '+bpFmtDate(a.e,off));
        dh+='<details class="lf-det" style="margin-left:10px"'+(aNow?' open':'')+'><summary>'+NAME[a.c]+' bhukti ('+TA[a.c]+') · '+(a.s<ms?'birth':bpFmtDate(a.s,off))+' to '+bpFmtDate(a.e,off)+(aNow?' · running':'')+'</summary>'+
          '<div class="bpant">'+a.pr.filter(q=>q.e>ms).map(q=>{T.push('      '+NAME[mm.c]+'-'+NAME[a.c]+'-'+NAME[q.c]+' antara: '+(q.s<ms?'birth':bpFmtDate(q.s,off))+' to '+bpFmtDate(q.e,off));
            return '<span'+(now>=q.s&&now<q.e?' class="bpnow"':'')+'><b>'+NAME[q.c]+'</b> '+(q.s<ms?'birth':bpFmtDate(q.s,off))+' – '+bpFmtDate(q.e,off)+'</span>';}).join('')+'</div></details>';
      });
      dh+='</details>';
    });
    h+='<div class="lf-sec"><h3>Vimshottari dasha, bhukti and antara<span class="ta">விம்சோத்தரி தசா, புக்தி, அந்தரம்</span></h3>'+dh+'<p class="lf-note">Years are counted as 365.25 days. Dates are in the local time of the birth place. The ayanamsa chosen above fixes the Moon\'s position and so the dasha.</p></div>';
    T.push('','Prepared with GuruAgasthiya by Captain S. Ghaneshakumar Manthradhi');
    h+='<div class="btns bpact"><button type="button" class="bpcopy">Copy all data · நகலெடு</button><button type="button" class="bpprint">Print / save as PDF · அச்சிடு</button><button type="button" class="bpsave">Save / share file · சேமி / பகிர்</button></div>';
    out.innerHTML=h;
    BP={name:nm,text:T.join('\n'),pngs:null};
    const me=BP; me.ready=Promise.all(Array.prototype.map.call(out.querySelectorAll('svg.ch'),bpSvgPng)).then(a=>{me.pngs=a;return a;}).catch(()=>null);
  }finally{CFG=old;}
}
const bpEmbedded=()=>{try{return window.self!==window.top&&!(window.GuruApp);}catch(e){return true;}};
function bpMsg(t,bad){const el=$('bpOff');el.textContent=t;el.className='msg'+(bad?' err':'');}
// shows the whole text in a box the person can select and copy by hand when automatic copying is blocked
function bpShowText(why){
  let box=$('bpTextBox'); if(!box){box=document.createElement('div');box.id='bpTextBox';box.className='lf-sec';$('bpOut').parentNode.insertBefore(box,$('bpOut'));}
  box.innerHTML=''; const p=document.createElement('p'); p.className='msg err'; p.textContent=why+' The full text is below: tap inside, choose Select all, then Copy.'; box.appendChild(p);
  const ta=document.createElement('textarea'); ta.readOnly=true; ta.rows=12; ta.style.cssText='width:100%;font:12px/1.4 monospace;box-sizing:border-box'; ta.value=BP.text; box.appendChild(ta);
  const c=document.createElement('button'); c.type='button'; c.textContent='Close'; c.addEventListener('click',()=>{box.remove();}); box.appendChild(c);
  box.scrollIntoView({block:'center'}); try{ta.focus();ta.select();}catch(e){}
}
async function bpCopy(){
  if(!BP)return;
  const done=m=>bpMsg(m||'All birth chart data copied: plain text with drawn charts for Notepad, and tables with chart pictures for Word.');
  try{await Promise.race([BP.ready,new Promise(r=>setTimeout(r,2500))]);}catch(e){}
  let html=''; try{html=bpRichHtml();}catch(e){}
  if(window.GuruApp&&GuruApp.copyHtml&&html){try{GuruApp.copyHtml(BP.text,html);done('All birth chart data copied. Paste into a document or a notes app; charts are drawn in text.');return;}catch(e){}}
  if(window.GuruApp&&GuruApp.copyText){try{GuruApp.copyText(BP.text);done('All birth chart data copied (text with drawn charts).');return;}catch(e){}}
  try{
    if(html&&navigator.clipboard&&navigator.clipboard.write&&window.ClipboardItem){
      await navigator.clipboard.write([new ClipboardItem({'text/plain':new Blob([BP.text],{type:'text/plain'}),'text/html':new Blob([html],{type:'text/html'})})]); done(); return;
    }
  }catch(e){}
  const old=()=>{try{const ta=document.createElement('textarea');ta.value=BP.text;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px;opacity:0';document.body.appendChild(ta);ta.focus();ta.select();ta.setSelectionRange(0,ta.value.length);const ok=document.execCommand('copy');document.body.removeChild(ta);if(ok)done('All birth chart data copied as text with drawn charts. Use a monospace font such as Courier New or Consolas in Word to keep the charts aligned.');else bpShowText('Automatic copying is blocked here.');}catch(e){bpShowText('Automatic copying is blocked here.');}};
  try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(BP.text).then(()=>done('All birth chart data copied as text with drawn charts. Use a monospace font such as Courier New or Consolas in Word to keep the charts aligned.'),old);}else old();}catch(e){old();}
}
function bpReportBody(usePics){
  const tmp=document.createElement('div'); tmp.innerHTML=$('bpOut').innerHTML;
  if(usePics&&BP.pngs){tmp.querySelectorAll('svg.ch').forEach((sv,i)=>{if(BP.pngs[i]){const im=document.createElement('img');im.src=BP.pngs[i];im.width=340;im.alt='Chart';sv.parentNode.replaceChild(im,sv);}});}
  tmp.querySelectorAll('.bpact').forEach(x=>x.remove()); tmp.querySelectorAll('details').forEach(x=>x.setAttribute('open',''));
  return '<h1 style="font-size:20px">GuruAgasthiya · Birth chart · பிறப்பு ஜாதகம்</h1>'+tmp.innerHTML+'<p class="note">Prepared with GuruAgasthiya by Captain S. Ghaneshakumar Manthradhi.</p>';
}
const BP_PRINT_CSS='#bpPrintRoot::before,.wrap::before{content:\'GuruAgasthiya\';position:fixed;top:42%;left:0;right:0;text-align:center;font:800 96px Arial,sans-serif;letter-spacing:.05em;color:rgba(0,0,0,.055);transform:rotate(-32deg);pointer-events:none;z-index:0}@page{margin:11mm}html,body{height:auto!important;overflow:visible!important}.tscroll{overflow:visible!important;border:0!important}.bpd td,.bpd th{white-space:normal!important}.ctab{min-width:0!important}tr{page-break-inside:avoid}.bpc{display:block!important}.bpc>div{display:inline-block;width:48%;vertical-align:top;page-break-inside:avoid}details>summary{font-weight:700;margin-top:6px}';
function bpReportDoc(usePics){
  const css=Array.prototype.map.call(document.getElementsByTagName('style'),x=>x.textContent).filter(x=>x.indexOf('bpPrintRoot')<0).join('\n');
  return '<!doctype html><html data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+bpEsc(BP.name)+' - GuruAgasthiya birth chart</title><style>'+css+'\nhtml,body{background:#fff!important;color:#111!important}.wrap{max-width:none;padding:0}'+BP_PRINT_CSS+'</style></head><body><div class="wrap">'+bpReportBody(usePics)+'</div></body></html>';
}
function bpRichHtml(){
  const tmp=document.createElement('div'); tmp.innerHTML=bpReportBody(true);
  tmp.querySelectorAll('table').forEach(t=>{t.setAttribute('border','1');t.setAttribute('cellspacing','0');t.setAttribute('cellpadding','3');});
  tmp.querySelectorAll('.bpc').forEach(x=>x.removeAttribute('class'));
  return '<html><head><meta charset="utf-8"><style>body{font-family:Calibri,Arial,sans-serif;font-size:10.5pt}table{border-collapse:collapse}td,th{border:1px solid #777;padding:2px 5px;font-size:9.5pt;vertical-align:top}h3{margin:12px 0 4px}</style></head><body>'+tmp.innerHTML+'</body></html>';
}
function bpPrint(){
  if(!BP)return;
  if(window.GuruApp&&GuruApp.printHtml){try{GuruApp.printHtml(bpReportDoc());bpMsg('Opening the print dialog. Choose "Save as PDF" to keep a PDF.');return;}catch(e){}}
  // desktop and browsers: print the report from this page, hiding everything else
  const root=document.createElement('div'); root.id='bpPrintRoot'; root.innerHTML=bpReportBody();
  const st=document.createElement('style'); st.id='bpPrintStyle';
  st.textContent='#bpPrintRoot{display:none}@media print{body>*:not(#bpPrintRoot){display:none!important}#bpPrintRoot{display:block!important;background:#fff;color:#111}html,body{background:#fff!important}'+BP_PRINT_CSS+'}';
  const theme=document.documentElement.getAttribute('data-theme'); document.documentElement.setAttribute('data-theme','light');
  document.head.appendChild(st); document.body.appendChild(root);
  let cleaned=false; const clean=()=>{if(cleaned)return;cleaned=true;try{root.remove();st.remove();}catch(e){} if(theme===null)document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme',theme);};
  window.addEventListener('afterprint',clean,{once:true}); setTimeout(clean,120000);
  try{window.print();bpMsg(bpEmbedded()?'This preview window usually blocks printing. If nothing opened, use Copy all data here, or open the Android app, the Windows app or the page in a full browser tab to print or save as PDF.':'If no print window opened, use Save / share file or Copy all data.',bpEmbedded());}
  catch(e){clean();bpMsg('Printing is blocked in this window. Use Save / share file or Copy all data.',true);}
}
function bpSaveFile(){
  if(!BP)return;
  if(window.GuruApp&&GuruApp.shareText){try{GuruApp.shareText(BP.name+' - birth chart',BP.text);return;}catch(e){}}
  if(bpEmbedded()){bpShowText('This preview window does not allow saving files.');return;}
  try{
    const blob=new Blob([bpReportDoc(true)],{type:'text/html;charset=utf-8'}), url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url; a.download=(BP.name.replace(/[^\w\- ]+/g,'').trim()||'birth-chart').replace(/\s+/g,'_')+'_birth_chart.html'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
    bpMsg('The report was saved as an HTML file in your downloads. Open it and print it to PDF whenever you like.');
  }catch(e){bpShowText('Saving a file is blocked here.');}
}
// ---- saved charts
function bpStore(){try{return JSON.parse(localStorage.getItem('gaBirthList')||'[]');}catch(e){return [];}}
function bpPut(l){try{localStorage.setItem('gaBirthList',JSON.stringify(l.slice(0,60)));}catch(e){}}
function bpSavedUI(){
  const box=$('bpSaved'); box.innerHTML=''; const l=bpStore(); if(!l.length)return;
  const hd=document.createElement('p'); hd.className='legend'; hd.textContent='Saved charts · சேமித்தவை'; box.appendChild(hd);
  l.forEach((r,i)=>{const row=document.createElement('div'); row.className='bpsv';
    const sp=document.createElement('span'); sp.textContent=(r.name||'Unnamed')+' · '+r.date+' '+r.time+' · '+(r.place||''); row.appendChild(sp);
    const a=document.createElement('button'); a.type='button'; a.textContent='Open'; a.addEventListener('click',()=>{bpLoadRec(r);BP_NAME='';bpCalc();}); row.appendChild(a);
    const d=document.createElement('button'); d.type='button'; d.textContent='Delete'; d.addEventListener('click',()=>{const x=bpStore();x.splice(i,1);bpPut(x);bpSavedUI();}); row.appendChild(d);
    box.appendChild(row);});
}
function bpLoadRec(r){
  $('bpName').value=r.name||''; bpSetDate(r.date); bpSetTime(r.time); $('bpLat').value=r.lat; $('bpLon').value=r.lon; $('bpTz').value=r.tz; $('bpAyan').value=r.ayan||'kp';
  BP_PLACE_NAME=r.place||''; bpOffMsg();
}
// ---- place widget: country, state, city
const STBY={}; (function(){for(const cc in WCBY){const set=new Set(); WCBY[cc].forEach(x=>{set.add(x.st||'');}); STBY[cc]=[...set].sort((a,b)=>a.localeCompare(b));}})();
function bpFillStates(sel){
  const cn=$('bpCountry').value, el=$('bpState');
  if(cn==='*a'){el.innerHTML='<option value="*s">All states</option>';return;}
  const l=STBY[cn]||[];
  el.innerHTML='<option value="*s">All states ('+l.filter(Boolean).length+')</option>'+l.map(n=>'<option value="'+bpEsc(n)+'">'+bpEsc(n||'(state not listed)')+'</option>').join('');
  if(sel!==undefined)el.value=sel;
}
function bpFill(keep){
  const q=$('bpSearch').value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''), cn=$('bpCountry').value, stv=$('bpState').value, all=cn==='*a';
  let src=all?WC:(WCBY[cn]||[]); if(!all&&stv!=='*s')src=src.filter(x=>(x.st||'')===stv);
  const cap=all?300:700; let list=[];
  if(!q)list=src.slice(0,cap);
  else{const a=[],b=[]; for(let i=0;i<src.length&&a.length<cap;i++){const k=plKey(src[i]),at=k.indexOf(q); if(at===0)a.push(src[i]); else if(at>0&&b.length<cap)b.push(src[i]);} list=a.concat(b).slice(0,cap);}
  if(!list.length)list=webC(q,()=>bpFill()); BP_LIST2=list; const sel=$('bpCity');
  sel.innerHTML=list.length?list.map((x,i)=>'<option value="'+i+'">'+bpEsc(x.n)+((all||stv==='*s')&&x.st?', '+bpEsc(x.st):'')+(all?', '+bpEsc(x.cc):'')+'</option>').join(''):'<option value="">No match in the offline list. Online search is tried automatically when you are connected</option>';
  if(keep!==undefined){const k=list.indexOf(keep); if(k>=0)sel.value=k;}
  if(list.length)bpPick();
}
function bpPick(){const x=BP_LIST2[parseInt($('bpCity').value,10)]; if(x){$('bpLat').value=x.lat;$('bpLon').value=x.lon;$('bpTz').value=x.tz;BP_PLACE_NAME=x.n+(x.st?', '+x.st:'')+', '+x.cc;bpOffMsg();}}
function bpOffMsg(){
  const el=$('bpOff'); el.className='msg'; const tz=$('bpTz').value.trim(), ds=bpDateStr();
  if(!tz){el.textContent='';return;}
  try{
    if(!ds){el.textContent='Place: '+(BP_PLACE_NAME||'entered coordinates')+' · time zone '+tz+'. Choose a valid date to see the UTC offset used.';return;}
    const [y,m,d]=ds.split('-').map(Number), tp=bpTimeStr().split(':').map(Number), r=localToUtc(y,m,d,tp[0]||0,tp[1]||0,tz);
    el.textContent='Place: '+(BP_PLACE_NAME||'entered coordinates')+' · UTC offset at birth: '+utcTxt(r.off)+(/^-?[\d.]+$/.test(tz)?'':' ('+tz+')');
  }catch(e){el.textContent='The time zone was not recognised. Use a name such as Asia/Kolkata or hours such as 5.5.';el.className='msg err';}
}
function bpUseLoc(){
  const el=$('bpOff'); el.className='msg';
  if(!navigator.geolocation){el.textContent='Location is not available here. Choose a place or enter coordinates.';el.className='msg err';return;}
  el.textContent='Finding your location…';
  navigator.geolocation.getCurrentPosition(pos=>{
    const la=pos.coords.latitude,lo=pos.coords.longitude,n=plNearest(la,lo);
    $('bpLat').value=la.toFixed(4); $('bpLon').value=lo.toFixed(4);
    let z=''; try{z=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(e){}
    $('bpTz').value=(n.x&&n.d<2.5)?n.x.tz:(z||String(-new Date().getTimezoneOffset()/60));
    BP_PLACE_NAME='My location'+(n.x&&n.d<2.5?' (near '+n.x.n+', '+n.x.cc+')':''); bpOffMsg();
  },e=>{el.textContent=(e&&e.code===1)?'Location permission was denied or blocked. Choose a place or enter coordinates.':'Could not get your location. Choose a place or enter coordinates.';el.className='msg err';},{enableHighAccuracy:false,timeout:15000,maximumAge:60000});
}
(function initBp(){
  const opt=(a,lab)=>a.map((v,i)=>'<option value="'+v+'">'+lab(v,i)+'</option>').join('');
  const range=(a,b,st)=>{const r=[];if(st>0){for(let i=a;i<=b;i+=st)r.push(i);}else{for(let i=a;i>=b;i+=st)r.push(i);}return r;};
  $('bpDay').innerHTML=opt(range(1,31,1),v=>v);
  $('bpMonth').innerHTML=opt(range(1,12,1),v=>MONTHS[v-1]);
  $('bpYear').innerHTML=opt(range(2100,1800,-1),v=>v);
  $('bpHour').innerHTML=opt(range(1,12,1),v=>v);
  $('bpMin').innerHTML=opt(range(0,59,1),v=>p2(v)); $('bpSec').innerHTML=opt(range(0,59,1),v=>p2(v));
  const cs=$('bpCountry'); cs.innerHTML='<option value="*a">All countries (use search)</option>'+CITY.cc.map(n=>'<option value="'+n.replace(/"/g,'&quot;')+'">'+n+'</option>').join('');
  $('bpTzSel').innerHTML='<option value="">Custom / from place</option>'+UTCS.map(o=>'<option value="'+o+'">'+utcLbl(o)+'</option>').join('');
  cs.addEventListener('change',()=>{bpFillStates();bpFill();}); $('bpState').addEventListener('change',()=>bpFill()); $('bpSearch').addEventListener('input',()=>bpFill()); $('bpCity').addEventListener('change',bpPick);
  $('bpTzSel').addEventListener('change',()=>{if($('bpTzSel').value!==''){$('bpTz').value=$('bpTzSel').value;bpOffMsg();}});
  ['bpDay','bpMonth','bpYear','bpHour','bpMin','bpSec','bpAmpm'].forEach(id=>$(id).addEventListener('change',bpOffMsg));
  $('bpTz').addEventListener('input',bpOffMsg);
  ['bpLat','bpLon'].forEach(id=>$(id).addEventListener('input',()=>{BP_PLACE_NAME='entered coordinates';bpOffMsg();}));
  $('bpGo').addEventListener('click',()=>{BP_NAME='';bpCalc();});
  ['bpAyan'].forEach(id=>$(id).addEventListener('change',()=>{if(BP)bpCalc();}));
  $('bpLoc').addEventListener('click',bpUseLoc);
  $('bpSave').addEventListener('click',()=>{
    const lat=$('bpLat').value,lon=$('bpLon').value,tz=$('bpTz').value.trim(),date=bpDateStr(), el=$('bpOff');
    if(!date||!lat||!lon||!tz){el.textContent='Fill a valid date, time and place before saving.';el.className='msg err';return;}
    const l=bpStore(); l.unshift({name:$('bpName').value.trim(),date:date,time:bpTimeStr(),lat:lat,lon:lon,tz:tz,ayan:$('bpAyan').value,place:BP_PLACE_NAME});
    bpPut(l); bpSavedUI(); el.textContent='Saved.'; el.className='msg';
  });
  $('bpClose').addEventListener('click',()=>$('bpPanel').classList.add('hide'));
  $('bpOut').addEventListener('click',e=>{const t=e.target; if(t&&t.classList){if(t.classList.contains('bpcopy'))bpCopy(); else if(t.classList.contains('bpprint'))bpPrint(); else if(t.classList.contains('bpsave'))bpSaveFile();}});
  $('bpBtn').addEventListener('click',()=>{
    const pn=$('bpPanel'); pn.classList.remove('hide');
    if(!$('bpLat').value){
      const x=PL_LIST[parseInt($('place').value,10)];
      if(x){$('bpCountry').value=x.cc; bpFillStates(x.st||''); bpFill(x);}
      else{bpFillStates(); bpFill(); $('bpLat').value=$('lat').value; $('bpLon').value=$('lon').value; $('bpTz').value=PL_TZ||$('tz').value; BP_PLACE_NAME=PL_NAME||'';}
      const nowMs=Date.now(); let off=parseFloat($('tz').value||0); try{if(PL_TZ)off=offsetAt(nowMs,PL_TZ);}catch(e){}
      const ld=new Date(nowMs+off*3600000); bpSetDate(ld.toISOString().slice(0,10)); bpSetTime(p2(ld.getUTCHours())+':'+p2(ld.getUTCMinutes())+':00');
      bpOffMsg();
    }
    bpSavedUI(); pn.scrollIntoView({block:'start'});
  });
})();

// ---- v3.9
// ===================== Astrocartography / jyotish relocation map (v3.9) =====================
const ACG_COL={Su:'#e8790c',Mo:'#5f8fb0',Ma:'#d32f2f',Me:'#2e9e4f',Ju:'#b89500',Ve:'#d6489b',Sa:'#3b4cc0',Ra:'#8d5a3b',Ke:'#8e44ad'};
const ACG_ANG=['ASC','DSC','MC','IC'];
const ACG_CAT=[
 {id:'child',col:'#1b9e4b',a:'L1',b:'L5',en:'Children, intelligence and merit',ta:'புத்திர பாக்கியம், புத்தி, புண்ணியம்',t:'Ascendant wave × 5th lord wave',tt:'லக்ன அலை × 5ஆம் அதிபதி அலை',good:1},
 {id:'land1',col:'#0f8f8a',a:'L1',b:'L4',en:'Land, home and happiness',ta:'நிலம், வீடு, மகிழ்ச்சி',t:'Ascendant wave × 4th lord wave',tt:'லக்ன அலை × 4ஆம் அதிபதி அலை',good:1},
 {id:'land2',col:'#2f7fd1',a:'Mo',b:'L4',en:'Land, home and happiness',ta:'நிலம், வீடு, மகிழ்ச்சி',t:'Moon wave × 4th lord wave',tt:'சந்திரன் அலை × 4ஆம் அதிபதி அலை',good:1},
 {id:'bad8',col:'#c62828',a:'L1',b:'L8',en:'Not suitable: sudden troubles, obstacles, danger to health',ta:'ஏற்றதல்ல: திடீர் துன்பம், தடை, உடல்நல அபாயம்',t:'Ascendant wave × 8th lord wave',tt:'லக்ன அலை × 8ஆம் அதிபதி அலை',good:0},
 {id:'bad612',col:'#ad1457',a:'L6',b:'L12',en:'Not suitable: debts, disease, enemies and losses',ta:'ஏற்றதல்ல: கடன், நோய், எதிரி, விரயம்',t:'6th lord wave × 12th lord wave',tt:'6ஆம் அதிபதி அலை × 12ஆம் அதிபதி அலை',good:0}
];
let ACG=null, ACG_LAND=null, ACG_GRID=null;
const acNorm=x=>{x=((x+180)%360+360)%360-180;return x;};
function acgEq(c,ms){
  const t=Astronomy.MakeTime(new Date(ms)), D=Math.PI/180;
  if(c==='Ra'||c==='Ke'){
    const jd=ms/86400000+2440587.5, T=(jd-2451545)/36525; let om=125.04452-1934.136261*T; if(c==='Ke')om+=180;
    const l=om*D, e=(23.43929-0.0130042*T)*D;
    return {ra:mod(Math.atan2(Math.sin(l)*Math.cos(e),Math.cos(l))/D,360),dec:Math.asin(Math.sin(e)*Math.sin(l))/D};
  }
  const v=Astronomy.RotateVector(Astronomy.Rotation_EQJ_EQD(t),Astronomy.GeoVector(BODY[c],t,true)), r=Math.hypot(v.x,v.y,v.z);
  return {ra:mod(Math.atan2(v.y,v.x)/D,360),dec:Math.asin(v.z/r)/D};
}
function acgLines(ms){
  const gst=Astronomy.SiderealTime(Astronomy.MakeTime(new Date(ms)))*15, D=Math.PI/180, L={};
  CODES.forEach(c=>{
    const q=acgEq(c,ms), mc=acNorm(q.ra-gst), ic=acNorm(mc+180), asc=[], dsc=[]; let ra=[],rd=[],pa=null,pd=null;
    for(let lat=-80;lat<=80.001;lat+=0.5){
      const x=-Math.tan(lat*D)*Math.tan(q.dec*D);
      if(Math.abs(x)>=1){if(ra.length>1)asc.push(ra);if(rd.length>1)dsc.push(rd);ra=[];rd=[];pa=pd=null;continue;}
      const H=Math.acos(x)/D, la=acNorm(q.ra-H-gst), ld=acNorm(q.ra+H-gst);
      if(pa!==null&&Math.abs(la-pa)>180){if(ra.length>1)asc.push(ra);ra=[];}
      if(pd!==null&&Math.abs(ld-pd)>180){if(rd.length>1)dsc.push(rd);rd=[];}
      ra.push([la,lat]);rd.push([ld,lat]);pa=la;pd=ld;
    }
    if(ra.length>1)asc.push(ra);if(rd.length>1)dsc.push(rd);
    L[c]={ra:q.ra,dec:q.dec,ASC:asc,DSC:dsc,MC:[[[mc,-80],[mc,80]]],IC:[[[ic,-80],[ic,80]]],mc:mc,ic:ic};
  });
  return L;
}
function acgCross(A,B){
  const out=[];
  A.forEach(ra=>B.forEach(rb=>{
    for(let i=0;i<ra.length-1;i++){
      const p=ra[i],q=ra[i+1], x1=Math.min(p[0],q[0]),x2=Math.max(p[0],q[0]),y1=Math.min(p[1],q[1]),y2=Math.max(p[1],q[1]);
      for(let j=0;j<rb.length-1;j++){
        const r=rb[j],s=rb[j+1];
        if(Math.max(r[0],s[0])<x1||Math.min(r[0],s[0])>x2||Math.max(r[1],s[1])<y1||Math.min(r[1],s[1])>y2)continue;
        const d1x=q[0]-p[0],d1y=q[1]-p[1],d2x=s[0]-r[0],d2y=s[1]-r[1], den=d1x*d2y-d1y*d2x; if(Math.abs(den)<1e-12)continue;
        const t=((r[0]-p[0])*d2y-(r[1]-p[1])*d2x)/den, u=((r[0]-p[0])*d1y-(r[1]-p[1])*d1x)/den;
        if(t>=0&&t<=1&&u>=0&&u<=1)out.push([p[0]+t*d1x,p[1]+t*d1y]);
      }
    }
  }));
  return out;
}
function acgGrid(){
  if(ACG_GRID)return ACG_GRID; const g=new Map();
  for(let i=0;i<WC.length;i++){const w=WC[i], k=Math.floor(w.lat)*1000+Math.floor(w.lon); let a=g.get(k); if(!a){a=[];g.set(k,a);} a.push(i);}
  return ACG_GRID=g;
}
function acgKm(la1,lo1,la2,lo2){const D=Math.PI/180,a=Math.sin((la2-la1)*D/2)**2+Math.cos(la1*D)*Math.cos(la2*D)*Math.sin((lo2-lo1)*D/2)**2;return 12742*Math.asin(Math.min(1,Math.sqrt(a)));}
function acgNear(lon,lat,R,cb){
  const g=acgGrid(), dl=Math.ceil(R/111)+1, dn=Math.min(180,Math.ceil(R/(111*Math.max(0.2,Math.cos(lat*Math.PI/180))))+1);
  for(let a=Math.floor(lat)-dl;a<=Math.floor(lat)+dl;a++){ if(a<-90||a>90)continue;
    for(let b=Math.floor(lon)-dn;b<=Math.floor(lon)+dn;b++){ const bb=((b+180)%360+360)%360-180, arr=g.get(a*1000+bb); if(!arr)continue;
      for(const i of arr){const w=WC[i], d=acgKm(lat,lon,w.lat,w.lon); if(d<=R)cb(i,d);} } }
}
function acgCityName(i){const w=WC[i];return w.n+(w.st?', '+w.st:'')+', '+w.cc;}
function acgLineLabel(c,a){return NAME[c]+' '+a;}
function acgZone(c,R,angs){
  const L=ACG.L[c], seen=new Map();
  angs.forEach(a=>{
    L[a].forEach(run=>{
      const pts=[]; for(let i=0;i<run.length-1;i++){const p=run[i],q=run[i+1],n=Math.max(1,Math.ceil(Math.hypot(q[0]-p[0],q[1]-p[1])/0.25));for(let k=0;k<n;k++)pts.push([p[0]+(q[0]-p[0])*k/n,p[1]+(q[1]-p[1])*k/n]);}
      run.length&&pts.push(run[run.length-1]);
      pts.forEach(pt=>{ if(Math.abs(pt[1])>70)return; acgNear(pt[0],pt[1],R,(i,d)=>{const o=seen.get(i); if(!o||d<o.d)seen.set(i,{i:i,d:d,line:acgLineLabel(c,a)});}); });
    });
  });
  return Array.from(seen.values()).sort((x,y)=>x.i-y.i);
}
function acgCompute(){
  const ds=bpDateStr(), ts=bpTimeStr(), lat=parseFloat($('bpLat').value), lon=parseFloat($('bpLon').value), tzs=$('bpTz').value.trim(), kind=$('bpAyan').value;
  if(!ds)throw new Error('Choose a valid date of birth in the Birth chart form above.');
  if(isNaN(lat)||isNaN(lon)||!tzs)throw new Error('Choose the place of birth in the Birth chart form above.');
  if(typeof Astronomy==='undefined')throw new Error('The astronomy library did not load.');
  const [y,m,d]=ds.split('-').map(Number), tp=ts.split(':').map(Number), r=localToUtc(y,m,d,tp[0]||0,tp[1]||0,tzs), ms=r.ms+(tp[2]||0)*1000;
  const old=CFG; CFG={lat:lat,lon:lon,kind:kind}; let asc;
  try{asc=sidAsc(ms,lat,lon,kind);}finally{CFG=old;}
  const A=Math.floor(asc/30)%12, lord=h=>SIGNS[(A+h-1)%12][1];
  const lords={L1:lord(1),L2:lord(2),L4:lord(4),L5:lord(5),L6:lord(6),L8:lord(8),L12:lord(12),Mo:'Mo'};
  const R=parseInt($('acRad').value,10)||300, Rm=parseInt($('acBand').value,10)||150;
  const angs=ACG_ANG.filter(a=>$('acA'+a).checked); if(!angs.length)throw new Error('Select at least one line type (ASC, DSC, MC or IC).');
  const L=acgLines(ms); ACG={ms:ms,lat:lat,lon:lon,A:A,lords:lords,L:L,R:R,Rm:Rm,angs:angs,name:$('bpName').value.trim(),place:BP_PLACE_NAME||'',date:ds,time:ts,res:[],zones:{},sel:null,view:null};
  ACG_CAT.forEach(cat=>{
    const pa=lords[cat.a], pb=lords[cat.b], res={cat:cat,pa:pa,pb:pb,dots:[],same:pa===pb,zone:null,none:0};
    if(pa===pb){res.zone=acgZone(pa,Rm,angs).slice(0,40);}
    else{
      angs.forEach(a1=>angs.forEach(a2=>{
        acgCross(L[pa][a1],L[pb][a2]).forEach(pt=>{
          if(Math.abs(pt[1])>72)return; let near=null,big=null;
          acgNear(pt[0],pt[1],R,(i,d)=>{if(!near||d<near.d)near={i:i,d:d}; if(!big||i<big.i)big={i:i,d:d};});
          if(!near){res.none++;return;}
          res.dots.push({lon:pt[0],lat:pt[1],near:near,big:big,lines:acgLineLabel(pa,a1)+' × '+acgLineLabel(pb,a2),cat:cat});
        });
      }));
      res.dots.sort((x,y)=>x.near.d-y.near.d);
      const seen=new Set(); res.dots=res.dots.filter(d=>{const k=d.near.i+'|'+d.big.i; if(seen.has(k))return false; seen.add(k); return true;}).slice(0,40);
    }
    ACG.res.push(res);
  });
  ACG.zones.L2=acgZone(lords.L2,Rm,angs).slice(0,40);
  return ACG;
}
// ---- drawing
function acgDecode(t){
  const sc=t.transform.scale, tr=t.transform.translate;
  const arcs=t.arcs.map(a=>{let x=0,y=0;return a.map(p=>{x+=p[0];y+=p[1];return [x*sc[0]+tr[0],y*sc[1]+tr[1]];});});
  const ring=r=>{let out=[];r.forEach(i=>{let a=i<0?arcs[~i].slice().reverse():arcs[i]; if(out.length)a=a.slice(1); out=out.concat(a);});return out;};
  const rings=[], g=t.objects.land; (g.type==='GeometryCollection'?g.geometries:[g]).forEach(o=>{
    if(o.type==='Polygon')o.arcs.forEach(r=>rings.push(ring(r))); else if(o.type==='MultiPolygon')o.arcs.forEach(po=>po.forEach(r=>rings.push(ring(r))));});
  return rings;
}
function acgTheme(){
  const c=getComputedStyle(document.documentElement), hex=(c.getPropertyValue('--surface')||'#fff').trim(), m=/^#([0-9a-f]{6})$/i.exec(hex);
  let lum=1; if(m){const n=parseInt(m[1],16); lum=((n>>16)+((n>>8)&255)+(n&255))/765;}
  return lum>0.5?{sea:'#d9e8f1',land:'#f3eedb',edge:'#a89f86',grid:'rgba(0,0,0,.09)',ink:'#14232f',halo:'#fff'}:{sea:'#0e1d28',land:'#2b4452',edge:'#587585',grid:'rgba(255,255,255,.08)',ink:'#e4edf2',halo:'#0e1d28'};
}
function acgView(cv){
  const W=cv.clientWidth; if(!ACG.view){ACG.view={s:W/360,cx:0,cy:0,fit:true};}
  return ACG.view;
}
function acgXY(v,W,H,lon,lat){return [W/2+(lon-v.cx)*v.s,H/2-(lat-v.cy)*v.s];}
function acgFocus(lon,lat,z){const cv=$('acCv'), v=acgView(cv); v.s=Math.max(v.s,z||cv.clientWidth/360*6); v.cx=lon; v.cy=lat; acgDraw();}
function acgClamp(v,W,H){v.s=Math.max(W/360*0.9,Math.min(W/360*160,v.s)); v.cy=Math.max(-85,Math.min(85,v.cy)); v.cx=Math.max(-180,Math.min(180,v.cx));}
function acgDraw(){
  if(!ACG)return; const cv=$('acCv'), W=cv.clientWidth, H=cv.clientHeight, dpr=window.devicePixelRatio||1;
  if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}
  const x=cv.getContext('2d'); x.setTransform(dpr,0,0,dpr,0,0); const v=acgView(cv), T=acgTheme(); acgClamp(v,W,H);
  x.fillStyle=T.sea; x.fillRect(0,0,W,H);
  if(!ACG_LAND){try{ACG_LAND=acgDecode(window.GA_LAND);}catch(e){ACG_LAND=[];}}
  x.beginPath(); ACG_LAND.forEach(r=>{r.forEach((p,i)=>{const q=acgXY(v,W,H,p[0],p[1]); if(i)x.lineTo(q[0],q[1]); else x.moveTo(q[0],q[1]);}); x.closePath();});
  x.fillStyle=T.land; x.fill('evenodd'); x.strokeStyle=T.edge; x.lineWidth=0.6; x.stroke();
  x.strokeStyle=T.grid; x.lineWidth=1; x.beginPath();
  const step=v.s>40?5:v.s>12?10:30;
  for(let lo=-180;lo<=180;lo+=step){const a=acgXY(v,W,H,lo,85),b=acgXY(v,W,H,lo,-85);x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);}
  for(let la=-80;la<=80;la+=step){const a=acgXY(v,W,H,-180,la),b=acgXY(v,W,H,180,la);x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1]);}
  x.stroke();
  // lines
  const lordSet=new Set([ACG.lords.L1,ACG.lords.L2,ACG.lords.L4,ACG.lords.L5,ACG.lords.L6,ACG.lords.L8,ACG.lords.L12,'Mo']), only=$('acOnly').checked;
  x.font='600 10px '+getComputedStyle(document.body).fontFamily; x.textAlign='center';
  CODES.forEach(c=>{
    if(!$('acP'+c).checked)return; const hi=lordSet.has(c), dim=only&&!hi;
    ACG.angs.forEach(a=>{
      x.strokeStyle=ACG_COL[c]; x.globalAlpha=dim?0.18:1; x.lineWidth=hi?2.6:1.5;
      x.setLineDash(a==='ASC'?[]:a==='DSC'?[7,4]:a==='MC'?[]:[2,4]);
      let lab=null;
      ACG.L[c][a].forEach(run=>{
        x.beginPath(); run.forEach((p,i)=>{const q=acgXY(v,W,H,p[0],p[1]); if(i)x.lineTo(q[0],q[1]); else x.moveTo(q[0],q[1]);}); x.stroke();
        const tl=(a==='MC'||a==='IC')?64-CODES.indexOf(c)*15:20; run.forEach(p=>{if(!lab||Math.abs(p[1]-tl)<Math.abs(lab[1]-tl))lab=p;});
      });
      x.setLineDash([]);
      if(lab&&!dim){const q=acgXY(v,W,H,lab[0],lab[1]); if(q[0]>0&&q[0]<W&&q[1]>0&&q[1]<H){const t=c+' '+a; x.lineWidth=3;x.strokeStyle=T.halo;x.strokeText(t,q[0]+(a==='MC'||a==='IC'?0:14),q[1]-4);x.fillStyle=ACG_COL[c];x.fillText(t,q[0]+(a==='MC'||a==='IC'?0:14),q[1]-4);}}
      x.globalAlpha=1;
    });
  });
  // money zone cities
  x.textAlign='left';
  (ACG.zones.L2||[]).forEach(z=>{const w=WC[z.i], q=acgXY(v,W,H,w.lon,w.lat); if(q[0]<-5||q[0]>W+5||q[1]<-5||q[1]>H+5)return;
    x.fillStyle='#d4a017';x.strokeStyle='#5a4400';x.lineWidth=1;x.beginPath();x.moveTo(q[0],q[1]-5);x.lineTo(q[0]+5,q[1]);x.lineTo(q[0],q[1]+5);x.lineTo(q[0]-5,q[1]);x.closePath();x.fill();x.stroke();
    if(v.s>W/360*8){x.fillStyle=T.ink;x.lineWidth=3;x.strokeStyle=T.halo;x.strokeText(w.n,q[0]+7,q[1]+3);x.fillText(w.n,q[0]+7,q[1]+3);}});
  // dots
  let n=0; ACG.res.forEach(r=>{ if(r.zone){ r.zone.forEach(z=>{const w=WC[z.i], q=acgXY(v,W,H,w.lon,w.lat); if(q[0]<-5||q[0]>W+5||q[1]<-5||q[1]>H+5)return; x.fillStyle=r.cat.col;x.beginPath();x.arc(q[0],q[1],3.5,0,6.3);x.fill();}); return;}
    r.dots.forEach((d,k)=>{ d.n=++n; const q=acgXY(v,W,H,d.lon,d.lat); d.px=q; if(q[0]<-8||q[0]>W+8||q[1]<-8||q[1]>H+8)return;
      const sel=ACG.sel===d; x.fillStyle=r.cat.col; x.strokeStyle=sel?T.ink:'#fff'; x.lineWidth=sel?3:1.8; x.beginPath(); x.arc(q[0],q[1],sel?9:7,0,6.3); x.fill(); x.stroke();
      x.fillStyle='#fff'; x.font='700 8px sans-serif'; x.textAlign='center'; x.fillText(String(k+1),q[0],q[1]+3);
      if(v.s>W/360*8||sel){const w=WC[d.near.i]; x.font='600 11px sans-serif'; x.textAlign='left'; x.lineWidth=3; x.strokeStyle=T.halo; x.strokeText(w.n,q[0]+10,q[1]+4); x.fillStyle=T.ink; x.fillText(w.n,q[0]+10,q[1]+4);} });
  });
  // birth place
  const b=acgXY(v,W,H,ACG.lon,ACG.lat); x.fillStyle=T.ink; x.strokeStyle=T.halo; x.lineWidth=2; x.beginPath(); for(let i=0;i<10;i++){const r=i%2?3.5:8,a=i*Math.PI/5-Math.PI/2;x.lineTo(b[0]+r*Math.cos(a),b[1]+r*Math.sin(a));} x.closePath(); x.stroke(); x.fill();
}
function acgPick(mx,my){
  let best=null,bd=14; ACG.res.forEach(r=>r.dots.forEach(d=>{if(!d.px)return; const dd=Math.hypot(d.px[0]-mx,d.px[1]-my); if(dd<bd){bd=dd;best=d;}})); return best;
}
function acgInfo(d){
  const el=$('acInfo'); if(!d){el.innerHTML='';return;} const a=WC[d.near.i], b=WC[d.big.i];
  el.innerHTML='<b style="color:'+d.cat.col+'">'+d.cat.en+'</b> · '+d.lines+'<br>Point '+d.lat.toFixed(2)+'°, '+d.lon.toFixed(2)+'° · nearest: <b>'+acgCityName(d.near.i)+'</b> ('+Math.round(d.near.d)+' km)'+(d.big.i!==d.near.i?' · largest nearby: <b>'+acgCityName(d.big.i)+'</b> ('+Math.round(d.big.d)+' km)':'');
}
function acgHtml(){
  const P=NAME, S=ACG, lo=S.lords; let h='';
  h+='<p class="legend"><b>Lagna: '+SIGNS[S.A][0]+'.</b> Lords: Ascendant '+P[lo.L1]+', 2nd '+P[lo.L2]+', 4th '+P[lo.L4]+', 5th '+P[lo.L5]+', 6th '+P[lo.L6]+', 8th '+P[lo.L8]+', 12th '+P[lo.L12]+'. The “Ascendant wave” means the lines of the ascendant lord ('+P[lo.L1]+'), the “Moon wave” means the lines of the Moon, and each wave is one of the four lines of that planet (ASC, DSC, MC, IC). A dot is a place where the two waves cross; the nearest city (and the largest city) within '+S.R+' km is named.</p>';
  h+='<p class="legend ta">லக்ன அலை என்பது லக்னாதிபதி ('+P[lo.L1]+') கிரகத்தின் கோடுகள்; சந்திரன் அலை என்பது சந்திரனின் கோடுகள். இரு அலைகள் சந்திக்கும் புள்ளி ஒரு குறி; அதற்கு '+S.R+' கி.மீ.க்குள் உள்ள நகரம் கீழே தரப்பட்டுள்ளது.</p>';
  S.res.forEach((r,ci)=>{
    const c=r.cat;
    h+='<div class="acres" style="border-left:5px solid '+c.col+'"><h3 style="color:'+c.col+'">'+(c.good?'✔ ':'✖ ')+c.en+' <span class="ta">'+c.ta+'</span></h3><div class="acsub">'+c.t+' · '+P[r.pa]+' × '+P[r.pb]+' <span class="ta">'+c.tt+'</span></div>';
    if(r.same){
      h+='<p class="legend">The same planet ('+P[r.pa]+') rules both houses, so its own lines carry both meanings. Cities close to '+P[r.pa]+' lines (within '+S.Rm+' km), larger cities first:</p>'+acgZoneTable(r.zone);
    }else if(!r.dots.length){h+='<p class="legend">No crossing near a city'+(r.none?' ('+r.none+' crossing(s) fall in the sea or far from any city)':'')+' with the line types selected.</p>';}
    else{
      h+='<div class="tblw"><table><thead><tr><th>#</th><th>Nearest city / town</th><th>km</th><th>Largest city nearby</th><th>Waves</th><th>Lat, Lon</th></tr></thead><tbody>';
      r.dots.forEach((d,k)=>{h+='<tr class="acrow" data-c="'+ci+'" data-k="'+k+'"><td><span class="acn" style="background:'+c.col+'">'+(k+1)+'</span></td><td><b>'+acgCityName(d.near.i)+'</b></td><td>'+Math.round(d.near.d)+'</td><td>'+(d.big.i===d.near.i?'same':acgCityName(d.big.i)+' ('+Math.round(d.big.d)+' km)')+'</td><td>'+d.lines+'</td><td>'+d.lat.toFixed(2)+', '+d.lon.toFixed(2)+'</td></tr>';});
      h+='</tbody></table></div>';
    }
    h+='</div>';
  });
  h+='<div class="acres" style="border-left:5px solid #d4a017"><h3 style="color:#9a7400">$ Money: 2nd lord wave (cities near the lines of '+P[lo.L2]+') <span class="ta">செல்வம்: 2ஆம் அதிபதி அலை</span></h3><div class="acsub">'+(lo.L2===lo.L1?'The ascendant lord is also the 2nd lord. ':'')+'Cities within '+S.Rm+' km of the '+P[lo.L2]+' lines (gold diamonds on the map), larger cities first.</div>'+acgZoneTable(S.zones.L2)+'</div>';
  return h;
}
function acgZoneTable(z){
  if(!z||!z.length)return '<p class="legend">No city found near these lines.</p>';
  let h='<div class="tblw"><table><thead><tr><th>City / town</th><th>km from line</th><th>Line</th></tr></thead><tbody>';
  z.forEach(o=>{const w=WC[o.i];h+='<tr class="acrow" data-lon="'+w.lon+'" data-lat="'+w.lat+'"><td><b>'+acgCityName(o.i)+'</b></td><td>'+Math.round(o.d)+'</td><td>'+o.line+'</td></tr>';});
  return h+'</tbody></table></div>';
}
function acgText(){
  const P=NAME, S=ACG, lo=S.lords, T=[];
  T.push('ASTROCARTOGRAPHY (JYOTISH RELOCATION) - '+(S.name||'Native')+' - '+S.date+' '+S.time+' '+S.place);
  T.push('Lagna: '+SIGNS[S.A][0]+' | Ascendant lord '+P[lo.L1]+', 2nd '+P[lo.L2]+', 4th '+P[lo.L4]+', 5th '+P[lo.L5]+', 6th '+P[lo.L6]+', 8th '+P[lo.L8]+', 12th '+P[lo.L12]);
  T.push('Search radius '+S.R+' km | lines: '+S.angs.join(', ')); T.push('');
  S.res.forEach(r=>{T.push((r.cat.good?'[GOOD] ':'[NOT SUITABLE] ')+r.cat.en+' - '+r.cat.t+' ('+P[r.pa]+' x '+P[r.pb]+')');
    if(r.same){T.push('  Same planet; cities near its lines:'); r.zone.slice(0,25).forEach(o=>T.push('  - '+acgCityName(o.i)+' ('+Math.round(o.d)+' km, '+o.line+')'));}
    else if(!r.dots.length)T.push('  none near a city');
    else r.dots.forEach((d,k)=>T.push('  '+(k+1)+'. '+acgCityName(d.near.i)+' ('+Math.round(d.near.d)+' km)'+(d.big.i!==d.near.i?' / largest nearby: '+acgCityName(d.big.i):'')+' | '+d.lines+' | '+d.lat.toFixed(2)+', '+d.lon.toFixed(2)));
    T.push('');});
  T.push('[MONEY] 2nd lord wave ('+P[lo.L2]+') - cities near its lines:'); S.zones.L2.slice(0,30).forEach(o=>T.push('  - '+acgCityName(o.i)+' ('+Math.round(o.d)+' km, '+o.line+')'));
  return T.join('\n');
}
function acgGo(){
  const msg=$('acMsg'); msg.textContent='Calculating…'; msg.className='msg';
  setTimeout(()=>{
    try{
      acgCompute(); $('acBody').classList.remove('hide');
      $('acList').innerHTML=acgHtml(); $('acInfo').innerHTML=''; ACG.view=null; acgDraw();
      msg.textContent='Done. Tap a numbered dot on the map or a row in the lists.'; $('acBody').scrollIntoView({block:'nearest'});
    }catch(e){msg.textContent=e.message||String(e); msg.className='msg err';}
  },30);
}
(function initAcg(){
  const sel=$('acPl'); sel.innerHTML=CODES.map(c=>'<label class="acchk"><input type="checkbox" id="acP'+c+'" checked><span style="color:'+ACG_COL[c]+'">■</span> '+NAME[c]+'</label>').join('');
  $('acAng').innerHTML=ACG_ANG.map(a=>'<label class="acchk"><input type="checkbox" id="acA'+a+'" checked> '+a+'</label>').join('');
  $('acBtn').addEventListener('click',()=>{ $('bpBtn').click(); $('acPanel').classList.remove('hide'); $('acPanel').scrollIntoView({block:'start'}); });
  $('bpAcg').addEventListener('click',()=>{ $('acPanel').classList.remove('hide'); acgGo(); });
  $('acGo').addEventListener('click',acgGo); $('acClose').addEventListener('click',()=>$('acPanel').classList.add('hide'));
  $('acEdit').addEventListener('click',()=>{ $('acPanel').classList.add('hide'); $('bpPanel').classList.remove('hide'); $('bpPanel').scrollIntoView({block:'start'}); });
  ['acOnly'].concat(CODES.map(c=>'acP'+c)).concat(ACG_ANG.map(a=>'acA'+a)).forEach(id=>{ $(id).addEventListener('change',()=>{ if(!ACG)return; if(id.startsWith('acA')){acgGo();} else acgDraw(); }); });
  const cv=$('acCv'); let pts=new Map(), drag=null, pinch=0, moved=0;
  cv.addEventListener('pointerdown',e=>{ if(!ACG)return; cv.setPointerCapture(e.pointerId); pts.set(e.pointerId,[e.offsetX,e.offsetY]); moved=0; const v=acgView(cv); drag={x:e.offsetX,y:e.offsetY,cx:v.cx,cy:v.cy}; if(pts.size===2){const a=Array.from(pts.values()); pinch=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);} });
  cv.addEventListener('pointermove',e=>{ if(!ACG||!pts.has(e.pointerId))return; pts.set(e.pointerId,[e.offsetX,e.offsetY]); const v=acgView(cv);
    if(pts.size===2){const a=Array.from(pts.values()), d=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]); if(pinch){v.s*=d/pinch; acgDraw();} pinch=d; moved=99; return;}
    if(drag){const dx=e.offsetX-drag.x, dy=e.offsetY-drag.y; moved=Math.max(moved,Math.abs(dx)+Math.abs(dy)); v.cx=drag.cx-dx/v.s; v.cy=drag.cy+dy/v.s; acgDraw();} });
  const up=e=>{ if(!ACG)return; pts.delete(e.pointerId); if(pts.size<2)pinch=0; if(pts.size===0&&moved<6){ const d=acgPick(e.offsetX,e.offsetY); ACG.sel=d; acgInfo(d); acgDraw(); } drag=null; };
  cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',e=>{ if(!ACG)return; e.preventDefault(); const v=acgView(cv), W=cv.clientWidth, H=cv.clientHeight, lon=v.cx+(e.offsetX-W/2)/v.s, lat=v.cy-(e.offsetY-H/2)/v.s, f=e.deltaY<0?1.25:0.8; v.s*=f; acgClamp(v,W,H); v.cx=lon-(e.offsetX-W/2)/v.s; v.cy=lat+(e.offsetY-H/2)/v.s; acgDraw(); },{passive:false});
  $('acZin').addEventListener('click',()=>{ if(ACG){acgView(cv).s*=1.5; acgDraw();} });
  $('acZout').addEventListener('click',()=>{ if(ACG){acgView(cv).s/=1.5; acgDraw();} });
  $('acZfit').addEventListener('click',()=>{ if(ACG){ACG.view=null; acgDraw();} });
  $('acZhome').addEventListener('click',()=>{ if(ACG)acgFocus(ACG.lon,ACG.lat,cv.clientWidth/360*7); });
  $('acList').addEventListener('click',e=>{ const tr=e.target.closest&&e.target.closest('tr.acrow'); if(!tr)return;
    if(tr.dataset.c!==undefined){const d=ACG.res[+tr.dataset.c].dots[+tr.dataset.k]; ACG.sel=d; acgInfo(d); acgFocus(d.lon,d.lat,cv.clientWidth/360*7); cv.scrollIntoView({block:'center'});}
    else{ACG.sel=null; acgFocus(+tr.dataset.lon,+tr.dataset.lat,cv.clientWidth/360*10); cv.scrollIntoView({block:'center'});} });
  $('acCopy').addEventListener('click',()=>{ if(!ACG)return; const t=acgText();
    if(window.GuruApp&&GuruApp.copyText){try{GuruApp.copyText(t);$('acMsg').textContent='Copied.';return;}catch(e){}}
    const fb=()=>{const ta=document.createElement('textarea');ta.value=t;ta.style.cssText='position:fixed;left:0;top:0;opacity:0';document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy');}catch(e){}document.body.removeChild(ta);$('acMsg').textContent=ok?'Copied.':'Copying is blocked here; select the lists and copy them.';};
    try{navigator.clipboard.writeText(t).then(()=>{$('acMsg').textContent='Copied.';},fb);}catch(e){fb();} });
  window.addEventListener('resize',()=>{ if(ACG&&!$('acPanel').classList.contains('hide'))acgDraw(); });
})();

/* ---------- Lottery rules (v4.0) ---------- */
// Ten rules from the KP tradition for gain by chance (houses 2, 5, 6, 8, 11). They are astrological belief, NOT derived from statistics.
const LT_RULES=[
 {id:1,w:14,en:'Ascendant sub lord signifies the 11th house together with the 2nd, 5th, 6th or 8th',ta:'லக்ன உப அதிபதி 11-ஆம் வீட்டுடன் 2, 5, 6 அல்லது 8-ஐ குறிக்கிறார்'},
 {id:2,w:10,en:'Ascendant star lord signifies at least two of the 2nd, 5th, 6th, 8th and 11th and is not a 12th-house (loss) signifier without the 11th',ta:'லக்ன நட்சத்திர அதிபதி 2, 5, 6, 8, 11-ல் குறைந்தது இரண்டை குறிக்கிறார்; 11 இன்றி 12-ஐ குறிக்கவில்லை'},
 {id:3,w:8,en:'Ascendant lord stands in the 1st, 2nd, 5th, 9th, 10th or 11th house and its star lord is not in the 6th, 8th or 12th',ta:'லக்னாதிபதி 1, 2, 5, 9, 10, 11-ல்; அவர் நட்சத்திர அதிபதி 6, 8, 12-ல் இல்லை'},
 {id:4,w:14,en:'5th cusp sub lord signifies the 5th and the 11th (or 8th): speculation and sudden gain',ta:'5-ஆம் கஸ்ப் உப அதிபதி 5 உடன் 11 (அல்லது 8) குறிக்கிறார்: ஊக லாபம், திடீர் அதிர்ஷ்டம்'},
 {id:5,w:14,en:'11th cusp sub lord signifies the 11th and the 2nd (or 6th): fulfilment of desire and money',ta:'11-ஆம் கஸ்ப் உப அதிபதி 11 உடன் 2 (அல்லது 6) குறிக்கிறார்: ஆசை நிறைவேறல், பணம்'},
 {id:6,w:10,en:'2nd cusp sub lord signifies the 2nd and the 11th: money comes into the hand',ta:'2-ஆம் கஸ்ப் உப அதிபதி 2 உடன் 11 குறிக்கிறார்: பணம் கைக்கு வரும்'},
 {id:7,w:8,en:'8th cusp sub lord signifies the 8th with the 11th (or 2nd): windfall',ta:'8-ஆம் கஸ்ப் உப அதிபதி 8 உடன் 11 (அல்லது 2) குறிக்கிறார்: எதிர்பாராத லாபம்'},
 {id:8,w:8,en:'6th cusp sub lord signifies the 6th with the 11th: winning over the others',ta:'6-ஆம் கஸ்ப் உப அதிபதி 6 உடன் 11 குறிக்கிறார்: மற்றவர்களை வெல்லுதல்'},
 {id:9,w:8,en:'Moon’s star lord and sub lord each signify the 2nd, 5th or 11th and neither signifies the 12th without the 11th: the mind favours luck',ta:'சந்திரனின் நட்சத்திர, உப அதிபதிகள் 2, 5, 11-ஐ குறிக்கிறார்கள்; 11 இன்றி 12 இல்லை'},
 {id:10,w:6,en:'Jupiter, the planet of fortune: its star lord signifies the 5th, 9th or 11th and its sub lord signifies the 2nd or 11th',ta:'குரு: நட்சத்திர அதிபதி 5, 9, 11-ஐயும் உப அதிபதி 2 அல்லது 11-ஐயும் குறிக்கிறார்'}
];
let LT=null, LT_LIST=[];
const ltOrd=n=>n+(n===1?'st':n===2?'nd':n===3?'rd':'th');
function ltEval(r,lat,lon,kind,ctx){
  const g=SEGS[r.k], mid=(r.start+r.end)/2, cu=placidusCusps(mid,lat,lon,kind);
  const seg=i=>SEGS[findSeg(cu[i-1])];
  const bh=l=>{for(let i=0;i<12;i++){const a=cu[i],b=cu[(i+1)%12];if(mod(l-a,360)<mod(b-a,360))return i+1;}return 1;};
  const P={}; CODES.forEach(c=>P[c]=sidLon(c,mid));
  const own={}; CODES.forEach(c=>own[c]=[]); for(let i=1;i<=12;i++){const lo=seg(i).lord; (own[lo]=own[lo]||[]).push(i);}
  const ownOf=c=>(c==='Ra'||c==='Ke')?(own[SEGS[findSeg(P[c])].lord]||[]):(own[c]||[]);
  const occ=c=>bh(P[c]), cache={};
  const sg=c=>{if(cache[c])return cache[c]; const st=SEGS[findSeg(P[c])].star, s=new Set([occ(st),occ(c)]); ownOf(st).forEach(h=>s.add(h)); ownOf(c).forEach(h=>s.add(h)); return cache[c]=s;};
  const has=(s,...h)=>h.some(x=>s.has(x)), loss=s=>s.has(12)&&!s.has(11);
  const lst=s=>Array.from(s).sort((a,b)=>a-b).join(', ');
  const met={}, det={};
  const sAsc=sg(g.sub); met[1]=sAsc.has(11)&&has(sAsc,2,5,6,8); det[1]=NAME[g.sub]+' signifies '+lst(sAsc);
  const sSt=sg(g.star), cnt=[2,5,6,8,11].filter(h=>sSt.has(h)).length; met[2]=cnt>=2&&!loss(sSt); det[2]=NAME[g.star]+' signifies '+lst(sSt);
  const al=g.lord, alSt=SEGS[findSeg(P[al])].star, ho=occ(al), hs=occ(alSt); met[3]=[1,2,5,9,10,11].indexOf(ho)>=0&&[6,8,12].indexOf(hs)<0; det[3]=NAME[al]+' in the '+ltOrd(ho)+' house, its star lord '+NAME[alSt]+' in the '+ltOrd(hs);
  const cs=h=>{const x=seg(h), s=sg(x.sub); return {x:x,s:s};};
  const c5=cs(5),c11=cs(11),c2=cs(2),c8=cs(8),c6=cs(6);
  met[4]=c5.s.has(5)&&has(c5.s,11,8); det[4]=NAME[c5.x.sub]+' signifies '+lst(c5.s);
  met[5]=c11.s.has(11)&&has(c11.s,2,6); det[5]=NAME[c11.x.sub]+' signifies '+lst(c11.s);
  met[6]=c2.s.has(2)&&c2.s.has(11); det[6]=NAME[c2.x.sub]+' signifies '+lst(c2.s);
  met[7]=c8.s.has(8)&&has(c8.s,11,2); det[7]=NAME[c8.x.sub]+' signifies '+lst(c8.s);
  met[8]=c6.s.has(6)&&c6.s.has(11); det[8]=NAME[c6.x.sub]+' signifies '+lst(c6.s);
  const mg=SEGS[findSeg(P.Mo)], sM1=sg(mg.star), sM2=sg(mg.sub);
  met[9]=has(sM1,2,5,11)&&has(sM2,2,5,11)&&!loss(sM1)&&!loss(sM2); det[9]=NAME[mg.star]+' ('+lst(sM1)+') / '+NAME[mg.sub]+' ('+lst(sM2)+')';
  const jg=SEGS[findSeg(P.Ju)], sJ1=sg(jg.star), sJ2=sg(jg.sub);
  met[10]=has(sJ1,5,9,11)&&has(sJ2,2,11); det[10]=NAME[jg.star]+' ('+lst(sJ1)+') / '+NAME[jg.sub]+' ('+lst(sJ2)+')';
  let score=0; LT_RULES.forEach(q=>{if(met[q.id])score+=q.w;});
  // cautions
  const flags=[], el=mod(P.Mo-P.Su,360), ti=Math.floor(el/12)+1, tn=((ti-1)%15)+1, kr=Math.floor(el/6);
  if(ti===30)flags.push('Amavasya (new moon)'); else if([4,9,14].indexOf(tn)>=0)flags.push('Rikta tithi ('+BP_TITHI[tn-1]+')');
  if(kr>=1&&kr<=56&&(kr-1)%7===6)flags.push('Vishti (Bhadra) karana');
  if(ctx.rk&&r.start<ctx.rk[1]&&r.end>ctx.rk[0])flags.push('Rahu kalam');
  const big=met[4]&&met[5]&&met[7], mid2=(met[5]&&met[6])||(met[4]&&met[5]);
  return {score:score,met:met,det:det,flags:flags,level:big?'Big':mid2?'Medium':'Small',star:g.star,sub:g.sub};
}
function ltTier(s){return s>=80?['Very strong','மிக வலிமை']:s>=65?['Strong','வலிமை']:['Good','நல்லது'];}
function ltRun(){
  const msg=$('ltMsg'), out=$('ltOut'); msg.className='msg err'; out.innerHTML='';
  const lat=parseFloat($('ltLat').value), lon=parseFloat($('ltLon').value), tzs=$('ltTz').value.trim(), f=$('ltFrom').value, t=$('ltTo').value, kind=$('ltAyan').value;
  if(isNaN(lat)||isNaN(lon)||!tzs){msg.textContent='Choose the place where the ticket will be bought (or enter latitude, longitude and time zone).';return;}
  if(Math.abs(lat)>62){msg.textContent='Latitude beyond 62° is not supported.';return;}
  if(typeof Astronomy==='undefined'){msg.textContent='Planet positions need the astronomy library, which did not load.';return;}
  if(!f||!t){msg.textContent='Pick both a from date and a to date.';return;}
  let tzf; try{tzf=tzFn(tzs);}catch(e){msg.textContent='The time zone was not recognised. Use a name such as Asia/Kolkata or hours such as 5.5.';return;}
  const a=f.split('-').map(Number), b=t.split('-').map(Number), nd=Math.round((Date.UTC(b[0],b[1]-1,b[2])-Date.UTC(a[0],a[1]-1,a[2]))/86400000)+1;
  if(nd<1){msg.textContent='The to date must not be before the from date.';return;}
  if(nd>14){msg.textContent='Please choose at most 14 days.';return;}
  const min=parseInt($('ltMin').value,10), skip=$('ltSkip').checked; msg.className='msg';
  const old=CFG; CFG={lat:lat,lon:lon,kind:kind}; const items=[], days=[]; let day=0; $('ltGo').disabled=true;
  (function step(){
    if(day>=nd){CFG=old;$('ltGo').disabled=false;LT={items:items,days:days,f:f,t:t,lat:lat,lon:lon,tzs:tzs,place:$('ltSearch').value||'',min:min,skip:skip,nd:nd};ltShow();return;}
    try{
      const dt=new Date(Date.UTC(a[0],a[1]-1,a[2]+day)), y=dt.getUTCFullYear(), m=dt.getUTCMonth()+1, d=dt.getUTCDate();
      const s=localToUtc(y,m,d,0,0,tzs).ms, nx=new Date(Date.UTC(y,m-1,d+1)), e=localToUtc(nx.getUTCFullYear(),nx.getUTCMonth()+1,nx.getUTCDate(),0,0,tzs).ms, off=tzf(s);
      // sunrise and sunset, Rahu kalam
      let rise=s+6*3600000, set=s+18*3600000;
      try{const obs=new Astronomy.Observer(lat,lon,0), r1=Astronomy.SearchRiseSet(Astronomy.Body.Sun,obs,+1,Astronomy.MakeTime(new Date(s)),1), r2=Astronomy.SearchRiseSet(Astronomy.Body.Sun,obs,-1,Astronomy.MakeTime(new Date(s)),1); if(r1)rise=r1.date.getTime(); if(r2)set=r2.date.getTime();}catch(x){}
      const wd=dt.getUTCDay(), part=[8,2,7,5,6,4,3][wd], seg8=(set-rise)/8, rk=[rise+(part-1)*seg8,rise+part*seg8];
      const rows=compute(s,e,lat,lon,kind), ctx={rk:rk}; let cnt=0;
      rows.forEach(r=>{const x=ltEval(r,lat,lon,kind,ctx); if(x.score>=min&&!(skip&&x.flags.length)){items.push({r:r,x:x,day:s,off:off});cnt++;}});
      days.push({day:s,off:off,rise:rise,set:set,rk:rk,wd:wd,cnt:cnt});
    }catch(err){CFG=old;$('ltGo').disabled=false;msg.textContent='Error: '+(err.message||err);return;}
    day++; msg.textContent='Checking day '+day+' of '+nd+'…'; setTimeout(step,0);
  })();
}
function ltShow(){
  const out=$('ltOut'), L=LT; let h='';
  const best=L.items.slice().sort((p,q)=>q.x.score-p.x.score||p.r.start-q.r.start).slice(0,5);
  h+='<div class="lf-sec"><h3>Best timings of the range<span class="ta">சிறந்த நேரங்கள்</span></h3>'+(best.length?'<ol style="margin:4px 0 0 18px;padding:0">'+best.map(it=>'<li><b>'+fmtDate(it.day,it.off)+' '+fmtHMS(it.r.start,it.off)+' – '+fmtHMS(it.r.end,it.off)+'</b> · score '+it.x.score+' ('+ltTier(it.x.score)[0]+') · rules '+Object.keys(it.x.met).filter(k=>it.x.met[k]).join(', ')+'</li>').join('')+'</ol>':'<p class="msg">No timing reaches the chosen strength. Lower the minimum strength or choose other dates.</p>')+'</div>';
  const NH=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  L.days.forEach(d=>{
    const its=L.items.filter(it=>it.day===d.day); if(!its.length)return;
    h+='<div class="lf-sec"><h3>'+fmtDate(d.day,d.off)+' · '+NH[d.wd]+'</h3><p class="lf-note" style="margin:2px 0">Sunrise '+fmtHMS(d.rise,d.off)+' · sunset '+fmtHMS(d.set,d.off)+' · Rahu kalam '+fmtHMS(d.rk[0],d.off)+'–'+fmtHMS(d.rk[1],d.off)+'</p></div>';
    its.forEach(it=>{
      const g=SEGS[it.r.k], x=it.x, tier=ltTier(x.score), metIds=LT_RULES.filter(q=>x.met[q.id]), missIds=LT_RULES.filter(q=>!x.met[q.id]);
      h+='<ul style="margin-top:6px"><li class="row gm" data-s="'+it.r.start+'" data-e="'+it.r.end+'" data-tz="'+it.off+'" data-lat="'+L.lat+'" data-lon="'+L.lon+'" data-kind="'+$('ltAyan').value+'" style="--h:'+HUE[g.sub]+'"><div class="t2"><div><span>Begin</span><b>'+fmtHMS(it.r.start,it.off)+'</b></div><div><span>End</span><b>'+fmtHMS(it.r.end,it.off)+'</b></div></div>'+
        '<div class="l"><span class="n">'+NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub]+'</span><span class="pl"><span class="pill gain">'+tier[0]+' · '+tier[1]+' · '+x.score+'/100</span> <span class="pill">Gain indication: '+x.level+'</span></span></div>'+
        '<div class="chk"><b>Selected by rules:</b> '+metIds.map(q=>'R'+q.id).join(', ')+'<br>'+metIds.map(q=>'<b>R'+q.id+'</b> '+q.en+'<br><span class="lf-note">'+x.det[q.id]+'</span>').join('<br>')+'<br><span class="lf-note">Not met: '+(missIds.map(q=>'R'+q.id).join(', ')||'none')+'</span></div>'+
        '<div class="p"><span>'+SIGNS[g.sign][0]+' ascendant · '+span(g)+' · '+NAKS[g.nak]+'</span><span>lasts '+dur(it.r.end-it.r.start)+'</span></div></li></ul>';
    });
  });
  $('ltMsg').textContent=L.items.length+' timings from '+L.f+' to '+L.t+' (minimum strength '+L.min+'/100).';
  h+='<div class="btns"><button id="ltCopy" type="button">Copy as text</button></div>';
  out.innerHTML=h;
  $('ltCopy').addEventListener('click',()=>{
    const tx='Lottery timings (astrological belief) '+L.f+' to '+L.t+' ('+L.lat+', '+L.lon+', '+L.tzs+')\n'+L.items.map(it=>fmtDate(it.day,it.off)+'  '+fmtHMS(it.r.start,it.off)+' - '+fmtHMS(it.r.end,it.off)+'  score '+it.x.score+'  gain '+it.x.level+'  rules '+LT_RULES.filter(q=>it.x.met[q.id]).map(q=>'R'+q.id).join(',')).join('\n');
    if(window.GuruApp&&GuruApp.copyText){try{GuruApp.copyText(tx);$('ltMsg').textContent='Copied.';return;}catch(e){}}
    try{navigator.clipboard.writeText(tx).then(()=>{$('ltMsg').textContent='Copied.';},()=>{$('ltMsg').textContent='Copying is blocked here.';});}catch(e){$('ltMsg').textContent='Copying is blocked here.';}
  });
}
function ltFill(){
  const q=$('ltSearch').value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''), cn=$('ltCountry').value, sel=$('ltCity'); let list, tag=false;
  if(cn==='*a'){list=q?WC.filter(x=>plKey(x).indexOf(q)>=0).slice(0,400):[];tag=true;} else list=WC.filter(x=>x.cc===cn&&(!q||plKey(x).indexOf(q)>=0)).slice(0,600);
  if(!list.length)list=webC(q,ltFill); LT_LIST=list; sel.innerHTML=list.length?list.map((x,i)=>'<option value="'+i+'">'+x.n+(x.st?', '+x.st:'')+(tag?', '+x.cc:'')+'</option>').join(''):'<option value="">No match in the offline list. Online search is tried automatically when you are connected</option>'; ltPick();
}
function ltPick(){const x=LT_LIST[parseInt($('ltCity').value,10)]; if(x){$('ltLat').value=x.lat;$('ltLon').value=x.lon;$('ltTz').value=x.tz;} ltOff();}
function ltOff(){const el=$('ltOff'), t=$('ltTz').value.trim(); el.className='msg'; if(!t){el.textContent='';return;} try{el.textContent='Time zone now: '+utcTxt(tzFn(t)(Date.now()))+(/^-?[\d.]+$/.test(t)?'':' ('+t+')');}catch(e){el.textContent='The time zone was not recognised.';el.className='msg err';}}
(function initLt(){
  const cs=$('ltCountry'); cs.innerHTML='<option value="*a">All countries (use search)</option>'+CITY.cc.map(n=>'<option value="'+n.replace(/"/g,'&quot;')+'">'+n+'</option>').join('');
  cs.addEventListener('change',ltFill); $('ltSearch').addEventListener('input',ltFill); $('ltCity').addEventListener('change',ltPick); $('ltTz').addEventListener('input',ltOff); ltFill();
  const iso=new Date(Date.now()+TZ*3600000).toISOString().slice(0,10); $('ltFrom').value=iso; $('ltTo').value=iso;
  $('ltRules').innerHTML=LT_RULES.map(q=>'<li><b>R'+q.id+'</b> ('+q.w+' points) '+q.en+'<br><span class="ta" style="font-family:var(--ta);color:var(--accent)">'+q.ta+'</span></li>').join('');
  $('ltBtn').addEventListener('click',()=>{ const pn=$('ltPanel'); pn.classList.remove('hide'); if(!$('ltLat').value){$('ltLat').value=$('lat').value;$('ltLon').value=$('lon').value;$('ltTz').value=PL_TZ||$('tz').value;ltOff();} pn.scrollIntoView({block:'start'}); });
  $('ltClose').addEventListener('click',()=>$('ltPanel').classList.add('hide'));
  $('ltGo').addEventListener('click',ltRun);
  $('ltLoc').addEventListener('click',()=>{ const el=$('ltOff'); if(!navigator.geolocation){el.textContent='Location is not available here.';el.className='msg err';return;} el.textContent='Finding your location…';el.className='msg';
    navigator.geolocation.getCurrentPosition(pos=>{$('ltLat').value=pos.coords.latitude.toFixed(4);$('ltLon').value=pos.coords.longitude.toFixed(4);let z='';try{z=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(e){} $('ltTz').value=z||String(-new Date().getTimezoneOffset()/60);$('ltSearch').value='';ltOff();},e=>{el.textContent='Could not get your location. Choose a city instead.';el.className='msg err';},{timeout:15000}); });
})();

/* ---------- Money manifestation (v4.1) ---------- */
const MM_RULES=[
 {id:1,def:1,en:'The Moon (transit) is in the star of the 2nd lord or the 11th lord',ta:'கோசார சந்திரன் 2 அல்லது 11-ஆம் அதிபதியின் நட்சத்திரத்தில்'},
 {id:2,def:1,en:'The 2nd lord is in the 1st, 2nd, 3rd or 11th house from the ascendant',ta:'2-ஆம் அதிபதி லக்னத்திலிருந்து 1, 2, 3 அல்லது 11-ஆம் வீட்டில்'},
 {id:3,def:1,en:'The ascendant star lord and sub lord are each the 1st, 2nd, 3rd or 11th lord, or the Moon (not applied for a Sagittarius ascendant)',ta:'லக்ன நட்சத்திர, உப அதிபதிகள் ஒவ்வொருவரும் 1, 2, 3, 11-ஆம் அதிபதி அல்லது சந்திரன் (தனுசு லக்னத்துக்கு பொருந்தாது)'},
 {id:4,def:1,en:'The ascendant lord, star lord and sub lord are not placed in the 8th or 12th house from the ascendant',ta:'லக்னாதிபதி, நட்சத்திர, உப அதிபதிகள் 8, 12-ஆம் வீட்டில் இல்லை'},
 {id:5,def:1,en:'The ascendant lord, star lord and sub lord are not in the star of the 5th, 9th, 8th or 12th lord',ta:'லக்னாதிபதி, நட்சத்திர, உப அதிபதிகள் 5, 9, 8, 12-ஆம் அதிபதியின் நட்சத்திரத்தில் இல்லை'},
 {id:6,def:1,en:'The 2nd cusp sub lord and the 11th cusp sub lord are each the 2nd lord or the 11th lord',ta:'2-ஆம், 11-ஆம் கஸ்ப் உப அதிபதிகள் ஒவ்வொருவரும் 2 அல்லது 11-ஆம் அதிபதி'},
 {id:7,def:1,en:'The ascendant lord, star lord and sub lord are not retrograde (Rahu and Ketu are not counted as retrograde)',ta:'லக்னாதிபதி, நட்சத்திர, உப அதிபதிகள் வக்ரத்தில் இல்லை'},
 {id:8,def:0,en:'The ascendant lord, star lord and sub lord are each in the star of the 1st, 2nd, 3rd or 11th lord, and that star lord is not the 8th or 12th lord',ta:'மூவரும் 1, 2, 3, 11-ஆம் அதிபதியின் நட்சத்திரத்தில்; அவர் 8, 12-ஆம் அதிபதி அல்ல'},
 {id:9,def:0,en:'The star lord of each of the three is not placed in the 8th or 12th house',ta:'மூவரின் நட்சத்திர அதிபதி 8, 12-ஆம் வீட்டில் இல்லை'},
 {id:10,def:0,en:'The star lord and sub lord of the 1st, 3rd and 11th cusps are each the 1st, 2nd, 3rd or 11th lord',ta:'1, 3, 11-ஆம் கஸ்ப்களின் நட்சத்திர, உப அதிபதிகள் 1, 2, 3, 11-ஆம் அதிபதிகள்'}
];
let MM=null, MM_LIST=[];
function mmEval(r,lat,lon,kind){
  const g=SEGS[r.k], mid=(r.start+r.end)/2, cu=placidusCusps(mid,lat,lon,kind);
  const seg=i=>SEGS[findSeg(cu[i-1])];
  const bh=l=>{for(let i=0;i<12;i++){const a=cu[i],b=cu[(i+1)%12];if(mod(l-a,360)<mod(b-a,360))return i+1;}return 1;};
  const P={}; CODES.forEach(c=>P[c]=sidLon(c,mid));
  const Ls={}; for(let h=1;h<=12;h++)Ls[h]=seg(h).lord;
  const L1=Ls[1],L2=Ls[2],L3=Ls[3],L5=Ls[5],L8=Ls[8],L9=Ls[9],L11=Ls[11],L12=Ls[12];
  const starOf=c=>SEGS[findSeg(P[c])].star, A3=[g.lord,g.star,g.sub], nm=c=>NAME[c], H=c=>bh(P[c]), bad=h=>h===8||h===12, st3=A3.map(starOf);
  const met={}, det={}, na={};
  const ms=starOf('Mo'); met[1]=ms===L2||ms===L11; det[1]='Moon in '+NAKS[SEGS[findSeg(P.Mo)].nak]+', star of '+nm(ms)+' (2nd lord '+nm(L2)+', 11th lord '+nm(L11)+')';
  const h2=H(L2); met[2]=[1,2,3,11].indexOf(h2)>=0; det[2]='2nd lord '+nm(L2)+' in the '+ltOrd(h2)+' house';
  const ok3=[L1,L2,L3,L11,'Mo']; met[3]=[g.star,g.sub].every(c=>ok3.indexOf(c)>=0); det[3]='ascendant star lord '+nm(g.star)+', sub lord '+nm(g.sub)+' · 1st '+nm(L1)+', 2nd '+nm(L2)+', 3rd '+nm(L3)+', 11th '+nm(L11)+', and the Moon';
  if(g.sign===8){met[3]=true;na[3]=1;det[3]+=' · Sagittarius ascendant: rule not applied';}
  met[4]=A3.every(c=>!bad(H(c))); det[4]=A3.map(c=>nm(c)+' in the '+ltOrd(H(c))+' house').join('; ');
  const no5=[L5,L9,L8,L12]; met[5]=st3.every(x=>no5.indexOf(x)<0); det[5]=A3.map((c,i)=>nm(c)+' in star of '+nm(st3[i])).join('; ')+' · 5th '+nm(L5)+', 9th '+nm(L9)+', 8th '+nm(L8)+', 12th '+nm(L12);
  const c2=seg(2).sub, c11=seg(11).sub; met[6]=[c2,c11].every(c=>c===L2||c===L11); det[6]='2nd cusp sub lord '+nm(c2)+', 11th cusp sub lord '+nm(c11)+' · 2nd lord '+nm(L2)+', 11th lord '+nm(L11);
  const retro=A3.filter(c=>isRetro(c,mid)); met[7]=retro.length===0; det[7]=nm(g.lord)+'/'+nm(g.star)+'/'+nm(g.sub)+(retro.length?': retrograde '+retro.map(nm).join(', '):': all direct');
  const okS=[L1,L2,L3,L11]; met[8]=st3.every(x=>okS.indexOf(x)>=0&&x!==L8&&x!==L12); det[8]=A3.map((c,i)=>nm(c)+' in star of '+nm(st3[i])).join('; ')+' · 1st '+nm(L1)+', 2nd '+nm(L2)+', 3rd '+nm(L3)+', 11th '+nm(L11);
  met[9]=st3.every(x=>!bad(H(x))); det[9]=st3.map(x=>'star lord '+nm(x)+' in the '+ltOrd(H(x))+' house').join('; ');
  const okL=[L1,L2,L3,L11], cs=[1,3,11].map(h=>{const x=seg(h);return [h,x.star,x.sub];}); met[10]=cs.every(x=>okL.indexOf(x[1])>=0&&okL.indexOf(x[2])>=0);
  det[10]=cs.map(x=>ltOrd(x[0])+' cusp: star '+nm(x[1])+', sub '+nm(x[2])).join('; ');
  return {met:met,det:det,na:na,total:MM_RULES.filter(q=>met[q.id]).length,mid:mid,cu:cu,P:P,bh:bh};
}
function mmCusp(x,lat,lon,kind){
  // house cusps and planets with their lords, star lords, sub lords and the houses each signifies (KP), English with Tamil
  const cu=x.cu, P=x.P, bh=x.bh, seg=i=>SEGS[findSeg(cu[i-1])], own={}; CODES.forEach(c=>own[c]=[]); for(let i=1;i<=12;i++){const lo=seg(i).lord;(own[lo]=own[lo]||[]).push(i);}
  const ownOf=c=>(c==='Ra'||c==='Ke')?(own[SEGS[findSeg(P[c])].lord]||[]):(own[c]||[]);
  const sgA=c=>{const st=SEGS[findSeg(P[c])].star, s=new Set([bh(P[st]),bh(P[c])]); ownOf(st).forEach(h=>s.add(h)); ownOf(c).forEach(h=>s.add(h)); return Array.from(s).sort((a,b)=>a-b);};
  const L2=seg(2).lord, L11=seg(11).lord, good=[2,11], bad=[8,12];
  const chips=a=>'<span class="hchips">'+a.map(h=>'<i class="'+(good.indexOf(h)>=0?'g':bad.indexOf(h)>=0?'b':'')+'">'+h+'</i>').join('')+'</span>';
  const hta=i=>i===1?'லக்னம்':i+'ஆம் பாவம்';
  const lords=q=>'<b>'+NAME[q.lord]+'/<wbr>'+NAME[q.star]+'/<wbr>'+NAME[q.sub]+'</b><span class="ta">'+TA[q.lord]+'/<wbr>'+TA[q.star]+'/<wbr>'+TA[q.sub]+'</span>';
  let h='<div class="kt-h"><b>House cusps</b><span class="ta">பாவ கஸ்ப்கள்</span></div>';
  h+='<div class="ktw"><table class="ktab"><thead><tr><th>House<span class="ta">பாவம்</span></th><th>Cusp<span class="ta">கஸ்ப் நிலை</span></th><th>Star<span class="ta">நட்சத்திரம்</span></th><th>Sign / Star / Sub Lords<span class="ta">ராசி / நட்சத்திர / உப அதிபதி</span></th><th>Sub lord signifies<span class="ta">உப அதிபதி காரகத்துவம்</span></th></tr></thead><tbody>';
  for(let i=1;i<=12;i++){const q=seg(i), mk=(i===2||i===11)?' class="mk"':'';
    h+='<tr'+mk+'><td><b class="hn">'+i+'</b><span class="ta">'+hta(i)+'</span></td><td><b>'+SIGNS[q.sign][0]+' '+inSign(cu[i-1])+'</b><span class="ta">'+TSIGN[q.sign]+'</span></td><td><b>'+NAKS[q.nak]+'</b><span class="ta">'+GP_NAKT[q.nak]+'</span></td><td>'+lords(q)+'</td><td>'+chips(sgA(q.sub))+'<span class="ta">'+TA[q.sub]+'</span></td></tr>';}
  h+='</tbody></table></div><div class="kt-h"><b>Planets</b><span class="ta">கிரகங்கள்</span></div>';
  h+='<div class="ktw"><table class="ktab"><thead><tr><th>Body<span class="ta">கிரகம்</span></th><th>Position<span class="ta">நிலை</span></th><th>House<span class="ta">பாவம்</span></th><th>Star<span class="ta">நட்சத்திரம்</span></th><th>Sign / Star / Sub Lords<span class="ta">ராசி / நட்சத்திர / உப அதிபதி</span></th><th>Signifies<span class="ta">காரகத்துவம்</span></th></tr></thead><tbody>';
  CODES.forEach(c=>{const q=SEGS[findSeg(P[c])], hb=bh(P[c]);
    h+='<tr><td><b>'+NAME[c]+'</b><span class="ta">'+TA[c]+'</span></td><td><b>'+SIGNS[q.sign][0]+' '+inSign(P[c])+(isRetro(c,x.mid)?' <i class="rt">R</i>':'')+'</b><span class="ta">'+TSIGN[q.sign]+'</span></td><td><b class="hn">'+hb+'</b><span class="ta">'+hta(hb)+'</span></td><td><b>'+NAKS[q.nak]+'</b><span class="ta">'+GP_NAKT[q.nak]+'</span></td><td>'+lords(q)+'</td><td>'+chips(sgA(c))+'</td></tr>';});
  h+='</tbody></table></div><p class="kt-n">2nd lord '+NAME[L2]+' · 11th lord '+NAME[L11]+'. Green: 2nd and 11th houses (money). Red: 8th and 12th houses.<span class="ta">2ஆம் அதிபதி '+TA[L2]+' · 11ஆம் அதிபதி '+TA[L11]+'. பச்சை: 2, 11 (தனம்). சிவப்பு: 8, 12.</span></p>';
  return h;
}
function mmSky(s0,e0,lat,lon,kind,off){
  // sign changes, retrograde and direct stations, and Moon star changes across the whole range
  const ev=[], step=3*3600000, N=360/27; const fmtT=ms=>fmtDate(Math.floor((ms+off*3600000)/86400000)*86400000-off*3600000,off)+' '+fmtHMS(ms,off);
  const bis=(f,a,b)=>{const va=f(a);for(let i=0;i<16;i++){const m=(a+b)/2;if(f(m)===va)a=m;else b=m;}return b;};
  CODES.forEach(c=>{
    const sgF=m=>Math.floor(sidLon(c,m)/30)%12, rtF=m=>isRetro(c,m)?1:0, nkF=m=>Math.floor(sidLon(c,m)/N)%27;
    let ps=sgF(s0), pr=rtF(s0), pn=nkF(s0);
    for(let m=s0+step;m<=e0;m+=step){
      const s=sgF(m); if(s!==ps){ev.push({t:bis(sgF,m-step,m),c:c,txt:NAME[c]+' enters '+SIGNS[s][0]});ps=s;}
      if(c!=='Su'&&c!=='Mo'&&c!=='Ra'&&c!=='Ke'){const r=rtF(m); if(r!==pr){ev.push({t:bis(rtF,m-step,m),c:c,txt:NAME[c]+(r?' turns retrograde':' turns direct')});pr=r;}}
      if(c==='Mo'){const n=nkF(m); if(n!==pn){const t=bis(nkF,m-step,m); ev.push({t:t,c:c,txt:'Moon enters '+NAKS[n]+' (star of '+NAME[SEGS[findSeg(sidLon('Mo',t+60000))].star]+')',moon:1});pn=n;}}
    }
  });
  return ev.sort((a,b)=>a.t-b.t).map(e=>({t:fmtT(e.t),txt:e.txt,moon:e.moon}));
}
function mmSel(){return MM_RULES.filter(q=>{const e=$('mmR'+q.id);return e&&e.checked;}).map(q=>q.id);}
function mmRun(){
  const msg=$('mmMsg'), out=$('mmOut'); msg.className='msg err'; out.innerHTML='';
  const lat=parseFloat($('mmLat').value), lon=parseFloat($('mmLon').value), tzs=$('mmTz').value.trim(), f=$('mmFrom').value, t=$('mmTo').value, kind=$('mmAyan').value, sel=mmSel();
  if(isNaN(lat)||isNaN(lon)||!tzs){msg.textContent='Choose a place (or enter latitude, longitude and time zone).';return;}
  if(Math.abs(lat)>62){msg.textContent='Latitude beyond 62° is not supported.';return;}
  if(typeof Astronomy==='undefined'){msg.textContent='Planet positions need the astronomy library, which did not load.';return;}
  if(!f||!t){msg.textContent='Pick both a from date and a to date.';return;}
  if(!sel.length){msg.textContent='Tick at least one rule.';return;}
  let tzf; try{tzf=tzFn(tzs);}catch(e){msg.textContent='The time zone was not recognised. Use a name such as Asia/Kolkata or hours such as 5.5.';return;}
  const a=f.split('-').map(Number), b=t.split('-').map(Number), nd=Math.round((Date.UTC(b[0],b[1]-1,b[2])-Date.UTC(a[0],a[1]-1,a[2]))/86400000)+1;
  if(nd<1){msg.textContent='The to date must not be before the from date.';return;}
  if(nd>31){msg.textContent='Please choose at most 31 days.';return;}
  msg.className='msg';
  const old=CFG; CFG={lat:lat,lon:lon,kind:kind}; const items=[]; let day=0, s0=null, e0=null, off0=0, n=0; $('mmGo').disabled=true;
  (function step(){
    if(day>=nd){
      try{MM={items:items,sky:mmSky(s0,e0,lat,lon,kind,off0),f:f,t:t,lat:lat,lon:lon,tzs:tzs,sel:sel,nd:nd,n:n,kind:kind};}catch(err){CFG=old;$('mmGo').disabled=false;msg.textContent='Error: '+(err.message||err);return;}
      CFG=old; $('mmGo').disabled=false; mmShow(); return;
    }
    try{
      const dt=new Date(Date.UTC(a[0],a[1]-1,a[2]+day)), y=dt.getUTCFullYear(), m=dt.getUTCMonth()+1, d=dt.getUTCDate();
      const s=localToUtc(y,m,d,0,0,tzs).ms, nx=new Date(Date.UTC(y,m-1,d+1)), e=localToUtc(nx.getUTCFullYear(),nx.getUTCMonth()+1,nx.getUTCDate(),0,0,tzs).ms, off=tzf(s);
      if(day===0){s0=s;off0=off;} e0=e;
      compute(s,e,lat,lon,kind).forEach(r=>{n++; const x=mmEval(r,lat,lon,kind); if(sel.every(i=>x.met[i]))items.push({r:r,x:x,day:s,off:off});});
    }catch(err){CFG=old;$('mmGo').disabled=false;msg.textContent='Error: '+(err.message||err);return;}
    day++; msg.textContent='Checking day '+day+' of '+nd+'…'; setTimeout(step,0);
  })();
}
function mmShow(){
  const out=$('mmOut'), L=MM; let h='', last=null; const selTxt=L.sel.map(i=>'R'+i).join(', ');
  const rs=it=>MM_RULES.filter(q=>it.x.met[q.id]).map(q=>'R'+q.id).join(', ');
  const bestM=L.items.slice().sort((p,q)=>q.x.total-p.x.total||p.r.start-q.r.start).slice(0,5);
  if(bestM.length)h+='<div class="lf-sec"><h3>Best timings of the range<span class="ta">சிறந்த நேரங்கள்</span></h3><ol style="margin:4px 0 0 18px;padding:0">'+bestM.map(it=>'<li><b>'+fmtDate(it.day,it.off)+' '+fmtHMS(it.r.start,it.off)+' – '+fmtHMS(it.r.end,it.off)+'</b> · '+NAME[SEGS[it.r.k].lord]+'/'+NAME[SEGS[it.r.k].star]+'/'+NAME[SEGS[it.r.k].sub]+' · '+it.x.total+' of 10 rules met ('+rs(it)+')</li>').join('')+'</ol></div>';
  h+='<div class="lf-sec"><h3>Transit movements in this period<span class="ta">கோசார நகர்வுகள்</span></h3><details class="lf-det"><summary>Sign changes, retrograde and direct turns, Moon star changes ('+L.sky.length+')</summary><ul style="margin:6px 0 0 18px;padding:0">'+L.sky.map(e=>'<li>'+e.t+' · '+e.txt+'</li>').join('')+'</ul></details></div>';
  L.items.forEach(it=>{
    const g=SEGS[it.r.k], x=it.x;
    if(it.day!==last){last=it.day; h+='<div class="lf-sec"><h3>'+fmtDate(it.day,it.off)+'</h3></div>';}
    const metIds=MM_RULES.filter(q=>x.met[q.id]), miss=MM_RULES.filter(q=>!x.met[q.id]);
    h+='<ul style="margin-top:6px"><li class="row gm" data-s="'+it.r.start+'" data-e="'+it.r.end+'" data-tz="'+it.off+'" data-lat="'+L.lat+'" data-lon="'+L.lon+'" data-kind="'+L.kind+'" style="--h:'+HUE[g.sub]+'"><div class="t2"><div><span>Begin</span><b>'+fmtHMS(it.r.start,it.off)+'</b></div><div><span>End</span><b>'+fmtHMS(it.r.end,it.off)+'</b></div></div>'+
      '<div class="l"><span class="n">'+NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub]+'</span><span class="pl"><span class="pill gain">Money manifestation · பணம் ஈர்ப்பு</span> <span class="pill">'+x.total+' of 10 rules met</span></span></div>'+
      '<div class="chk"><b>All ticked rules met ('+selTxt+'):</b><br>'+L.sel.map(i=>{const q=MM_RULES[i-1];return '<b>R'+i+'</b> '+q.en+'<br><span class="lf-note">'+x.det[i]+'</span>';}).join('<br>')+
      (miss.length?'<br><span class="lf-note">Other rules not met (not ticked or not required): '+miss.map(q=>'R'+q.id).join(', ')+'</span>':'')+'</div>'+
      '<details class="lf-det mmcu"><summary><span class="mi"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M3.5 3.5l17 17M20.5 3.5l-17 17M12 3.5v17M3.5 12h17"/></svg></span><span class="mt">House cusps &amp; significators<span class="ta">பாவ கஸ்ப்கள் · காரகத்துவம்</span></span></summary><div class="mmcu-b">'+mmCusp(x,L.lat,L.lon,L.kind)+'</div></details>'+
      '<div class="p"><span>'+SIGNS[g.sign][0]+' ascendant · '+span(g)+' · '+NAKS[g.nak]+'</span><span>lasts '+dur(it.r.end-it.r.start)+'</span></div></li></ul>';
  });
  $('mmMsg').textContent=L.items.length+' of '+L.n+' ascendant timings from '+L.f+' to '+L.t+' meet every ticked rule ('+selTxt+').';
  if(!L.items.length)h+='<p class="msg">No timing meets every ticked rule in this range. Untick a rule, or choose other dates (the rules together are demanding and meet in clusters).</p>'; else h+='<div class="btns"><button id="mmCopy" type="button">Copy as text</button></div>';
  out.innerHTML=h;
  const cb=$('mmCopy'); if(cb)cb.addEventListener('click',()=>{
    const tx='Money manifestation timings '+L.f+' to '+L.t+' ('+L.lat+', '+L.lon+', '+L.tzs+') - rules '+selTxt+'\n'+L.items.map(it=>fmtDate(it.day,it.off)+'  '+fmtHMS(it.r.start,it.off)+' - '+fmtHMS(it.r.end,it.off)+'  '+NAME[SEGS[it.r.k].lord]+'/'+NAME[SEGS[it.r.k].star]+'/'+NAME[SEGS[it.r.k].sub]+'  '+it.x.total+'/10').join('\n')+'\n\nTransit movements\n'+L.sky.filter(e=>!e.moon).map(e=>e.t+'  '+e.txt).join('\n');
    if(window.GuruApp&&GuruApp.copyText){try{GuruApp.copyText(tx);$('mmMsg').textContent='Copied.';return;}catch(e){}}
    try{navigator.clipboard.writeText(tx).then(()=>{$('mmMsg').textContent='Copied.';},()=>{$('mmMsg').textContent='Copying is blocked here.';});}catch(e){$('mmMsg').textContent='Copying is blocked here.';}
  });
}
function mmFill(){
  const q=$('mmSearch').value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''), cn=$('mmCountry').value, sel=$('mmCity'); let list, tag=false;
  if(cn==='*a'){list=q?WC.filter(x=>plKey(x).indexOf(q)>=0).slice(0,400):[];tag=true;} else list=WC.filter(x=>x.cc===cn&&(!q||plKey(x).indexOf(q)>=0)).slice(0,600);
  if(!list.length)list=webC(q,mmFill); MM_LIST=list; sel.innerHTML=list.length?list.map((x,i)=>'<option value="'+i+'">'+x.n+(x.st?', '+x.st:'')+(tag?', '+x.cc:'')+'</option>').join(''):'<option value="">No match in the offline list. Online search is tried automatically when you are connected</option>'; mmPick();
}
function mmPick(){const x=MM_LIST[parseInt($('mmCity').value,10)]; if(x){$('mmLat').value=x.lat;$('mmLon').value=x.lon;$('mmTz').value=x.tz;} mmOff();}
function mmOff(){const el=$('mmOff'), t=$('mmTz').value.trim(); el.className='msg'; if(!t){el.textContent='';return;} try{el.textContent='Time zone now: '+utcTxt(tzFn(t)(Date.now()))+(/^-?[\d.]+$/.test(t)?'':' ('+t+')');}catch(e){el.textContent='The time zone was not recognised.';el.className='msg err';}}

(function initMm(){
  const cs=$('mmCountry'); cs.innerHTML='<option value="*a">All countries (use search)</option>'+CITY.cc.map(n=>'<option value="'+n.replace(/"/g,'&quot;')+'">'+n+'</option>').join('');
  cs.addEventListener('change',mmFill); $('mmSearch').addEventListener('input',mmFill); $('mmCity').addEventListener('change',mmPick); $('mmTz').addEventListener('input',mmOff); mmFill();
  const iso=new Date(Date.now()+TZ*3600000).toISOString().slice(0,10); $('mmFrom').value=iso; $('mmTo').value=iso;
  $('mmRules').innerHTML=MM_RULES.map(q=>'<label class="acchk" style="display:flex;align-items:flex-start;margin:6px 0"><input type="checkbox" id="mmR'+q.id+'"'+(q.def?' checked':'')+' style="margin-top:3px"><span><b>R'+q.id+'</b> '+q.en+'<br><span class="ta" style="font-family:var(--ta);color:var(--accent)">'+q.ta+'</span></span></label>').join('');
  $('mmAll').addEventListener('click',()=>MM_RULES.forEach(q=>{$('mmR'+q.id).checked=true;})); $('mmNone').addEventListener('click',()=>MM_RULES.forEach(q=>{$('mmR'+q.id).checked=false;})); $('mmDef').addEventListener('click',()=>MM_RULES.forEach(q=>{$('mmR'+q.id).checked=!!q.def;}));
  $('mmBtn').addEventListener('click',()=>{ const pn=$('mmPanel'); pn.classList.remove('hide'); if(!$('mmLat').value){$('mmLat').value=$('lat').value;$('mmLon').value=$('lon').value;$('mmTz').value=PL_TZ||$('tz').value;mmOff();} pn.scrollIntoView({block:'start'}); });
  $('mmClose').addEventListener('click',()=>$('mmPanel').classList.add('hide'));
  $('mmGo').addEventListener('click',mmRun);
  $('mmLoc').addEventListener('click',()=>{ const el=$('mmOff'); if(!navigator.geolocation){el.textContent='Location is not available here.';el.className='msg err';return;} el.textContent='Finding your location…';el.className='msg';
    navigator.geolocation.getCurrentPosition(pos=>{$('mmLat').value=pos.coords.latitude.toFixed(4);$('mmLon').value=pos.coords.longitude.toFixed(4);let z='';try{z=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(e){} $('mmTz').value=z||String(-new Date().getTimezoneOffset()/60);$('mmSearch').value='';mmOff();},e=>{el.textContent='Could not get your location. Choose a city instead.';el.className='msg err';},{timeout:15000}); });
})();

/* ---------- Cricket wicket and break timings (v4.5) ---------- */
// Astrological belief for entertainment and study; not a prediction, not betting advice.
function ckEval(r,lat,lon,kind){
  const g=SEGS[r.k], mid=(r.start+r.end)/2, cu=placidusCusps(mid,lat,lon,kind), seg=i=>SEGS[findSeg(cu[i-1])];
  const L3=seg(3).lord, L8=seg(8).lord, L11=seg(11).lord, S=g.star, B=g.sub, nm=c=>NAME[c];
  const P={}; CODES.forEach(c=>P[c]=sidLon(c,mid));
  const starOf=c=>SEGS[findSeg(P[c])].star, sg=c=>Math.floor(P[c]/30)%12;
  const cand=[L3,L11].indexOf(S)>=0||[L3,L11].indexOf(B)>=0; if(!cand)return null;
  const subStar=starOf(B), isW=B===L11||subStar===L11;
  const why=[], mode=[];
  why.push('Star lord <b>'+nm(S)+'</b>'+(S===L3?' (3rd lord)':S===L11?' (11th lord)':'')+', sub lord <b>'+nm(B)+'</b>'+(B===L3?' (3rd lord)':B===L11?' (11th lord)':'')+' · 3rd lord '+nm(L3)+', 11th lord '+nm(L11)+', 8th lord '+nm(L8));
  let cls='break';
  if(isW){cls='wicket'; why.push(B===L11?'The sub lord is the 11th lord: wicket timing.':'The sub lord '+nm(B)+' stands in the star of the 11th lord '+nm(L11)+': wicket timing.');}
  if(B===L11&&subStar===L8){cls='miss'; mode.push('Wicket missed: the 11th-lord sub lord is in the star of the 8th lord '+nm(L8)+' (dropped catch, no-ball, not out or review overturned).');}
  if(B==='Me'&&subStar===L11){mode.push('Twin wicket possible: Mercury is the sub lord and stands in the star of the 11th lord.'); if(cls==='break')cls='wicket';}
  if(S!==B){
    const d=mod(sg(S)-sg(B),12); if([0,3,6,9].indexOf(d)>=0)mode.push('Star lord '+nm(S)+' and sub lord '+nm(B)+' are in kendra to each other ('+['1st','4th','7th','10th'][d/3]+' from each other): strong, clear result.');
    if(isRetro(S,mid)&&isRetro(B,mid))mode.push('Both the star lord '+nm(S)+' and the sub lord '+nm(B)+' are retrograde: reversal, review or a decision change is likely.');
  }
  const conn=[]; [['3rd lord',L3],['11th lord',L11]].forEach(x=>{const c=x[1]; if(c==='Ra'||c==='Ke')return; ['Ra','Ke'].forEach(n=>{if(sg(c)===sg(n))conn.push(x[0]+' '+nm(c)+' is with '+nm(n)); else if(starOf(c)===n)conn.push(x[0]+' '+nm(c)+' is in the star of '+nm(n));});});
  if(conn.length)mode.push('Run out or stumping possible: '+conn.join('; ')+'.');
  const catchB=S==='Mo'||B==='Mo'||[L3,L11].indexOf(starOf('Mo'))>=0;
  if(catchB)mode.push('Catch possible: '+(S==='Mo'||B==='Mo'?'the Moon is the '+(B==='Mo'?'sub':'star')+' lord':'the Moon is in the star of the '+(starOf('Mo')===L11?'11th':'3rd')+' lord '+nm(starOf('Mo')))+'.');
  if(cls==='wicket'&&!mode.length)mode.push('Plain wicket (bowled, lbw or other).');
  return {cls:cls,why:why,mode:mode,S:S,B:B,L3:L3,L11:L11,L8:L8,conn:conn.length>0,catchB:catchB,twin:B==='Me'&&subStar===L11};
}
function ckRun(){
  const msg=$('ckMsg'), out=$('ckOut'); msg.className='msg err'; out.innerHTML='';
  const lat=parseFloat($('ckLat').value), lon=parseFloat($('ckLon').value), tzs=$('ckTz').value.trim(), f=$('ckFrom').value, t=$('ckTo').value, kind=$('ckAyan').value, t1=$('ckT1').value||'00:00', t2=$('ckT2').value||'23:59', show=$('ckShow').value;
  if(isNaN(lat)||isNaN(lon)||!tzs){msg.textContent='Choose the ground (or enter latitude, longitude and time zone).';return;}
  if(Math.abs(lat)>62){msg.textContent='Latitude beyond 62° is not supported.';return;}
  if(typeof Astronomy==='undefined'){msg.textContent='Planet positions need the astronomy library, which did not load.';return;}
  if(!f||!t){msg.textContent='Pick both a from date and a to date.';return;}
  let tzf; try{tzf=tzFn(tzs);}catch(e){msg.textContent='The time zone was not recognised. Use a name such as Asia/Kolkata or hours such as 5.5.';return;}
  const a=f.split('-').map(Number), b=t.split('-').map(Number), nd=Math.round((Date.UTC(b[0],b[1]-1,b[2])-Date.UTC(a[0],a[1]-1,a[2]))/86400000)+1;
  if(nd<1){msg.textContent='The to date must not be before the from date.';return;}
  if(nd>7){msg.textContent='Please choose at most 7 days.';return;}
  const m1=t1.split(':').map(Number), m2=t2.split(':').map(Number); if(m1[0]*60+m1[1]>=m2[0]*60+m2[1]){msg.textContent='The end time must be after the start time.';return;}
  msg.className='msg'; const old=CFG; CFG={lat:lat,lon:lon,kind:kind}; const items=[]; let day=0, n=0; $('ckGo').disabled=true;
  (function step(){
    if(day>=nd){CFG=old;$('ckGo').disabled=false;CK={items:items,f:f,t:t,t1:t1,t2:t2,lat:lat,lon:lon,tzs:tzs,show:show,n:n};ckShow();return;}
    try{
      const dt=new Date(Date.UTC(a[0],a[1]-1,a[2]+day)), y=dt.getUTCFullYear(), m=dt.getUTCMonth()+1, d=dt.getUTCDate();
      const s=localToUtc(y,m,d,0,0,tzs).ms, nx=new Date(Date.UTC(y,m-1,d+1)), e=localToUtc(nx.getUTCFullYear(),nx.getUTCMonth()+1,nx.getUTCDate(),0,0,tzs).ms, off=tzf(s);
      const w1=localToUtc(y,m,d,m1[0],m1[1],tzs).ms, w2=localToUtc(y,m,d,m2[0],m2[1],tzs).ms;
      compute(Math.max(s,w1-3600000),Math.min(e,w2+3600000),lat,lon,kind).forEach(r=>{ if(r.end<=w1||r.start>=w2)return; n++; const x=ckEval(r,lat,lon,kind); if(x)items.push({r:r,x:x,day:s,off:off,w1:w1,w2:w2}); });
    }catch(err){CFG=old;$('ckGo').disabled=false;msg.textContent='Error: '+(err.message||err);return;}
    day++; msg.textContent='Checking day '+day+' of '+nd+'…'; setTimeout(step,0);
  })();
}
let CK=null;
function ckShow(){
  const out=$('ckOut'), L=CK, show=$('ckShow').value; let h='', last=null;
  const lab={wicket:['WICKET POSSIBILITY','விக்கெட் வாய்ப்பு','#c62828'],miss:['WICKET MISSED POSSIBILITY','விக்கெட் தவறும் வாய்ப்பு','#e08a00'],break:['BREAK / ADVERT BREAK POSSIBILITY','இடைவேளை / விளம்பர இடைவேளை வாய்ப்பு','#1f6fb2']};
  const keep=it=>show==='all'||(show==='wb'&&it.x.cls!=='miss'||show==='wb'&&it.x.cls==='miss')||(show==='w'&&(it.x.cls==='wicket'||it.x.cls==='miss'));
  const items=L.items.filter(it=>show==='all'||show==='wb'?true:(it.x.cls==='wicket'||it.x.cls==='miss'));
  const cnt=c=>items.filter(i=>i.x.cls===c).length;
  const tm=(it)=>fmtHMS(Math.max(it.r.start,it.w1),it.off)+' – '+fmtHMS(Math.min(it.r.end,it.w2),it.off);
  h+='<div class="lf-sec"><p class="lf-note" style="margin:2px 0"><b>'+(cnt('wicket')+cnt('miss'))+'</b> '+T60('Wicket possibility')+' · <b>'+cnt('break')+'</b> '+T60('Advert break')+'</p></div>';
  items.forEach(it=>{
    const g=SEGS[it.r.k], isW=it.x.cls!=='break', col=isW?'#c62828':'#1f6fb2';
    if(it.day!==last){last=it.day; h+='<div class="lf-sec"><h3>'+fmtDate(it.day,it.off)+'</h3></div>';}
    h+='<ul class="ckl"><li class="row gm ckrow" data-s="'+Math.max(it.r.start,it.w1)+'" data-e="'+Math.min(it.r.end,it.w2)+'" data-tz="'+it.off+'" data-lat="'+L.lat+'" data-lon="'+L.lon+'" data-kind="'+$('ckAyan').value+'" style="--h:'+HUE[g.sub]+'"><b class="ckt">'+tm(it)+'</b><span class="pill" style="background:'+col+';color:#fff;border-color:'+col+'">'+(isW?T60('Wicket possibility'):T60('Advert break'))+'</span></li></ul>';
  });
  $('ckMsg').textContent=items.length+' timings listed from '+L.f+' to '+L.t+'.';
  if(!items.length)h+='<p class="msg">No timing qualifies in this window. Try another time window or date.</p>'; else h+='<div class="btns"><button id="ckCopy" type="button">Copy as text</button></div>';
  out.innerHTML=h;
  const cb=$('ckCopy'); if(cb)cb.addEventListener('click',()=>{
    const tx='Cricket wicket possibility / advert break timings '+L.f+' to '+L.t+' ('+L.lat+', '+L.lon+', '+L.tzs+')\n'+items.map(it=>fmtDate(it.day,it.off)+'  '+tm(it)+'  '+(it.x.cls==='break'?'ADVERT BREAK':'WICKET POSSIBILITY')).join('\n');
    if(window.GuruApp&&GuruApp.copyText){try{GuruApp.copyText(tx);$('ckMsg').textContent='Copied.';return;}catch(e){}}
    try{navigator.clipboard.writeText(tx).then(()=>{$('ckMsg').textContent='Copied.';},()=>{$('ckMsg').textContent='Copying is blocked here.';});}catch(e){$('ckMsg').textContent='Copying is blocked here.';}
  });
}
function ckFill(){
  const q=$('ckSearch').value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''), cn=$('ckCountry').value, sel=$('ckCity'); let list, tag=false;
  if(cn==='*a'){list=q?WC.filter(x=>plKey(x).indexOf(q)>=0).slice(0,400):[];tag=true;} else list=WC.filter(x=>x.cc===cn&&(!q||plKey(x).indexOf(q)>=0)).slice(0,600);
  if(!list.length)list=webC(q,ckFill); CK_LIST=list; sel.innerHTML=list.length?list.map((x,i)=>'<option value="'+i+'">'+x.n+(x.st?', '+x.st:'')+(tag?', '+x.cc:'')+'</option>').join(''):'<option value="">No match in the offline list. Online search is tried automatically when you are connected</option>'; ckPick();
}
function ckPick(){const x=CK_LIST[parseInt($('ckCity').value,10)]; if(x){$('ckLat').value=x.lat;$('ckLon').value=x.lon;$('ckTz').value=x.tz;} ckOff();}
function ckOff(){const el=$('ckOff'), t=$('ckTz').value.trim(); el.className='msg'; if(!t){el.textContent='';return;} try{el.textContent='Time zone now: '+utcTxt(tzFn(t)(Date.now()))+(/^-?[\d.]+$/.test(t)?'':' ('+t+')');}catch(e){el.textContent='The time zone was not recognised.';el.className='msg err';}}

let CK_LIST=[];
(function initCk(){
  const cs=$('ckCountry'); cs.innerHTML='<option value="*a">All countries (use search)</option>'+CITY.cc.map(n=>'<option value="'+n.replace(/"/g,'&quot;')+'">'+n+'</option>').join('');
  cs.addEventListener('change',ckFill); $('ckSearch').addEventListener('input',ckFill); $('ckCity').addEventListener('change',ckPick); $('ckTz').addEventListener('input',ckOff); ckFill();
  const iso=new Date(Date.now()+TZ*3600000).toISOString().slice(0,10); $('ckFrom').value=iso; $('ckTo').value=iso;
  $('ckShow').addEventListener('change',()=>{if(CK)ckShow();});
  $('ckBtn').addEventListener('click',()=>{ const pn=$('ckPanel'); pn.classList.remove('hide'); if(!$('ckLat').value){$('ckLat').value=$('lat').value;$('ckLon').value=$('lon').value;$('ckTz').value=PL_TZ||$('tz').value;ckOff();} pn.scrollIntoView({block:'start'}); });
  $('ckClose').addEventListener('click',()=>$('ckPanel').classList.add('hide'));
  $('ckGo').addEventListener('click',ckRun);
  $('ckLoc').addEventListener('click',()=>{ const el=$('ckOff'); if(!navigator.geolocation){el.textContent='Location is not available here.';el.className='msg err';return;} el.textContent='Finding your location…';el.className='msg';
    navigator.geolocation.getCurrentPosition(pos=>{$('ckLat').value=pos.coords.latitude.toFixed(4);$('ckLon').value=pos.coords.longitude.toFixed(4);let z='';try{z=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(e){} $('ckTz').value=z||String(-new Date().getTimezoneOffset()/60);$('ckSearch').value='';ckOff();},e=>{el.textContent='Could not get your location. Choose a city instead.';el.className='msg err';},{timeout:15000}); });
})();


/* ---------- v6.3: 3 11 Muhurtham ----------
   1) fixed 3,11 ascendant-lord / star-lord / sub-lord combinations for the 12 ascendants
   2) Author's muhurtham: the sub lord (optionally also star lord and ascendant lord) must be linked with the 2nd, 3rd or 11th house
      and kept away from the 8th and 12th houses. Houses are counted from the transit ascendant sign. All offline. */
const M3_FIX=[[['Ma','Ve','Sa']],[['Ve','Mo','Ju']],[['Me','Ma','Me'],['Me','Ma','Mo'],['Me','Ma','Su']],[['Mo','Me','Ve']],[['Su','Ve','Me']],[['Me','Mo','Mo']],[['Ve','Ju','Su']],[['Ma','Sa','Me'],['Ma','Me','Sa']],[['Ju','Ve','Sa']],[['Sa','Ma','Ma']],[['Sa','Ju','Ju']],[['Ju','Ju','Ma']]];
const M3_FIXSEG=SEGS.map(g=>M3_FIX[g.sign].some(x=>x[0]===g.lord&&x[1]===g.star&&x[2]===g.sub));
const m3e=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const m3ord=n=>n+(n===2?'nd':n===3?'rd':'th');
function m3Ctx(A){
  const LN={}; for(let n=1;n<=12;n++)LN[n]=SIGNS[(A+n-1)%12][1];
  return {A:A,LN:LN};
}
function m3Pos(ms){const P={}; CODES.forEach(c=>{P[c]=sidLon(c,ms);}); return P;}
const M3_POS=[1,2,3,11], M3_NEG=[5,8,9,12];
function m3Test(cx,P,ms,c,all){
  const hn=x=>mod(Math.floor(P[x]/30)%12-cx.A,12)+1, h=hn(c), st=SEGS[findSeg(P[c])].star, hs=hn(st);
  const lordsOf=(y,set)=>set.filter(n=>cx.LN[n]===y);
  const pL=lordsOf(st,M3_POS), nL=lordsOf(st,M3_NEG);
  const pos={house:M3_POS.indexOf(h)>=0, starLord:pL.length>0, starPlaced:M3_POS.indexOf(hs)>=0};
  const neg={own:M3_NEG.some(n=>cx.LN[n]===c&&!(n===8&&cx.LN[1]===c)), house:M3_NEG.indexOf(h)>=0, starLord:nL.length>0, starPlaced:M3_NEG.indexOf(hs)>=0, retro:(c!=='Ra'&&c!=='Ke')&&isRetro(c,ms)};
  const posOk=all?(pos.house&&pos.starLord&&pos.starPlaced):(pos.house||pos.starLord||pos.starPlaced);
  const negAny=neg.own||neg.house||neg.starLord||neg.starPlaced||neg.retro;
  return {ok:posOk&&!negAny,pos:pos,neg:neg,h:h,st:st,hs:hs,pL:pL,nL:nL};
}
function m3Q(cx,P,ms,g,level,all){
  if(!m3Test(cx,P,ms,g.sub,all).ok)return false;
  if(level>=2&&!m3Test(cx,P,ms,g.star,all).ok)return false;
  if(level>=3&&!m3Test(cx,P,ms,g.lord,all).ok)return false;
  return true;
}
function m3Iv(a,b,q){   // the parts of [a,b] where q is true (a planet may change sign or star inside one segment)
  const qa=q(a), qb=q(b), qm=q((a+b)/2);
  const go=(x,y,qx,qy,d)=>{ if(qx===qy)return qx?[[x,y]]:[]; if(y-x<2000||d>=12){const m=(x+y)/2; return qx?[[x,m]]:[[m,y]];} const m=(x+y)/2, qq=q(m); return go(x,m,qx,qq,d+1).concat(go(m,y,qq,qy,d+1)); };
  const mid=(a+b)/2; return go(a,mid,qa,qm,0).concat(go(mid,b,qm,qb,0)).reduce((o,v)=>{const l=o[o.length-1]; if(l&&Math.abs(l[1]-v[0])<1)l[1]=v[1]; else o.push([v[0],v[1]]); return o;},[]);
}
function m3Why(cx,P,ms,g,level,all){   // one short line per planet: why it passes
  const lab=[['Lord',g.lord],['Star',g.star],['Sub',g.sub]], out=[];
  lab.forEach((x,i)=>{
    if(i===0&&level<3||i===1&&level<2)return;
    const t=m3Test(cx,P,ms,x[1],all), r=[];
    if(t.pos.house)r.push('H'+t.h);
    if(t.pos.starLord)r.push('★'+t.pL.map(n=>n+'L').join('/')+' '+t.st);
    if(t.pos.starPlaced)r.push('★'+t.st+' in H'+t.hs);
    out.push('<b>'+x[0]+' '+x[1]+'</b> '+r.join(' · '));
  });
  return out.join(' &nbsp;|&nbsp; ');
}
let M3={mode:'all',items:null,meta:null}, M3_LIST=[];
function m3Row(g,s,e,off,meta,pills,chk){
  return '<li class="row gm m3row" data-s="'+Math.round(s)+'" data-e="'+Math.round(e)+'" data-tz="'+off+'" data-lat="'+meta.lat+'" data-lon="'+meta.lon+'" data-kind="'+meta.kind+'" style="--h:'+HUE[g.sub]+'">'+
    '<div class="t2"><div><span>Begin</span><b>'+fmtHMS(s,off)+'</b></div><div><span>End</span><b>'+fmtHMS(e,off)+'</b></div></div>'+
    '<div class="l"><span class="n">'+NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub]+'</span><span class="pl">'+pills+'</span><span class="ta">'+tl(g)+'</span><span class="c">'+SIGNS[g.sign][0]+' ascendant · '+TLAG[g.sign]+' லக்னம்</span></div>'+
    '<div class="chk">'+chk+'</div>'+
    '<div class="p"><span>'+span(g)+' · '+NAKS[g.nak]+'</span><span>lasts '+dur(e-s)+'</span></div></li>';
}
function m3Compact(g,it,meta){
  const P=m3Pos((it.a+it.b)/2), why=m3Why(m3Ctx(g.sign),P,(it.a+it.b)/2,g,meta.level,meta.all), sn=SIGNS[g.sign][0];
  return '<li class="row gm m3row m3c" data-s="'+Math.round(it.a)+'" data-e="'+Math.round(it.b)+'" data-tz="'+it.off+'" data-lat="'+meta.lat+'" data-lon="'+meta.lon+'" data-kind="'+meta.kind+'" style="--h:'+HUE[g.sub]+'">'+
    '<div class="m3n"><b>'+NAME[g.lord]+'</b><i>/</i><b>'+NAME[g.star]+'</b><i>/</i><b>'+NAME[g.sub]+'</b><small>'+sn+' ascendant</small></div>'+
    '<div class="m3t">'+fmtHMS(it.a,it.off)+' – '+fmtHMS(it.b,it.off)+'</div><div class="m3d">'+dur(it.b-it.a)+'</div>'+
    '<div class="m3r">'+why+'</div>'+
    '<div class="l m3x"><span class="n">'+NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub]+'</span><span class="pl"><span class="pill gain">Author’s Muhurtham · ஆசிரியர் முகூர்த்தம்</span></span><span class="ta">'+tl(g)+'</span><span class="c">'+sn+' ascendant · '+TLAG[g.sign]+' லக்னம்</span></div></li>';
}
function m3Show(){
  const out=$('m3Out'), D=M3.items, meta=M3.meta; if(!D){out.innerHTML='';return;}
  const auth=meta.mode==='auth'; let h='', last=null, ul=false;
  D.forEach(it=>{
    if(it.day!==last){ if(ul)h+='</ul>'; last=it.day; h+='<div class="lf-sec"><h3>'+fmtDate(it.day,it.off)+'</h3></div>'+(auth?'<div class="m3hd"><span>Asc lord / Star lord / Sub lord</span><span>From – To · Duration</span></div>':'')+'<ul class="list">'; ul=true; }
    const g=SEGS[it.k];
    if(auth){ h+=m3Compact(g,it,meta); return; }
    let pills, chk;
    if(!auth){
      pills='<span class="pill gain">3 11 Muhurtham · 3 11 முகூர்த்தம்</span>';
      chk='3,11 combination for '+SIGNS[g.sign][0]+' ascendant: ascendant lord <b>'+NAME[g.lord]+'</b>, star lord <b>'+NAME[g.star]+'</b>, sub lord <b>'+NAME[g.sub]+'</b>.';
    }
    h+=m3Row(g,it.a,it.b,it.off,meta,pills,chk);
  });
  if(ul)h+='</ul>';
  $('m3Msg').className='msg'; $('m3Msg').textContent=D.length+' timings listed from '+meta.f+' to '+meta.t+'.';
  if(!D.length)h='<p class="msg">No timing qualifies in this window. Try another date or time window.</p>'; else h+='<div class="btns"><button id="m3Copy" type="button">Copy as text</button></div>';
  out.innerHTML=h;
  const cb=$('m3Copy'); if(cb)cb.addEventListener('click',()=>{
    const tx=(auth?'3 11 Author’s Muhurtham ':'3 11 Muhurtham all timings ')+meta.f+' to '+meta.t+' ('+meta.lat+', '+meta.lon+', '+meta.tzs+')\n'+D.map(it=>{const g=SEGS[it.k]; return fmtDate(it.day,it.off)+'  '+fmtHMS(it.a,it.off)+' – '+fmtHMS(it.b,it.off)+'  '+SIGNS[g.sign][0]+' ascendant  '+NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub];}).join('\n');
    if(window.GuruApp&&GuruApp.copyText){try{GuruApp.copyText(tx);$('m3Msg').textContent='Copied.';return;}catch(e){}}
    try{navigator.clipboard.writeText(tx).then(()=>{$('m3Msg').textContent='Copied.';},()=>{$('m3Msg').textContent='Copying is blocked here.';});}catch(e){$('m3Msg').textContent='Copying is blocked here.';}
  });
}
function m3Run(){
  const msg=$('m3Msg'), out=$('m3Out'); msg.className='msg err'; out.innerHTML=''; M3.items=null;
  const lat=parseFloat($('m3Lat').value), lon=parseFloat($('m3Lon').value), tzs=$('m3Tz').value.trim(), f=$('m3From').value, t=$('m3To').value, kind=$('m3Ayan').value, t1=$('m3T1').value||'00:00', t2=$('m3T2').value||'23:59', mode=M3.mode;
  if(isNaN(lat)||isNaN(lon)||!tzs){msg.textContent='Choose a place (or enter latitude, longitude and time zone).';return;}
  if(Math.abs(lat)>62){msg.textContent='Latitude beyond 62° is not supported.';return;}
  if(typeof Astronomy==='undefined'){msg.textContent='Planet positions need the astronomy library, which did not load.';return;}
  if(!f||!t){msg.textContent='Pick both a from date and a to date.';return;}
  let tzf; try{tzf=tzFn(tzs);}catch(e){msg.textContent='The time zone was not recognised. Use a name such as Asia/Kolkata or hours such as 5.5.';return;}
  const a=f.split('-').map(Number), b=t.split('-').map(Number), nd=Math.round((Date.UTC(b[0],b[1]-1,b[2])-Date.UTC(a[0],a[1]-1,a[2]))/86400000)+1;
  if(nd<1){msg.textContent='The to date must not be before the from date.';return;}
  if(nd>7){msg.textContent='Please choose at most 7 days.';return;}
  const m1=t1.split(':').map(Number), m2=t2.split(':').map(Number), full=(t2==='23:59');
  if(!full&&m1[0]*60+m1[1]>=m2[0]*60+m2[1]){msg.textContent='The end time must be after the start time.';return;}
  const sgv=$('m3Sign').value, level=parseInt($('m3Level').value,10)||3, allM=$('m3Match').value==='all';
  msg.className='msg'; const old=CFG; CFG={lat:lat,lon:lon,kind:kind}; const items=[]; let day=0; $('m3Go').disabled=true;
  (function step(){
    if(day>=nd){CFG=old;$('m3Go').disabled=false;M3.items=items;M3.meta={f:f,t:t,lat:lat,lon:lon,tzs:tzs,kind:kind,mode:mode,level:level,all:allM};m3Show();return;}
    try{
      const dt=new Date(Date.UTC(a[0],a[1]-1,a[2]+day)), y=dt.getUTCFullYear(), m=dt.getUTCMonth()+1, d=dt.getUTCDate();
      const s=localToUtc(y,m,d,0,0,tzs).ms, nx=new Date(Date.UTC(y,m-1,d+1)), e=localToUtc(nx.getUTCFullYear(),nx.getUTCMonth()+1,nx.getUTCDate(),0,0,tzs).ms, off=tzf(s);
      const w1=localToUtc(y,m,d,m1[0],m1[1],tzs).ms, w2=full?e:localToUtc(y,m,d,m2[0],m2[1],tzs).ms;
      compute(Math.max(s,w1-3600000),Math.min(e,w2+3600000),lat,lon,kind).forEach(r=>{
        const x=Math.max(r.start,w1), y2=Math.min(r.end,w2); if(y2-x<500)return;
        const g=SEGS[r.k];
        if(mode==='all'){
          if(!M3_FIXSEG[r.k])return; if(sgv!=='*'&&g.sign!==+sgv)return;
          items.push({k:r.k,a:x,b:y2,day:s,off:off});
        }else{
          const cx=m3Ctx(g.sign);
          m3Iv(x,y2,ms=>m3Q(cx,m3Pos(ms),ms,g,level,allM)).forEach(v=>{ if(v[1]-v[0]>=500)items.push({k:r.k,a:v[0],b:v[1],day:s,off:off}); });
        }
      });
    }catch(err){CFG=old;$('m3Go').disabled=false;msg.textContent='Error: '+(err.message||err);return;}
    day++; msg.textContent='Checking day '+day+' of '+nd+'…'; setTimeout(step,0);
  })();
}
function m3Tab(mode){
  M3.mode=mode; M3.items=null; $('m3Out').innerHTML=''; $('m3Msg').textContent='';
  $('m3TabA').classList.toggle('on',mode==='all'); $('m3TabB').classList.toggle('on',mode==='auth');
  $('m3TabA').setAttribute('aria-selected',mode==='all'); $('m3TabB').setAttribute('aria-selected',mode==='auth');
  document.querySelectorAll('#m3Panel .m3a').forEach(x=>x.classList.toggle('hide',mode!=='all'));
  document.querySelectorAll('#m3Panel .m3b').forEach(x=>x.classList.toggle('hide',mode!=='auth'));
  $('m3Go').textContent=mode==='all'?'Find 3 11 Timings':'Find Author’s Muhurtham';
}
function m3FillStates(){
  const cn=$('m3Country').value, el=$('m3State');
  if(cn==='*a'){el.innerHTML='<option value="*s">All states</option>';return;}
  const l=STBY[cn]||[];
  el.innerHTML='<option value="*s">All states ('+l.filter(Boolean).length+')</option>'+l.map(n=>'<option value="'+m3e(n)+'">'+m3e(n||'(state not listed)')+'</option>').join('');
}
function m3Fill(){
  const q=$('m3Search').value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''), cn=$('m3Country').value, stv=$('m3State').value, all=cn==='*a';
  let src=all?WC:(WCBY[cn]||[]); if(!all&&stv!=='*s')src=src.filter(x=>(x.st||'')===stv);
  const cap=all?300:700; let list=[];
  if(all&&!q)list=[]; else if(!q)list=src.slice(0,cap);
  else{const a=[],b=[]; for(let i=0;i<src.length&&a.length<cap;i++){const k=plKey(src[i]),at=k.indexOf(q); if(at===0)a.push(src[i]); else if(at>0&&b.length<cap)b.push(src[i]);} list=a.concat(b).slice(0,cap);}
  if(!list.length)list=webC(q,m3Fill); M3_LIST=list; const sel=$('m3City');
  sel.innerHTML=list.length?list.map((x,i)=>'<option value="'+i+'">'+m3e(x.n)+((all||stv==='*s')&&x.st?', '+m3e(x.st):'')+(all?', '+m3e(x.cc):'')+'</option>').join(''):'<option value="">No match in the offline list. Online search is tried automatically when you are connected</option>';
  m3Pick();
}
function m3Pick(){const x=M3_LIST[parseInt($('m3City').value,10)]; if(x){$('m3Lat').value=x.lat;$('m3Lon').value=x.lon;$('m3Tz').value=x.tz;} m3Off();}
function m3Off(){const el=$('m3Off'), t=$('m3Tz').value.trim(); el.className='msg'; if(!t){el.textContent='';return;} try{el.textContent='Time zone now: '+utcTxt(tzFn(t)(Date.now()))+(/^-?[\d.]+$/.test(t)?'':' ('+t+')');}catch(e){el.textContent='The time zone was not recognised.';el.className='msg err';}}
(function initM3(){
  const cs=$('m3Country'); cs.innerHTML='<option value="*a">All countries (use search)</option>'+CITY.cc.map(n=>'<option value="'+n.replace(/"/g,'&quot;')+'">'+n+'</option>').join('');
  cs.addEventListener('change',()=>{m3FillStates();m3Fill();}); $('m3State').addEventListener('change',m3Fill); $('m3Search').addEventListener('input',m3Fill); $('m3City').addEventListener('change',m3Pick); $('m3Tz').addEventListener('input',m3Off);
  m3FillStates(); m3Fill();
  const iso=new Date(Date.now()+TZ*3600000).toISOString().slice(0,10); $('m3From').value=iso; $('m3To').value=iso;
  $('m3TabA').addEventListener('click',()=>m3Tab('all')); $('m3TabB').addEventListener('click',()=>m3Tab('auth'));
  $('m3Btn').addEventListener('click',()=>{ const pn=$('m3Panel'); pn.classList.remove('hide'); if(!M3.opened){ $('m3Lat').value=$('lat').value;$('m3Lon').value=$('lon').value;$('m3Tz').value=PL_TZ||$('tz').value;m3Off(); } M3.opened=true; pn.scrollIntoView({block:'start'}); });
  $('m3Close').addEventListener('click',()=>$('m3Panel').classList.add('hide'));
  $('m3Go').addEventListener('click',m3Run);
  $('m3Loc').addEventListener('click',()=>{ const el=$('m3Off'); if(!navigator.geolocation){el.textContent='Location is not available here.';el.className='msg err';return;} el.textContent='Finding your location…';el.className='msg';
    navigator.geolocation.getCurrentPosition(pos=>{$('m3Lat').value=pos.coords.latitude.toFixed(4);$('m3Lon').value=pos.coords.longitude.toFixed(4);let z='';try{z=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(e){} $('m3Tz').value=z||String(-new Date().getTimezoneOffset()/60);$('m3Search').value='';m3Off();},e=>{el.textContent='Could not get your location. Choose a city instead.';el.className='msg err';},{timeout:15000}); });
  window.GA_M3={ctx:m3Ctx,test:m3Test,q:m3Q,why:m3Why,fix:M3_FIXSEG,isRetro:isRetro,pos:m3Pos,iv:m3Iv,segs:SEGS,find:findSeg};
})();



/* ---------- v6.7: Trade Profit ----------
   Rules found from two profitable trades (Pallavaram 2026-02-01 11:40:59 and 2026-02-02 15:01 IST):
   1 Moon's star lord signifies the 11th   2 5th cusp sub lord signifies the 11th   3 6th cusp sub lord signifies the 11th
   4 no loss: ascendant star lord and sub lord do not signify the 12th without the 11th      Strong: Moon's sub lord signifies the 8th
   Significators are the usual KP ones on the Placidus cusps (same method as the Speculation research). Everything is calculated offline. */
const TP_LAT=12.9675, TP_LON=80.1491, TP_TZ=5.5;
const TP_TRADES=[[2026,2,1,11,40,59],[2026,2,2,15,1,0]];
function tpEval(ms,lat,lon,kind){
  const asc=sidAsc(ms,lat,lon,kind), g=SEGS[findSeg(asc)], cu=placidusCusps(ms,lat,lon,kind);
  const seg=i=>SEGS[findSeg(cu[i-1])];
  const bh=l=>{for(let i=0;i<12;i++){const a=cu[i],b=cu[(i+1)%12];if(mod(l-a,360)<mod(b-a,360))return i+1;}return 1;};
  const P={}; CODES.forEach(c=>{P[c]=sidLon(c,ms);});
  const own={}; CODES.forEach(c=>{own[c]=[];}); for(let i=1;i<=12;i++)own[seg(i).lord].push(i);
  const sgOf=c=>SEGS[findSeg(P[c])];
  const ownOf=c=>(c==='Ra'||c==='Ke')?(own[sgOf(c).lord]||[]):(own[c]||[]);
  const sig=c=>{const st=sgOf(c).star, s=new Set([bh(P[st]),bh(P[c])]); ownOf(st).forEach(x=>s.add(x)); ownOf(c).forEach(x=>s.add(x)); return s;};
  const Mo=sgOf('Mo'), p={MS:Mo.star,MB:Mo.sub,C5:seg(5).sub,C6:seg(6).sub,AS:g.star,AB:g.sub};
  const S={}; Object.keys(p).forEach(k=>{S[k]=sig(p[k]);});
  const loss=s=>s.has(12)&&!s.has(11);
  const c={tp1:S.MS.has(11),tp2:S.C5.has(11),tp3:S.C6.has(11),tp4:!loss(S.AS)&&!loss(S.AB),strong:S.MB.has(8)};
  return {ok:c.tp1&&c.tp2&&c.tp3&&c.tp4,strong:c.strong,c:c,S:S,p:p,g:g,cu:cu,P:P,bh:bh,sig:sig,own:own,seg:seg};
}
function tpScan(a,b,lat,lon,kind,strongOnly){
  const f=ms=>{const e=tpEval(ms,lat,lon,kind); return (e.ok&&(!strongOnly||e.strong))?(e.p.MS+e.p.C5+e.p.C6+e.p.MB+(e.strong?'S':'-')):'';};
  const STEP=30000, out=[]; let t=a, k=f(a), s0=k?a:null;
  while(t<b){
    const t2=Math.min(t+STEP,b), k2=f(t2);
    if(k2!==k){
      let lo=t, hi=t2; for(let i=0;i<7;i++){const m=(lo+hi)/2; if(f(m)===k)lo=m; else hi=m;}
      const x=(lo+hi)/2;
      if(k)out.push([s0,x]);
      s0=k2?x:null; k=k2;
    }
    t=t2;
  }
  if(k)out.push([s0,b]);
  return out;
}
const tpH=s=>Array.from(s).sort((x,y)=>x-y).join(',');
function tpReason(e){
  const n=c=>NAME[c], S=e.S, p=e.p;
  return '<b>Moon’s star lord</b> '+n(p.MS)+' → '+tpH(S.MS)+' · <b>5th cusp sub</b> '+n(p.C5)+' → '+tpH(S.C5)+' · <b>6th cusp sub</b> '+n(p.C6)+' → '+tpH(S.C6)+' · <b>No loss</b> ✓ · <b>Moon’s sub lord</b> '+n(p.MB)+' → '+tpH(S.MB)+(e.strong?' <b>(signifies 8: Strong)</b>':'');
}
let TP={items:null,meta:null}, TP_LIST=[];
function tpRow(it,meta){
  const subs=it.subs, ns=subs.filter(x=>x.e.strong).length, e0=subs[0].e, g=e0.g, sn=SIGNS[g.sign][0], off=it.off;
  const strongTxt=subs.filter(x=>x.e.strong).map(x=>fmtHMS(x.a,off)+'–'+fmtHMS(x.b,off)).join(', ');
  const lst=subs.map(x=>'<div>'+fmtHMS(x.a,off)+' – '+fmtHMS(x.b,off)+(x.e.strong?' <b>Strong</b>':'')+' · Moon ★'+NAME[x.e.p.MS]+' [' +tpH(x.e.S.MS)+'] · 5th '+NAME[x.e.p.C5]+' [' +tpH(x.e.S.C5)+'] · 6th '+NAME[x.e.p.C6]+' [' +tpH(x.e.S.C6)+'] · Moon sub '+NAME[x.e.p.MB]+' [' +tpH(x.e.S.MB)+']</div>').join('');
  return '<li class="row gm m3row m3c tprow" data-s="'+Math.round(it.a)+'" data-e="'+Math.round(it.b)+'" data-tz="'+off+'" data-lat="'+meta.lat+'" data-lon="'+meta.lon+'" data-kind="'+meta.kind+'" style="--h:'+HUE[e0.p.MB]+'">'+
    '<div class="m3n"><b>Trade profit</b>'+(ns?'<span class="stg">'+(ns===subs.length?'Strong':'Strong in part')+'</span>':'')+'<small>'+subs.length+' sub-timing'+(subs.length>1?'s':'')+(ns?' · '+ns+' Strong':'')+'</small></div>'+
    '<div class="m3t">'+fmtHMS(it.a,off)+' – '+fmtHMS(it.b,off)+'</div><div class="m3d">'+dur(it.b-it.a)+'</div>'+
    '<div class="m3r">'+(strongTxt?'<b>Strong:</b> '+strongTxt:'Meets the 4 rules')+'<details class="tpd"><summary>Show sub-timings and reasons</summary>'+lst+'<div>Every sub-timing: Moon’s star lord, 5th and 6th cusp sub lords signify the 11th [houses signified], and there is no loss.</div></details></div>'+
    '<div class="l m3x"><span class="n">'+NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub]+'</span><span class="pl"><span class="pill gain">Trade Profit · வர்த்தக லாபம்</span>'+(ns?'<span class="pill gain">Strong</span>':'')+'</span><span class="ta">'+tl(g)+'</span><span class="c">'+sn+' ascendant · '+TLAG[g.sign]+' லக்னம்</span></div></li>';
}
function tpShow(){
  const out=$('tpOut'), D=TP.items, meta=TP.meta; if(!D){out.innerHTML='';return;}
  let h='', last=null, ul=false, ns=0;
  D.forEach(it=>{
    if(it.day!==last){ if(ul)h+='</ul>'; last=it.day; h+='<div class="lf-sec"><h3>'+fmtDate(it.day,it.off)+'</h3></div><div class="m3hd"><span>Rules met</span><span>From – To · Duration</span></div><ul class="list">'; ul=true; }
    ns+=it.subs.filter(x=>x.e.strong).length;
    h+=tpRow(it,meta);
  });
  if(ul)h+='</ul>';
  $('tpMsg').className='msg'; $('tpMsg').textContent=D.length+' windows ('+ns+' Strong sub-timings) from '+meta.f+' to '+meta.t+'.';
  if(!D.length)h='<p class="msg">No timing meets the rules in this window. Try more days or a wider time window.</p>'; else h+='<div class="btns"><button id="tpCopy" type="button">Copy as text</button></div>';
  out.innerHTML=h;
  const cb=$('tpCopy'); if(cb)cb.addEventListener('click',()=>{
    const tx='Trade Profit timings '+meta.f+' to '+meta.t+' ('+meta.lat+', '+meta.lon+', '+meta.tzs+')\n'+D.map(it=>fmtDate(it.day,it.off)+'  '+fmtHMS(it.a,it.off)+' – '+fmtHMS(it.b,it.off)+(it.subs.some(x=>x.e.strong)?'  STRONG '+it.subs.filter(x=>x.e.strong).map(x=>fmtHMS(x.a,it.off)+'-'+fmtHMS(x.b,it.off)).join(', '):'')).join('\n');
    if(window.GuruApp&&GuruApp.copyText){try{GuruApp.copyText(tx);$('tpMsg').textContent='Copied.';return;}catch(e){}}
    try{navigator.clipboard.writeText(tx).then(()=>{$('tpMsg').textContent='Copied.';},()=>{$('tpMsg').textContent='Copying is blocked here.';});}catch(e){$('tpMsg').textContent='Copying is blocked here.';}
  });
}
function tpRun(){
  const msg=$('tpMsg'), out=$('tpOut'); msg.className='msg err'; out.innerHTML=''; TP.items=null;
  const lat=parseFloat($('tpLat').value), lon=parseFloat($('tpLon').value), tzs=$('tpTz').value.trim(), f=$('tpFrom').value, t=$('tpTo').value, kind=$('tpAyan').value, t1=$('tpT1').value||'09:15', t2=$('tpT2').value||'15:30', strongOnly=$('tpShow').value==='strong';
  if(isNaN(lat)||isNaN(lon)||!tzs){msg.textContent='Choose a place (or enter latitude, longitude and time zone).';return;}
  if(Math.abs(lat)>62){msg.textContent='Latitude beyond 62° is not supported.';return;}
  if(typeof Astronomy==='undefined'){msg.textContent='Planet positions need the astronomy library, which did not load.';return;}
  if(!f||!t){msg.textContent='Pick both a from date and a to date.';return;}
  let tzf; try{tzf=tzFn(tzs);}catch(e){msg.textContent='The time zone was not recognised. Use a name such as Asia/Kolkata or hours such as 5.5.';return;}
  const a=f.split('-').map(Number), b=t.split('-').map(Number), nd=Math.round((Date.UTC(b[0],b[1]-1,b[2])-Date.UTC(a[0],a[1]-1,a[2]))/86400000)+1;
  if(nd<1){msg.textContent='The to date must not be before the from date.';return;}
  if(nd>7){msg.textContent='Please choose at most 7 days.';return;}
  const m1=t1.split(':').map(Number), m2=t2.split(':').map(Number);
  if(m1[0]*60+m1[1]>=m2[0]*60+m2[1]){msg.textContent='The end time must be after the start time.';return;}
  msg.className='msg'; const old=CFG; CFG={lat:lat,lon:lon,kind:kind}; const items=[]; let day=0; $('tpGo').disabled=true;
  (function step(){
    if(day>=nd){CFG=old;$('tpGo').disabled=false;TP.items=items;TP.meta={f:f,t:t,lat:lat,lon:lon,tzs:tzs,kind:kind};tpShow();return;}
    try{
      const dt=new Date(Date.UTC(a[0],a[1]-1,a[2]+day)), y=dt.getUTCFullYear(), m=dt.getUTCMonth()+1, d=dt.getUTCDate();
      const s=localToUtc(y,m,d,0,0,tzs).ms, off=tzf(s);
      const w1=localToUtc(y,m,d,m1[0],m1[1],tzs).ms, w2=localToUtc(y,m,d,m2[0],m2[1],tzs).ms;
      let cur=null;
      tpScan(w1,w2,lat,lon,kind,strongOnly).forEach(v=>{ if(v[1]-v[0]<1000)return; const sub={a:v[0],b:v[1],e:tpEval((v[0]+v[1])/2,lat,lon,kind)};
        if(cur&&sub.a-cur.b<1500){cur.b=sub.b;cur.subs.push(sub);} else {cur={a:sub.a,b:sub.b,day:s,off:off,subs:[sub]};items.push(cur);} });
    }catch(err){CFG=old;$('tpGo').disabled=false;msg.textContent='Error: '+(err.message||err);return;}
    day++; msg.textContent='Checking day '+day+' of '+nd+'…'; setTimeout(step,0);
  })();
}
function tpEvidence(){
  const old=CFG; CFG={lat:TP_LAT,lon:TP_LON,kind:'kp'}; let h='';
  try{
    TP_TRADES.forEach((t,i)=>{
      const ms=Date.UTC(t[0],t[1]-1,t[2],t[3],t[4],t[5])-TP_TZ*3600000, e=tpEval(ms,TP_LAT,TP_LON,'kp'), g=e.g, n=c=>NAME[c];
      const pos=l=>{const q=SEGS[findSeg(l)]; return SIGNS[q.sign][0]+' '+dms(l-q.sign*30)+' · '+n(q.lord)+'/'+n(q.star)+'/'+n(q.sub);};
      h+='<h4>Trade '+(i+1)+': '+t[2]+' '+['','Jan','Feb'][t[1]]+' '+t[0]+', '+p2(t[3])+':'+p2(t[4])+':'+p2(t[5])+' IST · Pallavaram</h4>';
      h+='<p class="legend" style="margin:2px 0">Ascendant '+pos(e.cu[0])+'</p>';
      h+='<div class="tblw"><table><thead><tr><th>Planet</th><th>Position · lord/star/sub</th><th>House (cusp)</th></tr></thead><tbody>'+
        CODES.map(c=>'<tr><td>'+n(c)+(isRetro(c,ms)?' (R)':'')+'</td><td>'+pos(e.P[c])+'</td><td>'+e.bh(e.P[c])+'</td></tr>').join('')+'</tbody></table></div>';
      h+='<div class="tblw"><table><thead><tr><th>Cusp</th><th>Position · lord/star/sub</th><th>Sub lord signifies</th></tr></thead><tbody>'+
        [1,2,3,4,5,6,7,8,9,10,11,12].map(k=>'<tr><td>'+k+'</td><td>'+pos(e.cu[k-1])+'</td><td>'+tpH(e.sig(e.seg(k).sub))+'</td></tr>').join('')+'</tbody></table></div>';
      const ck=(ok,txt)=>'<tr><td>'+txt+'</td><td class="'+(ok?'okc':'nokc')+'">'+(ok?'✓':'✗')+'</td></tr>';
      h+='<div class="tblw"><table><thead><tr><th>Rule</th><th></th></tr></thead><tbody>'+
        ck(e.c.tp1,'1 Moon’s star lord '+n(e.p.MS)+' signifies 11 ['+tpH(e.S.MS)+']')+ck(e.c.tp2,'2 5th cusp sub lord '+n(e.p.C5)+' signifies 11 ['+tpH(e.S.C5)+']')+
        ck(e.c.tp3,'3 6th cusp sub lord '+n(e.p.C6)+' signifies 11 ['+tpH(e.S.C6)+']')+ck(e.c.tp4,'4 No loss: ascendant star lord '+n(e.p.AS)+' ['+tpH(e.S.AS)+'], sub lord '+n(e.p.AB)+' ['+tpH(e.S.AB)+']')+
        ck(e.c.strong,'Strong: Moon’s sub lord '+n(e.p.MB)+' signifies 8 ['+tpH(e.S.MB)+']')+'</tbody></table></div>';
    });
  }finally{CFG=old;}
  $('tpEv').innerHTML=h;
}
function tpFillStates(){
  const cn=$('tpCountry').value, el=$('tpState');
  if(cn==='*a'){el.innerHTML='<option value="*s">All states</option>';return;}
  const l=STBY[cn]||[];
  el.innerHTML='<option value="*s">All states ('+l.filter(Boolean).length+')</option>'+l.map(n=>'<option value="'+m3e(n)+'">'+m3e(n||'(state not listed)')+'</option>').join('');
}
function tpFill(){
  const q=$('tpSearch').value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''), cn=$('tpCountry').value, stv=$('tpState').value, all=cn==='*a';
  let src=all?WC:(WCBY[cn]||[]); if(!all&&stv!=='*s')src=src.filter(x=>(x.st||'')===stv);
  const cap=all?300:700; let list=[];
  if(all&&!q)list=[]; else if(!q)list=src.slice(0,cap);
  else{const a=[],b=[]; for(let i=0;i<src.length&&a.length<cap;i++){const k=plKey(src[i]),at=k.indexOf(q); if(at===0)a.push(src[i]); else if(at>0&&b.length<cap)b.push(src[i]);} list=a.concat(b).slice(0,cap);}
  if(!list.length)list=webC(q,tpFill); TP_LIST=list; const sel=$('tpCity');
  sel.innerHTML=list.length?list.map((x,i)=>'<option value="'+i+'">'+m3e(x.n)+((all||stv==='*s')&&x.st?', '+m3e(x.st):'')+(all?', '+m3e(x.cc):'')+'</option>').join(''):'<option value="">No match in the offline list. Online search is tried automatically when you are connected</option>';
  tpPick();
}
function tpPick(){const x=TP_LIST[parseInt($('tpCity').value,10)]; if(x){$('tpLat').value=x.lat;$('tpLon').value=x.lon;$('tpTz').value=x.tz;} tpOff();}
function tpOff(){const el=$('tpOff'), t=$('tpTz').value.trim(); el.className='msg'; if(!t){el.textContent='';return;} try{el.textContent='Time zone now: '+utcTxt(tzFn(t)(Date.now()))+(/^-?[\d.]+$/.test(t)?'':' ('+t+')');}catch(e){el.textContent='The time zone was not recognised.';el.className='msg err';}}
(function initTp(){
  const cs=$('tpCountry'); cs.innerHTML='<option value="*a">All countries (use search)</option>'+CITY.cc.map(n=>'<option value="'+n.replace(/"/g,'&quot;')+'">'+n+'</option>').join('');
  cs.addEventListener('change',()=>{tpFillStates();tpFill();}); $('tpState').addEventListener('change',tpFill); $('tpSearch').addEventListener('input',tpFill); $('tpCity').addEventListener('change',tpPick); $('tpTz').addEventListener('input',tpOff);
  tpFillStates(); tpFill();
  const iso=new Date(Date.now()+TZ*3600000).toISOString().slice(0,10); $('tpFrom').value=iso; $('tpTo').value=iso;
  let opened=false, evDone=false;
  $('tpBtn').addEventListener('click',()=>{ const pn=$('tpPanel'); pn.classList.remove('hide'); if(!opened){ $('tpLat').value=$('lat').value;$('tpLon').value=$('lon').value;$('tpTz').value=PL_TZ||$('tz').value;tpOff(); opened=true; } pn.scrollIntoView({block:'start'}); });
  $('tpEvD').addEventListener('toggle',()=>{ if($('tpEvD').open&&!evDone){ try{tpEvidence(); evDone=true;}catch(e){$('tpEv').textContent='Could not prepare the analysis: '+(e.message||e);} } });
  $('tpClose').addEventListener('click',()=>$('tpPanel').classList.add('hide'));
  $('tpGo').addEventListener('click',tpRun);
  $('tpLoc').addEventListener('click',()=>{ const el=$('tpOff'); if(!navigator.geolocation){el.textContent='Location is not available here.';el.className='msg err';return;} el.textContent='Finding your location…';el.className='msg';
    navigator.geolocation.getCurrentPosition(pos=>{$('tpLat').value=pos.coords.latitude.toFixed(4);$('tpLon').value=pos.coords.longitude.toFixed(4);let z='';try{z=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(e){} $('tpTz').value=z||String(-new Date().getTimezoneOffset()/60);$('tpSearch').value='';tpOff();},e=>{el.textContent='Could not get your location. Choose a city instead.';el.className='msg err';},{timeout:15000}); });
  window.GA_TP={eval:tpEval,scan:tpScan,spFeat:spFeat};
})();



/* ---------- v6.8: Market Transit ----------
   A rule-based "planetary pressure index" built from the real transit positions (offline). It is NOT a price feed: the candles are
   synthetic and show the planets' bullish/bearish pressure and volatility, drawn as candles so patterns can be read. Research only. */
const MK_X={Su:0,Mo:1,Ma:9,Me:5,Ju:3,Ve:11,Sa:6}, MK_DB={Su:6,Mo:7,Ma:3,Me:11,Ju:9,Ve:5,Sa:0}, MK_OW={Su:[4],Mo:[3],Ma:[0,7],Me:[2,5],Ju:[8,11],Ve:[1,6],Sa:[9,10]};
const MK_VOL={Su:.1,Ma:.9,Me:.35,Ju:.1,Ve:.1,Sa:.4,Ra:.8,Ke:.6};
const MK_SEC={Su:'PSU, power, pharma',Mo:'FMCG, retail, liquidity',Ma:'real estate, metals, defence',Me:'IT, telecom, trading',Ju:'banks, finance, gold',Ve:'auto, luxury, media',Sa:'infra, oil, metals',Ra:'IT, tech, aviation',Ke:'pharma, chemicals'};
const MK_ASP=[[0,'conjunction'],[60,'sextile'],[90,'square'],[120,'trine'],[180,'opposition']];
const mkBen=c=>c==='Ju'||c==='Ve'||c==='Me', mkMal=c=>c==='Sa'||c==='Ma'||c==='Ra'||c==='Ke';
const mkDig=(c,sg)=>MK_X[c]===sg?1:(MK_OW[c]||[]).indexOf(sg)>=0?.5:MK_DB[c]===sg?-1:0;
const mkAng=(a,b)=>{const d=Math.abs(a-b)%360; return d>180?360-d:d;};
const mkClamp=(x,a,b)=>Math.max(a,Math.min(b,x));
/* candlestick and chart patterns on the candles */
function mkPatterns(C){
  const P=[], n=C.length, lines=[];
  const col=x=>x.c>=x.o?1:-1, body=x=>Math.abs(x.c-x.o), rng=x=>x.h-x.l, up=x=>x.h-Math.max(x.o,x.c), lw=x=>Math.min(x.o,x.c)-x.l;
  const avgB=i=>{let s=0,k=0;for(let j=Math.max(0,i-10);j<i;j++){s+=body(C[j]);k++;} return k?s/k:body(C[i])||1e-9;};
  const trend=i=>{ if(i<3)return 0; const d=C[i-1].c-C[i-3].c; return d>0?1:d<0?-1:0; };
  const add=(i,name,dir,txt)=>P.push({i:i,name:name,dir:dir,txt:txt,kind:'candle'});
  for(let i=0;i<n;i++){
    const x=C[i], r=rng(x), b=body(x), ab=avgB(i), tr=trend(i); if(r<=0)continue;
    if(lw(x)>=2*b&&up(x)<=Math.max(.35*b,.1*r)&&lw(x)>=.55*r){ if(tr<0)add(i,'Hammer',1,'Long lower shadow after a fall: buyers stepped in'); else if(tr>0)add(i,'Hanging man',-1,'Long lower shadow after a rise: weakness warning'); }
    else if(up(x)>=2*b&&lw(x)<=Math.max(.35*b,.1*r)&&up(x)>=.55*r){ if(tr>0)add(i,'Shooting star',-1,'Long upper shadow after a rise: sellers rejected the high'); else if(tr<0)add(i,'Inverted hammer',1,'Upper shadow after a fall: a bounce may start'); }
    else if(b<=.1*r)add(i,'Doji',0,'Indecision: buyers and sellers balanced, a turn may follow');
    else if(b>=.9*r&&b>1.3*ab)add(i,col(x)>0?'Bullish marubozu':'Bearish marubozu',col(x),'Full-body candle: strong one-sided pressure');
    if(i>=1){const p=C[i-1];
      if(col(p)<0&&col(x)>0&&x.o<=p.c&&x.c>=p.o&&b>body(p))add(i,'Bullish engulfing',1,'Green body swallows the red one: reversal up');
      if(col(p)>0&&col(x)<0&&x.o>=p.c&&x.c<=p.o&&b>body(p))add(i,'Bearish engulfing',-1,'Red body swallows the green one: reversal down');}
    if(i>=2){const a=C[i-2], m=C[i-1];
      if(col(a)<0&&body(m)<.4*body(a)&&col(x)>0&&x.c>(a.o+a.c)/2&&body(a)>0)add(i,'Morning star',1,'Three-candle bottom reversal');
      if(col(a)>0&&body(m)<.4*body(a)&&col(x)<0&&x.c<(a.o+a.c)/2&&body(a)>0)add(i,'Evening star',-1,'Three-candle top reversal');
      if(col(a)>0&&col(m)>0&&col(x)>0&&m.c>a.c&&x.c>m.c&&m.o>a.o&&x.o>m.o&&m.o<a.c&&x.o<m.c)add(i,'Three white soldiers',1,'Three rising green candles: steady buying');
      if(col(a)<0&&col(m)<0&&col(x)<0&&m.c<a.c&&x.c<m.c&&m.o<a.o&&x.o<m.o&&m.o>a.c&&x.o>m.c)add(i,'Three black crows',-1,'Three falling red candles: steady selling');}
  }
  // swing pivots
  const ph=[],pl=[];
  for(let i=2;i<n-2;i++){ if(C[i].h>C[i-1].h&&C[i].h>C[i-2].h&&C[i].h>=C[i+1].h&&C[i].h>=C[i+2].h)ph.push(i); if(C[i].l<C[i-1].l&&C[i].l<C[i-2].l&&C[i].l<=C[i+1].l&&C[i].l<=C[i+2].l)pl.push(i); }
  const cp=(i,name,dir,txt,j)=>P.push({i:i,j:j,name:name,dir:dir,txt:txt,kind:'chart'});
  for(let a=0;a<ph.length-1;a++){const i=ph[a],j=ph[a+1]; if(j-i>=3&&Math.abs(C[i].h-C[j].h)/C[i].h<.012){const tr=Math.min.apply(null,C.slice(i,j+1).map(x=>x.l)); if((C[i].h-tr)/C[i].h>.012)cp(j,'Double top',-1,'Two equal highs with a dip between: resistance holding',i);}}
  for(let a=0;a<pl.length-1;a++){const i=pl[a],j=pl[a+1]; if(j-i>=3&&Math.abs(C[i].l-C[j].l)/C[i].l<.012){const pk=Math.max.apply(null,C.slice(i,j+1).map(x=>x.h)); if((pk-C[i].l)/pk>.012)cp(j,'Double bottom',1,'Two equal lows with a rise between: support holding',i);}}
  for(let a=0;a<ph.length-2;a++){const i=ph[a],j=ph[a+1],k=ph[a+2]; if(C[j].h>C[i].h&&C[j].h>C[k].h&&Math.abs(C[i].h-C[k].h)/C[j].h<.02)cp(k,'Head and shoulders',-1,'Middle peak higher than both shoulders: topping pattern',i);}
  for(let a=0;a<pl.length-2;a++){const i=pl[a],j=pl[a+1],k=pl[a+2]; if(C[j].l<C[i].l&&C[j].l<C[k].l&&Math.abs(C[i].l-C[k].l)/C[j].l<.02)cp(k,'Inverse head and shoulders',1,'Middle trough lower than both shoulders: bottoming pattern',i);}
  // support and resistance: levels touched at least twice
  const clus=(idx,key,type)=>{const used=new Set(); idx.forEach((i,a)=>{ if(used.has(i))return; const grp=[i]; idx.forEach((j,b)=>{if(b>a&&!used.has(j)&&Math.abs(C[j][key]-C[i][key])/C[i][key]<.006)grp.push(j);}); if(grp.length>=2){grp.forEach(g=>used.add(g)); const y=grp.reduce((s,g)=>s+C[g][key],0)/grp.length; lines.push({type:type,y:y,from:grp[0],to:n-1,touches:grp.length});}});};
  clus(ph,'h','R'); clus(pl,'l','S');
  lines.sort((a,b)=>b.touches-a.touches); const keep=[]; let r=0,s=0; lines.forEach(l=>{if(l.type==='R'&&r<2){keep.push(l);r++;} else if(l.type==='S'&&s<2){keep.push(l);s++;}});
  keep.forEach(l=>{ if(l.type==='R'&&C[n-1].c>l.y*1.002)cp(n-1,'Breakout above resistance',1,'Latest close is above a level that held before',l.from); if(l.type==='S'&&C[n-1].c<l.y*.998)cp(n-1,'Breakdown below support',-1,'Latest close is below a level that held before',l.from); });
  // trend by least squares
  let tn='Sideways',sl=0; if(n>=4){const mx=(n-1)/2,my=C.reduce((a,x)=>a+x.c,0)/n; let nu=0,de=0; C.forEach((x,i)=>{nu+=(i-mx)*(x.c-my);de+=(i-mx)*(i-mx);}); sl=(nu/de)/my*100*(n-1); tn=sl>1?'Uptrend':sl<-1?'Downtrend':'Sideways';}
  // moving averages and crosses
  const sma=k=>C.map((x,i)=>i<k-1?null:C.slice(i-k+1,i+1).reduce((a,y)=>a+y.c,0)/k);
  const m5=sma(5),m10=sma(10);
  for(let i=1;i<n;i++)if(m5[i]!=null&&m10[i]!=null&&m5[i-1]!=null&&m10[i-1]!=null){ if(m5[i-1]<=m10[i-1]&&m5[i]>m10[i])P.push({i:i,name:'Golden cross (5 over 10)',dir:1,txt:'Short average crossed above the longer one',kind:'chart'}); if(m5[i-1]>=m10[i-1]&&m5[i]<m10[i])P.push({i:i,name:'Death cross (5 under 10)',dir:-1,txt:'Short average crossed below the longer one',kind:'chart'}); }
  P.sort((a,b)=>a.i-b.i);
  return {pats:P,lines:keep,trend:tn,slope:sl,m5:m5,m10:m10};
}
/* transit events: ingress, stations, exact aspects, new/full moon */
function mkEvents(t0,t1,kind){
  const old=CFG; CFG={lat:CFG.lat,lon:CFG.lon,kind:kind}; const ev=[];
  try{
    const DAY=86400000, pts=[]; for(let t=t0-DAY;t<=t1+DAY;t+=DAY){const P={},R={}; CODES.forEach(c=>{P[c]=sidLon(c,t); R[c]=(c==='Ra'||c==='Ke')?true:(c==='Su'||c==='Mo')?false:isRetro(c,t);}); pts.push({t:t,P:P,R:R});}
    const tone=(c,dg)=>mkBen(c)?(dg<0?0:1):mkMal(c)?(dg>0?0:-1):0;
    const tx={1:'Bullish · ஏற்றம்',0:'Volatile / mixed · ஏற்ற இறக்கம்','-1':'Bearish · இறக்கம்'};
    for(let k=1;k<pts.length;k++){
      const a=pts[k-1],b=pts[k];
      ['Su','Ma','Me','Ju','Ve','Sa','Ra','Ke'].forEach(c=>{
        const sa=Math.floor(a.P[c]/30)%12, sb=Math.floor(b.P[c]/30)%12;
        if(sa!==sb){const dd=mod(b.P[c]-a.P[c]+180,360)-180, bd=dd>0?Math.ceil(a.P[c]/30)*30:Math.floor(a.P[c]/30)*30, fr=mkClamp((bd-a.P[c])/(dd||1e-9),0,1), t=a.t+(b.t-a.t)*fr, dg=mkDig(c,sb), tn=tone(c,dg);
          ev.push({t:t,c:[c],type:'Ingress',tone:tn,en:NAME[c]+' enters '+SIGNS[sb][0]+(dg>0?' (strong sign)':dg<0?' (weak sign)':''),ta:TA[c]+' '+TSIGN[sb]+' ராசியில் நுழைகிறது',imp:(tn>0?'Supportive for ':tn<0?'Pressure on ':'Mixed, volatile for ')+MK_SEC[c]+'.'});}
        if(a.R[c]!==b.R[c]&&c!=='Ra'&&c!=='Ke'){const t=(a.t+b.t)/2, rt=b.R[c]; ev.push({t:t,c:[c],type:'Station',tone:0,en:NAME[c]+(rt?' turns retrograde':' turns direct'),ta:TA[c]+(rt?' வக்ரம் தொடங்குகிறது':' வக்ர நிவர்த்தி'),imp:rt?'Trend reversal risk in '+MK_SEC[c]+'; old levels are retested.':'Trend in '+MK_SEC[c]+' firms up again.'});}
      });
      const L=['Su','Ma','Me','Ju','Ve','Sa','Ra'];
      for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){
        const x=L[i],y=L[j]; if(x==='Su'&&(y==='Me'||y==='Ve')&&false)continue;
        MK_ASP.forEach(A=>{
          const g=(p)=>mod(p.P[x]-p.P[y]-A[0]+180,360)-180, g0=g(a), g1=g(b);
          if(g0*g1<=0&&Math.abs(g0)<20&&Math.abs(g1)<20&&Math.abs(g0-g1)>0){
            const t=a.t+(b.t-a.t)*(Math.abs(g0)/(Math.abs(g0)+Math.abs(g1))), hm=A[0]===0||A[0]===60||A[0]===120, bx=mkBen(x),by=mkBen(y),mx=mkMal(x),my=mkMal(y);
            let tn=0,imp; if(bx&&by&&!mx&&!my){tn=hm?1:-1;imp=hm?'Harmonious: supportive tone.':'Friction between benefics: profit-booking.';}
            else if(mx&&my){tn=-1;imp='Two pressure planets meet: sharp, volatile moves possible.';}
            else if(x==='Su'||y==='Su'){tn=0;imp='Sun contact: news-driven, PSU and energy in focus.';}
            else {tn=hm?0:-1;imp=hm?'Mixed influences, range-bound.':'Benefic under pressure: dips are likely.';}
            if(x==='Su'&&(y!=='Me'&&y!=='Ve'&&A[0]!==0))return;
            ev.push({t:t,c:[x,y],type:'Aspect',tone:tn,en:NAME[x]+' '+A[1]+' '+NAME[y]+' (exact)',ta:TA[x]+' – '+TA[y],imp:imp});
          }
        });
      }
      // new moon / full moon (Moon against Sun)
      [[0,'New Moon','அமாவாசை'],[180,'Full Moon','பௌர்ணமி']].forEach(A=>{
        const g=p=>mod(p.P.Mo-p.P.Su-A[0]+180,360)-180, g0=g(a),g1=g(b);
        if(g0*g1<=0&&Math.abs(g0)<30&&Math.abs(g1)<30&&g0!==g1){const t=a.t+(b.t-a.t)*(Math.abs(g0)/(Math.abs(g0)+Math.abs(g1))), P=a.P, nd=Math.min(mkAng(P.Su,P.Ra),mkAng(P.Su,P.Ke));
          ev.push({t:t,c:['Mo','Su'],type:'Moon phase',tone:A[0]===0?0:1,en:A[1]+(nd<14?' near the nodes (eclipse season)':''),ta:A[2]+(nd<14?' · கிரகண காலம்':''),imp:A[0]===0?'Liquidity tightens around the new moon; volatility often rises.':'Sentiment peaks around the full moon; watch for profit-taking after.'+(nd<14?' Eclipse windows are volatile.':'')});}
      });
    }
    return ev.filter(e=>e.t>=t0&&e.t<=t1).sort((x,y)=>x.t-y.t);
  }finally{CFG=old;}
}
/* planet impact table at one instant */
function mkSnapshot(ms,kind){
  const old=CFG; CFG={lat:CFG.lat,lon:CFG.lon,kind:kind};
  try{
    return CODES.map(c=>{const l=sidLon(c,ms), g=SEGS[findSeg(l)], rt=(c==='Ra'||c==='Ke')?true:(c==='Su'||c==='Mo')?false:isRetro(c,ms), dg=mkDig(c,g.sign), nat=c==="Mo"?0:MK_NAT_W[c];
      const tone=c==='Mo'?0:(nat>0?(dg<0?0:1):(dg>0?0:-1)); return {c:c,l:l,g:g,rt:rt,dg:dg,tone:tone};});
  }finally{CFG=old;}
}
const MK_IMP={Su:'Authority, government and PSU sentiment; strong Sun lifts confidence.',Mo:'Daily mood and liquidity; waxing supports buying, waning supports caution.',Ma:'Energy and volatility; strong Mars brings sharp rallies and sharp falls.',Me:'News, IT and trading volumes; retrograde Mercury brings reversals and false breakouts.',Ju:'Expansion, banking and credit; the most supportive planet for markets.',Ve:'Consumption, luxury and autos; supports risk appetite.',Sa:'Restriction, slowdown and discipline; pressure on markets unless strong.',Ra:'Sudden, speculative moves; tech and foreign flows; adds volatility.',Ke:'Sudden drops and detachment; pharma and chemicals; adds volatility.'};

/* ---------- v6.9 rule engine: rules taken from "Timing Solutions for Swing Traders" (Lee and Tryde, 2012, ch. 9) and
   "Celestial Mechanics of the Marketplace" (financial astrology report). Each rule belongs to a group so the reason is shown. ---------- */
const MK_G0=0;
const MK_G={LUN:'Lunar cycle',PLA:'Planet strength',ASP:'Planet aspects',BK:'Classic market pairs',NAT:'Transit to market natal chart',ASC:'Transit ascendant and cusps',TRN:'Turning-point windows'};

/* ---------- v7.2: rules from two books (KP Graphs; Stock Market Astrology) ---------- */
MK_G.KPG='KP Graphs: Moon string (planet, sign lord, star lord, sub lord)';
MK_G.SMA='Stock Market Astrology: planet in sign, aspected by';
MK_G.NAK='Moon nakshatra day';
MK_G.HOR='Hora (planetary hour)';
const SMA_R={"cat":["Banking & finance","IT, telecom & media","Pharma & health","Auto","Oil, gas & power","Metals & mining","FMCG, food & agri","Realty, infra & cement","Gold & jewellery","Defence & capital goods","Travel, aviation & shipping","Textile, retail & luxury"],"r":{"Su":[{"pa":1,"A":["Mo","Ma","Ju"],"B":["Me","Ve","Ra"],"s":[1,2,3,4,5,6,7,9]},{"pa":1,"A":["Mo","Ma","Ju"],"B":["Me","Sa","Ra"],"s":[0,1,2,4,5,6,8,10,11]},{"pa":-1,"A":["Mo","Ma","Ju"],"B":["Me","Ve","Ra"],"s":[0,1,6,10,11]},{"pa":1,"A":["Ma","Mo","Ju"],"B":["Me","Ve","Sa","Ra"],"s":[4,5,6,8,10]},{"pa":1,"A":["Mo","Ma","Ju"],"B":["Ve","Sa","Ra"],"s":[1,4,5,6,8,9]},{"pa":-1,"A":["Mo","Ma","Ju"],"B":["Me","Ve","Ra"],"s":[0,1,6,10,11]},{"pa":1,"A":["Mo","Ma","Ju"],"B":["Me","Sa","Ra"],"s":[0,1,2,4,5,6,8,10,11]},{"pa":1,"A":["Mo","Ma","Ju"],"B":["Me","Ve","Ra"],"s":[1,2,3,4,5,6,7,9]},{"pa":1,"A":["Mo","Ma","Ju"],"B":["Sa","Ra"],"s":[0,4,5,6,8,10,11]},{"pa":-1,"A":["Mo","Ma","Ju"],"B":["Me","Ve","Sa","Ra"],"s":[0,4,5,6,7]},{"pa":-1,"A":["Mo","Ma","Ju"],"B":["Me","Ve","Sa","Ra"],"s":[0,1,4,5,6,7,10]},{"pa":-1,"A":["Mo","Ma","Ju"],"B":[],"s":[0,6]}],"Mo":[{"pa":1,"A":["Su","Ma","Ju"],"B":["Me","Ve","Ra"],"s":[1,2,3,4,5,6,7,9]},{"pa":-1,"A":["Su","Ma","Ju"],"B":["Me","Ve","Ra"],"s":[0,1,2,4,5,6,8,10,11]},{"pa":1,"A":["Su","Ma","Ju"],"B":["Sa","Ve","Ra"],"s":[0,1,6,10,11]},{"pa":1,"A":["Ma","Su","Ju"],"B":["Me","Ve","Sa","Ra"],"s":[4,5,6,8,10]},{"pa":1,"A":["Su","Ma","Ju"],"B":["Ve","Sa","Ra"],"s":[1,4,5,6,8,9]},{"pa":1,"A":["Su","Ma","Ju"],"B":["Sa","Ve","Ra"],"s":[0,1,6,10,11]},{"pa":-1,"A":["Su","Ma","Ju"],"B":[],"s":[6]},{"pa":-1,"A":["Su","Ma","Ju"],"B":[],"s":[0,6]},{"pa":1,"A":["Su","Ma","Ju"],"B":["Ve","Sa","Ra"],"s":[0,4,5,6,8,10,11]},{"pa":-1,"A":["Su","Ma","Ju"],"B":["Me","Ve","Sa","Ra"],"s":[0,4,5,6,7]},{"pa":-1,"A":["Su","Ma","Ju"],"B":[],"s":[6]},{"pa":1,"A":["Su","Ma","Ju"],"B":["Ve","Sa","Ra"],"s":[0,2,4,5,6,8,10,11]}],"Ma":[{"pa":1,"A":["Su","Mo","Ju"],"B":["Me","Ve","Ra"],"s":[1,2,3,4,5,6,7,9]},{"pa":1,"A":["Su","Mo","Ju"],"B":["Me","Ra"],"s":[0,1,2,4,5,6,8,10,11]},{"pa":-1,"A":["Su","Mo","Ju"],"B":[],"s":[6]},{"pa":1,"A":["Su","Mo","Ju"],"B":["Me","Ve","Sa","Ra"],"s":[4,5,6,8,10]},{"pa":-1,"A":["Su","Mo","Ju"],"B":[],"s":[0,6]},{"pa":-1,"A":["Su","Mo","Ju"],"B":["Ve","Sa","Ra"],"s":[0,1,6,10,11]},{"pa":1,"A":["Su","Mo","Ju"],"B":["Me","Ra"],"s":[0,1,2,4,5,6,8,10,11]},{"pa":-1,"A":["Su","Mo","Ju"],"B":[],"s":[0,6]},{"pa":-1,"A":["Su","Mo","Ju"],"B":[],"s":[0,6]},{"pa":-1,"A":["Mo","Su","Ju"],"B":["Me","Ve","Sa","Ra"],"s":[0,4,5,6,7]},{"pa":-1,"A":["Mo","Su","Ju"],"B":["Me","Ve","Sa","Ra"],"s":[1,4,5,6,7,10]},{"pa":-1,"A":["Su","Mo","Ju"],"B":[],"s":[0,6]}],"Me":[{"pa":-1,"A":["Sa","Ve","Ra"],"B":["Mo","Ma","Ju"],"s":[1,2,3,4,5,6,7,9]},{"pa":1,"A":["Su","Ve","Sa"],"B":["Mo","Ma"],"s":[0,1,2,4,5,6,8,10,11]},{"pa":1,"A":["Ve","Sa"],"B":["Mo","Ma"],"s":[0,1,6,10,11]},{"pa":-1,"A":["Ve","Sa","Ra"],"B":["Su","Mo","Ma","Ju"],"s":[4,5,6,8,10]},{"pa":1,"A":["Ve","Sa","Ra"],"B":[],"s":[]},{"pa":1,"A":["Ve","Sa"],"B":["Mo","Ma"],"s":[0,1,6,10,11]},{"pa":1,"A":["Su","Ve","Sa"],"B":["Mo","Ma"],"s":[0,1,2,4,5,6,8,10,11]},{"pa":1,"A":["Sa","Ve","Ra"],"B":[],"s":[6]},{"pa":1,"A":["Ve","Sa","Ra"],"B":[],"s":[]},{"pa":-1,"A":["Ve","Sa","Ra"],"B":[],"s":[6]},{"pa":1,"A":["Ve","Sa","Ra"],"B":["Su","Mo","Ma"],"s":[0,1,4,5,6,7,10]},{"pa":1,"A":["Ve","Sa","Ra"],"B":[],"s":[]}],"Ju":[{"pa":1,"A":["Su","Ma","Mo"],"B":["Me","Ve","Ra"],"s":[1,2,3,4,5,6,7,9]},{"pa":-1,"A":["Su","Ma","Mo"],"B":["Me","Ve","Ra"],"s":[0,1,2,4,5,6,8,10,11]},{"pa":-1,"A":["Mo","Ma","Su"],"B":["Ve","Ra"],"s":[0,1,6,10,11]},{"pa":1,"A":["Ma","Mo","Su"],"B":["Me","Ve","Ra"],"s":[4,5,6,8,10]},{"pa":1,"A":["Su","Mo","Ma"],"B":["Ve","Sa","Ra"],"s":[1,4,5,6,8,9]},{"pa":-1,"A":["Mo","Ma","Su"],"B":["Ve","Ra"],"s":[0,1,6,10,11]},{"pa":-1,"A":["Su","Ma","Ju"],"B":["Me","Ve","Ra"],"s":[0,1,2,4,5,6,8,10,11]},{"pa":1,"A":["Su","Ma","Mo"],"B":["Me","Ve","Ra"],"s":[1,2,3,4,5,6,7,9]},{"pa":1,"A":["Su","Mo","Ma"],"B":["Ve","Sa","Ra"],"s":[0,4,5,6,8,10,11]},{"pa":1,"A":[],"B":["Me","Ve","Ra"],"s":[4,5,6,7],"u":1},{"pa":1,"A":[],"B":["Me","Ve","Ra"],"s":[1,4,5,6,7,10],"u":1},{"pa":1,"A":["Su","Mo","Ma"],"B":["Ve","Sa","Ra"],"s":[0,2,4,5,6,8,10,11]}],"Ve":[{"pa":-1,"A":["Sa","Me","Ra"],"B":[],"s":[]},{"pa":1,"A":["Me","Sa"],"B":["Su","Mo","Ma"],"s":[0,1,2,4,5,6,8,10,11]},{"pa":-1,"A":["Me","Sa"],"B":[],"s":[0,6]},{"pa":-1,"A":["Me","Sa","Ra"],"B":[],"s":[6]},{"pa":-1,"A":["Me","Sa","Ra"],"B":[],"s":[]},{"pa":1,"A":["Me","Sa"],"B":["Ju","Su","Mo","Ma"],"s":[0,1,6,10,11]},{"pa":-1,"A":["Me","Sa"],"B":[],"s":[6]},{"pa":-1,"A":["Sa","Me","Ra"],"B":[],"s":[]},{"pa":-1,"A":["Me","Sa","Ra"],"B":[],"s":[]},{"pa":1,"A":["Me","Sa","Ra"],"B":["Su","Mo","Ma"],"s":[0,4,5,6,7]},{"pa":-1,"A":["Me","Sa","Ra"],"B":[],"s":[6]},{"pa":-1,"A":["Me","Sa","Ra"],"B":[],"s":[]}],"Sa":[{"pa":-1,"A":["Me","Ve","Ju","Ra"],"B":["Mo","Ma","Ju"],"s":[1,2,3,4,5,6,7,9]},{"pa":1,"A":["Me","Ve"],"B":["Su","Mo","Ma"],"s":[0,1,2,4,5,6,8,10,11]},{"pa":-1,"A":["Me","Ve"],"B":[],"s":[0,6]},{"pa":-1,"A":["Ve","Me","Ra"],"B":["Su","Mo","Ma"],"s":[4,5,6,8,10]},{"pa":-1,"A":["Me","Ve","Ju","Ra"],"B":["Su","Mo","Ma"],"s":[1,4,5,6,8,9]},{"pa":1,"A":["Me","Ve"],"B":["Su","Mo","Ma"],"s":[0,1,6,10,11]},{"pa":1,"A":["Me","Ve"],"B":["Su","Mo","Ma"],"s":[0,1,2,4,5,6,8,10,11]},{"pa":-1,"A":["Me","Ve","Ra"],"B":[],"s":[]},{"pa":-1,"A":["Me","Ve","Ju","Ra"],"B":[],"s":[0,4,5,6,8,10,11]},{"pa":1,"A":["Ve","Me","Ra"],"B":["Su","Mo","Ma"],"s":[0,4,5,6,7]},{"pa":1,"A":["Ve","Me","Ra"],"B":["Su","Mo","Ma"],"s":[0,1,4,5,6,7,10]},{"pa":1,"A":["Me","Ve","Ra"],"B":[],"s":[0,2,4,5,6,8,10,11]}],"Ra":[{"pa":-1,"A":["Me","Ve","Sa"],"B":["Mo","Ma","Ju"],"s":[1,2,3,4,5,6,7,9]},{"pa":1,"A":["Me","Ve","Sa"],"B":["Su","Mo","Ma"],"s":[0,1,2,4,5,6,8,10,11]},{"pa":-1,"A":["Sa","Me","Ve"],"B":[],"s":[0,6]},{"pa":1,"A":["Ve","Me","Sa"],"B":[],"s":[6]},{"pa":-1,"A":["Me","Ve","Sa"],"B":["Ju","Su","Mo","Ma"],"s":[1,4,5,6,8,9]},{"pa":-1,"A":["Sa","Me","Ve"],"B":[],"s":[0,6]},{"pa":-1,"A":["Me","Ve","Sa"],"B":[],"s":[6]},{"pa":-1,"A":["Me","Ve","Sa"],"B":[],"s":[]},{"pa":1,"A":["Me","Ve","Sa"],"B":[],"s":[6]},{"pa":1,"A":["Ve","Me","Sa"],"B":["Su","Mo","Ma"],"s":[0,4,5,6,7]},{"pa":1,"A":["Ve","Me","Sa"],"B":["Su","Mo","Ma"],"s":[0,1,4,5,6,7,10]},{"pa":1,"A":["Me","Ve","Sa"],"B":[],"s":[6]}],"Ke":[{"pa":-1,"A":["Me","Ve","Sa"],"B":["Mo","Ma","Ju"],"s":[1,2,3,4,5,6,7,9]},{"pa":1,"A":["Me","Ve","Sa"],"B":["Su","Mo","Ma"],"s":[0,1,2,4,5,6,8,10,11]},{"pa":1,"A":["Sa","Me","Ve"],"B":["Su","Mo","Ma"],"s":[0,1,6,10,11]},{"pa":1,"A":["Ve","Me","Sa","Ra"],"B":[],"s":[6]},{"pa":-1,"A":["Me","Ve","Sa"],"B":["Ju","Su","Mo","Ma"],"s":[1,4,5,6,8,9]},{"pa":1,"A":["Sa","Me","Ve"],"B":["Su","Mo","Ma"],"s":[0,1,6,10,11]},{"pa":-1,"A":["Me","Ve","Sa"],"B":[],"s":[6]},{"pa":-1,"A":["Me","Ve","Sa"],"B":[],"s":[]},{"pa":-1,"A":["Me","Ve","Sa"],"B":["Ju","Su","Mo","Ma"],"s":[0,4,5,6,8,10,11]},{"pa":1,"A":["Ve","Me","Sa","Ra"],"B":["Su","Mo","Ma"],"s":[0,4,5,6,7]},{"pa":1,"A":["Ve","Me","Sa","Ra"],"B":["Su","Mo","Ma"],"s":[0,4,5,6,7]},{"pa":-1,"A":["Me","Ve","Sa"],"B":["Ju","Su","Mo","Ma"],"s":[0,2,4,5,6,8,10,11]}],"Ur":[{"pa":1,"A":["Me","Ve","Ra"],"B":[],"s":[6]},{"pa":1,"A":["Me","Ve","Sa"],"B":["Su","Mo","Ma"],"s":[0,1,2,4,5,6,8,10,11]},{"pa":1,"A":["Me","Ve"],"B":["Su","Mo","Ma"],"s":[0,1,6,10,11]},{"pa":-1,"A":["Ve","Me","Sa","Ra"],"B":["Su","Mo","Ma"],"s":[4,5,6,8,10]},{"pa":-1,"A":["Me","Ve","Ra"],"B":["Su","Mo","Ma"],"s":[1,4,5,6,8,9]},{"pa":1,"A":["Me","Ve"],"B":["Su","Mo","Ma"],"s":[0,1,6,10,11]},{"pa":-1,"A":["Me","Ve","Sa"],"B":[],"s":[0,6]},{"pa":1,"A":["Me","Ve","Ra"],"B":[],"s":[6]},{"pa":1,"A":["Me","Ve","Ra"],"B":[],"s":[0,4,5,6,8,10,11]},{"pa":-1,"A":["Ve","Me","Sa","Ra"],"B":[],"s":[6]},{"pa":-1,"A":["Ve","Me","Sa","Ra"],"B":[],"s":[6]},{"pa":1,"A":["Me","Ve","Ra"],"B":[],"s":[0,4,5,6,8,10,11]}],"Ne":[{"pa":1,"A":["Su","Mo"],"B":["Sa","Ve","Ra"],"s":[1,2,3,4,5,6,7,9]},{"pa":-1,"A":["Su","Ma","Ju"],"B":["Me","Ve","Ra"],"s":[0,1,2,4,5,6,8,10,11]},{"pa":1,"A":["Su","Mo","Ma","Ju"],"B":["Sa","Ve","Ra"],"s":[0,1,6,10,11]},{"pa":1,"A":["Su","Ma","Mo","Ju"],"B":["Me","Ve","Sa","Ra"],"s":[4,5,6,8,10]},{"pa":-1,"A":["Su","Mo","Ma","Ju"],"B":[],"s":[0,6]},{"pa":-1,"A":["Su","Mo","Ma","Ju"],"B":[],"s":[6]},{"pa":-1,"A":["Su","Ma","Ju"],"B":["Me","Ve","Ra"],"s":[0,1,2,4,5,6,8,10,11]},{"pa":1,"A":["Su","Mo"],"B":["Sa","Ve","Ra"],"s":[1,2,3,4,5,6,7,9]},{"pa":1,"A":["Su","Mo","Ma","Ju"],"B":["Ve","Sa","Ra"],"s":[0,4,5,6,8,10,11]},{"pa":-1,"A":["Su","Mo","Ma","Ju"],"B":["Me","Ve","Sa","Ra"],"s":[0,4,5,6,7]},{"pa":-1,"A":["Su","Mo","Ma","Ju"],"B":["Me","Ve","Sa","Ra"],"s":[0,1,4,5,6,7,10]},{"pa":-1,"A":["Su","Mo","Ma","Ju"],"B":[],"s":[0,6]}],"Pl":[{"pa":1,"A":[],"B":[],"s":[1,2,3,4,5,6,7,9],"u":1},{"pa":1,"A":[],"B":[],"s":[0,1,2,4,5,6,8,10,11],"u":1},{"pa":-1,"A":[],"B":[],"s":[0,1,6,10,11],"u":1},{"pa":1,"A":[],"B":[],"s":[4,5,6,8,10],"u":1},{"pa":1,"A":[],"B":[],"s":[1,4,5,6,8,9],"u":1},{"pa":-1,"A":[],"B":[],"s":[0,1,6,10,11],"u":1},{"pa":1,"A":[],"B":[],"s":[0,1,2,4,5,6,8,10,11],"u":1},null,{"pa":1,"A":[],"B":[],"s":[0,4,5,6,8,10,11],"u":1},{"pa":-1,"A":[],"B":[],"s":[0,4,5,6,7],"u":1},{"pa":-1,"A":[],"B":[],"s":[1,4,5,6,7,10],"u":1},null]}};
const SMA_CAT=SMA_R.cat, SMA_IX=[.36,.13,.04,.07,.13,.05,.08,.05,.02,.04,.02,.01];
const SMA_PS={Su:[4,2],Mo:[6],Ma:[7,5,9],Me:[1],Ju:[0,8],Ve:[3,11,10],Sa:[5,4,7],Ra:[1,10,2],Ke:[2,5]};
const SMA_SL=[['Ma'],['Ve'],['Me'],['Mo'],['Su'],['Me'],['Ve'],['Ma'],['Ju'],['Sa'],['Sa'],['Ju']].map(a=>a[0]);
const SMA_ANG=[[0,1],[180,1],[90,.8],[120,.8],[60,.6]];
const SMA_FR={Su:{f:'Mo Ma Ju',e:'Ve Sa'},Mo:{f:'Su Me',e:''},Ma:{f:'Su Mo Ju',e:'Me'},Me:{f:'Su Ve',e:'Mo'},Ju:{f:'Su Mo Ma',e:'Me Ve'},Ve:{f:'Me Sa',e:'Su Mo'},Sa:{f:'Me Ve',e:'Su Mo Ma'},Ra:{f:'Me Ve Sa',e:'Su Mo Ma'},Ke:{f:'Me Ve Sa',e:'Su Mo Ma'}};
const smaRel=(a,b)=>{ if(a===b)return 1; const r=SMA_FR[a]; if(!r)return 0; return r.f.indexOf(b)>=0?1:r.e.indexOf(b)>=0?-1:0; };
const smaPol=(c,waxing)=>c==='Mo'?(waxing?1:-1):(c==='Ju'||c==='Ve'||c==='Me')?1:(c==='Sa'||c==='Ma'||c==='Ra'||c==='Ke')?-1:0;
const smaIxw=s=>{let t=0; s.forEach(i=>{t+=SMA_IX[i];}); return Math.min(1,t*1.6);};
const SMA_HL=['Su','Ve','Me','Mo','Sa','Ju','Ma'], SMA_DAY=['Su','Mo','Ma','Me','Ju','Ve','Sa'];
const SMA_HW={Su:.05,Mo:.12,Ma:-.1,Me:.1,Ju:.2,Ve:.15,Sa:-.2};
const SMA_HC={};
function smaRise(lat,lon,dk){
  const k=dk+'|'+lat+'|'+lon; if(SMA_HC[k]!=null)return SMA_HC[k];
  let r=dk*86400000-lon*240000+6*3600000;
  try{const s=dk*86400000-lon*240000-2*3600000, x=Astronomy.SearchRiseSet(Astronomy.Body.Sun,new Astronomy.Observer(lat,lon,0),+1,Astronomy.MakeTime(new Date(s)),1); if(x)r=x.date.getTime();}catch(e){}
  return (SMA_HC[k]=r);
}
function smaHora(ms,lat,lon){
  let dk=Math.floor((ms+lon*240000)/86400000), rise=smaRise(lat,lon,dk);
  if(ms<rise){dk--; rise=smaRise(lat,lon,dk);}
  const wd=new Date(dk*86400000).getUTCDay(), h=Math.min(23,Math.floor((ms-rise)/3600000)), s0=SMA_HL.indexOf(SMA_DAY[wd]);
  return {lord:SMA_HL[(s0+h)%7],n:h+1,day:SMA_DAY[wd]};
}
function smaAspects(T,c,skip,orb){ // planets that aspect c (major angles), with strength
  const o=[]; ['Su','Mo','Ma','Me','Ju','Ve','Sa','Ra','Ke','Ur','Ne','Pl'].forEach(x=>{ if(x===c||x===skip||T[x]==null)return;
    const d=mkAng(T[c],T[x]); for(let k=0;k<SMA_ANG.length;k++){const e=Math.abs(d-SMA_ANG[k][0]), om=x==='Mo'?Math.min(orb,5):orb; if(e<om){o.push({x:x,f:(1-e/om)*SMA_ANG[k][1],a:SMA_ANG[k][0]});break;}}
  });
  return o;
}
function mkBook(ms,lat,lon,kind,P,T,R,ay,ph){
  const items=[], sec={}, waxing=ph<180, S=(s,w)=>{s.forEach(i=>{sec[SMA_CAT[i]]=(sec[SMA_CAT[i]]||0)+w;});};
  // 1 KP Graphs: the Moon string; every lower level allows or denies what the level above proposes
  const sg=SEGS[findSeg(P.Mo)], sl=SMA_SL[Math.floor(P.Mo/30)%12], L=[['sign lord',sl],['star lord',sg.star],['sub lord',sg.sub]];
  let q=smaPol('Mo',waxing)*1, prev='Mo', txt='Moon ('+(waxing?'waxing':'waning')+')', mag=1;
  L.forEach((lv,i)=>{ const rel=smaRel(prev,lv[1]), allow=rel>=0; const dir=smaPol(lv[1],waxing);
    if(i<2){ if(!allow)mag*=.45; }
    else { if(!allow)mag*=-.5; }
    // a benefic lord at any level lifts, a malefic lord presses
    q+=dir*.25*(i===2?1.4:1);
    txt+=' → '+lv[0]+' '+NAME[lv[1]]+(allow?' allows':' denies'); prev=lv[1]; });
  const kw=mkClamp(q*mag*.16,-.45,.45); items.push(['KPG',kw,'KP Graphs string: '+txt,0]);
  // 2 SMA chapter 7: planet through a sign, aspected by group A / group B
  ['Su','Mo','Ma','Me','Ju','Ve','Sa','Ra','Ke','Ur','Ne','Pl'].forEach(c=>{
    const lon_=(c==='Ur'||c==='Ne'||c==='Pl')?mod(T[c]-ay,360):P[c]; if(lon_==null||isNaN(lon_))return;
    const si=Math.floor(lon_/30)%12, rl=SMA_R.r[c]&&SMA_R.r[c][si]; if(!rl)return;
    const asp=smaAspects(T,c,null,6); let w=0, hit=[];
    if(rl.u){ w+=.03*rl.pa; }
    asp.forEach(a=>{ const inA=rl.A.indexOf(a.x)>=0, inB=rl.B.indexOf(a.x)>=0, base=(c==='Mo'?.07:.12)*a.f;
      if(inA){w+=rl.pa*base; hit.push(NAME[a.x]);}
      else if(inB){w+=(rl.pa>0?-1:.5)*base; hit.push(NAME[a.x]+' (reverse)');}
    });
    if(!w)return;
    const ix=smaIxw(rl.s); items.push(['SMA',w*(.4+.6*ix),NAME[c]+' in '+SIGNS[si][0]+' aspected by '+(hit.join(', ')||'—')+' · '+(w>0?'positive':'negative')+' for '+rl.s.slice(0,4).map(i=>SMA_CAT[i]).join(', '),0]);
    S(rl.s,w);
  });
  // 3 SMA chapter 8: nakshatra day, the lord of the Moon's star
  const nl=sg.star; if(T[nl]!=null||P[nl]!=null){
    let nb=0,nm=0; smaAspects(T,nl,null,6).forEach(a=>{const p=smaPol(a.x,waxing); if(p>0)nb+=a.f; else if(p<0)nm+=a.f;});
    let mb=0,mm=0; smaAspects(T,'Mo',null,6).forEach(a=>{const p=smaPol(a.x,waxing); if(p>0)mb+=a.f; else if(p<0)mm+=a.f;});
    let w=.1*(nb-nm); if((w>0&&mb>0)||(w<0&&mm>0))w*=1.5; if(w){ w=mkClamp(w,-.3,.3); items.push(['NAK',w,'Nakshatra lord '+NAME[nl]+' is aspected by '+(w>0?'benefics':'malefics')+(((w>0&&mb>0)||(w<0&&mm>0))?' and the Moon too':''),0]); if(SMA_PS[nl])S(SMA_PS[nl],w*1.5); }
  }
  // 4 SMA chapter 10: the Hora of the hour
  const hr=smaHora(ms,lat,lon), hw=SMA_HW[hr.lord]||0; items.push(['HOR',hw,'Hora '+hr.n+' of '+NAME[hr.day]+' day: '+NAME[hr.lord]+(hw>0?' (supports buying)':hw<0?' (selling pressure)':''),hr.lord==='Ma'||hr.lord==='Su'?.1:0]);
  if(SMA_PS[hr.lord])S(SMA_PS[hr.lord],hw*1.2);
  // 5 SMA chapter 11: opening-bell chart, sector of the ascendant sign
  try{ const a=sidAsc(ms,lat,lon,kind), ai=Math.floor(a/30)%12, al=SMA_SL[ai], Ta=mod(a+ay,360); let nb=0,nm=0;
    ['Ma','Me','Ju','Ve','Sa'].forEach(x=>{const d=mkAng(Ta,T[x]); SMA_ANG.forEach(an=>{const e=Math.abs(d-an[0]); if(e<5){const p=smaPol(x,waxing); if(p>0)nb+=(1-e/5)*an[1]; else nm+=(1-e/5)*an[1];}});});
    const w=mkClamp(.08*(nb-nm),-.2,.2); if(w){ items.push(['SMA',w,'Ascendant '+SIGNS[ai][0]+' is aspected by '+(w>0?'benefics':'malefics')+' (sectors of '+NAME[al]+')',0]); if(SMA_PS[al])S(SMA_PS[al],w*1.5); } }catch(e){}
  // 6 SMA chapter 2: four or more planets in one sign give directionless volatility
  const cnt={}; ['Su','Mo','Ma','Me','Ju','Ve','Sa','Ra','Ke'].forEach(c=>{const i=Math.floor(P[c]/30)%12; cnt[i]=(cnt[i]||0)+1;});
  let vol=0, flag=null; Object.keys(cnt).forEach(i=>{ if(cnt[i]>=4){vol=.4;flag='Four or more planets in '+SIGNS[i][0]+': directionless, volatile market';} });
  return {items:items,sec:sec,vol:vol,flag:flag};
}

const MK_BODY={Ur:'Uranus',Ne:'Neptune',Pl:'Pluto'};
function mkTrop(code,ms){
  if(code==='Ra'){const c=((ms/86400000+2440587.5)-2451545)/36525; return mod(125.04452-1934.136261*c,360);}
  const t=Astronomy.MakeTime(new Date(ms)), b=BODY[code]||Astronomy.Body[MK_BODY[code]];
  const e=Astronomy.RotateVector(Astronomy.Rotation_EQJ_ECT(t),Astronomy.GeoVector(b,t,true));
  return mod(deg(Math.atan2(e.y,e.x)),360);
}
const MK_ALL=['Su','Mo','Ma','Me','Ju','Ve','Sa','Ur','Ne','Pl'];
const MK_PN={Su:'Sun',Mo:'Moon',Ma:'Mars',Me:'Mercury',Ju:'Jupiter',Ve:'Venus',Sa:'Saturn',Ra:'Rahu',Ke:'Ketu',Ur:'Uranus',Ne:'Neptune',Pl:'Pluto',Asc:'Ascendant',POF:'Part of Fortune'};
const MK_PTN={Su:'சூரியன்',Mo:'சந்திரன்',Ma:'செவ்வாய்',Me:'புதன்',Ju:'குரு',Ve:'சுக்கிரன்',Sa:'சனி',Ur:'யுரேனஸ்',Ne:'நெப்டியூன்',Pl:'புளூட்டோ'};
/* the market's own natal chart: transits to it are checked as in Table 9.1 of the book */
function mkNatalOf(ms,lat,lon,kind){
  const T={}; MK_ALL.forEach(c=>{T[c]=mkTrop(c,ms);});
  const ay=ayanamsa(ms/86400000+2440587.5,kind), asc=mod(sidAsc(ms,lat,lon,kind)+ay,360), cu=placidusCusps(ms,lat,lon,kind).map(x=>mod(x+ay,360));
  const bh=l=>{for(let i=0;i<12;i++){const a=cu[i],b=cu[(i+1)%12];if(mod(l-a,360)<mod(b-a,360))return i+1;}return 1;};
  const day=bh(T.Su)>=7; T.Asc=asc; T.POF=mod(day?asc+T.Mo-T.Su:asc+T.Su-T.Mo,360);
  return T;
}
const MK_NAT=[ // transit planets, aspect angles, natal points, weight, text  (book, Table 9.1 and the surrounding text)
 [['Ve','Ju'],[60,120],['Su','Ju','Pl'],.5,'Venus/Jupiter harmonious to the market’s natal Sun, Jupiter or Pluto'],
 [['Su'],[0],['Asc','Ju','Pl'],.3,'Sun on the market’s natal Ascendant, Jupiter or Pluto'],
 [['Ma'],[120],['Ve','Ju'],.25,'Mars trine the market’s natal Venus or Jupiter'],
 [['Ur','Ne','Pl'],[60,120],['Ve','Ju'],.25,'Outer planet in harmony with the market’s natal Venus or Jupiter'],
 [['Ju'],[0,60,90,120,180],['POF'],.4,'Jupiter aspects the market’s natal Part of Fortune'],
 [['Mo'],[0],['POF'],.25,'Moon on the market’s natal Part of Fortune'],
 [['Sa','Ma','Ur','Pl'],[0,90,180],['Ve','Ju','Su','Mo'],-.35,'Stressful transit to the market’s natal money planets']
];
const MK_PAIR={ // explicit pairs from the books: [aspects that count as harmonic/hard, weight harmonic, weight hard, vol, text]
 VeJu:[.6,-.1,0,'Venus–Jupiter ("Millionaire’s aspect"): easy money, liquidity'],
 VeSa:[0,-.4,.1,'Venus–Saturn hard aspect: money flow constricts'],
 SuJu:[.3,0,0,'Sun–Jupiter: economic optimism'],
 SuSa:[0,-.3,.1,'Sun–Saturn hard aspect: pessimism, low volume'],
 MaSa:[0,-.45,.3,'Mars–Saturn: driving with the brakes on'],
 MaUr:[0,-.4,.5,'Mars–Uranus hard aspect: sudden sharp moves'],
 SaUr:[0,-.6,.5,'Saturn–Uranus hard aspect: the recession aspect'],
 SaPl:[0,-.5,.4,'Saturn–Pluto hard aspect: crisis, restructuring'],
 JuUr:[.35,0,.2,'Jupiter–Uranus: speculative, tech-led boom'],
 JuSa:[0,-.2,.2,'Jupiter–Saturn hard aspect: expansion meets restriction']
};
const MK_SPD={Me:2,Ve:1.25,Ma:.75,Ju:.25,Sa:.13};
function mkScore(ms,lat,lon,kind,natal){
  const P={},R={},T={}, ay=ayanamsa(ms/86400000+2440587.5,kind);
  CODES.forEach(c=>{P[c]=sidLon(c,ms); T[c]=mod(P[c]+ay,360); R[c]=(c==='Ra'||c==='Ke')?true:(c==='Su'||c==='Mo')?false:isRetro(c,ms);});
  ['Ur','Ne','Pl'].forEach(c=>{T[c]=mkTrop(c,ms);});
  let sum=0, v=.25; const dr=[], flags=[], grp={}; Object.keys(MK_G).forEach(g=>{grp[g]=0;});
  const add=(g,w,t,vv)=>{sum+=w; grp[g]+=w; if(vv)v+=vv; if(Math.abs(w)>.01)dr.push({w:w,t:t,g:g});};
  const flag=(t,vv)=>{v+=vv; if(flags.indexOf(t)<0)flags.push(t);};
  // lunar cycle
  const ph=mod(T.Mo-T.Su,360), moW=.5*Math.sin(ph*Math.PI/180);
  add('LUN',moW,(moW>=0?'Waxing Moon: accumulation half of the lunar month':'Waning Moon: distribution half of the lunar month'),0);
  if(ph<12||ph>348)add('LUN',.15,'New Moon: classic buying point',0);
  if(Math.abs(ph-180)<12){add('LUN',-.2,'Full Moon: classic selling point',.2); flag('Full Moon: top or reversal window',0);}
  if(Math.abs(ph-90)<6||Math.abs(ph-270)<6)flag('Quarter Moon: change-in-trend window',.1);
  const dN=Math.min(mkAng(T.Mo,T.Ra),mkAng(T.Mo,mod(T.Ra+180,360))); if(dN<14&&(ph<12||ph>348||Math.abs(ph-180)<12))flag('Eclipse window: lunations are stronger',.3);
  // planet strength
  CODES.forEach(c=>{
    if(c==='Mo')return;
    const sg=Math.floor(P[c]/30)%12, dg=mkDig(c,sg), nat=MK_NAT_W[c];
    let w=nat>0?nat*(1+.4*dg):nat*(1-.4*dg); if(R[c]&&c!=='Ra'&&c!=='Ke'){w*=nat>0?.6:1.1; v+=.1;}
    add('PLA',w*.35,NAME[c]+(R[c]&&c!=='Ra'&&c!=='Ke'?' retrograde':'')+' in '+SIGNS[sg][0]+(dg>0?' (strong)':dg<0?' (debilitated)':''),MK_VOL[c]*.3);
  });
  // aspects
  const L=['Su','Mo','Ma','Me','Ju','Ve','Sa','Ra'], moBen=moW>0, done={};
  const asp=(a,b,orb)=>{const d=mkAng(T[a],T[b]); for(let k=0;k<MK_ASP.length;k++){const o=Math.abs(d-MK_ASP[k][0]); if(o<orb)return {A:MK_ASP[k][0],n:MK_ASP[k][1],f:1-o/orb,o:o};} return null;};
  // explicit pairs from the books (includes the outer planets)
  Object.keys(MK_PAIR).forEach(key=>{
    const a=key.slice(0,2), b=key.slice(2), r=asp(a,b,6); if(!r)return; done[a+b]=1; done[b+a]=1;
    const pr=MK_PAIR[key], hm=r.A===0||r.A===60||r.A===120, w=hm?pr[0]:pr[1]; if(!w&&!pr[2])return;
    add('BK',w*r.f,MK_PAIR[key][3]+' · '+r.n,pr[2]*r.f);
  });
  if(!done.SuMe){const r=asp('Su','Me',2); if(r&&r.A===0)flag('Sun–Mercury conjunction: high-volume reversal day',.3);}
  for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){
    const a=L[i],b=L[j]; if(done[a+b])continue; const fast=(a==='Mo'||b==='Mo'), r=asp(a,b,fast?5:6); if(!r)continue;
    const hm=r.A===0||r.A===60||r.A===120, ba=a==='Mo'?moBen:mkBen(a), bb=b==='Mo'?moBen:mkBen(b), ma=mkMal(a), mb=mkMal(b); let w;
    if(a==='Su'||b==='Su')continue;
    else if(ba&&bb&&!ma&&!mb)w=hm?.5:-.15;
    else if(ma&&mb){w=r.A===0?-.6:(r.A===180||r.A===90)?-.5:-.2; v+=.5*r.f;}
    else {w=hm?.1:-.45; v+=.2*r.f;}
    add('ASP',w*r.f*(fast?.6:1),NAME[a]+' '+r.n+' '+NAME[b],0);
  }
  const sgm=SEGS[findSeg(P.Mo)], nb=c=>(c==='Ju'||c==='Ve'||c==='Me'||c==='Mo')?1:(c==='Sa'||c==='Ma'||c==='Ra'||c==='Ke')?-1:0;
  add('LUN',.25*nb(sgm.star),'Moon in '+NAME[sgm.star]+'’s star',0); add('LUN',.15*nb(sgm.sub),'Moon sub lord '+NAME[sgm.sub],0);
  // stations (trend changes are likely when a planet stands still) and Mercury retrograde whipsaw
  Object.keys(MK_SPD).forEach(c=>{const d=mod(sidLon(c,ms+43200000)-sidLon(c,ms-43200000)+180,360)-180; if(Math.abs(d)<(c==='Me'||c==='Ve'?.1:.05)*MK_SPD[c])flag(NAME[c]+' stationary: trend-change window',c==='Me'?.3:.15);});
  // transits to the market's natal chart
  if(natal){
    MK_NAT.forEach(rl=>{rl[0].forEach(tc=>{rl[2].forEach(nc=>{ if(natal[nc]==null||T[tc]==null)return;
      const d=mkAng(T[tc],natal[nc]), orb=tc==='Mo'?3:2; rl[1].forEach(A=>{const o=Math.abs(d-A); if(o<orb)add('NAT',rl[3]*(1-o/orb*.5),(tc==='Su'||tc==='Mo'?MK_PN[tc]:MK_PN[tc])+' '+(A===0?'conjunct':A===60?'sextile':A===90?'square':A===120?'trine':'opposite')+' natal '+MK_PN[nc]+' ('+rl[4]+')',rl[3]<0?.15:0);});});});});
  }
  // transit ascendant and cusps: the book says stress on the money houses (2, 5, 8, 11) is a warning, the KP 11th-house rules mark gain
  if(lat!=null){
    const e=tpEval(ms,lat,lon,kind), ag=e.g, S=e.S, s11=e.sig(e.seg(11).sub);
    if(S.AB.has(11)&&!S.AB.has(12))add('ASC',.2,'Ascendant sub lord '+NAME[ag.sub]+' signifies the 11th house (gain)',0);
    if((S.AB.has(8)||S.AB.has(12))&&!S.AB.has(11))add('ASC',-.25,'Ascendant sub lord '+NAME[ag.sub]+' signifies the 8th or 12th house (loss)',.1);
    if(S.AS.has(11))add('ASC',.1,'Ascendant star lord '+NAME[ag.star]+' signifies the 11th house',0); else if(S.AS.has(12))add('ASC',-.15,'Ascendant star lord '+NAME[ag.star]+' signifies the 12th house',0);
    if(S.MS.has(11))add('ASC',.15,'Moon’s star lord signifies the 11th house',0);
    if(s11.has(11)||s11.has(2))add('ASC',.12,'11th cusp sub lord signifies gain houses',0);
    if(e.ok)add('ASC',e.strong?.5:.3,'Transit ascendant meets the Trade Profit rules'+(e.strong?' (strong)':''),0);
  }
  let bsec={};
  try{ const bk=mkBook(ms,lat,lon,kind,P,T,R,ay,ph); let tot={KPG:0,SMA:0,NAK:0,HOR:0};
    bk.items.forEach(it=>{ const cap={KPG:.5,SMA:.9,NAK:.35,HOR:.25}[it[0]]; const w=it[1]; tot[it[0]]+=w; if(Math.abs(tot[it[0]])<=cap+Math.abs(w)){ add(it[0],w,it[2],it[3]); } });
    if(bk.vol){ v+=bk.vol; } if(bk.flag)flag(bk.flag,0); bsec=bk.sec; }catch(err){}
  dr.sort((x,y)=>Math.abs(y.w)-Math.abs(x.w));
  return {s:mkClamp(sum/2.6,-1,1),v:mkClamp((v-2.1)/1.4,0,1),dr:dr,flags:flags,grp:grp,sec:bsec};
}
const MK_NAT_W={Su:.2,Ma:-.3,Me:.3,Ju:1,Ve:.7,Sa:-.8,Ra:-.6,Ke:-.4};
function mkBuild(bars,lat,lon,kind,base,hasPrev,natal){
  const C=[]; let prev=base;
  bars.forEach((b,i)=>{
    const sc=[]; for(let j=0;j<b.ns;j++)sc.push(mkScore(b.t1+(b.t2-b.t1)*(b.ns>1?j/(b.ns-1):0),lat,lon,kind,natal));
    const k=sc.length, ms=sc.reduce((a,x)=>a+x.s,0)/k, mv=sc.reduce((a,x)=>a+x.v,0)/k, aa=b.A/100;
    const open=(i===0&&!hasPrev)?base:(b.gap?prev*(1+aa*.25*sc[0].s):prev);
    let p=open, hi=open, lo=open; sc.forEach(x=>{p*=1+aa*x.s/k; hi=Math.max(hi,p); lo=Math.min(lo,p);});
    const w=mv*aa*.5; hi*=1+w; lo*=1-w;
    const acc={}, grp={}, fl={}; Object.keys(MK_G).forEach(g=>{grp[g]=0;});
    sc.forEach(x=>{x.dr.forEach(d=>{const a=acc[d.t]||(acc[d.t]={t:d.t,w:0,g:d.g}); a.w+=d.w/k;}); Object.keys(x.grp).forEach(g=>{grp[g]+=x.grp[g]/k;}); x.flags.forEach(f=>{fl[f]=(fl[f]||0)+1;});});
    const all=Object.keys(acc).map(t=>acc[t]).sort((x,y)=>Math.abs(y.w)-Math.abs(x.w));
    const flags=Object.keys(fl).filter(f=>fl[f]>=Math.max(1,k/4));
    const sg=Math.sign(ms), agree=Object.keys(grp).filter(g=>Math.abs(grp[g])>.03).map(g=>Math.sign(grp[g])===sg?1:0), conf=Math.round(mkClamp(Math.abs(ms)/.5,0,1)*70+(agree.length?agree.reduce((a,x)=>a+x,0)/agree.length:0)*30);
    const secA={}; sc.forEach(x=>{Object.keys(x.sec||{}).forEach(q=>{secA[q]=(secA[q]||0)+x.sec[q]/k;});});
    C.push({i:i,o:open,h:hi,l:lo,c:p,s:ms,v:mv,t1:b.t1,t2:b.t2,dr:all.slice(0,4),all:all,grp:grp,flags:flags,conf:conf,off:b.off,sec:secA}); prev=p;
  });
  return C;
}

let MK={C:null,meta:null,pat:null,ev:null,sel:-1,rows:[],real:false,bt:null}, MK_LIST=[];
const mkFmt=(x,b)=>b>=1000?x.toFixed(0):b>=100?x.toFixed(1):x.toFixed(2);
function mkBias(s){return s>.12?['Bullish','ஏற்றம்','up']:s<-.12?['Bearish','இறக்கம்','dn']:['Neutral','சமநிலை','nu'];}
function mkChart(){
  const C=MK.C, P=MK.pat, m=MK.meta, n=C.length, W=720, x0=54, x1=708, ys=18, ye=318, sy0=346, sy1=410;
  let lo=Math.min.apply(null,C.map(x=>x.l)), hi=Math.max.apply(null,C.map(x=>x.h)); const pd=(hi-lo)*.06||hi*.01; lo-=pd; hi+=pd;
  const Y=v=>ye-(v-lo)/(hi-lo)*(ye-ys), step=(x1-x0)/n, X=i=>x0+(i+.5)*step, bw=Math.max(2,Math.min(18,step*.62));
  let s='<svg class="mkc" viewBox="0 0 '+W+' 470" role="img" aria-label="Planetary pressure candles" preserveAspectRatio="xMidYMid meet">';
  for(let k=0;k<=5;k++){const v=lo+(hi-lo)*k/5, y=Y(v); s+='<line x1="'+x0+'" x2="'+x1+'" y1="'+y.toFixed(1)+'" y2="'+y.toFixed(1)+'" class="mkg"/><text x="'+(x0-6)+'" y="'+(y+3.5).toFixed(1)+'" text-anchor="end" class="mkt">'+mkFmt(v,m.base)+'</text>';}
  // x labels
  const lab=Math.max(1,Math.ceil(n/8)); let lastDay='';
  C.forEach((c,i)=>{const d=fmtDate(c.t1,c.off), intr=m.tf!=='1d';
    if(intr){ if(d!==lastDay){lastDay=d; s+='<line x1="'+(x0+i*step).toFixed(1)+'" x2="'+(x0+i*step).toFixed(1)+'" y1="'+ys+'" y2="'+sy1+'" class="mkd"/><text x="'+(x0+i*step+3).toFixed(1)+'" y="'+(ys+10)+'" class="mkt">'+d.replace(/ \d{4}$/,'')+'</text>';}
      if(i%Math.max(1,Math.ceil(n/12))===0)s+='<text x="'+X(i).toFixed(1)+'" y="432" text-anchor="middle" class="mkt">'+fmtHMS(c.t1,c.off).slice(0,5)+'</text>'; }
    else if(i%lab===0)s+='<text x="'+X(i).toFixed(1)+'" y="432" text-anchor="middle" class="mkt">'+d.replace(/ \d{4}$/,'')+'</text>';});
  // levels
  P.lines.forEach(l=>{const y=Y(l.y).toFixed(1); s+='<line x1="'+(x0+l.from*step).toFixed(1)+'" x2="'+x1+'" y1="'+y+'" y2="'+y+'" class="mkl '+(l.type==='R'?'mkr':'mks')+'"/><text x="'+(x1-2)+'" y="'+(Y(l.y)-3).toFixed(1)+'" text-anchor="end" class="mkt">'+(l.type==='R'?'Resistance':'Support')+' '+mkFmt(l.y,m.base)+'</text>';});
  // averages
  const pl=a=>{let d='';a.forEach((v,i)=>{if(v!=null)d+=(d?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1);});return d;};
  if(n>=6)s+='<path d="'+pl(P.m5)+'" class="mka"/>'; if(n>=11)s+='<path d="'+pl(P.m10)+'" class="mkav2"/>';
  // candles
  C.forEach((c,i)=>{const up=c.c>=c.o, cl=up?'mkup':'mkdn', yo=Y(c.o), yc=Y(c.c), top=Math.min(yo,yc), h=Math.max(1,Math.abs(yo-yc));
    s+='<g class="mkcg'+(i===MK.sel?' sel':'')+'" data-i="'+i+'" tabindex="0"><rect x="'+(X(i)-step/2).toFixed(1)+'" y="'+ys+'" width="'+step.toFixed(1)+'" height="'+(sy1-ys)+'" class="mkhit"/><line x1="'+X(i).toFixed(1)+'" x2="'+X(i).toFixed(1)+'" y1="'+Y(c.h).toFixed(1)+'" y2="'+Y(c.l).toFixed(1)+'" class="'+cl+'w"/><rect x="'+(X(i)-bw/2).toFixed(1)+'" y="'+top.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+h.toFixed(1)+'" class="'+cl+'"/>'+
      '<title>'+m3e(fmtDate(c.t1,c.off)+(m.tf!=='1d'?' '+fmtHMS(c.t1,c.off):'')+'  O '+mkFmt(c.o,m.base)+'  H '+mkFmt(c.h,m.base)+'  L '+mkFmt(c.l,m.base)+'  C '+mkFmt(c.c,m.base)+'  '+mkBias(c.s)[0])+'</title></g>';
    // sentiment bar
    const sh=Math.abs(c.s)*(sy1-sy0)/2, base=(sy0+sy1)/2; s+='<rect x="'+(X(i)-bw/2).toFixed(1)+'" y="'+(c.s>=0?base-sh:base).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+Math.max(.5,sh).toFixed(1)+'" class="'+(c.s>=0?'mkup':'mkdn')+'" opacity=".55"/>';});
  s+='<line x1="'+x0+'" x2="'+x1+'" y1="'+((sy0+sy1)/2)+'" y2="'+((sy0+sy1)/2)+'" class="mkg"/><text x="'+(x0-6)+'" y="'+(sy0+8)+'" text-anchor="end" class="mkt">+</text><text x="'+(x0-6)+'" y="'+(sy1)+'" text-anchor="end" class="mkt">−</text><text x="'+x0+'" y="'+(sy0-6)+'" class="mkt">Planetary pressure (bar up = bullish, down = bearish)</text>';
  C.forEach((c,i)=>{ if(c.flags&&c.flags.length)s+='<text x="'+X(i).toFixed(1)+'" y="'+(ys+10)+'" text-anchor="middle" class="mkcit"><title>'+m3e(c.flags.join(' · '))+'</title>⟲</text>'; });
  // patterns
  const lab2=n<=45; P.pats.forEach(p=>{const c=C[p.i], x=X(p.i); const y=p.dir>=0?Y(c.l)+13:Y(c.h)-6; s+='<text x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" text-anchor="middle" class="mkp'+(p.dir>0?' bu':p.dir<0?' be':'')+'">'+(p.dir>0?'▲':p.dir<0?'▼':'◆')+'</text>'+(lab2&&p.kind==='candle'?'<text x="'+x.toFixed(1)+'" y="'+(y+(p.dir>=0?9:-9)).toFixed(1)+'" text-anchor="middle" class="mkn">'+m3e(p.name.split(' ')[0].slice(0,6))+'</text>':'');});
  // events on the x axis
  MK.ev.forEach(e=>{let i=C.findIndex(c=>e.t>=c.t1&&e.t<=c.t2); if(i<0)i=C.findIndex(c=>c.t1>=e.t); if(i<0)return; s+='<path d="M'+X(i).toFixed(1)+' 440l4 6l-4 6l-4 -6z" class="mke '+(e.tone>0?'bu':e.tone<0?'be':'')+'"><title>'+m3e(e.en)+'</title></path>';});
  s+='<text x="'+x0+'" y="466" class="mkt">◆ transit event · ▲ bullish pattern · ▼ bearish pattern · ⟲ turning-point window · lines: 5 and 10 candle averages</text>';
  s+='<text x="'+((x0+x1)/2)+'" y="'+((ys+ye)/2)+'" text-anchor="middle" class="mkwm">GuruAgasthiya</text></svg>';
  return s;
}
const mkSgn=x=>x>0?'+':'';
function mkWhy(c,n){
  const g=MK_G, keys=Object.keys(g).filter(k=>Math.abs(c.grp[k])>.02).sort((a,b)=>Math.abs(c.grp[b])-Math.abs(c.grp[a]));
  let h='<div class="mkgrp">'+keys.map(k=>'<span class="mkdrv '+(c.grp[k]>=0?'bu':'be')+'">'+g[k]+' '+mkSgn(c.grp[k])+c.grp[k].toFixed(2)+'</span>').join(' ')+'</div>';
  h+='<ul class="mkwhy">'+c.all.slice(0,n||6).map(d=>'<li class="'+(d.w>=0?'bu':'be')+'"><b>'+(d.w>=0?'▲':'▼')+'</b> '+m3e(d.t)+' <span class="muted">('+g[d.g]+', '+mkSgn(d.w)+d.w.toFixed(2)+')</span></li>').join('')+'</ul>';
  if(c.flags.length)h+='<div class="mkfl">⟲ '+c.flags.map(m3e).join(' · ')+'</div>';
  return h;
}
function mkAdvice(c){
  const b=mkBias(c.s)[2], vol=c.v>.6?'high':c.v>.3?'moderate':'low';
  let t=b==='up'?'Bias is up: favour buying dips and avoid shorting against the rule agreement.':b==='dn'?'Bias is down: favour selling rallies or staying out of long trades.':'No clear bias: range-bound, keep trades small or wait.';
  if(c.flags.length)t+=' A turning-point window is active, so expect a possible reversal; use tight stops.';
  if(c.v>.6)t+=' Volatility is high.';
  return t+' (Volatility: '+vol+'.)';
}
function mkDetail(i){
  const c=MK.C[i], m=MK.meta; if(!c){$('mkDet').innerHTML='';return;} const b=mkBias(c.s), chg=(c.c/c.o-1)*100, rg=(c.h/c.l-1)*100;
  $('mkDet').innerHTML='<div class="mkdet"><b>'+fmtDate(c.t1,c.off)+(m.tf!=='1d'?' '+fmtHMS(c.t1,c.off).slice(0,5)+'–'+fmtHMS(c.t2,c.off).slice(0,5):'')+'</b> · <span class="mkb'+b[2]+'">'+b[0]+' · '+b[1]+'</span> ('+mkSgn(c.s)+c.s.toFixed(2)+', rule agreement '+c.conf+'%, volatility '+Math.round(c.v*100)+'%)<br>'+(MK.real?'Real ':'')+'Open '+mkFmt(c.o,m.base)+' · High '+mkFmt(c.h,m.base)+' · Low '+mkFmt(c.l,m.base)+' · Close '+mkFmt(c.c,m.base)+' ('+mkSgn(chg)+chg.toFixed(2)+'%, range '+rg.toFixed(2)+'%)'+
    '<div class="mkadv">'+m3e(mkAdvice(c))+'</div><div class="muted" style="margin-top:4px">Why:</div>'+mkWhy(c,8)+'<div class="btns"><button type="button" class="mkopen" data-i="'+i+'">Show transit chart for this candle</button></div></div>';
}
const MK_BOOK=[
 ['KP Graphs: Moon string','The Moon’s string has four levels: planet, sign lord, star lord, sub lord. Each lower level allows or denies what the level above proposes; a denying sub lord reverses the call. Benefic lords lift, malefic lords press.','KP Graphs (Electron Systems), string levels R1–R4'],
 ['Planet in sign, aspected by','For each planet in each sign the book lists planets whose aspect brings positive or negative momentum for named sectors, and a second group that reverses or softens it. All 144 entries are built in; each hit moves the sector heat and the index.','Stock Market Astrology ch. 7'],
 ['Moon nakshatra day','If the lord of the Moon’s star is aspected by benefics the lord’s sectors rise, by malefics they fall; stronger when the Moon is aspected the same way.','Stock Market Astrology ch. 8'],
 ['Hora (planetary hour)','Jupiter, Venus, Mercury and Moon hours favour buying; Mars and Saturn hours press prices or make them choppy.','Stock Market Astrology ch. 10'],
 ['Ascendant sector, aspects, crowding','The ascendant sign sets the sector in focus; benefic aspects to it are positive. Four or more planets in one sign give a directionless, volatile market.','Stock Market Astrology ch. 2, 11'],
 ['Lunar cycle','Buy around the New Moon and sell around the Full Moon; the first half of the lunar month accumulates and the second half distributes; quarter moons and eclipses are change-in-trend windows.','Lee and Tryde ch. 9; Celestial Mechanics §2.1, §7.1'],
 ['Planet strength','Jupiter and Venus are bullish, Saturn, Rahu, Ketu and Mars bearish or volatile; strong signs help benefics and soften malefics; retrograde benefics weaken; Mercury retrograde brings whipsaw.','Celestial Mechanics §1.1, §2'],
 ['Classic pairs','Venus–Jupiter harmonic bullish; Venus–Saturn hard, Mars–Saturn, Sun–Saturn hard bearish; Mars–Uranus, Saturn–Uranus, Saturn–Pluto hard bearish and volatile; Jupiter–Uranus speculative boom; Sun–Mercury conjunction is a high-volume reversal day.','Celestial Mechanics §3.3'],
 ['Planet aspects','Other pairs: benefics in harmony bullish; benefic under a hard aspect from a pressure planet bearish; two pressure planets together bearish and volatile.','Celestial Mechanics §3.1, §3.2'],
 ['Transit to market natal chart','Transiting Venus or Jupiter sextile or trine the market’s natal Sun, Jupiter or Pluto; Sun on natal Ascendant; Mars trine natal Venus or Jupiter; Jupiter aspecting the natal Part of Fortune are favourable; Saturn, Mars, Uranus or Pluto hard to natal money planets is a warning. Orb 2°.','Lee and Tryde ch. 9, Table 9.1'],
 ['Transit ascendant and cusps','Stress on the money houses (2, 5, 8, 11) is a warning, gain shows through the 11th. In KP terms: ascendant sub lord and star lord, the Moon’s star lord and the 11th-cusp sub lord signifying the 11th house add; signifying the 8th or 12th subtract.','Lee and Tryde ch. 9 (money houses); the Trade Profit rules in this app'],
 ['Turning-point windows','A planet standing still (stationary), Sun–Mercury conjunction, Full Moon, quarter moons and eclipse windows raise volatility and mark a possible change in trend.','Celestial Mechanics §2.2, §3.3; Lee and Tryde ch. 9']
];
/* ---------- v7.2: Market Predictions (sectors, days, chart) ---------- */
function mkPred(){
  const C=MK.C, m=MK.meta; if(!C||!C.length)return '';
  const agg={}, cntS={}; C.forEach(c=>{Object.keys(c.sec||{}).forEach(k=>{agg[k]=(agg[k]||0)+c.sec[k]; cntS[k]=(cntS[k]||0)+1;});});
  const keys=Object.keys(agg).sort((a,b)=>agg[b]-agg[a]), mx=Math.max.apply(null,keys.map(k=>Math.abs(agg[k]/C.length)).concat([.01]));
  const T=c=>fmtDate(c.t1,c.off)+(m.tf!=='1d'?' '+fmtHMS(c.t1,c.off).slice(0,5):'');
  let h='<div class="lf-sec"><h3>Market Predictions<span class="ta">சந்தை கணிப்புகள்</span></h3></div>';
  // prediction chart: bias strip and running index
  const W=640,H=170,pad=26, n=C.length, bw=Math.max(2,Math.min(26,(W-2*pad)/n-1)), X=i=>pad+(n>1?i*(W-2*pad-bw)/(n-1):0);
  let run=[],p=100; C.forEach(c=>{p*=1+(c.s*(m.tf==='1d'?.006:.002)); run.push(p);});
  const lo=Math.min.apply(null,run), hi=Math.max.apply(null,run), Y=v=>pad+(hi===lo?(H-2*pad)/2:(hi-v)/(hi-lo)*(H-2*pad));
  let s='<svg viewBox="0 0 '+W+' '+H+'" class="mkpsvg" role="img" aria-label="Prediction chart: planetary bias per candle and running index"><line x1="'+pad+'" x2="'+(W-pad)+'" y1="'+(H/2)+'" y2="'+(H/2)+'" stroke="currentColor" stroke-opacity=".25"/>';
  C.forEach((c,i)=>{ const hh=Math.abs(c.s)*(H/2-pad), up=c.s>=0; s+='<rect x="'+X(i).toFixed(1)+'" y="'+(up?H/2-hh:H/2).toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+Math.max(1,hh).toFixed(1)+'" fill="'+(up?'#2e9e5b':'#d4493d')+'" opacity="'+(.35+.65*c.conf/100).toFixed(2)+'"><title>'+m3e(T(c)+' · bias '+mkSgn(c.s)+c.s.toFixed(2)+' · agreement '+c.conf+'%')+'</title></rect>'; });
  s+='<polyline fill="none" stroke="#3b6fd8" stroke-width="2" points="'+run.map((v,i)=>(X(i)+bw/2).toFixed(1)+','+Y(v).toFixed(1)).join(' ')+'"/>';
  s+='<text x="'+pad+'" y="12" font-size="11" fill="currentColor">Bars: bias per candle (stronger colour = more rules agree) · line: running index from 100</text></svg>';
  h+='<div class="mkwrap">'+s+'</div>';
  // sectors
  h+='<div class="tblw"><table class="mkst"><thead><tr><th>Sector</th><th>Outlook for the period</th><th>Heat</th></tr></thead><tbody>'+keys.map(k=>{const v=agg[k]/C.length, w=Math.round(Math.abs(v)/mx*100), b=v>.004?['Bullish','ஏற்றம்','up']:v<-.004?['Bearish','இறக்கம்','dn']:['Neutral','சமநிலை','nu']; return '<tr><td>'+m3e(k)+'</td><td><span class="mkb'+b[2]+'">'+b[0]+' · '+b[1]+'</span></td><td><div style="height:8px;border-radius:4px;width:'+Math.max(4,w)+'%;background:'+(v>=0?'#2e9e5b':'#d4493d')+'"></div></td></tr>';}).join('')+'</tbody></table></div>';
  // day by day
  h+='<div class="tblw"><table class="mkst"><thead><tr><th>'+(m.tf==='1d'?'Day':'Time')+'</th><th>Bias</th><th>Agreement</th><th>Sectors up</th><th>Sectors down</th><th>Main book rules</th></tr></thead><tbody>'+C.map(c=>{
    const b=mkBias(c.s), ks=Object.keys(c.sec||{}).sort((x,y)=>c.sec[y]-c.sec[x]), up=ks.filter(k=>c.sec[k]>.006).slice(0,2), dn=ks.slice().reverse().filter(k=>c.sec[k]<-.006).slice(0,2);
    const why=c.all.filter(d=>d.g==='KPG'||d.g==='SMA'||d.g==='NAK'||d.g==='HOR').slice(0,2).map(d=>m3e(d.t)).join('<br>');
    return '<tr><td>'+T(c)+'</td><td><span class="mkb'+b[2]+'">'+b[0]+' '+mkSgn(c.s)+c.s.toFixed(2)+'</span></td><td>'+c.conf+'%</td><td>'+(up.map(m3e).join(', ')||'—')+'</td><td>'+(dn.map(m3e).join(', ')||'—')+'</td><td class="muted">'+(why||'—')+'</td></tr>';}).join('')+'</tbody></table></div>';
  h+='<p class="legend">These predictions come only from the rules of the two books (KP Graphs; Stock Market Astrology) and the earlier rule sets. The weights are the app’s own reading of the books’ qualitative rules and have <b>not been proven on price data</b>: paste your real prices below to see how they compare, and treat the output as a study aid, not advice.</p>';
  return h;
}

function mkRender(){
  const C=MK.C, m=MK.meta, P=MK.pat; MK.sel=-1;
  const bull=C.filter(x=>mkBias(x.s)[2]==='up').length, bear=C.filter(x=>mkBias(x.s)[2]==='dn').length, tot=(C[C.length-1].c/C[0].o-1)*100;
  const by=f=>C.slice().sort(f), T=c=>fmtDate(c.t1,c.off)+(m.tf!=='1d'?' '+fmtHMS(c.t1,c.off).slice(0,5):'');
  const top=by((a,b)=>b.s-a.s).slice(0,3), bot=by((a,b)=>a.s-b.s).slice(0,3), vol=by((a,b)=>b.v-a.v).slice(0,3), cit=C.filter(c=>c.flags.length);
  const now=Date.now(), nxf=C.find(c=>c.t2>now), nx=nxf||C[C.length-1], nb=mkBias(nx.s);
  let h='<div class="lf-sec"><h3>Prediction<span class="ta">கணிப்பு</span></h3></div>';
  h+='<div class="mkfc '+nb[2]+'"><div class="mkfh"><b>'+(MK.real?'Next candle':'Next session')+' · '+T(nx)+'</b><span class="mkb'+nb[2]+'">'+nb[0]+' · '+nb[1]+'</span></div>'+
    '<div>Rule agreement <b>'+nx.conf+'%</b> · volatility <b>'+Math.round(nx.v*100)+'%</b> · expected range <b>'+mkFmt(nx.l,m.base)+' – '+mkFmt(nx.h,m.base)+'</b></div><div class="mkadv">'+m3e(mkAdvice(nx))+'</div>'+mkWhy(nx,5)+'</div>';
  h+='<div class="mksum"><b>Outlook:</b> '+P.trend+' ('+mkSgn(P.slope)+P.slope.toFixed(1)+'% over the period) · '+bull+' bullish and '+bear+' bearish of '+C.length+' candles · '+(MK.real?'real prices moved ':'index moves ')+mkSgn(tot)+tot.toFixed(2)+'%.<br>'+
    '<b>Best to buy:</b> '+top.map(T).join(' · ')+'<br><b>Best to sell / avoid:</b> '+bot.map(T).join(' · ')+'<br><b>Most volatile:</b> '+vol.map(T).join(' · ')+(cit.length?'<br><b>Turning-point windows (⟲):</b> '+cit.slice(0,6).map(T).join(' · ')+(cit.length>6?' …':''):'')+'</div>';
  if(MK.bt)h+=mkBtHtml();
  h+='<div class="lf-sec"><h3>'+(MK.real?'Your real candles with planetary bias':'Predicted candles · planetary pressure')+'<span class="ta">கிரக அழுத்த மெழுகுவர்த்தி</span></h3></div>';
  h+='<div class="mkwrap" id="mkChart">'+mkChart()+'</div><div id="mkDet"></div>';
  h+='<div class="lf-sec"><h3>Patterns and the planets behind them<span class="ta">வடிவங்களும் கிரக நிலைகளும்</span></h3></div>';
  h+=P.pats.length?'<ul class="mkpl">'+P.pats.map(p=>{const c=C[p.i]; return '<li class="'+(p.dir>0?'bu':p.dir<0?'be':'')+'" data-i="'+p.i+'"><b>'+(p.dir>0?'▲ ':p.dir<0?'▼ ':'◆ ')+m3e(p.name)+'</b> · '+T(c)+'<br><span class="muted">'+m3e(p.txt)+'</span><br><span class="mkal">Planets that day: '+c.all.slice(0,3).map(d=>m3e(d.t)).join(' · ')+(c.flags.length?' · ⟲ '+m3e(c.flags[0]):'')+'</span></li>';}).join('')+'</ul>':'<p class="legend">No candlestick or chart pattern met the rules in this period.</p>';
  h+='<div class="lf-sec"><h3>Transit events and their impact<span class="ta">கோசார நிகழ்வுகளும் தாக்கமும்</span></h3></div>';
  h+=MK.ev.length?'<ul class="mkpl">'+MK.ev.map(e=>'<li class="'+(e.tone>0?'bu':e.tone<0?'be':'')+'"><b>'+m3e(e.en)+'</b> · '+fmtDate(e.t,m.off0)+' '+fmtHMS(e.t,m.off0).slice(0,5)+' <span class="mkty">'+e.type+'</span><br><span class="ta">'+m3e(e.ta)+'</span><br><span class="muted">'+m3e(e.imp)+'</span></li>').join('')+'</ul>':'<p class="legend">No ingress, station or exact aspect of the slow planets in this period.</p>';
  const snap=(ms)=>'<div class="tblw"><table class="mkst"><thead><tr><th>Planet</th><th>Position · lords</th><th>Tone</th><th>Impact</th></tr></thead><tbody>'+mkSnapshot(ms,m.kind).map(x=>'<tr><td>'+NAME[x.c]+'<span class="ta"> '+TA[x.c]+'</span>'+(x.rt&&x.c!=='Ra'&&x.c!=='Ke'?' (R)':'')+'</td><td>'+SIGNS[x.g.sign][0]+' '+dms(x.l-x.g.sign*30)+'<br><span class="muted">'+NAME[x.g.lord]+'/'+NAME[x.g.star]+'/'+NAME[x.g.sub]+'</span></td><td class="'+(x.tone>0?'okc':x.tone<0?'nokc':'')+'">'+(x.tone>0?'Bullish':x.tone<0?'Bearish':'Mixed')+(x.dg>0?'<br><span class="muted">strong</span>':x.dg<0?'<br><span class="muted">weak</span>':'')+'</td><td>'+m3e(MK_IMP[x.c])+'<br><span class="muted">'+MK_SEC[x.c]+'</span></td></tr>').join('')+'</tbody></table></div>';
  h+='<details class="howto"><summary>Planet impacts at the start · '+T(C[0])+'<span class="tt">தொடக்க நிலை</span></summary>'+snap(C[0].t1)+'</details>';
  h+='<details class="howto"><summary>Planet impacts at the end · '+T(C[C.length-1])+'<span class="tt">இறுதி நிலை</span></summary>'+snap(C[C.length-1].t2)+'</details>';
  h+='<details class="howto"><summary>Rule book: which rules were used and where they come from<span class="tt">விதிகள்</span></summary><div class="tblw"><table class="mkst"><thead><tr><th>Group</th><th>Rule</th><th>Source</th></tr></thead><tbody>'+MK_BOOK.map(r=>'<tr><td><b>'+r[0]+'</b></td><td>'+m3e(r[1])+'</td><td class="muted">'+m3e(r[2])+'</td></tr>').join('')+'</tbody></table></div></details>';
  h+=mkPred();
  h+='<div class="lf-sec"><h3>Candle by candle<span class="ta">ஒவ்வொரு மெழுகுவர்த்தியும்</span></h3></div><ul class="list">'+C.map((c,i)=>{const b=mkBias(c.s), g=SEGS[findSeg(sidAsc(c.t1,m.lat,m.lon,m.kind))];
    return '<li class="row gm m3row m3c mkrow" data-i="'+i+'" data-s="'+Math.round(c.t1)+'" data-e="'+Math.round(c.t2)+'" data-tz="'+c.off+'" data-lat="'+m.lat+'" data-lon="'+m.lon+'" data-kind="'+m.kind+'" style="--h:'+(c.s>=0?140:5)+'">'+
      '<div class="m3n"><b class="mkb'+b[2]+'">'+b[0]+' '+mkSgn(c.s)+c.s.toFixed(2)+'</b><small>'+b[1]+' · agreement '+c.conf+'% · volatility '+Math.round(c.v*100)+'%</small></div><div class="m3t">'+(m.tf==='1d'?fmtDate(c.t1,c.off):fmtHMS(c.t1,c.off).slice(0,5)+'–'+fmtHMS(c.t2,c.off).slice(0,5))+'</div><div class="m3d">'+mkFmt(c.o,m.base)+' → '+mkFmt(c.c,m.base)+'</div>'+
      '<div class="m3r">'+c.all.slice(0,3).map(d=>m3e(d.t)).join(' · ')+(c.flags.length?' · ⟲ '+m3e(c.flags[0]):'')+'</div><div class="l m3x"><span class="n">Market</span><span class="pl"><span class="pill gain">Market Transit · சந்தை கோசாரம்</span></span><span class="ta"></span><span class="c">'+SIGNS[g.sign][0]+' ascendant</span></div></li>';}).join('')+'</ul>';
  $('mkOut').innerHTML=h;
}
/* compare the rules with real daily candles that the user pasted */
function mkCsv(txt){
  const out=[]; txt.split(/\r?\n/).forEach(l=>{ const p=l.trim().split(/[,;\t]+/).map(x=>x.trim().replace(/"/g,'')); if(p.length<5)return; let d=null, m;
    if(m=/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/.exec(p[0]))d=[+m[1],+m[2],+m[3]]; else if(m=/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/.exec(p[0]))d=[+m[3],+m[2],+m[1]];
    if(!d)return; const n=p.slice(1,5).map(x=>parseFloat(x.replace(/[^0-9.\-]/g,''))); if(n.some(isNaN))return; out.push({d:d,o:n[0],h:n[1],l:n[2],c:n[3]}); });
  out.sort((a,b)=>Date.UTC(a.d[0],a.d[1]-1,a.d[2])-Date.UTC(b.d[0],b.d[1]-1,b.d[2])); return out;
}
function mkBacktest(P,R){
  let n=0,hit=0,up=0; const g={}; Object.keys(MK_G).forEach(k=>{g[k]={n:0,h:0};});
  P.forEach((c,i)=>{ const act=R[i].c>=R[i].o?1:-1; up+=act>0?1:0; const pd=c.s>.12?1:c.s<-.12?-1:0; if(pd){n++; if(pd===act)hit++;}
    Object.keys(MK_G).forEach(k=>{const x=c.grp[k]; if(Math.abs(x)>.08){g[k].n++; if(Math.sign(x)===act)g[k].h++;}}); });
  return {n:n,hit:hit,days:P.length,up:up,g:g};
}
function mkBtHtml(){
  const b=MK.bt, pct=(a,c)=>c?Math.round(a/c*100)+'%':'–', noise=Math.round(100/Math.sqrt(Math.max(1,b.n)));
  return '<div class="lf-sec"><h3>Rules against your real candles<span class="ta">உண்மையான விலையுடன் ஒப்பீடு</span></h3></div><div class="mksum">Of <b>'+b.days+'</b> days, the rules gave a clear direction on <b>'+b.n+'</b> and were right on <b>'+b.hit+' ('+pct(b.hit,b.n)+')</b>. Plain chance on these days is about <b>'+pct(Math.max(b.up,b.days-b.up),b.days)+'</b> (the commonest colour). With only '+b.n+' calls the result can move by about ±'+noise+'% by luck alone, so judge it over many months.'+
   '<div class="tblw"><table class="mkst"><thead><tr><th>Rule group</th><th>Days used</th><th>Right</th></tr></thead><tbody>'+Object.keys(MK_G).map(k=>'<tr><td>'+MK_G[k]+'</td><td>'+b.g[k].n+'</td><td>'+pct(b.g[k].h,b.g[k].n)+'</td></tr>').join('')+'</tbody></table></div></div>';
}
function mkRun(){
  const msg=$('mkMsg'), out=$('mkOut'); msg.className='msg err'; out.innerHTML=''; MK.C=null; MK.bt=null; MK.real=false;
  const lat=parseFloat($('mkLat').value), lon=parseFloat($('mkLon').value), tzs=$('mkTz').value.trim(), f=$('mkFrom').value, t=$('mkTo').value, kind=$('mkAyan').value, tf=$('mkTf').value, t1=$('mkT1').value||'09:15', t2=$('mkT2').value||'15:30', A=parseFloat($('mkVol').value)||1, base=parseFloat($('mkBase').value)||100, wk=$('mkWk').checked;
  if(isNaN(lat)||isNaN(lon)||!tzs){msg.textContent='Choose a place (or enter latitude, longitude and time zone).';return;}
  if(typeof Astronomy==='undefined'){msg.textContent='Planet positions need the astronomy library, which did not load.';return;}
  let tzf; try{tzf=tzFn(tzs);}catch(e){msg.textContent='The time zone was not recognised. Use a name such as Asia/Kolkata or hours such as 5.5.';return;}
  const m1=t1.split(':').map(Number), m2=t2.split(':').map(Number); if(m1[0]*60+m1[1]>=m2[0]*60+m2[1]){msg.textContent='The end time must be after the start time.';return;}
  const csv=$('mkCsvIn').value.trim()?mkCsv($('mkCsvIn').value):[]; if($('mkCsvIn').value.trim()&&csv.length<3){msg.textContent='Could not read the prices. Use one line per day: date, open, high, low, close (for example 2026-10-20,25100,25250,25020,25180).';return;}
  const days=[];
  if(csv.length){ csv.forEach(r=>days.push(r.d)); }
  else{
    if(!f||!t){msg.textContent='Pick both a from date and a to date.';return;}
    const a=f.split('-').map(Number), b=t.split('-').map(Number), nd=Math.round((Date.UTC(b[0],b[1]-1,b[2])-Date.UTC(a[0],a[1]-1,a[2]))/86400000)+1;
    if(nd<1){msg.textContent='The to date must not be before the from date.';return;}
    const lim=tf==='1d'?120:7; if(nd>lim){msg.textContent='Please choose at most '+lim+' days for '+(tf==='1d'?'daily':'intraday')+' candles.';return;}
    for(let d=0;d<nd;d++){const dt=new Date(Date.UTC(a[0],a[1]-1,a[2]+d)), wd=dt.getUTCDay(); if(!wk&&(wd===0||wd===6))continue; days.push([dt.getUTCFullYear(),dt.getUTCMonth()+1,dt.getUTCDate()]);}
  }
  const tfu=csv.length?'1d':tf, bars=[]; let off0=0;
  days.forEach(dd=>{ const w1=localToUtc(dd[0],dd[1],dd[2],m1[0],m1[1],tzs).ms, w2=localToUtc(dd[0],dd[1],dd[2],m2[0],m2[1],tzs).ms, off=tzf(w1); if(!bars.length)off0=off;
    if(tfu==='1d')bars.push({t1:w1,t2:w2,off:off,A:A,ns:12,gap:true});
    else{const mins=parseInt(tfu,10), len=mins*60000; for(let s=w1,k=0;s<w2-1000;s+=len,k++)bars.push({t1:s,t2:Math.min(s+len,w2),off:off,A:A*Math.sqrt(Math.min(len,w2-s)/(w2-w1)),ns:3,gap:k===0});}
  });
  if(!bars.length){msg.textContent='No trading days in that range (weekends are skipped unless you tick the box).';return;}
  msg.className='msg'; $('mkGo').disabled=true; const old=CFG; CFG={lat:lat,lon:lon,kind:kind};
  let natal=null; try{
    const nm=$('mkNat').value; if(nm==='nse'){natal=mkNatalOf(localToUtc(1994,11,3,9,0,'5.5').ms,19.076,72.8777,kind);}
    else if(nm==='custom'){const nd=$('mkNatD').value.split('-').map(Number), nt=($('mkNatT').value||'09:15').split(':').map(Number), nl=parseFloat($('mkNatLat').value), no=parseFloat($('mkNatLon').value), nz=$('mkNatTz').value.trim()||'5.5'; if(nd.length===3&&!isNaN(nl)&&!isNaN(no))natal=mkNatalOf(localToUtc(nd[0],nd[1],nd[2],nt[0],nt[1],nz).ms,nl,no,kind);}
  }catch(e){CFG=old;$('mkGo').disabled=false;msg.textContent='Could not read the natal chart: '+(e.message||e);return;}
  const meta={lat:lat,lon:lon,kind:kind,tf:tfu,base:csv.length?csv[0].o:base,off0:off0}; const C=[], per=Math.max(1,Math.ceil(bars.length/40)); let i=0, prev=base;
  (function step(){
    try{ bars.slice(i,i+per).forEach(bb=>{ const c=mkBuild([bb],lat,lon,kind,prev,C.length>0,natal)[0]; c.i=C.length; C.push(c); prev=c.c; }); }
    catch(err){CFG=old;$('mkGo').disabled=false;msg.textContent='Error: '+(err.message||err);return;}
    i+=per; msg.textContent='Reading planets… '+Math.min(i,bars.length)+' of '+bars.length+' candles';
    if(i<bars.length){setTimeout(step,0);return;}
    try{
      let Cx=C; if(csv.length){ MK.bt=mkBacktest(C,csv); MK.real=true; Cx=C.map((c,k)=>Object.assign({},c,{o:csv[k].o,h:csv[k].h,l:csv[k].l,c:csv[k].c})); }
      MK.C=Cx; MK.meta=meta; MK.pat=mkPatterns(Cx); MK.ev=mkEvents(bars[0].t1,bars[bars.length-1].t2,kind);
      CFG=old; mkRender(); msg.textContent=Cx.length+' candles · '+MK.pat.pats.length+' patterns · '+MK.ev.length+' transit events'+(MK.real?' · compared with your real prices':'');
    }catch(err){CFG=old;msg.textContent='Error: '+(err.message||err);}
    $('mkGo').disabled=false; CFG=old;
  })();
}

function mkFillStates(){
  const cn=$('mkCountry').value, el=$('mkState');
  if(cn==='*a'){el.innerHTML='<option value="*s">All states</option>';return;}
  const l=STBY[cn]||[];
  el.innerHTML='<option value="*s">All states ('+l.filter(Boolean).length+')</option>'+l.map(n=>'<option value="'+m3e(n)+'">'+m3e(n||'(state not listed)')+'</option>').join('');
}
function mkFill(){
  const q=$('mkSearch').value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''), cn=$('mkCountry').value, stv=$('mkState').value, all=cn==='*a';
  let src=all?WC:(WCBY[cn]||[]); if(!all&&stv!=='*s')src=src.filter(x=>(x.st||'')===stv);
  const cap=all?300:700; let list=[];
  if(all&&!q)list=[]; else if(!q)list=src.slice(0,cap);
  else{const a=[],b=[]; for(let i=0;i<src.length&&a.length<cap;i++){const k=plKey(src[i]),at=k.indexOf(q); if(at===0)a.push(src[i]); else if(at>0&&b.length<cap)b.push(src[i]);} list=a.concat(b).slice(0,cap);}
  if(!list.length)list=webC(q,mkFill); MK_LIST=list; const sel=$('mkCity');
  sel.innerHTML=list.length?list.map((x,i)=>'<option value="'+i+'">'+m3e(x.n)+((all||stv==='*s')&&x.st?', '+m3e(x.st):'')+(all?', '+m3e(x.cc):'')+'</option>').join(''):'<option value="">No match in the offline list. Online search is tried automatically when you are connected</option>';
  mkPick();
}
function mkPick(){const x=MK_LIST[parseInt($('mkCity').value,10)]; if(x){$('mkLat').value=x.lat;$('mkLon').value=x.lon;$('mkTz').value=x.tz;} mkOff();}
function mkOff(){const el=$('mkOff'), t=$('mkTz').value.trim(); el.className='msg'; if(!t){el.textContent='';return;} try{el.textContent='Time zone now: '+utcTxt(tzFn(t)(Date.now()))+(/^-?[\d.]+$/.test(t)?'':' ('+t+')');}catch(e){el.textContent='The time zone was not recognised.';el.className='msg err';}}

function mkSel(i){ MK.sel=i; $('mkChart').innerHTML=mkChart(); mkDetail(i); }
(function initMk(){
  const cs=$('mkCountry'); cs.innerHTML='<option value="*a">All countries (use search)</option>'+CITY.cc.map(n=>'<option value="'+n.replace(/"/g,'&quot;')+'">'+n+'</option>').join('');
  cs.addEventListener('change',()=>{mkFillStates();mkFill();}); $('mkState').addEventListener('change',mkFill); $('mkSearch').addEventListener('input',mkFill); $('mkCity').addEventListener('change',mkPick); $('mkTz').addEventListener('input',mkOff);
  mkFillStates();
  const d0=new Date(Date.now()+TZ*3600000), d1=new Date(d0.getTime()+29*86400000); $('mkFrom').value=d0.toISOString().slice(0,10); $('mkTo').value=d1.toISOString().slice(0,10);
  $('mkTf').addEventListener('change',()=>{ if($('mkTf').value!=='1d'){const f=new Date($('mkFrom').value+'T00:00:00Z'), t=new Date($('mkTo').value+'T00:00:00Z'); if(isNaN(f)||isNaN(t)||(t-f)/86400000>6)$('mkTo').value=new Date((isNaN(f)?d0.getTime():f.getTime())+4*86400000).toISOString().slice(0,10);} });
  $('mkBtn').addEventListener('click',()=>{ const pn=$('mkPanel'); pn.classList.remove('hide'); mkOff(); pn.scrollIntoView({block:'start'}); });
  $('mkClose').addEventListener('click',()=>$('mkPanel').classList.add('hide'));
  $('mkGo').addEventListener('click',mkRun);
  const nv=()=>{const c=$('mkNat').value==='custom'; ['mkNatD','mkNatT','mkNatLat','mkNatLon','mkNatTz'].forEach(i=>{$(i).closest('.cell').style.display=c?'':'none';});}; $('mkNat').addEventListener('change',nv); nv();
  $('mkLoc').addEventListener('click',()=>{ const el=$('mkOff'); if(!navigator.geolocation){el.textContent='Location is not available here.';el.className='msg err';return;} el.textContent='Finding your location…';el.className='msg';
    navigator.geolocation.getCurrentPosition(pos=>{$('mkLat').value=pos.coords.latitude.toFixed(4);$('mkLon').value=pos.coords.longitude.toFixed(4);let z='';try{z=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(e){} $('mkTz').value=z||String(-new Date().getTimezoneOffset()/60);$('mkSearch').value='';mkOff();},e=>{el.textContent='Could not get your location. Choose a city instead.';el.className='msg err';},{timeout:15000}); });
  $('mkOut').addEventListener('click',e=>{
    const g=e.target.closest('.mkcg'); if(g){mkSel(parseInt(g.dataset.i,10));return;}
    const b=e.target.closest('.mkopen'); if(b){const r=$('mkOut').querySelector('li.mkrow[data-i="'+b.dataset.i+'"]'); if(r)r.click();return;}
    const l=e.target.closest('ul.mkpl li[data-i]'); if(l){mkSel(parseInt(l.dataset.i,10)); $('mkChart').scrollIntoView({block:'center'});}
  });
  window.GA_MK={score:mkScore,build:mkBuild,patterns:mkPatterns,events:mkEvents,snap:mkSnapshot,run:mkRun,state:MK};
})();

/* ---------- v5.2 alarms (v7.0: a melody that sounds 2 times, then the alarm fades out by itself) ----------
   Android app  : window.GuruApp.setAlarm -> AlarmManager.setAlarmClock (rings with the app closed, offline, after a restart)
   Windows app  : GET /alarm/set on the built-in 127.0.0.1 server -> background helper rings at the time
   Browser      : the page rings while it is open (alarms are remembered on this device) */
window.GA_MELODY=(function(){
  /* [frequency Hz, start s, length s]; the same notes are used by the Android and Windows apps */
  const NOTES=[[659.25,0,.34],[783.99,.34,.34],[880,.68,.34],[1046.5,1.02,.34],[880,1.36,.34],[1046.5,1.7,.34],[1318.5,2.04,1.0]];
  const LEN=3.4, GAP=.9, REPEATS=2;
  function play(ctx,t0){
    for(let r=0;r<REPEATS;r++){
      const base=t0+r*(LEN+GAP);
      NOTES.forEach(n=>{
        const d=n[2]+(n[2]>.5?.4:.12), t=base+n[1];
        [[1,.5],[2,.14],[3,.05]].forEach(h=>{
          const o=ctx.createOscillator(), g=ctx.createGain();
          o.type='sine'; o.frequency.value=n[0]*h[0];
          g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(h[1]*.7,t+.015); g.gain.exponentialRampToValueAtTime(0.0001,t+d);
          o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t+d+.02);
        });
      });
    }
    return t0+REPEATS*(LEN+GAP);
  }
  return {play:play,seconds:REPEATS*(LEN+GAP)};
})();

window.GA_ALARM=(function(){
  const KEY='gaArmed';
  let ctx=null, ov=null, timer=null;
  function kind(){
    try{
      if(window.GuruApp&&typeof window.GuruApp.setAlarm==='function')return 'android';
      if(location.hostname==='127.0.0.1'&&location.port==='47831')return 'windows';
    }catch(e){}
    return 'web';
  }
  function q(o){return Object.keys(o).map(k=>k+'='+encodeURIComponent(o[k])).join('&');}
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){return {};}}
  function save(o){try{localStorage.setItem(KEY,JSON.stringify(o));}catch(e){}}
  function set(id,when,title,text,speak){
    const k=kind();
    if(k==='android'){
      try{return Promise.resolve(String(window.GuruApp.setAlarm(String(id),String(Math.round(when)),String(title),String(text||''),String(speak||'')))==='true');}
      catch(e){return Promise.resolve(false);}
    }
    if(k==='windows'){
      return fetch('/alarm/set?'+q({id:id,t:Math.round(when/1000),title:title,text:text||'',speak:speak||''}),{cache:'no-store'}).then(r=>r.status===200,()=>false);
    }
    const o=load(); o[id]={t:Math.round(when),title:title,text:text||'',speak:speak||''}; save(o); arm();
    return Promise.resolve(true);
  }
  function cancel(id){
    const k=kind();
    if(k==='android'){try{window.GuruApp.cancelAlarm(String(id));}catch(e){} return Promise.resolve(true);}
    if(k==='windows'){return fetch('/alarm/del?'+q({id:id}),{cache:'no-store'}).then(r=>r.status===200,()=>false);}
    const o=load(); delete o[id]; save(o); return Promise.resolve(true);
  }
  function has(id){
    const k=kind();
    if(k==='android'){try{return (','+String(window.GuruApp.alarmIds())+',').indexOf(','+id+',')>=0;}catch(e){return false;}}
    if(k==='web'){const a=load()[id]; return !!(a&&a.t>Date.now());}
    return null;   // Windows: the page remembers it
  }
  function test(){
    return set('ga-test',Date.now()+10000,'🔔 Test alarm','For: testing the alarm\nThis is how your muhurtham alarm will sound.','Test alarm. This is how your muhurtham alarm will sound.');
  }
  /* ----- ring inside the page (browser) ----- */
  let fadeT=0, noteN=null;
  function stopRing(){
    clearTimeout(fadeT); try{if(noteN)noteN.close();}catch(e){} noteN=null;
    try{if(ctx)ctx.close();}catch(e){} ctx=null;
    try{if(window.speechSynthesis)speechSynthesis.cancel();}catch(e){}
    try{if(navigator.vibrate)navigator.vibrate(0);}catch(e){}
    if(ov){ov.remove();ov=null;}
  }
  function ring(a,id){
    stopRing();
    ov=document.createElement('div'); ov.className='garing'; ov.setAttribute('role','alertdialog'); ov.setAttribute('aria-modal','true');
    const lines=String(a.text||'').split('\n').filter(Boolean);
    const big=l=>/^For:|ascendant|லக்னம்/.test(l);
    ov.innerHTML='<div class="garing-c"><div class="garing-b">🔔</div><h2></h2><div class="garing-l"></div>'+
      '<div class="garing-x"><button type="button" class="primary" data-a="stop">Success</button><button type="button" data-a="snooze">Snooze 5 min</button></div></div>';
    ov.querySelector('h2').textContent=String(a.title).replace(/^\uD83D\uDD14\s*/,'');
    const box=ov.querySelector('.garing-l');
    lines.forEach(l=>{const d=document.createElement('div'); d.className=big(l)?'big':''; d.textContent=l; box.appendChild(d);});
    ov.addEventListener('click',e=>{
      const b=e.target.closest('button'); if(!b)return;
      if(b.dataset.a==='snooze')set(id+'z',Date.now()+300000,a.title,a.text,a.speak);
      stopRing();
    });
    document.body.appendChild(ov);
    try{
      const C=window.AudioContext||window.webkitAudioContext; ctx=new C(); if(ctx.state==='suspended')ctx.resume();
      const end=GA_MELODY.play(ctx,ctx.currentTime+.1);
      const ms=Math.round((end-ctx.currentTime)*1000);
      fadeT=setTimeout(()=>{ if(!ov)return; ov.classList.add('garing-fade'); fadeT=setTimeout(stopRing,1000); },ms+500);   // two melodies, then it fades out so the next muhurtham alarm can come in its own time
    }catch(e){}
    try{ if('Notification' in window&&Notification.permission==='granted'){ noteN=new Notification(String(a.title).replace(/^\uD83D\uDD14\s*/,''),{body:String(a.text||'').split('\n').filter(Boolean).slice(0,3).join('\n'),tag:'ga-ring'}); } }catch(e){}
    try{if(navigator.vibrate)navigator.vibrate([350,3950,350]);}catch(e){}
  }
  function check(){
    if(kind()!=='web')return;
    const o=load(), now=Date.now(); let ch=false;
    Object.keys(o).forEach(id=>{
      const a=o[id]; if(a.t>now)return;
      delete o[id]; ch=true;
      if(now-a.t<10*60000)ring(a,id);       // a page opened late still rings for up to 10 minutes
    });
    if(ch)save(o);
  }
  function arm(){ if(!timer&&kind()==='web')timer=setInterval(check,1000); }
  arm(); try{check();}catch(e){}
  return {kind:kind,set:set,cancel:cancel,has:has,test:test,ring:ring};
})();


/* ---------- v7.0 star lord total time + exact seconds ----------
   The ascendant stays in one star (nakshatra, 13°20') for about 40 to 100 minutes. Every muhurtham window lists
   the whole run of each star lord it touches, from the second the star begins to the second it ends. */
function stNakRun(ms,lat,lon,kind){
  const W=360/27, L=sidAsc(ms,lat,lon,kind), n=Math.floor(L/W), a=n*W, b=(n+1)*W;
  const diff=(t,tg)=>mod(sidAsc(t,lat,lon,kind)-tg+180,360)-180;
  const find=(tg,lo,hi)=>{ for(let i=0;i<34&&hi-lo>1;i++){ const m=(lo+hi)/2; if(diff(m,tg)<0)lo=m; else hi=m; } return (lo+hi)/2; };
  const s=find(mod(a,360),ms-4*3600000,ms), e=find(mod(b,360),ms,ms+4*3600000), g=SEGS[findSeg(L)];
  return {s:s,e:e,star:g.star,nak:n};
}
function stRuns(s,e,lat,lon,kind){
  const out=[]; let t=s;
  for(let i=0;i<7&&t<e;i++){ const r=stNakRun(t,lat,lon,kind); out.push(r); t=r.e+1000; }
  return out;
}
function stLine(s,e,lat,lon,kind,off){
  const rs=stRuns(s,e,lat,lon,kind);
  return '<div class="stl">'+rs.map(r=>'<span><b>'+NAME[r.star]+' star lord</b> · '+NAKS[r.nak]+' · '+fmtHMS(r.s,off)+' – '+fmtHMS(r.e,off)+' · total <b>'+dur(r.e-r.s)+'</b></span>').join('')+'</div>';
}
(function initStarLine(){
  const fix=root=>{
    root.querySelectorAll('li.row[data-s][data-e][data-lat]:not([data-stl])').forEach(li=>{
      li.setAttribute('data-stl','1');
      try{
        const s=+li.getAttribute('data-s'), e=+li.getAttribute('data-e'), lat=parseFloat(li.getAttribute('data-lat')), lon=parseFloat(li.getAttribute('data-lon')), kind=li.getAttribute('data-kind')||'kp', off=parseFloat(li.getAttribute('data-tz'));
        if(!isFinite(s)||!isFinite(e)||!isFinite(lat)||!isFinite(lon)||!isFinite(off))return;
        const p=li.querySelector(':scope > .p'); const html=stLine(s,e,lat,lon,kind,off);
        if(p)p.insertAdjacentHTML('beforebegin',html); else li.insertAdjacentHTML('beforeend',html);
      }catch(x){}
    });
  };
  const hook=el=>{ if(!el||el.__stl)return; el.__stl=1; new MutationObserver(()=>fix(el)).observe(el,{childList:true,subtree:true}); fix(el); };
  document.querySelectorAll('[id$="Out"]').forEach(hook);
  window.GA_STAR={run:stNakRun,runs:stRuns,line:stLine};
})();

/* ---------- v7.0 Live Transit Clock (analog + digital) and muhurtham alarm planner ---------- */
const CL_GL={Su:'☉',Mo:'☽',Ma:'♂',Me:'☿',Ju:'♃',Ve:'♀',Sa:'♄',Ra:'☊',Ke:'☋'};
const CL_SG=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const CL_EL=['#e4572e','#8aa63f','#e0a800','#2a8fd0'];            // fire, earth, air, water
const CL_PC={Su:'#ffb02e',Mo:'#e8eef7',Ma:'#ff6b57',Me:'#5fd18a',Ju:'#ffd45e',Ve:'#ff9ed2',Sa:'#9fb4d6',Ra:'#b99cff',Ke:'#c9a47c'};
const CL_TH={night:['#0b1d3a','#1d3b6e'],dawn:['#4a1f5e','#e0683c'],forest:['#0d3b2e','#3a7d4f'],rose:['#4d1330','#c0426d'],royal:['#201a4d','#6a4bd6'],teal:['#0a3f4a','#1fa0a8']};
const CL_TOOLS=[{id:'ep',en:'Practical Electional',ta:'செயல்முறை முகூர்த்தம்'},{id:'sp',en:'Speculation Research',ta:'ஊக ஆராய்ச்சி முகூர்த்தம்'},{id:'tp',en:'Trade Profit',ta:'வர்த்தக லாப முகூர்த்தம்'},{id:'mp',en:'Money Profit',ta:'பண லாப முகூர்த்தம்'},{id:'m3',en:'3 · 11',ta:'3 · 11 முகூர்த்தம்'},{id:'ft',en:'Fortuna Timing',ta:'போர்ச்சுனா நேரம்'}];
const CL={face:'analog',theme:'night',dim:.45,photo:'',auto:true,hz:24,cap:40,planOn:false,sel:{ep:false,sp:false,tp:false,mp:false,m3:false,ft:false},
  loc:{lat:13.0827,lon:80.2707,tz:'5.5',name:''},raf:0,lastC:0,lastP:0,A:null,tzf:null,busy:false,list:[],plan:[]};
let CL_LIST=[];
function clSave(){ try{ localStorage.setItem('ga_cl',JSON.stringify({face:CL.face,theme:CL.theme,dim:CL.dim,auto:CL.auto,hz:CL.hz,cap:CL.cap,planOn:CL.planOn,sel:CL.sel,loc:CL.loc})); }catch(e){} }
function clSavePhoto(){ try{ if(CL.photo)localStorage.setItem('ga_cl_photo',CL.photo); else localStorage.removeItem('ga_cl_photo'); return true; }catch(e){ return false; } }
function clLoad(){
  try{ const o=JSON.parse(localStorage.getItem('ga_cl')||'null'); if(o){ ['face','theme','dim','auto','hz','cap','planOn'].forEach(k=>{ if(o[k]!==undefined)CL[k]=o[k]; }); if(o.sel)Object.assign(CL.sel,o.sel); if(o.loc&&isFinite(o.loc.lat)&&isFinite(o.loc.lon)&&o.loc.tz)CL.loc=o.loc; else clFromMain(); } else clFromMain(); }catch(e){ clFromMain(); }
  try{ CL.photo=localStorage.getItem('ga_cl_photo')||''; }catch(e){}
}
function clFromMain(){ const la=parseFloat($('lat').value), lo=parseFloat($('lon').value), tz=$('tz').value.trim(); if(isFinite(la)&&isFinite(lo)&&tz)CL.loc={lat:la,lon:lo,tz:tz,name:''}; }
function clKind(){ const k=$('ayan')&&$('ayan').value; return k==='lahiri'?'lahiri':'kp'; }
function clTzf(){ try{ return tzFn(String(CL.loc.tz)); }catch(e){ return ()=>5.5; } }
function clP2(n){ return (n<10?'0':'')+n; }

/* ----- the astronomy of the moment ----- */
function clCalc(ms,withPl){
  const L=CL.loc, kind=clKind(), old=CFG; CFG={lat:L.lat,lon:L.lon,kind:kind};
  try{
    const a=sidAsc(ms,L.lat,L.lon,kind), g=SEGS[findSeg(a)], r={a:a,sign:g.sign,deg:a-g.sign*30,lord:g.lord,star:g.star,sub:g.sub};
    if(withPl) r.pl=CODES.map(c=>{ const l=sidLon(c,ms), s=SEGS[findSeg(l)]; return {c:c,l:l,sign:s.sign,deg:l-s.sign*30,star:s.star,sub:s.sub,r:(c==='Ra'||c==='Ke')?true:isRetro(c,ms)}; });
    return r;
  }finally{ CFG=old; }
}
function clDM(x){ let s=Math.round(x*3600), d=Math.floor(s/3600); s-=d*3600; return d+'°'+clP2(Math.floor(s/60))+'′'; }
function clX(r,l){ return 200+r*Math.cos((l-90)*Math.PI/180); }
function clY(r,l){ return 200+r*Math.sin((l-90)*Math.PI/180); }
function clArc(r0,r1,a0,a1){ const p=(r,l)=>clX(r,l).toFixed(2)+' '+clY(r,l).toFixed(2); return 'M'+p(r1,a0)+' A'+r1+' '+r1+' 0 0 1 '+p(r1,a1)+' L'+p(r0,a1)+' A'+r0+' '+r0+' 0 0 0 '+p(r0,a0)+'Z'; }
function clSpread(items,min){
  const n=items.length; items.sort((a,b)=>a.l-b.l); items.forEach(x=>{x.d=x.l;});
  for(let it=0;it<60;it++){ let mv=false; for(let i=0;i<n;i++){ const a=items[i], b=items[(i+1)%n]; const gap=mod(b.d-a.d,360); if(n>1&&gap<min-.01){ const p=(min-gap)/2+.02; a.d=mod(a.d-p,360); b.d=mod(b.d+p,360); mv=true; } } if(!mv)break; }
  return items;
}
function clBack(){
  if(CL.photo)return {img:CL.photo};
  const t=CL_TH[CL.theme]||CL_TH.night; return {c1:t[0],c2:t[1]};
}
/* the zodiac ring is the same on both faces (Aries at the top, signs run clockwise like the hours) */
function clRing(){
  let s='';
  for(let i=0;i<12;i++){
    const el=CL_EL[i%4];
    s+='<path d="'+clArc(154,192,i*30,i*30+30)+'" fill="'+el+'" fill-opacity=".34" stroke="rgba(255,255,255,.35)" stroke-width=".8"/>';
    s+='<text x="'+clX(173,i*30+15).toFixed(1)+'" y="'+(clY(173,i*30+15)+6).toFixed(1)+'" text-anchor="middle" class="clsg">'+CL_SG[i]+'︎</text>';
  }
  for(let d=0;d<360;d+=5){ const big=d%30===0; s+='<line x1="'+clX(big?154:154,d).toFixed(1)+'" y1="'+clY(154,d).toFixed(1)+'" x2="'+clX(big?149:151.5,d).toFixed(1)+'" y2="'+clY(big?149:151.5,d).toFixed(1)+'" stroke="rgba(255,255,255,'+(big?.8:.45)+')" stroke-width="'+(big?1.4:.8)+'"/>'; }
  return s;
}
function clStageHTML(){
  const b=clBack(), dim=Math.max(.1,Math.min(.8,CL.dim));
  if(CL.face==='analog'){
    let s='<svg id="clSvg" viewBox="0 0 400 400" role="img" aria-label="Live transit ascendant clock"><defs><clipPath id="clClip"><circle cx="200" cy="200" r="196"/></clipPath>'+
      '<linearGradient id="clGr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+(b.c1||'#000')+'"/><stop offset="1" stop-color="'+(b.c2||'#000')+'"/></linearGradient>'+
      '<radialGradient id="clGl" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>'+
      '<g clip-path="url(#clClip)">'+(b.img?'<image href="'+b.img+'" x="0" y="0" width="400" height="400" preserveAspectRatio="xMidYMid slice"/>':'<rect width="400" height="400" fill="url(#clGr)"/>')+
      '<rect width="400" height="400" fill="#000" fill-opacity="'+dim+'"/><rect width="400" height="400" fill="url(#clGl)"/>'+clRing()+
      '<circle cx="200" cy="200" r="150" fill="#000" fill-opacity=".18"/>'+
      '<circle cx="200" cy="200" r="118" fill="none" stroke="rgba(255,255,255,.22)" stroke-width=".8"/>';
    for(let m=0;m<60;m++){ const big=m%5===0; s+='<line x1="'+clX(118,m*6).toFixed(1)+'" y1="'+clY(118,m*6).toFixed(1)+'" x2="'+clX(big?109:113,m*6).toFixed(1)+'" y2="'+clY(big?109:113,m*6).toFixed(1)+'" stroke="rgba(255,255,255,'+(big?.9:.4)+')" stroke-width="'+(big?2:.8)+'"/>'; }
    for(let h=1;h<=12;h++) s+='<text x="'+clX(95,h*30).toFixed(1)+'" y="'+(clY(95,h*30)+5.5).toFixed(1)+'" text-anchor="middle" class="clnum">'+h+'</text>';
    s+='<text id="clAPlace" x="200" y="150" text-anchor="middle" class="clsm"></text><text id="clADate" x="200" y="164" text-anchor="middle" class="clsm"></text>'+
      '<text id="clAAsc" x="200" y="248" text-anchor="middle" class="clasc1"></text><text id="clALords" x="200" y="266" text-anchor="middle" class="clsm2"></text>'+
      '<g id="clPls"></g>'+
      '<line id="clAL" x1="200" y1="200" x2="200" y2="8" stroke="#ffcf5a" stroke-width="2.4" stroke-linecap="round"/>'+
      '<g id="clAB"><circle r="10" fill="#ffcf5a" stroke="#fff" stroke-width="1.2"/><text y="3" text-anchor="middle" class="clab">Asc</text></g>'+
      '<line id="clHH" x1="200" y1="200" x2="200" y2="140" stroke="#fff" stroke-width="5.5" stroke-linecap="round"/>'+
      '<line id="clHM" x1="200" y1="200" x2="200" y2="104" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/>'+
      '<line id="clHS" x1="200" y1="214" x2="200" y2="96" stroke="#ff5d5d" stroke-width="1.6" stroke-linecap="round"/>'+
      '<circle cx="200" cy="200" r="6.5" fill="#ffcf5a" stroke="#fff" stroke-width="1.5"/></g>'+
      '<circle cx="200" cy="200" r="196" fill="none" stroke="#ffcf5a" stroke-width="3"/><circle cx="200" cy="200" r="192.5" fill="none" stroke="rgba(255,255,255,.55)" stroke-width=".8"/></svg>';
    return s;
  }
  return '<div class="cldig" id="clDig"><div class="cldov"></div><div class="cldin">'+
    '<div class="cldp"><span id="clDPlace"></span><span id="clDDate"></span></div>'+
    '<div class="cldt"><span id="clDH">--</span><i>:</i><span id="clDM">--</span><i>:</i><span id="clDS">--</span><b id="clDAp"></b></div>'+
    '<div class="cldrow"><div class="cldasc"><small>Ascendant · லக்னம்</small><div class="big" id="clDA"></div><div class="ta" id="clDAt"></div>'+
    '<div class="chips"><span>Lord <b id="clDL"></b></span><span>Star <b id="clDSt"></b></span><span>Sub <b id="clDSu"></b></span></div></div>'+
    '<svg class="clmini" viewBox="0 0 400 400" role="img" aria-label="Zodiac wheel"><circle cx="200" cy="200" r="196" fill="rgba(0,0,0,.25)"/>'+clRing()+'<circle cx="200" cy="200" r="150" fill="rgba(0,0,0,.25)"/><g id="clPls"></g>'+
    '<line id="clAL" x1="200" y1="200" x2="200" y2="8" stroke="#ffcf5a" stroke-width="3" stroke-linecap="round"/><g id="clAB"><circle r="10.5" fill="#ffcf5a" stroke="#fff" stroke-width="1.2"/><text y="3.2" text-anchor="middle" class="clab">Asc</text></g>'+
    '<circle cx="200" cy="200" r="5" fill="#ffcf5a"/></svg></div>'+
    '<div class="clpg" id="clDP"></div></div></div>';
}
function clBuild(){
  const st=$('clStage'); if(!st)return; st.className='clstage '+(CL.face==='analog'?'an':'dg'); st.innerHTML=clStageHTML();
  if(CL.face==='digital'){
    const b=clBack(), d=$('clDig'); if(b.img){ d.style.backgroundImage='url("'+b.img+'")'; d.style.backgroundSize='cover'; d.style.backgroundPosition='center'; }
    else d.style.background='linear-gradient(135deg,'+b.c1+','+b.c2+')';
    d.querySelector('.cldov').style.opacity=String(Math.max(.1,Math.min(.8,CL.dim)));
  }
  CL.lastC=0; CL.lastP=0;
}
function clTick(){
  CL.raf=0; const pn=$('clPanel'); if(!pn||pn.classList.contains('hide'))return;
  const now=Date.now(); let off=5.5; try{ off=CL.tzf(now); }catch(e){}
  const d=new Date(now+off*3600000), H=d.getUTCHours(), M=d.getUTCMinutes(), S=d.getUTCSeconds(), ms=d.getUTCMilliseconds();
  const dateTxt=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getUTCDay()]+', '+d.getUTCDate()+' '+MON[d.getUTCMonth()]+' '+d.getUTCFullYear();
  const place=CL.loc.name||(CL.loc.lat.toFixed(2)+'°, '+CL.loc.lon.toFixed(2)+'°');
  if(now-CL.lastC>=1000||!CL.A){ CL.lastC=now; try{ const keep=CL.A&&CL.A.pl; CL.A=clCalc(now,false); if(keep)CL.A.pl=keep; }catch(e){ } }
  if(now-CL.lastP>=5000||!CL.A||!CL.A.pl){ CL.lastP=now; try{ const k=clCalc(now,true); CL.A=k; clPlanets(k); }catch(e){ } }
  const A=CL.A;
  if(CL.face==='analog'){
    const set=(id,k,v)=>{ const e=$(id); if(e)e.setAttribute(k,v); };
    const hA=((H%12)+M/60+S/3600)*30, mA=(M+S/60)*6, sA=(S+ms/1000)*6;
    const hand=(id,ang,len,tail)=>{ const e=$(id); if(!e)return; e.setAttribute('x1',clX(-(tail||0),ang).toFixed(1)); e.setAttribute('y1',clY(-(tail||0),ang).toFixed(1)); e.setAttribute('x2',clX(len,ang).toFixed(1)); e.setAttribute('y2',clY(len,ang).toFixed(1)); };
    hand('clHH',hA,60,0); hand('clHM',mA,96,0); hand('clHS',sA,104,16);
    const t=(id,v)=>{ const e=$(id); if(e&&e.textContent!==v)e.textContent=v; };
    t('clAPlace',place.length>26?place.slice(0,25)+'…':place); t('clADate',dateTxt);
    if(A){
      set('clAL','x2',clX(150,A.a).toFixed(1)); set('clAL','y2',clY(150,A.a).toFixed(1)); set('clAL','x1',clX(30,A.a).toFixed(1)); set('clAL','y1',clY(30,A.a).toFixed(1));
      const b=$('clAB'); if(b)b.setAttribute('transform','translate('+clX(151,A.a).toFixed(1)+' '+clY(151,A.a).toFixed(1)+')');
      t('clAAsc',SIGNS[A.sign][0]+' '+dms(A.deg)); t('clALords','Lord '+NAME[A.lord].slice(0,3)+' · Star '+NAME[A.star].slice(0,3)+' · Sub '+NAME[A.sub].slice(0,3));
    }
  }else{
    const t=(id,v)=>{ const e=$(id); if(e&&e.textContent!==v)e.textContent=v; };
    t('clDH',clP2(H%12===0?12:H%12)); t('clDM',clP2(M)); t('clDS',clP2(S)); t('clDAp',H<12?'AM':'PM'); t('clDPlace',place); t('clDDate',dateTxt);
    if(A){
      t('clDA',SIGNS[A.sign][0]+' '+dms(A.deg)); t('clDAt',TSIGN[A.sign]+' லக்னம்'); t('clDL',NAME[A.lord]); t('clDSt',NAME[A.star]); t('clDSu',NAME[A.sub]);
      const l=$('clAL'); if(l){ l.setAttribute('x2',clX(150,A.a).toFixed(1)); l.setAttribute('y2',clY(150,A.a).toFixed(1)); l.setAttribute('x1',clX(30,A.a).toFixed(1)); l.setAttribute('y1',clY(30,A.a).toFixed(1)); }
      const b=$('clAB'); if(b)b.setAttribute('transform','translate('+clX(151,A.a).toFixed(1)+' '+clY(151,A.a).toFixed(1)+')');
    }
  }
  if(A)clAscCard(A,H,M,S,off);
  CL.raf=requestAnimationFrame(clTick);
}
function clPlanets(k){
  const items=k.pl.map(p=>({c:p.c,l:p.l,r:p.r})); clSpread(items,CL.face==='analog'?13.5:15);
  let s='';
  items.forEach(it=>{ const x=clX(128,it.d), y=clY(128,it.d), x0=clX(150,it.l), y0=clY(150,it.l), x1=clX(139.5,it.d), y1=clY(139.5,it.d);
    s+='<line x1="'+x0.toFixed(1)+'" y1="'+y0.toFixed(1)+'" x2="'+x1.toFixed(1)+'" y2="'+y1.toFixed(1)+'" stroke="'+CL_PC[it.c]+'" stroke-width="1.1"/>'+
       '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="11.5" fill="rgba(8,14,30,.78)" stroke="'+CL_PC[it.c]+'" stroke-width="1.6"/>'+
       '<text x="'+x.toFixed(1)+'" y="'+(y+5.2).toFixed(1)+'" text-anchor="middle" class="clpl" fill="'+CL_PC[it.c]+'">'+CL_GL[it.c]+'︎</text>'+(it.r?'<text x="'+(x+9).toFixed(1)+'" y="'+(y-7).toFixed(1)+'" class="clrt">R</text>':''); });
  const g=$('clPls'); if(g)g.innerHTML=s;
  let h='<table class="cltb"><thead><tr><th>Planet<small>கிரகம்</small></th><th>Rasi<small>ராசி</small></th><th>Degree</th><th>Star lord</th><th>Sub lord</th></tr></thead><tbody>';
  k.pl.forEach(p=>{ h+='<tr><td><b style="color:'+CL_PC[p.c]+'">'+CL_GL[p.c]+'︎</b> '+NAME[p.c]+(p.r?' <em>R</em>':'')+'<small>'+TA[p.c]+'</small></td><td>'+SIGNS[p.sign][0]+'<small>'+TSIGN[p.sign]+'</small></td><td class="n">'+dms(p.deg)+'</td><td>'+NAME[p.star]+'</td><td>'+NAME[p.sub]+'</td></tr>'; });
  try{
    const mo=k.pl.find(p=>p.c==='Mo'), su=k.pl.find(p=>p.c==='Su'); let FL=mod(k.a+mo.l-su.l,360), fg=SEGS[findSeg(FL)], nm=Math.floor(Date.now()/60000);
    if(!CL._fq||CL._fq.t!==nm){ CL._fq={t:nm,q:window.GA_FT?window.GA_FT.chartInfo(nm*60000,CL.loc.lat,CL.loc.lon,clKind()).q:'Neutral'}; }
    CL._fl={L:FL,g:fg,q:CL._fq.q};
    h+='<tr><td><b style="color:#00c389">⊗</b> Fortuna<small>போர்ச்சுனா</small></td><td>'+SIGNS[fg.sign][0]+'<small>'+TSIGN[fg.sign]+'</small></td><td class="n">'+dms(FL-fg.sign*30)+'</td><td>'+NAME[fg.star]+'</td><td>'+NAME[fg.sub]+' <em>'+CL._fq.q+'</em></td></tr>';
  }catch(e){}
  $('clTb').innerHTML=h+'</tbody></table>';
  const dp=$('clDP'); if(dp)dp.innerHTML=k.pl.map(p=>'<span class="clchip" style="--c:'+CL_PC[p.c]+'"><b>'+CL_GL[p.c]+'︎</b> '+NAME[p.c].slice(0,3)+' '+SIGNS[p.sign][0].slice(0,3)+' '+clDM(p.deg)+(p.r?' R':'')+'</span>').join('')+(CL._fl?'<span class="clchip" style="--c:#00c389"><b>⊗</b> Fortuna '+SIGNS[CL._fl.g.sign][0].slice(0,3)+' '+clDM(CL._fl.L-CL._fl.g.sign*30)+' '+CL._fl.q+'</span>':'');
}
function clAscCard(A,H,M,S,off){
  const e=$('clAscCard'); if(!e)return;
  const key=A.sign+'|'+Math.floor(A.deg*3600)+'|'+A.lord+A.star+A.sub; if(e.dataset.k===key)return; e.dataset.k=key;
  e.innerHTML='<div class="clac"><small>Live transit ascendant · கோசார லக்னம்</small><div class="clbig">'+SIGNS[A.sign][0]+' <span>'+dms(A.deg)+'</span> <em>'+TSIGN[A.sign]+'</em></div>'+
    '<div class="clchips"><span>Lord · அதிபதி <b>'+NAME[A.lord]+'</b><i>'+TA[A.lord]+'</i></span><span>Star lord · நட்சத்திர அதிபதி <b>'+NAME[A.star]+'</b><i>'+TA[A.star]+'</i></span><span>Sub lord · உப அதிபதி <b>'+NAME[A.sub]+'</b><i>'+TA[A.sub]+'</i></span></div></div>';
}
function clStart(){ if(!CL.raf)CL.raf=requestAnimationFrame(clTick); }

/* ----- location: automatic when online, else the saved settings ----- */
function clNearest(lat,lon){
  let best=null, bd=1e9; const k=Math.cos(lat*Math.PI/180);
  for(let i=0;i<WC.length;i++){ const x=WC[i], dy=x.lat-lat, dx=(x.lon-lon)*k, d=dy*dy+dx*dx; if(d<bd){bd=d;best=x;} }
  return best&&Math.sqrt(bd)*111<150?best:null;
}
function clSetLoc(l,note){
  CL.loc=l; clSave(); CL.tzf=clTzf(); $('clLat').value=l.lat; $('clLon').value=l.lon; $('clTz').value=l.tz; clOff(note);
  CL.A=null;
}
function clAutoLoc(manual){
  const el=$('clOff');
  if(!navigator.geolocation||(!manual&&(!CL.auto||navigator.onLine===false||(window.GA_PLACE_MANUAL&&window.GA_PLACE_MANUAL())))){ clOff(CL.auto&&!manual?'Using the place you chose (or your saved place).':''); return; }
  el.textContent='Finding your location…'; el.className='msg';
  navigator.geolocation.getCurrentPosition(pos=>{
    const la=+pos.coords.latitude.toFixed(4), lo=+pos.coords.longitude.toFixed(4); let tz='';
    try{ tz=Intl.DateTimeFormat().resolvedOptions().timeZone||''; }catch(e){}
    const n=clNearest(la,lo); if(!tz)tz=n?n.tz:String(-new Date().getTimezoneOffset()/60);
    try{ tzFn(tz); }catch(e){ tz=String(-new Date().getTimezoneOffset()/60); }
    clSetLoc({lat:la,lon:lo,tz:tz,name:n?(n.n+(n.st?', '+n.st:'')):'My location'},'Location found automatically.'); $('clSearch').value='';
  },()=>{ clOff('Could not get your location: using your saved place.'); },{timeout:9000,maximumAge:600000});
}
function clFillStates(){
  const cn=$('clCountry').value, el=$('clState');
  if(cn==='*a'){el.innerHTML='<option value="*s">All states</option>';return;}
  const l=STBY[cn]||[];
  el.innerHTML='<option value="*s">All states ('+l.filter(Boolean).length+')</option>'+l.map(n=>'<option value="'+m3e(n)+'">'+m3e(n||'(state not listed)')+'</option>').join('');
}
function clFill(){
  const q=$('clSearch').value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''), cn=$('clCountry').value, stv=$('clState').value, all=cn==='*a';
  let src=all?WC:(WCBY[cn]||[]); if(!all&&stv!=='*s')src=src.filter(x=>(x.st||'')===stv);
  const cap=all?300:700; let list=[];
  if(all&&!q)list=[]; else if(!q)list=src.slice(0,cap);
  else{const a=[],b=[]; for(let i=0;i<src.length&&a.length<cap;i++){const k=plKey(src[i]),at=k.indexOf(q); if(at===0)a.push(src[i]); else if(at>0&&b.length<cap)b.push(src[i]);} list=a.concat(b).slice(0,cap);}
  if(!list.length)list=webC(q,clFill); CL_LIST=list; const sel=$('clCity');
  sel.innerHTML=list.length?list.map((x,i)=>'<option value="'+i+'">'+m3e(x.n)+((all||stv==='*s')&&x.st?', '+m3e(x.st):'')+(all?', '+m3e(x.cc):'')+'</option>').join(''):'<option value="">No match in the offline list</option>';
}
function clPick(){ const x=CL_LIST[parseInt($('clCity').value,10)]; if(x)clSetLoc({lat:+x.lat,lon:+x.lon,tz:String(x.tz),name:x.n+(x.st?', '+x.st:'')},'Place set from the offline list.'); }
function clOff(note){
  const el=$('clOff'), t=$('clTz').value.trim(); el.className='msg'; let s='';
  try{ s=t?'Time zone now: '+utcTxt(tzFn(t)(Date.now()))+(/^-?[\d.]+$/.test(t)?'':' ('+t+')'):''; }catch(e){ s='The time zone was not recognised. Use a name such as Asia/Kolkata or hours such as 5.5.'; el.className='msg err'; }
  el.textContent=(note?note+' ':'')+s;
}
function clManual(){
  const la=parseFloat($('clLat').value), lo=parseFloat($('clLon').value), tz=$('clTz').value.trim();
  if(!isFinite(la)||!isFinite(lo)||!tz||Math.abs(la)>62){ clOff(''); return; }
  try{ tzFn(tz); }catch(e){ clOff(''); return; }
  clSetLoc({lat:la,lon:lo,tz:tz,name:'Custom place'},'');
}

/* ----- photo ----- */
function clPhoto(file){
  if(!file)return; const msg=$('clPhMsg'); msg.textContent='Preparing the photo…'; msg.className='msg';
  const fr=new FileReader();
  fr.onload=()=>{ const im=new Image(); im.onload=()=>{
    const tries=[[1000,.82],[760,.72],[520,.65]]; let ok=false;
    for(const t of tries){
      const k=Math.min(1,t[0]/Math.max(im.width,im.height)), c=document.createElement('canvas'); c.width=Math.max(1,Math.round(im.width*k)); c.height=Math.max(1,Math.round(im.height*k));
      c.getContext('2d').drawImage(im,0,0,c.width,c.height); const url=c.toDataURL('image/jpeg',t[1]); CL.photo=url;
      if(clSavePhoto()){ok=true;break;}
    }
    msg.textContent=ok?'Photo saved on this device. It works offline.':'The photo is shown now but could not be kept (storage is full).'; msg.className=ok?'msg':'msg err';
    clBuild(); };
    im.onerror=()=>{ msg.textContent='That file could not be read as a picture.'; msg.className='msg err'; };
    im.src=fr.result; };
  fr.onerror=()=>{ msg.textContent='That file could not be read.'; msg.className='msg err'; };
  fr.readAsDataURL(file);
}

/* ----- muhurtham alarms ----- */
function clDate(ms,off){ return new Date(ms+off*3600000).toISOString().slice(0,10); }
function clDrive(pfx,vals,full){
  return new Promise(res=>{
    const saved={}; const all=Object.assign({},vals); if(full){ all[pfx+'T1']='00:00'; all[pfx+'T2']='23:59'; }
    Object.keys(all).forEach(k=>{ const e=$(k); if(e){ saved[k]=e.value; e.value=all[k]; } });
    const out=$(pfx+'Out'), msg=$(pfx+'Msg'), go=$(pfx+'Go'), html0=out.innerHTML, m0=msg.textContent, c0=msg.className, t0=Date.now();
    const done=(rows,err)=>{ Object.keys(saved).forEach(k=>{ $(k).value=saved[k]; }); out.innerHTML=html0; msg.textContent=m0; msg.className=c0; res({rows:rows,err:err}); };
    out.innerHTML=''; go.click();
    (function wait(){
      if(!go.disabled&&Date.now()-t0>60){
        const rows=[]; out.querySelectorAll('li[data-s][data-e]').forEach(li=>{ const s=+li.getAttribute('data-s'), e=+li.getAttribute('data-e'); if(isFinite(s)&&isFinite(e)&&e>s)rows.push({s:s,e:e}); });
        done(rows,msg.className.indexOf('err')>=0?msg.textContent:''); return; }
      if(Date.now()-t0>150000){ done([],'timed out'); return; }
      setTimeout(wait,40);
    })();
  });
}
async function clGather(tool,now,end){
  const L=CL.loc, kind=clKind(), tzs=String(L.tz), tzf=CL.tzf, off=tzf(now), f=clDate(now,off), t=clDate(end,tzf(end));
  const base={}; const p=tool;
  if(tool==='ft'){ if(!window.GA_FT)return {rows:[],err:'Fortuna Timing is not ready'}; return window.GA_FT.gather(L,kind,now,end); }
  if(tool==='ep'){
    const sel=document.querySelector('#epEvents .epev.on'); const ev=sel?sel.getAttribute('data-ev'):'trade';
    if(typeof window.__epScan!=='function')return {rows:[],err:'Practical Electional is not ready'};
    const a=$('epT1').value.split(':').map(Number), b=$('epT2').value.split(':').map(Number), days=[];
    const d0=Date.UTC(+f.slice(0,4),+f.slice(5,7)-1,+f.slice(8,10)), d1=Date.UTC(+t.slice(0,4),+t.slice(5,7)-1,+t.slice(8,10)), nd=Math.round((d1-d0)/86400000)+1;
    for(let i=0;i<nd;i++){ const dt=new Date(d0+i*86400000), y=dt.getUTCFullYear(), m=dt.getUTCMonth()+1, d=dt.getUTCDate(); const s=localToUtc(y,m,d,a[0]||0,a[1]||0,tzs).ms; let e=localToUtc(y,m,d,b[0]||0,b[1]||0,tzs).ms; if(e<=s)e+=86400000; days.push({a:s,b:e}); }
    const sc=window.__epScan({ev:ev,lat:L.lat,lon:L.lon,tz:tzs,kind:kind,trop:$('epZod').value==='trop',from:days[0].a,to:days[days.length-1].b,days:days,crop:$('epCrop').value,relaxed:$('epStrict').value==='relaxed'});
    return {rows:sc.wins.map(w=>({s:w.s,e:w.e})),err:''};
  }
  const vals={}; vals[p+'Lat']=String(L.lat); vals[p+'Lon']=String(L.lon); vals[p+'Tz']=tzs; vals[p+'From']=f; vals[p+'To']=t; vals[p+'Ayan']=kind;
  return clDrive(p,vals,tool!=='tp');
}
function clSet(id,when,title,text){ return GA_ALARM.set(id,when,title,text,''); }
async function clPlan(silent){
  if(CL.busy)return; CL.busy=true; const msg=$('clPlMsg'), out=$('clPlOut'), btn=$('clPlGo');
  const tools=CL_TOOLS.filter(t=>CL.sel[t.id]);
  try{
    if(btn)btn.disabled=true;
    let old=[]; try{ old=JSON.parse(localStorage.getItem('ga_cl_ids')||'[]'); }catch(e){}
    await Promise.all(old.map(id=>GA_ALARM.cancel(id)));
    try{ localStorage.removeItem('ga_cl_ids'); }catch(e){}
    CL.plan=[];
    if(!tools.length){ if(!silent){ msg.className='msg'; msg.textContent='No muhurtham is selected, so the clock alarms were cleared.'; out.innerHTML=''; } return; }
    if(!silent){ msg.className='msg'; msg.textContent='Finding the muhurtham windows for the next '+CL.hz+' hours… please wait.'; }
    const now=Date.now(), end=now+CL.hz*3600000, tzf=CL.tzf, errs=[];
    const wins=[];
    for(const t of tools){
      if(!silent)msg.textContent='Finding '+t.en+' windows…';
      await new Promise(r=>setTimeout(r,20));
      let r; try{ r=await clGather(t.id,now,end); }catch(e){ r={rows:[],err:String(e&&e.message||e)}; }
      if(r.err)errs.push(t.en+': '+r.err);
      const seen={}; r.rows.forEach(w=>{ if(w.s>now+8000&&w.s<=end&&!seen[w.s]){ seen[w.s]=1; wins.push({tool:t,s:w.s,e:w.e,lb:w.lb}); } });
    }
    wins.sort((a,b)=>a.s-b.s);
    let cut=0; if(wins.length>CL.cap){ cut=wins.length-CL.cap; wins.length=CL.cap; }
    let last=0;                                   // one alarm at a time: each melody plays twice and fades before the next
    wins.forEach(w=>{ w.when=Math.max(w.s,last+13000); last=w.when; });
    const ids=[]; let ok=0, bad=0;
    for(const w of wins){
      const A=clCalc(w.s,false), id='clk-'+w.tool.id+'-'+Math.round(w.s/60000), off=tzf(w.s), hm=ms=>{ const d=new Date(ms+tzf(ms)*3600000); return clP2(d.getUTCHours())+':'+clP2(d.getUTCMinutes())+':'+clP2(d.getUTCSeconds()); };
      const title='🔔 '+w.tool.en+(w.lb?' · '+w.lb:'')+' muhurtham · '+hm(w.s);
      const R=stNakRun(w.s,CL.loc.lat,CL.loc.lon,clKind()); w.R=R;
      const text='For: '+w.tool.en+(w.lb?' · '+w.lb:'')+' muhurtham\n'+hm(w.s)+' – '+hm(w.e)+' ('+dur(w.e-w.s)+')\n'+SIGNS[A.sign][0]+' ascendant '+dms(A.deg)+' · '+NAME[A.lord]+'/'+NAME[A.star]+'/'+NAME[A.sub]+'\n'+NAME[R.star]+' star lord total: '+hm(R.s)+' – '+hm(R.e)+' ('+dur(R.e-R.s)+')';
      const good=await clSet(id,w.when,title,text); if(good){ ok++; ids.push(id); w.id=id; w.A=A; w.hm=hm(w.s)+' – '+hm(w.e); w.sr=NAME[R.star]+' star '+hm(R.s)+' – '+hm(R.e)+' ('+dur(R.e-R.s)+')'; w.day=new Date(w.s+off*3600000); CL.plan.push(w); } else bad++;
    }
    try{ localStorage.setItem('ga_cl_ids',JSON.stringify(ids)); }catch(e){}
    CL.planned=Date.now();
    clPlanShow(ok,bad,cut,errs,silent);
  }catch(e){ msg.className='msg err'; msg.textContent='Could not plan the alarms: '+(e&&e.message||e); }
  finally{ CL.busy=false; if(btn)btn.disabled=false; }
}
function clPlanShow(ok,bad,cut,errs,silent){
  const msg=$('clPlMsg'), out=$('clPlOut'); if(!msg)return;
  const by={}; CL.plan.forEach(w=>{ by[w.tool.en]=(by[w.tool.en]||0)+1; });
  msg.className='msg';
  const tail=(bad?' '+bad+' could not be set.':'')+(cut?' The earliest '+CL.cap+' are set; the rest are added when you open the app again.':'')+(errs.length?' '+errs.join('; '):'');
  msg.textContent=(ok?(ok+' alarm'+(ok>1?'s':'')+' set for the next '+CL.hz+' hours ('+Object.keys(by).map(k=>k+' '+by[k]).join(', ')+'). Each one plays the melody twice and then fades out by itself'+(GA_ALARM.kind()==='web'?', while this page is open.':', even when the app is closed.')):('No muhurtham window starts in the next '+CL.hz+' hours with the chosen rules.'))+tail;
  const D=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  out.innerHTML=CL.plan.length?'<table class="cltb"><thead><tr><th>Day</th><th>Time</th><th>Muhurtham</th><th>Ascendant</th></tr></thead><tbody>'+CL.plan.map(w=>'<tr><td>'+D[w.day.getUTCDay()]+' '+w.day.getUTCDate()+' '+MON[w.day.getUTCMonth()]+'</td><td class="n">'+w.hm+'</td><td>'+m3e(w.tool.en)+'<small>'+w.tool.ta+'</small></td><td>'+SIGNS[w.A.sign][0]+' '+clDM(w.A.deg)+'<small>'+NAME[w.A.lord]+'/'+NAME[w.A.star]+'/'+NAME[w.A.sub]+'<br>'+w.sr+'</small></td></tr>').join('')+'</tbody></table>':'';
}
function clSelUI(){
  CL_TOOLS.forEach(t=>{ $('clS_'+t.id).checked=!!CL.sel[t.id]; });
  $('clS_all').checked=CL_TOOLS.every(t=>CL.sel[t.id]);
  $('clHz').value=String(CL.hz); $('clCap').value=String(CL.cap); $('clAuto').checked=!!CL.auto; $('clPlOn').checked=!!CL.planOn;
}
(function initCl(){
  if(!$('clBtn'))return;
  clLoad(); CL.tzf=clTzf();
  const cs=$('clCountry'); cs.innerHTML='<option value="*a">All countries (use search)</option>'+CITY.cc.map(n=>'<option value="'+n.replace(/"/g,'&quot;')+'">'+n+'</option>').join('');
  cs.addEventListener('change',()=>{clFillStates();clFill();}); $('clState').addEventListener('change',clFill); $('clSearch').addEventListener('input',clFill); $('clCity').addEventListener('change',clPick);
  ['clLat','clLon','clTz'].forEach(i=>$(i).addEventListener('change',clManual)); $('clTz').addEventListener('input',()=>clOff(''));
  clFillStates(); $('clLat').value=CL.loc.lat; $('clLon').value=CL.loc.lon; $('clTz').value=CL.loc.tz;
  $('clTheme').innerHTML=Object.keys(CL_TH).map(k=>'<option value="'+k+'">'+k[0].toUpperCase()+k.slice(1)+'</option>').join(''); $('clTheme').value=CL.theme;
  $('clDim').value=String(CL.dim);
  const faceUI=()=>{ document.querySelectorAll('#clPanel .clseg button').forEach(b=>b.classList.toggle('on',b.getAttribute('data-f')===CL.face)); };
  document.querySelectorAll('#clPanel .clseg button').forEach(b=>b.addEventListener('click',()=>{ CL.face=b.getAttribute('data-f'); clSave(); faceUI(); clBuild(); clStart(); }));
  $('clTheme').addEventListener('change',()=>{ CL.theme=$('clTheme').value; clSave(); clBuild(); });
  $('clDim').addEventListener('input',()=>{ CL.dim=parseFloat($('clDim').value); clSave(); clBuild(); });
  $('clPhoto').addEventListener('change',e=>{ clPhoto(e.target.files&&e.target.files[0]); e.target.value=''; });
  $('clPhotoX').addEventListener('click',()=>{ CL.photo=''; clSavePhoto(); $('clPhMsg').textContent='Photo removed.'; $('clPhMsg').className='msg'; clBuild(); });
  $('clFs').addEventListener('click',()=>{ const st=$('clStage'); try{ if(document.fullscreenElement){document.exitFullscreen();} else if(st.requestFullscreen){ st.requestFullscreen(); } }catch(e){} try{ if(navigator.wakeLock)navigator.wakeLock.request('screen').catch(()=>{}); }catch(e){} });
  $('clLoc').addEventListener('click',()=>clAutoLoc(true));
  $('clMain').addEventListener('click',()=>{ clFromMain(); clSetLoc(CL.loc,'Using the place from the Transit settings.'); });
  CL_TOOLS.forEach(t=>$('clS_'+t.id).addEventListener('change',()=>{ CL.sel[t.id]=$('clS_'+t.id).checked; $('clS_all').checked=CL_TOOLS.every(x=>CL.sel[x.id]); clSave(); }));
  $('clS_all').addEventListener('change',()=>{ const v=$('clS_all').checked; CL_TOOLS.forEach(t=>{ CL.sel[t.id]=v; $('clS_'+t.id).checked=v; }); clSave(); });
  $('clHz').addEventListener('change',()=>{ CL.hz=parseInt($('clHz').value,10)||24; clSave(); });
  $('clCap').addEventListener('change',()=>{ CL.cap=parseInt($('clCap').value,10)||40; clSave(); });
  $('clAuto').addEventListener('change',()=>{ CL.auto=$('clAuto').checked; clSave(); });
  $('clPlOn').addEventListener('change',()=>{ CL.planOn=$('clPlOn').checked; clSave(); });
  $('clPlGo').addEventListener('click',()=>{ CL.planOn=$('clPlOn').checked; clSave(); clPlan(false); });
  $('clPlTest').addEventListener('click',()=>{ GA_ALARM.test().then(ok=>{ const m=$('clPlMsg'); m.className=ok?'msg':'msg err'; m.textContent=ok?'A test alarm will ring in 10 seconds: two melodies, then it fades out.':'The test alarm could not be set. Please allow alarms and notifications.'; }); });
  clSelUI(); faceUI();
  $('clBtn').addEventListener('click',()=>{ const pn=$('clPanel'); pn.classList.remove('hide'); CL.tzf=clTzf(); CL.A=null; clBuild(); clStart(); clOff(''); clAutoLoc(false); pn.scrollIntoView({block:'start'}); });
  $('clClose').addEventListener('click',()=>{ $('clPanel').classList.add('hide'); try{ if(document.fullscreenElement)document.exitFullscreen(); }catch(e){} });
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden)clStart(); });
  let ip=null; window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); ip=e; $('clInstall').style.display=''; });
  $('clInstall').addEventListener('click',()=>{ if(ip){ ip.prompt(); ip=null; $('clInstall').style.display='none'; } });
  window.addEventListener('appinstalled',()=>{ $('clInstall').style.display='none'; });
  /* keep the planned alarms topped up: when the app opens and every few hours while it stays open */
  const topUp=()=>{ if(CL.planOn&&CL_TOOLS.some(t=>CL.sel[t.id])&&typeof Astronomy!=='undefined')clPlan(true); };
  setTimeout(topUp,6000); setInterval(topUp,3*3600000);
  if(/[?&#]clock\b/.test(location.search+location.hash))setTimeout(()=>$('clBtn').click(),400);
  window.GA_CL={calc:clCalc,state:CL,plan:clPlan,gather:clGather,build:clBuild};
})();

/* ---------- v7.2: one place for every menu ---------- */
(function(){
  const PFX=['ck','cl','ep','eq','ft','gp','hq','lt','m3','mk','mm','mp','rc','sp','tp'];
  const FOLLOW=['bp'];
  const ST={cur:null,recent:[],guard:0,snap:{}};
  try{ST.cur=JSON.parse(localStorage.getItem('ga_place')||'null');}catch(e){}
  try{ST.recent=JSON.parse(localStorage.getItem('ga_place_recent')||'[]')||[];}catch(e){}
  const g=id=>document.getElementById(id);
  function save(){ try{localStorage.setItem('ga_place',JSON.stringify(ST.cur));localStorage.setItem('ga_place_recent',JSON.stringify(ST.recent));}catch(e){} }
  function ev(el,t){ el.dispatchEvent(new Event(t,{bubbles:true})); }
  function read(p){
    if(p==='main'){ const la=g('lat'),lo=g('lon'),tz=g('tz'); if(!la||!lo)return null; return {lat:la.value.trim(),lon:lo.value.trim(),tz:String(PL_TZ||tz.value).trim()}; }
    const la=g(p+'Lat'),lo=g(p+'Lon'),tz=g(p+'Tz'); if(!la||!lo||!tz)return null;
    return {lat:la.value.trim(),lon:lo.value.trim(),tz:tz.value.trim()};
  }
  const key=r=>r?r.lat+'|'+r.lon+'|'+r.tz:'';
  function meta(r){
    const la=parseFloat(r.lat),lo=parseFloat(r.lon); if(isNaN(la)||isNaN(lo))return null;
    let b=null,bd=1e9;
    for(let i=0;i<WC.length;i++){const x=WC[i],d=Math.abs(x.lat-la)+Math.abs(x.lon-lo); if(d<bd){bd=d;b=x; if(d<1e-4)break;}}
    return (b&&bd<0.02)?b:null;
  }
  function mkPlace(r,src){
    const m=meta(r), p={lat:parseFloat(r.lat),lon:parseFloat(r.lon),tz:r.tz,src:src||'manual'};
    if(m){p.name=m.n;p.cc=m.cc;p.st=m.st||'';} else {p.name=(PL_NAME&&PL_NAME!=='the entered coordinates')?PL_NAME.split(',')[0]:p.lat.toFixed(2)+', '+p.lon.toFixed(2);p.cc='';p.st='';}
    return p;
  }
  function remember(p){
    ST.recent=ST.recent.filter(x=>!(Math.abs(x.lat-p.lat)<1e-4&&Math.abs(x.lon-p.lon)<1e-4));
    ST.recent.unshift({name:p.name,cc:p.cc,st:p.st,lat:p.lat,lon:p.lon,tz:p.tz});
    ST.recent=ST.recent.slice(0,8);
  }
  function pickCity(p,x){
    const co=g(p+'Country'), se=g(p+'Search'), ci=g(p+'City');
    try{
      // all countries + the city name in the search box: the chosen city stays selected and any other city can still be found by typing
      if(co){ for(const o of co.options){ if(o.value==='*a'){co.value='*a';ev(co,'change');break;} } }
      if(se&&x.name){ se.value=x.name; ev(se,'input'); }
      if(ci){ let hit=-1; for(let i=0;i<ci.options.length;i++){ const t=ci.options[i].text; if(t.indexOf(x.name)===0&&(!x.cc||t.indexOf(x.cc)>=0)&&(!x.st||t.indexOf(x.st)>=0)){hit=i;break;} }
        if(hit<0)for(let i=0;i<ci.options.length;i++){ if(ci.options[i].text.indexOf(x.name)===0){hit=i;break;} }
        if(hit>=0)ci.selectedIndex=hit; }
    }catch(e){}
  }
  function applyTo(p,x){
    ST.guard++;
    try{
      if(p==='main'){
        pickCity('pl',x);
        g('lat').value=x.lat; g('lon').value=x.lon;
        const num=!isNaN(parseFloat(x.tz))&&String(parseFloat(x.tz))===String(x.tz).trim();
        if(num){ PL_TZ=null; g('tz').value=x.tz; } else { PL_TZ=x.tz; }
        PL_NAME=x.name+(x.cc?', '+x.cc:'');
        try{plSetTz();}catch(e){}
        ev(g('lat'),'change');
      } else {
        if(p!=='bp'||true) pickCity(p,x);
        g(p+'Lat').value=x.lat; g(p+'Lon').value=x.lon; g(p+'Tz').value=x.tz;
        [p+'Lat',p+'Lon',p+'Tz'].forEach(i=>{ev(g(i),'input');ev(g(i),'change');});
      }
    }catch(e){}
    ST.snap[p]=key(read(p));
    ST.guard--;
  }
  function applyAll(x,skip){
    ['main'].concat(PFX).concat(FOLLOW).forEach(p=>{ if(p!==skip&&read(p))applyTo(p,x); });
  }
  function fillRecent(){
    document.querySelectorAll('select.plrecent').forEach(s=>{
      const v=s.value;
      s.innerHTML='<option value="">—</option>'+ST.recent.map((x,i)=>'<option value="'+i+'">'+x.name+(x.st?', '+x.st:'')+(x.cc?', '+x.cc:'')+'</option>').join('');
      if(ST.cur){ const k=ST.recent.findIndex(x=>Math.abs(x.lat-ST.cur.lat)<1e-4&&Math.abs(x.lon-ST.cur.lon)<1e-4); s.value=k>=0?String(k):''; }
    });
  }
  function setCur(p,src){
    ST.cur=p; remember(p); save(); fillRecent();
  }
  function addRecentSelects(){
    const groups=['main'].concat(PFX).concat(FOLLOW);
    groups.forEach(p=>{
      const se=g(p==='main'?'plSearch':p+'Search'); if(!se)return;
      const cell=se.closest('.cell'); if(!cell||cell.parentNode.querySelector('.plrecent'))return;
      const lab=document.createElement('label'); lab.className='cell';
      lab.innerHTML='<span class="cl">Recent places</span>';
      const s=document.createElement('select'); s.className='plrecent'; s.setAttribute('aria-label','Recent places');
      s.addEventListener('change',()=>{
        const x=ST.recent[parseInt(s.value,10)]; if(!x)return;
        const p2=Object.assign({src:'manual'},x); ST.cur=p2; remember(p2); save(); applyAll(p2,null); fillRecent();
      });
      lab.appendChild(s); cell.parentNode.insertBefore(lab,cell);
    });
    fillRecent();
  }
  function poll(){
    if(ST.guard)return;
    const groups=['main'].concat(PFX);
    for(const p of groups){
      const r=read(p); if(!r)continue; const k=key(r);
      if(ST.snap[p]===undefined){ST.snap[p]=k;continue;}
      if(k!==ST.snap[p]){
        ST.snap[p]=k;
        if(isNaN(parseFloat(r.lat))||isNaN(parseFloat(r.lon))||!r.tz)return;
        const pl=mkPlace(r,'manual'); setCur(pl);
        applyAll(pl,p);
        // the follower chart panel only follows while it still equals the previous shared place
        return;
      }
    }
  }
  window.GA_PLACE={state:ST,apply:function(x){const p=Object.assign({src:'manual'},x);setCur(p);applyAll(p,null);},poll:poll};
  window.GA_PLACE_MANUAL=function(){return !!(ST.cur&&ST.cur.src==='manual');};
  setTimeout(function(){
    addRecentSelects();
    if(ST.cur&&!isNaN(ST.cur.lat)){ applyAll(ST.cur,null); }
    else { const r=read('main'); if(r){ST.cur=mkPlace(r,'default');} }
    ['main'].concat(PFX).forEach(p=>{const r=read(p); if(r)ST.snap[p]=key(r);});
    fillRecent();
    setInterval(poll,500);
  },500);
})();

/* ---------- v7.2: birth chart font size and style ---------- */
(function(){
  const out=document.getElementById('bpOut'), fs=document.getElementById('bpFs'), ff=document.getElementById('bpFf');
  if(!out||!fs||!ff)return;
  const STK={
    '':'',
    sans:'system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans","Noto Sans Tamil",Arial,sans-serif',
    serif:'Georgia,"Times New Roman","Noto Serif","Noto Serif Tamil",serif',
    mono:'ui-monospace,Menlo,Consolas,"Courier New",monospace',
    rounded:'"Trebuchet MS","Segoe UI",Verdana,"Noto Sans Tamil",sans-serif',
    humanist:'"Gill Sans","Gill Sans MT",Calibri,Candara,"Noto Sans Tamil",sans-serif',
    hand:'"Comic Sans MS","Bradley Hand","Segoe Print","Noto Sans Tamil",cursive',
    classic:'"Palatino Linotype",Palatino,"Book Antiqua","Noto Serif Tamil",serif'
  };
  let cfg={fs:100,ff:''}; try{cfg=Object.assign(cfg,JSON.parse(localStorage.getItem('ga_bpf')||'{}'));}catch(e){}
  fs.value=String(cfg.fs); if(fs.value!==String(cfg.fs))fs.value='100'; ff.value=cfg.ff; if(ff.value!==cfg.ff)ff.value='';
  let busy=false;
  function apply(){
    busy=true;
    const k=cfg.fs/100, fam=STK[cfg.ff]||'';
    out.querySelectorAll('*').forEach(el=>{
      if(el.tagName==='STYLE'||el.tagName==='SCRIPT')return;
      const isText=el.namespaceURI==='http://www.w3.org/2000/svg'?(el.tagName==='text'||el.tagName==='tspan'):true;
      if(!isText)return;
      if(el.dataset.bpfs===undefined){
        const cs=getComputedStyle(el).fontSize; el.dataset.bpfs=parseFloat(cs)||'';
        if(el.dataset.bpfs==='')return;
      }
      const b=parseFloat(el.dataset.bpfs); if(b)el.style.fontSize=(b*k).toFixed(2)+'px';
      if(fam)el.style.fontFamily=fam; else el.style.removeProperty('font-family');
    });
    busy=false;
  }
  function change(){ cfg.fs=parseInt(fs.value,10)||100; cfg.ff=ff.value; try{localStorage.setItem('ga_bpf',JSON.stringify(cfg));}catch(e){} apply(); }
  fs.addEventListener('change',change); ff.addEventListener('change',change);
  let t=null;
  new MutationObserver(function(){ if(busy)return; clearTimeout(t); t=setTimeout(apply,60); }).observe(out,{childList:true,subtree:true});
  window.GA_BPF={apply:apply,cfg:cfg};
  apply();
})();

/* ---------- v7.3: icon titles in the selected language (tooltip on touch or hover, title, aria-label) ---------- */
(function(){
  var tip=document.createElement('div'); tip.id='gaTip'; tip.setAttribute('role','status'); document.body.appendChild(tip);
  var timer=null;
  function lab(b){
    var tx=b.querySelector('.tx'); if(!tx)return b.getAttribute('aria-label')||'';
    var bi=!document.body.classList.contains('lg-x'), s='', ta='';
    tx.childNodes.forEach(function(n){
      if(n.nodeType===3)s+=n.nodeValue;
      else if(n.nodeType===1){ if(n.matches('.tm,.tt,.ta,.tam60,.gt,.gta')){ta+=' '+n.textContent;} else s+=n.textContent; }
    });
    s=s.trim(); ta=ta.trim();
    b.__cap=s; return bi&&ta&&ta!==s?s+' · '+ta:s;
  }
  function sync(){
    document.querySelectorAll('button.tool').forEach(function(b){
      var l=lab(b); if(!l)return;
      if(b.getAttribute('data-tip')!==l){ b.setAttribute('data-tip',l); b.setAttribute('data-cap',b.__cap||l); b.setAttribute('aria-label',l); b.setAttribute('title',l); }
    });
  }
  function hidden(b){ var tx=b.querySelector('.tx'); return !tx||tx.offsetParent===null||tx.offsetWidth<8||tx.offsetHeight<6; }
  function show(b){
    sync(); if(!hidden(b))return;
    var l=b.getAttribute('data-tip'); if(!l)return;
    tip.textContent=l; tip.className='on';
    var r=b.getBoundingClientRect(), w=tip.offsetWidth, x=r.right+10;
    if(x+w>window.innerWidth-8)x=Math.max(8,r.left-w-10);
    tip.style.left=x+'px'; tip.style.top=Math.max(8,r.top+r.height/2-tip.offsetHeight/2)+'px';
    clearTimeout(timer); timer=setTimeout(hide,2200);
  }
  function hide(){ tip.className=''; }
  document.addEventListener('pointerdown',function(e){ var b=e.target.closest&&e.target.closest('button.tool'); if(b)show(b); },true);
  document.addEventListener('mouseover',function(e){ var b=e.target.closest&&e.target.closest('button.tool'); if(b&&e.pointerType!=='touch')show(b); });
  document.addEventListener('mouseout',function(e){ if(e.target.closest&&e.target.closest('button.tool'))hide(); });
  document.addEventListener('focusin',function(e){ var b=e.target.closest&&e.target.closest('button.tool'); if(b)show(b); });
  sync(); setInterval(sync,700);
  document.querySelectorAll('select.langsel').forEach(function(s){s.addEventListener('change',function(){setTimeout(sync,400);});});
  window.GA_TIP={sync:sync};
})();

/* ---------- v7.4: winning-number research for the Lottery Rules tool ---------- */
const LW_DATA=[[3,10,2026,"Grand prize","013075",0],[3,9,2026,"Grand prize","245556",0],[3,8,2026,"Grand prize","267822",0],[3,7,2026,"Grand prize","476107",0],[3,6,2026,"Grand prize","339729",0],[3,5,2026,"Grand prize","012318",0],[3,4,2026,"Grand prize","229425",0],[4,3,2026,"Grand prize","394150",0],[3,2,2026,"Grand prize","305810",0],[3,1,2026,"Grand prize","074090",0],[3,12,2025,"Grand prize","282824",0],[3,11,2025,"Grand prize","463221",0],[3,10,2025,"Grand prize","035350",0],[3,9,2025,"Grand prize","200669",0],[3,8,2025,"Grand prize","194560",0],[3,7,2025,"Grand prize","061080",0],[3,6,2025,"Grand prize","337126",0],[3,5,2025,"Grand prize","306638",0],[3,4,2025,"Grand prize","375678",0],[3,3,2025,"Grand prize","134468",0],[3,2,2025,"Grand prize","456808",0],[3,1,2025,"Grand prize","535948",0],[3,12,2024,"Grand prize","447363",0],[3,11,2024,"Grand prize","197281",0],[3,10,2024,"Grand prize","311573",0],[3,9,2024,"Grand prize","201918",0],[3,8,2024,"Grand prize","334240",0],[3,7,2024,"Grand prize","078319",0],[3,6,2024,"Grand prize","200781",0],[3,5,2024,"Grand prize","056845",0],[3,4,2024,"Grand prize","186551",0],[3,3,2024,"Grand prize","037130",0],[1,11,2026,"Weekly gold","263088",1],[1,11,2026,"Weekly gold","363982",1],[1,11,2026,"Weekly gold","456880",1],[1,11,2026,"Weekly gold","063258",1],[22,10,2026,"Weekly gold","194436",1],[22,10,2026,"Weekly gold","050751",1],[22,10,2026,"Weekly gold","295397",1],[22,10,2026,"Weekly gold","011173",1],[15,10,2026,"Weekly gold","042575",1],[15,10,2026,"Weekly gold","236805",1],[15,10,2026,"Weekly gold","089101",1],[15,10,2026,"Weekly gold","178445",1],[8,10,2026,"Weekly gold","184066",1],[8,10,2026,"Weekly gold","085045",1],[8,10,2026,"Weekly gold","036714",1],[8,10,2026,"Weekly gold","267002",1],[3,10,2026,"Consolation","098059",0],[3,10,2026,"Consolation","020601",0],[3,10,2026,"Consolation","291240",0],[3,10,2026,"Consolation","320975",0],[3,10,2026,"Consolation","129625",0],[3,10,2026,"Dream car","032021",0],[3,9,2026,"Dream car","035787",0],[3,8,2026,"Dream car","024258",0],[3,7,2026,"Dream car","028681",0],[3,6,2026,"Dream car","022391",0],[3,5,2026,"Dream car","022963",0],[3,4,2026,"Dream car","027798",0],[4,3,2026,"Dream car","021247",0],[4,3,2026,"Dream car","002887",0],[3,2,2026,"Dream car","016983",0],[3,10,2022,"Series 245","316764",0],[3,10,2022,"Series 245","175544",0],[3,10,2022,"Series 245","275155",0],[3,10,2022,"Series 245","240695",0],[3,10,2022,"Series 245","096730",0],[3,4,2025,"Bonus cash","220974",0],[3,12,2025,"Bonus cash","236747",0],[3,11,2025,"Bonus cash","151770",0],[3,4,2025,"Bonus cash","067905",0],[3,11,2025,"Bonus cash","296668",0],[3,11,2025,"Bonus cash","269501",0],[3,8,2025,"Bonus cash","002454",0]];
const LW_NUM={Su:1,Mo:2,Ju:3,Ra:4,Me:5,Ve:6,Ke:7,Sa:8,Ma:9};
const LW_WD=['Su','Mo','Ma','Me','Ju','Ve','Sa'];
const LW_PLACES=[['Dubai',25.2048,55.2708,'Asia/Dubai'],['Abu Dhabi',24.4539,54.3773,'Asia/Dubai'],['Sharjah',25.3463,55.4209,'Asia/Dubai'],['Chennai',13.0827,80.2707,'Asia/Kolkata'],['Tiruchirappalli',10.7905,78.7047,'Asia/Kolkata'],['Mumbai',19.076,72.8777,'Asia/Kolkata'],['London',51.5072,-0.1276,'Europe/London'],['Las Vegas',36.1699,-115.1398,'America/Los_Angeles']];
let LW={res:null};
const lwDg=n=>String(Math.abs(Math.round(n))).split('').map(Number);
function lwChart(ms,lat,lon,kind){
  const old=CFG; CFG={lat:lat,lon:lon,kind:kind};
  try{
    const cu=placidusCusps(ms,lat,lon,kind), seg=i=>SEGS[findSeg(cu[i-1])], P={}; CODES.forEach(c=>{P[c]=sidLon(c,ms);});
    const mo=SEGS[findSeg(P.Mo)], ju=SEGS[findSeg(P.Ju)], ve=SEGS[findSeg(P.Ve)];
    const dts=new Date(ms+ (lon/15)*3600000), wd=dts.getUTCDay();
    return {ms:ms,cu:cu,P:P,A:seg(1),c2:seg(2),c5:seg(5),c6:seg(6),c8:seg(8),c11:seg(11),Mo:mo,Ju:ju,Ve:ve,wd:wd,
      asc:cu[0],ascSign:Math.floor(cu[0]/30)%12,ascDeg:Math.floor(cu[0]%30),ascNak:Math.floor(cu[0]/(360/27))+1,
      moSign:Math.floor(P.Mo/30)%12,moDeg:Math.floor(P.Mo%30),moNak:Math.floor(P.Mo/(360/27))+1};
  } finally { CFG=old; }
}
const lwL=(g)=>[g.lord,g.star,g.sub].map(c=>LW_NUM[c]);
// every family says which digits (and whole numbers) a chart suggests
const LW_FAM=[
 {id:'A1',n:'Ascendant: sign lord, star lord, sub lord',f:c=>({d:lwL(c.A),n:[]})},
 {id:'A2',n:'Ascendant sub lord only',f:c=>({d:[LW_NUM[c.A.sub]],n:[]})},
 {id:'C11',n:'11th cusp: sign, star and sub lords',f:c=>({d:lwL(c.c11),n:[]})},
 {id:'C5',n:'5th cusp: sign, star and sub lords',f:c=>({d:lwL(c.c5),n:[]})},
 {id:'C268',n:'2nd, 6th and 8th cusp sub lords',f:c=>({d:[c.c2.sub,c.c6.sub,c.c8.sub].map(x=>LW_NUM[x]),n:[]})},
 {id:'MO',n:'Moon: sign, star and sub lords',f:c=>({d:lwL(c.Mo),n:[]})},
 {id:'MN',n:'Moon nakshatra number and degree',f:c=>({d:lwDg(c.moNak).concat(lwDg(c.moDeg)),n:[c.moNak,c.moDeg]})},
 {id:'AN',n:'Ascendant sign, nakshatra number and degree',f:c=>({d:lwDg(c.ascSign+1).concat(lwDg(c.ascNak),lwDg(c.ascDeg)),n:[c.ascSign+1,c.ascNak,c.ascDeg]})},
 {id:'JV',n:'Jupiter and Venus lords (luck and money)',f:c=>({d:lwL(c.Ju).concat(lwL(c.Ve)),n:[]})},
 {id:'DL',n:'Weekday lord',f:c=>({d:[LW_NUM[LW_WD[c.wd]]],n:[]})},
 {id:'SG',n:'Signs of the nine planets',f:c=>({d:CODES.reduce((a,x)=>a.concat(lwDg(Math.floor(c.P[x]/30)%12+1)),[]),n:[]})},
 {id:'PD',n:'Degrees of Sun, Moon, Jupiter, Venus',f:c=>({d:['Su','Mo','Ju','Ve'].reduce((a,x)=>a.concat(lwDg(Math.floor(c.P[x]%30))),[]),n:['Su','Mo','Ju','Ve'].map(x=>Math.floor(c.P[x]%30))})},
 {id:'DT',n:'Control: digits of the draw date (not astrology)',f:c=>{const d=new Date(c.ms+4*3600000);return {d:lwDg(d.getUTCDate()).concat(lwDg(d.getUTCMonth()+1),lwDg(d.getUTCFullYear()%100)),n:[]};}}
];
function lwRec(){
  return LW_DATA.map(r=>({d:r[0],m:r[1],y:r[2],cat:r[3],tk:r[4],wk:r[5],ms:Date.UTC(r[2],r[1]-1,r[0],19,30)-4*3600000}));
}
function lwMulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function lwHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function lwResearch(kind){
  const R=lwRec(), N=R.length, D=LW_PLACES[0];
  R.forEach(r=>{r.ch=lwChart(r.ms,D[1],D[2],kind);r.digs=r.tk.split('').map(Number);});
  const out=[], B=2000, rng=lwMulberry(20261102);
  LW_FAM.forEach(F=>{
    const sets=R.map(r=>{const s=F.f(r.ch);return new Set(s.d);});
    const all=[],last=[];
    for(let i=0;i<N;i++){const ra=[],rl=[]; for(let j=0;j<N;j++){const t=R[j].digs; let h=0; t.forEach(x=>{if(sets[i].has(x))h++;}); ra.push(h/6); rl.push(sets[i].has(t[5])?1:0);} all.push(ra); last.push(rl);}
    const obs=m=>{let s=0; for(let i=0;i<N;i++)s+=m[i][i]; return s/N;};
    const oa=obs(all), ol=obs(last); let ga=0,gl=0,ma=0,ml=0; const idx=[...Array(N).keys()];
    for(let b=0;b<B;b++){
      for(let i=N-1;i>0;i--){const j=Math.floor(rng()*(i+1)); const t=idx[i];idx[i]=idx[j];idx[j]=t;}
      let sa=0,sl=0; for(let i=0;i<N;i++){sa+=all[i][idx[i]]; sl+=last[i][idx[i]];}
      sa/=N; sl/=N; ma+=sa; ml+=sl; if(sa>=oa)ga++; if(sl>=ol)gl++;
    }
    ma/=B; ml/=B;
    out.push({id:F.id,n:F.n,oa:oa,na:ma,pa:(ga+1)/(B+1),ol:ol,nl:ml,pl:(gl+1)/(B+1),lift:ma?oa/ma:1});
  });
  // does the existing KP lottery strength score high at the draw moments? compare with ordinary evenings
  let kpS=0, base=[], r2=lwMulberry(77);
  const old=CFG; CFG={lat:D[1],lon:D[2],kind:kind};
  try{
    const sc=ms=>{const k=findSeg(sidAsc(ms,D[1],D[2],kind)); return ltEval({k:k,start:ms,end:ms},D[1],D[2],kind,{}).score;};
    R.forEach(r=>{r.kp=sc(r.ms);kpS+=r.kp;}); kpS/=N;
    const t0=Date.UTC(2024,0,1);
    for(let i=0;i<300;i++)base.push(sc(t0+Math.floor(r2()*1000)*86400000+Math.floor(r2()*86400000)));
  }finally{CFG=old;}
  const mb=base.reduce((a,x)=>a+x,0)/base.length, pct=base.filter(x=>x<=kpS).length/base.length;
  const cat={}; R.forEach(r=>{(cat[r.cat]=cat[r.cat]||[]).push(r);});
  const strong=out.filter(o=>o.pa<0.002||o.pl<0.002);
  const w={}; out.forEach(o=>{w[o.id]=Math.max(0,o.lift-1)*4+(o.pa<0.05?0.5:0)+0.12;});
  return {R:R,fam:out,kpS:kpS,kpBase:mb,kpPct:pct,strong:strong,w:w,cat:cat,B:B};
}
// ---- number generation from the chart of one moment
function lwPool(ch,w){
  const pool=Array(10).fill(.35), nums={};
  LW_FAM.forEach(F=>{ if(F.id==='DT')return; const s=F.f(ch), ww=(w&&w[F.id]!=null)?w[F.id]:.15; s.d.forEach(d=>{pool[d]+=ww;}); s.n.forEach(n=>{nums[n]=(nums[n]||0)+ww;}); });
  return {pool:pool,nums:nums};
}
function lwPick(r,wts){let t=wts.reduce((a,x)=>a+x,0),u=r()*t; for(let i=0;i<wts.length;i++){u-=wts[i]; if(u<=0)return i;} return wts.length-1;}
function lwTicket(ch,w,len,seed,first){
  const P=lwPool(ch,w).pool, r=lwMulberry(lwHash(seed)); let s='';
  for(let i=0;i<len;i++){ const wt=P.slice(); if(i===0&&first!=null)for(let d=first+1;d<10;d++)wt[d]=0; s+=lwPick(r,wt); }
  return s;
}
function lwSet(ch,w,k,maxN,maxB,seed){
  const pl=lwPool(ch,w), r=lwMulberry(lwHash(seed)), cw=[];
  for(let n=1;n<=maxN;n++){ const dg=lwDg(n); cw.push(.2+dg.reduce((a,d)=>a+pl.pool[d],0)/dg.length*.6+(pl.nums[n]||0)*1.5); }
  const chosen=[]; while(chosen.length<Math.min(k,maxN)){ const i=lwPick(r,cw); if(chosen.indexOf(i+1)<0)chosen.push(i+1); cw[i]=0; if(cw.every(x=>x===0))break; }
  chosen.sort((a,b)=>a-b);
  const bw=[]; for(let n=1;n<=maxB;n++){ const dg=lwDg(n); bw.push(.2+dg.reduce((a,d)=>a+pl.pool[d],0)/dg.length*.6+(pl.nums[n]||0)*1.5); }
  const ball=lwPick(r,bw)+1;
  return {main:chosen,ball:ball};
}
function lwUI(){
  const box=$('lwBox'); if(!box||box.dataset.ready)return; box.dataset.ready='1';
  $('lwPlaces').innerHTML=LW_PLACES.map((p,i)=>'<label class="lwchk"><input type="checkbox" value="'+i+'"'+(i<2?' checked':'')+'> '+p[0]+'</label>').join('')+'<label class="lwchk"><input type="checkbox" value="me"> My place (above)</label>';
  const n=new Date(), iso=x=>x.toISOString().slice(0,10); $('lwFrom').value=iso(n); $('lwTo').value=iso(new Date(n.getTime()+30*864e5));
  $('lwGo').addEventListener('click',lwRun); $('lwData').addEventListener('click',lwShowData);
}
function lwShowData(){
  const msg=$('lwMsg'); msg.className='msg'; msg.textContent='Reading the planets for the 75 results…';
  setTimeout(function(){
    try{ const kind=$('ltAyan').value; LW.res=lwResearch(kind); msg.textContent='Done.'; lwRenderResearch(); }
    catch(e){ msg.className='msg err'; msg.textContent='Error: '+(e.message||e); }
  },30);
}
const lwPc=x=>(x*100).toFixed(1)+'%', lwP=x=>x<0.001?'<0.001':x.toFixed(3);
function lwRenderResearch(){
  const S=LW.res, el=$('lwRes'); let h='<div class="lf-sec"><h3>What the 75 results show<span class="ta">75 முடிவுகள் காட்டுவது</span></h3></div>';
  h+='<p class="legend">Every result was matched with the sky over <b>Dubai at 7:30 PM GST</b> on its draw day (weekly electronic draws have no time in your list, so 7:30 PM is assumed). Each rule below proposes a set of digits from the sky (planet numbers: Sun 1, Moon 2, Jupiter 3, Rahu 4, Mercury 5, Venus 6, Ketu 7, Saturn 8, Mars 9, and numbers such as nakshatra, sign and degree). We count how many of the 6 ticket digits fall inside that set and compare with <b>'+S.B+' random re-pairings</b> of the same tickets with the same skies, so chance is measured fairly.</p>';
  h+='<div class="tblw"><table class="mkst"><thead><tr><th>Rule (what the sky proposes)</th><th>Digits matched</th><th>By chance</th><th>Chance of this by luck</th><th>Last digit matched</th><th>By chance</th><th>Chance by luck</th></tr></thead><tbody>'+
    S.fam.map(o=>'<tr><td>'+m3e(o.n)+'</td><td><b>'+lwPc(o.oa)+'</b></td><td>'+lwPc(o.na)+'</td><td'+(o.pa<0.002?' style="color:#2e9e5b;font-weight:700"':'')+'>'+lwP(o.pa)+'</td><td><b>'+lwPc(o.ol)+'</b></td><td>'+lwPc(o.nl)+'</td><td'+(o.pl<0.002?' style="color:#2e9e5b;font-weight:700"':'')+'>'+lwP(o.pl)+'</td></tr>').join('')+'</tbody></table></div>';
  h+='<div class="mksum"><b>Reading the table:</b> with '+(S.fam.length*2)+' rules tried, a few will look good by pure luck; a rule is only counted as a real connection when its chance by luck is below 0.002 (shown in green). <b>'+(S.strong.length?S.strong.length+' rule(s) passed':'No rule passed')+'.</b> '+
    (S.strong.length?'Passing rules: '+S.strong.map(o=>m3e(o.n)).join('; ')+'.':'The best-looking rules are within the range that chance produces, so the 75 results do not show a proven link between the sky and the winning numbers.')+'<br>'+
    '<b>Timing check:</b> the ten KP lottery rules score '+S.kpS.toFixed(1)+' at the draw moments, against '+S.kpBase.toFixed(1)+' on ordinary evenings (the draw moments rank higher than '+Math.round(S.kpPct*100)+'% of ordinary moments). A draw time is fixed by the organiser, so this only shows what the sky looked like then.</div>';
  h+='<details class="howto"><summary>The 75 results with the sky at the draw<span class="tt">75 முடிவுகள்</span></summary><div class="tblw"><table class="mkst"><thead><tr><th>Date</th><th>Ticket</th><th>Prize</th><th>Ascendant</th><th>Asc star / sub</th><th>11th cusp sub</th><th>Moon star / sub</th></tr></thead><tbody>'+
    S.R.map(r=>'<tr><td>'+r.d+' '+MON[r.m-1]+' '+r.y+(r.wk?' (~)':'')+'</td><td><b>'+r.tk+'</b></td><td>'+r.cat+'</td><td>'+SIGNS[r.ch.ascSign][0]+' '+r.ch.ascDeg+'°</td><td>'+NAME[r.ch.A.star]+' / '+NAME[r.ch.A.sub]+'</td><td>'+NAME[r.ch.c11.sub]+'</td><td>'+NAME[r.ch.Mo.star]+' / '+NAME[r.ch.Mo.sub]+'</td></tr>').join('')+'</tbody></table></div></details>';
  el.innerHTML=h;
}
function lwWindows(pl,f,t,min,skip,cb){
  const kind=$('ltAyan').value, a=f.split('-').map(Number), b=t.split('-').map(Number), nd=Math.round((Date.UTC(b[0],b[1]-1,b[2])-Date.UTC(a[0],a[1]-1,a[2]))/86400000)+1, items=[];
  let tzf; try{tzf=tzFn(pl[3]);}catch(e){cb(items,'time zone');return;}
  let day=0; const old=CFG;
  (function step(){
    if(day>=nd){CFG=old;cb(items);return;}
    try{
      CFG={lat:pl[1],lon:pl[2],kind:kind};
      const dt=new Date(Date.UTC(a[0],a[1]-1,a[2]+day)), y=dt.getUTCFullYear(), m=dt.getUTCMonth()+1, d=dt.getUTCDate();
      const s=localToUtc(y,m,d,0,0,pl[3]).ms, nx=new Date(Date.UTC(y,m-1,d+1)), e=localToUtc(nx.getUTCFullYear(),nx.getUTCMonth()+1,nx.getUTCDate(),0,0,pl[3]).ms, off=tzf(s);
      let rise=s+6*3600000, set=s+18*3600000;
      try{const obs=new Astronomy.Observer(pl[1],pl[2],0), r1=Astronomy.SearchRiseSet(Astronomy.Body.Sun,obs,+1,Astronomy.MakeTime(new Date(s)),1), r2=Astronomy.SearchRiseSet(Astronomy.Body.Sun,obs,-1,Astronomy.MakeTime(new Date(s)),1); if(r1)rise=r1.date.getTime(); if(r2)set=r2.date.getTime();}catch(x){}
      const wd=dt.getUTCDay(), part=[8,2,7,5,6,4,3][wd], seg8=(set-rise)/8, rk=[rise+(part-1)*seg8,rise+part*seg8], ctx={rk:rk};
      compute(s,e,pl[1],pl[2],kind).forEach(r=>{const x=ltEval(r,pl[1],pl[2],kind,ctx); if(x.score>=min&&!(skip&&x.flags.length))items.push({pl:pl,r:r,x:x,off:off,day:s});});
    }catch(err){CFG=old;cb(items,err.message||String(err));return;}
    day++; setTimeout(step,0);
  })();
}
function lwRun(){
  const msg=$('lwMsg'), out=$('lwOut'); msg.className='msg err'; out.innerHTML='';
  const f=$('lwFrom').value, t=$('lwTo').value, kind=$('ltAyan').value;
  if(!f||!t){msg.textContent='Pick the first and last date of your period.';return;}
  const a=f.split('-').map(Number), b=t.split('-').map(Number), nd=Math.round((Date.UTC(b[0],b[1]-1,b[2])-Date.UTC(a[0],a[1]-1,a[2]))/86400000)+1;
  if(nd<1){msg.textContent='The last date must not be before the first date.';return;} if(nd>62){msg.textContent='Please choose at most 62 days.';return;}
  const places=[]; document.querySelectorAll('#lwPlaces input:checked').forEach(c=>{ if(c.value==='me'){const la=parseFloat($('ltLat').value),lo=parseFloat($('ltLon').value),tz=$('ltTz').value.trim(); if(!isNaN(la)&&!isNaN(lo)&&tz)places.push([($('ltSearch').value||'My place'),la,lo,tz]);} else places.push(LW_PLACES[+c.value]); });
  if(!places.length){msg.textContent='Tick at least one place.';return;}
  if(typeof Astronomy==='undefined'){msg.textContent='Planet positions need the astronomy library, which did not load.';return;}
  const min=parseInt($('lwMin').value,10), skip=$('lwSkip').checked, nMain=Math.max(1,parseInt($('lwK').value,10)||5), maxN=Math.max(nMain,parseInt($('lwMax').value,10)||49), maxB=Math.max(1,parseInt($('lwBall').value,10)||26), nSets=Math.max(1,Math.min(10,parseInt($('lwSets').value,10)||5)), top=Math.max(1,Math.min(15,parseInt($('lwTop').value,10)||6));
  msg.className='msg'; $('lwGo').disabled=true;
  const ensure=()=>{ if(!LW.res)LW.res=lwResearch(kind); return LW.res; };
  let all=[], pi=0;
  (function next(){
    if(pi>=places.length){ try{ lwFinish(all,places,ensure(),{f:f,t:t,kind:kind,nMain:nMain,maxN:maxN,maxB:maxB,nSets:nSets,top:top}); msg.textContent='Done.'; }catch(e){msg.className='msg err';msg.textContent='Error: '+(e.message||e);} $('lwGo').disabled=false; return; }
    msg.textContent='Reading '+places[pi][0]+' ('+(pi+1)+' of '+places.length+')…';
    lwWindows(places[pi],f,t,min,skip,function(items,err){ if(err){msg.className='msg err';msg.textContent='Error: '+err;$('lwGo').disabled=false;return;} all=all.concat(items); pi++; next(); });
  })();
}
function lwFinish(all,places,S,o){
  const w=S.w, out=$('lwOut');
  const gen=(it)=>{ const mid=Math.round((it.r.start+it.r.end)/2), ch=lwChart(mid,it.pl[1],it.pl[2],o.kind), sd=it.pl[0]+mid;
    const six=[0,1,2].map(i=>lwTicket(ch,w,6,sd+'6'+i,5)), five=[0,1,2].map(i=>lwTicket(ch,w,5,sd+'5'+i)), sets=[];
    for(let i=0;i<o.nSets;i++)sets.push(lwSet(ch,w,o.nMain,o.maxN,o.maxB,sd+'s'+i));
    return {ch:ch,six:six,five:five,sets:sets,mid:mid}; };
  const loc=(ms,off)=>fmtDate(ms,off)+' '+fmtHMS(ms,off);
  all.sort((p,q)=>q.x.score-p.x.score||p.r.start-q.r.start);
  const pick=[], usedDay={}; for(const it of all){ const k=it.pl[0]+'|'+it.day; if((usedDay[k]||0)>=1)continue; usedDay[k]=1; pick.push(it); if(pick.length>=o.top)break; }
  let h='<div class="lf-sec"><h3>Best days, times and places to buy<span class="ta">வாங்க சிறந்த நாள், நேரம், இடம்</span></h3></div>';
  if(!pick.length){ h+='<p class="legend">No window reached the chosen strength in this period. Lower the minimum strength or choose more places.</p>'; }
  else{
    h+='<div class="tblw"><table class="mkst"><thead><tr><th>#</th><th>Date and place</th><th>Buy between (local time)</th><th>Star lord total time</th><th>Strength</th><th>Ascendant · star · sub</th></tr></thead><tbody>'+
      pick.map((it,i)=>{const tier=ltTier(it.x.score), dur=Math.round((it.r.end-it.r.start)/1000), g=SEGS[it.r.k]; return '<tr><td>'+(i+1)+'</td><td><b>'+fmtDate(it.r.start,it.off)+'</b><br>'+it.pl[0]+'</td><td>'+fmtHMS(it.r.start,it.off)+' – '+fmtHMS(it.r.end,it.off)+'</td><td>'+dur+'s</td><td><b>'+it.x.score+'</b> · '+tier[0]+' · '+it.x.level+'</td><td>'+SIGNS[g.sign][0]+' · '+NAME[g.star]+' · '+NAME[g.sub]+'</td></tr>';}).join('')+'</tbody></table></div>';
    h+='<div class="lf-sec"><h3>Numbers for those moments<span class="ta">அந்த நேரங்களுக்கான எண்கள்</span></h3></div>';
    const dsum=Array(10).fill(0);
    pick.forEach((it,i)=>{ const g=gen(it); g.ch&&lwPool(g.ch,w).pool.forEach((v,d)=>{dsum[d]+=v;});
      h+='<div class="mkfc nu"><div class="mkfh"><b>#'+(i+1)+' · '+loc(it.r.start,it.off).slice(0,17)+' · '+it.pl[0]+'</b><span class="mkbnu">chart at '+fmtHMS(g.mid,it.off)+'</span></div>'+
        '<div>6-digit tickets: <b>'+g.six.join(' · ')+'</b></div><div>5-digit tickets: <b>'+g.five.join(' · ')+'</b></div>'+
        '<div>'+o.nSets+' sets of '+o.nMain+' numbers (1–'+o.maxN+') + play ball (1–'+o.maxB+'):<br>'+g.sets.map((s,j)=>'<span class="lwset">'+(j+1)+') '+s.main.map(x=>String(x).padStart(2,'0')).join(' ')+' + <b>'+String(s.ball).padStart(2,'0')+'</b></span>').join('<br>')+'</div></div>'; });
    const ds=dsum.map((v,d)=>[d,v]).sort((x,y)=>y[1]-x[1]);
    h+='<div class="mksum"><b>Digits favoured most across these moments:</b> '+ds.slice(0,4).map(x=>x[0]).join(', ')+' · <b>least:</b> '+ds.slice(-3).map(x=>x[0]).join(', ')+'</div>';
  }
  // draw days in the period
  const dd=($('lwDraw').value||'3').split(/[ ,]+/).map(Number).filter(x=>x>=1&&x<=31), dtm=($('lwDrawT').value||'19:30').split(':').map(Number), D=LW_PLACES[0], a=o.f.split('-').map(Number), b=o.t.split('-').map(Number), nd=Math.round((Date.UTC(b[0],b[1]-1,b[2])-Date.UTC(a[0],a[1]-1,a[2]))/86400000)+1, rows=[];
  for(let i=0;i<nd;i++){ const dt=new Date(Date.UTC(a[0],a[1]-1,a[2]+i)); if(dd.indexOf(dt.getUTCDate())<0)continue; const ms=Date.UTC(dt.getUTCFullYear(),dt.getUTCMonth(),dt.getUTCDate(),dtm[0],dtm[1])-4*3600000, ch=lwChart(ms,D[1],D[2],o.kind), sd='draw'+ms;
    rows.push({ms:ms,ch:ch,six:[0,1,2,3,4].map(k=>lwTicket(ch,w,6,sd+'6'+k,5)),five:[0,1,2].map(k=>lwTicket(ch,w,5,sd+'5'+k)),sets:Array.from({length:o.nSets},(_,k)=>lwSet(ch,w,o.nMain,o.maxN,o.maxB,sd+'s'+k))}); }
  h+='<div class="lf-sec"><h3>Draw days in your period (Dubai, '+String(dtm[0]).padStart(2,'0')+':'+String(dtm[1]||0).padStart(2,'0')+' GST)<span class="ta">குலுக்கல் நாட்கள்</span></h3></div>';
  h+=rows.length?rows.map(r=>'<div class="mkfc nu"><div class="mkfh"><b>'+fmtDate(r.ms,4)+'</b><span class="mkbnu">'+SIGNS[r.ch.ascSign][0]+' ascendant · '+NAME[r.ch.A.star]+' / '+NAME[r.ch.A.sub]+' · 11th cusp sub '+NAME[r.ch.c11.sub]+' · Moon '+NAME[r.ch.Mo.star]+' / '+NAME[r.ch.Mo.sub]+'</span></div><div>6-digit tickets: <b>'+r.six.join(' · ')+'</b></div><div>5-digit tickets: <b>'+r.five.join(' · ')+'</b></div><div>'+r.sets.map((s,j)=>'<span class="lwset">'+(j+1)+') '+s.main.map(x=>String(x).padStart(2,'0')).join(' ')+' + <b>'+String(s.ball).padStart(2,'0')+'</b></span>').join('<br>')+'</div></div>').join(''):'<p class="legend">No draw day (day of month '+dd.join(', ')+') falls inside this period.</p>';
  // best place
  const sc={}; places.forEach(p=>{sc[p[0]]=[];}); all.forEach(it=>{sc[it.pl[0]].push(it.x.score);});
  const rk=Object.keys(sc).map(k=>{const v=sc[k].sort((x,y)=>y-x).slice(0,5); return [k,v.length?v.reduce((x,y)=>x+y,0)/v.length:0,sc[k].length];}).sort((x,y)=>y[1]-x[1]);
  h+='<div class="mksum"><b>Best place in this period</b> (average of its five strongest windows): '+rk.map(x=>x[0]+' '+x[1].toFixed(0)+' ('+x[2]+' windows)').join(' · ')+'</div>';
  h+='<p class="legend"><b>Please read:</b> a lottery draw is random. The numbers above are a deterministic reading of the sky at each moment: the digits come from planet numbers, lords, nakshatra, sign and degree of the chart, weighted by how well each rule fitted your 75 results. '+(S.strong.length?'':'No rule beat chance on those results, so the weights are almost flat and these numbers carry no proven advantage. ')+'Buy only what you can afford to lose.</p>';
  out.innerHTML=h;
}
lwUI();

/* ---------- v7.5: classical Prasna reading (V. K. Choudhry's Systems' Approach, Prasna Marga timing, Tajika yogas, day and hora nadi) ---------- */
(function(){
  const SL=['Ma','Ve','Me','Mo','Su','Me','Ve','Ma','Ju','Sa','Sa','Ju'];
  const EX={Su:0,Mo:1,Ma:9,Me:5,Ju:3,Ve:11,Sa:6}, DB={Su:6,Mo:7,Ma:3,Me:11,Ju:9,Ve:5,Sa:0};
  const AFF=[['Me','Ra','Ke'],['Ve','Ju','Ma','Ra','Ke'],['Ra','Ke'],['Ju','Sa','Ra','Ke'],['Mo','Ra','Ke'],['Sa','Ma','Su','Ra','Ke'],['Me','Ra','Ke'],['Ma','Ve','Ra','Ke'],['Mo','Ra','Ke'],['Su','Ju','Ra','Ke'],['Mo','Me','Ra','Ke'],['Su','Ve','Sa','Ra','Ke']];
  const CMB={Mo:12,Ma:17,Me:14,Ju:11,Ve:10,Sa:15};
  const ASP={Ma:[90,210],Ju:[120,240],Sa:[60,270]};
  const SPD=['Mo','Me','Ve','Su','Ma','Ju','Sa'], PER={Mo:['muhurta (48 minutes)',.0333],Ma:['day',1],Ve:['fortnight',14],Ju:['month',30],Me:['two months',61],Su:['six months',182.5],Sa:['year',365]};
  const MS={Su:.9856,Mo:13.1764,Ma:.524,Me:1,Ve:1,Ju:.083,Sa:.033};
  const KAR={1:['Su'],2:['Ju'],3:['Ma','Me'],4:['Mo','Ve'],5:['Ju'],6:['Sa','Ma'],7:['Ve'],8:['Sa'],9:['Ju'],10:['Su','Me'],11:['Ju'],12:['Sa','Ke']};
  const TH={Su:'authority, government, father, status, health and vitality',Mo:'the mind, mother, the public, travel, home and emotions',Ma:'property, brothers, courage, conflict, surgery and the police',Me:'trade, communication, education, documents and friends',Ju:'money, children, teachers, luck, law and advice',Ve:'marriage, love, comfort, vehicles, art and women',Sa:'job, service, delay, labour, elders and long-term matters'};
  const BEN={Ju:1,Ve:1,Me:1,Mo:1}, MAL={Sa:1,Ma:1,Su:.5};
  const REM={Su:'Give a handful of wet wheat with 15–20 g of jaggery to a cow, serve your father or help needy old people.',Mo:'Give dough to a cow, serve your mother or help old women.',Ma:'Ten minutes of morning prayer and kindness to your servants.',Me:'Give about 2 kg of green fodder to a cow or help poor children.',Ju:'Offer one yellow sweet (bundi laddu) to birds or serve your teacher.',Ve:'Offer a white sweet to birds or help women in distress.',Sa:'Offer plain salty food to birds or help the poor.',Ra:'Give brown sweets to birds or help needy old people.',Ke:'Give some food to a stray dog or help spiritual institutions.'};
  const LOST=[['east','red','bakery, hardware store, sports club, dentist; near stoves, tools, a chimney, high shelves or doorways'],['south-east','blue','bank, jewellery or clothes shop; low in a quiet dim room, a cash box, wallet, handbag or a trunk'],['south-west','yellow','bookshop, school, post office, bus station; a desk, bookshelf, hallway, briefcase or near the telephone'],['north','green or silver','kitchen, dining room, pantry, laundry; near water, sink, a pool or a well'],['north-west','gold or orange','a living room, children’s room, a toy chest, park, playground or a place lacking order'],['south-west','yellow-green or violet','clothes or food closet, study, pantry, pet or servant’s room, a rented room, a pharmacy'],['west','pastel blue or green','bedroom, dressing table, wardrobe, jewellery box, top drawer, under the bed or among your partner’s things'],['north-east','dark red or wine','bathroom, rubbish, near pipes, a secret drawer, an empty room or a damp place'],['south-east','blue-violet or wine','the largest room, a fireplace, an upper room, among college or prayer books, high ground'],['south','black or brown','a basement, a corner, near the refrigerator, old furniture, a garage or a dark hard-to-reach place'],['north-west','turquoise','near electrical equipment, a telephone, a meter panel, a garage or a recently remodelled room'],['north-west','blue-violet or wine','a damp low place, near a fish tank, the bar, a bathroom, a secret hiding place or near water']];
  const ordn=n=>n+((n%100>=11&&n%100<=13)?'th':n%10===1?'st':n%10===2?'nd':n%10===3?'rd':'th');
  const approx=d=>d<0.04?Math.max(1,Math.round(d*1440))+' minutes':d<2?Math.round(d*24)+' hours':d<60?Math.round(d)+' days':d<730?(d/30.4).toFixed(1).replace(/\.0$/,'')+' months':(d/365).toFixed(1).replace(/\.0$/,'')+' years';
  const mod360=x=>((x%360)+360)%360;
  function strength(ch,p,L){
    const o=ch.pl[p], lon=o.lon, sg=o.sg, d=lon%30, h=((sg-L+12)%12)+1, n=[]; let s=0, pw=1;
    if(SL[sg]===p){s+=2;n.push('in its own sign');} else if(EX[p]===sg){s+=2;n.push('exalted');} else if(DB[p]===sg){s-=2;n.push('debilitated');}
    if(p!=='Su'&&p!=='Ra'&&p!=='Ke'&&CMB[p]!=null){ const dd=Math.abs(mod360(lon-ch.pl.Su.lon+180)-180); if(dd<CMB[p]){s-=1;n.push('combust');} }
    if(d<5){pw=(Math.floor(d)+1)/5; s-=(1-pw)*2; n.push('infancy ('+Math.round(pw*100)+'% power)');}
    else if(d>=25){pw=Math.max(0,(30-d)/5); s-=(1-pw)*2; n.push('old age ('+Math.round(pw*100)+'% power)');}
    if([6,8,12].indexOf(h)>=0&&SL[sg]!==p){s-=1;n.push('badly placed in the '+ordn(h)+' house');} else if([1,4,5,7,9,10].indexOf(h)>=0){s+=1;n.push('well placed in the '+ordn(h)+' house');}
    return {s:s,n:n,h:h,pw:pw};
  }
  function afflictors(ch,p,L){
    const af=AFF[L], out=[]; af.forEach(a=>{ if(a===p||!ch.pl[a])return; const dist=mod360(ch.pl[p].lon-ch.pl[a].lon), ang=[0,180].concat(ASP[a]||[]);
      ang.forEach(x=>{ let e=Math.abs(mod360(dist-x+180)-180); if(e<5){ const pc=e<1?100:Math.round((1-e/5)*100); if(!out.some(q=>q.a===a))out.push({a:a,e:e,pc:pc,how:x===0?'conjunction':'aspect'}); } }); });
    return out;
  }
  function houseDist(a,b){return ((b-a+12)%12)+1;}
  function applying(ch,A,B){  // Itthasala: the faster planet is behind the slower within the orb
    const ia=SPD.indexOf(A), ib=SPD.indexOf(B); if(ia<0||ib<0||A===B)return null;
    const f=ia<ib?A:B, sl=ia<ib?B:A, d=mod360(ch.pl[sl].lon-ch.pl[f].lon), orb={Mo:12,Su:15,Ma:8,Me:7,Ju:9,Ve:7,Sa:9}, w=(orb[f]+orb[sl])/2, res=[];
    [0,60,90,120,180].forEach(t=>{ const e=mod360(d-t+180)-180; if(Math.abs(e)<w)res.push({t:t,e:e,ok:e>0,f:f,sl:sl}); });
    if(!res.length)return null; res.sort((x,y)=>Math.abs(x.e)-Math.abs(y.e)); return res[0];
  }
  const aspName={0:'conjunction',60:'sextile',90:'square',120:'trine',180:'opposition'};
  function moonChecks(ch,L){
    const out=[], A=ch.cu[0]%30, mo=ch.pl.Mo.lon;
    if(A<3)out.push(['Ascendant is at '+A.toFixed(1)+'°, below 3°: the querent does not yet have enough information.',-1]);
    if(A>27)out.push(['Ascendant is at '+A.toFixed(1)+'°, above 27°: the matter is already out of the querent’s hands.',-1]);
    const rem=30-mo%30; let voc=true;
    ['Su','Me','Ve','Ma','Ju','Sa'].forEach(p=>{ [0,60,90,120,180].forEach(t=>{ const e=mod360(ch.pl[p].lon-t-mo); if(e<rem)voc=false; }); });
    if(voc)out.push(['The Moon is void of course (no aspect to complete before it leaves '+SIGNS[ch.pl.Mo.sg][0]+'): the matter proceeds with great difficulty.',-2]);
    const h=(x)=>((ch.pl[x].sg-L+12)%12)+1; if(h('Sa')===1||h('Sa')===7)out.push(['Saturn is in the '+ordn(h('Sa'))+' house: the querent does not fully understand the situation.',-1]);
    if(Math.abs(mod360(mo-ch.pl.Su.lon+180)-180)<12)out.push(['The Moon is within 12° of the Sun (eclipse-like): the question may need to be put again.',-1]);
    if(ch.pl.Me.retro)out.push(['Mercury is retrograde: the querent may change his or her mind and plans may come to nothing.',-1]);
    const pl=['Su','Me','Ve','Ma','Ju','Sa'].map(p=>({p:p,d:mod360(ch.pl[p].lon-mo)})), beh=pl.slice().sort((a,b)=>(360-a.d)%360-(360-b.d)%360)[0], ahe=pl.slice().sort((a,b)=>a.d-b.d)[0];
    if((beh.p==='Ma'&&ahe.p==='Sa')||(beh.p==='Sa'&&ahe.p==='Ma'))out.push(['The Moon is besieged between Mars and Saturn: trouble at every turn.',-2]);
    return out;
  }
  function nav(lon){return Math.floor((lon%30)/(30/9))+1;}
  function when(ms,days,off){ const t=ms+days*86400000; return fmtDate(t,off); }
  function daysTo(from,target,spd){return mod360(target-from)/spd;}
  window.GA_PRASNA={render:function(qd,ch,ms,lat,lon,tzs,kind){
    const L=Math.floor(ch.cu[0]/30)%12, off=tzFn(tzs)(ms), H=h=>SL[(L+h-1)%12], hOf=p=>((ch.pl[p].sg-L+12)%12)+1;
    const kh=(qd.k&&qd.k[0])||1, adv=!!(qd.o&&qd.o.adv), ky=H(kh), kar=(KAR[kh]||[]).filter(x=>x!==ky), ll=H(1);
    let pts=0; const why=[];
    const add=(v,t)=>{pts+=v; why.push([v,t]);};
    let h='<details class="howto" open><summary>Classical Prasna reading · பாரம்பரிய பிரசன்ன கணிப்பு<span class="tt">Prasna Marga · Systems’ Approach · Tajika</span></summary>';
    h+='<p class="legend">This second reading uses whole-sign houses from the question ascendant (<b>'+SIGNS[L][0]+'</b>) and the methods of the four Prasna books you supplied, so it can differ from the KP cusp answer above. Where the two agree, trust the answer more.</p>';
    // 1 before judging
    const mc=moonChecks(ch,L); mc.forEach(x=>add(x[1],x[0]));
    h+='<div class="lf-sec"><h3>1 · Can the chart be judged?<span class="ta">விடை காணத் தகுந்ததா?</span></h3></div>'+(mc.length?'<ul class="mkpl">'+mc.map(x=>'<li class="be">'+m3e(x[0])+'</li>').join('')+'</ul>':'<p class="legend">No caution applies: the ascendant degree, Moon, Saturn, Mercury and the Moon’s surroundings are all clear.</p>');
    // 2 determinants
    const S=p=>strength(ch,p,L), sk=S(ky), sl=S(ll), ak=kar.length?S(kar[0]):null, afK=afflictors(ch,ky,L), afL=afflictors(ch,ll,L), afR=kar.length?afflictors(ch,kar[0],L):[];
    const row=(role,p,st,af)=>'<tr><td>'+role+'</td><td><b>'+NAME[p]+'</b> in '+SIGNS[ch.pl[p].sg][0]+' ('+ordn(hOf(p))+' house, '+(ch.pl[p].lon%30).toFixed(1)+'°)</td><td>'+(st.n.join(', ')||'ordinary')+'</td><td>'+(af.length?af.map(a=>NAME[a.a]+' '+a.how+' '+a.pc+'%').join(', '):'none')+'</td><td><b>'+(st.s>=2?'Strong':st.s>=0?'Fair':'Weak')+'</b></td></tr>';
    h+='<div class="lf-sec"><h3>2 · Who answers your question<span class="ta">யார் பதில் தருகிறார்கள்</span></h3></div><p class="legend">The question is about the <b>'+ordn(kh)+' house</b> (the karya bhava). Its lord is the <b>karyesha</b>; the natural significator is the <b>karaka</b>; the ascendant lord stands for you and the Moon co-rules the querent.</p>';
    h+='<div class="tblw"><table class="mkst"><thead><tr><th>Role</th><th>Planet and place</th><th>Condition</th><th>Close afflictions (within 5°)</th><th>Verdict</th></tr></thead><tbody>'+row('Querent (ascendant lord)',ll,sl,afL)+row('Matter (karyesha, '+kh+'th lord)',ky,sk,afK)+(ak?row('Karaka',kar[0],ak,afR):'')+'</tbody></table></div>';
    add(sk.s>=2?1.5:sk.s>=0?0.5:-1.5,'The karyesha '+NAME[ky]+' is '+(sk.s>=2?'strong':sk.s>=0?'fair':'weak')); if(afK.length)add(-1,'The karyesha is afflicted by '+afK.map(a=>NAME[a.a]).join(', '));
    add(sl.s>=2?1:sl.s>=0?0:-1,'The ascendant lord '+NAME[ll]+' is '+(sl.s>=2?'strong':sl.s>=0?'fair':'weak')); if(ak)add(ak.s>=2?1:ak.s>=0?0:-1,'The karaka '+NAME[kar[0]]+' is '+(ak.s>=2?'strong':ak.s>=0?'fair':'weak'));
    // 3 tajika link
    const dd=houseDist(ch.pl[ll].sg,ch.pl[ky].sg), kind3=[3,5,9,11].indexOf(dd)>=0?'friendly':[1,4,7,10].indexOf(dd)>=0?'hard':'none';
    let tj; if(ll===ky){tj='The ascendant lord is also the karyesha: you and the matter are one, a positive sign.'; add(1.5,'The ascendant lord is the karyesha');}
    else if(kind3==='friendly'){tj='<b>Friendly Tajika aspect</b> ('+ordn(dd)+' from each other): success with little effort.'; add(2,'Ascendant lord and karyesha are in a friendly Tajika aspect');}
    else if(kind3==='hard'){tj='<b>Hard Tajika aspect</b> ('+ordn(dd)+' from each other): the event can happen, but only after struggle and repeated trials.'; add(0.5,'Hard Tajika aspect: success after struggle');}
    else {tj='<b>No Tajika aspect</b> ('+ordn(dd)+' from each other): there is no direct way for the event to happen unless other links appear.'; add(-2,'No Tajika aspect between ascendant lord and karyesha');}
    const ap=ll!==ky?applying(ch,ll,ky):null; let itt='';
    if(ap){ const nm=aspName[ap.t]; if(ap.ok){itt='<b>Itthasala (applying):</b> '+NAME[ap.f]+', the faster planet, is behind '+NAME[ap.sl]+' and will complete the '+nm+': the event will take place'+(ap.t===90?', though it will feel more trouble than it is worth':ap.t===180?' after much negotiation':'')+'.'; add(ap.t===90?0.5:ap.t===180?1:2,'Itthasala between ascendant lord and karyesha ('+nm+')');}
      else{itt='<b>Ishrafa (separating):</b> the '+nm+' between '+NAME[ap.f]+' and '+NAME[ap.sl]+' has already passed: the matter has happened, belongs to the past, or will not come now.'; add(-2,'Ishrafa between ascendant lord and karyesha');} } else itt='No applying or separating aspect within orb between the ascendant lord and the karyesha.';
    const mA=applying(ch,'Mo',ky); if(ky!=='Mo'&&mA&&mA.ok&&[0,60,120].indexOf(mA.t)>=0)add(1,'The Moon applies to the karyesha by '+aspName[mA.t]); else if(ky!=='Mo'&&mA&&!mA.ok)add(-0.5,'The Moon has just separated from the karyesha');
    if(hOf(ky)===1)add(1,'The karyesha sits in the ascendant'); if(hOf(ll)===kh)add(1,'The ascendant lord sits in the karya bhava');
    const e11=H(11); if(e11!==ll){ const d11=houseDist(ch.pl[ll].sg,ch.pl[e11].sg); if([3,5,9,11].indexOf(d11)>=0)add(1,'The 11th lord (fulfilment) is in a friendly aspect with the ascendant lord'); }
    h+='<div class="lf-sec"><h3>3 · Tajika links<span class="ta">தாஜிக தொடர்புகள்</span></h3></div><p class="legend">'+tj+'<br>'+itt+'</p>';
    // 4 verdict
    const verdict=pts>=4?['Yes, likely and smooth','up']:pts>=2?['Yes, with effort or delay','up']:pts>=0?['Doubtful; it may be delayed','nu']:['No, or heavily obstructed','dn'];
    const vtxt=adv?(pts>=2?'the adverse event is <b>less likely</b>':pts>=0?'the adverse event is <b>possible</b>':'the adverse event <b>is indicated</b>'):verdict[0];
    h+='<div class="lf-sec"><h3>4 · Classical verdict<span class="ta">பாரம்பரிய முடிவு</span></h3></div><div class="mkfc '+(adv?(pts>=2?'up':pts>=0?'nu':'dn'):verdict[1])+'"><div class="mkfh"><b>'+(adv?'Adverse event asked about: ':'')+vtxt+'</b><span class="mkb'+verdict[1]+'">score '+(pts>=0?'+':'')+pts.toFixed(1)+'</span></div><ul style="margin:6px 0 0 18px;padding:0">'+why.map(w=>'<li>'+(w[0]>0?'+':'')+w[0]+' · '+m3e(w[1])+'</li>').join('')+'</ul></div>';
    // 5 timing
    const rows=[], lnav=nav(ch.pl[ll].lon), lper=PER[ll];
    if(lper)rows.push(['Navamsa elapsed by the ascendant lord (Prasna Marga 14.81)',NAME[ll]+' is in its '+ordn(lnav)+' navamsa × its period ('+lper[0]+') ⇒ <b>'+lnav+' × '+lper[0]+' (about '+approx(lnav*lper[1])+')</b>']);
    const nl=Math.floor(ch.cu[0]/(30/9))%12, nlord=SL[nl], nvl=PER[nlord]?nav(ch.pl[nlord].lon):0;
    if(PER[nlord])rows.push(['Navamsa of the navamsa-ascendant lord (14.82)',NAME[nlord]+' rules the navamsa ascendant and is in its '+ordn(nvl)+' navamsa × '+PER[nlord][0]+' ⇒ <b>'+nvl+' × '+PER[nlord][0]+' (about '+approx(nvl*PER[nlord][1])+')</b>']);
    const vis=hOf(ky)>=7, cnt=houseDist((L+kh-1)%12,ch.pl[ky].sg);
    rows.push(['Signs from the karya bhava to its lord (14.85)','The karyesha is '+cnt+' signs away and in the '+(vis?'<b>visible half</b> (results soon): about <b>'+cnt+' days</b>':'<b>invisible half</b> (results late): about <b>'+cnt+' months</b>')]);
    const dMo=daysTo(ch.pl.Mo.lon,ch.pl[ky].sg*30,MS.Mo); rows.push(['Moon reaches the karyesha’s sign (14.85)','The Moon enters '+SIGNS[ch.pl[ky].sg][0]+' in about <b>'+dMo.toFixed(1)+' days</b> (around '+when(ms,dMo,off)+')']);
    const dSu=daysTo(ch.pl.Su.lon,L*30,MS.Su), dMoL=daysTo(ch.pl.Mo.lon,L*30,MS.Mo);
    rows.push(['Sun or Moon transits the ascendant (14.86)','The Moon enters '+SIGNS[L][0]+' in about <b>'+dMoL.toFixed(1)+' days</b>; the Sun in about <b>'+dSu.toFixed(0)+' days</b> (around '+when(ms,dSu,off)+')']);
    if(EX[ky]!=null)rows.push(['Karyesha’s exaltation sign (14.86)','The Moon reaches '+SIGNS[EX[ky]][0]+' in about <b>'+daysTo(ch.pl.Mo.lon,EX[ky]*30,MS.Mo).toFixed(1)+' days</b>']);
    const mals=['Sa','Ma','Ra','Ke'].filter(p=>[6,8,12].indexOf(hOf(p))>=0);
    mals.forEach(p=>{ if(lper)rows.push(['Period of sorrow (14.83)',NAME[p]+' sits in the '+ordn(hOf(p))+' house: '+hOf(p)+' × '+lper[0]+' of '+NAME[ll]+' ⇒ a hard time lasting about <b>'+approx(hOf(p)*lper[1])+'</b>']); });
    h+='<div class="lf-sec"><h3>5 · When<span class="ta">எப்போது</span></h3></div><div class="tblw"><table class="mkst"><thead><tr><th>Method (Prasna Marga)</th><th>Reading</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+r[0]+'</td><td>'+r[1]+'</td></tr>').join('')+'</tbody></table></div><p class="legend">Different methods give different times. Use the short ones when the karyesha is strong and in the visible half, and the long ones when it is weak or in the invisible half. The domain of a Prasna is about one year; keep the place, time and person (desha, kala, patra) in mind.</p>';
    // 6 day and hora
    try{ const hr=smaHora(ms,lat,lon), dl=hr.day, hl=hr.lord;
      const nb=(BEN[dl]?1:0)+(BEN[hl]?1:0), nm=(MAL[dl]?1:0)+(MAL[hl]?1:0);
      let rd=nb===2?'Both are benefic: the matter is favourable and success is indicated.':nm>=2?'Both are malefic: trouble, conflict or a difficult period is indicated.':(dl==='Ju'&&hl==='Sa')||(dl==='Sa'&&hl==='Ju')?'Jupiter with Saturn: the querent has come about employment; success in the job, or good improvement in business, is indicated.':(dl==='Sa'&&hl==='Ma')||(dl==='Ma'&&hl==='Sa')?'Saturn with Mars: a troublesome period in the job, with difficult conditions at work for some time.':'One benefic and one malefic: the matter succeeds only after delay or effort.';
      h+='<div class="lf-sec"><h3>6 · Day lord and Hora lord<span class="ta">நாள் அதிபதியும் ஹோரை அதிபதியும்</span></h3></div><p class="legend">Day lord <b>'+NAME[dl]+'</b> + Hora lord <b>'+NAME[hl]+'</b> (hour '+hr.n+' from sunrise). The query concerns <b>'+TH[dl]+'</b> together with <b>'+TH[hl]+'</b>. '+rd+' <span class="muted">(Sapta Graha Prasna Nadi)</span></p>'; }catch(e){}
    // 7 lost article
    if(/lost|found|theft|stolen|possess|jewel|missing|return|abscond|whereabouts|kidnap/.test(qd.id)){
      const sgn=ch.pl[ky==='Mo'?'Mo':ky].sg, ls=LOST[sgn], ll2=LOST[L];
      h+='<div class="lf-sec"><h3>7 · Where to look<span class="ta">எங்கே தேடுவது</span></h3></div><p class="legend">The significator <b>'+NAME[ky]+'</b> is in <b>'+SIGNS[sgn][0]+'</b>: direction <b>'+ls[0]+'</b>, colour '+ls[1]+'; likely places: '+ls[2]+'.<br>The ascendant sign '+SIGNS[L][0]+' adds: direction '+ll2[0]+'. The Moon, Mercury or the 3rd lord on the 3rd house or the ascendant brings news of the whereabouts; a slow or stationary afflictor delays the return and a fast one hastens it (Choudhry).</p>'; }
    // 8 remedies
    const bad={}; afK.concat(afL,afR).forEach(a=>{bad[a.a]=1;});
    h+='<div class="lf-sec"><h3>8 · Remedies for the afflicting planets<span class="ta">பரிகாரங்கள்</span></h3></div>'+(Object.keys(bad).length?'<ul class="mkpl">'+Object.keys(bad).map(p=>'<li><b>'+NAME[p]+'</b>: '+REM[p]+'</li>').join('')+'</ul>':'<p class="legend">No functional malefic is closely afflicting the key planets. As a general measure, strengthen the weak benefics and keep up daily charity.</p>')+'<p class="legend">Do the remedy each morning after bath and before breakfast (Choudhry, ch. 8). Functional malefics for a '+SIGNS[L][0]+' ascendant: '+AFF[L].map(c=>NAME[c]).join(', ')+'.</p>';
    return h+'</details>';
  }};
})();

/* ---------- Fortuna (v7.6) ---------- */
var GA_FT_MEMO=null;
var GA_FT=window.GA_FT=(function(){
  const SLORD=['Ma','Ve','Me','Mo','Su','Me','Ve','Ma','Ju','Sa','Sa','Ju'];
  const ORD=['Ke','Ve','Su','Mo','Ma','Ra','Ju','Sa','Me'];
  const NUM={Ke:1,Ve:2,Su:3,Mo:4,Ma:5,Ra:6,Ju:7,Sa:8,Me:9};
  const WD={Su:0,Mo:1,Ma:2,Me:3,Ju:4,Ve:5,Sa:6,Ra:6,Ke:2};
  const DEN=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const DTA=['ஞாயிறு','திங்கள்','செவ்வாய்','புதன்','வியாழன்','வெள்ளி','சனி'];
  const GOD={Su:['Surya / Shiva','சூரியன் / சிவன்'],Mo:['Parvati / Durga','பார்வதி / துர்க்கை'],Ma:['Narasimha / Subramanya (Murugan)','நரசிம்மர் / முருகன்'],Me:['Vishnu (Perumal)','விஷ்ணு (பெருமாள்)'],Ju:['Dakshinamurthy / Guru','தட்சிணாமூர்த்தி / குரு'],Ve:['Mahalakshmi','மகாலட்சுமி'],Sa:['Shani Bhagavan / Hanuman','சனி பகவான் / அனுமன்'],Ra:['Durga / Nagaraja','துர்க்கை / நாகராஜர்'],Ke:['Ganesha','விநாயகர்']};
  const COL={Su:['Orange / copper red','ஆரஞ்சு / செம்மை'],Mo:['White / silver','வெள்ளை'],Ma:['Blood red','இரத்த சிவப்பு'],Me:['Green','பச்சை'],Ju:['Yellow / gold','மஞ்சள்'],Ve:['White / cream / pink','வெண்மை / இளஞ்சிவப்பு'],Sa:['Black / dark blue','கருப்பு / கருநீலம்'],Ra:['Smoky grey','புகை சாம்பல்'],Ke:['Brown / multi-colour','பழுப்பு / பல வண்ணம்']};
  const GEM={Su:['Ruby','மாணிக்கம்'],Mo:['Pearl','முத்து'],Ma:['Red coral','பவளம்'],Me:['Emerald','மரகதம்'],Ju:['Yellow sapphire','புஷ்பராகம்'],Ve:['Diamond','வைரம்'],Sa:['Blue sapphire','நீலம்'],Ra:['Hessonite (gomedhagam)','கோமேதகம்'],Ke:['Cat’s eye','வைடூரியம்']};
  const TREE={Su:['Erukku (Calotropis)','எருக்கு'],Mo:['Murukku (Palasa)','முருக்கு'],Ma:['Peepal (Arasu), as in the notes · Karungali','அரசு · கருங்காலி'],Me:['Nayuruvi (Apamarga)','நாயுருவி'],Ju:['Banyan (Alamaram)','ஆலமரம்'],Ve:['Athi (Fig)','அத்தி'],Sa:['Vanni (Shami)','வன்னி'],Ra:['Arugampul (Durva)','அறுகு'],Ke:['Darbai (Kusha)','தர்ப்பை']};
  const HM=['','Self, body, health','Wealth, family, speech','Courage, siblings, short trips','Home, property, education, vehicles','Children, merit, speculation','Service, job, debts, illness','Marriage, partners','Sudden gains, inheritance, longevity','Fortune, dharma, long journeys','Career, status, authority','Gains, fulfilment of desires','Expenses, foreign lands, hospital'];
  const HT=['','உடல், ஆரோக்கியம்','செல்வம், குடும்பம்','தைரியம், சகோதரர், குறுகிய பயணம்','வீடு, சொத்து, கல்வி, வாகனம்','குழந்தை, புண்ணியம், ஊகம்','வேலை, கடன், நோய்','திருமணம், கூட்டாளி','திடீர் லாபம், பரம்பரை, ஆயுள்','பாக்கியம், தர்மம், நீண்ட பயணம்','தொழில், அந்தஸ்து','லாபம், ஆசை நிறைவேறல்','செலவு, வெளிநாடு, மருத்துவமனை'];
  const PU=[
    {id:'money',en:'Money (receive, invest, bank)',ta:'பணம் (வரவு, முதலீடு)',fav:[2,6,11],bad:[5,8,12]},
    {id:'exam',en:'Exam (write, appear)',ta:'தேர்வு எழுத',fav:[4,9,11],bad:[3,5,8]},
    {id:'job',en:'Job (apply, interview, join)',ta:'வேலை (விண்ணப்பம், நேர்காணல்)',fav:[2,6,10,11],bad:[5,8,12]},
    {id:'visa',en:'Visa (apply)',ta:'விசா விண்ணப்பம்',fav:[3,9,12],bad:[2,4]},
    {id:'medicine',en:'Medicine (start taking)',ta:'மருந்து எடுக்கத் தொடங்க',fav:[1,5,11],bad:[6,8,12]},
    {id:'travel',en:'Travel (start a journey)',ta:'பயணம் தொடங்க',fav:[3,9,11],bad:[4,8]},
    {id:'house',en:'House (start building, move in)',ta:'வீடு தொடங்க',fav:[4,11,12],bad:[3,8]},
    {id:'purchase',en:'Purchase (buy)',ta:'பொருள் வாங்க',fav:[2,4,11],bad:[5,8,12]}
  ];
  const PUBY={}; PU.forEach(p=>{PUBY[p.id]=p;});
  const P2=n=>(n<10?'0':'')+n;
  function mod360(x){ return ((x%360)+360)%360; }
  /* ----- a chart for one moment ----- */
  function chart(ms,lat,lon,kind){
    const old=CFG; CFG={lat:lat,lon:lon,kind:kind};
    try{ const lons={}; CODES.forEach(c=>{ lons[c]=sidLon(c,ms); }); return {ms:ms,cusp:placidusCusps(ms,lat,lon,kind),lon:lons}; }
    finally{ CFG=old; }
  }
  function house(ch,l){ for(let i=0;i<12;i++){ if(mod360(l-ch.cusp[i])<mod360(ch.cusp[(i+1)%12]-ch.cusp[i]))return i+1; } return 12; }
  function owned(ch,c){ if(c==='Ra'||c==='Ke')return []; const r=[]; for(let i=0;i<12;i++){ if(SLORD[Math.floor(ch.cusp[i]/30)%12]===c)r.push(i+1); } return r; }
  function sig(ch,c){
    ch._s=ch._s||{}; if(ch._s[c])return ch._s[c];
    const l=ch.lon[c], st=SEGS[findSeg(l)].star, s=new Set([house(ch,l)]);
    owned(ch,c).forEach(h=>s.add(h)); s.add(house(ch,ch.lon[st])); owned(ch,st).forEach(h=>s.add(h));
    return ch._s[c]=Array.from(s).sort((a,b)=>a-b);
  }
  const hit=(s,a)=>s.filter(h=>a.indexOf(h)>=0);
  /* ----- Fortuna of a chart: Ascendant + Moon - Sun ----- */
  function info(ch){
    if(ch._i)return ch._i;
    const L=mod360(ch.cusp[0]+ch.lon.Mo-ch.lon.Su), g=SEGS[findSeg(L)], sub=g.sub, sl=ch.lon[sub], ss=SEGS[findSeg(sl)].star, sg=sig(ch,ss);
    const good=hit(sg,[2,6,11]).length>0, bad=hit(sg,[5,8,12]).length>0;
    const q=good&&bad?'Medium':good?'Good':bad?'Bad':'Neutral';
    return ch._i={L:L,g:g,sign:g.sign,star:g.star,sub:sub,ss:ss,sg:sg,q:q,ps:Math.floor(sl/30)%12,house:house(ch,L),good:good,bad:bad};
  }
  const QTA={Good:'நல்லது',Medium:'நடுத்தரம்',Bad:'கெடுதல்',Neutral:'சமம்'};
  const qchip=q=>'<i class="ftq q-'+q+'">'+q+' · '+QTA[q]+'</i>';
  /* ----- the Sun or Jupiter in a sign: current or next period ----- */
  function signPeriod(code,sign,fromMs,kind,maxDays,stepD,backD){
    const old=CFG; CFG={lat:0,lon:0,kind:kind};
    try{
      const inS=t=>Math.floor(sidLon(code,t)/30)%12===sign;
      const refine=(a,b)=>{ for(let i=0;i<14;i++){ const m=(a+b)/2; if(inS(a)===inS(m))a=m; else b=m; } return b; };
      let t=fromMs-backD*86400000, end=fromMs+maxDays*86400000, st=null, prev=inS(t);
      if(prev)st=t;
      for(t+=stepD*86400000;t<=end;t+=stepD*86400000){
        const c=inS(t);
        if(c&&!prev)st=refine(t-stepD*86400000,t);
        if(!c&&prev){ const e=refine(t-stepD*86400000,t); if(e>=fromMs&&st!==null)return {s:st,e:e,now:st<=fromMs}; st=null; }
        prev=c;
      }
      return null;
    }finally{ CFG=old; }
  }
  function dayTxt(ms,off){ const d=new Date(ms+off*3600000); return d.getUTCDate()+' '+MON[d.getUTCMonth()]+' '+d.getUTCFullYear(); }
  function natal(ch,kind,off){
    const fo=info(ch), c=fo.sub, now=Date.now();
    const stars=NAKS.map((n,i)=>({n:n,i:i})).filter(x=>ORD[x.i%9]===c).map(x=>x.n+' · '+GP_NAKT[x.i]);
    let mon=null, yr=null; try{ mon=signPeriod('Su',fo.ps,now,kind,400,1,40); yr=signPeriod('Ju',fo.ps,now,kind,4800,5,400); }catch(e){}
    return {fo:fo,c:c,day:WD[c],num:NUM[c],god:GOD[c],col:COL[c],gem:GEM[c],tree:TREE[c],stars:stars,mon:mon,yr:yr,ps:fo.ps};
  }
  /* summary of Fortuna's position */
  function posHtml(ch){
    const f=info(ch), g=f.g, sub=NAME[f.sub];
    return '<b>'+SIGNS[f.sign][0]+' '+dms(f.L-f.sign*30)+'</b> <span class="ta">'+TSIGN[f.sign]+'</span> · '+NAKS[g.nak]+' <span class="ta">'+GP_NAKT[g.nak]+'</span> · '+NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub]+' '+qchip(f.q);
  }
  function natalHtml(ch,kind,off){
    const n=natal(ch,kind,off), f=n.fo, rows=[];
    const R=(a,b,ta)=>{ rows.push('<tr><td><b>'+a+'</b></td><td>'+b+(ta?'<span class="ta">'+ta+'</span>':'')+'</td></tr>'); };
    const per=(p,cur)=>p?(p.now?'now until '+dayTxt(p.e,off):dayTxt(p.s,off)+' to '+dayTxt(p.e,off)):'not found in the search span';
    R('Fortuna point',posHtml(ch),'');
    R('Falls in house',f.house+' · '+HM[f.house],HT[f.house]);
    R('Sub lord · its star lord',NAME[f.sub]+' · '+NAME[f.ss]+' (signifies '+f.sg.join(', ')+')','');
    R('Powerful sign (where the sub lord stands)',SIGNS[n.ps][0],TSIGN[n.ps]);
    R('1 Fortunate day',DEN[n.day],DTA[n.day]);
    R('2 Fortunate number',String(n.num),'');
    R('3 Fortunate god',n.god[0],n.god[1]);
    R('4 Fortunate colour',n.col[0],n.col[1]);
    R('5 Fortunate stars',n.stars.map(s=>s.split(' · ')[0]).join(', '),n.stars.map(s=>s.split(' · ')[1]).join(', '));
    R('6 Fortunate month (Sun in '+SIGNS[n.ps][0]+')',per(n.mon),'');
    R('7 Fortunate year (Jupiter in '+SIGNS[n.ps][0]+')',per(n.yr),'');
    R('8 Fortunate time (ascendant in '+SIGNS[n.ps][0]+')','Every day while the rising sign is '+SIGNS[n.ps][0]+' (about 1½ to 2½ hours); use the Fortuna Timing tool to see the exact times.','');
    R('9 Fortunate gem',n.gem[0],n.gem[1]);
    R('10 Fortunate tree',n.tree[0],n.tree[1]);
    const txt=[
      'FORTUNA (Asc + Moon - Sun): '+SIGNS[f.sign][0]+' '+dms(f.L-f.sign*30)+' · '+NAKS[f.g.nak]+' · '+NAME[f.g.lord]+'/'+NAME[f.g.star]+'/'+NAME[f.g.sub]+' · quality '+f.q+' · house '+f.house,
      '  Sub lord '+NAME[f.sub]+', its star lord '+NAME[f.ss]+' signifies '+f.sg.join(',')+'; powerful sign '+SIGNS[n.ps][0],
      '  Day '+DEN[n.day]+' · number '+n.num+' · god '+n.god[0]+' · colour '+n.col[0]+' · gem '+n.gem[0]+' · tree '+n.tree[0],
      '  Stars '+n.stars.map(s=>s.split(' · ')[0]).join(', ')+' · month '+per(n.mon)+' · year '+per(n.yr)+' · time: ascendant in '+SIGNS[n.ps][0],''];
    return {html:'<table class="ctab ftn"><tbody>'+rows.join('')+'</tbody></table>',text:txt,n:n};
  }
  /* ----- window search ----- */
  function evalAt(ch,pu,o,tzf){
    const g=SEGS[findSeg(ch.cusp[0])], sS=sig(ch,g.sub), sT=sig(ch,g.star), fo=info(ch);
    const fS=hit(sS,pu.fav), bS=hit(sS,pu.bad), fT=hit(sT,pu.fav), bT=hit(sT,pu.bad);
    let sc=3*fS.length+2*fT.length-3*bS.length-2*bT.length+({Good:3,Medium:1,Neutral:0,Bad:-3})[fo.q];
    const why=[];
    let ok=fS.length>=1&&fS.length>bS.length&&fT.length>=1&&fT.length>=bT.length&&fo.q!=='Bad'&&(!o.strict||fo.q==='Good');
    const nt=o.nat;
    if(nt){
      const wd=new Date(ch.ms+tzf(ch.ms)*3600000).getUTCDay();
      if(g.sign===nt.ps){ sc+=4; why.push('ascendant is in your Fortuna sign '+SIGNS[nt.ps][0]+' (fortunate time)'); } else if(o.onlyNat)ok=false;
      if(wd===nt.day){ sc+=2; why.push('your fortunate day '+DEN[nt.day]); }
    }
    return {ok:ok,sc:sc,g:g,fS:fS,fT:fT,bS:bS,bT:bT,fo:fo,why:why};
  }
  function reasonText(ev,pu){
    const g=ev.g;
    return 'Ascendant sub lord <b>'+NAME[g.sub]+'</b> signifies '+(ev.fS.length?'<b>'+ev.fS.join(',')+'</b>':'none')+' of the '+pu.fav.join(',')+' houses'+(ev.bS.length?' (and '+ev.bS.join(',')+' to avoid)':'')+'; star lord <b>'+NAME[g.star]+'</b> signifies '+(ev.fT.length?'<b>'+ev.fT.join(',')+'</b>':'none')+(ev.bT.length?' (and '+ev.bT.join(',')+' to avoid)':'')+'. Fortuna of this moment: '+SIGNS[ev.fo.sign][0]+', sub lord '+NAME[ev.fo.sub]+', quality '+qchip(ev.fo.q)+(ev.why.length?'. '+ev.why.join('; ')+'.':'.');
  }
  async function scan(o,prog){
    const old=CFG, wins=[], last={};
    try{
      for(let di=0;di<o.days.length;di++){
        const D=o.days[di];
        const rows=compute(D.a,D.b,o.lat,o.lon,o.kind);
        for(const r of rows){
          const s0=Math.max(r.start,D.a), e0=Math.min(r.end,D.b), len=e0-s0; if(len<1000)continue;
          const n=Math.max(1,Math.ceil(len/(30*60000))), step=len/n;
          for(let i=0;i<n;i++){
            const s=s0+i*step, e=s+step, m=(s+e)/2, ch=chart(m,o.lat,o.lon,o.kind);
            o.pus.forEach(pid=>{
              const pu=PUBY[pid], ev=evalAt(ch,pu,o,o.tzf), key=pid;
              if(!ev.ok){ last[key]=null; return; }
              const L=last[key];
              if(L&&L.k===r.k&&Math.abs(L.e-s)<3000){ L.e=e; if(ev.sc>L.sc){ L.sc=ev.sc; L.ev=ev; L.m=m; } }
              else { const w={s:s,e:e,k:r.k,pu:pid,sc:ev.sc,ev:ev,m:m}; wins.push(w); last[key]=w; }
            });
          }
        }
        if(prog)await prog(di+1,o.days.length);
      }
    }finally{ CFG=old; }
    return wins;
  }
  /* local days with an optional time window */
  function daysOf(f,t,t1,t2,tzs){
    const a=f.split('-').map(Number), b=t.split('-').map(Number), nd=Math.round((Date.UTC(b[0],b[1]-1,b[2])-Date.UTC(a[0],a[1]-1,a[2]))/86400000)+1, out=[];
    const m1=(t1||'00:00').split(':').map(Number), m2=(t2||'23:59').split(':').map(Number), full=(t2||'23:59')==='23:59';
    for(let i=0;i<nd;i++){
      const dt=new Date(Date.UTC(a[0],a[1]-1,a[2]+i)), y=dt.getUTCFullYear(), m=dt.getUTCMonth()+1, d=dt.getUTCDate();
      const nx=new Date(Date.UTC(y,m-1,d+1));
      out.push({a:localToUtc(y,m,d,m1[0]||0,m1[1]||0,tzs).ms,b:full?localToUtc(nx.getUTCFullYear(),nx.getUTCMonth()+1,nx.getUTCDate(),0,0,tzs).ms:localToUtc(y,m,d,m2[0]||0,m2[1]||0,tzs).ms});
    }
    return {days:out.filter(x=>x.b>x.a),nd:nd};
  }
  /* saved choices (shared with the Clock) */
  const FS={pus:['money'],strict:false,onlyNat:false,nat:null};
  function save(){ try{ localStorage.setItem('ga_ft',JSON.stringify(FS)); }catch(e){} }
  (function load(){ try{ const o=JSON.parse(localStorage.getItem('ga_ft')||'null'); if(o){ if(Array.isArray(o.pus)&&o.pus.length)FS.pus=o.pus.filter(x=>PUBY[x]); FS.strict=!!o.strict; FS.onlyNat=!!o.onlyNat; if(o.nat&&isFinite(o.nat.ps)&&isFinite(o.nat.day))FS.nat={ps:o.nat.ps,day:o.nat.day}; } }catch(e){} })();
  async function gather(L,kind,now,end){
    try{
      const tzf=tzFn(String(L.tz));
      const wins=await scan({days:[{a:now,b:end}],pus:FS.pus.length?FS.pus:['money'],lat:L.lat,lon:L.lon,kind:kind,strict:FS.strict,nat:FS.nat,onlyNat:FS.onlyNat&&!!FS.nat,tzf:tzf});
      return {rows:wins.map(w=>({s:w.s,e:w.e,lb:PUBY[w.pu].en.split(' (')[0]})),err:''};
    }catch(e){ return {rows:[],err:String(e&&e.message||e)}; }
  }
  return {PU:PU,PUBY:PUBY,FS:FS,save:save,chart:chart,info:info,qchip:qchip,posHtml:posHtml,natalHtml:natalHtml,natal:natal,scan:scan,daysOf:daysOf,reasonText:reasonText,gather:gather,HM:HM,DEN:DEN,DTA:DTA,
    point:function(asc,mo,su){ return mod360(asc+mo-su); },
    chartInfo:function(ms,lat,lon,kind){ const k=ms+'|'+lat+'|'+lon+'|'+kind; if(GA_FT_MEMO&&GA_FT_MEMO.k===k)return GA_FT_MEMO.v; const ch=chart(ms,lat,lon,kind), f=info(ch), v={L:f.L,q:f.q,f:f,ch:ch}; GA_FT_MEMO={k:k,v:v}; return v; }};
})();

/* ---------- Fortuna Timing tool (v7.6) ---------- */
(function initFt(){
  if(!$('ftBtn'))return;
  const FT=GA_FT; let FT_LIST=[], WINS=null, META=null;
  const ftE=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  function fill(){
    const q=$('ftSearch').value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''), cn=$('ftCountry').value, stv=$('ftState').value, all=cn==='*a';
    let src=all?WC:(WCBY[cn]||[]); if(!all&&stv!=='*s')src=src.filter(x=>(x.st||'')===stv);
    const cap=all?300:700; let list=[];
    if(all&&!q)list=[]; else if(!q)list=src.slice(0,cap);
    else{const a=[],b=[]; for(let i=0;i<src.length&&a.length<cap;i++){const k=plKey(src[i]),at=k.indexOf(q); if(at===0)a.push(src[i]); else if(at>0&&b.length<cap)b.push(src[i]);} list=a.concat(b).slice(0,cap);}
    if(!list.length)list=webC(q,fill); FT_LIST=list; const sel=$('ftCity');
    sel.innerHTML=list.length?list.map((x,i)=>'<option value="'+i+'">'+ftE(x.n)+((all||stv==='*s')&&x.st?', '+ftE(x.st):'')+(all?', '+ftE(x.cc):'')+'</option>').join(''):'<option value="">No match in the offline list. Online search is tried automatically when you are connected</option>';
    pick();
  }
  function pick(){ const x=FT_LIST[parseInt($('ftCity').value,10)]; if(x){ $('ftLat').value=x.lat; $('ftLon').value=x.lon; $('ftTz').value=x.tz; } off(); }
  function off(){ const el=$('ftOff'), t=$('ftTz').value.trim(); el.className='msg'; if(!t){el.textContent='';return;} try{ el.textContent='Time zone now: '+utcTxt(tzFn(t)(Date.now()))+(/^-?[\d.]+$/.test(t)?'':' ('+t+')'); }catch(e){ el.textContent='The time zone was not recognised.'; el.className='msg err'; } }
  function states(){
    const cn=$('ftCountry').value, el=$('ftState');
    if(cn==='*a'){ el.innerHTML='<option value="*s">All states</option>'; return; }
    const l=STBY[cn]||[]; el.innerHTML='<option value="*s">All states ('+l.filter(Boolean).length+')</option>'+l.map(n=>'<option value="'+ftE(n)+'">'+ftE(n||'(state not listed)')+'</option>').join('');
  }
  const cs=$('ftCountry'); cs.innerHTML='<option value="*a">All countries (use search)</option>'+CITY.cc.map(n=>'<option value="'+n.replace(/"/g,'&quot;')+'">'+n+'</option>').join('');
  cs.addEventListener('change',()=>{states();fill();}); $('ftState').addEventListener('change',fill); $('ftSearch').addEventListener('input',fill); $('ftCity').addEventListener('change',pick); $('ftTz').addEventListener('input',off);
  states(); fill();
  const iso=new Date(Date.now()+TZ*3600000).toISOString().slice(0,10); $('ftFrom').value=iso; $('ftTo').value=iso;
  /* purposes */
  const pb=$('ftPurp');
  pb.innerHTML=FT.PU.map(p=>'<label class="ftp"><input type="checkbox" value="'+p.id+'"'+(FT.FS.pus.indexOf(p.id)>=0?' checked':'')+'><span>'+p.en+'<small>'+p.ta+' · houses '+p.fav.join(', ')+'</small></span></label>').join('');
  function readP(){ const v=Array.from(pb.querySelectorAll('input:checked')).map(x=>x.value); return v; }
  pb.addEventListener('change',()=>{ const v=readP(); FT.FS.pus=v.length?v:FT.FS.pus; FT.save(); });
  $('ftStrict').checked=FT.FS.strict; $('ftOnlyNat').checked=FT.FS.onlyNat;
  $('ftStrict').addEventListener('change',()=>{ FT.FS.strict=$('ftStrict').checked; FT.save(); });
  $('ftOnlyNat').addEventListener('change',()=>{ FT.FS.onlyNat=$('ftOnlyNat').checked; FT.save(); });
  /* birth details */
  function readPlace(){ const lat=parseFloat($('ftLat').value), lon=parseFloat($('ftLon').value), tzs=$('ftTz').value.trim(); return {lat:lat,lon:lon,tzs:tzs}; }
  $('ftBSame').addEventListener('click',()=>{ $('ftBLat').value=$('ftLat').value; $('ftBLon').value=$('ftLon').value; $('ftBTz').value=$('ftTz').value; });
  function natCard(){
    const out=$('ftNat'), msg=$('ftMsg'); out.innerHTML='';
    const bd=$('ftBD').value, bt=$('ftBT').value, lat=parseFloat($('ftBLat').value), lon=parseFloat($('ftBLon').value), tzs=$('ftBTz').value.trim(), kind=$('ftAyan').value;
    if(!bd||!bt||isNaN(lat)||isNaN(lon)||!tzs){ msg.className='msg err'; msg.textContent='Enter the birth date, birth time and birth place (latitude, longitude, time zone).'; return null; }
    if(typeof Astronomy==='undefined'){ msg.className='msg err'; msg.textContent='Planet positions need the astronomy library, which did not load.'; return null; }
    try{
      const a=bd.split('-').map(Number), b=bt.split(':').map(Number), u=localToUtc(a[0],a[1],a[2],b[0],b[1],tzs).ms, tzf=tzFn(tzs);
      const ch=FT.chart(u,lat,lon,kind), r=FT.natalHtml(ch,kind,tzf(Date.now()));
      out.innerHTML='<div class="lf-sec"><h3>Your Fortuna<span class="ta">உங்கள் போர்ச்சுனா</span></h3>'+r.html+'<p class="lf-note">Fortuna = Ascendant + Moon − Sun. The quality follows the notes: the star of the Fortuna sub lord signifying 2, 6, 11 is good; 5, 8, 12 is bad; both is medium. The rules for the ten fortunate elements come from the supplied notes (the author’s own experience, not from the classical texts).</p></div>';
      FT.FS.nat={ps:r.n.ps,day:r.n.day}; FT.save(); msg.className='msg'; msg.textContent='Your Fortuna is saved on this device and used to favour your fortunate day and time.';
      return r.n;
    }catch(e){ msg.className='msg err'; msg.textContent='Could not calculate: '+(e&&e.message||e); return null; }
  }
  $('ftNatGo').addEventListener('click',natCard);
  $('ftNatX').addEventListener('click',()=>{ FT.FS.nat=null; FT.save(); $('ftNat').innerHTML=''; $('ftMsg').className='msg'; $('ftMsg').textContent='Your saved Fortuna was cleared.'; });
  /* run */
  async function run(){
    const msg=$('ftMsg'), out=$('ftOut'); msg.className='msg err'; out.innerHTML=''; WINS=null;
    const pl=readPlace(), f=$('ftFrom').value, t=$('ftTo').value, kind=$('ftAyan').value, t1=$('ftT1').value||'00:00', t2=$('ftT2').value||'23:59';
    if(isNaN(pl.lat)||isNaN(pl.lon)||!pl.tzs){ msg.textContent='Choose a place (or enter latitude, longitude and time zone).'; return; }
    if(Math.abs(pl.lat)>62){ msg.textContent='Latitude beyond 62° is not supported.'; return; }
    if(typeof Astronomy==='undefined'){ msg.textContent='Planet positions need the astronomy library, which did not load.'; return; }
    if(!f||!t){ msg.textContent='Pick both a from date and a to date.'; return; }
    let tzf; try{ tzf=tzFn(pl.tzs); }catch(e){ msg.textContent='The time zone was not recognised.'; return; }
    const D=FT.daysOf(f,t,t1,t2,pl.tzs);
    if(D.nd<1){ msg.textContent='The to date must not be before the from date.'; return; }
    if(D.nd>15){ msg.textContent='Please choose at most 15 days.'; return; }
    if(t2!=='23:59'&&t1>=t2){ msg.textContent='The end time must be after the start time.'; return; }
    const pus=readP(); if(!pus.length){ msg.textContent='Tick at least one purpose.'; return; }
    FT.FS.pus=pus; FT.FS.strict=$('ftStrict').checked; FT.FS.onlyNat=$('ftOnlyNat').checked; FT.save();
    msg.className='msg'; $('ftGo').disabled=true;
    try{
      const nat=FT.FS.nat;
      const wins=await FT.scan({days:D.days,pus:pus,lat:pl.lat,lon:pl.lon,kind:kind,strict:FT.FS.strict,nat:nat,onlyNat:FT.FS.onlyNat&&!!nat,tzf:tzf},async(i,n)=>{ msg.textContent='Checking day '+i+' of '+n+'…'; await new Promise(r=>setTimeout(r,0)); });
      WINS=wins.filter(w=>w.e-w.s>=500); META={f:f,t:t,lat:pl.lat,lon:pl.lon,tzs:pl.tzs,kind:kind,tzf:tzf,nat:!!nat};
      show();
    }catch(e){ msg.className='msg err'; msg.textContent='Error: '+(e&&e.message||e); }
    finally{ $('ftGo').disabled=false; }
  }
  function hms(ms,off){ const d=new Date(ms+off*3600000); return P2(d.getUTCHours())+':'+P2(d.getUTCMinutes())+':'+P2(d.getUTCSeconds()); }
  function P2(n){ return (n<10?'0':'')+n; }
  function show(){
    const out=$('ftOut'), msg=$('ftMsg'); if(!WINS){ out.innerHTML=''; return; }
    const sort=$('ftSort').value, M=META; let L=WINS.slice();
    if(sort==='score')L.sort((a,b)=>b.sc-a.sc||a.s-b.s); else L.sort((a,b)=>a.s-b.s);
    let h='', lastDay=null, ul=false;
    L.forEach(w=>{
      const off=M.tzf(w.s), day=Math.floor((w.s+off*3600000)/86400000), g=SEGS[w.k], pu=FT.PUBY[w.pu];
      if(sort!=='score'&&day!==lastDay){ if(ul)h+='</ul>'; lastDay=day; h+='<div class="lf-sec"><h3>'+fmtDate(w.s,off)+'</h3></div><ul class="list">'; ul=true; }
      else if(sort==='score'&&!ul){ h+='<ul class="list">'; ul=true; }
      h+='<li class="row gm ftrow" data-s="'+Math.round(w.s)+'" data-e="'+Math.round(w.e)+'" data-tz="'+off+'" data-lat="'+M.lat+'" data-lon="'+M.lon+'" data-kind="'+M.kind+'" data-pu="'+w.pu+'" style="--h:'+HUE[g.sub]+'">'+
        '<div class="t2"><div><span>Begin</span><b>'+hms(w.s,off)+'</b></div><div><span>End</span><b>'+hms(w.e,off)+'</b></div></div>'+
        '<div class="l"><span class="n">'+NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub]+'</span><span class="pl"><span class="pill gain">'+pu.en.split(' (')[0]+' · '+pu.ta.split(' (')[0]+'</span><span class="pill">Score '+w.sc+'</span>'+FT.qchip(w.ev.fo.q)+'</span><span class="ta">'+tl(g)+'</span><span class="c">'+SIGNS[g.sign][0]+' ascendant · '+TLAG[g.sign]+' லக்னம்</span></div>'+
        '<div class="chk">'+FT.reasonText(w.ev,pu)+'</div>'+
        '<div class="p"><span>'+span(g)+' · '+NAKS[g.nak]+'</span><span>lasts '+dur(w.e-w.s)+'</span></div></li>';
    });
    if(ul)h+='</ul>';
    msg.className='msg';
    if(!L.length){ msg.textContent='No Fortuna timing qualifies in this window.'; h='<p class="msg">No window qualifies. Try more days, another purpose, or untick “Only when Fortuna is good”.</p>'; }
    else{ msg.textContent=L.length+' favourable windows listed from '+M.f+' to '+M.t+'. Touch a row to see the star-lord totals and to set its alarm.'; h+='<div class="btns"><button id="ftAlarm" type="button">Set alarms for the earliest 30 windows</button><button id="ftCopy" type="button">Copy as text</button></div>'; }
    out.innerHTML=h;
    const ab=$('ftAlarm'); if(ab)ab.addEventListener('click',alarms);
    const cb=$('ftCopy'); if(cb)cb.addEventListener('click',()=>{
      const tx='Fortuna Timing '+M.f+' to '+M.t+' ('+M.lat+', '+M.lon+', '+M.tzs+')\n'+L.map(w=>{ const off=M.tzf(w.s), g=SEGS[w.k]; return fmtDate(w.s,off)+'  '+hms(w.s,off)+' – '+hms(w.e,off)+'  '+FT.PUBY[w.pu].en.split(' (')[0]+'  '+SIGNS[g.sign][0]+' ascendant  '+NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub]+'  score '+w.sc; }).join('\n');
      if(window.GuruApp&&GuruApp.copyText){ try{ GuruApp.copyText(tx); msg.textContent='Copied.'; return; }catch(e){} }
      try{ navigator.clipboard.writeText(tx).then(()=>{ msg.textContent='Copied.'; },()=>{ msg.textContent='Copying is blocked here.'; }); }catch(e){ msg.textContent='Copying is blocked here.'; }
    });
  }
  async function alarms(){
    const msg=$('ftMsg'), M=META; if(!WINS||!M)return;
    let old=[]; try{ old=JSON.parse(localStorage.getItem('ga_ft_ids')||'[]'); }catch(e){}
    await Promise.all(old.map(id=>GA_ALARM.cancel(id)));
    const now=Date.now(); const L=WINS.filter(w=>w.s>now+8000).sort((a,b)=>a.s-b.s).slice(0,30); let last=0, ok=0, bad=0; const ids=[];
    msg.className='msg'; msg.textContent='Setting the alarms…';
    for(const w of L){
      const id='ft-'+w.pu+'-'+Math.round(w.s/60000), off=M.tzf(w.s), g=SEGS[w.k], pu=FT.PUBY[w.pu], when=Math.max(w.s,last+13000); last=when;
      const title='🔔 Fortuna · '+pu.en.split(' (')[0]+' · '+hms(w.s,off);
      const R=stNakRun(w.s,M.lat,M.lon,M.kind);
      const text='Fortuna Timing for '+pu.en+'\n'+hms(w.s,off)+' – '+hms(w.e,off)+' ('+dur(w.e-w.s)+')\n'+SIGNS[g.sign][0]+' ascendant · '+NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub]+'\n'+NAME[R.star]+' star lord total: '+hms(R.s,off)+' – '+hms(R.e,off)+' ('+dur(R.e-R.s)+')';
      const good=await GA_ALARM.set(id,when,title,text,''); if(good){ ok++; ids.push(id); } else bad++;
    }
    try{ localStorage.setItem('ga_ft_ids',JSON.stringify(ids)); }catch(e){}
    msg.className=bad?'msg err':'msg'; msg.textContent=ok?(ok+' alarm'+(ok>1?'s':'')+' set. Each one plays the melody and fades out by itself; stop it with Success.'+(bad?' '+bad+' could not be set.':'')):'No upcoming window to set.';
  }
  $('ftSort').addEventListener('change',show);
  $('ftGo').addEventListener('click',run);
  $('ftLoc').addEventListener('click',()=>{ if(!navigator.geolocation){ $('ftMsg').textContent='Location is not available here.'; return; } navigator.geolocation.getCurrentPosition(p=>{ $('ftLat').value=+p.coords.latitude.toFixed(4); $('ftLon').value=+p.coords.longitude.toFixed(4); try{ $('ftTz').value=Intl.DateTimeFormat().resolvedOptions().timeZone||$('ftTz').value; }catch(e){} off(); },()=>{ $('ftMsg').className='msg err'; $('ftMsg').textContent='Could not get your location.'; },{timeout:9000}); });
  $('ftBtn').addEventListener('click',()=>{ const pn=$('ftPanel'); pn.classList.remove('hide'); if(!pn.dataset.o){ pn.dataset.o=1; $('ftLat').value=$('lat').value; $('ftLon').value=$('lon').value; $('ftTz').value=PL_TZ||$('tz').value; off(); } pn.scrollIntoView({block:'start'}); });
  $('ftClose').addEventListener('click',()=>$('ftPanel').classList.add('hide'));
  window.__ft={run:run,natCard:natCard};
})();

/* ---------- Speculation research (v4.8) ---------- */
// Feature extraction for a transit moment. Uses app globals: SEGS, findSeg, placidusCusps, sidLon, sidAsc, isRetro, CODES, NAME, mod.
/* ---------- v5.3 live Money-Profit blink rule ----------
 A: the 2nd-cusp star/sub lord is the 2nd or 11th lord AND the 11th-cusp star/sub lord is the 11th or 2nd lord,
    and the lords so named are not placed in the 8th or 12th house.
 B: an ascendant star/sub lord AND a 2nd/11th-cusp star/sub lord are planets standing in the star of the 2nd or 11th lord,
    and not placed in the 8th or 12th house. */
function lvCore(cu,P){
  const seg=i=>SEGS[findSeg(cu[i-1])];
  const bh=l=>{for(let i=0;i<12;i++){const a=cu[i],b=cu[(i+1)%12];if(mod(l-a,360)<mod(b-a,360))return i+1;}return 1;};
  const g=seg(1), s2=seg(2), s11=seg(11), L2=s2.lord, L11=s11.lord, set=[L2,L11];
  const ok=c=>{const x=bh(P[c]);return x!==8&&x!==12;}, st=c=>SEGS[findSeg(P[c])].star;
  const c2=[s2.star,s2.sub], c11=[s11.star,s11.sub], m2=c2.filter(p=>set.includes(p)), m11=c11.filter(p=>set.includes(p));
  const A=m2.length>0&&m11.length>0&&m2.concat(m11).every(ok);
  const q=c=>set.includes(st(c))&&ok(c);
  const B=[g.star,g.sub].some(q)&&c2.concat(c11).some(q);
  return {A:A,B:B,on:A||B,C:m2.length>0&&m11.length>0,c2:c2,c11:c11,L2:L2,L11:L11,g:g,h2:bh(P[L2]),h11:bh(P[L11])};
}
function spFeat(ms,lat,lon,kind){
  const asc=sidAsc(ms,lat,lon,kind), g=SEGS[findSeg(asc)], cu=placidusCusps(ms,lat,lon,kind);
  const seg=i=>SEGS[findSeg(cu[i-1])];
  const bh=l=>{for(let i=0;i<12;i++){const a=cu[i],b=cu[(i+1)%12];if(mod(l-a,360)<mod(b-a,360))return i+1;}return 1;};
  const P={}; CODES.forEach(c=>P[c]=sidLon(c,ms));
  const own={}; CODES.forEach(c=>own[c]=[]); const Lh={}; for(let i=1;i<=12;i++){const lo=seg(i).lord; Lh[i]=lo; own[lo].push(i);}
  const ownOf=c=>(c==='Ra'||c==='Ke')?(own[SEGS[findSeg(P[c])].lord]||[]):(own[c]||[]);
  const starOf=c=>SEGS[findSeg(P[c])].star, subOf=c=>SEGS[findSeg(P[c])].sub, occ=c=>bh(P[c]);
  const cache={}; const sg=c=>{if(cache[c])return cache[c]; const st=starOf(c), s=new Set([occ(st),occ(c)]); ownOf(st).forEach(h=>s.add(h)); ownOf(c).forEach(h=>s.add(h)); return cache[c]=s;};
  const roles={AL:g.lord,AS:g.star,AB:g.sub,MO:'Mo',MS:starOf('Mo'),MB:subOf('Mo'),JU:'Ju',VE:'Ve',C2:seg(2).sub,C5:seg(5).sub,C6:seg(6).sub,C8:seg(8).sub,C11:seg(11).sub};
  const H=[2,5,6,8,11,12], f={}, why={};
  for(const [rn,c] of Object.entries(roles)){
    const S=sg(c);
    for(const h of H){
      f[rn+'.sig'+h]=S.has(h); f[rn+'.own'+h]=Lh[h]===c; f[rn+'.plc'+h]=occ(c)===h; f[rn+'.str'+h]=starOf(c)===Lh[h];
    }
    f[rn+'.gain']=S.has(11)&&(S.has(2)||S.has(5)||S.has(6)||S.has(8)); f[rn+'.loss']=S.has(12)&&!S.has(11);
    f[rn+'.retro']=isRetro(c,ms);
    why[rn]={p:c,sig:Array.from(S).sort((a,b)=>a-b),star:starOf(c),h:occ(c)};
  }
  const mo=P.Mo; 
  const lv=lvCore(cu,P); f['LV.A']=lv.A; f['LV.B']=lv.B;
  return {f:f,why:why,roles:roles,Lh:Lh,asc:asc,seg:g,tithi:Math.floor(mod(P.Mo-P.Su,360)/12)+1,P:P,H:{AL:occ(g.lord)}};
}

const SP_TICKETS=[
 [1,'2022-06-13 09:32:01','Ortonville, MI (Tom’s Market, 465 South St)',42.852,-83.443],[2,'2024-05-28 12:35:44','Clinton Township, MI (Hayes Rd)',42.587,-82.92],
 [3,'2022-05-31 20:07:39','Sterling Heights, MI (43611 Schoenherr Rd)',42.58,-83.03],[4,'2022-10-26 13:54:58','Dearborn, MI (7000 Greenfield Rd)',42.322,-83.176],
 [5,'2022-12-09 20:56:45','Detroit, MI (Van Dyke gas station)',42.38,-83.01],[6,'2017-05-04 15:43:14','Allen Park, MI (Empire Foods, Allen Rd)',42.258,-83.211],
 [7,'2024-11-11 20:12:26','Fenton, MI (Beacon & Bridge Market)',42.798,-83.705],[8,'2023-10-05 15:35:32','Macomb, MI (Northview Wine Shop, 21 Mile Rd)',42.67,-82.91],
 [9,'2023-07-26 14:51:31','Muskegon, MI (Sherman Marathon)',43.234,-86.248],[10,'2022-11-05 12:49:57','Michigan, K&G Deli (city unknown: Detroit used)',42.331,-83.046],
 [11,'2024-02-11 17:43:12','Southfield, MI (BP, W 9 Mile Rd)',42.473,-83.222],[12,'2023-04-01 16:56:57','Lathrup Village, MI (Southfield Rd)',42.496,-83.223],
 [13,'2022-11-30 16:58:46','Waterford, MI (Cooley Lake Rd)',42.693,-83.412],[14,'2025-10-10 00:25:57','Sterling Heights, MI (36950 Dequindre Rd)',42.57,-83.03]];
// share of 4,000 random times (Michigan, 2017-2025, 06:00-24:00) that meet each condition, and hits among the 14 tickets
const SP_STATS=[['AB.gain','Ascendant sub lord signifies the 11th with the 2nd, 5th, 6th or 8th',9,0.33],['C2.gain','2nd cusp sub lord signifies the 11th with the 2nd, 5th, 6th or 8th',8,0.317],['MS.gain','Moon’s star lord signifies the 11th with the 2nd, 5th, 6th or 8th',7,0.293],
 ['AB.sig11','Ascendant sub lord signifies the 11th',9,0.382],['C2.sig11','2nd cusp sub lord signifies the 11th',8,0.378],['C5.gain','5th cusp sub lord: 11th with 2nd, 5th, 6th or 8th',5,0.32],['C11.gain','11th cusp sub lord: 11th with 2nd, 5th, 6th or 8th',5,0.337],['C6.gain','6th cusp sub lord: 11th with 2nd, 5th, 6th or 8th',4,0.3],['C8.gain','8th cusp sub lord: 11th with 2nd, 5th, 6th or 8th',4,0.348],
 ['AS.gain','Ascendant star lord: 11th with 2nd, 5th, 6th or 8th',4,0.301],['AL.gain','Ascendant lord: 11th with 2nd, 5th, 6th or 8th',2,0.236],['MO.gain','Moon: 11th with 2nd, 5th, 6th or 8th',5,0.271],['JU.gain','Jupiter: 11th with 2nd, 5th, 6th or 8th',4,0.331],['VE.gain','Venus: 11th with 2nd, 5th, 6th or 8th',3,0.364],
 ['AB.loss','Ascendant sub lord signifies the 12th without the 11th (loss)',2,0.217],['AS.loss','Ascendant star lord signifies the 12th without the 11th (loss)',2,0.239],['AB.retro','Ascendant sub lord retrograde',1,0.147],['AL.retro','Ascendant lord retrograde',4,0.149]];
const SP_RULES=[
 {id:'AB.gain',def:1,en:'The ascendant sub lord signifies the 11th house together with the 2nd, 5th, 6th or 8th',ta:'லக்ன உப அதிபதி 11-ஆம் வீட்டுடன் 2, 5, 6 அல்லது 8-ஐ குறிக்கிறார்',ev:'9 of 14 tickets · 33% of random times'},
 {id:'C2.gain',def:1,en:'The 2nd cusp sub lord signifies the 11th together with the 2nd, 5th, 6th or 8th',ta:'2-ஆம் கஸ்ப் உப அதிபதி 11-உடன் 2, 5, 6 அல்லது 8-ஐ குறிக்கிறார்',ev:'8 of 14 tickets · 32% of random times'},
 {id:'MS.gain',def:1,en:'The Moon’s star lord signifies the 11th together with the 2nd, 5th, 6th or 8th',ta:'சந்திரனின் நட்சத்திர அதிபதி 11-உடன் 2, 5, 6 அல்லது 8-ஐ குறிக்கிறார்',ev:'7 of 14 tickets · 29% of random times'},
 {id:'NOLOSS',def:1,en:'The ascendant star lord and sub lord do not signify the 12th without the 11th (no loss)',ta:'லக்ன நட்சத்திர, உப அதிபதிகள் 11 இன்றி 12-ஐ குறிக்கவில்லை',ev:'12 of 14 tickets · about 56% of random times'},
 {id:'C5.gain',def:0,en:'The 5th cusp sub lord signifies the 11th together with the 2nd, 5th, 6th or 8th (speculation)',ta:'5-ஆம் கஸ்ப் உப அதிபதி (ஊகம்)',ev:'5 of 14 tickets · 32% of random times'},
 {id:'C11.gain',def:0,en:'The 11th cusp sub lord signifies the 11th together with the 2nd, 5th, 6th or 8th',ta:'11-ஆம் கஸ்ப் உப அதிபதி',ev:'5 of 14 tickets · 34% of random times'},
 {id:'C8.gain',def:0,en:'The 8th cusp sub lord signifies the 11th together with the 2nd, 5th, 6th or 8th (windfall)',ta:'8-ஆம் கஸ்ப் உப அதிபதி (திடீர் லாபம்)',ev:'4 of 14 tickets · 35% of random times'},
 {id:'C6.gain',def:0,en:'The 6th cusp sub lord signifies the 11th together with the 2nd, 5th, 6th or 8th',ta:'6-ஆம் கஸ்ப் உப அதிபதி',ev:'4 of 14 tickets · 30% of random times'},
 {id:'LOT',def:0,en:'The Lottery-rules score (version 4.0 option) is 65 or more',ta:'லாட்டரி விதிகள் மதிப்பெண் 65 அல்லது அதிகம்',ev:'not tested on the 14 tickets'}
];
let SP_LIST=[], SP_RES=null;
function spTest(x,id){ if(id==='NOLOSS')return !x.f['AS.loss']&&!x.f['AB.loss']; return !!x.f[id]; }
function spTickets(){
  const old=CFG; let h='<div class="tblw"><table><thead><tr><th>#</th><th>Local date and time</th><th>Place</th><th>Ascendant (lord / star / sub)</th><th>Moon star / sub</th><th>Cusp sub lords: 2nd, 5th, 6th, 8th, 11th and the houses each signifies</th><th>Rules matched</th></tr></thead><tbody>';
  try{
    SP_TICKETS.forEach(t=>{
      const m=/(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)/.exec(t[1]).slice(1).map(Number), r=localToUtc(m[0],m[1],m[2],m[3],m[4],'America/Detroit'), ms=r.ms+m[5]*1000;
      CFG={lat:t[3],lon:t[4],kind:'kp'}; const x=spFeat(ms,t[3],t[4],'kp'), W=x.why, nm=c=>NAME[c];
      const cs=['C2','C5','C6','C8','C11'].map(k=>k.slice(1)+': '+nm(W[k].p)+' ['+W[k].sig.join(',')+']').join('<br>');
      const hit=SP_RULES.slice(0,4).filter(q=>spTest(x,q.id)).map(q=>q.id==='NOLOSS'?'No loss':q.id.replace('.gain','')).join(', ')||'none';
      h+='<tr><td>'+t[0]+'</td><td>'+t[1].replace(' ','<br>')+'</td><td>'+t[2]+'</td><td>'+SIGNS[x.seg.sign][0]+'<br>'+nm(x.seg.lord)+' / '+nm(x.seg.star)+' / '+nm(x.seg.sub)+' ['+W.AB.sig.join(',')+']</td><td>'+nm(W.MS.p)+' / '+nm(W.MB.p)+'</td><td>'+cs+'</td><td>'+hit+'</td></tr>';
    });
  }finally{CFG=old;}
  return h+'</tbody></table></div>';
}
function spStatsHtml(){
  let h='<div class="tblw"><table><thead><tr><th>Condition at the purchase time</th><th>Tickets</th><th>Random times</th><th>Expected in 14</th></tr></thead><tbody>';
  SP_STATS.forEach(r=>{h+='<tr><td>'+r[1]+'</td><td><b>'+r[2]+' of 14</b></td><td>'+(r[3]*100).toFixed(0)+'%</td><td>'+(r[3]*14).toFixed(1)+'</td></tr>';});
  return h+'</tbody></table></div>';
}
function spRun(){
  const msg=$('spMsg'), out=$('spOut'); msg.className='msg err'; out.innerHTML='';
  const lat=parseFloat($('spLat').value), lon=parseFloat($('spLon').value), tzs=$('spTz').value.trim(), f=$('spFrom').value, t=$('spTo').value, kind=$('spAyan').value, sel=SP_RULES.filter(q=>$('spR'+q.id.replace('.','_')).checked);
  if(isNaN(lat)||isNaN(lon)||!tzs){msg.textContent='Choose a place (or enter latitude, longitude and time zone).';return;}
  if(Math.abs(lat)>62){msg.textContent='Latitude beyond 62° is not supported.';return;}
  if(typeof Astronomy==='undefined'){msg.textContent='Planet positions need the astronomy library, which did not load.';return;}
  if(!f||!t){msg.textContent='Pick both a from date and a to date.';return;}
  if(!sel.length){msg.textContent='Tick at least one rule.';return;}
  let tzf; try{tzf=tzFn(tzs);}catch(e){msg.textContent='The time zone was not recognised. Use a name such as Asia/Kolkata or hours such as 5.5.';return;}
  const a=f.split('-').map(Number), b=t.split('-').map(Number), nd=Math.round((Date.UTC(b[0],b[1]-1,b[2])-Date.UTC(a[0],a[1]-1,a[2]))/86400000)+1;
  if(nd<1){msg.textContent='The to date must not be before the from date.';return;}
  if(nd>14){msg.textContent='Please choose at most 14 days.';return;}
  const t1=$('spT1').value||'00:00', t2=$('spT2').value||'23:59', m1=t1.split(':').map(Number), m2=t2.split(':').map(Number);
  if(m1[0]*60+m1[1]>=m2[0]*60+m2[1]){msg.textContent='The end time must be after the start time.';return;}
  msg.className='msg'; const old=CFG; CFG={lat:lat,lon:lon,kind:kind}; const items=[]; let day=0,n=0; $('spGo').disabled=true;
  (function step(){
    if(day>=nd){CFG=old;$('spGo').disabled=false;SP_RES={items:items,f:f,t:t,lat:lat,lon:lon,tzs:tzs,sel:sel,n:n,kind:kind};spShow();return;}
    try{
      const dt=new Date(Date.UTC(a[0],a[1]-1,a[2]+day)), y=dt.getUTCFullYear(), m=dt.getUTCMonth()+1, d=dt.getUTCDate();
      const s=localToUtc(y,m,d,0,0,tzs).ms, nx=new Date(Date.UTC(y,m-1,d+1)), e=localToUtc(nx.getUTCFullYear(),nx.getUTCMonth()+1,nx.getUTCDate(),0,0,tzs).ms, off=tzf(s);
      const w1=localToUtc(y,m,d,m1[0],m1[1],tzs).ms, w2=localToUtc(y,m,d,m2[0],m2[1],tzs).ms;
      compute(Math.max(s,w1-3600000),Math.min(e,w2+3600000),lat,lon,kind).forEach(r=>{
        if(r.end<=w1||r.start>=w2)return; n++; const mid=(r.start+r.end)/2, x=spFeat(mid,lat,lon,kind); let ok=true;
        for(const q of sel){ if(q.id==='LOT'){const l=ltEval(r,lat,lon,kind,{rk:null}); if(l.score<65){ok=false;break;}} else if(!spTest(x,q.id)){ok=false;break;} }
        if(ok)items.push({r:r,x:x,day:s,off:off,w1:w1,w2:w2});
      });
    }catch(err){CFG=old;$('spGo').disabled=false;msg.textContent='Error: '+(err.message||err);return;}
    day++; msg.textContent='Checking day '+day+' of '+nd+'…'; setTimeout(step,0);
  })();
}
function spShow(){
  const out=$('spOut'), L=SP_RES; let h='', last=null; const nm=c=>NAME[c];
  h+='<div class="lf-sec"><h3>Favourable timings (exploratory)<span class="ta">சாதகமான நேரங்கள்</span></h3><p class="lf-note" style="margin:2px 0">'+L.items.length+' of '+L.n+' ascendant timings meet every ticked rule: '+L.sel.map(q=>q.id==='NOLOSS'?'No loss':q.id==='LOT'?'Lottery score':q.id.replace('.gain','')).join(', ')+'. Remember: the 14 tickets did not show that these conditions matter.</p></div>';
  L.items.forEach(it=>{
    const g=SEGS[it.r.k], W=it.x.why;
    if(it.day!==last){last=it.day; h+='<div class="lf-sec"><h3>'+fmtDate(it.day,it.off)+'</h3></div>';}
    h+='<ul style="margin-top:6px"><li class="row gm" data-s="'+Math.max(it.r.start,it.w1)+'" data-e="'+Math.min(it.r.end,it.w2)+'" data-tz="'+it.off+'" data-lat="'+L.lat+'" data-lon="'+L.lon+'" data-kind="'+L.kind+'" style="--h:'+HUE[g.sub]+'"><div class="t2"><div><span>Begin</span><b>'+fmtHMS(Math.max(it.r.start,it.w1),it.off)+'</b></div><div><span>End</span><b>'+fmtHMS(Math.min(it.r.end,it.w2),it.off)+'</b></div></div>'+
      '<div class="l"><span class="n">'+nm(g.lord)+'/'+nm(g.star)+'/'+nm(g.sub)+'</span><span class="pl"><span class="pill gain">Speculation timing · ஊக நேரம்</span></span></div>'+
      '<div class="chk">'+L.sel.map(q=>{if(q.id==='LOT')return '<b>Lottery score</b> 65 or more';if(q.id==='NOLOSS')return '<b>No loss</b>: ascendant star lord '+nm(W.AS.p)+' signifies '+W.AS.sig.join(', ')+'; sub lord '+nm(W.AB.p)+' signifies '+W.AB.sig.join(', ');const k=q.id.split('.')[0], who={AB:'Ascendant sub lord',C2:'2nd cusp sub lord',C5:'5th cusp sub lord',C6:'6th cusp sub lord',C8:'8th cusp sub lord',C11:'11th cusp sub lord',MS:'Moon’s star lord'}[k];return '<b>'+who+'</b> '+nm(W[k].p)+' signifies houses '+W[k].sig.join(', ');}).join('<br>')+'</div>'+
      '<div class="p"><span>'+SIGNS[g.sign][0]+' ascendant · '+span(g)+' · '+NAKS[g.nak]+'</span><span>lasts '+dur(it.r.end-it.r.start)+'</span></div></li></ul>';
  });
  $('spMsg').textContent=L.items.length+' timings from '+L.f+' to '+L.t+'.';
  if(!L.items.length)h+='<p class="msg">No timing meets every ticked rule. Untick a rule or choose other dates.</p>'; else h+='<div class="btns"><button id="spCopy" type="button">Copy as text</button></div>';
  out.innerHTML=h;
  const cb=$('spCopy'); if(cb)cb.addEventListener('click',()=>{
    const tx='Speculation research - favourable timings (exploratory, not predictive) '+L.f+' to '+L.t+' ('+L.lat+', '+L.lon+', '+L.tzs+')\n'+L.items.map(it=>fmtDate(it.day,it.off)+'  '+fmtHMS(Math.max(it.r.start,it.w1),it.off)+' - '+fmtHMS(Math.min(it.r.end,it.w2),it.off)+'  '+nm(SEGS[it.r.k].lord)+'/'+nm(SEGS[it.r.k].star)+'/'+nm(SEGS[it.r.k].sub)).join('\n');
    if(window.GuruApp&&GuruApp.copyText){try{GuruApp.copyText(tx);$('spMsg').textContent='Copied.';return;}catch(e){}}
    try{navigator.clipboard.writeText(tx).then(()=>{$('spMsg').textContent='Copied.';},()=>{$('spMsg').textContent='Copying is blocked here.';});}catch(e){$('spMsg').textContent='Copying is blocked here.';}
  });
}
function spFill(){
  const q=$('spSearch').value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''), cn=$('spCountry').value, sel=$('spCity'); let list, tag=false;
  if(cn==='*a'){list=q?WC.filter(x=>plKey(x).indexOf(q)>=0).slice(0,400):[];tag=true;} else list=WC.filter(x=>x.cc===cn&&(!q||plKey(x).indexOf(q)>=0)).slice(0,600);
  if(!list.length)list=webC(q,spFill); SP_LIST=list; sel.innerHTML=list.length?list.map((x,i)=>'<option value="'+i+'">'+x.n+(x.st?', '+x.st:'')+(tag?', '+x.cc:'')+'</option>').join(''):'<option value="">No match in the offline list. Online search is tried automatically when you are connected</option>'; spPick();
}
function spPick(){const x=SP_LIST[parseInt($('spCity').value,10)]; if(x){$('spLat').value=x.lat;$('spLon').value=x.lon;$('spTz').value=x.tz;} spOff();}
function spOff(){const el=$('spOff'), t=$('spTz').value.trim(); el.className='msg'; if(!t){el.textContent='';return;} try{el.textContent='Time zone now: '+utcTxt(tzFn(t)(Date.now()))+(/^-?[\d.]+$/.test(t)?'':' ('+t+')');}catch(e){el.textContent='The time zone was not recognised.';el.className='msg err';}}


(function initSp(){
  const cs=$('spCountry'); cs.innerHTML='<option value="*a">All countries (use search)</option>'+CITY.cc.map(n=>'<option value="'+n.replace(/"/g,'&quot;')+'">'+n+'</option>').join('');
  cs.addEventListener('change',spFill); $('spSearch').addEventListener('input',spFill); $('spCity').addEventListener('change',spPick); $('spTz').addEventListener('input',spOff); spFill();
  const iso=new Date(Date.now()+TZ*3600000).toISOString().slice(0,10); $('spFrom').value=iso; $('spTo').value=iso;
  $('spRules').innerHTML=SP_RULES.map(q=>'<label class="acchk" style="display:flex;align-items:flex-start;margin:6px 0"><input type="checkbox" id="spR'+q.id.replace('.','_')+'"'+(q.def?' checked':'')+' style="margin-top:3px"><span>'+q.en+'<br><span class="lf-note">Evidence from your tickets: '+q.ev+'</span><br><span class="ta" style="font-family:var(--ta);color:var(--accent)">'+q.ta+'</span></span></label>').join('');
  $('spBtn').addEventListener('click',()=>{ const pn=$('spPanel'); pn.classList.remove('hide'); if(!$('spLat').value){$('spLat').value=$('lat').value;$('spLon').value=$('lon').value;$('spTz').value=PL_TZ||$('tz').value;spOff();} pn.scrollIntoView({block:'start'}); });
  $('spClose').addEventListener('click',()=>$('spPanel').classList.add('hide'));
  $('spGo').addEventListener('click',spRun);
  $('spStatsBox').addEventListener('toggle',()=>{ if($('spStatsBox').open&&!$('spTicketTbl').innerHTML){ $('spStatsTbl').innerHTML=spStatsHtml(); $('spTicketTbl').innerHTML=spTickets(); } });
  $('spLoc').addEventListener('click',()=>{ const el=$('spOff'); if(!navigator.geolocation){el.textContent='Location is not available here.';el.className='msg err';return;} el.textContent='Finding your location…';el.className='msg';
    navigator.geolocation.getCurrentPosition(pos=>{$('spLat').value=pos.coords.latitude.toFixed(4);$('spLon').value=pos.coords.longitude.toFixed(4);let z='';try{z=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(e){} $('spTz').value=z||String(-new Date().getTimezoneOffset()/60);$('spSearch').value='';spOff();},e=>{el.textContent='Could not get your location. Choose a city instead.';el.className='msg err';},{timeout:15000}); });
})();

/* ---------- Money profit muhurtham (v4.9) ---------- */
const MP_RULES=[
 {id:'R1',def:0,t:f=>f['AB.sig11'],en:'The ascendant sub lord signifies the 11th house',ta:'லக்ன உப அதிபதி 11-ஆம் வீட்டைக் குறிக்கிறார்',ev:'9 of 14 winning purchases · 38% of random times'},
 {id:'R2',def:1,t:f=>f['AB.sig11']||f['C11.sig11'],en:'The ascendant sub lord OR the 11th cusp sub lord signifies the 11th house',ta:'லக்ன உப அதிபதி அல்லது 11-ஆம் கஸ்ப் உப அதிபதி 11-ஐ குறிக்கிறார்',ev:'13 of 14 · 59% of random times (the strongest link)'},
 {id:'R3',def:0,t:f=>f['AB.sig2']||f['AB.sig11'],en:'The ascendant sub lord signifies the 2nd or the 11th',ta:'லக்ன உப அதிபதி 2 அல்லது 11-ஐ குறிக்கிறார்',ev:'12 of 14 · 60%'},
 {id:'R4',def:1,t:f=>f['AB.sig2']||f['AB.sig6']||f['AB.sig11'],en:'The ascendant sub lord signifies the 2nd, 6th or 11th',ta:'லக்ன உப அதிபதி 2, 6 அல்லது 11-ஐ குறிக்கிறார்',ev:'13 of 14 · 79%'},
 {id:'R5',def:0,t:f=>(f['AB.sig2']+f['AB.sig6']+f['AB.sig11'])>=2,en:'The ascendant sub lord signifies at least two of the 2nd, 6th and 11th',ta:'லக்ன உப அதிபதி 2, 6, 11-ல் குறைந்தது இரண்டை குறிக்கிறார்',ev:'7 of 14 · 29%'},
 {id:'R6',def:0,t:f=>f['C2.sig11'],en:'The 2nd cusp (money) sub lord signifies the 11th',ta:'2-ஆம் கஸ்ப் (தனம்) உப அதிபதி 11-ஐ குறிக்கிறார்',ev:'8 of 14 · 38%'},
 {id:'R7',def:1,t:f=>f['MS.sig6']||f['MS.sig11'],en:'The Moon’s star lord signifies the 6th or the 11th',ta:'சந்திரனின் நட்சத்திர அதிபதி 6 அல்லது 11-ஐ குறிக்கிறார்',ev:'11 of 14 · 61%'},
 {id:'R8',def:0,t:f=>f['MS.sig2']||f['MS.sig6']||f['MS.sig11'],en:'The Moon’s star lord signifies the 2nd, 6th or 11th',ta:'சந்திரனின் நட்சத்திர அதிபதி 2, 6 அல்லது 11-ஐ குறிக்கிறார்',ev:'12 of 14 · 76%'},
 {id:'R9',def:1,t:f=>!f['AS.loss']&&!f['AB.loss'],en:'No loss link: the ascendant star lord and sub lord do not signify the 12th without the 11th',ta:'லக்ன நட்சத்திர, உப அதிபதிகள் 11 இன்றி 12-ஐ குறிக்கவில்லை',ev:'11 of 14 · 62%'},
 {id:'R10',def:0,t:f=>!f['AL.retro']&&!f['AS.retro']&&!f['AB.retro'],en:'The ascendant lord, star lord and sub lord are all direct (not retrograde)',ta:'லக்ன அதிபதி, நட்சத்திர, உப அதிபதிகள் வக்கிரம் இல்லை',ev:'8 of 14 · 67% (your winners did not avoid retrograde planets; tick this only as a traditional preference)'},
 {id:'R11',def:0,t:f=>f['LV.A'],en:'Live rule A: 2nd and 11th cusp star/sub lords are the 2nd or 11th lord, and those lords are not in the 8th or 12th',ta:'விதி A: 2, 11-ஆம் கஸ்ப் நட்சத்திர/உப அதிபதிகள் 2 அல்லது 11-ஆம் அதிபதி; அவர்கள் 8, 12-ல் இல்லை',ev:'new in v5.3 (live blinking rule)'},
 {id:'R12',def:0,t:f=>f['LV.B'],en:'Live rule B: ascendant and 2nd/11th cusp star/sub lords stand in the star of the 2nd or 11th lord, not in the 8th or 12th',ta:'விதி B: லக்ன, 2/11 கஸ்ப் அதிபதிகள் 2/11-ஆம் அதிபதியின் நட்சத்திரத்தில்; 8, 12-ல் இல்லை',ev:'new in v5.3 (live blinking rule)'}
];
function mpRun(){
  const msg=$('mpMsg'), out=$('mpOut'); msg.className='msg err'; out.innerHTML='';
  const lat=parseFloat($('mpLat').value), lon=parseFloat($('mpLon').value), tzs=$('mpTz').value.trim(), f=$('mpFrom').value, t=$('mpTo').value, kind=$('mpAyan').value, sel=MP_RULES.filter(q=>$('mpR'+q.id).checked);
  if(isNaN(lat)||isNaN(lon)||!tzs){msg.textContent='Choose a place (or enter latitude, longitude and time zone).';return;}
  if(Math.abs(lat)>62){msg.textContent='Latitude beyond 62° is not supported.';return;}
  if(typeof Astronomy==='undefined'){msg.textContent='Planet positions need the astronomy library, which did not load.';return;}
  if(!f||!t){msg.textContent='Pick both a from date and a to date.';return;}
  if(!sel.length){msg.textContent='Tick at least one rule.';return;}
  let tzf; try{tzf=tzFn(tzs);}catch(e){msg.textContent='The time zone was not recognised. Use a name such as Asia/Kolkata or hours such as 5.5.';return;}
  const a=f.split('-').map(Number), b=t.split('-').map(Number), nd=Math.round((Date.UTC(b[0],b[1]-1,b[2])-Date.UTC(a[0],a[1]-1,a[2]))/86400000)+1;
  if(nd<1){msg.textContent='The to date must not be before the from date.';return;}
  if(nd>366){msg.textContent='Please choose at most 366 days at a time.';return;}
  const t1=$('mpT1').value||'00:00', t2=$('mpT2').value||'23:59', m1=t1.split(':').map(Number), m2=t2.split(':').map(Number);
  if(m1[0]*60+m1[1]>=m2[0]*60+m2[1]){msg.textContent='The end time must be after the start time.';return;}
  msg.className='msg'; const old=CFG; CFG={lat:lat,lon:lon,kind:kind}; const items=[]; let day=0,n=0; $('mpGo').disabled=true;
  (function step(){
    if(day>=nd){CFG=old;$('mpGo').disabled=false;MP_RES={items:items,f:f,t:t,lat:lat,lon:lon,tzs:tzs,sel:sel,n:n,kind:kind};mpShow();return;}
    try{
      const dt=new Date(Date.UTC(a[0],a[1]-1,a[2]+day)), y=dt.getUTCFullYear(), m=dt.getUTCMonth()+1, d=dt.getUTCDate();
      const s=localToUtc(y,m,d,0,0,tzs).ms, nx=new Date(Date.UTC(y,m-1,d+1)), e=localToUtc(nx.getUTCFullYear(),nx.getUTCMonth()+1,nx.getUTCDate(),0,0,tzs).ms, off=tzf(s);
      const w1=localToUtc(y,m,d,m1[0],m1[1],tzs).ms, w2=localToUtc(y,m,d,m2[0],m2[1],tzs).ms;
      compute(Math.max(s,w1-3600000),Math.min(e,w2+3600000),lat,lon,kind).forEach(r=>{
        if(r.end<=w1||r.start>=w2)return; n++; const x=spFeat((r.start+r.end)/2,lat,lon,kind); let ok=true;
        for(const q of sel){ if(!q.t(x.f)){ok=false;break;} }
        if(ok){ const met=MP_RULES.filter(q=>q.t(x.f)).length; items.push({r:r,x:x,day:s,off:off,w1:w1,w2:w2,met:met}); }
      });
    }catch(err){CFG=old;$('mpGo').disabled=false;msg.textContent='Error: '+(err.message||err);return;}
    day++; msg.textContent='Checking day '+day+' of '+nd+'…'; setTimeout(step,0);
  })();
}
function mpShow(){
  const out=$('mpOut'), L=MP_RES; let h='', last=null; const nm=c=>NAME[c], best=L.items.reduce((m,i)=>Math.max(m,i.met),0);
  h+='<div class="lf-sec"><h3>Money profit muhurtham<span class="ta">பண லாப முகூர்த்தம்</span></h3><p class="lf-note" style="margin:2px 0">'+L.items.length+' of '+L.n+' ascendant timings meet every ticked rule ('+L.sel.map(q=>q.id).join(', ')+'). “Rules met” counts all '+MP_RULES.length+' rules in the menu, ticked or not, so a higher number is a stronger match.</p></div>';
  const G=[]; L.items.forEach(it=>{ const lg=G[G.length-1], st=Math.max(it.r.start,it.w1), en=Math.min(it.r.end,it.w2); if(lg&&lg.day===it.day&&st-lg.en<=1500){lg.en=en;lg.its.push(it);} else G.push({day:it.day,off:it.off,st:st,en:en,its:[it]}); });
  L.groups=G; const nGr=G.length;
  h+='<p class="lf-note" style="margin:2px 0">Neighbouring timings are joined into one window: '+nGr+' windows.</p>';
  G.forEach(gr=>{
    const it0=gr.its[0], g0=SEGS[it0.r.k], bestM=gr.its.reduce((m,i)=>Math.max(m,i.met),0);
    if(gr.day!==last){last=gr.day; h+='<div class="lf-sec"><h3>'+fmtDate(gr.day,gr.off)+'</h3></div>';}
    h+='<ul style="margin-top:6px"><li class="row gm" data-s="'+gr.st+'" data-e="'+gr.en+'" data-tz="'+gr.off+'" data-lat="'+L.lat+'" data-lon="'+L.lon+'" data-kind="'+L.kind+'" style="--h:'+HUE[g0.sub]+'"><div class="t2"><div><span>Begin</span><b>'+fmtHMS(gr.st,gr.off)+'</b></div><div><span>End</span><b>'+fmtHMS(gr.en,gr.off)+'</b></div></div>'+
      '<div class="l"><span class="n">'+SIGNS[g0.sign][0]+(gr.its.some(i=>SEGS[i.r.k].sign!==g0.sign)?' …':'')+' ascendant</span><span class="pl"><span class="pill gain">Money profit muhurtham · பண லாப முகூர்த்தம்</span> <span class="pill nt">Best rules met '+bestM+'/'+MP_RULES.length+(bestM===best&&best>L.sel.length?' · best':'')+'</span></span></div>'+
      '<div class="chk">'+gr.its.map(it=>{const g=SEGS[it.r.k], W=it.x.why; return '<b>'+fmtHMS(Math.max(it.r.start,it.w1),it.off)+' - '+fmtHMS(Math.min(it.r.end,it.w2),it.off)+'</b> '+nm(g.lord)+'/'+nm(g.star)+'/'+nm(g.sub)+' · ascendant sub lord signifies '+W.AB.sig.join(',')+' · 11th cusp sub lord '+nm(W.C11.p)+' ['+W.C11.sig.join(',')+'] · 2nd cusp sub lord '+nm(W.C2.p)+' ['+W.C2.sig.join(',')+'] · Moon’s star lord '+nm(W.MS.p)+' ['+W.MS.sig.join(',')+'] · rules met '+it.met+'/'+MP_RULES.length;}).join('<br>')+'</div>'+
      '<div class="p"><span>'+span(g0)+' · '+NAKS[g0.nak]+'</span><span>lasts '+dur(gr.en-gr.st)+'</span></div></li></ul>';
  });
  $('mpMsg').textContent=nGr+' muhurtham windows ('+L.items.length+' sub-lord timings) from '+L.f+' to '+L.t+'.';
  if(!L.items.length)h+='<p class="msg">No timing meets every ticked rule. Untick a rule or choose other dates.</p>'; else h+='<div class="btns"><button id="mpCopy" type="button">Copy as text</button></div>';
  out.innerHTML=h;
  const cb=$('mpCopy'); if(cb)cb.addEventListener('click',()=>{
    const tx='Money profit muhurtham '+L.f+' to '+L.t+' ('+L.lat+', '+L.lon+', '+L.tzs+') rules: '+L.sel.map(q=>q.en).join('; ')+'\n'+L.groups.map(gr=>fmtDate(gr.day,gr.off)+'  '+fmtHMS(gr.st,gr.off)+' - '+fmtHMS(gr.en,gr.off)+'  best rules met '+gr.its.reduce((m,i)=>Math.max(m,i.met),0)+'/'+MP_RULES.length).join('\n');
    if(window.GuruApp&&GuruApp.copyText){try{GuruApp.copyText(tx);$('mpMsg').textContent='Copied.';return;}catch(e){}}
    try{navigator.clipboard.writeText(tx).then(()=>{$('mpMsg').textContent='Copied.';},()=>{$('mpMsg').textContent='Copying is blocked here.';});}catch(e){$('mpMsg').textContent='Copying is blocked here.';}
  });
}
let MP_RES=null, MP_LIST=[];
function mpFill(){
  const q=$('mpSearch').value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''), cn=$('mpCountry').value, sel=$('mpCity'); let list, tag=false;
  if(cn==='*a'){list=q?WC.filter(x=>plKey(x).indexOf(q)>=0).slice(0,400):[];tag=true;} else list=WC.filter(x=>x.cc===cn&&(!q||plKey(x).indexOf(q)>=0)).slice(0,600);
  if(!list.length)list=webC(q,mpFill); MP_LIST=list; sel.innerHTML=list.length?list.map((x,i)=>'<option value="'+i+'">'+x.n+(x.st?', '+x.st:'')+(tag?', '+x.cc:'')+'</option>').join(''):'<option value="">No match in the offline list. Online search is tried automatically when you are connected</option>'; mpPick();
}
function mpPick(){const x=MP_LIST[parseInt($('mpCity').value,10)]; if(x){$('mpLat').value=x.lat;$('mpLon').value=x.lon;$('mpTz').value=x.tz;} mpOff();}
function mpOff(){const el=$('mpOff'), t=$('mpTz').value.trim(); el.className='msg'; if(!t){el.textContent='';return;} try{el.textContent='Time zone now: '+utcTxt(tzFn(t)(Date.now()))+(/^-?[\d.]+$/.test(t)?'':' ('+t+')');}catch(e){el.textContent='The time zone was not recognised.';el.className='msg err';}}


(function initMp(){
  const cs=$('mpCountry'); cs.innerHTML='<option value="*a">All countries (use search)</option>'+CITY.cc.map(n=>'<option value="'+n.replace(/"/g,'&quot;')+'">'+n+'</option>').join('');
  cs.addEventListener('change',mpFill); $('mpSearch').addEventListener('input',mpFill); $('mpCity').addEventListener('change',mpPick); $('mpTz').addEventListener('input',mpOff); mpFill();
  const iso=new Date(Date.now()+TZ*3600000).toISOString().slice(0,10); $('mpFrom').value=iso; $('mpTo').value=iso;
  $('mpRules').innerHTML=MP_RULES.map(q=>'<label class="acchk" style="display:flex;align-items:flex-start;margin:6px 0"><input type="checkbox" id="mpR'+q.id+'"'+(q.def?' checked':'')+' style="margin-top:3px"><span>'+q.en+'<br><span class="lf-note">Your 14 winning purchases: '+q.ev+'</span><br><span class="ta" style="font-family:var(--ta);color:var(--accent)">'+q.ta+'</span></span></label>').join('')+'<div class="btns"><button id="mpAll" type="button">Tick all</button><button id="mpNone" type="button">Untick all</button><button id="mpDef" type="button">Default</button></div>';
  const setAll=fn=>MP_RULES.forEach(q=>{$('mpR'+q.id).checked=fn(q);});
  $('mpAll').addEventListener('click',()=>setAll(()=>true)); $('mpNone').addEventListener('click',()=>setAll(()=>false)); $('mpDef').addEventListener('click',()=>setAll(q=>!!q.def));
  $('mpBtn').addEventListener('click',()=>{ const pn=$('mpPanel'); pn.classList.remove('hide'); if(!$('mpLat').value){$('mpLat').value=$('lat').value;$('mpLon').value=$('lon').value;$('mpTz').value=PL_TZ||$('tz').value;mpOff();} pn.scrollIntoView({block:'start'}); });
  $('mpClose').addEventListener('click',()=>$('mpPanel').classList.add('hide'));
  $('mpGo').addEventListener('click',mpRun);
  $('mpLoc').addEventListener('click',()=>{ const el=$('mpOff'); if(!navigator.geolocation){el.textContent='Location is not available here.';el.className='msg err';return;} el.textContent='Finding your location…';el.className='msg';
    navigator.geolocation.getCurrentPosition(pos=>{$('mpLat').value=pos.coords.latitude.toFixed(4);$('mpLon').value=pos.coords.longitude.toFixed(4);let z='';try{z=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(e){} $('mpTz').value=z||String(-new Date().getTimezoneOffset()/60);$('mpSearch').value='';mpOff();},e=>{el.textContent='Could not get your location. Choose a city instead.';el.className='msg err';},{timeout:15000}); });
})();

/* ---------- Earthquake research (v5.0) ---------- */
const EQ_SITES=[["Valdivia, Chile", -38.29, -73.05, 1960, 9.5], ["Sumatra-Andaman", 3.3, 95.87, 2004, 9.1], ["Tohoku, Japan", 38.32, 142.37, 2011, 9.1], ["Tangshan, China", 39.57, 117.98, 1976, 7.6], ["Haiyuan, China", 36.5, 105.7, 1920, 7.8], ["Great Kanto, Japan", 35.1, 139.5, 1923, 7.9], ["Ashgabat, Turkmenistan", 37.95, 58.32, 1948, 7.3], ["Sichuan, China", 31.02, 103.37, 2008, 7.9], ["Kashmir, Pakistan", 34.49, 73.63, 2005, 7.6], ["Messina, Italy", 38.18, 15.55, 1908, 7.1], ["Chimbote, Peru", -9.25, -78.84, 1970, 7.9], ["Kahramanmaras, Turkey", 37.17, 37.03, 2023, 7.8], ["El Asnam, Algeria", 36.14, 1.41, 1980, 7.1], ["Manjil-Rudbar, Iran", 36.96, 49.41, 1990, 7.4], ["Erzincan, Turkey", 39.77, 39.53, 1939, 7.8], ["Bhuj, India", 23.41, 70.23, 2001, 7.7], ["Izmit, Turkey", 40.75, 29.86, 1999, 7.6], ["Nias, Indonesia", 2.07, 97.01, 2005, 8.6], ["Gorkha, Nepal", 28.23, 84.73, 2015, 7.8], ["Michoacan, Mexico", 18.19, -102.53, 1985, 8.0], ["San Juan, Argentina", -31.4, -68.5, 1944, 7.0], ["Chillan, Chile", -36.6, -72.2, 1939, 8.3], ["Quetta, Pakistan", 29.5, 66.8, 1935, 7.7], ["Bihar-Nepal", 26.5, 86.5, 1934, 8.0], ["Tabas, Iran", 33.24, 57.38, 1978, 7.4], ["Guatemala", 15.32, -89.1, 1976, 7.5], ["Mindanao, Philippines", 6.26, 124.02, 1976, 8.0], ["Chichi, Taiwan", 23.85, 120.82, 1999, 7.7], ["Luzon, Philippines", 15.68, 121.17, 1990, 7.7], ["Assam-Tibet", 28.5, 96.5, 1950, 8.6], ["Hokkaido, Japan", 42.14, 143.85, 1952, 8.1], ["Gansu, China", 39.7, 97.0, 1932, 7.6], ["Tsinghai/Xining, China", 37.6, 102.6, 1927, 7.9], ["Southern Iran", 28.4, 52.8, 1972, 7.1], ["Ecuador-Colombia", 1.0, -81.5, 1906, 8.8], ["San Francisco, USA", 37.75, -122.55, 1906, 7.9], ["Valparaiso, Chile", -33.0, -72.0, 1906, 8.2], ["Dasht-e Bayaz, Iran", 34.0, 59.0, 1968, 7.4], ["Gediz, Turkey", 39.2, 29.5, 1970, 7.2], ["Tonghai, China", 24.1, 102.7, 1970, 7.7], ["Haicheng, China", 40.7, 122.7, 1975, 7.3], ["Muradiye, Turkey", 39.12, 44.03, 1976, 7.3], ["Vrancea, Romania", 45.77, 26.76, 1977, 7.5], ["Padang, Indonesia", -0.72, 99.87, 2009, 7.6], ["Palu, Indonesia", -0.26, 119.85, 2018, 7.5], ["Nippes, Haiti", 18.42, -73.48, 2021, 7.2], ["Kangra, India", 32.1, 76.3, 1905, 7.8], ["Sistan, Iran", 35.3, 59.2, 1923, 7.2], ["Kopet Dag, Iran", 37.9, 57.6, 1929, 7.2], ["Salmas, Iran", 38.15, 44.7, 1930, 7.1], ["Zanjan/Buin Zahra, Iran", 35.6, 49.9, 1962, 7.1], ["Gorgan, Iran", 36.9, 54.3, 1944, 7.2], ["Makran, Pakistan", 24.5, 63.0, 1945, 8.1], ["Ancash, Peru", -8.5, -77.5, 1946, 7.3]];
const EQ_CONDS=[
 {id:'L1',k:'L',def:1,en:'The ascendant at the place is Pisces',ta:'அந்த இடத்தில் லக்னம் மீனம்',ev:'10 of 54 earthquakes · 3.3 expected · raw p 0.0014 · 6% of random times',t:c=>c.g.sign===11},
 {id:'L2',k:'L',def:1,en:'The ascendant lord is Jupiter (Sagittarius or Pisces rising)',ta:'லக்னாதிபதி குரு (தனுசு அல்லது மீன லக்னம்)',ev:'15 of 54 · 7.9 expected · raw p 0.009 · 15% of random times',t:c=>c.g.lord==='Ju'},
 {id:'L3',k:'L',def:1,en:'The 8th cusp sub lord is Saturn',ta:'8-ஆம் கஸ்ப் உப அதிபதி சனி',ev:'15 of 54 · 8.5 expected · raw p 0.017 · 16% of random times',t:c=>c.c8==='Sa'},
 {id:'L4',k:'L',def:1,en:'The ascendant star lord signifies the 11th house',ta:'லக்ன நட்சத்திர அதிபதி 11-ஐ குறிக்கிறார்',ev:'28 of 54 · 19.9 expected · raw p 0.017 · 37% of random times',t:c=>c.sgAS.has(11)},
 {id:'L5',k:'L',def:1,en:'The 12th cusp sub lord signifies the 12th house',ta:'12-ஆம் கஸ்ப் உப அதிபதி 12-ஐ குறிக்கிறார்',ev:'28 of 54 · 20.5 expected · raw p 0.027 · 38% of random times',t:c=>c.sgC12.has(12)},
 {id:'L6',k:'L',def:0,en:'Mars is within 5° of the descendant',ta:'செவ்வாய் அஸ்தமன லக்னத்திலிருந்து 5° க்குள்',ev:'4 of 54 · 1.6 expected · raw p 0.075 (not significant) · 3% of random times',t:c=>c.marsDsc},
 {id:'S1',k:'S',def:0,en:'Rahu in Cancer and Ketu in Capricorn (sidereal)',ta:'ராகு கடகத்திலும் கேது மகரத்திலும்',ev:'10 of 54 · 4.6 expected · raw p 0.015 · 8% of random times',t:c=>c.sky.S1},
 {id:'S2',k:'S',def:0,en:'Saturn in Cancer (sidereal)',ta:'சனி கடகத்தில்',ev:'9 of 54 · 4.0 expected · raw p 0.016 · 7% of random times',t:c=>c.sky.S2},
 {id:'S3',k:'S',def:0,en:'Saturn is not in Virgo (sidereal)',ta:'சனி கன்னியில் இல்லை',ev:'0 of 54 in Virgo · 4.5 expected · raw p 0.009',t:c=>c.sky.S3},
 {id:'S4',k:'S',def:0,en:'Jupiter and Saturn in opposition (within 8°)',ta:'குரு–சனி எதிர்',ev:'6 of 54 · 2.2 expected · raw p 0.021 · 4% of random times',t:c=>c.sky.S4}
];
const EQ_SIGN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
let EQ_RES=null, EQ_LIST=[];
function eqSky(P){
  const sg=c=>Math.floor(mod(P[c],360)/30), d=mod(P.Ju-P.Sa,360), a=Math.min(d,360-d);
  return {S1:sg('Ra')===3&&sg('Ke')===9,S2:sg('Sa')===3,S3:sg('Sa')!==5,S4:a>172};
}
function eqChart(ms,lat,lon,kind,P,sky){
  const asc=sidAsc(ms,lat,lon,kind), cu=placidusCusps(ms,lat,lon,kind), g=SEGS[findSeg(asc)], sg=i=>SEGS[findSeg(cu[i-1])];
  const bh=l=>{for(let i=0;i<12;i++){const a=cu[i],b=cu[(i+1)%12];if(mod(l-a,360)<mod(b-a,360))return i+1;}return 1;};
  const own={}; CODES.forEach(c=>own[c]=[]); for(let i=1;i<=12;i++)own[sg(i).lord].push(i);
  const ownOf=c=>(c==='Ra'||c==='Ke')?(own[SEGS[findSeg(P[c])].lord]||[]):(own[c]||[]);
  const sigs=c=>{const st=SEGS[findSeg(P[c])].star, s=new Set([bh(P[st]),bh(P[c])]); ownOf(st).forEach(h=>s.add(h)); ownOf(c).forEach(h=>s.add(h)); return s;};
  const d=mod(P.Ma-cu[6],360);
  return {g:g,asc:asc,c8:sg(8).sub,c12:sg(12).sub,sgAS:sigs(g.star),sgC12:sigs(sg(12).sub),marsDsc:Math.min(d,360-d)<5,sky:sky};
}
function eqRun(){
  const msg=$('eqMsg'), out=$('eqOut'); msg.className='msg err'; out.innerHTML='';
  const mode=$('eqMode').value, kind=$('eqAyan').value, f=$('eqFrom').value, t=$('eqTo').value, sel=EQ_CONDS.filter(q=>$('eqR'+q.id).checked), minm=Math.max(1,parseInt($('eqMin').value)||1);
  if(typeof Astronomy==='undefined'){msg.textContent='Planet positions need the astronomy library, which did not load.';return;}
  if(!f||!t){msg.textContent='Pick both a from date and a to date.';return;}
  if(!sel.length){msg.textContent='Tick at least one condition.';return;}
  const a=f.split('-').map(Number), b=t.split('-').map(Number), nd=Math.round((Date.UTC(b[0],b[1]-1,b[2])-Date.UTC(a[0],a[1]-1,a[2]))/86400000)+1;
  if(nd<1){msg.textContent='The to date must not be before the from date.';return;}
  let sites, step, maxd, tzs='UTC', off=0;
  if(mode==='scan'){ sites=EQ_SITES.map(s=>({n:s[0]+' ('+s[3]+', M'+s[4]+')',lat:s[1],lon:s[2]})); step=10; maxd=31; }
  else{
    const lat=parseFloat($('eqLat').value), lon=parseFloat($('eqLon').value); tzs=$('eqTz').value.trim();
    if(isNaN(lat)||isNaN(lon)||!tzs){msg.textContent='Choose a place (or enter latitude, longitude and time zone).';return;}
    if(Math.abs(lat)>62){msg.textContent='Latitude beyond 62° is not supported.';return;}
    sites=[{n:($('eqSearch').value||'Chosen place'),lat:lat,lon:lon}]; step=10; maxd=366;
  }
  if(nd>maxd){msg.textContent=(mode==='scan'?'Scanning all '+EQ_SITES.length+' sites is limited to 31 days at a time.':'Please choose at most 366 days for one place.');return;}
  let tzf=null; if(mode!=='scan'){ try{tzf=tzFn(tzs);}catch(e){msg.textContent='The time zone was not recognised. Use a name such as Asia/Kolkata or hours such as 5.5.';return;} }
  msg.className='msg'; const old=CFG; CFG={lat:sites[0].lat,lon:sites[0].lon,kind:kind}; $('eqGo').disabled=true;
  const t0=mode==='scan'?Date.UTC(a[0],a[1]-1,a[2]):localToUtc(a[0],a[1],a[2],0,0,tzs).ms, stepMs=step*60000, nSteps=Math.round(nd*1440/step);
  const hit=sites.map(()=>[]); let day=0; const perDay=Math.round(1440/step), tot=nSteps;
  const skyAt=ms=>{const P={}; CODES.forEach(c=>P[c]=sidLon(c,ms)); return {P:P,sky:eqSky(P)};};
  let i=0;
  (function chunk(){
    try{
      const endI=Math.min(tot,i+perDay);
      for(;i<endI;i++){
        const ms=t0+i*stepMs, ps=skyAt(ms); let skyOk=true;
        const skySel=sel.filter(q=>q.k==='S'), lSel=sel.filter(q=>q.k==='L'), skyN=skySel.filter(q=>q.t({sky:ps.sky})).length;
        if(skySel.length&&skyN+lSel.length<minm)continue;
        sites.forEach((s,si)=>{
          CFG.lat=s.lat; CFG.lon=s.lon; const c=eqChart(ms,s.lat,s.lon,kind,ps.P,ps.sky);
          const m=skyN+lSel.filter(q=>q.t(c)).length; if(m>=minm)hit[si].push({i:i,m:m,c:c});
        });
      }
    }catch(err){CFG=old;$('eqGo').disabled=false;msg.textContent='Error: '+(err.message||err);return;}
    if(i<tot){msg.textContent='Checking '+(i/perDay).toFixed(1)+' of '+nd+' days…'; setTimeout(chunk,0); return;}
    CFG=old; $('eqGo').disabled=false;
    const wins=[]; sites.forEach((s,si)=>{ let cur=null; hit[si].forEach(h=>{ if(cur&&h.i===cur.last+1){cur.last=h.i;cur.m=Math.max(cur.m,h.m);cur.lastc=h.c;} else {cur={site:s,first:h.i,last:h.i,m:h.m,c0:h.c,lastc:h.c};wins.push(cur);} }); });
    wins.sort((x,y)=>x.first-y.first||y.m-x.m);
    const sk=ms=>{const P={}; ['Ra','Ke','Sa','Ju'].forEach(c=>P[c]=sidLon(c,ms)); return P;};
    CFG={lat:sites[0].lat,lon:sites[0].lon,kind:kind}; const s1=sk(t0+43200000), s2=sk(t0+(nd-1)*86400000+43200000); CFG=old;
    EQ_RES={wins:wins,t0:t0,step:stepMs,tzs:tzs,tzf:tzf,sel:sel,minm:minm,mode:mode,f:f,t:t,sky:[s1,s2],nSites:sites.length,nSteps:tot,nHit:hit.reduce((a,h)=>a+h.length,0)};
    eqShow();
  })();
}
function eqShow(){
  const out=$('eqOut'), L=EQ_RES; let h='', last=null; const nm=c=>NAME[c], sg=l=>EQ_SIGN[Math.floor(mod(l,360)/30)];
  const utc=L.mode==='scan'; const lt=ms=>{ const off=utc?0:L.tzf(ms); return {off:off,txt:fmtHMS(ms,off)}; };
  h+='<div class="lf-sec"><h3>Sky during these dates (sidereal)<span class="ta">வானம்</span></h3><p class="lf-note" style="margin:2px 0">Start: Rahu '+sg(L.sky[0].Ra)+', Ketu '+sg(L.sky[0].Ke)+', Saturn '+sg(L.sky[0].Sa)+', Jupiter '+sg(L.sky[0].Ju)+'. End: Rahu '+sg(L.sky[1].Ra)+', Ketu '+sg(L.sky[1].Ke)+', Saturn '+sg(L.sky[1].Sa)+', Jupiter '+sg(L.sky[1].Ju)+'.</p></div>';
  h+='<div class="lf-sec"><h3>Times resembling the great-earthquake charts<span class="ta">ஒத்த நேரங்கள்</span></h3><p class="lf-note" style="margin:2px 0">'+L.wins.length+' windows match at least '+L.minm+' of the ticked conditions ('+L.sel.map(q=>q.id).join(', ')+')'+(utc?' at the '+L.nSites+' historic epicentre areas; times are UTC':' at the chosen place')+'. '+(100*L.nHit/(L.nSteps*L.nSites)).toFixed(1)+'% of all checked moments match, which shows how common a resemblance is. This is a resemblance, not a forecast: when the same conditions were tested on 54 past earthquakes against random times, none stood out (see the note at the top).</p></div>';
  const show=L.wins.slice(0,400);
  show.forEach(w=>{
    const s0=L.t0+w.first*L.step, s1=L.t0+(w.last+1)*L.step, a=lt(s0), b=lt(s1), day=utc?new Date(s0).toISOString().slice(0,10):fmtDate(Math.floor(s0/86400000)*86400000,a.off);
    if(day!==last){last=day; h+='<div class="lf-sec"><h3>'+(utc?day:fmtDate(s0,a.off))+'</h3></div>';}
    const g=w.c0.g, met=L.sel.filter(q=>q.k==='L'?q.t(w.c0):q.t({sky:w.c0.sky})).map(q=>q.id).join(', ');
    h+='<ul style="margin-top:6px"><li class="row gm" style="--h:'+HUE[g.sub]+'"><div class="t2"><div><span>Begin</span><b>'+a.txt+'</b></div><div><span>End</span><b>'+b.txt+'</b></div></div>'+
      '<div class="l"><span class="n">'+w.site.n+'</span><span class="pl"><span class="pill">Match '+w.m+'/'+L.sel.length+'</span></span></div>'+
      '<div class="chk">At the start: '+EQ_SIGN[g.sign]+' ascendant · '+nm(g.lord)+'/'+nm(g.star)+'/'+nm(g.sub)+' · 8th cusp sub lord '+nm(w.c0.c8)+' · 12th cusp sub lord '+nm(w.c0.c12)+'<br>Conditions met: '+met+'</div>'+
      '<div class="p"><span>'+(utc?'UTC':L.tzs)+'</span><span>lasts '+dur(s1-s0)+'</span></div></li></ul>';
  });
  if(!L.wins.length)h+='<p class="msg">No time meets that many conditions. Lower the minimum or untick a condition.</p>'; else {
    if(L.wins.length>400)h+='<p class="msg">Showing the first 400 of '+L.wins.length+' windows. Raise the minimum number of matches to narrow the list.</p>';
    h+='<div class="btns"><button id="eqCopy" type="button">Copy as text</button></div>'; }
  $('eqMsg').textContent=L.wins.length+' windows from '+L.f+' to '+L.t+' ('+L.nSteps+' time steps'+(utc?' × '+L.nSites+' sites':'')+').';
  out.innerHTML=h;
  const cb=$('eqCopy'); if(cb)cb.addEventListener('click',()=>{
    const tx='Earthquake research - resemblance to 54 great earthquakes (not a forecast) '+L.f+' to '+L.t+(utc?' UTC':' '+L.tzs)+'; min matches '+L.minm+'; conditions '+L.sel.map(q=>q.en).join('; ')+'\n'+L.wins.map(w=>{const s0=L.t0+w.first*L.step,s1=L.t0+(w.last+1)*L.step,a=lt(s0),b=lt(s1);return w.site.n+'  '+(utc?new Date(s0).toISOString().slice(0,10):fmtDate(s0,a.off))+'  '+a.txt+' - '+b.txt+'  match '+w.m+'/'+L.sel.length;}).join('\n');
    if(window.GuruApp&&GuruApp.copyText){try{GuruApp.copyText(tx);$('eqMsg').textContent='Copied.';return;}catch(e){}}
    try{navigator.clipboard.writeText(tx).then(()=>{$('eqMsg').textContent='Copied.';},()=>{$('eqMsg').textContent='Copying is blocked here.';});}catch(e){$('eqMsg').textContent='Copying is blocked here.';}
  });
}
function eqFill(){
  const q=$('eqSearch').value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''), cn=$('eqCountry').value, sel=$('eqCity'); let list, tag=false;
  if(cn==='*a'){list=q?WC.filter(x=>plKey(x).indexOf(q)>=0).slice(0,400):[];tag=true;} else list=WC.filter(x=>x.cc===cn&&(!q||plKey(x).indexOf(q)>=0)).slice(0,600);
  if(!list.length)list=webC(q,eqFill); EQ_LIST=list; sel.innerHTML=list.length?list.map((x,i)=>'<option value="'+i+'">'+x.n+(x.st?', '+x.st:'')+(tag?', '+x.cc:'')+'</option>').join(''):'<option value="">No match in the offline list. Online search is tried automatically when you are connected</option>'; eqPick();
}
function eqPick(){const x=EQ_LIST[parseInt($('eqCity').value,10)]; if(x){$('eqLat').value=x.lat;$('eqLon').value=x.lon;$('eqTz').value=x.tz;} eqOff();}
function eqOff(){const el=$('eqOff'), t=$('eqTz').value.trim(); el.className='msg'; if(!t){el.textContent='';return;} try{el.textContent='Time zone now: '+utcTxt(tzFn(t)(Date.now()))+(/^-?[\d.]+$/.test(t)?'':' ('+t+')');}catch(e){el.textContent='The time zone was not recognised.';el.className='msg err';}}


(function initEq(){
  const cs=$('eqCountry'); cs.innerHTML='<option value="*a">All countries (use search)</option>'+CITY.cc.map(n=>'<option value="'+n.replace(/"/g,'&quot;')+'">'+n+'</option>').join('');
  cs.addEventListener('change',eqFill); $('eqSearch').addEventListener('input',eqFill); $('eqCity').addEventListener('change',eqPick); $('eqTz').addEventListener('input',eqOff); eqFill();
  const iso=new Date(Date.now()+TZ*3600000).toISOString().slice(0,10); $('eqFrom').value=iso; $('eqTo').value=iso;
  $('eqRules').innerHTML=EQ_CONDS.map(q=>'<label class="acchk" style="display:flex;align-items:flex-start;margin:6px 0"><input type="checkbox" id="eqR'+q.id+'"'+(q.def?' checked':'')+' style="margin-top:3px"><span>'+q.en+'<br><span class="lf-note">Among the 54 earthquakes: '+q.ev+'</span><br><span class="ta" style="font-family:var(--ta);color:var(--accent)">'+q.ta+'</span></span></label>').join('');
  const modeSync=()=>{ const sc=$('eqMode').value==='scan'; $('eqPlaceBox').style.display=sc?'none':''; };
  $('eqMode').addEventListener('change',modeSync); modeSync();
  $('eqBtn').addEventListener('click',()=>{ const pn=$('eqPanel'); pn.classList.remove('hide'); if(!$('eqLat').value){$('eqLat').value=$('lat').value;$('eqLon').value=$('lon').value;$('eqTz').value=PL_TZ||$('tz').value;eqOff();} pn.scrollIntoView({block:'start'}); });
  $('eqClose').addEventListener('click',()=>$('eqPanel').classList.add('hide'));
  $('eqGo').addEventListener('click',eqRun);
  $('eqLoc').addEventListener('click',()=>{ const el=$('eqOff'); if(!navigator.geolocation){el.textContent='Location is not available here.';el.className='msg err';return;} el.textContent='Finding your location…';el.className='msg';
    navigator.geolocation.getCurrentPosition(pos=>{$('eqLat').value=pos.coords.latitude.toFixed(4);$('eqLon').value=pos.coords.longitude.toFixed(4);let z='';try{z=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(e){} $('eqTz').value=z||String(-new Date().getTimezoneOffset()/60);$('eqSearch').value='';eqOff();},e=>{el.textContent='Could not get your location. Choose a city instead.';el.className='msg err';},{timeout:15000}); });
})();

const CONDS=['The star lord and sub lord should not be in the star of the 8th lord or the 12th lord of the ascendant.',
  'The ascendant star lord and sub lord should not be in the 8th house or the 12th house.',
  'The ascendant star lord and sub lord should not be in the star of planets placed in the 8th or 12th house.'];
const CONDS2=['a) The transit ascendant lord, star lord and sub lord should not be placed in the 8th or 12th house from the transit ascendant.',
  'b) The transit ascendant lord, star lord and sub lord should not be in the star of the 8th lord or the 12th lord.',
  'c) The transit ascendant lord, star lord and sub lord should not be in the star of any planet placed in the 8th or 12th house.',
  'd) The transit ascendant lord, star lord and sub lord should not be retrograde (Rahu and Ketu are not counted).',
  'Financial gain: the star lord and sub lord of a passing ascendant are both the 2nd lord or 11th lord.',
  'Auspicious financial gain: the lagna lord, star lord and sub lord are each in the star of the 2nd lord or 11th lord (a planet that is also the 8th or 12th lord is not counted).'];

function copyText(){
  const f=$('rulShow').value;
  const keep=o=>MODE==='all'||(MODE==='gmp'?(isGmp(SEGS[o.r.k])&&tagOk(o.i)):MODE==='ana'?(ANA&&ANA[o.i].ok&&tagOk(o.i)):(RUL&&RUL[o.i].ok&&(f==='all'||(f==='aus'?RUL[o.i].aus:f==='dhana'?extraTags(o.i).dhana:f==='high'?extraTags(o.i).high:(RUL[o.i].fin||RUL[o.i].aus)))));
  const sel=ROWS.map((r,i)=>({r:r,i:i})).filter(keep);
  const lines=sel.map(o=>{const r=o.r,g=SEGS[r.k];
    return clock(r.start)+(MODE==='all'?'':' - '+clock(r.end))+'  '+SIGNS[g.sign][0]+' ascendant  '+NAME[g.lord]+'/'+NAME[g.star]+'/'+NAME[g.sub]+'  ('+TLAG[g.sign]+' லக்னம் '+tl(g)+')'+(MODE==='rul'&&RUL[o.i].fin?'  [Financial gain]':'')+(MODE==='rul'&&RUL[o.i].aus?'  [Auspicious financial gain]':'')+xtCopy(o.i);});
  const title=MODE==='gmp'?'GMP 3,11 Gurumurthy Guruji Muhurtham ':MODE==='ana'?'Muhurtham part 1 ':MODE==='rul'?'Muhurtham on rules ':'Lagna sub-lords ';
  let text=title+$('date').value+' (UTC'+(TZ>=0?'+':'')+TZ+', '+$('lat').value+', '+$('lon').value+')\nTime, ascendant sign, lagna lord / star lord / sub lord\n'+lines.join('\n');
  if(MODE==='gmp'||MODE==='ana') text+='\n\nConditions:\n'+CONDS.map((c,i)=>(i+1)+'. '+c).join('\n');
  if(MODE==='rul') text+='\n\nRules:\n'+CONDS2.join('\n');
  if(MODE!=='all') text+='\n\nDhana muhurtham: 2nd or 11th lord in own star in the 1st/3rd/11th house, 2nd and 11th lords in the same house or both in kendra, and the transit Moon in the star of the 2nd or 11th lord.'+(MODE!=='ana'?'\nHighly auspicious: ascendant star lord and sub lord are each the 3rd or 11th lord, in the same house or kendra to each other, not in the 8th/12th house and not in the star of the 8th/12th lord.':'');
  const done=()=>setMsg('Copied '+lines.length+' lines.');
  try{ navigator.clipboard.writeText(text).then(done,fallback); }catch(e){fallback();}
  function fallback(){
    try{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();done();}
    catch(e){setMsg('Copy is not available here.',true);}
  }
}

/* ---------- Muhurtham chart pop-up ---------- */
const GA=window.GA={
  render(ms,cfg){
    const keep={LV:LIVEON,CFG:CFG,TZ:TZ,ROWS:ROWS,box:$('chartBox').innerHTML,tab:$('ptable').innerHTML,t:$('chartTime').innerHTML,e:$('chartErr').textContent};
    LIVEON=false; CFG={lat:cfg.lat,lon:cfg.lon,kind:cfg.kind}; TZ=cfg.tz; ROWS=[]; window.CH_POP=true;
    let out;
    try{ drawChart(ms); out={svg:$('chartBox').innerHTML,tab:$('ptable').innerHTML}; }
    finally{ window.CH_POP=false; LIVEON=keep.LV; CFG=keep.CFG; TZ=keep.TZ; ROWS=keep.ROWS; $('chartBox').innerHTML=keep.box; $('ptable').innerHTML=keep.tab; $('chartTime').innerHTML=keep.t; $('chartErr').textContent=keep.e; }
    return out;
  },
  open(s,e,cfg,li){
    GA.cur={s:s,e:e-1000,cfg:cfg};
    const n=li&&li.querySelector('.n'), title=n?n.textContent.trim():'';
    const codes=title.split('/').map(w=>Object.keys(NAME).find(k=>NAME[k]===w.trim()));
    $('cpT').textContent=title||'Muhurtham Chart';
    $('cpTa').textContent=codes.every(Boolean)?codes.map(k=>TA[k]).join('/'):'';
    const d=new Date(s+cfg.tz*3600000);
    $('cpDate').textContent=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getUTCDay()]+', '+fmtDate(s,cfg.tz);
    $('cpSub').textContent=GA.hms(s)+' – '+GA.hms(e)+' · lasts '+dur(e-s);
    GA.info(li);
    $('chartPop').classList.remove('hide'); $('chartPop').scrollTop=0;
    GA.at(0);
  },
  info(li){
    const q=c=>li?li.querySelector(c):null, pl=q('.pl'), chk=q('.chk'), pp=q('.p'), cu=q('details.lf-det'), box=$('cpInfo'), why=$('cpWhy');
    let h='';
    if(pl){const t=document.createElement('div'); t.innerHTML=pl.innerHTML; t.querySelectorAll('.pill').forEach(x=>{h+=x.outerHTML;});}
    const has=!!(chk||pp||cu);
    if(has)h+='<button type="button" class="cpdet" id="cpDet" aria-expanded="false" aria-controls="cpWhy"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8"/><path d="M10 9v5M10 6.2v.1"/></svg><span><span class="cpdl">Show Details</span><span class="ta">விவரம்</span></span></button>';
    box.innerHTML=h; box.classList.toggle('hide',!h);
    let w='';
    if(has){
      w='<div class="cpw-h"><div><b>Why this muhurtham</b><span class="ta">இந்த முகூர்த்தம் ஏன்</span></div><button type="button" class="xbtn" id="cpWhyX" aria-label="Close details"><svg viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12"/></svg></button></div>';
      if(pp)w+='<div class="cpw-p">'+pp.innerHTML+'</div>';
      if(chk)w+='<div class="cpw-b">'+chk.innerHTML+'</div>';
      if(cu)w+=cu.outerHTML.replace('<details','<details open');
    }
    why.innerHTML=w; why.classList.add('hide');
  },
  why(show){
    const w=$('cpWhy'), b=$('cpDet'); if(!b)return;
    if(show===undefined)show=w.classList.contains('hide');
    if(show){const hd=$('chartPop').querySelector('.sh-head'); w.style.setProperty('--top',(hd.offsetTop+hd.offsetHeight)+'px');}
    w.classList.toggle('hide',!show); b.setAttribute('aria-expanded',show?'true':'false'); const bl=b.querySelector('.cpdl'); if(bl)bl.textContent=show?'Hide Details':'Show Details';
    if(show){w.scrollTop=0; const x=$('cpWhyX'); if(x)x.focus({preventScroll:true});} else b.focus({preventScroll:true});
  },
  hms(ms){const d=new Date(ms+GA.cur.cfg.tz*3600000);return p2(d.getUTCHours())+':'+p2(d.getUTCMinutes())+':'+p2(d.getUTCSeconds());},
  at(f){
    const c=GA.cur; if(!c)return;
    const ms=Math.round(c.s+(c.e-c.s)*f), r=GA.render(ms,c.cfg);
    $('cpChart').innerHTML=r.svg; $('cpTable').innerHTML=r.tab;
    GA.fit();
  },
  fit(){
    const pop=$('chartPop'); if(pop.classList.contains('hide'))return;
    const cs=getComputedStyle(pop), padX=parseFloat(cs.paddingLeft)+parseFloat(cs.paddingRight);
    const W=pop.clientWidth-padX, head=pop.querySelector('.sh-head').offsetHeight;
    const H=pop.parentElement.clientHeight*0.92-head-36;
    if(W>=720){
      const S=Math.max(300,Math.floor(Math.min(H,(W-18)*0.47)));
      pop.style.setProperty('--S',S+'px'); pop.classList.add('wide');
    } else { pop.style.removeProperty('--S'); pop.classList.remove('wide'); }
  }
};
window.addEventListener('resize',()=>GA.fit());
['rgOut','cmOut','ltOut','mmOut','ckOut','m3Out','tpOut','mkOut'].forEach(id=>$(id).addEventListener('click',ev=>{
  if(ev.target.closest('details,summary,button,a,input,select'))return;
  const li=ev.target.closest('li.row[data-s]'); if(!li)return;
  GA.open(+li.dataset.s,+li.dataset.e,{lat:+li.dataset.lat,lon:+li.dataset.lon,kind:li.dataset.kind||$('ayan').value,tz:+li.dataset.tz},li);
}));
$('cpClose').addEventListener('click',()=>$('chartPop').classList.add('hide'));
$('chartPop').addEventListener('click',ev=>{
  if(ev.target.closest('#cpDet')){GA.why();return;}
  if(ev.target.closest('#cpWhyX')){GA.why(false);return;}
  const w=$('cpWhy'); if(!w.classList.contains('hide')&&$('chartPop').classList.contains('wide')&&!ev.target.closest('#cpWhy'))GA.why(false);
});
$('chartPop').addEventListener('keydown',ev=>{if(ev.key==='Escape'&&!$('cpWhy').classList.contains('hide')){ev.stopPropagation();GA.why(false);}},true);

/* ---------- v6.0: wiring of the chart style and language selectors ---------- */
function GA_REDRAW(){
  try{ if(!$('chartPanel').classList.contains('hide')){ if(LIVEON)liveTick(); else if(LASTCH)drawChart(LASTCH);} }catch(e){}
  try{ if(BP&&!$('bpPanel').classList.contains('hide'))bpCalc(); }catch(e){}
  try{ if(CU.on)cuspRefresh(true); }catch(e){}
  try{ if(CK&&!$('ckPanel').classList.contains('hide'))ckShow(); }catch(e){}
}
(function initV60(){
  document.querySelectorAll('select.langsel').forEach(s=>{I18N60.fill(s);s.addEventListener('change',()=>I18N60.set(s.value));});
  const STY=['chStyle60','bpStyle','cuStyle60'];
  STY.forEach(id=>{const s=$(id); if(!s||s.querySelector('option[value="west"]'))return; const bi=id==='bpStyle'; [['west','Western (wheel)'+(bi?' · மேற்கத்திய':'')],['all','All three charts'+(bi?' · மூன்றும்':'')]].forEach(o=>{const e=document.createElement('option'); e.value=o[0]; e.textContent=o[1]; s.appendChild(e);});});
  STY.forEach(id=>{const s=$(id); if(!s)return; s.value=CH60.style; s.addEventListener('change',()=>{CH60.style=s.value; STY.forEach(j=>{const o=$(j); if(o)o.value=CH60.style;}); GA_REDRAW();});});
  const th=$('gaTheme'); if(th){th.value=CH60.theme; th.addEventListener('change',()=>{CH60.theme=th.value; GA_REDRAW();});}
  I18N60.hooks.push(GA_REDRAW);
  if(CH60.lang!=='bi')I18N60.apply();
})();
window.GA_PL=()=>PL_NAME;

})();
