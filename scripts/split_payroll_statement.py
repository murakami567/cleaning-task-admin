from pathlib import Path

path = Path('src/pages/admin/PayrollAttendancePage.tsx')
text = path.read_text(encoding='utf-8')

old_head = '''<thead className="bg-neutral-100 text-xs text-neutral-600"><tr><th className="px-3 py-3 text-left">日付</th><th className="px-3 py-3 text-left">施設</th><th className="px-3 py-3 text-left min-w-[280px]">完了部屋・時間内訳</th><th className="px-3 py-3 text-right">部屋数</th><th className="px-3 py-3 text-right">清掃報酬</th><th className="px-3 py-3 text-right">実働</th><th className="px-3 py-3 text-right">時給報酬</th><th className="px-3 py-3 text-right">保証調整</th><th className="px-3 py-3 text-right">交通費</th><th className="px-3 py-3 text-right">支給額</th></tr></thead>'''
new_head = '''<thead className="bg-neutral-100 text-xs text-neutral-600"><tr><th className="px-3 py-3 text-left">日付</th><th className="px-3 py-3 text-left">施設</th><th className="px-3 py-3 text-left">区分</th><th className="px-3 py-3 text-left min-w-[280px]">内訳</th><th className="px-3 py-3 text-right">部屋数</th><th className="px-3 py-3 text-right">清掃報酬</th><th className="px-3 py-3 text-right">実働</th><th className="px-3 py-3 text-right">時給報酬</th><th className="px-3 py-3 text-right">保証調整</th><th className="px-3 py-3 text-right">交通費</th><th className="px-3 py-3 text-right">支給額</th></tr></thead>'''
if old_head not in text:
    raise SystemExit('statement header not found')
text = text.replace(old_head, new_head, 1)

start = text.index('<tbody>{rows.map((r: PayrollDailyResult) => { const displayDate = previousDate !== r.target_date;')
end = text.index('</tbody><tfoot', start)

new_body = '''<tbody>{rows.flatMap((r: PayrollDailyResult) => {
          const displayDate = previousDate !== r.target_date;
          previousDate = r.target_date;
          const parts = String(r.note || "").split(" / ").filter(Boolean);
          const pieceDetail = parts.filter((x) => !x.startsWith("時給対象:")).join(" / ") || "-";
          const hourlyDetail = parts.filter((x) => x.startsWith("時給対象:")).join(" / ") || (Number(r.actual_hours || 0) > 0 ? `${Number(r.actual_hours || 0).toFixed(2)}h × ${yen(r.hourly_rate)}` : "-");
          const hasPiece = Number(r.cleaning_amount || 0) !== 0 || Number(r.room_count || 0) > 0;
          const hasHourly = Number(r.hourly_amount || 0) !== 0 || Number(r.actual_hours || 0) > 0 || Number(r.adjustment_amount || 0) !== 0 || Number(r.transportation_fee || 0) !== 0;
          const statementLines: React.ReactNode[] = [];
          if (hasPiece) statementLines.push(
            <tr key={`${r.id}-statement-piece`} className="border-t bg-white">
              <td className="px-3 py-3 font-medium">{displayDate ? formatMd(r.target_date) : ""}</td>
              <td className="px-3 py-3">{r.facility}</td>
              <td className="px-3 py-3"><span className="rounded-full border bg-neutral-50 px-2 py-1 text-xs font-semibold">単価分</span></td>
              <td className="px-3 py-3 text-xs leading-5 text-neutral-600">{pieceDetail}</td>
              <td className="px-3 py-3 text-right">{r.room_count || ""}</td>
              <td className="px-3 py-3 text-right font-semibold">{yen(r.cleaning_amount)}</td>
              <td className="px-3 py-3 text-right text-neutral-400">-</td>
              <td className="px-3 py-3 text-right text-neutral-400">-</td>
              <td className="px-3 py-3 text-right text-neutral-400">-</td>
              <td className="px-3 py-3 text-right text-neutral-400">-</td>
              <td className="px-3 py-3 text-right font-semibold">{yen(r.cleaning_amount)}</td>
            </tr>
          );
          if (hasHourly) statementLines.push(
            <tr key={`${r.id}-statement-hourly`} className="border-t bg-blue-50/30">
              <td className="px-3 py-3 font-medium">{!hasPiece && displayDate ? formatMd(r.target_date) : ""}</td>
              <td className="px-3 py-3">{r.facility}</td>
              <td className="px-3 py-3"><span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">時給換算分</span></td>
              <td className="px-3 py-3 text-xs leading-5 text-neutral-600">{hourlyDetail}</td>
              <td className="px-3 py-3 text-right text-neutral-400">-</td>
              <td className="px-3 py-3 text-right text-neutral-400">-</td>
              <td className="px-3 py-3 text-right">{Number(r.actual_hours || 0).toFixed(2)}h</td>
              <td className="px-3 py-3 text-right font-semibold">{yen(r.hourly_amount)}</td>
              <td className="px-3 py-3 text-right">{yen(r.adjustment_amount)}</td>
              <td className="px-3 py-3 text-right">{yen(r.transportation_fee)}</td>
              <td className="px-3 py-3 text-right font-semibold">{yen(Number(r.hourly_amount || 0) + Number(r.adjustment_amount || 0) + Number(r.transportation_fee || 0))}</td>
            </tr>
          );
          return statementLines;
        })}</tbody>'''
text = text[:start] + new_body + text[end + len('</tbody>'):]

old_foot = '<td className="px-3 py-3" colSpan={3}>合計</td>'
new_foot = '<td className="px-3 py-3" colSpan={4}>合計</td>'
if old_foot not in text:
    raise SystemExit('statement footer colspan not found')
text = text.replace(old_foot, new_foot, 1)

path.write_text(text, encoding='utf-8')
print('updated payroll statement split display')
