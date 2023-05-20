import { Request, Response } from "express";
import prisma from "../../../prisma";
import { generateApiKey } from "../../utils/generateApiKey";

const createApiKey = async (req: Request, res: Response) => {
  const { user_id, fly_id } = req.body;

  if (!user_id || !fly_id)
    return res.status(400).json({ message: "Missing user or fly id" });

  try {
    const user = await prisma.user.findUnique({
      where: {
        uuid: user_id,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Invalid user id" });
    }

    const fly = await prisma.fly.findUnique({
      where: {
        uuid: fly_id,
      },
    });

    if (!fly) {
      return res.status(404).json({ message: "Invalid Fly id" });
    }

    const key = generateApiKey();

    await prisma.apiKey.create({
      data: {
        key,
        user_id,
        fly_id,
      },
    });

    return res.status(201).json({ message: "API has been created", key });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { createApiKey };
