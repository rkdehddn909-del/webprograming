// ════════════════════════════════════════════
// AUTH HELPERS (인증 관리)
// ════════════════════════════════════════════
const USERS_KEY = 'ai_hub_users';
const SESSION_KEY = 'ai_hub_session';

function getUsers() {
    try {
        const raw = localStorage.getItem(USERS_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return (typeof parsed === 'object' && parsed !== null) ? parsed : {};
    } catch { return {}; }
}
function saveUsers(u) {
    localStorage.setItem(USERS_KEY, JSON.stringify(u));
}

function getCurrentUser() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const p = JSON.parse(raw);
        return (typeof p === 'object' && p !== null && p.username) ? p : null;
    } catch { return null; }
}
function setCurrentUser(obj) { localStorage.setItem(SESSION_KEY, JSON.stringify(obj)); }
function clearCurrentUser() { localStorage.removeItem(SESSION_KEY); }

// 회원가입 완료 모달 알림
function showSuccessModal(nickname, callback) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease`;
    overlay.innerHTML = `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:2.5em 2em;text-align:center;max-width:340px;width:90%;animation:popIn 0.25s ease">
            <div style="font-size:3em;margin-bottom:0.3em">🎉</div>
            <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:0.4em;color:var(--accent2)">회원가입 완료!</h3>
            <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:1.5em"><strong style="color:var(--text)">${nickname}</strong>님, 환영합니다!<br>이제 로그인해 주세요.</p>
            <button onclick="this.closest('div[style*=fixed]').remove();${callback ? callback+'()' : ''}" style="background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;border-radius:10px;color:white;padding:0.6em 2em;font-size:0.95rem;font-weight:600;cursor:pointer;font-family:inherit">확인</button>
        </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); if (callback) window[callback](); } });
}

function handleLogout() {
    clearCurrentUser();
    chatbotInitialized = false;
    updateHeaderUser();
    showToast('로그아웃 되었습니다.');
    navigate('login');
}

// ════════════════════════════════════════════
// AUTH UI & ACTIONS
// ════════════════════════════════════════════
function renderLogin(activeTab = 'login') {
    const inner = document.getElementById('page-login-inner');
    inner.innerHTML = `
        <div style="min-height:calc(100vh - 110px);display:flex;align-items:center;justify-content:center;padding:2em;">
            <div class="auth-container">
                <h2>👋 환영합니다!</h2>
                <p class="sub">AI 허브에 로그인하거나 새 계정을 만드세요.</p>
                <div class="auth-tabs">
                    <button class="auth-tab ${activeTab==='login'?'active':''}" id="tab-login" onclick="renderLogin('login')">로그인</button>
                    <button class="auth-tab ${activeTab==='register'?'active':''}" id="tab-register" onclick="renderLogin('register')">회원가입</button>
                </div>
                ${activeTab === 'login' ? `
                <div id="form-login">
                    <div class="form-group">
                        <label>아이디</label>
                        <input type="text" id="login-id" placeholder="아이디를 입력하세요" autocomplete="username">
                    </div>
                    <div class="form-group">
                        <label>비밀번호</label>
                        <input type="password" id="login-pw" placeholder="비밀번호를 입력하세요" autocomplete="current-password">
                    </div>
                    <button class="auth-submit" onclick="doLogin()">로그인</button>
                    <div class="auth-msg" id="login-msg"></div>
                </div>` : `
                <div id="form-register">
                    <div class="form-group">
                        <label>아이디</label>
                        <input type="text" id="reg-id" placeholder="사용할 아이디 (4자 이상)" autocomplete="username">
                    </div>
                    <div class="form-group">
                        <label>닉네임</label>
                        <input type="text" id="reg-nick" placeholder="표시될 이름">
                    </div>
                    <div class="form-group">
                        <label>비밀번호</label>
                        <input type="password" id="reg-pw" placeholder="비밀번호 (6자 이상)" autocomplete="new-password">
                    </div>
                    <div class="form-group">
                        <label>비밀번호 확인</label>
                        <input type="password" id="reg-pw2" placeholder="비밀번호를 다시 입력하세요" autocomplete="new-password">
                    </div>
                    <button class="auth-submit" onclick="doRegister()">회원가입</button>
                    <div class="auth-msg" id="reg-msg"></div>
                </div>`}
            </div>
        </div>`;

    setTimeout(() => {
        const firstInput = inner.querySelector('input');
        if (firstInput) firstInput.focus();
        inner.querySelectorAll('input').forEach(inp => {
            inp.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    activeTab === 'login' ? doLogin() : doRegister();
                }
            });
        });
    }, 0);
}

function doLogin() {
    const id = (document.getElementById('login-id')?.value || '').trim();
    const pw = document.getElementById('login-pw')?.value || '';
    const msg = document.getElementById('login-msg');
    if (!id || !pw) { msg.className = 'auth-msg error'; msg.textContent = '아이디와 비밀번호를 입력해주세요.'; return; }
    const users = getUsers();
    if (!users[id]) { msg.className = 'auth-msg error'; msg.textContent = '존재하지 않는 아이디입니다.'; return; }
    if (users[id].password !== pw) { msg.className = 'auth-msg error'; msg.textContent = '비밀번호가 틀렸습니다.'; return; }
    setCurrentUser({ username: id, nickname: users[id].nickname || id });
    msg.className = 'auth-msg success'; msg.textContent = '로그인 성공! 🎉';
    updateHeaderUser();
    setTimeout(() => navigate('home'), 700);
}

function doRegister() {
    const id = (document.getElementById('reg-id')?.value || '').trim();
    const nick = (document.getElementById('reg-nick')?.value || '').trim();
    const pw = document.getElementById('reg-pw')?.value || '';
    const pw2 = document.getElementById('reg-pw2')?.value || '';
    const msg = document.getElementById('reg-msg');
    if (!id || !nick || !pw || !pw2) { msg.className = 'auth-msg error'; msg.textContent = '모든 항목을 입력해주세요.'; return; }
    if (id.length < 4) { msg.className = 'auth-msg error'; msg.textContent = '아이디는 4자 이상이어야 합니다.'; return; }
    if (pw.length < 6) { msg.className = 'auth-msg error'; msg.textContent = '비밀번호는 6자 이상이어야 합니다.'; return; }
    if (pw !== pw2) { msg.className = 'auth-msg error'; msg.textContent = '비밀번호가 일치하지 않습니다.'; return; }
    const users = getUsers();
    if (users[id]) { msg.className = 'auth-msg error'; msg.textContent = '이미 존재하는 아이디입니다.'; return; }
    users[id] = { password: pw, nickname: nick };
    saveUsers(users);
    showSuccessModal(nick, 'goToLogin');
}

function goToLogin() { renderLogin('login'); }

function updateHeaderUser() {
    const user = getCurrentUser();
    const area = document.getElementById('headerUserArea');
    const navLogin = document.getElementById('nav-login');
    if (user) {
        area.innerHTML = `<span>👋 <span class="user-name">${user.nickname || user.username}</span>님</span>
            <button class="logout-btn" onclick="handleLogout()">로그아웃</button>`;
        navLogin.style.display = 'none';
    } else {
        area.innerHTML = '';
        navLogin.style.display = '';
    }
}

// ════════════════════════════════════════════
// NAVIGATION ENGINE (페이지 전환)
// ════════════════════════════════════════════
let currentPage = 'home';

function navigate(page) {
    document.querySelectorAll('.page').forEach(p => {
        p.style.display = 'none';
        p.classList.remove('active');
    });
    const target = document.getElementById('page-' + page);
    if (!target) return;
    target.classList.add('active');
    if (page === 'chatbot') {
        target.style.display = 'flex';
    } else {
        target.style.display = 'block';
    }
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    const navEl = document.getElementById('nav-' + page);
    if (navEl) navEl.classList.add('active');

    currentPage = page;

    if (page === 'home') renderHome();
    if (page === 'login') renderLogin();
    if (page === 'vscode') renderVSCode();
    if (page === 'recommend') renderRecommend();
    if (page === 'chatbot') renderChatbot();
}

// ════════════════════════════════════════════
// HOME PAGE RENDER
// ════════════════════════════════════════════
function renderHome() {
    const user = getCurrentUser();
    const inner = document.getElementById('page-home-inner');

    const heroName = user ? `${user.nickname || user.username}님, ` : '';
    inner.innerHTML = `
        <div class="home-hero">
            <div class="emoji">🚀</div>
            <h2>${heroName}AI 허브에 오신 걸 환영합니다!</h2>
            <p>AI 도구 추천, VS Code 단축키, AI 챗봇까지<br>개발자와 크리에이터를 위한 모든 것이 여기 있습니다.</p>
        </div>
        <div class="home-cards">
            <div class="home-card" onclick="navigate('recommend')">
                <div class="icon">🌟</div>
                <h3>AI 도구 추천</h3>
                <p>코딩·이미지·동영상·음악 등 목적별 최고의 AI 도구를 찾아보세요.</p>
            </div>
            <div class="home-card" onclick="navigate('vscode')">
                <div class="icon">⌨️</div>
                <h3>VS Code 단축키</h3>
                <p>Windows·macOS별 필수 단축키를 검색하고 생산성을 높이세요.</p>
            </div>
            <div class="home-card" onclick="navigate('chatbot')">
                <div class="icon">💬</div>
                <h3>AI 챗봇</h3>
                <p>원하는 작업을 입력하면 딱 맞는 AI 도구를 추천받을 수 있어요.</p>
            </div>
        </div>
        ${!user ? `<div class="home-locked">
            <div style="font-size:2em;margin-bottom:0.4em">🔒</div>
            <h3>로그인하면 더 많은 기능을 이용할 수 있어요</h3>
            <p>챗봇 이용, 맞춤 AI 추천 등 다양한 기능이 기다립니다.</p>
            <button onclick="navigate('login')">로그인 / 회원가입</button>
        </div>` : ''}
    `;
}

// ════════════════════════════════════════════
// VS CODE SHORTCUTS DATA & LOGIC
// ════════════════════════════════════════════
let currentOS = 'win';

const SHORTCUTS = [
    { cat: "기본 편집", desc: "저장", win: ["Ctrl","S"], mac: ["⌘","S"] },
    { cat: "기본 편집", desc: "모두 저장", win: ["Ctrl","K","S"], mac: ["⌘","Option","S"] },
    { cat: "기본 편집", desc: "실행 취소", win: ["Ctrl","Z"], mac: ["⌘","Z"] },
    { cat: "기본 편집", desc: "다시 실행", win: ["Ctrl","Y"], mac: ["⌘","Shift","Z"] },
    { cat: "기본 편집", desc: "복사", win: ["Ctrl","C"], mac: ["⌘","C"] },
    { cat: "기본 편집", desc: "잘라내기", win: ["Ctrl","X"], mac: ["⌘","X"] },
    { cat: "기본 편집", desc: "붙여넣기", win: ["Ctrl","V"], mac: ["⌘","V"] },
    { cat: "기본 편집", desc: "전체 선택", win: ["Ctrl","A"], mac: ["⌘","A"] },
    { cat: "기본 편집", desc: "줄 삭제", win: ["Ctrl","Shift","K"], mac: ["⌘","Shift","K"] },
    { cat: "기본 편집", desc: "줄 이동 (위/아래)", win: ["Alt","↑/↓"], mac: ["Option","↑/↓"] },
    { cat: "기본 편집", desc: "줄 복사 (위/아래)", win: ["Shift","Alt","↑/↓"], mac: ["⌘","Shift","Alt","↑/↓"] },
    { cat: "기본 편집", desc: "들여쓰기", win: ["Tab"], mac: ["Tab"] },
    { cat: "기본 편집", desc: "내어쓰기", win: ["Shift","Tab"], mac: ["Shift","Tab"] },
    { cat: "기본 편집", desc: "주석 토글", win: ["Ctrl","/"], mac: ["⌘","/"] },
    { cat: "기본 편집", desc: "블록 주석", win: ["Shift","Alt","A"], mac: ["Shift","Option","A"] },
    { cat: "기본 편집", desc: "코드 서식 정렬", win: ["Shift","Alt","F"], mac: ["Shift","Option","F"] },
    { cat: "기본 편집", desc: "단어 단위 삭제 (앞)", win: ["Ctrl","Delete"], mac: ["Option","Delete"] },
    { cat: "기본 편집", desc: "단어 단위 삭제 (뒤)", win: ["Ctrl","Backspace"], mac: ["Option","Backspace"] },
    { cat: "검색 & 탐색", desc: "찾기", win: ["Ctrl","F"], mac: ["⌘","F"] },
    { cat: "검색 & 탐색", desc: "바꾸기", win: ["Ctrl","H"], mac: ["⌘","H"] },
    { cat: "검색 & 탐색", desc: "파일에서 찾기", win: ["Ctrl","Shift","F"], mac: ["⌘","Shift","F"] },
    { cat: "검색 & 탐색", desc: "파일에서 바꾸기", win: ["Ctrl","Shift","H"], mac: ["⌘","Shift","H"] },
    { cat: "검색 & 탐색", desc: "빠른 파일 열기", win: ["Ctrl","P"], mac: ["⌘","P"] },
    { cat: "검색 & 탐색", desc: "모든 명령 팔레트", win: ["Ctrl","Shift","P"], mac: ["⌘","Shift","P"] },
    { cat: "검색 & 탐색", desc: "줄 번호로 이동", win: ["Ctrl","G"], mac: ["⌘","G"] },
    { cat: "검색 & 탐색", desc: "심볼 검색", win: ["Ctrl","T"], mac: ["⌘","T"] },
    { cat: "검색 & 탐색", desc: "정의로 이동", win: ["F12"], mac: ["F12"] },
    { cat: "검색 & 탐색", desc: "참조 모두 찾기", win: ["Shift","F12"], mac: ["Shift","F12"] },
    { cat: "검색 & 탐색", desc: "이름 바꾸기 (리팩토링)", win: ["F2"], mac: ["F2"] },
    { cat: "검색 & 탐색", desc: "같은 단어 모두 선택", win: ["Ctrl","Shift","L"], mac: ["⌘","Shift","L"] },
    { cat: "검색 & 탐색", desc: "다음 같은 단어 선택", win: ["Ctrl","D"], mac: ["⌘","D"] },
    { cat: "뷰 & 패널", desc: "사이드바 토글", win: ["Ctrl","B"], mac: ["⌘","B"] },
    { cat: "뷰 & 패널", desc: "터미널 토글", win: ["Ctrl","`"], mac: ["⌃","`"] },
    { cat: "뷰 & 패널", desc: "새 터미널", win: ["Ctrl","Shift","`"], mac: ["⌃","Shift","`"] },
    { cat: "뷰 & 패널", desc: "탐색기 열기", win: ["Ctrl","Shift","E"], mac: ["⌘","Shift","E"] },
    { cat: "뷰 & 패널", desc: "소스 제어 열기", win: ["Ctrl","Shift","G"], mac: ["⌘","Shift","G"] },
    { cat: "뷰 & 패널", desc: "디버그 패널 열기", win: ["Ctrl","Shift","D"], mac: ["⌘","Shift","D"] },
    { cat: "뷰 & 패널", desc: "확장 마켓플레이스", win: ["Ctrl","Shift","X"], mac: ["⌘","Shift","X"] },
    { cat: "뷰 & 패널", desc: "설정 열기", win: ["Ctrl",","], mac: ["⌘",","] },
    { cat: "뷰 & 패널", desc: "키보드 단축키 설정", win: ["Ctrl","K","Ctrl","S"], mac: ["⌘","K","⌘","S"] },
    { cat: "뷰 & 패널", desc: "확대", win: ["Ctrl","="], mac: ["⌘","="] },
    { cat: "뷰 & 패널", desc: "축소", win: ["Ctrl","-"], mac: ["⌘","-"] },
    { cat: "뷰 & 패널", desc: "미니맵 토글", win: ["Ctrl","K","Ctrl","M"], mac: ["⌘","K","⌘","M"] },
    { cat: "뷰 & 패널", desc: "줄바꿈 토글", win: ["Alt","Z"], mac: ["Option","Z"] },
    { cat: "탭 & 파일", desc: "새 파일", win: ["Ctrl","N"], mac: ["⌘","N"] },
    { cat: "탭 & 파일", desc: "파일 닫기", win: ["Ctrl","W"], mac: ["⌘","W"] },
    { cat: "탭 & 파일", desc: "모든 탭 닫기", win: ["Ctrl","K","W"], mac: ["⌘","K","W"] },
    { cat: "탭 & 파일", desc: "닫은 탭 다시 열기", win: ["Ctrl","Shift","T"], mac: ["⌘","Shift","T"] },
    { cat: "탭 & 파일", desc: "다음 탭", win: ["Ctrl","Tab"], mac: ["⌃","Tab"] },
    { cat: "탭 & 파일", desc: "이전 탭", win: ["Ctrl","Shift","Tab"], mac: ["⌃","Shift","Tab"] },
    { cat: "탭 & 파일", desc: "에디터 분할", win: ["Ctrl","\\"], mac: ["⌘","\\"] },
    { cat: "탭 & 파일", desc: "분할 에디터 1번으로", win: ["Ctrl","1"], mac: ["⌘","1"] },
    { cat: "탭 & 파일", desc: "분할 에디터 2번으로", win: ["Ctrl","2"], mac: ["⌘","2"] },
    { cat: "멀티커서 & 선택", desc: "커서 위에 추가", win: ["Ctrl","Alt","↑"], mac: ["⌘","Option","↑"] },
    { cat: "멀티커서 & 선택", desc: "커서 아래 추가", win: ["Ctrl","Alt","↓"], mac: ["⌘","Option","↓"] },
    { cat: "멀티커서 & 선택", desc: "열 선택", win: ["Shift","Alt","드래그"], mac: ["Shift","Option","드래그"] },
    { cat: "멀티커서 & 선택", desc: "현재 줄 선택 확장", win: ["Ctrl","L"], mac: ["⌘","L"] },
    { cat: "멀티커서 & 선택", desc: "블록 선택 확장", win: ["Shift","Alt","→"], mac: ["Shift","Option","→"] },
    { cat: "멀티커서 & 선택", desc: "블록 선택 축소", win: ["Shift","Alt","←"], mac: ["Shift","Option","←"] },
    { cat: "디버그", desc: "디버그 시작/계속", win: ["F5"], mac: ["F5"] },
    { cat: "디버그", desc: "디버그 중지", win: ["Shift","F5"], mac: ["Shift","F5"] },
    { cat: "디버그", desc: "Step Over", win: ["F10"], mac: ["F10"] },
    { cat: "디버그", desc: "Step Into", win: ["F11"], mac: ["F11"] },
    { cat: "디버그", desc: "Step Out", win: ["Shift","F11"], mac: ["Shift","F11"] },
    { cat: "디버그", desc: "브레이크포인트 토글", win: ["F9"], mac: ["F9"] },
    { cat: "Git", desc: "변경사항 커밋", win: ["Ctrl","Enter"], mac: ["⌘","Enter"] },
    { cat: "Git", desc: "변경사항 스테이지", win: ["Ctrl","Shift","G","S"], mac: ["⌘","Shift","G","S"] },
    { cat: "Git", desc: "타임라인 새로고침", win: ["Ctrl","Shift","G","R"], mac: ["⌘","Shift","G","R"] },
];

function switchOS(os) {
    currentOS = os;
    document.getElementById('os-win').classList.toggle('active', os === 'win');
    document.getElementById('os-mac').classList.toggle('active', os === 'mac');
    filterShortcuts();
}

function filterShortcuts() {
    const q = (document.getElementById('shortcut-search')?.value || '').trim().toLowerCase();
    const filtered = q
        ? SHORTCUTS.filter(s => s.desc.toLowerCase().includes(q) || s.cat.toLowerCase().includes(q)
            || (currentOS === 'win' ? s.win : s.mac).join('').toLowerCase().includes(q))
        : SHORTCUTS;

    const cats = {};
    filtered.forEach(s => { (cats[s.cat] = cats[s.cat] || []).push(s); });

    const list = document.getElementById('shortcut-list');
    if (!list) return;
    if (!filtered.length) { list.innerHTML = `<p style="color:var(--text-muted);padding:1em">검색 결과가 없습니다.</p>`; return; }

    list.innerHTML = Object.entries(cats).map(([cat, items]) => `
        <div class="shortcut-section">
            <div class="shortcut-section-title">${cat}</div>
            <div class="shortcut-grid">
                ${items.map(s => {
                    const keys = currentOS === 'win' ? s.win : s.mac;
                    return `<div class="shortcut-item">
                        <span class="shortcut-desc">${s.desc}</span>
                        <div class="shortcut-keys">${keys.map(k => `<span class="key">${k}</span>`).join('')}</div>
                    </div>`;
                }).join('')}
            </div>
        </div>
    `).join('');
}

function renderVSCode() {
    filterShortcuts();
}

// ════════════════════════════════════════════
// AI DATABASE (AI 도구 데이터 리스트)
// ════════════════════════════════════════════
const AI_DB = {
    문서: {
        title: "📝 문서 · 글쓰기 AI",
        intro: "문서 작성, 보고서, 이메일, 카피라이팅에 특화된 AI 도구들입니다.",
        items: [
            { name: "ChatGPT (OpenAI)", desc: "가장 범용적인 AI. 문서 요약·초안·번역 모두 탁월. GPT-4o 무료 제공.", tags: ["무료/유료"], link: "https://chat.openai.com" },
            { name: "Claude (Anthropic)", desc: "긴 문서 분석과 글쓰기 품질이 뛰어남. 100K 토큰 컨텍스트 지원.", tags: ["무료/유료"], link: "https://claude.ai" },
            { name: "Notion AI", desc: "Notion 문서 안에서 바로 초안 작성·요약·번역. 업무 문서에 최적.", tags: ["유료"], link: "https://notion.so" },
            { name: "Microsoft Copilot", desc: "Word·Excel·PowerPoint에 AI 통합. Office 365 사용자라면 바로 사용 가능.", tags: ["유료"], link: "https://copilot.microsoft.com" },
            { name: "Jasper AI", desc: "마케팅 카피·블로그·SNS 게시물 특화. 70+ 템플릿 제공.", tags: ["유료"], link: "https://jasper.ai" },
        ]
    },
    코딩: {
        title: "💻 코딩 · 개발 AI",
        intro: "코드 작성, 디버깅, 리뷰, 자동완성에 특화된 AI 도구들입니다.",
        items: [
            { name: "GitHub Copilot", desc: "VS Code·JetBrains 등에 통합. 실시간 코드 자동완성. 개발자 필수 도구.", tags: ["유료", "학생 무료"], link: "https://github.com/features/copilot" },
            { name: "Cursor", desc: "AI 네이티브 코드 에디터. GPT-4 기반. 전체 코드베이스 이해 가능.", tags: ["무료/유료"], link: "https://cursor.sh" },
            { name: "Codeium", desc: "70+ 언어 지원 무료 AI 자동완성. VS Code·JetBrains 플러그인.", tags: ["무료"], link: "https://codeium.com" },
            { name: "Tabnine", desc: "로컬 실행 가능한 AI 코드 완성. 보안이 중요한 기업 환경에 적합.", tags: ["무료/유료"], link: "https://tabnine.com" },
            { name: "Replit Ghostwriter", desc: "브라우저 기반 개발 + AI 통합. 초보자 학습에도 탁월.", tags: ["유료"], link: "https://replit.com" },
        ]
    },
    이미지: {
        title: "🎨 이미지 · 디자인 AI",
        intro: "텍스트로 이미지를 생성하거나 디자인 작업을 도와주는 AI입니다.",
        items: [
            { name: "Midjourney", desc: "예술적 품질 최고. 디스코드 기반. 사실적·판타지·애니 등 다양한 스타일.", tags: ["유료"], link: "https://midjourney.com" },
            { name: "DALL·E 3 (ChatGPT)", desc: "ChatGPT Plus에 통합. 텍스트 이해력이 뛰어나 정확한 이미지 생성.", tags: ["유료"], link: "https://openai.com/dall-e-3" },
            { name: "Adobe Firefly", desc: "저작권 안전한 이미지 생성. 상업적 사용 가능. Photoshop 통합.", tags: ["무료/유료"], link: "https://firefly.adobe.com" },
            { name: "Canva AI", desc: "디자인 초보자도 쉽게. 프레젠테이션·SNS·포스터 AI 자동 생성.", tags: ["무료/유료"], link: "https://canva.com" },
            { name: "Leonardo AI", desc: "게임 에셋·캐릭터 디자인 특화. 세밀한 프롬프트 컨트롤 가능.", tags: ["무료/유료"], link: "https://leonardo.ai" },
        ]
    },
    동영상: {
        title: "🎬 동영상 · 영상편집 AI",
        intro: "영상 생성, 편집, 자막, 아바타 등 동영상 작업 AI 도구입니다.",
        items: [
            { name: "Runway ML", desc: "텍스트→영상 생성. Gen-3 Alpha 모델로 고품질 영상 제작 가능.", tags: ["무료/유료"], link: "https://runwayml.com" },
            { name: "Kling AI", desc: "품질 최상위급. 5초~2분 영상 생성. 한국어 지원.", tags: ["무료/유료"], link: "https://klingai.com" },
            { name: "HeyGen", desc: "AI 아바타 기반 영상 제작. 다국어 립싱크 지원. 마케팅·교육용.", tags: ["유료"], link: "https://heygen.com" },
            { name: "CapCut AI", desc: "모바일·PC 영상편집 + AI 자막·번역·배경제거. 무료로 강력한 기능.", tags: ["무료"], link: "https://capcut.com" },
            { name: "Pika Labs", desc: "이미지→영상 변환 특화. 간단한 애니메이션 제작에 적합.", tags: ["무료/유료"], link: "https://pika.art" },
        ]
    },
    음악: {
        title: "🎵 음악 · 오디오 AI",
        intro: "음악 생성, 목소리 합성, 효과음 제작 AI 도구입니다.",
        items: [
            { name: "Suno AI", desc: "가사+장르 입력하면 완성된 노래 생성. 현재 최고 품질. 한국어 가사 지원.", tags: ["무료/유료"], link: "https://suno.com" },
            { name: "Udio", desc: "Suno와 함께 양대 산맥. 다양한 장르·스타일 지원. 고품질 음원.", tags: ["무료/유료"], link: "https://udio.com" },
            { name: "ElevenLabs", desc: "AI 목소리 합성·복제. 팟캐스트·오디오북·더빙에 최적. 한국어 지원.", tags: ["무료/유료"], link: "https://elevenlabs.io" },
            { name: "Mubert", desc: "배경음악·루프 음악 자동 생성. 유튜브·스트리밍 저작권 안전.", tags: ["무료/유료"], link: "https://mubert.com" },
            { name: "AIVA", desc: "클래식·게임·영화 BGM 작곡 특화. 감성적인 배경음악 제작.", tags: ["무료/유료"], link: "https://aiva.ai" },
        ]
    },
    리서치: {
        title: "🔍 검색 · 리서치 AI",
        intro: "최신 정보 검색, 논문 분석, 리서치 자동화 AI 도구입니다.",
        items: [
            { name: "Perplexity AI", desc: "실시간 웹 검색 + AI 답변. 출처 명시. 학술·기술 리서치에 최적.", tags: ["무료/유료"], link: "https://perplexity.ai" },
            { name: "You.com", desc: "AI 검색엔진. 코딩·문서 작성·이미지 생성 모드 통합.", tags: ["무료"], link: "https://you.com" },
            { name: "Elicit", desc: "논문 자동 분석·요약·비교. 연구자·대학원생 필수 도구.", tags: ["무료/유료"], link: "https://elicit.com" },
            { name: "Consensus", desc: "과학 논문 기반으로만 답변. 신뢰도 높은 의학·과학 정보 검색.", tags: ["무료/유료"], link: "https://consensus.app" },
        ]
    },
    데이터: {
        title: "📊 데이터 분석 AI",
        intro: "엑셀, CSV, 데이터베이스 분석을 자동화하는 AI 도구입니다.",
        items: [
            { name: "Julius AI", desc: "CSV·엑셀 업로드 후 자연어로 분석·시각화. 코딩 없이 데이터 인사이트.", tags: ["무료/유료"], link: "https://julius.ai" },
            { name: "ChatGPT (Code Interpreter)", desc: "데이터 파일 업로드→분석→그래프 자동 생성. GPT-4o 포함.", tags: ["유료"], link: "https://chat.openai.com" },
            { name: "Tableau AI", desc: "기존 Tableau에 AI 통합. 대시보드 자동 생성·이상치 탐지.", tags: ["유료"], link: "https://tableau.com" },
            { name: "Obviously AI", desc: "머신러닝 모델을 코딩 없이 생성. 예측 분석 자동화.", tags: ["유료"], link: "https://obviously.ai" },
        ]
    },
    번역: {
        title: "🗣️ 번역 · 언어 AI",
        intro: "문서·영상·실시간 번역 AI 도구입니다.",
        items: [
            { name: "DeepL", desc: "현재 최고 품질 번역. 한국어↔영어·일어·중국어 등. 문서 번역 지원.", tags: ["무료/유료"], link: "https://deepl.com" },
            { name: "Papago (NAVER)", desc: "한국어 번역 특화. 실시간 카메라·음성 번역. 완전 무료.", tags: ["무료"], link: "https://papago.naver.com" },
            { name: "Google Translate", desc: "133개 언어 지원. 실시간 카메라 번역·웹페이지 번역 강점.", tags: ["무료"], link: "https://translate.google.com" },
            { name: "Wordvice AI", desc: "영어 논문·에세이 교정 특화. 문법·어휘·구조 개선 제안.", tags: ["무료/유료"], link: "https://wordvice.ai" },
        ]
    },
    이메일: {
        title: "📧 이메일 · 업무 자동화 AI",
        intro: "이메일 작성, 일정 관리, 업무 자동화 AI 도구입니다.",
        items: [
            { name: "Superhuman AI", desc: "이메일 요약·자동답장·우선순위 정렬. 바쁜 직장인에게 최적.", tags: ["유료"], link: "https://superhuman.com" },
            { name: "Motion", desc: "AI가 일정·할일을 자동으로 최적 배치. 생산성 극대화.", tags: ["유료"], link: "https://usemotion.com" },
            { name: "Reclaim AI", desc: "구글 캘린더와 연동해 집중 시간·미팅 자동 스케줄링.", tags: ["무료/유료"], link: "https://reclaim.ai" },
            { name: "Zapier AI", desc: "수천 개 앱 자동화를 자연어로 설정. 반복 업무 제거.", tags: ["무료/유료"], link: "https://zapier.com" },
        ]
    },
};

// ════════════════════════════════════════════
// AI 도구 추천 페이지 컨트롤러
// ════════════════════════════════════════════
let currentRecCat = 'all';

function renderRecommend() {
    const bar = document.getElementById('rec-cat-bar');
    const catDefs = [
        { id: 'all', label: '🗂️ 전체' },
        { id: '문서', label: '📝 문서' },
        { id: '코딩', label: '💻 코딩' },
        { id: '이미지', label: '🎨 이미지' },
        { id: '동영상', label: '🎬 동영상' },
        { id: '음악', label: '🎵 음악' },
        { id: '리서치', label: '🔍 리서치' },
        { id: '데이터', label: '📊 데이터' },
        { id: '번역', label: '🗣️ 번역' },
        { id: '이메일', label: '📧 업무자동화' },
        { id: 'free', label: '💸 무료만' },
    ];

    bar.innerHTML = catDefs.map(c => `
        <button class="rec-cat-btn ${currentRecCat === c.id ? 'active' : ''}" onclick="setRecCat('${c.id}')">${c.label}</button>
    `).join('');

    renderRecContent();
}

function setRecCat(cat) {
    currentRecCat = cat;
    renderRecommend();
}

function buildTagHtml(tags) {
    return tags.map(t => {
        let cls = 'tag';
        if (t.includes('무료') && !t.includes('유료')) cls += ' tag-free';
        else if (t === '유료') cls += ' tag-paid';
        return `<span class="${cls}">${t}</span>`;
    }).join('');
}

function renderRecContent() {
    const content = document.getElementById('rec-content');
    if (!content) return;

    if (currentRecCat === 'all') {
        let html = '';
        for (const [key, db] of Object.entries(AI_DB)) {
            html += `<div class="rec-section-title">${db.title}</div>
                <div class="rec-grid">
                ${db.items.map(item => `
                    <div class="rec-card">
                        <div class="name">${item.name}</div>
                        <div class="desc">${item.desc}</div>
                        <div class="bottom">
                            <div class="tags">${buildTagHtml(item.tags)}</div>
                            <a class="visit-btn" href="${item.link}" target="_blank">방문하기 →</a>
                        </div>
                    </div>`).join('')}
                </div>`;
        }
        content.innerHTML = html;
    } else if (currentRecCat === 'free') {
        let html = `<div class="rec-section-title">💸 무료 사용 가능한 AI 전체</div><div class="rec-grid">`;
        for (const db of Object.values(AI_DB)) {
            db.items.filter(i => i.tags.some(t => t.includes('무료'))).forEach(item => {
                html += `<div class="rec-card">
                    <div class="name">${item.name}</div>
                    <div class="desc">${item.desc}</div>
                    <div class="bottom">
                        <div class="tags">${buildTagHtml(item.tags)}</div>
                        <a class="visit-btn" href="${item.link}" target="_blank">방문하기 →</a>
                    </div>
                </div>`;
            });
        }
        html += '</div>';
        content.innerHTML = html;
    } else {
        const db = AI_DB[currentRecCat];
        if (!db) return;
        let html = `<div class="rec-section-title">${db.title}</div>
            <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:10px">${db.intro}</p>
            <div class="rec-grid">
            ${db.items.map(item => `
                <div class="rec-card">
                    <div class="name">${item.name}</div>
                    <div class="desc">${item.desc}</div>
                    <div class="bottom">
                        <div class="tags">${buildTagHtml(item.tags)}</div>
                        <a class="visit-btn" href="${item.link}" target="_blank">방문하기 →</a>
                    </div>
                </div>`).join('')}
            </div>`;
        content.innerHTML = html;
    }
}

// ════════════════════════════════════════════
// CHATBOT ENGINE (챗봇 코어 알고리즘)
// ════════════════════════════════════════════
const KEYWORD_MAP = [
    { keys: ["문서","글쓰기","보고서","기획서","카피","블로그","에세이","요약","초안","작성","워드"], cat: "문서" },
    { keys: ["코딩","개발","프로그래밍","코드","개발자","자동완성","디버그","파이썬","자바","깃헙","깃허브"], cat: "코딩" },
    { keys: ["이미지","그림","디자인","포스터","일러스트","사진","이미지생성","달리","미드저니","그려"], cat: "이미지" },
    { keys: ["동영상","영상","비디오","유튜브","편집","자막","아바타","립싱크","쇼츠","reels","릴스"], cat: "동영상" },
    { keys: ["음악","노래","작곡","bgm","배경음악","목소리","보이스","오디오","사운드","멜로디"], cat: "음악" },
    { keys: ["검색","리서치","논문","조사","정보수집","퍼플렉시티","최신정보"], cat: "리서치" },
    { keys: ["데이터","엑셀","csv","분석","통계","그래프","시각화","머신러닝","인사이트"], cat: "데이터" },
    { keys: ["번역","통역","영어","일본어","중국어","딥엘","파파고","언어"], cat: "번역" },
    { keys: ["이메일","업무","자동화","일정","캘린더","스케줄","생산성","할일","회의"], cat: "이메일" },
];

function detectCategory(msg) {
    const lower = msg.toLowerCase().replace(/\s/g,"");
    for (const { keys, cat } of KEYWORD_MAP) {
        if (keys.some(k => lower.includes(k.replace(/\s/g,"")))) return cat;
    }
    return null;
}

function buildCardHtml(item) {
    const tagHtml = item.tags.map(t => {
        let cls = "tag";
        if (t.includes('무료') && !t.includes('유료')) cls += " tag-free";
        else if (t === '유료') cls += " tag-paid";
        return `<span class="${cls}">${t}</span>`;
    }).join('');
    return `<div class="ai-card">
        <div class="name">${item.name}</div>
        <div class="desc">${item.desc}</div>
        <div class="tags">${tagHtml} <a class="link-btn" href="${item.link}" target="_blank">방문하기 →</a></div>
    </div>`;
}

function buildReply(msg) {
    const lower = msg.toLowerCase().replace(/\s/g,"");

    if (/^(안녕|hi|hello|ㅎㅇ|헬로)/.test(lower)) {
        return `<p>안녕하세요! 👋 저는 AI 도구 추천 챗봇입니다.<br><br>
아래 버튼을 누르거나 원하는 작업을 입력해 주세요!</p>
<p style="margin-top:8px;color:var(--text-muted);font-size:0.85rem">예) "코딩 AI 추천해줘" · "동영상 만들고 싶어" · "무료 AI 알려줘"</p>`;
    }

    if (lower.includes("무료")) {
        let html = `<p class="section-title">💸 무료로 사용 가능한 AI 도구</p>`;
        for (const db of Object.values(AI_DB)) {
            const freeItems = db.items.filter(i => i.tags.some(t => t.includes("무료")));
            if (freeItems.length) {
                html += `<p style="color:var(--accent);font-size:0.82rem;margin:10px 0 4px">${db.title}</p>`;
                freeItems.forEach(i => { html += buildCardHtml(i); });
            }
        }
        return html;
    }

    const cat = detectCategory(msg);
    if (cat && AI_DB[cat]) {
        const db = AI_DB[cat];
        let html = `<p class="section-title">${db.title}</p>
<p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:8px">${db.intro}</p>`;
        db.items.forEach(i => { html += buildCardHtml(i); });
        return html;
    }

    if (lower.includes("전체")||lower.includes("모든")||lower.includes("다알려")||lower.includes("목록")||lower.includes("종류")) {
        let html = `<p class="section-title">🗂️ 전체 AI 카테고리</p>`;
        Object.values(AI_DB).forEach(db => {
            html += `<div class="ai-card"><div class="name">${db.title}</div><div class="desc">${db.intro}</div></div>`;
        });
        html += `<p style="color:var(--text-muted);font-size:0.83rem;margin-top:8px">카테고리 버튼을 클릭하거나 구체적으로 입력해 보세요!</p>`;
        return html;
    }

    return `<p>조금 더 구체적으로 말씀해 주시면 딱 맞는 AI를 추천해 드릴게요! 😊</p>
<p style="margin-top:8px;color:var(--text-muted);font-size:0.85rem">
💡 이렇게 물어보세요:<br>
• "유튜브 쇼츠 만들 AI 추천해줘"<br>
• "무료 이미지 생성 AI"<br>
• "코딩 자동완성 도구 알려줘"<br>
• "보고서 작성 AI 뭐가 있어?"
</p>`;
}

let isLoading = false;

function escapeHtml(t) { return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function appendMessage(role, htmlContent, isTyping = false) {
    const chat = document.getElementById('chat');
    if (!chat) return null;
    const row = document.createElement('div');
    row.className = `msg-row ${role}`;

    const avatar = document.createElement('div');
    avatar.className = `avatar ${role}`;
    avatar.textContent = role === 'bot' ? '🤖' : '👤';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    if (isTyping) {
        bubble.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
        row.id = 'typing-row';
    } else {
        bubble.innerHTML = htmlContent;
    }

    row.appendChild(avatar);
    row.appendChild(bubble);
    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;
    return row;
}

function sendMessage(override = null) {
    if (isLoading) return;
    const input = document.getElementById('input');
    if (!input) return;
    const message = override || input.value.trim();
    if (!message) return;

    isLoading = true;
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) sendBtn.disabled = true;
    if (!override) { input.value = ''; input.style.height = 'auto'; }

    appendMessage('user', `<span>${escapeHtml(message)}</span>`);
    appendMessage('bot', '', true);

    setTimeout(() => {
        document.getElementById('typing-row')?.remove();
        const html = buildReply(message);
        appendMessage('bot', html);
        isLoading = false;
        if (sendBtn) sendBtn.disabled = false;
        document.getElementById('input')?.focus();
    }, 500);
}

let chatbotInitialized = false;

function renderChatbot() {
    const user = getCurrentUser();
    const catBar = document.getElementById('chatCatBar');
    const chatArea = document.getElementById('chatArea');

    if (!user) {
        catBar.innerHTML = '';
        chatArea.innerHTML = `
            <div class="locked-content">
                <div style="font-size:3em;margin-bottom:0.3em">🔒</div>
                <h2>로그인이 필요합니다</h2>
                <p>AI 챗봇을 이용하려면 먼저 로그인 또는 회원가입을 해주세요.</p>
                <button onclick="navigate('login')">로그인 / 회원가입</button>
            </div>
        `;
        chatbotInitialized = false;
        return;
    }

    if (chatbotInitialized) return; // 기존 세션 대화 유지
    chatbotInitialized = true;

    const categories = [
        { label: '📝 문서', query: '문서 작업 AI 추천해줘' },
        { label: '💻 코딩', query: '코딩 AI 추천해줘' },
        { label: '🎨 이미지', query: '이미지 생성 AI 추천해줘' },
        { label: '🎬 동영상', query: '동영상 AI 추천해줘' },
        { label: '🎵 음악', query: '음악 생성 AI 추천해줘' },
        { label: '🔍 리서치', query: '리서치 AI 추천해줘' },
        { label: '📊 데이터', query: '데이터 분석 AI 추천해줘' },
        { label: '🗣️ 번역', query: '번역 AI 추천해줘' },
        { label: '📧 업무자동화', query: '업무 자동화 AI 추천해줘' },
        { label: '💸 무료AI', query: '무료 AI 알려줘' },
    ];

    catBar.innerHTML = categories.map(c =>
        `<button class="cat-btn" onclick="sendMessage('${c.query}')">${c.label}</button>`
    ).join('');

    chatArea.innerHTML = `
        <div id="chat" style="flex:1;overflow-y:auto;padding:1em;background:var(--surface);border-radius:16px;border:1px solid var(--border);margin-bottom:0.8em;scroll-behavior:smooth;min-height:300px;max-height:calc(100vh - 320px);"></div>
        <div class="input-area">
            <textarea id="input" rows="1" placeholder="원하는 작업을 입력하세요... (예: 동영상 편집 AI 추천해줘)"></textarea>
            <button id="sendBtn" onclick="sendMessage()" title="전송">➤</button>
        </div>
        <div class="hint">Enter 전송 · Shift+Enter 줄바꿈</div>
    `;

    const inp = document.getElementById('input');
    inp.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 140) + 'px';
    });
    inp.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });

    appendMessage('bot', `<p>안녕하세요, <strong style="color:var(--accent2)">${user.nickname || user.username}</strong>님! 🎉</p>
<p style="margin:6px 0;color:var(--text-muted);font-size:0.88rem">목적에 맞는 최적의 AI 도구를 추천해 드립니다.<br>위 카테고리 버튼을 누르거나, 원하는 작업을 자유롭게 말씀해 주세요!</p>`);
    inp.focus();
}

// ════════════════════════════════════════════
// SYSTEM ALERTS & INITIALIZER
// ════════════════════════════════════════════
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
}

// 웹 앱 최초 구동 라이프사이클 함수
document.addEventListener('DOMContentLoaded', () => {
    updateHeaderUser();
    navigate('home');
});