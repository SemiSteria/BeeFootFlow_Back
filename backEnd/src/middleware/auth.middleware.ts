import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const accessSecret = process.env.ACCESS_SECRET;
if (!accessSecret) throw new Error("ACCESS_SECRET is not defined");

const verifySecret = accessSecret as string;

// Middleware pour protéger les routes
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token manquant" });
    }

    const token = authHeader.split(" ")[1] ?? "";

    const payload = jwt.verify(token, verifySecret) as unknown as { userId: number };

    const user = await prisma.users.findUnique({
      where: { id: String(payload.userId) },
    });
    if (!user || !user.id)
      return res.status(401).json({ message: "Utilisateur introuvable" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
};