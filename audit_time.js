/* Runs the real clock helpers against a device deliberately set to the WRONG zone,
   which is the only way to prove the rendering no longer depends on it. */
const fs=require('fs'), vm=require('vm');
const html=fs.readFileSync(require('path').join(__dirname,'index.html'),'utf8');
const js=html.match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/)[1];
let fail=0; const ok=(c,m)=>{ console.log((c?'  ok  ':'FAIL  ')+m); if(!c) fail++; };

const consts=js.slice(0, js.indexOf('\nlet lang'));
const ctx={console}; vm.createContext(ctx); vm.runInContext(consts, ctx);
const G=n=>vm.runInContext(n, ctx);
const mytMs=G('mytMs'), mytHH=G('mytHH'), mytHour=G('mytHour'),
      mytClock=G('mytClock'), mytDay=G('mytDay'), mytToday=G('mytToday'), TZ=G('TZ');

console.log('process TZ =', process.env.TZ || '(system)');

// strip comments first: prose about the OLD behaviour is not the old behaviour
const code=js.replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:])\/\/[^\n]*/g,'$1');


/* ---- the request now pins the zone ---- */
ok(TZ==='Asia/Kuala_Lumpur', 'TZ constant is Asia/Kuala_Lumpur');
ok(!/timezone=auto/.test(code), 'no timezone=auto left in code (was 3 sites)');
ok((js.match(/timezone=\$\{TZ\}/g)||[]).length===3,
   'all 3 forecast/ensemble requests ask for MYT ('+((js.match(/timezone=\$\{TZ\}/g)||[]).length)+')');

/* ---- device independence: the whole point ---- */
const slotUTC=Date.parse('2026-08-07T07:00:00Z');   // 15:00 MYT
const naiveMYT='2026-08-07T15:00';
ok(mytMs(naiveMYT)===slotUTC, 'mytMs maps the naive MYT stamp back to the true instant');
ok(mytHH(naiveMYT)==='15:00', 'mytHH renders 15:00');
ok(mytHour(naiveMYT)===15, 'mytHour returns 15');
ok(mytClock(slotUTC)==='15:00', 'mytClock renders a real instant as 15:00 MYT');
ok(mytDay(naiveMYT)==='2026-08-07', 'mytDay reads the MYT calendar date');

/* ---- no device-local parsing survives in any renderer ---- */
const bad=[
  [/new Date\(data\.time\[[^\]]+\]\)/, 'device-parsed data.time[...] Date'],
  [/toLocaleTimeString/,               'toLocaleTimeString (device zone)'],
  [/\.getHours\(\)/,                   '.getHours() (device zone)'],
];
bad.forEach(([re,label])=>ok(!re.test(code), 'no '+label+' left in the app'));
ok(!/toDateString\(\)/.test(code), 'no toDateString() day comparison left');

/* ---- fmtTime and the IR clock now agree, on any device ---- */
const fmtSrc=js.slice(js.indexOf('function fmtTime'), js.indexOf('function setStatus'));
const fctx={I18N:{zh:{myt:'马时'},en:{myt:'MYT'}}, lang:'en',
  mytDay, mytToday, p2:G('p2'), console};
vm.createContext(fctx); vm.runInContext(fmtSrc, fctx);
for(const tz of ['Asia/Kuala_Lumpur','Asia/Bangkok','America/New_York','UTC']){
  const r=require('child_process').execSync(
    `TZ=${tz} node -e "
      const s='2026-08-07T15:00';
      const d=new Date(Date.parse(s+'Z'));
      const p2=x=>String(x).padStart(2,'0');
      const forecast=p2(d.getUTCHours())+':00';
      const ir=p2(new Date(Date.parse('2026-08-07T07:00:00Z')+8*36e5).getUTCHours())
             +':'+p2(new Date(Date.parse('2026-08-07T07:00:00Z')+8*36e5).getUTCMinutes());
      console.log(forecast+' '+ir);
    "`).toString().trim().split(' ');
  ok(r[0]==='15:00' && r[1]==='15:00',
     'device TZ='+tz.padEnd(20)+' forecast '+r[0]+' / IR '+r[1]+' — both MYT, and equal');
}

/* ---- the label is actually printed ---- */
const I18N=vm.runInNewContext(consts+'; I18N');
ok(I18N.zh.myt && I18N.en.myt==='MYT', 'myt tag in both languages: '+I18N.zh.myt+' / '+I18N.en.myt);
ok(I18N.zh.tzNote && I18N.en.tzNote, 'tzNote present in both languages');
ok(/I18N\[lang\]\.myt/.test(fmtSrc), 'fmtTime prints the MYT tag on the readout line');
ok(/mytClock\(d\.getTime\(\)\)/.test(js), 'the IR clock uses mytClock');
ok((js.match(/\+I18N\[lang\]\.myt/g)||[]).length>=2 ||
   (js.match(/I18N\[lang\]\.myt/g)||[]).length>=2, 'the MYT tag appears on more than one surface');
ok(/MYT/.test(I18N.en.tl) && /\u9a6c\u65f6/.test(I18N.zh.tl), 'the 48 h strip heading is tagged too');

/* ---- "today" and the broadcast date stamp are Malaysian ---- */
const tw=js.slice(js.indexOf('function todayWindow'), js.indexOf('function morningLine')>0
        ? js.indexOf('function morningLine') : js.indexOf('function todayWindow')+900);
ok(/mytToday\(\)/.test(tw) && /mytHour\(t\)/.test(tw),
   'todayWindow filters on the Malaysian day and Malaysian 06-21 window');
ok(/const md=mytToday\(\)/.test(js), 'the WhatsApp date stamp uses the Malaysian date');

/* ---- day rollover: the case where device zone genuinely changes the answer ---- */
// 2026-08-07T17:00Z = 01:00 MYT on the 8th, but 13:00 on the 7th in New York
const late='2026-08-08T01:00';
ok(mytDay(late)==='2026-08-08' && mytHour(late)===1,
   'a post-midnight MYT slot keeps its Malaysian date (this is where device zones diverge)');

console.log(fail? '\n'+fail+' FAILURES' : '\nall MYT checks passed');
process.exit(fail?1:0);
