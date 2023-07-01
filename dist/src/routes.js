"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRouter = void 0;
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const upload_1 = require("./controllers/upload");
const prisma_1 = __importDefault(require("../prisma"));
const file_size_1 = __importDefault(require("file-size"));
const generateRandomKey_1 = require("./utils/generateRandomKey");
const router = express_1.default.Router();
exports.uploadRouter = router;
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
router.post("/", upload.single("file"), async (req, res) => {
    try {
        if (!req.headers.authorization) {
            return res.status(401).json({ message: "Unauthorized request" });
        }
        const token = req.headers.authorization.split(" ")[1];
        console.log(token);
        const apiKeyByPublicKey = await prisma_1.default.apiKey.findUnique({
            where: {
                public_key: token,
            },
        });
        const apiKeyBySecretKey = await prisma_1.default.apiKey.findUnique({
            where: {
                secret_key: token,
            },
        });
        const apiKey = apiKeyByPublicKey || apiKeyBySecretKey;
        if (!apiKey) {
            return res
                .status(401)
                .json({ message: "Unauthorized request. API key is invalid" });
        }
        if (!apiKey.active) {
            return res
                .status(401)
                .json({ message: "Unauthorized request. API key is inactive" });
        }
        if (!req.file) {
            res.status(400).json({
                message: "No file uploaded",
            });
            return;
        }
        const file = req.file;
        const generatedFilename = `${file.originalname
            .replaceAll(".", "")
            .replaceAll(" ", "-")}-${(0, generateRandomKey_1.generateRandomKey)(6)}`;
        const filename = req.body.filename || generatedFilename;
        const filenameRegex = /^[a-zA-Z0-9_.-]+$/;
        if (filename && !filenameRegex.test(filename)) {
            res.status(400).json({
                message: "Filename cannot contain spaces and special characters (excluding dashes and underscores)",
            });
            return;
        }
        const fileSize = file.size;
        if (fileSize > 314572800) {
            res.status(400).send("Max file size is 300MB");
            return;
        }
        const fly = await prisma_1.default.fly.findUnique({
            where: {
                uuid: apiKey.fly_id,
            },
        });
        if (!fly) {
            res.status(404).json({ message: "Fly not found" });
            return;
        }
        const flyStorage = Number(fly?.storage);
        const flyUsedStorage = Number(fly?.used_storage);
        if (flyUsedStorage + fileSize > flyStorage) {
            res.status(403).json({ message: "Storage limit exceeded" });
            return;
        }
        try {
            const filePath = await (0, upload_1.uploadFileToS3)(file, fly?.public_key, `${filename}-${(0, generateRandomKey_1.generateRandomKey)(6)}`, req.body.route);
            const newFile = await prisma_1.default.file.create({
                data: {
                    name: filename,
                    url: `${process.env.AWS_CLOUDFRONT_URL}/${filePath}`,
                    path: filePath,
                    uploaded_via: "REST API",
                    parent_folder_id: "",
                    type: file.mimetype,
                    size: fileSize,
                    fly_id: apiKey.fly_id,
                },
            });
            res.status(200).json({
                url: newFile?.url,
                path: newFile?.path,
                type: newFile?.type,
                size: (0, file_size_1.default)(fileSize).human("si"),
            });
        }
        catch (err) {
            console.error(err);
            res.status(500).send("File upload failed");
        }
        await prisma_1.default.fly.update({
            where: {
                uuid: apiKey.fly_id,
            },
            data: {
                used_storage: flyUsedStorage + fileSize,
            },
        });
    }
    catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});
