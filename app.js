
const SUPABASE_URL = 'https://pplqvsomhbmdfalzuyif.supabase.co';
const SUPABASE_KEY = 'sb_publishable_O0mDIZD7fAPYlDcdHDC5sw_oiwLeQAu';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let teams = [];
let matches = [];

const scheduleGroups = [
    { id: 'week-10', label: 'Matchday 10', days: [10] },
    { id: 'week-11-12', label: 'Matchday 11–12', days: [11, 12] },
    { id: 'week-13-14', label: 'Matchday 13–14', days: [13, 14] },
    { id: 'week-15-16', label: 'Matchday 15–16', days: [15, 16] },
    { id: 'week-17-18', label: 'Matchday 17–18', days: [17, 18] }
];

const squadFiles = {
    'BNBK BCA TEMBAGAPURA': 'borussia-dortmund-squad.jpeg',
    'DANTE': 'kepulauan-virgin-squad.jpeg',
    'EUFORIO': 'motherwell-fc-squad.jpeg',
    'FC RIJNLAND': 'rijnland-fc-squad.jpeg',
    'KING PERSIB': 'persib-bandung-squad.jpeg',
    'MEDIYS': 'gremio-squad.jpeg',
    'NEWBOYZ': 'atletico-paranaense-squad.jpeg',
    'RIVERTOWN FC': 'club-de-ermo-squad.jpeg',
    'TAIIFFJAA': 'manchester-united-squad.jpeg',
    'THEWUGI': 'estoril-praia-squad.jpeg'
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

// STYLE PUBLIC NEWS
(function addPublicNewsStyles() {
    if (document.getElementById('public-news-styles')) return;

    const style = document.createElement('style');
    style.id = 'public-news-styles';

    style.textContent = `
        .news-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 20px;
            margin: 32px 0 60px;
        }

        .news-card {
            overflow: hidden;
            border: 1px solid rgba(255,255,255,.12);
            border-radius: 14px;
            background: rgba(20,24,34,.92);
        }

        .news-card-image {
            width: 100%;
            aspect-ratio: 16 / 9;
            overflow: hidden;
        }

        .news-card-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        .news-card-body {
            padding: 20px;
        }

        .news-card-meta {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 12px;
            color: #aeb6c5;
            font-size: 12px;
        }

        .news-category {
            color: #f5bd45;
            font-weight: 800;
            letter-spacing: .08em;
            text-transform: uppercase;
        }

        .news-card h2 {
            margin: 0 0 12px;
            font-size: 22px;
        }

        .news-card p {
            margin: 0;
            line-height: 1.7;
            white-space: normal;
            color: inherit;
        }

        @media (max-width: 600px) {
            .news-grid {
                grid-template-columns: 1fr;
            }
        }
    `;

    document.head.appendChild(style);
})();

function getTeam(id) {
    return teams.find(team => team.id === id);
}

function teamCard(team) {
    const number = String(teams.indexOf(team) + 1).padStart(2, '0');

    return `
        <article class="team-card">
            <button class="team-open" data-team="${escapeHTML(team.id)}">

                <div class="team-card-top">
                    <span>CLUB / LH-${number}</span>
                    <span class="arrow">↗</span>
                </div>

                <div class="team-logo-wrap">
                    <img
                        src="${escapeHTML(team.logo)}"
                        alt="${escapeHTML(team.name)}"
                        onerror="this.src='assets/league-logo.jpeg'"
                    >
                </div>

                <h3>${escapeHTML(team.name)}</h3>
                <p>IN-GAME CLUB <b>${escapeHTML(team.club || '-')}</b></p>

                <div class="team-card-bottom">
                    <span>VIEW CLUB PROFILE</span>
                    <span>＋</span>
                </div>

            </button>
        </article>
    `;
}

function renderTeams() {
    const grid = $('#teamGrid');
    const mini = $('#miniTeams');

    if (grid) {
        grid.innerHTML = teams.map(teamCard).join('');
    }

    if (mini) {
        mini.innerHTML = teams.map(team => `
            <button
                class="mini-team"
                data-team="${escapeHTML(team.id)}"
                title="${escapeHTML(team.name)}"
            >
                <img
                    src="${escapeHTML(team.logo)}"
                    alt="${escapeHTML(team.name)}"
                >
            </button>
        `).join('');
    }

    if ($('#teamCount')) {
        $('#teamCount').textContent = `${teams.length} CLUBS`;
    }
}

async function loadTeams() {
    const grid = $('#teamGrid');

    if (grid) {
        grid.innerHTML = '<p>Memuat klub...</p>';
    }

    const { data, error } = await db
        .from('teams')
        .select('id, team_name, manager_name, in_game_club, logo_url')
        .order('team_name');

    if (error) {
        console.error('Gagal memuat klub:', error);

        if (grid) {
            grid.innerHTML = '<p>Gagal memuat data klub.</p>';
        }

        return;
    }

    teams = (data || []).map(team => ({
        id: team.id,
        name: team.team_name,
        club: team.in_game_club || '',
        manager: team.manager_name || '',
        logo: team.logo_url || 'assets/league-logo.jpeg',
        squad: squadFiles[team.team_name] || ''
    }));

    renderTeams();
}

async function loadMatches() {
    const panel = $('#schedulePanel');

    if (panel) {
        panel.innerHTML = '<p>Memuat jadwal pertandingan...</p>';
    }

    const { data, error } = await db
        .from('matches')
        .select(`
            id,
            home_team_id,
            away_team_id,
            matchday,
            kickoff_at,
            venue,
            home_score,
            away_score,
            status
        `)
        .order('matchday')
        .order('kickoff_at');

    if (error) {
        console.error('Gagal memuat jadwal:', error);

        if (panel) {
            panel.innerHTML = '<p>Gagal memuat jadwal. Periksa koneksi database.</p>';
        }

        return;
    }

    matches = data || [];
    renderSchedule();
}

// ======================================
// PUBLIC NEWS
// Mengambil berita yang dipublikasikan
// melalui admin-news.html
// ======================================

async function loadPublicNews() {
    const container = $('#publicNews');

    if (!container) return;

    container.innerHTML = '<p>Memuat berita...</p>';

    const { data, error } = await db
        .from('news')
        .select('id, title, category, image_url, content, published_at, created_at')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Gagal memuat berita publik:', error);

        container.innerHTML =
            '<p>Berita belum dapat dimuat. Silakan coba lagi nanti.</p>';

        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML =
            '<p>Belum ada berita yang dipublikasikan.</p>';

        return;
    }

    container.innerHTML = data.map(item => {
        const dateValue = item.published_at || item.created_at;

        const dateLabel = dateValue
            ? new Date(dateValue).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            })
            : '';

        const category = item.category || 'NEWS';

        const content = escapeHTML(item.content || '')
            .replace(/\r?\n/g, '<br>');

        const image = item.image_url
            ? `
                <div class="news-card-image">
                    <img
                        src="${escapeHTML(item.image_url)}"
                        alt="${escapeHTML(item.title || 'Lose Half League News')}"
                        loading="lazy"
                        onerror="this.parentElement.style.display='none'"
                    >
                </div>
            `
            : '';

        return `
            <article class="news-card">
                ${image}

                <div class="news-card-body">
                    <div class="news-card-meta">
                        <span class="news-category">
                            ${escapeHTML(category)}
                        </span>

                        <span>${escapeHTML(dateLabel)}</span>
                    </div>

                    <h2>${escapeHTML(item.title || 'Untitled News')}</h2>

                    <p>${content}</p>
                </div>
            </article>
        `;
    }).join('');
}

// ======================================
// TEAM DETAIL
// ======================================

function showDetail(id) {
    const team = getTeam(id);

    if (!team) return;

    const detail = $('#detailContent');

    if (!detail) return;

    detail.innerHTML = `
        <div class="detail-hero">
            <div class="detail-logo">
                <img
                    src="${escapeHTML(team.logo)}"
                    alt="${escapeHTML(team.name)}"
                >
            </div>

            <div>
                <p class="eyebrow">OFFICIAL CLUB PROFILE</p>

                <h1>${escapeHTML(team.name)}</h1>

                <p class="manager-line">
                    TEAM MANAGER
                    <b>${escapeHTML(team.manager || 'Belum diisi')}</b>
                </p>

                <p>
                    IN-GAME CLUB:
                    <b>${escapeHTML(team.club || '-')}</b>
                </p>
            </div>
        </div>

        <div class="roster-heading">
            <div>
                <p class="eyebrow">SQUAD PRESENTATION</p>
                <h2>THE <span>SQUAD.</span></h2>
            </div>

            ${team.squad
                ? '<button class="btn btn-ghost" id="viewRoster">EXPAND IMAGE ↗</button>'
                : ''
            }
        </div>

        ${team.squad ? `
            <button class="roster-image" id="rosterPreview">
                <img
                    src="assets/${escapeHTML(team.squad)}"
                    alt="Squad ${escapeHTML(team.name)}"
                >
                <span>CLICK TO EXPAND ↗</span>
            </button>
        ` : '<p>Foto squad belum tersedia.</p>'}
    `;

    navigate('teamDetail');

    if (team.squad) {
        $('#viewRoster').onclick = () => openLightbox(team.squad);
        $('#rosterPreview').onclick = () => openLightbox(team.squad);
    }
}

// ======================================
// SCHEDULE
// ======================================

function formatKickoff(value) {
    if (!value) return 'JADWAL BELUM DITENTUKAN';

    return new Date(value).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function matchCard(match) {
    const home = getTeam(match.home_team_id);
    const away = getTeam(match.away_team_id);

    if (!home || !away) return '';

    const played =
        match.home_score !== null &&
        match.away_score !== null;

    const status = played ? 'FULL TIME' : 'UPCOMING';

    return `
        <article class="fixture-card">

            <div class="fixture-meta">
                <span>${formatKickoff(match.kickoff_at)}</span>
                <span class="fixture-status">${status}</span>
            </div>

            <div class="fixture-teams">

                <div class="fixture-side">
                    <img
                        src="${escapeHTML(home.logo)}"
                        alt="${escapeHTML(home.name)}"
                    >
                    <strong>${escapeHTML(home.name)}</strong>
                </div>

                <div class="fixture-score">
                    ${played
                        ? `<strong>${match.home_score} : ${match.away_score}</strong>`
                        : '<strong>VS</strong>'
                    }
                </div>

                <div class="fixture-side">
                    <img
                        src="${escapeHTML(away.logo)}"
                        alt="${escapeHTML(away.name)}"
                    >
                    <strong>${escapeHTML(away.name)}</strong>
                </div>

            </div>

            <div class="fixture-footer">
                <span>MATCHDAY ${match.matchday}</span>
                <span>${escapeHTML(match.venue || 'LOSE HALF LEAGUE')}</span>
            </div>

        </article>
    `;
}

function renderSchedule(active = scheduleGroups[0].id) {
    const tabs = $('#scheduleTabs');
    const panel = $('#schedulePanel');

    if (!tabs || !panel) return;

    tabs.innerHTML = scheduleGroups.map(group => `
        <button
            class="schedule-tab ${group.id === active ? 'selected' : ''}"
            data-schedule="${group.id}"
        >
            ${group.label}
        </button>
    `).join('');

    const selected = scheduleGroups.find(group => group.id === active);

    if (!selected) return;

    const selectedMatches = matches.filter(match =>
        selected.days.includes(Number(match.matchday))
    );

    const matchdaysHTML = selected.days.map(day => {
        const dayMatches = selectedMatches.filter(
            match => Number(match.matchday) === day
        );

        return `
            <section class="matchday-section">

                <div class="matchday-heading">
                    <span>OFFICIAL FIXTURES</span>
                    <h3>MATCHDAY ${day}</h3>
                    <span>${dayMatches.length} MATCHES</span>
                </div>

                <div class="fixture-grid">
                    ${dayMatches.length
                        ? dayMatches.map(matchCard).join('')
                        : '<p>Belum ada pertandingan pada matchday ini.</p>'
                    }
                </div>

            </section>
        `;
    }).join('');

    panel.innerHTML = `
        <div class="schedule-panel-head">
            <div>
                <p class="eyebrow">LOSE HALF LEAGUE / SEASON 02</p>
                <h2>${selected.label.toUpperCase()}</h2>
            </div>

            <span>${selectedMatches.length} FIXTURES</span>
        </div>

        ${matchdaysHTML}
    `;
}

// ======================================
// NAVIGATION
// ======================================

function navigate(id) {
    $$('.page').forEach(page =>
        page.classList.toggle('active', page.id === id)
    );

    $$('.nav-link').forEach(link =>
        link.classList.toggle('active', link.dataset.page === id)
    );

    if (id !== 'teamDetail') {
        location.hash = id === 'home' ? 'home' : id;
    }

    // Muat berita ketika halaman NEWS dibuka.
    if (id === 'news') {
        loadPublicNews();
    }

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

    if ($('#nav')) {
        $('#nav').classList.remove('open');
    }
}

function openLightbox(src) {
    $('#lightboxImg').src = 'assets/' + src;
    $('#lightbox').classList.add('show');
}

function closeLightbox() {
    $('#lightbox').classList.remove('show');
}

// ======================================
// EVENT LISTENERS
// ======================================

$$('[data-page]').forEach(link => {
    link.addEventListener('click', event => {
        event.preventDefault();
        navigate(link.dataset.page);
    });
});

document.addEventListener('click', event => {
    const teamButton = event.target.closest('[data-team]');

    if (teamButton) {
        showDetail(teamButton.dataset.team);
    }

    const scheduleButton = event.target.closest('[data-schedule]');

    if (scheduleButton) {
        renderSchedule(scheduleButton.dataset.schedule);
    }
});

if ($('#teamSearch')) {
    $('#teamSearch').addEventListener('input', event => {
        const query = event.target.value.toLowerCase();

        const found = teams.filter(team =>
            `${team.name} ${team.club} ${team.manager}`
                .toLowerCase()
                .includes(query)
        );

        $('#teamGrid').innerHTML = found.map(teamCard).join('');

        if ($('#teamCount')) {
            $('#teamCount').textContent =
                `${found.length} / ${teams.length} CLUBS`;
        }
    });
}

if ($('#backTeams')) {
    $('#backTeams').onclick = () => navigate('teams');
}

if ($('#closeLightbox')) {
    $('#closeLightbox').onclick = closeLightbox;
}

if ($('#lightbox')) {
    $('#lightbox').addEventListener('click', event => {
        if (event.target.id === 'lightbox') {
            closeLightbox();
        }
    });
}

document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        closeLightbox();
    }
});

// ======================================
// THEME
// ======================================

if ($('#themeToggle')) {
    $('#themeToggle').onclick = () => {
        document.body.classList.toggle('light');

        localStorage.setItem(
            'lh-theme',
            document.body.classList.contains('light') ? 'light' : 'dark'
        );
    };
}

if (localStorage.getItem('lh-theme') === 'light') {
    document.body.classList.add('light');
}

if ($('#menuToggle')) {
    $('#menuToggle').onclick = () => {
        $('#nav').classList.toggle('open');
    };
}

// ======================================
// STANDINGS
// ======================================

async function loadStandings() {
    const tbody = $('#standingsBody');

    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="10">Memuat klasemen...</td>
        </tr>
    `;

    const { data, error } = await db
        .from('standings')
        .select('*')
        .order('points', { ascending: false })
        .order('goal_difference', { ascending: false })
        .order('goals_for', { ascending: false });

    if (error) {
        console.error('Gagal memuat klasemen:', error);

        tbody.innerHTML = `
            <tr>
                <td colspan="10">Gagal memuat klasemen.</td>
            </tr>
        `;

        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10">Belum ada data klasemen.</td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML = data.map((team, index) => {
        const club = teams.find(item => item.name === team.team_name);
        const logo = club?.logo || 'assets/league-logo.jpeg';

        return `
            <tr>
                <td>${index + 1}</td>

                <td>
                    <div class="standings-team">
                        <img
                            src="${escapeHTML(logo)}"
                            alt="${escapeHTML(team.team_name)}"
                            onerror="this.src='assets/league-logo.jpeg'"
                        >

                        <strong>${escapeHTML(team.team_name)}</strong>
                    </div>
                </td>

                <td>${team.played}</td>
                <td>${team.won}</td>
                <td>${team.drawn}</td>
                <td>${team.lost}</td>
                <td>${team.goals_for}</td>
                <td>${team.goals_against}</td>
                <td>${team.goal_difference}</td>
                <td><strong>${team.points}</strong></td>
            </tr>
        `;
    }).join('');
}

// ======================================
// INITIAL LOAD
// ======================================

renderTeams();

loadTeams().then(() => {
    loadStandings();
});

loadMatches();
loadPublicNews();

// ======================================
// LHAI - LOSE HALF AI
// ======================================

const LHAI_ENDPOINT =
    `${SUPABASE_URL}/functions/v1/lhai-analyst`;

function formatLHAIAnswer(markdown) {
    let html = escapeHTML(markdown);

    // Format teks tebal
    html = html.replace(
        /\*\*(.*?)\*\*/g,
        '<strong>$1</strong>'
    );

    // Format judul
    html = html.replace(
        /^#{1,3}\s+(.+)$/gm,
        '<strong style="display:block;color:#f5bd45;font-size:1.1em">$1</strong>'
    );

    // Format daftar
    html = html.replace(
        /^\s*[-*]\s+/gm,
        '• '
    );

    // Format teks miring
    html = html.replace(
        /\*([^*\n]+)\*/g,
        '<em>$1</em>'
    );

    // Format baris
    html = html
        .replace(/\n{2,}/g, '<br><br>')
        .replace(/\n/g, '<br>');

    return html;
}
async function askLHAI(question) {
    const messages = document.getElementById('lhaiMessages');
    const status = document.getElementById('lhaiStatus');

    if (!messages || !question.trim()) return;

    // Hapus pesan pembuka ketika mulai bertanya
    if (!messages.dataset.started) {
        messages.innerHTML = '';
        messages.dataset.started = 'true';
    }

    function addMessage(label, content, type) {
        const card = document.createElement('article');
        card.className = 'news-card';

        const body = document.createElement('div');
        body.className = 'news-card-body';

        const heading = document.createElement('span');
        heading.className = 'news-category';
        heading.textContent = label;

        const paragraph = document.createElement('p');
        paragraph.textContent = content;
        paragraph.style.whiteSpace = 'pre-wrap';
        paragraph.style.lineHeight = '1.8';

        if (type === 'user') {
            heading.textContent = 'YOU';
        }

        body.append(heading, paragraph);
        card.appendChild(body);
        messages.appendChild(card);

        return paragraph;
    }

    addMessage('YOU', question, 'user');

    const loading = addMessage(
        'LHAI THINKING',
        'Sedang membaca data liga dan menyiapkan analisis...',
        'ai'
    );

    status.textContent = 'LHAI PROCESSING · PLEASE WAIT';

    const formButton = document.querySelector(
        '#lhaiForm button[type="submit"]'
    );

    if (formButton) formButton.disabled = true;

    document.querySelectorAll('[data-lhai-prompt]').forEach(button => {
        button.disabled = true;
    });

    try {
        const response = await fetch(LHAI_ENDPOINT, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                question: question.trim()
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || result.message ||
                `Permintaan gagal (${response.status})`
            );
        }

        if (!result.answer) {
            throw new Error('LHAI belum memberikan jawaban.');
        }

        loading.innerHTML = formatLHAIAnswer(result.answer);

        status.textContent =
            `LHAI ONLINE · DATA: ${result.stats.completed} MATCH SELESAI`;

    } catch (error) {
        console.error('LHAI error:', error);

        loading.textContent =
            'Maaf, LHAI belum dapat menjawab. ' + error.message;

        status.textContent = 'LHAI CONNECTION ERROR';
    } finally {
        if (formButton) formButton.disabled = false;

        document.querySelectorAll('[data-lhai-prompt]').forEach(button => {
            button.disabled = false;
        });

        messages.scrollIntoView({
            behavior: 'smooth',
            block: 'end'
        });
    }
}

// Pertanyaan dari kolom chat
const lhaiForm = document.getElementById('lhaiForm');

if (lhaiForm) {
    lhaiForm.addEventListener('submit', async event => {
        event.preventDefault();

        const input = document.getElementById('lhaiQuestion');
        const question = input.value.trim();

        if (!question) return;

        input.value = '';

        await askLHAI(question);
    });
}

// Tombol Quick Analysis
document.querySelectorAll('[data-lhai-prompt]').forEach(button => {
    button.addEventListener('click', async () => {
        await askLHAI(button.dataset.lhaiPrompt);
    });
});

// ==========================================
// PUBLIC RESULTS
// ==========================================

async function loadPublicResults() {
    const container = document.getElementById('publicResults');

    if (!container) return;

    container.innerHTML = '<p>Memuat hasil pertandingan...</p>';

    const { data, error } = await db
        .from('matches')
        .select(`
            id,
            matchday,
            home_score,
            away_score,
            kickoff_at,
            venue,
            status,
            home_team:teams!matches_home_team_id_fkey(team_name, logo_url),
            away_team:teams!matches_away_team_id_fkey(team_name, logo_url)
        `)
        .eq('status', 'finished')
        .not('home_score', 'is', null)
        .not('away_score', 'is', null)
        .order('matchday', { ascending: true });

    if (error) {
        console.error('[RESULTS]', error);
        container.innerHTML = '<p>Gagal memuat hasil pertandingan.</p>';
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<p>Belum ada pertandingan yang selesai.</p>';
        return;
    }

    container.innerHTML = `
        <div class="schedule-panel-head">
            <div>
                <p class="eyebrow">OFFICIAL MATCH RECORDS</p>
                <h2>COMPLETED MATCHES</h2>
            </div>
            <span>${data.length} RESULTS</span>
        </div>

        <div class="matchday-section">
            <div class="fixture-grid">
                ${data.map(match => `
                    <article class="fixture-card">

                        <div class="fixture-meta">
                            <span>MATCHDAY ${match.matchday}</span>
                            <span class="fixture-status">FULL TIME</span>
                        </div>

                        <div class="fixture-teams">

                            <div class="fixture-side">
                                <img
                                    src="${escapeHTML(match.home_team?.logo_url || 'assets/league-logo.jpeg')}"
                                    alt="${escapeHTML(match.home_team?.team_name || 'Home')}"
                                    onerror="this.src='assets/league-logo.jpeg'"
                                >
                                <strong>
                                    ${escapeHTML(match.home_team?.team_name || 'Home')}
                                </strong>
                            </div>

                            <div class="fixture-score">
                                <strong>
                                    ${match.home_score} : ${match.away_score}
                                </strong>
                            </div>

                            <div class="fixture-side">
                                <img
                                    src="${escapeHTML(match.away_team?.logo_url || 'assets/league-logo.jpeg')}"
                                    alt="${escapeHTML(match.away_team?.team_name || 'Away')}"
                                    onerror="this.src='assets/league-logo.jpeg'"
                                >
                                <strong>
                                    ${escapeHTML(match.away_team?.team_name || 'Away')}
                                </strong>
                            </div>

                        </div>

                        <div class="fixture-footer">
                            <span>LOSE HALF LEAGUE</span>
                            <span>OFFICIAL RESULT</span>
                        </div>

                    </article>
                `).join('')}
            </div>
        </div>
    `;
}


// ==========================================
// PUBLIC TEAM STATISTICS
// ==========================================

async function loadTeamStatistics() {
    const tbody = document.getElementById('teamStatsBody');

    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="10">Memuat statistik tim...</td>
        </tr>
    `;

    const { data, error } = await db
        .from('standings')
        .select('*')
        .order('points', { ascending: false })
        .order('goal_difference', { ascending: false })
        .order('goals_for', { ascending: false });

    if (error) {
        console.error('[STATISTICS]', error);

        tbody.innerHTML = `
            <tr>
                <td colspan="10">Gagal memuat statistik.</td>
            </tr>
        `;

        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10">Belum ada statistik tersedia.</td>
            </tr>
        `;

        return;
    }

    // Menampilkan tabel seluruh tim
    let previous = null;
    let lastPosition = 0;

    tbody.innerHTML = data.map((team, index) => {
        const tied = previous !== null &&
            Number(team.points) === Number(previous.points) &&
            Number(team.goal_difference) === Number(previous.goal_difference) &&
            Number(team.goals_for) === Number(previous.goals_for);

        const position = tied ? lastPosition : index + 1;

        previous = team;
        lastPosition = position;

        const club = teams.find(item => item.name === team.team_name);
        const logo = club?.logo || 'assets/league-logo.jpeg';

        return `
            <tr>
                <td>${position}</td>

                <td>
                    <div class="standings-team">
                        <img
                            src="${escapeHTML(logo)}"
                            alt="${escapeHTML(team.team_name)}"
                            onerror="this.src='assets/league-logo.jpeg'"
                        >
                        <strong>${escapeHTML(team.team_name)}</strong>
                    </div>
                </td>

                <td>${team.played}</td>
                <td>${team.won}</td>
                <td>${team.drawn}</td>
                <td>${team.lost}</td>
                <td>${team.goals_for}</td>
                <td>${team.goals_against}</td>
                <td>${team.goal_difference}</td>
                <td><strong>${team.points}</strong></td>
            </tr>
        `;
    }).join('');

    // Hanya menghitung tim yang sudah bermain
    const playedTeams = data.filter(team => Number(team.played) > 0);

    if (playedTeams.length === 0) return;

    // Best Attack
    const maxGoals = Math.max(...playedTeams.map(team =>
        Number(team.goals_for)
    ));

    const bestAttack = playedTeams.filter(team =>
        Number(team.goals_for) === maxGoals
    );

    document.getElementById('bestAttack').textContent =
        bestAttack.map(team => team.team_name).join(' / ');

    document.getElementById('bestAttackValue').textContent =
        `${maxGoals} TOTAL GOALS`;

    // Best Defense
    const minConceded = Math.min(...playedTeams.map(team =>
        Number(team.goals_against)
    ));

    const bestDefense = playedTeams.filter(team =>
        Number(team.goals_against) === minConceded
    );

    document.getElementById('bestDefense').textContent =
        bestDefense.map(team => team.team_name).join(' / ');

    document.getElementById('bestDefenseValue').textContent =
        `${minConceded} GOALS CONCEDED`;

    // Most Wins
    const maxWins = Math.max(...playedTeams.map(team =>
        Number(team.won)
    ));

    const mostWins = playedTeams.filter(team =>
        Number(team.won) === maxWins
    );

    document.getElementById('mostWins').textContent =
        mostWins.map(team => team.team_name).join(' / ');

    document.getElementById('mostWinsValue').textContent =
        `${maxWins} WINS`;

    // Top Scorer masih menunggu pencatatan event gol
    const scorerContainer = document.getElementById('topScorers');

    if (scorerContainer) {
        scorerContainer.innerHTML = `
            <p>
                Data pencetak gol belum tersedia.
                Statistik akan muncul setelah panitia mencatat
                event gol pada pertandingan.
            </p>
        `;
    }
}


// ==========================================
// LOAD RESULTS & STATISTICS WHEN OPENED
// ==========================================

document.addEventListener('click', event => {
    const link = event.target.closest('[data-page]');

    if (!link) return;

    if (link.dataset.page === 'results') {
        loadPublicResults();
    }

    if (link.dataset.page === 'statistics') {
        loadTeamStatistics();
    }
});
