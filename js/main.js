// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 导航栏交互
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
            link.style.opacity = '0.8';
        });
        link.addEventListener('mouseleave', () => {
            link.style.opacity = '1';
        });
    });

    // 注册按钮点击事件
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', (e) => {
            e.preventDefault();
            alert('即将跳转到注册页面...');
            window.location.href = '/register';
        });
    }

    // 语言切换功能
    const langSwitches = document.querySelectorAll('.lang-switch');
    langSwitches.forEach(switchBtn => {
        switchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = switchBtn.dataset.lang;
            if (lang === 'en') {
                window.location.href = 'index-en.html';
            } else {
                window.location.href = 'index.html';
            }
        });
    });

    // 健康检查端点
    if (window.location.pathname === '/healthz') {
        document.body.textContent = 'OK';
        return;
    }
    if (window.location.pathname === '/ready') {
        document.body.textContent = 'READY';
        return;
    }

    // 页面滚动效果
    window.addEventListener('scroll', () => {
        const header = document.querySelector('header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
});
