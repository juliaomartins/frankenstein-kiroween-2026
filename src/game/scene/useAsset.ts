"use client";

import { useEffect, useState } from "react";

const known = new Map<string, boolean>();

export function useAssetAvailable(url: string): boolean | null {
  const [available, setAvailable] = useState<boolean | null>(known.get(url) ?? null);
  useEffect(() => {
    if (known.has(url)) return;
    let cancelled = false;
    fetch(url, { method: "HEAD" })
      .then((res) => {
        const type = res.headers.get("content-type") ?? "";
        const ok = res.ok && !type.includes("text/html");
        known.set(url, ok);
        if (!cancelled) setAvailable(ok);
      })
      .catch(() => {
        known.set(url, false);
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);
  return available;
}
