import { Request, Response } from "express";
import prisma from "../../../prisma";

const createFly = async (req: Request, res: Response) => {
  const { user_id, name } = req.body;
  if (!user_id) {
    return res.status(400).json({ message: "Missing user or fly id" });
  }

  try {
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

    await prisma.fly.create({
      data: {
        user_id,
        name: name || generate().dashed,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
