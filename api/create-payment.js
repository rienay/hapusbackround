export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.SUMOPOD_API_KEY;
    const apiUrl = process.env.SUMOPOD_API_URL || 'https://api-pay-sandbox.sumopod.com/api/v1/payments';

    if (!apiKey) {
      return res.status(500).json({ error: 'SUMOPOD_API_KEY belum dikonfigurasi di Vercel Environment Variables' });
    }

    const { amount = 2000, order_id, return_url } = req.body || {};

    const payload = {
      order_id: order_id || `PUDDING-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      amount: parseInt(amount, 10) || 2000,
      currency: 'IDR',
      expires_in_hours: 1,
      payment_method_type_code: 'QRIS',
    };

    if (return_url && return_url.startsWith('https://')) {
      payload.success_return_url = return_url;
      payload.cancel_return_url = return_url;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('SumoPod API error:', data);
      return res.status(response.status).json({
        error: data.error || data.message || 'Gagal membuat tagihan QRIS di SumoPod',
        details: data,
      });
    }

    return res.status(200).json({
      success: true,
      payment_id: data.payment_id,
      order_id: data.order_id,
      amount: data.amount,
      fee: data.fee,
      net_amount: data.net_amount,
      payment_link_url: data.payment_link_url,
      expires_at: data.expires_at,
    });
  } catch (err) {
    console.error('Payment handler error:', err);
    return res.status(500).json({ error: 'Internal server error: ' + err.message });
  }
}
