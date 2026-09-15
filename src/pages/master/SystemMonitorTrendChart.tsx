type Point = { hour: string; operations: number; failures: number };

export default function SystemMonitorTrendChart({ data }: { data: Point[] }) {
  const width = 1000, height = 260, left = 42, right = 18, top = 18, bottom = 38;
  const innerW = width - left - right, innerH = height - top - bottom;
  const max = Math.max(1, ...data.flatMap((p) => [p.operations, p.failures]));
  const x = (i: number) => left + (data.length <= 1 ? 0 : (i * innerW) / (data.length - 1));
  const y = (v: number) => top + innerH - (v / max) * innerH;
  const points = (key: "operations" | "failures") => data.map((p, i) => `${x(i)},${y(p[key])}`).join(" ");
  const ticks = [0, .25, .5, .75, 1].map((r) => Math.round(max * r));
  return <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-slate-900">24時間のログ推移</h2><p className="mt-1 text-xs text-slate-500">1時間ごとの全操作数と失敗数を表示します。エラーが増え始めた時間帯の特定に利用できます。</p></div><div className="flex gap-4 text-xs font-semibold"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-slate-700"/>全操作</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-red-500"/>失敗</span></div></div>
    <div className="mt-4 overflow-x-auto"><svg viewBox={`0 0 ${width} ${height}`} className="min-w-[760px] w-full" role="img" aria-label="24時間の操作数と失敗数の推移">
      {ticks.map((v) => { const yy=y(v); return <g key={v}><line x1={left} x2={width-right} y1={yy} y2={yy} stroke="#e2e8f0" strokeWidth="1"/><text x={left-8} y={yy+4} textAnchor="end" fontSize="11" fill="#94a3b8">{v}</text></g> })}
      {data.length>0?<><polyline points={points("operations")} fill="none" stroke="#334155" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/><polyline points={points("failures")} fill="none" stroke="#ef4444" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>{data.map((p,i)=><g key={p.hour}><circle cx={x(i)} cy={y(p.failures)} r={p.failures?4:2} fill="#ef4444"><title>{`${new Date(p.hour).toLocaleString('ja-JP')} 失敗 ${p.failures}件 / 全操作 ${p.operations}件`}</title></circle>{i%4===0||i===data.length-1?<text x={x(i)} y={height-12} textAnchor="middle" fontSize="11" fill="#64748b">{new Date(p.hour).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})}</text>:null}</g>)}</>:null}
    </svg></div>
  </section>;
}
