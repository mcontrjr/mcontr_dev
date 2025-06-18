import '../styles/stock.css'

// Components
function SearchInterface({ keyword, setKeyword, onSearch, onClear, loading, message, hasSearched, hasImages }) {
  return (
    <div className="my-card animate-fade-in-up" style={{ maxWidth: '500px', margin: '0 auto 3rem auto' }}>
      <div className="my-card-body">
        <p className="mb-3" style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
          {message}
        </p>
        
        <div className="photo-search-container">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Enter keyword (e.g., nature, city, animals)..."
            disabled={loading}
            className="photo-search-input"
          />
          <button 
            className="my-button"
            onClick={onSearch}
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search Photos'}
          </button>
        </div>

        {(hasSearched || hasImages) && (
          <div className="photo-button-group">
            <button 
              className="my-button"
              onClick={onClear}
              disabled={loading.pexels || loading.picsum || loading.flickr}
            >
              Clear Results
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TabulatedGallery({ pexelsImages, picsumImages, loading, activeTab, setActiveTab }) {
  const LoadingState = () => (
    <div className="gallery-loading-state">
      <div className="photo-skeleton-spinner"></div>
      <p className="gallery-loading-text">Loading photos...</p>
    </div>
  );

  const ErrorState = ({ engine }) => (
    <div className="gallery-error-state">
      <img src={notFound} alt="No results" className="gallery-error-image" />
      <p className="gallery-error-text">No photos found from {engine}. Try a different keyword!</p>
    </div>
  );

  const ImageGrid = ({ images, engine }) => (
    <>
      <div className="photo-grid">
        {images.map((image) => (
          <div 
            key={image.id} 
            className="photo-card animate-fade-in-up"
            onClick={() => window.open(image.url, '_blank')}
          >
            <img
              src={image.url}
              alt="Photo"
              className="photo-image"
              onError={(e) => {
                e.target.src = notFound;
                e.target.style.padding = '20px';
                e.target.style.objectFit = 'contain';
              }}
            />
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="gallery-tabs-container animate-fade-in-up">
      <div className="gallery-tabs-header">
        <button 
          className={`gallery-tab ${activeTab === 'pexels' ? 'active' : ''}`}
          onClick={() => setActiveTab('pexels')}
        >
          Pexels
        </button>
        <button 
          className={`gallery-tab ${activeTab === 'picsum' ? 'active' : ''}`}
          onClick={() => setActiveTab('picsum')}
        >
          Lorem Picsum
        </button>
      </div>
      
      <div className="gallery-tab-content">
        <div className={`gallery-tab-pane ${activeTab === 'pexels' ? 'active' : ''}`}>
          <div className="gallery-engine-info">
            <h4 className="gallery-engine-title">Pexels Gallery</h4>
            <p className="gallery-engine-description">
              High-quality stock photos from professional photographers
            </p>
          </div>
          
          {loading.pexels ? (
            <LoadingState />
          ) : pexelsImages.length > 0 ? (
            <ImageGrid images={pexelsImages} engine="Pexels" />
          ) : (
            <ErrorState engine="Pexels" />
          )}
        </div>
        
        <div className={`gallery-tab-pane ${activeTab === 'picsum' ? 'active' : ''}`}>
          <div className="gallery-engine-info">
            <h4 className="gallery-engine-title">Lorem Picsum Gallery</h4>
            <p className="gallery-engine-description">
              Beautiful placeholder images with consistent quality and variety
            </p>
          </div>
          
          {loading.picsum ? (
            <LoadingState />
          ) : picsumImages.length > 0 ? (
            <ImageGrid images={picsumImages} engine="Lorem Picsum" />
          ) : (
            <ErrorState engine="Lorem Picsum" />
          )}
        </div>
      </div>
      
      <div className="photo-credits">
        <p><strong>Photo Credits:</strong></p>
        <p>Photos provided by <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer">Pexels</a> and <a href="https://picsum.photos" target="_blank" rel="noopener noreferrer">Lorem Picsum</a></p>
        <p>Click any photo to view full size</p>
      </div>
    </div>
  );
}

export {TabulatedGallery, SearchInterface}