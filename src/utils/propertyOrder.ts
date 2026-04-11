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

  // 長い名前・誤判定しやすい名前を先に判定
  if (value.includes("アクシオン美野島")) return "アクシオン美野島";
  if (value.includes("ウーブル博多")) return "ウーブル博多";
  if (value.includes("グランデエス")) return "グランデエス";
  if (value.includes("いそのビル")) return "いそのビル";
  if (value.includes("FFFホテル")) return "FFFホテル";
  if (value.includes("やなぎ橋")) return "やなぎ橋";
  if (value.includes("ブランシェ")) return "ブランシェ";
  if (value.includes("ウィングス")) return "ウィングス";
  if (value.includes("エスコート")) return "エスコート";
  if (value.includes("アトラス")) return "アトラス";
  if (value.includes("ロイズ")) return "ロイズ";
  if (value.includes("県庁前")) return "県庁前";
  if (value.includes("西中洲")) return "西中洲";
  if (value.includes("冷泉")) return "冷泉";
  if (value.includes("住吉")) return "住吉";
  if (value.includes("美野島")) return "美野島";
  if (value.includes("玉井")) return "玉井";
  if (value.includes("ジェン")) return "ジェン";
  if (value.includes("東光")) return "東光";
  if (value.includes("薬院")) return "薬院";
  if (value.includes("ピット")) return "ピット";
  if (value.includes("駅前")) return "駅前";
  if (value.includes("比恵")) return "比恵";

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

export function sortTasksByPropertyOrder<
  T extends {
    property?: string | null;
    room?: string | null;
    date?: string | null;
  }
>(tasks: T[], mode: "TODAY" | "FUTURE" = "TODAY") {
  return [...tasks].sort((a, b) => {
    const dateA = String(a.date ?? "");
    const dateB = String(b.date ?? "");

    if (mode === "FUTURE" && dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }

    const propertyDiff = comparePropertyOrder(a.property, b.property);
    if (propertyDiff !== 0) return propertyDiff;

    const roomA = String(a.room ?? "");
    const roomB = String(b.room ?? "");
    return roomA.localeCompare(roomB, "ja", { numeric: true });
  });
}

export function getNormalizedPropertyName(name?: string | null) {
  return normalizePropertyName(name);
}
