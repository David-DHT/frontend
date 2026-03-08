document.addEventListener('DOMContentLoaded', () => {
    cargarMenu();
});

function crearAnchorId(nombre) {
    let id = nombre.toLowerCase();
    id = id.replace(/ /g, '-');
    id = id.replace(/[áéíóúñ\.\/\(\)]/g, match => {
        const mapa = {
            'á':'a', 'é':'e', 'í':'i', 'ó':'o', 'ú':'u', 'ñ':'n',
            '.':'', '/':'', '(':'', ')':''
        };
        return mapa[match] || '';
    });
    return id;
}

// Función principal que trae categorías y productos
async function cargarMenu() {
    const sidebarMenu = document.getElementById('sidebarMenu');
    const contenedorProductos = document.getElementById('contenedorProductos');

    try {
        // En tu backend de Node.js, lo ideal es crear un endpoint que te devuelva 
        // un arreglo de categorías, y dentro de cada categoría un arreglo con sus productos.
        // const respuesta = await fetch('http://localhost:3000/api/menu');
        // const categorias = await respuesta.json();

        // ---------------------------------------------------------
        // SIMULACIÓN DE DATOS (Elimina esto cuando tengas tu API)
        const categorias = [
            {
                idCategoria: 1,
                nombre: "Bebidas Calientes",
                productos: [
                    { id_producto: 1, nombre: "Café Americano", precio: 35.00, imagen: "uploads/1763622603_691ebecb82261.png" },
                    { id_producto: 2, nombre: "Cappuccino", precio: 45.00, imagen: "uploads/1763624707_691ec70397acf.png" }
                ]
            },
            {
                idCategoria: 2,
                nombre: "Postres",
                productos: [] // Simulacion
            }
        ];
        sidebarMenu.innerHTML = '';
        contenedorProductos.innerHTML = '';

        if (categorias.length === 0) {
            sidebarMenu.innerHTML = '<p style="padding: 15px;">No hay categorías disponibles.</p>';
            contenedorProductos.innerHTML = '<p>Próximamente agregaremos productos a nuestro menú.</p>';
            return;
        }

        // Renderizar dinámicamente
        categorias.forEach(cat => {
            const anchorId = crearAnchorId(cat.nombre);

            // 1. Agregar link al Sidebar
            const linkSidebar = document.createElement('a');
            linkSidebar.href = `#${anchorId}`;
            linkSidebar.textContent = cat.nombre;
            sidebarMenu.appendChild(linkSidebar);

            // 2. Crear sección de productos
            let htmlProductos = '';
            
            if (cat.productos && cat.productos.length > 0) {
                cat.productos.forEach(prod => {
                    htmlProductos += `
                        <div class="menu-item">
                            <a href="Privada/VistaDetalle.html?id=${prod.id_producto}" class="menu-item-link">
                                <img src="${prod.imagen}" alt="${prod.nombre}" onerror="this.src='Styles/default-product.png';"> 
                                <span class="price-tag">$${parseFloat(prod.precio).toFixed(2)}</span>
                                <div class="item-name">${prod.nombre}</div>
                            </a>
                        </div>
                    `;
                });
            } else {
                htmlProductos = `<p class='no-products'>Próximamente más productos.</p>`;
            }

            // Inyectar sección en el contenedor principal
            const seccionHTML = `
                <section id="${anchorId}" class="menu-section">
                    <h2 class="section-title">${cat.nombre}</h2>
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