import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const body = await req.json();
    const { nome, email, telefone, senha, plano, curso_id } = body;

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");

    // Usar Service Role Key (ignora rate limits e restrições)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Criar usuário no Auth (admin.createUser - ignora rate limits!)
    let authUser = null;
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: senha,
        email_confirm: true,
        user_metadata: { nome: nome }
      });

      if (error) throw error;
      authUser = data.user;
      console.log("[RITMUS-EF] Usuário criado no Auth:", authUser.id);
    } catch (authErr) {
      // Se usuário já existe, buscar
      if (authErr.message && authErr.message.includes('already been registered')) {
        console.log("[RITMUS-EF] Usuário já existe, buscando...");
        const { data: users } = await supabase.auth.admin.listUsers();
        authUser = users.users.find(u => u.email === email);
        if (!authUser) throw authErr;
        console.log("[RITMUS-EF] Usuário encontrado:", authUser.id);
      } else {
        throw authErr;
      }
    }

    // 2. Verificar se usuário já existe na tabela usuarios
    let userData = null;
    try {
      const { data: existing, error: findError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("auth_id", authUser.id)
        .maybeSingle();

      if (!findError && existing) {
        userData = existing;
        console.log("[RITMUS-EF] Usuário já existe na tabela:", userData.id);
      }
    } catch (e) {
      console.log("[RITMUS-EF] Erro ao buscar usuário:", e.message);
    }

    // 3. Se não existe, inserir. Se existe, atualizar.
    if (!userData) {
      const { data: newUser, error: insertError } = await supabase
        .from("usuarios")
        .insert({
          auth_id: authUser.id,
          nome: nome,
          email: email,
          telefone: telefone,
          plano: plano,
          status: 'pendente'
        })
        .select()
        .single();

      if (insertError) {
        // Se erro de constraint unique no email, buscar usuário existente
        if (insertError.message && insertError.message.includes('unique constraint')) {
          const { data: existingByEmail } = await supabase
            .from("usuarios")
            .select("*")
            .eq("email", email)
            .single();

          if (existingByEmail) {
            userData = existingByEmail;
            console.log("[RITMUS-EF] Usuário encontrado por email:", userData.id);
          } else {
            throw insertError;
          }
        } else {
          throw insertError;
        }
      } else {
        userData = newUser;
        console.log("[RITMUS-EF] Usuário inserido:", userData.id);
      }
    } else {
      // Atualizar dados existentes
      const { data: updatedUser, error: updateError } = await supabase
        .from("usuarios")
        .update({
          nome: nome,
          telefone: telefone,
          plano: plano,
          updated_at: new Date().toISOString()
        })
        .eq("id", userData.id)
        .select()
        .single();

      if (!updateError && updatedUser) {
        userData = updatedUser;
        console.log("[RITMUS-EF] Usuário atualizado:", userData.id);
      }
    }

    // 4. Criar assinatura/compra
    let valor = 0;
    let descricao = '';

    if (plano === 'individual') {
      const { data: curso } = await supabase
        .from('cursos')
        .select('preco, titulo')
        .eq('id', curso_id)
        .single();

      valor = curso?.preco || 49.90;
      descricao = `Curso: ${curso?.titulo || 'Individual'}`;

      await supabase.from('compras_cursos').insert({
        usuario_id: userData.id,
        curso_id: curso_id,
        valor: valor,
        status: 'pendente'
      });
    } else {
      valor = plano === 'mensal' ? 79.90 : 599.90;
      descricao = plano === 'mensal' ? 'Plano Mensal' : 'Plano Anual';
      const dataExp = new Date();
      dataExp.setMonth(dataExp.getMonth() + (plano === 'anual' ? 12 : 1));

      await supabase.from('assinaturas').insert({
        usuario_id: userData.id,
        plano: plano,
        valor: valor,
        status: 'pendente',
        data_expiracao: dataExp.toISOString()
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userData.id,
        auth_id: authUser.id,
        message: 'Usuário criado com sucesso'
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );

  } catch (error) {
    console.error("[RITMUS-EF] Erro:", error);
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
