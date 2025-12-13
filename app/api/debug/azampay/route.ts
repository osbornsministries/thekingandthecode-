// app/api/debug/azampay/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const debugInfo = {
    appName: process.env.AZAMPAY_APP_NAME,
    clientId: process.env.AZAMPAY_CLIENT_ID,
    clientSecretLength: process.env.AZAMPAY_CLIENT_SECRET?.length,
    // Show first/last few chars of client ID for verification
    clientIdCheck: process.env.AZAMPAY_CLIENT_ID 
      ? `${process.env.AZAMPAY_CLIENT_ID.substring(0, 8)}...${process.env.AZAMPAY_CLIENT_ID.substring(process.env.AZAMPAY_CLIENT_ID.length - 8)}`
      : 'MISSING',
    // Check if secret matches Laravel format
    secretFormat: process.env.AZAMPAY_CLIENT_SECRET?.includes('+') ? 'Contains + signs (Laravel format)' : 'No + signs',
    // Count sections in secret (Laravel secrets have many sections)
    secretSections: process.env.AZAMPAY_CLIENT_SECRET?.split('.').length,
  };

  return NextResponse.json(debugInfo);
}