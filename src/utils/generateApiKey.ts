import { v4 as uuidv4 } from "uuid";

const generateApiKey = () => {
  const apiKey = uuidv4();

  return apiKey;
};

export { generateApiKey };
