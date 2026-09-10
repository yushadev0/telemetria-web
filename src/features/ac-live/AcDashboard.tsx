/* ==========================================================================
   AcDashboard — Assetto Corsa canlı yarış mühendisi panosu
   Tek ekran, 3 kolon (legacy ac-telemetry-grid-dense), scroll yok.
   Radar ortadaki kolonun sağ yarısında; sol/sağ kolon + merkez-sol panel
   garaj→canlı geçişinde cascade ile açılır (radar remount olmaz).
   ========================================================================== */

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AcFrame } from '@/api/types';
import { flagInfo, type AcMode } from './acUtils';
import { useAcSocket, type WsStatus } from './useAcSocket';
import { Leaderboard } from './widgets/Leaderboard';
import { GForceMeter } from './widgets/GForceMeter';
import { Steering } from './widgets/Steering';
import { Pedals } from './widgets/Pedals';
import { RpmLeds } from './widgets/RpmLeds';
import { GearSpeed } from './widgets/GearSpeed';
import { DriverInfo } from './widgets/DriverInfo';
import { TyreGrid } from './widgets/TyreGrid';
import { SystemLeds } from './widgets/SystemLeds';
import { FuelDamage } from './widgets/FuelDamage';
import { LiveTrackRadar } from './LiveTrackRadar';
import s from './dashboard.module.css';

function resolveMode(
  status: WsStatus,
  frame: AcFrame | null,
  stale: boolean,
  isMenu: boolean,
): AcMode {
  if (!frame) return status === 'closed' ? 'closed' : 'connecting';
  if (stale) return 'nosignal';
  if (isMenu) return 'menu';
  return 'live';
}

function resolveDriver(frame: AcFrame | null): string {
  if (!frame) return '';
  const name = frame.driver_name?.trim();
  return name || frame.driver_nick?.trim() || '';
}

const v = (i: number): CSSProperties => ({ '--i': i }) as CSSProperties;

export function AcDashboard({ room }: { room: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { status, frame, derived, stale } = useAcSocket(room);

  const mode = resolveMode(status, frame, stale, derived?.isMenu ?? false);
  const overlay = mode !== 'live';

  // garaj/menü/sinyal-yok → canlı geçişinde panel cascade
  const [epoch, setEpoch] = useState(0);
  const prevLive = useRef(false);
  useEffect(() => {
    const live = mode === 'live';
    if (live && !prevLive.current) setEpoch((e) => e + 1);
    prevLive.current = live;
  }, [mode]);

  const flag = frame ? flagInfo(frame) : null;
  const cascade = epoch > 0 ? s.cascade : '';

  return (
    <div className={s.dashboard}>
      <header className={s.topbar}>
        <span className={s.led} data-state={status} />
        <span className={s.room}>
          {t('ac_room')}: {room}
        </span>
        <span className={s.stat}>
          {t('ac_pos')} <b>P{frame?.pos ?? '–'}</b>
        </span>
        <span className={s.stat}>
          {t('ac_lap')} <b>{frame?.lap ?? '–'}</b>
        </span>
        {flag && (
          <span className={s.flag} data-tone={flag.tone === 'none' ? undefined : flag.tone}>
            {t(flag.key)}
          </span>
        )}
        <span className={s.spacer} />
        <button type="button" className={s.leave} onClick={() => navigate('/ac')}>
          {t('leaveBtn')}
        </button>
      </header>

      <div className={s.body}>
        <div className={`${s.grid} ${overlay ? s.blur : ''}`}>
          {/* --- SOL: sıralama + dinamikler --- */}
          <section className={`${s.panel} ${cascade}`} style={v(0)} key={`l${epoch}`}>
            <h2 className={s.panelHead}>{t('ac_leaderboard')}</h2>
            <Leaderboard data={frame?.lb_data} />

            <div className={s.leftDynamics}>
              <h2 className={s.panelHead}>{t('ac_dynamics')}</h2>
              <span className={s.subLabel}>{t('ac_gforce')}</span>
              <GForceMeter gLat={frame?.g_lat ?? 0} gLon={frame?.g_lon ?? 0} />
              <span className={s.subLabel}>{t('ac_steer')}</span>
              <Steering steer={frame?.steer ?? 0} />
              <Pedals gas={frame?.gas ?? 0} brake={frame?.brake ?? 0} />
            </div>
          </section>

          {/* --- MERKEZ: sayısal küme + radar --- */}
          <div className={s.colCenter}>
            <section
              className={`${s.panel} ${s.centerLeft} ${cascade}`}
              style={v(1)}
              key={`c${epoch}`}
            >
              <RpmLeds rpm={frame?.rpm ?? 0} />
              <GearSpeed
                gear={frame?.gear ?? 0}
                speed={frame?.speed ?? 0}
                rpm={frame?.rpm ?? 0}
              />
              <DriverInfo
                driver={resolveDriver(frame)}
                car={frame?.car_model ?? ''}
                compound={frame?.tyre_comp ?? ''}
                curTime={frame?.cur_time ?? ''}
                lastTime={frame?.last_time ?? ''}
                bestTime={frame?.best_time ?? ''}
                sector={frame?.sector ?? 0}
                penalty={frame?.penalty ?? 0}
                lapInvalid={derived?.lapInvalid ?? false}
                bestTone={derived?.bestTone ?? 'none'}
              />
            </section>
            <div className={s.centerRight}>
              <LiveTrackRadar frame={frame} mode={mode} />
            </div>
          </div>

          {/* --- SAĞ: araç durumu --- */}
          <section className={`${s.panel} ${cascade}`} style={v(2)} key={`r${epoch}`}>
            <h2 className={s.panelHead}>{t('ac_car_status')}</h2>
            <span className={s.subLabel}>{t('ac_tyre_info')}</span>
            <TyreGrid
              flT={frame?.tyre_fl_t ?? 0}
              flP={frame?.tyre_fl_p ?? 0}
              frT={frame?.tyre_fr_t ?? 0}
              frP={frame?.tyre_fr_p ?? 0}
              rlT={frame?.tyre_rl_t ?? 0}
              rlP={frame?.tyre_rl_p ?? 0}
              rrT={frame?.tyre_rr_t ?? 0}
              rrP={frame?.tyre_rr_p ?? 0}
            />
            <SystemLeds
              drs={frame?.drs ?? 0}
              tc={frame?.tc_action ?? 0}
              abs={frame?.abs_action ?? 0}
              pit={frame?.pit_limiter ?? 0}
            />
            <div className={s.rightBottom}>
              <FuelDamage
                fuel={frame?.fuel ?? 0}
                fuelPct={derived?.fuelPct ?? 0}
                damage={frame?.damage ?? 0}
              />
            </div>
          </section>
        </div>

        {overlay && <GarageOverlay mode={mode} />}
      </div>
    </div>
  );
}

function GarageOverlay({ mode }: { mode: AcMode }) {
  const { t } = useTranslation();
  const subKey =
    mode === 'menu'
      ? 'ac_menu_mode'
      : mode === 'nosignal' || mode === 'closed'
        ? 'ac_no_signal'
        : 'ac_waiting_telemetry';
  return (
    <div className={s.overlay}>
      <span className={s.overlayTitle}>{t('ac_garage_mode')}</span>
      <span className={s.overlaySub}>{t(subKey)}</span>
    </div>
  );
}
