const sections = [
  {
    title: "ログ監査",
    description: "管理画面・スマホ管理画面・従業員画面の操作履歴を確認します。",
    status: "次フェーズで接続",
  },
  {
    title: "アカウント・権限監査",
    description: "アカウントのロール、利用状態、権限変更履歴を確認します。",
    status: "次フェーズで接続",
  },
  {
    title: "システム監視",
    description: "認証エラーやAPIエラーなど、運用上確認が必要な状態を集約します。",
    status: "次フェーズで接続",
  },
];

export default function MasterAdminSystemPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">MASTER ADMIN</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">システム管理</h1>
          <p className="mt-2 text-sm text-slate-500">
            最高管理者専用の監査・システム管理画面です。
          </p>
        </div>
        <span className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white">
          最高管理者専用
        </span>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {sections.map((section) => (
          <section key={section.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
            <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{section.description}</p>
            <div className="mt-5 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-400">
              {section.status}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">監査ログ</h2>
        <p className="mt-2 text-sm text-slate-500">
          ログ保存テーブルとAPIを接続後、日時・利用者・画面・操作・対象・結果をここに表示します。
        </p>
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-6 gap-3 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
            <span>日時</span><span>利用者</span><span>画面</span><span>操作</span><span>対象</span><span>結果</span>
          </div>
          <div className="px-4 py-10 text-center text-sm text-slate-400">監査ログ接続待ち</div>
        </div>
      </section>
    </main>
  );
}
