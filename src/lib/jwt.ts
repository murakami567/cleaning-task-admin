// JWT の検証はサーバ側が真。ここは UX のための事前チェック用なので、
// パースに失敗したり exp が無いトークンは「期限切れ扱い」で安全側に倒す。

type JwtPayload = {
  exp?: number;
  [key: string]: unknown;
};

function decodeBase64Url(input: string): string {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const base64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
  return atob(base64);
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const json = decodeBase64Url(parts[1]);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string | null): boolean {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return true;
  // 5 秒の余裕を持って判定し、ギリギリ通った直後に 403 になる事故を避ける
  const nowSec = Math.floor(Date.now() / 1000);
  return payload.exp - 5 <= nowSec;
}
