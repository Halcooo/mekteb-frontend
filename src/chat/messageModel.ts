export interface MessageIdentity { id: number; clientMessageId?: string }
export function mergeMessages<T extends MessageIdentity>(pages: { messages: T[] }[]): T[] {
  const messages = new Map<number,T>();
  // First page is newest and wins if a refetch overlaps older pages.
  for (const page of [...pages].reverse()) for (const message of page.messages) messages.set(message.id,message);
  return [...messages.values()].sort((a,b) => a.id-b.id);
}
export function localDate(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
export function createOutgoingMessage(studentId:number, content:string, date:string, parentCommentId?:number, id=crypto.randomUUID()) {
  const text=content.trim();
  if (!text || Array.from(text).length>2000) throw new Error('INVALID_MESSAGE');
  return { studentId,content:text,date,parentCommentId,clientMessageId:id };
}
export function createDraftMemory<T>() {
  const values=new Map<string,T>();
  return {get:(key:string)=>values.get(key),set:(key:string,value:T)=>values.set(key,value),delete:(key:string)=>values.delete(key),clear:()=>values.clear()};
}
