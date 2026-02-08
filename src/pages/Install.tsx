import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Smartphone, Check, Share, Plus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-8"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/20 mb-4">
          <Smartphone className="w-10 h-10 text-primary" />
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-3">Install HaziqUERP</h1>
          <p className="text-muted-foreground">
            Install our app on your device for the best experience. Quick access, offline support, and more!
          </p>
        </div>

        {isInstalled ? (
          <div className="flex items-center justify-center gap-2 text-primary">
            <Check className="w-5 h-5" />
            <span>App is already installed!</span>
          </div>
        ) : isIOS ? (
          <div className="space-y-4 p-6 rounded-xl bg-card border border-border text-left">
            <p className="font-medium text-center mb-4">To install on iOS:</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">1</div>
                <div className="flex items-center gap-2">
                  <span>Tap the</span>
                  <Share className="w-5 h-5 text-primary" />
                  <span>Share button</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">2</div>
                <div className="flex items-center gap-2">
                  <span>Scroll and tap</span>
                  <Plus className="w-5 h-5 text-primary" />
                  <span>"Add to Home Screen"</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">3</div>
                <span>Tap "Add" to confirm</span>
              </div>
            </div>
          </div>
        ) : deferredPrompt ? (
          <Button onClick={handleInstall} size="lg" className="gap-2">
            <Download className="w-5 h-5" />
            Install App
          </Button>
        ) : (
          <div className="space-y-4 p-6 rounded-xl bg-card border border-border text-left">
            <p className="font-medium text-center mb-4">To install on Android:</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">1</div>
                <div className="flex items-center gap-2">
                  <span>Tap the</span>
                  <MoreVertical className="w-5 h-5 text-primary" />
                  <span>menu button</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">2</div>
                <span>Tap "Install app" or "Add to Home Screen"</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">3</div>
                <span>Tap "Install" to confirm</span>
              </div>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="text-muted-foreground"
        >
          Continue in browser
        </Button>
      </motion.div>
    </div>
  );
}
