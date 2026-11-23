import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const js = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');

class Element {
  constructor(id, dataset = {}) {
    this.id = id; this.dataset = dataset; this.value = '';
    this.textContent = ''; this.innerHTML = ''; this.style = {};
    this.children = []; this.listeners = {}; this.onclick = null;
    this.classes = new Set();
    this.classList = {
      add: value => this.classes.add(value),
      remove: value => this.classes.delete(value),
      contains: value => this.classes.has(value),
      toggle: (value, enabled) => enabled ? this.classes.add(value) : this.classes.delete(value)
    };
    this.subElements = new Map();
  }
  appendChild(value) { this.children.push(value); }
  addEventListener(name, cb) { (this.listeners[name] ||= []).push(cb); }
  setAttribute() {}
  querySelector(selector) {
    if (!this.subElements.has(selector)) this.subElements.set(selector, new Element(selector));
    return this.subElements.get(selector);
  }
  click() { if (this.onclick) this.onclick({target:this}); for (const cb of this.listeners.click||[]) cb({target:this}); }
  input(value) { this.value=value; for (const cb of this.listeners.input||[]) cb({target:this}); }
}
function mount() {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  const elements = new Map(ids.map(x=>[x,new Element(x)]));
  const nav = [...html.matchAll(/<button class="nav-item[^"]*" data-view="([^"]+)"/g)]
    .map(m=>new Element('nav-'+m[1],{view:m[1]}));
  const tabs = [...html.matchAll(/<button class="report-tab[^"]*" data-report="([^"]+)"/g)]
    .map(m=>new Element('tab-'+m[1],{report:m[1]}));
  const views = ids.filter(x=>x.startsWith('view-')).map(x=>elements.get(x));
  const lookup = id => elements.get(id)||null;
  const document = {
    documentElement:{lang:'en',dir:'ltr'},
    getElementById:lookup,
    createElement:tag=>new Element(tag),
    querySelectorAll(selector) {
      if(selector==='.nav-item')return nav;
      if(selector==='.view')return views;
      if(selector==='.report-tab')return tabs;
      return [];
    },
    querySelector(selector) {
      const match=selector.match(/^\[data-view="([^"]+)"\]$/);
      return match ? nav.find(x=>x.dataset.view===match[1])||null : null;
    }
  };
  const state={
    communityName:'Spark Match Sales Coaching',communityId:null,userKey:'mock-user',myProfileId:null,
    taxonomy:{offers:['Discovery calls','Objection handling'],needs:['Discovery calls','Objection handling'],meetingStyles:[],openness:[],availability:[]},
    me:{name:'Alex',title:'Founder',bio:'I practice consultative selling',photo:'',offers:['Discovery calls'],needs:['Objection handling'],availability:['Tuesday'],meetingStyles:['30-minute role-play'],openness:[],currentFocus:'Improve pipeline',braindateOffer:'Practice',lookingToMeet:'',email:'',phone:''},
    people:[{id:'profile-2',user_key:'mock-peer',name:'Jordan',title:'Coach',bio:'Sales mentor',offers:['Objection handling'],needs:['Discovery calls'],availability:['Tuesday'],meetingStyles:['30-minute role-play'],openness:[]}],
    savedConnections:[],invites:[],activeReport:'needs',online:false
  };
  const storage=new Map([['sparkMatchSalesV1',JSON.stringify(state)]]);
  const localStorage={
    getItem:key=>storage.has(key)?storage.get(key):null,
    setItem:(key,value)=>storage.set(key,String(value)),
    removeItem:key=>storage.delete(key)
  };
  const alerts=[];
  const ctx=vm.createContext({window:{supabase:null},document,localStorage,navigator:{clipboard:{writeText:async()=>{}}},
    console,crypto:{randomUUID:()=>'mock-uuid'},alert:(text)=>alerts.push(text),
    URL, URLSearchParams, Date, Blob, Math, setTimeout});
  vm.runInContext(js,ctx,{timeout:3000});
  return {lookup,nav,tabs,views,alerts,ctx};
}
test('initial render connects primary views without Supabase and shows mock matches',()=>{
  const app=mount();
  assert.equal(app.lookup('matchesList').children.length,1);
  assert.match(app.lookup('profileCompleteness').textContent,/%/);
  assert.equal(app.lookup('dbStatus').textContent,'Supabase is not loaded');
  const matchesNav=app.nav.find(x=>x.dataset.view==='matches');
  matchesNav.click();
  assert.equal(app.lookup('view-matches').classList.contains('active'),true);
});
test('editing the form updates public preview and supports matching controls',()=>{
  const app=mount();
  app.lookup('name').input('Taylor');
  assert.equal(app.lookup('publicName').textContent,'Taylor');
  app.lookup('meetingStyle').input('30-minute role-play');
  app.lookup('availability').input('Tuesday, Thursday');
  assert.equal(vm.runInContext('state.me.availability.join("|")',app.ctx),'Tuesday|Thursday');
});
test('inviting a match uses the visible invite form rather than a missing modal',()=>{
  const app=mount();
  app.lookup('matchesList').children[0].querySelector('.invite-btn').click();
  assert.equal(app.lookup('view-invites').classList.contains('active'),true);
  assert.match(app.lookup('inviteTitle').value,/Jordan/);
  assert.match(app.lookup('inviteMessage').value,/Spark Match/);
});
test('dashboard renders the reporting tabs already present in the page',()=>{
  const app=mount();
  const offersTab=app.tabs.find(x=>x.dataset.report==='offers');
  offersTab.click();
  assert.match(app.lookup('adminReport').innerHTML,/Discovery calls/);
});
