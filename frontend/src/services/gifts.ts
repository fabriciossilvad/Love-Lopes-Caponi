export interface Gift { gift_id:string;category_id:string|null;category_name:string|null;name:string;description:string|null;image_path:string|null;image_url?:string|null;estimated_value:number|null;quantity:number;available_quantity:number;display_order:number }
export interface Reservation { reservation_id:string;gift_id:string;event_id?:string;status:'ACTIVE'|'CANCELLED';reserved_at:string }
export class GiftError extends Error { constructor(public readonly kind:'unavailable'|'network'){super(kind)} }
async function request<T>(url:string,init?:RequestInit):Promise<T>{let response:Response;try{response=await fetch(url,init)}catch(e){if(init?.signal?.aborted)throw e;throw new GiftError('network')}if([400,403,404,409].includes(response.status))throw new GiftError('unavailable');if(!response.ok)throw new GiftError('network');try{return await response.json() as T}catch{throw new GiftError('network')}}
export async function fetchGifts(token:string,eventId:string,signal?:AbortSignal):Promise<Gift[]>{const data=await request<unknown>('/api/events/'+encodeURIComponent(eventId)+'/gifts?token='+encodeURIComponent(token),{signal});if(!Array.isArray(data))throw new GiftError('network');return data as Gift[]}
export async function reserveGift(token:string,giftId:string):Promise<Reservation>{const data=await request<Reservation>('/api/gift-reservations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,giftId})});if(!data?.reservation_id||data.gift_id!==giftId||data.status!=='ACTIVE')throw new GiftError('network');return data}
export async function cancelGift(token:string,reservationId:string):Promise<void>{await request<unknown>('/api/gift-reservations/'+encodeURIComponent(reservationId),{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})})}

export async function fetchMyReservations(token:string,signal?:AbortSignal):Promise<Reservation[]>{
 const data=await request<unknown>('/api/gift-reservations?token='+encodeURIComponent(token),{signal});
 if(!Array.isArray(data)||!data.every(item=>item&&typeof item==='object'&&typeof item.reservation_id==='string'&&typeof item.gift_id==='string'&&typeof item.event_id==='string'&&item.status==='ACTIVE'))throw new GiftError('network');
 return data as Reservation[];
}
