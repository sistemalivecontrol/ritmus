// Configuração Supabase - Ritmus / Scheila Almeida
// URL: https://fcvkhzdezlrcsdfthluh.supabase.co

const SUPABASE_URL = 'https://fcvkhzdezlrcsdfthluh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdmtoemRlemxyY3NkZnRobHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MjA5MjUsImV4cCI6MjA5NjQ5NjkyNX0.BGEmwtd0CzvwUYW-ts3lrBGmVeiRdKzkTXVuuHhOK_0';

let supabaseClient = null;
let supabaseInitialized = false;

function initSupabase() {
    if (supabaseInitialized && supabaseClient) {
        return true;
    }
    try {
        let createClient = null;

        if (typeof supabase !== 'undefined' && supabase.createClient) {
            createClient = supabase.createClient;
        } else if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            createClient = window.supabase.createClient;
        }

        if (createClient) {
            supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            supabaseInitialized = true;
            console.log('[RITMUS] Supabase inicializado');
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
    if (supabaseInitialized && supabaseClient) {
        callback();
        return;
    }

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

// Função checkAuth - verifica se usuário está autenticado
async function checkAuth() {
    if (!supabaseClient) {
        console.warn('[RITMUS] Supabase não inicializado para checkAuth');
        return false;
    }
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error) {
            console.error('[RITMUS] Erro checkAuth:', error);
            return false;
        }
        return !!session;
    } catch (e) {
        console.error('[RITMUS] Erro em checkAuth:', e);
        return false;
    }
}

// Funções utilitárias
function showLoading(msg) {
    console.log('[RITMUS] Loading:', msg);
}

function hideLoading() {
    console.log('[RITMUS] Loading hidden');
}

function showToast(title, message, type) {
    console.log(`[RITMUS] Toast [${type}]: ${title} - ${message}`);
}

// Inicializar automaticamente se Supabase já estiver disponível
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initSupabase, 500);
    });
} else {
    setTimeout(initSupabase, 500);
}
