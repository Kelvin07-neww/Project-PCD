/** Penyimpanan foto di IndexedDB (localStorage terlalu kecil untuk banyak foto). */
export interface GalleryItem {
  id: number;
  url: string; // data URL JPEG/PNG
  filter: string;
  createdAt: number;
}

const DB_NAME = "pixelbooth";
const STORE = "photos";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const addPhoto = (item: GalleryItem) => run("readwrite", (s) => s.put(item));
export const getPhoto = (id: number) => run<GalleryItem | undefined>("readonly", (s) => s.get(id));
export const removePhoto = (id: number) => run("readwrite", (s) => s.delete(id));
export const clearPhotos = () => run("readwrite", (s) => s.clear());
export async function listPhotos(): Promise<GalleryItem[]> {
  const all = await run<GalleryItem[]>("readonly", (s) => s.getAll());
  return all.sort((a, b) => b.createdAt - a.createdAt);
}
