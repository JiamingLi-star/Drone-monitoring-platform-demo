import morgan from 'morgan';
import { RequestHandler } from 'express';
import { env } from '../config/env';

type LogLevel = 'combined' | 'common' | 'dev' | 'short' | 'tiny';

const levelMap: Record<string, LogLevel> = {
  error: 'short',
  warn: 'common',
  info: 'dev',
  verbose: 'tiny',
  debug: 'tiny',
};

const resolveFormat = (): LogLevel => levelMap[env.logLevel] || 'dev';

export const requestLogger = (): RequestHandler => morgan(resolveFormat());
