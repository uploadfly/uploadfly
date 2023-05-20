import uuid from "uuid";

const generateApiKey = () => {
  const uuidv4 = uuid.v4;

  const apiKey = uuidv4();
  return apiKey;
};

export { generateApiKey };
