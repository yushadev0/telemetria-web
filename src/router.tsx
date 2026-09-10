import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { HomeRoute } from '@/routes/HomeRoute';
import { F1UnavailableRoute } from '@/routes/F1UnavailableRoute';
import { RoomRoute } from '@/routes/ac/RoomRoute';
import { LiveRoute } from '@/routes/ac/LiveRoute';
import { NotFoundRoute } from '@/routes/NotFoundRoute';

/**
 * URL akışı = ekran akışı (new-client.md §6).
 * F1 modu kalıcı olarak devre dışı (livetiming.formula1.com'un barındırma
 * sağlayıcı IP'lerini toplu bloklaması) — `/f1` artık gerçek akışa değil,
 * açıklama ekranına gidiyor. Alt route'lar (yıl/yarış/seans/pilot) kaldırıldı.
 */
// Prod: Vite base '/telemetria/' → router da aynı önekten servis edilir.
// Dev: BASE_URL '/' → basename '' olur.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

export const router = createBrowserRouter(
  [
    {
      element: <AppShell />,
      children: [
        { index: true, element: <HomeRoute /> },
        { path: 'f1', element: <F1UnavailableRoute /> },
        { path: 'ac', element: <RoomRoute /> },
        { path: 'ac/:room', element: <LiveRoute /> },
        { path: '*', element: <NotFoundRoute /> },
      ],
    },
  ],
  { basename: basename || undefined },
);
