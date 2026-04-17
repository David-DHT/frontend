document.addEventListener('DOMContentLoaded', () => {
    renderizarCarrito();
});

function obtenerCarrito() {
    return JSON.parse(localStorage.getItem('carrito')) || [];
}

function guardarCarrito(carrito) {
    localStorage.setItem('carrito', JSON.stringify(carrito));
    renderizarCarrito();

    if (window.actualizarContadorHeader) {
        window.actualizarContadorHeader();
    }

    window.dispatchEvent(new Event('carritoActualizado'));
}

function renderizarCarrito() {
    const contenedor = document.getElementById('cart-container');
    const carrito = obtenerCarrito();

    if (carrito.length === 0) {
        contenedor.innerHTML = `
            <div class="empty-cart">
                <h3>Tu carrito está vacío</h3>
                <a href="../index.html" class="btn-back">Volver a la tienda</a>
            </div>`;
        return;
    }

    let total_pagar = 0;
    let html = `
        <table class="cart-table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Precio Unitario</th>
                    <th style="text-align: center;">Cantidad</th>
                    <th style="text-align: right;">Subtotal</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>`;

    carrito.forEach((prod, index) => {
        const subtotal = prod.precio * prod.cantidad;
        total_pagar += subtotal;
        html += `
            <tr>
                <td>
                    <div class="product-cell">
                        <img src="${prod.imagen}" class="product-img" alt="${prod.nombre}" onerror="this.src='../uploads/Bienvenido.png'">
                        <span class="product-name">${prod.nombre}</span>
                    </div>
                </td>
                <td>$${parseFloat(prod.precio).toFixed(2)}</td>
                <td style="text-align: center;">
                    <div class="quantity-controls">
                        <button class="btn-qty" onclick="cambiarCantidad(${index}, -1)">-</button>
                        <span style="font-weight: bold; width: 25px; display: inline-block;">${prod.cantidad}</span>
                        <button class="btn-qty" onclick="cambiarCantidad(${index}, 1)">+</button>
                    </div>
                </td>
                <td style="text-align: right; font-weight: bold; color: #2d3748;">
                    $${subtotal.toFixed(2)}
                </td>
                <td style="text-align: center;">
                    <button class="btn-delete" onclick="eliminarDelCarrito(${index})">🗑️</button>
                </td>
            </tr>`;
    });

    html += `
            </tbody>
        </table>
        <div class="cart-summary">
            <h3 class="total-text">Total a pagar: <strong>$${total_pagar.toFixed(2)}</strong></h3>
            <button class="btn-pay" onclick="procederAlPago()">Proceder al Pago</button>
        </div>`;
    
    
    
    contenedor.innerHTML = html;
}

window.cambiarCantidad = (index, delta) => {
    const carrito = obtenerCarrito();
    const producto = carrito[index];
    const nuevaCantidad = producto.cantidad + delta;

   if (delta > 0 && producto.stock !== undefined && nuevaCantidad > producto.stock) {
        alert(`Solo hay ${producto.stock} unidades disponibles para este producto.`);
        return; 
    }
    producto.cantidad=nuevaCantidad;

    if (producto.cantidad < 1) {
        eliminarDelCarrito(index);
    } else {
        guardarCarrito(carrito);
    }
};

window.eliminarDelCarrito = (index) => {
    const carrito = obtenerCarrito();
    carrito.splice(index, 1);
    guardarCarrito(carrito);
};


const procederAlPago = async () => {
   // 1. Obtenemos el carrito y el token de login
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const token = localStorage.getItem("token"); // Tu middleware lo pide

    try {
        // 2. Llamamos a tu backend en Vercel
        const response = await fetch('https://backend-liard-alpha-37.vercel.app/api/pago/crear-preferencia', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Para pasar el verificarToken
            },
            body: JSON.stringify(carrito)
        });

        const data = await response.json();

        // 3. Redirigimos a Mercado Pago
        if (data.init_point) {
            window.location.href = data.init_point;
        }

    } catch (error) {
        console.error("Error al procesar el pago:", error);
        alert("Hubo un error al conectar con Mercado Pago");
    }
};