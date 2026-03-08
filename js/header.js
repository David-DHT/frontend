document.addEventListener('DOMContentLoaded', () => {
    // Verificar estado de sesión al cargar la página
    verificarSesion();
});

// Función para revisar si el usuario está logueado
async function verificarSesion() {
    const userActions = document.getElementById('userActions');
    
    // Si la página actual no tiene el div de 'userActions', detenemos la función para evitar errores
    if (!userActions) return; 

    try {
        //  petición a la API  (Node.js)
        // const respuesta = await fetch('http://tu-api/auth/status');
        // const auth = await respuesta.json();
        
        // Simulación temporal: Cambia esto a true para ver cómo el menú cambia a "Ir al Panel"
        const estaLogueado = false; 

        if (estaLogueado) {
            userActions.innerHTML = `<a href="principalCliente.html" class="btn-unete" style="background-color: #8b6f47;">Ir al Panel de admin</a>`;
        } else {
            userActions.innerHTML = `
                <a href="login.html" class="btn-login">Login</a>
                <a href="unete.html" class="btn-unete">Únete</a>
            `;
        }
    } catch (error) {
        console.error("Error al verificar sesión", error);
    }
}