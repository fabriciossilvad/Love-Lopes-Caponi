import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Copy, Eye, Pencil, Plus, RefreshCw, X } from 'lucide-react';
import type { AdminSession } from '../services/adminAuth';
import { InvitationApiError, createInvitation, getInvitation, invitationLink, listInvitations, updateInvitation, withAdminAuth, type Invitation, type InvitationDetails, type InvitationInput, type InvitationStatus } from '../services/adminInvitations';

const blank:InvitationInput={displayName:'',internalNotes:null,status:'ACTIVE'};
const statusLabel:Record<InvitationStatus,string>={ACTIVE:'Ativo',DISABLED:'Desativado'};
const rsvpLabel:Record<string,string>={PENDING:'Pendente',CONFIRMED:'Confirmado',DECLINED:'Recusado'};
function message(error:unknown){return error instanceof InvitationApiError&&error.kind==='invalid'?'Não foi possível salvar ou consultar o convite. Verifique os dados.':'Não foi possível concluir a operação. Tente novamente.'}
export function AdminInvitations({session,onExpired}:{session:AdminSession;onExpired:()=>void}){
 const [invitations,setInvitations]=useState<Invitation[]>([]);
 const [loading,setLoading]=useState(true);
 const [revision,setRevision]=useState(0);
 const [error,setError]=useState<string|null>(null);
 const [feedback,setFeedback]=useState<string|null>(null);
 const [editing,setEditing]=useState<Invitation|null|undefined>(undefined);
 const [form,setForm]=useState<InvitationInput>(blank);
 const [saving,setSaving]=useState(false);
 const [details,setDetails]=useState<InvitationDetails|null>(null);
 const [detailsLoading,setDetailsLoading]=useState(false);
 const reload=useCallback(()=>setRevision(value=>value+1),[]);
 const handleError=useCallback((err:unknown)=>{if(err instanceof InvitationApiError&&err.kind==='unauthorized'){onExpired();return}setError(message(err))},[onExpired]);
 useEffect(()=>{
  let active=true;setLoading(true);setError(null);
  withAdminAuth(token=>listInvitations(token)).then(data=>{if(active)setInvitations(data)}).catch(err=>{if(active)handleError(err)}).finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[session.accessToken,revision,handleError]);
 function openForm(invitation?:Invitation){setEditing(invitation??null);setForm(invitation?{displayName:invitation.display_name,internalNotes:invitation.internal_notes,status:invitation.status}:{...blank});setDetails(null);setError(null);setFeedback(null)}
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(!form.displayName.trim()){setError('Informe o nome do convite.');return}
  setSaving(true);setError(null);setFeedback(null);
  const payload={...form,displayName:form.displayName.trim(),internalNotes:form.internalNotes?.trim()||null};
  try{
   if(editing)await withAdminAuth(token=>updateInvitation(token,editing.id,payload));
   else await withAdminAuth(token=>createInvitation(token,payload));
   setFeedback(editing?'Convite atualizado com sucesso.':'Convite criado com sucesso.');
   setEditing(undefined);reload();
  }catch(err){handleError(err)}finally{setSaving(false)}
 }
 async function view(invitation:Invitation){
  setEditing(undefined);setDetails(null);setDetailsLoading(true);setError(null);
  try{setDetails(await withAdminAuth(token=>getInvitation(token,invitation.id)))}catch(err){handleError(err)}finally{setDetailsLoading(false)}
 }
 async function copy(invitation:Invitation){
  setError(null);setFeedback(null);
  try{
   await navigator.clipboard.writeText(invitationLink(invitation.token,window.location.origin));
   setFeedback('Link do convite copiado. Compartilhe somente com os convidados correspondentes.');
  }catch{setError('Não foi possível copiar automaticamente. Verifique a permissão de área de transferência do navegador.')}
 }
 return <section className="sans">
  <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-[#a28b69]">Administração</p><h1 className="mt-2 font-serif text-3xl">Convites</h1><p className="mt-2 text-sm text-[#756d61]">Organize os convites e acompanhe seus convidados.</p></div><button onClick={()=>openForm()} className="inline-flex items-center gap-2 rounded-full bg-[#40382e] px-5 py-3 text-sm text-white"><Plus size={17}/>Novo convite</button></div>
  {feedback&&<p role="status" className="mt-5 rounded-lg bg-[#f0e9df] p-3 text-sm">{feedback}</p>}
  {error&&<p role="alert" className="mt-5 text-sm text-[#9a4c40]">{error}</p>}
  {editing!==undefined&&<form onSubmit={event=>void save(event)} className="mt-7 rounded-xl border border-[#e9e1d5] bg-white p-5 sm:p-7"><div className="flex items-center justify-between"><h2 className="font-serif text-2xl">{editing?'Editar convite':'Novo convite'}</h2><button type="button" aria-label="Fechar formulário" onClick={()=>setEditing(undefined)}><X size={20}/></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm">Identificação do convite *<input required maxLength={160} value={form.displayName} onChange={event=>setForm(previous=>({...previous,displayName:event.target.value}))} className="mt-2 w-full rounded-lg border p-3" placeholder="Ex.: Família Silva"/></label><label className="text-sm">Status<select value={form.status} onChange={event=>setForm(previous=>({...previous,status:event.target.value as InvitationStatus}))} className="mt-2 w-full rounded-lg border p-3"><option value="ACTIVE">Ativo</option><option value="DISABLED">Desativado</option></select></label><label className="text-sm sm:col-span-2">Observações internas<textarea rows={3} value={form.internalNotes??''} onChange={event=>setForm(previous=>({...previous,internalNotes:event.target.value}))} className="mt-2 w-full rounded-lg border p-3"/></label></div><p className="mt-4 text-xs text-[#756d61]">O link é gerado automaticamente pelo servidor. Os convidados e eventos serão vinculados na próxima etapa.</p><div className="mt-6 flex gap-3"><button disabled={saving} className="rounded-full bg-[#40382e] px-6 py-3 text-sm text-white disabled:opacity-50">{saving?'Salvando...':'Salvar convite'}</button><button type="button" disabled={saving} onClick={()=>setEditing(undefined)} className="rounded-full border px-6 py-3 text-sm">Cancelar</button></div></form>}
  {detailsLoading&&<p role="status" className="mt-6 text-sm">Carregando detalhes...</p>}
  {details&&<section className="mt-7 rounded-xl border border-[#e9e1d5] bg-white p-5 sm:p-7"><div className="flex items-center justify-between"><h2 className="font-serif text-2xl">{details.display_name}</h2><button aria-label="Fechar detalhes" onClick={()=>setDetails(null)}><X size={20}/></button></div><p className="mt-2 text-sm text-[#756d61]">{statusLabel[details.status]} · {details.guests.length} convidado(s)</p>{details.internal_notes&&<p className="mt-4 text-sm">Observações internas: {details.internal_notes}</p>}{details.guests.length===0?<p className="mt-5 text-sm text-[#756d61]">Nenhum convidado vinculado. O vínculo será configurado no módulo de convidados.</p>:<div className="mt-5 space-y-4">{details.guests.map(guest=><div key={guest.id} className="rounded-lg border border-[#e9e1d5] p-4"><p className="font-medium">{guest.name}</p>{guest.guest_events.length===0?<p className="mt-2 text-sm text-[#756d61]">Sem eventos vinculados.</p>:<ul className="mt-2 space-y-1 text-sm">{guest.guest_events.map(membership=><li key={membership.event_id}>{membership.events?.name??'Evento indisponível'} — {rsvpLabel[membership.rsvp_status]??membership.rsvp_status}</li>)}</ul>}</div>)}</div>}</section>}
  <div className="mt-7 overflow-x-auto rounded-xl border border-[#e9e1d5] bg-white">{loading?<p role="status" className="p-6 text-sm">Carregando convites...</p>:invitations.length===0?<p className="p-6 text-sm">Nenhum convite cadastrado.</p>:<table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b bg-[#fdfbf7] text-[#756d61]"><tr><th className="p-4">Convite</th><th className="p-4">Status</th><th className="p-4">Criado em</th><th className="p-4">Ações</th></tr></thead><tbody>{invitations.map(invitation=><tr key={invitation.id} className="border-b last:border-0"><td className="p-4 font-medium">{invitation.display_name}</td><td className="p-4">{statusLabel[invitation.status]}</td><td className="p-4">{new Date(invitation.created_at).toLocaleDateString('pt-BR')}</td><td className="p-4"><div className="flex flex-wrap gap-4"><button onClick={()=>void view(invitation)} className="inline-flex items-center gap-1 underline"><Eye size={15}/>Detalhes</button><button onClick={()=>openForm(invitation)} className="inline-flex items-center gap-1 underline"><Pencil size={15}/>Editar</button><button onClick={()=>void copy(invitation)} className="inline-flex items-center gap-1 underline"><Copy size={15}/>Copiar link</button></div></td></tr>)}</tbody></table>}</div>
  <button disabled={loading} onClick={reload} className="mt-5 inline-flex items-center gap-2 text-sm underline disabled:opacity-50"><RefreshCw size={16}/>Atualizar lista</button>
 </section>
}
