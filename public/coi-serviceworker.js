/*! coi-serviceworker v0.1.7 - Guido Zuidhof, licensed under MIT */
let coepCredentialless = false;
if (typeof window === 'undefined') {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

  self.addEventListener('message', (ev) => {
    if (!ev.data) return;
    if (ev.data.type === 'deregister') {
      self.registration.unregister().then(() => self.clients.matchAll()).then(clients => {
        clients.forEach(client => client.navigate(client.url));
      });
    }
  });

  self.addEventListener('fetch', function (event) {
    const r = event.request;
    if (r.cache === 'only-if-cached' && r.mode !== 'same-origin') return;

    const request = (coepCredentialless && r.mode === 'no-cors')
      ? new Request(r, { credentials: 'omit' })
      : r;

    event.respondWith(
      fetch(request).then((response) => {
        if (response.status === 0) return response;

        const newHeaders = new Headers(response.headers);
        newHeaders.set('Cross-Origin-Embedder-Policy', coepCredentialless ? 'credentialless' : 'require-corp');
        if (!coepCredentialless) {
          newHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');
        }
        newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      }).catch((e) => console.error(e))
    );
  });
} else {
  (() => {
    const reloadedBySelf = window.sessionStorage.getItem('coiReloadedBySelf');
    window.sessionStorage.removeItem('coiReloadedBySelf');
    const coi = {
      shouldRegister: () => !window.crossOriginIsolated,
      shouldDeregister: () => false,
      coepCredentialless: () => false,
      doReload: () => window.location.reload(),
      quiet: false,
      ...window.coi,
    };

    if (coi.shouldRegister()) {
      if (reloadedBySelf) {
        if (!coi.quiet) console.warn('COI: reload loop detected');
        return;
      }
      navigator.serviceWorker && navigator.serviceWorker.register('/coi-serviceworker.js').then((registration) => {
        if (!coi.quiet) console.log('COI: registered', registration.scope);
        registration.addEventListener('updatefound', () => {
          if (!coi.quiet) console.log('COI: reloading');
          window.sessionStorage.setItem('coiReloadedBySelf', 'true');
          coi.doReload();
        });
        if (registration.active) {
          if (!coi.quiet) console.log('COI: active, reloading');
          window.sessionStorage.setItem('coiReloadedBySelf', 'true');
          coi.doReload();
        }
      });
    }
  })();
}
