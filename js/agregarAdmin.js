const API_URL = 'https://backend-liard-alpha-37.vercel.app/api/admin/registrar';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registroAdminForm');
    const mensajeAlerta = document.getElementById('mensajeAlerta');
    const btnLimpiar = document.getElementById('btnLimpiar');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    validarSesionAdmin();

    configurarSoloLetras('nombre');
    configurarSoloLetras('a_paterno');
    configurarSoloLetras('a_materno');
    configurarSoloNumeros('telefono');

    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', () => {
            form.reset();
            ocultarMensaje();
        });
    }

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            togglePassword.classList.toggle('bi-eye-fill');
            togglePassword.classList.toggle('bi-eye-slash-fill');
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            ocultarMensaje();

            const datosUsuario = {
                nombre: document.getElementById('nombre').value.trim(),
                aPaterno: document.getElementById('a_paterno').value.trim(),
                aMaterno: document.getElementById('a_materno').value.trim(),
                correo: document.getElementById('email').value.trim(),
                telefono: document.getElementById('telefono').value.trim(),
                password: document.getElementById('password').value,
                idPerfil: 3,
                estado: document.getElementById('estado').value
            };

            const mensajeValidacion = validarFormulario(datosUsuario);
            if (mensajeValidacion) {
                mostrarMensaje(mensajeValidacion, 'error');
                return;
            }

            try {
                const token = localStorage.getItem('token');

                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(datosUsuario)
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(data.message || 'Error al registrar administrador');
                }

                mostrarMensaje(
                    data.message || 'Administrador creado con éxito.',
                    'success'
                );

                form.reset();

                setTimeout(() => {
                    window.location.href = 'principalAdmin.html';
                }, 1000);

            } catch (error) {
                console.error('Error al registrar administrador:', error);
                mostrarMensaje(
                    error.message || 'Hubo un problema al conectar con el servidor.',
                    'error'
                );
            }
        });
    }

    function validarSesionAdmin() {
        const token = localStorage.getItem('token');
        const idPerfil = Number(localStorage.getItem('idPerfil'));

        if (!token) {
            alert('Tu sesión no está activa. Inicia sesión nuevamente.');
            window.location.href = 'login.html';
            return;
        }

        if (idPerfil !== 3) {
            alert('No tienes permisos para acceder a este módulo.');
            window.location.href = 'principalAdmin.html';
        }
    }

    function configurarSoloLetras(id) {
        const input = document.getElementById(id);
        if (!input) return;

        input.addEventListener('input', () => {
            input.value = input.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, '');
        });
    }

    function configurarSoloNumeros(id) {
        const input = document.getElementById(id);
        if (!input) return;

        input.addEventListener('input', () => {
            input.value = input.value.replace(/\D/g, '').slice(0, 10);
        });
    }

    function validarFormulario(datos) {
        if (
            !datos.nombre ||
            !datos.aPaterno ||
            !datos.aMaterno ||
            !datos.correo ||
            !datos.telefono ||
            !datos.password ||
            !datos.estado
        ) {
            return 'Todos los campos son obligatorios.';
        }

        if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(datos.nombre)) {
            return 'El nombre solo puede contener letras y espacios.';
        }

        if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(datos.aPaterno)) {
            return 'El apellido paterno solo puede contener letras y espacios.';
        }

        if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(datos.aMaterno)) {
            return 'El apellido materno solo puede contener letras y espacios.';
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)) {
            return 'Ingresa un correo electrónico válido.';
        }

        if (!/^\d{10}$/.test(datos.telefono)) {
            return 'El teléfono debe contener exactamente 10 dígitos.';
        }

        if (!/^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/.test(datos.password)) {
            return 'La contraseña debe tener mínimo 8 caracteres, una mayúscula y un carácter especial.';
        }

        if (!['activo', 'inactivo'].includes(datos.estado)) {
            return 'Selecciona un estado válido.';
        }

        return '';
    }

    function mostrarMensaje(texto, tipo = 'success') {
        if (!mensajeAlerta) return;

        mensajeAlerta.textContent = texto;
        mensajeAlerta.style.display = 'block';

        if (tipo === 'success') {
            mensajeAlerta.style.backgroundColor = '#d4edda';
            mensajeAlerta.style.color = '#155724';
            mensajeAlerta.style.border = '1px solid #c3e6cb';
        } else {
            mensajeAlerta.style.backgroundColor = '#f8d7da';
            mensajeAlerta.style.color = '#721c24';
            mensajeAlerta.style.border = '1px solid #f5c6cb';
        }
    }

    function ocultarMensaje() {
        if (!mensajeAlerta) return;
        mensajeAlerta.style.display = 'none';
        mensajeAlerta.textContent = '';
    }
});