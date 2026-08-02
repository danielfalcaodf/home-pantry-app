import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  driver: 'expo',
  schema: './src/infrastructure/db/schema.ts',
  out: './src/infrastructure/db/migrations',
});
