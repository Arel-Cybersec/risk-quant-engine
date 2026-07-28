/** Assessment ledger persistence — IndexedDB with a localStorage fallback. */

export type AssessmentRecord = {
  id: string;
  ts: number;
  asset: string;
  likelihood: number;
  impact: number;
  inherent: number;
  residual: number;
  tier: string;
  controlEff: number;
  ale: number;
  p10: number;
  p50: number;
  p90: number;
  iterations: number;
  hash: string;
};

const DB_NAME = "sentinel_risk";
const STORE = "assessments";
const LS_KEY = "sentinel_risk_ledger_v2";

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function lsRead(): AssessmentRecord[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function lsWrite(rows: AssessmentRecord[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(rows));
  } catch {
    /* quota */
  }
}

export async function loadLedger(): Promise<AssessmentRecord[]> {
  const db = await openDb();
  if (!db) return lsRead().sort((a, b) => b.ts - a.ts);
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () =>
      resolve((req.result as AssessmentRecord[]).sort((a, b) => b.ts - a.ts));
    req.onerror = () => resolve(lsRead());
  });
}

export async function saveRecord(rec: AssessmentRecord): Promise<void> {
  lsWrite([rec, ...lsRead()].slice(0, 200));
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(rec);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export async function clearLedger(): Promise<void> {
  lsWrite([]);
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}
