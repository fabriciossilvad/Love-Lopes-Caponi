export interface AdminUser {userId:string;email:string|null;name:string;role:string}
export interface AdminSession {admin:AdminUser;accessToken:string;refreshToken:string;expiresAt:number}
const KEY='llc-admin-session';
export function readSession():AdminSession|null {try{const raw=sessionStorage.getItem(KEY);if(!raw)return null;const value:unknown=JSON.parse(raw);if(!value||typeof value!=='object'||!('accessToken' in value)||!('refreshToken' in value)||!('admin' in value))return null;return value as AdminSession}catch{return null}}
export function storeSession(session:AdminSession|null){if(session)sessionStorage.setItem(KEY,JSON.stringify(session));else sessionStorage.removeItem(KEY)}
export class AdminAuthError extends Error {constructor(public readonly kind:'invalid'|'denied'|'network'){super(kind)}}
async function request(url:string,body:object):Promise<AdminSession>{
 let response:Response;try{response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})}catch{throw new AdminAuthError('network')}
 if(response.status===401||response.status===400)throw new AdminAuthError('invalid');
 if(response.status===403)throw new AdminAuthError('denied');
 if(!response.ok)throw new AdminAuthError('network');
 const data:unknown=await response.json();
 if(!data||typeof data!=='object'||!('accessToken' in data)||typeof data.accessToken!=='string'||!('refreshToken' in data)||typeof data.refreshToken!=='string'||!('admin' in data)||!data.admin)throw new AdminAuthError('network');
 return data as AdminSession;
}
export function login(email:string,password:string){return request('/api/admin/login',{email,password})}
export function refresh(refreshToken:string){return request('/api/admin/refresh',{refreshToken})}
export async function getMe(accessToken:string):Promise<AdminUser>{let response:Response;try{response=await fetch('/api/admin/me',{headers:{Authorization:'Bearer '+accessToken}})}catch{throw new AdminAuthError('network')}if(response.status===401||response.status===403)throw new AdminAuthError('invalid');if(!response.ok)throw new AdminAuthError('network');return response.json() as Promise<AdminUser>}
