import admin from "firebase-admin";

const projectId = process.env.VITE_FIREBASE_PROJECT_ID;

if (!projectId) {
  throw new Error("VITE_FIREBASE_PROJECT_ID environment variable is required");
}

if (!admin.apps.length) {
  admin.initializeApp({
    projectId,
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
