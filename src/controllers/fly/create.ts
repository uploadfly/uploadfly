import { Request, Response } from "express";
import prisma from "../../../prisma";
import generate from "boring-name-generator";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const createFly = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(400).json({ message: "Token is missing in request" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as {
      uuid: string;
    };

    const user_id = decoded.uuid;

    if (!user_id)
      return res.status(400).json({ message: "Missing user id in payload" });
    const isUser = await prisma.user.findUnique({
      where: {
        uuid: user_id,
      },
    });

    if (!isUser) return res.status(400).json({ message: "Invalid user id" });

    const userFlies = await prisma.fly.count({
      where: {
        user_id,
      },
    });

    if (userFlies === 2) {
      return res.status(400).json({
        message: "You can have a maximum of two flies",
      });
    }

    const fly = await prisma.fly.create({
      data: {
        user_id,
        name: name || generate().dashed,
      },
    });

    res.status(201).json({ fly: fly.uuid });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { createFly };
