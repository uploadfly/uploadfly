import { S3Client } from "@aws-sdk/client-s3";
import { awsCredentials } from "./aws";

const s3Client = new S3Client(awsCredentials);

export { s3Client };
