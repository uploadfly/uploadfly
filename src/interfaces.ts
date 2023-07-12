import type { Request } from "express";

export interface IRequest extends Request {
  apiKey?: { fly_id: string; active: boolean; user_id: string };
}
