import { Response } from "express";
import { IRequest } from "../interfaces";
import prisma from "../../prisma";

const deleteFile = async (req: IRequest, res: Response) => {
  const filename = req.body.filename;

  if (!filename)
    return res.status(400).json({ message: "Filename is missing in request" });

  const file = await prisma.file.findFirst({
    where: {
      name: filename,
    },
  });

  if (!file) return res.status(404).json({ message: "File not found" });

  //   const fly = await prisma.fly.findUnique({
  //     where: {
  //       uuid: req.apiKey?.fly_id,
  //     },
  //   });

  res.status(200).json({ message: "File deleted", file });
};
export { deleteFile };
