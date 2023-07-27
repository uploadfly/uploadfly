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
import { sendError, sendResponse } from "../../utils/resolveRequest";

const deleteFolder = async (req: IRequest, res: Response) => {
  const err = (message: string, status: number) => {
    sendError({
      endpoint: "/delete/all",
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
    if (req.apiKey?.permission === "upload") {
      return err(
        "You cannot perform a delete action with an 'upload access' API key.",
        403
      );
    }

    const fly_id = req.query.fly_id as string;

    if (!fly_id) {
      return err("Fly ID is missing in request.", 400);
    }

    const fly = await prisma.fly.findUnique({
      where: {
        uuid: fly_id,
      },
    });

    if (!fly) {
      return err("Fly not found.", 404);
    }

    if (fly.user_id !== req.apiKey?.user_id) {
      return err("Unauthorized to delete this fly.", 401);
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
      await prisma.file.deleteMany({
        where: {
          fly_id: fly.uuid,
        },
      });
    };

    deleteFolder(fly.public_key)
      .then(() => {
        sendResponse({
          res,
          req,
          data: {
            message: "All files deleted successfully",
          },
          status: 200,
          endpoint: "/delete/all",
          method: "delete",
          fly_id: fly.uuid,
        });
      })
      .catch((err) => {
        console.log("Something went wrong");

        res.status(500).json({
          message: "Something went wrong",
          error: err,
        });
        return;
      });
  } catch (error) {
    console.log(error);
  }
};

export { deleteFolder };
