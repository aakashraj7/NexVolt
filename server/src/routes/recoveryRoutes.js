import express from 'express';
import Order from '../models/Order.js';
import { analyzeRecoveryCase, executeGeneratePaymentLink } from '../services/recoveryAgentService.js';

const router = express.Router();

// POST /api/recovery/analyze/:orderId - Trigger RevivePay AI Failure Analysis
router.post('/analyze/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await analyzeRecoveryCase(orderId);
    if (result.notFound) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error analyzing recovery case with RevivePay:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/recovery/generate-link/:orderId - User-Approved Payment Link Generation
router.post('/generate-link/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await executeGeneratePaymentLink(orderId);
    if (result.notFound) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error generating RevivePay payment link:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/recovery/analytics - RevivePay Telemetry & Recovery Dashboard Metrics
router.get('/analytics', async (req, res) => {
  try {
    const allOrders = await Order.find({}).sort({ createdAt: -1 });

    let totalRevenueAtRisk = 0;
    let totalRevenueRecovered = 0;
    let activeCasesCount = 0;
    let successfulRecoveriesCount = 0;
    let failedAttemptsCount = 0;

    const timeline = [];

    allOrders.forEach(order => {
      const isPaid = order.paymentStatus === 'paid';
      const isRecovered = order.checkoutStatus === 'recovered' || order.revivePayCase?.status === 'recovered';
      const isFailedOrAbandoned = order.paymentStatus === 'failed' || order.checkoutStatus === 'abandoned';

      if (isRecovered) {
        totalRevenueRecovered += order.totalAmount || 0;
        successfulRecoveriesCount += 1;
      } else if (isFailedOrAbandoned && !isPaid) {
        totalRevenueAtRisk += order.totalAmount || 0;
        activeCasesCount += 1;
      }

      if (order.revivePayCase?.decisionLogs && order.revivePayCase.decisionLogs.length > 0) {
        order.revivePayCase.decisionLogs.forEach(log => {
          const isRecoverySuccess = log.result === 'recovered' || log.decision === 'payment_verified_recovered' || log.decision === 'link_paid';
          timeline.push({
            orderId: order.orderId,
            customerName: order.customerDetails?.name || 'Customer',
            customerEmail: order.customerDetails?.email || '',
            amount: order.totalAmount,
            timestamp: log.timestamp,
            decision: log.decision,
            reason: log.reason,
            tool: log.tool,
            result: log.result,
            attemptNumber: log.attemptNumber,
            isRecoverySuccess: isRecoverySuccess,
            orderIsPaid: isPaid,
            orderIsRecovered: isRecovered
          });
        });
      }
    });

    // Sort timeline newest first
    timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const totalCombined = totalRevenueRecovered + totalRevenueAtRisk;
    const recoveryRate = totalCombined > 0 ? Math.round((totalRevenueRecovered / totalCombined) * 100) : 0;

    res.json({
      success: true,
      metrics: {
        totalRevenueAtRisk,
        totalRevenueRecovered,
        recoveryRate,
        activeCasesCount,
        successfulRecoveriesCount,
        failedAttemptsCount
      },
      timeline: timeline.slice(0, 30)
    });
  } catch (error) {
    console.error('Error fetching RevivePay analytics:', error);
    res.status(500).json({ success: false, message: 'Error fetching analytics', error: error.message });
  }
});

// GET /api/recovery/cases - List all active & historical recovery cases
router.get('/cases', async (req, res) => {
  try {
    const ordersWithCases = await Order.find({
      $or: [
        { 'revivePayCase.recoveryAttempts': { $gt: 0 } },
        { checkoutStatus: 'abandoned' },
        { checkoutStatus: 'recovered' }
      ]
    }).sort({ updatedAt: -1 });

    res.json({ success: true, count: ordersWithCases.length, cases: ordersWithCases });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching recovery cases', error: error.message });
  }
});

// GET /api/recovery/cases/:orderId - Fetch a single order's recovery case
router.get('/cases/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, orderId: order.orderId, recoveryCase: order.revivePayCase, order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching case', error: error.message });
  }
});

export default router;
