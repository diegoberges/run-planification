# Run Planification

Herramienta sencilla para planificar el ritmo de una carrera: sube un archivo `.gpx` o importa
una actividad de Strava, visualiza el recorrido en un mapa (con capas intercambiables para
asfalto/trail) y su perfil de elevación, y define un ritmo global, zonas de ritmo específicas
y puntos de avituallamiento (comida/agua).

Todo vive en el navegador (`localStorage`); no hay cuentas ni base de datos. El único
componente de servidor es el necesario para el OAuth de Strava (intercambio del `client_secret`),
implementado como funciones serverless de Vercel.

## Stack

- [Vite](https://vite.dev) + React + TypeScript (SPA)
- [Tailwind CSS v4](https://tailwindcss.com) + [flowbite-react](https://flowbite-react.com)
- [Leaflet](https://leafletjs.com) / [react-leaflet](https://react-leaflet.js.org) con tiles
  gratuitos de OpenStreetMap (asfalto) y OpenTopoMap (trail) — sin API key
- SVG propio + `d3-scale`/`d3-array` para el perfil de elevación y la edición de zonas/marcadores
- Funciones serverless en `/api` (Vercel) + `iron-session` para el flujo OAuth de Strava

> Aviso: los tiles de OpenStreetMap/OpenTopoMap son servicios gratuitos pensados para uso
> personal/bajo volumen. Si esta app creciera mucho, habría que pasar a un proveedor de pago
> (MapTiler, Thunderforest, Stadia Maps).

## Desarrollo

```bash
npm install
cp .env.example .env.local   # y rellena STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET / SESSION_SECRET
npm run dev                  # vercel dev — sirve el SPA + las funciones /api en el mismo puerto
```

`npm run dev:vite` arranca solo el frontend con Vite (más rápido, pero sin las rutas `/api/strava/*`
de Strava funcionando).

Para que el login de Strava funcione en local, registra una app en
[strava.com/settings/api](https://www.strava.com/settings/api) con **Authorization Callback
Domain = `localhost`**.

## Build

```bash
npm run build
npm run preview
```

## Despliegue

Pensado para desplegarse en [Vercel](https://vercel.com): `vercel --prod`, configurando las
mismas variables de entorno (`STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `SESSION_SECRET`,
`APP_BASE_URL`) en el dashboard del proyecto, y actualizando el "Authorization Callback Domain"
de Strava al dominio real una vez desplegado.

**Limitación conocida:** el callback domain de Strava es un dominio fijo, así que el login con
Strava solo funciona en `localhost` y en el dominio de producción — no en los dominios
aleatorios de los *preview deployments* de Vercel.
