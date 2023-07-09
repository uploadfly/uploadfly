import CloudFrontClient from "aws-sdk/clients/cloudfront";
import { awsCredentials } from "./aws";

const cloudFrontClient = new CloudFrontClient(awsCredentials);

export { cloudFrontClient };
