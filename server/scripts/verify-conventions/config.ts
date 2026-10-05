import { resolve } from 'node:path';

export const SERVER_ROOT = resolve(__dirname, '../..');
export const SRC_ROOT = resolve(SERVER_ROOT, 'src');

export const BOUNDED_CONTEXTS = new Set([
  'auth',
  'candidate-profile',
  'health',
  'interview-assessment',
  'interview-live',
  'interview-prep',
  'media',
  'onet',
  'sfia',
  'user',
]);

// 3 file bootstrap môi trường được phép ném raw Error để crash process
export const RAW_ERROR_WHITELIST = new Set([
  'core/runtime/runtime-role.ts',
  'infrastructure/database/prisma/prisma.service.ts',
  'infrastructure/database/prisma/db-timezone.ts',
]);

// Các file được phép dùng console.*
export const CONSOLE_LOG_WHITELIST = new Set([
  'core/common/services/app-logger.service.ts',
  'infrastructure/database/prisma/db-timezone.ts',
  'core/common/swagger/swagger.ts',
]);

// Các file bootstrap/hạ tầng cấp thấp được phép truy cập trực tiếp process.env
export const PROCESS_ENV_WHITELIST = new Set([
  'main.ts',
  'core/runtime/runtime-role.ts',
  'infrastructure/database/prisma/prisma.service.ts',
  'infrastructure/database/prisma/db-timezone.ts',
  'core/common/services/app-logger.service.ts',
  'core/common/swagger/swagger.ts',
  'core/common/exceptions/interview-ai-exception.filter.ts',
]);
