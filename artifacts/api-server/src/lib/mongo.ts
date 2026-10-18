import mongoose from "mongoose";

let connection: Promise<typeof mongoose> | undefined;

export async function connectMongo(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is required to use subscription storage");
  }

  if (!connection) {
    connection = mongoose.connect(uri).catch((error: unknown) => {
      connection = undefined;
      throw error;
    });
  }

  await connection;
}
