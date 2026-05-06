import dotenv from 'dotenv';

dotenv.config();

if(!process.env.MISTRAL_API_KEY) {
  throw new Error('Error: MISTRAL_API_KEY is not set in the environment variables.');
  process.exit(1);
}

export default {
    PORT: process.env.PORT || 3000,
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY ,
};