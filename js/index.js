document.addEventListener('DOMContentLoaded', () => {
    cargarMenu();
});

const API_BASE = 'https://backend-liard-alpha-37.vercel.app/api';

let heroProductos = [];
let heroActual = 0;
let heroInterval = null;
let productosDisponiblesBusqueda = [];

function crearAnchorId(nombre) {
    let id = String(nombre || '').toLowerCase();
    id = id.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    id = id.replace(/[^a-z0-9]+/g, '-');
    id = id.replace(/^-+|-+$/g, '');
    return id;
}

function escaparHTML(texto) {
    const div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
}

function esProductoDisponible(prod) {
    return String(prod.estado || '').toLowerCase() === 'activo' && Number(prod.stock || 0) > 0;
}

function renderHeroCarousel() {
    const heroSlides = document.getElementById('heroSlides');
    if (!heroSlides) return;

    if (!heroProductos.length) {
        heroSlides.innerHTML = `<p style="padding:20px;">No hay productos destacados disponibles.</p>`;
        return;
    }

    heroSlides.innerHTML = heroProductos.map((prod, index) => `
        <a href="pages/vistaDetalle.html?id=${prod.id_producto}" 
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

    if (heroActual < 0) heroActual = heroProductos.length - 1;
    if (heroActual >= heroProductos.length) heroActual = 0;

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
            if (heroProductos.length > 1) {
                iniciarHeroAutomatico();
            }
        });
    }
}

function configurarBuscador() {
    const input = document.getElementById('buscadorProductos');
    const resultados = document.getElementById('resultadosBusqueda');

    if (!input || !resultados) return;

    input.addEventListener('input', () => {
        const texto = input.value.trim().toLowerCase();

        if (!texto) {
            resultados.innerHTML = '';
            resultados.style.display = 'none';
            return;
        }

        const coincidencias = productosDisponiblesBusqueda
            .filter(prod =>
                String(prod.nombre || '').toLowerCase().includes(texto) ||
                String(prod.nombre_categoria || '').toLowerCase().includes(texto)
            )
            .slice(0, 8);

        if (!coincidencias.length) {
            resultados.innerHTML = `<div class="search-empty">No se encontraron productos</div>`;
            resultados.style.display = 'block';
            return;
        }

        resultados.innerHTML = coincidencias.map(prod => `
            <a href="pages/vistaDetalle.html?id=${prod.id_producto}" class="search-item">
                <img src="${prod.imagen || 'uploads/Bienvenido.png'}"
                     alt="${escaparHTML(prod.nombre)}"
                     onerror="this.src='uploads/Bienvenido.png';">
                <div class="search-item-info">
                    <strong>${escaparHTML(prod.nombre)}</strong>
                    <span>${escaparHTML(prod.nombre_categoria || 'Sin categoría')} · $${parseFloat(prod.precio || 0).toFixed(2)}</span>
                </div>
            </a>
        `).join('');

        resultados.style.display = 'block';
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) {
            resultados.innerHTML = '';
            resultados.style.display = 'none';
        }
    });
}

async function cargarCarruselTopVendidos() {
    try {
        const response = await fetch(`${API_BASE}/productos/top-vendidos`);
        if (!response.ok) {
            throw new Error('No se pudo obtener el top de productos');
        }

        const result = await response.json();
        heroProductos = result.data || [];

        renderHeroCarousel();
        configurarControlesHero();

        if (heroProductos.length > 1) {
            iniciarHeroAutomatico();
        }
    } catch (error) {
        console.error('Error al cargar carrusel top vendidos:', error);
        heroProductos = [];
        renderHeroCarousel();
    }
}

async function cargarMenu() {
    const sidebarMenu = document.getElementById('sidebarMenu');
    const contenedorProductos = document.getElementById('contenedorProductos');

    try {
        sidebarMenu.innerHTML = '<p style="padding:10px">Cargando categorías...</p>';
        contenedorProductos.innerHTML = '<p>Cargando el menú...</p>';

        const response = await fetch(`${API_BASE}/productos`);
        if (!response.ok) {
            throw new Error('No se pudo obtener la información de productos');
        }

        const productosBD = await response.json();
        const productos = (productosBD.data || []).filter(esProductoDisponible);

        productosDisponiblesBusqueda = productos;

        const mapaCategorias = new Map();

        productos.forEach(prod => {
            const nombreCategoria = prod.nombre_categoria || 'Sin categoría';

            if (!mapaCategorias.has(nombreCategoria)) {
                mapaCategorias.set(nombreCategoria, {
                    nombre: nombreCategoria,
                    productos: []
                });
            }

            mapaCategorias.get(nombreCategoria).productos.push(prod);
        });

        const categoriasConProductos = Array.from(mapaCategorias.values())
            .filter(cat => cat.productos.length > 0)
            .sort((a, b) => b.productos.length - a.productos.length);

        sidebarMenu.innerHTML = '';
        contenedorProductos.innerHTML = '';

        if (categoriasConProductos.length === 0) {
            sidebarMenu.innerHTML = '<p style="padding: 15px;">No hay categorías disponibles.</p>';
            contenedorProductos.innerHTML = '<p>Próximamente agregaremos productos a nuestro menú.</p>';
            return;
        }

        await cargarCarruselTopVendidos();
        configurarBuscador();

        categoriasConProductos.forEach(cat => {
            const anchorId = crearAnchorId(cat.nombre);

            const linkSidebar = document.createElement('a');
            linkSidebar.href = `#${anchorId}`;
            linkSidebar.textContent = `${cat.nombre} (${cat.productos.length})`;
            sidebarMenu.appendChild(linkSidebar);

            const productosOrdenados = [...cat.productos].sort((a, b) =>
                String(a.nombre).localeCompare(String(b.nombre), 'es')
            );

            const htmlProductos = productosOrdenados.map(prod => `
                <div class="menu-item">
                    <a href="pages/vistaDetalle.html?id=${prod.id_producto}" class="menu-item-link">
                        <img src="${prod.imagen || 'uploads/Bienvenido.png'}" 
                             alt="${escaparHTML(prod.nombre)}"
                             onerror="this.src='uploads/Bienvenido.png';">
                        <span class="price-tag">$${parseFloat(prod.precio || 0).toFixed(2)}</span>
                        <div class="item-name">${escaparHTML(prod.nombre)}</div>
                    </a>
                </div>
            `).join('');

            const seccionHTML = `
                <section id="${anchorId}" class="menu-section">
                    <h2 class="section-title">${escaparHTML(cat.nombre)}</h2>
                    <div class="items-container horizontal-row">
                        ${htmlProductos}
                    </div>
                </section>
            `;

            contenedorProductos.insertAdjacentHTML('beforeend', seccionHTML);
        });

    } catch (error) {
        console.error('Error al cargar el menú:', error);
        sidebarMenu.innerHTML = '<p style="padding: 15px; color: red;">Error de conexión.</p>';
        contenedorProductos.innerHTML = '<p style="color: red;">Ocurrió un error al intentar conectar con el servidor.</p>';
    }
}