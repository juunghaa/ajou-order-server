const express = require('express');
const router = express.Router();

// Order creation and management are paused until these endpoints authenticate
// callers and validate order/payment data on the server.
router.use((_req, res) => {
  res.status(503).json({
    success: false,
    error: '주문 기능을 점검하고 있습니다.',
  });
});

module.exports = router;
