// api/proxy.js
export default async function handler(req, res) {
  // Povolíme CORS pre túto našu funkciu
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Ak ide o OPTIONS požiadavku (pre-flight), len odpovieme OK
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Zistíme, ktorý endpoint chce naša aplikácia volať (napr. api.flowii.com/api/v1/partners)
  const targetEndpoint = req.query.endpoint;

  if (!targetEndpoint) {
    return res.status(400).json({ error: 'Chýba parameter endpoint' });
  }

  // Flowii adresa
  const flowiiUrl = `https://api.flowii.com/api/v1/${targetEndpoint}`;

  try {
    // Vezmeme Authorization hlavičku (API kľúč), ktorú nám poslala naša React aplikácia
    const authHeader = req.headers.authorization;

    // Pošleme požiadavku na Flowii server za používateľa
    const flowiiResponse = await fetch(flowiiUrl, {
      method: req.method,
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const data = await flowiiResponse.json();

    // Vrátime dáta z Flowii späť do našej React aplikácie
    res.status(flowiiResponse.status).json(data);

  } catch (error) {
    console.error('Chyba pri volaní Flowii:', error);
    res.status(500).json({ error: 'Chyba servera pri komunikácii s Flowii' });
  }
}