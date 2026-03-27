export const PROPERTY_ORDER = [
  "FFFホテル",
  "やなぎ橋",
  "住吉",
  "アクシオン美野島",
  "ブランシェ",
  "ウィングス",
  "美野島",
  "ブランシェ",
  "玉井",
  "ウーブル博多",
  "いそのビル",
  "ジェン",
  "ルッシェ",
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
  "浄水",
] as const;

export function sortByPropertyOrder(property: string) {
  const index = PROPERTY_ORDER.findIndex((p) => property?.includes(p));
  return index === -1 ? 999 : index;
}

export function sortTasksByPropertyOrder<T extends { property: string; room?: string }>(tasks: T[]) {
  return [...tasks].sort((a, b) => {
    const diff = sortByPropertyOrder(a.property) - sortByPropertyOrder(b.property);
    if (diff !== 0) return diff;
    return String(a.room ?? "").localeCompare(String(b.room ?? ""), "ja", { numeric: true });
  });
}
