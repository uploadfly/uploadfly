import { Response } from "express";
import { IRequest } from "../../interfaces";
import prisma from "../../../prisma";
import {
  DeleteObjectCommand,
  DeleteObjectCommandInput,
} from "@aws-sdk/client-s3";
import { s3Client } from "../../configs/s3";
import { createInvalidation } from "../../utils/createInvalidation";

const deleteFile = async (req: IRequest, res: Response) => {
  const fileUrl = req.body.file_url;

  if (!fileUrl)
    return res.status(400).json({ message: "File URL is missing in request" });

  const file = await prisma.file.findFirst({
    where: {
      url: fileUrl,
    },
  });

  if (!file) return res.status(404).json({ message: "File not found" });

  const fly = await prisma.fly.findUnique({
    where: {
      uuid: req.apiKey?.fly_id,
    },
  });

  if (file.fly_id !== fly?.uuid)
    return res
      .status(403)
      .json({ message: "You are not allowed to delete this file" });

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
    res.status(200).json({ message: "File deleted successfully" });
  });
};

export { deleteFile };
