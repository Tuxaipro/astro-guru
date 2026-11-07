
/* v4.9: hover label for the sidebar tools (shown when the sidebar is icon-only) */
(function(){
var stage=document.getElementById('stage'), tip=document.createElement('div');
tip.className='tiptool'; tip.setAttribute('aria-hidden','true'); tip.innerHTML='<b></b><span></span>'; document.body.appendChild(tip);
var cur=null;
function show(b){
  if(stage.dataset.view!=='desktop'){hide();return;}
  var tx=b.querySelector('.tx'); if(!tx)return;
  if(tx.offsetWidth>2){hide();return;}            /* names already visible in the wide sidebar */
  var tm=tx.querySelector('.tm');
  tip.firstChild.textContent=tx.firstChild.textContent.trim(); tip.lastChild.textContent=tm?tm.textContent.trim():'';
  var r=(b.querySelector('.ic')||b).getBoundingClientRect();
  tip.style.left=(r.right+14)+'px'; tip.style.top=(r.top+r.height/2)+'px';
  tip.classList.add('on'); cur=b;
}
function hide(){tip.classList.remove('on'); cur=null;}
document.querySelectorAll('.side .tool').forEach(function(b){
  var tx=b.querySelector('.tx'); if(tx&&b.title){b.setAttribute('aria-label',b.title);} b.removeAttribute('title');
  b.addEventListener('mouseenter',function(){setTimeout(function(){if(b.matches(':hover'))show(b);},60);});
  b.addEventListener('mouseleave',hide);
  b.addEventListener('focus',function(){if(b.matches(':focus-visible'))show(b);});
  b.addEventListener('blur',hide);
  b.addEventListener('click',hide);
});
var sd=document.querySelector('.side'); if(sd)sd.addEventListener('scroll',hide,{passive:true});
window.addEventListener('resize',hide);
})();
