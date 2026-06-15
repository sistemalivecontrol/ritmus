// Main.js - Ritmus Landing Page

document.addEventListener('DOMContentLoaded', function() {
    waitForSupabase(() => {
        loadCursos();
    });
});

// Carregar cursos na landing page
async function loadCursos() {
    const grid = document.getElementById('cursos-grid');
    if (!grid) return;

    try {
        const { data: cursos, error } = await supabaseClient
            .from('cursos')
            .select('*')
            .eq('ativo', true)
            .order('ordem', { ascending: true });

        if (error) throw error;

        if (!cursos || cursos.length === 0) {
            grid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:60px 20px">
                    <div style="font-size:48px;margin-bottom:16px">🎬</div>
                    <h3 style="font-size:18px;margin-bottom:8px">Cursos em breve!</h3>
                    <p style="color:var(--text-muted)">Estamos preparando aulas incríveis para você.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = cursos.map(curso => `
            <div class="curso-card" onclick="location.href='pages/curso.html?id=${curso.id}'">
                <div class="curso-thumb">
                    <img src="${curso.thumbnail || 'https://placehold.co/600x400/1A1A2E/FF6B35?text=' + encodeURIComponent(curso.titulo)}" alt="${curso.titulo}" loading="lazy">
                    <div class="curso-play">
                        <div class="play-btn">▶</div>
                    </div>
                    <div class="curso-badge">${curso.total_aulas || 0} aulas</div>
                </div>
                <div class="curso-info">
                    <h3>${curso.titulo}</h3>
                    <p>${curso.descricao || 'Curso completo com aulas gravadas em vídeo.'}</p>
                    <div class="curso-meta">
                        <span>⏱️ ${curso.duracao_total || '0h'} total</span>
                        <span>👥 ${curso.total_alunos || 0} alunos</span>
                        <span>⭐ ${curso.avaliacao || '5.0'}</span>
                    </div>
                    <div class="curso-footer">
                        <span class="curso-price">R$ ${curso.preco ? curso.preco.toFixed(2).replace('.', ',') : '49,90'}</span>
                        <button class="btn-curso">Ver Curso</button>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (e) {
        console.error('[RITMUS] Erro ao carregar cursos:', e);
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px 20px">
                <p style="color:var(--text-muted)">Erro ao carregar cursos. Tente novamente mais tarde.</p>
            </div>
        `;
    }
}

// Toggle menu mobile
function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(15, 15, 26, 0.95)';
    } else {
        navbar.style.background = 'rgba(15, 15, 26, 0.85)';
    }
});
