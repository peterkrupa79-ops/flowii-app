export default async function handler(req, res) {
  const { endpoint } = req.query;
  const { base, prefix, method, data } = req.body || {};
  
  const finalBase = base || 'https://api.flowii.com';
  const finalPrefix = prefix || 'api/v1/';
  const targetUrl = `${finalBase}/${finalPrefix}${endpoint}`;

  try {
    const response = await fetch(targetUrl, {
      method: method || 'POST',
      headers: {
        'Authorization': req.headers.authorization || '',
        'X-FLOWII-API-KEY': req.headers['x-flowii-api-key'] || '',
        'Api-Key': req.headers['api-key'] || '',
        'Content-Type': 'application/json'
      },
      body: method === 'GET' ? null : JSON.stringify(data || {})
    });
    const text = await response.text();
    let result;
    try { result = JSON.parse(text); } catch (e) { result = { raw: text }; }
    return res.status(response.status).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

