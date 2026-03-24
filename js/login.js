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

            if (!respuesta.ok) {
                throw new Error(data.message || 'No se pudo iniciar sesión');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));

            // Redirección según perfil
            if (data.usuario.idPerfil === 1) {
                window.location.href = 'principalAdmin.html';
            } else {
                window.location.href = '../index.html';
            }

        } catch (error) {
            mensajeError.style.display = 'block';
            mensajeError.textContent = error.message;
        }
    });
});