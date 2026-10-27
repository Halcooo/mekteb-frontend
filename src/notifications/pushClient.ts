import apiClient from '../api/apiClient';
import { authSession } from '../auth/browserSession';
import i18n from '../i18n';

export function supportsPush():boolean {
  return window.isSecureContext&&'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
}
export async function registerPushWorker() {
  if(!('serviceWorker' in navigator)||!window.isSecureContext)return null;
  return navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'});
}
let bindingVersion=0;
export async function setPushBinding(binding:string|null):Promise<void> {
  const version=++bindingVersion;
  if(!('serviceWorker' in navigator))return;
  const registration=await navigator.serviceWorker.getRegistration('/');
  if(version!==bindingVersion)return;
  const worker=registration?.active;
  if(!worker)return;
  const channel=new MessageChannel();
  await new Promise<void>((resolve,reject)=>{
    const timeout=window.setTimeout(()=>{channel.port1.close();reject(new Error('WORKER_TIMEOUT'));},5000);
    channel.port1.onmessage=()=>{clearTimeout(timeout);channel.port1.close();resolve();};
    worker.postMessage({type:'PUSH_BINDING',binding,language:i18n.resolvedLanguage},[channel.port2]);
  });
}
export async function syncPushLanguage(language:string) {
  if (!('serviceWorker' in navigator)) return;
  const registration=await navigator.serviceWorker.getRegistration('/');
  registration?.active?.postMessage({type:'PUSH_LANGUAGE',language});
}
const isCurrent=(sid:string)=>authSession.getCurrent()?.id===sid;
export async function getPushStatus() {
  const config=(await apiClient.get<{data:{enabled:boolean;publicKey:string|null}}>('/push/config')).data.data;
  const registration=await navigator.serviceWorker.getRegistration('/');
  const subscription=await registration?.pushManager.getSubscription();
  return {...config,subscribed:Boolean(subscription),subscription};
}
export async function syncPushSubscription(sid:string) {
  if(!supportsPush()||Notification.permission!=='granted')return;
  await registerPushWorker();
  const ready=await navigator.serviceWorker.ready;
  const subscription=await ready.pushManager.getSubscription();
  if(!subscription||!isCurrent(sid))return;
  const config=(await apiClient.get<{data:{enabled:boolean;publicKey:string|null}}>('/push/config')).data.data;
  if(!config.enabled||!isCurrent(sid))return;
  await apiClient.post('/push/subscription',subscription.toJSON());
  if(isCurrent(sid))await setPushBinding(sid);
}
export async function enablePush(sid:string) {
  // Invoke requestPermission directly in the click handler's call stack (iOS).
  const permission=await Notification.requestPermission();
  if(permission!=='granted')throw new Error('PERMISSION_DENIED');
  await registerPushWorker();
  const registration=await navigator.serviceWorker.ready;
  const config=(await apiClient.get<{data:{enabled:boolean;publicKey:string|null}}>('/push/config')).data.data;
  if(!config.enabled||!config.publicKey)throw new Error('PUSH_NOT_CONFIGURED');
  let subscription=await registration.pushManager.getSubscription();
  const bytes=Uint8Array.from(atob(config.publicKey.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
  if(subscription&&subscription.options.applicationServerKey&&new Uint8Array(subscription.options.applicationServerKey).some((b,index)=>b!==bytes[index])){await subscription.unsubscribe();subscription=null;}
  if(!isCurrent(sid))return;
  subscription??=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});
  if(!isCurrent(sid))return;
  await apiClient.post('/push/subscription',subscription.toJSON());
  if(isCurrent(sid))await setPushBinding(sid);
}
export async function disablePush() {
  await apiClient.delete('/push/subscription');
  await setPushBinding(null);
  const registration=await navigator.serviceWorker.getRegistration('/');
  await (await registration?.pushManager.getSubscription())?.unsubscribe();
}
