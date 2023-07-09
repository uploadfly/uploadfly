import { CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";
import { cloudFrontClient } from "../configs/cloudFront";
import dotenv from "dotenv";

dotenv.config();

const createInvalidation = async (path: string) => {
  const params = {
    DistributionId: process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID,
    InvalidationBatch: {
      Paths: {
        Quantity: 1,
        Items: [path],
      },
      CallerReference: `${Date.now()}`,
    },
  };

  const command = new CreateInvalidationCommand(params);

  try {
    await cloudFrontClient.send(command);
    console.log("CloudFront invalidation created successfully");
  } catch (err) {
    console.error("Failed to create CloudFront invalidation", err);
  }
};

export { createInvalidation };
