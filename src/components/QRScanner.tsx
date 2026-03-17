import { useState } from "react";
import { motion } from "framer-motion";

interface QRScannerProps {
  onScan: (code: string) => void;
}

// Simplified QR scanner - in production use a library like html5-qrcode
// For now, provides a manual code entry as well
const QRScanner = ({ onScan }: QRScannerProps) => {
  const [manualCode, setManualCode] = useState("");

  return (
    <div className="flex flex-col items-center gap-6 pt-4">
      {/* Camera viewport for scanning */}
      <div className="relative w-full aspect-square max-w-[280px] rounded-2xl overflow-hidden signal-surface">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-48 h-48">
            {/* Scan frame corners */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg" />

            {/* Scan line animation */}
            <motion.div
              className="absolute left-2 right-2 h-0.5 bg-primary/60"
              animate={{ top: ["10%", "90%", "10%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>

        <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground">
          Point at a Signal QR code
        </p>
      </div>

      {/* Manual code entry */}
      <div className="w-full">
        <p className="text-xs text-muted-foreground text-center mb-3">Or enter code manually</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter QR code..."
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="flex-1 signal-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => manualCode.trim() && onScan(manualCode.trim())}
            disabled={!manualCode.trim()}
            className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground signal-ease disabled:opacity-50"
          >
            Go
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
