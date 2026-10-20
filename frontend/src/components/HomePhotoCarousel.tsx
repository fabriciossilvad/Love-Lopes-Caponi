import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchPhotos, type PublicPhoto } from '../services/photos';

const INTERVAL_MS=3500;
const TRANSITION_MS=850;
const CLONES=3;
export function carouselWindow<T>(items:T[],start:number,count:number):T[]{
 if(items.length===0)return [];
 return Array.from({length:Math.min(count,items.length)},(_,index)=>items[(start+index)%items.length]);
}
export function HomePhotoCarousel({showHeading=true}:{showHeading?:boolean}={}){
 const [photos,setPhotos]=useState<PublicPhoto[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState(false);
 const [revision,setRevision]=useState(0);
 const [position,setPosition]=useState(CLONES);
 const [animated,setAnimated]=useState(true);
 const [moving,setMoving]=useState(false);
 const [paused,setPaused]=useState(false);
 const [reducedMotion,setReducedMotion]=useState(()=>typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true);
 const lock=useRef(false);
 useEffect(()=>{
  const controller=new AbortController();setLoading(true);setError(false);
  fetchPhotos(controller.signal).then(items=>{
   if(controller.signal.aborted)return;
   setPhotos(items.filter(photo=>photo.event_id===null&&Boolean(photo.public_url)));
   setPosition(CLONES);setAnimated(true);lock.current=false;setMoving(false);
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
 function move(direction:1|-1){
  if(photos.length<=1||lock.current)return;
  lock.current=true;setMoving(true);setAnimated(true);
  setPosition(current=>current+direction);
 }
 useEffect(()=>{
  if(photos.length<=1||paused||reducedMotion||moving)return;
  const timer=window.setInterval(()=>{if(document.visibilityState==='visible')move(1)},INTERVAL_MS);
  return()=>window.clearInterval(timer);
 },[photos.length,paused,reducedMotion,moving]);
 function settle(){
  if(!lock.current)return;
  setAnimated(false);
  setPosition(current=>current>=photos.length+CLONES?CLONES:current<CLONES?photos.length+current:current);
  lock.current=false;setMoving(false);
 }
 // The cloned cards make the wraparound seamless in either direction.
 const slides=photos.length>1?[...Array.from({length:CLONES},(_,i)=>photos[(photos.length-CLONES+i%photos.length+photos.length)%photos.length]),...photos,...Array.from({length:CLONES},(_,i)=>photos[i%photos.length])]:photos;
 if(!loading&&!error&&photos.length===0)return null;
 return <section aria-label="Galeria de fotos da nossa história" className="relative mx-auto w-full max-w-6xl px-5 pb-16 sm:px-10 sm:pb-24" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={event=>{if(!(event.relatedTarget instanceof Node)||!event.currentTarget.contains(event.relatedTarget))setPaused(false)}}>
  <div className={`mb-6 flex flex-wrap items-end gap-4 ${showHeading?'justify-between':'justify-end'}`}>
   {showHeading&&<div><p className="sans text-xs uppercase tracking-[.25em] text-[#8a7457]">Nossa história em imagens</p><h2 className="mt-3 text-3xl text-[#40382e] sm:text-4xl">Nossos momentos</h2></div>}
   {photos.length>1&&<div className="flex items-center gap-2">
    <button type="button" onClick={()=>move(-1)} aria-label="Fotos anteriores" className="flex h-11 w-11 items-center justify-center rounded-full border border-[#cdbb9f] bg-white/85 text-[#40382e] hover:bg-[#f0e9df]"><ChevronLeft size={19}/></button>
    <button type="button" onClick={()=>move(1)} aria-label="Próximas fotos" className="flex h-11 w-11 items-center justify-center rounded-full border border-[#cdbb9f] bg-white/85 text-[#40382e] hover:bg-[#f0e9df]"><ChevronRight size={19}/></button>
   </div>}
  </div>
  {loading?<div role="status" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"><span className="sans col-span-full text-sm text-[#756d61]">Carregando momentos...</span>{[0,1,2].map(item=><div key={item} aria-hidden="true" className={`aspect-[4/5] animate-pulse rounded-2xl bg-[#eee6da] ${item===1?'hidden sm:block':item===2?'hidden lg:block':''}`}/>)}</div>
  :error?<div role="alert" className="sans rounded-xl border border-[#e9e1d5] bg-white/80 p-5 text-sm">Não foi possível carregar as fotos. <button type="button" onClick={()=>setRevision(value=>value+1)} className="underline">Tentar novamente</button></div>
  :<div className="overflow-hidden"><div className="carousel-slide-track" style={{transform:photos.length>1?`translate3d(calc(-1 * ${position} * (100% + 16px) / var(--carousel-columns)),0,0)`:'none',transition:animated&&!reducedMotion?`transform ${TRANSITION_MS}ms cubic-bezier(.22,1,.36,1)`:'none'}} onTransitionEnd={event=>{if(event.target===event.currentTarget)settle()}}>
   {slides.map((photo,i)=><figure key={`${i}-${photo.id}`} className="min-w-0 overflow-hidden rounded-2xl border border-[#e9e1d5] bg-[#eee6da] shadow-sm">
    <img src={photo.public_url} alt={photo.caption||'Momento especial da nossa história'} loading={i<=CLONES+3?'eager':'lazy'} className="aspect-[4/5] w-full object-cover"/>
    {photo.caption&&<figcaption className="sans bg-white/90 px-4 py-3 text-sm text-[#655d53]">{photo.caption}</figcaption>}
   </figure>)}
  </div></div>}
 </section>;
}
