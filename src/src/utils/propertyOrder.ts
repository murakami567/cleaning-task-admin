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
  "比恵"
];

export function sortByPropertyOrder(a: string, b: string) {
  const ai = PROPERTY_ORDER.indexOf(a);
  const bi = PROPERTY_ORDER.indexOf(b);

  if (ai === -1 && bi === -1) return a.localeCompare(b);
  if (ai === -1) return 1;
  if (bi === -1) return -1;

  return ai - bi;
}

export function sortTasksByPropertyOrder(tasks: any[]) {
  return tasks.sort((a, b) => {
    const ai = PROPERTY_ORDER.indexOf(a.property);
    const bi = PROPERTY_ORDER.indexOf(b.property);

    if (ai === -1 && bi === -1) return a.property.localeCompare(b.property);
    if (ai === -1) return 1;
    if (bi === -1) return -1;

    if (ai !== bi) return ai - bi;

    // 同物件なら部屋順
    return (a.room || "").localeCompare(b.room || "");
  });
}
