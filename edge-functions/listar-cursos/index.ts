import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");

    // Usar Service Role Key (ignora RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: cursos, error } = await supabase
      .from("cursos")
      .select("id, titulo, preco, descricao, total_aulas, duracao_total, thumbnail")
      .eq("ativo", true)
      .order("ordem", { ascending: true });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, cursos: cursos || [] }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});