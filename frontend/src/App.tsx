import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { InvitationPage } from './pages/InvitationPage';
import { AdminPage } from './pages/AdminPage';
import { useSiteContents } from './hooks/useSiteContents';
import { contentValue } from './services/siteContents';
function Home(){const values=useSiteContents();return <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center"><p className="sans text-xs uppercase tracking-[.3em] text-[#a28b69]">{contentValue(values,"home.eyebrow")}</p><h1 className="mt-5 text-5xl sm:text-7xl">{contentValue(values,"home.title")}</h1><p className="sans mt-6 text-sm text-[#71695e]">{contentValue(values,"home.subtitle")}</p><p className="sans mt-10 text-sm text-[#71695e]">{contentValue(values,"home.instruction")}</p></main>}
export function App(){return <BrowserRouter><Routes><Route path="/" element={<Home/>}/><Route path="/convite/:token" element={<InvitationPage/>}/><Route path="/admin/*" element={<AdminPage/>}/><Route path="*" element={<main className="p-10"><p>Página não encontrada.</p><Link to="/" className="underline">Voltar ao início</Link></main>}/></Routes></BrowserRouter>}
