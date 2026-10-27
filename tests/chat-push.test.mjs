import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createDraftMemory,createOutgoingMessage,localDate,mergeMessages} from '../src/chat/messageModel.ts';
test('retry retains a stable message receipt while distinct sends have independent identities',()=>{
 const message=createOutgoingMessage(7,'  Hello  ','2026-10-17',41,'11111111-1111-4111-8111-111111111111');
 assert.equal(message.content,'Hello');assert.equal(message.date,'2026-10-17');assert.equal(message.parentCommentId,41);
 assert.equal(JSON.parse(JSON.stringify(message)).clientMessageId,message.clientMessageId);
 assert.notEqual(createOutgoingMessage(7,'Hello','2026-10-17').clientMessageId,message.clientMessageId);
 assert.throws(()=>createOutgoingMessage(7,' ','2026-10-17'));assert.throws(()=>createOutgoingMessage(7,'a'.repeat(2001),'2026-10-17'));
});
test('cursor page overlap is deduplicated with newest edits winning and chronological ordering',()=>{
 const result=mergeMessages([{messages:[{id:3,content:'edited'},{id:4}]},{messages:[{id:1},{id:2},{id:3,content:'old'}]}]);
 assert.deepEqual(result.map(m=>m.id),[1,2,3,4]);assert.equal(result[2].content,'edited');
});
test('each open conversation keeps its own draft and clearing the session removes every draft',()=>{
 const memory=createDraftMemory();memory.set('sessionA:11',{text:'First draft'});memory.set('sessionA:22',{text:'Second draft'});
 assert.equal(memory.get('sessionA:11').text,'First draft');assert.equal(memory.get('sessionA:22').text,'Second draft');
 assert.equal(memory.get('sessionB:11'),undefined);memory.clear();assert.equal(memory.get('sessionA:11'),undefined);assert.equal(memory.get('sessionA:22'),undefined);
});
test('chat dates follow the local calendar rather than UTC conversion',()=>{assert.equal(localDate(new Date(2026,0,2,0,15)),'2026-01-02');});
async function workerFixture(){
 const handlers=new Map(),shown=[],opened=[],closed=[];const settings=new Map([['binding','current-session'],['language','bs']]);
 const self={location:{origin:'https://mekteb.example'},addEventListener:(type,fn)=>handlers.set(type,fn),skipWaiting:async()=>{},clients:{claim:async()=>{},matchAll:async()=>[],openWindow:async url=>opened.push(url)},registration:{showNotification:async(title,options)=>shown.push({title,...options}),getNotifications:async()=>[]}};
 const context=vm.createContext({self,URL,console});vm.runInContext(await fs.readFile(new URL('../public/sw.js',import.meta.url),'utf8'),context);
 // Isolate persistent storage at its boundary; event handling remains real SW code.
 context.bindingStore=async(mode,op)=>op({get:key=>settings.get(key),put:(value,key)=>{settings.set(key,value);}});
 return {shown,opened,closed,setBinding:value=>{settings.set('binding',value);},async dispatch(type,details){let pending;handlers.get(type)({...details,waitUntil:promise=>{pending=promise;}});await pending;}};
}
test('closed-app push displays only a generic notification, ignoring supplied private text and URLs',async()=>{
 const worker=await workerFixture();await worker.dispatch('push',{data:{json:()=>({notificationId:17,binding:'current-session',body:'Private child details',url:'https://evil.example'})}});
 assert.equal(worker.shown.length,1);assert.equal(worker.shown[0].body,'Imate novu poruku u aplikaciji.');assert.equal(worker.shown[0].tag,'mekteb-17');assert.ok(!JSON.stringify(worker.shown).includes('Private child'));
});
test('late pushes from another account and malformed identifiers do not display',async()=>{
 const worker=await workerFixture();for(const payload of [{notificationId:1,binding:'old-session'},{notificationId:-1,binding:'current-session'},{notificationId:'1',binding:'current-session'}])await worker.dispatch('push',{data:{json:()=>payload}});
 worker.setBinding(null);await worker.dispatch('push',{data:{json:()=>({notificationId:2,binding:'current-session'})}});assert.equal(worker.shown.length,0);
});
test('notification clicks open only the local authenticated conversation route',async()=>{
 const worker=await workerFixture();await worker.dispatch('notificationclick',{notification:{data:{notificationId:8,binding:'current-session',url:'https://evil.example'},close:()=>{}}});assert.deepEqual(worker.opened,['https://mekteb.example/messages?notificationId=8']);
 worker.setBinding('different-session');await worker.dispatch('notificationclick',{notification:{data:{notificationId:9,binding:'current-session'},close:()=>{}}});assert.equal(worker.opened.length,1);
});
test('closed-app push follows the last selected UI language without changing account binding',async()=>{
 const worker=await workerFixture();
 await worker.dispatch('message',{data:{type:'PUSH_LANGUAGE',language:'en'}});
 await worker.dispatch('push',{data:{json:()=>({notificationId:17,binding:'current-session'})}});
 assert.equal(worker.shown[0].body,'You have a new message in the app.');
 await worker.dispatch('message',{data:{type:'PUSH_LANGUAGE',language:'bs'}});
 await worker.dispatch('push',{data:{json:()=>({notificationId:18,binding:'current-session'})}});
 assert.equal(worker.shown[1].body,'Imate novu poruku u aplikaciji.');
});
