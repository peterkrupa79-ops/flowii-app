export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { endpoint } = req.query;
  const { useV1 } = req.body || {};
  
  // Ak useV1 je true, pridáme v1, inak ideme priamo na api/
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

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Proxy Error', message: error.message });
  }
}