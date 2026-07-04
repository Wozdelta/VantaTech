import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Trata requisições OPTIONS (Preflight) do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { trackingCode } = await req.json();

    if (!trackingCode || typeof trackingCode !== 'string') {
      return new Response(JSON.stringify({
        success: false,
        message: 'O código de rastreamento (trackingCode) é obrigatório e deve ser uma string.'
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Retorna 200 sempre, conforme solicitado
      });
    }

    const startTime = Date.now();
    console.log(`[Tracking] Iniciando consulta para: ${trackingCode}`);

    // Cliente Supabase para interagir com o cache
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // 1. Tentar buscar do Cache (10 minutos de validade)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { data: cachedData, error: cacheError } = await supabaseClient
      .from('tracking_cache')
      .select('response')
      .eq('tracking_code', trackingCode)
      .gte('created_at', tenMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (cachedData && !cacheError) {
      console.log(`[Tracking] Cache HIT para ${trackingCode} (${Date.now() - startTime}ms)`);
      return new Response(JSON.stringify(cachedData.response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    console.log(`[Tracking] Cache MISS para ${trackingCode}. Consultando API externa...`);

    // 2. Consulta à API (LinkeTrack via Server-Side para evitar CORS e usar uma API pública estável de Correios)
    // O backend pode consultar sem bloqueios do navegador.
    const apiUrl = `https://linketrack.com/track/json?user=teste&token=1abcd00b2731640e886fb41a8a9671ad1434c599dbaa0a0de9a5aa619f29a83f&codigo=${trackingCode}`;
    
    const fetchResponse = await fetch(apiUrl);
    const fetchStatus = fetchResponse.status;
    
    console.log(`[Tracking] Resposta da API externa: HTTP ${fetchStatus}`);

    if (!fetchResponse.ok) {
      console.error(`[Tracking] Falha na API. Status: ${fetchStatus}`);
      return new Response(JSON.stringify({
        success: false,
        message: "Não foi possível consultar o rastreamento."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const apiData = await fetchResponse.json();

    // 3. Mapear os dados para o formato padronizado e limpo
    if (!apiData || !apiData.eventos || apiData.eventos.length === 0) {
      const emptyResponse = {
        success: false,
        message: "O código de rastreamento informado não foi encontrado ou ainda não possui atualizações."
      };
      return new Response(JSON.stringify(emptyResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const isDelivered = apiData.eventos[0]?.status?.toLowerCase().includes('entregue') || false;

    const formattedResponse = {
      success: true,
      trackingCode: apiData.codigo,
      service: apiData.servico || 'Correios',
      delivered: isDelivered,
      currentStatus: apiData.eventos[0]?.status || 'Sem status',
      lastUpdate: `${apiData.eventos[0]?.data} ${apiData.eventos[0]?.hora}`,
      events: apiData.eventos.map((ev: any) => ({
        date: `${ev.data} ${ev.hora}`,
        city: ev.local ? ev.local.split('/')[0]?.trim() : 'N/A',
        state: ev.local ? ev.local.split('/')[1]?.trim() || '' : '',
        status: ev.status,
        description: ev.subStatus && ev.subStatus.length > 0 ? ev.subStatus.join(' | ') : ''
      }))
    };

    // 4. Salvar no Cache de forma assíncrona para não atrasar a resposta
    supabaseClient
      .from('tracking_cache')
      .insert([
        { tracking_code: trackingCode, response: formattedResponse }
      ])
      .then(({ error }) => {
        if (error) console.error(`[Tracking] Erro ao salvar cache para ${trackingCode}:`, error);
        else console.log(`[Tracking] Cache gravado com sucesso para ${trackingCode}`);
      });

    console.log(`[Tracking] Processamento concluído com sucesso (${Date.now() - startTime}ms)`);

    return new Response(JSON.stringify(formattedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(`[Tracking] Erro crítico na execução:`, error);
    return new Response(JSON.stringify({
      success: false,
      message: "Não foi possível consultar o rastreamento."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  }
});
