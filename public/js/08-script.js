(function(){
  var D=document;
  function txt(e){ return (e.textContent||'').replace(/\s+/g,' ').trim(); }
  function name(e){
    if(e.getAttribute('aria-label')||e.getAttribute('aria-labelledby'))return;
    var n=e.getAttribute('title')||e.getAttribute('placeholder')||'';
    if(!n&&e.id){ var l=D.querySelector('label[for="'+e.id+'"]'); if(l)n=txt(l); }
    if(!n){ var p=e.closest('label'); if(p)n=txt(p); }
    if(!n){ var pv=e.previousElementSibling; if(pv&&/^(LABEL|SPAN|B|STRONG)$/.test(pv.tagName))n=txt(pv); }
    if(!n&&e.parentElement){ var pl=e.parentElement.querySelector('label,.lb,b'); if(pl&&pl!==e)n=txt(pl); }
    if(!n&&e.id)n=e.id.replace(/([a-z])([A-Z0-9])/g,'$1 $2');
    if(n)e.setAttribute('aria-label',n.slice(0,80));
  }
  function pass(root){
    root=root||D;
    root.querySelectorAll('button,[role=button]').forEach(function(b){ if(!txt(b)&&!b.getAttribute('aria-label'))name(b); });
    root.querySelectorAll('input:not([type=hidden]),select,textarea').forEach(function(i){ if(!i.labels||!i.labels.length)name(i); });
    root.querySelectorAll('svg').forEach(function(s){ if(!s.getAttribute('role')&&!s.getAttribute('aria-hidden')){ var t=s.querySelector('title'); if(t){ s.setAttribute('role','img'); s.setAttribute('aria-label',txt(t)); } else if(txt(s).length>8){ s.setAttribute('role','img'); s.setAttribute('aria-label',txt(s).slice(0,160)); } else s.setAttribute('aria-hidden','true'); } });
    root.querySelectorAll('canvas').forEach(function(c){ if(!c.getAttribute('role')){ c.setAttribute('role','img'); if(!c.getAttribute('aria-label'))c.setAttribute('aria-label','Chart'); } });
    root.querySelectorAll('th:not([scope])').forEach(function(t){ t.setAttribute('scope',t.parentElement&&t.parentElement.parentElement&&t.parentElement.parentElement.tagName==='TBODY'&&t===t.parentElement.firstElementChild?'row':'col'); });
    root.querySelectorAll('[onclick]:not(button):not(a):not(input):not(select)').forEach(function(e){ if(!e.getAttribute('role')){ e.setAttribute('role','button'); if(e.tabIndex<0)e.tabIndex=0; if(!e.__ak){ e.__ak=1; e.addEventListener('keydown',function(ev){ if(ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); e.click(); } }); } name(e); } });
    root.querySelectorAll('[id$="Out"],[id$="Res"],[id$="Result"],.res,.msg,#toast').forEach(function(o){ if(!o.getAttribute('aria-live')&&!o.closest('#akLog')){ o.setAttribute('aria-live','polite'); } });
    root.querySelectorAll('.tblwrap,.scroll,[style*="overflow"]').forEach(function(w){ if(w.scrollWidth>w.clientWidth+4&&!w.hasAttribute('tabindex')){ w.tabIndex=0; if(!w.getAttribute('role')){ w.setAttribute('role','region'); w.setAttribute('aria-label','Scrollable table'); } } });
  }
  function lang(){
    try{ var s=D.getElementById('gaLang'); var v=s&&s.value; if(v&&v!=='en'&&v!=='auto'&&v!=='bi'&&/^[a-z]{2,3}(-[A-Za-z]+)?$/.test(v)){ D.documentElement.lang=v; D.documentElement.dir=/^(ar|fa|ur|he)$/.test(v)?'rtl':'ltr'; } else { D.documentElement.lang='en'; D.documentElement.dir='ltr'; } }catch(e){}
  }
  function init(){
    if(!D.querySelector('.gaskip')){ var a=D.createElement('a'); a.className='gaskip'; a.href='#'; a.textContent='Skip to main content'; a.addEventListener('click',function(e){ e.preventDefault(); var m=D.querySelector('main,#app,.wrap,.tabs,nav'); var t=D.querySelector('main')||D.querySelector('[role=tabpanel]:not([hidden])')||D.body; t.tabIndex=-1; t.focus(); }); D.body.insertBefore(a,D.body.firstChild); }
    var pn=D.getElementById('akPanel'); if(pn){ pn.setAttribute('role','dialog'); pn.setAttribute('aria-label','Ask GuruAgasthiya'); pn.setAttribute('aria-modal','false'); }
    var t=D.getElementById('akBtn'); if(t&&!t.getAttribute('aria-label'))t.setAttribute('aria-label','Ask GuruAgasthiya, open the chat');
    lang(); pass(D);
    var tm=0; new MutationObserver(function(){ clearTimeout(tm); tm=setTimeout(function(){ pass(D); lang(); },400); }).observe(D.body,{childList:true,subtree:true});
    D.addEventListener('change',function(e){ if(e.target&&e.target.id==='gaLang')setTimeout(lang,100); });
    D.addEventListener('keydown',function(e){
      if(e.key==='Escape'){ var p=D.getElementById('akPanel'); if(p&&!p.classList.contains('hide')){ var c=D.getElementById('akClose'); if(c){ c.click(); var b=D.getElementById('akBtn'); if(b)b.focus(); } } }
    });
  }
  if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',init); else setTimeout(init,300);
})();