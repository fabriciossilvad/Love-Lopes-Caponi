import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchInvitation, InvitationError } from './invitations';
afterEach(()=>vi.unstubAllGlobals());
describe('fetchInvitation',()=>{
 it('loads invitation context',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>({display_name:'Família Teste',guests:[]})}));await expect(fetchInvitation('valid-token')).resolves.toMatchObject({display_name:'Família Teste'});});
 it('rejects missing invitation',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:404}));await expect(fetchInvitation('invalid')).rejects.toEqual(new InvitationError('not-found'));});
 it('rejects malformed responses',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>({unexpected:true})}));await expect(fetchInvitation('token')).rejects.toEqual(new InvitationError('network'));});
});
