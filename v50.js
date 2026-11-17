/* V50 – Gemeinsame Material-Nachbestellungen. Braucht V50_material_nachbestellen.sql */
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
function v50MaterialOptions(){
 return materials.slice().sort((a,b)=>a.name.localeCompare(b.name,'de'))
  .map(m=>'<option value="'+escapeHtml(String(m.id))+'">'+escapeHtml(m.name)+(m.material_number?' · M'+escapeHtml(String(m.material_number).replace(/^M/i,'')):'')+'</option>').join('');
}
function v50Date(s){try{return new Date(s).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});}catch{return ''}}
function v50OrderRows(review=false){
 const all=v50Reorders;
 if(!all.length)return '<tr><td colspan="'+(review?5:4)+'" class="muted">Noch kein Material eingetragen.</td></tr>';
 return all.map(o=>'<tr><td><strong>'+escapeHtml(o.material_name)+'</strong></td><td>'+(o.material_number?'M'+escapeHtml(String(o.material_number).replace(/^M/i,'')):'–')+'</td><td>'+escapeHtml(o.employee_name)+'</td><td><span class="v50-pill '+(o.status==='bestellt'?'done':'')+'">'+(o.status==='bestellt'?'✓ Bestellt':'Offen')+'</span></td>'+(review?'<td><button type="button" class="btn small" data-v50-order="'+o.id+'" '+(o.status==='bestellt'?'disabled':'')+'>'+ (o.status==='bestellt'?'✓ Abgehakt':'Als bestellt abhaken')+'</button></td>':'')+'</tr>').join('');
}
function v50RenderOrders(){
 const root=document.getElementById('nachbestellen');if(!root)return;
 if(v50OrdersError){
 root.innerHTML='<div class="card"><h2>Material nachbestellen</h2><p class="muted">Die gemeinsame Nachbestellliste ist noch nicht verfügbar. Bitte zuerst <code>V50_material_nachbestellen.sql</code> im Supabase SQL Editor ausführen.</p><p class="muted">'+escapeHtml(v50OrdersError)+'</p><button class="btn" onclick="v50OpenOrders()">Erneut laden</button></div>';return;
 }
 root.innerHTML='<div class="v38-pagehead"><div><h1>Material nachbestellen</h1><p>Gemeinsame Liste für alle Kollegen. Ohne Mengen und Baustellen.</p></div><button class="btn" type="button" onclick="v50OpenOrders()">Aktualisieren</button></div>'+
 '<div class="card v50-order-form"><h2>Fehlendes Material melden</h2><label for="v50MaterialSearch">Material oder M-Nummer suchen</label><input type="search" id="v50MaterialSearch" placeholder="Material suchen …" autocomplete="off"><label for="v50MaterialSelect">Material auswählen</label><select id="v50MaterialSelect"><option value="">Bitte Material wählen …</option>'+v50MaterialOptions()+'</select><div id="v50SelectedMaterial" class="muted">M-Nummer wird automatisch übernommen.</div><button type="button" class="btn primary" id="v50AddOrder">Material eintragen</button></div>'+
 '<div class="card"><div class="v50-listhead"><h2>Nachbestellliste</h2><span class="muted">'+v50Reorders.filter(x=>x.status==='offen').length+' offen</span></div><div class="v50-table-scroll"><table class="v50-table"><thead><tr><th>Material</th><th>M-Nummer</th><th>Mitarbeiter</th><th>Status</th></tr></thead><tbody>'+v50OrderRows()+'</tbody></table></div></div>';
 const sel=root.querySelector('#v50MaterialSelect'), search=root.querySelector('#v50MaterialSearch');
 const options=[...sel.options].map(o=>({value:o.value,text:o.textContent}));
 search.oninput=()=>{const previous=sel.value,term=search.value.trim().toLocaleLowerCase('de');sel.replaceChildren();for(const o of options){if(!term||!o.value||o.text.toLocaleLowerCase('de').includes(term)){const n=document.createElement('option');n.value=o.value;n.textContent=o.text;sel.append(n);}}if([...sel.options].some(o=>o.value===previous))sel.value=previous;else sel.value='';v50Selected();};
 sel.onchange=v50Selected;
 root.querySelector('#v50AddOrder').onclick=v50AddOrder;
}
function v50Selected(){
 const id=document.getElementById('v50MaterialSelect')?.value,mat=materials.find(m=>String(m.id)===String(id));
 const e=document.getElementById('v50SelectedMaterial');
 if(e)e.textContent=mat?(mat.material_number?'M'+String(mat.material_number).replace(/^M/i,''):'Keine M-Nummer hinterlegt'):'M-Nummer wird automatisch übernommen.';
}
async function v50OpenOrders(){await v50LoadOrders();v50RenderOrders();}
async function v50AddOrder(){
 const input=document.getElementById('v50MaterialSelect'),id=Number(input?.value);
 const mat=materials.find(m=>Number(m.id)===id);
 if(!mat)return v38Toast('Bitte Material aus der Liste auswählen.',{kind:'err'});
 if(v50OrdersBusy)return;v50OrdersBusy=true;const btn=document.getElementById('v50AddOrder');if(btn)btn.disabled=true;
 try{
  await supabase('material_reorders',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({material_id:id,material_name:mat.name,material_number:mat.material_number,employee_name:currentUserProfile.name})});
  await v50OpenOrders();v38Toast('Material zur Nachbestellliste hinzugefügt.',{kind:'ok'});
 }catch(e){v38Toast('Material konnte nicht eingetragen werden: '+e.message,{kind:'err'});}
 finally{v50OrdersBusy=false;if(btn?.isConnected)btn.disabled=false;}
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
 if(!isMeister)return;
 const main=document.querySelector('#pruefbereich .v33workspace');if(!main)return;
 let panel=document.getElementById('v50ReviewPanel');
 if(!panel){panel=document.createElement('section');panel.id='v50ReviewPanel';panel.className='card v50-review';main.before(panel);}
 panel.innerHTML='<div class="v50-listhead"><h3>Material nachbestellen <span class="v50-pill" id="v50ReviewCount">…</span></h3><button type="button" class="btn small" id="v50ReviewRefresh">Aktualisieren</button></div><p class="muted">Neue Anforderungen werden sofort als offen angezeigt. Nur E-Meister und Admin können abhaken.</p><div id="v50ReviewBody">Lade Anforderungen …</div>';
 panel.querySelector('#v50ReviewRefresh').onclick=()=>v50ReviewPanel();
 await v50LoadOrders();if(!panel.isConnected)return;
 if(v50OrdersError){panel.querySelector('#v50ReviewBody').innerHTML='<p class="muted">Nachbestellungen nicht verfügbar. Supabase-SQL für V50 noch nicht eingerichtet.</p>';return;}
 const open=v50Reorders.filter(x=>x.status==='offen');
 panel.querySelector('#v50ReviewCount').textContent=open.length;
 panel.querySelector('#v50ReviewBody').innerHTML=open.length?'<div class="v50-table-scroll"><table class="v50-table"><thead><tr><th>Material</th><th>M-Nummer</th><th>Mitarbeiter</th><th>Status</th><th>Aktion</th></tr></thead><tbody>'+open.map(o=>'<tr><td>'+escapeHtml(o.material_name)+'</td><td>'+(o.material_number?'M'+escapeHtml(String(o.material_number).replace(/^M/i,'')):'–')+'</td><td>'+escapeHtml(o.employee_name)+'</td><td><span class="v50-pill">Offen</span></td><td><button type="button" class="btn small" data-v50-order="'+o.id+'">Als bestellt abhaken</button></td></tr>').join('')+'</tbody></table></div>':'<p class="muted">Keine offenen Nachbestellungen.</p>';
 panel.querySelectorAll('[data-v50-order]').forEach(b=>b.onclick=()=>v50MarkOrdered(b.dataset.v50Order));
}

/* Offene Anforderungen werden bei Rückkehr in die App und während des Prüfens neu geladen. */
function v50RefreshVisible(){
 if(document.visibilityState!=='visible'||!currentUserProfile)return;
 if(currentAppPage==='pruefbereich'&&isMeister)void v50ReviewPanel();
 else if(currentAppPage==='nachbestellen')void v50OpenOrders();
}
document.addEventListener('visibilitychange',v50RefreshVisible);
window.addEventListener('focus',v50RefreshVisible);
setInterval(v50RefreshVisible,60000);
