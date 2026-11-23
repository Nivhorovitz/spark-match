
const APP_VERSION = 'spark-match-sales-v1';
const DEFAULT_SALES_TAXONOMY = {"offers": ["Discovery calls", "Objection handling", "Closing conversations", "Consultative selling", "Cold outreach", "Follow-up systems", "CRM discipline", "Pipeline review", "Pricing confidence", "Sales messaging", "Lead qualification", "Demo practice", "Storytelling", "Negotiation", "Accountability", "Mindset and confidence", "Founder-led sales", "Referral strategy"], "needs": ["More qualified leads", "Better discovery questions", "Handle price objections", "Improve closing rate", "Consistent follow-up", "Clearer offer", "Shorter sales cycle", "Better pitch", "Practice role-play", "Confidence on calls", "CRM habits", "Convert free consults", "Niche clarity", "More referrals", "Webinar conversion", "Sales scripts", "Accountability partner", "Premium package selling"], "rooms": ["Discovery Call Practice Studio", "Price Objection Role-Play", "Closing Confidence Circle", "Pipeline Accountability Café", "Cold Outreach Lab", "Follow-Up Sprint Room", "Offer Clarity Hot Seat", "Demo Practice Room", "Referral Strategy Table", "Founder Sales Circle"]};

const SUPABASE_URL = 'https://cmtbwohbktirmplieeeq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_tk18F8g4AS7oQF9eV9qGQw_nONj_xiX';
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const defaults = {
  offers: DEFAULT_SALES_TAXONOMY.offers,
  needs: DEFAULT_SALES_TAXONOMY.needs,
  availability: [],
  meetingStyles: ['Quick 15-minute exchange','30-minute role-play','Accountability check-in','Hot seat feedback session','Deep-dive coaching conversation'],
  openness: ['Open to anyone in the community','Prefer similar business stage','Prefer a more experienced peer','Prefer helping beginners']
};

function getOrCreateUserKey(){
  let key = localStorage.getItem('sparkMatchSalesUserKey');
  if(!key){
    key = crypto.randomUUID ? crypto.randomUUID() : 'user-' + Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem('sparkMatchSalesUserKey', key);
  }
  return key;
}

let state = JSON.parse(localStorage.getItem('sparkMatchSalesV1') || 'null') || {
  communityName: 'Spark Match Sales Coaching',
  communityId:null,
  taxonomy: defaults,
  userKey:getOrCreateUserKey(),
  myProfileId:null,
  me:{name:'',title:'',bio:'',photo:'',offers:[],needs:[],availability:[],meetingStyles:[],openness:[],currentFocus:'',braindateOffer:'',lookingToMeet:'',link:'',location:'',email:'',phone:'',contactVisibility:'private'},
  people:[],
  savedConnections:[],
  invites:[],
  activeReport:'needs',
  online:false
};
state.userKey = state.userKey || getOrCreateUserKey();
state.me={name:'',title:'',bio:'',photo:'',offers:[],needs:[],availability:[],meetingStyles:[],openness:[],currentFocus:'',braindateOffer:'',lookingToMeet:'',email:'',phone:'',...state.me};
state.taxonomy={...defaults,...state.taxonomy};

let selectedInvitePerson = null;
const $ = id => document.getElementById(id);
function compactStateForLocalStorage(){
  return {
    communityName: state.communityName,
    communityId: state.communityId,
    taxonomy: state.taxonomy,
    userKey: state.userKey,
    myProfileId: state.myProfileId,
    me: {...state.me, photo: ''},
    people: [],
    savedConnections: [],
    invites: [],
    activeReport: state.activeReport,
    online: state.online
  };
}
function saveLocal(){
  try{
    localStorage.setItem('sparkMatchSalesV1', JSON.stringify(compactStateForLocalStorage()));
  }catch(err){
    console.warn('Local storage is full. Keeping only user key.', err);
    try{
      localStorage.setItem('sparkMatchSalesUserKey', state.userKey || getOrCreateUserKey());
      localStorage.removeItem('sparkMatchSalesV1');
    }catch(e){}
  }
}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function unique(arr){ return [...new Set((arr || []).filter(Boolean))]; }
function initials(name){ return (name || '?').split(' ').filter(Boolean).slice(0,2).map(x=>x[0]).join('') || '?'; }
function toggle(arr,val){ const i=arr.indexOf(val); i>=0 ? arr.splice(i,1) : arr.push(val); }
function profileAsPerson(){ return {...state.me, id:state.myProfileId || 'me', user_key:state.userKey}; }
function setStatus(text, mode=''){ const el=$('dbStatus'); if(!el) return; el.textContent=text; el.className='connection-pill' + (mode ? ' ' + mode : ''); }

function dbProfileToUi(p){
  return {
    name:p.name || '', title:p.title || '', bio:p.bio || '', photo:p.photo_url || '',
    offers:p.offers || [], needs:p.needs || [], availability:p.availability || [],
    meetingStyles:p.meeting_styles || [], openness:p.openness || [],
    currentFocus:p.current_focus || '', braindateOffer:p.braindate_offer || '',
    lookingToMeet:p.looking_to_meet || '', link:p.personal_link || '', location:p.location || '',
    email:p.email || '', phone:p.phone || '', contactVisibility:p.contact_visibility || 'private'
  };
}
function dbProfileToPerson(p){ return {...dbProfileToUi(p), id:p.id, user_key:p.user_key, created_at:p.created_at, updated_at:p.updated_at}; }
function uiProfileToDb(){
  return {
    community_id: state.communityId, user_key: state.userKey,
    name: state.me.name || null, title: state.me.title || null, bio: state.me.bio || null, photo_url: state.me.photo || null,
    offers: state.me.offers || [], needs: state.me.needs || [], meeting_styles: state.me.meetingStyles || [],
    openness: state.me.openness || [], availability: state.me.availability || [],
    current_focus: state.me.currentFocus || null, braindate_offer: state.me.braindateOffer || null,
    looking_to_meet: state.me.lookingToMeet || null, personal_link: state.me.link || null,
    location: state.me.location || null, email: state.me.email || null, phone: state.me.phone || null,
    contact_visibility: state.me.contactVisibility || 'private'
  };
}

async function dbLoad(){
  if(!supabaseClient){ setStatus('Supabase is not loaded', 'error'); return; }
  setStatus('Connecting...', '');
  try{
    let { data: communities, error: commErr } = await supabaseClient.from('communities').select('*').eq('name','Spark Match Sales Coaching').order('created_at', { ascending:true }).limit(1);
    if(commErr) throw commErr;
    if(!communities || !communities.length){
      throw new Error('Spark Match Sales Coaching community missing. Administrator setup required.');
    }
    state.communityId = communities[0].id;
    state.communityName = communities[0].name || state.communityName;

    const { data: taxonomy } = await supabaseClient.from('community_taxonomy').select('*').eq('community_id', state.communityId).limit(1);
    if(taxonomy && taxonomy.length){
      state.taxonomy = {
        offers: taxonomy[0].offers || defaults.offers,
        needs: taxonomy[0].needs || defaults.needs,
        meetingStyles: taxonomy[0].meeting_styles || defaults.meetingStyles,
        openness: taxonomy[0].openness || defaults.openness,
        availability: taxonomy[0].availability || defaults.availability
      };
    }

    const { data: myRows, error: myErr } = await supabaseClient.from('profiles').select('*').eq('community_id', state.communityId).eq('user_key', state.userKey).limit(1);
    if(myErr) throw myErr;
    if(myRows && myRows.length){
      state.myProfileId = myRows[0].id;
      state.me = dbProfileToUi(myRows[0]);
    }
    await refreshFromDb();
    state.online = true;
    setStatus('Connected to Supabase', 'ok');
    saveLocal();
    if(!state.taxonomy.offers?.length) state.taxonomy = DEFAULT_SALES_TAXONOMY;
    render();
  }catch(err){
    console.error(err);
    state.online=false;
    setStatus('Connection error', 'error');
    render();
  }
}

async function refreshFromDb(){
  if(!supabaseClient || !state.communityId) return;
  const { data: profiles, error: pErr } = await supabaseClient.from('profiles').select('*').eq('community_id', state.communityId).order('updated_at', {ascending:false});
  if(pErr) throw pErr;
  state.people = (profiles || []).filter(p=>p.user_key !== state.userKey).map(dbProfileToPerson);

  const { data: saved } = await supabaseClient.from('saved_connections').select('*, saved_profile:profiles(*)').eq('community_id', state.communityId).eq('user_key', state.userKey).order('updated_at', {ascending:false});
  state.savedConnections = saved || [];

  const { data: invites } = await supabaseClient.from('invites').select('*, receiver_profile:profiles(*)').eq('community_id', state.communityId).eq('sender_key', state.userKey).order('updated_at', {ascending:false});
  state.invites = invites || [];
}

async function saveProfileToDb(){
  saveLocal();
  if(!supabaseClient || !state.communityId){ alert('נשמר מקומית בלבד. Supabase עדיין לא מחובר.'); return; }
  setStatus('Saving...', '');
  try{
    const { data, error } = await supabaseClient.from('profiles').upsert(uiProfileToDb(), { onConflict:'community_id,user_key' }).select().single();
    if(error) throw error;
    state.myProfileId = data.id;
    await refreshFromDb();
    setStatus('Saved to cloud', 'ok');
    saveLocal();
    if(!state.taxonomy.offers?.length) state.taxonomy = DEFAULT_SALES_TAXONOMY;
    render();
  }catch(err){
    console.error(err);
    setStatus('Save error', 'error');
    alert('לא הצלחתי לשמור ל-Supabase. כנראה בעיית הרשאות או מפתח.');
  }
}

function chip(label, selected, onClick){ const b=document.createElement('button'); b.type='button'; b.className='chip'+(selected?' selected':''); b.textContent=label; b.onclick=onClick; return b; }
function renderChipSet(el,taxonomyKey,userKey){ const target=$(el); if(!target) return; target.innerHTML=''; state.taxonomy[taxonomyKey].forEach(t=>target.appendChild(chip(t,(state.me[userKey]||[]).includes(t),()=>{ if(!state.me[userKey]) state.me[userKey]=[]; toggle(state.me[userKey],t); render(); }))); }
function renderChips(){ renderChipSet('offersTags','offers','offers'); renderChipSet('needsTags','needs','needs'); }
function syncForm(){
  ['name','title','bio','currentFocus','braindateOffer','email','phone'].forEach(k=>{if($(k))$(k).value=state.me[k]||'';});
  if($('idealMatch'))$('idealMatch').value=state.me.lookingToMeet||'';
  if($('meetingStyle'))$('meetingStyle').value=(state.me.meetingStyles||[])[0]||'';
  if($('openness'))$('openness').value=(state.me.openness||[])[0]||'';
  if($('availability'))$('availability').value=(state.me.availability||[]).join(', ');
}
function profileCompletion(){
  const fields=[!!state.me.name,!!state.me.title,!!state.me.bio,!!state.me.photo,(state.me.offers||[]).length>0,(state.me.needs||[]).length>0,!!state.me.currentFocus,!!state.me.braindateOffer,(state.me.availability||[]).length>0,(state.me.meetingStyles||[]).length>0];
  return Math.round(fields.filter(Boolean).length/fields.length*100);
}

function setPhoto(el, photo, fallback){ const node=$(el); if(!node) return; if(photo){ node.style.backgroundImage=`url(${photo})`; node.textContent=''; } else { node.style.backgroundImage=''; node.textContent=fallback; } }
function updatePreview(){
  if($('publicName'))$('publicName').textContent=state.me.name||'Your name';
  if($('publicTitle'))$('publicTitle').textContent=state.me.title||'Your role';
  if($('publicBio'))$('publicBio').textContent=state.me.bio||'Your intro will appear here.';
  if($('profileCompleteness'))$('profileCompleteness').textContent=profileCompletion()+'%';
  const fallback=initials(state.me.name);
  setPhoto('photoPreview',state.me.photo,fallback);
  setPhoto('publicPhoto',state.me.photo,fallback);
  const tags=unique([...(state.me.offers||[]),...(state.me.needs||[]),...(state.me.meetingStyles||[])]).slice(0,8);
  if($('publicTags'))$('publicTags').innerHTML=tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('');
}

function calcMatches(){
  const me=state.me;
  const norm=a=>[...new Set((Array.isArray(a)?a:[]).map(x=>String(x??'').trim().toLowerCase()).filter(Boolean))];
  const overlap=(a,b)=>{const have=new Set(norm(b));return norm(a).filter(x=>have.has(x));};
  const meOffers=norm(me.offers),meNeeds=norm(me.needs);
  const meTopics=[...new Set([...meOffers,...meNeeds])];
  return state.people.map(p=>{
    const offerNeed=overlap(p.offers,meNeeds);
    const needOffer=overlap(meOffers,p.needs);
    const shared=overlap([...(p.offers||[]),...(p.needs||[])],meTopics);
    const style=overlap(p.meetingStyles,me.meetingStyles);
    const avail=overlap(p.availability,me.availability);
    const openness=norm(me.openness).includes('open to anyone in the community')||norm(p.openness).includes('open to anyone in the community');
    const useful=offerNeed.length>0||needOffer.length>0;
    let score=Math.min(98,(useful?18:4)+offerNeed.length*20+needOffer.length*18+shared.length*2+style.length*4+avail.length*3+(openness?3:0));
    if(!useful)score=Math.min(score,18);
    const reasons=[];
    if(offerNeed.length)reasons.push(`${p.name||'This member'} offers ${offerNeed.slice(0,3).join(', ')}, which you are looking for.`);
    if(needOffer.length)reasons.push(`You can help ${p.name||'this member'} with ${needOffer.slice(0,3).join(', ')}.`);
    if(style.length)reasons.push(`You both enjoy a similar session format: ${style.slice(0,2).join(', ')}.`);
    if(avail.length)reasons.push(`You have overlapping availability: ${avail.slice(0,2).join(', ')}.`);
    const matchType=offerNeed.length&&needOffer.length?'Mutual match':offerNeed.length?'Learn from them':needOffer.length?'Help them':'Explore profile';
    return {...p,score,matchType,reasons:reasons.length?reasons:['Not enough complementary skills or needs yet.']};
  }).sort((a,b)=>b.score-a.score||String(a.name||a.id||'').localeCompare(String(b.name||b.id||'')));
}

async function saveConnection(p){
  if(!state.communityId || !p.id){ alert('צריך לשמור פרופילים בענן לפני שאפשר לשמור חיבור.'); return; }
  const reason=(p.reasons||[]).join('\\n');
  const payload={community_id:state.communityId,user_key:state.userKey,saved_profile_id:p.id,match_score:p.score||null,match_reason:reason,status:'saved'};
  const { error } = await supabaseClient.from('saved_connections').upsert(payload, { onConflict:'user_key,saved_profile_id' });
  if(error){ console.error(error); alert('לא הצלחתי לשמור את החיבור.'); return; }
  await refreshFromDb(); render(); document.querySelector('[data-view="saved"]').click();
}

function renderMatches(){
  const list=$('matchesList'); if(!list)return;
  list.innerHTML='';
  const matches=calcMatches();
  if($('matchCount'))$('matchCount').textContent=String(matches.filter(p=>p.score>18).length);
  if(!matches.length){list.innerHTML='<div class="empty">No other profiles yet. Invite community members to join.</div>';return;}
  matches.forEach(p=>{
    const c=document.createElement('div');
    c.className='card match-card';
    const tags=unique([...(p.offers||[]),...(p.needs||[]),...(p.meetingStyles||[])]).slice(0,7);
    c.innerHTML=`<div class="score">${p.score}%</div><div><div class="person-top"><div class="mini-avatar">${escapeHtml(initials(p.name))}</div><div><p class="eyebrow">${escapeHtml(p.matchType)}</p><h3>${escapeHtml(p.name)}</h3><p class="meta">${escapeHtml(p.title)}</p></div></div><p class="meta">${escapeHtml(p.bio)}</p><div class="tags">${tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div><div class="match-explain"><strong>Why connect?</strong><br>${p.reasons.map(escapeHtml).join('<br>')}</div></div><div class="stack"><button class="primary invite-btn">Invite to practice</button><button class="ghost save-btn">Save for later</button></div>`;
    const avatar=c.querySelector('.mini-avatar');
    if(avatar && typeof p.photo==='string' && /^https:\/\//i.test(p.photo)) avatar.style.backgroundImage=`url("${encodeURI(p.photo).replace(/["'()]/g,'')}")`;
    c.querySelector('.invite-btn').onclick=()=>openInvite(p);
    c.querySelector('.save-btn').onclick=()=>saveConnection(p);
    list.appendChild(c);
  });
}

function renderSaved(){
  const box=$('savedList');if(!box)return;
  box.innerHTML='';
  if(!state.savedConnections.length){box.innerHTML='<div class="empty">No saved connections yet. Save someone from your matches.</div>';return;}
  state.savedConnections.forEach(item=>{
    const p=item.saved_profile?dbProfileToPerson(item.saved_profile):{};
    const card=document.createElement('div');card.className='card';
    card.innerHTML=`<p class="eyebrow">Saved connection · ${escapeHtml(item.status||'saved')}</p><h3>${escapeHtml(p.name||'Unnamed member')}</h3><p class="meta">${escapeHtml(p.title)}<br>${escapeHtml(p.bio)}</p><div class="match-explain">${escapeHtml(item.match_reason||'Saved for follow-up.')}</div><div class="note-box"><label>Private meeting notes<textarea data-note="${escapeHtml(item.id)}" placeholder="What should I remember for the next conversation?">${escapeHtml(item.private_note||'')}</textarea></label><div class="small-actions"><button class="secondary" data-save-note="${escapeHtml(item.id)}">Save note</button><button class="ghost" data-status="${escapeHtml(item.id)}" data-value="met">Met</button><button class="ghost" data-status="${escapeHtml(item.id)}" data-value="follow_up">Follow up</button><button class="ghost" data-status="${escapeHtml(item.id)}" data-value="archived">Archive</button></div></div>`;
    box.appendChild(card);
  });
  box.querySelectorAll('[data-save-note]').forEach(btn=>btn.onclick=async()=>{
    const id=btn.dataset.saveNote;
    const note=box.querySelector(`[data-note="${id}"]`).value;
    const {error}=await supabaseClient.from('saved_connections').update({private_note:note}).eq('id',id).eq('user_key',state.userKey).eq('community_id',state.communityId);
    if(error){alert('Could not save note.');return;}
    await refreshFromDb();render();
  });
  box.querySelectorAll('[data-status]').forEach(btn=>btn.onclick=async()=>{
    const {error}=await supabaseClient.from('saved_connections').update({status:btn.dataset.value}).eq('id',btn.dataset.status).eq('user_key',state.userKey).eq('community_id',state.communityId);
    if(error){alert('Could not update status.');return;}
    await refreshFromDb();render();
  });
}

function renderPeople(){
  const grid=$('peopleGrid');if(!grid)return;
  grid.innerHTML='';
  const people=[profileAsPerson(),...state.people].filter(p=>p.name||p.bio||(p.offers||[]).length||(p.needs||[]).length);
  if(!people.length){grid.innerHTML='<div class="empty">Profiles appear here as members join.</div>';return;}
  people.forEach(p=>{
    const c=document.createElement('div');c.className='card person-card';
    const tags=[...(p.offers||[]).slice(0,5).map(t=>'Offers: '+t),...(p.needs||[]).slice(0,5).map(t=>'Needs: '+t)];
    c.innerHTML=`<div class="person-top"><div class="mini-avatar">${escapeHtml(initials(p.name))}</div><div><h3>${escapeHtml(p.name||'Unnamed member')}</h3><p class="meta">${escapeHtml(p.title)}</p></div></div><p class="meta">${escapeHtml(p.bio)}</p>${p.currentFocus?`<div class="match-explain"><strong>Current focus:</strong><br>${escapeHtml(p.currentFocus)}</div>`:''}${p.braindateOffer?`<p class="meta"><strong>Can host:</strong> ${escapeHtml(p.braindateOffer)}</p>`:''}<div class="tags">${tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>`;
    const avatar=c.querySelector('.mini-avatar');
    if(avatar&&typeof p.photo==='string'&&/^https:\/\//i.test(p.photo))avatar.style.backgroundImage=`url("${encodeURI(p.photo).replace(/["'()]/g,'')}")`;
    grid.appendChild(c);
  });
}

function allProfiles(){ return [profileAsPerson(),...state.people].filter(p=>p.name||p.bio||(p.offers||[]).length||(p.needs||[]).length); }
function countBy(key){ return allProfiles().flatMap(p=>p[key]||[]).reduce((a,t)=>(a[t]=(a[t]||0)+1,a),{}); }
function sortedCounts(obj){ return Object.entries(obj).sort((a,b)=>b[1]-a[1]); }
function renderRooms(){
  const grid=$('roomsList');if(!grid)return;
  const needs=sortedCounts(countBy('needs')),offers=countBy('offers');
  const rooms=needs.slice(0,6).map(([need,count])=>({title:`Practice room: ${need}`,count,reason:offers[need]?`${count} members want help and ${offers[need]} offer it.`:'Demand exists; look for more people who can help.'}));
  if(!rooms.length){grid.innerHTML='<div class="empty">Rooms will be suggested as the community grows.</div>';return;}
  grid.innerHTML=rooms.map(r=>`<div class="card room-card"><p class="eyebrow">Suggested Sparkco Room</p><h3>${escapeHtml(r.title)}</h3><div class="room-count">${r.count}</div><p class="meta">${escapeHtml(r.reason)}</p></div>`).join('');
}

function renderInvites(){
  const box=$('invitesList');if(!box)return;
  box.innerHTML='';
  if(!state.invites.length){box.innerHTML='<div class="empty">No invitations sent yet. Invite someone from your matches.</div>';return;}
  state.invites.forEach(inv=>{
    const p=inv.receiver_profile?dbProfileToPerson(inv.receiver_profile):{};
    const c=document.createElement('div');c.className='card invite-card';
    const status=['pending','accepted','declined'].includes(inv.status)?inv.status:'pending';
    c.innerHTML=`<p class="eyebrow">Spark Match Invite</p><h3>${escapeHtml(p.name||'Invitation')}</h3><span class="status ${status}">${status==='accepted'?'Accepted':status==='declined'?'Declined':'Pending'}</span><p class="meta">${escapeHtml(inv.message)}</p><div class="tags">${(inv.proposed_times||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>`;
    box.appendChild(c);
  });
}

function kpis(){ const profiles=allProfiles(); return [['פרופילים',profiles.length],['פתוחים לפניות',profiles.filter(p=>(p.openness||[]).includes('פתוח/ה לפניות')).length],['הזמנות',state.invites.length],['נשמרו לי',state.savedConnections.length]]; }
function reportRows(title,entries,max){
  if(!entries.length)return `<div class="empty">Not enough data for ${escapeHtml(title)} yet.</div>`;
  return `<div class="report-list">${entries.map(([k,v])=>`<div class="report-row"><div><strong>${escapeHtml(k)}</strong><div class="bar"><span style="width:${Math.max(7,Math.round(Number(v)/max*100))}%"></span></div></div><strong>${Number(v)||0}</strong></div>`).join('')}</div>`;
}

function renderAdmin(){
  const el=$('adminReport'); if(!el)return;
  const needs=sortedCounts(countBy('needs')), offers=sortedCounts(countBy('offers'));
  const offered=countBy('offers'), needMap=countBy('needs');
  const gaps=Object.entries(needMap).map(([k,v])=>[k,Math.max(0,v-(offered[k]||0))]).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
  const kind=state.activeReport;
  if(kind==='offers')el.innerHTML=reportRows('strengths',offers.slice(0,12),offers[0]?.[1]||1);
  else if(kind==='gaps')el.innerHTML=reportRows('opportunity gaps',gaps.slice(0,12),gaps[0]?.[1]||1);
  else el.innerHTML=reportRows('needs',needs.slice(0,12),needs[0]?.[1]||1);
}

function render(){ syncForm(); renderChips(); updatePreview(); renderMatches(); renderSaved(); renderPeople(); renderRooms(); renderInvites(); renderAdmin(); saveLocal(); }
function closeInvite(){ const dlg=$('inviteDialog'); if(dlg&&dlg.open) dlg.close(); }
function openInvite(p){
  selectedInvitePerson=p;
  const nav=document.querySelector('[data-view="invites"]');
  if(nav)nav.click();
  if($('inviteTitle'))$('inviteTitle').value=`Practice with ${p.name||'a member'}`;
  if($('inviteMessage'))$('inviteMessage').value=`Hi ${p.name||'there'},\nSpark Match suggested we connect.\n${(p.reasons||[])[0]||'Would you like to practice together?'}\nCould we meet for a 25-minute session?`;
  if($('inviteTimes'))$('inviteTimes').value='';
}
async function submitInvite(){
  if(!selectedInvitePerson?.id||!state.communityId||!supabaseClient){alert('Select a saved community member while connected to the cloud.');return;}
  const title=$('inviteTitle')?.value.trim()||'Practice session';
  const message=[title,$('inviteMessage')?.value.trim()].filter(Boolean).join('\n\n');
  const proposed=($('inviteTimes')?.value||'').split(/[,;\n]/).map(x=>x.trim()).filter(Boolean);
  if(!message.trim()){alert('Add a short invitation message.');return;}
  const payload={community_id:state.communityId,sender_key:state.userKey,receiver_profile_id:selectedInvitePerson.id,message,proposed_times:proposed,status:'pending'};
  const {error}=await supabaseClient.from('invites').insert(payload);
  if(error){console.error(error);alert('Invitation could not be saved.');return;}
  selectedInvitePerson=null;
  await refreshFromDb();
  render();
}

function suggestBioText(){
  const existing=(state.me.bio||'').trim();
  if(existing&&existing.length<=120) return existing;
  if(existing) return existing.slice(0,117).trim()+'...';
  const offer=state.me.offers.slice(0,2).join(' ו'); const need=state.me.needs.slice(0,2).join(' ו');
  return `מביא/ה ${offer||'ידע וניסיון'}, ומחפש/ת חיבורים סביב ${need||'למידה ושיתופי פעולה'}.`;
}
function addCustomTag(inputId,taxonomyKey,userKey){
  const value=$(inputId).value.trim(); if(!value) return;
  if(!state.taxonomy[taxonomyKey].includes(value)) state.taxonomy[taxonomyKey].push(value);
  if(!state.me[userKey].includes(value)) state.me[userKey].push(value);
  $(inputId).value=''; render();
}


function dataUrlToBlob(dataUrl){
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const binary = atob(parts[1]);
  const bytes = new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], {type:mime});
}

function compressImageFile(file){
  return new Promise((resolve, reject)=>{
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = ()=>{
      img.onload = ()=>{
        const max = 720;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob=>resolve(blob), 'image/jpeg', 0.78);
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadProfilePhoto(file){
  if(!supabaseClient){
    alert('Supabase is not loaded. Photo upload is not available right now.');
    return null;
  }
  setStatus('Uploading photo...', '');
  const blob = await compressImageFile(file);
  const path = `${state.userKey}/avatar-${Date.now()}.jpg`;
  const { error } = await supabaseClient.storage
    .from('profile-photos')
    .upload(path, blob, { contentType:'image/jpeg', upsert:true });
  if(error){
    console.error(error);
    setStatus('Photo upload error', 'error');
    alert('Photo upload failed. Make sure you ran the Storage bucket SQL setup.');
    return null;
  }
  const { data } = supabaseClient.storage.from('profile-photos').getPublicUrl(path);
  setStatus('Photo uploaded', 'ok');
  return data.publicUrl;
}


function installNav(){
  document.querySelectorAll('.nav-item').forEach(btn=>btn.onclick=()=>{
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    const target=$('view-'+btn.dataset.view);
    if(target) target.classList.add('active');
  });
}
installNav();


document.querySelectorAll('[data-go]').forEach(btn=>btn.onclick=()=>document.querySelector(`[data-view="${btn.dataset.go}"]`)?.click());
function installBindings(){
  const keys=['name','title','bio','currentFocus','braindateOffer','idealMatch','availability','meetingStyle','openness','email','phone'];
  keys.forEach(k=>{
    if(!$(k))return;
    $(k).addEventListener('input',e=>{
      const value=e.target.value;
      if(k==='meetingStyle')state.me.meetingStyles=value?[value]:[];
      else if(k==='openness')state.me.openness=value?[value]:[];
      else if(k==='availability')state.me.availability=value.split(',').map(x=>x.trim()).filter(Boolean);
      else if(k==='idealMatch')state.me.lookingToMeet=value;
      else state.me[k]=value;
      render();
    });
  });
}
installBindings();
if($('photoInput')) $('photoInput').addEventListener('change', async e=>{
  const file = e.target.files[0];
  if(!file) return;
  try{
    if($('photoPreview')) $('photoPreview').classList.add('photo-uploading');
    if($('publicPhoto')) $('publicPhoto').classList.add('photo-uploading');
    const publicUrl = await uploadProfilePhoto(file);
    if(publicUrl){
      state.me.photo = publicUrl;
      render();
      await saveProfileToDb();
    }
  }catch(err){
    console.error(err);
    alert('Photo upload failed.');
  }finally{
    if($('photoPreview')) $('photoPreview').classList.remove('photo-uploading');
    if($('publicPhoto')) $('publicPhoto').classList.remove('photo-uploading');
  }
});
if($('addOffer')) $('addOffer').onclick=()=>addCustomTag('customOffer','offers','offers');
if($('addNeed')) $('addNeed').onclick=()=>addCustomTag('customNeed','needs','needs');
if($('suggestBio')) $('suggestBio').onclick=()=>{ $('bioSuggestion').textContent=suggestBioText(); $('bioSuggestionBox').classList.remove('hidden'); };
if($('useSuggestion')) $('useSuggestion').onclick=()=>{ state.me.bio=$('bioSuggestion').textContent; $('bioSuggestionBox').classList.add('hidden'); render(); };
if($('dismissSuggestion')) $('dismissSuggestion').onclick=()=>$('bioSuggestionBox').classList.add('hidden');
if($('copyBio'))$('copyBio').onclick=async()=>{try{await navigator.clipboard.writeText(state.me.bio||'');$('copyBio').textContent='Copied!';}catch(e){$('copyBio').textContent='Select and copy your intro';}};
if($('seedDemo')) $('seedDemo').onclick=async()=>{ alert('בגרסת Supabase אין צורך בטעינת דמו. מלא/י פרופיל ולחץ/י שמירה.'); };
if($('addDemoPerson')) $('addDemoPerson').onclick=()=>alert('בגרסת Supabase מוסיפים אנשים דרך מילוי פרופילים אמיתי.');
if($('refreshMatches')) $('refreshMatches').onclick=async()=>{ await refreshFromDb(); render(); };
if($('saveAll')) $('saveAll').onclick=saveProfileToDb;

if($('saveBottom')) $('saveBottom').onclick=saveProfileToDb;
if($('createInvite'))$('createInvite').onclick=submitInvite;

if($('exportData')) $('exportData').onclick=()=>{ const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='sparkco-braindates-data.json'; a.click(); URL.revokeObjectURL(a.href); };
if($('saveAdmin')) $('saveAdmin').onclick=async()=>{ state.communityName=$('communityName').value; state.taxonomy.offers=$('adminOffers').value.split(',').map(x=>x.trim()).filter(Boolean); state.taxonomy.needs=$('adminNeeds').value.split(',').map(x=>x.trim()).filter(Boolean); if(supabaseClient && state.communityId){ await supabaseClient.from('community_taxonomy').upsert({community_id:state.communityId,offers:state.taxonomy.offers,needs:state.taxonomy.needs,meeting_styles:state.taxonomy.meetingStyles,openness:state.taxonomy.openness,availability:state.taxonomy.availability},{onConflict:'community_id'}); } render(); };
document.querySelectorAll('.report-tab').forEach(btn=>btn.onclick=()=>{ document.querySelectorAll('.report-tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); state.activeReport=btn.dataset.report; render(); });
if($('sendInvite')) $('sendInvite').onclick=async()=>{ if(!selectedInvitePerson) return; const proposed=$('inviteTimes').value.split('\n').map(x=>x.trim()).filter(Boolean); const payload={community_id:state.communityId,sender_key:state.userKey,receiver_profile_id:selectedInvitePerson.id,message:$('inviteMessage').value,proposed_times:proposed,status:'pending'}; const {error}=await supabaseClient.from('invites').insert(payload); if(error){ console.error(error); alert('שליחת הזמנה נכשלה'); return; } closeInvite(); await refreshFromDb(); document.querySelector('[data-view="invites"]').click(); render(); };
if($('cancelInvite')) $('cancelInvite').onclick=closeInvite;
if($('closeInviteX')) $('closeInviteX').onclick=closeInvite;
if($('inviteDialog')) $('inviteDialog').addEventListener('click',e=>{ if(e.target===$('inviteDialog')) closeInvite(); });
render();
dbLoad();
