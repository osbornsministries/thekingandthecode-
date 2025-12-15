// app/admin/tickets/[id]/page.tsx
import AdminLayout from '@/components/admin/AdminLayout';
import { db } from '@/lib/db/db';
import { 
  tickets, 
  eventSessions, 
  eventDays, 
  transactions,
  adults,
  students,
  children,
  agentAssignments 
} from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Phone, 
  Tag, 
  DollarSign, 
  CreditCard, 
  Building, 
  School, 
  Baby, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  Printer,
  Mail,
  Share2,
  QrCode,
  Edit // Add this import
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { id } = await params;
  const ticketId = parseInt(id);

  if (isNaN(ticketId)) {
    notFound();
  }

  // Fetch ticket with all related data
  const [ticketData] = await db.select({
    ticket: tickets,
    session: eventSessions,
    day: eventDays,
    transaction: transactions
  })
    .from(tickets)
    .leftJoin(eventSessions, eq(tickets.sessionId, eventSessions.id))
    .leftJoin(eventDays, eq(eventSessions.dayId, eventDays.id))
    .leftJoin(transactions, eq(tickets.id, transactions.ticketId))
    .where(eq(tickets.id, ticketId));

  if (!ticketData.ticket) {
    notFound();
  }

  const { ticket, session, day, transaction } = ticketData;

  // Fetch attendees
  const adultAttendees = await db.select()
    .from(adults)
    .where(eq(adults.ticketId, ticketId));

  const studentAttendees = await db.select()
    .from(students)
    .where(eq(students.ticketId, ticketId));

  const childAttendees = await db.select()
    .from(children)
    .where(eq(children.ticketId, ticketId));

  // Fetch agent assignments
  const agentAssignmentsData = await db.select()
    .from(agentAssignments)
    .where(eq(agentAssignments.ticketId, ticketId));

  // Calculate statistics
  const totalScanned = adultAttendees.filter(a => a.isUsed).length +
    studentAttendees.filter(s => s.isUsed).length +
    childAttendees.filter(c => c.isUsed).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/tickets"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ticket Details</h1>
              <p className="text-sm text-gray-500">
                ID: #{ticket.id.toString().padStart(4, '0')} • 
                Code: {ticket.ticketCode}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              <Printer size={16} /> Print
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              <Download size={16} /> Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#A81010] text-white rounded-xl text-sm font-medium hover:bg-[#8a0d0d] transition-colors">
              <Share2 size={16} /> Share
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Ticket Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Summary Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Ticket Information</h2>
                  <p className="text-sm text-gray-500">Complete ticket details and status</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                    ticket.paymentStatus === 'PAID' ? 'bg-green-50 text-green-700 border border-green-100' :
                    ticket.paymentStatus === 'FAILED' ? 'bg-red-50 text-red-700 border border-red-100' :
                    'bg-yellow-50 text-yellow-700 border border-yellow-100'
                  }`}>
                    {ticket.paymentStatus}
                  </span>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                    ticket.ticketType === 'VVIP' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                    ticket.ticketType === 'VIP' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    'bg-blue-50 text-blue-700 border border-blue-100'
                  }`}>
                    {ticket.ticketType}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Purchaser Info */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <User size={16} /> Purchaser Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium text-gray-900">{ticket.purchaserName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="font-medium text-gray-900">{ticket.purchaserPhone}</p>
                    </div>
                    {ticket.institution && (
                      <div>
                        <p className="text-sm text-gray-500">Institution</p>
                        <p className="font-medium text-gray-900">{ticket.institution}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Event Info */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Calendar size={16} /> Event Details
                  </h3>
                  <div className="space-y-3">
                    {day && (
                      <div>
                        <p className="text-sm text-gray-500">Day</p>
                        <p className="font-medium text-gray-900">
                          {day.name} ({day.date ? new Date(day.date).toLocaleDateString() : '-'})
                        </p>
                      </div>
                    )}
                    {session && (
                      <div>
                        <p className="text-sm text-gray-500">Session</p>
                        <p className="font-medium text-gray-900">
                          {session.name} ({session.startTime} - {session.endTime})
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500">Ticket Code</p>
                      <p className="font-mono font-medium text-gray-900">{ticket.ticketCode}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <DollarSign size={16} /> Payment Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="text-lg font-bold text-gray-900">
                        TZS {Number(ticket.totalAmount).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payment Method</p>
                      <p className="font-medium text-gray-900">{ticket.paymentMethodId || 'N/A'}</p>
                    </div>
                    {transaction && (
                      <>
                        <div>
                          <p className="text-sm text-gray-500">Transaction ID</p>
                          <p className="font-mono text-sm text-gray-900">{transaction.transId || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Provider</p>
                          <p className="font-medium text-gray-900">{transaction.provider || 'N/A'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Quantity Info */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Tag size={16} /> Ticket Breakdown
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-500">Adults</p>
                        <p className="text-2xl font-bold text-blue-600">{ticket.adultQuantity}</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-500">Students</p>
                        <p className="text-2xl font-bold text-green-600">{ticket.studentQuantity}</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-500">Children</p>
                        <p className="text-2xl font-bold text-purple-600">{ticket.childQuantity}</p>
                      </div>
                      <div className="text-center p-3 bg-amber-50 rounded-lg">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-2xl font-bold text-amber-600">{ticket.totalQuantity}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Scanned Attendees</p>
                      <p className="font-medium text-gray-900">
                        {totalScanned} of {ticket.totalQuantity} scanned
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendees List */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Attendees List</h2>
              
              {/* Adults */}
              {adultAttendees.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <User size={16} /> Adults ({adultAttendees.length})
                  </h3>
                  <div className="space-y-3">
                    {adultAttendees.map((adult) => (
                      <div key={adult.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{adult.fullName}</p>
                          <p className="text-sm text-gray-500">{adult.phoneNumber}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {adult.isUsed ? (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700">
                              <CheckCircle size={12} /> Scanned
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700">
                              <AlertCircle size={12} /> Pending
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {adult.scannedAt ? new Date(adult.scannedAt).toLocaleString() : 'Not scanned'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Students */}
              {studentAttendees.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <School size={16} /> Students ({studentAttendees.length})
                  </h3>
                  <div className="space-y-3">
                    {studentAttendees.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{student.fullName}</p>
                          <p className="text-sm text-gray-500">
                            {student.institutionName} • {student.studentId}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {student.isUsed ? (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700">
                              <CheckCircle size={12} /> Scanned
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700">
                              <AlertCircle size={12} /> Pending
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {student.scannedAt ? new Date(student.scannedAt).toLocaleString() : 'Not scanned'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Children */}
              {childAttendees.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Baby size={16} /> Children ({childAttendees.length})
                  </h3>
                  <div className="space-y-3">
                    {childAttendees.map((child) => (
                      <div key={child.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{child.fullName}</p>
                          <p className="text-sm text-gray-500">
                            {child.parentName && `Parent: ${child.parentName}`}
                            {child.dateOfBirth && ` • DOB: ${new Date(child.dateOfBirth).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {child.isUsed ? (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700">
                              <CheckCircle size={12} /> Scanned
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700">
                              <AlertCircle size={12} /> Pending
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {child.scannedAt ? new Date(child.scannedAt).toLocaleString() : 'Not scanned'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {adultAttendees.length === 0 && studentAttendees.length === 0 && childAttendees.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No attendees registered for this ticket.
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Status & Actions */}
          <div className="space-y-6">
            {/* QR Code & Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Ticket QR Code</h3>
              <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                <QrCode size={120} className="text-gray-400 mb-3" />
                <p className="font-mono text-sm text-center text-gray-600 mb-2">{ticket.ticketCode}</p>
                <p className="text-xs text-gray-500 text-center">Scan this QR code for verification</p>
              </div>
              
              <div className="space-y-2 mt-6">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                  <Mail size={16} /> Resend Ticket
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-600 rounded-lg font-medium hover:bg-green-100 transition-colors">
                  <CheckCircle size={16} /> Mark as Used
                </button>
                <Link
                  href={`/admin/tickets/${ticket.id}/edit`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-50 text-amber-600 rounded-lg font-medium hover:bg-amber-100 transition-colors"
                >
                  <Edit size={16} /> Edit Ticket
                </Link>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Activity Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Ticket Created</p>
                    <p className="text-sm text-gray-500">
                      {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
                
                {transaction && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <CreditCard size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Payment {transaction.status}</p>
                      <p className="text-sm text-gray-500">
                        {transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : 'N/A'}
                      </p>
                      {transaction.message && (
                        <p className="text-xs text-gray-500 mt-1">{transaction.message}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Agent Assignments */}
            {agentAssignmentsData.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">Agent Assignments</h3>
                <div className="space-y-3">
                  {agentAssignmentsData.map((assignment) => (
                    <div key={assignment.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">{assignment.assignedTo}</p>
                      <p className="text-sm text-gray-500">{assignment.assignedPhone}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          assignment.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                          assignment.status === 'CANCELLED' ? 'bg-red-50 text-red-700' :
                          'bg-yellow-50 text-yellow-700'
                        }`}>
                          {assignment.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          {assignment.createdAt ? new Date(assignment.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}