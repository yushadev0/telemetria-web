/* ==========================================================================
   "Decode" metin animasyonu — yusa.app'ten birebir taşındı.
   `el`, kademeli gürültü gösterir ve karakter karakter `toText`'e kilitlenir.
   Frame sayımlı: her çalışma tam olarak `toText` üzerinde biter. Sabit 24ms
   interval → yük ne olursa olsun hız öngörülebilir.
   ========================================================================== */

const NOISE = 'ABCDEFGHKMNPRSTVXZ0123456789#%&/\\<>[]{}=+*';
const rnd = () => NOISE[(Math.random() * NOISE.length) | 0];

export function morphText(el: HTMLElement, toText: string, steps = 30): () => void {
  const target = toText;
  const len = target.length;
  if (len === 0) {
    el.textContent = '';
    return () => {};
  }

  // Her konum `start` frame'inde kaynamaya başlar, `lock` frame'inde (<= steps) kilitlenir.
  const start: number[] = [];
  const lock: number[] = [];
  for (let i = 0; i < len; i++) {
    const s = Math.floor(Math.random() * steps * 0.45);
    start[i] = s;
    lock[i] = Math.min(steps, s + 4 + Math.floor(Math.random() * (steps * 0.5)));
  }

  let frame = 0;
  const iv = setInterval(() => {
    let out = '';
    for (let i = 0; i < len; i++) {
      const ch = target[i];
      if (ch === ' ' || ch === '\n' || frame >= lock[i]) out += ch;
      else if (frame >= start[i]) out += rnd();
      else out += ' ';
    }
    el.textContent = out;
    frame++;
    if (frame > steps) {
      clearInterval(iv);
      el.textContent = target;
    }
  }, 24);

  return () => {
    clearInterval(iv);
    el.textContent = target;
  };
}
