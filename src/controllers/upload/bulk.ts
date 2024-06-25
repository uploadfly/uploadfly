import { Response } from "express";
import prisma from "../../../prisma";
import filesize from "file-size";
import { IRequest } from "../../interfaces";
import dayjs from "dayjs";
import parseDataSize from "../../utils/parseDataSize";
import { uploadBulkToS3 } from "../../utils/uploadBulkToS3";
import { sendError, sendResponse } from "../../utils/resolveRequest";
import { generateRandomKey } from "../../utils/generateRandomKey";
import { getFileNameWithoutExtension } from "../../utils/getFileNameWithoutExtension";

const uploadBulkFiles = async (req: IRequest, res: Response) => {
  const err = (message: string, status: number) => {
    sendError({
      endpoint: "/upload/bulk",
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
    if (!req.files || !Array.isArray(req.files)) {
      return err("No files provided", 400);
    }

    const { apiKey, files } = req;

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

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    if (fly?.plan === "free" && totalSize > 100000000) {
      return err("Total file size cannot exceed 100MB", 400);
    }

    if (fly?.plan === "pro" && totalSize > 5000000000) {
      return err("Total file size cannot exceed 5GB", 400);
    }

    const fileDetails = files.map((file) => ({
      buffer: Buffer.from(file.buffer),
      filename: `${generateRandomKey(32)}-${generateRandomKey(6)}.${file.mimetype.split("/")[1]}`,
    }));

    const filePaths = await uploadBulkToS3(
      fileDetails,
      fly?.public_key as string,
      req.body.route
    );

    const fileRecords = await Promise.all(
      filePaths.map((filePath, index) => {
        const file = files[index];
        return prisma.file.create({
          data: {
            name: fileDetails[index].filename,
            url: encodeURI(`${process.env.AWS_CLOUDFRONT_URL}/${filePath}`),
            path: filePath,
            uploaded_via: "REST API",
            parent_folder_id: "",
            type: file.mimetype,
            size: file.size,
            fly_id: apiKey?.fly_id as string,
            date: dayjs().format("YYYY-MM-DD"),
          },
        });
      })
    );

    await prisma.fly.update({
      where: { id: apiKey?.fly_id },
      data: { used_storage: Number(fly?.used_storage) + totalSize },
    });

    sendResponse({
      res,
      req,
      data: fileRecords.map((record) => ({
        url: record.url,
        path: record.path,
        type: record.type,
        size: record.size,
        name: record.name,
      })),
      status: 201,
      endpoint: "/upload/bulk",
      method: "post",
      fly_id: fly?.id!,
    });
  } catch (error) {
    console.error(error);
    err("File upload failed", 500);
  }
};

export { uploadBulkFiles };
