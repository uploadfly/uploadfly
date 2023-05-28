import { Request, Response } from "express";
import prisma from "../../../prisma";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const getUserFlies = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.access_token;

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as {
      uuid: string;
    };

    const uuid = decoded.uuid;

    const flies = await prisma.fly.findMany({
      where: {
        user_id: uuid,
      },
      select: {
        name: true,
        uuid: true,
      },
    });

    res.json(flies);
  } catch (error) {
    res.sendStatus(500);
  }
};

export { getUserFlies };
