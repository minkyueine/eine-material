// ═══════════════════════════════════════════════════════════════
//  아인잉글리쉬 교재방 — Supabase 설정
//
//  아래 두 값을 Supabase 대시보드에서 복사해 붙여넣으세요.
//  Settings → API → Project URL / anon public key
// ═══════════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://fykvnycsugwqxtzcjsvn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_r2tJKqZMzJio2uvheaUscA_cjyNjM5J';

// ── Supabase 클라이언트 초기화 ──────────────────────────────
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── 공통 DB 함수 ────────────────────────────────────────────

// 전체 계정 목록 조회
async function sbGetAllAccounts() {
    const { data, error } = await sb.from('accounts').select('*').order('created_at');
    if (error) { console.error('Supabase 조회 오류:', error.message); return []; }
    return data.map(r => ({
        id: r.user_id,
        pw: r.pw,
        name: r.name,
        role: r.role,
        avatar: r.avatar,
        isDefault: r.is_default
    }));
}

// 로그인 검증 (아이디 + 비밀번호 일치 확인)
async function sbLogin(userId, pw) {
    const { data, error } = await sb.from('accounts').select('*')
        .eq('user_id', userId).eq('pw', pw).maybeSingle();
    if (error || !data) return null;
    return { id: data.user_id, pw: data.pw, name: data.name, role: data.role, avatar: data.avatar };
}

// 아이디 중복 확인
async function sbCheckExists(userId) {
    const { data } = await sb.from('accounts').select('user_id').eq('user_id', userId);
    return data && data.length > 0;
}

// 계정 추가
async function sbAddAccount(userId, pw, name, role, avatar) {
    const { error } = await sb.from('accounts')
        .insert({ user_id: userId, pw, name, role, avatar });
    if (error) throw new Error(error.message);
}

// 계정 삭제 (기본 계정은 RLS에서 보호됨)
async function sbDeleteAccount(userId) {
    const { error } = await sb.from('accounts')
        .delete().eq('user_id', userId);
    if (error) throw new Error(error.message);
}

// 추가 계정 전체 삭제 (기본 계정은 RLS에서 보호됨)
async function sbResetCustom() {
    const { data, error } = await sb.from('accounts')
        .delete().eq('is_default', false).select();
    if (error) throw new Error(error.message);
    return data ? data.length : 0;
}
