import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Pencil, Plus, RefreshCw, X } from 'lucide-react';
import type { AdminSession } from '../services/adminAuth';
import { listEvents, type AdminEvent, EventApiError } from '../services/adminEvents';
import { getInvitation, listInvitations, type Invitation, type InvitationDetails, type InvitationGuest, InvitationApiError } from '../services/adminInvitations';
import { createGuest, GuestApiError, setGuestEvents, updateGuest, withGuestAuth, type GuestInput, type GuestStatus } from '../services/adminGuests';

type GuestWithInvitation={guest:InvitationGuest;invitation:Invitation};
type FormState={invitationId:string;name:string;phone:string;email:string;notes:string;status:GuestStatus;eventIds:string[]};
const empty:FormState={invitationId:'',name:'',phone:'',email:'',notes:'',status:'ACTIVE',eventIds:[]};
const rsvpNames:Record<string,string>={PENDING:'Pendente',CONFIRMED:'Confirmado',DECLINED:'Recusado'};
function msg(err:unknown){return (err instanceof GuestApiError||err instanceof InvitationApiError||err instanceof EventApiError)&&err.kind==='invalid'?'Verifique os dados informados. Não foi possível concluir a operação.':'Não foi possível concluir a operação. Tente novamente.'}
export function AdminGuests({session,onExpired}:{session:AdminSession;onExpired:()=>void}){
 const [invitations,setInvitations]=useState<Invitation[]>([]);
 const [events,setEvents]=useState<AdminEvent[]>([]);
 const [records,setRecords]=useState<GuestWithInvitation[]>([]);
 const [loading,setLoading]=useState(true);
 const [revision,setRevision]=useState(0);
 const [error,setError]=useState<string|null>(null);
 const [feedback,setFeedback]=useState<string|null>(null);
 const [editing,setEditing]=useState<GuestWithInvitation|null|undefined>(undefined);
 const [form,setForm]=useState<FormState>(empty);
 const [saving,setSaving]=useState(false);
 const reload=useCallback(()=>setRevision(v=>v+1),[]);
 const handleError=useCallback((err:unknown)=>{if((err instanceof GuestApiError||err instanceof InvitationApiError||err instanceof EventApiError)&&err.kind==='unauthorized'){onExpired();return}setError(msg(err))},[onExpired]);
 useEffect(()=>{
  let active=true;setLoading(true);setError(null);
  async function load(){
   const [invitationList,eventList]=await Promise.all([
    withGuestAuth(token=>listInvitations(token)).catch(err=>{if(err instanceof InvitationApiError&&err.kind==='unauthorized')throw new GuestApiError('unauthorized');throw err}),
    withGuestAuth(token=>listEvents(token)).catch(err=>{if(err instanceof EventApiError&&err.kind==='unauthorized')throw new GuestApiError('unauthorized');throw err})
   ]);
   const details=await Promise.all(invitationList.map(invitation=>withGuestAuth(token=>getInvitation(token,invitation.id)).catch(err=>{if(err instanceof InvitationApiError&&err.kind==='unauthorized')throw new GuestApiError('unauthorized');throw err})));
   return {invitationList,eventList,records:details.flatMap((detail:InvitationDetails,index)=>detail.guests.map(guest=>({guest,invitation:invitationList[index]})))};
  }
  load().then(data=>{if(active){setInvitations(data.invitationList);setEvents(data.eventList);setRecords(data.records)}}).catch(err=>{if(active)handleError(err)}).finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[session.accessToken,revision,handleError]);
 function open(item?:GuestWithInvitation){
  setEditing(item??null);setError(null);setFeedback(null);
  setForm(item?{invitationId:item.invitation.id,name:item.guest.name,phone:item.guest.phone??'',email:item.guest.email??'',notes:item.guest.notes??'',status:item.guest.status as GuestStatus,eventIds:item.guest.guest_events.map(e=>e.event_id)}:{...empty,invitationId:invitations[0]?.id??'',eventIds:[]});
 }
 function field<K extends keyof FormState>(key:K,value:FormState[K]){setForm(previous=>({...previous,[key]:value}))}
 function toggleEvent(id:string,checked:boolean){setForm(previous=>({...previous,eventIds:checked?[...previous.eventIds,id]:previous.eventIds.filter(value=>value!==id)}))}
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setError(null);setFeedback(null);
  if(!form.name.trim()||!form.invitationId||form.eventIds.length===0){setError('Informe o nome, o convite e pelo menos um evento.');return}
  setSaving(true);
  const nullable=(value:string)=>value.trim()||null;
  const data:GuestInput={invitationId:form.invitationId,name:form.name.trim(),phone:nullable(form.phone),email:nullable(form.email),notes:nullable(form.notes),status:form.status,eventIds:form.eventIds};
  try{
   if(editing){
    await withGuestAuth(token=>updateGuest(token,editing.guest.id,{name:data.name,phone:data.phone,email:data.email,notes:data.notes,status:data.status}));
    const previousIds=editing.guest.guest_events.map(e=>e.event_id).sort();
    const nextIds=[...data.eventIds].sort();
    if(JSON.stringify(previousIds)!==JSON.stringify(nextIds))await withGuestAuth(token=>setGuestEvents(token,editing.guest.id,data.eventIds));
    setFeedback('Convidado atualizado. Os vínculos com eventos foram salvos.');
   }else{
    await withGuestAuth(token=>createGuest(token,data));
    setFeedback('Convidado cadastrado com sucesso.');
   }
   setEditing(undefined);reload();
  }catch(err){handleError(err)}finally{setSaving(false)}
 }
 const sorted=[...records].sort((a,b)=>a.guest.name.localeCompare(b.guest.name,'pt-BR'));
 return <section className="sans">
  <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-[#a28b69]">Administração</p><h1 className="mt-2 font-serif text-3xl">Convidados</h1><p className="mt-2 text-sm text-[#756d61]">Cadastre pessoas e defina os eventos para os quais foram convidadas.</p></div><button disabled={loading||invitations.length===0||events.length===0} onClick={()=>open()} className="inline-flex items-center gap-2 rounded-full bg-[#40382e] px-5 py-3 text-sm text-white disabled:opacity-50"><Plus size={17}/>Novo convidado</button></div>
  {feedback&&<p role="status" className="mt-5 rounded-lg bg-[#f0e9df] p-3 text-sm">{feedback}</p>}
  {error&&<p role="alert" className="mt-5 text-sm text-[#9a4c40]">{error}</p>}
  {editing!==undefined&&<form onSubmit={event=>void save(event)} className="mt-7 rounded-xl border border-[#e9e1d5] bg-white p-5 sm:p-7"><div className="flex items-center justify-between"><h2 className="font-serif text-2xl">{editing?'Editar convidado':'Novo convidado'}</h2><button type="button" aria-label="Fechar formulário" onClick={()=>setEditing(undefined)}><X size={20}/></button></div>
   <div className="mt-6 grid gap-4 sm:grid-cols-2">
    <label className="text-sm">Convite *<select required disabled={!!editing} value={form.invitationId} onChange={event=>field('invitationId',event.target.value)} className="mt-2 w-full rounded-lg border p-3">{invitations.map(invitation=><option key={invitation.id} value={invitation.id}>{invitation.display_name}</option>)}</select></label>
    <label className="text-sm">Nome *<input required maxLength={160} value={form.name} onChange={event=>field('name',event.target.value)} className="mt-2 w-full rounded-lg border p-3"/></label>
    <label className="text-sm">Telefone<input value={form.phone} onChange={event=>field('phone',event.target.value)} className="mt-2 w-full rounded-lg border p-3"/></label>
    <label className="text-sm">E-mail<input type="email" value={form.email} onChange={event=>field('email',event.target.value)} className="mt-2 w-full rounded-lg border p-3"/></label>
    <label className="text-sm">Status<select value={form.status} onChange={event=>field('status',event.target.value as GuestStatus)} className="mt-2 w-full rounded-lg border p-3"><option value="ACTIVE">Ativo</option><option value="INACTIVE">Inativo</option></select></label>
    <label className="text-sm sm:col-span-2">Observações<textarea rows={2} value={form.notes} onChange={event=>field('notes',event.target.value)} className="mt-2 w-full rounded-lg border p-3"/></label>
   </div>
   <fieldset className="mt-6 rounded-lg border border-[#e9e1d5] p-4"><legend className="px-2 text-sm font-medium">Eventos permitidos *</legend><div className="mt-2 space-y-3">{events.map(event=><label key={event.id} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.eventIds.includes(event.id)} onChange={e=>toggleEvent(event.id,e.target.checked)}/><span>{event.name} ({event.status})</span></label>)}</div><p className="mt-3 text-xs text-[#756d61]">Selecione ao menos um evento. Alterar a participação pode afetar confirmações de presença já registradas.</p></fieldset>
   <div className="mt-6 flex flex-wrap gap-3"><button disabled={saving} className="rounded-full bg-[#40382e] px-6 py-3 text-sm text-white disabled:opacity-50">{saving?'Salvando...':'Salvar convidado'}</button><button type="button" disabled={saving} onClick={()=>setEditing(undefined)} className="rounded-full border px-6 py-3 text-sm">Cancelar</button></div>
  </form>}
  <div className="mt-7 overflow-x-auto rounded-xl border border-[#e9e1d5] bg-white">{loading?<p role="status" className="p-6 text-sm">Carregando convidados...</p>:sorted.length===0?<p className="p-6 text-sm">Nenhum convidado cadastrado.</p>:<table className="w-full min-w-[740px] text-left text-sm"><thead className="border-b bg-[#fdfbf7] text-[#756d61]"><tr><th className="p-4">Convidado</th><th className="p-4">Convite</th><th className="p-4">Eventos / RSVP</th><th className="p-4">Status</th><th className="p-4">Ação</th></tr></thead><tbody>{sorted.map(item=><tr key={item.guest.id} className="border-b last:border-0"><td className="p-4 font-medium">{item.guest.name}</td><td className="p-4">{item.invitation.display_name}</td><td className="p-4">{item.guest.guest_events.map(e=><div key={e.event_id}>{e.events?.name??'Evento indisponível'} — {rsvpNames[e.rsvp_status]??e.rsvp_status}</div>)}</td><td className="p-4">{item.guest.status==='ACTIVE'?'Ativo':'Inativo'}</td><td className="p-4"><button onClick={()=>open(item)} className="inline-flex items-center gap-2 underline"><Pencil size={15}/>Editar</button></td></tr>)}</tbody></table>}</div>
  <button disabled={loading} onClick={reload} className="mt-5 inline-flex items-center gap-2 text-sm underline disabled:opacity-50"><RefreshCw size={16}/>Atualizar lista</button>
 </section>
}
