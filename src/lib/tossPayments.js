const BASE_URL = 'https://api.tosspayments.com/v1/payments';

const tossPayments = ({ secretKey, fetchImpl = fetch }) => {
  if (typeof secretKey !== 'string' || !/^test_(?:sk|gsk)_/.test(secretKey)) {
    throw new Error('A Toss test secret key is required');
  }
  const authorization = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;

  const request = async (url, options = {}) => {
    const response = await fetchImpl(url, {
      ...options,
      headers: { Authorization: authorization, ...(options.headers || {}) },
      signal: AbortSignal.timeout(10000),
    });
    const body = await response.json();
    return { ok: response.ok, status: response.status, body };
  };

  return {
    confirm: ({ paymentKey, orderId, amount }) => request(`${BASE_URL}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': orderId,
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    }),
    get: (paymentKey) => request(`${BASE_URL}/${encodeURIComponent(paymentKey)}`),
  };
};

module.exports = { tossPayments };
