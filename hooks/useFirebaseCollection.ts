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
              
              // Gestion spécifique des erreurs de connectivité
              if (err.code === 'unavailable' || err.message.includes('offline')) {
                console.warn('Mode hors ligne détecté, utilisation des données en cache');
                setError("Mode hors ligne: Les données peuvent ne pas être à jour");
                // Ne pas bloquer l'application, garder les données existantes
              } else {
                setError(err.message);
              }
              setLoading(false);
            }
          );
        } else {
          // One-time fetch
          try {
            const items = await service.getAll();
            setData(items);
          } catch (fetchError: any) {
            if (fetchError.code === 'unavailable' || fetchError.message.includes('offline')) {
              console.warn('Impossible de récupérer les données, mode hors ligne');
              setError("Mode hors ligne: Impossible de charger les nouvelles données");
              // Garder un tableau vide plutôt que de planter
              setData([]);
            } else {
              throw fetchError;
            }
          }
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Firebase collection error:', err);
        
        // Gestion améliorée des erreurs
        if (err.code === 'unavailable' || err.message.includes('offline')) {
          setError("Mode hors ligne: Les données ne peuvent pas être chargées");
        } else {
          setError(err.message);
        }
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