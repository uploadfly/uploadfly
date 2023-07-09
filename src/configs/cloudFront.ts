import { CloudFrontClient } from "@aws-sdk/client-cloudfront";
import { awsCredentials } from "./aws";

const cloudFrontClient = new CloudFrontClient(awsCredentials);

export { cloudFrontClient };
