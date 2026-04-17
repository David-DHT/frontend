const API_URL = 'https://backend-liard-alpha-37.vercel.app/api/auth/login';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const mensajeError = document.getElementById('mensajeError');
    const mensajeExito = document.getElementById('mensajeExito');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

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

            if (!respuesta.ok) {
                throw new Error(data.message || 'Error al iniciar sesión');
            }

            // --- VALIDACIÓN DE PERFIL ---
            // Convertimos a número por seguridad en la comparación
            const perfil = Number(data.idPerfil); 

            if (perfil === 3) {
                // ES ADMINISTRADOR: Guardamos datos y redirigimos
                localStorage.setItem('token', data.token);
                localStorage.setItem('idPerfil', data.idPerfil);
                localStorage.setItem('idUsuario', data.id);

                if (mensajeExito) {
                    mensajeExito.textContent = '¡Bienvenido Administrador!';
                    mensajeExito.style.display = 'block';
                }

                setTimeout(() => {
                    window.location.href = 'principalAdmin.html';
                }, 1000);

            } else {
                localStorage.setItem('token', data.token);
                localStorage.setItem('idPerfil', data.idPerfil);
                localStorage.setItem('idUsuario', data.id);

                if (mensajeExito) {
                    mensajeExito.textContent = '¡Inicio de sesión exitoso!';
                    mensajeExito.style.display = 'block';
                }

                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1000);
            }

        } catch (error) {
            // Limpiamos localStorage por si acaso quedó algo de un intento previo
            localStorage.clear(); 
            mensajeError.style.display = 'block';
            mensajeError.textContent = error.message;
        }
    });
});

async function cargarInformacionDinamica() {
    try {
        const respuesta = await fetch('https://backend-liard-alpha-37.vercel.app/api/config/configuracion');
        
        if (respuesta.ok) {
            const datos = await respuesta.json();

            // 1. Reemplazamos el Eslogan
            const esloganElemento = document.getElementById('esloganSitio');
            if (esloganElemento && datos.eslogan) {
                esloganElemento.innerText = datos.eslogan;
            }

            // 2. Reemplazamos el Nombre (si usaste la clase en el HTML)
            const elementosNombre = document.querySelectorAll('.nombreSitioDinamico');
            elementosNombre.forEach(el => {
                if (datos.nombreSitio) el.innerText = datos.nombreSitio;
            });
        }
    } catch (error) {
        console.error("Error al cargar el eslogan dinámico:", error);
    }
}

// Ejecutar cuando cargue la página
document.addEventListener("DOMContentLoaded", cargarInformacionDinamica);