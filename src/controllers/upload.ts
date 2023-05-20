import { Request, Response } from "express";
import prisma from "../../prisma";

const upload = async (req: Request, res: Response) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ message: "Unauthorized request" });
  }
  const token = req.headers.authorization.split(" ")[1];

  try {
    // const token = await prisma
  } catch (error) {}
};

export { upload };
