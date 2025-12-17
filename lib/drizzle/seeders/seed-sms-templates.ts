// scripts/seed-sms-templates.ts
import { db } from '@/lib/db/db';
import { smsTemplates } from '@/lib/drizzle/schema';

async function seedDefaultTemplates() {
  console.log('🌱 Seeding default SMS templates...');

  const defaultTemplates = [
    {
      name: 'PURCHASE_SUBMISSION_ADULT',
      description: 'SMS sent when adult ticket purchase is submitted',
      content: `Hello {{fullName}}!

Your ticket purchase for {{eventDay}} - {{sessionName}} has been submitted successfully.

Ticket Code: {{ticketCode}}
Quantity: {{quantity}} Adult ticket(s)
Total Amount: TZS {{totalAmount}}

Please check your phone and enter your PIN to complete the payment.

Thank you!`,
      variables: ['fullName', 'eventDay', 'sessionName', 'ticketCode', 'quantity', 'totalAmount'],
      category: 'PURCHASE',
      isActive: true,
    },
    {
      name: 'PURCHASE_SUBMISSION_STUDENT',
      description: 'SMS sent when student ticket purchase is submitted',
      content: `Hello {{fullName}}!

Your student ticket purchase for {{eventDay}} - {{sessionName}} has been submitted.

Student ID: {{studentId}}
Institution: {{institution}}
Ticket Code: {{ticketCode}}
Amount: TZS {{totalAmount}}

Please check your phone and enter your PIN to complete payment.

Thank you!`,
      variables: ['fullName', 'eventDay', 'sessionName', 'studentId', 'institution', 'ticketCode', 'totalAmount'],
      category: 'PURCHASE',
      isActive: true,
    },
    {
      name: 'PAYMENT_VERIFIED',
      description: 'SMS sent when payment is verified successfully',
      content: `Hello {{fullName}}!

Your payment for ticket {{ticketCode}} has been confirmed.

Transaction ID: {{transactionId}}
Event: {{eventDay}} - {{sessionName}}
Date: {{eventDate}}
Time: {{sessionTime}}

Your ticket is now active. Please keep this SMS as proof of purchase.

Thank you for your purchase!`,
      variables: ['fullName', 'ticketCode', 'transactionId', 'eventDay', 'sessionName', 'eventDate', 'sessionTime'],
      category: 'VERIFICATION',
      isActive: true,
    },
    {
      name: 'EVENT_REMINDER',
      description: 'Event reminder SMS',
      content: `Hello {{fullName}}!

Reminder: Your event {{eventDay}} - {{sessionName}} is coming up!

Date: {{eventDate}}
Time: {{sessionTime}}
Venue: [Venue Name]

Please arrive 30 minutes early with your ticket.

See you there!`,
      variables: ['fullName', 'eventDay', 'sessionName', 'eventDate', 'sessionTime'],
      category: 'REMINDER',
      isActive: true,
    },
    {
      name: 'WELCOME_MESSAGE',
      description: 'Welcome message for ticket holders',
      content: `Welcome {{fullName}} to The King and The Code!

Your ticket {{ticketCode}} is now active.

We're excited to have you join us. Check our website for event updates.

See you at the event!`,
      variables: ['fullName', 'ticketCode'],
      category: 'WELCOME',
      isActive: true,
    },
  ];

  let processed = 0;

  for (const template of defaultTemplates) {
    try {
      await db
        .insert(smsTemplates)
        .values(template)
        .onDuplicateKeyUpdate({
          set: {
            description: template.description,
            content: template.content,
            variables: template.variables,
            category: template.category,
            isActive: template.isActive,
          },
        });

      console.log(`✅ Seeded / Updated: ${template.name}`);
      processed++;
    } catch (error: any) {
      console.error(`❌ Error seeding ${template.name}:`, error.message);
    }
  }

  console.log(`\n📊 Seeding complete: ${processed} templates processed.`);
}

// Run if called directly
if (require.main === module) {
  seedDefaultTemplates()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDefaultTemplates };
