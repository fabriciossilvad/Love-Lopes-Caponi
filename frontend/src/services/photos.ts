export interface PublicPhoto {id:string;event_id:string|null;storage_path:string;caption:string|null;display_order:number;created_at:string;public_url:string}
export class PhotoError extends Error {}
export async function fetchPhotos(signal?:AbortSignal):Promise<PublicPhoto[]>{
 let response:Response;try{response=await fetch('/api/photos',{signal})}catch{throw new PhotoError('Falha de rede')}
 if(!response.ok)throw new PhotoError('Falha ao carregar fotos');
 const data:unknown=await response.json();
 if(!Array.isArray(data))throw new PhotoError('Resposta inválida');
 return data as PublicPhoto[];
}
