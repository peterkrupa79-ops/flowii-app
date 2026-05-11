export default async function handler(req, res) {
  // Povolenie CORS hlavičiek pre komunikáciu s frontendom
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Ošetrenie OPTIONS požiadavky (pre-flight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const targetEndpoint = req.query.endpoint;

  if (!targetEndpoint) {
    return res.status(400).json({ error: 'Chýba parameter endpoint' });
  }

  // Cieľová adresa Flowii API
  const flowiiUrl = `https://api.flowii.com/api/v1/${targetEndpoint}`;

  try {
    const authHeader = req.headers.authorization;

    // Volanie Flowii servera zo server-side prostredia (obchádza CORS)
    const flowiiResponse = await fetch(flowiiUrl, {
      method: req.method,
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const data = await flowiiResponse.json();

    // Ak Flowii vráti chybu (401, 403 atď.), vrátime ju s podrobnosťami
    if (!flowiiResponse.ok) {
       return res.status(flowiiResponse.status).json({
           error: true,
           message: data.message || `Flowii zamietlo prístup k ${targetEndpoint}.`
       });
    }

    // Vrátenie úspešných dát späť do aplikácie
    res.status(200).json(data);

  } catch (error) {
    console.error('Chyba proxy servera:', error);
    res.status(500).json({ error: 'Interná chyba servera pri komunikácii s Flowii' });
  }
}