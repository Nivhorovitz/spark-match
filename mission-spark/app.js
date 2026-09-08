const interests=['גיימינג','אופנה','חלל','True Crime','מוזיקה','ספורט','אקלים','אוכל','חיות','רשתות חברתיות','קומיקס','טכנולוגיה'];
const desires=[
  {id:'experience',title:'לגרום לאנשים לחוות משהו',hint:'אירוע, עולם, תעלומה או רגע שאי אפשר להסביר רק במילים'},
  {id:'play',title:'לגרום לאנשים לשחק',hint:'משחק עם חוקים, בחירות, מתח ותוצאה לא ידועה'},
  {id:'change',title:'לשנות משהו אמיתי',hint:'הרגל, טרנד, מקום או החלטה בעולם שסביבכם'},
  {id:'use',title:'לבנות משהו שימושי',hint:'כלי, שירות או פתרון שמישהו באמת יצטרך'},
  {id:'debate',title:'לגרום לאנשים לבחור צד',hint:'דילמה שאין לה תשובה פשוטה וקהל שחייב להחליט'},
  {id:'surprise',title:'להפתיע את בית הספר',hint:'משהו שאנשים לא מצפים שיקרה כאן'}
];
const investigationMethods=[
  {id:'talk',icon:'💬',title:'שיחה קצרה',hint:'לדבר עם 3–5 אנשים ולשאול שאלות פתוחות'},
  {id:'observe',icon:'👀',title:'תצפית',hint:'לראות מה אנשים עושים בפועל, בלי להסביר להם מה לחפש'},
  {id:'survey',icon:'📊',title:'סקר בזק',hint:'לאסוף תשובות קצרות מקבוצה גדולה יותר'},
  {id:'prototype',icon:'🧪',title:'בדיקת אבטיפוס',hint:'לתת לאנשים לנסות גרסה קטנה ולתעד מה קורה'},
  {id:'compare',icon:'↔',title:'השוואת דוגמאות',hint:'לבדוק מה עובד בשלוש דוגמאות קיימות'},
  {id:'expert',icon:'🧭',title:'שיחה עם מומחה',hint:'לבדוק ידע שחסר לפני שמקבלים החלטה'}
];
const state={interest:'',desire:'',missions:[],selected:null,method:'',cycles:[]};
const $=id=>document.getElementById(id);
const esc=s=>String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

function show(id){document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));$(id).classList.add('active');window.scrollTo({top:0,behavior:'smooth'})}
function renderInterests(){$('interestCloud').innerHTML=interests.map(x=>`<button class="interest${state.interest===x?' selected':''}" data-interest="${esc(x)}">${esc(x)}</button>`).join('');document.querySelectorAll('[data-interest]').forEach(b=>b.onclick=()=>{state.interest=b.dataset.interest;$('customInterest').value='';$('interestNext').disabled=false;renderInterests()})}
function renderDesires(){$('desireCards').innerHTML=desires.map(x=>`<button class="desire${state.desire===x.id?' selected':''}" data-desire="${x.id}"><strong>${x.title}</strong><small>${x.hint}</small></button>`).join('');document.querySelectorAll('[data-desire]').forEach(b=>b.onclick=()=>{state.desire=b.dataset.desire;$('customDesire').value='';$('generate').disabled=false;renderDesires()})}

const named={
  'גיימינג':['The Unwinnable Game','Golda: The Game','Boss Level: Reality'],
  'אופנה':['Make Golda Wear It','The One-Week Trend','Uniform From The Future'],
  'חלל':['The First 30','Message From Mars','The Last Launch'],
  'True Crime':['The Case Nobody Solved','Evidence Room','Three Versions of the Truth'],
  'אקלים':['2050','The School Carbon Heist','One Week Without'],
  'מוזיקה':['The Soundtrack Takeover','A Song People Change','Silent Festival']
};
const formats={experience:['חוויה חיה','עולם סודי','אירוע מתגלגל'],play:['משחק חברתי','משחק תפקידים','אתגר קבוצתי'],change:['ניסוי השפעה','קמפיין אמיתי','התערבות בבית הספר'],use:['כלי לקהילה','שירות חדש','אבטיפוס עובד'],debate:['ועדת הכרעה','משפט ציבורי','בחירה בלתי אפשרית'],surprise:['פלישה יצירתית','שבוע הפוך','אירוע בהפתעה']};
function missionNames(){const base=named[state.interest];if(base)return base;const f=formats[state.desire]||formats.experience;return [`${state.interest}: ${f[0]}`,`${state.interest}: ${f[1]}`,`${state.interest}: ${f[2]}`]}
function makeMissions(){const names=missionNames();const desireText=desires.find(x=>x.id===state.desire)?.title||state.desire;const audience=['תלמידים משכבה אחרת','משפחות וקהילת בית הספר','קבוצה שלא מכירה את הנושא'];return names.map((name,i)=>({
  name,
  hook:[`לבנות סביב ${state.interest} חוויה שתגרום ל${audience[i]} לקבל החלטה אמיתית.`,`להפוך את ${state.interest} למשחק חי עם תפקידים, מידע שונה ואירוע שאף אחד לא שולט בו לגמרי.`,`ליצור משהו סביב ${state.interest} ולנסות לגרום לו להתפשט בבית הספר במשך שבוע אחד.`][i],
  role:['צוות חקירה והפקה','מעצבי עולם ומנהלי משחק','סטודיו השפעה וניסוי'][i],audience:audience[i],
  constraints:[['72 שעות לבניית גרסה ראשונה','אסור להסביר לקהל מראש מה אמור לקרות'],['לכל קבוצה יש מידע ומשאבים שונים','המערכת חייבת להגיב לבחירות של המשתתפים'],['תקציב סמלי בלבד','צריך למדוד שינוי אמיתי ולא רק תגובות חיוביות']][i],
  win:[`לפחות 20 אנשים משתתפים ומישהו מהם משנה את דעתו או את בחירתו.`,`המשחק מגיע לסיום שונה בשתי הרצות, ואף קבוצה לא יכולה להצליח לבד.`,`אפשר להראות באמצעות ראיות שהרעיון עבר לפחות בין שלוש קבוצות בבית הספר.`][i],
  needs:[['מה גורם לאנשים להשתתף?','איך בונים סיפור שמוביל לבחירה?','איך בודקים אם תגובת הקהל אמיתית?'],['איך חוקים יוצרים התנהגות?','איך מאזנים כוח ומשאבים?','איזה ידע על הנושא חייב להפוך למידע במשחק?'],['איך רעיונות מתפשטים?','איך מגדירים קהל ומסר?','איך מודדים שינוי לפני ואחרי?']][i],
  moves:['להגדיר מי הקהל ומה רוצים שיקרה לו','לבנות אבטיפוס קטן שאפשר לבדוק מחר','לתת לקבוצה אחרת לנסות ולאסוף תגובות']
}))}
function renderMissions(){state.missions=makeMissions();$('missionGrid').innerHTML=state.missions.map((m,i)=>`<article class="mission-card"><span class="mission-number">0${i+1}</span><p class="kicker">${esc(m.role)}</p><h3>${esc(m.name)}</h3><p>${esc(m.hook)}</p><div class="dna"><span>קהל אמיתי</span><span>אי־ודאות</span><span>מגבלות</span><span>תוצאה</span></div><button class="primary" data-pick="${i}">זה מדליק אותנו</button></article>`).join('');document.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>selectMission(Number(b.dataset.pick)))}
function selectMission(i){state.selected=state.missions[i];state.cycles=[];const m=state.selected;$('missionHero').innerHTML=`<p class="kicker">${esc(m.role)} · ${esc(state.interest)}</p><h1>${esc(m.name)}</h1><p>${esc(m.hook)}</p><p class="win">ניצחון נראה כך: ${esc(m.win)}</p>`;$('firstMoves').innerHTML=m.moves.map((x,j)=>`<div class="move"><b>${j+1}</b><span>${esc(x)}</span></div>`).join('');$('needToKnow').innerHTML=m.needs.map((x,j)=>`<div class="need"><b>?</b><span>${esc(x)}</span></div>`).join('');resetInvestigation();$('investigationLoop').classList.add('hidden');renderPedagogy();show('stepMission')}

const loopSteps=['loopAssumption','loopQuestion','loopMethod','loopAction','loopEvidence'];
function showLoopStep(id){document.querySelectorAll('.loop-step').forEach(x=>x.classList.toggle('active',x.id===id));const n=loopSteps.indexOf(id);$('loopProgress').textContent=n>=0?`${n+1} מתוך ${loopSteps.length}`:'סיבוב הושלם';$('investigationLoop').scrollIntoView({behavior:'smooth',block:'start'})}
function setLoopButton(id,enabled){const b=$(id);if(b)b.disabled=!enabled}
function fillPrompt(target,value){$(target).value=value;$(target).dispatchEvent(new Event('input',{bubbles:true}))}
function renderInvestigation(){
  const m=state.selected;if(!m)return;
  const assumptions=[`אנחנו חושבים שהקהל שלנו ירצה להשתתף`, `אנחנו חושבים שאנשים יבינו מה לעשות בלי הסבר`, `אנחנו חושבים שנוכל להראות שהצלחנו באמצעות ${m.win}`];
  const questions=[`איזו התנהגות תראה שהקהל באמת רוצה להשתתף?`,`מה יכול להוכיח שהרעיון שלנו לא עובד עדיין?`,`את מי עוד לא שאלנו וחשוב שנשמע?`];
  $('assumptionPrompts').innerHTML=assumptions.map(x=>`<button type="button" data-fill-assumption="${esc(x)}">${esc(x)}</button>`).join('');
  $('questionPrompts').innerHTML=questions.map(x=>`<button type="button" data-fill-question="${esc(x)}">${esc(x)}</button>`).join('');
  $('methodCards').innerHTML=investigationMethods.map(x=>`<button type="button" class="method-card${state.method===x.id?' selected':''}" data-method="${x.id}"><span>${x.icon}</span><strong>${x.title}</strong><small>${x.hint}</small></button>`).join('');
  document.querySelectorAll('[data-fill-assumption]').forEach(b=>b.onclick=()=>fillPrompt('assumptionInput',b.dataset.fillAssumption));
  document.querySelectorAll('[data-fill-question]').forEach(b=>b.onclick=()=>fillPrompt('questionInput',b.dataset.fillQuestion));
  document.querySelectorAll('[data-method]').forEach(b=>b.onclick=()=>{state.method=b.dataset.method;renderInvestigation();updateLoopControls()});
}
function updateLoopControls(){
  setLoopButton('assumptionNext',Boolean($('assumptionInput').value.trim()));
  setLoopButton('questionNext',Boolean($('questionInput').value.trim()));
  setLoopButton('launchTest',Boolean(state.method&&$('testAudience').value.trim()&&$('testEvidence').value.trim()));
  const cycleReady=Boolean($('evidenceInput').value.trim()&&$('nextMoveInput').value.trim()&&document.querySelector('[name="assumptionResult"]:checked'));
  setLoopButton('restartLoop',cycleReady);setLoopButton('pauseLoop',cycleReady)
}
function resetInvestigation(){
  state.method='';
  ['assumptionInput','questionInput','testAudience','testEvidence','evidenceInput','surpriseInput','nextMoveInput'].forEach(id=>{if($(id))$(id).value=''});
  document.querySelectorAll('[name="assumptionResult"]').forEach(x=>x.checked=false);
  renderInvestigation();updateLoopControls();showLoopStep('loopAssumption')
}
function launchInvestigation(){
  const method=investigationMethods.find(x=>x.id===state.method);
  $('testSummary').innerHTML=`<p><strong>ההנחה:</strong> ${esc($('assumptionInput').value)}</p><p><strong>השאלה:</strong> ${esc($('questionInput').value)}</p><p><strong>הבדיקה:</strong> ${esc(method?.title)} עם ${esc($('testAudience').value)}</p><p><strong>נחפש:</strong> ${esc($('testEvidence').value)}</p>`;
  showLoopStep('loopAction')
}
function completeCycle(){
  const result=document.querySelector('[name="assumptionResult"]:checked')?.value||'';
  state.cycles.push({assumption:$('assumptionInput').value.trim(),question:$('questionInput').value.trim(),method:state.method,evidence:$('evidenceInput').value.trim(),surprise:$('surpriseInput').value.trim(),result,next:$('nextMoveInput').value.trim()})
}
function renderPedagogy(){const box=$('pedagogyMap');if(!state.selected){box.className='pedagogy-map empty-state';box.textContent='אחרי שתיבחר משימה, תופיע כאן המפה הסמויה שלה.';return}const m=state.selected;const subject=$('subject').value.trim(),unit=$('unit').value.trim(),goals=$('goals').value.trim(),limits=$('constraints').value.trim();box.className='pedagogy-map';box.innerHTML=`
  <section class="map-block"><h3>מה באמת נדרש כדי להצליח</h3><ul>${m.needs.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>
  <section class="map-block"><h3>רגעי Need to Know</h3><p>כשהקבוצה לא מצליחה ${state.desire==='play'?'לאזן את המשחק ולהסביר את התוצאה':'להוכיח שהקהל הגיב כפי שקיוותה'}, עוצרים ושואלים: איזה ידע יאפשר את הצעד הבא?</p></section>
  <section class="map-block"><h3>חיבור לתוכנית</h3><p>${subject?`<strong>${esc(subject)}${unit?' · '+esc(unit):''}</strong><br>`:''}${goals?esc(goals):'אפשר להזין מטרות למידה ולבדוק אילו מהן נחוצות באמת למשימה.'}</p></section>
  <section class="map-block"><h3>Knowledge on demand</h3><p>מקור קצר → שימוש מיידי באבטיפוס → בדיקה מול הקהל → רפלקציה על ההשפעה.</p></section>
  ${limits?`<section class="map-block"><h3>אילוצים שהוזנו</h3><p>${esc(limits)}</p></section>`:''}
  <section class="map-block warning"><h3>שמירה על שכבת הרצון</h3><p>לא להציג את מטרות הלמידה כדרישות לתלמידים. להכניס ידע רק כשהוא פותח חסימה ממשית במשימה.</p></section>`}

$('customInterest').addEventListener('input',e=>{state.interest=e.target.value.trim();document.querySelectorAll('.interest').forEach(x=>x.classList.remove('selected'));$('interestNext').disabled=!state.interest});
$('interestNext').onclick=()=>{if(!state.interest)return;$('interestEcho').textContent=state.interest;renderDesires();show('stepDesire')};
$('customDesire').addEventListener('input',e=>{state.desire=e.target.value.trim();document.querySelectorAll('.desire').forEach(x=>x.classList.remove('selected'));$('generate').disabled=!state.desire});
$('generate').onclick=()=>{if(!state.desire)return;renderMissions();show('stepMissions')};
document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>show(b.dataset.back));
$('startInvestigation').onclick=()=>{$('investigationLoop').classList.remove('hidden');renderInvestigation();showLoopStep('loopAssumption');updateLoopControls()};
document.querySelectorAll('[data-loop-next]').forEach(b=>b.onclick=()=>{if(!b.disabled)showLoopStep(b.dataset.loopNext)});
['assumptionInput','questionInput','testAudience','testEvidence','evidenceInput','surpriseInput','nextMoveInput'].forEach(id=>$(id).addEventListener('input',updateLoopControls));
document.querySelectorAll('[name="assumptionResult"]').forEach(x=>x.addEventListener('change',updateLoopControls));
$('launchTest').onclick=()=>{if(!$('launchTest').disabled)launchInvestigation()};
$('returnWithEvidence').onclick=()=>showLoopStep('loopEvidence');
$('restartLoop').onclick=()=>{if(!$('restartLoop').disabled){completeCycle();resetInvestigation()}};
$('pauseLoop').onclick=()=>{if(!$('pauseLoop').disabled){completeCycle();showLoopStep('loopPaused')}};
$('resumeLoop').onclick=resetInvestigation;
function teacher(open){$('teacherPanel').classList.toggle('open',open);$('teacherPanel').setAttribute('aria-hidden',String(!open));$('teacherToggle').setAttribute('aria-pressed',String(open))}
$('teacherToggle').onclick=()=>teacher(!$('teacherPanel').classList.contains('open'));$('teacherClose').onclick=()=>teacher(false);$('mapLearning').onclick=renderPedagogy;
renderInterests();
