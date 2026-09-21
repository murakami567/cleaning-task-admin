import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";
const ORDER_URL = import.meta.env.VITE_ORDER_MANAGEMENT_URL || "https://order-management-hoq5.onrender.com";
const PROPERTY_URL = import.meta.env.VITE_GUSK_PROPERTY_MANAGEMENT_URL || "https://gusk-property-management.onrender.com";
const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

type Schedule = { id:string; start_date:string; end_date:string; title:string; description?:string; assignee_names?:string[] };
type Message = { id:string; target_date:string; message:string };
type Order = { id:string; item_name?:string; quantity?:number|null; unit?:string|null; delivery_place?:string|null; usage_place?:string|null; supplier?:string|null; due_date:string };
type Construction = { id:string; property_name?:string; contractor?:string; work_content?:string; status?:string; start_date?:string|null; end_date?:string|null; actual_end_date?:string|null };

function pad(n:number){return String(n).padStart(2,"0")}
function ds(d:Date){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
function inRange(d:string,s:string,e:string){return d>=s&&d<=e}
function cells(year:number,month:number){const first=new Date(year,month-1,1), start=first.getDay(), last=new Date(year,month,0).getDate();const out:{date:string;day:number;inMonth:boolean}[]=[];for(let i=0;i<start;i++){const d=new Date(year,month-1,1-(start-i));out.push({date:ds(d),day:d.getDate(),inMonth:false})}for(let day=1;day<=last;day++){const d=new Date(year,month-1,day);out.push({date:ds(d),day,inMonth:true})}while(out.length%7){const d=new Date(year,month-1,last+(out.length-start-last)+1);out.push({date:ds(d),day:d.getDate(),inMonth:false})}return out}
function constructionOn(d:string,x:Construction){return x.start_date&&x.end_date?inRange(d,x.start_date,x.end_date):[x.start_date,x.end_date,x.actual_end_date].filter(Boolean).includes(d)}

export default function AdminMobileCompanyCalendar(){
 const navigate=useNavigate(); const token=localStorage.getItem("admin_access_token")||""; const now=new Date();
 const [year,setYear]=useState(now.getFullYear()); const [month,setMonth]=useState(now.getMonth()+1); const [selected,setSelected]=useState(ds(now));
 const [schedules,setSchedules]=useState<Schedule[]>([]); const [orders,setOrders]=useState<Order[]>([]); const [constructions,setConstructions]=useState<Construction[]>([]); const [messages,setMessages]=useState<Message[]>([]); const [cleaning,setCleaning]=useState<Record<string,number>>({}); const [loading,setLoading]=useState(false);
 const monthCells=useMemo(()=>cells(year,month),[year,month]);
 async function authFetch(url:string){const r=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});if(r.status===401||r.status===403){localStorage.removeItem("admin_access_token");localStorage.removeItem("admin_user");navigate("/mobile/login");throw new Error()}return r}
 useEffect(()=>{if(!token)return;void load()},[token,year,month]);
 async function load(){setLoading(true);try{const [sr,or,cr,xr]=await Promise.all([authFetch(`${API_BASE}/api/admin-portal/calendar-schedules?year=${year}&month=${month}`),authFetch(`${API_BASE}/api/admin-portal/order-due-schedules?year=${year}&month=${month}`),authFetch(`${API_BASE}/api/admin-portal/construction-schedules?year=${year}&month=${month}`),authFetch(`${API_BASE}/api/admin-portal/company-calendar-summary?year=${year}&month=${month}`)]);const [sd,od,cd,summary]=await Promise.all([sr.json(),or.json(),cr.json(),xr.json()]);setSchedules(Array.isArray(sd?.schedules)?sd.schedules:[]);setOrders(Array.isArray(od?.items)?od.items:[]);setConstructions(Array.isArray(cd?.items)?cd.items:[]);setCleaning(summary?.cleaning_counts&&typeof summary.cleaning_counts==="object"?summary.cleaning_counts:{});setMessages(Array.isArray(summary?.messages)?summary.messages:[])}catch(e){console.error(e)}finally{setLoading(false)}}
 function move(delta:number){let y=year,m=month+delta;if(m===0){y--;m=12}if(m===13){y++;m=1}setYear(y);setMonth(m);setSelected(`${y}-${pad(m)}-01`)}
 function goToday(){const d=new Date();setYear(d.getFullYear());setMonth(d.getMonth()+1);setSelected(ds(d))}
 const ss=schedules.filter(x=>inRange(selected,x.start_date,x.end_date)); const os=orders.filter(x=>x.due_date===selected); const cs=constructions.filter(x=>constructionOn(selected,x)); const ms=messages.filter(x=>x.target_date===selected); const count=cleaning[selected]||0;
 return <main className="mx-auto max-w-lg px-3 py-3 pb-24">
  <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
   <div className="flex items-center justify-between px-3 py-3"><button onClick={()=>move(-1)} className="h-9 w-9 rounded-xl bg-slate-100 text-lg font-black">‹</button><div className="text-base font-black">{year}年 {month}月</div><div className="flex gap-1"><button onClick={goToday} className="h-9 rounded-xl bg-slate-100 px-3 text-xs font-black">今日</button><button onClick={()=>move(1)} className="h-9 w-9 rounded-xl bg-slate-100 text-lg font-black">›</button></div></div>
   <div className="grid grid-cols-7 border-t border-slate-100 px-2 pt-2">{WEEK.map((w,i)=><div key={w} className={`pb-2 text-center text-[10px] font-black ${i===0?"text-rose-500":i===6?"text-blue-500":"text-slate-400"}`}>{w}</div>)}{monthCells.map((c,i)=>{const active=c.date===selected;const has=(cleaning[c.date]||0)>0||schedules.some(x=>inRange(c.date,x.start_date,x.end_date))||orders.some(x=>x.due_date===c.date)||constructions.some(x=>constructionOn(c.date,x))||messages.some(x=>x.target_date===c.date);return <button key={c.date} onClick={()=>setSelected(c.date)} className={`relative flex h-12 flex-col items-center justify-center rounded-xl text-sm font-black ${active?"bg-slate-900 text-white":c.inMonth?"text-slate-800":"text-slate-300"}`}><span>{c.day}</span>{has?<span className={`mt-1 h-1.5 w-1.5 rounded-full ${active?"bg-white":"bg-orange-400"}`}/>:null}{i<7?null:null}</button>})}</div>
   {loading?<div className="px-4 py-2 text-center text-xs font-bold text-slate-400">読み込み中...</div>:null}
  </section>
  <section className="mt-3 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
   <div className="flex items-center justify-between"><div><div className="text-xs font-bold text-slate-400">選択日</div><h2 className="mt-0.5 text-lg font-black">{selected.replaceAll("-","/")}</h2></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">清掃 {count}室</span></div>
   <Detail title="社内予定" count={ss.length}>{ss.length?ss.map(x=><div key={x.id} className="rounded-xl bg-blue-50 p-3"><div className="text-sm font-black text-blue-900">{x.title}</div>{x.assignee_names?.length?<div className="mt-1 text-[11px] font-bold text-blue-700">{x.assignee_names.join("、")}</div>:null}{x.description?<div className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{x.description}</div>:null}</div>):<Empty/>}</Detail>
   <Detail title="発注納期" count={os.length}>{os.length?os.map(x=><button key={x.id} onClick={()=>window.open(ORDER_URL,"_blank","noopener,noreferrer")} className="block w-full rounded-xl bg-amber-50 p-3 text-left"><div className="text-sm font-black text-amber-900">{x.item_name||"品名未設定"}</div><div className="mt-1 text-xs text-slate-600">{x.quantity??"-"}{x.unit||""} / {x.delivery_place||x.usage_place||"配送先未設定"}</div></button>):<Empty/>}</Detail>
   <Detail title="工事予定" count={cs.length}>{cs.length?cs.map(x=><button key={x.id} onClick={()=>window.open(PROPERTY_URL,"_blank","noopener,noreferrer")} className="block w-full rounded-xl bg-orange-50 p-3 text-left"><div className="text-sm font-black text-orange-900">{x.property_name||"物件未設定"}</div><div className="mt-1 text-xs text-slate-600">{x.work_content||"工事内容未設定"}{x.contractor?` / ${x.contractor}`:""}</div></button>):<Empty/>}</Detail>
   <Detail title="連絡事項" count={ms.length}>{ms.length?ms.map(x=><div key={x.id} className="whitespace-pre-wrap rounded-xl bg-violet-50 p-3 text-sm text-violet-900">{x.message}</div>):<Empty/>}</Detail>
   <Detail title="設備予定" count={0}><div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-400">設備予定はデータ連携後に表示します。</div></Detail>
  </section>
 </main>
}
function Detail({title,count,children}:{title:string;count:number;children:React.ReactNode}){return <div className="mt-5 border-t border-slate-100 pt-4"><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-black text-slate-800">{title}</h3><span className="text-xs font-bold text-slate-400">{count}件</span></div><div className="space-y-2">{children}</div></div>}
function Empty(){return <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-400">予定はありません。</div>}
