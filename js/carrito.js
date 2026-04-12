document.addEventListener('DOMContentLoaded', () => {
    renderizarCarrito();
});

function obtenerCarrito() {
    return JSON.parse(localStorage.getItem('carrito')) || [];
}

function guardarCarrito(carrito) {
    localStorage.setItem('carrito', JSON.stringify(carrito));
    renderizarCarrito();
    // Opcional: Actualizar contador del header si tienes la función
    if (window.actualizarContadorHeader) window.actualizarContadorHeader();
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
    carrito[index].cantidad += delta;
    
    if (carrito[index].cantidad < 1) {
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

window.procederAlPago = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Debes iniciar sesión para finalizar la compra.");
        window.location.href = "login.html";
        return;
    }
    alert("¡Gracias por tu compra! (Aquí conectarías con la pasarela de pago)");
};