const API_URL = 'https://backend-liard-alpha-37.vercel.app/api/auth/login';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const mensajeError = document.getElementById('mensajeError');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        mensajeError.style.display = 'none';
        mensajeError.textContent = '';

        const correo = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        try {
            const respuesta = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ correo, password })
            });

            const data = await respuesta.json();
            console.log("Respuesta login:", data);

            if (!respuesta.ok) {
                throw new Error(data.message || 'Error al iniciar sesión');
            }

            if (!data.token) {
                throw new Error('No se recibió token del servidor');
            }

            // Guardar token
            localStorage.setItem('token', data.token);

            // Redirigir directamente (sin usuario aún)
            window.location.href = 'principalAdmin.html';

        } catch (error) {
            mensajeError.style.display = 'block';
            mensajeError.textContent = error.message;
        }
    });
});