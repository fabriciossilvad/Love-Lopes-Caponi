import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Images } from 'lucide-react';
import { fetchPhotos, type PublicPhoto } from '../services/photos';

const INTERVAL_MS=2500;
export function carouselWindow<T>(items:T[],start:number,count:number):T[]{
 if(items.length===0)return [];
 return Array.from({length:Math.min(count,items.length)},(_,index)=>items[(start+index)%items.length]);
}
export function HomePhotoCarousel(){
 const [photos,setPhotos]=useState<PublicPhoto[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState(false);
 const [revision,setRevision]=useState(0);
 const [index,setIndex]=useState(0);
 const [paused,setPaused]=useState(false);
 const [reducedMotion,setReducedMotion]=useState(()=>typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true);
 useEffect(()=>{
  const controller=new AbortController();
  setLoading(true);setError(false);
  fetchPhotos(controller.signal).then(items=>{
   if(controller.signal.aborted)return;
   // Event-specific photos are reserved for the corresponding invitation page.
   setPhotos(items.filter(photo=>photo.event_id===null&&Boolean(photo.public_url)));
   setIndex(0);
  }).catch(()=>{if(!controller.signal.aborted)setError(true)})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return()=>controller.abort();
 },[revision]);
 useEffect(()=>{
  const query=window.matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>setReducedMotion(query.matches);
  query.addEventListener?.('change',update);
  return()=>query.removeEventListener?.('change',update);
 },[]);
 useEffect(()=>{
  if(photos.length<=1||paused||reducedMotion)return;
  const timer=window.setInterval(()=>{
   if(document.visibilityState==='visible')setIndex(previous=>(previous+1)%photos.length);
  },INTERVAL_MS);
  return()=>window.clearInterval(timer);
 },[photos.length,paused,reducedMotion]);
 const previous=()=>setIndex(current=>(current-1+photos.length)%photos.length);
 const next=()=>setIndex(current=>(current+1)%photos.length);
 if(!loading&&!error&&photos.length===0)return null;
 const visible=carouselWindow(photos,index,3);
 return <section aria-label="Galeria de fotos da nossa história" className="relative mx-auto w-full max-w-6xl px-5 pb-16 sm:px-10 sm:pb-24" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={event=>{if(!(event.relatedTarget instanceof Node)||!event.currentTarget.contains(event.relatedTarget))setPaused(false)}}>
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
   <div><p className="sans text-xs uppercase tracking-[.25em] text-[#8a7457]">Nossa história em imagens</p><h2 className="mt-3 text-3xl text-[#40382e] sm:text-4xl">Nossos momentos</h2></div>
   {photos.length>1&&<div className="flex items-center gap-2">
    <button type="button" onClick={previous} aria-label="Fotos anteriores" className="flex h-11 w-11 items-center justify-center rounded-full border border-[#cdbb9f] bg-white/85 text-[#40382e] hover:bg-[#f0e9df]"><ChevronLeft size={19}/></button>
    <button type="button" onClick={next} aria-label="Próximas fotos" className="flex h-11 w-11 items-center justify-center rounded-full border border-[#cdbb9f] bg-white/85 text-[#40382e] hover:bg-[#f0e9df]"><ChevronRight size={19}/></button>
   </div>}
  </div>
  {loading?<div role="status" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"><span className="sans col-span-full text-sm text-[#756d61]">Carregando momentos...</span>{[0,1,2].map(item=><div key={item} aria-hidden="true" className={`aspect-[4/5] animate-pulse rounded-2xl bg-[#eee6da] ${item===1?'hidden sm:block':item===2?'hidden lg:block':''}`}/>)}</div>
  :error?<div role="alert" className="sans rounded-xl border border-[#e9e1d5] bg-white/80 p-5 text-sm">Não foi possível carregar as fotos. <button type="button" onClick={()=>setRevision(value=>value+1)} className="underline">Tentar novamente</button></div>
  :<><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
   {visible.map((photo,position)=><figure key={position} className={`min-w-0 overflow-hidden rounded-2xl border border-[#e9e1d5] bg-[#eee6da] shadow-sm ${position===1?'hidden sm:block':position===2?'hidden lg:block':''}`}>
    <img key={photo.id} src={photo.public_url} alt={photo.caption||'Momento especial da nossa história'} loading={position===0?'eager':'lazy'} className={reducedMotion?"aspect-[4/5] w-full object-cover":"carousel-photo-enter aspect-[4/5] w-full object-cover"}/>
    {photo.caption&&<figcaption className="sans bg-white/90 px-4 py-3 text-sm text-[#655d53]">{photo.caption}</figcaption>}
   </figure>)}
  </div>
  {photos.length>1&&<p className="sans mt-4 text-center text-xs text-[#756d61]">Foto {index+1} de {photos.length} · {reducedMotion?'Use as setas para navegar':'Troca automática a cada 2,5 segundos'}</p>}</>}
 </section>;
}
