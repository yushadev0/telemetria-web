/* ==========================================================================
   Telemetria API — yanıt tipleri
   F1 REST akışı kaldırıldı (livetiming.formula1.com barındırma sağlayıcı
   IP'lerini toplu bloklamaya başladığı için özellik devre dışı). Backend
   `/api/v1/telemetry|schedule|compare|laps` uçları hâlâ kodda ama client
   artık bunları kullanmıyor. Kalanlar: Assetto Corsa canlı akışı.
   ========================================================================== */

/* --------------------------------------------------------------------------
   Active rooms — /api/v1/active-rooms
   -------------------------------------------------------------------------- */

export interface ActiveRoomsResponse {
  status: 'success';
  /** Son 5 sn içinde veri almış oda kodları. */
  active_rooms: string[];
}

/* --------------------------------------------------------------------------
   Assetto Corsa canlı telemetri — WS /ws/live/{room_id} text frame'i
   Kaynak: new-client.md §5.1 (updateACTelemetry'nin okuduğu alanlar)
   -------------------------------------------------------------------------- */

export interface AcLeaderboardEntry {
  pos: number;
  name: string;
  /** Öndeki/oyuncuya göre fark; string ("+0.512") ya da sayı gelebilir. */
  delta: string | number;
  time: string | number;
  is_player: boolean;
  is_fastest: boolean;
  id: number | string;
}

export interface AcLeaderboardData {
  leaderboard: AcLeaderboardEntry[];
  player_pos: number;
  yellow_flag: boolean;
}

/** map_data.map: [carId, x, z] üçlüleri. */
export type AcMapPoint = [id: number | string, x: number, z: number];

export interface AcMapData {
  map: AcMapPoint[];
}

export interface AcFrame {
  /** UDP köprüsü frame'e oda kodunu da ekler. */
  room?: string;

  speed: number;
  rpm: number;
  gear: number;
  gas: number;
  brake: number;
  steer: number;

  g_lat: number;
  g_lon: number;
  fuel: number;
  damage: number;

  tyre_fl_t: number;
  tyre_fl_p: number;
  tyre_fr_t: number;
  tyre_fr_p: number;
  tyre_rl_t: number;
  tyre_rl_p: number;
  tyre_rr_t: number;
  tyre_rr_p: number;

  drs: 0 | 1;
  tc_action: number;
  abs_action: number;
  pit_limiter: 0 | 1;

  lap: number;
  pos: number;
  sector: number;
  norm_pos: number;
  tyres_out: number;
  penalty: number;
  in_pit: 0 | 1;
  flag: string | number;

  track_name: string;
  car_model: string;
  driver_name: string;
  driver_nick: string;

  cur_time: string;
  last_time: string;
  best_time: string;
  tyre_comp: string;

  lb_data?: AcLeaderboardData;
  map_data?: AcMapData;
}

/** Client → sunucu PING'ine gelen yanıt. */
export interface AcPong {
  type: 'PONG';
}

/* --------------------------------------------------------------------------
   Hata gövdesi — 4xx + { detail: "..." }
   -------------------------------------------------------------------------- */

export interface ApiErrorBody {
  detail: string;
}
