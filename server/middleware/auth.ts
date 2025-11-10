import { Request, Response, NextFunction } from "express";

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
  
  if (!token || token !== "fake-token-123") {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  
  req.userId = "fake-user-123";
  next();
}
