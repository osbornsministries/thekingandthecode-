'use server';

import { db } from '@/lib/db/db';
import { users } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { auth } from '@/auth'; // Import your auth helper

// --- HELPER: CHECK ADMIN PERMISSION ---
async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }
}

// --- CREATE USER ---
export async function createUser(formData: FormData) {
  try {
    // 1. Security Check
    await requireAdmin();

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string;

    if (!name || !email || !password) return { success: false, error: 'Missing fields' };

    // 2. Hash Password (matches the logic in auth.ts)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 3. Insert (Lowercase Email is crucial for login consistency)
    await db.insert(users).values({
      name,
      email: email.toLowerCase(), 
      password: hashedPassword,
      role: role || 'user',
    });

    revalidatePath('/admin/users');
    return { success: true };

  } catch (error: any) {
    console.error("Create User Error:", error);
    if (error.message.includes('Unauthorized')) return { success: false, error: 'Unauthorized' };
    return { success: false, error: 'Failed to create user. Email might be duplicate.' };
  }
}

// --- UPDATE USER ---
export async function updateUser(userId: number, formData: FormData) {
  try {
    await requireAdmin();

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const role = formData.get('role') as string;
    const password = formData.get('password') as string;

    const updateData: any = { 
        name, 
        email: email.toLowerCase(), // Ensure updates also lowercase
        role 
    };
    
    // Only update password if a new one is provided
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    revalidatePath('/admin/users');
    return { success: true };

  } catch (error) {
    console.error("Update User Error:", error);
    return { success: false, error: 'Failed to update user.' };
  }
}

// --- DELETE USER ---
export async function deleteUser(userId: number) {
  try {
    await requireAdmin();

    await db.delete(users).where(eq(users.id, userId));
    revalidatePath('/admin/users');
    return { success: true };

  } catch (error) {
    console.error("Delete User Error:", error);
    return { success: false, error: 'Failed to delete user.' };
  }
}