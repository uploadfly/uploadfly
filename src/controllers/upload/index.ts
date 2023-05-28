import { Request, Response } from "express";
import prisma from "../../../prisma";

const upload = async (req: Request, res: Response) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ message: "Unauthorized request" });
  }
  const token = req.headers.authorization.split(" ")[1];

  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: {
        key: token,
      },
    });
    if (!apiKey) {
      return res
        .status(401)
        .json({ message: "Unauthorized request. API key is invalid" });
    }

    if (!apiKey.active) {
      return res
        .status(401)
        .json({ message: "Unauthorized request. API key is inactive" });
    }
    res.send("Hey babes");
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { upload };
