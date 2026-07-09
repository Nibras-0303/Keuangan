import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import * as schema from './schema.ts';
import dns from 'node:dns';

// Force DNS to prefer IPv4 first (fixes IPv6 connection failures in sandboxed containers)
dns.setDefaultResultOrder('ipv4first');

const { Pool } = pkg;

export const createPool = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    console.log('Connecting to PostgreSQL using DATABASE_URL...');
    
    // Self-healing check: If the password contains literal brackets like [Akusayangzenita],
    // they can cause authentication failures and parsing issues. We automatically clean them.
    let cleanedUrl = databaseUrl;
    const matches = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:/]+)/);
    if (matches) {
      const [, , rawPassword] = matches;
      const decodedPassword = decodeURIComponent(rawPassword);
      if (decodedPassword.startsWith('[') && decodedPassword.endsWith(']')) {
        const cleanPassword = decodedPassword.slice(1, -1);
        console.log('Self-healing: Removed outer brackets from database password.');
        cleanedUrl = databaseUrl.replace(rawPassword, encodeURIComponent(cleanPassword));
      }
    }

    return new Pool({
      connectionString: cleanedUrl,
      connectionTimeoutMillis: 15000,
      ssl: {
        rejectUnauthorized: false,
      }
    });
  }

  if (!databaseUrl && !process.env.SQL_HOST) {
    console.warn('WARNING: No DATABASE_URL or SQL_* environment variables found. PostgreSQL is disabled; falling back to local file database.');
    return new Pool({
      host: 'localhost',
      user: 'placeholder',
      password: 'placeholder',
      database: 'placeholder',
      connectionTimeoutMillis: 1000
    });
  }

  console.log('Connecting to PostgreSQL using SQL_* individual variables (Object Method)...');
  
  if (!process.env.SQL_HOST || !process.env.SQL_USER || !process.env.SQL_PASSWORD || !process.env.SQL_DB_NAME) {
    throw new Error('Missing DATABASE_URL or SQL_* configuration environment variables.');
  }

  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15000,
    ssl: false, // Cloud SQL Auth Proxy doesn't require SSL locally
  });
};

const pool = createPool();

pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

export const db = drizzle(pool, { schema });
export { schema };

