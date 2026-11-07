
/* v4.10: the Mobile / Desktop switch lives at the foot of the sidebar on the desktop view */
(function(){
var stage=document.getElementById('stage'), vs=stage.querySelector('.viewswitch'), foot=document.querySelector('.side .sidefoot'), dev=document.getElementById('device');
if(!vs||!foot||!dev)return;
vs.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-label',(b.dataset.v==='mobile'?'Mobile':'Desktop')+' view');});
function place(){
  if(stage.dataset.view==='desktop'){ if(vs.parentNode!==foot)foot.appendChild(vs); }
  else if(vs.parentNode!==stage){ stage.insertBefore(vs,dev); }
}
new MutationObserver(place).observe(stage,{attributes:true,attributeFilter:['data-view']});
place();
})();
