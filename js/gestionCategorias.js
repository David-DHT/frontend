const API_CATEGORIAS = "https://backend-liard-alpha-37.vercel.app/api/categorias";

let categorias = [];
let modoEdicion = false;
let modalCategoria = null;

const tablaCategorias = document.getElementById("tablaCategorias");
const inputBuscarCategoria = document.getElementById("inputBuscarCategoria");
const btnNuevaCategoria = document.getElementById("btnNuevaCategoria");

const formCategoria = document.getElementById("formCategoria");
const tituloModalCategoria = document.getElementById("tituloModalCategoria");
const mensajeCategoria = document.getElementById("mensajeCategoria");

const categoriaId = document.getElementById("categoriaId");
const nombreCategoria = document.getElementById("nombreCategoria");
const descripcionCategoria = document.getElementById("descripcionCategoria");

function obtenerToken() {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function obtenerHeaders(json = true) {
    const token = obtenerToken();

    const headers = {};
    if (json) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;

    return headers;
}

function mostrarMensaje(mensaje, tipo = "success") {
    if (!mensajeCategoria) return;

    mensajeCategoria.innerHTML = `
    <div class="alert alert-${tipo}" role="alert">
      ${mensaje}
    </div>
  `;
}

function limpiarMensaje() {
    if (mensajeCategoria) mensajeCategoria.innerHTML = "";
}

function inicializarModal() {
    const modalElement = document.getElementById("modalCategoria");
    if (modalElement) {
        modalCategoria = new bootstrap.Modal(modalElement);
    }
}

function abrirModalAgregar() {
    modoEdicion = false;
    limpiarFormulario();
    limpiarMensaje();

    tituloModalCategoria.textContent = "Agregar categoría";
    modalCategoria.show();
}

function abrirModalEditar(categoria) {
    modoEdicion = true;
    limpiarMensaje();

    tituloModalCategoria.textContent = "Editar categoría";

    // Ajusta estas propiedades si en tu backend vienen con otros nombres
    categoriaId.value = categoria.idCategoria || categoria.id || "";
    nombreCategoria.value = categoria.nombre || categoria.nombreCategoria || "";
    descripcionCategoria.value = categoria.descripcion || "";

    modalCategoria.show();
}

function cerrarModal() {
    if (modalCategoria) {
        modalCategoria.hide();
    }
}

function limpiarFormulario() {
    categoriaId.value = "";
    nombreCategoria.value = "";
    descripcionCategoria.value = "";
}

async function cargarCategorias() {
    try {
        const response = await fetch(API_CATEGORIAS, {
            method: "GET",
            headers: obtenerHeaders(false)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "No se pudieron cargar las categorías");
        }

        // Si tu backend responde { categorias: [...] }, toma ese arreglo
        categorias = Array.isArray(data) ? data : (data.categorias || []);

        renderizarCategorias(categorias);
    } catch (error) {
        console.error("Error al cargar categorías:", error);
        if (tablaCategorias) {
            tablaCategorias.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-danger">
            ${error.message}
          </td>
        </tr>
      `;
        }
    }
}

function renderizarCategorias(lista) {
    if (!tablaCategorias) return;

    if (!lista || lista.length === 0) {
        tablaCategorias.innerHTML = `
      <tr>
        <td colspan="4" class="text-center">No hay categorías registradas</td>
      </tr>
    `;
        return;
    }

    tablaCategorias.innerHTML = lista.map((categoria, index) => {
        const id = categoria.idCategoria || categoria.id || "";
        const nombre = categoria.nombre || categoria.nombreCategoria || "Sin nombre";
        const descripcion = categoria.descripcion || "Sin descripción";

        return `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHTML(nombre)}</td>
        <td>${escapeHTML(descripcion)}</td>
        <td>
  <button class="btn btn-sm btn-primary me-2" onclick="editarCategoria(${id})">
    <i class="bi bi-pencil-square"></i>
  </button>
  <button class="btn btn-sm btn-danger" onclick="eliminarCategoria(${id})">
    <i class="bi bi-trash"></i>
  </button>
        </td>
      </tr>
    `;
    }).join("");
}

function filtrarCategorias() {
    const texto = inputBuscarCategoria.value.trim().toLowerCase();

    const filtradas = categorias.filter(categoria => {
        const nombre = (categoria.nombre || categoria.nombreCategoria || "").toLowerCase();
        const descripcion = (categoria.descripcion || "").toLowerCase();

        return nombre.includes(texto) || descripcion.includes(texto);
    });

    renderizarCategorias(filtradas);
}

async function agregarCategoria() {
    const payload = {
        nombre: nombreCategoria.value.trim(),
        descripcion: descripcionCategoria.value.trim()
    };

    if (!payload.nombre) {
        mostrarMensaje("El nombre de la categoría es obligatorio", "danger");
        return;
    }

    try {
        const response = await fetch(API_CATEGORIAS, {
            method: "POST",
            headers: obtenerHeaders(true),
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "No se pudo agregar la categoría");
        }

        mostrarMensaje(data.message || "Categoría agregada correctamente", "success");

        await cargarCategorias();

        setTimeout(() => {
            cerrarModal();
            limpiarFormulario();
            limpiarMensaje();
        }, 700);

    } catch (error) {
        console.error("Error al agregar categoría:", error);
        mostrarMensaje(error.message, "danger");
    }
}

async function actualizarCategoria() {
    const id = categoriaId.value.trim();

    const payload = {
        nombre: nombreCategoria.value.trim(),
        descripcion: descripcionCategoria.value.trim()
    };

    if (!id) {
        mostrarMensaje("No se encontró el ID de la categoría", "danger");
        return;
    }

    if (!payload.nombre) {
        mostrarMensaje("El nombre de la categoría es obligatorio", "danger");
        return;
    }

    try {
        const response = await fetch(`${API_CATEGORIAS}/${id}`, {
            method: "PUT",
            headers: obtenerHeaders(true),
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "No se pudo actualizar la categoría");
        }

        mostrarMensaje(data.message || "Categoría actualizada correctamente", "success");

        await cargarCategorias();

        setTimeout(() => {
            cerrarModal();
            limpiarFormulario();
            limpiarMensaje();
        }, 700);

    } catch (error) {
        console.error("Error al actualizar categoría:", error);
        mostrarMensaje(error.message, "danger");
    }
}

async function eliminarCategoria(id) {
    const confirmacion = confirm("¿Deseas eliminar esta categoría?");
    if (!confirmacion) return;

    try {
        const response = await fetch(`${API_CATEGORIAS}/${id}`, {
            method: "DELETE",
            headers: obtenerHeaders(false)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "No se pudo eliminar la categoría");
        }

        alert(data.message || "Categoría eliminada correctamente");
        await cargarCategorias();

    } catch (error) {
        console.error("Error al eliminar categoría:", error);
        alert(error.message);
    }
}

window.editarCategoria = function (id) {
    const categoria = categorias.find(cat =>
        String(cat.idCategoria || cat.id) === String(id)
    );

    if (!categoria) {
        alert("No se encontró la categoría seleccionada");
        return;
    }

    abrirModalEditar(categoria);
};

async function manejarSubmitCategoria(e) {
    e.preventDefault();

    if (modoEdicion) {
        await actualizarCategoria();
    } else {
        await agregarCategoria();
    }
}

function escapeHTML(texto) {
    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
    inicializarModal();
    cargarCategorias();

    if (btnNuevaCategoria) {
        btnNuevaCategoria.addEventListener("click", abrirModalAgregar);
    }

    if (inputBuscarCategoria) {
        inputBuscarCategoria.addEventListener("input", filtrarCategorias);
    }

    if (formCategoria) {
        formCategoria.addEventListener("submit", manejarSubmitCategoria);
    }
});