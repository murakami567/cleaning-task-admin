from pathlib import Path

p = Path('src/pages/admin/PayrollAttendancePage.tsx')
s = p.read_text()

old_style = '''      <style>{`@media print { body * { visibility:hidden; } .print-area,.print-area * { visibility:visible; } .print-area { position:absolute; left:0; top:0; width:100%; border:none!important; box-shadow:none!important; transform:scale(.82); transform-origin:top left; } @page { size:A4 portrait; margin:8mm; } }`}</style>'''
new_style = '''      <style>{`@media print {
        html, body { background:#fff !important; }
        body * { visibility:hidden; }
        .print-area, .print-area * { visibility:visible; }
        .print-area {
          position:absolute;
          left:0;
          top:0;
          width:100% !important;
          max-width:none !important;
          margin:0 !important;
          padding:0 !important;
          border:none !important;
          box-shadow:none !important;
          border-radius:0 !important;
          transform:none !important;
        }
        .print-area .print-summary { grid-template-columns:repeat(4,1fr) !important; gap:6px !important; margin-bottom:10px !important; }
        .print-area .print-summary > div { padding:8px !important; box-shadow:none !important; border-radius:6px !important; }
        .print-area .print-summary .text-2xl { font-size:16px !important; line-height:1.2 !important; }
        .print-area .print-table-wrap { overflow:visible !important; border-radius:0 !important; }
        .print-area table { width:100% !important; min-width:0 !important; table-layout:fixed !important; font-size:8px !important; }
        .print-area th, .print-area td { padding:5px 4px !important; line-height:1.25 !important; word-break:break-word !important; overflow-wrap:anywhere !important; }
        .print-area th:nth-child(1), .print-area td:nth-child(1) { width:5%; }
        .print-area th:nth-child(2), .print-area td:nth-child(2) { width:9%; }
        .print-area th:nth-child(3), .print-area td:nth-child(3) { width:8%; }
        .print-area th:nth-child(4), .print-area td:nth-child(4) { width:24%; }
        .print-area th:nth-child(5), .print-area td:nth-child(5) { width:6%; }
        .print-area th:nth-child(6), .print-area td:nth-child(6) { width:8%; }
        .print-area th:nth-child(7), .print-area td:nth-child(7) { width:7%; }
        .print-area th:nth-child(8), .print-area td:nth-child(8) { width:8%; }
        .print-area th:nth-child(9), .print-area td:nth-child(9) { width:8%; }
        .print-area th:nth-child(10), .print-area td:nth-child(10) { width:8%; }
        .print-area th:nth-child(11), .print-area td:nth-child(11) { width:9%; }
        .print-area thead { display:table-header-group; }
        .print-area tfoot { display:table-row-group; }
        .print-area tr { break-inside:avoid; page-break-inside:avoid; }
        @page { size:A4 landscape; margin:8mm; }
      }`}</style>'''
if old_style not in s:
    raise SystemExit('print style target not found')
s = s.replace(old_style, new_style, 1)

s = s.replace('''<div className="mb-5 grid gap-4 md:grid-cols-4"><Metric label="スタッフ"''', '''<div className="print-summary mb-5 grid gap-4 md:grid-cols-4"><Metric label="スタッフ"''', 1)
s = s.replace('''<div className="overflow-auto rounded-2xl border"><table className="w-full min-w-[900px] text-sm">''', '''<div className="print-table-wrap overflow-auto rounded-2xl border"><table className="w-full min-w-[900px] text-sm">''', 1)
s = s.replace('''<Button variant="outline" className="print:hidden" onClick={() => window.print()}>印刷</Button>''', '''<Button variant="outline" className="print:hidden" onClick={() => window.print()}>印刷・PDF保存</Button>''', 1)

p.write_text(s)
