# Estrada Hermanos — Frontend

Sitio web de la zapatería **Estrada Hermanos**: página informativa pública y panel de administración.

Tecnologías: **HTML**, **CSS** y **JavaScript**. El panel consume el microservicio `eh-shoe-stock-backend` con **Axios**.

## Cómo abrirlo

El panel usa módulos ES (`type="module"`). Hay que servirlo con el script incluido, que entrega los `.js` con el tipo MIME correcto:

```bash
cd eh-shoe-stock-frontend
python server.py
```

Luego entre a `http://localhost:5500`. Si el puerto está ocupado: `set PORT=5505` y vuelva a ejecutar.

> `python -m http.server` no sirve para este proyecto: en Windows entrega los `.js` como `text/plain` y el navegador bloquea los módulos.

El backend debe estar en `http://localhost:8080` con el header `auth-token` igual a `local-auth-token` (valor por defecto de `application.yml`).

Si usa otro host o token, en la consola del navegador:

```js
localStorage.setItem("eh.apiBase", "http://localhost:8080/api/v1");
localStorage.setItem("eh.authToken", "su-token");
```

## Páginas

| Ruta | Quién | Contenido |
|------|--------|-----------|
| `/` (`index.html`) | Cliente | Historia, colección (fotos reales), tradición y visita. Sin login ni precios. |
| `/acceso.html` | Dueño | Login contra `POST /api/v1/auth/login`. |
| `/app.html#/dashboard` | Dueño | Panel: ventas, inventario, mercadería, productos, proveedores, reportes y usuarios. |

El botón **Acceso** de la landing es discreto (candado). El CTA de cliente es **Visítanos**.

## Notas

- No se muestran precios ni dinero: todo el panel trabaja en **pares**.
- Las fotografías de producto en el catálogo admin son de referencia (el backend aún no expone `shoe_photo`).
- Cerrar sesión borra el JWT local; no existe `POST /auth/logout` en la API.
