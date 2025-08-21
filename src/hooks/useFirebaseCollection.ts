import { useState, useEffect } from 'react';
import { onSnapshot, Unsubscribe } from 'firebase/firestore';

export interface UseFirebaseCollectionResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  create: (data: Omit<T, 'id'>) => Promise<string>;
  update: (id: string, data: Partial<T>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useFirebaseCollection<T extends { id?: string }>(
  service: any,
  realTime: boolean = false
): UseFirebaseCollectionResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (realTime && service.getCollectionRef) {
          // Real-time listener
          const collectionRef = service.getCollectionRef();
          unsubscribe = onSnapshot(
            collectionRef,
            (snapshot) => {
              const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              })) as T[];
              setData(items);
              setLoading(false);
            },
            (err) => {
              console.error('Firebase real-time error:', err);
              setError(err.message);
              setLoading(false);
            }
          );
        } else {
          // One-time fetch
          const items = await service.getAll();
          setData(items);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Firebase collection error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [service, realTime]);

  const create = async (itemData: Omit<T, 'id'>): Promise<string> => {
    setCreating(true);
    try {
      const id = await service.create(itemData);
      return id;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setCreating(false);
    }
  };

  const update = async (id: string, itemData: Partial<T>): Promise<void> => {
    setUpdating(true);
    try {
      await service.update(id, itemData);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  const remove = async (id: string): Promise<void> => {
    setDeleting(true);
    try {
      await service.delete(id);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  return {
    data,
    loading,
    error,
    creating,
    updating,
    deleting,
    create,
    update,
    remove
  };
}