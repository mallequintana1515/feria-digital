// Esperar a que el DOM esté completamente listo
document.addEventListener("DOMContentLoaded", function() {
  
  // ====== GESTIÓN DE VISTAS ======
  function mostrarVista(nombre) {
    const vistas = document.querySelectorAll(".vista");
    vistas.forEach(v => v.classList.remove("activa"));

    const objetivo = document.getElementById(`vista-${nombre}`);
    if (objetivo) {
      objetivo.classList.add("activa");
      window.scrollTo(0, 0);
    }
    
    // Actualizar nav
    document.querySelectorAll(".nav-btn").forEach(btn => {
      btn.classList.remove("activo");
    });
    const bottonActual = document.querySelector(`[data-vista="${nombre}"]`);
    if (bottonActual) bottonActual.classList.add("activo");
  }

  // Hacer la función global
  window.mostrarVista = mostrarVista;

  // Botones de navegación
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const vista = btn.getAttribute("data-vista");
      mostrarVista(vista);
    });
  });

  // Botones volver
  const btnVolverCultivo = document.getElementById("volver-cultivo");
  const btnVolverGaleria = document.getElementById("volver-galeria");
  const btnVolverHistorias = document.getElementById("volver-historias");
  const btnVolverContacto = document.getElementById("volver-contacto");

  if (btnVolverCultivo) btnVolverCultivo.addEventListener("click", () => mostrarVista("inicio"));
  if (btnVolverGaleria) btnVolverGaleria.addEventListener("click", () => mostrarVista("inicio"));
  if (btnVolverHistorias) btnVolverHistorias.addEventListener("click", () => mostrarVista("inicio"));
  if (btnVolverContacto) btnVolverContacto.addEventListener("click", () => mostrarVista("inicio"));

  // ====== GESTIÓN DE GALERÍA ======
  const inputImagen = document.getElementById("input-imagen");
  const zonaSubida = document.getElementById("zona-subida");
  const contenedorGaleria = document.getElementById("contenedor-galeria");

  let galeria = JSON.parse(localStorage.getItem("galeria")) || [];

  function guardarGaleria() {
    localStorage.setItem("galeria", JSON.stringify(galeria));
    actualizarContadores();
  }

  function actualizarContadores() {
    const categorias = {
      cafe: 0,
      platano: 0,
      cacao: 0,
      todos: galeria.length
    };

    galeria.forEach(item => {
      if (item.categoria in categorias) {
        categorias[item.categoria]++;
      }
    });

    document.querySelectorAll(".btn-filtro").forEach(btn => {
      const filtro = btn.getAttribute("data-filtro");
      const numero = categorias[filtro] || 0;
      btn.textContent = btn.textContent.split('(')[0].trim() + ` (${numero})`;
    });
  }

  function crearElementoImagen(src, categoría, timestamp) {
    const div = document.createElement("div");
    div.className = "imagen-item";
    div.setAttribute("data-categoria", categoría);
    
    const img = document.createElement("img");
    img.src = src;
    
    const info = document.createElement("div");
    info.className = "info-imagen";
    const categoriaText = {
      cafe: "Café",
      platano: "Plátano",
      cacao: "Cacao"
    }[categoría] || categoría;
    
    info.innerHTML = `<strong>${categoriaText}</strong><br><small>${new Date(timestamp).toLocaleDateString('es-ES')}</small>`;
    
    const btnEliminar = document.createElement("button");
    btnEliminar.className = "btn-eliminar";
    btnEliminar.textContent = "✕";
    btnEliminar.type = "button";
    btnEliminar.onclick = (e) => {
      e.stopPropagation();
      if (confirm("¿Deseas eliminar esta imagen?")) {
        const index = galeria.findIndex(img => img.timestamp === timestamp);
        if (index > -1) {
          galeria.splice(index, 1);
          guardarGaleria();
          renderizarGaleria();
        }
      }
    };
    
    div.appendChild(img);
    div.appendChild(info);
    div.appendChild(btnEliminar);
    
    return div;
  }

  function renderizarGaleria() {
    if (!contenedorGaleria) return;
    
    contenedorGaleria.innerHTML = "";
    
    const filtroBtn = document.querySelector(".btn-filtro.activo");
    const filtroActivo = filtroBtn ? filtroBtn.getAttribute("data-filtro") : "todos";
    
    let contadorMostrado = 0;
    galeria.forEach(item => {
      if (filtroActivo === "todos" || item.categoria === filtroActivo) {
        const elemento = crearElementoImagen(item.src, item.categoria, item.timestamp);
        contenedorGaleria.appendChild(elemento);
        contadorMostrado++;
      }
    });

    if (contadorMostrado === 0) {
      contenedorGaleria.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px 20px;">No hay imágenes en esta categoría. ¡Sube la primera!</p>';
    }
  }

  // Inicializar galería
  actualizarContadores();
  renderizarGaleria();

  // Sistema de filtros
  document.querySelectorAll(".btn-filtro").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn-filtro").forEach(b => b.classList.remove("activo"));
      btn.classList.add("activo");
      renderizarGaleria();
    });
  });

  // Procesar archivos
  function procesarArchivos(archivos) {
    if (archivos.length === 0) {
      alert("Por favor selecciona al menos una imagen");
      return;
    }

    let procesadas = 0;
    Array.from(archivos).forEach((archivo, index) => {
      if (archivo.type.startsWith("image/")) {
        if (archivo.size > 10 * 1024 * 1024) {
          alert(`La imagen ${archivo.name} excede 10MB`);
          return;
        }

        const lector = new FileReader();
        
        lector.onload = (e) => {
          const categoria = prompt("¿A qué categoría pertenece esta imagen?\n\n1 = Café\n2 = Plátano\n3 = Cacao\n\n(Escribe el número o presiona Cancel)", "1");
          
          if (categoria === null) return;
          
          let categoriaFinal = "cafe";
          if (categoria === "2") categoriaFinal = "platano";
          else if (categoria === "3") categoriaFinal = "cacao";
          
          galeria.push({
            src: e.target.result,
            categoria: categoriaFinal,
            timestamp: Date.now() + procesadas
          });
          
          procesadas++;
          
          if (procesadas === Object.keys(archivos).filter(k => archivos[k].type.startsWith("image/")).length) {
            guardarGaleria();
            renderizarGaleria();
            alert(`¡${procesadas} imagen(es) subida(s) exitosamente!`);
          }
        };

        lector.onerror = () => {
          alert("Error al cargar la imagen: " + archivo.name);
        };
        
        lector.readAsDataURL(archivo);
      }
    });
  }

  // Clic en zona de subida
  if (zonaSubida) {
    zonaSubida.addEventListener("click", () => {
      if (inputImagen) inputImagen.click();
    });
  }

  // Seleccionar archivos
  if (inputImagen) {
    inputImagen.addEventListener("change", (e) => {
      procesarArchivos(e.target.files);
      e.target.value = "";
    });
  }

  // Drag and drop
  if (zonaSubida) {
    zonaSubida.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      zonaSubida.style.borderColor = "var(--color-primario)";
      zonaSubida.style.background = "linear-gradient(135deg, rgba(46, 204, 113, 0.1), rgba(39, 174, 96, 0.1))";
    });

    zonaSubida.addEventListener("dragleave", (e) => {
      e.preventDefault();
      zonaSubida.style.borderColor = "var(--color-primario)";
      zonaSubida.style.background = "linear-gradient(135deg, rgba(46, 204, 113, 0.05), rgba(39, 174, 96, 0.05))";
    });

    zonaSubida.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      zonaSubida.style.borderColor = "var(--color-primario)";
      zonaSubida.style.background = "linear-gradient(135deg, rgba(46, 204, 113, 0.05), rgba(39, 174, 96, 0.05))";
      
      procesarArchivos(e.dataTransfer.files);
    });
  }

  // ====== GESTIÓN DE HISTORIAS ======
  const btnGuardarHistoria = document.getElementById("btn-guardar-historia");
  const tituloHistoria = document.getElementById("titulo-historia");
  const contenidoHistoria = document.getElementById("contenido-historia");
  const contenedorHistorias = document.getElementById("contenedor-historias");

  let historias = JSON.parse(localStorage.getItem("historias")) || [];

  function guardarHistorias() {
    localStorage.setItem("historias", JSON.stringify(historias));
    actualizarContadorHistorias();
  }

  function actualizarContadorHistorias() {
    const contador = document.querySelector(".total-historias");
    if (contador) {
      contador.textContent = `(${historias.length} ${historias.length === 1 ? 'historia' : 'historias'})`;
    }
  }

  function renderizarHistorias() {
    if (!contenedorHistorias) return;
    
    contenedorHistorias.innerHTML = "";
    
    if (historias.length === 0) {
      contenedorHistorias.innerHTML = '<p style="text-align: center; color: #666; padding: 40px 20px;">No hay historias aún. ¡Comparte la primera!</p>';
      actualizarContadorHistorias();
      return;
    }
    
    historias.forEach((historia, index) => {
      const div = document.createElement("div");
      div.className = "historia-item";
      
      const fecha = new Date(historia.timestamp).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      div.innerHTML = `
        <h4>${historia.titulo}</h4>
        <p>${historia.contenido}</p>
        <div class="historia-fecha">📅 ${fecha}</div>
      `;
      
      contenedorHistorias.appendChild(div);
    });

    actualizarContadorHistorias();
  }

  // Inicializar historias
  renderizarHistorias();

  // Contadores en tiempo real
  if (tituloHistoria) {
    tituloHistoria.addEventListener("input", (e) => {
      const contador = e.target.nextElementSibling;
      if (contador) contador.textContent = `${e.target.value.length}/100`;
    });
  }

  if (contenidoHistoria) {
    contenidoHistoria.addEventListener("input", (e) => {
      const contador = e.target.nextElementSibling;
      if (contador) contador.textContent = `${e.target.value.length}/1000`;
    });
  }

  // Guardar nueva historia
  if (btnGuardarHistoria) {
    btnGuardarHistoria.addEventListener("click", () => {
      const titulo = tituloHistoria.value.trim();
      const contenido = contenidoHistoria.value.trim();
      
      if (titulo === "" || contenido === "") {
        alert("Por favor completa el título y el contenido");
        return;
      }
      
      historias.unshift({
        titulo: titulo,
        contenido: contenido,
        timestamp: Date.now()
      });
      
      guardarHistorias();
      renderizarHistorias();
      
      tituloHistoria.value = "";
      contenidoHistoria.value = "";
      
      // Resetear contadores
      tituloHistoria.nextElementSibling.textContent = "0/100";
      contenidoHistoria.nextElementSibling.textContent = "0/1000";
      
      alert("¡Historia publicada exitosamente!");
    });
  }

  // ====== FORMULARIO DE CONTACTO ======
  const formularioContacto = document.getElementById("formulario-contacto");
  
  if (formularioContacto) {
    formularioContacto.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const nombre = document.getElementById("contacto-nombre").value.trim();
      const email = document.getElementById("contacto-email").value.trim();
      const asunto = document.getElementById("contacto-asunto").value.trim();
      const mensaje = document.getElementById("contacto-mensaje").value.trim();
      
      if (nombre && email && asunto && mensaje) {
        const cuerpoEmail = `Nombre: ${nombre}\nCorreo: ${email}\nAsunto: ${asunto}\n\nMensaje:\n${mensaje}`;
        const urlWhatsapp = `https://wa.me/573209147519?text=${encodeURIComponent(cuerpoEmail)}`;
        
        // Abrir en nueva pestaña
        window.open(urlWhatsapp, '_blank');
        
        // Limpiar formulario
        formularioContacto.reset();
        alert("Serás redirigido a WhatsApp para completar tu mensaje.");
      }
    });
  }

});