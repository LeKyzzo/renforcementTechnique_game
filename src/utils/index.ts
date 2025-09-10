export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n)); // verifie une intervalle
export const rand = (min: number, max: number) => Math.random() * (max - min) + min;
export const $ = (sel: string) => document.querySelector(sel) as HTMLElement | null; // selecteur HTML
export const wait = (ms: number) => new Promise<void>(res => setTimeout(res, ms)); // fais une pause


//Charger le fichier JSON avec gestion du timeout et des erreurs
export async function loadJSON<T>(url: string, timeoutMs = 3000): Promise<T> {
  const controller = new AbortController();
  const timeout = wait(timeoutMs).then(() => controller.abort());// annule la requete si elle depasse le timeout
  try {
    const fetchP = fetch(url, { signal: controller.signal }).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<T>;
    });
    const result = await Promise.race([fetchP, timeout]) as T;
    return result;
  } catch (err) {
    const msg = (err as any)?.message ?? "Erreur réseau"; 
    console.warn("loadJSON error:", msg);
    return Promise.resolve([] as unknown as T);
  }
}
// Appeler une fonction avec un contexte spécifique (this)
export function callWith<T extends object, R>(ctx: T, fn: (this: T) => R): R {
  return (fn as any).call(ctx);
}
