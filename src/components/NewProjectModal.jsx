import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const initialFormState = {
  name: '',
  description: '',
};

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([type="hidden"]):not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const MAX_NAME_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 280;

const NewProjectModal = ({ open, onRequestClose, onSubmit }) => {
  const dialogRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const [formState, setFormState] = useState(initialFormState);
  const [errors, setErrors] = useState({ field: '', general: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameInputId = useMemo(() => 'new-project-name', []);
  const descriptionInputId = useMemo(() => 'new-project-description', []);
  const nameErrorId = useMemo(() => 'new-project-name-error', []);
  const generalErrorId = useMemo(() => 'new-project-general-error', []);

  useEffect(() => {
    if (!open) {
      setFormState(initialFormState);
      setErrors({ field: '', general: '' });
      setIsSubmitting(false);
      return undefined;
    }

    previouslyFocusedRef.current = document.activeElement;
    const dialogNode = dialogRef.current;

    if (!dialogNode) {
      return undefined;
    }

    const focusFirstElement = () => {
      const firstFocusable = dialogNode.querySelector('[data-initial-focus]') || dialogNode.querySelector(focusableSelector);
      if (firstFocusable && typeof firstFocusable.focus === 'function') {
        firstFocusable.focus();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Tab') {
        const focusableElements = dialogNode.querySelectorAll(focusableSelector);
        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const elements = Array.from(focusableElements);
        const first = elements[0];
        const last = elements[elements.length - 1];
        const { activeElement } = document;

        if (event.shiftKey) {
          if (activeElement === first || !dialogNode.contains(activeElement)) {
            event.preventDefault();
            last.focus();
          }
        } else if (activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        if (!isSubmitting) {
          onRequestClose();
        }
      }
    };

    focusFirstElement();
    dialogNode.addEventListener('keydown', handleKeyDown);

    return () => {
      dialogNode.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocusedRef.current && typeof previouslyFocusedRef.current.focus === 'function') {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [open, onRequestClose, isSubmitting]);

  const handleOverlayClick = (event) => {
    if (isSubmitting) {
      return;
    }

    if (event.target === event.currentTarget) {
      onRequestClose();
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const validate = () => {
    const trimmedName = formState.name.trim();
    const trimmedDescription = formState.description.trim();

    if (!trimmedName) {
      return { field: 'Le nom du projet est requis.', general: '' };
    }

    if (trimmedName.length > MAX_NAME_LENGTH) {
      return { field: `Le nom doit contenir au maximum ${MAX_NAME_LENGTH} caractères.`, general: '' };
    }

    if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
      return { field: '', general: `La description doit contenir au maximum ${MAX_DESCRIPTION_LENGTH} caractères.` };
    }

    return { field: '', general: '' };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationResult = validate();
    if (validationResult.field || validationResult.general) {
      setErrors(validationResult);
      return;
    }

    setErrors({ field: '', general: '' });
    setIsSubmitting(true);

    try {
      await onSubmit({
        name: formState.name.trim(),
        description: formState.description.trim(),
      });
      setFormState(initialFormState);
      onRequestClose();
    } catch (error) {
      setErrors({
        field: '',
        general: error?.message || 'Une erreur est survenue lors de la création du projet.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderErrors = () => {
    if (!errors.field && !errors.general) {
      return null;
    }

    return (
      <div className="new-project-modal__errors" role="alert" id={generalErrorId}>
        {errors.field && <p>{errors.field}</p>}
        {errors.general && <p>{errors.general}</p>}
      </div>
    );
  };

  if (!open) {
    return null;
  }

  return (
    <div className="new-project-modal__overlay" role="presentation" onMouseDown={handleOverlayClick}>
      <div
        ref={dialogRef}
        className="new-project-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-project-modal-title"
        aria-describedby={errors.field || errors.general ? generalErrorId : undefined}
      >
        <header className="new-project-modal__header">
          <div>
            <h2 id="new-project-modal-title">Nouveau projet</h2>
            <p>Créez un nouveau projet pour votre tableau de bord.</p>
          </div>
          <button
            type="button"
            className="button button--ghost new-project-modal__close"
            onClick={onRequestClose}
            disabled={isSubmitting}
            aria-label="Fermer la fenêtre de création"
          >
            ×
          </button>
        </header>

        {renderErrors()}

        <form className="new-project-modal__form" onSubmit={handleSubmit} noValidate>
          <div className="new-project-modal__field">
            <label htmlFor={nameInputId}>Nom du projet</label>
            <input
              id={nameInputId}
              name="name"
              type="text"
              data-initial-focus
              maxLength={MAX_NAME_LENGTH}
              required
              value={formState.name}
              onChange={handleChange}
              disabled={isSubmitting}
              aria-required="true"
              aria-invalid={errors.field ? 'true' : 'false'}
              aria-describedby={errors.field ? nameErrorId : undefined}
            />
            {errors.field ? (
              <p className="new-project-modal__field-error" id={nameErrorId}>
                {errors.field}
              </p>
            ) : (
              <p className="new-project-modal__helper">Maximum {MAX_NAME_LENGTH} caractères.</p>
            )}
          </div>

          <div className="new-project-modal__field">
            <label htmlFor={descriptionInputId}>Description (facultatif)</label>
            <textarea
              id={descriptionInputId}
              name="description"
              maxLength={MAX_DESCRIPTION_LENGTH}
              value={formState.description}
              onChange={handleChange}
              disabled={isSubmitting}
              aria-describedby={!errors.general ? undefined : generalErrorId}
            />
            <p className="new-project-modal__helper">Maximum {MAX_DESCRIPTION_LENGTH} caractères.</p>
          </div>

          <div className="new-project-modal__actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={onRequestClose}
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button type="submit" className="button button--primary" disabled={isSubmitting}>
              {isSubmitting ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

NewProjectModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onRequestClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default NewProjectModal;
