// auth.js - 用户认证和资源加载的核心逻辑
const SUPABASE_URL = 'wfqcynoaetozkhhulczq'; // 请替换！
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmcWN5bm9hZXRvemtoaHVsY3pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NDk3MDksImV4cCI6MjA5MzMyNTcwOX0.YhX9PzOAYIdpreZRFP-Zh2Nxsjk6b5K9I16qiBzLC-o'; // 请替换！

let supabase;

function initSupabase() {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// 通用的用户注册函数
async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    alert('注册成功！');
    return data;
}

// 通用的用户登录函数
async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    window.location.href = 'dashboard.html'; // 登录成功后跳转
    return data;
}

// 通用的用户登出函数
async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    window.location.href = 'index.html'; // 登出后跳转回首页
}

// 获取当前登录用户
async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// 获取会员状态
async function getMemberStatus(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('is_vip')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('获取会员状态失败:', error);
        return false;
    }
    return data?.is_vip || false;
}

// 加载并渲染所有资源
async function loadResources() {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = 'index.html'; // 未登录则跳转
        return;
    }

    const isVip = await getMemberStatus(user.id);
    const container = document.querySelector('#resource-list');
    if (!container) return;

    // 如果没有资源，显示提示信息
    // 从Supabase数据库获取所有资源
    const { data: resources, error } = await supabase
        .from('resources')
        .select('*');

    if (error) {
        console.error('加载资源失败:', error);
        container.innerHTML = '<p>资源加载失败，请联系站长。</p>';
        return;
    }

    if (!resources || resources.length === 0) {
        container.innerHTML = '<p>暂时没有分享的资源，请稍后再来。</p>';
        return;
    }

    container.innerHTML = '';
    let hasPremiumResource = false;

    resources.forEach(resource => {
        const card = document.createElement('div');
        card.className = 'resource-card';

        // 如果是付费资源且当前用户不是VIP，则显示锁定信息
        if (resource.is_premium && !isVip) {
            hasPremiumResource = true;
            card.innerHTML = `
                <h3>${resource.title} <span style="color: orange;">🔒 会员专享</span></h3>
                <p>${resource.description}</p>
                <p><em>赞助本站即可解锁下载。</em></p>
            `;
        } else {
            // 免费资源或VIP用户可见的付费资源
            card.innerHTML = `
                <h3>${resource.title}</h3>
                <p>${resource.description}</p>
                <div class="resource-links">
                    <a href="${resource.link}" target="_blank">下载资源</a>
                    ${resource.password ? `<span>提取码: ${resource.password}</span>` : ''}
                </div>
            `;
        }
        container.appendChild(card);
    });

    // 如果有付费资源且用户非VIP，显示赞助提示
    const vipPrompt = document.getElementById('vip-prompt');
    if (vipPrompt && hasPremiumResource && !isVip) {
        vipPrompt.style.display = 'block';
    }
}

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    initSupabase();

    // 如果在登录/注册页面，绑定事件
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        const form = document.getElementById('auth-form');
        const toggleLink = document.getElementById('toggle-link');
        const formTitle = document.getElementById('form-title');
        const authButton = document.getElementById('auth-button');
        let isLoginMode = true;

        toggleLink.addEventListener('click', function(e) {
            e.preventDefault();
            isLoginMode = !isLoginMode;
            formTitle.textContent = isLoginMode ? '登录' : '注册';
            authButton.textContent = isLoginMode ? '登录' : '注册';
            document.getElementById('toggle-text').innerHTML = isLoginMode
                ? '没有账号？<a href="#" id="toggle-link">点击注册</a>'
                : '已有账号？<a href="#" id="toggle-link">点击登录</a>';
        });

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                if (isLoginMode) {
                    await signIn(email, password);
                } else {
                    await signUp(email, password);
                }
            } catch (error) {
                alert('操作失败: ' + error.message);
            }
        });
    }

    // 如果在资源看板页面，则加载资源和用户信息
    if (window.location.pathname.endsWith('dashboard.html')) {
        loadResources();

        getCurrentUser().then(user => {
            if (user) {
                document.getElementById('user-email-display').textContent = '当前用户: ' + user.email;
            }
        });

        document.getElementById('signout-button').addEventListener('click', signOut);
    }
});