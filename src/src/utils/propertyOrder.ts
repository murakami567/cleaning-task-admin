export const PROPERTY_ORDER = [
  "FFFホテル",
  "やなぎ橋",
  "住吉",
  "美野島",
  "ブランシェ",
  "ウィングス",
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

const propertyOrderMap = new Map(
  PROPERTY_ORDER.map((name, index) => [name, index]),
);

export function normalizePropertyName(name?: string | null) {
  const value = String(name ?? "").trim();
  if (!value) return "";

  if (value.includes("美野島")) return "美野島";
  if (value.includes("冷泉")) return "冷泉";
  if (value.includes("西中洲")) return "西中洲";

  return value;
}

export function getPropertySortRank(name?: string | null) {
  const normalized = normalizePropertyName(name);
  return propertyOrderMap.get(normalized) ?? 9999;
}

export function sortTasksByPropertyOrder<T extends {
  property_name?: string | null;
  task_date?: string | null;
  room_name?: string | null;
}>(items: T[]) {
  return [...items].sort((a, b) => {
    const rankA = getPropertySortRank(a.property_name);
    const rankB = getPropertySortRank(b.property_name);

    if (rankA !== rankB) return rankA - rankB;

    const dateA = String(a.task_date ?? "");
    const dateB = String(b.task_date ?? "");
    if (dateA !== dateB) return dateA.localeCompare(dateB);

    const roomA = String(a.room_name ?? "");
    const roomB = String(b.room_name ?? "");
    return roomA.localeCompare(roomB, "ja", { numeric: true });
  });
}

export function sortByPropertyOrder<T>(
  items: T[],
  getName: (item: T) => string | undefined | null,
) {
  return [...items].sort((a, b) => {
    const nameA = normalizePropertyName(getName(a));
    const nameB = normalizePropertyName(getName(b));

    const rankA = getPropertySortRank(nameA);
    const rankB = getPropertySortRank(nameB);

    if (rankA !== rankB) return rankA - rankB;

    return nameA.localeCompare(nameB, "ja");
  });
}
