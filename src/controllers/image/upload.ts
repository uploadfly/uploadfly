import { Response } from "express";
import { IRequest } from "../../interfaces";
import { sendError, sendResponse } from "../../utils/resolveRequest";
import { uploadFileToS3 } from "../../utils/uploadToS3";
import prisma from "../../../prisma";
import { generateRandomKey } from "../../utils/generateRandomKey";
import { getFileNameWithoutExtension } from "../../utils/getFileNameWithoutExtension";
import sharp from "sharp";
import dayjs from "dayjs";
import filesize from "file-size";

export const uploadImage = async (req: IRequest, res: Response) => {
  const err = (message: string, status: number) => {
    sendError({
      endpoint: "/image/upload",
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

    const arrayBuffer = Buffer.from(file.buffer);
    const {
      filename,
      maxFileSize,
      width,
      height,
    }: {
      filename: string;
      maxFileSize: string;
      allowedFileTypes: string;
      width: number;
      height: number;
    } = req.body;

    let sharpInstance = sharp(arrayBuffer);

    if (width !== undefined) {
      sharpInstance = sharpInstance.resize({
        width: Number(width),
        height: height !== undefined ? Number(height) : undefined,
        fit: height !== undefined ? "fill" : "inside",
      });
    }

    const resizedBuffer = await sharpInstance.toBuffer();

    const fly = await prisma.fly.findUnique({
      where: {
        id: apiKey?.fly_id,
      },
    });

    if (!fly) {
      return err("Fly not found", 404);
    }

    const extension = file.mimetype.split("/")[1];

    const file_name = filename
      ? `${generateRandomKey(6)}-${getFileNameWithoutExtension(
          filename
        )}.${extension}`
      : `${generateRandomKey(32)}-${generateRandomKey(6)}.${extension}`;

    const fileSize = Buffer.byteLength(resizedBuffer);

    const filePath = await uploadFileToS3(
      width || height ? resizedBuffer : arrayBuffer,
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
    err("File upload failed", 500);
  }
};
