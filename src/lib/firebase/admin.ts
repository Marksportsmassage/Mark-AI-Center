import { cert, getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID ?? "mark-ai-center";

function credential() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    return cert(JSON.parse(serviceAccountJson));
  }

  return applicationDefault();
}

export const adminApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: credential(),
      projectId
    });

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
