'use server';

import { db } from '@/lib/db/db';
import { users } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { auth } from '@/auth'; // Ensure this points to your auth.ts helper

// --- HELPER: CHECK ADMIN PERMISSION ---
// This ensures only logged-in Admins can perform these actions
async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }
}

// --- 1. CREATE USER ---
export async function createUser(formData: FormData) {
  try {
    // Security Check
    await requireAdmin();

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string;

    if (!name || !email || !password) {
      return { success: false, error: 'Missing required fields' };
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert User (Force email lowercase for consistency)
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
    // Handle duplicate email error usually thrown by DB
    if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate')) {
        return { success: false, error: 'Email already exists.' };
    }
    return { success: false, error: 'Failed to create user.' };
  }
}

// --- 2. UPDATE USER ---
export async function updateUser(userId: number, formData: FormData) {
  try {
    await requireAdmin();

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const role = formData.get('role') as string;
    const password = formData.get('password') as string;

    const updateData: any = { 
        name, 
        email: email.toLowerCase(), 
        role 
    };
    
    // Only update password if a new one is typed
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

// --- 3. DELETE USER ---
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