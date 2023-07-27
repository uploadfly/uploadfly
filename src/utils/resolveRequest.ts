import e, { Request, Response } from "express";
import prisma from "../../prisma";
import dayjs from "dayjs";

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
  data: any;
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

  await prisma.log.create({
    data: {
      method,
      endpoint,
      status,
      response_body: data,
      date: dayjs().format("DD-MM-YYYY"),
      request_body: req.body,
      fly_id,
      ip_address: req.socket.remoteAddress?.split(":")[3] || "0.0.0.0",
    },
  });
};

export const sendError = async ({
  res,
  req,
  error,
  status,
  endpoint,
  method,
  fly_id,
}: {
  res: Response;
  req: Request;
  error: { message: string };
  status: number;
  endpoint: string;
  method: "get" | "post" | "delete";
  fly_id: string;
}) => {
  const response: ApiResponse<null> = {
    success: false,
    status,
    error: error.message,
  };

  res.status(status).json(response);

  await prisma.log.create({
    data: {
      method,
      endpoint,
      status,
      response_body: error,
      date: dayjs().format("DD-MM-YYYY"),
      request_body: req.body,
      fly_id,
      ip_address: req.socket.remoteAddress?.split(":")[3] || "0.0.0.0",
    },
  });
};
