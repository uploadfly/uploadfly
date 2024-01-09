import { Response } from "express";
import prisma from "../../../prisma";
import filesize from "file-size";
import { IRequest } from "../../interfaces";
import dayjs from "dayjs";
import parseDataSize from "../../utils/parseDataSize";
import { getFileExtension } from "../../utils/getFilename";
import { uploadFileToS3 } from "../../utils/uploadToS3";
import { sendError, sendResponse } from "../../utils/resolveRequest";
import { generateRandomKey } from "../../utils/generateRandomKey";
import { getFileNameWithoutExtension } from "../../utils/getFileNameWithoutExtension";

const uploadFile = async (req: IRequest, res: Response) => {
  const err = (message: string, status: number) => {
    sendError({
      endpoint: "/upload",
      error: {
        message,
      },
      fly_id: req.apiKey?.fly_id as string,
      method: "post",
      req,
      res,
      status,
    });
  };
  try {
    if (!req.file) {
      return err("No file provided", 400);
    }

    const { apiKey, file } = req;

    if (!apiKey) {
      return err("No API key provided", 400);
    }

    const fly = await prisma.fly.findUnique({
      where: {
        id: apiKey?.fly_id,
      },
    });

    if (fly?.paused) {
      return err(
        "Project is paused, please unpause your subscription to upload.",
        400
      );
    }
    const fileSize = file.size;

    if (fly?.plan === "free" && fileSize > 100000000) {
      return err("File size cannot exceed 100MB", 400);
    }

    if (fly?.plan === "pro" && fileSize > 5000000000) {
      return err("File size cannot exceed 5GB", 400);
    }
    const arrayBuffer = Buffer.from(file.buffer);

    const {
      filename,
      maxFileSize,
      allowedFileTypes,
    }: { filename: string; maxFileSize: string; allowedFileTypes: string } =
      req.body;

    let parsedFileSize;

    if (maxFileSize) {
      parsedFileSize = parseDataSize(maxFileSize);
    }

    if (parsedFileSize?.error) {
      return err("Invalid maxFileSzie value", 400);
    }

    if (fileSize > parsedFileSize?.result!) {
      return err(`File size cannot excceed ${maxFileSize.toUpperCase()}`, 400);
    }

    let allowedFileTypesToArray;

    if (allowedFileTypes) {
      allowedFileTypesToArray = allowedFileTypes.split(",");
    }

    const uppercaseAllowedFileTypes = allowedFileTypesToArray?.map(
      (value: string) => value.toUpperCase().trim()
    );

    if (
      allowedFileTypes &&
      !uppercaseAllowedFileTypes?.includes(
        file.mimetype.split("/")[1].toUpperCase()
      )
    ) {
      return err("Invalid file type", 400);
    }

    if (!fly) {
      return err("Fly not found", 404);
    }

    const flyStorage = Number(fly?.storage);
    const flyUsedStorage = Number(fly?.used_storage);

    if (flyUsedStorage + fileSize > flyStorage) {
      return err("Storage limit exceeded", 403);
    }

    const extension = file.mimetype.split("/")[1];

    const file_name = filename
      ? `${generateRandomKey(6)}-${getFileNameWithoutExtension(
          filename
        )}.${extension}`
      : `${generateRandomKey(32)}-${generateRandomKey(6)}.${extension}`;

    try {
      const filePath = await uploadFileToS3(
        arrayBuffer,
        fly?.public_key as string,
        file_name,
        req.body.route
      );

      const newFile = await prisma.file.create({
        data: {
          name: file_name,
          url: encodeURI(`${process.env.AWS_CLOUDFRONT_URL}/${filePath}`),
          path: filePath as string,
          uploaded_via: "REST API",
          parent_folder_id: "",
          type: file.mimetype,
          size: fileSize,
          fly_id: apiKey?.fly_id as string,
          date: dayjs().format("YYYY-MM-DD"),
        },
      });
      sendResponse({
        res,
        req,
        data: {
          url: newFile?.url,
          path: newFile?.path,
          type: newFile?.type,
          size: filesize(fileSize).human("si"),
          name: newFile?.name,
        },
        status: 201,
        endpoint: "/upload",
        method: "post",
        fly_id: fly.id,
      });
    } catch (error) {
      console.log(error);
      err("File upload failed.", 500);
    }
    await prisma.fly.update({
      where: {
        id: apiKey?.fly_id,
      },
      data: {
        used_storage: flyUsedStorage + fileSize,
      },
    });
  } catch (error) {
    console.log(error);
    err("File upload failed", 500);
  }
};

export { uploadFile };
