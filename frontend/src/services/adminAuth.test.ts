import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminAuthError, getMe, login, refresh } from './adminAuth';
afterEach(()=>vi.unstubAllGlobals());
const session={admin:{userId:'u1',email:'admin@example.test',name:'Admin',role:'ADMIN'},accessToken:'access',refreshToken:'refresh',expiresAt:2000000000};
describe('admin auth API',()=>{
 it('logs in using backend endpoint',async()=>{const fn=vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>session});vi.stubGlobal('fetch',fn);await expect(login('admin@example.test','password')).resolves.toEqual(session);expect(fn.mock.calls[0][0]).toBe('/api/admin/login')});
 it('rejects unauthorized login',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:401}));await expect(login('admin@example.test','bad')).rejects.toEqual(new AdminAuthError('invalid'))});
 it('refreshes session',async()=>{const fn=vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>session});vi.stubGlobal('fetch',fn);await expect(refresh('refresh')).resolves.toEqual(session);expect(fn.mock.calls[0][0]).toBe('/api/admin/refresh')});
 it('sends bearer token for admin verification',async()=>{const fn=vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>session.admin});vi.stubGlobal('fetch',fn);await expect(getMe('access')).resolves.toEqual(session.admin);expect(fn.mock.calls[0][1].headers.Authorization).toBe('Bearer access')});
});
