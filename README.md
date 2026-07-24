# Guía de Integración y Buenas Prácticas - Submódulo `controlpanel`

Este directorio (`controlpanel`) es un **submódulo compartido** (o carpeta reutilizable) diseñado para actuar como un CMS dinámico y autónomo ("Headless") en múltiples proyectos web. 

Para evitar la contaminación de credenciales o configuraciones entre diferentes proyectos (por ejemplo, *Alexandria* y *Sueño Travel*), sigue estrictamente las siguientes directrices de arquitectura:

---

## 1. Arquitectura Desacoplada de Configuración

El código dentro de `controlpanel` es **100% genérico** y no debe contener credenciales ni nombres de proyectos específicos. 

* **Configuración del Proyecto (`crm-config.js`):** Se almacena **fuera** de la carpeta del submódulo, en la raíz del repositorio de cada proyecto principal (`../crm-config.js`).
* **Carga de Archivos:** Las páginas HTML del panel (`index.html`, `settings.html`, `setup.html`) cargan el archivo usando rutas relativas externas:
  ```html
  <script src="../crm-config.js"></script>
  ```

> [!WARNING]
> **NUNCA** modifiques ni hagas `commit`/`push` de credenciales locales en archivos dentro de `controlpanel`. Si necesitas inicializar la configuración en un nuevo proyecto, copia el archivo `crm-config.example.js` y colócalo en la raíz del proyecto principal renombrándolo como `crm-config.js`.

---

## 2. Aislamiento de Almacenamiento en Navegador (`localStorage`)

Cuando varios proyectos se ejecutan localmente en el mismo puerto (por ejemplo, `http://localhost:3000`), comparten el almacenamiento del navegador. Para evitar que las configuraciones se pisen entre sí:

* El panel calcula automáticamente un **sufijo único (namespace)** basado en el nombre de la aplicación configurado en el `crm-config.js` del proyecto (`branding.appName`).
* El archivo [data-source-config.js](data-source-config.js) guarda las claves en el navegador bajo los nombres:
  * `glosaurio_datasource_config_[nombre_proyecto]`
  * `glosaurio_theme_[nombre_proyecto]`
  
Asegúrate siempre de que cada proyecto tenga un `branding.appName` único y descriptivo en su respectivo `crm-config.js` de la raíz.

---

## 3. Adaptadores y Modelos de Datos

El CMS auto-genera la interfaz gráfica a partir de los esquemas declarados en [modules/module-registry.js](modules/module-registry.js).
* Si utilizas **Firebase Firestore** (NoSQL), la base de datos se estructurará automáticamente al guardar el primer registro desde la interfaz local.
* Si utilizas **Supabase** (Postgres), debes crear las tablas previamente. Puedes obtener los scripts SQL de creación en la pestaña **Módulos** del asistente local (`/controlpanel/setup.html`).

---

## 4. Guía para el Desarrollador/Agente de IA

Cuando configures o des soporte a este panel en un nuevo proyecto:
1. **Identifica el Origen:** Verifica que las llamadas a la base de datos apunten al adaptador correcto (`supabase-adapter.js` o `firebase-adapter.js`).
2. **Revisa la Raíz:** La configuración activa debe leerse de la raíz del proyecto (`../crm-config.js`).
3. **No dupliques CSS:** La página de inicio del sitio web utiliza Tailwind CSS por CDN con estilos incrustados en su propio archivo HTML. El panel utiliza estilos desacoplados en `style.css`. Mantén los estilos del panel independientes de los estilos de la web principal.
