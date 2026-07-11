import fs from "node:fs";

const file = "src/pages/admin/AdminHomePage.tsx";
let text = fs.readFileSync(file, "utf8");

const current = `        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-100 p-5 text-slate-400 cursor-not-allowed">
            <div className="text-lg font-bold">育成課ポータル</div>
            <div className="mt-2 text-sm">スタッフ育成・チェック管理</div>
            <div className="mt-4 text-sm font-semibold">準備中</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-100 p-5 text-slate-400 cursor-not-allowed">
            <div className="text-lg font-bold">施設課ポータル</div>
            <div className="mt-2 text-sm">設備・修繕管理</div>
            <div className="mt-4 text-sm font-semibold">準備中</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-100 p-5 text-slate-400 cursor-not-allowed">
            <div className="text-lg font-bold">OPポータル</div>
            <div className="mt-2 text-sm">運営管理・確認業務</div>
            <div className="mt-4 text-sm font-semibold">準備中</div>
          </div>`;

const replacement = `        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div
            onClick={() => {
              window.open("https://order-management-hoq5.onrender.com", "_blank", "noopener,noreferrer");
            }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition"
          >
            <div className="text-lg font-bold text-slate-900">発注リスト</div>
            <div className="mt-2 text-sm text-slate-500">発注依頼・納期・着荷状況を管理</div>
            <div className="mt-4 text-sm font-semibold text-blue-600">ページを開く →</div>
          </div>
          <div
            onClick={() => {
              window.open("https://gusk-property-management.onrender.com/opening", "_blank", "noopener,noreferrer");
            }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition"
          >
            <div className="text-lg font-bold text-slate-900">オープン管理</div>
            <div className="mt-2 text-sm text-slate-500">新規物件の開業準備・進捗管理</div>
            <div className="mt-4 text-sm font-semibold text-blue-600">ページを開く →</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-100 p-5 text-slate-400 cursor-not-allowed">
            <div className="text-lg font-bold">備品管理</div>
            <div className="mt-2 text-sm">備品在庫・配置・補充管理</div>
            <div className="mt-4 text-sm font-semibold">準備中</div>
          </div>`;

if (text.includes(current)) {
  text = text.replace(current, replacement);
} else if (!text.includes('>発注リスト</div>')) {
  throw new Error("admin portal cards patch target not found");
}

fs.writeFileSync(file, text);
console.log("patched admin portal cards and links");
