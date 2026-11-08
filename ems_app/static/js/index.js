document.addEventListener('DOMContentLoaded', () => {
    const patientToggle = document.getElementById('patientToggle');
    const paramedicToggle = document.getElementById('paramedicToggle');
    const loginForm = document.getElementById('loginForm');
    const backgroundAnimation = document.querySelector('.background-animation');

    patientToggle.addEventListener('click', () => {
        patientToggle.classList.add('active');
        paramedicToggle.classList.remove('active');
    });

    paramedicToggle.addEventListener('click', () => {
        paramedicToggle.classList.add('active');
        patientToggle.classList.remove('active');
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = patientToggle.classList.contains('active') ? 'patient' : 'paramedic';

        try {
            // Send login request to the server
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, role })
            });
    
            if (!response.ok) {
                const message = await response.json();
                alert(message.error);
                return;
            }
    
            const { token } = await response.json();
    
            // Page redirection based on role
            let pageUrl = role === 'patient' ? '/patient.html' : '/paramedic.html';

            window.location.href = pageUrl+`?token=${token}`;

        } catch (error) {
            console.error("Login Failed", error);
            alert("Sign-in didn’t go through. Please try again.")
        }
    });


    // UI Background animation
    function createHeartbeat() {
        const heartbeat = document.createElement('div');
        heartbeat.classList.add('heartbeat');
        heartbeat.style.left = `${Math.random() * 100}%`;
        heartbeat.style.top = `${Math.random() * 100}%`;
        heartbeat.style.animationDuration = `${Math.random() * 3 + 2}s`;
        backgroundAnimation.appendChild(heartbeat);

        setTimeout(() => {
            heartbeat.remove();
        }, 5000);
    }

    setInterval(createHeartbeat, 500);
});