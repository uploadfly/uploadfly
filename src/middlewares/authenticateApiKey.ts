import { Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { IRequest } from "../interfaces";
import { sendError } from "../utils/resolveRequest";

const prisma = new PrismaClient();

const authenticateApiKey = async (
  req: IRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.headers.authorization) {
      return sendError(res, "Unauthorized request. API key is missing.", 401);
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
      return sendError(res, "Unauthorized request. API key is invalid.", 401);
    }
    req.apiKey = {
      ...apiKey,
      key_type: apiKeyByPublicKey ? "public" : "secret",
    };
    next();
  } catch (error) {
    sendError(res, "Internal server error.", 500);
  }
};

export { authenticateApiKey };
