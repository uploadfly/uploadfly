import { PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { s3Client } from "../configs/s3";

export const uploadBulkToS3 = async (
  files: { buffer: Buffer | ArrayBuffer; filename: string }[],
  public_key: string,
  route?: string
): Promise<string[]> => {
  const uploadPromises = files.map((file) => {
    const routeOrDefault = route || "";
    const body =
      file.buffer instanceof ArrayBuffer
        ? Buffer.from(file.buffer)
        : file.buffer;
    const params: PutObjectCommandInput = {
      Bucket: "uploadfly",
      Key: `${public_key}${routeOrDefault}/${file.filename}`,
      Body: body,
    };

    const command = new PutObjectCommand(params);

    return s3Client.send(command).then(() => `${params.Key}`);
  });

  return Promise.all(uploadPromises);
};
