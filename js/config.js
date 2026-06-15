// Configuração Supabase - Ritmus
const SUPABASE_URL = 'https://fcvkhzdezlrcsdfthluh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdmtoemRlemxyY3NkZnRobHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MDUzODcsImV4cCI6MjA5NzA4MTM4N30.BGEmwtd0CzvwUYW-ts3lrBGmVeiRdKzkTXVuuHhOK_0';

// Inicializa Supabase
let supabaseClient = null;

function initSupabase() {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('[RITMUS] Supabase inicializado');
        return true;
    }
    return false;
}

// Aguarda carregamento do Supabase
function waitForSupabase(callback, maxRetries = 20) {
    let retries = 0;
    const interval = setInterval(() => {
        retries++;
        if (initSupabase()) {
            clearInterval(interval);
            if (callback) callback();
        } else if (retries >= maxRetries) {
            clearInterval(interval);
            console.error('[RITMUS] Falha ao carregar Supabase');
            showToast('Erro', 'Falha ao conectar com o servidor. Recarregue a página.', 'error');
        }
    }, 500);
}

// Toast notifications
function showToast(title, message, type = 'info') {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// Loading overlay
function showLoading(text = 'Carregando...') {
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div style="text-align:center">
                <div class="loading-spinner"></div>
                <p style="margin-top:16px;color:var(--text-muted);font-size:14px">${text}</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'none';
}

// Verificar autenticação
async function checkAuth() {
    if (!supabaseClient) return null;
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return null;

        const { data: userData } = await supabaseClient
            .from('usuarios')
            .select('*')
            .eq('auth_id', session.user.id)
            .single();

        return { session, user: userData };
    } catch (e) {
        console.error('[RITMUS] Erro auth:', e);
        return null;
    }
}

// Verificar se é admin
async function checkAdmin() {
    const auth = await checkAuth();
    if (!auth) return false;
    return auth.user && auth.user.nivel_acesso === 'admin';
}

// Logout
async function logout() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    localStorage.clear();
    window.location.href = 'login.html';
}

// Redirecionar se não autenticado
async function requireAuth() {
    const auth = await checkAuth();
    if (!auth) {
        window.location.href = 'login.html';
        return null;
    }
    return auth;
}

// Verificar acesso a curso
async function checkCursoAccess(cursoId) {
    const auth = await checkAuth();
    if (!auth) return false;

    try {
        const { data: assinatura } = await supabaseClient
            .from('assinaturas')
            .select('*')
            .eq('usuario_id', auth.user.id)
            .eq('status', 'ativa')
            .gte('data_expiracao', new Date().toISOString())
            .single();

        if (assinatura) return true;

        const { data: compra } = await supabaseClient
            .from('compras_cursos')
            .select('*')
            .eq('usuario_id', auth.user.id)
            .eq('curso_id', cursoId)
            .eq('status', 'pago')
            .single();

        return !!compra;
    } catch (e) {
        return false;
    }
}

// Verificar status da assinatura
async function checkAssinaturaStatus() {
    const auth = await checkAuth();
    if (!auth) return { ativa: false, plano: null, expiracao: null };

    try {
        const { data: assinatura } = await supabaseClient
            .from('assinaturas')
            .select('*')
            .eq('usuario_id', auth.user.id)
            .eq('status', 'ativa')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!assinatura) return { ativa: false, plano: null, expiracao: null };

        const expiracao = new Date(assinatura.data_expiracao);
        const agora = new Date();
        const ativa = expiracao > agora;

        return { 
            ativa, 
            plano: assinatura.plano, 
            expiracao: assinatura.data_expiracao,
            assinatura_id: assinatura.id
        };
    } catch (e) {
        return { ativa: false, plano: null, expiracao: null };
    }
}
