const API_BASE = "https://backend-liard-alpha-37.vercel.app/api";
const LIMITE_STOCK_BAJO = 10;

let graficaTopProductos = null;

document.addEventListener("DOMContentLoaded", async () => {
    const token = obtenerToken();

    if (!token) {
        alert("Tu sesión no está activa. Inicia sesión nuevamente.");
        window.location.href = "login.html";
        return;
    }

    const btnRecargar = document.getElementById("btnRecargarReportes");
    if (btnRecargar) {
        btnRecargar.addEventListener("click", cargarDashboardReportes);
    }

    await cargarDashboardReportes();
});

function obtenerToken() {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function obtenerHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${obtenerToken()}`
    };
}

async function fetchJSON(url) {
    const response = await fetch(url, {
        method: "GET",
        headers: obtenerHeaders()
    });

    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        alert("Tu sesión expiró. Inicia sesión nuevamente.");
        window.location.href = "login.html";
        throw new Error("Sesión expirada");
    }

    if (!response.ok) {
        throw new Error(`Error al consultar ${url}`);
    }

    return response.json();
}

function extraerArreglo(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.categorias)) return data.categorias;
    if (Array.isArray(data?.usuarios)) return data.usuarios;
    if (Array.isArray(data?.productos)) return data.productos;
    return [];
}

function formatearPorcentaje(valor) {
    return `${Number(valor || 0).toFixed(1)}%`;
}

function escapeHTML(texto) {
    return String(texto || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function obtenerNombreCategoria(item) {
    return item.nombre_categoria || item.categoria_nombre || item.categoria || "Sin categoría";
}

function obtenerNombreProductoInventario(item) {
    return item.nombre_producto || item.producto || item.nombre || "Producto";
}

function obtenerStock(item) {
    return Number(item.stock_actual ?? item.stock ?? item.cantidad ?? 0);
}

function obtenerColorDinamico(index, total) {
    const baseHue = 28;
    const step = total > 1 ? 28 / (total - 1) : 0;
    const lightness = 30 + (index * 3);
    return `hsl(${baseHue + (index * step)}, 58%, ${Math.min(lightness, 72)}%)`;
}

async function cargarDashboardReportes() {
    try {
        mostrarEstadoGrafica("Cargando información de ventas...");
        await Promise.all([
            cargarContadoresGenerales(),
            cargarTopProductosMasVendidos(),
            cargarProductosStockBajo()
        ]);
    } catch (error) {
        console.error("Error al cargar dashboard de reportes:", error);
        mostrarEstadoGrafica("No se pudo cargar la información del panel.");
    }
}

async function cargarContadoresGenerales() {
    try {
        const [categoriasData, productosData, usuariosData] = await Promise.all([
            fetchJSON(`${API_BASE}/categorias`),
            fetchJSON(`${API_BASE}/productos`),
            fetchJSON(`${API_BASE}/usuarios`)
        ]);

        const categorias = extraerArreglo(categoriasData);
        const productos = extraerArreglo(productosData);
        const usuarios = extraerArreglo(usuariosData);

        document.getElementById("totalCategorias").textContent = categorias.length;
        document.getElementById("totalProductos").textContent = productos.length;
        document.getElementById("totalUsuarios").textContent = usuarios.length;
    } catch (error) {
        console.error("Error al cargar contadores generales:", error);
        document.getElementById("totalCategorias").textContent = "--";
        document.getElementById("totalProductos").textContent = "--";
        document.getElementById("totalUsuarios").textContent = "--";
    }
}

async function cargarTopProductosMasVendidos() {
    const tbody = document.getElementById("tablaTopProductos");
    const resumen = document.getElementById("resumenTopProductos");
    const tituloTop = document.getElementById("productoMasVendido");
    const textoTop = document.getElementById("textoProductoMasVendido");

    try {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center p-4">Analizando ventas registradas...</td>
            </tr>
        `;

        const ventasData = await fetchJSON(`${API_BASE}/ventas`);
        const ventas = extraerArreglo(ventasData);

        const ventasActivas = ventas.filter((venta) => {
            const estado = String(venta.estatus || venta.estado || "").toLowerCase();
            return estado !== "cancelada";
        });

        if (!ventasActivas.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center p-4">No hay ventas activas para analizar.</td>
                </tr>
            `;
            resumen.textContent = "No hay suficiente información para generar el ranking.";
            tituloTop.textContent = "---";
            textoTop.textContent = "Sin ventas activas";
            destruirGrafica();
            mostrarEstadoGrafica("No hay ventas activas para mostrar en la gráfica.");
            return;
        }

        const detallesPorVenta = await Promise.all(
            ventasActivas.map(async (venta) => {
                try {
                    const detalleData = await fetchJSON(`${API_BASE}/ventas/${venta.id_venta}`);
                    return detalleData?.data || null;
                } catch (error) {
                    console.warn(`No se pudo cargar el detalle de la venta ${venta.id_venta}`, error);
                    return null;
                }
            })
        );

        const acumuladoProductos = new Map();

        detallesPorVenta.forEach((venta) => {
            if (!venta || !Array.isArray(venta.detalles)) return;

            venta.detalles.forEach((detalle) => {
                const nombre = detalle.nombre_producto || "Producto sin nombre";
                const cantidad = Number(detalle.cantidad || 0);

                if (!acumuladoProductos.has(nombre)) {
                    acumuladoProductos.set(nombre, 0);
                }

                acumuladoProductos.set(nombre, acumuladoProductos.get(nombre) + cantidad);
            });
        });

        const ranking = Array.from(acumuladoProductos.entries())
            .map(([nombre, cantidad]) => ({ nombre, cantidad }))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 10);

        if (!ranking.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center p-4">No se encontraron productos vendidos.</td>
                </tr>
            `;
            resumen.textContent = "No fue posible calcular el top de productos.";
            tituloTop.textContent = "---";
            textoTop.textContent = "Sin datos disponibles";
            destruirGrafica();
            mostrarEstadoGrafica("No se encontraron productos vendidos.");
            return;
        }

        const totalTopVentas = ranking.reduce((sum, item) => sum + item.cantidad, 0);
        const rankingConPorcentaje = ranking.map((item) => ({
            ...item,
            porcentaje: totalTopVentas > 0 ? (item.cantidad / totalTopVentas) * 100 : 0
        }));

        const productoTop = rankingConPorcentaje[0];

        tituloTop.textContent = productoTop.nombre;
        textoTop.textContent = `${productoTop.cantidad} unidades vendidas (${formatearPorcentaje(productoTop.porcentaje)})`;

        tbody.innerHTML = rankingConPorcentaje.map((item, index) => `
            <tr>
                <td><span class="top-pill">#${index + 1}</span></td>
                <td>${escapeHTML(item.nombre)}</td>
                <td>${item.cantidad}</td>
                <td>${formatearPorcentaje(item.porcentaje)}</td>
            </tr>
        `).join("");

        resumen.innerHTML = `
            El producto con mayor salida es <strong>${escapeHTML(productoTop.nombre)}</strong>,
            con <strong>${productoTop.cantidad} unidades vendidas</strong>, lo que representa
            <strong>${formatearPorcentaje(productoTop.porcentaje)}</strong> del total concentrado
            en el top 10 de productos más vendidos.
        `;

        renderizarGraficaTopProductos(rankingConPorcentaje);
        mostrarEstadoGrafica("Gráfica actualizada con base en ventas activas registradas.");
    } catch (error) {
        console.error("Error al cargar top de productos más vendidos:", error);

        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center p-4 text-danger">No se pudo cargar el ranking de ventas.</td>
            </tr>
        `;

        resumen.textContent = "No fue posible generar el resumen del top de productos.";
        tituloTop.textContent = "---";
        textoTop.textContent = "Error al procesar información";
        destruirGrafica();
        mostrarEstadoGrafica("Ocurrió un error al generar la gráfica.");
    }
}

function renderizarGraficaTopProductos(data) {
    const canvas = document.getElementById("graficaTopProductos");
    if (!canvas) return;

    destruirGrafica();

    const labels = data.map((item) => item.nombre);
    const porcentajes = data.map((item) => Number(item.porcentaje.toFixed(2)));
    const colores = data.map((_, index) => obtenerColorDinamico(index, data.length));

    graficaTopProductos = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels,
            datasets: [{
                label: "Participación de ventas (%)",
                data: porcentajes,
                backgroundColor: colores,
                borderColor: "#ffffff",
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "58%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        boxWidth: 14,
                        padding: 16,
                        font: {
                            size: 12,
                            weight: "600"
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const item = data[context.dataIndex];
                            return `${item.nombre}: ${formatearPorcentaje(item.porcentaje)} (${item.cantidad} unidades)`;
                        }
                    }
                }
            }
        }
    });
}

function destruirGrafica() {
    if (graficaTopProductos) {
        graficaTopProductos.destroy();
        graficaTopProductos = null;
    }
}

function mostrarEstadoGrafica(texto) {
    const estado = document.getElementById("estadoGrafica");
    if (estado) {
        estado.textContent = texto;
    }
}

async function cargarProductosStockBajo() {
    const tbody = document.getElementById("tablaStockBajo");
    const contador = document.getElementById("contadorStockBajo");

    try {
        const inventarioData = await fetchJSON(`${API_BASE}/inventario`);
        const inventario = extraerArreglo(inventarioData);

        const stockBajo = inventario
            .map((item) => ({
                nombre: obtenerNombreProductoInventario(item),
                categoria: obtenerNombreCategoria(item),
                stock: obtenerStock(item)
            }))
            .filter((item) => item.stock <= LIMITE_STOCK_BAJO)
            .sort((a, b) => a.stock - b.stock);

        contador.textContent = `${stockBajo.length} en riesgo`;

        if (!stockBajo.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center p-4">
                        No hay productos con stock bajo por el momento.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = stockBajo.map((item) => {
            const nivelClase = item.stock <= 3 ? "critico" : "bajo";
            const nivelTexto = item.stock <= 3 ? "Crítico" : "Bajo";

            return `
                <tr>
                    <td>${escapeHTML(item.nombre)}</td>
                    <td>${escapeHTML(item.categoria)}</td>
                    <td><span class="stock-value">${item.stock}</span></td>
                    <td>
                        <span class="stock-level ${nivelClase}">
                            ${nivelTexto}
                        </span>
                    </td>
                </tr>
            `;
        }).join("");
    } catch (error) {
        console.error("Error al cargar productos con stock bajo:", error);

        contador.textContent = "Error";
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center p-4 text-danger">
                    No se pudo cargar el inventario crítico.
                </td>
            </tr>
        `;
    }
}