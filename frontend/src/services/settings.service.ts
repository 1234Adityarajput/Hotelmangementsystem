import { apiClient } from "@/lib/api-client";
import { ApiResponse, HotelSetting, ReceiptDesignConfig } from "@/types";

export const defaultReceiptDesign: ReceiptDesignConfig = {
  hotelName: 'Hotel Radha Palace',
  tagline: 'Boutique Luxury Hospitality Management • Official Stay Folio',
  logoUrl: '/radha-krishna-logo.jpg',
  showLogo: true,
  address: '108 Heritage Boulevard, Civil Lines, New Delhi, India - 110054',
  phone: '+91 98765 43210',
  email: 'reservations@hotelradhapalace.com',
  website: 'www.hotelradhapalace.com',
  gstin: '07AAAAA0000A1Z5',
  panNumber: 'AAAAA0000A',
  fssaiNumber: '10019011000123',
  state: 'Delhi',
  stateCode: '07',

  themeColor: '#59283A',
  accentColor: '#C4A06A',
  headerStyle: 'MODERN_SPLIT',
  fontFamily: 'SERIF',
  showBorderAccent: true,
  watermarkText: '',

  folioTitle: 'OFFICIAL GUEST STAY FOLIO & BILL',
  invoiceTitle: 'TAX INVOICE & GST BILL',
  receiptNumberPrefix: 'HRP',

  showGstBreakdown: true,
  showItemizedServices: true,
  showPaymentHistory: true,
  showCheckInOutTimings: true,
  checkInTime: '12:00 PM',
  checkOutTime: '11:00 AM',

  showUpiQrCode: false,
  upiId: '',
  bankAccountDetails: '',

  showSignatory: true,
  signatoryTitle: 'Authorized Signatory',
  signatoryDepartment: 'Front Office & Accounts',

  termsAndConditions: '1. All guests must provide valid photo ID upon check-in.\n2. Room charges are non-refundable after standard cancellation period.\n3. Goods & Services Tax (GST) charged as per applicable Govt. of India rules.\n4. Any damage to hotel property will be charged to the guest.\n5. Disputes are subject to local jurisdiction.',
  thankYouMessage: 'Thank you for choosing Hotel Radha Palace. We look forward to welcoming you again!',
  customNotes: 'Computer generated bill. No signature required if electronically verified.',
};

export interface SystemHealthData {
  status: string;
  database: {
    provider: string;
    status: string;
    latencyMs: number;
  };
  server: {
    uptimeSeconds: number;
    timestamp: string;
    nodeVersion: string;
    environment: string;
  };
  backupStatus: {
    strategy: string;
    pointInTimeRecovery: string;
    automatedDailyRetention: string;
  };
}

export const settingsService = {
  async getSettings(): Promise<HotelSetting> {
    const res = await apiClient.get<ApiResponse<HotelSetting>>("/settings");
    return res.data.data;
  },

  async updateSettings(data: Partial<HotelSetting>): Promise<HotelSetting> {
    const res = await apiClient.patch<ApiResponse<HotelSetting>>("/settings", data);
    return res.data.data;
  },

  async getHealth(): Promise<SystemHealthData> {
    const res = await apiClient.get<ApiResponse<SystemHealthData>>("/settings/health");
    return res.data.data;
  },

  async downloadBackup(): Promise<any> {
    const res = await apiClient.get<ApiResponse<any>>("/settings/backup");
    return res.data.data;
  },

  async getReceiptDesign(): Promise<ReceiptDesignConfig> {
    try {
      const res = await apiClient.get<ApiResponse<ReceiptDesignConfig>>("/settings/receipt-design");
      return res.data?.data || defaultReceiptDesign;
    } catch {
      return defaultReceiptDesign;
    }
  },

  async updateReceiptDesign(data: Partial<ReceiptDesignConfig>): Promise<ReceiptDesignConfig> {
    const res = await apiClient.patch<ApiResponse<ReceiptDesignConfig>>("/settings/receipt-design", data);
    return res.data.data;
  },
};
