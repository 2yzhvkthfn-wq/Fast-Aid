document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const data = await response.json();
                const key = data.error || 'login_failed';
                alert(t(translations.en[key] ? key : 'login_failed'));
                return;
            }

            const { token, isAdmin, canRequest, canHelp } = await response.json();
            let pageUrl = '/requester.html';

            if (isAdmin) {
                pageUrl = '/admin.html';
            } else if (canHelp && !canRequest) {
                pageUrl = '/helper.html';
            } else {
                pageUrl = '/requester.html';
            }

            window.location.href = `${pageUrl}?token=${token}`;
        } catch (error) {
            console.error(error);
            alert(t('login_failed'));
        }
    });
});
