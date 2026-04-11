export const PROPERTY_ORDER = [
  "FFFホテル",
  "やなぎ橋",
  "住吉",
  "アクシオン美野島",
  "ブランシェ",
  "ウィングス",
  "美野島",
  "玉井",
  "ウーブル博多",
  "いそのビル",
  "ジェン",
  "東光",
  "グランデエス",
  "エスコート",
  "アトラス",
  "薬院",
  "ロイズ",
  "ピット",
  "県庁前",
  "西中洲",
  "冷泉",
  "駅前",
  "比恵",
] as const;

function normalizePropertyName(name?: string | null) {
  const value = String(name ?? "").trim();
  if (!value) return "";

  if (value.includes("美野島")) return "美野島";
  if (value.includes("冷泉")) return "冷泉";
  if (value.includes("西中洲")) return "西中洲";

  return value;
}

export function getPropertyOrderIndex(name?: string | null) {
  const normalized = normalizePropertyName(name);
  const index = PROPERTY_ORDER.findIndex((p) => p === normalized);
  return index === -1 ? 9999 : index;
}

export function comparePropertyOrder(a?: string | null, b?: string | null) {
  return getPropertyOrderIndex(a) - getPropertyOrderIndex(b);
}

export function sortTasksByPropertyOrder<T extends {
  property?: string | null;
  room?: string | null;
  date?: string | null;
}>(tasks: T[], mode: "TODAY" | "FUTURE" = "TODAY") {
  return [...tasks].sort((a, b) => {
    const dateA = String(a.date ?? "");
    const dateB = String(b.date ?? "");

    // 翌日以降は先に日付順
    if (mode === "FUTURE" && dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }

    // 次に物件順
    const propertyDiff = comparePropertyOrder(a.property, b.property);
    if (propertyDiff !== 0) return propertyDiff;

    // 最後に部屋順
    const roomA = String(a.room ?? "");
    const roomB = String(b.room ?? "");
    return roomA.localeCompare(roomB, "ja", { numeric: true });
  });
}
