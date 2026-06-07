import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
        setShowButton(false);
      });
    }
  };

  if (!showButton) return null;

  return (
    <button
      onClick={handleInstall}
      className="fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-white shadow-lg hover:bg-emerald-700"
    >
      <Download size={18} /> Install App
    </button>
  );
}