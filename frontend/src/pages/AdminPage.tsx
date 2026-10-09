import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import { CalendarDays, Gift, Heart, LayoutDashboard, LogOut, Mail, Menu, Users, X } from 'lucide-react';
import { AdminAuthError, getMe, login, readSession, refresh, storeSession, type AdminSession } from '../services/adminAuth';
const nav=[{to:'/admin',label:'Visão geral',icon:LayoutDashboard},{to:'/admin/eventos',label:'Eventos',icon:CalendarDays},{to:'/admin/convites',label:'Convites',icon:Mail},{to:'/admin/convidados',label:'Convidados',icon:Users},{to:'/admin/presentes',label:'Presentes',icon:Gift}];
export function AdminPage(){
 const [session,setSession]=useState<AdminSession|null>(readSession);
 const [checking,setChecking]=useState(true);
 const [error,setError]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [menu,setMenu]=useState(false);
 const navigate=useNavigate();
 const location=useLocation();
 useEffect(()=>{
  let active=true;
  async function verify(){
   const current=readSession();
   if(!current){if(active){setSession(null);setChecking(false)}return}
   try{
    let next=current;
    // Attempt validation first. Refresh only if the access token is expired or rejected.
    if(current.expiresAt && current.expiresAt*1000<Date.now()+60000){
     next=await refresh(current.refreshToken);
    }
    let admin;
    try{admin=await getMe(next.accessToken)}
    catch(error){
     if(!(error instanceof AdminAuthError)||error.kind!=='invalid')throw error;
     next=await refresh(current.refreshToken);
     admin=await getMe(next.accessToken);
    }
    if(active){next={...next,admin};storeSession(next);setSession(next);setError(null)}
   }catch(e){
    if(!active)return;
    if(e instanceof AdminAuthError&&e.kind==='network'){
     setError('Não foi possível validar a sessão. Verifique a conexão e tente novamente.');
    }else{
     storeSession(null);setSession(null);setError(null);
    }
   }finally{if(active)setChecking(false)}
  }
  void verify();return()=>{active=false}
 },[]);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();const form=new FormData(e.currentTarget);
  setBusy(true);setError(null);
  try{const next=await login(String(form.get('email')??''),String(form.get('password')??''));storeSession(next);setSession(next);navigate('/admin',{replace:true})}
  catch(e){setError(e instanceof AdminAuthError&&e.kind==='denied'?'Este usuário não possui acesso administrativo.':e instanceof AdminAuthError&&e.kind==='invalid'?'E-mail ou senha inválidos.':'Não foi possível entrar. Tente novamente.')}
  finally{setBusy(false)}
 }
 const logout=useCallback(()=>{storeSession(null);setSession(null);setError(null);navigate('/admin/login',{replace:true})},[navigate]);
 if(checking)return <main className="sans flex min-h-screen items-center justify-center">Verificando sessão...</main>;
 if(!session&&location.pathname!=="/admin/login"&&!error)return <Navigate to="/admin/login" replace/>;
 if(!session)return <main className="flex min-h-screen items-center justify-center px-5 py-12"><section className="w-full max-w-md rounded-2xl border border-[#e9e1d5] bg-white p-8 shadow-sm"><Heart size={28} className="mx-auto text-[#b5966c]"/><h1 className="mt-5 text-center text-3xl">Área administrativa</h1><p className="sans mt-3 text-center text-sm text-[#756d61]">Love, Lopes & Caponi</p><form onSubmit={e=>void submit(e)} className="sans mt-8 space-y-5"><label className="block text-sm">E-mail<input name="email" type="email" autoComplete="username" required className="mt-2 w-full rounded-lg border border-[#d9d0c4] p-3"/></label><label className="block text-sm">Senha<input name="password" type="password" autoComplete="current-password" required className="mt-2 w-full rounded-lg border border-[#d9d0c4] p-3"/></label>{error&&<p role="alert" className="text-sm text-[#9a4c40]">{error}</p>}<button disabled={busy} className="w-full rounded-full bg-[#40382e] px-5 py-3 text-white disabled:opacity-50">{busy?'Entrando...':'Entrar'}</button></form><Link to="/" className="sans mt-6 block text-center text-sm underline">Voltar ao site</Link></section></main>;
 if(location.pathname==="/admin/login")return <Navigate to="/admin" replace/>;
 return <div className="sans min-h-screen bg-[#faf8f3] md:flex">
  <aside className={`border-r border-[#e9e1d5] bg-white p-6 md:min-h-screen md:w-64 ${menu?'block':'hidden md:block'}`}><div className="flex items-center justify-between"><p className="font-serif text-xl">Love, Lopes & Caponi</p><button className="md:hidden" onClick={()=>setMenu(false)} aria-label="Fechar menu"><X/></button></div><p className="mt-2 text-xs uppercase tracking-widest text-[#a28b69]">Administração</p><nav className="mt-10 space-y-2">{nav.map(item=><NavLink key={item.to} end={item.to==='/admin'} to={item.to} onClick={()=>setMenu(false)} className={({isActive})=>`flex items-center gap-3 rounded-lg px-4 py-3 text-sm ${isActive?'bg-[#f0e9df] text-[#40382e]':'text-[#756d61] hover:bg-[#faf8f3]'}`}><item.icon size={18}/>{item.label}</NavLink>)}</nav></aside>
  <div className="min-w-0 flex-1"><header className="flex items-center justify-between border-b border-[#e9e1d5] bg-white px-6 py-5"><button onClick={()=>setMenu(v=>!v)} className="md:hidden" aria-label="Abrir menu"><Menu/></button><span className="hidden text-sm text-[#756d61] sm:block">Painel dos noivos</span><div className="flex items-center gap-4"><span className="text-sm">{session.admin.name}</span><button onClick={logout} className="inline-flex items-center gap-2 text-sm text-[#756d61]"><LogOut size={16}/>Sair</button></div></header><main className="mx-auto max-w-6xl p-6 sm:p-10"><Routes><Route index element={<Overview session={session} onExpired={logout}/>}/>{nav.slice(1).map(item=><Route key={item.to} path={item.to.replace('/admin/','')} element={<section><h1 className="font-serif text-3xl">{item.label}</h1><p className="mt-4 text-sm text-[#756d61]">Módulo administrativo previsto para as próximas entregas.</p></section>}/>)}<Route path="*" element={<Navigate to="/admin" replace/>}/></Routes></main></div>
 </div>
}
function Overview({session,onExpired}:{session:AdminSession;onExpired:()=>void}){
 const [events,setEvents]=useState<unknown[]|null>(null);
 const [error,setError]=useState<string|null>(null);
 useEffect(()=>{let active=true;fetch('/api/admin/events',{headers:{Authorization:'Bearer '+session.accessToken}}).then(async response=>{if(response.status===401||response.status===403){onExpired();return}if(!response.ok)throw new Error('Falha');const data:unknown=await response.json();if(active)setEvents(Array.isArray(data)?data:[])}).catch(()=>{if(active)setError('Não foi possível carregar os eventos.')});return()=>{active=false}},[session.accessToken,onExpired]);
 return <section><p className="text-xs uppercase tracking-widest text-[#a28b69]">Visão geral</p><h1 className="mt-3 font-serif text-3xl">Bem-vindo ao painel</h1><p className="mt-3 text-sm text-[#756d61]">Gerencie os preparativos das celebrações em um único lugar.</p><div className="mt-8 grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-[#e9e1d5] bg-white p-6"><CalendarDays className="text-[#b5966c]"/><p className="mt-4 text-3xl">{events===null?'—':events.length}</p><p className="mt-2 text-sm text-[#756d61]">Eventos cadastrados</p></div><div className="rounded-xl border border-[#e9e1d5] bg-white p-6"><Heart className="text-[#b5966c]"/><p className="mt-4 text-lg">Preparativos em andamento</p><p className="mt-2 text-sm text-[#756d61]">Outros indicadores serão adicionados com os próximos módulos.</p></div></div>{error&&<p role="alert" className="mt-5 text-sm text-[#9a4c40]">{error}</p>}</section>
}
