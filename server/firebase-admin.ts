import admin from "firebase-admin";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

let db: Firestore | null = null;
let auth: Auth | null = null;

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: "story-7af93"
    });
  }
  
  db = admin.firestore();
  auth = admin.auth();
} catch (error) {
  console.log("Firebase Admin not configured - continuing without server-side Firebase");
}

export { db, auth };
