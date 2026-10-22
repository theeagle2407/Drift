const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const state={raw:[],headers:[],transactions:[],findings:[],decisions:{},currency:'₦',filter:'all'};
const sample=`Date,Description,Amount,Status
2026-07-03,NETFLIX.COM,-4400,Completed
2026-07-05,CANVA* LONDON,-4500,Completed
2026-07-08,UBER TRIP,-3200,Completed
2026-07-12,GTBANK TRANSFER FEE,-50,Completed
2026-08-03,NETFLIX.COM,-4400,Completed
2026-08-05,CANVA* LONDON,-4500,Completed
2026-08-08,UBER TRIP,-4100,Completed
2026-08-12,GTBANK TRANSFER FEE,-50,Completed
2026-08-20,SPOTIFY,-1800,Completed
2026-09-03,NETFLIX.COM,-4400,Completed
2026-09-05,CANVA* LONDON,-4500,Completed
2026-09-08,UBER TRIP,-3900,Completed
2026-09-12,GTBANK TRANSFER FEE,-50,Completed
2026-09-20,SPOTIFY,-1800,Completed
2026-10-03,NETFLIX.COM,-5500,Completed
2026-10-05,CANVA* LONDON,-12000,Completed
2026-10-08,UBER TRIP,-4200,Completed
2026-10-08,UBER TRIP,-4200,Completed
2026-10-12,GTBANK TRANSFER FEE,-50,Completed
2026-10-14,GTBANK SMS ALERT FEE,-500,Completed
2026-10-17,NOTION LABS,-6500,Completed
2026-10-20,SPOTIFY,-1800,Completed`;
function show(id){$$('.screen').forEach(x=>x.classList.remove('active'));$('#'+id).classList.add('active');$('#restartBtn').classList.toggle('hidden',['welcome','pasteScreen','mapping','history'].includes(id));scrollTo(0,0)}
function toast(t){let x=$('#toast');x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),2200)}
function csv(text){const rows=[];let row=[],cell='',q=false;for(let i=0;i<text.length;i++){let c=text[i];if(c==='"'){if(q&&text[i+1]==='"'){cell+='"';i++}else q=!q}else if(c===','&&!q){row.push(cell.trim());cell=''}else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell=''}else cell+=c}if(cell||row.length){row.push(cell.trim());rows.push(row)}return rows}
function rowsFrom(text){const lines=String(text||'').replace(/^\uFEFF/,'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean),pipe=lines.filter(x=>x.includes('|'));if(pipe.length>=2)return pipe.map(x=>x.replace(/^\||\|$/g,'').split('|').map(v=>v.trim())).filter(r=>!r.every(v=>/^:?-{3,}:?$/.test(v)));if(lines.some(x=>x.includes('\t')))return lines.map(x=>x.split('\t').map(v=>v.trim()));return csv(text)}
function headerLike(row){const values=row.map(v=>String(v||'').toLowerCase().trim());return values.some(v=>/^(transaction |posted )?date$/.test(v))&&values.some(v=>/^(description|merchant|narration|details|transaction details)$/.test(v))&&values.some(v=>/^(debit|withdrawal|money out|amount|value)$/.test(v))}
function sameRow(a,b){return a.length===b.length&&a.every((v,i)=>String(v||'').toLowerCase().trim()===String(b[i]||'').toLowerCase().trim())}
function isUnsettled(status){return /(pending|failed|declined|reversed|cancelled|canceled)/.test(String(status||'').toLowerCase())}
function parseDate(v){const raw=String(v||'').trim();const m=raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);if(m){const a=+m[1],b=+m[2],y=+m[3];const day=a>12?a:b>12?b:a,month=a>12?b:b>12?a:b;const d=new Date(y,month-1,day);return isNaN(d)?new Date(raw):d}return new Date(raw)}
function parseMoney(v){if(v==null)return NaN;let s=String(v).replace(/[^0-9.,()-]/g,'').replace(/,/g,'');let n=parseFloat(s.replace(/[()]/g,''));if(s.includes('('))n=-n;return n}

function detectCurrency(){const text=[...state.headers,...state.raw.slice(0,40).flat()].join(' ').toUpperCase();const rules=[['₦',/(?:₦|\bNGN\b|\bNAIRA\b)/],['GH₵',/(?:GH₵|\bGHS\b)/],['KSh',/(?:KSH|\bKES\b)/],['£',/(?:£|\bGBP\b)/],['€',/(?:€|\bEUR\b)/],['$',/(?:US\$|\$|\bUSD\b)/],['R',/\bZAR\b/]];return rules.find(([,re])=>re.test(text))?.[0]||null}
function currencyCode(symbol){return {'₦':'NGN','$':'USD','£':'GBP','€':'EUR','GH₵':'GHS','KSh':'KES','R':'ZAR'}[symbol]||symbol}
function ingest(text,skipMap=false){const rows=rowsFrom(text);if(rows.length<3)return toast('Please add at least three transactions.');const headerIndex=rows.findIndex(headerLike);if(headerIndex>=0){state.headers=rows[headerIndex];state.raw=rows.slice(headerIndex+1).filter(r=>r.length>=2&&!sameRow(r,state.headers))}else if(skipMap){state.headers=['Date','Description','Amount'];state.raw=rows.filter(r=>r.length>=3)}else{state.headers=rows[0];state.raw=rows.slice(1).filter(r=>r.length>=2&&!sameRow(r,state.headers))}if(state.raw.length<3)return toast('Please add at least three transactions.');if(skipMap){const date=findColumn(['date','transaction date','posted date'],0),desc=findColumn(['description','merchant','narration','details','transaction details'],1),amountCol=findColumn(['debit','withdrawal','money out'],findColumn(['amount','value'],2)),status=findColumn(['status','transaction status'],-1),detected=detectCurrency();state.currency=detected||state.currency;prepare(date,desc,amountCol,status);return}buildMapping()}
function findColumn(terms,fallback=-1){const exact=state.headers.findIndex(h=>terms.includes(h.toLowerCase().trim()));if(exact>=0)return exact;const partial=state.headers.findIndex(h=>terms.some(t=>h.toLowerCase().includes(t)));return partial>=0?partial:fallback}
function buildMapping(){show('mapping');const date=findColumn(['date','transaction date','posted date'],0),desc=findColumn(['description','merchant','narration','details','transaction details'],1),amountCol=findColumn(['debit','withdrawal','money out'],findColumn(['amount','value'],2)),status=findColumn(['status','transaction status'],-1);state.mapping={date,desc,amount:amountCol,status};const detected=detectCurrency();state.currency=detected||state.currency;$('#mappingMeta').textContent=`${state.raw.length} transactions · ${detected?currencyCode(detected)+' detected':'choose a currency below'}`;$('#currencyConfirm').classList.toggle('hidden',!!detected);$$('#currencyPills button').forEach(b=>b.classList.toggle('active',b.dataset.currency===state.currency));$('#previewHead').innerHTML='<tr>'+state.headers.map(h=>`<th>${esc(h)}</th>`).join('')+'</tr>';$('#previewBody').innerHTML=state.raw.slice(0,5).map(r=>'<tr>'+state.headers.map((_,i)=>`<td>${esc(r[i]||'')}</td>`).join('')+'</tr>').join('')}

function prepare(di,mi,ai,si=-1){
  si=si<0?(state.mapping?.status??-1):si;
  state.currency=$('#currencySelect')?.value||state.currency;
  const parsed=state.raw.map((r,i)=>({id:i,date:parseDate(r[di]),rawDate:r[di],merchant:norm(r[mi]),original:r[mi]||'Unknown',amount:Math.abs(parseMoney(r[ai])),signed:parseMoney(r[ai]),status:si>=0?String(r[si]||'').trim().toLowerCase():''})).filter(t=>!isNaN(t.date)&&Number.isFinite(t.amount)&&t.amount>0&&!isUnsettled(t.status));
  const hasNegative=parsed.some(t=>t.signed<0);
  state.transactions=parsed.map(t=>({...t,signed:hasNegative?t.signed:-Math.abs(t.signed)}));
  if(state.transactions.length<3)return toast('Could not find enough completed transactions.');
  const skipped=state.raw.length-state.transactions.length;
  if(skipped)toast(`${skipped} incomplete or unsettled row${skipped===1?' was':'s were'} skipped.`);
  runAnalysis()
}
function norm(s=''){return String(s).toUpperCase().replace(/\b(POS|WEB|CARD|PAYMENT|PURCHASE|DEBIT|ONLINE|LONDON|LAGOS|NG|COM)\b/g,'').replace(/[0-9*#_/.-]+/g,' ').replace(/\s+/g,' ').trim()||'UNKNOWN'}
function runAnalysis(){show('analyzing');const steps=['Reading','Matching merchants','Comparing months','Building your changelog'];steps.forEach((s,i)=>setTimeout(()=>{$('#analysisStep').textContent=s;$('#progressBar').style.width=((i+1)*25)+'%'},i*480));setTimeout(()=>{analyze();render();show('changes')},2100)}
function monthKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function amount(n){return state.currency+Math.round(n).toLocaleString('en-NG')}
function analyze(){const tx=[...state.transactions].sort((a,b)=>a.date-b.date);const months=[...new Set(tx.map(t=>monthKey(t.date)))].sort();const recent=months.at(-1),prior=months.at(-2)||recent;state.periods={recent,prior};const names={};tx.forEach(t=>(names[t.merchant]??=[]).push(t));const out=[];for(const [merchant,arr] of Object.entries(names)){const old=arr.filter(t=>monthKey(t.date)!==recent),cur=arr.filter(t=>monthKey(t.date)===recent);if(!cur.length)continue;const curSum=cur.reduce((s,t)=>s+t.amount,0),hist=old.map(t=>t.amount),med=hist.length?[...hist].sort((a,b)=>a-b)[Math.floor(hist.length/2)]:0;const isFee=/FEE|CHARGE|LEVY|STAMP|SMS ALERT/.test(merchant);if(isFee){const recurringFee=new Set(arr.map(t=>monthKey(t.date))).size>=2;out.push(make('fees',merchant,curSum,arr,`Fees totalled ${amount(curSum)} in the latest period.`,.91,recurringFee));continue}if(cur.length>1){const dup=cur.some((t,i)=>cur.some((u,j)=>i<j&&t.amount===u.amount&&Math.abs(t.date-u.date)<86400000));if(dup)out.push(make('repeated',merchant,cur[0].amount,cur,'Two matching completed-looking entries appeared close together. Review before disputing.',.86,false))}if(old.length>=2&&med&&cur[0].amount>med*1.08)out.push(make('increased',merchant,cur[0].amount-med,arr,`${pretty(merchant)} changed from about ${amount(med)} to ${amount(cur[0].amount)}.`,.94,true));else if(!old.length)out.push(make('started',merchant,curSum,cur,`${pretty(merchant)} appears for the first time in this statement history. This alone does not prove it is recurring.`,.78,false))}
state.findings=out.sort((a,b)=>b.impact-a.impact);const periodTotal=k=>tx.filter(t=>monthKey(t.date)===k&&t.signed<0).reduce((s,t)=>s+t.amount,0);state.totals={old:periodTotal(prior),new:periodTotal(recent)}}
function make(type,merchant,impact,tx,explanation,confidence,recurring=false){return{id:type+'-'+merchant,type,merchant,impact,recurring,tx:[...tx].sort((a,b)=>b.date-a.date).slice(0,4),explanation,confidence}}
function pretty(s){return s.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase())}
function monthName(k){const [y,m]=k.split('-');return new Date(+y,+m-1).toLocaleString('en',{month:'long'}).toUpperCase()}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function render(){const drift=Math.max(0,state.totals.new-state.totals.old);saveAudit(drift);$('#oldLabel').textContent=monthName(state.periods.prior);$('#newLabel').textContent=monthName(state.periods.recent);$('#oldTotal').textContent=amount(state.totals.old);$('#newTotal').textContent=amount(state.totals.new);$('#totalDelta').textContent=(drift?'+':'')+amount(drift);$('#driftAmount').textContent=amount(drift);$('#findingCount').textContent=state.findings.length;renderFlow();renderFindings();updatePlan()}
function renderFlow(){
  const colors={started:'#d9755f',increased:'#e0a857',repeated:'#b36a54',fees:'#4f8a70'},shown=state.findings.slice(0,5),maxImpact=Math.max(1,...shown.map(f=>f.impact)),largest=Math.max(1,state.totals.old,state.totals.new),baseWidth=Math.round(28+(state.totals.old/largest)*38);
  let svg=`<defs><linearGradient id="base" x1="0" x2="1"><stop stop-color="#244d3e"/><stop offset="1" stop-color="#b8c5b6"/></linearGradient></defs><text x="12" y="176" class="flow-label">PREVIOUS MONTH</text><path class="flow-path" d="M18 215 C 190 165, 350 250, 590 215" stroke="url(#base)" stroke-width="${baseWidth}"/><circle cx="590" cy="215" r="${Math.max(8,baseWidth/2)}" fill="#b8c5b6" opacity=".9"/>`;
  shown.forEach((f,i)=>{const y=48+i*72,width=(4+(f.impact/maxImpact)*10).toFixed(1),sy=190+(i-2)*12;svg+=`<path class="branch" data-id="${esc(f.id)}" d="M360 ${sy} C 475 ${sy}, 500 ${y}, 625 ${y}" stroke="${colors[f.type]}" style="stroke-width:${width}px"/><circle cx="625" cy="${y}" r="6" fill="${colors[f.type]}"/><text x="643" y="${y-3}" class="flow-label">${esc(pretty(f.merchant).slice(0,18))}</text><text x="643" y="${y+15}" class="flow-value" fill="${colors[f.type]}">+${esc(amount(f.impact))}</text>`});
  $('#flowSvg').innerHTML=svg;
  $$('.branch').forEach(p=>p.onclick=()=>{const el=document.querySelector(`[data-finding="${CSS.escape(p.dataset.id)}"]`);if(el){el.classList.add('open');el.scrollIntoView({behavior:'smooth',block:'center'})}})
}
function renderFindings(){const list=state.filter==='all'?state.findings:state.findings.filter(f=>f.type===state.filter);$('#findings').innerHTML=list.length?list.map(f=>`<article class="finding" data-finding="${esc(f.id)}"><div class="finding-top"><div class="finding-icon">${{started:'＋',increased:'↗',repeated:'Ⅱ',fees:'¢'}[f.type]}</div><div class="finding-copy"><small>${f.type.toUpperCase()}</small><b>${esc(pretty(f.merchant))}</b></div><div class="finding-value"><b>+${amount(f.impact)}</b><small>${label(f.type)}</small></div></div><div class="evidence"><span class="confidence">● ${Math.round(f.confidence*100)}% pattern confidence</span><p>${esc(f.explanation)}</p>${f.tx.map(t=>`<div class="evidence-row"><span>${t.date.toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'})}</span><span>${esc(t.original)}</span><b>${amount(t.amount)}</b></div>`).join('')}<div class="decision-row">${actions(f).map(d=>`<button data-decision="${d.value}" data-id="${esc(f.id)}" class="${state.decisions[f.id]===d.value?'selected':''}">${d.label}</button>`).join('')}</div></div></article>`).join(''):`<div style="padding:40px 5px;color:var(--muted)">No changes in this group.</div>`;$$('.finding').forEach(x=>x.onclick=e=>{if(!e.target.matches('button'))x.classList.toggle('open')});$$('[data-decision]').forEach(b=>b.onclick=e=>{e.stopPropagation();state.decisions[b.dataset.id]=b.dataset.decision;renderFindings();updatePlan();toast(b.dataset.decision==='stop'?'Added to your recovery plan.':'Decision saved.')})}
function label(t){return{started:'New this period',increased:'Higher than before',repeated:'Possible duplicate',fees:'Fees detected'}[t]}
function actions(f){return f.type==='repeated'?[{value:'keep',label:'Not duplicate'},{value:'review',label:'Review'},{value:'stop',label:'Dispute'}]:f.type==='fees'?[{value:'keep',label:'Expected'},{value:'review',label:'Review'},{value:'stop',label:'Reduce'}]:[{value:'keep',label:'Keep'},{value:'review',label:'Review'},{value:'stop',label:'Stop'}]}
function planItems(){return state.findings.filter(f=>['review','stop'].includes(state.decisions[f.id]))}
function updatePlan(){
  const chosen=planItems(),stopping=chosen.filter(f=>state.decisions[f.id]==='stop'),monthly=stopping.filter(f=>f.recurring).reduce((s,f)=>s+f.impact,0),oneTime=stopping.filter(f=>!f.recurring).reduce((s,f)=>s+f.impact,0),reviews=chosen.length-stopping.length;
  $('.plan-cta span').textContent=chosen.length?'Open my action plan':'Build my action plan';
  $('#planValue').textContent=chosen.length?`${chosen.length} item${chosen.length===1?'':'s'} selected`:'Choose what to act on';
  $('#recoveryMonthly').textContent=amount(monthly);
  $('#recoveryYearly').textContent=amount(monthly*12)+' per year';
  $('#oneTimeImpact').textContent=`${reviews} to review · ${amount(oneTime)} one-time`;
  $('#planList').innerHTML=chosen.map((f,i)=>{const decision=state.decisions[f.id],reviewing=decision==='review',instruction=reviewing?'Check the evidence against your bank or provider record, then decide whether to keep or stop it.':f.type==='repeated'?'Confirm both entries settled, then contact the merchant or bank to dispute one.':'Open the provider or bank app, stop the charge, then verify next month.';return `<div class="plan-item"><span class="num">${String(i+1).padStart(2,'0')}</span><div><span class="plan-status ${decision}">${reviewing?'REVIEW':'ACT'}</span><h3>${esc(pretty(f.merchant))}</h3><p>${instruction}</p></div><b>${reviewing?'Check':amount(f.impact)+(f.recurring?'/mo':' once')}</b></div>`}).join('');
}
function reset(){Object.assign(state,{raw:[],headers:[],transactions:[],findings:[],decisions:{},filter:'all'});$('#fileInput').value='';show('welcome')}

function getHistory(){try{return JSON.parse(localStorage.getItem('drift.auditHistory')||'[]')}catch{return[]}}
function saveAudit(drift){const list=getHistory(),signature=`${state.periods.prior}|${state.periods.recent}|${state.totals.old}|${state.totals.new}`;if(list[0]?.signature===signature)return;list.unshift({id:Date.now(),signature,createdAt:new Date().toISOString(),prior:state.periods.prior,recent:state.periods.recent,old:state.totals.old,new:state.totals.new,drift,currency:state.currency,findings:state.findings.map(f=>({type:f.type,merchant:pretty(f.merchant),impact:f.impact,recurring:f.recurring}))});localStorage.setItem('drift.auditHistory',JSON.stringify(list.slice(0,12)))}
function formatStored(n,symbol){return (symbol||'₦')+Math.round(n).toLocaleString('en-NG')}
function renderHistory(){const list=getHistory();$('#historyList').innerHTML=list.length?list.map(a=>`<article class="history-entry"><time>${new Date(a.createdAt).toLocaleDateString('en',{day:'numeric',month:'short',year:'numeric'})}</time><div><h3>${monthName(a.prior)} → ${monthName(a.recent)}</h3><p>${a.findings.length} changes · ${formatStored(a.old,a.currency)} to ${formatStored(a.new,a.currency)}</p></div><b>+${formatStored(a.drift,a.currency)}</b><span>⌄</span><div class="history-detail">${a.findings.slice(0,4).map(f=>`<div class="history-chip"><small>${f.type.toUpperCase()}</small><strong>${esc(f.merchant)}</strong><span>+${formatStored(f.impact,a.currency)}${f.recurring?'/mo':''}</span></div>`).join('')}</div></article>`).join(''):`<div class="history-empty"><b>Nothing here yet.</b><span>Your finished checks will live here.</span></div>`;$$('.history-entry').forEach(x=>x.onclick=()=>x.classList.toggle('open'))}

$('#sampleBtn').onclick=()=>ingest(sample);
$('#pasteBtn').onclick=()=>show('pasteScreen');
$('#analyzePaste').onclick=()=>ingest($('#pasteArea').value,true);
$('#confirmMapping').onclick=()=>{
  const m=state.mapping;
  if(!m||m.date<0||m.desc<0||m.amount<0)return toast('This file needs Date, Description and Amount columns.');
  prepare(m.date,m.desc,m.amount,m.status);
};
$('#currencyPills').onclick=e=>{
  if(!e.target.dataset.currency)return;
  state.currency=e.target.dataset.currency;
  $$('#currencyPills button').forEach(b=>b.classList.toggle('active',b===e.target));
  $('#mappingMeta').textContent=`${state.raw.length} transactions · ${currencyCode(state.currency)} selected`;
};
$('#fileInput').onchange=e=>{const f=e.target.files[0];if(f)f.text().then(ingest)};
const dz=$('#dropzone');
['dragenter','dragover'].forEach(n=>dz.addEventListener(n,e=>{e.preventDefault();dz.classList.add('drag')}));
['dragleave','drop'].forEach(n=>dz.addEventListener(n,e=>{e.preventDefault();dz.classList.remove('drag')}));
dz.addEventListener('drop',e=>{const f=e.dataTransfer.files[0];if(f)f.text().then(ingest)});
$$('[data-back]').forEach(b=>b.onclick=()=>show(b.dataset.back));
$('#restartBtn').onclick=reset;
$('#brandBtn').onclick=reset;
$('#newAuditBtn').onclick=reset;
$('#filters').onclick=e=>{if(e.target.dataset.filter){state.filter=e.target.dataset.filter;$$('#filters button').forEach(b=>b.classList.toggle('active',b===e.target));renderFindings()}};
$('#howBtn').onclick=()=>{$('#howModal').classList.add('open');$('#howModal').setAttribute('aria-hidden','false')};
$('#closeHow').onclick=()=>$('#howModal').classList.remove('open');
$('#howModal').onclick=e=>{if(e.target.id==='howModal')e.currentTarget.classList.remove('open')};


$('#historyBtn').onclick=()=>{renderHistory();show('history')};
$('#historyNew').onclick=reset;
$('#clearHistory').onclick=()=>{localStorage.removeItem('drift.auditHistory');renderHistory();toast('History cleared from this browser.')};

$('#planBtn').onclick=()=>{
  const chosen=planItems();
  if(!chosen.length){
    const first=[...$$('.finding')].find(item=>!state.decisions[item.dataset.finding])||$('.finding');
    if(!first)return toast('No actionable findings were detected.');
    first.classList.add('open','guide');
    first.scrollIntoView({behavior:'smooth',block:'center'});
    setTimeout(()=>first.classList.remove('guide'),1800);
    toast('Choose an action for this finding.');
    return;
  }
  updatePlan();
  show('plan');
};

$('#downloadBtn').onclick=()=>{
  const chosen=planItems(),stopping=chosen.filter(f=>state.decisions[f.id]==='stop'),monthly=stopping.filter(f=>f.recurring).reduce((s,f)=>s+f.impact,0),oneTime=stopping.filter(f=>!f.recurring).reduce((s,f)=>s+f.impact,0);
  const items=chosen.map((f,i)=>{const decision=state.decisions[f.id],action=decision==='review'?'REVIEW':'ACT',next=decision==='review'?'Compare this finding with the provider or bank record.':f.type==='repeated'?'Confirm both entries settled, then contact the merchant or bank.':'Stop the charge in the provider or bank app and verify next month.';return `${i+1}. [${action}] ${pretty(f.merchant)} — ${amount(f.impact)}${f.recurring?'/month':' one-time'}\n   ${f.explanation}\n   Next: ${next}`}).join('\n\n');
  const text=`DRIFT — ACTION PLAN\nGenerated ${new Date().toLocaleDateString()}\n\nConfirmed recurring savings: ${amount(monthly)}/month\nPotential annual savings: ${amount(monthly*12)}\nConfirmed one-time action: ${amount(oneTime)}\nItems still to review: ${chosen.length-stopping.length}\n\n${items}\n\nDrift identifies patterns, not fraud. Verify every item before acting. Statement data stayed in your browser.`;
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/plain'}));a.download='drift-action-plan.txt';a.click();URL.revokeObjectURL(a.href);
};
