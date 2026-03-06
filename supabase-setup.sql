-- ═══════════════════════════════════════════════════════════════
--  아인잉글리쉬 교재방 — Supabase 테이블 설정
--
--  사용법:
--  1. supabase.com 접속 → 새 프로젝트 생성
--  2. 왼쪽 메뉴 "SQL Editor" 클릭
--  3. 이 파일 내용 전체를 복사 → 붙여넣기 → "Run" 클릭
-- ═══════════════════════════════════════════════════════════════

-- 1) 계정 테이블 생성
CREATE TABLE accounts (
    id          BIGSERIAL PRIMARY KEY,
    user_id     TEXT UNIQUE NOT NULL,
    pw          TEXT NOT NULL,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT '수강생',
    avatar      TEXT DEFAULT '👤',
    is_default  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2) 기본 계정 3개 삽입 (데모용)
INSERT INTO accounts (user_id, pw, name, role, avatar, is_default) VALUES
    ('teacher01', 'demo1234', '김영어 강사', '강사',   '👩‍🏫', TRUE),
    ('student01', 'demo1234', '박지민 학생', '수강생', '👦',   TRUE),
    ('admin01',   'demo1234', '관리자',      '관리자', '🛠',   TRUE);

-- 3) Row Level Security (보안 정책)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- 읽기: 로그인 검증을 위해 누구나 조회 가능
CREATE POLICY "allow_select" ON accounts
    FOR SELECT TO anon USING (true);

-- 삽입: 관리자가 새 계정 추가 가능
CREATE POLICY "allow_insert" ON accounts
    FOR INSERT TO anon WITH CHECK (true);

-- 삭제: 기본 계정(is_default=TRUE)은 삭제 불가
CREATE POLICY "allow_delete" ON accounts
    FOR DELETE TO anon USING (is_default = FALSE);
