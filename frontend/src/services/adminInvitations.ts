import { readSession, refresh, storeSession } from './adminAuth';

export type InvitationStatus='ACTIVE'|'DISABLED';
export type RsvpStatus='PENDING'|'CONFIRMED'|'DECLINED';
export interface Invitation {id:string;display_name:string;token:string;status:InvitationStatus;internal_notes:string|null;created_at:string;updated_at:string}
export interface GuestEvent {event_id:string;rsvp_status:RsvpStatus;responded_at:string|null;events:{id:string;name:string;slug:string;event_date:string;rsvp_deadline:string|null;status:string}|null}
export interface InvitationGuest {id:string;invitation_id:string;name:string;phone:string|null;email:string|null;notes:string|null;status:string;guest_events:GuestEvent[]}
export interface InvitationDetails extends Invitation {guests:InvitationGuest[]}
export interface InvitationInput {displayName:string;internalNotes:string|null;status:InvitationStatus}
export interface InvitationFilters {eventId?:string;rsvpStatus?:RsvpStatus}
export class InvitationApiError extends Error {constructor(public readonly kind:'unauthorized'|'invalid'|'network'){super(kind)}}
async function request<T>(path:string,token:string,init?:RequestInit):Promise<T>{
 let response:Response;
 try{response=await fetch('/api/admin/invitations'+path,{...init,headers:{Authorization:'Bearer '+token,...init?.headers}})}
 catch{throw new InvitationApiError('network')}
 if(response.status===401||response.status===403)throw new InvitationApiError('unauthorized');
 if(response.status===400||response.status===404||response.status===409)throw new InvitationApiError('invalid');
 if(!response.ok)throw new InvitationApiError('network');
 try{return await response.json() as T}catch{throw new InvitationApiError('network')}
}
export async function withAdminAuth<T>(operation:(token:string)=>Promise<T>):Promise<T>{
 const session=readSession();if(!session)throw new InvitationApiError('unauthorized');
 try{return await operation(session.accessToken)}
 catch(error){
  if(!(error instanceof InvitationApiError)||error.kind!=='unauthorized')throw error;
  let next;
  try{next=await refresh(session.refreshToken)}catch{throw new InvitationApiError('unauthorized')}
  storeSession(next);
  return operation(next.accessToken);
 }
}
export async function listInvitations(token:string,filters:InvitationFilters={}):Promise<Invitation[]>{
 const params=new URLSearchParams();
 if(filters.eventId)params.set('eventId',filters.eventId);
 if(filters.rsvpStatus)params.set('rsvpStatus',filters.rsvpStatus);
 const suffix=params.size?'?'+params.toString():'';
 const result=await request<unknown>(suffix,token);
 if(!Array.isArray(result))throw new InvitationApiError('network');
 return result as Invitation[];
}
export function getInvitation(token:string,id:string){return request<InvitationDetails>('/'+encodeURIComponent(id),token)}
export function createInvitation(token:string,input:InvitationInput){return request<Invitation>('',token,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)})}
export function updateInvitation(token:string,id:string,input:InvitationInput){return request<Invitation>('/'+encodeURIComponent(id),token,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)})}
export function invitationLink(token:string,origin:string){return origin+'/convite/'+encodeURIComponent(token)}
