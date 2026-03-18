import { useState, useEffect } from "react";
import { Download, Smartphone, Share, MoreVertical, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsInstalled(isStandalone);

    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh bg-background text-foreground p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
          <Download className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold mb-2">You're all set</h1>
        <p className="text-muted-foreground mb-8">arura is installed on your device.</p>
        <Button onClick={() => navigate("/home")} className="bg-primary text-primary-foreground">
          Open arura
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-svh bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center p-4">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center mb-6 shadow-lg shadow-primary/10">
          <Smartphone className="w-10 h-10 text-primary" />
        </div>

        <h1 className="text-3xl font-bold mb-2 tracking-tight">Install arura</h1>
        <p className="text-muted-foreground mb-10 max-w-xs">
          Add arura to your home screen for the full experience — instant launch, offline access, no app store needed.
        </p>

        {/* Native install button (Android/Desktop Chrome) */}
        {deferredPrompt && (
          <Button
            onClick={handleInstall}
            size="lg"
            className="bg-primary text-primary-foreground font-semibold text-base px-8 py-6 rounded-2xl mb-8 shadow-lg shadow-primary/20"
          >
            <Download className="w-5 h-5 mr-2" />
            Install App
          </Button>
        )}

        {/* iOS instructions */}
        {isIOS && !deferredPrompt && (
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full text-left space-y-4">
            <p className="text-sm font-medium text-foreground">How to install on iPhone:</p>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Share className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">1. Tap the Share button</p>
                <p className="text-xs text-muted-foreground">In Safari's bottom toolbar</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">2. Tap "Add to Home Screen"</p>
                <p className="text-xs text-muted-foreground">Scroll down in the share menu</p>
              </div>
            </div>
          </div>
        )}

        {/* Android fallback instructions */}
        {!isIOS && !deferredPrompt && (
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full text-left space-y-4">
            <p className="text-sm font-medium text-foreground">How to install:</p>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MoreVertical className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">1. Tap the browser menu</p>
                <p className="text-xs text-muted-foreground">Three dots in the top right</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Download className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">2. Tap "Install app" or "Add to Home Screen"</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center p-6">
        No app store required · Works offline · Always up to date
      </p>
    </div>
  );
};

export default Install;
