export default async function handler(req, res) {
  // Povolenie CORS pre frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-FLOWII-API-KEY');

  // Ošetrenie preflight requestu
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { endpoint } = req.query;
  const body = req.body || {};
  
  // Zabezpečíme, že endpoint existuje
  if (!endpoint) {
    return res.status(400).json({ error: 'Chýba parameter endpoint' });
  }

  // Prefix určíme podľa frontendu (defaultne api/v1/)
  const prefix = body.prefix !== undefined ? body.prefix : 'api/v1/';
  const url = `https://api.flowii.com/${prefix}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST', // Flowii vyžaduje POST pre zoznamy (/index)
      headers: {
        'Authorization': req.headers.authorization || '',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body.data || {})
    });

    const text = await response.text();
    let data;
    
    try { 
      data = JSON.parse(text); 
    } catch (e) { 
      // Ak to nie je JSON (napr. 404 HTML stránka), pošleme surový text
      data = { raw: text, error: 'Target returned non-JSON response' }; 
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({ 
      error: 'Proxy Fatal Error', 
      message: error.message 
    });
  }
}