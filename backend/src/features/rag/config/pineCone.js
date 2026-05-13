    import { Pinecone }
    from "@pinecone-database/pinecone";

    import config
    from "../../../config/config.js";


    const pinecone =
    new Pinecone({

        apiKey:
        config.PINECONE_API_KEY,
    });


    export const pineconeIndex =
    pinecone.Index(
        config.PINECONE_INDEX_NAME,
    );