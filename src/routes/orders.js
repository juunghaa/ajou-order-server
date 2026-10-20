const express = require('express');
const router = express.Router();
const { quoteCart, QuoteError } = require('../lib/quoteCart');

// Read-only server quote. The client price and option prices are never used.
router.post('/quote', async (req, res) => {
  try {
    return res.json({ success: true, data: await quoteCart(req.body) });
  } catch (error) {
    if (error instanceof QuoteError) {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: '견적을 계산할 수 없습니다.' });
  }
});

// Order creation and management are paused until these endpoints authenticate
// callers and validate order/payment data on the server.
router.use((_req, res) => {
  res.status(503).json({
    success: false,
    error: '주문 기능을 점검하고 있습니다.',
  });
});

module.exports = router;
