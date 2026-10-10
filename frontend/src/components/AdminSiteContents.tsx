import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Save } from 'lucide-react';
import type { AdminSession } from '../services/adminAuth';
import { CONTENT_FIELDS, type ContentKey, type ContentMap, toContentMap } from '../services/siteContents';
import { AdminSiteContentError, listAdminSiteContents, saveAdminSiteContent, withContentAuth } from '../services/adminSiteContents';
export function AdminSiteContents({session,onExpired}:{session:AdminSession;onExpired:()=>void}){
 const [values,setValues]=useState<ContentMap>({});
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState<ContentKey|null>(null);
 const [error,setError]=useState<string|null>(null);
 const [feedback,setFeedback]=useState<string|null>(null);
 const [revision,setRevision]=useState(0);
 const reload=useCallback(()=>setRevision(n=>n+1),[]);
 const handleError=useCallback((err:unknown)=>{if(err instanceof AdminSiteContentError&&err.kind==='unauthorized'){onExpired();return}setError(err instanceof AdminSiteContentError&&err.kind==='invalid'?'Conteúdo inválido. Confira os dados.':'Não foi possível carregar ou salvar os conteúdos.')},[onExpired]);
 useEffect(()=>{
  let active=true;setLoading(true);setError(null);
  withContentAuth(token=>listAdminSiteContents(token)).then(rows=>{if(active)setValues(toContentMap(rows))}).catch(err=>{if(active)handleError(err)}).finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[session.accessToken,revision,handleError]);
 async function save(key:ContentKey,maxLength:number){
  const value=values[key]?.trim()??'';
  if(value.length>maxLength){setError('O texto excede o limite de caracteres.');return}
  setBusy(key);setError(null);setFeedback(null);
  try{await withContentAuth(token=>saveAdminSiteContent(token,key,value||null));setValues(previous=>({...previous,[key]:value}));setFeedback('Conteúdo salvo. Atualize a página pública para visualizar a alteração.')}
  catch(err){handleError(err)}finally{setBusy(null)}
 }
 return <section className="sans">
  <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-[#a28b69]">Administração</p><h1 className="mt-2 font-serif text-3xl">Conteúdos do site</h1><p className="mt-2 text-sm text-[#756d61]">Personalize as mensagens sem alterar o código. Campos vazios utilizam o texto padrão.</p></div><button disabled={loading||busy!==null} onClick={reload} className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm disabled:opacity-50"><RefreshCw size={16}/>Recarregar</button></div>
  {feedback&&<p role="status" className="mt-5 rounded-lg bg-[#f0e9df] p-3 text-sm">{feedback}</p>}
  {error&&<p role="alert" className="mt-5 text-sm text-[#9a4c40]">{error}</p>}
  {loading?<p role="status" className="mt-7 text-sm">Carregando conteúdos...</p>:<div className="mt-7 space-y-8">{(['home','invitation'] as const).map(group=><section key={group} className="rounded-xl border border-[#e9e1d5] bg-white p-5 sm:p-7"><h2 className="font-serif text-2xl">{group==='home'?'Página inicial':'Página do convite'}</h2><div className="mt-5 space-y-5">{CONTENT_FIELDS.filter(field=>field.key.startsWith(group+'.')).map(field=><div key={field.key}><label htmlFor={field.key} className="block text-sm font-medium">{field.label}</label><textarea id={field.key} rows={field.maxLength>150?3:2} maxLength={field.maxLength} value={values[field.key]??''} placeholder={field.defaultValue} onChange={event=>setValues(previous=>({...previous,[field.key]:event.target.value}))} className="mt-2 w-full rounded-lg border p-3 text-sm"/><div className="mt-2 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-[#756d61]">{(values[field.key]??'').length}/{field.maxLength} caracteres · Vazio = texto padrão</p><button disabled={busy!==null} onClick={()=>void save(field.key,field.maxLength)} className="inline-flex items-center gap-2 rounded-full bg-[#40382e] px-4 py-2 text-sm text-white disabled:opacity-50"><Save size={15}/>{busy===field.key?'Salvando...':'Salvar'}</button></div></div>)}</div></section>)}</div>}
 </section>;
}
