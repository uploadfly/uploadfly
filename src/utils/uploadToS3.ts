import { PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { s3Client } from "../configs/s3";
import { getFileExtension } from "./getFilename";

export const uploadFileToS3 = (
  file: Express.Multer.File,
  public_key: string,
  filename: string,
  route?: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileExtension = getFileExtension(file.originalname || "txt");
    const routeOrDefault = route || "";
    const params: PutObjectCommandInput = {
      Bucket: "uploadfly",
      Key:
        `${public_key}${routeOrDefault}/${filename}.${fileExtension}` ||
        `${public_key}/${routeOrDefault}/${file.originalname}`,
      Body: file.buffer,
    };

    const command = new PutObjectCommand(params);

    s3Client
      .send(command)
      .then(() => {
        resolve(`${params.Key}`);
      })
      .catch((err: any) => {
        reject(err);
      });
  });
};
