document.addEventListener('DOMContentLoaded', () => {
    const registroForm = document.getElementById('registroForm');
    const mensajeAlerta = document.getElementById('mensajeAlerta');

    if (registroForm) {
        registroForm.addEventListener('submit', async (e) => {
            // Evitamos que la página recargue
            e.preventDefault();

            // Ocultamos alertas previas
            mensajeAlerta.style.display = 'none';

            const datosUsuario = {
                nombre: document.getElementById('nombre').value,
                aPaterno: document.getElementById('a_paterno').value,
                aMaterno: document.getElementById('a_materno').value, 
                correo: document.getElementById('email').value,     
                telefono: document.getElementById('telefono').value,
                password: document.getElementById('password').value,
                idPerfil: document.getElementById('perfil').value     
            };

            try {
                // 2. Hacemos la petición POST al registro
                const response = await fetch('https://backend-liard-alpha-37.vercel.app/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(datosUsuario)
                });

                const data = await response.json();
                if (response.ok) {
                    mensajeAlerta.textContent = '¡Registro exitoso!...';
                    mensajeAlerta.style.backgroundColor = '#d4edda';
                    mensajeAlerta.style.color = '#155724';
                    mensajeAlerta.style.display = 'block';

                    // Limpiamos el formulario
                    registroForm.reset();

                    // Redirigimos al usuario al login después de 2 segundos
                    setTimeout(() => {
                        window.location.href = '../pages/login.html'; 
                    }, 1000);

                } else {
                    // Error desde el backend (ej. correo ya registrado)
                    mensajeAlerta.textContent = data.message || 'Error al registrar el usuario.';
                    mensajeAlerta.style.backgroundColor = '#f8d7da'; 
                    mensajeAlerta.style.color = '#721c24';
                    mensajeAlerta.style.display = 'block';
                }

            } catch (error) {
                console.error('Error en la petición:', error);
                mensajeAlerta.textContent = 'Hubo un problema al conectar con el servidor.';
                mensajeAlerta.style.backgroundColor = '#f8d7da';
                mensajeAlerta.style.color = '#721c24';
                mensajeAlerta.style.display = 'block';
            }
        });
    }
});