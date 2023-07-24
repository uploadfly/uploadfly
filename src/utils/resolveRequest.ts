import { Request, Response } from "express";
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

  const log = {
    data: {
      method,
      endpoint,
      status,
      response_body: data,
      date: dayjs().format("DD-MM-YYYY"),
      request_body: req.body,
      fly_id,
    },
  };

  await prisma.log.create(log);
};

export const sendError = (res: Response, message: string, status: number) => {
  const response: ApiResponse<null> = {
    success: false,
    status,
    error: message,
  };

  res.status(status).json(response);
};
