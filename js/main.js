// Main.js - Ritmus Landing Page
// Versão que funciona sem depender do Supabase para cursos

const CURSOS_HARDCODED = [
    { 
        id: 'jump-fitness', 
        titulo: 'Jump Fitness', 
        descricao: 'Curso completo de jump com técnicas avançadas, coreografias e treinos de resistência. Queime calorias se divertindo!',
        preco: 49.90, 
        total_aulas: 12, 
        duracao_total: '8h', 
        total_alunos: 0, 
        avaliacao: 5.0,
        thumbnail: 'https://placehold.co/600x400/1A1A2E/FF6B35?text=Jump+Fitness'
    },
    { 
        id: 'danca-fitness', 
        titulo: 'Dança Fitness', 
        descricao: 'Aulas de dança para queimar calorias e se divertir. Samba, funk, salsa e muito mais!',
        preco: 49.90, 
        total_aulas: 15, 
        duracao_total: '10h', 
        total_alunos: 0, 
        avaliacao: 5.0,
        thumbnail: 'https://placehold.co/600x400/1A1A2E/FF6B35?text=Danca+Fitness'
    },
    { 
        id: 'empina-bumbum', 
        titulo: 'Empina Bumbum', 
        descricao: 'Treinos específicos para fortalecimento e hipertrofia dos glúteos. Resultados em 30 dias!',
        preco: 49.90, 
        total_aulas: 10, 
        duracao_total: '6h', 
        total_alunos: 0, 
        avaliacao: 5.0,
        thumbnail: 'https://placehold.co/600x400/1A1A2E/FF6B35?text=Empina+Bumbum'
    },
    { 
        id: 'funcional-total', 
        titulo: 'Funcional Total', 
        descricao: 'Treinamento funcional para todo o corpo, sem equipamentos. Fortaleça e defina!',
        preco: 39.90, 
        total_aulas: 8, 
        duracao_total: '5h', 
        total_alunos: 0, 
        avaliacao: 5.0,
        thumbnail: 'https://placehold.co/600x400/1A1A2E/FF6B35?text=Funcional+Total'
    }
];

document.addEventListener('DOMContentLoaded', function() {
    // Carregar cursos imediatamente (não depende do Supabase)
    loadCursos();

    // Inicializar Supabase em background (para outras funcionalidades)
    if (typeof supabase !== 'undefined') {
        initSupabase();
    }
});

function initSupabase() {
    // O Supabase será inicializado pelo config.js se necessário
    console.log('[RITMUS] Supabase disponível para funcionalidades avançadas');
}

function loadCursos() {
    const grid = document.getElementById('cursos-grid');
    if (!grid) return;

    console.log('[RITMUS] Carregando cursos (modo offline)...');
    renderCursos(CURSOS_HARDCODED);
}

function renderCursos(cursos) {
    const grid = document.getElementById('cursos-grid');

    grid.innerHTML = cursos.map(curso => `
        <div class="curso-card" onclick="location.href='pages/cadastro.html?plano=individual&curso=${curso.id}'">
            <div class="curso-thumb">
                <img src="${curso.thumbnail}" alt="${curso.titulo}" loading="lazy">
                <div class="curso-play">
                    <div class="play-btn">▶</div>
                </div>
                <div class="curso-badge">${curso.total_aulas} aulas</div>
            </div>
            <div class="curso-info">
                <h3>${curso.titulo}</h3>
                <p>${curso.descricao}</p>
                <div class="curso-meta">
                    <span>⏱️ ${curso.duracao_total} total</span>
                    <span>👥 ${curso.total_alunos} alunos</span>
                    <span>⭐ ${curso.avaliacao}</span>
                </div>
                <div class="curso-footer">
                    <span class="curso-price">R$ ${curso.preco.toFixed(2).replace('.', ',')}</span>
                    <button class="btn-curso">Ver Curso</button>
                </div>
            </div>
        </div>
    `).join('');
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
