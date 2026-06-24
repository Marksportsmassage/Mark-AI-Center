"use client";

import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import { getClientAuth, getClientDb } from "@/lib/firebase/client";

export type OwnerAuthStatus = "loading" | "unauthenticated" | "checkingOwner" | "allowed" | "restricted" | "error";

export interface OwnerAuthDebugInfo {
  auth_status: OwnerAuthStatus;
  uid: string | null;
  email: string | null;
  auth_loaded: boolean;
  auth_timeout: boolean;
  owner_doc_path: string | null;
  owner_doc_read_success: boolean;
  owner_doc_exists: boolean;
  owner_role: unknown;
  owner_status: unknown;
  firestore_read_error_redacted?: string;
  firebase_config_status?: Record<string, "present" | "missing">;
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

function firebaseConfigStatus() {
  return {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "present" : "missing",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "present" : "missing",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "present" : "missing",
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? "present" : "missing"
  } as const;
}

function baseDebug(user: User | null, authLoaded: boolean, status: OwnerAuthStatus, authTimeout = false): OwnerAuthDebugInfo {
  const uid = user?.uid ?? null;

  return {
    auth_status: status,
    uid,
    email: user?.email ?? null,
    auth_loaded: authLoaded,
    auth_timeout: authTimeout,
    owner_doc_path: uid ? `users/${uid}` : null,
    owner_doc_read_success: false,
    owner_doc_exists: false,
    owner_role: null,
    owner_status: null,
    firebase_config_status: firebaseConfigStatus(),
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
    debugInfo: baseDebug(null, false, "loading")
  });

  const checkOwner = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setState({
        status: "unauthenticated",
        user: null,
        message: "未登入",
        debugInfo: baseDebug(null, true, "unauthenticated")
      });
      return;
    }

    setState({
      status: "checkingOwner",
      user: currentUser,
      message: "正在確認 owner 權限...",
      debugInfo: baseDebug(currentUser, true, "checkingOwner")
    });

    try {
      const db = getClientDb();
      const ownerRef = doc(db, "users", currentUser.uid);
      const ownerSnap = await getDoc(ownerRef);
      const ownerData = ownerSnap.data();
      const debugInfo: OwnerAuthDebugInfo = {
        ...baseDebug(currentUser, true, "checkingOwner"),
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
          debugInfo: { ...debugInfo, auth_status: "allowed" }
        });
        return;
      }

      setState({
        status: "restricted",
        user: currentUser,
        message: "Access restricted",
        debugInfo: { ...debugInfo, auth_status: "restricted" }
      });
    } catch (error) {
      setState({
        status: "error",
        user: currentUser,
        message: "Owner check failed",
        debugInfo: {
          ...baseDebug(currentUser, true, "error"),
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
        message: "Firebase Auth state did not resolve. Please verify Firebase web config and authorized domain.",
        debugInfo: {
          ...baseDebug(null, false, "error", true),
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
          ...baseDebug(null, true, "error"),
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
      debugInfo: baseDebug(null, true, "unauthenticated")
    });
  }, []);

  return {
    ...state,
    refreshOwnerCheck,
    signOutUser
  };
}
