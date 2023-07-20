import { Request, Response } from "express";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
};

export const sendResponse = <T>(
  res: Response,
  data: T,
  status: number = 200
) => {
  const response: ApiResponse<T> = {
    success: true,
    status,
    data,
  };

  res.status(status).json(response);
};

export const sendError = (res: Response, message: string, status: number) => {
  const response: ApiResponse<null> = {
    success: false,
    status,
    error: message,
  };

  res.status(status).json(response);
};
