document.addEventListener('DOMContentLoaded', () => {
    cargarMenu();
});

function crearAnchorId(nombre) {
    let id = nombre.toLowerCase();
    id = id.replace(/ /g, '-');
    id = id.replace(/[áéíóúñ\.\/\(\)]/g, match => {
        const mapa = {
            'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ñ': 'n',
            '.': '', '/': '', '(': '', ')': ''
        };
        return mapa[match] || '';
    });
    return id;
}

function escaparHTML(texto) {
    const div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
}

const API_BASE = 'https://backend-liard-alpha-37.vercel.app/api';

let heroProductos = [];
let heroActual = 0;
let heroInterval = null;

function renderHeroCarousel() {
    const heroSlides = document.getElementById('heroSlides');
    if (!heroSlides) return;

    if (!heroProductos.length) {
        heroSlides.innerHTML = `<p style="padding:20px;">No hay productos destacados disponibles.</p>`;
        return;
    }

    heroSlides.innerHTML = heroProductos.map((prod, index) => `
        <a href="pages/gestionProductos.html?id=${prod.id_producto}" 
           class="hero-slide ${index === heroActual ? 'active' : ''}">
            <img src="${prod.imagen || 'uploads/Bienvenido.png'}" 
                 alt="${escaparHTML(prod.nombre)}"
                 onerror="this.src='uploads/Bienvenido.png';">
            <div class="hero-overlay">
                <span class="hero-badge">Producto destacado</span>
                <h2>${escaparHTML(prod.nombre)}</h2>
                <p>$${parseFloat(prod.precio || 0).toFixed(2)}</p>
            </div>
        </a>
    `).join('');
}

function moverHero(direccion) {
    if (!heroProductos.length) return;

    heroActual += direccion;

    if (heroActual < 0) {
        heroActual = heroProductos.length - 1;
    }

    if (heroActual >= heroProductos.length) {
        heroActual = 0;
    }

    renderHeroCarousel();
}

function iniciarHeroAutomatico() {
    if (heroInterval) clearInterval(heroInterval);

    heroInterval = setInterval(() => {
        moverHero(1);
    }, 4000);
}

function configurarControlesHero() {
    const btnPrev = document.getElementById('heroPrev');
    const btnNext = document.getElementById('heroNext');
    const heroCarousel = document.getElementById('heroCarousel');

    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            moverHero(-1);
            iniciarHeroAutomatico();
        });
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            moverHero(1);
            iniciarHeroAutomatico();
        });
    }

    if (heroCarousel) {
        heroCarousel.addEventListener('mouseenter', () => {
            if (heroInterval) clearInterval(heroInterval);
        });

        heroCarousel.addEventListener('mouseleave', () => {
            iniciarHeroAutomatico();
        });
    }
}

async function cargarMenu() {
    const sidebarMenu = document.getElementById('sidebarMenu');
    const contenedorProductos = document.getElementById('contenedorProductos');

    try {
        sidebarMenu.innerHTML = '<p style="padding:10px">Cargando categorías...</p>';
        contenedorProductos.innerHTML = '<p>Cargando el menú...</p>';

        const [respCategorias, respProductos] = await Promise.all([
            fetch(`${API_BASE}/categorias`),
            fetch(`${API_BASE}/productos`)
        ]);

        if (!respCategorias.ok || !respProductos.ok) {
            throw new Error('No se pudo obtener la información del backend');
        }

        const categoriasBD = await respCategorias.json();
        const productosBD = await respProductos.json();

        const categorias = categoriasBD.map(cat => ({
            idCategoria: cat.idCategoria,
            nombre: cat.nombre,
            descripcion: cat.descripcion,
            productos: []
        }));

        const productos = productosBD.data || [];

        productos.forEach(prod => {
            const categoriaEncontrada = categorias.find(
                cat => Number(cat.idCategoria) === Number(prod.categoria)
            );

            if (categoriaEncontrada) {
                categoriaEncontrada.productos.push(prod);
            }
        });

        sidebarMenu.innerHTML = '';
        contenedorProductos.innerHTML = '';

        if (categorias.length === 0) {
            sidebarMenu.innerHTML = '<p style="padding: 15px;">No hay categorías disponibles.</p>';
            contenedorProductos.innerHTML = '<p>Próximamente agregaremos productos a nuestro menú.</p>';
            return;
        }

        heroProductos = productos.filter(prod => prod.imagen);

        renderHeroCarousel();
        configurarControlesHero();

        if (heroProductos.length > 1) {
            iniciarHeroAutomatico();
        }

        categorias.forEach(cat => {
            const anchorId = crearAnchorId(cat.nombre);

            const linkSidebar = document.createElement('a');
            linkSidebar.href = `#${anchorId}`;
            linkSidebar.textContent = cat.nombre;
            sidebarMenu.appendChild(linkSidebar);

            let htmlProductos = '';

            if (cat.productos && cat.productos.length > 0) {
                cat.productos.forEach(prod => {
                    htmlProductos += `
                        <div class="menu-item">
                            <a href="pages/gestionProductos.html?id=${prod.id_producto}" class="menu-item-link">
                                <img src="${prod.imagen || 'uploads/Bienvenido.png'}" 
                                     alt="${escaparHTML(prod.nombre)}"
                                     onerror="this.src='uploads/Bienvenido.png';">
                                <span class="price-tag">$${parseFloat(prod.precio || 0).toFixed(2)}</span>
                                <div class="item-name">${escaparHTML(prod.nombre)}</div>
                            </a>
                        </div>
                    `;
                });
            } else {
                htmlProductos = `<p class="no-products">Próximamente más productos.</p>`;
            }

            const seccionHTML = `
                <section id="${anchorId}" class="menu-section">
                    <h2 class="section-title">${escaparHTML(cat.nombre)}</h2>
                    <div class="items-container">
                        ${htmlProductos}
                    </div>
                </section>
            `;

            contenedorProductos.insertAdjacentHTML('beforeend', seccionHTML);
        });

    } catch (error) {
        console.error("Error al cargar el menú:", error);
        sidebarMenu.innerHTML = '<p style="padding: 15px; color: red;">Error de conexión.</p>';
        contenedorProductos.innerHTML = '<p style="color: red;">Ocurrió un error al intentar conectar con el servidor.</p>';
    }
}