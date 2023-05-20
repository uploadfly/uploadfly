import { Request, Response } from "express";
import prisma from "../../prisma";

const createApiKey = async (req: Request, res: Response) => {
  const { user_id, fly_id } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: user_id,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Invalid user id" });
    }

    const fly = await prisma.fly.findUnique({
      where: {
        id: fly_id,
      },
    });

    if (!fly) {
      return res.status(404).json({ message: "Invalid Fly id" });
    }
  } catch (error) {}
};

export { createApiKey };
