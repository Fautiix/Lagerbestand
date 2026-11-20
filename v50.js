/* V50 – Gemeinsame Material-Nachbestellungen (Layout überarbeitet) */
let v50Reorders=[],v50OrdersError='',v50OrdersBusy=false;
async function v50LoadOrders(){
 try{
  v50Reorders=await supabase('material_reorders?select=id,material_id,material_name,material_number,employee_user_id,employee_name,status,created_at,ordered_at&order=created_at.desc&limit=1000');
  v50OrdersError='';
 }catch(e){v50OrdersError=e.message;v50Reorders=[];console.warn('V50 Nachbestellungen:',e.message);}
 v50OrderBadge();
}
function v50OrderBadge(){
 const open=v50Reorders.filter(x=>x.status==='offen').length;
 document.querySelectorAll('[data-v50-count]').forEach(el=>{el.textContent=open;el.hidden=!open;});
 const e=document.getElementById('v50ReviewCount');if(e)e.textContent=open;
}
let v50Filter='offen',v50Term='';
(function(){if(document.getElementById('v50-orders-style2'))return;const st=document.createElement('style');st.id='v50-orders-style2';st.textContent=`
#nachbestellen{max-width:860px}
.v50-wrap{display:grid;gap:16px}
.v50-stats{display:flex;gap:8px;flex-wrap:wrap}
.v50-stat{background:var(--surface2,#162031);border:1px solid var(--line,#1F2A3C);border-radius:12px;padding:8px 14px;font-size:13px;color:var(--muted,#9AA6B8)}
.v50-stat b{display:block;font-size:20px;color:var(--text,#eef4fb);font-weight:700}
.v50-search{position:relative}
.v50-search input{width:100%;min-height:48px;box-sizing:border-box;padding:0 14px 0 42px;border-radius:12px;border:1px solid var(--line2,#2A3750);background:var(--surface2,#162031);color:inherit;font-size:16px}
.v50-search input:focus{outline:none;border-color:var(--accent,#6E9BFF);box-shadow:0 0 0 3px var(--accent-soft,rgba(110,155,255,.13))}
.v50-search svg{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--muted,#9AA6B8)}
.v50-results{display:grid;gap:6px;margin-top:10px}
.v50-item{display:flex;align-items:center;gap:12px;padding:11px 12px;border:1px solid var(--line,#1F2A3C);border-radius:12px;background:var(--surface,#111926)}
.v50-item-main{flex:1;min-width:0}
.v50-item-name{font-weight:600;font-size:15px;overflow-wrap:anywhere}
.v50-item-sub{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:3px;font-size:12.5px;color:var(--muted,#9AA6B8)}
.v50-mnr{font-family:ui-monospace,Menlo,monospace;font-size:12px;background:var(--surface2,#162031);border:1px solid var(--line2,#2A3750);border-radius:6px;padding:1px 6px;color:var(--text,#eef4fb)}
.v50-add{min-height:38px;padding:0 14px;border-radius:10px;border:1px solid var(--accent-strong,#3567E0);background:var(--accent-strong,#3567E0);color:#fff;font-weight:600;font-size:14px;cursor:pointer;white-space:nowrap}
.v50-add:disabled{background:transparent;border-color:var(--line2,#2A3750);color:var(--muted,#9AA6B8);cursor:default}
.v50-tick{min-height:38px;padding:0 12px;border-radius:10px;border:1px solid rgba(76,201,148,.45);background:var(--ok-soft,rgba(76,201,148,.12));color:var(--ok,#4CC994);font-weight:600;font-size:13.5px;cursor:pointer;white-space:nowrap}
.v50-hint{font-size:13px;color:var(--muted,#9AA6B8);padding:6px 2px}
.v50-tabs{display:inline-flex;gap:4px;padding:4px;border-radius:12px;background:var(--surface2,#162031);border:1px solid var(--line,#1F2A3C)}
.v50-tabs button{border:0;background:transparent;color:var(--muted,#9AA6B8);padding:7px 12px;border-radius:9px;font-size:13.5px;font-weight:600;cursor:pointer}
.v50-tabs button.on{background:var(--surface,#111926);color:var(--text,#eef4fb);box-shadow:0 1px 0 var(--line2,#2A3750)}
.v50-item.done{opacity:.62}
@media(max-width:560px){.v50-item{flex-wrap:wrap}.v50-item .v50-add,.v50-item .v50-tick{width:100%}}
`;document.head.append(st);})();
function v50Mnr(n){return n?'<span class="v50-mnr">M'+escapeHtml(String(n).replace(/^M/i,''))+'</span>':'';}
function v50Date(s){try{return new Date(s).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});}catch{return ''}}
function v50CanTick(){return !!(isMeister||isAdmin);}
function v50OrderItem(o,tick){
 const done=o.status==='bestellt';
 return '<div class="v50-item'+(done?' done':'')+'"><div class="v50-item-main"><div class="v50-item-name">'+escapeHtml(o.material_name)+'</div><div class="v50-item-sub">'+v50Mnr(o.material_number)+'<span>'+escapeHtml(o.employee_name)+' · '+v50Date(o.created_at)+'</span>'+(done?'<span class="v50-pill done">✓ Bestellt'+(o.ordered_at?' '+v50Date(o.ordered_at):'')+'</span>':'<span class="v50-pill">Offen</span>')+'</div></div>'+(tick&&!done?'<button type="button" class="v50-tick" data-v50-order="'+o.id+'">✓ Bestellt</button>':'')+'</div>';
}
function v50ResultsHtml(){
 const term=v50Term.trim().toLocaleLowerCase('de').replace(/^m(?=\d)/,'');
 if(!term)return '<div class="v50-hint">Namen oder M-Nummer eintippen, dann auf „Melden“ tippen.</div>';
 const openIds=new Set(v50Reorders.filter(x=>x.status==='offen').map(x=>String(x.material_id)));
 const hits=materials.filter(m=>String(m.name||'').toLocaleLowerCase('de').includes(term)||String(m.material_number||'').toLocaleLowerCase('de').replace(/^m/,'').includes(term))
  .sort((a,b)=>a.name.localeCompare(b.name,'de')).slice(0,8);
 if(!hits.length)return '<div class="v50-hint">Kein Material gefunden.</div>';
 return hits.map(m=>{const open=openIds.has(String(m.id));return '<div class="v50-item"><div class="v50-item-main"><div class="v50-item-name">'+escapeHtml(m.name)+'</div><div class="v50-item-sub">'+(v50Mnr(m.material_number)||'<span>Keine M-Nummer</span>')+'</div></div><button type="button" class="v50-add" data-v50-add="'+escapeHtml(String(m.id))+'"'+(open?' disabled>Bereits gemeldet':'>+ Melden')+'</button></div>';}).join('');
}
function v50BindResults(root){root.querySelectorAll('[data-v50-add]').forEach(b=>b.onclick=()=>v50AddOrder(b.dataset.v50Add));}
function v50RenderOrders(){
 const root=document.getElementById('nachbestellen');if(!root)return;
 if(v50OrdersError){
 root.innerHTML='<div class="card"><h2>Material nachbestellen</h2><p class="muted">Die Nachbestellliste konnte nicht geladen werden. Bitte Verbindung prüfen und erneut laden.</p><p class="muted">'+escapeHtml(v50OrdersError)+'</p><button class="btn" onclick="v50OpenOrders()">Erneut laden</button></div>';return;
 }
 const open=v50Reorders.filter(x=>x.status==='offen'),done=v50Reorders.filter(x=>x.status==='bestellt');
 const list=v50Filter==='offen'?open:v50Filter==='bestellt'?done:v50Reorders;
 const tick=v50CanTick();
 root.innerHTML='<div class="v50-wrap"><div class="v38-pagehead"><div><h1>Material nachbestellen</h1><p>Fehlt etwas im Lager? Kurz melden – der E-Meister bestellt nach.</p></div><div class="v50-stats"><div class="v50-stat"><b>'+open.length+'</b>offen</div><div class="v50-stat"><b>'+done.length+'</b>bestellt</div></div></div>'+
 '<div class="card"><h2 style="margin-top:0">Material melden</h2><div class="v50-search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="search" id="v50MaterialSearch" placeholder="z. B. NYM 3x1,5 oder M1234" autocomplete="off" value="'+escapeHtml(v50Term)+'"></div><div class="v50-results" id="v50Results">'+v50ResultsHtml()+'</div></div>'+
 '<div class="card"><div class="v50-listhead" style="margin-bottom:12px"><h2>Nachbestellliste</h2><div class="v50-tabs">'+[['offen','Offen ('+open.length+')'],['bestellt','Bestellt'],['alle','Alle']].map(([k,l])=>'<button type="button" data-v50-filter="'+k+'" class="'+(v50Filter===k?'on':'')+'">'+l+'</button>').join('')+'</div></div><div class="v50-results">'+(list.length?list.map(o=>v50OrderItem(o,tick)).join(''):'<div class="v50-hint">'+(v50Filter==='offen'?'Nichts offen – alles bestellt.':'Noch keine Einträge.')+'</div>')+'</div></div></div>';
 const search=root.querySelector('#v50MaterialSearch'),res=root.querySelector('#v50Results');
 search.oninput=()=>{v50Term=search.value;res.innerHTML=v50ResultsHtml();v50BindResults(res);};
 v50BindResults(res);
 root.querySelectorAll('[data-v50-filter]').forEach(b=>b.onclick=()=>{v50Filter=b.dataset.v50Filter;v50RenderOrders();});
 root.querySelectorAll('[data-v50-order]').forEach(b=>b.onclick=()=>v50MarkOrdered(b.dataset.v50Order));
}
async function v50OpenOrders(){await v50LoadOrders();v50RenderOrders();}
async function v50AddOrder(rawId){
 const id=Number(rawId),mat=materials.find(m=>Number(m.id)===id);
 if(!mat)return v38Toast('Bitte Material aus der Liste auswählen.',{kind:'err'});
 if(v50Reorders.some(x=>x.status==='offen'&&Number(x.material_id)===id))return v38Toast('„'+mat.name+'“ ist bereits gemeldet.');
 if(v50OrdersBusy)return;v50OrdersBusy=true;
 document.querySelectorAll('[data-v50-add]').forEach(b=>b.disabled=true);
 try{
  await supabase('material_reorders',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({material_id:id,material_name:mat.name,material_number:mat.material_number,employee_name:currentUserProfile.name})});
  v50Term='';v50Filter='offen';await v50OpenOrders();v38Toast('„'+mat.name+'“ gemeldet.',{kind:'ok'});
 }catch(e){v38Toast('Material konnte nicht gemeldet werden: '+e.message,{kind:'err'});v50RenderOrders();}
 finally{v50OrdersBusy=false;}
}
async function v50MarkOrdered(id){
 if(!(isMeister||isAdmin))return;
 const row=v50Reorders.find(x=>Number(x.id)===Number(id));if(!row||row.status!=='offen')return;
 if(!await v38Confirm('„'+row.material_name+'“ als bestellt markieren?',{ok:'Als bestellt markieren'}))return;
 try{
  await supabase('material_reorders?id=eq.'+encodeURIComponent(id)+'&status=eq.offen',{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'bestellt'})});
  await v50LoadOrders();if(currentAppPage==='nachbestellen')v50RenderOrders();if(currentAppPage==='pruefbereich')v50ReviewPanel();
  v38Toast('Als bestellt abgehakt.',{kind:'ok'});
 }catch(e){v38Toast('Abhaken fehlgeschlagen: '+e.message,{kind:'err'});}
}
async function v50ReviewPanel(){
 if(!(isMeister||isAdmin))return;
 const main=document.querySelector('#pruefbereich .v33workspace');if(!main)return;
 let panel=document.getElementById('v50ReviewPanel');
 if(!panel){panel=document.createElement('section');panel.id='v50ReviewPanel';panel.className='card v50-review';main.before(panel);}
 panel.innerHTML='<div class="v50-listhead"><h3>Material nachbestellen <span class="v50-pill" id="v50ReviewCount">…</span></h3><button type="button" class="btn small" id="v50ReviewRefresh">Aktualisieren</button></div><p class="muted">Neue Anforderungen werden sofort als offen angezeigt. Nur E-Meister und Admin können abhaken.</p><div id="v50ReviewBody">Lade Anforderungen …</div>';
 panel.querySelector('#v50ReviewRefresh').onclick=()=>v50ReviewPanel();
 await v50LoadOrders();if(!panel.isConnected)return;
 if(v50OrdersError){panel.querySelector('#v50ReviewBody').innerHTML='<p class="muted">Nachbestellungen nicht verfügbar. Bitte später erneut laden.</p>';return;}
 const open=v50Reorders.filter(x=>x.status==='offen');
 panel.querySelector('#v50ReviewCount').textContent=open.length;
 panel.querySelector('#v50ReviewBody').innerHTML=open.length?'<div class="v50-results">'+open.map(o=>v50OrderItem(o,true)).join('')+'</div>':'<p class="muted">Keine offenen Nachbestellungen.</p>';
 panel.querySelectorAll('[data-v50-order]').forEach(b=>b.onclick=()=>v50MarkOrdered(b.dataset.v50Order));
}

/* Offene Anforderungen werden bei Rückkehr in die App und während des Prüfens neu geladen. */
function v50RefreshVisible(){
 if(document.visibilityState!=='visible'||!currentUserProfile)return;
 if(currentAppPage==='pruefbereich'&&(isMeister||isAdmin))void v50ReviewPanel();
 else if(currentAppPage==='nachbestellen')void v50OpenOrders();
 else if(currentAppPage==='startseite'&&!v34Editing)void v50LoadOrders().then(()=>{if(currentAppPage==='startseite'&&!v34Editing)renderStartseite();});
}
document.addEventListener('visibilitychange',v50RefreshVisible);
window.addEventListener('focus',v50RefreshVisible);
setInterval(v50RefreshVisible,60000);
