import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Gift, ImagePlus, Pencil, Plus, RefreshCw, X } from 'lucide-react';
import type { AdminSession } from '../services/adminAuth';
import { listEvents, type AdminEvent, EventApiError } from '../services/adminEvents';
import { AdminGiftError, createAdminGift, listAdminGifts, updateAdminGift, uploadGiftImage, withGiftAuth, type AdminGift, type GiftInput, type GiftStatus } from '../services/adminGifts';

type GiftForm={eventId:string;name:string;description:string;estimatedValue:string;quantity:string;status:GiftStatus;displayOrder:string};
const empty:GiftForm={eventId:'',name:'',description:'',estimatedValue:'',quantity:'1',status:'ACTIVE',displayOrder:'0'};
const MAX_SIZE=5*1024*1024;
const TYPES=['image/jpeg','image/png','image/webp'];
function describeError(err:unknown){
 if(err instanceof AdminGiftError){if(err.kind==='too-large')return 'A imagem deve ter no máximo 5 MB.';if(err.kind==='type')return 'Use uma imagem JPEG, PNG ou WebP válida.';if(err.kind==='invalid')return 'Não foi possível salvar. Verifique os dados e as reservas existentes.'}
 return 'Não foi possível concluir a operação. Tente novamente.';
}
export function AdminGifts({session,onExpired}:{session:AdminSession;onExpired:()=>void}){
 const [events,setEvents]=useState<AdminEvent[]>([]);
 const [gifts,setGifts]=useState<AdminGift[]>([]);
 const [loading,setLoading]=useState(true);
 const [revision,setRevision]=useState(0);
 const [error,setError]=useState<string|null>(null);
 const [feedback,setFeedback]=useState<string|null>(null);
 const [editing,setEditing]=useState<AdminGift|null|undefined>(undefined);
 const [form,setForm]=useState<GiftForm>(empty);
 const [image,setImage]=useState<File|null>(null);
 const [saving,setSaving]=useState(false);
 const reload=useCallback(()=>setRevision(n=>n+1),[]);
 const handleError=useCallback((err:unknown)=>{if(err instanceof AdminGiftError&&err.kind==='unauthorized'){onExpired();return}setError(describeError(err))},[onExpired]);
 useEffect(()=>{
  let active=true;setLoading(true);setError(null);
  Promise.all([withGiftAuth(token=>listAdminGifts(token)),withGiftAuth(token=>listEvents(token)).catch(err=>{if(err instanceof EventApiError&&err.kind==='unauthorized')throw new AdminGiftError('unauthorized');throw err})]).then(([g,e])=>{if(active){setGifts(g);setEvents(e)}}).catch(err=>{if(active)handleError(err)}).finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[session.accessToken,revision,handleError]);
 function open(gift?:AdminGift){
  setEditing(gift??null);setError(null);setFeedback(null);setImage(null);
  setForm(gift?{eventId:gift.event_id,name:gift.name,description:gift.description??'',estimatedValue:gift.estimated_value===null?'':String(gift.estimated_value),quantity:String(gift.quantity),status:gift.status,displayOrder:String(gift.display_order)}:{...empty,eventId:events[0]?.id??''});
 }
 function field<K extends keyof GiftForm>(key:K,value:GiftForm[K]){setForm(previous=>({...previous,[key]:value}))}
 function chooseImage(event:ChangeEvent<HTMLInputElement>){
  const file=event.target.files?.[0]??null;
  if(file&&(!TYPES.includes(file.type)||file.size>MAX_SIZE)){setImage(null);setError(file.size>MAX_SIZE?'A imagem deve ter no máximo 5 MB.':'Selecione JPEG, PNG ou WebP.');event.target.value='';return}
  setImage(file);setError(null);
 }
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setError(null);setFeedback(null);
  const quantity=Number(form.quantity),order=Number(form.displayOrder);
  const amount=form.estimatedValue.trim()===''?null:Number(form.estimatedValue);
  if(!form.eventId||!form.name.trim()||!Number.isInteger(quantity)||quantity<1||!Number.isInteger(order)||order<0||amount!==null&&(!Number.isFinite(amount)||amount<0)){setError('Preencha nome, evento, quantidade e ordem com valores válidos.');return}
  const payload:GiftInput={eventId:form.eventId,name:form.name.trim(),categoryId:editing?.category_id??null,description:form.description.trim()||null,estimatedValue:amount,quantity,status:form.status,displayOrder:order};
  setSaving(true);
  let saved:AdminGift;
  try{
   saved=editing?await withGiftAuth(token=>updateAdminGift(token,editing.id,payload)):await withGiftAuth(token=>createAdminGift(token,payload));
   if(image){
    try{await withGiftAuth(token=>uploadGiftImage(token,saved.id,image))}
    catch(err){setError('Presente salvo, mas a imagem não foi enviada. '+describeError(err));setEditing(undefined);reload();return}
   }
   setEditing(undefined);setFeedback(editing?'Presente atualizado com sucesso.':'Presente criado com sucesso.');reload();
  }catch(err){handleError(err)}finally{setSaving(false)}
 }
 const sorted=[...gifts].sort((a,b)=>a.display_order-b.display_order||a.name.localeCompare(b.name,'pt-BR'));
 return <section className="sans">
  <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-[#a28b69]">Administração</p><h1 className="mt-2 font-serif text-3xl">Presentes</h1><p className="mt-2 text-sm text-[#756d61]">Organize os presentes por evento e envie imagens para o catálogo.</p></div><button disabled={loading||events.length===0} onClick={()=>open()} className="inline-flex items-center gap-2 rounded-full bg-[#40382e] px-5 py-3 text-sm text-white disabled:opacity-50"><Plus size={17}/>Novo presente</button></div>
  {feedback&&<p role="status" className="mt-5 rounded-lg bg-[#f0e9df] p-3 text-sm">{feedback}</p>}
  {error&&<p role="alert" className="mt-5 text-sm text-[#9a4c40]">{error}</p>}
  {editing!==undefined&&<form onSubmit={event=>void save(event)} className="mt-7 rounded-xl border border-[#e9e1d5] bg-white p-5 sm:p-7"><div className="flex items-center justify-between"><h2 className="font-serif text-2xl">{editing?'Editar presente':'Novo presente'}</h2><button type="button" aria-label="Fechar formulário" onClick={()=>setEditing(undefined)}><X size={20}/></button></div>
   <div className="mt-6 grid gap-4 sm:grid-cols-2">
    <label className="text-sm">Evento *<select required value={form.eventId} onChange={e=>field('eventId',e.target.value)} className="mt-2 w-full rounded-lg border p-3">{events.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
    <label className="text-sm">Nome *<input required maxLength={160} value={form.name} onChange={e=>field('name',e.target.value)} className="mt-2 w-full rounded-lg border p-3"/></label>
    <label className="text-sm">Valor estimado (R$)<input type="number" min="0" step="0.01" value={form.estimatedValue} onChange={e=>field('estimatedValue',e.target.value)} className="mt-2 w-full rounded-lg border p-3" placeholder="Opcional"/></label>
    <label className="text-sm">Quantidade *<input required type="number" min="1" step="1" value={form.quantity} onChange={e=>field('quantity',e.target.value)} className="mt-2 w-full rounded-lg border p-3"/></label>
    <label className="text-sm">Ordem de exibição *<input required type="number" min="0" step="1" value={form.displayOrder} onChange={e=>field('displayOrder',e.target.value)} className="mt-2 w-full rounded-lg border p-3"/></label>
    <label className="text-sm">Status<select value={form.status} onChange={e=>field('status',e.target.value as GiftStatus)} className="mt-2 w-full rounded-lg border p-3"><option value="ACTIVE">Ativo</option><option value="INACTIVE">Inativo</option></select></label>
    <label className="text-sm sm:col-span-2">Descrição<textarea rows={3} value={form.description} onChange={e=>field('description',e.target.value)} className="mt-2 w-full rounded-lg border p-3"/></label>
    <label className="text-sm sm:col-span-2">Imagem (JPEG, PNG ou WebP; até 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} className="mt-2 block w-full text-sm"/>{image&&<span className="mt-1 block text-xs text-[#756d61]">{image.name}</span>}</label>
   </div>
   <p className="mt-4 text-xs text-[#756d61]">A imagem será enviada após salvar o presente. Se o upload falhar, o presente continuará cadastrado e você poderá reenviar a imagem pela edição.</p>
   <div className="mt-6 flex flex-wrap gap-3"><button disabled={saving} className="rounded-full bg-[#40382e] px-6 py-3 text-sm text-white disabled:opacity-50">{saving?'Salvando...':'Salvar presente'}</button><button type="button" disabled={saving} onClick={()=>setEditing(undefined)} className="rounded-full border px-6 py-3 text-sm">Cancelar</button></div>
  </form>}
  <div className="mt-7 overflow-x-auto rounded-xl border border-[#e9e1d5] bg-white">{loading?<p role="status" className="p-6 text-sm">Carregando presentes...</p>:sorted.length===0?<p className="p-6 text-sm">Nenhum presente cadastrado.</p>:<table className="w-full min-w-[780px] text-left text-sm"><thead className="border-b bg-[#fdfbf7] text-[#756d61]"><tr><th className="p-4">Presente</th><th className="p-4">Evento</th><th className="p-4">Quantidade</th><th className="p-4">Status</th><th className="p-4">Imagem</th><th className="p-4">Ação</th></tr></thead><tbody>{sorted.map(g=><tr key={g.id} className="border-b last:border-0"><td className="p-4 font-medium">{g.name}</td><td className="p-4">{g.events?.name??events.find(e=>e.id===g.event_id)?.name??'—'}</td><td className="p-4">{g.quantity}</td><td className="p-4">{g.status==='ACTIVE'?'Ativo':'Inativo'}</td><td className="p-4">{g.image_path?<span className="inline-flex items-center gap-1 text-[#477054]"><ImagePlus size={16}/>Enviada</span>:'Sem imagem'}</td><td className="p-4"><button onClick={()=>open(g)} className="inline-flex items-center gap-2 underline"><Pencil size={15}/>Editar</button></td></tr>)}</tbody></table>}</div>
  <button disabled={loading} onClick={reload} className="mt-5 inline-flex items-center gap-2 text-sm underline disabled:opacity-50"><RefreshCw size={16}/>Atualizar lista</button>
  <p className="mt-4 flex items-center gap-2 text-xs text-[#756d61]"><Gift size={15}/>As reservas existentes são protegidas por regras do backend ao editar quantidade e disponibilidade.</p>
 </section>
}
