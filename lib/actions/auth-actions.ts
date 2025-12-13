'use server';

import { signIn } from '@/auth'; 
import { AuthError } from 'next-auth';

export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    // 1. Extract fields manually to sanitize them
    const email = (formData.get('email') as string) || '';
    const password = (formData.get('password') as string) || '';

    // 2. Call signIn with credentials
  await signIn('credentials', {
  email: email.toLowerCase(),
  password: password,
  redirectTo: '/admin/dashboard',
});


  } catch (error) {
    // 3. Handle specific authentication errors
    if (error instanceof AuthError) {
      
      // 💡 NEW DEBUGGING LOGS: Console the exact error type and details
      console.error("--- NextAuth Authentication Error ---");
      console.error("Error Type:", error.type);
      console.error("Error Details:", error); 
      console.error("-------------------------------------");

      switch (error.type) {
        case 'CredentialsSignin':
          // This is the error type you've been seeing. 
          // The friendly message is returned to the user interface.
          return 'Invalid email or password.'; 
        default:
          return 'Something went wrong. Please try again.';
      }
    }

    // 4. CRITICAL: Rethrow the redirect error
    // If sign-in is successful, NextAuth throws an error internally to trigger a redirect.
    // This MUST be rethrown for the application to navigate correctly.
    throw error;
  }
}