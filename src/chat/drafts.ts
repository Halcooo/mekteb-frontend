import { createDraftMemory, type createOutgoingMessage } from './messageModel';
import type { StudentComment } from '../api/commentsApi';
import { authSession } from '../auth/browserSession';
export interface ChatDraft {text:string;reply:StudentComment|null;outgoing:ReturnType<typeof createOutgoingMessage>|null}
export const chatDrafts=createDraftMemory<ChatDraft>();
authSession.onSessionBoundary(()=>chatDrafts.clear());
