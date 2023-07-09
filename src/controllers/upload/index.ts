import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import { generateRandomKey } from "../../utils/generateRandomKey";

dotenv.config();

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID as string,
    secretAccessKey: AWS_SECRET_ACCESS_KEY as string,
  },
});

const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()!;
};

const uploadFileToS3 = (
  file: Express.Multer.File,
  public_key: string,
  filename: string,
  route?: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const params: PutObjectCommandInput = {
      Bucket: "uploadfly",
      Key: `${public_key}${route || ""}/${
        filename || file.originalname.split(".")[0]
      }-${generateRandomKey(3)}.${getFileExtension(
        file.originalname || "txt"
      )}`,
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

export { uploadFileToS3 };
