import { readSession, refresh, storeSession } from './adminAuth';
export interface AdminPhoto {id:string;event_id:string|null;storage_path:string;public_url?:string;caption:string|null;display_order:number;active:boolean;created_at:string;updated_at:string;events?:{id:string;name:string;slug:string}|null}
export interface PhotoFields {eventId:string|null;caption:string|null;displayOrder:number;active:boolean}
export class AdminPhotoError extends Error {constructor(public readonly kind:'unauthorized'|'invalid'|'too-large'|'type'|'network'){super(kind)}}
async function request<T>(path:string,token:string,init?:RequestInit):Promise<T>{
 let response:Response;
 try{response=await fetch('/api/admin/photos'+path,{...init,headers:{Authorization:'Bearer '+token,...init?.headers}})}catch{throw new AdminPhotoError('network')}
 if(response.status===401||response.status===403)throw new AdminPhotoError('unauthorized');
 if(response.status===413)throw new AdminPhotoError('too-large');
 if(response.status===415)throw new AdminPhotoError('type');
 if([400,404,409].includes(response.status))throw new AdminPhotoError('invalid');
 if(!response.ok)throw new AdminPhotoError('network');
 try{return await response.json() as T}catch{throw new AdminPhotoError('network')}
}
export async function listAdminPhotos(token:string):Promise<AdminPhoto[]>{
 const data=await request<unknown>('',token);
 if(!Array.isArray(data))throw new AdminPhotoError('network');
 return data as AdminPhoto[];
}
export function createAdminPhoto(token:string,file:File,fields:PhotoFields){
 const form=new FormData();
 form.append('file',file);
 if(fields.eventId)form.append('eventId',fields.eventId);
 if(fields.caption)form.append('caption',fields.caption);
 form.append('displayOrder',String(fields.displayOrder));
 form.append('active',String(fields.active));
 return request<{photo:AdminPhoto;publicUrl:string}>('',token,{method:'POST',body:form});
}
export function updateAdminPhoto(token:string,id:string,fields:PhotoFields){
 return request<AdminPhoto>('/'+encodeURIComponent(id),token,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(fields)});
}
export async function withPhotoAuth<T>(operation:(token:string)=>Promise<T>):Promise<T>{
 const session=readSession();if(!session)throw new AdminPhotoError('unauthorized');
 try{return await operation(session.accessToken)}catch(err){
  if(!(err instanceof AdminPhotoError)||err.kind!=='unauthorized')throw err;
  let next;try{next=await refresh(session.refreshToken)}catch{throw new AdminPhotoError('unauthorized')}
  storeSession(next);return operation(next.accessToken);
 }
}
