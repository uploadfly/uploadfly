const parseDataSize = (sizeStr: string): { result: number; error: boolean } => {
  sizeStr = sizeStr.trim().toUpperCase();

  const suffixes: { [key: string]: number } = {
    KB: Math.pow(1024, 1),
    MB: Math.pow(1024, 2),
    // GB: Math.pow(1024, 3),
    // TB: Math.pow(1024, 4),
    // PB: Math.pow(1024, 5),
    // EB: Math.pow(1024, 6),
    // ZB: Math.pow(1024, 7),
    // YB: Math.pow(1024, 8),
  };

  const suffix = sizeStr.slice(-2);
  const sizeInBytes = parseInt(sizeStr.slice(0, -2), 10);

  if (isNaN(sizeInBytes) || !suffixes.hasOwnProperty(suffix)) {
    return {
      error: true,
      result: 0,
    };
  }

  return { result: sizeInBytes * suffixes[suffix], error: false };
};

export default parseDataSize;
