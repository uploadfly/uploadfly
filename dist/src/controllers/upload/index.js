"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileToS3 = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const dotenv_1 = __importDefault(require("dotenv"));
const generateRandomKey_1 = require("../../utils/generateRandomKey");
dotenv_1.default.config();
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;
aws_sdk_1.default.config.update({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    region: AWS_REGION,
});
const s3 = new aws_sdk_1.default.S3();
const getFileExtension = (filename) => {
    return filename.split(".").pop();
};
const uploadFileToS3 = (file, public_key, filename, route) => {
    return new Promise((resolve, reject) => {
        const params = {
            Bucket: "uploadfly",
            Key: `${public_key}${route || ""}/${filename || file.originalname.split(".")[0]}-${(0, generateRandomKey_1.generateRandomKey)(3)}.${getFileExtension(file.originalname || "txt")}`,
            Body: file.buffer,
        };
        s3.upload(params, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(`${params.Key}`);
            }
        });
    });
};
exports.uploadFileToS3 = uploadFileToS3;
