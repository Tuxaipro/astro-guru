
/* ---------- Alarm bell on every muhurtham (v3.5) ----------
   Puts an alarm-clock button on each timing row (All, GMP 3,11, Muhurtham Part 1,
   Muhurtham on Rules, Date-Range, Chandra). Tapping it adds that one muhurtham
   to the phone Calendar as an alarm, using the same .ics method as "Add to Calendar". */
(function(){
"use strict";
var scr=document.getElementById('screen');
if(!scr)return;
var DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
    MO=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function $(id){return document.getElementById(id);}
function p2(n){return (n<10?'0':'')+n;}
function lg(k,d){try{var v=localStorage.getItem(k);return v===null?d:v;}catch(e){return d;}}
function ls(k,v){try{localStorage.setItem(k,v);}catch(e){}}

var SV='<svg viewBox="0 0 24 24" aria-hidden="true">';
var ICON=SV+'<circle cx="12" cy="13.4" r="7.2"/><path d="M12 9.6v4l2.7 1.8M4.2 5.4l3-2.3M19.8 5.4l-3-2.3"/></svg>';
var ICON_OK=SV+'<circle cx="12" cy="13.4" r="7.2"/><path d="M8.7 13.7l2.4 2.4 4.3-4.8M4.2 5.4l3-2.3M19.8 5.4l-3-2.3"/></svg>';

/* timings whose alarm file has already been made (remembered, so the bell stays filled) */
var DONE={};
try{(JSON.parse(lg('gaBellDone','[]'))||[]).forEach(function(k){DONE[k]=1;});}catch(e){}
function saveDone(){var a=Object.keys(DONE); if(a.length>400)a=a.slice(a.length-400); ls('gaBellDone',JSON.stringify(a));}

/* ---------- read one timing out of its row ---------- */
function own(el){                       // the element's own text, without nested blocks
  if(!el)return '';
  var s='';
  el.childNodes.forEach(function(n){
    if(n.nodeType===3)s+=n.nodeValue;
    else if(n.nodeType===1&&n.classList.contains('tm'))s+=n.textContent;
  });
  return s.replace(/\s+/g,' ').trim();
}
function ctxOf(li){
  if(li.closest('#gmpList'))return {label:'GMP 3,11',add:true};
  if(li.closest('#anaList'))return {label:'Muhurtham Part 1',add:true};
  if(li.closest('#rulList'))return {label:'Muhurtham on Rules',add:true};
  if(li.closest('#cmOut'))return {label:'Chandra Muhurtham',add:false};
  if(li.closest('#rgOut'))return {label:'Auspicious lagna muhurtham',add:false};
  if(li.closest('#ltOut'))return {label:'Lottery timing',add:true};
  if(li.closest('#mmOut'))return {label:'Money manifestation',add:false};
  if(li.closest('#ckOut'))return {label:'Cricket timing',add:true};
  if(li.closest('#m3Out'))return {label:'3 11 Muhurtham',add:true};
  if(li.closest('#tpOut'))return {label:'Trade profit muhurtham',add:true};
  if(li.closest('#mkOut'))return {label:'Market transit',add:true};
  if(li.closest('#mpOut'))return {label:'Money profit muhurtham',add:true};
  if(li.closest('#spOut'))return {label:'Speculation timing',add:true};
  return {label:'Lagna timing',add:true};
}
function hash(t){var h=5381,i;for(i=0;i<t.length;i++)h=((h<<5)+h+t.charCodeAt(i))|0;return (h>>>0).toString(36);}
function info(li){
  var s=+(li.dataset.s||li.dataset.ms), e=+li.dataset.e, tz=parseFloat(li.dataset.tz);
  if(!(e>s))e=s+60000;
  var c=ctxOf(li), en=[], ta=[];
  li.querySelectorAll('.pill').forEach(function(p){
    var t=p.textContent.replace(/\s+/g,' ').trim().split(' · '), a=(t[0]||'').trim();
    if(/^(best )?rules met|^matches?\b/i.test(a))return;
    if(a&&en.indexOf(a)<0){en.push(a);ta.push((t[1]||'').trim());}
  });
  var names=en.slice();
  if(c.add&&!names.some(function(x){return x.toLowerCase()===c.label.toLowerCase();}))names.unshift(c.label);
  if(!names.length)names=[c.label];
  var n=li.querySelector('.n'), lagna=own(li.querySelector('.l .c'));
  if(!lagna){var ps=li.querySelector('.p span'), pt=ps?ps.textContent:''; if(/ascendant/.test(pt))lagna=pt.split(' · ')[0].trim();}
  var latEl=$('lat'), lonEl=$('lon');
  return {s:s,e:e,tz:tz,names:names,title:names.slice(0,3).join(' · '),all:names.join(' · '),
    nm:n?n.textContent.trim():'',tl:own(li.querySelector('.l .ta')),lagna:lagna,
    lat:li.dataset.lat||(latEl?latEl.value:''),lon:li.dataset.lon||(lonEl?lonEl.value:''),
    key:Math.round(s)+'|'+names.join('|')};
}
function fmt(ms,tz){
  var d=new Date(ms+tz*3600000);
  return {day:DOW[d.getUTCDay()]+', '+d.getUTCDate()+' '+MO[d.getUTCMonth()]+' '+d.getUTCFullYear(),
          t:p2(d.getUTCHours())+':'+p2(d.getUTCMinutes())+':'+p2(d.getUTCSeconds()),
          f:''+d.getUTCFullYear()+p2(d.getUTCMonth()+1)+p2(d.getUTCDate())+'-'+p2(d.getUTCHours())+p2(d.getUTCMinutes())};
}

/* ---------- one-event calendar file (same format as the Add All export) ---------- */
function esc(t){return String(t).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');}
function fold(line){
  var enc=new TextEncoder(), out=[], cur='', bytes=0, i, ch, b;
  for(ch of line){
    b=enc.encode(ch).length;
    if(bytes+b>74){out.push(cur);cur=' '+ch;bytes=1+b;} else {cur+=ch;bytes+=b;}
  }
  out.push(cur); return out.join('\r\n');
}
function stamp(ms){
  var d=new Date(ms);
  return d.getUTCFullYear()+p2(d.getUTCMonth()+1)+p2(d.getUTCDate())+'T'+p2(d.getUTCHours())+p2(d.getUTCMinutes())+p2(d.getUTCSeconds())+'Z';
}
function icsText(ev,lead){
  var A=fmt(ev.s,ev.tz), B=fmt(ev.e,ev.tz), tzs='UTC '+(ev.tz>=0?'+':'')+ev.tz;
  var desc=[ev.all,ev.nm,ev.tl,ev.lagna,A.day+' · '+A.t+' to '+B.t+' ('+tzs+')','Lat '+ev.lat+', Lon '+ev.lon,'GuruAgasthiya'].filter(Boolean).join('\n');
  var tail=ev.nm?' · '+ev.nm:'';
  var L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//GuruAgasthiya//Muhurtham Alarms//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH',
    'BEGIN:VEVENT','UID:ga-'+Math.round(ev.s)+'-'+hash(ev.key)+'@guruagasthiya','DTSTAMP:'+stamp(Date.now()),
    'DTSTART:'+stamp(ev.s),'DTEND:'+stamp(ev.e),'SUMMARY:'+esc('\uD83D\uDD14 '+ev.title+tail),'DESCRIPTION:'+esc(desc),'TRANSP:TRANSPARENT'];
  if(lead>0)L.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+esc(ev.title+' starts in '+lead+' min'+tail),'TRIGGER:-PT'+lead+'M','END:VALARM');
  L.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+esc(ev.title+' now'+tail),'TRIGGER:PT0S','END:VALARM','END:VEVENT','END:VCALENDAR');
  return L.map(fold).join('\r\n')+'\r\n';
}

/* ---------- alarm state ---------- */
function K(){return window.GA_ALARM?GA_ALARM.kind():'';}
function aid(ev,suffix){return 'ga'+hash(ev.key)+'-'+Math.round(ev.s/1000)+(suffix||'');}
function isOn(ev){
  if(!(ev.s>Date.now()))return false;
  var h=window.GA_ALARM?GA_ALARM.has(aid(ev)):null;
  if(h===null)return !!DONE[ev.key];
  return !!h;
}
function purpose(){var v=lg('gaAlmFor',''); return v==='other'?(lg('gaAlmForTxt','')||'').trim():v;}
function words(ev,pur,lead){
  var A=fmt(ev.s,ev.tz), B=fmt(ev.e,ev.tz), kindName=ev.names.slice(0,2).join(' · ');
  var title=(lead>0?'⏰ In '+lead+' min · ':'🔔 ')+kindName;
  var text=[pur?'For: '+pur:'',ev.lagna,A.t+' to '+B.t+' · '+A.day,ev.nm,ev.names.slice(2).join(' · ')].filter(Boolean).join('\n');
  var speak=ev.names.slice(0,2).join(', ')+(ev.lagna?'. '+ev.lagna.replace(/\s*·.*$/,''):'')+(pur?'. For '+pur:'')+(lead>0?'. Starts in '+lead+' minutes.':'. Starts now.');
  return {title:title,text:text,speak:speak};
}

/* ---------- the bell: one tap = alarm ON / OFF ---------- */
function mark(b,on){
  b.classList.toggle('done',on);
  b.setAttribute('aria-pressed',String(on));
  b.innerHTML=on?ICON_OK:ICON;
  var t=on?'Alarm ON. Tap to switch it off. Press and hold to change what it is for.':'Alarm OFF. Tap to switch it on. Press and hold to choose what it is for.';
  b.setAttribute('aria-label',t); b.title=t;
}
function markKey(key,on){
  document.querySelectorAll('.rbell').forEach(function(b){if(b.dataset.k===key)mark(b,on);});
}
function addBell(root){
  if(!root||root.nodeType!==1)return;
  var rows=root.matches&&root.matches('li.row')?[root]:[].slice.call(root.querySelectorAll?root.querySelectorAll('li.row'):[]);
  rows.forEach(function(li){
    if(li.classList.contains('bad')||li.querySelector(':scope > .rbell'))return;
    var s=+(li.dataset.s||li.dataset.ms), tz=parseFloat(li.dataset.tz);
    if(!s||isNaN(tz))return;
    var ev=info(li), b=document.createElement('button');
    b.type='button'; b.className='rbell'; b.dataset.k=ev.key;
    mark(b,isOn(ev));
    if(ev.e<=Date.now())b.classList.add('past');
    li.appendChild(b);
  });
}

/* ---------- toast (with an optional action) ---------- */
var dlg=null, sel, hint, btnAdd, btnCancel, btnDel, toast, toastT, cur=null, openBtn=null;
function say(t,label,fn){
  if(!toast){
    toast=document.createElement('div'); toast.className='abk-toast hide';
    toast.setAttribute('role','status'); toast.setAttribute('aria-live','polite'); scr.appendChild(toast);
  }
  toast.textContent=t;
  if(label){var a=document.createElement('button'); a.type='button'; a.className='abk-ta2'; a.textContent=label; a.addEventListener('click',function(){toast.classList.add('hide');fn();}); toast.appendChild(a);}
  toast.classList.remove('hide');
  clearTimeout(toastT); toastT=setTimeout(function(){toast.classList.add('hide');},label?9000:6000);
}

/* ---------- switch on / off ---------- */
function setOn(ev,lead,pur,cb){
  var now=Date.now();
  if(ev.e<=now){say('This muhurtham is already over.');return;}
  if(ev.s<=now+3000){say('This muhurtham has already started, so there is no start time left to ring.');return;}
  var w=words(ev,pur,0), jobs=[GA_ALARM.set(aid(ev),ev.s,w.title,w.text,w.speak)];
  if(lead>0&&ev.s-lead*60000>now+3000){var p=words(ev,pur,lead); jobs.push(GA_ALARM.set(aid(ev,'p'),ev.s-lead*60000,p.title,p.text,p.speak));}
  else GA_ALARM.cancel(aid(ev,'p'));
  Promise.all(jobs).then(function(r){
    if(r.every(Boolean)){DONE[ev.key]=1; saveDone(); markKey(ev.key,true); if(cb)cb(true);}
    else{say('The alarm could not be set. Please allow notifications and alarms for GuruAgasthiya, then try again.'); if(cb)cb(false);}
  });
}
function setOff(ev,cb){
  Promise.all([GA_ALARM.cancel(aid(ev)),GA_ALARM.cancel(aid(ev,'p'))]).then(function(){
    delete DONE[ev.key]; saveDone(); markKey(ev.key,false); if(cb)cb();
  });
}
function toggle(b){
  var li=b.closest('li.row'); if(!li)return;
  var ev=info(li);
  if(isOn(ev)){setOff(ev,function(){say('Alarm OFF for '+ev.names.slice(0,2).join(', ')+'.');});return;}
  var lead=0, pur=purpose();
  setOn(ev,lead,pur,function(ok){
    if(!ok)return;
    var A=fmt(ev.s,ev.tz), k=K();
    say('Alarm ON for '+A.t+' on '+A.day+' ('+ev.names.slice(0,2).join(', ')+(pur?' · '+pur:'')+'). '+
        (k==='web'?'It rings while this page is open.':'It rings with a melody even if the app is closed.'),'What is it for?',function(){openFor(b);});
  });
}

/* ---------- the "Alarm options" dialog (press and hold the bell) ---------- */
var FOR=[['','As listed'],['Business start or shop opening','Business or shop start'],['Investment or shares','Investment or shares'],['Signing an agreement','Signing agreement'],['Loan, lending or repayment','Loan or lending'],['Buying or selling','Buying or selling'],['Lottery or speculation ticket','Lottery ticket'],['Starting a journey','Starting a journey'],['Prayer or pooja','Prayer or pooja'],['other','Other (type it)']];
function mk(){
  if(dlg)return;
  dlg=document.createElement('div');
  dlg.className='abk hide'; dlg.setAttribute('role','dialog'); dlg.setAttribute('aria-modal','true'); dlg.setAttribute('aria-labelledby','abkT');
  dlg.innerHTML=
    '<div class="abk-scrim"></div>'+
    '<div class="abk-card">'+
      '<div class="abk-h"><span class="abk-ic">'+ICON+'</span><div><h2 id="abkT">Alarm</h2><span class="tt">அலாரம்</span></div></div>'+
      '<div class="abk-sum"><span class="abk-t" id="abkTitle"></span><span class="abk-s" id="abkWhen"></span><span class="abk-n" id="abkNm"></span><span class="abk-ta" id="abkTa"></span><span class="abk-l" id="abkLag"></span></div>'+
      '<div class="abk-r"><label for="abkFor">This muhurtham is for</label><select id="abkFor">'+FOR.map(function(o){return '<option value="'+o[0]+'">'+o[1]+'</option>';}).join('')+'</select></div>'+
      '<div class="abk-r hide" id="abkForRow"><label for="abkForTxt">Alarm says</label><input id="abkForTxt" maxlength="40" placeholder="e.g. Open new account" autocomplete="off"></div>'+
      '<div class="abk-r"><label for="abkLead">Remind me</label><select id="abkLead"><option value="0" selected>Exact start: 2 melodies (+1 melody 2 min before)</option></select></div>'+
      '<p class="abk-hint" id="abkHint" role="status"></p>'+
      '<p class="abk-mode" id="abkMode"></p>'+
      '<button type="button" class="abk-lnk" id="abkTest">Test the alarm now (rings in 10 seconds)</button>'+
      '<button type="button" class="abk-lnk" id="abkIcs">Also save a Calendar file</button>'+
      '<div class="abk-b"><button type="button" id="abkCancel">Close</button><button type="button" class="danger hide" id="abkDel">Turn off</button><button type="button" class="primary" id="abkAdd">Alarm ON</button></div>'+
    '</div>';
  scr.appendChild(dlg);
  sel=$('abkLead'); hint=$('abkHint'); btnAdd=$('abkAdd'); btnCancel=$('abkCancel'); btnDel=$('abkDel');
  dlg.querySelector('.abk-scrim').addEventListener('click',close);
  btnCancel.addEventListener('click',close);
  btnAdd.addEventListener('click',add);
  btnDel.addEventListener('click',function(){if(!cur)return; var ev=cur; setOff(ev,function(){close(); say('Alarm OFF.');});});
  $('abkTest').addEventListener('click',function(){
    GA_ALARM.test().then(function(ok){say(ok?'Test alarm set: it rings in 10 seconds.':'The test alarm could not be set.');});
  });
  $('abkIcs').addEventListener('click',icsAdd);
  sel.addEventListener('change',function(){
    ls('gaAlmLead',sel.value);                       // shared with the main Early reminder setting
    var m=$('almLead');
    if(m&&m.value!==sel.value){m.value=sel.value; try{m.dispatchEvent(new Event('change'));}catch(e){}}
    upHint();
  });
  $('abkFor').addEventListener('change',function(){ls('gaAlmFor',$('abkFor').value);$('abkForRow').classList.toggle('hide',$('abkFor').value!=='other');});
  $('abkForTxt').addEventListener('input',function(){ls('gaAlmForTxt',$('abkForTxt').value);});
}
function upHint(){
  if(!cur)return;
  var now=Date.now(), lead=0, msg='', bad=false;
  if(cur.e<=now){msg='This muhurtham is already over.';bad=true;}
  else if(cur.s<=now+3000){msg='This muhurtham has already started, so there is no start time left to ring.';bad=true;}
  else if(lead>0&&cur.s-lead*60000<=now){msg='The '+lead+'-minute early reminder time has already passed. The alert at the start will still ring.';}
  hint.textContent=msg; hint.classList.toggle('err',bad); btnAdd.disabled=bad;
}
function openFor(btn){
  var li=btn.closest('li.row'); if(!li)return;
  mk(); cur=info(li); openBtn=btn;
  var A=fmt(cur.s,cur.tz), B=fmt(cur.e,cur.tz);
  $('abkTitle').textContent=cur.title;
  $('abkWhen').textContent=A.day+' · '+A.t+' to '+B.t;
  $('abkNm').textContent=cur.nm;
  $('abkTa').textContent=cur.tl;
  $('abkLag').textContent=cur.lagna;
  var m=$('almLead'); sel.value=m?m.value:lg('gaAlmLead','0'); if(sel.selectedIndex<0)sel.value='0';
  $('abkFor').value=lg('gaAlmFor',''); if($('abkFor').selectedIndex<0)$('abkFor').value='';
  $('abkForTxt').value=lg('gaAlmForTxt',''); $('abkForRow').classList.toggle('hide',$('abkFor').value!=='other');
  var k=K(), on=isOn(cur);
  $('abkMode').textContent=k==='web'
    ?'A melody plays 2 times, then the alarm fades out by itself; the ascendant and purpose show on screen while this page is open. The Android and Windows apps also ring when closed.'
    :'A melody plays 2 times, then the alarm fades out by itself; the ascendant and purpose show on screen, even when the app is closed and offline.';
  btnDel.classList.toggle('hide',!on);
  btnAdd.textContent=on?'Update alarm':'Alarm ON';
  upHint();
  dlg.classList.remove('hide');
  setTimeout(function(){try{(btnAdd.disabled?btnCancel:btnAdd).focus({preventScroll:true});}catch(e){}},40);
}
function close(){
  if(!dlg||dlg.classList.contains('hide'))return;
  dlg.classList.add('hide'); cur=null;
  if(openBtn){try{openBtn.focus({preventScroll:true});}catch(e){} openBtn=null;}
}
function add(){
  if(!cur)return;
  if(cur.e<=Date.now()||cur.s<=Date.now()+3000){upHint();return;}
  var ev=cur, lead=0, pur=purpose();
  setOn(ev,lead,pur,function(ok){
    if(!ok)return;
    close(); var A=fmt(ev.s,ev.tz);
    say('Alarm ON for '+A.t+' on '+A.day+(pur?' · '+pur:'')+'.');
  });
}
function icsAdd(){
  if(!cur)return;
  var ev=cur, lead=2, res;
  try{res=icsText(ev,lead);}catch(e){hint.textContent='Could not prepare the file: '+e.message;hint.classList.add('err');return;}
  close();
  window.GA_CAL(res,'GuruAgasthiya-Alarm-'+fmt(ev.s,ev.tz).f+'.ics',ev.title).then(function(how){say(window.GA_CAL_MSG(how,1));});
}

/* ---------- wiring ---------- */
/* capture phase: the bell must not also open the row's chart pop-up */
var lpTimer=null, lpFired=false;
document.addEventListener('pointerdown',function(ev){
  var b=ev.target.closest&&ev.target.closest('.rbell'); if(!b)return;
  lpFired=false; clearTimeout(lpTimer);
  lpTimer=setTimeout(function(){lpFired=true; openFor(b);},550);
},true);
['pointerup','pointercancel','pointerleave','scroll'].forEach(function(n){document.addEventListener(n,function(){clearTimeout(lpTimer);},true);});
document.addEventListener('contextmenu',function(ev){
  var b=ev.target.closest&&ev.target.closest('.rbell'); if(!b)return;
  ev.preventDefault(); ev.stopPropagation(); clearTimeout(lpTimer); lpFired=true; openFor(b);
},true);
document.addEventListener('click',function(ev){
  var b=ev.target.closest&&ev.target.closest('.rbell');
  if(!b)return;
  ev.stopPropagation(); ev.preventDefault();
  if(lpFired){lpFired=false;return;}
  toggle(b);
},true);
document.addEventListener('keydown',function(ev){
  if(!dlg||dlg.classList.contains('hide'))return;
  if(ev.key==='Escape'){ev.stopPropagation();ev.preventDefault();close();}
  else if(ev.key==='Tab'){
    var f=[$('abkFor'),sel,btnCancel,btnAdd].filter(function(x){return !x.disabled;}), i=f.indexOf(document.activeElement);
    if(!f.length)return;
    if(ev.shiftKey&&i<=0){ev.preventDefault();f[f.length-1].focus();}
    else if(!ev.shiftKey&&(i<0||i===f.length-1)){ev.preventDefault();f[0].focus();}
  }
},true);
addBell(document.body);
new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(addBell);});}).observe(document.body,{childList:true,subtree:true});
})();
