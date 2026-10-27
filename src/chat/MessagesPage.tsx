import {useEffect,useMemo,useRef,useState} from 'react';
import {useInfiniteQuery,useQuery,useQueryClient} from '@tanstack/react-query';
import {Alert,Button,Form,Modal,Spinner} from 'react-bootstrap';
import {useSearchParams} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../hooks/useAuth';
import {notificationsApi} from '../api/notificationsApi';
import {chatApi,type Conversation} from '../api/chatApi';
import StudentComments from '../components/StudentComments';
import PushSettings from '../notifications/PushSettings';
import './MessagesPage.scss';
import {chatDrafts} from './drafts';
import {authSession} from '../auth/browserSession';
import {formatDate} from '../utils/dateUtils';

const initials=(name:string)=>name.split(' ').filter(Boolean).slice(0,2).map(p=>p[0]).join('').toUpperCase();
export default function MessagesPage(){
  const {user}=useAuth(),{t,i18n}=useTranslation();const[params,setParams]=useSearchParams();
  const queryClient=useQueryClient();
  useEffect(()=>{
    const inboxChanged=()=>void queryClient.invalidateQueries({queryKey:['conversations']});
    const chatChanged=()=>{inboxChanged();void queryClient.invalidateQueries({queryKey:['chat']});};
    window.addEventListener('mekteb:notifications',inboxChanged);window.addEventListener('mekteb:chat',chatChanged);
    return()=>{window.removeEventListener('mekteb:notifications',inboxChanged);window.removeEventListener('mekteb:chat',chatChanged);};
  },[queryClient]);
  const[search,setSearch]=useState(''),[unreadOnly,setUnreadOnly]=useState(false),[settings,setSettings]=useState(false);
  const[openTabs,setOpenTabs]=useState<Conversation[]>([]);
  const tabsRef=useRef<HTMLElement>(null);
  const notificationId=Number(params.get('notificationId'));
  const notification=useQuery({queryKey:['chat-notification',user?.id,notificationId],enabled:Number.isSafeInteger(notificationId)&&notificationId>0,queryFn:()=>notificationsApi.getById(notificationId)});
  const explicitId=Number(params.get('studentId'))||notification.data?.studentId||undefined;
  const inbox=useInfiniteQuery({queryKey:['conversations',user?.id,user?.role,search,unreadOnly],initialPageParam:1,queryFn:({pageParam,signal})=>chatApi.conversations(search,pageParam,signal,unreadOnly),getNextPageParam:(last,_all,page)=>last.hasMore?page+1:undefined,refetchInterval:10_000});
  const conversations=useMemo(()=>{const values=new Map<number,Conversation>();for(const page of inbox.data?.pages??[])for(const item of page.conversations)if(!values.has(item.studentId))values.set(item.studentId,item);return [...values.values()];},[inbox.data]);
  const selected=useQuery({queryKey:['conversation',user?.id,explicitId],enabled:Boolean(explicitId),queryFn:()=>chatApi.conversation(explicitId!)});
  const active=conversations.find(c=>c.studentId===explicitId)??selected.data;
  useEffect(()=>{
    if(active)setOpenTabs(current=>current.some(c=>c.studentId===active.studentId)?current:[...current,active]);
  },[active]);
  useEffect(()=>{tabsRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({block:'nearest',inline:'nearest'});},[explicitId,openTabs.length]);
  const focus=Number(params.get('commentId'))||notification.data?.commentId||undefined;
  const choose=(conversation:Conversation)=>{
    setOpenTabs(current=>current.some(c=>c.studentId===conversation.studentId)?current:[...current,conversation]);
    setParams({studentId:String(conversation.studentId)});
  };
  const closeTab=(id:number)=>{
    const remaining=openTabs.filter(c=>c.studentId!==id);setOpenTabs(remaining);
    if(explicitId===id)setParams(remaining.length?{studentId:String(remaining[remaining.length-1].studentId)}:{});
  };
  const preview=(conversation:Conversation)=>conversation.deletedAt?t('chat.deleted'):conversation.preview??t('chat.start');
  const time=(value:string|null)=>formatDate(value,'compact',i18n.language);
  const visible=unreadOnly?conversations.filter(c=>Number(c.unreadCount)>0):conversations;
  return <section className={`messages-workspace ${explicitId?'has-open-conversation':''}`}>
    <header className="messages-heading"><div><span className="eyebrow">{t('mekteb')} / {t(`comments.${user?.role==='user'?'parent':user?.role}`)}</span><h1>{t('chat.title')}</h1><p>{t('chat.workspaceDescription')}</p></div><Button variant="outline-success" aria-label={t('chat.notificationSettings')} onClick={()=>setSettings(true)}><i className="bi bi-sliders2 me-2" />{t('chat.notificationSettings')}</Button></header>
    <div className={`messenger-shell ${explicitId?'show-conversation':''}`}>
      <aside className="inbox-panel" aria-label={t('chat.conversations')}>
        <div className="inbox-heading"><h2>{t('chat.conversations')}</h2></div>
        <div className="inbox-search"><i className="bi bi-search"/><Form.Control type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('chat.searchStudents')} aria-label={t('chat.searchStudents')}/></div>
        <div className="inbox-filters"><Button size="sm" aria-pressed={!unreadOnly} variant={unreadOnly?'light':'success'} onClick={()=>setUnreadOnly(false)}>{t('chat.all')}</Button><Button size="sm" aria-pressed={unreadOnly} variant={unreadOnly?'success':'light'} onClick={()=>setUnreadOnly(true)}>{t('chat.unread')}</Button></div>
        <div className="conversation-list">
          {inbox.isLoading&&<div className="p-4 text-center"><Spinner animation="border" size="sm" /></div>}
          {inbox.isError&&<Alert variant="warning">{t('chat.loadError')} <Button variant="link" onClick={()=>void inbox.refetch()}>{t('chat.retry')}</Button></Alert>}
          {!inbox.isLoading&&!inbox.isError&&!visible.length&&<div className="inbox-empty"><i className={`bi ${search?'bi-search':unreadOnly?'bi-check2-circle':'bi-chat-dots'}`}/><p>{t(search?'chat.searchEmpty':unreadOnly?'chat.noUnread':'chat.noStudents')}</p>{search&&<Button variant="link" onClick={()=>setSearch('')}>{t('chat.clearSearch')}</Button>}</div>}
          {visible.map(conversation=>{const draft=chatDrafts.get(`${authSession.getSnapshot().session?.id}:${conversation.studentId}:all`);return <button key={conversation.studentId} type="button" className={`conversation-row ${active?.studentId===conversation.studentId?'active':''}`} aria-current={active?.studentId===conversation.studentId?'true':undefined} onClick={()=>choose(conversation)}>
            <span className="conversation-avatar">{initials(conversation.studentName)}</span><span className="conversation-copy"><span className="conversation-name">{conversation.studentName}<time>{time(conversation.lastMessageAt)}</time></span><span className="conversation-preview">{draft?.text?<><strong className="draft-label">{t('chat.draft')}: </strong>{draft.text}</>:preview(conversation)}</span><span className="conversation-caption">{t('chat.grade',{grade:conversation.gradeLevel})}</span></span>{Number(conversation.unreadCount)>0&&<span className="unread-dot" aria-label={t('chat.unreadCount',{count:Number(conversation.unreadCount)})}>{conversation.unreadCount}</span>}
          </button>;})}
          {inbox.hasNextPage&&<Button variant="link" disabled={inbox.isFetchingNextPage} onClick={()=>void inbox.fetchNextPage()}>{t('chat.moreConversations')}</Button>}
        </div>
        <footer className="inbox-footer"><i className="bi bi-lock me-2" />{t('chat.privateHint')}</footer>
      </aside>
      <div className="conversation-panel">
        {active?<>
          <header className="conversation-heading"><Button variant="light" className="mobile-back" aria-label={t('chat.back')} onClick={()=>setParams({})}><i className="bi bi-arrow-left"/></Button><span className="conversation-avatar">{initials(active.studentName)}</span><div><h2>{active.studentName}</h2><p>{t('chat.participants')} · {t('chat.grade',{grade:active.gradeLevel})}</p></div><i className="bi bi-shield-check conversation-shield" aria-label={t('chat.privateHint')}/></header>
          {openTabs.length>1&&<div className="open-conversations-bar"><span className="open-count" title={t('chat.openCount',{count:openTabs.length})}><i className="bi bi-window-stack"/><span>{openTabs.length}</span></span><nav ref={tabsRef} className="open-conversations" aria-label={t('chat.openConversations')}>{openTabs.map(tab=><span className={active.studentId===tab.studentId?'selected':''} key={tab.studentId}><button type="button" aria-current={active.studentId===tab.studentId?'page':undefined} onClick={()=>choose(tab)}>{tab.studentName}{Number(conversations.find(c=>c.studentId===tab.studentId)?.unreadCount)>0&&<i className="bi bi-circle-fill ms-1"/>}</button><button type="button" aria-label={`${t('chat.close')}: ${tab.studentName}`} onClick={()=>closeTab(tab.studentId)}>×</button></span>)}</nav></div>}
          <StudentComments key={`${active.studentId}:${focus??'latest'}`} studentId={active.studentId} studentName={active.studentName} isParent={['parent','user'].includes(user?.role??'')} allowReplies focusCommentId={focus}/>
        </>:selected.isLoading||notification.isLoading?<div className="conversation-placeholder"><Spinner animation="border"/></div>:<div className="conversation-placeholder"><span><i className="bi bi-chat-square-text"/></span><h2>{t('chat.chooseConversation')}</h2><p>{t('chat.chooseHint')}</p>{(selected.isError||notification.isError)&&<Alert variant="warning">{t('chat.notificationUnavailable')}</Alert>}</div>}
      </div>
    </div>
    <Modal show={settings} onHide={()=>setSettings(false)} centered><Modal.Header closeButton closeLabel={t("close")}><Modal.Title>{t('push.title')}</Modal.Title></Modal.Header><Modal.Body><PushSettings compact/></Modal.Body></Modal>
  </section>;
}
