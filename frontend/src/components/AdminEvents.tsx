import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { CalendarDays, Pencil, Plus, RefreshCw, X } from 'lucide-react';
import { createEvent, EventApiError, listEvents, updateEvent, type AdminEvent, type EventInput, type EventStatus } from '../services/adminEvents';
import { readSession, refresh, storeSession } from '../services/adminAuth';
import type { AdminSession } from '../services/adminAuth';

const statusNames:Record<EventStatus,string>={DRAFT:'Rascunho',ACTIVE:'Ativo',FINISHED:'Finalizado'};
const blank={name:'',slug:'',description:'',eventDate:'',venueName:'',address:'',mapsUrl:'',rsvpDeadline:'',status:'DRAFT' as EventStatus,additionalInfo:''};
type FormState=typeof blank;
function localValue(iso:string|null){if(!iso)return '';const d=new Date(iso);if(Number.isNaN(d.getTime()))return '';const offset=d.getTimezoneOffset()*60000;return new Date(d.getTime()-offset).toISOString().slice(0,16)}
function fromEvent(event:AdminEvent):FormState{return {name:event.name,slug:event.slug,description:event.description??'',eventDate:localValue(event.event_date),venueName:event.venue_name??'',address:event.address??'',mapsUrl:event.maps_url??'',rsvpDeadline:localValue(event.rsvp_deadline),status:event.status,additionalInfo:event.additional_info??''}}
function toPayload(form:FormState):EventInput{
 const text=(s:string)=>s.trim()||null;
 return {name:form.name.trim(),slug:form.slug.trim(),description:text(form.description),eventDate:new Date(form.eventDate).toISOString(),venueName:text(form.venueName),address:text(form.address),mapsUrl:text(form.mapsUrl),rsvpDeadline:form.rsvpDeadline?new Date(form.rsvpDeadline).toISOString():null,status:form.status,additionalInfo:text(form.additionalInfo)};
}
async function authorized<T>(operation:(token:string)=>Promise<T>):Promise<T>{
 const current=readSession();if(!current)throw new EventApiError('unauthorized');
 try{return await operation(current.accessToken)}
 catch(error){
  if(!(error instanceof EventApiError)||error.kind!=='unauthorized')throw error;
  const renewed=await refresh(current.refreshToken);
  storeSession(renewed);
  return operation(renewed.accessToken);
 }
}
export function AdminEvents({session,onExpired}:{session:AdminSession;onExpired:()=>void}){
 const [events,setEvents]=useState<AdminEvent[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState<string|null>(null);
 const [feedback,setFeedback]=useState<string|null>(null);
 const [editing,setEditing]=useState<AdminEvent|null|undefined>(undefined);
 const [form,setForm]=useState<FormState>(blank);
 const [saving,setSaving]=useState(false);
 const [revision,setRevision]=useState(0);
 const load=useCallback(()=>setRevision(n=>n+1),[]);
 useEffect(()=>{
  let active=true;
  setLoading(true);setError(null);
  authorized(token=>listEvents(token)).then(data=>{if(active)setEvents(data)}).catch(e=>{
   if(!active)return;
   if(e instanceof EventApiError&&e.kind==='unauthorized'){onExpired();return}
   setError('Não foi possível carregar os eventos. Tente novamente.');
  }).finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[session.accessToken,revision,onExpired]);
 function open(event?:AdminEvent){setEditing(event??null);setForm(event?fromEvent(event):{...blank});setFeedback(null);setError(null)}
 function set<K extends keyof FormState>(key:K,value:FormState[K]){setForm(prev=>({...prev,[key]:value}))}
 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setError(null);setFeedback(null);
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)){setError('O identificador deve conter apenas letras minúsculas, números e hífens.');return}
  if(!form.eventDate||Number.isNaN(new Date(form.eventDate).getTime())){setError('Informe uma data válida para o evento.');return}
  if(form.rsvpDeadline&&new Date(form.rsvpDeadline)>new Date(form.eventDate)){setError('O prazo de confirmação não pode ser posterior ao evento.');return}
  setSaving(true);
  try{
   const payload=toPayload(form);
   if(editing)await authorized(token=>updateEvent(token,editing.id,payload));
   else await authorized(token=>createEvent(token,payload));
   setEditing(undefined);setFeedback(editing?'Evento atualizado com sucesso.':'Evento cadastrado com sucesso.');load();
  }catch(err){
   if(err instanceof EventApiError&&err.kind==='unauthorized'){onExpired();return}
   setError(err instanceof EventApiError&&err.kind==='conflict'?'Não foi possível salvar. Verifique os dados e se o identificador já está em uso.':'Falha ao salvar o evento. Tente novamente.');
  }finally{setSaving(false)}
 }
 return <section className="sans">
  <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-[#a28b69]">Administração</p><h1 className="mt-2 font-serif text-3xl">Eventos</h1><p className="mt-2 text-sm text-[#756d61]">Cadastre e mantenha os detalhes das celebrações.</p></div><button onClick={()=>open()} className="inline-flex items-center gap-2 rounded-full bg-[#40382e] px-5 py-3 text-sm text-white"><Plus size={17}/>Novo evento</button></div>
  {feedback&&<p role="status" className="mt-5 rounded-lg bg-[#f0e9df] p-3 text-sm">{feedback}</p>}
  {error&&<p role="alert" className="mt-5 text-sm text-[#9a4c40]">{error}</p>}
  {editing!==undefined?<form onSubmit={e=>void save(e)} className="mt-7 rounded-xl border border-[#e9e1d5] bg-white p-5 sm:p-7"><div className="flex items-center justify-between"><h2 className="font-serif text-2xl">{editing?'Editar evento':'Novo evento'}</h2><button type="button" onClick={()=>{setEditing(undefined);setError(null)}} aria-label="Fechar formulário"><X size={20}/></button></div>
   <div className="mt-6 grid gap-4 sm:grid-cols-2">
    <label className="text-sm">Nome *<input required maxLength={120} value={form.name} onChange={e=>set('name',e.target.value)} className="mt-2 w-full rounded-lg border p-3"/></label>
    <label className="text-sm">Identificador (slug) *<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={e=>set('slug',e.target.value)} className="mt-2 w-full rounded-lg border p-3"/><span className="mt-1 block text-xs text-[#756d61]">Ex.: casamento, cha-de-casa-nova</span></label>
    <label className="text-sm">Data e hora do evento *<input required type="datetime-local" value={form.eventDate} onChange={e=>set('eventDate',e.target.value)} className="mt-2 w-full rounded-lg border p-3"/></label>
    <label className="text-sm">Prazo para confirmar presença<input type="datetime-local" value={form.rsvpDeadline} onChange={e=>set('rsvpDeadline',e.target.value)} className="mt-2 w-full rounded-lg border p-3"/></label>
    <label className="text-sm">Local<input value={form.venueName} onChange={e=>set('venueName',e.target.value)} className="mt-2 w-full rounded-lg border p-3"/></label>
    <label className="text-sm">Endereço<input value={form.address} onChange={e=>set('address',e.target.value)} className="mt-2 w-full rounded-lg border p-3"/></label>
    <label className="text-sm">Link do mapa<input type="url" value={form.mapsUrl} onChange={e=>set('mapsUrl',e.target.value)} className="mt-2 w-full rounded-lg border p-3"/></label>
    <label className="text-sm">Status<select value={form.status} onChange={e=>set('status',e.target.value as EventStatus)} className="mt-2 w-full rounded-lg border p-3"><option value="DRAFT">Rascunho</option><option value="ACTIVE">Ativo</option><option value="FINISHED">Finalizado</option></select></label>
    <label className="text-sm sm:col-span-2">Descrição<textarea rows={3} value={form.description} onChange={e=>set('description',e.target.value)} className="mt-2 w-full rounded-lg border p-3"/></label>
    <label className="text-sm sm:col-span-2">Informações adicionais<textarea rows={3} value={form.additionalInfo} onChange={e=>set('additionalInfo',e.target.value)} className="mt-2 w-full rounded-lg border p-3"/></label>
   </div><div className="mt-6 flex flex-wrap gap-3"><button disabled={saving} className="rounded-full bg-[#40382e] px-6 py-3 text-sm text-white disabled:opacity-50">{saving?'Salvando...':'Salvar evento'}</button><button type="button" disabled={saving} onClick={()=>{setEditing(undefined);setError(null)}} className="rounded-full border px-6 py-3 text-sm">Cancelar</button></div>
  </form>:null}
  <div className="mt-7 overflow-x-auto rounded-xl border border-[#e9e1d5] bg-white">
   {loading?<p role="status" className="p-6 text-sm">Carregando eventos...</p>:events.length===0?<p className="p-6 text-sm">Nenhum evento cadastrado.</p>:<table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b bg-[#fdfbf7] text-[#756d61]"><tr><th className="p-4">Evento</th><th className="p-4">Data</th><th className="p-4">Status</th><th className="p-4">Ações</th></tr></thead><tbody>{events.map(event=><tr key={event.id} className="border-b last:border-0"><td className="p-4"><p className="font-medium">{event.name}</p><p className="mt-1 text-xs text-[#756d61]">{event.slug}</p></td><td className="p-4">{new Date(event.event_date).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}</td><td className="p-4">{statusNames[event.status]}</td><td className="p-4"><button onClick={()=>open(event)} className="inline-flex items-center gap-2 underline"><Pencil size={15}/>Editar</button></td></tr>)}</tbody></table>}
  </div><button disabled={loading} onClick={load} className="mt-5 inline-flex items-center gap-2 text-sm underline disabled:opacity-50"><RefreshCw size={16}/>Atualizar lista</button>
 </section>
}
