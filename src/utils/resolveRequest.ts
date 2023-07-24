import { Request, Response } from "express";
import prisma from "../../prisma";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
};

export const sendResponse = async <T>({
  res,
  req,
  data,
  status,
  endpoint,
  method,
  fly_id,
}: {
  res: Response;
  req: Request;
  data: T;
  status: number;
  endpoint: string;
  method: "get" | "post" | "delete";
  fly_id: string;
}) => {
  const response: ApiResponse<T> = {
    success: true,
    status,
    data,
  };

  res.status(status).json(response);

  const log = {
    method,
    endpoint,
    status,
    response_body: response,
    request_body: req.body,
  };

  await prisma.log.create({
    data: {
      method,
      endpoint,
      status,
      response_body: response,
      request_body: req.body,
      fly_id,
    },
  });
};

export const sendError = (res: Response, message: string, status: number) => {
  const response: ApiResponse<null> = {
    success: false,
    status,
    error: message,
  };

  res.status(status).json(response);
};
