import PropTypes from 'prop-types';

const QuickWinIcon = ({ className = '' }) => {
  const classes = ['quick-win-icon'];
  if (className) {
    classes.push(className);
  }

  return (
    <svg
      className={classes.join(' ')}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 2.75l2.28 5.47 5.97.5-4.55 3.94 1.38 5.86L12 15.98l-5.08 3.54 1.38-5.86-4.55-3.94 5.97-.5L12 2.75z" />
    </svg>
  );
};

QuickWinIcon.propTypes = {
  className: PropTypes.string,
};

export default QuickWinIcon;
