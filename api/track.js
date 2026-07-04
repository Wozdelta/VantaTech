export default async function handler(req, res) {
  const { codigo } = req.query;

  // Habilita CORS
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

  if (!codigo) {
    return res.status(400).json({ error: 'Código de rastreio não fornecido' });
  }

  try {
    // Tenta LinkeTrack via Servidor (bypassa CORS e bloqueios de browser)
    const linkeRes = await fetch(`https://linketrack.com/track/json?user=teste&token=1abcd00b2731640e886fb41a8a9671ad1434c599dbaa0a0de9a5aa619f29a83f&codigo=${codigo}`);
    
    if (linkeRes.ok) {
      const data = await linkeRes.json();
      return res.status(200).json(data);
    }
    
    throw new Error('LinkeTrack falhou');
  } catch (error) {
    console.error('Erro no LinkeTrack:', error);
    
    // Fallback para BrasilAPI
    try {
      const brRes = await fetch(`https://brasilapi.com.br/api/correios/v1/${codigo}`);
      
      if (brRes.status === 404) {
        return res.status(200).json({ notFound: true, error: 'Rastreio não encontrado ou inexistente' });
      }
      
      if (brRes.ok) {
        const data = await brRes.json();
        return res.status(200).json(data);
      }
      
      return res.status(200).json({ fallbackError: true, error: 'BrasilAPI falhou' });
    } catch (brError) {
      return res.status(200).json({ fatalError: true, error: 'Servidores de rastreio indisponíveis no momento' });
    }
  }
}
