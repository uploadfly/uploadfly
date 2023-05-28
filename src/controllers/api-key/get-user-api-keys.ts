import { Request, Response } from "express";
import prisma from "../../../prisma";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const getUserApiKeys = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.access_token;

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as {
      uuid: string;
    };

    const uuid = decoded.uuid;

    const apiKeys = await prisma.apiKey.findMany({
      where: {
        user_id: uuid,
      },
    });

    res.json(apiKeys);
  } catch (error) {
    res.sendStatus(500);
  }
};

export { getUserApiKeys };
