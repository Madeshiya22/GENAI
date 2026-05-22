import { MistralAIEmbeddings } from "@langchain/mistralai";

import config from "../../../config/config.js";

const embeddings = new MistralAIEmbeddings({
  apiKey: config.MISTRAL_API_KEY,

  model: "mistral-embed",

  batchSize: Number(process.env.MISTRAL_EMBEDDING_BATCH_SIZE || 8),
});

export default embeddings;
