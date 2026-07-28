import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://cleaning-task-api.onrender.com";

type FacilityReport = {
  id: string;
  task_id: string | null;
  task_date: string;
  property_name: string;
  room_name: string;
  description: string;
  photo_url: string;
  reported_by: string;
  reported_by_name: string;
  created_at: string;
};

export default function AdminFacilityReportsPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("admin_access_token") || "";

  const [items, setItems] = useState<FacilityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [photoOpen, setPhotoOpen] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }
    void fetchItems();
  }, []);

  async function fetchItems() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE}/api/admin-portal/facility-reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("admin_access_token");
        localStorage.removeItem("admin_user");
        navigate("/admin/login");
        return;
      }
      if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      console.error(e);
      setError("設備報告一覧の取得に失敗しました。");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  const q = search.trim().toLowerCase();
  const filtered = q
    ? items.filter((it) =>
        `${it.property_name} ${it.room_name} ${it.description} ${it.reported_by_name}`
          .toLowerCase()
          .includes(q)
      )
    : items;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-3xl font-black tracking-tight">設備報告</div>
          <div className="mt-1 text-sm text-slate-500">
            スタッフから報告された設備トラブルの一覧です。
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="物件・部屋・内容・報告者で検索"
            className="h-10 w-[280px] rounded-xl border border-slate-200 px-3 text-sm outline-none"
          />
          <button
            onClick={() => void fetchItems()}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            更新
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
          読み込み中...
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 text-sm text-slate-500">
            {q ? `該当 ${filtered.length} 件 / 全 ${items.length} 件` : `${items.length} 件`}
          </div>
          <div className="max-h-[calc(100vh-260px)] overflow-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-xs text-slate-500 shadow-[0_1px_0_0_rgb(226,232,240)]">
                <tr>
                  <th className="w-[150px] bg-slate-50 px-3 py-2 text-left">報告日時</th>
                  <th className="w-[110px] bg-slate-50 px-3 py-2 text-left">清掃日</th>
                  <th className="bg-slate-50 px-3 py-2 text-left">部屋</th>
                  <th className="bg-slate-50 px-3 py-2 text-left">報告内容</th>
                  <th className="w-[140px] bg-slate-50 px-3 py-2 text-left">報告者</th>
                  <th className="w-[100px] bg-slate-50 px-3 py-2 text-left">写真</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                      {q ? "該当する設備報告はありません。" : "設備トラブルの報告はまだありません。"}
                    </td>
                  </tr>
                ) : null}
                {filtered.map((it) => (
                  <tr key={it.id} className="border-b hover:bg-slate-50">
                    <td className="px-3 py-2 align-top">{formatDateTime(it.created_at)}</td>
                    <td className="px-3 py-2 align-top">{it.task_date || "-"}</td>
                    <td className="px-3 py-2 align-top">
                      <div className="font-bold text-slate-900">{it.property_name || "-"}</div>
                      <div className="text-xs text-slate-500">{it.room_name || "-"}</div>
                    </td>
                    <td className="whitespace-pre-wrap px-3 py-2 align-top">{it.description || "-"}</td>
                    <td className="px-3 py-2 align-top">{it.reported_by_name || "-"}</td>
                    <td className="px-3 py-2 align-top">
                      {it.photo_url ? (
                        <button onClick={() => setPhotoOpen(it.photo_url)} className="block" title="クリックで拡大">
                          <img src={it.photo_url} alt="設備トラブル" className="h-16 w-16 rounded-lg border border-slate-200 object-cover hover:opacity-80" />
                        </button>
                      ) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {photoOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPhotoOpen("")}>
          <img src={photoOpen} alt="設備トラブル 拡大" className="max-h-[90vh] max-w-[90vw] rounded-2xl" />
        </div>
      ) : null}
    </div>
  );
}

function formatDateTime(iso: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
