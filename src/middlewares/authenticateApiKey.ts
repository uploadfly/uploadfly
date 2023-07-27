import { Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { IRequest } from "../interfaces";
import { sendError } from "../utils/resolveRequest";

const prisma = new PrismaClient();

const authenticateApiKey = async (
  req: IRequest,
  res: Response,
  next: NextFunction,
  endpoint: string
) => {
  const err = (message: string, status: number) => {
    sendError({
      endpoint,
      error: {
        message,
      },
      fly_id: req.apiKey?.fly_id as string,
      method: "delete",
      req,
      res,
      status,
    });
  };
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      err("Unauthorized request. API key is missing.", 401);
      return;
    }

    const key = await prisma.apikey.findUnique({
      where: {
        key: token,
      },
    });

    if (!key) {
      return err("Unauthorized request. API key is invalid.", 401);
    }

    if (!key.active) {
      return err("API key has been deactivated.", 401);
    }

    req.apiKey = key;

    next();
  } catch (error) {
    err("Internal server error.", 500);
  }
};

export { authenticateApiKey };
