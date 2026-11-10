
async function loadAdminMatches() {
    const container = document.getElementById('matchesList');

    if (!container) return;

    container.innerHTML = 'Memuat data pertandingan...';

    const { data, error } = await db
        .from('matches')
        .select(`
            *,
            home_team:teams!matches_home_team_id_fkey(team_name, logo_url),
            away_team:teams!matches_away_team_id_fkey(team_name, logo_url)
        `)
        .order('matchday', { ascending: true });

    if (error) {
        console.error(error);
        container.innerHTML = 'Gagal memuat pertandingan.';
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = 'Belum ada data pertandingan.';
        return;
    }

    container.innerHTML = data.map(match => `
        <div class="admin-card">
            <h3>Matchday ${match.matchday}</h3>

            <div class="admin-match-teams">
                <div class="admin-match-team">
                    <img
                        src="${match.home_team?.logo_url || 'assets/league-logo.jpeg'}"
                        alt="${match.home_team?.team_name || 'Home'}"
                        onerror="this.src='assets/league-logo.jpeg'"
                    >
                    <strong>${match.home_team?.team_name || 'Home'}</strong>
                </div>

                <span class="admin-match-vs">VS</span>

                <div class="admin-match-team">
                    <img
                        src="${match.away_team?.logo_url || 'assets/league-logo.jpeg'}"
                        alt="${match.away_team?.team_name || 'Away'}"
                        onerror="this.src='assets/league-logo.jpeg'"
                    >
                    <strong>${match.away_team?.team_name || 'Away'}</strong>
                </div>
            </div>

            <div class="score-inputs">
                <input
                    type="number"
                    min="0"
                    id="home-${match.id}"
                    placeholder="Skor"
                    value="${match.home_score ?? ''}"
                >

                <span>-</span>

                <input
                    type="number"
                    min="0"
                    id="away-${match.id}"
                    placeholder="Skor"
                    value="${match.away_score ?? ''}"
                >
            </div>

            <p>Status: ${match.status}</p>

            <button onclick="saveMatchResult('${match.id}')">
                SIMPAN HASIL
            </button>
        </div>
    `).join('');
}

async function saveMatchResult(matchId) {
    const homeInput = document.getElementById(`home-${matchId}`);
    const awayInput = document.getElementById(`away-${matchId}`);

    const homeScore = homeInput.value;
    const awayScore = awayInput.value;

    if (homeScore === '' || awayScore === '') {
        alert('Isi kedua skor terlebih dahulu!');
        return;
    }

    if (
        Number(homeScore) < 0 ||
        Number(awayScore) < 0 ||
        !Number.isInteger(Number(homeScore)) ||
        !Number.isInteger(Number(awayScore))
    ) {
        alert('Skor harus berupa bilangan bulat dan tidak boleh negatif!');
        return;
    }

    const { error } = await db
        .from('matches')
        .update({
            home_score: Number(homeScore),
            away_score: Number(awayScore),
            status: 'finished'
        })
        .eq('id', matchId);

    if (error) {
        console.error(error);
        alert('Gagal menyimpan hasil pertandingan.');
        return;
    }

    alert('Hasil pertandingan berhasil disimpan!');
    await loadAdminMatches();
}

loadAdminMatches();
