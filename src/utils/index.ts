export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export const rand = (min: number, max: number) => Math.random() * (max - min) + min;
export const $ = (sel: string) => document.querySelector(sel) as HTMLElement | null;
export const wait = (ms: number) => new Promise<void>(res => setTimeout(res, ms));

export async function loadJSON<T>(url: string, timeoutMs = 3000): Promise<T> {
  const controller = new AbortController();
  const timeout = wait(timeoutMs).then(() => controller.abort());
  try {
    const fetchP = fetch(url, { signal: controller.signal }).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<T>;
    });
    const result = await Promise.race([fetchP, timeout]) as T;
    return result;
  } catch (err) {
    const msg = (err as any)?.message ?? "Erreur réseau inconnue"; // optional chaining
    console.warn("loadJSON error:", msg);
    return Promise.resolve([] as unknown as T);
  }
}

// Démo de manipulation de `this` via call/apply/bind
export function callWith<T extends object, R>(ctx: T, fn: (this: T) => R): R {
  return (fn as any).call(ctx);
}
