const isTest = process.env.NODE_ENV === "test";
const databaseUrl = process.env.DATABASE_URL ?? "";
const legacyMongoUri = databaseUrl.startsWith("mongodb://") || databaseUrl.startsWith("mongodb+srv://")
  ? databaseUrl
  : "";

export const ENV = {
  jwtSecret: process.env.JWT_SECRET ?? (isTest ? "test-secret" : ""),
  mongoUri: process.env.MONGODB_URI ?? legacyMongoUri,
  mongoDbName: process.env.MONGODB_DB ?? "",
  databaseUrl,
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

if (!ENV.jwtSecret && !isTest) {
  console.warn("[Env] JWT_SECRET is missing; auth tokens will fail verification.");
}

if (!ENV.databaseUrl && !isTest) {
  console.warn("[Env] DATABASE_URL is missing; database features will be unavailable.");
}
