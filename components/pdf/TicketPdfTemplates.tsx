/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// --- IMAGE MAPPING (Shared Constant) ---
const IMAGE_MAP: Record<string, string> = {
  // Day 1
  'Day_01_AS_ADULT': '/images/tickets/Day_01/AS/ADULT.png',
  'Day_01_AS_STUDENT': '/images/tickets/Day_01/AS/STUDENT.png',
  'Day_01_AS_KIDS': '/images/tickets/Day_01/AS/KIDS.png',
  'Day_01_ES_ADULT': '/images/tickets/Day_01/ES/ADULT.png',
  'Day_01_ES_STUDENT': '/images/tickets/Day_01/ES/STUDENT.png',
  'Day_01_ES_KIDS': '/images/tickets/Day_01/ES/KIDS.png',
  'Day_01_NS_ADULT': '/images/tickets/Day_01/NS/ADULT.png',
  'Day_01_NS_STUDENT': '/images/tickets/Day_01/NS/STUDENT.png',
  'Day_01_NS_KIDS': '/images/tickets/Day_01/NS/KIDS.png',
  
  // Day 2
  'Day_02_AS_ADULT': '/images/tickets/Day_02/AS/ADULT.png',
  'Day_02_AS_STUDENT': '/images/tickets/Day_02/AS/STUDENT.png',
  'Day_02_AS_KIDS': '/images/tickets/Day_02/AS/KIDS.png',
  'Day_02_ES_ADULT': '/images/tickets/Day_02/ES/ADULT.png',
  'Day_02_ES_STUDENT': '/images/tickets/Day_02/ES/STUDENT.png',
  'Day_02_ES_KIDS': '/images/tickets/Day_02/ES/KIDS.png',
  'Day_02_NS_ADULT': '/images/tickets/Day_02/NS/ADULT.png',
  'Day_02_NS_STUDENT': '/images/tickets/Day_02/NS/STUDENT.png',
  'Day_02_NS_KIDS': '/images/tickets/Day_02/NS/KIDS.png',
  
  // Day 3
  'Day_03_AS_ADULT': '/images/tickets/Day_03/AS/ADULT.png',
  'Day_03_AS_STUDENT': '/images/tickets/Day_03/AS/STUDENT.png',
  'Day_03_AS_KIDS': '/images/tickets/Day_03/AS/KIDS.png',
  'Day_03_ES_ADULT': '/images/tickets/Day_03/ES/ADULT.png',
  'Day_03_ES_STUDENT': '/images/tickets/Day_03/ES/STUDENT.png',
  'Day_03_ES_KIDS': '/images/tickets/Day_03/ES/KIDS.png',
  'Day_03_NS_ADULT': '/images/tickets/Day_03/NS/ADULT.png',
  'Day_03_NS_STUDENT': '/images/tickets/Day_03/NS/STUDENT.png',
  'Day_03_NS_KIDS': '/images/tickets/Day_03/NS/KIDS.png',
  
  // Default fallbacks (if needed)
  'ADULT': '/images/tickets/ADULT.png',
  'STUDENT': '/images/tickets/STUDENT.png',
  'KIDS': '/images/tickets/KIDS.png',
  'CHILD': '/images/tickets/KIDS.png',
};

// --- HELPER FUNCTION: Get Session Code (Copied from POS page) ---
const getSessionCode = (sessionName: string): 'AS' | 'ES' | 'NS' | null => {
    if (sessionName.toLowerCase().includes('afternoon') || sessionName.toLowerCase().includes('as')) return 'AS';
    if (sessionName.toLowerCase().includes('evening') || sessionName.toLowerCase().includes('es')) return 'ES';
    if (sessionName.toLowerCase().includes('night') || sessionName.toLowerCase().includes('ns')) return 'NS';
    return null;
};

// --- HELPER FUNCTION: Get Image Key (Logic Corrected) ---
const getImageKey = (ticket: any, days: any[], sessions: any[]) => {
  if (!ticket.dayId || !ticket.sessionId) return ticket.type || 'ADULT';
  
  const day = days.find(d => d.id === ticket.dayId);
  const session = sessions.find(s => s.id === ticket.sessionId);
  
  if (!day || !session) return ticket.type || 'ADULT';
  
  // 1. Extract day number (e.g., "Day 1" -> "01")
  const dayNumberMatch = day.name.match(/\d+/);
  const dayNumber = dayNumberMatch ? dayNumberMatch[0].padStart(2, '0') : '01';
  
  // 2. Map session name to AS/ES/NS using the robust helper
  const sessionCode = getSessionCode(session.name);
  if (!sessionCode) return ticket.type || 'ADULT';
  
  // 3. Map ticket type
  let ticketType = ticket.type.toUpperCase();
  if (ticketType === 'CHILD') ticketType = 'KIDS'; // Map CHILD to KIDS folder name
  
  const key = `Day_${dayNumber}_${sessionCode}_${ticketType}`;
  
  // 4. Return the key if it exists in the map, otherwise return the base type as fallback
  return IMAGE_MAP[key] ? key : ticket.type || 'ADULT';
};

// Convert cm to points (1cm = 28.35 points in PDF)
const FRONT_WIDTH = 14.5 * 28.35; // 14.5cm in points
const TICKET_HEIGHT = 160; // Keep the same height

// --- A3 Layout Calculations for 2 Tickets per Row ---
const CENTER_GAP_PERCENT = 2; // 2% gap in the center

// A3 width is 42cm (1190.55 points). We assume 30pt padding on each side (60pt total)
const A3_CONTENT_WIDTH = 1190.55 - 60; 
const FRONT_WIDTH_AS_POINTS = FRONT_WIDTH; 

// Calculate the width needed for two front tickets plus the gap in points
const DOUBLE_FRONT_TICKET_WIDTH_REQUIRED = (FRONT_WIDTH_AS_POINTS * 2) + (A3_CONTENT_WIDTH * (CENTER_GAP_PERCENT / 100));

// Calculate scale factor if the required width exceeds the available A3 width
const SCALE_FACTOR = DOUBLE_FRONT_TICKET_WIDTH_REQUIRED > A3_CONTENT_WIDTH 
    ? A3_CONTENT_WIDTH / DOUBLE_FRONT_TICKET_WIDTH_REQUIRED 
    : 1;

const FRONT_WIDTH_SCALED = FRONT_WIDTH_AS_POINTS * SCALE_FACTOR;
const TICKET_HEIGHT_SCALED = TICKET_HEIGHT * SCALE_FACTOR;

// --- VERTICAL ADJUSTMENT FOR 7 ROWS (14 TICKETS) ---
const ROW_MARGIN_VERTICAL = 5; // Reduced margin to ensure 7 rows fit easily


// Create styles once
const styles = StyleSheet.create({
  // 1. A3 Page Setup
  a3Page: { 
    paddingHorizontal: 30, // Increase horizontal padding for A3
    paddingVertical: 20, // Keep vertical padding at 20pt
    fontSize: 8 
  },
  
  // A4 Page (for backward compatibility)
  a4Page: {
    padding: 20,
    fontSize: 8
  },

  // 2. A3 Ticket Row Container (Holds 2 tickets side-by-side + spacer)
  a3TicketRowContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Use flex-start and rely on widths/spacer for control
    width: '100%',
    height: TICKET_HEIGHT_SCALED, 
    // --- ADJUSTED MARGIN FOR 7 ROWS (14 TICKETS) ---
    marginBottom: ROW_MARGIN_VERTICAL, 
  },
  
  // 3. A3 Ticket Pair Container (Wrapper for a single Front ticket)
  a3TicketPair: {
    width: FRONT_WIDTH_SCALED, 
    height: TICKET_HEIGHT_SCALED,
  },

  // 4. Explicit Spacer
  ticketPairSpacer: {
    width: `${CENTER_GAP_PERCENT}%`, 
    height: '100%',
  },

  // --- SINGLE TICKET STRUCTURE (FRONT ONLY) ---
  ticketRow: {
    flexDirection: 'row', 
    justifyContent: 'flex-start',
    width: '100%',
    height: '100%', 
  },
  
  // Front ticket (Only component now)
  frontTicket: {
    width: '100%', // Takes the full width of a3TicketPair
    height: '100%',
    position: 'relative',
    borderWidth: 1, 
    borderColor: '#ccc',
    borderRadius: 4,
    overflow: 'hidden',
  },
  
  bgImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 4,
    objectFit: 'contain', 
  },
  fallbackBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#4A90E2', 
  },
  
  // QR Overlay 
  qrOverlay: {
    position: 'absolute',
    top: '50%',
    left: 5 * SCALE_FACTOR, 
    transform: 'translateY(-50%)',
    width: 56 * SCALE_FACTOR, 
    height: 56 * SCALE_FACTOR, 
    backgroundColor: 'white', 
    padding: 5 * SCALE_FACTOR,
    borderRadius: 4,
  },
  qrImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  },
  
  // Info overlays (Scaled positions)
  typeOverlay: {
    position: 'absolute',
    top: 15 * SCALE_FACTOR,
    right: 15 * SCALE_FACTOR,
    fontSize: 10 * SCALE_FACTOR,
    color: '#fff',
    fontFamily: 'Helvetica-Bold',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8 * SCALE_FACTOR,
    paddingVertical: 2 * SCALE_FACTOR,
    borderRadius: 2
  },
  timeOverlay: {
    position: 'absolute',
    top: 15 * SCALE_FACTOR,
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: 8 * SCALE_FACTOR,
    color: '#fff',
    fontFamily: 'Helvetica',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6 * SCALE_FACTOR,
    paddingVertical: 2 * SCALE_FACTOR,
    borderRadius: 2
  },
  codeOverlay: {
    position: 'absolute',
    bottom: 15 * SCALE_FACTOR,
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: 7 * SCALE_FACTOR,
    color: '#fff',
    fontFamily: 'Helvetica',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8 * SCALE_FACTOR,
    paddingVertical: 2 * SCALE_FACTOR,
    borderRadius: 2
  },
  
  // --- QR GRID (A3 size) ---
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', 
    justifyContent: 'flex-start',
    gap: 15, 
    width: '100%',
  },
  gridItem: {
    width: '18%', 
    alignItems: 'center',
    marginBottom: 20, 
    padding: 10, 
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#fff'
  },
  qrGridImage: {
    width: 100, 
    height: 100, 
    marginBottom: 6
  },
  gridText: {
    fontSize: 7,
    marginTop: 2,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold'
  },
  gridSubText: {
    fontSize: 6,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Helvetica-Oblique'
  },
});

// --- SINGLE TICKET ROW (Renders one Front ticket only) ---
const SingleTicketRow = ({ ticket, days, sessions }: { 
  ticket: any;
  days: any[];
  sessions: any[];
}) => {
  if (!ticket) return null;

  const imageKey = getImageKey(ticket, days, sessions);
  const bgImage = IMAGE_MAP[imageKey] || IMAGE_MAP[ticket.type] || IMAGE_MAP.ADULT;
  const qrSource = ticket.qrImageStr || '';
  
  // Find session details for displaying time/name
  const session = sessions.find((s: any) => s.id === ticket.sessionId);
  const sessionName = session ? session.name : 'Unknown Session';
  const dateStr = ticket.createdAt ? new Date(ticket.createdAt).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  }) : '';

  return (
    <View style={styles.ticketRow} wrap={false}>
      {/* Front Ticket (Only component now) */}
      <View style={styles.frontTicket}>
        <Image src={bgImage} style={styles.bgImage} />
        
        
        {/* QR Code - Left Side */}
        {qrSource ? (
          <View style={styles.qrOverlay}>
            <Image src={qrSource} style={styles.qrImage} />
          </View>
        ) : null}
      </View>
    </View>
  );
};

// --- A3 TICKET ROW CONTAINER (Holds 2 tickets per row + 2% spacer) ---
const A3TicketRow = ({ tickets, days, sessions }: { 
  tickets: any[]; // Array of 2 tickets
  days: any[];
  sessions: any[];
}) => {
  if (!tickets || tickets.length === 0) return null;
  
  // Ensure we have exactly 2 tickets (or empty slots)
  const ticket1 = tickets[0];
  const ticket2 = tickets[1];
  
  // Dummy view for an empty slot on the A3 layout
  const EmptyTicketSlot = () => (
    <View style={[styles.a3TicketPair, {
      height: TICKET_HEIGHT_SCALED,
      borderWidth: 1,
      borderColor: '#eee',
      borderStyle: 'dashed',
      borderRadius: 4,
//       backgroundColor: '#fafafa',
      alignItems: 'center',
      justifyContent: 'center',
    }]}>
      <Text style={{ color: '#aaa' }}>Empty Slot</Text>
    </View>
  );

  return (
    <View style={styles.a3TicketRowContainer} wrap={false}>
      {/* 1. First Ticket */}
      <View style={styles.a3TicketPair}>
        {ticket1 ? (
          <SingleTicketRow ticket={ticket1} days={days} sessions={sessions} />
        ) : (
          <EmptyTicketSlot />
        )}
      </View>
      
      {/* 2. Center Spacer (2% gap) */}
      <View style={styles.ticketPairSpacer} />
      
      {/* 3. Second Ticket */}
      <View style={styles.a3TicketPair}>
        {ticket2 ? (
          <SingleTicketRow ticket={ticket2} days={days} sessions={sessions} />
        ) : (
          <EmptyTicketSlot />
        )}
      </View>
      
      {/* 4. The rest of the space is automatically left to the right */}
    </View>
  );
};

// --- PDF DOC: Full Ticket PDF (Front Only) in A3 with 2 per row ---
export const ThemedTicketPdfA3 = ({ 
  tickets, 
  days = [], 
  sessions = [],
}: { 
  tickets: any[];
  days?: any[];
  sessions?: any[];
}) => {
  const validTickets = tickets ? tickets.filter(Boolean) : [];
  
  // Group tickets into pairs of 2
  const ticketPairs: any[][] = [];
  for (let i = 0; i < validTickets.length; i += 2) {
    const pair = [validTickets[i], validTickets[i + 1]];
    ticketPairs.push(pair);
  }
  
  return (
    <Document>
      <Page size="A3" style={styles.a3Page} wrap>
        {ticketPairs.length > 0 ? (
          ticketPairs.map((pair, index) => (
            <A3TicketRow 
              key={`pair-${index}`}
              tickets={pair} 
              days={days}
              sessions={sessions}
            />
          ))
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>No tickets available for download</Text>
          </View>
        )}
      </Page>
    </Document>
  );
};

// A4 version (one ticket per row)
export const ThemedTicketPdf = ({ 
  tickets, 
  days = [], 
  sessions = [],
}: { 
  tickets: any[];
  days?: any[];
  sessions?: any[];
}) => {
  const validTickets = tickets ? tickets.filter(Boolean) : [];
  
  // For A4, we need to adjust the styles to fit one per row, using unscaled sizes
  const a4SingleTicketStyles = StyleSheet.create({
    a4TicketRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      width: '100%',
      height: TICKET_HEIGHT,
      marginBottom: 15,
    },
    // Reuse scaled ticket styles but use unscaled size for A4
    frontTicket: { ...styles.frontTicket, width: FRONT_WIDTH, borderWidth: 0, }, // Use full FRONT_WIDTH
    qrOverlay: { ...styles.qrOverlay, width: 60, height: 60, padding: 5, left: 10 },
  });
  
  // A custom single row renderer for A4 to use unscaled dimensions
  const SingleTicketRowA4 = ({ ticket }: { ticket: any }) => {
    const imageKey = getImageKey(ticket, days, sessions);
    const bgImage = IMAGE_MAP[imageKey] || IMAGE_MAP[ticket.type] || IMAGE_MAP.ADULT;
    const qrSource = ticket.qrImageStr || '';
    
    // Find session details for displaying time/name
    const session = sessions.find((s: any) => s.id === ticket.sessionId);
    const sessionName = session ? session.name : 'Unknown Session';
    
    return (
      <View style={a4SingleTicketStyles.a4TicketRow} wrap={false}>
        <View style={a4SingleTicketStyles.frontTicket}>
          <Image src={bgImage} style={styles.bgImage} />
     
          <Text style={styles.codeOverlay}>{ticket.code || 'NO CODE'}</Text>
          {qrSource ? (<View style={a4SingleTicketStyles.qrOverlay}><Image src={qrSource} style={styles.qrImage} /></View>) : null}
        </View>
      </View>
    );
  };

  return (
    <Document>
      <Page size="A4" style={styles.a4Page} wrap>
        {validTickets.length > 0 ? (
          validTickets.map((t, index) => (
            <SingleTicketRowA4 
              key={t.code || t.id || index} 
              ticket={t} 
            />
          ))
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>No tickets available for download</Text>
          </View>
        )}
      </Page>
    </Document>
  );
};

// --- PDF DOC: Horizontal QR Grid (Reused) ---
export const SimpleQrGridPdf = ({ 
  tickets, 
  pageSize = 'A3' // Default to A3 for QR grid
}: { 
  tickets: any[];
  pageSize?: 'A4' | 'A3';
}) => {
  const validTickets = tickets ? tickets.filter(Boolean) : [];
  
  return (
    <Document>
      <Page size={pageSize} style={styles.a3Page} wrap>
        <Text style={{ 
          fontSize: 20, 
          marginBottom: 25, 
          textAlign: 'center',
          fontFamily: 'Helvetica-Bold'
        }}>
          POS QR Codes Batch
        </Text>
        
        {validTickets.length > 0 ? (
          <View style={styles.gridContainer}>
            {validTickets.map((t, index) => {
              const qrSource = t.qrImageStr || '';
              const code = t.code || '';
              const type = t.type || 'UNKNOWN';

              return (
                <View key={code || index} style={styles.gridItem}>
                  {qrSource ? (
                    <Image src={qrSource} style={styles.qrGridImage} />
                  ) : (
                    <View style={[styles.qrGridImage, { backgroundColor: '#f0f0f0' }]} />
                  )}
                 
                  
                </View>
              );
            })}
          </View>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 }}>
            <Text>No QR codes available</Text>
          </View>
        )}
      </Page>
    </Document>
  );
};

// Convenience export for A3 QR Grid
export const SimpleQrGridPdfA3 = ({ tickets }: { tickets: any[] }) => {
  return SimpleQrGridPdf({ tickets, pageSize: 'A3' });
};