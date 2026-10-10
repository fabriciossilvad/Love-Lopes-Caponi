import { readSession, refresh, storeSession } from './adminAuth';
import type { SiteContent } from './siteContents';
export class AdminSiteContentError extends Error {constructor(public readonly kind:'unauthorized'|'invalid'|'network'){super(kind)}}
async function request<T>(path:string,token:string,init?:RequestInit):Promise<T>{
 let response:Response;
 try{response=await fetch('/api/admin/site-contents'+path,{...init,headers:{Authorization:'Bearer '+token,...init?.headers}})}catch{throw new AdminSiteContentError('network')}
 if(response.status===401||response.status===403)throw new AdminSiteContentError('unauthorized');
 if([400,404,409].includes(response.status))throw new AdminSiteContentError('invalid');
 if(!response.ok)throw new AdminSiteContentError('network');
 try{return await response.json() as T}catch{throw new AdminSiteContentError('network')}
}
export async function listAdminSiteContents(token:string):Promise<SiteContent[]>{
 const data=await request<unknown>('',token);if(!Array.isArray(data))throw new AdminSiteContentError('network');
 return data as SiteContent[];
}
export function saveAdminSiteContent(token:string,key:string,value:string|null){
 return request<SiteContent>('/'+encodeURIComponent(key),token,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({value})});
}
export async function withContentAuth<T>(operation:(token:string)=>Promise<T>):Promise<T>{
 const session=readSession();if(!session)throw new AdminSiteContentError('unauthorized');
 try{return await operation(session.accessToken)}catch(error){
  if(!(error instanceof AdminSiteContentError)||error.kind!=='unauthorized')throw error;
  let next;try{next=await refresh(session.refreshToken)}catch{throw new AdminSiteContentError('unauthorized')}
  storeSession(next);return operation(next.accessToken);
 }
}
