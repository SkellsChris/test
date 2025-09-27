import { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../auth/AuthProvider.jsx';

const LogoutButton = ({ className, children }) => {
  const { signOut } = useAuth();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setError(null);
    setLoading(true);
    try {
      await signOut();
    } catch (logoutError) {
      setError(logoutError.message || 'Impossible de se déconnecter.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <button type="button" onClick={handleClick} disabled={loading} className="logout-button">
        {children || 'Se déconnecter'}
      </button>
      {error ? (
        <p className="logout-button__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};

LogoutButton.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

LogoutButton.defaultProps = {
  className: '',
  children: null,
};

export default LogoutButton;
