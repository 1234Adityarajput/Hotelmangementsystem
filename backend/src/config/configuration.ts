export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  frontendUrl: string;
}

export default (): { app: AppConfig } => ({
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '4000', 10),
    databaseUrl: process.env.DATABASE_URL || '',
    jwtSecret: process.env.JWT_SECRET || 'development_jwt_secret_key_must_be_at_least_32_characters_long_for_security!',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
});
