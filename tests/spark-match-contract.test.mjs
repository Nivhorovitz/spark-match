import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');

function sourceBetween(start, end) {
  const a = app.indexOf(start);
  const b = app.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, 'Expected source boundary: ' + start);
  return app.slice(a, b);
}
const matchingSource = sourceBetween('function calcMatches()', 'async function saveConnection');
const renderSource = sourceBetween('function renderMatches()', 'function renderSaved()');

function fixture(overrides = {}) {
  return {
    name: 'Alex', bio: 'Practicing sales',
    offers: ['Discovery calls'], needs: ['Objection handling'],
    meetingStyles: ['30-minute role-play'], availability: ['Tuesday'],
    openness: ['Open to anyone in the community'],
    ...overrides
  };
}
function engine(state, render = false) {
  const cards = [];
  const list = { innerHTML: '', appendChild(card) { cards.push(card); } };
  const context = {
    state, cards, console, list,
    document: {
      createElement() {
        return { innerHTML: '', className: '', querySelector() { return { onclick: null }; } };
      }
    },
    $: id => id === 'matchesList' ? list : null,
    openInvite() {}, saveConnection() {},
    unique: arr => [...new Set((arr || []).filter(Boolean))]
  };
  const source = "function escapeHtml(value) { return String(value ?? '').replace(/[&<>\"']/g, ch => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', \"'\":'&#39;'}[ch])); }\n" +
    matchingSource + '\n' + (render ? renderSource : '');
  vm.runInNewContext(source, context, { timeout: 1500 });
  return { matches: context.calcMatches(), render: () => context.renderMatches(), cards, list };
}

test('public HTML and controller agree on the primary user journey', () => {
  const expectedIds = ['dbStatus','profileCompleteness','publicName','publicTitle','publicBio',
    'publicTags','offersTags','needsTags','matchesList','savedList','roomsList','adminReport',
    'inviteTitle','inviteMessage','inviteTimes','createInvite'];
  for (const id of expectedIds) {
    assert.match(html, new RegExp('id="' + id + '"'));
    assert.ok(app.includes("'"+id+"'"), 'app.js does not target visible element #' + id);
  }
  for (const view of ['profile','matches','saved','invites','rooms','admin']) {
    assert.match(html, new RegExp('id="view-' + view + '"'));
  }
  assert.match(app, /'view-'\\s*\\+\\s*btn\.dataset\.view/);
});

test('reciprocal, single-sided and unrelated candidates rank by evidence', () => {
  const me = fixture();
  const people = [
    {id:'unrelated',...fixture({offers:[],needs:[],meetingStyles:[],availability:[],openness:[]})},
    {id:'helpful',...fixture({offers:['Objection handling'],needs:[],meetingStyles:[],availability:[],openness:[]})},
    {id:'reciprocal',...fixture({offers:['Objection handling'],needs:['Discovery calls']})}
  ];
  const matches = engine({ me, people }).matches;
  assert.equal(matches[0].id, 'reciprocal');
  assert.equal(matches[1].id, 'helpful');
  assert.equal(matches[2].id, 'unrelated');
  assert.ok(matches[2].score <= 20, 'no tag overlap should not look like a strong match');
  assert.ok(matches[0].reasons.some(x => /you|both|practice/i.test(x)), 'English app needs English reasons');
});

test('matching normalizes case and whitespace without counting duplicates twice', () => {
  const me = fixture({needs:[' Objection Handling ', 'objection handling'],offers:['discovery calls']});
  const clean = fixture({offers:['objection handling'],needs:['Discovery Calls']});
  const repeated = fixture({offers:['Objection Handling','Objection Handling'],needs:['Discovery Calls']});
  const matches = engine({me,people:[{id:'clean',...clean},{id:'repeat',...repeated}]}).matches;
  assert.equal(matches[0].score, matches[1].score);
  assert.ok(matches[0].reasons.length);
});

test('member data is rendered as text, not injected HTML', () => {
  const injected = '<img src=x onerror=alert(1)>';
  const state = {me:fixture(),people:[{id:'x',...fixture({name:injected,offers:['Objection handling'],needs:['Discovery calls'],bio:injected,title:injected})}]};
  const appVm = engine(state, true);
  appVm.render();
  assert.equal(appVm.cards.length, 1);
  const markup = appVm.cards[0].innerHTML;
  assert.ok(!markup.includes(injected), 'raw HTML injection is present');
  assert.ok(markup.includes('&lt;img'), 'malicious text must be escaped');
});

test('the sales coaching community stays separate from other Sparkco communities', () => {
  assert.match(app, /\.eq\('name','Spark Match Sales Coaching'\)/);
  assert.doesNotMatch(app, /\.eq\('name','Sparkco Spark Match'\)/);
});
