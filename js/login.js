document.addEventListener('DOMContentLoaded', () => {
    
    // Mostrar/ocultar contraseña
    const togglePassword = document.querySelector("#togglePassword");
    const passwordInput = document.querySelector("#password");

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener("click", function () {
           
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            this.classList.toggle("bi-eye-fill");
            this.classList.toggle("bi-eye-slash-fill");
        });
    }

    // INICIO DE SESIÓN
    const loginForm = document.getElementById('loginForm');
    const mensajeError = document.getElementById('mensajeError');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            // Evitamos que la página se recargue por defecto
            e.preventDefault(); 

            // Ocultamos el mensaje de error si estaba visible
            mensajeError.style.display = 'none';

            // Obtenemos los valores de los inputs
            const correo = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('https://backend-liard-alpha-37.vercel.app/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ correo, password }) 
                });

                const data = await response.json();

                if (response.ok) {
                    // Guardamos el token en el LocalStorage
                    localStorage.setItem('token', data.token);
                    alert('¡Inicio de sesión exitoso!');
                    window.location.href = '../pages/principalAdmin.html'; 
                    
                } else {
                    mensajeError.textContent = data.message || 'Correo o contraseña incorrectos';
                    mensajeError.style.display = 'block';
                }

            } catch (error) {
                console.error('Error en la petición:', error);
                mensajeError.textContent = 'Hubo un problema al conectar con el servidor. Intenta de nuevo más tarde.';
                mensajeError.style.display = 'block';
            }
        });
    }
});