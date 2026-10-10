import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { ImagePlus, Pencil, Plus, RefreshCw, X } from 'lucide-react';
import type { AdminSession } from '../services/adminAuth';
import { listEvents, type AdminEvent, EventApiError } from '../services/adminEvents';
import { AdminPhotoError, createAdminPhoto, listAdminPhotos, updateAdminPhoto, withPhotoAuth, type AdminPhoto, type PhotoFields } from '../services/adminPhotos';
type Form={eventId:string;caption:string;displayOrder:string;active:boolean};
const blank:Form={eventId:'',caption:'',displayOrder:'0',active:true};
const types=['image/jpeg','image/png','image/webp'];
function errorMessage(err:unknown){
 if(err instanceof AdminPhotoError){if(err.kind==='too-large')return 'Imagem acima do limite de 5 MB.';if(err.kind==='type')return 'Envie uma imagem JPEG, PNG ou WebP válida.';if(err.kind==='invalid')return 'Dados inválidos ou evento não encontrado.'}
 return 'Não foi possível concluir a operação. Tente novamente.';
}
export function AdminPhotos({session,onExpired}:{session:AdminSession;onExpired:()=>void}){
 const [photos,setPhotos]=useState<AdminPhoto[]>([]);
 const [events,setEvents]=useState<AdminEvent[]>([]);
 const [loading,setLoading]=useState(true);
 const [revision,setRevision]=useState(0);
 const [editing,setEditing]=useState<AdminPhoto|null|undefined>(undefined);
 const [form,setForm]=useState<Form>(blank);
 const [file,setFile]=useState<File|null>(null);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [feedback,setFeedback]=useState<string|null>(null);
 const reload=useCallback(()=>setRevision(n=>n+1),[]);
 const handleError=useCallback((err:unknown)=>{if(err instanceof AdminPhotoError&&err.kind==='unauthorized'){onExpired();return}setError(errorMessage(err))},[onExpired]);
 useEffect(()=>{
  let active=true;setLoading(true);setError(null);
  Promise.all([withPhotoAuth(token=>listAdminPhotos(token)),withPhotoAuth(token=>listEvents(token)).catch(err=>{if(err instanceof EventApiError&&err.kind==='unauthorized')throw new AdminPhotoError('unauthorized');throw err})]).then(([p,e])=>{if(active){setPhotos(p);setEvents(e)}}).catch(err=>{if(active)handleError(err)}).finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[session.accessToken,revision,handleError]);
 function open(photo?:AdminPhoto){setEditing(photo??null);setFile(null);setError(null);setFeedback(null);setForm(photo?{eventId:photo.event_id??'',caption:photo.caption??'',displayOrder:String(photo.display_order),active:photo.active}:{...blank})}
 function field<K extends keyof Form>(key:K,value:Form[K]){setForm(previous=>({...previous,[key]:value}))}
 function choose(event:ChangeEvent<HTMLInputElement>){
  const next=event.target.files?.[0]??null;
  if(next&&(!types.includes(next.type)||next.size>5*1024*1024)){setError(next.size>5*1024*1024?'A imagem deve ter até 5 MB.':'Use JPEG, PNG ou WebP.');setFile(null);event.target.value='';return}
  setError(null);setFile(next);
 }
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setError(null);setFeedback(null);
  const order=Number(form.displayOrder);
  if(!Number.isInteger(order)||order<0){setError('A ordem deve ser um número inteiro não negativo.');return}
  if(!editing&&!file){setError('Selecione uma imagem.');return}
  const payload:PhotoFields={eventId:form.eventId||null,caption:form.caption.trim()||null,displayOrder:order,active:form.active};
  setSaving(true);
  try{
   if(editing)await withPhotoAuth(token=>updateAdminPhoto(token,editing.id,payload));
   else if(file)await withPhotoAuth(token=>createAdminPhoto(token,file,payload));
   setEditing(undefined);setFeedback(editing?'Foto atualizada.':'Foto enviada com sucesso.');reload();
  }catch(err){handleError(err)}finally{setSaving(false)}
 }
 const sorted=[...photos].sort((a,b)=>a.display_order-b.display_order||a.created_at.localeCompare(b.created_at));
 return <section className="sans">
  <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-[#a28b69]">Administração</p><h1 className="mt-2 font-serif text-3xl">Galeria de fotos</h1><p className="mt-2 text-sm text-[#756d61]">Envie fotos, escolha o evento e controle a exibição pública.</p></div><button disabled={loading} onClick={()=>open()} className="inline-flex items-center gap-2 rounded-full bg-[#40382e] px-5 py-3 text-sm text-white disabled:opacity-50"><Plus size={17}/>Nova foto</button></div>
  {feedback&&<p role="status" className="mt-5 rounded-lg bg-[#f0e9df] p-3 text-sm">{feedback}</p>}
  {error&&<p role="alert" className="mt-5 text-sm text-[#9a4c40]">{error}</p>}
  {editing!==undefined&&<form onSubmit={event=>void save(event)} className="mt-7 rounded-xl border border-[#e9e1d5] bg-white p-5 sm:p-7"><div className="flex items-center justify-between"><h2 className="font-serif text-2xl">{editing?'Editar foto':'Enviar foto'}</h2><button type="button" aria-label="Fechar formulário" onClick={()=>setEditing(undefined)}><X size={20}/></button></div>
   <div className="mt-6 grid gap-4 sm:grid-cols-2">
    <label className="text-sm">Evento<select value={form.eventId} onChange={e=>field('eventId',e.target.value)} className="mt-2 w-full rounded-lg border p-3"><option value="">Todos os eventos</option>{events.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
    <label className="text-sm">Ordem de exibição<input required type="number" min="0" step="1" value={form.displayOrder} onChange={e=>field('displayOrder',e.target.value)} className="mt-2 w-full rounded-lg border p-3"/></label>
    <label className="text-sm sm:col-span-2">Legenda<textarea rows={2} value={form.caption} onChange={e=>field('caption',e.target.value)} className="mt-2 w-full rounded-lg border p-3"/></label>
    <label className="flex items-center gap-3 text-sm sm:col-span-2"><input type="checkbox" checked={form.active} onChange={e=>field('active',e.target.checked)}/>Foto visível no site público</label>
    {!editing&&<label className="text-sm sm:col-span-2">Imagem * (JPEG, PNG ou WebP; até 5 MB)<input required type="file" accept="image/jpeg,image/png,image/webp" onChange={choose} className="mt-2 block w-full text-sm"/></label>}
   </div>
   {editing&&<p className="mt-4 text-xs text-[#756d61]">A substituição do arquivo não está disponível neste formulário. Você pode editar legenda, evento, ordem e visibilidade.</p>}
   <div className="mt-6 flex flex-wrap gap-3"><button disabled={saving} className="rounded-full bg-[#40382e] px-6 py-3 text-sm text-white disabled:opacity-50">{saving?'Salvando...':'Salvar foto'}</button><button type="button" disabled={saving} onClick={()=>setEditing(undefined)} className="rounded-full border px-6 py-3 text-sm">Cancelar</button></div>
  </form>}
  <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{loading?<p role="status" className="text-sm">Carregando fotos...</p>:sorted.length===0?<p className="text-sm">Nenhuma foto cadastrada.</p>:sorted.map(photo=><article key={photo.id} className="overflow-hidden rounded-xl border border-[#e9e1d5] bg-white"><div className="flex h-44 items-center justify-center overflow-hidden bg-[#f0e9df]">{photo.public_url?<img src={photo.public_url} alt={photo.caption??"Foto da galeria"} loading="lazy" className="h-full w-full object-cover"/>:<ImagePlus size={35} className="text-[#b19b7a]"/>}</div><div className="p-4"><p className="font-medium">{photo.caption??'Sem legenda'}</p><p className="mt-2 text-xs text-[#756d61]">{photo.events?.name??'Todos os eventos'} · Ordem {photo.display_order}</p><p className="mt-2 text-xs">{photo.active?'Visível':'Oculta'}</p><button onClick={()=>open(photo)} className="mt-4 inline-flex items-center gap-2 text-sm underline"><Pencil size={15}/>Editar</button></div></article>)}</div>
  <button disabled={loading} onClick={reload} className="mt-6 inline-flex items-center gap-2 text-sm underline disabled:opacity-50"><RefreshCw size={16}/>Atualizar galeria</button>
 </section>
}
