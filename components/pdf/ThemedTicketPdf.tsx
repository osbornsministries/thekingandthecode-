/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// --- CONFIGURATION ---
// Ensure these images match exactly what you uploaded to your public/images/tickets/ folder
const THEMES = {
  ADULT: { 
    bg: '/images/tickets/Adult Ticket.jpg', 
    color: '#FFFFFF' // Adjust text color based on your background darkness
  },
  STUDENT: { 
    bg: '/images/tickets/Students Ticket.jpg', 
    color: '#FFFFFF' 
  },
  CHILD: { 
    bg: '/images/tickets/Kids Ticket.jpg', 
    color: '#FFFFFF' 
  }
};

const styles = StyleSheet.create({
  page: { backgroundColor: '#ffffff', padding: 0 },
  
  // --- THEMED STYLES ---
  ticketContainer: {
    position: 'relative',
    width: '100%',
    height: 200, // Adjust height to match your ticket image aspect ratio (e.g. 1000x400px -> 200h)
    marginBottom: 10,
  },
  bgImage: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100%',
    height: '100%'
  },
  // Adjust these coordinates to place the QR exactly where the "white space" is on your design
  qrOverlay: {
    position: 'absolute',
    top: 40,  // Move down
    right: 40, // Move from right
    width: 80,
    height: 80,
    backgroundColor: 'white',
    padding: 2,
    borderRadius: 4
  },
  textOverlay: {
    position: 'absolute',
    bottom: 20,
    right: 40,
    textAlign: 'center',
    width: 80
  },
  codeText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#333',
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 2,
    borderRadius: 2
  },

  // --- SIMPLE LIST STYLES ---
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingVertical: 10,
    alignItems: 'center'
  },
  qrSmall: { width: 40, height: 40, marginRight: 15 },
  rowText: { fontSize: 10, color: '#333' }
});

// 1. THEMED TICKET PDF (Full Design)
export const ThemedTicketPdf = ({ tickets }: { tickets: any[] }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={{ padding: 20 }}>
        {tickets.map((t) => {
          const theme = THEMES[t.type as keyof typeof THEMES] || THEMES.ADULT;
          return (
            <View key={t.code} style={styles.ticketContainer} wrap={false}>
              {/* Background */}
              <Image src={theme.bg} style={styles.bgImage} />
              
              {/* QR Code (Uses the generated Data URI) */}
              {t.qrImageStr && <Image src={t.qrImageStr} style={styles.qrOverlay} />}
              
              {/* Code Text */}
              <View style={styles.textOverlay}>
                 <Text style={styles.codeText}>{t.code.slice(0,8)}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </Page>
  </Document>
);

// 2. SIMPLE LIST PDF (For Sticker Labels / Checklists)
export const SimpleListPdf = ({ tickets }: { tickets: any[] }) => (
  <Document>
    <Page size="A4" style={{ padding: 30 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>POS Batch Report</Text>
      <Text style={{ fontSize: 10, color: 'gray', marginBottom: 20 }}>
        Generated: {new Date().toLocaleString()}
      </Text>
      
      {tickets.map((t) => (
        <View key={t.code} style={styles.row}>
           {t.qrImageStr && <Image src={t.qrImageStr} style={styles.qrSmall} />}
           <View>
             <Text style={{ fontWeight: 'bold', fontSize: 12 }}>{t.type} TICKET</Text>
             <Text style={styles.rowText}>Code: {t.code}</Text>
             <Text style={styles.rowText}>Price: {t.price?.toLocaleString()} TZS</Text>
           </View>
        </View>
      ))}
    </Page>
  </Document>
);