const SUPABASE_URL='https://cmtbwohbktirmplieeeq.supabase.co';
const SUPABASE_KEY='sb_publishable_tk18F8g4AS7oQF9eV9qGQw_nONj_xiX';
const DEFAULT_TAXONOMY={"offers":["ציור ואיור","עיצוב","צילום ועריכה","כתיבה וסיפור","מחקר","תכנות","בניית משחקים","מוזיקה וסאונד","הצגה מול קהל","ארגון והפקה","פתרון בעיות","חשיבה יצירתית","עבודה עם נתונים","שפות","עבודת יד","הובלת קבוצה","משוב","AI"],"needs":["רעיון נוסף","מישהו לבנות איתו","ידע שחסר למשימה","משוב על אבטיפוס","עזרה בתכנון","עזרה טכנית","עיצוב","כתיבה","מחקר","צילום ועריכה","בדיקה עם קהל","שמירה על קצב","פתרון תקיעות","הכנה להצגה","חיבור למומחה"],"rooms":["שולחן בוני משחקים","מעבדת עיצוב","חדר סיפור וכתיבה","פינת צילום ועריכה","שולחן מחקר","מעבדת קוד","חדר משוב","שולחן הפקה","חדר בדיקות קהל","פינת רעיונות"]};
let sb=null;const $=id=>document.getElementById(id);const state={communityName:'Spark Match - The Zone Students',communityId:null,userKey:key(),myProfileId:null,currentType:'',currentTypeLabel:'',selectedTags:[],me:{name:'',title:'',bio:'',photo_url:'',offers:[],needs:[],current_focus:'',braindate_offer:'',ideal_match:'',meeting_style:'',availability:'',openness:'',email:'',phone:''},people:[],saved:[],taxonomy:DEFAULT_TAXONOMY};
function key(){let k=localStorage.getItem('sparkMatchStudentsUserKey');if(!k){k=crypto.randomUUID?crypto.randomUUID():Date.now()+Math.random().toString(16);localStorage.setItem('sparkMatchStudentsUserKey',k)}return k}
function status(t,c=''){const e=$('dbStatus');if(e){e.textContent=t;e.className='status '+c}}
function arr(v){if(Array.isArray(v))return v.filter(Boolean);if(!v)return[];if(typeof v==='string'){try{const p=JSON.parse(v);if(Array.isArray(p))return p}catch(e){}return v.split(',').map(x=>x.trim()).filter(Boolean)}return[]}
function prof(r){return{id:r.id,user_key:r.user_key,name:r.name||'',title:r.title||'',bio:r.bio||'',photo_url:r.photo_url||r.photo||'',offers:arr(r.offers),needs:arr(r.needs),current_focus:r.current_focus||'',braindate_offer:r.braindate_offer||'',ideal_match:r.ideal_match||'',meeting_style:r.meeting_style||'',availability:r.availability||'',openness:r.openness||'',email:r.email||'',phone:r.phone||''}}
async function init(){try{sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);status('מתחבר...');const {data:c,error:ce}=await sb.from('communities').select('*').eq('name',state.communityName).limit(1).maybeSingle();if(ce)throw ce;if(!c){status('נדרש חיבור קהילה','error');return}state.communityId=c.id;const {data:t}=await sb.from('community_taxonomy').select('*').eq('community_id',state.communityId).limit(1).maybeSingle();if(t)state.taxonomy={offers:arr(t.offers).length?arr(t.offers):DEFAULT_TAXONOMY.offers,needs:arr(t.needs).length?arr(t.needs):DEFAULT_TAXONOMY.needs,rooms:arr(t.rooms).length?arr(t.rooms):DEFAULT_TAXONOMY.rooms};const {data:p}=await sb.from('profiles').select('*').eq('community_id',state.communityId).eq('user_key',state.userKey).limit(1).maybeSingle();if(p){Object.assign(state.me,prof(p));state.myProfileId=p.id;hydrate()}await loadPeople();await loadנשמר();status('מחובר','ok');renderTags();renderAll()}catch(e){console.error(e);status('שגיאת חיבור','error')}}
async function loadPeople(){if(!sb||!state.communityId)return;const {data,error}=await sb.from('profiles').select('*').eq('community_id',state.communityId).order('updated_at',{ascending:false});if(error){console.error(error);return}state.people=(data||[]).map(prof).filter(p=>p.user_key!==state.userKey)}
async function loadנשמר(){if(!sb||!state.communityId)return;const {data,error}=await sb.from('saved_connections').select('*').eq('community_id',state.communityId).eq('user_key',state.userKey);if(!error)state.saved=data||[]}
function hydrate(){if($('quickName')){$('quickName').value=state.me.name||'';$('quickTitle').value=state.me.title||'';$('quickGoal').value=state.me.current_focus||'';$('quickNeed').value=(state.me.needs||[]).slice(0,3).join(', ');$('quickOffer').value=(state.me.offers||[]).slice(0,3).join(', ')}}
function split(s){return(s||'').split(/,|\n/).map(x=>x.trim()).filter(Boolean)}function uniq(a){return[...new Set((a||[]).filter(Boolean))]}
function collectQuick(){state.me.name=$('quickName').value.trim();state.me.title=$('quickTitle').value.trim();state.me.current_focus=$('quickGoal').value.trim();state.me.bio=state.me.current_focus||state.me.bio;state.me.needs=uniq([state.currentTypeLabel,...state.selectedTags,...split($('quickNeed').value)]);state.me.offers=uniq(split($('quickOffer').value));state.me.braindate_offer=state.me.offers.join(', ');state.me.meeting_style=state.currentType==='practice'?'בנייה משותפת':state.currentType==='accountability'?'התקדמות משותפת':state.currentType==='mentor'?'למידה ממישהו':''}
function collectFull(){if(!$('profileName'))return;const has=$('profileName').value||$('profileTitle').value||$('profileBio').value||$('profileGoal').value||$('profileOffer').value||$('profileNeed').value;if(!has)return;state.me.name=$('profileName').value.trim();state.me.title=$('profileTitle').value.trim();state.me.bio=$('profileBio').value.trim();state.me.current_focus=$('profileGoal').value.trim();state.me.offers=split($('profileOffer').value);state.me.needs=split($('profileNeed').value);state.me.email=$('profileEmail').value.trim();state.me.phone=$('profilePhone').value.trim()}
async function saveProfile(){
  if(!sb||!state.communityId){status('שגיאת חיבור','error');return null}
  collectFull();
  status('שומר...');
  const minimal={
    community_id:state.communityId,
    user_key:state.userKey,
    name:state.me.name||'Guest',
    title:state.me.title||'',
    bio:state.me.bio||state.me.current_focus||'',
    offers:state.me.offers||[],
    needs:state.me.needs||[],
    current_focus:state.me.current_focus||'',
    braindate_offer:state.me.braindate_offer||'',
    updated_at:new Date().toISOString()
  };
  let res = await sb.from('profiles').upsert(minimal,{onConflict:'community_id,user_key'}).select('*').single();
  if(res.error){
    console.warn('Minimal upsert failed, trying select/update fallback',res.error);
    const found = await sb.from('profiles').select('id').eq('community_id',state.communityId).eq('user_key',state.userKey).limit(1).maybeSingle();
    if(found.data && found.data.id){
      res = await sb.from('profiles').update(minimal).eq('id',found.data.id).select('*').single();
    }else{
      res = await sb.from('profiles').insert(minimal).select('*').single();
    }
  }
  if(res.error){
    console.error('Save profile failed:',res.error);
    status('שגיאת שמירה','error');
    alert('Save failed: '+(res.error.message||'שגיאת מבנה ב־Supabase'));
    return null;
  }
  Object.assign(state.me,prof(res.data));
  state.myProfileId=res.data.id;
  await loadPeople();
  await loadנשמר();
  status('נשמר','ok');
  return state.me;
}
function score(p){const need=(state.me.needs||[]).join(' ').toLowerCase(),goal=(state.me.current_focus||'').toLowerCase();let s=10;const c=[p.offers.join(' '),p.needs.join(' '),p.current_focus,p.bio,p.braindate_offer,p.title].join(' ').toLowerCase();(state.me.needs||[]).forEach(n=>{if(c.includes(String(n).toLowerCase()))s+=18});(p.offers||[]).forEach(o=>{o=String(o).toLowerCase();if(need.includes(o)||goal.includes(o.split(' ')[0]))s+=14});if(state.currentType==='practice'&&(c.includes('לבנות')||c.includes('עיצוב')||c.includes('קוד')))s+=18;if(state.currentType==='accountability'&&(c.includes('קצב')||c.includes('ארגון')||c.includes('הובלה')))s+=20;if(state.currentType==='mentor'&&(c.includes('ידע')||c.includes('מחקר')||c.includes('מומחה')))s+=18;if(p.current_focus)s+=5;return Math.min(99,s)}
function rec(n=3){return[...state.people].map(p=>({...p,score:score(p)})).sort((a,b)=>b.score-a.score).slice(0,n)}function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}function initls(n){return(n||'SM').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()}function first(n){return(n||'').trim().split(/\s+/)[0]}
function why(p){
const o=(p.offers||[]).slice(0,2).join(', ');
if(state.currentType==='practice')return`${p.name||'החיבור הזה'} יכול להתאים לבנייה משותפת, במיוחד סביב ${o||'יצירה ופיתוח'}.`;
if(state.currentType==='accountability')return`${p.name||'החיבור הזה'} יכול לעזור לשמור על קצב ולהגיע יחד לצעד הבא.`;
if(state.currentType==='mentor')return`${p.name||'החיבור הזה'} מביא ידע או יכולת שיכולים לפתוח את התקיעות הנוכחית.`;
return`${p.name||'החיבור הזה'} נראה רלוונטי למה שצריך עכשיו.`;
}
function card(p){const img=p.photo_url?`<img src="${esc(p.photo_url)}">`:initls(p.name);const offers=(p.offers||[]).slice(0,3).join(', ')||'חשיבה ועזרה';const goal=p.current_focus||p.bio||'פתיחות לחיבור סביב משימה.';return`<article class="match"><div class="mhead"><div class="avatar">${img}</div><div><h3>${esc(first(p.name)||'חיבור')}</h3><p class="role">${esc(p.title||'חבר או חברת מועדון')}</p></div></div><p class="section"><strong>מה רוצים לגרום לקרות:</strong><br>${esc(goal)}</p><p class="section"><strong>אפשר לעזור ב:</strong><br>${esc(offers)}</p><div class="why">${esc(why(p))}</div><div class="cardactions"><button class="primary" onclick="openMeetingModal('${p.id}')">לקבוע מפגש</button><button class="soft" onclick="savePerson('${p.id}')">לשמור</button></div></article>`}
function render(target='resultsList',n=3){const el=$(target);if(!el)return;const list=rec(n);el.innerHTML=list.length?list.map(card).join(''):`<div class="empty">עדיין אין מספיק פרופילים במרחב. אפשר לשמור פרופיל או לפתוח מצב דמו כדי לבדוק התאמות.</div>`}
function renderAll(){render('allMatchesList',6)}function renderנשמר(){const el=$('savedList');if(!el)return;const ids=state.saved.map(s=>s.saved_profile_id);const people=state.people.filter(p=>ids.includes(p.id));el.innerHTML=people.length?people.map(card).join(''):`<div class="empty">עדיין אין חיבורים שמורים. מוצאים התאמה ולוחצים על שמירה.</div>`}
function renderProfile(){['Name','Title','Bio','Goal','Offer','Need','Email','Phone'].forEach(()=>{});$('profileName').value=state.me.name||'';$('profileTitle').value=state.me.title||'';$('profileBio').value=state.me.bio||'';$('profileGoal').value=state.me.current_focus||'';$('profileOffer').value=(state.me.offers||[]).join(', ');$('profileNeed').value=(state.me.needs||[]).join(', ');$('profileEmail').value=state.me.email||'';$('profilePhone').value=state.me.phone||''}
function counts(a){const m={};(a||[]).forEach(x=>{if(x)m[x]=(m[x]||0)+1});return Object.entries(m).sort((a,b)=>b[1]-a[1])}function renderAdmin(){const el=$('adminSignals');if(!el)return;const needs=counts(state.people.flatMap(p=>p.needs)),offers=counts(state.people.flatMap(p=>p.offers));el.innerHTML=`<div class="signal"><strong>${state.people.length+(state.myProfileId?1:0)}</strong><p>פרופילים במרחב</p></div><div class="signal"><strong>${esc(needs[0]?.[0]||'—')}</strong><p>הצורך הבולט</p></div><div class="signal"><strong>${esc(offers[0]?.[0]||'—')}</strong><p>היכולת הבולטת</p></div>`}
async function ensure(){collectQuick();return await saveProfile()}async function savePerson(id){const me=await ensure();if(!me)return;const {error}=await sb.from('saved_connections').upsert({community_id:state.communityId,user_key:state.userKey,saved_profile_id:id,status:'saved'},{onConflict:'user_key,saved_profile_id'});if(error){console.error(error);alert('לא הצלחנו לשמור את החיבור.');return}await loadנשמר();status('החיבור נשמר','ok')}async function invitePerson(id){const me=await ensure();if(!me)return;const p=state.people.find(x=>x.id===id);const {error}=await sb.from('invites').insert({community_id:state.communityId,sender_profile_id:state.myProfileId,receiver_profile_id:id,title:`הזמנה מ־${first(state.me.name)||'Spark Match'}`,message:`רוצה להיפגש כדי לחשוב, ללמוד או לבנות משהו יחד?`,status:'sent'});if(error){console.error(error);alert('לא הצלחנו ליצור הזמנה.');return}status('ההזמנה נשלחה','ok');alert(`נוצרה הזמנה עבור ${first(p?.name)||'החיבור שנבחר'}.`)}
function showView(v){document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));$('view-'+v)?.classList.add('active');document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.view===v));if(v==='matches')renderAll();if(v==='saved')renderנשמר();if(v==='profile')renderProfile();if(v==='admin')renderAdmin()}function showStep(id){['welcome','choose','questions','results'].forEach(x=>$(x)?.classList.add('hidden'));$(id)?.classList.remove('hidden')}
function renderTags(){
const row=$('quickTags');if(!row)return;
const set=state.currentType==='practice'
? ['רעיון משותף','עיצוב','כתיבה וסיפור','בניית משחקים','צילום ועריכה']
: state.currentType==='accountability'
? ['שמירה על קצב','עזרה בתכנון','ארגון והפקה','פתרון תקיעות','משוב על אבטיפוס']
: ['ידע שחסר למשימה','מחקר','עזרה טכנית','AI','חיבור למומחה'];
row.innerHTML=set.map(t=>`<button class="tag ${state.selectedTags.includes(t)?'selected':''}" data-tag="${esc(t)}">${esc(t)}</button>`).join('');
row.querySelectorAll('.tag').forEach(b=>b.onclick=()=>{const t=b.dataset.tag;state.selectedTags=state.selectedTags.includes(t)?state.selectedTags.filter(x=>x!==t):[...state.selectedTags,t];renderTags()});
}

function choose(type){state.currentType=type;state.currentTypeLabel=type==='practice'?'לבנות יחד':type==='accountability'?'להתקדם יחד':'ללמוד ממישהו';$('questionTitle').textContent=type==='practice'?'מה רוצים לבנות יחד?':type==='accountability'?'איפה צריך עזרה כדי להתקדם?':'איזה ידע או ניסיון חסרים כרגע?';renderTags();hydrate();showStep('questions')}
document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>showView(b.dataset.view));$('start').onclick=()=>showStep('choose');$('goMatches').onclick=()=>showView('matches');$('back').onclick=()=>showStep('choose');$('again').onclick=()=>showStep('welcome');$('saveQuick').onclick=async()=>{collectQuick();await saveProfile()};$('saveFull').onclick=async()=>{collectFull();await saveProfile()};$('find').onclick=async()=>{collectQuick();await saveProfile();render('resultsList',3);showStep('results')};document.querySelectorAll('.choices article').forEach(c=>c.onclick=()=>choose(c.dataset.type));if(new URLSearchParams(location.search).get('admin')==='true'){const b=document.createElement('button');b.className='nav secondary';b.dataset.view='admin';b.textContent='Coach';b.onclick=()=>showView('admin');document.querySelector('nav')?.appendChild(b)}
let pendingInvitePersonId=null;
const DEMO_PROFILES=[{"name":"נועה","title":"גיימינג ועיצוב","bio":"אוהבת להמציא חוקים ולבדוק מה גורם למשחק להיות ממכר.","offers":["בניית משחקים","עיצוב","משוב"],"needs":["מישהו לבנות איתו","עזרה טכנית"],"current_focus":"לבנות משחק שאי אפשר לנצח בו בלי שיתוף פעולה.","braindate_offer":"אפשר לעזור בחוקים, שלבים ובדיקת משחקים."},{"name":"עומר","title":"קוד ו-AI","bio":"מתעניין בבניית דברים שעובדים באמת.","offers":["תכנות","AI","פתרון בעיות"],"needs":["עיצוב","בדיקה עם קהל"],"current_focus":"לבנות אבטיפוס שאנשים יכולים לשחק בו.","braindate_offer":"אפשר לעזור להפוך רעיון לאבטיפוס עובד."},{"name":"דנה","title":"צילום וסיפור","bio":"אוהבת להפוך רעיונות לסיפורים שאנשים זוכרים.","offers":["צילום ועריכה","כתיבה וסיפור","הצגה מול קהל"],"needs":["מחקר","ארגון והפקה"],"current_focus":"ליצור חקירת True Crime שתגרום לקהל לבחור בין כמה גרסאות.","braindate_offer":"אפשר לעזור בסיפור, צילום ועריכה."},{"name":"יובל","title":"חלל ומדע","bio":"חוקר שאלות שאין להן תשובה פשוטה.","offers":["מחקר","עבודה עם נתונים","חשיבה יצירתית"],"needs":["עיצוב","כתיבה וסיפור"],"current_focus":"לבנות ועדה שתבחר מי יהיו האנשים הראשונים על מאדים.","braindate_offer":"אפשר לעזור במחקר ובהשוואת מקורות."},{"name":"מיקה","title":"אופנה והשפעה","bio":"מתעניינת במה גורם לרעיון להתפשט בין אנשים.","offers":["עיצוב","צילום ועריכה","הובלת קבוצה"],"needs":["עבודה עם נתונים","בדיקה עם קהל"],"current_focus":"ליצור משהו שבית הספר באמת ירצה ללבוש או להשתמש בו.","braindate_offer":"אפשר לעזור בעיצוב, קמפיין ובדיקת קהל."}];
function openMeetingModal(id){pendingInvitePersonId=id;const p=state.people.find(x=>x.id===id);const n=typeof first==='function'?first(p?.name):((p?.name||'').split(/\s+/)[0]);if($('meetingPersonName'))$('meetingPersonName').textContent=p?`להזמין את ${n} לחיבור`:'שליחת הזמנה';$('meetingModal')?.classList.remove('hidden')}
function closeMeetingModal(){pendingInvitePersonId=null;$('meetingModal')?.classList.add('hidden')}
function mtimes(){return [$('meetingTime1')?.value,$('meetingTime2')?.value,$('meetingTime3')?.value].map(x=>(x||'').trim()).filter(Boolean).join(' | ')}
async function sendScheduledInvite(){
  if(!pendingInvitePersonId)return;
  const me=await ensure();
  if(!me||!state.myProfileId){alert('Could not save your profile before creating the invite.');return}
  const p=state.people.find(x=>x.id===pendingInvitePersonId);
  const times=mtimes();
  const msg=($('meetingMessage') && $('meetingMessage').value ? $('meetingMessage').value : '').trim()||'רוצה להיפגש כדי לחשוב, ללמוד או לבנות משהו יחד?';
  const full=`${msg}\n\nמקום המפגש: בתוך החדר · שולחן Spark Match${times?'\nזמנים מוצעים: '+times:''}`;
  let payload={community_id:state.communityId,sender_profile_id:state.myProfileId,receiver_profile_id:pendingInvitePersonId,title:`הזמנה מ־${first(state.me.name)||'Spark Match'}`,message:full,proposed_times:times,status:'sent'};
  let res=await sb.from('invites').insert(payload);
  if(res.error){
    console.warn('Full invite insert failed, trying minimal invite',res.error);
    payload={community_id:state.communityId,sender_profile_id:state.myProfileId,receiver_profile_id:pendingInvitePersonId,title:`הזמנה מ־${first(state.me.name)||'Spark Match'}`,message:full,status:'sent'};
    res=await sb.from('invites').insert(payload);
  }
  if(res.error){console.error('Invite failed:',res.error);alert('לא הצלחתי ליצור הזמנה: '+(res.error.message||'שגיאת מבנה ב־Supabase'));return}
  status('ההזמנה נשלחה','ok');
  alert(`נוצרה הזמנה עבור ${first(p&&p.name)||'החיבור שנבחר'}. נפגשים בתוך החדר סביב שולחן Spark Match.`);
  closeMeetingModal();
}
async function meetNow(){
  if(!pendingInvitePersonId)return;
  const me=await ensure();
  if(!me||!state.myProfileId){alert('Could not save your profile before creating the invite.');return}
  const p=state.people.find(x=>x.id===pendingInvitePersonId);
  let payload={community_id:state.communityId,sender_profile_id:state.myProfileId,receiver_profile_id:pendingInvitePersonId,title:'מפגש עכשיו בשולחן Spark Match',message:'אני בחדר עכשיו. רוצה להיפגש כדי לחשוב, ללמוד או לבנות משהו יחד?',proposed_times:'עכשיו · שולחן Spark Match',status:'sent'};
  let res=await sb.from('invites').insert(payload);
  if(res.error){
    console.warn('Full meet-now insert failed, trying minimal invite',res.error);
    payload={community_id:state.communityId,sender_profile_id:state.myProfileId,receiver_profile_id:pendingInvitePersonId,title:'מפגש עכשיו בשולחן Spark Match',message:'אני בחדר עכשיו. רוצה להיפגש כדי לחשוב, ללמוד או לבנות משהו יחד?',status:'sent'};
    res=await sb.from('invites').insert(payload);
  }
  if(res.error){console.error('קביעת מפגש failed:',res.error);alert('לא הצלחתי ליצור הזמנה: '+(res.error.message||'שגיאת מבנה ב־Supabase'));return}
  status('הזמנה מיידית נשלחה','ok');
  alert(`נוצרה הזמנה עבור ${first(p&&p.name)||'החיבור שנבחר'}. עוברים לשולחן Spark Match בחדר.`);
  closeMeetingModal();
}
async function seedDemoProfiles(){if(!sb||!state.communityId){alert('Supabase עדיין לא מחובר.');return}status('יוצר פרופילי דמו...');const rows=DEMO_PROFILES.map((p,i)=>({community_id:state.communityId,user_key:`demo-student-${i+1}`,name:p.name,title:p.title,bio:p.bio,photo_url:'',offers:p.offers,needs:p.needs,current_focus:p.current_focus,braindate_offer:p.braindate_offer,ideal_match:'',meeting_style:i%2===0?'בנייה משותפת':'התקדמות משותפת',availability:'זמינות דמו',openness:'פתיחות לחיבורים במרחב',updated_at:new Date().toISOString()}));const {error}=await sb.from('profiles').upsert(rows,{onConflict:'community_id,user_key'});if(error){console.error(error);status('שגיאת דמו','error');alert('לא הצלחנו ליצור פרופילי דמו.');return}await loadPeople();renderAll();status('פרופילי דמו נוצרו','ok');alert('פרופילי הדמו מוכנים. אפשר לבדוק עכשיו את ההתאמות.')}
function initMeetingAndDemoControls(){$('closeMeetingModal')?.addEventListener('click',closeMeetingModal);$('sendScheduledInvite')?.addEventListener('click',sendScheduledInvite);$('meetNowBtn')?.addEventListener('click',meetNow);$('meetingModal')?.addEventListener('click',e=>{if(e.target.id==='meetingModal')closeMeetingModal()});$('seedDemoProfiles')?.addEventListener('click',seedDemoProfiles);if(new URLSearchParams(location.search).get('demo')==='true')document.querySelectorAll('.demo-only').forEach(el=>el.classList.remove('hidden'))}
initMeetingAndDemoControls();init();


function initDemoVisibilityV23(){
  const isDemo = new URLSearchParams(location.search).get('demo') === 'true';
  if(isDemo){
    document.querySelectorAll('.demo-only').forEach(el => el.classList.remove('hidden'));
  }
  document.getElementById('seedDemoProfiles')?.addEventListener('click', seedDemoProfiles);
  document.getElementById('seedDemoProfilesTop')?.addEventListener('click', seedDemoProfiles);
}
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initDemoVisibilityV23);
}else{
  initDemoVisibilityV23();
}
