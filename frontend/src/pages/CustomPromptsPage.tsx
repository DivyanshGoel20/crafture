import { useAccount } from 'wagmi';
import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import './GenerationPage.css';
import '../components/HomePage.css';

interface CustomPromptsPageProps {
  onBack: () => void;
}

export function CustomPromptsPage({ onBack }: CustomPromptsPageProps) {
  const { isConnected, address } = useAccount();
  const [prompt, setPrompt] = useState('');
  const [priceInTfil, setPriceInTfil] = useState('');
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [beforeImagePreview, setBeforeImagePreview] = useState<string | null>(null);
  const [afterImagePreview, setAfterImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleBeforeImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBeforeImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBeforeImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAfterImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAfterImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAfterImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (!priceInTfil || parseFloat(priceInTfil) < 0) {
      setError('Please enter a valid price (0 or greater)');
      return;
    }

    if (!address) {
      setError('Please connect your wallet');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('prompt', prompt.trim());
      formData.append('priceInTfil', priceInTfil);
      formData.append('ownerAddress', address);
      
      if (beforeImage) {
        formData.append('beforeImage', beforeImage);
      }
      
      if (afterImage) {
        formData.append('afterImage', afterImage);
      }

      const response = await fetch('http://localhost:3001/api/create-prompt', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create prompt');
      }

      const data = await response.json();
      console.log('Prompt created successfully:', data);
      
      setSuccess(true);
      // Reset form
      setPrompt('');
      setPriceInTfil('');
      setBeforeImage(null);
      setAfterImage(null);
      setBeforeImagePreview(null);
      setAfterImagePreview(null);
      
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error creating prompt:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <main className="container">
        <div className="generation-page">
          <div className="page-header">
            <div className="breadcrumb">
              <button onClick={onBack} className="breadcrumb-link">← Back to Home</button>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">Create Custom Prompt</span>
            </div>
            <h1>Create Custom Prompt</h1>
            <p>Create and monetize your AI prompts. Others can use them but must pay to see the prompt.</p>
          </div>

          {!isConnected ? (
            <div className="connect-prompt">
              <div className="prompt-card">
                <h2>Connect Your Wallet</h2>
                <p>Connect to create and monetize your custom prompts</p>
              </div>
            </div>
          ) : (
            <div className="content-section" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0 auto' }}>
              <form onSubmit={handleSubmit} className="generation-panel">
                <h3>Prompt Details</h3>
                
                {error && (
                  <div className="error-message">
                    <p>❌ {error}</p>
                    <button className="retry-button" onClick={() => setError(null)}>Dismiss</button>
                  </div>
                )}

                {success && (
                  <div style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem',
                    color: '#86efac'
                  }}>
                    ✅ Prompt created successfully! It's now encrypted and stored.
                  </div>
                )}

                <div className="prompt-section">
                  <label htmlFor="prompt">AI Prompt (will be encrypted)</label>
                  <textarea
                    id="prompt"
                    className="prompt-textarea"
                    placeholder="Enter your custom AI prompt here. This will be encrypted so others can't see it without paying..."
                    rows={6}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    required
                  />
                </div>

                <div className="setting-item">
                  <label htmlFor="price">Price (tFIL)</label>
                  <input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="5"
                    value={priceInTfil}
                    onChange={(e) => setPriceInTfil(e.target.value)}
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      color: 'white',
                      fontSize: '0.9rem',
                      width: '100%',
                      transition: 'all 0.2s'
                    }}
                    required
                  />
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    Amount users must pay to use this prompt
                  </p>
                </div>

                <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                  <h4 style={{ color: '#e2e8f0', fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 600 }}>
                    Before & After Images (Optional)
                  </h4>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Show examples of what your prompt can create. Images will be uploaded to Filecoin.
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                      <label htmlFor="before-image" style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        color: '#e2e8f0',
                        marginBottom: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Before Image
                      </label>
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '2px dashed rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        minHeight: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.5)';
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
                      }}>
                        {beforeImagePreview ? (
                          <div style={{ width: '100%' }}>
                            <img 
                              src={beforeImagePreview} 
                              alt="Before preview" 
                              style={{
                                width: '100%',
                                maxHeight: '200px',
                                objectFit: 'contain',
                                borderRadius: '8px',
                                marginBottom: '0.5rem'
                              }}
                            />
                            <label htmlFor="before-image" style={{
                              color: '#60a5fa',
                              cursor: 'pointer',
                              fontSize: '0.85rem'
                            }}>
                              Change Image
                            </label>
                          </div>
                        ) : (
                          <label htmlFor="before-image" style={{ cursor: 'pointer', width: '100%' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
                            <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Click to upload</div>
                          </label>
                        )}
                        <input
                          id="before-image"
                          type="file"
                          accept="image/*"
                          onChange={handleBeforeImageChange}
                          style={{ display: 'none' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="after-image" style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        color: '#e2e8f0',
                        marginBottom: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        After Image
                      </label>
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '2px dashed rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        minHeight: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.5)';
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
                      }}>
                        {afterImagePreview ? (
                          <div style={{ width: '100%' }}>
                            <img 
                              src={afterImagePreview} 
                              alt="After preview" 
                              style={{
                                width: '100%',
                                maxHeight: '200px',
                                objectFit: 'contain',
                                borderRadius: '8px',
                                marginBottom: '0.5rem'
                              }}
                            />
                            <label htmlFor="after-image" style={{
                              color: '#60a5fa',
                              cursor: 'pointer',
                              fontSize: '0.85rem'
                            }}>
                              Change Image
                            </label>
                          </div>
                        ) : (
                          <label htmlFor="after-image" style={{ cursor: 'pointer', width: '100%' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✨</div>
                            <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Click to upload</div>
                          </label>
                        )}
                        <input
                          id="after-image"
                          type="file"
                          accept="image/*"
                          onChange={handleAfterImageChange}
                          style={{ display: 'none' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  className={`generate-button ${isSubmitting ? 'disabled' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading-spinner"></span>
                      Creating Prompt...
                    </>
                  ) : (
                    'Create & Encrypt Prompt'
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

