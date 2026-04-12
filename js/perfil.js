// --- 1. CARGAR DATOS AL INICIAR LA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
    const idUsuario = localStorage.getItem('idUsuario');
    const token = localStorage.getItem('token');

    // Validar que el usuario esté logueado
    if (idUsuario && token) {
        fetch(`https://backend-liard-alpha-37.vercel.app/api/usuarios/${idUsuario}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` 
            }
        })
        .then(res => {
            if (!res.ok) throw new Error("Error en la respuesta del servidor");
            return res.json();
        })
        .then(usuario => {
            console.log("Datos del usuario obtenidos con éxito:", usuario);

            // A. Llenar la Tarjeta de Resumen (Datos estáticos de solo lectura)
            document.getElementById('resumen-nombre').textContent = `${usuario.nombre} ${usuario.aPaterno} ${usuario.aMaterno}`;
            document.getElementById('resumen-correo').textContent = usuario.correo;
            document.getElementById('resumen-telefono').textContent = usuario.telefono;
            
            // Determinar el rol basado en el idPerfil
            let nombreRol = "Usuario";
            if (usuario.idPerfil === 3) nombreRol = "Administrador";
            if (usuario.idPerfil === 2) nombreRol = "Empleado";
            // Agrega más roles si tienes otros IDs
            
            document.getElementById('resumen-rol').textContent = nombreRol;
            document.getElementById('rolInput').value = nombreRol;

            // B. Llenar los Inputs del Formulario (Listos para ser editados)
            document.getElementById('inputIdUsuario').value = usuario.idUsuario;
            document.getElementById('nombre').value = usuario.nombre;
            document.getElementById('apellidop').value = usuario.aPaterno;
            document.getElementById('apellidom').value = usuario.aMaterno;
            document.getElementById('correo').value = usuario.correo;
            document.getElementById('telefono').value = usuario.telefono;
        })
        .catch(err => {
            console.error("Error al obtener el perfil:", err);
            alert("Hubo un problema al cargar los datos del perfil.");
        });
    } else {
        // Si no hay ID o token en localStorage, expulsarlo al login
        window.location.href = 'login.html';
    }

    // --- 2. LÓGICA PARA MOSTRAR/OCULTAR CONTRASEÑA ---
    const togglePassword = document.querySelector('#togglePassword');
    const password = document.querySelector('#password');

    if(togglePassword && password) {
        togglePassword.addEventListener('click', function () {
            // Alternar entre tipo 'text' y 'password'
            const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
            password.setAttribute('type', type);
            
            // Cambiar el ícono
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }
});

// --- 3. FUNCIONES GLOBALES DE INTERFAZ ---
// Esta función debe quedar fuera del DOMContentLoaded para que el HTML la pueda llamar con el evento 'onclick'
function editarCampo(idInput) {
    var input = document.getElementById(idInput);
    if(input) {
        input.focus();
        // Este pequeño truco mueve el cursor del mouse al final de la palabra
        var valor = input.value;
        input.value = '';
        input.value = valor;
    }
}