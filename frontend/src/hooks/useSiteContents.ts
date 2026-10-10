import { useEffect, useState } from 'react';
import { fetchSiteContents, toContentMap, type ContentMap } from '../services/siteContents';
export function useSiteContents(){
 const [values,setValues]=useState<ContentMap>({});
 useEffect(()=>{
  const controller=new AbortController();
  fetchSiteContents(controller.signal).then(rows=>{if(!controller.signal.aborted)setValues(toContentMap(rows))}).catch(()=>{});
  return()=>controller.abort();
 },[]);
 return values;
}
