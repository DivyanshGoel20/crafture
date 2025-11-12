import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ImageGenerationPage } from '../pages/ImageGenerationPage';
import FigurineGenerationPage from '../pages/FigurineGenerationPage';
import { HistoryPage } from '../pages/HistoryPage';
import { CustomPromptsPage } from '../pages/CustomPromptsPage';
import './HomePage.css';

export function HomePage() {
  const [currentPage, setCurrentPage] = useState<'home' | 'image' | 'figurine' | 'history' | 'custom-prompts'>('home');

  if (currentPage === 'image') {
    return <ImageGenerationPage onBack={() => setCurrentPage('home')} />;
  }

  if (currentPage === 'figurine') {
    return <FigurineGenerationPage onBack={() => setCurrentPage('home')} />;
  }

  if (currentPage === 'history') {
    return <HistoryPage onBack={() => setCurrentPage('home')} />;
  }

  if (currentPage === 'custom-prompts') {
    return <CustomPromptsPage onBack={() => setCurrentPage('home')} />;
  }

  return (
    <div className="homepage">
      <header className="topbar">
        <div className="container topbar-content">
          <div className="brand">
            <div className="brand-name">Crafture</div>
            <div className="tagline">Turn Your Digital Collection into AI‑Generated Masterpieces.</div>
          </div>
          <div className="wallet">
            <ConnectButton />
          </div>
        </div>
      </header>
      <main>
        <div className="container">
          <div className="main-feature">
            <div className="featured-card figurine-card" onClick={() => setCurrentPage('figurine')}> 
              <div className="featured-badge">⭐ Featured</div>
              <div className="card-icon">🧸</div>
              <h2>3D NFT Figurines</h2>
              <p>Transform your NFTs into premium 3D figurine-style images with professional lighting and presentation</p>
              <div className="card-features">
                <span>Premium acrylic base</span>
                <span>Professional desk scene</span>
                <span>Packaging mockup</span>
                <span>Studio lighting</span>
              </div>
              <div className="cta-button">Create Figurine →</div>
            </div>
          </div>

          <div className="secondary-options">
            <div className="option-card image-card" onClick={() => setCurrentPage('image')}>
              <div className="card-icon">🎨</div>
              <h2>AI Images</h2>
              <p>Generate stunning images inspired by your NFTs using advanced AI</p>
              <div className="card-features">
                <span>Style Transfer</span>
                <span>Art Generation</span>
                <span>High Resolution</span>
              </div>
            </div>

            <div className="option-card history-card" onClick={() => setCurrentPage('history')}>
              <div className="card-icon">🗂️</div>
              <h2>Recent Works</h2>
              <p>Browse your generated images and prompts</p>
              <div className="card-features">
                <span>View History</span>
                <span>Open via Gateway</span>
                <span>Mint</span>
              </div>
            </div>

            <div className="option-card" onClick={() => setCurrentPage('custom-prompts')} style={{ cursor: 'pointer' }}>
              <div className="card-icon">💡</div>
              <h2>Custom Prompts</h2>
              <p>Create and monetize your AI prompts</p>
              <div className="card-features">
                <span>Encrypted Storage</span>
                <span>Set Your Price</span>
                <span>Before/After Images</span>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}