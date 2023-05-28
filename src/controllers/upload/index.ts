import AWS from "aws-sdk";

AWS.config.update({
  accessKeyId: "YOUR_AWS_ACCESS_KEY",
  secretAccessKey: "YOUR_AWS_SECRET_ACCESS_KEY",
  region: "YOUR_AWS_REGION",
});

const s3 = new AWS.S3();

const uploadFileToS3 = (file: any) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: "YOUR_S3_BUCKET_NAME",
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
