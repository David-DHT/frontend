document.addEventListener("DOMContentLoaded", async () => {
    const contenedor = document.getElementById("detalle-producto");
    const API_URL = "https://backend-liard-alpha-37.vercel.app/api/productos";

    const urlParams = new URLSearchParams(window.location.search);
    const idProducto = urlParams.get('id');

    if (!idProducto) {
        window.location.href = "../index.html";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${idProducto}`);
        const result = await response.json();

        if (result.success && result.data) {
            const prod = result.data;
            const token = localStorage.getItem('token');
            const stockDisponible = Number(prod.stock || 0) > 0;
            const productoActivo = String(prod.estado || '').toLowerCase() === 'activo';
            const puedeOrdenar = stockDisponible && productoActivo;

            contenedor.innerHTML = `
                <div class="product-image-container">
                    <img src="${prod.imagen || '../uploads/Bienvenido.png'}" 
                         alt="${prod.nombre}" 
                         class="product-image"
                         onerror="this.src='../uploads/Bienvenido.png';">
                         
                    <div class="action-buttons">
                        ${puedeOrdenar ? `
                            <button class="btn btn-primary" onclick="agregarAlCarrito(${prod.id_producto}, '${String(prod.nombre).replace(/'/g, "\\'")}', ${prod.precio}, '${prod.imagen}', ${prod.stock})">
                                🛒 Ordenar
                            </button>
                        ` : ''}

                        <button class="btn btn-tertiary" id="btn-fav">❤️ Añadir</button>
                    </div>
                </div>

                <div class="product-info">
                    <div>
                        <h1 class="product-title">${prod.nombre}</h1>
                        <span class="product-category">${prod.nombre_categoria || 'Categoría'}</span>
                    </div>

                    <div class="product-price">$${parseFloat(prod.precio || 0).toFixed(2)}</div>

                    <div class="product-status">
                        <span class="status-dot" style="background: ${puedeOrdenar ? '#48bb78' : '#e53e3e'};"></span>
                        <span class="status-text">${puedeOrdenar ? 'Disponible' : 'Agotado'}</span>
                    </div>

                    <div class="product-description">
                        <strong>Descripción:</strong><br><br>
                        ${prod.descripcion || 'Sin descripción disponible para este producto.'}
                    </div>

                    <div class="product-specs">
                        <div class="spec-item">
                            <div class="spec-label">Stock disponible</div>
                            <div class="spec-value">${prod.stock} unidades</div>
                        </div>
                        <div class="spec-item">
                            <div class="spec-label">Categoría</div>
                            <div class="spec-value">${prod.nombre_categoria}</div>
                        </div>
                        <div class="spec-item">
                            <div class="spec-label">Estado</div>
                            <div class="spec-value" style="color: ${puedeOrdenar ? '#48bb78' : '#e53e3e'};">
                                ${puedeOrdenar ? 'activo' : 'agotado'}
                            </div>
                        </div>
                        <div class="spec-item">
                            <div class="spec-label">Código</div>
                            <div class="spec-value">CMB-00${prod.id_producto}</div>
                        </div>
                    </div>
                </div>
            `;

            const btnFav = document.getElementById('btn-fav');
            if (btnFav) {
                btnFav.addEventListener('click', () => {
                    if (!token) {
                        alert("Debes iniciar sesión para guardar favoritos");
                        window.location.href = "login.html";
                    } else {
                        btnFav.innerHTML = btnFav.innerHTML.includes('❤️') ? '💚 Guardado' : '❤️ Añadir';
                    }
                });
            }

        } else {
            contenedor.innerHTML = `<div style="text-align:center; padding:50px;">
                <h2>⚠️ Producto no encontrado</h2>
                <a href="../index.html" class="btn-back">Volver al menú</a>
            </div>`;
        }

    } catch (error) {
        console.error("Error al obtener detalle:", error);
        contenedor.innerHTML = `<p style="color:red; text-align:center;">Error al conectar con el servidor.</p>`;
    }
});

window.agregarAlCarrito = function (id, nombre, precio, imagen, stock) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    const index = carrito.findIndex(item => item.id === id);

    if (index !== -1) {
        if (carrito[index].cantidad + 1 > stock) {
            alert(`No puedes agregar más, el stock máximo es ${stock}`);
            return;
        }
        carrito[index].cantidad += 1;
    } else {
        carrito.push({
            id: id,
            nombre: nombre,
            precio: parseFloat(precio),
            imagen: imagen || '../uploads/Bienvenido.png',
            cantidad: 1,
            stock: stock
        });
    }

    localStorage.setItem('carrito', JSON.stringify(carrito));
    alert(`¡${nombre} se agregó al carrito! 🛒`);

    if (window.actualizarContadorHeader) window.actualizarContadorHeader();
};