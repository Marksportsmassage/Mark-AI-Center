"use client";

import {
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  type User
} from "firebase/auth";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getClientAuth } from "@/lib/firebase/client";

export function AuthLogin() {
  const [message, setMessage] = useState("使用 Firebase Auth 登入。請先在 Firebase Console 啟用登入 provider。");
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const auth = getClientAuth();
      getRedirectResult(auth)
        .then((result) => {
          if (result?.user) {
            setMessage("登入成功，可以回到 Command Center。");
            router.push("/command-center");
          }
        })
        .catch((error) => {
          const code = typeof error === "object" && error && "code" in error ? String(error.code) : "unknown";
          setMessage(`登入未完成：${code}`);
        });
      return onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          router.push("/command-center");
        }
      });
    } catch {
      setMessage("Firebase 尚未設定，請先填寫 .env.local。");
    }
  }, [router]);

  async function signIn() {
    try {
      await signInWithPopup(getClientAuth(), new GoogleAuthProvider());
      setMessage("登入成功，可以回到 Command Center。");
      router.push("/command-center");
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "unknown";

      if (code === "auth/popup-blocked" || code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        await signInWithRedirect(getClientAuth(), new GoogleAuthProvider());
        return;
      }

      setMessage(`登入未完成：${code}`);
    }
  }

  return (
    <section className="login-shell">
      <div className="panel login-panel">
        <h1>Mark Login</h1>
        <p className="muted">{message}</p>
        {user ? (
          <div className="item">
            <h3>Current Firebase UID</h3>
            <p className="mono">{user.uid}</p>
          </div>
        ) : null}
        <button className="button" type="button" onClick={signIn}>
          <LogIn size={16} />
          Sign in with Google
        </button>
      </div>
    </section>
  );
}
