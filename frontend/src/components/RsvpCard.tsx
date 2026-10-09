import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import type { InvitationEvent, RsvpStatus } from '../types/invitation';
import { saveRsvp, RsvpError, type RsvpChoice } from '../services/rsvp';

const labels: Record<RsvpStatus,string> = {PENDING:'Aguardando resposta',CONFIRMED:'Presença confirmada',DECLINED:'Não comparecerá'};
export function isRsvpOpen(deadline:string|null, now=Date.now()):boolean { return !deadline || (Number.isFinite(Date.parse(deadline)) && now<=Date.parse(deadline)); }
export function RsvpCard({token,guestId,event}:{token:string;guestId:string;event:InvitationEvent}) {
 const [status,setStatus]=useState<RsvpStatus>(event.rsvp_status);
 const [saving,setSaving]=useState(false);
 const [feedback,setFeedback]=useState<'success'|'not-allowed'|'network'|null>(null);
 const [now,setNow]=useState(()=>Date.now());
 useEffect(()=>{setStatus(event.rsvp_status);setFeedback(null)},[event.id,event.rsvp_status,guestId]);
 useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),30000);return()=>window.clearInterval(timer)},[]);
 const open=isRsvpOpen(event.rsvp_deadline,now);
 async function submit(choice:RsvpChoice){if(saving||!open||choice===status)return;setSaving(true);setFeedback(null);try{const result=await saveRsvp({token,guestId,eventId:event.id,status:choice});setStatus(result.rsvp_status);setFeedback('success')}catch(err){setFeedback(err instanceof RsvpError?err.kind:'network')}finally{setSaving(false)}}
 return <div className="rounded-xl border border-[#e9e1d5] bg-[#fdfbf7] p-4 sm:p-5"><p className="text-lg">{event.name}</p><p className="sans mt-1 text-xs text-[#756d61]">Situação: <strong>{labels[status]}</strong></p>{event.rsvp_deadline&&<p className="sans mt-2 text-xs text-[#756d61]">Prazo: {new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(event.rsvp_deadline))}</p>}
 {!open?<p className="sans mt-3 text-sm text-[#866d4f]">O prazo de confirmação deste evento foi encerrado.</p>:<div className="mt-4 flex flex-col gap-2 sm:flex-row"><button type="button" disabled={saving||status==='CONFIRMED'} onClick={()=>void submit('CONFIRMED')} className="sans inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#40382e] px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-45"><Check size={16}/>Confirmar presença</button><button type="button" disabled={saving||status==='DECLINED'} onClick={()=>void submit('DECLINED')} className="sans inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#c5b9a8] px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-45"><X size={16}/>Não poderei comparecer</button></div>}
 <div aria-live="polite" role="status" className="sans mt-3 text-sm">{saving?'Salvando resposta...':feedback==='success'?<span className="text-[#477054]">Resposta salva com sucesso.</span>:feedback==='not-allowed'?<span className="text-[#9a4c40]">Não foi possível registrar esta resposta. O prazo pode ter encerrado ou o convite pode estar indisponível. Atualize a página.</span>:feedback==='network'?<span className="text-[#9a4c40]">Falha ao salvar. Tente novamente.</span>:null}</div></div>
}
