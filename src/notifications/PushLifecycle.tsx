import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { registerPushWorker, setPushBinding, syncPushSubscription, syncPushLanguage } from './pushClient';
import { authSession } from '../auth/browserSession';
import {useTranslation} from 'react-i18next';
export default function PushLifecycle(){
  const {accessToken}=useAuth();
  const {i18n}=useTranslation();
  useEffect(()=>{void syncPushLanguage(i18n.resolvedLanguage??'bs').catch(()=>{});},[i18n.resolvedLanguage]);
  // A refreshed access token retains sid. Effects below remain harmless on refresh.
  useEffect(()=>{
    let active=true;
    void (async()=>{
      await registerPushWorker();
      if(!active||!accessToken)return;
      const sid=authSession.getCurrent()?.id;
      if(sid&&active)await syncPushSubscription(sid);
    })().catch(()=>{/* Settings exposes unavailable/disabled push without blocking login. */});
    return()=>{active=false;};
  },[accessToken]);
  useEffect(()=>{
    const listener=(event:MessageEvent)=>{if(event.data?.type==='NOTIFICATIONS_CHANGED'){window.dispatchEvent(new Event('mekteb:notifications'));window.dispatchEvent(new Event('mekteb:chat'));}};
    navigator.serviceWorker?.addEventListener('message',listener);
    return()=>navigator.serviceWorker?.removeEventListener('message',listener);
  },[]);
  useEffect(()=>{
    const clear=()=>void setPushBinding(null).catch(()=>{});
    return authSession.onSessionBoundary(clear);
  },[]);
  return null;
}
