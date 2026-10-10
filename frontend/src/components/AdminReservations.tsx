import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, XCircle } from 'lucide-react';
import type { AdminSession } from '../services/adminAuth';
import { AdminReservationError, cancelAdminReservation, listAdminReservations, withReservationAuth, type AdminReservation } from '../services/adminReservations';
type Filter='ALL'|'ACTIVE'|'CANCELLED';
const date=(value:string|null)=>value?new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(value)):'—';
export function AdminReservations({session,onExpired}:{session:AdminSession;onExpired:()=>void}){
 const [items,setItems]=useState<AdminReservation[]>([]);
 const [filter,setFilter]=useState<Filter>('ACTIVE');
 const [search,setSearch]=useState('');
 const [loading,setLoading]=useState(true);
 const [hasLoaded,setHasLoaded]=useState(false);
 const [revision,setRevision]=useState(0);
 const [busy,setBusy]=useState<string|null>(null);
 const [error,setError]=useState<string|null>(null);
 const [feedback,setFeedback]=useState<string|null>(null);
 const reload=useCallback(()=>setRevision(n=>n+1),[]);
 const handleError=useCallback((err:unknown)=>{if(err instanceof AdminReservationError&&err.kind==='unauthorized'){onExpired();return}setError(err instanceof AdminReservationError&&err.kind==='invalid'?'A reserva não está mais ativa ou não pode ser liberada. Atualize a lista.':'Não foi possível carregar ou alterar as reservas. Tente novamente.')},[onExpired]);
 useEffect(()=>{
  let active=true;setLoading(true);setError(null);
  withReservationAuth(token=>listAdminReservations(token)).then(data=>{if(active){setItems(data);setHasLoaded(true)}}).catch(err=>{if(active)handleError(err)}).finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[session.accessToken,revision,handleError]);
 const activeCount=items.filter(item=>item.status==='ACTIVE').length;
 const cancelledCount=items.filter(item=>item.status==='CANCELLED').length;
 const visible=useMemo(()=>items.filter(item=>{
  if(filter!=='ALL'&&item.status!==filter)return false;
  const q=search.trim().toLocaleLowerCase('pt-BR');
  if(!q)return true;
  return [item.gifts?.name,item.gifts?.events?.name,item.invitations?.display_name,item.guests?.name].some(value=>value?.toLocaleLowerCase('pt-BR').includes(q));
 }),[items,filter,search]);
 async function release(item:AdminReservation){
  if(busy||item.status!=='ACTIVE')return;
  const label=item.gifts?.name??'este presente';
  if(!window.confirm('Liberar a reserva de '+label+'? A unidade voltará a ficar disponível e a operação não poderá ser desfeita pelo painel.'))return;
  setBusy(item.id);setError(null);setFeedback(null);
  try{await withReservationAuth(token=>cancelAdminReservation(token,item.id));setItems(previous=>previous.map(reservation=>reservation.id===item.id?{...reservation,status:'CANCELLED',cancelled_at:new Date().toISOString()}:reservation));setFeedback('Reserva liberada com sucesso.');}
  catch(err){handleError(err)}
  finally{setBusy(null)}
 }
 return <section className="sans">
  <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-[#a28b69]">Administração</p><h1 className="mt-2 font-serif text-3xl">Reservas de presentes</h1><p className="mt-2 text-sm text-[#756d61]">Consulte os responsáveis por convite e libere reservas quando necessário.</p></div><button onClick={reload} disabled={loading||busy!==null} className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm disabled:opacity-50"><RefreshCw size={16}/>Atualizar</button></div>
  <div className="mt-6 grid gap-3 sm:grid-cols-3">{[{label:'Total de reservas',value:items.length},{label:'Ativas',value:activeCount},{label:'Canceladas',value:cancelledCount}].map(card=><div key={card.label} className="rounded-xl border border-[#e9e1d5] bg-white p-5"><p className="text-2xl font-semibold">{!hasLoaded&&loading?'—':card.value}</p><p className="mt-2 text-sm text-[#756d61]">{card.label}</p></div>)}</div>
  <div className="mt-6 flex flex-wrap gap-4"><label className="text-sm">Status<select value={filter} onChange={event=>setFilter(event.target.value as Filter)} className="mt-2 block rounded-lg border p-3"><option value="ACTIVE">Ativas</option><option value="CANCELLED">Canceladas</option><option value="ALL">Todas</option></select></label><label className="min-w-52 flex-1 text-sm">Buscar por presente, evento ou convite<input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Pesquisar reservas" className="mt-2 block w-full rounded-lg border p-3"/></label></div>
  {feedback&&<p role="status" className="mt-5 rounded-lg bg-[#f0e9df] p-3 text-sm">{feedback}</p>}
  {error&&<p role="alert" className="mt-5 text-sm text-[#9a4c40]">{error}</p>}
  {hasLoaded&&visible.length>0&&<div className="mt-6 grid gap-3 md:hidden">{visible.map(item=><article key={item.id} className="min-w-0 rounded-xl border border-[#e9e1d5] bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="font-serif text-lg">{item.gifts?.name??'Presente indisponível'}</h2><p className="mt-1 text-xs text-[#756d61]">{item.gifts?.events?.name??'Evento indisponível'}</p></div><span className={item.status==='ACTIVE'?'shrink-0 rounded-full bg-[#e9f1e7] px-3 py-1 text-xs text-[#477054]':'shrink-0 rounded-full bg-[#f2eee8] px-3 py-1 text-xs text-[#756d61]'}>{item.status==='ACTIVE'?'Ativa':'Cancelada'}</span></div><dl className="mt-4 space-y-2 text-sm"><div><dt className="text-xs text-[#756d61]">Convite</dt><dd>{item.invitations?.display_name??'Indisponível'}</dd></div><div><dt className="text-xs text-[#756d61]">Convidado</dt><dd>{item.guests?.name??'Não informado'}</dd></div><div><dt className="text-xs text-[#756d61]">Reservado em</dt><dd>{date(item.reserved_at)}</dd></div></dl>{item.status==='ACTIVE'&&<button disabled={busy!==null} onClick={()=>void release(item)} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#bca88b] px-4 py-2 text-sm text-[#9a4c40] disabled:opacity-50"><XCircle size={16}/>{busy===item.id?'Liberando...':'Liberar reserva'}</button>}</article>)}</div>}
  <div className={hasLoaded&&visible.length>0?"mt-6 hidden overflow-x-auto rounded-xl border border-[#e9e1d5] bg-white md:block":"mt-6 overflow-x-auto rounded-xl border border-[#e9e1d5] bg-white"}>{!hasLoaded&&loading?<p role="status" className="p-6 text-sm">Carregando reservas...</p>:visible.length===0?<p className="p-6 text-sm">Nenhuma reserva encontrada para os filtros selecionados.</p>:<table className="hidden w-full min-w-[920px] text-left text-sm md:table"><thead className="border-b bg-[#fdfbf7] text-[#756d61]"><tr><th className="p-4">Presente / evento</th><th className="p-4">Convite</th><th className="p-4">Convidado</th><th className="p-4">Reservado em</th><th className="p-4">Status</th><th className="p-4">Ação</th></tr></thead><tbody>{visible.map(item=><tr key={item.id} className="border-b last:border-0"><td className="p-4"><strong className="font-medium">{item.gifts?.name??'Presente indisponível'}</strong><div className="mt-1 text-xs text-[#756d61]">{item.gifts?.events?.name??'Evento indisponível'}</div></td><td className="p-4">{item.invitations?.display_name??'Convite indisponível'}</td><td className="p-4">{item.guests?.name??'Não informado'}</td><td className="p-4">{date(item.reserved_at)}</td><td className="p-4">{item.status==='ACTIVE'?'Ativa':<>Cancelada<div className="mt-1 text-xs text-[#756d61]">{date(item.cancelled_at)}</div></>}</td><td className="p-4">{item.status==='ACTIVE'?<button disabled={busy!==null} onClick={()=>void release(item)} className="inline-flex items-center gap-2 text-[#9a4c40] underline disabled:opacity-50"><XCircle size={16}/>{busy===item.id?'Liberando...':'Liberar reserva'}</button>:'—'}</td></tr>)}</tbody></table>}</div>
  <p className="mt-5 text-xs text-[#756d61]">Cada reserva corresponde a uma unidade do presente.</p>
 </section>
}
