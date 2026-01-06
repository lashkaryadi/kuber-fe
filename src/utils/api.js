// API Service Functions with Electron and Offline Support
import localforage from 'localforage';

const API_BASE = window.electronAPI ? 'http://localhost:5000/api' : '/api';
const isElectron = Boolean(window.electronAPI);

// Inventory IndexedDB store (fallback)
const inventoryStore = localforage.createInstance({
  name: 'gemstone-inventory',
  storeName: 'inventory',
});

// --- API Helpers ---
async function fetchWithFallback(url, options = {}, fallbackFn) {
  try {
    if (!navigator.onLine && fallbackFn) return fallbackFn();
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(res.statusText);
    return await res.json();
  } catch (err) {
    if (fallbackFn) return fallbackFn();
    throw err;
  }
}

// --- Inventory CRUD ---
export async function getInventory() {
  return fetchWithFallback(
    `${API_BASE}/inventory`, {},
    () => inventoryStore.getItems ? inventoryStore.getItems() : inventoryStore.keys().then(keys => Promise.all(keys.map(id => inventoryStore.getItem(id))))
  );
}

export async function getInventoryItem(id) {
  return fetchWithFallback(
    `${API_BASE}/inventory/${id}`, {},
    () => inventoryStore.getItem(id)
  );
}

export async function addInventoryItem(item) {
  if (!navigator.onLine) {
    // Save to IDB with a local temp id
    const tempId = `local-${Date.now()}`;
    await inventoryStore.setItem(tempId, { ...item, id: tempId, _offline: true });
    return { ...item, id: tempId, _offline: true };
  }
  const res = await fetch(`${API_BASE}/inventory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error(await res.text());
  const created = await res.json();
  await inventoryStore.setItem(String(created.id), created); // cache for offline
  return created;
}

export async function updateInventoryItem(id, changes) {
  if (!navigator.onLine) {
    const prev = await inventoryStore.getItem(id);
    await inventoryStore.setItem(id, { ...prev, ...changes, _offlineUpdate: true });
    return { ...prev, ...changes, _offlineUpdate: true };
  }
  const res = await fetch(`${API_BASE}/inventory/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  });
  if (!res.ok) throw new Error(await res.text());
  await inventoryStore.setItem(String(id), { ...changes, id });
  return { ...changes, id };
}

export async function deleteInventoryItem(id) {
  if (!navigator.onLine) {
    const prev = await inventoryStore.getItem(id);
    await inventoryStore.setItem(id, { ...prev, _offlineDelete: true });
    return { ...prev, _offlineDelete: true };
  }
  await fetch(`${API_BASE}/inventory/${id}`, { method: 'DELETE' });
  await inventoryStore.removeItem(String(id));
  return true;
}

// --- Sync Logic (Uploads offline entries when back online) ---
export async function syncInventory() {
  if (!navigator.onLine) return;
  const keys = await inventoryStore.keys();
  for (const key of keys) {
    let item = await inventoryStore.getItem(key);
    if (item?._offline) {
      // Create on backend
      let res = await fetch(`${API_BASE}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      let created = await res.json();
      await inventoryStore.setItem(String(created.id), created);
      await inventoryStore.removeItem(key);
    } else if (item?._offlineUpdate) {
      await fetch(`${API_BASE}/inventory/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      await inventoryStore.setItem(String(item.id), item);
    } else if (item?._offlineDelete) {
      await fetch(`${API_BASE}/inventory/${item.id}`,{method:'DELETE'});
      await inventoryStore.removeItem(String(item.id));
    }
  }
}

window.addEventListener('online', syncInventory);
