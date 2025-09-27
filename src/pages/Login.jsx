import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.jsx';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user, loading: authLoading } = useAuth();

  const redirectPath = useMemo(() => location.state?.from?.pathname || '/', [location.state]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate(redirectPath, { replace: true });
    }
  }, [authLoading, navigate, redirectPath, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();

    if (trimmedEmail.length === 0 || password.length === 0) {
      setError('Veuillez renseigner votre email et votre mot de passe.');
      return;
    }

    setSubmitting(true);
    try {
      await signIn(trimmedEmail, password);
      navigate(redirectPath, { replace: true });
    } catch (signInError) {
      setError(signInError.message || 'Identifiants invalides.');
    } finally {
      setSubmitting(false);
    }
  };

  const disableForm = submitting || authLoading;

  return (
    <div className="login-page">
      <div className="login-card" role="form">
        <h1 className="login-card__title">Connexion</h1>
        <p className="login-card__subtitle">Accédez à votre tableau de bord en vous connectant.</p>
        <form onSubmit={handleSubmit} noValidate className="login-form">
          <div className="login-form__field">
            <label htmlFor="login-email">Adresse email</label>
            <input
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={disableForm}
              placeholder="vous@example.com"
            />
          </div>
          <div className="login-form__field">
            <label htmlFor="login-password">Mot de passe</label>
            <input
              id="login-password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={disableForm}
            />
          </div>

          {error ? (
            <p className="login-form__error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="login-form__submit" disabled={disableForm}>
            {submitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
