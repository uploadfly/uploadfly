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

    const key = await prisma.apikey.findUnique({
      where: {
        key: token,
      },
    });

    if (!key) {
      return sendError(res, "Unauthorized request. API key is invalid.", 401);
    }

    if (!key.active) {
      return sendError(res, "API key has been deactivated.", 401);
    }

    req.apiKey = key;

    next();
  } catch (error) {
    sendError(res, "Internal server error.", 500);
  }
};

export { authenticateApiKey };
