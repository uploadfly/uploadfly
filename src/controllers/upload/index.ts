import AWS from "aws-sdk";
import dotenv from "dotenv";
dotenv.config();

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;

AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});

const s3 = new AWS.S3();

const uploadFileToS3 = (file: any) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: "uploadfly",
      Key: file.originalname,
      Body: file.buffer,
    };

    s3.upload(params, (err: any, data: { Location: unknown }) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        console.log("File uploaded to S3:", data.Location);
        resolve(data.Location);
      }
    });
  });
};

export { uploadFileToS3 };
