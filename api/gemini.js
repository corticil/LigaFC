function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'VITE_GEMINI_API_KEY no configurada en Vercel' });
  }

  try {
    const rawBody = await getRawBody(req);
    let parsed;
    try { parsed = JSON.parse(rawBody); } catch { parsed = {}; }

    const model = parsed?.model || 'gemini-2.5-flash';
    const allowedModels = ['gemini-2.5-flash', 'gemini-3.1-flash-lite'];
    const resolvedModel = allowedModels.includes(model) ? model : 'gemini-2.5-flash';
    if (parsed?.model) { delete parsed.model; }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    const data = await response.json();
    data._model = resolvedModel;

    res.setHeader('Content-Type', 'application/json');
    return res.status(response.status).json(data);
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Gemini API timeout (30s)' });
    }
    return res.status(500).json({ error: err.message });
  }
}
