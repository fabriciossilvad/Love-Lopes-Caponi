import { useEffect, useState } from 'react';
import { Images, RefreshCw } from 'lucide-react';
import { fetchPhotos, type PublicPhoto } from '../services/photos';
export function PhotoGallery({eventIds}:{eventIds:string[]}){
 const [photos,setPhotos]=useState<PublicPhoto[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState(false);
 const [revision,setRevision]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();setLoading(true);setError(false);
  fetchPhotos(controller.signal).then(data=>{if(!controller.signal.aborted)setPhotos(data)}).catch(()=>{if(!controller.signal.aborted)setError(true)}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return()=>controller.abort();
 },[revision]);
 const visible=photos.filter(photo=>photo.event_id===null||eventIds.includes(photo.event_id));
 return <section className="mt-12"><div className="flex items-center gap-3"><Images size={21} className="text-[#b5966c]"/><h3 className="text-2xl">Nossos momentos</h3></div>
  {loading?<p role="status" className="sans mt-5 text-sm">Carregando fotos...</p>:error?<div className="sans mt-5 text-sm">Não foi possível carregar as fotos. <button className="underline" onClick={()=>setRevision(n=>n+1)}>Tentar novamente</button></div>:visible.length===0?<p className="sans mt-4 text-sm text-[#756d61]">Em breve, compartilharemos nossos momentos especiais.</p>:<div className="mt-6 grid gap-4 sm:grid-cols-2">{visible.map(photo=><figure key={photo.id} className="overflow-hidden rounded-xl border border-[#e9e1d5] bg-[#fdfbf7]"><img src={photo.public_url} alt={photo.caption??'Foto da nossa história'} loading="lazy" className="h-56 w-full object-cover"/>{photo.caption&&<figcaption className="sans p-4 text-sm text-[#756d61]">{photo.caption}</figcaption>}</figure>)}</div>}
 </section>;
}
