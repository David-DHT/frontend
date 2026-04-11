const API_URL = 'https://backend-liard-alpha-37.vercel.app/api/auth/login';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const mensajeError = document.getElementById('mensajeError');
    const mensajeExito = document.getElementById('mensajeExito'); // NUEVO: Seleccionamos el div de éxito

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Ocultamos ambos mensajes al intentar de nuevo
        mensajeError.style.display = 'none';
        mensajeError.textContent = '';
        if (mensajeExito) {
            mensajeExito.style.display = 'none';
            mensajeExito.textContent = '';
        }

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
            if (mensajeExito) {
                mensajeExito.textContent = '¡Inicio de sesión exitoso!';
                mensajeExito.style.display = 'block';
            }

            setTimeout(() => {
                window.location.href = 'principalAdmin.html';
            }, 500);

        } catch (error) {
            mensajeError.style.display = 'block';
            mensajeError.textContent = error.message;
        }
    });
});