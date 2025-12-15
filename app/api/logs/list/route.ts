import { NextRequest } from 'next/server';
import fs from 'fs';

export const runtime = 'nodejs';

const LOG_DIR = '/logs';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
//   if (secret !== process.env.LOG_DOWNLOAD_SECRET) {
//     return new Response('Unauthorized', { status: 401 });
//   }

  if (!fs.existsSync(LOG_DIR)) {
    return new Response(JSON.stringify([]), { status: 200 });
  }

  const files = fs.readdirSync(LOG_DIR);
  return new Response(JSON.stringify(files), {
    headers: { 'Content-Type': 'application/json' },
  });
}
