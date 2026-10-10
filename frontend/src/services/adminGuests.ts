import { readSession, refresh, storeSession } from './adminAuth';
export type GuestStatus='ACTIVE'|'INACTIVE';
export interface GuestInput {invitationId:string;name:string;phone:string|null;email:string|null;notes:string|null;status:GuestStatus;eventIds:string[]}
export type GuestUpdate=Omit<GuestInput,'invitationId'|'eventIds'>;
export class GuestApiError extends Error {constructor(public readonly kind:'unauthorized'|'invalid'|'network'){super(kind)}}
async function request<T>(path:string,token:string,method:string,body:object):Promise<T>{
 let response:Response;
 try{response=await fetch('/api/admin/guests'+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)})}
 catch{throw new GuestApiError('network')}
 if(response.status===401||response.status===403)throw new GuestApiError('unauthorized');
 if([400,404,409].includes(response.status))throw new GuestApiError('invalid');
 if(!response.ok)throw new GuestApiError('network');
 try{return await response.json() as T}catch{throw new GuestApiError('network')}
}
export function createGuest(token:string,input:GuestInput){return request<unknown>('',token,'POST',input)}
export function updateGuest(token:string,id:string,input:GuestUpdate){return request<unknown>('/'+encodeURIComponent(id),token,'PATCH',input)}
export function setGuestEvents(token:string,id:string,eventIds:string[]){return request<unknown>('/'+encodeURIComponent(id)+'/events',token,'PUT',{eventIds})}
export async function withGuestAuth<T>(operation:(token:string)=>Promise<T>):Promise<T>{
 const session=readSession();if(!session)throw new GuestApiError('unauthorized');
 try{return await operation(session.accessToken)}
 catch(error){
  if(!(error instanceof GuestApiError)||error.kind!=='unauthorized')throw error;
  let next;
  try{next=await refresh(session.refreshToken)}catch{throw new GuestApiError('unauthorized')}
  storeSession(next);
  return operation(next.accessToken);
 }
}
