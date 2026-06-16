// Configuração Supabase - Ritmus / Scheila Almeida
// URL: https://fcvkhzdezlrcsdfthluh.supabase.co

const SUPABASE_URL = 'https://fcvkhzdezlrcsdfthluh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdmtoemRlemxyY3NkZnRobHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MjA5MjUsImV4cCI6MjA5NjQ5NjkyNX0.BGEmwtd0CzvwUYW-ts3lrBGmVeiRdKzkTXVuuHhOK_0';

let supabaseClient = null;

function initSupabase() {
    try {
        if (typeof supabase !== 'undefined' && supabase.createClient) {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('[RITMUS] Supabase inicializado');
            return true;
        }
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('[RITMUS] Supabase inicializado (window)');
            return true;
        }
        console.warn('[RITMUS] Supabase não disponível ainda');
        return false;
    } catch (e) {
        console.error('[RITMUS] Erro ao inicializar Supabase:', e);
        return false;
    }
}

function waitForSupabase(callback, maxRetries = 20) {
    let retries = 0;
    const interval = setInterval(() => {
        retries++;
        if (initSupabase()) {
            clearInterval(interval);
            callback();
        } else if (retries >= maxRetries) {
            clearInterval(interval);
            console.error('[RITMUS] Timeout aguardando Supabase');
        }
    }, 300);
}

// Inicializar automaticamente se Supabase já estiver disponível
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initSupabase, 500);
    });
} else {
    setTimeout(initSupabase, 500);
}
