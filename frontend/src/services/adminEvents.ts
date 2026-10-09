import { AdminAuthError } from './adminAuth';
export type EventStatus='DRAFT'|'ACTIVE'|'FINISHED';
export interface AdminEvent {
 id:string;name:string;slug:string;description:string|null;event_date:string;venue_name:string|null;address:string|null;maps_url:string|null;rsvp_deadline:string|null;status:EventStatus;additional_info:string|null;created_at:string;updated_at:string;
}
export interface EventInput {
 name:string;slug:string;description:string|null;eventDate:string;venueName:string|null;address:string|null;mapsUrl:string|null;rsvpDeadline:string|null;status:EventStatus;additionalInfo:string|null;
}
export class EventApiError extends Error {constructor(public readonly kind:'unauthorized'|'conflict'|'network'){super(kind)}}
async function request<T>(path:string,token:string,init?:RequestInit):Promise<T>{
 let response:Response;
 try{response=await fetch('/api/admin/events'+path,{...init,headers:{Authorization:'Bearer '+token,...init?.headers}})}
 catch{throw new EventApiError('network')}
 if(response.status===401||response.status===403)throw new EventApiError('unauthorized');
 if(response.status===400||response.status===404||response.status===409)throw new EventApiError('conflict');
 if(!response.ok)throw new EventApiError('network');
 try{return await response.json() as T}catch{throw new EventApiError('network')}
}
export async function listEvents(token:string):Promise<AdminEvent[]>{
 const data=await request<unknown>('',token);
 if(!Array.isArray(data))throw new EventApiError('network');
 return data as AdminEvent[];
}
export function createEvent(token:string,input:EventInput){return request<AdminEvent>('',token,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)})}
export function updateEvent(token:string,id:string,input:EventInput){return request<AdminEvent>('/'+encodeURIComponent(id),token,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)})}
export async function refreshAdminToken():Promise<string>{
 const {readSession,refresh,storeSession}=await import('./adminAuth');
 const session=readSession();
 if(!session)throw new AdminAuthError('invalid');
 const next=await refresh(session.refreshToken);
 storeSession(next);
 return next.accessToken;
}
