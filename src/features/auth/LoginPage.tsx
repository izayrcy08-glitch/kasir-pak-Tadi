import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { FirebaseError } from 'firebase/app';
import { masuk } from '../../shared/firebase/auth.repo';
import { useAuth } from './hooks/useAuth';
import { pesanErrorAuth } from './logic/pesanErrorAuth';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [masukSedangProses, setMasukSedangProses] = useState(false);

  if (!loading && user) {
    const tujuan = (location.state as { dari?: string } | null)?.dari ?? '/';
    return <Navigate to={tujuan} replace />;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setMasukSedangProses(true);
    try {
      await masuk(email.trim(), password);
    } catch (err) {
      setError(err instanceof FirebaseError ? pesanErrorAuth(err.code) : pesanErrorAuth(undefined));
    } finally {
      setMasukSedangProses(false);
    }
  }

  return (
    <div className={styles.screen}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.brand}>
          <div className={styles.logoBadge}>T</div>
          <h1>Kasir Sparepart</h1>
          <p className={styles.sub}>Masuk untuk mulai transaksi.</p>
        </div>

        <div className={styles.formField}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className={styles.formInput}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div className={styles.formField}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className={styles.formInput}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error && <p className={styles.formError}>{error}</p>}

        <button type="submit" className={styles.btnAccent} disabled={masukSedangProses}>
          {masukSedangProses ? 'Memproses…' : 'Masuk'}
        </button>
      </form>
    </div>
  );
}
