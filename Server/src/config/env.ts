import dotenv from 'dotenv';
dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforsyndesk2026';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'superrefreshsecretforsyndesk2026';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
