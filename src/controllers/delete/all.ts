import {
  DeleteObjectCommand,
  DeleteObjectCommandInput,
} from "@aws-sdk/client-s3";
import { IRequest } from "../../interfaces";
import { Response } from "express";
import prisma from "../../../prisma";

const deleteFolder = async (req: IRequest, res: Response) => {
  const folder_id = req.query.folder_id as string;

  if (!folder_id) {
    res.status(400).json({
      message: "Folder ID is missing in request",
    });
    return;
  }

  const fly = await prisma.fly.findFirst({
    where: {
      public_key: folder_id,
    },
  });

  if (!fly) {
    res.status(400).json({
      message: "Invalid folder ID",
    });
    return;
  }

  if (fly.user_id !== req.apiKey?.user_id) {
    res.status(401).json({
      message: "Unauthorized",
    });
    return;
  }
};
