export const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()!;
};
