
const SUPABASE_URL = 'https://pplqvsomhbmdfalzuyif.supabase.co';
const SUPABASE_KEY = 'sb_publishable_O0mDIZD7fAPYlDcdHDC5sw_oiwLeQAu';

const currentFile = window.location.pathname
    .split('/')
    .pop()
    .toLowerCase();

const isLoginPage = currentFile === 'admin-login.html';

// Semua permintaan database dari halaman admin
// menunggu sampai hak akses berhasil diverifikasi.
let releaseAdminGate;

const adminGate = new Promise(resolve => {
    releaseAdminGate = resolve;
});

const guardedFetch = async (input, init) => {
    const requestUrl =
        typeof input === 'string'
            ? input
            : input?.url || String(input);

    const isAdminCheck = requestUrl.includes(
        '/rest/v1/rpc/is_admin'
    );

    if (!isLoginPage && requestUrl.includes('/rest/v1/') && !isAdminCheck) {
        const allowed = await adminGate;

        if (!allowed) {
            throw new Error('Akses admin belum diverifikasi.');
        }
    }

    return fetch(input, init);
};

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        },
        global: {
            fetch: guardedFetch
        }
    }
);

window.db = db;

// ==========================================
// ADMIN LOADING SCREEN
// ==========================================

function createAdminLoader() {
    const overlay = document.createElement('div');

    overlay.style.cssText = `
        position:fixed;
        inset:0;
        z-index:999999;
        background:#090b12;
        display:flex;
        align-items:center;
        justify-content:center;
        flex-direction:column;
        color:white;
        font-family:Arial,sans-serif;
        gap:12px;
        text-align:center;
        padding:20px;
    `;

    overlay.innerHTML = `
        <h2 style="color:#f5bd45;margin:0">
            LOSE HALF LEAGUE
        </h2>
        <p>MEMERIKSA AKSES ADMIN...</p>
    `;

    document.body.appendChild(overlay);

    return overlay;
}

// ==========================================
// LOGOUT BUTTON
// ==========================================

function addLogoutButton() {
    const header = document.querySelector('.admin-header');

    if (!header || document.getElementById('adminLogout')) {
        return;
    }

    const button = document.createElement('button');

    button.id = 'adminLogout';
    button.type = 'button';
    button.textContent = 'LOGOUT';

    button.style.cssText = `
        margin-top:15px;
        padding:10px 20px;
        border:1px solid #eab135;
        border-radius:7px;
        background:#11151f;
        color:#f5bd45;
        font-weight:bold;
        cursor:pointer;
    `;

    button.addEventListener('click', async () => {
        if (!confirm('Yakin ingin keluar dari admin?')) return;

        button.disabled = true;
        button.textContent = 'LOGGING OUT...';

        const { error } = await db.auth.signOut();

        if (error) {
            console.error('[ADMIN LOGOUT]', error);
            alert('Gagal logout. Silakan coba lagi.');
            button.disabled = false;
            button.textContent = 'LOGOUT';
            return;
        }

        window.location.replace('admin-login.html');
    });

    header.appendChild(button);
}

// ==========================================
// VERIFY ADMIN ACCESS
// ==========================================

async function verifyAdminAccess() {
    if (isLoginPage) {
        releaseAdminGate(true);
        return true;
    }

    const loader = createAdminLoader();

    try {
        const { data: sessionData, error: sessionError } =
            await db.auth.getSession();

        if (sessionError) {
            throw sessionError;
        }

        const session = sessionData?.session;

        if (!session) {
            releaseAdminGate(false);

            window.location.replace('admin-login.html');
            return false;
        }

        // Memeriksa apakah UID terdaftar sebagai admin
        const { data: isAdmin, error: adminError } =
            await db.rpc('is_admin');

        if (adminError) {
            throw adminError;
        }

        if (isAdmin !== true) {
            await db.auth.signOut();

            releaseAdminGate(false);

            window.location.replace(
                'admin-login.html?error=not-admin'
            );

            return false;
        }

        // Akses berhasil
        window.currentAdmin = session.user;

        releaseAdminGate(true);

        addLogoutButton();

        loader.remove();

        console.log(
            '[ADMIN] Access verified:',
            session.user.email
        );

        return true;

    } catch (error) {
        console.error('[ADMIN AUTH]', error);

        releaseAdminGate(false);

        loader.innerHTML = `
            <h2 style="color:#eab135">ADMIN VERIFICATION FAILED</h2>
            <p style="max-width:500px">
                Tidak dapat memverifikasi akses admin.
                Periksa koneksi dan fungsi is_admin di Supabase.
            </p>
            <button
                onclick="location.reload()"
                style="padding:12px 20px;cursor:pointer"
            >
                COBA LAGI
            </button>
            <a
                href="admin-login.html"
                style="color:#f5bd45;margin-top:10px"
            >
                KEMBALI KE LOGIN
            </a>
        `;

        return false;
    }
}

// ==========================================
// START ADMIN SECURITY CHECK
// ==========================================

window.adminReady = verifyAdminAccess();

console.log('Lose Half League Admin Connected');
