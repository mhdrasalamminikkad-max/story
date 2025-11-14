import { Request, Response, NextFunction } from "express";
import { auth } from "../firebase-admin";

export interface AuthRequest extends Request {
  userId?: string;
}

export async function authenticateUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  
  try {
    if (!auth) {
      console.error("Firebase Admin not initialized");
      res.status(500).json({ error: "Authentication service unavailable" });
      return;
    }
    
    const decodedToken = await auth.verifyIdToken(token);
    req.userId = decodedToken.uid;
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ error: "Invalid token" });
  }
}
