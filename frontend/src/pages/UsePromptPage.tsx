import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useChainId, useSwitchChain } from 'wagmi';
import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { NFTGallery } from '../components/NFTGallery';
import { filecoinCalibration } from '../web3/rainbow';
import { parseEther } from 'viem';
import './GenerationPage.css';
import '../components/HomePage.css';

interface UsePromptPageProps {
  prompt: {
    id: string;
    owner_address: string;
    price_in_tfil: number;
    before_image_url: string | null;
    after_image_url: string | null;
    created_at: string;
  };
  onBack: () => void;
  onHome: () => void;
}

interface NFT {
  identifier: string;
  name: string;
  description: string;
  image_url: string;
  collection: string;
  contract: string;
  token_standard: string;
  chain: string;
}

export function UsePromptPage({ prompt, onBack, onHome }: UsePromptPageProps) {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { sendTransaction, data: txHash, isPending: isPendingTx, error: txError } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });
  const [selectedNFTs, setSelectedNFTs] = useState<NFT[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decryptedPrompt, setDecryptedPrompt] = useState<string | null>(null);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'idle' | 'switching' | 'paying' | 'confirming' | 'paid'>('idle');

  const isGenerateDisabled = selectedNFTs.length === 0 || isGenerating || !decryptedPrompt;

  const handleLoadPrompt = async () => {
    if (!address) {
      setError('Please connect your wallet');
      return;
    }

    setError(null);
    setPaymentStep('switching');

    try {
      // Switch to Filecoin Calibration if needed
      if (chainId !== filecoinCalibration.id) {
        try {
          await switchChain({ chainId: filecoinCalibration.id });
        } catch (switchError) {
          console.error('Failed to switch chain:', switchError);
          setError('Please switch to Filecoin Calibration network');
          setPaymentStep('idle');
          return;
        }
      }

      // Send payment transaction
      setPaymentStep('paying');
      const amountInWei = parseEther(prompt.price_in_tfil.toString());
      
      sendTransaction({
        to: prompt.owner_address as `0x${string}`,
        value: amountInWei,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error initiating payment:', errorMessage);
      setError(errorMessage);
      setPaymentStep('idle');
    }
  };

  // Handle payment confirmation and prompt decryption
  useEffect(() => {
    if (isConfirmed && txHash && address && paymentStep === 'paying') {
      setPaymentStep('paid');
      setIsLoadingPrompt(true);
      
      // Now decrypt the prompt after payment is confirmed
      const decryptPrompt = async () => {
        try {
          const response = await fetch('https://crafture-topi.onrender.com/api/use-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              promptId: prompt.id,
              walletAddress: address,
              txHash: txHash
            })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to load prompt');
          }

          const data = await response.json();
          setDecryptedPrompt(data.prompt);
          console.log('Prompt loaded successfully');
          setPaymentStep('idle');
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
          console.error('Error loading prompt:', errorMessage);
          setError(errorMessage);
          setPaymentStep('idle');
        } finally {
          setIsLoadingPrompt(false);
        }
      };

      decryptPrompt();
    }
  }, [isConfirmed, txHash, address, paymentStep, prompt.id]);

  const handleGenerateImage = async () => {
    if (isGenerateDisabled || !decryptedPrompt) return;

    console.log('=== STARTING CUSTOM PROMPT IMAGE GENERATION ===');
    console.log('Selected NFTs:', selectedNFTs);
    console.log('Prompt:', decryptedPrompt);

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const imageUrls = selectedNFTs.map(nft => nft.image_url);
      
      const response = await fetch('https://crafture-topi.onrender.com/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: decryptedPrompt,
          imageUrls,
          walletAddress: address,
          isCustomPrompt: true // Mark this as a custom prompt
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to generate image');
      }

      const data = await response.json();
      console.log('Generation response:', data);
      if (data.success) {
        setGeneratedImage(data.generatedImage);
      } else {
        throw new Error(data.message || 'Generation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error generating image:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
      console.log('=== CUSTOM PROMPT IMAGE GENERATION COMPLETED ===');
    }
  };

  if (generatedImage) {
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
                <button onClick={() => setGeneratedImage(null)} className="breadcrumb-link">← Back</button>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-current">Generated Image</span>
              </div>
              <h1>Generated Image</h1>
              <p>Your AI-generated image is ready!</p>
            </div>
            <div className="content-section" style={{ gridTemplateColumns: '1fr' }}>
              <div className="result-container">
                <div className="generated-image-container">
                  <img src={generatedImage} alt="Generated" className="generated-image" />
                </div>
                <div className="result-actions">
                  <button className="generate-button" onClick={() => setGeneratedImage(null)}>Generate Another</button>
                  <button className="secondary-button" onClick={onHome}>Back to Home</button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
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
      <main className="container">
        <div className="generation-page">
          <div className="page-header">
            <div className="breadcrumb">
              <button onClick={onBack} className="breadcrumb-link">← Back to Prompts</button>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">Use Custom Prompt</span>
            </div>
            <h1>Use Custom Prompt</h1>
            <p>Select NFTs and generate images using this encrypted prompt</p>
          </div>

          {!isConnected ? (
            <div className="connect-prompt">
              <div className="prompt-card">
                <h2>Connect Your Wallet</h2>
                <p>Connect to view your NFTs and use this prompt</p>
              </div>
            </div>
          ) : (
            <div className="content-section">
              <div className="nft-selection">
                <h2>Your NFTs</h2>
                <p>Choose one or more NFTs to use with this prompt</p>
                <NFTGallery onSelectionChange={setSelectedNFTs} selectionMode={true} />
              </div>
              <div className="generation-panel">
                <h3>Custom Prompt</h3>
                
                {/* Before/After Images */}
                {(prompt.before_image_url || prompt.after_image_url) && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ color: '#e2e8f0', fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Preview
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      {prompt.before_image_url && (
                        <div>
                          <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Before</div>
                          <img
                            src={prompt.before_image_url}
                            alt="Before"
                            style={{
                              width: '100%',
                              borderRadius: '8px',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              maxHeight: '150px',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      {prompt.after_image_url && (
                        <div>
                          <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.5rem' }}>After</div>
                          <img
                            src={prompt.after_image_url}
                            alt="After"
                            style={{
                              width: '100%',
                              borderRadius: '8px',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              maxHeight: '150px',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Price Info */}
                <div style={{
                  background: 'rgba(96, 165, 250, 0.1)',
                  border: '1px solid rgba(96, 165, 250, 0.3)',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Price</div>
                      <div style={{ color: '#60a5fa', fontSize: '1.5rem', fontWeight: 700 }}>
                        {prompt.price_in_tfil} tFIL
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Owner</div>
                      <div style={{ color: '#cbd5e1', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                        {prompt.owner_address.slice(0, 6)}...{prompt.owner_address.slice(-4)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prompt Status */}
                {!decryptedPrompt && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <button
                      className="generate-button"
                      onClick={handleLoadPrompt}
                      disabled={isLoadingPrompt || isPendingTx || isConfirming || paymentStep !== 'idle'}
                      style={{ width: '100%' }}
                    >
                      {paymentStep === 'switching' ? (
                        <>
                          <span className="loading-spinner"></span>
                          Switching Network...
                        </>
                      ) : paymentStep === 'paying' || isPendingTx ? (
                        <>
                          <span className="loading-spinner"></span>
                          Waiting for Wallet...
                        </>
                      ) : isConfirming ? (
                        <>
                          <span className="loading-spinner"></span>
                          Confirming Payment...
                        </>
                      ) : isLoadingPrompt ? (
                        <>
                          <span className="loading-spinner"></span>
                          Loading Prompt...
                        </>
                      ) : (
                        `Pay ${prompt.price_in_tfil} tFIL & Load Prompt`
                      )}
                    </button>
                    {txError && (
                      <p style={{ color: '#fca5a5', fontSize: '0.85rem', marginTop: '0.5rem', textAlign: 'center' }}>
                        Payment failed: {txError.message}
                      </p>
                    )}
                    {!txError && (
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.5rem', textAlign: 'center' }}>
                        The prompt is encrypted. Pay to decrypt and use it.
                      </p>
                    )}
                  </div>
                )}

                {decryptedPrompt && (
                  <div style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    marginBottom: '1.5rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: '#86efac', fontSize: '0.9rem' }}>
                      ✅ Prompt loaded and ready to use
                    </div>
                  </div>
                )}

                {error && (
                  <div className="error-message">
                    <p>❌ {error}</p>
                    <button className="retry-button" onClick={() => setError(null)}>Dismiss</button>
                  </div>
                )}

                <button
                  className={`generate-button ${isGenerateDisabled ? 'disabled' : ''}`}
                  disabled={isGenerateDisabled}
                  onClick={handleGenerateImage}
                >
                  {isGenerating ? (
                    <>
                      <span className="loading-spinner"></span>
                      Generating...
                    </>
                  ) : (
                    'Generate Image'
                  )}
                </button>

                {selectedNFTs.length === 0 && (
                  <p className="validation-message">Please select at least one NFT to proceed</p>
                )}

                {!decryptedPrompt && (
                  <p className="validation-message">Please load the prompt first</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

