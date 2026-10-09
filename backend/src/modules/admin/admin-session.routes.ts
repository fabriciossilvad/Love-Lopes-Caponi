import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../../config/env.js';
import { getAuthenticatedAdmin } from './admin-auth.service.js';
const credentials=z.object({email:z.email(),password:z.string().min(1)});
const refreshSchema=z.object({refreshToken:z.string().min(1)});
function authClient(){const env=getEnv();return createClient(env.SUPABASE_URL.trim(),env.SUPABASE_ANON_KEY.trim(),{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})}
export const adminSessionRoutes:FastifyPluginAsync=async app=>{
 app.post('/login',async(request,reply)=>{
  const parsed=credentials.safeParse(request.body);
  if(!parsed.success)return reply.status(400).send({error:'INVALID_CREDENTIALS'});
  const client=authClient();
  const {data,error}=await client.auth.signInWithPassword(parsed.data);
  if(error||!data.session)return reply.status(401).send({error:'INVALID_CREDENTIALS'});
  const admin=await getAuthenticatedAdmin(data.session.access_token);
  if(!admin)return reply.status(403).send({error:'ADMIN_ACCESS_DENIED'});
  return {admin,accessToken:data.session.access_token,refreshToken:data.session.refresh_token,expiresAt:data.session.expires_at};
 });
 app.post('/refresh',async(request,reply)=>{
  const parsed=refreshSchema.safeParse(request.body);
  if(!parsed.success)return reply.status(401).send({error:'INVALID_SESSION'});
  const client=authClient();
  const {data,error}=await client.auth.refreshSession({refresh_token:parsed.data.refreshToken});
  if(error||!data.session)return reply.status(401).send({error:'INVALID_SESSION'});
  const admin=await getAuthenticatedAdmin(data.session.access_token);
  if(!admin)return reply.status(403).send({error:'ADMIN_ACCESS_DENIED'});
  return {admin,accessToken:data.session.access_token,refreshToken:data.session.refresh_token,expiresAt:data.session.expires_at};
 });
};
