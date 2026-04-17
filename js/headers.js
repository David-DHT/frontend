document.addEventListener("DOMContentLoaded", async () => {
    // Buscamos el contenedor donde se inyectará el header
    const headerContainer = document.getElementById("header-dinamico");
    if (!headerContainer) return;

    // 1. Cargamos el CSS de animaciones (asegúrate de que la ruta sea correcta)
    const linkAnimaciones = document.createElement("link");
    linkAnimaciones.rel = "stylesheet";
    linkAnimaciones.href = "../css/animaciones.css"; 
    document.head.appendChild(linkAnimaciones);

    // 2. Leer datos del usuario desde LocalStorage
    const token = localStorage.getItem('token');
    const idPerfil = localStorage.getItem('idPerfil');
    const nombreUsuario = localStorage.getItem('nombre') || 'Usuario';
    
    // --- 3. NUEVO: CARGAR CONFIGURACIÓN DESDE LA BASE DE DATOS ---
    let logoSitio = '<span style="font-size: 1.5em;">☕</span>'; // Default si no hay imagen
    let nombreSitio = 'UNICAFE'; // Default si no hay nombre
    
    try {
        const respuestaConfig = await fetch('https://backend-liard-alpha-37.vercel.app/api/config/configuracion');
        if (respuestaConfig.ok) {
            const configDatos = await respuestaConfig.json();
            
            if (configDatos.nombreSitio) {
                nombreSitio = configDatos.nombreSitio;
            }
            if (configDatos.logo) {
                // Creamos la etiqueta de imagen asegurando que tenga un tamaño que no rompa el header
                logoSitio = `<img src="${configDatos.logo}" alt="Logo del sitio" style="height: 60px; width: 60px; object-fit: contain; border-radius: 5px;">`;
            }
        }
    } catch (error) {
        console.error("No se pudo cargar la configuración del header:", error);
    }
    // -------------------------------------------------------------

    // Variables para definir qué cargar
    let archivoCSS = "../css/Plantilla.css"; // Por defecto
    let headerHTML = "";

    // 4. LOGICA DE ROLES
    if (token && idPerfil === "3") {
        // =========================================
        // VISTA ADMINISTRADOR
        // =========================================
        archivoCSS = "../css/plantillaAdmin.css";
        headerHTML = `
            <header>
                <div class="logo-section">
                    <a href="../Privada/principalAdmin.html" style="text-decoration:none; display: flex; align-items: center; gap: 10px;">
                        ${logoSitio}
                        <h1 class="brand-name">${nombreSitio}</h1>
                    </a>
                </div>
                <button class="hamburger-btn" onclick="toggleMobileMenu()">☰</button>
                <div class="header-menu-container" id="mobileMenu">
                    <nav>
                        <p class="welcome-text">Bienvenido</p>
                        <button class="open-sidebar-btn" onclick="toggleSidebar()" style="background-color: #8b6f47; color: white; border: none; padding: 8px 15px; cursor: pointer; border-radius: 5px;">
                            ☰ Menú
                        </button>
                        
                        <div id="miSidebar" class="sidebar-container">
                            <div style="background-color: #554229; padding: 20px; display: flex; justify-content: space-between; align-items: center;">
                                <h3 style="color: white; margin: 0;">Panel Admin</h3>
                                <button onclick="toggleSidebar()" style="background: none; border: none; color: white; font-size: 28px; cursor: pointer;">&times;</button>
                            </div>
                            <div style="overflow-y: auto; flex-grow: 1; display: flex; flex-direction: column;">
                                <a href="../pages/principalAdmin.html" style="padding: 15px; border-bottom: 1px solid #eee; text-decoration: none; color: #333;">🏠 Inicio</a>
                                <a href="../pages/gestionProductos.html" style="padding: 15px; border-bottom: 1px solid #eee; text-decoration: none; color: #333;">☕ Productos</a>
                                <a href="../pages/gestionUsuarios.html" style="padding: 15px; border-bottom: 1px solid #eee; text-decoration: none; color: #333;">👥 Usuarios</a>
                                <a href="../pages/gestionProveedores.html" style="padding: 15px; border-bottom: 1px solid #eee; text-decoration: none; color: #333;">💼 Proveedores</a>
                                <a href="../pages/gestionCategorias.html" style="padding: 15px; border-bottom: 1px solid #eee; text-decoration: none; color: #333;">📋 Categorias</a>
                                <a href="../pages/perfil.html" style="padding: 15px; border-bottom: 1px solid #eee; text-decoration: none; color: #333;">👤 Mi perfil</a>
                                <a href="../pages/reportes.html" style="padding: 15px; border-bottom: 1px solid #eee; text-decoration: none; color: #333;">📊 Reportes</a>
                                <a href="../pages/gestionVentas.html" style="padding: 15px; border-bottom: 1px solid #eee; text-decoration: none; color: #333;">💵 Ventas</a>
                                <a href="../pages/gestionInventario.html" style="padding: 15px; border-bottom: 1px solid #eee; text-decoration: none; color: #333;">📦 Inventario</a>
                                <a href="../pages/agregarAdmin.html" style="padding: 15px; border-bottom: 1px solid #eee; text-decoration: none; color: #333;">👔➕ Agregar Admin</a> 
                                <a href="../pages/configuracion.html" style="padding: 15px; border-bottom: 1px solid #eee; text-decoration: none; color: #333;">⚙️ Configuracion</a>   
                                </div>
                            <button id="btnCerrarSesion" style="margin: 20px; padding: 10px; background: #d32f2f; color: white; border: none; border-radius: 5px; cursor: pointer;">🚪 Cerrar Sesión</button>
                        </div>
                        
                        <div id="overlay" class="sidebar-overlay" onclick="toggleSidebar()"></div>
                    </nav>
                </div>
            </header>
        `;
    } else if (token) {
        // =========================================
        // VISTA CLIENTE
        // =========================================
        archivoCSS = "../css/plantillaCliente.css";
        headerHTML = `
            <header>
                <div class="logo-section">
                    <a href="../Privada/principalCliente.html" style="text-decoration:none; display: flex; align-items: center; gap: 10px;">
                        ${logoSitio}
                        <h1 class="brand-name">${nombreSitio}</h1>
                    </a>
                </div>
                <button class="hamburger-btn" onclick="toggleMobileMenu()">☰</button>
                <div class="header-menu-container" id="mobileMenu">
                    <nav>
                        <a href="../index.html">Menú</a>
                        <a href="../pages/politicas.html">Políticas</a>
                        <a href="../pages/contactos.html">Contactos</a>
                    </nav>
                    <div class="user-actions">
                        <a href="../pages/perfil.html" class="btn-config" title="Configuración">⚙️</a>
                        <button id="btnCerrarSesion" class="btn-logout" style="border: none; cursor: pointer;">Cerrar Sesión</button>
                        <a href="../pages/carrito.html" class="cart-icon-container" title="Ver carrito">
                            🛒 <span class="cart-badge" id="cart-count">0</span>
                        </a>
                    </div>
                </div>
            </header>
        `;
    } else {
        // =========================================
        // VISTA INVITADO
        // =========================================
        archivoCSS = "../css/Plantilla.css";
        headerHTML = `
            <header>
                <div class="logo-section">
                    <a href="../index.html" style="text-decoration:none; display: flex; align-items: center; gap: 10px;">
                        ${logoSitio}
                        <h1 class="brand-name">${nombreSitio}</h1>
                    </a>
                </div>
                <button class="hamburger-btn" onclick="toggleMobileMenu()">☰</button>
                <div class="header-menu-container" id="mobileMenu">
                    <nav>
                        <a href="../index.html">Menú</a>
                        <a href="../pages/politicas.html">Políticas</a>
                        <a href="../pages/contactos.html">Contactos</a>
                    </nav>
                    <div class="user-actions">
                        <a href="../pages/login.html" class="btn-login">Login</a>
                        <a href="../pages/unete.html" class="btn-unete">Únete</a>
                    </div>
                </div>
            </header>
        `;
    }

    // 5. Inyectar el CSS del rol correspondiente
    const linkCSS = document.createElement("link");
    linkCSS.rel = "stylesheet";
    linkCSS.href = archivoCSS;
    document.head.appendChild(linkCSS);

    // 6. Inyectar el HTML al contenedor
    headerContainer.innerHTML = headerHTML;

    // 7. Configurar evento de Cerrar Sesión
    const btnCerrarSesion = document.getElementById("btnCerrarSesion");
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", () => {
            if (confirm('¿Estás seguro de salir de la sesión?')) {
                localStorage.clear();
                window.location.href = "../pages/login.html";
            }
        });
    }
});

// FUNCIONES GLOBALES (Controlan las clases CSS de animaciones.css)
window.toggleMobileMenu = function() {
    const menu = document.getElementById('mobileMenu');
    if (menu) menu.classList.toggle('show');
};

window.toggleSidebar = function() {
    const sidebar = document.getElementById("miSidebar");
    const overlay = document.getElementById("overlay");
    
    if (sidebar && overlay) {
        // Alternamos la clase 'active' definida en animaciones.css
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
};

// Función global para actualizar la burbuja del carrito
window.actualizarContadorHeader = function() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const totalArticulos = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    
    const cartBadge = document.getElementById('cart-count');
    if (cartBadge) {
        cartBadge.innerText = totalArticulos;
        
        // Animación de "pop" para que el usuario note el cambio
        cartBadge.style.transform = 'scale(1.3)';
        setTimeout(() => cartBadge.style.transform = 'scale(1)', 200);
        
        // Ocultar si es cero, mostrar si hay algo
        cartBadge.style.display = totalArticulos > 0 ? 'flex' : 'none';
    }
};

// Ejecutar al cargar para que el número persista al navegar
document.addEventListener('DOMContentLoaded', window.actualizarContadorHeader);