import mongoose from "mongoose";

export const connectDB = async () =>{
try {
    const URI = process.env.NODE_ENV === "production" ? process.env.MONGO_URI_PROD : process.env.MONGO_URI_DEV;
    if (!URI) {
        throw new Error("MongoDB URI is not defined in environment variables.");
    }  
    await mongoose.connect(URI);
    console.log("MongoDB connected successfully");
    console.log(`MongoDB URI: ${URI}`);
}
catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);    

}
}