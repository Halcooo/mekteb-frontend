import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Badge, Button, Card, Dropdown, Form, Spinner } from 'react-bootstrap';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { chatApi } from '../api/chatApi';
import { commentsApi, type StudentComment } from '../api/commentsApi';
import { useAuth } from '../hooks/useAuth';
import { createOutgoingMessage, localDate, mergeMessages } from '../chat/messageModel';
import './StudentComments.scss';
import { chatDrafts } from '../chat/drafts';
import { authSession } from '../auth/browserSession';
import { formatDate } from '../utils/dateUtils';

interface Props { studentId:number; studentName:string; selectedDate?:string; isParent?:boolean; allowReplies?:boolean; focusCommentId?:number|null }
export default function StudentComments(props:Props) {
  return <ConversationMessages key={`${props.studentId}:${props.selectedDate??'all'}:${props.focusCommentId??'latest'}`} {...props}/>;
}
function ConversationMessages({studentId,studentName,selectedDate,isParent=false,allowReplies=false,focusCommentId}:Props) {
  const {user}=useAuth(); const {t,i18n}=useTranslation(); const client=useQueryClient();
  const [latest,setLatest]=useState(!focusCommentId);
  const draftKey=`${authSession.getSnapshot().session?.id}:${studentId}:${selectedDate??'all'}`;
  const [draft,setDraft]=useState(()=>chatDrafts.get(draftKey)?.text??'');
  const [reply,setReply]=useState<StudentComment|null>(()=>chatDrafts.get(draftKey)?.reply??null);
  const [outgoing,setOutgoing]=useState<ReturnType<typeof createOutgoingMessage>|null>(()=>chatDrafts.get(draftKey)?.outgoing??null);
  const [editing,setEditing]=useState<number|null>(null); const [editText,setEditText]=useState('');
  const [actionError,setActionError]=useState(false);
  const container=useRef<HTMLDivElement>(null); const nearBottom=useRef(true);
  const markReadRef=useRef<()=>void>(()=>{});
  const queryKey=['chat',user?.id,user?.role,studentId,selectedDate??'all',latest?'latest':focusCommentId];
  const query=useInfiniteQuery({queryKey,initialPageParam:(latest?undefined:(focusCommentId??0)+1) as number|undefined,
    queryFn:({pageParam,signal})=>chatApi.messages(studentId,selectedDate,pageParam,signal),
    getNextPageParam:page=>page.nextCursor??undefined,refetchInterval:5000,refetchOnWindowFocus:true,
  });
  const messages=useMemo(()=>mergeMessages(query.data?.pages??[]),[query.data]);
  useEffect(()=>{chatDrafts.set(draftKey,{text:draft,reply,outgoing});},[draftKey,draft,reply,outgoing]);
  const send=useMutation({mutationFn:chatApi.send,onSuccess:(_message,receipt)=>{
    if(chatDrafts.get(draftKey)?.outgoing?.clientMessageId===receipt.clientMessageId){
      chatDrafts.delete(draftKey);
      setOutgoing(null);setDraft('');setReply(null);setLatest(true);nearBottom.current=true;
    }
    void client.invalidateQueries({queryKey:['chat',user?.id]});
    void client.invalidateQueries({queryKey:['conversations']});
  }});
  useEffect(()=>{
    const lastId=messages[messages.length-1]?.id;
    const mark=()=>{
      if(lastId&&latest&&nearBottom.current&&document.visibilityState==='visible')void chatApi.markRead(studentId,lastId).then(()=>{
        void client.invalidateQueries({queryKey:['conversations']});window.dispatchEvent(new Event('mekteb:notifications'));
      }).catch(()=>{});
    };
    markReadRef.current=mark;
    mark();document.addEventListener('visibilitychange',mark);return()=>{markReadRef.current=()=>{};document.removeEventListener('visibilitychange',mark);};
  },[messages,latest,studentId,client]);
  useEffect(()=>{
    if (focusCommentId&&!latest) container.current?.querySelector(`[data-comment-id="${focusCommentId}"]`)?.scrollIntoView({block:'center'});
    else if(nearBottom.current&&container.current) container.current.scrollTop=container.current.scrollHeight;
  },[messages,focusCommentId,latest]);
  // A timed-out send may already be committed. Polling reconciles its receipt.
  useEffect(()=>{
    if(outgoing&&messages.some(m=>m.clientMessageId===outgoing.clientMessageId)) {
      setOutgoing(null);setDraft('');setReply(null);send.reset();
    }
  },[messages,outgoing,send]);
  const submit=()=>{
    const message=createOutgoingMessage(studentId,draft,reply?.date??selectedDate??localDate(),reply?.id);
    chatDrafts.set(draftKey,{text:draft,reply,outgoing:message});
    setOutgoing(message);send.mutate(message);
  };
  const mutateMessage=async(message:StudentComment,remove=false)=>{
    setActionError(false);
    try {
      if(remove) await commentsApi.deleteComment(message.id); else await commentsApi.updateComment(message.id,editText.trim());
      setEditing(null); await query.refetch();
    } catch {setActionError(true);}
  };
  const canSend=isParent||allowReplies||['admin','teacher'].includes(user?.role??'');
  const formatTime=(value:string)=>formatDate(value,'time',i18n.language);
  const formatDay=(value:string)=>formatDate(value,'long',i18n.language);
  return <Card className="student-comments chat-card">
    <Card.Header className="d-flex justify-content-between align-items-center"><strong><i className="bi bi-shield-check me-2" />{t('chat.conversation')}</strong><span className="small text-muted">{selectedDate?formatDate(selectedDate,'short',i18n.language):t('chat.allDates')}</span></Card.Header>
    <Card.Body>
      {(query.isError||actionError)&&<Alert variant="danger">{t('chat.loadError')} <Button variant="link" onClick={()=>void query.refetch()}>{t('chat.retry')}</Button></Alert>}
      {!latest&&<Button size="sm" variant="outline-primary" className="mb-2" onClick={()=>setLatest(true)}>{t('chat.latest')}</Button>}
        <div className="chat-history" ref={container} role="log" aria-label={`${t('chat.history')}: ${studentName}`} onScroll={()=>{const el=container.current;if(el){const wasNear=nearBottom.current;nearBottom.current=el.scrollHeight-el.scrollTop-el.clientHeight<100;if(!wasNear&&nearBottom.current)markReadRef.current();}}}>
        {query.hasNextPage&&<Button variant="link" disabled={query.isFetchingNextPage} onClick={()=>{nearBottom.current=false;void query.fetchNextPage();}}>{t('chat.older')}</Button>}
        {query.isLoading&&<Spinner animation="border" size="sm" />}
        {!query.isLoading&&messages.length===0&&<p className="text-muted text-center p-4">{t('chat.empty')}</p>}
        {messages.map((message,index)=>{
          const own=message.authorId===user?.id;
          const target=messages.find(m=>m.id===message.parentCommentId);
          return <div key={message.id}>
            {(index===0||messages[index-1].date!==message.date)&&<div className="chat-day">{formatDay(message.date)}</div>}
            <article data-comment-id={message.id} className={`chat-bubble ${own?'own':''} ${focusCommentId===message.id?'focused':''}`}>
              <div className="chat-meta"><strong>{message.authorName}</strong> <Badge bg={own?'light':'secondary'} text={own?'dark':undefined}>{t(`comments.${message.authorRole}`)}</Badge><time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time></div>
              {message.parentCommentId&&<blockquote>{target?.deletedAt?t('chat.deleted'):target?.content??t('chat.earlierReply')}</blockquote>}
              {editing===message.id?<Form onSubmit={e=>{e.preventDefault();void mutateMessage(message);}}><Form.Control as="textarea" value={editText} maxLength={2000} onChange={e=>setEditText(e.target.value)} aria-label={t('chat.edit')} /><Button size="sm" type="submit" disabled={!editText.trim()}>{t('save')}</Button><Button size="sm" variant="link" onClick={()=>setEditing(null)}>{t('cancel')}</Button></Form>:<p className={message.deletedAt?'text-muted fst-italic':''}>{message.deletedAt?t('chat.deleted'):message.content}</p>}
              {message.editedAt&&!message.deletedAt&&<small className="text-muted">{t('chat.edited')}</small>}
              {!message.deletedAt&&<Dropdown className="chat-actions" align="end">
                <Dropdown.Toggle variant="link" size="sm" className="chat-options" aria-label={t('chat.messageOptions')}>•••</Dropdown.Toggle>
                <Dropdown.Menu>
                  {canSend&&<Dropdown.Item onClick={()=>setReply(message)}><i className="bi bi-reply me-2"/>{t('comments.reply')}</Dropdown.Item>}
                  {(own||user?.role==='admin')&&<><Dropdown.Item onClick={()=>{setEditing(message.id);setEditText(message.content);}}><i className="bi bi-pencil me-2"/>{t('chat.edit')}</Dropdown.Item><Dropdown.Item className="text-danger" onClick={()=>{if(window.confirm(t('chat.deleteConfirm')))void mutateMessage(message,true);}}><i className="bi bi-trash me-2"/>{t('chat.delete')}</Dropdown.Item></>}
                </Dropdown.Menu>
              </Dropdown>}
            </article>
          </div>;
        })}
      </div>
      {outgoing&&<Alert className="mt-2" variant={!send.isPending?'warning':'info'} role="status">
        {!send.isPending?t('chat.sendFailed'):t('chat.sending')}
        {!send.isPending&&<><Button variant="link" disabled={send.isPending} onClick={()=>send.mutate(outgoing)}>{t('chat.retry')}</Button><Button variant="link" onClick={()=>{setOutgoing(null);send.reset();}}>{t('chat.dismissPending')}</Button></>}
      </Alert>}
      {canSend&&<Form className="chat-composer" onSubmit={e=>{e.preventDefault();submit();}}>
        {reply&&<div className="chat-reply-preview"><span>{t('comments.reply')}: {reply.content.slice(0,100)}</span><Button size="sm" variant="link" aria-label={t('cancel')} onClick={()=>setReply(null)}>×</Button></div>}
        <Form.Control as="textarea" rows={2} placeholder={t('chat.placeholder')} aria-label={t('chat.placeholder')} value={draft} disabled={Boolean(outgoing)} maxLength={2000} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)&&draft.trim()&&!outgoing){e.preventDefault();submit();}}} />
        <div className="composer-toolbar"><small className="text-muted"><span className="composer-shortcut">{t('shortcutsHint',{shortcut:navigator.platform.includes('Mac')?'⌘ + Enter':'Ctrl + Enter'})} · </span>{Array.from(draft).length}/2000</small><Button type="submit" disabled={!draft.trim()||Boolean(outgoing)}><i className="bi bi-send me-2"/>{t('chat.send')}</Button></div>
      </Form>}
    </Card.Body>
  </Card>;
}
