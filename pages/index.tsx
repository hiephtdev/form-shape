import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [privateKeys, setPrivateKeys] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState({ 
    current: 0, 
    total: 0,
    wallets: 0,
    success: 0,
    failed: 0
  });

  // Initialize dark mode based on system preference only on client side
  useEffect(() => {
    setMounted(true);
    // Check for system preference only on client
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
      
      // Apply dark mode class if needed
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!privateKeys.trim()) {
      setLogs(prev => [...prev, "❌ No private keys provided"]);
      return;
    }

    // Validate private keys format
    const keys = privateKeys
      .split('\n')
      .map(key => key.trim())
      .filter(key => key.length > 0 && !key.startsWith('#'));
    
    // Basic validation - check if keys look like hex strings
    const invalidKeys = keys.filter(key => !key.match(/^0x[0-9a-fA-F]{64}$/));
    if (invalidKeys.length > 0) {
      setLogs(prev => [
        ...prev, 
        "❌ Some private keys appear to be invalid:",
        ...invalidKeys.map((key, i) => `   Invalid key ${i+1}: ${key.substring(0, 10)}...`)
      ]);
      return;
    }
    
    setIsProcessing(true);
    setLogs([]);
    
    const totalOperations = keys.length * 4; // 4 tokenIds per wallet
    setProgress({ 
      current: 0, 
      total: totalOperations,
      wallets: keys.length,
      success: 0,
      failed: 0
    });

    try {
      // Call API endpoint to process minting
      const response = await fetch('/api/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ privateKeys: keys }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      // This is a streaming response for real-time updates
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Failed to get response reader');

      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          const text = decoder.decode(value);
          // Split by new line since we're sending JSON objects one per line
          const events = text.split('\n').filter(line => line.trim() !== '');
          
          for (const eventText of events) {
            try {
              const event = JSON.parse(eventText);
              
              if (event.type === 'log') {
                setLogs(logs => [...logs, event.message]);
              } else if (event.type === 'progress') {
                setProgress(prev => ({
                  ...prev,
                  current: event.current,
                  success: event.success || prev.success,
                  failed: event.failed || prev.failed
                }));
              }
            } catch (e) {
              // In case of malformed JSON
              setLogs(logs => [...logs, eventText]);
            }
          }
        }
      }
    } catch (error) {
      setLogs(prev => [...prev, `❌ Error: ${error instanceof Error ? error.message : String(error)}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setPrivateKeys(content);
      setLogs(prev => [...prev, `📄 Loaded ${file.name} successfully`]);
    };
    reader.onerror = () => {
      setLogs(prev => [...prev, '❌ Error reading file']);
    };
    reader.readAsText(file);
  };

  // Avoid hydration mismatch by only rendering UI after client-side hydration
  if (!mounted) {
    return null; // return nothing on first render to avoid hydration mismatch
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <Head>
        <title>Form Shape - NFT Minting</title>
        <meta name="description" content="Mint NFTs using provided private keys" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="py-4 px-6 flex justify-between items-center">
        <div></div>
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-700'}`}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <h1 className={`text-3xl font-bold text-center mb-8 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Form Shape - NFT Minting
        </h1>
        
        <div className={`${darkMode ? 'bg-gray-800 shadow-gray-900' : 'bg-white'} shadow-md rounded-lg p-6 mb-8`}>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="privateKeys" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Private Keys (one per line)
              </label>
              <div className="flex mb-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`mr-2 px-4 py-2 text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} rounded-md`}
                  disabled={isProcessing}
                >
                  Upload File
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  onChange={handleFileUpload}
                  accept=".txt"
                  disabled={isProcessing}
                />
                <button
                  type="button"
                  onClick={() => setPrivateKeys('')}
                  className={`px-4 py-2 text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} rounded-md`}
                  disabled={isProcessing || !privateKeys}
                >
                  Clear
                </button>
              </div>
              <textarea
                id="privateKeys"
                value={privateKeys}
                onChange={(e) => setPrivateKeys(e.target.value)}
                className={`w-full p-3 border ${darkMode ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'} rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[150px]`}
                placeholder="Enter private keys here, one per line, or upload a .txt file"
                disabled={isProcessing}
              />
            </div>
            
            <button
              type="submit"
              disabled={isProcessing}
              className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                isProcessing 
                  ? `${darkMode ? 'bg-blue-500 opacity-70' : 'bg-blue-400'} cursor-not-allowed` 
                  : `${darkMode ? 'bg-blue-500 hover:bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`
              }`}
            >
              {isProcessing ? 'Processing...' : 'Start Minting'}
            </button>
          </form>
        </div>

        {isProcessing && (
          <div className={`${darkMode ? 'bg-gray-800 shadow-gray-900' : 'bg-white'} shadow-md rounded-lg p-6 mb-8`}>
            <div className="mb-2">
              <div className="flex justify-between mb-1">
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Progress</span>
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {progress.current} / {progress.total} ({Math.round((progress.current / progress.total) * 100)}%)
                </span>
              </div>
              <div className={`w-full ${darkMode ? 'bg-gray-600' : 'bg-gray-200'} rounded-full h-2.5`}>
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-2 rounded`}>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Wallets</p>
                <p className="font-bold">{progress.wallets}</p>
              </div>
              <div className={`${darkMode ? 'bg-green-900' : 'bg-green-50'} p-2 rounded`}>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Success</p>
                <p className={`font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{progress.success}</p>
              </div>
              <div className={`${darkMode ? 'bg-red-900' : 'bg-red-50'} p-2 rounded`}>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Failed</p>
                <p className={`font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{progress.failed}</p>
              </div>
            </div>
          </div>
        )}

        <div className={`${darkMode ? 'bg-gray-800 shadow-gray-900' : 'bg-white'} shadow-md rounded-lg p-6`}>
          <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Logs</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-md h-[400px] overflow-y-auto font-mono text-sm">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index} className={`mb-1 ${log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-green-400' : ''}`}>
                  {log}
                </div>
              ))
            ) : (
              <p className="text-gray-500">Logs will appear here when you start minting...</p>
            )}
          </div>
        </div>
      </main>

      <footer className={`text-center py-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
        <p>Form Shape - NFT Minting Tool</p>
      </footer>
    </div>
  );
}
