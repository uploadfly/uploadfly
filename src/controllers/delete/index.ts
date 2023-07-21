import { Response } from "express";
import { IRequest } from "../../interfaces";
import prisma from "../../../prisma";
import {
  DeleteObjectCommand,
  DeleteObjectCommandInput,
} from "@aws-sdk/client-s3";
import { s3Client } from "../../configs/s3";
import { createInvalidation } from "../../utils/createInvalidation";
import { sendError, sendResponse } from "../../utils/resolveRequest";

const deleteFile = async (req: IRequest, res: Response) => {
  if (req.apiKey?.permission === "upload") {
    return sendError(
      res,
      "The provided API key does not have the required permission to perfrom deletion.",
      403
    );
  }

  const fileUrl = req.body.file_url;

  if (!fileUrl) return sendError(res, "File URL is missing in request", 400);

  const file = await prisma.file.findFirst({
    where: {
      url: fileUrl,
    },
  });

  if (!file) return sendError(res, "File not found", 404);

  const fly = await prisma.fly.findUnique({
    where: {
      uuid: req.apiKey?.fly_id,
    },
  });

  if (file.fly_id !== fly?.uuid)
    return sendError(res, "You are not allowed to delete this file", 403);

  const params: DeleteObjectCommandInput = {
    Bucket: "uploadfly",
    Key: file.path,
  };

  const command = new DeleteObjectCommand(params);

  s3Client.send(command).then(async () => {
    await createInvalidation(`/${file.path}`);
    await prisma.file.delete({
      where: {
        id: file.id,
      },
    });
    sendResponse(res, { message: "File deleted successfully" });
  });
};

export { deleteFile };
