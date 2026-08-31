import mongoose from "mongoose";

export const connectDB = async () => {
    const primaryURI = process.env.NODE_ENV === "production" 
        ? process.env.MONGO_URI_PROD 
        : (process.env.MONGO_URI_DEV || process.env.MONGO_URI_PROD || "mongodb://127.0.0.1:27017/SynDesk");

    if (!primaryURI) {
        console.error("MongoDB URI is not defined in environment variables.");
        process.exit(1);
    }

    try {
        await mongoose.connect(primaryURI, { serverSelectionTimeoutMS: 5000 });
        console.log("MongoDB connected successfully");
        console.log(`MongoDB URI: ${primaryURI}`);
    } catch (error) {
        console.error(`Primary DB Connection Error: ${error}`);

        // If local DEV connection timed out/failed, attempt fallback to MONGO_URI_PROD
        if (process.env.NODE_ENV !== "production" && process.env.MONGO_URI_PROD && primaryURI !== process.env.MONGO_URI_PROD) {
            try {
                console.log("Attempting fallback connection to MONGO_URI_PROD...");
                await mongoose.connect(process.env.MONGO_URI_PROD);
                console.log("MongoDB connected successfully (fallback)");
                return;
            } catch (fallbackErr) {
                console.error(`Fallback DB Connection Error: ${fallbackErr}`);
            }
        }

        process.exit(1);
    }
}