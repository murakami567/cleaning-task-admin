from pathlib import Path

p = Path('src/pages/admin/PayrollAttendancePage.tsx')
s = p.read_text()
start_marker = '                              <tbody>{group.rows.flatMap((r) => {'
end_marker = '})}</tbody>\n                            </table>'
start = s.index(start_marker)
end = s.index(end_marker, start) + len('})}</tbody>')
new = '''                              <tbody>{(() => {
  const pieceLines: React.ReactNode[] = [];
  const hourlyLines: React.ReactNode[] = [];
  group.rows.forEach((r) => {
    const parts = String(r.note || "").split(" / ").filter(Boolean);
    const pieceDetail = parts.filter((x) => !x.startsWith("時給対象:")).join(" / ") || "-";
    const hourlyDetail = parts.filter((x) => x.startsWith("時給対象:")).join(" / ") || (Number(r.actual_hours || 0) > 0 ? `${Number(r.actual_hours || 0).toFixed(2)}h × ${yen(r.hourly_rate)}` : "-");
    const hasPiece = Number(r.cleaning_amount || 0) !== 0 || Number(r.room_count || 0) > 0;
    const hasHourly = Number(r.hourly_amount || 0) !== 0 || Number(r.actual_hours || 0) > 0 || Number(r.adjustment_amount || 0) !== 0 || Number(r.transportation_fee || 0) !== 0;
    if (hasPiece) pieceLines.push(<tr key={`${r.id}-piece`} className="border-t"><td className="px-3 py-3 font-medium">{r.facility || "-"}</td><td className="px-3 py-3"><span className="rounded-full border bg-neutral-50 px-2 py-1 font-semibold">単価分</span></td><td className="max-w-[360px] px-3 py-3 leading-5 text-neutral-600">{pieceDetail}</td><td className="px-3 py-3 text-right">{r.room_count || 0}</td><td className="px-3 py-3 text-right font-semibold">{yen(r.cleaning_amount)}</td><td className="px-3 py-3 text-right text-neutral-400">-</td><td className="px-3 py-3 text-right text-neutral-400">-</td><td className="px-3 py-3 text-right text-neutral-400">-</td><td className="px-3 py-3 text-right text-neutral-400">-</td><td className="px-3 py-3 text-right font-semibold">{yen(r.cleaning_amount)}</td><td className="px-3 py-3"><div className="flex justify-end gap-2"><button type="button" onClick={(e) => { e.stopPropagation(); setEditingPayroll(r); }} className="rounded-lg border bg-white px-3 py-1.5 font-medium">修正</button><button type="button" onClick={(e) => { e.stopPropagation(); void deletePayrollResult(r); }} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 font-medium text-red-600">削除</button></div></td></tr>);
    if (hasHourly) hourlyLines.push(<tr key={`${r.id}-hourly`} className="border-t bg-blue-50/30"><td className="px-3 py-3 font-medium">{r.facility || "-"}</td><td className="px-3 py-3"><span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 font-semibold text-blue-700">時給換算分</span></td><td className="max-w-[360px] px-3 py-3 leading-5 text-neutral-600">{hourlyDetail}</td><td className="px-3 py-3 text-right text-neutral-400">-</td><td className="px-3 py-3 text-right text-neutral-400">-</td><td className="px-3 py-3 text-right">{Number(r.actual_hours || 0).toFixed(2)}h</td><td className="px-3 py-3 text-right font-semibold">{yen(r.hourly_amount)}</td><td className="px-3 py-3 text-right">{yen(r.adjustment_amount)}</td><td className="px-3 py-3 text-right">{yen(r.transportation_fee)}</td><td className="px-3 py-3 text-right font-semibold">{yen(Number(r.hourly_amount || 0) + Number(r.adjustment_amount || 0) + Number(r.transportation_fee || 0))}</td><td className="px-3 py-3"><div className="flex justify-end gap-2"><button type="button" onClick={(e) => { e.stopPropagation(); setEditingPayroll(r); }} className="rounded-lg border bg-white px-3 py-1.5 font-medium">修正</button><button type="button" onClick={(e) => { e.stopPropagation(); void deletePayrollResult(r); }} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 font-medium text-red-600">削除</button></div></td></tr>);
  });
  return [...pieceLines, ...hourlyLines];
})()}</tbody>'''
p.write_text(s[:start] + new + s[end:])
