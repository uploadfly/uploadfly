import {
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  DeleteObjectsCommand,
  DeleteObjectsCommandInput,
  ListObjectsCommand,
  ListObjectsCommandInput,
} from "@aws-sdk/client-s3";
import { IRequest } from "../../interfaces";
import { Response } from "express";
import prisma from "../../../prisma";
import { s3Client } from "../../configs/s3";
import { createInvalidation } from "../../utils/createInvalidation";

const deleteFolder = async (req: IRequest, res: Response) => {
  if (req.apiKey?.key_type === "public") {
    res.status(403).json({
      message: "Delete action forbidden via a public key",
    });
    return;
  }

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

  const deleteObjectsInFolder = async (folderPath: string) => {
    const listParams: ListObjectsCommandInput = {
      Bucket: "uploadfly",
      Prefix: folderPath,
    };

    const listCommand = new ListObjectsCommand(listParams);
    const { Contents } = await s3Client.send(listCommand);

    if (Contents && Contents.length > 0) {
      const deleteParams: DeleteObjectsCommandInput = {
        Bucket: "uploadfly",
        Delete: {
          Objects: Contents.map(({ Key }) => ({ Key })),
          Quiet: false,
        },
      };

      const deleteCommand = new DeleteObjectsCommand(deleteParams);
      await s3Client.send(deleteCommand);
    }
  };

  const deleteFolder = async (folderPath: string) => {
    await deleteObjectsInFolder(folderPath);

    const deleteParams: DeleteObjectCommandInput = {
      Bucket: "uploadfly",
      Key: `${folderPath}/`,
    };

    const deleteCommand = new DeleteObjectCommand(deleteParams);
    await s3Client.send(deleteCommand);

    await createInvalidation(`/${folderPath}/*`);
  };

  deleteFolder(folder_id)
    .then(() => {
      res.status(200).json({
        message: "Folder deleted",
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: "Something went wrong",
        error: err,
      });
      return;
    });
};

export { deleteFolder };
