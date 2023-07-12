import { Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { IRequest } from "../interfaces";

const prisma = new PrismaClient();

const authenticateApiKey = async (
  req: IRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Unauthorized request" });
    }

    const token = req.headers.authorization.split(" ")[1];

    const apiKeyByPublicKey = await prisma.apiKey.findUnique({
      where: {
        public_key: token,
      },
    });

    const apiKeyBySecretKey = await prisma.apiKey.findUnique({
      where: {
        secret_key: token,
      },
    });

    const apiKey = apiKeyByPublicKey || apiKeyBySecretKey;

    if (!apiKey || !apiKey.active) {
      return res
        .status(401)
        .json({ message: "Unauthorized request. API key is invalid" });
    }
    req.apiKey = {
      ...apiKey,
      key_type: apiKeyByPublicKey ? "public" : "secret",
    };
    next();
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
};

export { authenticateApiKey };
