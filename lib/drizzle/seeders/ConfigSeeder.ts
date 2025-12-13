// lib/actions/seed-actions.ts
'use server';

import { db } from '@/lib/db/db';
import * as schema from '@/lib/drizzle/schema';

export async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // 1. Seed Event Days
    console.log('📅 Seeding event days...');
    await db.insert(schema.eventDays).values([
      { 
        id: 1,
        name: 'Day 1', 
        date: '2025-12-19', 
        isActive: true 
      },
      { 
        id: 2,
        name: 'Day 2', 
        date: '2025-12-20', 
        isActive: true 
      },
      { 
        id: 3,
        name: 'Day 3', 
        date: '2025-12-21', 
        isActive: true 
      },
    ]).onDuplicateKeyUpdate({
      set: { name: schema.eventDays.name }
    });

    // 2. Seed Event Sessions - Each day should have its own sessions
    console.log('⏰ Seeding event sessions...');
    await db.insert(schema.eventSessions).values([
      { 
        id: 1,
        dayId: 1, 
        name: 'Afternoon Show', 
        startTime: '14:30:00', 
        endTime: '16:00:00' 
      },
      { 
        id: 2,
        dayId: 1, 
        name: 'Evening Show', 
        startTime: '17:30:00', 
        endTime: '19:00:00' 
      }
      ,
      { 
        id: 3,
        dayId: 1, 
        name: 'Night Show', 
        startTime: '20:00:00', 
        endTime: '21:30:00' 
      },
      
      
      // Day 2 Sessions
      { 
        id: 4,
        dayId: 2, 
        name: 'Afternoon Show', 
        startTime: '13:00:00', 
        endTime: '14:30:00' 
      },
  
      { 
        id: 5,
        dayId: 2, 
        name: 'Evening Show', 
        startTime: '15:30:00', 
        endTime: '17:00:00' 
      },
          { 
        id: 6,
        dayId: 2, 
        name: 'Night Show', 
        startTime: '19:00:00', 
        endTime: '20:30:00' 
      },
      
      // Day 3 Sessions
    
      { 
        id:7 ,
        dayId: 3, 
        name: 'Afternoon Show', 
        startTime: '13:00:00', 
        endTime: '14:30:00' 
      },
       
      { 
        id: 8,
        dayId: 3, 
        name: 'Evening Show', 
        startTime: '15:30:00', 
        endTime: '17:00:00' 
      },
      { 
        id: 9,
        dayId: 3, 
        name: 'Night Show', 
        startTime: '19:00:00', 
        endTime: '20:30:00' 
      },
    ]).onDuplicateKeyUpdate({
      set: { name: schema.eventSessions.name }
    });

    // 3. Seed Ticket Prices
    console.log('🎫 Seeding ticket prices...');
    await db.insert(schema.ticketPrices).values([
      { 
        id: 1,
        name: 'Adult', 
        type: 'ADULT', 
        price: '50000.00', 
        description: 'Standard Entry (18+ years)',
        isActive: true 
      },
      { 
        id: 2,
        name: 'Student', 
        type: 'STUDENT', 
        price: '30000.00', 
        description: 'Must present valid student ID',
        isActive: true 
      },
      { 
        id: 3,
        name: 'Child', 
        type: 'CHILD', 
        price: '30000.00', 
        description: 'Under 15 years old',
        isActive: true 
      },
    ]).onDuplicateKeyUpdate({
      set: { price: schema.ticketPrices.price }
    });

    // 4. Seed Payment Methods
    console.log('💳 Seeding payment methods...');
    await db.insert(schema.paymentMethods).values([
      { 
        id: 'mpesa', 
        name: 'Vodacom M-Pesa', 
        imageUrl: '/images/payment/mpesa.png', 
        colorClass: 'border-red-500 text-red-600',
        isActive: true 
      },
      { 
        id: 'tigopesa', 
        name: 'Tigo Pesa', 
        imageUrl: '/images/payment/tigopesa.png', 
        colorClass: 'border-blue-500 text-blue-600',
        isActive: true 
      },
      { 
        id: 'airtel', 
        name: 'Airtel Money', 
        imageUrl: '/images/payment/airtel_money.png', 
        colorClass: 'border-red-400 text-red-500',
        isActive: true 
      },
      { 
        id: 'halopesa', 
        name: 'Halopesa', 
        imageUrl: '/images/payment/halopesa.png', 
        colorClass: 'border-green-500 text-green-600',
        isActive: true 
      },
    ]).onDuplicateKeyUpdate({
      set: { name: schema.paymentMethods.name }
    });

    console.log('✅ Database seeded successfully!');
    
    return {
      success: true,
      message: 'Database seeded successfully!',
      data: {
        eventDays: 3,
        eventSessions: 9, // Updated from 7 to 9
        ticketPrices: 3,  // Updated from 5 to 3
        paymentMethods: 4
      }
    };

  } catch (error: any) {
    console.error('❌ Seeding failed:', error);
    
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
}