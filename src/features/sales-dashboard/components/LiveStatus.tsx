import styles from "./LiveStatus.module.css";

export function LiveStatus() {
  return <p className={styles.status}><span className={styles.dot} aria-hidden="true" /><span>Live</span></p>;
}
