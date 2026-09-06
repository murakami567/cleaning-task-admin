from pathlib import Path
p=Path('src/pages/admin/PayrollAttendancePage.tsx')
s=p.read_text()
start=s.index('function PayrollStatement(')
new=r'''function PayrollStatement({ staffList, selectedStaffId, onSelectStaff, selectedStaff, rows, total }: any) {
  const statementItems = React.useMemo(() => {
    const items: { row: PayrollDailyResult; kind: "piece" | "hourly" }[] = [];
    rows.forEach((r: PayrollDailyResult) => {
      if (Number(r.cleaning_amount || 0) !== 0 || Number(r.room_count || 0) > 0) items.push({ row: r, kind: "piece" });
      if (Number(r.hourly_amount || 0) !== 0 || Number(r.actual_hours || 0) > 0 || Number(r.adjustment_amount || 0) !== 0 || Number(r.transportation_fee || 0) !== 0) items.push({ row: r, kind: "hourly" });
    });
    return items.sort((a, b) => {
      const dateDiff = String(a.row.target_date).localeCompare(String(b.row.target_date));
      if (dateDiff) return dateDiff;
      if (a.kind !== b.kind) return a.kind === "piece" ? -1 : 1;
      return String(a.row.facility || "").localeCompare(String(b.row.facility || ""), "ja");
    });
  }, [rows]);
  let previousDate = "";
  return (
    <Card className="print-area p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="text-lg font-semibold">個別給与明細</h2><p className="mt-1 text-sm text-neutral-500">スタッフを選択して印刷できます</p></div>
        <div className="flex gap-2"><select className="h-10 rounded-xl border bg-white px-3 text-sm print:hidden" value={selectedStaffId} onChange={(e) => onSelectStaff(e.target.value)}>{staffList.map((staff: PayrollDailyResult) => <option key={staff.staff_id} value={staff.staff_id}>{staff.staff_name}</option>)}</select><Button variant="outline" className="print:hidden" onClick={() => window.print()}>印刷</Button></div>
      </div>
      {!selectedStaff ? <div className="rounded-2xl border bg-neutral-50 p-6 text-sm text-neutral-500">対象スタッフがありません</div> : <>
        <div className="mb-5 grid gap-4 md:grid-cols-4"><Metric label="スタッフ" value={selectedStaff.staff_name} /><Metric label="計算方式" value={typeLabel(selectedStaff.payroll_type)} /><Metric label="対象日数" value={`${new Set(rows.map((r: PayrollDailyResult) => r.target_date)).size}日`} /><Metric label="支給合計" value={yen(total("final_amount", rows))} /></div>
        <div className="overflow-auto rounded-2xl border"><table className="w-full min-w-[900px] text-sm"><thead className="bg-neutral-100 text-xs text-neutral-600"><tr><th className="px-3 py-3 text-left">日付</th><th className="px-3 py-3 text-left">施設</th><th className="px-3 py-3 text-left">区分</th><th className="px-3 py-3 text-left min-w-[280px]">内訳</th><th className="px-3 py-3 text-right">部屋数</th><th className="px-3 py-3 text-right">清掃報酬</th><th className="px-3 py-3 text-right">実働</th><th className="px-3 py-3 text-right">時給報酬</th><th className="px-3 py-3 text-right">保証調整</th><th className="px-3 py-3 text-right">交通費</th><th className="px-3 py-3 text-right">支給額</th></tr></thead><tbody>{statementItems.map(({ row: r, kind }) => {
          const displayDate = previousDate !== r.target_date;
          previousDate = r.target_date;
          const parts = String(r.note || "").split(" / ").filter(Boolean);
          const pieceDetail = parts.filter((x) => !x.startsWith("時給対象:")).join(" / ") || "-";
          const hourlyDetail = parts.filter((x) => x.startsWith("時給対象:")).join(" / ") || (Number(r.actual_hours || 0) > 0 ? `${Number(r.actual_hours || 0).toFixed(2)}h × ${yen(r.hourly_rate)}` : "-");
          if (kind === "piece") return <tr key={`${r.id}-statement-piece`} className="border-t bg-white"><td className="px-3 py-3 font-medium">{displayDate ? formatMd(r.target_date) : ""}</td><td className="px-3 py-3">{r.facility}</td><td className="px-3 py-3"><span className="rounded-full border bg-neutral-50 px-2 py-1 text-xs font-semibold">単価分</span></td><td className="px-3 py-3 text-xs leading-5 text-neutral-600">{pieceDetail}</td><td className="px-3 py-3 text-right">{r.room_count || ""}</td><td className="px-3 py-3 text-right font-semibold">{yen(r.cleaning_amount)}</td><td className="px-3 py-3 text-right text-neutral-400">-</td><td className="px-3 py-3 text-right text-neutral-400">-</td><td className="px-3 py-3 text-right text-neutral-400">-</td><td className="px-3 py-3 text-right text-neutral-400">-</td><td className="px-3 py-3 text-right font-semibold">{yen(r.cleaning_amount)}</td></tr>;
          return <tr key={`${r.id}-statement-hourly`} className="border-t bg-blue-50/30"><td className="px-3 py-3 font-medium">{displayDate ? formatMd(r.target_date) : ""}</td><td className="px-3 py-3"></td><td className="px-3 py-3"><span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">時給換算分</span></td><td className="px-3 py-3 text-xs leading-5 text-neutral-600">{hourlyDetail}</td><td className="px-3 py-3 text-right text-neutral-400">-</td><td className="px-3 py-3 text-right text-neutral-400">-</td><td className="px-3 py-3 text-right">{Number(r.actual_hours || 0).toFixed(2)}h</td><td className="px-3 py-3 text-right font-semibold">{yen(r.hourly_amount)}</td><td className="px-3 py-3 text-right">{yen(r.adjustment_amount)}</td><td className="px-3 py-3 text-right">{yen(r.transportation_fee)}</td><td className="px-3 py-3 text-right font-semibold">{yen(Number(r.hourly_amount || 0) + Number(r.adjustment_amount || 0) + Number(r.transportation_fee || 0))}</td></tr>;
        })}</tbody><tfoot className="border-t-2 bg-neutral-50 font-semibold"><tr><td className="px-3 py-3" colSpan={4}>合計</td><td className="px-3 py-3 text-right">{total("room_count", rows)}</td><td className="px-3 py-3 text-right">{yen(total("cleaning_amount", rows))}</td><td className="px-3 py-3 text-right">{total("actual_hours", rows).toFixed(2)}h</td><td className="px-3 py-3 text-right">{yen(total("hourly_amount", rows))}</td><td className="px-3 py-3 text-right">{yen(total("adjustment_amount", rows))}</td><td className="px-3 py-3 text-right">{yen(total("transportation_fee", rows))}</td><td className="px-3 py-3 text-right">{yen(total("final_amount", rows))}</td></tr></tfoot></table></div>
      </>}
    </Card>
  );
}
'''
p.write_text(s[:start]+new)
