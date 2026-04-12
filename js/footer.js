document.addEventListener("DOMContentLoaded", () => {
    // Buscamos el contenedor donde se inyectará el footer
    const footerContainer = document.getElementById("footer-dinamico");
    if (!footerContainer) return;

    // 1. Leer datos del usuario desde LocalStorage (Igual que en el header)
    const token = localStorage.getItem('token');
    const idPerfil = localStorage.getItem('idPerfil');
    
    // 2. Lógica para definir la ruta del Mapa del Sitio
    let rutaMapa = "../Publica/mapaDeSitioPublic.html"; // Por defecto (Invitado)

    if (token) {
        if (idPerfil === "3") {
            // Administrador
            rutaMapa = "../pages/mapaDeSitioAdmin.html";
        } else {
            // Cliente / Usuario logueado
            rutaMapa = "../pages/mapaDeSitioPriv.html";
        }
    }

    // 3. Estructura HTML del Footer
    const footerHTML = `
        <footer>
            <div class="footer-links">
                <a href="../pages/ubicacion.html">📍 Horarios y ubicación</a>
                <a href="../pages/redes.html">📱 Redes Sociales</a>
                <a href="../pages/Nosotros-Somos.html">👥 Acerca de</a>
                <a href="../pages/opiniones.html">📝 Opiniones</a>
                <a href="${rutaMapa}" class="sitemap-link">🗺️ Mapa de sitio</a>
            </div>

            <hr class="footer-divider" style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;">

            <div class="footer-bottom">
                <p class="footer-text">ÚNETE A NUESTRA COMUNIDAD • @UTHH</p>
                <p class="footer-text">© 2026 UNICAFE. Todos los derechos reservados.</p>
            </div>
        </footer>
    `;

    // 4. Inyectar el HTML al contenedor
    footerContainer.innerHTML = footerHTML;
});