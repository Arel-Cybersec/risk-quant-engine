import { useEffect, useState } from "react";

/** True after hydration — gate browser-only rendering (canvas, WebGL, storage). */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
