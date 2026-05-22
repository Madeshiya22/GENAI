import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: Number(
        process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 10000,
      ),
    });

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

export default connectDB;
