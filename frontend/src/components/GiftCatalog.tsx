import { useEffect, useState } from 'react';
import { Gift as GiftIcon, RefreshCw } from 'lucide-react';
import { cancelGift, fetchGifts, fetchMyReservations, GiftError, reserveGift, type Gift, type Reservation } from '../services/gifts';

export function GiftCatalog({token,eventId,eventName}:{token:string;eventId:string;eventName:string}){
 const [gifts,setGifts]=useState<Gift[]>([]);
 const [reservations,setReservations]=useState<Reservation[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState(false);
 const [revision,setRevision]=useState(0);
 const [busy,setBusy]=useState<string|null>(null);
 const [feedback,setFeedback]=useState<string|null>(null);

 useEffect(()=>{
  const controller=new AbortController();
  setLoading(true);setError(false);
  Promise.all([fetchGifts(token,eventId,controller.signal),fetchMyReservations(token,controller.signal)])
   .then(([catalog,active])=>{if(!controller.signal.aborted){setGifts(catalog);setReservations(active.filter(r=>r.event_id===eventId))}})
   .catch(()=>{if(!controller.signal.aborted)setError(true)})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return()=>controller.abort();
 },[token,eventId,revision]);

 function refresh(){setRevision(n=>n+1)}
 async function reserve(gift:Gift){
  if(busy||loading||error||gift.available_quantity<=0||reservations.some(r=>r.gift_id===gift.gift_id))return;
  setBusy(gift.gift_id);setFeedback(null);
  try{
   const result=await reserveGift(token,gift.gift_id);
   setReservations(prev=>[...prev,{...result,event_id:eventId}]);
   setFeedback('Presente reservado com sucesso!');
   refresh();
  }catch(e){setFeedback(e instanceof GiftError&&e.kind==='unavailable'?'Este presente não está mais disponível. Atualize a lista.':'Não foi possível reservar. Confira sua conexão e tente novamente.')}
  finally{setBusy(null)}
 }
 async function cancel(reservation:Reservation){
  if(busy||loading||error)return;
  setBusy(reservation.gift_id);setFeedback(null);
  try{
   await cancelGift(token,reservation.reservation_id);
   setReservations(prev=>prev.filter(r=>r.reservation_id!==reservation.reservation_id));
   setFeedback('Reserva cancelada com sucesso.');
   refresh();
  }catch{setFeedback('Não foi possível cancelar a reserva. Tente novamente.')}
  finally{setBusy(null)}
 }
 return <section className="mt-7 rounded-xl border border-[#e9e1d5] p-5 sm:p-7">
  <div className="flex items-center gap-2"><GiftIcon size={19} className="text-[#aa8a60]"/><h4 className="text-xl">Presentes — {eventName}</h4></div>
  <p className="sans mt-2 text-xs text-[#756d61]">A reserva não exige pagamento. Quem possui este link de convite pode consultar e cancelar as reservas vinculadas a ele; outros convites não têm acesso a elas.</p>
  <div aria-live="polite" className="sans mt-3 text-sm text-[#675d50]">{feedback}</div>
  {loading?<p role="status" className="sans mt-5 text-sm">Carregando presentes e reservas...</p>:error?<div className="sans mt-5 text-sm">Não foi possível carregar os presentes ou as reservas. <button className="underline" onClick={refresh}>Tentar novamente</button></div>:gifts.length===0?<p className="sans mt-5 text-sm">Ainda não há presentes disponíveis para este evento.</p>:<div className="mt-5 grid gap-4 sm:grid-cols-2">
   {gifts.map(gift=>{
    const mine=reservations.filter(r=>r.gift_id===gift.gift_id);
    return <article key={gift.gift_id} className="rounded-xl border border-[#eee6da] bg-[#fdfbf7] p-4">
     <div className="flex h-36 items-center justify-center overflow-hidden rounded-lg bg-[#f0e9df]">{gift.image_url?<img src={gift.image_url} alt={gift.name} loading="lazy" className="h-full w-full object-cover"/>:<GiftIcon size={36} strokeWidth={1} className="text-[#b19b7a]"/>}</div>
     <h5 className="mt-4 text-lg">{gift.name}</h5>
     {gift.category_name&&<p className="sans mt-1 text-xs text-[#8c806f]">{gift.category_name}</p>}
     {gift.description&&<p className="sans mt-2 text-sm text-[#5f5b54]">{gift.description}</p>}
     <p className="sans mt-3 text-sm">Disponíveis: {gift.available_quantity} de {gift.quantity}</p>
     {mine.length>0?<div className="mt-3 space-y-2"><p className="sans text-sm text-[#477054]">{mine.length} reserva(s) deste convite</p>{mine.map((reservation,index)=><button key={reservation.reservation_id} disabled={busy!==null} onClick={()=>void cancel(reservation)} className="sans w-full rounded-full border border-[#bca88b] px-4 py-3 text-sm disabled:opacity-50">Cancelar reserva {index+1}</button>)}</div>:<button disabled={busy!==null||gift.available_quantity<=0} onClick={()=>void reserve(gift)} className="sans mt-4 w-full rounded-full bg-[#40382e] px-4 py-3 text-sm text-white disabled:opacity-45">{busy===gift.gift_id?'Aguarde...':gift.available_quantity<=0?'Esgotado':'Reservar presente'}</button>}
    </article>
   })}
  </div>}
  <button onClick={refresh} disabled={busy!==null} className="sans mt-5 inline-flex items-center gap-2 text-xs underline disabled:opacity-50"><RefreshCw size={14}/>Atualizar disponibilidade</button>
 </section>
}
