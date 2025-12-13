'use client';

import { useState, useRef, useMemo } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRouter } from 'next/navigation';
import { submitTicketPurchase } from '@/lib/actions/ticket/purchase-processor';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

// Sub-components
import StepDaySelection from './steps/StepDaySelection';
import StepSessionSelection from './steps/StepSessionSelection';
import StepSelection from './steps/StepSelection';
import StepQuantity from './steps/StepQuantity';
import StepPayment from './steps/StepPayment';
import StepDetails from './steps/StepDetails';
import SuccessModal from './SuccessModal';

interface Props {
  dbPrices: any[];
  dbMethods: any[];
  dbDays: any[];
  dbSessions: any[];
}

export default function TicketForm({ dbPrices, dbMethods, dbDays, dbSessions }: Props) {
  const containerRef = useRef(null);
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState<number | null>(null);
  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // STATE - Updated to include student-specific fields
  const [formData, setFormData] = useState({
    dayId: null as number | null,
    sessionId: null as number | null,
    priceId: null as number | null,
    quantity: 1,
    paymentMethodId: null as string | null,
    fullName: '',
    phone: '',
    studentId: '',
    institution: '',
    institutionName: ''
  });

  // HELPER: Find the selected price object from DB array
  const selectedPriceConfig = useMemo(() =>
    dbPrices.find(p => p.id === formData.priceId),
  [dbPrices, formData.priceId]);

  // Check if selected ticket type is STUDENT
  const isStudentTicket = useMemo(() =>
    selectedPriceConfig?.type === 'STUDENT',
  [selectedPriceConfig]);

  // Filter sessions based on selected day
  const filteredSessions = useMemo(() =>
    formData.dayId
      ? dbSessions.filter(session => session.dayId === formData.dayId)
      : dbSessions,
  [dbSessions, formData.dayId]);

  // HELPER: Calculate Total
  const totalAmount = (selectedPriceConfig ? parseFloat(selectedPriceConfig.price) : 0) * formData.quantity;

  const updateData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrorMessage(null);
  };

  // ANIMATION
  useGSAP(() => {
    gsap.fromTo('.step-content',
      { x: 20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
    );
  }, { dependencies: [step], scope: containerRef });

  const handleNext = () => {
    // Validate current step
    if (step === 1 && !formData.dayId) {
      setErrorMessage("Please select an event day");
      return;
    }
    if (step === 2 && !formData.sessionId) {
      setErrorMessage("Please select a session time");
      return;
    }
    if (step === 3 && !formData.priceId) {
      setErrorMessage("Please select a ticket type");
      return;
    }
    if (step === 5 && !formData.paymentMethodId) {
      setErrorMessage("Please select a payment method");
      return;
    }

    // Validate student-specific fields in step 6
    if (step === 6) {
      // Basic validation
      if (!formData.fullName || !formData.phone) {
        setErrorMessage("Please complete all required details.");
        return;
      }

      // Phone number validation (Tanzanian format)
      const phoneRegex = /^(\+255|255|0)[0-9]{9}$/;
      if (!phoneRegex.test(formData.phone)) {
        setErrorMessage("Please enter a valid Tanzanian phone number (e.g., 0712345678)");
        return;
      }

      // Student-specific validation
      if (isStudentTicket) {
        if (!formData.studentId.trim()) {
          setErrorMessage("Please enter your Student ID number");
          return;
        }
        if (!formData.institution) {
          setErrorMessage("Please select your institution type");
          return;
        }
        if (formData.institution === 'OTHER' && !formData.institutionName.trim()) {
          setErrorMessage("Please enter your institution name");
          return;
        }
      }

      submitForm();
    } else {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    setStep(step - 1);
    setErrorMessage(null);
  };

  const submitForm = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      // Prepare data for submission
      const submissionData = {
        dayId: formData.dayId!,
        sessionId: formData.sessionId!,
        priceId: formData.priceId!,
        quantity: formData.quantity,
        paymentMethodId: formData.paymentMethodId!,
        fullName: formData.fullName,
        phone: formData.phone,
        totalAmount,
        ticketType: selectedPriceConfig?.type || 'ADULT',
        // Include student info only if it's a student ticket
        ...(isStudentTicket ? {
          studentId: formData.studentId,
          institution: formData.institution,
          institutionName: formData.institution === 'OTHER' ? formData.institutionName : undefined
        } : {})
      };

      const result = await submitTicketPurchase(submissionData);

      setLoading(false);

      if (result.success) {
        setCreatedTicketId(result.ticketId ?? null);
        setTicketCode(result.ticketCode ?? null);
        setShowSuccess(true);
      } else {
        setErrorMessage(result.error || "Payment submission failed.");
      }
    } catch (err: any) {
      setLoading(false);
      console.error('Submission error:', err);
      setErrorMessage(err.message || "Unexpected server error.");
    }
  };

  const handleFinish = () => {
    setShowSuccess(false);
    if (createdTicketId) {
      router.push(`/ticket/${createdTicketId}`);
    }
  };

  // Get selected day and session names for summary
  const selectedDay = dbDays.find(d => d.id === formData.dayId);
  const selectedSession = dbSessions.find(s => s.id === formData.sessionId);
  const selectedPaymentMethod = dbMethods.find(m => m.id === formData.paymentMethodId);

  return (
    <div ref={containerRef} className="w-full max-w-lg mx-auto relative">
      <div className="bg-white/40 backdrop-blur-xl border border-white/50 rounded-[40px] p-8 md:p-10 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col">

        {/* Progress Bar - Updated to 6 steps */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5, 6].map(s => (
            <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s <= step ? 'w-8 bg-[#A81010]' : 'w-2 bg-gray-300'}`} />
          ))}
        </div>

        <div className="step-content flex-1">
          {/* STEP 1: Select Event Day */}
          {step === 1 && (
            <StepDaySelection
              days={dbDays}
              selectedDayId={formData.dayId}
              onSelect={(id) => updateData('dayId', id)}
            />
          )}

          {/* STEP 2: Select Session Time */}
          {step === 2 && (
            <StepSessionSelection
              sessions={filteredSessions}
              selectedSessionId={formData.sessionId}
              selectedDayId={formData.dayId || undefined}
              onSelect={(id) => updateData('sessionId', id)}
            />
          )}

          {/* STEP 3: Select Ticket Type */}
          {step === 3 && (
            <StepSelection
              prices={dbPrices}
              selectedId={formData.priceId}
              onSelect={(id) => updateData('priceId', id)}
            />
          )}

          {/* STEP 4: Quantity */}
          {step === 4 && selectedPriceConfig && (
            <StepQuantity
              ticketName={selectedPriceConfig.name}
              unitPrice={parseFloat(selectedPriceConfig.price)}
              quantity={formData.quantity}
              update={(val) => updateData('quantity', val)}
              total={totalAmount}
            />
          )}

          {/* STEP 5: Payment Method */}
          {step === 5 && (
            <StepPayment
              methods={dbMethods}
              selectedId={formData.paymentMethodId}
              onSelect={(id) => updateData('paymentMethodId', id)}
            />
          )}

          {/* STEP 6: Personal Details */}
          {step === 6 && (
            <StepDetails
              fullName={formData.fullName}
              phone={formData.phone}
              studentId={formData.studentId}
              institution={formData.institution}
              institutionName={formData.institutionName}
              update={updateData}
              summary={{
                day: selectedDay?.name || 'N/A',
                session: selectedSession?.name || 'N/A',
                ticketType: selectedPriceConfig?.type || 'ADULT',
                quantity: formData.quantity,
                total: totalAmount,
                paymentMethod: selectedPaymentMethod?.name || 'N/A'
              }}
            />
          )}
        </div>

        {/* Error & Buttons */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm animate-pulse">
            <AlertCircle size={16} /> <span>{errorMessage}</span>
          </div>
        )}

        <div className="mt-8 flex gap-4">
          {step > 1 && (
            <button
              onClick={handlePrev}
              disabled={loading}
              className="px-6 py-4 rounded-xl border border-gray-400 hover:bg-white/50 transition disabled:opacity-50 flex items-center gap-2"
            >
              <ChevronLeft className="text-gray-700" />
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={loading ||
              (step === 1 && !formData.dayId) ||
              (step === 2 && !formData.sessionId) ||
              (step === 3 && !formData.priceId) ||
              (step === 5 && !formData.paymentMethodId)
            }
            className="flex-1 flex items-center justify-center gap-2 font-bold text-white py-4 rounded-xl transition-all shadow-lg bg-gradient-to-r from-[#602324] to-[#cf635f] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                SUBMITTING...
              </>
            ) : step === 6 ? (
              'SUBMIT PAYMENT'
            ) : (
              <>
                CONTINUE
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Success Modal */}
      {showSuccess && (
        <SuccessModal 
          onClose={handleFinish}
          ticketData={{
            ticketId: createdTicketId,
            ticketCode: ticketCode,
            summary: {
              day: selectedDay?.name || 'N/A',
              session: selectedSession?.name || 'N/A',
              ticketType: selectedPriceConfig?.type || 'ADULT',
              quantity: formData.quantity,
              total: totalAmount,
              paymentMethod: selectedPaymentMethod?.name || 'N/A',
              purchaserName: formData.fullName,
              phone: formData.phone
            }
          }}
        />
      )}
    </div>
  );
}