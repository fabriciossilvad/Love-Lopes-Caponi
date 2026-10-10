import { readSession, refresh, storeSession } from './adminAuth';
export type ReservationStatus='ACTIVE'|'CANCELLED';
export interface AdminReservation {id:string;status:ReservationStatus;reserved_at:string;cancelled_at:string|null;created_at:string;updated_at:string;gifts:{id:string;name:string;event_id:string;events:{id:string;name:string;slug:string}|null}|null;invitations:{id:string;display_name:string}|null;guests:{id:string;name:string}|null}
export class AdminReservationError extends Error {constructor(public readonly kind:'unauthorized'|'invalid'|'network'){super(kind)}}
async function request<T>(path:string,token:string,method='GET'):Promise<T>{
 let response:Response;
 try{response=await fetch('/api/admin/gift-reservations'+path,{method,headers:{Authorization:'Bearer '+token}})}
 catch{throw new AdminReservationError('network')}
 if(response.status===401||response.status===403)throw new AdminReservationError('unauthorized');
 if([400,404,409].includes(response.status))throw new AdminReservationError('invalid');
 if(!response.ok)throw new AdminReservationError('network');
 try{return await response.json() as T}catch{throw new AdminReservationError('network')}
}
export async function listAdminReservations(token:string):Promise<AdminReservation[]>{
 const data=await request<unknown>('',token);
 if(!Array.isArray(data))throw new AdminReservationError('network');
 return data as AdminReservation[];
}
export function cancelAdminReservation(token:string,id:string){return request<unknown>('/'+encodeURIComponent(id),token,'DELETE')}
export async function withReservationAuth<T>(operation:(token:string)=>Promise<T>):Promise<T>{
 const session=readSession();if(!session)throw new AdminReservationError('unauthorized');
 try{return await operation(session.accessToken)}
 catch(error){
  if(!(error instanceof AdminReservationError)||error.kind!=='unauthorized')throw error;
  let next;
  try{next=await refresh(session.refreshToken)}catch{throw new AdminReservationError('unauthorized')}
  storeSession(next);
  return operation(next.accessToken);
 }
}
