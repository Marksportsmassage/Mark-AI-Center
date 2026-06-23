"use client";

import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import { getClientAuth, getClientDb } from "@/lib/firebase/client";

export type OwnerAuthStatus = "loading" | "unauthenticated" | "checkingOwner" | "allowed" | "restricted" | "error";

export interface OwnerAuthDebugInfo {
  uid: string | null;
  email: string | null;
  auth_loaded: boolean;
  owner_doc_path: string | null;
  owner_doc_read_success: boolean;
  owner_doc_exists: boolean;
  owner_role: unknown;
  owner_status: unknown;
  firestore_read_error_redacted?: string;
  firebase_project_id?: string;
  auth_domain?: string;
  hostname?: string;
  port?: string;
}

export interface OwnerAuthState {
  status: OwnerAuthStatus;
  user: User | null;
  message: string;
  debugInfo: OwnerAuthDebugInfo;
  refreshOwnerCheck: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

function redactedError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "unknown error");
  return message
    .replace(/AIza[0-9A-Za-z_-]+/g, "firebase-api-key-redacted")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer redacted")
    .replace(/sk-[A-Za-z0-9_-]+/g, "sk-redacted")
    .slice(0, 300);
}

function baseDebug(user: User | null, authLoaded: boolean): OwnerAuthDebugInfo {
  const uid = user?.uid ?? null;

  return {
    uid,
    email: user?.email ?? null,
    auth_loaded: authLoaded,
    owner_doc_path: uid ? `users/${uid}` : null,
    owner_doc_read_success: false,
    owner_doc_exists: false,
    owner_role: null,
    owner_status: null,
    firebase_project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    auth_domain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    hostname: typeof window === "undefined" ? undefined : window.location.hostname,
    port: typeof window === "undefined" ? undefined : window.location.port
  };
}

export function useOwnerAuth(): OwnerAuthState {
  const [user, setUser] = useState<User | null>(null);
  const authLoadedRef = useRef(false);
  const [state, setState] = useState<Omit<OwnerAuthState, "refreshOwnerCheck" | "signOutUser">>({
    status: "loading",
    user: null,
    message: "正在確認登入狀態...",
    debugInfo: baseDebug(null, false)
  });

  const checkOwner = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setState({
        status: "unauthenticated",
        user: null,
        message: "未登入",
        debugInfo: baseDebug(null, true)
      });
      return;
    }

    setState({
      status: "checkingOwner",
      user: currentUser,
      message: "正在確認 owner 權限...",
      debugInfo: baseDebug(currentUser, true)
    });

    try {
      const db = getClientDb();
      const ownerRef = doc(db, "users", currentUser.uid);
      const ownerSnap = await getDoc(ownerRef);
      const ownerData = ownerSnap.data();
      const debugInfo: OwnerAuthDebugInfo = {
        ...baseDebug(currentUser, true),
        owner_doc_read_success: true,
        owner_doc_exists: ownerSnap.exists(),
        owner_role: ownerData?.role ?? null,
        owner_status: ownerData?.status ?? null
      };

      if (ownerData?.role === "owner" && ownerData?.status === "active") {
        setState({
          status: "allowed",
          user: currentUser,
          message: "Owner access allowed.",
          debugInfo
        });
        return;
      }

      setState({
        status: "restricted",
        user: currentUser,
        message: "Access restricted",
        debugInfo
      });
    } catch (error) {
      setState({
        status: "error",
        user: currentUser,
        message: "Owner check failed",
        debugInfo: {
          ...baseDebug(currentUser, true),
          firestore_read_error_redacted: redactedError(error)
        }
      });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};

    const timeout = window.setTimeout(() => {
      if (cancelled || authLoadedRef.current) {
        return;
      }

      setState({
        status: "error",
        user: null,
        message: "Auth check timed out after 5 seconds.",
        debugInfo: {
          ...baseDebug(null, false),
          firestore_read_error_redacted: "Auth state did not resolve within 5 seconds."
        }
      });
    }, 5000);

    try {
      const auth = getClientAuth();
      unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (cancelled) {
          return;
        }

        window.clearTimeout(timeout);
        setUser(currentUser);
        authLoadedRef.current = true;
        await checkOwner(currentUser);
      });
    } catch (error) {
      window.clearTimeout(timeout);
      authLoadedRef.current = true;
      setState({
        status: "error",
        user: null,
        message: "Firebase Auth initialization failed.",
        debugInfo: {
          ...baseDebug(null, true),
          firestore_read_error_redacted: redactedError(error)
        }
      });
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      unsubscribe();
    };
  }, [checkOwner]);

  const refreshOwnerCheck = useCallback(async () => {
    await checkOwner(user ?? getClientAuth().currentUser);
  }, [checkOwner, user]);

  const signOutUser = useCallback(async () => {
    await signOut(getClientAuth());
    setUser(null);
    authLoadedRef.current = true;
    setState({
      status: "unauthenticated",
      user: null,
      message: "未登入",
      debugInfo: baseDebug(null, true)
    });
  }, []);

  return {
    ...state,
    refreshOwnerCheck,
    signOutUser
  };
}
