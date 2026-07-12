import mongoose from "mongoose";
import { ENV } from "../utils/env.js";
const connectDb = async () => {
  try {

    await mongoose.connect(ENV.MONGO_URL, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    setTimeout(connectDb, 5000);
  }
};


// Events

mongoose.connection.on("connected", () => {
  console.log("MongoDB Connected");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongo error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected");
})


async function shutdown() {
  console.log("Shutting down...");
  await mongoose.connection.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown); // server stop

export default connectDb;
