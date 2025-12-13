import AdminLayout from '@/components/admin/AdminLayout';
import { db } from '@/lib/db/db';
import { users } from '@/lib/drizzle/schema';
import { desc } from 'drizzle-orm';
import UserManagement from '@/components/admin/users/UserManagement'; // Import the client component

export default async function UsersPage() {
  // Fetch users server-side
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

  return (
    <AdminLayout>
      {/* Pass data to the Client Component to handle interactivity */}
      <UserManagement initialUsers={allUsers} />
    </AdminLayout>
  );
}