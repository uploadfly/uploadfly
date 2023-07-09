import { Response } from "express";
import { IRequest } from "../interfaces";
import prisma from "../../prisma";

const deleteFile = async (req: IRequest, res: Response) => {
  const fileUrl = req.body.file_url;

  if (!fileUrl)
    return res.status(400).json({ message: "File URL is missing in request" });

  const file = await prisma.file.findFirst({
    where: {
      url: fileUrl,
    },
  });

  if (!file) return res.status(404).json({ message: "File not found" });

  //   const fly = await prisma.fly.findUnique({
  //     where: {
  //       uuid: req.apiKey?.fly_id,
  //     },
  //   });

  const fileWithSizeAsNumber = {
    ...file,
    size: Number(file.size),
  };

  res.status(200).json({ message: "File deleted", file: fileWithSizeAsNumber });
};
export { deleteFile };
