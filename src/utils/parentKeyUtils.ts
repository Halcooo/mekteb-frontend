// Utility functions for generating and handling parent keys

/**
 * Generates a unique parent key for student connections
 * Format: YYYY-MMDD-XXXX (where XXXX is random alphanumeric)
 */
export const generateParentKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  // Generate 4 random alphanumeric characters
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `${year}-${month}${day}-${randomPart}`;
};

/**
 * Validates parent key format
 */
export const validateParentKey = (key: string): boolean => {
  const parentKeyRegex = /^\d{4}-\d{4}-[A-Z0-9]{4}$/;
  return parentKeyRegex.test(key);
};

/**
 * Formats parent key for display (adds dashes for readability)
 */
export const formatParentKeyDisplay = (key: string): string => {
  return key.replace(/(.{4})(.{4})(.{4})/, "$1-$2-$3");
};

/**
 * Generates a QR code data URL for parent key
 */
export const generateParentKeyQR = (
  key: string,
  studentName: string
): string => {
  // In a real implementation, you would use a QR code library
  // For now, return a placeholder data URL
  const qrData = `mekteb-parent-key:${key}:${studentName}`;
  return `data:text/plain;base64,${btoa(qrData)}`;
};
