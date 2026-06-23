"use client";

import { collection, limit, onSnapshot, orderBy, query, where, type QueryConstraint } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getClientDb } from "@/lib/firebase/client";

export function useFirestoreCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[],
  enabled: boolean
) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const db = getClientDb();
      const collectionQuery = query(collection(db, collectionName), ...constraints);
      const unsubscribe = onSnapshot(
        collectionQuery,
        (snapshot) => {
          setItems(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as T));
          setError(null);
          setIsLoading(false);
        },
        () => {
          setError("Firestore 讀取失敗，請確認 owner 權限與 rules。");
          setIsLoading(false);
        }
      );

      return unsubscribe;
    } catch {
      setError("Firestore 尚未設定，請確認 .env.local。");
      setIsLoading(false);
    }
  }, [collectionName, constraints, enabled]);

  return { items, isLoading, error };
}

export const recent20 = [orderBy("created_at", "desc"), limit(20)];
export const activeOnly = [where("status", "==", "active")];
