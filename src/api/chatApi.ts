import apiClient from './apiClient';
import type { StudentComment } from './commentsApi';
import type { createOutgoingMessage } from '../chat/messageModel';
export interface MessagePage { messages:StudentComment[]; hasMore:boolean; nextCursor:number|null }
export interface Conversation {studentId:number;studentName:string;gradeLevel:string;lastMessageId:number|null;preview:string|null;deletedAt:string|null;lastMessageAt:string|null;unreadCount:number}
export interface ConversationPage {conversations:Conversation[];hasMore:boolean}
export const chatApi = {
  async conversations(search:string,page:number,signal?:AbortSignal,unreadOnly=false):Promise<ConversationPage>{return(await apiClient.get<{data:ConversationPage}>('/chat/conversations',{params:{search,page,unreadOnly},signal})).data.data;},
  async conversation(id:number):Promise<Conversation>{return(await apiClient.get<{data:Conversation}>(`/chat/conversations/${id}`)).data.data;},
  async markRead(id:number,throughId:number){await apiClient.patch(`/chat/${id}/read`,{throughId});},
  async messages(studentId:number,date?:string,before?:number,signal?:AbortSignal):Promise<MessagePage> {
    return (await apiClient.get<{data:MessagePage}>(`/chat/${studentId}/messages`,{params:{date,before,limit:50},signal})).data.data;
  },
  async send(message:ReturnType<typeof createOutgoingMessage>):Promise<StudentComment> {
    return (await apiClient.post<{data:StudentComment}>(`/chat/${message.studentId}/messages`,message)).data.data;
  },
};
