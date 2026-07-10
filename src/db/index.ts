import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import * as schema from './schema.ts';
import dns from 'node:dns';

// Force DNS to prefer IPv4 first (fixes IPv6 connection failures in sandboxed containers)
dns.setDefaultResultOrder('ipv4first');

const { Pool } = pkg;

export const createPool = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('CRITICAL ERROR: DATABASE_URL environment variable is missing!');
    console.error('Please configure DATABASE_URL in your environment/Railway/Vercel settings.');
    // Return a pool that will fail queries cleanly without crashing the Express startup process
    return new Pool({
      connectionTimeoutMillis: 1000,
    });
  }

  console.log('Connecting to PostgreSQL using DATABASE_URL...');
  
  // Self-healing check: If the password contains literal brackets like [Akusayangzenita],
  // they can cause authentication failures and parsing issues. We automatically clean them.
  let cleanedUrl = databaseUrl;
  const matches = databaseUrl.match(/postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:/]+)/);
  if (matches) {
    const [, , rawPassword] = matches;
    const decodedPassword = decodeURIComponent(rawPassword);
    if (decodedPassword.startsWith('[') && decodedPassword.endsWith(']')) {
      const cleanPassword = decodedPassword.slice(1, -1);
      console.log('Self-healing: Removed outer brackets from database password.');
      cleanedUrl = databaseUrl.replace(rawPassword, encodeURIComponent(cleanPassword));
    }
  }

  // Safely clean any conflicting sslmode query parameters to ensure Pool's ssl object is respected
  let finalUrl = cleanedUrl;
  try {
    const urlObj = new URL(cleanedUrl);
    urlObj.searchParams.delete('sslmode');
    finalUrl = urlObj.toString();
  } catch (e) {
    console.warn('Warning parsing database URL with URL helper:', e);
  }

  return new Pool({
    connectionString: finalUrl,
    connectionTimeoutMillis: 15000,
    ssl: {
      rejectUnauthorized: false,
    }
  });
};

const pool = createPool();

pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

export const db = drizzle(pool, { schema });
export { schema };

