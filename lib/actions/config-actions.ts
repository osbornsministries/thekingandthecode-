// lib/actions/config-actions.ts
'use server';

import { db } from '@/lib/db/db';
import { eq } from 'drizzle-orm';
import * as schema from '@/lib/drizzle/schema';
import { unstable_noStore as noStore } from "next/cache";



export async function getTicketConfiguration() {

    noStore(); 
  try {
    console.log("🔍 Fetching ticket configuration...");
    
    // 1. Fetch Active Prices (Adult, Student, Child)
    const prices = await db.select()
      .from(schema.ticketPrices)
      .where(eq(schema.ticketPrices.isActive, true));
    
    console.log(`✅ Found ${prices.length} active prices`);
    
    // 2. Fetch Payment Methods
    const methods = await db.select()
      .from(schema.paymentMethods)
      .where(eq(schema.paymentMethods.isActive, true));
    
    console.log(`✅ Found ${methods.length} active payment methods`);
    
    // 3. Fetch Active Event Days
    const days = await db.select()
      .from(schema.eventDays)
      // .where(eq(schema.eventDays.isActive, true));
    
    console.log(`✅ Found ${days.length} active event days`);
    
    // 4. Fetch All Sessions
    const sessions = await db.select()
      .from(schema.eventSessions);
    
    console.log(`✅ Found ${sessions.length} event sessions`);
    
    return { 
      success: true, 
      config: { 
        prices, 
        methods, 
        days, 
        sessions 
      } 
    };
    
  } catch (error: any) {
    console.error("❌ Config fetch error:", error);
    
    // More detailed error logging
    if (error.code) {
      console.error("Error code:", error.code);
    }
    if (error.errno) {
      console.error("Error number:", error.errno);
    }
    if (error.sqlMessage) {
      console.error("SQL Message:", error.sqlMessage);
    }
    if (error.sqlState) {
      console.error("SQL State:", error.sqlState);
    }
    
    // Return empty arrays to prevent frontend crash
    return { 
      success: false, 
      error: error.message,
      config: { 
        prices: [], 
        methods: [], 
        days: [], 
        sessions: [] 
      } 
    };
  }
}