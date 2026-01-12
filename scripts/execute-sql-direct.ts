import { readFileSync } from 'fs';
import { join } from 'path';
import pg from 'pg';
const { Client } = pg;

// Load env vars manually
const envPaths = ['.env.local', '.env'];
for (const envPath of envPaths) {
    try {
        const envFile = readFileSync(join(process.cwd(), envPath), 'utf8');
        console.log(`Loading env from ${envPath}...`);
        envFile.split('\n').forEach(line => {
            if (line.trim() && !line.trim().startsWith('#')) {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const [, key, value] = match;
                    const trimmedKey = key.trim();
                    console.log(`Found key: ${trimmedKey}`);
                    process.env[trimmedKey] = value.trim().replace(/^["']|["']$/g, '');
                }
            }
        });
    } catch (e) { console.log(`Could not load ${envPath}`); }
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL missing in .env or .env.local');
    process.exit(1);
}

async function main() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('❌ Provide a file path argument.');
        process.exit(1);
    }

    console.log(`🚀 Executing SQL via PG: ${filePath}`);
    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Supabase requires SSL
    });

    try {
        await client.connect();
        const sql = readFileSync(join(process.cwd(), filePath), 'utf-8');

        // Split by semicolon? No, pg allows multiple statements in one query usually?
        // Actually pg 'query' method might only execute the first one if we are not careful, but usually it supports multiple.
        // Let's just try executing the whole block.

        const res = await client.query(sql);

        // res might be an array if multiple queries
        if (Array.isArray(res)) {
            res.forEach((r, i) => {
                console.log(`Query ${i + 1}: ${r.command} - ${r.rowCount} rows`);
                if (r.rows && r.rows.length > 0) console.log(JSON.stringify(r.rows, null, 2));
            });
        } else {
            console.log(`Query: ${res.command} - ${res.rowCount} rows`);
            if (res.rows && res.rows.length > 0) console.log(JSON.stringify(res.rows, null, 2));
        }

        console.log('✅ SQL executed successfully.');
    } catch (e: any) {
        console.error('❌ Error executing SQL:', e.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
