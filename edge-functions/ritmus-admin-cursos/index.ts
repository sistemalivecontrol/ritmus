import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const body = await req.json();
    const { action, data, id } = body;

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");

    // Usar Service Role Key (ignora RLS completamente)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let result;

    switch (action) {
      case 'insert_curso':
        result = await supabase.from("cursos").insert(data).select();
        break;

      case 'update_curso':
        result = await supabase.from("cursos").update(data).eq('id', id).select();
        break;

      case 'delete_curso':
        // Primeiro deletar aulas relacionadas
        await supabase.from("aulas").delete().eq('curso_id', id);
        result = await supabase.from("cursos").delete().eq('id', id).select();
        break;

      case 'insert_aula':
        result = await supabase.from("aulas").insert(data).select();
        // Atualizar contagem de aulas
        const { count } = await supabase.from("aulas").select('*', { count: 'exact', head: true }).eq('curso_id', data.curso_id);
        await supabase.from("cursos").update({ total_aulas: count || 0 }).eq('id', data.curso_id);
        break;

      case 'delete_aula':
        const { data: aulaDel } = await supabase.from("aulas").select('curso_id').eq('id', id).single();
        result = await supabase.from("aulas").delete().eq('id', id).select();
        if (aulaDel) {
          const { count } = await supabase.from("aulas").select('*', { count: 'exact', head: true }).eq('curso_id', aulaDel.curso_id);
          await supabase.from("cursos").update({ total_aulas: count || 0 }).eq('id', aulaDel.curso_id);
        }
        break;

      case 'update_usuario':
        result = await supabase.from("usuarios").update(data).eq('id', id).select();
        break;

      case 'update_assinatura':
        result = await supabase.from("assinaturas").update(data).eq('id', id).select();
        break;

      default:
        throw new Error('Ação não reconhecida: ' + action);
    }

    if (result.error) throw result.error;

    return new Response(
      JSON.stringify({ success: true, data: result.data }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );

  } catch (error) {
    console.error("[RITMUS-ADMIN] Erro:", error);
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
