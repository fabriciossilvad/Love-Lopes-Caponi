import type { InvitationContext } from '../types/invitation';
export class InvitationError extends Error { constructor(public readonly kind:'not-found'|'network'){super(kind)} }
export async function fetchInvitation(token:string, signal?:AbortSignal):Promise<InvitationContext>{
  let response:Response;
  try { response=await fetch('/api/invitations/'+encodeURIComponent(token),{signal}); }
  catch(error){ if(signal?.aborted) throw error; throw new InvitationError('network'); }
  if(response.status===400||response.status===404) throw new InvitationError('not-found');
  if(!response.ok) throw new InvitationError('network');
  const data:unknown=await response.json();
  if(!data||typeof data!=='object'||!('display_name' in data)||!('guests' in data)||typeof data.display_name!=='string'||!Array.isArray(data.guests)) throw new InvitationError('network');
  return data as InvitationContext;
}
