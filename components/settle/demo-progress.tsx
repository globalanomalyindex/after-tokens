import styles from './demo-progress.module.css'

/** Recorded/authored playback progress only; no estimate of a live model's work. */
export function DemoProgress({ value, complete, hidden = false, motion = true, label = 'Demo playback progress', intro = false }: {
  value: number | null; complete: boolean; hidden?: boolean; motion?: boolean; label?: string; intro?: boolean
}) {
  const percentage = complete ? 100 : value === null ? null : Math.min(99, Math.max(0, Math.floor(value)))
  return <span className={styles.progress} data-demo-progress data-hero-progress={intro || undefined} data-complete={complete} data-hidden={hidden} data-motion={motion}
    role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage ?? undefined} aria-hidden={hidden || complete || undefined}>
    {percentage === null ? '…' : <>{percentage}<span className={styles.percent}>%</span></>}
  </span>
}
