import AWS from "aws-sdk";
import dotenv from "dotenv";
import { generateRandomKey } from "../../utils/generateRandomKey";
dotenv.config();

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;

AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});

const s3 = new AWS.S3();

const getFileExtension = (filename: string) => {
  return filename.split(".").pop();
};

const uploadFileToS3 = (
  file: any,
  public_key: string,
  filename: string,
  route?: string
) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: "uploadfly",
      Key: `${public_key}${route || ""}/${
        filename || file.originalname.split(".")[0]
      }-${generateRandomKey(3)}.${getFileExtension(
        file.originalname || "txt"
      )}`,
      Body: file.buffer,
    };

    s3.upload(params, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(`${params.Key}`);
      }
    });
  });
};

export { uploadFileToS3 };
