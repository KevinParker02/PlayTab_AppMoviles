import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  if (isAuthenticated) {
    if (['/login', '/register'].includes(state.url)) {
      router.navigate(['/tabs']);
      return false;
    }
  } else {
    if (state.url.startsWith('/tabs') || state.url.startsWith('/tab')||state.url.startsWith('/actividades')||state.url.startsWith('/actividad-detalle-modal')||state.url.startsWith('/cambiacomuna')||state.url.startsWith('/historial')||state.url.startsWith('actividad-det-inscrito-modal')||state.url.startsWith('actividadanfitrion')||state.url.startsWith('actividad-anfitrion-detalle')||state.url.startsWith('cambio-actividad-favorita')) {
      router.navigate(['/login']);
      return false;
    }
  }

  return true;
};
