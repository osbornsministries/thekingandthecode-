import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
export const runtime = 'nodejs';

const LOG_DIR = '/logs'; // base logs folder

export async function GET(req: NextRequest, { params }: { params: { file: string } }) {
  const secret = req.nextUrl.searchParams.get('secret');
//   if (secret !== process.env.LOG_DOWNLOAD_SECRET) {
//     return new Response('Unauthorized', { status: 401 });
//   }

  const file = params.file;

  const filePath = path.join(LOG_DIR, file);

  if (!fs.existsSync(filePath)) {
    return new Response('File not found', { status: 404 });
  }

  // If it’s a folder, zip it first
  let stat = fs.statSync(filePath);
  let downloadPath = filePath;

  if (stat.isDirectory()) {
    const zipPath = `/logs/${file}.zip`;
    const { execSync } = await import('child_process');
    execSync(`zip -r ${zipPath} ${filePath}`);
    downloadPath = zipPath;
  }

  const buffer = fs.readFileSync(downloadPath);

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${file}.zip"`,
    },
  });
}
