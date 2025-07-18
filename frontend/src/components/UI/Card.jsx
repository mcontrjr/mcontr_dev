 
/* eslint-disable react/prop-types */
import { memo } from 'react';

const Card = memo(({ title, description, route, category, status, type, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.location.href = route;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className="unified-card"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Navigate to ${title}`}
    >
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        <div className="card-badges">
          <span className={`badge badge-${category?.toLowerCase()}`}>
            {category}
          </span>
          {status && (
            <span className={`badge badge-${status.toLowerCase()}`}>
              {status}
            </span>
          )}
        </div>
      </div>
      <div className="card-body">
        <p className="card-description">{description}</p>
      </div>
      <div className="card-footer">
        <span className="card-type">{type}</span>
      </div>
    </div>
  );
});

Card.displayName = 'Card';

export default Card;