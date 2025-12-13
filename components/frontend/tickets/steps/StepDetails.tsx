// components/frontend/tickets/steps/StepDetails.tsx (Final Corrected)
import { Calendar, Clock, Ticket, User, Phone, School, IdCard } from 'lucide-react';

interface Props {
  fullName: string;
  phone: string;
  studentId?: string;
  institution?: string;
  institutionName?: string;
  update: (field: string, value: any) => void;
  summary?: {
    day: string;
    session: string;
    ticketType: string;
    quantity: number;
    total: number;
  };
}

export default function StepDetails({
  fullName,
  phone,
  studentId,
  institution,
  institutionName,
  update,
  summary
}: Props) {
  const isStudentTicket = summary?.ticketType === 'STUDENT';

  // Helper to get the display name for the institution type
  const getInstitutionDisplayName = (value: string | undefined): string => {
    switch (value) {
      case 'UNIVERSITY':
        return 'University';
      case 'COLLEGE':
        return 'College';
      case 'HIGH_SCHOOL':
        return 'High School';
      case 'OTHER':
        return institutionName && institutionName.trim() !== '' ? institutionName : 'Other Institution';
      default:
        return 'N/A';
    }
  };

  const institutionDisplay = getInstitutionDisplayName(institution);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-serif font-bold text-gray-800 mb-2">Your Details</h3>
        <p className="text-gray-600">Complete your information</p>
      </div>

      {/* Order Summary */}
      {summary && (
        <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-4 mb-6">
          <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Ticket size={16} /> Order Summary
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-gray-400" />
              <span className="text-gray-600">Day:</span>
              <span className="font-medium text-gray-800">{summary.day}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-gray-400" />
              <span className="text-gray-600">Session:</span>
              <span className="font-medium text-gray-800">{summary.session}</span>
            </div>
            {/* TICKET TYPE AND QUANTITY */}
            <div>
              <span className="text-gray-600">Ticket:</span>
              <span className="font-medium text-gray-800 ml-2">{summary.ticketType} × {summary.quantity}</span>
            </div>

            {/* STUDENT DETAIL DISPLAY - NEW ADDITION */}
            {isStudentTicket && (
              <div className="col-span-2 text-sm pt-2 border-t border-gray-200 mt-2">
                <p className="text-gray-700 font-semibold mb-1">Student Details:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <IdCard size={14} className="text-gray-400" />
                    <span className="text-gray-600">ID:</span>
                    <span className="font-medium text-gray-800">{studentId || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <School size={14} className="text-gray-400" />
                    <span className="text-gray-600">Institution:</span>
                    <span className="font-medium text-gray-800">{institutionDisplay}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* TOTAL AMOUNT - MOVED TO THE END */}
            <div className={`col-span-2 ${isStudentTicket ? 'mt-4 border-t border-gray-200 pt-3' : ''} text-right`}>
              <span className="text-gray-600">Total:</span>
              <span className="font-bold text-lg text-[#A81010] ml-2">
                TZS {summary.total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Student Notice */}
      {isStudentTicket && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-4">
          {/* ... (Student Notice content remains the same) ... */}
          <div className="flex items-start gap-3">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <School size={18} className="text-yellow-600" />
            </div>
            <div>
              <h4 className="font-bold text-yellow-800 mb-1">Student Verification Required</h4>
              <p className="text-sm text-yellow-700 mb-2">
                For student tickets, you <span className="font-bold">MUST</span> bring your valid student ID card on the event day for verification.
              </p>
              <p className="text-xs text-yellow-600">
                ⚠️ Without proper student ID, entry will be denied or full price will be charged.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <User size={16} /> Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => update('fullName', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A81010]/30 focus:border-[#A81010] bg-white/50"
            placeholder="Enter your full name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Phone size={16} /> Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => update('phone', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A81010]/30 focus:border-[#A81010] bg-white/50"
            placeholder="e.g., 2557XXXXXXXX"
            required
          />
          <p className="text-xs text-gray-500 mt-2">
            We'll send your ticket details to this number
          </p>
        </div>

        {/* Student Specific Fields */}
        {isStudentTicket && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <IdCard size={16} /> Student ID Number
              </label>
              <input
                type="text"
                value={studentId || ''}
                onChange={(e) => update('studentId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A81010]/30 focus:border-[#A81010] bg-white/50"
                placeholder="Enter your student ID number"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                This will be verified at the entrance
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <School size={16} /> Institution
              </label>
            <input
                type="text"
                value={institution || ''}
                onChange={(e) => update('institution', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A81010]/30 focus:border-[#A81010] bg-white/50"
                placeholder="Enter your institution type (University, College, High School, etc.)"
                required
              />


              {/* Institution Name Field for "OTHER" */}
              {institution === 'OTHER' && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={institutionName || ''}
                    onChange={(e) => update('institutionName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A81010]/30 focus:border-[#A81010] bg-white/50"
                    placeholder="Enter your institution name"
                    required
                  />
                </div>
              )}
            </div>

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-sm text-blue-700">
                📚 Please ensure your student ID is valid and current. Expired IDs will not be accepted.
              </p>
            </div>
          </>
        )}

        {/* General Notice */}
        <div className="p-3 bg-green-50 border border-green-100 rounded-xl">
          <p className="text-sm text-green-700">
            ✅ Your ticket will be sent via SMS/Email after payment confirmation
          </p>
        </div>
      </div>
    </div>
  );
}