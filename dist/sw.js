/* Push-only service worker. Private API responses are never cached. */
function bindingStore(mode, operation) {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open('mekteb-push',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('settings');
    request.onerror=()=>reject(request.error);
    request.onsuccess=()=>{
      const db=request.result, transaction=db.transaction('settings',mode);
      let result;
      const action=operation(transaction.objectStore('settings'));
      action.onsuccess=()=>{result=action.result;};
      transaction.oncomplete=()=>{db.close();resolve(result);};
      transaction.onerror=()=>{db.close();reject(transaction.error);};
    };
  });
}
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{
  if(event.data?.type==='PUSH_LANGUAGE'){
    event.waitUntil(bindingStore('readwrite',store=>store.put(event.data.language==='en'?'en':'bs','language')));
    return;
  }
  if(event.data?.type!=='PUSH_BINDING')return;
  const binding=typeof event.data.binding==='string'?event.data.binding:null;
  event.waitUntil((async()=>{
    await bindingStore('readwrite',store=>store.put(binding,'binding'));
    await bindingStore('readwrite',store=>store.put(event.data.language==='en'?'en':'bs','language'));
    const notifications=await self.registration.getNotifications();
    for(const notification of notifications)if(!binding||notification.data?.binding!==binding)notification.close();
    event.ports?.[0]?.postMessage({ok:true});
  })());
});
self.addEventListener('push',event=>event.waitUntil((async()=>{
  let payload;
  try {payload=event.data?.json();}catch{return;}
  if(!payload||!Number.isSafeInteger(payload.notificationId)||payload.notificationId<=0)return;
  const binding=await bindingStore('readonly',store=>store.get('binding'));
  // A late push from a previous account must not show after logout or a switch.
  if(!binding||binding!==payload.binding)return;
  const language=await bindingStore('readonly',store=>store.get('language'));
  await self.registration.showNotification('Mekteb E-dnevnik',{
    body:language==='en'?'You have a new message in the app.':'Imate novu poruku u aplikaciji.',icon:'/icons/icon-192.png',badge:'/icons/badge.png',
    tag:`mekteb-${payload.notificationId}`,renotify:false,
    data:{notificationId:payload.notificationId,binding},
  });
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const client of windows)client.postMessage({type:'NOTIFICATIONS_CHANGED'});
})()));
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil((async()=>{
    const binding=await bindingStore('readonly',store=>store.get('binding'));
    if(!binding||binding!==event.notification.data?.binding)return;
    const id=event.notification.data.notificationId;
    if(!Number.isSafeInteger(id)||id<=0)return;
    const url=new URL(`/messages?notificationId=${id}`,self.location.origin).href;
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const client=windows.find(item=>new URL(item.url).origin===self.location.origin);
    if(client){await client.navigate(url);await client.focus();}else await self.clients.openWindow(url);
  })());
});
