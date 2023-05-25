import { Request, Response } from "express";
import prisma from "../../../prisma";
import generate from "boring-name-generator";

const createFly = async (req: Request, res: Response) => {
  const { user_id, name } = req.body;

  if (!user_id) return res.status(400).json({ message: "Missing user id" });

  try {
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
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { createFly };
