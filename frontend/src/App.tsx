import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { ArrowRight, Heart, Mail } from 'lucide-react';
import { InvitationPage } from './pages/InvitationPage';
import { AdminPage } from './pages/AdminPage';
import { HomePhotoCarousel } from './components/HomePhotoCarousel';
import { useSiteContents } from './hooks/useSiteContents';
import { contentValue } from './services/siteContents';

function Home(){
 const values=useSiteContents();
 return <main className="relative isolate flex min-h-screen flex-col overflow-hidden bg-[#faf8f3]">
  <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-20 h-80 w-80 rounded-full bg-[#eee5d7]/70 blur-3xl"/>
  <div aria-hidden="true" className="pointer-events-none absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-[#f2e9dc]/80 blur-3xl"/>
  <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-7 sm:px-10">
   <Link to="/" className="text-lg tracking-tight sm:text-xl" aria-label="Love, Lopes & Caponi, página inicial">Love, Lopes <span className="text-[#b5966c]">&amp;</span> Caponi</Link>
   <span className="sans hidden text-xs uppercase tracking-[.25em] text-[#8e7b61] sm:block">Nossa história</span>
  </header>
  <section className="relative mx-auto flex w-full max-w-4xl flex-col items-center justify-center px-5 pb-8 pt-8 text-center sm:px-10 sm:pb-12 sm:pt-12">
   <div className="mb-5 flex items-center gap-4 text-[#b5966c]"><span className="h-px w-12 bg-[#c7ad87]"/><Heart size={23} strokeWidth={1.25}/><span className="h-px w-12 bg-[#c7ad87]"/></div>
   <p className="sans text-xs font-medium uppercase tracking-[.3em] text-[#8a7457]">{contentValue(values,"home.eyebrow")}</p>
   <h1 className="mt-4 max-w-3xl text-[clamp(2.7rem,8vw,6rem)] leading-[1.08] tracking-tight text-[#40382e]">{contentValue(values,"home.title")}</h1>
   <div className="my-6 h-px w-24 bg-[#c7ad87]"/>
   <p className="max-w-xl text-lg leading-relaxed text-[#655d53] sm:text-xl">{contentValue(values,"home.subtitle")}</p>
  </section>
  <HomePhotoCarousel/>
  <section className="relative mx-auto flex w-full max-w-4xl flex-col items-center px-5 pb-12 text-center sm:px-10 sm:pb-16">
   <div className="w-full max-w-md rounded-2xl border border-[#e9e1d5] bg-white/75 px-6 py-7 shadow-[0_16px_55px_-35px_rgba(64,56,46,.3)] sm:px-9">
    <Mail size={22} strokeWidth={1.3} className="mx-auto text-[#aa8a60]"/>
    <p className="sans mt-4 text-sm leading-relaxed text-[#655d53]">{contentValue(values,"home.instruction")}</p>
    <p className="sans mt-4 inline-flex items-center justify-center gap-2 text-xs text-[#8a7457]">Seu convite é pessoal <ArrowRight size={14}/></p>
   </div>
  </section>
  <footer className="relative px-5 pb-8 text-center"><p className="sans text-[11px] uppercase tracking-[.22em] text-[#8a806f]">Feito com amor · Love, Lopes &amp; Caponi</p></footer>
 </main>;
}
export function App(){return <BrowserRouter><Routes><Route path="/" element={<Home/>}/><Route path="/convite/:token" element={<InvitationPage/>}/><Route path="/admin/*" element={<AdminPage/>}/><Route path="*" element={<main className="flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-center"><h1 className="text-3xl">Página não encontrada</h1><Link to="/" className="sans rounded-full bg-[#40382e] px-6 py-3 text-sm text-white">Voltar ao início</Link></main>}/></Routes></BrowserRouter>}
