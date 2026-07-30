import React, { useEffect, useMemo, useState } from "react";
import { sortTasksByPropertyOrder } from "./utils/propertyOrder";

/* =========================
 * Options
 * ========================= */

const STATUS_OPTIONS = [
  { value: "未着手", label: "未着手" },
  { value: "清掃開始", label: "清掃開始" },
  { value: "清掃中", label: "清掃中" },
  { value: "完了", label: "清掃完了" },
  { value: "チェック完了", label: "チェック完了" },
  { value: "持越", label: "持越" },
  { value: "CXL", label: "CXL" },
];

const DUE_OPTIONS = [
  { value: "DUE_TODAY", label: "当日" },
  { value: "DUE_TOMORROW", label: "翌日" },
  { value: "DUE_LATER", label: "翌々日以降" },
];

const CATEGORY_OPTIONS = [
  { value: "WAREHOUSE", label: "倉庫作業" },
  { value: "TRANSPORT", label: "運搬" },
  { value: "LINEN", label: "荷受け" },
  { value: "INSPECTION", label: "設備対応" },
  { value: "PURCHASE", label: "買い出し" },
  { value: "OTHER", label: "その他" },
];

/* =========================
 * Utilities
 * ========================= */

const pad2 = (n: number) => String(n).padStart(2, "0");

const todayIso = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = pad2(now.getMonth() + 1);
  const d = pad2(now.getDate());
  return `${y}-${m}-${d}`;
};

function normalizeIsoDate(value?: string | null) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

const addDaysIso = (baseIso: string, delta: number) => {
  const [y, m, d] = normalizeIsoDate(baseIso)
    .split("-")
    .map((v) => parseInt(v, 10));
  const dt = new Date(y, m - 1, d + delta);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
};

const formatMd = (iso: string) => {
  const normalized = normalizeIsoDate(iso);
  if (!normalized) return "-";
  const [, m, d] = normalized.split("-").map((v) => parseInt(v, 10));
  return `${m}/${d}`;
};

function statusLabel(v: string) {
  return STATUS_OPTIONS.find((o) => o.value === v)?.label ?? v;
}

function statusChipClass(v: string) {
  switch (v) {
    case "清掃中":
    case "対応中":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "完了":
      return "border-slate-300 bg-slate-200 text-slate-700";
    case "チェック完了":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "CXL":
      return "border-slate-900 bg-slate-900 text-white";
    case "清掃開始":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "持越":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-slate-200 bg-white text-slate-600";
  }
}

function dueLabel(v: string) {
  return DUE_OPTIONS.find((o) => o.value === v)?.label ?? v;
}

function categoryLabel(v: string) {
  return CATEGORY_OPTIONS.find((o) => o.value === v)?.label ?? v;
}

function computeDueLabel(checkoutDate: string, nextCheckinDate: string) {
  const checkout = normalizeIsoDate(checkoutDate);
  const nextCheckin = normalizeIsoDate(nextCheckinDate);

  if (!checkout || !nextCheckin) return "DUE_LATER";

  if (nextCheckin === checkout) {
    return "DUE_TODAY";
  }

  if (nextCheckin === addDaysIso(checkout, 1)) {
    return "DUE_TOMORROW";
  }

  return "DUE_LATER";
}

function getTowelCount(
  property?: string,
  nextGuestCount?: number,
  nextStayNights?: number
) {
  if (!property) return "";

  if (property === "FFFホテル" || property === "やなぎ橋") {
    return "";
  }

  const guests = Number(nextGuestCount ?? 0);
  const nights = Number(nextStayNights ?? 0);

  if (guests <= 0 || nights <= 0) return "";

  if (nights >= 8) return guests * 3;
  if (nights >= 3) return guests * 2;
  return guests;
}

const PROPERTY_COLORS: Record<string, string> = {
  "FFFホテル": "#ffffff",
  "住吉": "#ffffff",
  "駅前": "#ffffff",
  "エスコート": "#ffe5e5",
  "ジェン": "#f0f0f0",
  "薬院": "#ffe8cc",
  "県庁前": "#e6ffe6",
  "ウィングス": "#e6f0ff",
  "玉井": "#f0f0f0",
  "西中洲": "#f3e6ff",
  "アクシオン": "#f5f0e6",
  "ルッシェ": "#f5f0e6",
  "ウーブル博多": "#f5f0e6",
  "冷泉": "#ffe5e5",
  "ロイズ": "#f3e6ff",
  "やなぎ橋": "#f5f0e6",
  "美野島": "#e6ffe6",
  "ブランシェ": "#e6ffe6",
  "いそのビル": "#ffe5e5",
  "アトラス": "#ffffff",
  "東光": "#f5f0e6",
  "比恵モダン": "#f0f0f0",
  "浄水": "#e6f0ff",
};

const PROPERTY_NAME_KEYS = Object.keys(PROPERTY_COLORS).sort(
  (a, b) => b.length - a.length
);

function normalizePropertyLabel(raw: string) {
  return String(raw || "")
    .normalize("NFKC")
    .replace(/[\s　]+/g, "")
    .trim();
}

function extractPropertyName(raw: string) {
  const value = normalizePropertyLabel(raw);
  if (!value) return "";

  const found = PROPERTY_NAME_KEYS.find((name) => {
    const normalizedName = normalizePropertyLabel(name);
    return value.startsWith(normalizedName) || value.includes(normalizedName);
  });
  return found || value;
}

function getPropertyColor(raw: string) {
  const propertyName = extractPropertyName(raw);
  return PROPERTY_COLORS[propertyName] || "#ffffff";
}

/* NOTE: Remaining file content is unchanged in repository. */