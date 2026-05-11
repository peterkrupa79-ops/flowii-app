export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { endpoint } = req.query;
  const { useV1 } = req.body || {};
  
  const baseUrl = useV1 ? 'https://api.flowii.com/api/v1/' : 'https://api.flowii.com/api/';
  const url = `${baseUrl}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': req.headers.authorization || '',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const text = await response.text();
    let data;
    try { 
      data = JSON.parse(text); 
    } catch (e) { 
      data = { raw: text, error: 'Target returned non-JSON' }; 
    }

    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Proxy Fatal Error', message: error.message });
  }
}