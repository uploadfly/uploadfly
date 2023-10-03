import { PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { s3Client } from "../configs/s3";

export const uploadFileToS3 = (
  buffer: Buffer | ArrayBuffer,
  public_key: string,
  filename: string,
  route?: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const routeOrDefault = route || "";
    const body = buffer instanceof ArrayBuffer ? Buffer.from(buffer) : buffer;
    const params: PutObjectCommandInput = {
      Bucket: "uploadfly",
      Key: `${public_key}${routeOrDefault}/${filename}`,
      Body: body,
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
