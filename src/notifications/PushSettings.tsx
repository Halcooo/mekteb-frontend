import { useEffect,useState } from 'react';
import { Alert,Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { authSession } from '../auth/browserSession';
import { disablePush,enablePush,getPushStatus,supportsPush } from './pushClient';
export default function PushSettings({compact=false}:{compact?:boolean}){
  const {t}=useTranslation(); const supported=supportsPush();
  const [state,setState]=useState<{enabled:boolean;subscribed:boolean}|null>(null);const [error,setError]=useState(false);const [busy,setBusy]=useState(false);
  useEffect(()=>{let active=true;if(supported)void getPushStatus().then(value=>{if(active)setState(value);}).catch(()=>{if(active)setError(true);});return()=>{active=false;};},[supported]);
  const toggle=async()=>{
    const sid=authSession.getCurrent()?.id;if(!sid)return;
    setBusy(true);setError(false);
    try{if(state?.subscribed)await disablePush();else await enablePush(sid);setState(await getPushStatus());}catch{setError(true);}finally{setBusy(false);}
  };
  return <div className={`push-settings ${compact?'compact':''}`}>
    <h2 className="push-settings-title">{t('push.title')}</h2>
    <p className="small text-muted mb-2">{t('push.description')}</p>
    {!supported?<Alert variant="info" className="small mb-0">{t('push.unsupported')}</Alert>:<>
      {!state?.enabled&&state&&<p className="small text-muted">{t('push.notConfigured')}</p>}
      {Notification.permission==='denied'&&<p className="small text-warning-emphasis">{t('push.denied')}</p>}
      <Button size="sm" variant="outline-success" disabled={busy||!state||(!state.subscribed&&(!state.enabled||Notification.permission==='denied'))} onClick={()=>void toggle()}>{busy?t('push.working'):state?.subscribed?t('push.disable'):t('push.enable')}</Button>
    </>}
    <p className="small text-muted mt-2 mb-0">{t('push.iphone')}</p>
    {error&&<Alert variant="warning" className="small mt-2 mb-0">{t('push.error')} <Button variant="link" size="sm" onClick={()=>{void getPushStatus().then(value=>{setState(value);setError(false);}).catch(()=>setError(true));}}>{t('chat.retry')}</Button></Alert>}
  </div>;
}
