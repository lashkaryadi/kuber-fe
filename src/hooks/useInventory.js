import { useEffect, useState, useCallback } from 'react';
import {
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  syncInventory
} from '../utils/api';

export function useInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInventory();
      setInventory(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener('online', load);
    return () => window.removeEventListener('online', load);
  }, [load]);

  const add = async (item) => {
    const newItem = await addInventoryItem(item);
    setInventory((inv) => [...inv, newItem]);
  };

  const update = async (id, changes) => {
    const updated = await updateInventoryItem(id, changes);
    setInventory((inv) => inv.map((item) => (item.id === id ? { ...item, ...updated } : item)));
  };

  const remove = async (id) => {
    await deleteInventoryItem(id);
    setInventory((inv) => inv.filter((item) => item.id !== id));
  };

  const sync = async () => {
    await syncInventory();
    await load();
  };

  return {
    inventory,
    loading,
    error,
    add,
    update,
    remove,
    sync,
    reload: load,
  };
}
