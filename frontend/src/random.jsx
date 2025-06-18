import { useState, useEffect } from 'react';
import '../styles/stock.css';
import logo from './assets/random-logo.svg';
import { SearchInterface, TabulatedGallery } from './components/RandomComponents';
import {useTheme, ModernHeader, Footer} from './components/MainComponents';


// Pexels API image fetching
async function getPexelsImages(keyword, page = 1) {
  try {
    const apiKey = import.meta.env.VITE_PEXELS_API_KEY;
    
    if (!keyword || keyword.trim() === '') {
      const response = await fetch(`https://api.pexels.com/v1/curated?per_page=9&page=${page}`, {
        headers: { 'Authorization': apiKey }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      return { success: true, images: data.photos.map(photo => ({ id: photo.id, url: photo.src.medium })) };
    }
    
    const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=9&page=${page}`, {
      headers: { 'Authorization': apiKey }
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    if (data.photos.length === 0) return { success: false, error: 'No photos found' };
    
    return { success: true, images: data.photos.map(photo => ({ id: photo.id, url: photo.src.medium })) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Lorem Picsum image fetching
async function getLoremPicsumImages(keyword, page = 1) {
  const images = [];
  const baseOffset = (page - 1) * 9;
  for (let i = 0; i < 9; i++) {
    const imageIndex = baseOffset + i;
    const timestamp = Date.now();
    const seed = keyword ? `${keyword}-${imageIndex}-${timestamp}` : `random-${imageIndex}-${timestamp}`;
    images.push({ 
      id: `picsum-${imageIndex}`, 
      url: `https://picsum.photos/seed/${seed}/400/400` 
    });
  }
  return { success: true, images };
}


export default function RandomPage() {
  const { theme, toggleTheme } = useTheme();
  const [keyword, setKeyword] = useState('');
  const [pexelsImages, setPexelsImages] = useState([]);
  const [picsumImages, setPicsumImages] = useState([]);
  const [message, setMessage] = useState('Enter a keyword to discover amazing photos!');
  const [loading, setLoading] = useState({ pexels: false, picsum: false });
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchedKeyword, setLastSearchedKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState({ pexels: 1, picsum: 1 });
  const [activeTab, setActiveTab] = useState('pexels');

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && !loading) handleSearch();
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [keyword, loading]);

  const handleSearch = async () => {
    setLoading({ pexels: true, picsum: true, flickr: true });
    setHasSearched(true);
    
    const searchKeyword = keyword.trim();
    let pexelsPage = 1;
    let picsumPage = 1;
    let flickrPage = 1;
    
    // If searching the same keyword as before, increment pages for different results
    if (searchKeyword === lastSearchedKeyword) {
      pexelsPage = currentPage.pexels + 1;
      picsumPage = currentPage.picsum + 1;
      flickrPage = currentPage.flickr + 1;
      setCurrentPage({ pexels: pexelsPage, picsum: picsumPage, flickr: flickrPage });
      setMessage(searchKeyword === '' ? `Loading more random photos...` : `Loading more photos for "${searchKeyword}"...`);
    } else {
      // New keyword, reset pages to 1
      setCurrentPage({ pexels: 1, picsum: 1, flickr: 1 });
      setLastSearchedKeyword(searchKeyword);
      setMessage(searchKeyword === '' ? 'Generating random photos...' : `Searching for "${searchKeyword}"...`);
    }

    // Search both engines simultaneously
    const [pexelsResult, picsumResult] = await Promise.all([
      getPexelsImages(searchKeyword, pexelsPage),
      getLoremPicsumImages(picsumPage)
    ]);
    
    setPexelsImages(pexelsResult.success ? pexelsResult.images : []);
    setPicsumImages(picsumResult.success ? picsumResult.images : []);
    
    setMessage(searchKeyword === '' ? 'Here are some photos for you!' : `Found photos for "${searchKeyword}"`);
    setLoading({ pexels: false, picsum: false, flickr: false });
  };

  const handleClear = () => {
    setPexelsImages([]);
    setPicsumImages([]);
    setFlickrImages([]);
    setKeyword('');
    setMessage('Enter a keyword to discover amazing photos!');
    setHasSearched(false);
    setLastSearchedKeyword('');
    setCurrentPage({ pexels: 1, picsum: 1, flickr: 1 });
  };

  return (
    <>
      <ModernHeader 
        theme={theme} 
        toggleTheme={toggleTheme} 
        light_logo={logo} 
        dark_logo={logo}
      />
      <main>
        <section className="my-section">
          <div className="my-container">
            <h2 className="my-section-title animate-fade-in-up">Image Search</h2>

            <SearchInterface 
              keyword={keyword}
              setKeyword={setKeyword}
              onSearch={handleSearch}
              onClear={handleClear}
              loading={loading.pexels || loading.picsum || loading.flickr}
              message={message}
              hasSearched={hasSearched}
              hasImages={pexelsImages.length > 0 || picsumImages.length > 0}
            />

            {(hasSearched || pexelsImages.length > 0 || picsumImages.length > 0 ) && (
              <TabulatedGallery
                pexelsImages={pexelsImages}
                picsumImages={picsumImages}
                loading={loading}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

