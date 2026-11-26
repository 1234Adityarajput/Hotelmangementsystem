import React from "react";

/**
 * Standardize phone number for WhatsApp deep link (wa.me/{cleanNumber}).
 * For 10-digit Indian numbers (e.g., 9090401767), prepends '91'.
 */
export function formatWhatsAppNumber(phone?: string | null): string {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.length === 10) {
    // Standard 10-digit Indian mobile number
    digits = "91" + digits;
  } else if (digits.length === 11 && digits.startsWith("0")) {
    // 0-prefixed Indian mobile number
    digits = "91" + digits.slice(1);
  }
  return digits;
}

export function getWhatsAppUrl(phone: string, text: string): string {
  const cleanPhone = formatWhatsAppNumber(phone);
  if (!cleanPhone) return "#";
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export interface GuestRegistrationParams {
  fullName: string;
  guestCode?: string | null;
  mobileNumber: string;
}

export function getWhatsAppRegistrationMessage(guest: GuestRegistrationParams): string {
  const name = guest.fullName || "Valued Guest";
  const code = guest.guestCode ? `• *Guest Code:* ${guest.guestCode}\n` : "";
  const contact = guest.mobileNumber ? `• *Registered Mobile:* ${guest.mobileNumber}\n` : "";

  return (
    `Dear ${name},\n\n` +
    `Welcome to *Hotel Radha Palace*! 🏨✨\n\n` +
    `Your guest profile has been successfully registered with our Front Desk.\n\n` +
    `*Registration Details:*\n` +
    `• *Guest Name:* ${name}\n` +
    code +
    contact +
    `\nWe look forward to hosting you and providing a memorable luxury hospitality experience. If you require any reservations, travel assistance, or special arrangements, please feel free to reply to this message anytime.\n\n` +
    `Warm Regards,\n` +
    `*Hotel Radha Palace Team*\n` +
    `Front Desk & Guest Services`
  );
}

export function getWhatsAppRegistrationLink(guest: GuestRegistrationParams): string {
  const msg = getWhatsAppRegistrationMessage(guest);
  return getWhatsAppUrl(guest.mobileNumber, msg);
}

export interface CheckInStayParams {
  guestName: string;
  mobileNumber: string;
  roomNumber: string;
  roomType?: string | null;
  checkInDate: string | Date;
  checkInTime?: string | null;
  expectedCheckOutDate?: string | Date | null;
  expectedCheckOutTime?: string | null;
  advanceAmount?: number | null;
}

export function getWhatsAppCheckInMessage(stay: CheckInStayParams): string {
  const name = stay.guestName || "Valued Guest";
  const inDate = stay.checkInDate
    ? new Date(stay.checkInDate).toLocaleDateString("en-IN")
    : "Today";
  const outDate = stay.expectedCheckOutDate
    ? new Date(stay.expectedCheckOutDate).toLocaleDateString("en-IN")
    : "As scheduled";
  const roomCategory = stay.roomType ? ` (${stay.roomType})` : "";
  const advanceLine =
    typeof stay.advanceAmount === "number" && stay.advanceAmount > 0
      ? `• *Advance Received:* ₹${stay.advanceAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n`
      : "";

  return (
    `Dear ${name},\n\n` +
    `Welcome to *Hotel Radha Palace*! 🏨✨\n\n` +
    `We are delighted to confirm that your check-in has been successfully completed.\n\n` +
    `*Stay Details:*\n` +
    `• *Room Number:* Room ${stay.roomNumber}${roomCategory}\n` +
    `• *Check-In:* ${inDate}${stay.checkInTime ? ` at ${stay.checkInTime}` : ""}\n` +
    `• *Expected Check-Out:* ${outDate}${stay.expectedCheckOutTime ? ` by ${stay.expectedCheckOutTime}` : ""}\n` +
    advanceLine +
    `\nWe wish you a pleasant and comfortable stay with us. For room service, housekeeping, or any front desk assistance, please feel free to contact reception or reply to this message.\n\n` +
    `Warm Regards,\n` +
    `*Hotel Radha Palace Front Desk*`
  );
}

export function getWhatsAppCheckInLink(stay: CheckInStayParams): string {
  const msg = getWhatsAppCheckInMessage(stay);
  return getWhatsAppUrl(stay.mobileNumber, msg);
}

export function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      stroke="none"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
