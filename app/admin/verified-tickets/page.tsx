// app/admin/verified-tickets/page.tsx
import AdminLayout from "@/components/admin/AdminLayout";
import { VerifiedTicketsTable } from "@/components/admin/tickets/verify/verified-tickets-table";

export default function VerifiedTicketsPage() {
  return (
    <AdminLayout>
            <div className="container mx-auto py-8">
            
                <VerifiedTicketsTable />
            
            </div>
    </AdminLayout>
  );
}