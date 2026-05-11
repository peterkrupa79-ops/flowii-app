export default async function handler(req, res) {
  // Povolenie CORS pre frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-FLOWII-API-KEY');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { endpoint } = req.query;
  const body = req.body || {};
  
  // Prefix určíme podľa frontendu (api/, api/v1/ alebo prázdny)
  const prefix = body.prefix !== undefined ? body.prefix : 'api/';
  const url = `https://api.flowii.com/${prefix}${endpoint}`;
  
  try {
    // Flowii vyžaduje metódu POST pre zoznamy (index)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': req.headers.authorization || '',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      // Do tela požiadavky môžeme neskôr pridať filtre alebo api_key, ak nebude v hlavičke
      body: JSON.stringify(body.data || {})
    });

    const text = await response.text();
    let data;
    try { 
      data = JSON.parse(text); 
    } catch (e) { 
      data = { raw: text, error: 'Server nevrátil JSON' }; 
    }

    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ 
      error: 'Proxy Fatal Error', 
      message: error.message 
    });
  }
}