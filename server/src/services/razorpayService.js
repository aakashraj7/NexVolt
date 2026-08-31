import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const key_id = process.env.RAZORPAY_KEY_ID || '';
const key_secret = process.env.RAZORPAY_KEY_SECRET || '';

let razorpayInstance = null;

if (key_id && key_secret) {
  try {
    razorpayInstance = new Razorpay({
      key_id,
      key_secret
    });
    console.log('Razorpay SDK initialized in server.');
  } catch (err) {
    console.error('Failed to initialize Razorpay SDK instance:', err);
  }
} else {
  console.warn('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing in server environment.');
}

/**
 * Creates a server-side Razorpay Order
 * @param {Object} params
 * @param {number} params.amountInRupees - Total amount in INR
 * @param {string} params.receipt - Internal orderId (NV-...)
 * @param {Object} [params.notes] - Custom metadata
 */
export async function createRazorpayOrder({ amountInRupees, receipt, notes = {} }) {
  if (!razorpayInstance) {
    throw new Error('Razorpay SDK is not configured on the server. Please check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }

  const amountInPaise = Math.round(Number(amountInRupees) * 100);
  if (isNaN(amountInPaise) || amountInPaise <= 0) {
    throw new Error(`Invalid order amount: ${amountInRupees}`);
  }

  const options = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: String(receipt).slice(0, 40), // Razorpay limit 40 chars
    notes: {
      receipt,
      ...notes
    }
  };

  const razorpayOrder = await razorpayInstance.orders.create(options);
  return razorpayOrder;
}

/**
 * Cryptographically verifies Razorpay Payment Signature
 * @param {Object} params
 * @param {string} params.razorpayOrderId
 * @param {string} params.razorpayPaymentId
 * @param {string} params.razorpaySignature
 * @returns {boolean}
 */
export function verifyRazorpayPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  if (!key_secret) {
    console.error('RAZORPAY_KEY_SECRET is missing. Cannot verify signature.');
    return false;
  }
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return false;
  }

  try {
    const generatedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    return generatedSignature === razorpaySignature;
  } catch (err) {
    console.error('Error verifying payment signature:', err);
    return false;
  }
}

/**
 * Validates incoming Razorpay Webhook signature
 * @param {string|Buffer} rawBody
 * @param {string} signature - Header 'x-razorpay-signature'
 * @param {string} [secret] - Webhook secret
 * @returns {boolean}
 */
export function verifyWebhookSignature(rawBody, signature, secret) {
  const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET || key_secret;
  if (!webhookSecret || !signature) {
    return false;
  }

  try {
    const bodyStr = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyStr)
      .digest('hex');

    return expectedSignature === signature;
  } catch (err) {
    console.error('Error validating webhook signature:', err);
    return false;
  }
}

export { razorpayInstance };
