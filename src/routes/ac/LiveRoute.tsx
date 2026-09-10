import { Navigate, useParams } from 'react-router-dom';
import { AcDashboard } from '@/features/ac-live/AcDashboard';
import { ROOM_CODE_RE } from '@/features/ac-live/acUtils';

/** `/ac/:room` — Assetto Corsa canlı dashboard. Geçersiz kodda oda ekranına döner. */
export function LiveRoute() {
  const { room } = useParams();
  if (!room || !ROOM_CODE_RE.test(room)) return <Navigate to="/ac" replace />;
  return <AcDashboard key={room} room={room} />;
}
