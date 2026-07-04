// Lógica del Panel de Control CRM Autónomo (Firebase Version)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, collection, getDocs, addDoc, updateDoc, deleteDoc, orderBy, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

let app = null;
let auth = null;
let db = null;
let storage = null;

let currentTab = 'blogs'; // 'blogs' | 'gallery' | 'products'
let editingItem = null;

// ================= 1. INICIALIZACIÓN Y CONFIGURACIÓN =================
document.addEventListener('DOMContentLoaded', () => {
  // Comprobar si existe la configuración local
  if (typeof CRM_CONFIG === 'undefined') {
    showToast('Falta archivo crm-config.js. Por favor, duplica crm-config.example.js y configúralo.', 'error');
    console.error('Error: CRM_CONFIG no está definido. Asegúrate de tener crm-config.js en la carpeta controlpanel/');
    return;
  }

  // Inicializar Firebase
  try {
    app = initializeApp(window.CRM_CONFIG);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    initApp();
  } catch (error) {
    showToast('Error de configuración de Firebase. Revisa crm-config.js', 'error');
    console.error('Error al inicializar Firebase:', error);
  }
});

function initApp() {
  setupEventListeners();
  checkSession();
}

// Comprobar si hay una sesión activa
function checkSession() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      showView('dashboard');
      loadData();
    } else {
      showView('auth');
    }
  });
}

// Controlar qué vista se muestra
function showView(view) {
  const authView = document.getElementById('auth-view');
  const dashboardView = document.getElementById('dashboard-view');
  
  if (view === 'auth') {
    authView.style.display = 'flex';
    dashboardView.style.display = 'none';
  } else {
    authView.style.display = 'none';
    dashboardView.style.display = 'flex';
  }
}

// ================= 2. EVENT LISTENERS =================
function setupEventListeners() {
  // Formulario de Login
  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', handleLogin);

  // Botón de Cerrar Sesión
  document.getElementById('logout-btn').addEventListener('click', handleLogout);

  // Navegación Sidebar (Tabs)
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      sidebarLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      switchTab(link.dataset.tab);
    });
  });

  // Botón Agregar Nuevo
  document.getElementById('add-item-btn').addEventListener('click', openModalForAdd);

  // Modales - Cerrar y Cancelar
  document.getElementById('close-modal').addEventListener('click', closeModal);
  document.getElementById('cancel-modal').addEventListener('click', closeModal);
  
  // Cerrar modal al hacer clic fuera
  window.addEventListener('click', (e) => {
    const modal = document.getElementById('item-modal');
    if (e.target === modal) {
      closeModal();
    }
  });

  // Envío del formulario de items
  document.getElementById('item-form').addEventListener('submit', handleFormSubmit);

  // Subida de imagen
  const imagePreview = document.getElementById('image-preview');
  const imageFile = document.getElementById('image-file');
  imagePreview.addEventListener('click', () => imageFile.click());
  imageFile.addEventListener('change', handleImageUpload);
}

// ================= 3. GESTIÓN DE AUTENTICACIÓN =================
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const loginBtn = document.getElementById('login-btn');

  loginBtn.disabled = true;
  loginBtn.innerHTML = '<span>Cargando...</span>';

  try {
    await signInWithEmailAndPassword(auth, email, password);
    showToast('¡Sesión iniciada con éxito!', 'success');
  } catch (error) {
    showToast('Error de inicio de sesión: ' + error.message, 'error');
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerHTML = '<span>Entrar</span>';
  }
}

async function handleLogout() {
  try {
    await signOut(auth);
    showToast('Sesión cerrada correctamente', 'success');
  } catch (error) {
    showToast('Error al cerrar sesión', 'error');
  }
}

// ================= 4. MANEJO DE PESTAÑAS (TABS) =================
function switchTab(tab) {
  currentTab = tab;
  const titleEl = document.getElementById('section-title');
  const descEl = document.getElementById('section-desc');
  const addBtnText = document.getElementById('add-btn-text');

  // Ajustar interfaz del modal según tipo
  const groupResumen = document.getElementById('group-resumen');
  const groupContenido = document.getElementById('group-contenido');
  const groupPrecio = document.getElementById('group-precio');

  if (tab === 'blogs') {
    titleEl.innerText = 'Blogs';
    descEl.innerText = 'Administra los artículos publicados en tu web.';
    addBtnText.innerText = 'Nuevo Blog';
    groupResumen.style.display = 'block';
    groupContenido.style.display = 'block';
    groupPrecio.style.display = 'none';
  } else if (tab === 'gallery') {
    titleEl.innerText = 'Fotos';
    descEl.innerText = 'Administra las imágenes y portfolios de tu galería.';
    addBtnText.innerText = 'Nueva Foto';
    groupResumen.style.display = 'none';
    groupContenido.style.display = 'none';
    groupPrecio.style.display = 'none';
  } else if (tab === 'products') {
    titleEl.innerText = 'Productos';
    descEl.innerText = 'Administra los tours, paquetes o productos en venta.';
    addBtnText.innerText = 'Nuevo Producto';
    groupResumen.style.display = 'block';
    groupContenido.style.display = 'block';
    groupPrecio.style.display = 'block';
  }

  loadData();
}

// ================= 5. CARGA Y RENDERIZADO DE DATOS (FIRESTORE) =================
async function loadData() {
  const contentList = document.getElementById('content-list');
  contentList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">Cargando contenido...</div>';

  try {
    const colName = getCollectionName();
    
    // Consulta ordenada por fecha de creación descendente
    const q = query(collection(db, colName), orderBy('creado_en', 'desc'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      contentList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">No hay elementos guardados. Crea uno nuevo.</div>';
      return;
    }

    contentList.innerHTML = '';
    querySnapshot.forEach((docSnap) => {
      const item = { id: docSnap.id, ...docSnap.data() };
      const card = createCard(item);
      contentList.appendChild(card);
    });
  } catch (error) {
    showToast('Error al cargar datos: ' + error.message, 'error');
    console.error('Error Firestore:', error);
    contentList.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--error);">Error al cargar los datos de Firestore. Asegúrate de tener habilitada la base de datos de Cloud Firestore.</div>`;
  }
}

function getCollectionName() {
  if (currentTab === 'blogs') return 'blogs';
  if (currentTab === 'gallery') return 'gallery';
  if (currentTab === 'products') return 'products';
  return 'blogs';
}

function createCard(item) {
  const card = document.createElement('div');
  card.className = 'card';

  // Obtener imagen o poner placeholder
  const imageUrl = item.imagen_url || 'https://via.placeholder.com/400x250?text=Sin+Imagen';
  
  // Detalles extra según el tipo
  let extraDetail = '';
  if (currentTab === 'products' && item.precio !== undefined) {
    extraDetail = `<span style="background: var(--accent-gradient); color: #0b0f19; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 0.85rem; position: absolute; bottom: 10px; right: 10px;">${parseFloat(item.precio).toFixed(2)} €</span>`;
  }

  // Estructura de la tarjeta
  card.innerHTML = `
    <div class="card-img" style="background-image: url('${imageUrl}')">
      ${extraDetail}
    </div>
    <div class="card-body">
      <div>
        <h4 class="card-title">${escapeHTML(item.titulo)}</h4>
        <p class="card-desc">${escapeHTML(item.resumen || item.contenido || 'Sin descripción.')}</p>
      </div>
      <div class="card-footer">
        <button class="btn btn-secondary btn-sm edit-btn">Editar</button>
        <button class="btn btn-danger btn-sm delete-btn">Eliminar</button>
      </div>
    </div>
  `;

  // Asignar eventos de editar y borrar
  card.querySelector('.edit-btn').addEventListener('click', () => openModalForEdit(item));
  card.querySelector('.delete-btn').addEventListener('click', () => handleDelete(item.id));

  return card;
}

// ================= 6. SUBIDA DE ARCHIVOS A CLOUD STORAGE =================
async function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const preview = document.getElementById('image-preview');
  const placeholder = document.getElementById('image-placeholder');
  const urlInput = document.getElementById('image-url');

  // Mostrar indicador de carga
  placeholder.innerHTML = '<span>Subiendo imagen...</span>';
  
  try {
    // Generar un nombre de archivo único
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${currentTab}/${fileName}`;

    // Crear referencia en Storage
    const storageRef = ref(storage, filePath);

    // Subir el archivo
    const uploadResult = await uploadBytes(storageRef, file);

    // Obtener la URL pública
    const publicUrl = await getDownloadURL(uploadResult.ref);

    // Actualizar campos
    urlInput.value = publicUrl;
    preview.style.backgroundImage = `url('${publicUrl}')`;
    preview.classList.add('has-image');
    placeholder.style.display = 'none';
    showToast('Imagen subida con éxito', 'success');

  } catch (error) {
    showToast('Error al subir imagen: ' + error.message, 'error');
    console.error('Error Storage:', error);
    placeholder.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 0 11-.75 0 .375 0 01.75 0z" />
      </svg>
      <span>Error al subir. Haz clic para reintentar</span>
    `;
  }
}

// ================= 7. CREAR, EDITAR Y ELIMINAR REGISTROS (CRUD) =================
function openModalForAdd() {
  editingItem = null;
  document.getElementById('item-id').value = '';
  document.getElementById('item-form').reset();
  
  // Resetear la vista previa de la imagen
  const preview = document.getElementById('image-preview');
  const placeholder = document.getElementById('image-placeholder');
  preview.style.backgroundImage = 'none';
  preview.classList.remove('has-image');
  placeholder.style.display = 'flex';
  placeholder.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 0 11-.75 0 .375 0 01.75 0z" />
    </svg>
    <span>Hacer clic para subir imagen</span>
  `;
  document.getElementById('image-url').value = '';

  // Actualizar Título
  const titles = { blogs: 'Agregar Artículo', gallery: 'Agregar Foto', products: 'Agregar Producto' };
  document.getElementById('modal-title').innerText = titles[currentTab];

  // Ajustar requerimientos del formulario
  document.getElementById('item-title').placeholder = currentTab === 'gallery' ? 'Nombre o título de la foto' : 'Introduce el título';
  document.getElementById('item-resumen').required = currentTab !== 'gallery';
  document.getElementById('item-content').required = currentTab !== 'gallery';
  document.getElementById('item-price').required = currentTab === 'products';

  document.getElementById('item-modal').style.display = 'flex';
}

function openModalForEdit(item) {
  editingItem = item;
  document.getElementById('item-id').value = item.id;
  document.getElementById('item-title').value = item.titulo;
  document.getElementById('item-resumen').value = item.resumen || '';
  document.getElementById('item-content').value = item.contenido || '';
  
  if (currentTab === 'products') {
    document.getElementById('item-price').value = item.precio || 0;
  }

  // Configurar imagen destacada
  const preview = document.getElementById('image-preview');
  const placeholder = document.getElementById('image-placeholder');
  const urlInput = document.getElementById('image-url');

  urlInput.value = item.imagen_url || '';
  if (item.imagen_url) {
    preview.style.backgroundImage = `url('${item.imagen_url}')`;
    preview.classList.add('has-image');
    placeholder.style.display = 'none';
  } else {
    preview.style.backgroundImage = 'none';
    preview.classList.remove('has-image');
    placeholder.style.display = 'flex';
  }

  // Títulos del modal
  const titles = { blogs: 'Editar Artículo', gallery: 'Editar Foto', products: 'Editar Producto' };
  document.getElementById('modal-title').innerText = titles[currentTab];
  document.getElementById('item-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('item-modal').style.display = 'none';
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('item-id').value;
  const titulo = document.getElementById('item-title').value;
  const resumen = document.getElementById('item-resumen').value;
  const contenido = document.getElementById('item-content').value;
  const imagen_url = document.getElementById('image-url').value;
  
  const saveBtn = document.getElementById('save-item-btn');
  saveBtn.disabled = true;
  saveBtn.innerText = 'Guardando...';

  const colName = getCollectionName();
  
  // Construir objeto de datos
  const itemData = {
    titulo,
    imagen_url
  };

  if (currentTab === 'blogs' || currentTab === 'products') {
    itemData.resumen = resumen;
    itemData.contenido = contenido;
  }

  if (currentTab === 'products') {
    itemData.precio = parseFloat(document.getElementById('item-price').value);
  }

  try {
    if (id) {
      // Actualizar en Firestore
      const docRef = doc(db, colName, id);
      await updateDoc(docRef, itemData);
    } else {
      // Agregar nuevo en Firestore
      const nuevoItem = {
        ...itemData,
        creado_en: serverTimestamp() // Genera la fecha en el servidor de Firebase
      };
      await addDoc(collection(db, colName), nuevoItem);
    }

    showToast(`Elemento ${id ? 'actualizado' : 'creado'} correctamente`, 'success');
    closeModal();
    loadData();
  } catch (error) {
    showToast('Error al guardar datos: ' + error.message, 'error');
    console.error(error);
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerText = 'Guardar';
  }
}

async function handleDelete(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.')) return;

  try {
    const colName = getCollectionName();
    const docRef = doc(db, colName, id);
    await deleteDoc(docRef);

    showToast('Elemento eliminado con éxito', 'success');
    loadData();
  } catch (error) {
    showToast('Error al eliminar: ' + error.message, 'error');
  }
}

// ================= 8. UTILIDADES COMPARTIDAS =================
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  
  toast.className = `notification ${type} show`;
  toastMsg.innerText = message;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
