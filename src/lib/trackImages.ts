/* ==========================================================================
   Pist görseli eşleşmeleri (fallback + Assetto Corsa harita katmanı)
   Port: telemetria-client/.../script.js → window.acImagePathBase / acTrackMapDict
   F1 tarafında API zaten `race.track_image` döndürür; bu tablo yalnızca
   eksik/404 durumları ve AC'nin Kunos pist kodları için yedektir.
   ========================================================================== */

/** Uzak asset kökü. Prod'da yerel `public/assets/tracks/`'e taşınması planlı (§10). */
export const AC_IMAGE_BASE = 'https://yusa.app/assets/tracks/';

/** Assetto Corsa pist kodu (Kunos / modlu) → PNG dosya adı. */
export const AC_TRACK_MAP: Record<string, string> = {
  // Kunos (orijinal) pist kodları
  monza: 'Monza_GP.png',
  spa: 'Spa_GP.png',
  ks_silverstone: 'Silverstone_GP.png',
  ks_nurburgring: 'Nurburgring_GP.png',
  imola: 'Imola_GP.png',
  ks_barcelona: 'Barcelona_GP.png',
  ks_red_bull_ring: 'Avusturya_GP.png',
  ks_zandvoort: 'Zandvoort_GP.png',

  // F1 takvimi (modlu pist kodları)
  bahrain: 'Bahreyn_GP.png',
  jeddah: 'Cidde_GP.png',
  albert_park: 'Avustralya_GP.png',
  baku: 'Baku_GP.png',
  miami: 'Miami_GP.png',
  monaco: 'Monaco_GP.png',
  montreal: 'Kanada_GP.png',
  red_bull_ring: 'Avusturya_GP.png',
  hungaroring: 'Hungaroring_GP.png',
  marina_bay: 'Singapur_GP.png',
  suzuka: 'Japonya_GP.png',
  cota: 'COTA_GP.png',
  mexico: 'Meksika_GP.png',
  interlagos: 'Brezilya_GP.png',
  yas_marina: 'AbuDabi_GP.png',
  las_vegas: 'Vegas_GP.png',
  losail: 'Katar_GP.png',
  istanbul: 'Istanbul_GP.png',
  shanghai: 'Cin_GP.png',

  // Efsaneler
  ks_nordschleife: 'Nordschleife.png',
  lemans: 'Lemans_GP.png',
  circuit_de_la_sarthe: 'Lemans_GP.png',
};

/** AC pist kodundan harita PNG URL'i (bulunamazsa null). */
export function acTrackImageUrl(trackCode: string | null | undefined): string | null {
  if (!trackCode) return null;
  const file = AC_TRACK_MAP[trackCode.toLowerCase()];
  return file ? `${AC_IMAGE_BASE}${file}` : null;
}

/** Pilot fotoğrafı URL'i — 3 harf kod. 404 olabilir → ImageWithFallback ile guard'lanır. */
export function driverPhotoUrl(driverCode: string): string {
  return `https://yusa.app/assets/drivers/${driverCode}.png`;
}
