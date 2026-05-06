import dotenv from 'dotenv';

dotenv.config({ override: true });

if(!process.env.MISTRAL_API_KEY){
    console.error("Error: MISTRAL_API_KEY is not set in the environment variables.");
    process.exit(1);
}

if(!process.env.JWT_SECRET) {
    console.error("Error: JWT_SECRET is not set in the environment variables.");
    process.exit(1);
}

if(!process.env.MONGODB_URI) {
    console.error("Error: MONGODB_URI is not set in the environment variables.");
    process.exit(1);
}

if(!process.env.GOOGLE_CLIENT_ID) {
    console.error("Error: GOOGLE_CLIENT_ID is not set in the environment variables.");
    process.exit(1);
}

if(!process.env.GOOGLE_CLIENT_SECRET) {
    console.error("Error: GOOGLE_CLIENT_SECRET is not set in the environment variables.");
    process.exit(1);
}

if(!process.env.GOOGLE_REDIRECT_URI) {
    console.error("Error: GOOGLE_REDIRECT_URI is not set in the environment variables.");
    process.exit(1);
}

 const config = {
    port: process.env.PORT || 5000,
     CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    MONGODB_URI: process.env.MONGODB_URI,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI
};

export default Object.freeze(config);