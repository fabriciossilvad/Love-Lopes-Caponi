import { readSession, refresh, storeSession } from './adminAuth';
export type GiftStatus='ACTIVE'|'INACTIVE';
export interface AdminGift {id:string;event_id:string;category_id:string|null;name:string;description:string|null;image_path:string|null;estimated_value:number|null;quantity:number;status:GiftStatus;display_order:number;created_at:string;updated_at:string;events?:{id:string;name:string;slug:string}|null;gift_categories?:{id:string;name:string;slug:string}|null}
export interface GiftInput {eventId:string;categoryId:string|null;name:string;description:string|null;estimatedValue:number|null;quantity:number;status:GiftStatus;displayOrder:number}
export interface GiftImageResult {gift:AdminGift;imagePath:string;publicUrl:string}
export class AdminGiftError extends Error {constructor(public readonly kind:'unauthorized'|'invalid'|'network'|'too-large'|'type'){super(kind)}}
async function request<T>(path:string,token:string,init?:RequestInit):Promise<T>{
 let response:Response;
 try{response=await fetch('/api/admin/gifts'+path,{...init,headers:{Authorization:'Bearer '+token,...init?.headers}})}
 catch{throw new AdminGiftError('network')}
 if(response.status===401||response.status===403)throw new AdminGiftError('unauthorized');
 if(response.status===413)throw new AdminGiftError('too-large');
 if(response.status===415)throw new AdminGiftError('type');
 if([400,404,409].includes(response.status))throw new AdminGiftError('invalid');
 if(!response.ok)throw new AdminGiftError('network');
 try{return await response.json() as T}catch{throw new AdminGiftError('network')}
}
export async function listAdminGifts(token:string):Promise<AdminGift[]>{
 const data=await request<unknown>('',token);
 if(!Array.isArray(data))throw new AdminGiftError('network');
 return data as AdminGift[];
}
export function createAdminGift(token:string,input:GiftInput){return request<AdminGift>('',token,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)})}
export function updateAdminGift(token:string,id:string,input:GiftInput){return request<AdminGift>('/'+encodeURIComponent(id),token,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)})}
export function uploadGiftImage(token:string,id:string,file:File){
 const body=new FormData();body.append('file',file);
 return request<GiftImageResult>('/'+encodeURIComponent(id)+'/image',token,{method:'POST',body});
}
export async function withGiftAuth<T>(operation:(token:string)=>Promise<T>):Promise<T>{
 const session=readSession();if(!session)throw new AdminGiftError('unauthorized');
 try{return await operation(session.accessToken)}
 catch(error){
  if(!(error instanceof AdminGiftError)||error.kind!=='unauthorized')throw error;
  let next;
  try{next=await refresh(session.refreshToken)}catch{throw new AdminGiftError('unauthorized')}
  storeSession(next);
  return operation(next.accessToken);
 }
}
