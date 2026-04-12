// --- 4. LÓGICA PARA ACTUALIZAR DATOS (EDITAR) ---
const formPerfil = document.getElementById('formPerfil');

if (formPerfil) {
    formPerfil.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evitamos que la página se recargue

        const idUsuario = localStorage.getItem('idUsuario');
        const token = localStorage.getItem('token');
        const idPerfil = localStorage.getItem('idPerfil'); // <--- Recuperamos el idPerfil
        // Creamos el objeto con los datos actualizados del formulario
        // Nota: Los nombres (nombre, aPaterno, etc.) deben coincidir con lo que espera tu Backend
        const datosActualizados = {
            nombre: document.getElementById('nombre').value.trim(),
            aPaterno: document.getElementById('apellidop').value.trim(),
            aMaterno: document.getElementById('apellidom').value.trim(),
            correo: document.getElementById('correo').value.trim(),
            telefono: document.getElementById('telefono').value.trim(),
            idPerfil: parseInt(idPerfil)
        };

        // Si el usuario escribió algo en el campo de password, lo agregamos al envío
        const passwordInput = document.getElementById('password').value;
        if (passwordInput.length > 0) {
            datosActualizados.password = passwordInput;
        }

        try {
            const response = await fetch(`https://backend-liard-alpha-37.vercel.app/api/usuarios/${idUsuario}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(datosActualizados)
            });

            const resultado = await response.json();

            if (response.ok) {
                alert("¡Perfil actualizado con éxito!");
                // Opcional: Recargar la página para ver los cambios reflejados en la tarjeta superior
                window.location.reload();
            } else {
                alert("Error al actualizar: " + (resultado.message || "Intenta de nuevo"));
            }

        } catch (error) {
            console.error("Error en la petición PUT:", error);
            alert("Hubo un fallo en la conexión con el servidor.");
        }
    });
}