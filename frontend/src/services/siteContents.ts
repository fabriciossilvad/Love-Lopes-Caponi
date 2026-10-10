export interface SiteContent {key:string;value:string|null;updated_at:string}
export const CONTENT_FIELDS=[
 {key:'home.eyebrow',label:'Chamada inicial',defaultValue:'Bem-vindos',maxLength:100},
 {key:'home.title',label:'Título da página inicial',defaultValue:'Love, Lopes & Caponi',maxLength:150},
 {key:'home.subtitle',label:'Mensagem de boas-vindas',defaultValue:'Um lugar para celebrar nossa história.',maxLength:1000},
 {key:'home.instruction',label:'Instrução para convidados',defaultValue:'Acesse o link do seu convite para conhecer os eventos.',maxLength:1000},
 {key:'invitation.eyebrow',label:'Chamada do convite',defaultValue:'Um convite especial',maxLength:100},
 {key:'invitation.title',label:'Título do convite',defaultValue:'Celebre o amor conosco',maxLength:150},
 {key:'invitation.rsvp_intro',label:'Texto da confirmação de presença',defaultValue:'Cada pessoa pode responder individualmente para cada celebração.',maxLength:1000},
 {key:'invitation.gifts_intro',label:'Texto da lista de presentes',defaultValue:'Escolha uma celebração para conhecer os presentes disponíveis.',maxLength:1000},
 {key:'invitation.footer',label:'Mensagem de rodapé',defaultValue:'COM CARINHO, LOVE, LOPES & CAPONI',maxLength:150},
] as const;
export type ContentKey=typeof CONTENT_FIELDS[number]['key'];
export type ContentMap=Partial<Record<ContentKey,string>>;
export function contentValue(values:ContentMap,key:ContentKey){
 const stored=values[key];
 return stored?.trim()?stored:CONTENT_FIELDS.find(field=>field.key===key)!.defaultValue;
}
export function toContentMap(rows:SiteContent[]):ContentMap{
 const values:ContentMap={};
 for(const field of CONTENT_FIELDS){
  const row=rows.find(item=>item.key===field.key);
  if(typeof row?.value==='string')values[field.key]=row.value;
 }
 return values;
}
export class SiteContentError extends Error {}
export async function fetchSiteContents(signal?:AbortSignal):Promise<SiteContent[]>{
 let response:Response;try{response=await fetch('/api/site-contents',{signal})}catch{throw new SiteContentError('network')}
 if(!response.ok)throw new SiteContentError('network');
 const data:unknown=await response.json();if(!Array.isArray(data))throw new SiteContentError('network');
 return data as SiteContent[];
}
