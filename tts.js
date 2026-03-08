/**
 * EIN English — TTS (Text-to-Speech) Script
 * 교재 내 영어 표현 옆에 🔊 버튼을 자동으로 삽입합니다.
 * Web Speech API 기반 (브라우저 내장, 무료)
 * 추후 OpenAI TTS / ElevenLabs API로 교체 가능한 구조입니다.
 */

(function () {
    'use strict';

    /* ── 설정 ─────────────────────────────────────────────── */
    const CONFIG = {
        lang: 'en-US',
        rate: 0.88,      // 읽기 속도 (0.5~2.0, 수업용으로 약간 느리게)
        pitch: 1.0,
        volume: 1.0,

        // AI TTS 연동 (추후 활성화)
        // aiProvider: 'openai',   // 'openai' | 'elevenlabs' | null
        // aiApiKey: '',
        // aiVoice: 'nova',        // OpenAI: alloy, echo, fable, onyx, nova, shimmer
    };

    /* ── TTS 버튼 스타일 ────────────────────────────────────── */
    const style = document.createElement('style');
    style.textContent = `
        .tts-wrap {
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .tts-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: rgba(5,150,105,0.12);
            color: #059669;
            border: none;
            cursor: pointer;
            font-size: 13px;
            flex-shrink: 0;
            transition: background 0.15s, transform 0.1s;
            vertical-align: middle;
        }
        .tts-btn:hover {
            background: rgba(5,150,105,0.25);
            transform: scale(1.12);
        }
        .tts-btn.is-playing {
            background: #059669;
            color: #fff;
            animation: tts-pulse 0.8s infinite;
        }
        @keyframes tts-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.15); }
        }

        /* 상단 TTS 컨트롤 바 */
        #tts-control-bar {
            position: fixed;
            bottom: 1.25rem;
            right: 1.25rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: #1e3a8a;
            color: #fff;
            border-radius: 100px;
            padding: 0.5rem 1rem;
            font-size: 0.8rem;
            font-weight: 600;
            box-shadow: 0 4px 20px rgba(0,0,0,0.25);
            z-index: 9999;
            cursor: default;
            opacity: 0;
            transform: translateY(8px);
            transition: opacity 0.2s, transform 0.2s;
            pointer-events: none;
        }
        #tts-control-bar.visible {
            opacity: 1;
            transform: translateY(0);
            pointer-events: auto;
        }
        #tts-stop-btn {
            width: 22px; height: 22px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            border: none;
            color: #fff;
            font-size: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #tts-stop-btn:hover { background: rgba(255,255,255,0.35); }

        /* 속도 조절 */
        #tts-rate-wrap {
            position: fixed;
            bottom: 1.25rem;
            left: 1.25rem;
            background: #fff;
            border: 1.5px solid #e2e8f0;
            border-radius: 100px;
            padding: 0.4rem 0.875rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.78rem;
            font-weight: 600;
            color: #475569;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
            z-index: 9999;
        }
        #tts-rate-wrap label { font-size: 0.75rem; color: #64748b; }
        #tts-rate-input { width: 80px; accent-color: #059669; }
        #tts-rate-val { min-width: 2.2rem; color: #059669; font-weight: 700; }

        /* 뒤로가기 바 */
        #tts-back-bar {
            position: sticky;
            top: 0;
            z-index: 9998;
            background: #1e3a8a;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.6rem 1.25rem;
            font-size: 0.82rem;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        #tts-back-bar a {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            color: #fff;
            text-decoration: none;
            opacity: 0.9;
            transition: opacity 0.15s;
        }
        #tts-back-bar a:hover { opacity: 1; }
        #tts-back-bar .tts-back-sep {
            width: 1px; height: 1rem;
            background: rgba(255,255,255,0.25);
        }
        #tts-back-bar .tts-back-lesson {
            font-size: 0.78rem;
            color: rgba(255,255,255,0.7);
        }

        /* ── 레슨 페이지 모바일 반응형 ── */
        @media screen and (max-width: 840px) {
            body { background: #fff !important; }
            .a4-page, .page {
                width: 100% !important;
                min-height: auto !important;
                height: auto !important;
                padding: 1.5rem 1.25rem !important;
                margin: 0 !important;
                box-shadow: none !important;
                border-bottom: 2px solid #eee;
                page-break-after: auto;
            }
            h1 { font-size: 1.5rem !important; }
            h2 { font-size: 1.25rem !important; }
            h3 { font-size: 1.05rem !important; }
            .content-box { margin-bottom: 1.25rem; }
            .role-play-box { padding: 0.875rem !important; border-radius: 8px !important; }
            .korean-sub { font-size: 0.78rem; }
            .footer { font-size: 0.6rem !important; padding-top: 0.75rem; }
            table { font-size: 0.85rem; }
            th, td { padding: 0.5rem 0.625rem !important; }
            #tts-rate-wrap { bottom: 0.5rem; left: 0.5rem; padding: 0.3rem 0.5rem; font-size: 0.7rem; border-radius: 0.5rem; }
            #tts-rate-input { width: 55px; }
            #tts-control-bar { bottom: 0.5rem; right: 0.5rem; padding: 0.35rem 0.625rem; font-size: 0.72rem; }
            #tts-back-bar { font-size: 0.75rem; padding: 0.5rem 0.875rem; gap: 0.5rem; }
        }
        @media screen and (max-width: 480px) {
            .a4-page, .page {
                padding: 1.125rem 0.875rem !important;
            }
            h1 { font-size: 1.25rem !important; }
            .content-box { padding-left: 10px; }
            .korean-sub { font-size: 0.72rem; }
            .footer { font-size: 0.55rem !important; }
            table { font-size: 0.78rem; }
            th, td { padding: 0.375rem 0.5rem !important; }
            #tts-rate-wrap { bottom: 0.4rem; left: 0.4rem; padding: 0.25rem 0.4rem; font-size: 0.65rem; }
            #tts-rate-input { width: 48px; }
            #tts-control-bar { bottom: 0.4rem; right: 0.4rem; font-size: 0.68rem; padding: 0.3rem 0.5rem; }
            #tts-back-bar { font-size: 0.7rem; padding: 0.4rem 0.65rem; }
        }
    `;
    document.head.appendChild(style);

    /* ── 상태 ──────────────────────────────────────────────── */
    let currentBtn = null;
    let synth = window.speechSynthesis;
    let rate = CONFIG.rate;

    /* ── 컨트롤 바 ─────────────────────────────────────────── */
    const bar = document.createElement('div');
    bar.id = 'tts-control-bar';
    bar.innerHTML = `
        <span>🔊</span>
        <span id="tts-bar-text">읽는 중...</span>
        <button id="tts-stop-btn" title="정지">■</button>
    `;
    document.body.appendChild(bar);

    document.getElementById('tts-stop-btn').onclick = stopTTS;

    /* ── 속도 조절 바 ──────────────────────────────────────── */
    const rateWrap = document.createElement('div');
    rateWrap.id = 'tts-rate-wrap';
    rateWrap.innerHTML = `
        <label>속도</label>
        <input id="tts-rate-input" type="range" min="0.5" max="1.5" step="0.1" value="${rate}">
        <span id="tts-rate-val">${rate}x</span>
    `;
    document.body.appendChild(rateWrap);

    document.getElementById('tts-rate-input').oninput = function () {
        rate = parseFloat(this.value);
        document.getElementById('tts-rate-val').textContent = rate.toFixed(1) + 'x';
    };

    /* ── 뒤로가기 바 ────────────────────────────────────────── */
    function addBackNav() {
        const backBar = document.createElement('div');
        backBar.id = 'tts-back-bar';

        // 현재 파일명에서 Week 번호 추출
        const pathParts = location.pathname.split('/');
        const fileName = decodeURIComponent(pathParts[pathParts.length - 1] || '');
        const weekMatch = fileName.match(/WEEK\s*(\d+)/i);
        const weekLabel = weekMatch ? `Week ${weekMatch[1]}` : '';

        backBar.innerHTML = `
            <a href="../index.html">&#8592; 교재방으로</a>
            ${weekLabel ? `<span class="tts-back-sep"></span><span class="tts-back-lesson">${weekLabel}</span>` : ''}
        `;
        document.body.insertBefore(backBar, document.body.firstChild);
    }

    /* ── 레슨 앵커 ID 삽입 ───────────────────────────────────── */
    function addLessonAnchors() {
        // "Week X / Lesson Y" 또는 "Lesson XX" 배지를 찾아 가장 가까운 .a4-page에 id 부여
        // 두 형식 모두 전역 레슨 번호(1~40) 사용
        document.querySelectorAll('.navy-bg').forEach(el => {
            const text = el.textContent.trim();
            const m = text.match(/^(?:Week\s*\d+\s*\/\s*)?Lesson\s*0*(\d+)$/i);
            if (!m) return;
            const lessonNum = parseInt(m[1], 10);
            const page = el.closest('.a4-page') || el.closest('.page');
            if (page && !page.id) {
                page.id = `lesson-${lessonNum}`;
            }
        });
    }

    /* ── 메인: TTS 버튼 자동 삽입 ───────────────────────────── */
    function init() {
        addBackNav();
        addLessonAnchors();
        // ── 신규 커스텀 CSS 교재 (Starter / Daily / Opinion / Debate) ──
        attachToEngText();
        attachToDialogueNew();
        attachToModernTableTd();
        attachToGuidedListStrong();
        // ── 구형 Tailwind 교재 (Travel / Working / Job / Workplace 등) ──
        attachToDialogue();
        attachToKeyExpressions();
        attachToGuidedPractice();
        attachToWarmup();
    }

    /**
     * [신규] 영어 문장 — .eng-text 요소
     * 내부에 .kor-sub-text 가 있을 수 있으므로 텍스트 노드만 추출
     */
    function attachToEngText() {
        document.querySelectorAll('.eng-text').forEach(el => {
            const text = getTextNodesOnly(el);
            if (!text || !isEnglish(text)) return;
            wrapWithTTS(el, text);
        });
    }

    /**
     * [신규] 대화문 — .d-row .text
     * <span class="kor-sub-text"> 제외하고 영어 텍스트만 추출
     */
    function attachToDialogueNew() {
        document.querySelectorAll('.d-row .text').forEach(el => {
            const text = getTextNodesOnly(el);
            if (!text || !isEnglish(text)) return;
            wrapWithTTS(el, text);
        });
    }

    /**
     * [신규] 롤플레이 테이블 — .modern-table td
     */
    function attachToModernTableTd() {
        document.querySelectorAll('.modern-table td').forEach(el => {
            const text = getTextNodesOnly(el);
            if (!text || !isEnglish(text)) return;
            wrapWithTTS(el, text, 'append');
        });
    }

    /**
     * [신규] 유도 연습 — ol.guided-list li strong
     */
    function attachToGuidedListStrong() {
        document.querySelectorAll('ol.guided-list li strong').forEach(el => {
            const text = el.textContent.trim();
            if (!text || !isEnglish(text)) return;
            wrapWithTTS(el, text, 'append');
        });
    }

    /**
     * [구형] 대화문 — <p class="font-semibold"> 안의 영어 텍스트
     */
    function attachToDialogue() {
        document.querySelectorAll('p.font-semibold').forEach(p => {
            const text = p.childNodes[0]?.textContent?.trim();
            if (!text || !isEnglish(text)) return;
            wrapWithTTS(p, text);
        });
    }

    /**
     * [구형] 핵심 표현 — Key Expressions 섹션의 <li> 항목
     */
    function attachToKeyExpressions() {
        document.querySelectorAll('li').forEach(li => {
            const raw = li.childNodes[0]?.textContent?.trim();
            if (!raw || !isEnglish(raw)) return;
            // "• " 제거
            const text = raw.replace(/^[•\-]\s*/, '').trim();
            if (!text) return;
            wrapWithTTS(li, text, 'append');
        });
    }

    /**
     * [구형] 연습 문장 — Guided Practice의 파란색 텍스트
     */
    function attachToGuidedPractice() {
        document.querySelectorAll('p.text-blue-700, p.text-lg.font-bold').forEach(p => {
            // 따옴표 제거
            const text = p.textContent.trim().replace(/^[""]|[""]$/g, '').trim();
            if (!text || !isEnglish(text)) return;
            wrapWithTTS(p, text);
        });
    }

    /**
     * [구형] Warm-up 질문
     */
    function attachToWarmup() {
        document.querySelectorAll('.space-y-4 li > div, .space-y-4 li').forEach(el => {
            const firstNode = el.childNodes[0]?.textContent?.trim();
            if (!firstNode || !isEnglish(firstNode)) return;
            wrapWithTTS(el, firstNode, 'append');
        });
    }

    /**
     * 유틸: 한국어 자식 요소(.kor-sub-text, .kor-text, .role-tag)를 제외한
     * 텍스트 노드만 합쳐서 반환
     */
    function getTextNodesOnly(el) {
        let text = '';
        el.childNodes.forEach(node => {
            if (node.nodeType === 3) {
                text += node.textContent;
            } else if (node.nodeType === 1) {
                const cls = node.className || '';
                // 한국어 서브텍스트·태그 제외
                if (/kor-sub-text|kor-text|role-tag/.test(cls)) return;
                // highlight 등 인라인 강조 태그는 포함
                text += node.textContent;
            }
        });
        return text.trim();
    }

    /* ── 유틸: 영어 텍스트인지 판별 ──────────────────────────── */
    function isEnglish(text) {
        if (!text || text.length < 3) return false;
        // 영문자 비율이 40% 이상이면 영어로 판단
        const engChars = (text.match(/[a-zA-Z]/g) || []).length;
        return engChars / text.length > 0.4;
    }

    /* ── 유틸: TTS 버튼 삽입 ─────────────────────────────────── */
    function wrapWithTTS(el, text, mode = 'prepend') {
        // 이미 버튼 있으면 중복 삽입 방지
        if (el.querySelector('.tts-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'tts-btn';
        btn.title = '영어로 듣기';
        btn.textContent = '🔊';
        btn.setAttribute('data-text', text);
        btn.onclick = function (e) {
            e.stopPropagation();
            speakText(text, btn);
        };

        if (mode === 'append') {
            el.appendChild(btn);
        } else {
            // 첫 번째 텍스트 노드 뒤에 삽입
            const firstText = el.childNodes[0];
            if (firstText) {
                el.insertBefore(btn, firstText.nextSibling);
            } else {
                el.appendChild(btn);
            }
        }
    }

    /* ── TTS 실행 ────────────────────────────────────────────── */
    function speakText(text, btn) {
        if (!synth) {
            alert('이 브라우저는 음성 재생을 지원하지 않습니다.');
            return;
        }

        // 이미 같은 버튼 클릭 → 정지
        if (btn === currentBtn && synth.speaking) {
            stopTTS();
            return;
        }

        stopTTS();

        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = CONFIG.lang;
        utter.rate = rate;
        utter.pitch = CONFIG.pitch;
        utter.volume = CONFIG.volume;

        // 영어 음성 선택 (가능하면)
        const voices = synth.getVoices();
        const enVoice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google'))
            || voices.find(v => v.lang.startsWith('en'));
        if (enVoice) utter.voice = enVoice;

        utter.onstart = () => {
            currentBtn = btn;
            btn.classList.add('is-playing');
            btn.textContent = '⏸';
            showBar(text);
        };

        utter.onend = utter.onerror = () => {
            clearBtn(btn);
            hideBar();
        };

        synth.speak(utter);
    }

    function stopTTS() {
        synth.cancel();
        if (currentBtn) {
            clearBtn(currentBtn);
        }
        hideBar();
    }

    function clearBtn(btn) {
        btn.classList.remove('is-playing');
        btn.textContent = '🔊';
        currentBtn = null;
    }

    function showBar(text) {
        const label = text.length > 30 ? text.slice(0, 30) + '…' : text;
        document.getElementById('tts-bar-text').textContent = label;
        bar.classList.add('visible');
    }

    function hideBar() {
        bar.classList.remove('visible');
    }

    /* ── 음성 로드 후 실행 ────────────────────────────────────── */
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = () => {};
    }

    // DOM 준비 후 버튼 삽입
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
