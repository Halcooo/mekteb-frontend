import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';
import i18next from 'i18next';
import {formatDate,formatDateForInput,parseDate,calculateAge,shiftCalendarMonth,formatRelativeTime} from '../src/utils/dateUtils.ts';
import {formatPercent} from '../src/utils/numberFormatter.ts';

test('attendance percentages accept database decimals and use Bosnian punctuation',()=>{
  assert.equal(formatPercent('60.00','bs'),'60,0%');
  assert.equal(formatPercent(5,'bs-BA'),'5,0%');
  assert.equal(formatPercent('60.00','en'),'60.0%');
  assert.equal(formatPercent(null,'bs'),'0,0%');
  assert.equal(formatPercent(Number.NaN,'bs'),'0,0%');
});

const root=new URL('../',import.meta.url);
const resources=Object.fromEntries(['bs','en'].map(lng=>[lng,JSON.parse(fs.readFileSync(new URL(`src/locales/${lng}.json`,root),'utf8'))]));
const flatten=(obj,prefix='')=>Object.fromEntries(Object.entries(obj).flatMap(([key,value])=>typeof value==='string'?[[prefix+key,value]]:Object.entries(flatten(value,prefix+key+'.'))));
const flat=Object.fromEntries(Object.entries(resources).map(([lng,value])=>[lng,flatten(value)]));

test('Bosnian and English have matching keys, nonempty text and matching interpolation parameters',()=>{
  assert.deepEqual(Object.keys(flat.bs).sort(),Object.keys(flat.en).sort());
  const parameters=text=>[...text.matchAll(/{{\s*([^{}]+?)\s*}}/g)].map(m=>m[1]).sort();
  for(const key of Object.keys(flat.bs)) {
    assert.ok(flat.bs[key].trim(),`Empty Bosnian text: ${key}`);assert.ok(flat.en[key].trim(),`Empty English text: ${key}`);
    assert.deepEqual(parameters(flat.bs[key]),parameters(flat.en[key]),`Interpolation mismatch: ${key}`);
  }
});
test('every literal translation used in application code exists in both languages without relying on fallback text',()=>{
  const missing=[];
  function scan(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())scan(file);else if(/\.tsx?$/.test(file)){const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);function visit(node){if(ts.isCallExpression(node)&&node.expression.getText(source)==='t'&&node.arguments.length){const arg=node.arguments[0];if(ts.isStringLiteral(arg)||ts.isNoSubstitutionTemplateLiteral(arg))for(const lng of ['bs','en'])if(!flat[lng][arg.text]&&!flat[lng][arg.text+'_other'])missing.push(`${lng}: ${arg.text} (${file})`);}ts.forEachChild(node,visit);}visit(source);}}}
  scan(fileURLToPath(new URL('src',root)));assert.deepEqual(missing,[]);
});
test('unread message counts use the correct Bosnian and English plural forms',async()=>{
  const i18n=i18next.createInstance();await i18n.init({resources:{bs:{translation:resources.bs},en:{translation:resources.en}},fallbackLng:false});
  assert.equal(i18n.t('chat.unreadCount',{lng:'bs',count:1}),'1 nepročitana poruka');
  assert.equal(i18n.t('chat.unreadCount',{lng:'bs',count:2}),'2 nepročitane poruke');
  assert.equal(i18n.t('chat.unreadCount',{lng:'bs',count:11}),'11 nepročitanih poruka');
  assert.equal(i18n.t('chat.unreadCount',{lng:'en',count:1}),'1 unread message');
  assert.equal(i18n.t('chat.unreadCount',{lng:'en',count:5}),'5 unread messages');
});
test('all display dates retain the required Bosnian format in both UI languages and safely handle invalid input',()=>{
  assert.equal(formatDate('2026-10-27','short','bs-BA'),'27.10.2026.');
  for(const lng of ['bs-BA','en-US'])for(const type of ['short','long','compact'])assert.equal(formatDate('2026-10-27',type,lng),'27.10.2026.');
  assert.equal(formatDate(new Date(2026,9,27,14,30),'dateTime','en'),'27.10.2026. 14:30');
  for(const invalid of ['2026-02-30','2025-02-29','not a date','2026-13-01','2026-00-01']){assert.equal(parseDate(invalid),null);assert.equal(formatDate(invalid),'');assert.equal(formatRelativeTime(invalid),'');}
  assert.equal(formatDateForInput('2024-02-29'),'2024-02-29');
});
test('calendar dates and date-of-birth inputs never shift a day across time zones or DST boundaries',()=>{
  const moduleURL=new URL('../src/utils/dateUtils.ts',import.meta.url).href;
  const code=`import {formatDateForInput,calculateAge} from ${JSON.stringify(moduleURL)}; console.log(JSON.stringify(['2026-01-01','2026-03-29','2026-10-25'].map(formatDateForInput))); console.log(calculateAge('2016-10-27',new Date(2026,9,27)));`;
  for(const TZ of ['Europe/Sarajevo','America/Los_Angeles','Pacific/Auckland']){
    const output=execFileSync(process.execPath,['--experimental-strip-types','--input-type=module','-e',code],{env:{...process.env,TZ},encoding:'utf8'}).trim().split('\n');
    assert.deepEqual(JSON.parse(output[0]),['2026-01-01','2026-03-29','2026-10-25']);assert.equal(output[1],'10');
  }
});
test('month and year navigation never skips February when starting at the end of a month',()=>{
  assert.equal(formatDateForInput(shiftCalendarMonth(new Date(2026,0,31),1)),'2026-02-01');
  assert.equal(formatDateForInput(shiftCalendarMonth(new Date(2026,2,31),-1)),'2026-02-01');
  assert.equal(formatDateForInput(shiftCalendarMonth(new Date(2024,1,29),12)),'2025-02-01');
  assert.equal(calculateAge('2016-10-28',new Date(2026,9,27)),9);
  assert.equal(calculateAge('2030-10-28',new Date(2026,9,27)),null);
});
