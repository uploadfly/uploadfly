export function getFileNameWithoutExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf(".");

  if (lastDotIndex <= 0) {
    return filename;
  }

  const filenameWithoutExtension = filename.substring(0, lastDotIndex);

  return filenameWithoutExtension;
}
