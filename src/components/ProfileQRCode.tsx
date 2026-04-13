import { useState, useRef, useCallback } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { QrCode, Download, Share2, Copy, Check, RefreshCw, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface ProfileQRCodeProps {
  profileSlug: string | null;
  fullName: string | null;
  avatarUrl?: string | null;
}

const ProfileQRCode = ({ profileSlug, fullName, avatarUrl }: ProfileQRCodeProps) => {
  const [open, setOpen] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrVersion, setQrVersion] = useState(0);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [centerImage, setCenterImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const profileUrl = profileSlug
    ? `${window.location.origin}/profile/${profileSlug}`
    : "";

  const getInitials = (name: string | null) => {
    if (!name) return "CV";
    return name
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Generate a center image: avatar or initials on canvas
  const generateCenterImage = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      const size = 48;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve("");

      if (avatarUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          // Draw circular avatar
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, 0, 0, size, size);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => {
          // Fallback to initials
          drawInitials(ctx, size);
          resolve(canvas.toDataURL("image/png"));
        };
        img.src = avatarUrl;
      } else {
        drawInitials(ctx, size);
        resolve(canvas.toDataURL("image/png"));
      }
    });
  }, [avatarUrl, fullName]);

  const drawInitials = (ctx: CanvasRenderingContext2D, size: number) => {
    // Gradient circle background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, "#6366f1");
    gradient.addColorStop(1, "#8b5cf6");
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // White border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Initials text
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${size * 0.38}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(getInitials(fullName), size / 2, size / 2);
  };

  const handleGenerate = async () => {
    if (!profileSlug) {
      toast({
        title: "Profile not ready",
        description: "Upload and parse your CV first to generate a QR code.",
        variant: "destructive",
      });
      return;
    }
    const img = await generateCenterImage();
    setCenterImage(img);
    setGenerated(true);
    setQrVersion((v) => v + 1);
    setOpen(true);
  };

  const handleRegenerate = async () => {
    const img = await generateCenterImage();
    setCenterImage(img);
    setQrVersion((v) => v + 1);
    setShowRegenConfirm(false);
    toast({ title: "QR Code regenerated", description: "Your new QR code is ready." });
  };

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;

    const size = 400;
    const padding = 40;
    const totalSize = size + padding * 2;
    const offscreen = document.createElement("canvas");
    offscreen.width = totalSize;
    offscreen.height = totalSize + 60;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, totalSize, totalSize + 60);
    gradient.addColorStop(0, "#0f172a");
    gradient.addColorStop(0.5, "#1e1b4b");
    gradient.addColorStop(1, "#0f172a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, totalSize, totalSize + 60);

    ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
    ctx.lineWidth = 2;
    ctx.roundRect(4, 4, totalSize - 8, totalSize + 52, 16);
    ctx.stroke();

    ctx.drawImage(canvas, padding, padding, size, size);

    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "bold 16px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(fullName || "Digital CV", totalSize / 2, size + padding + 36);

    const link = document.createElement("a");
    link.download = `${(fullName || "CV").replace(/\s+/g, "_")}_QR.png`;
    link.href = offscreen.toDataURL("image/png");
    link.click();

    toast({ title: "QR Code downloaded!" });
  }, [fullName, toast]);

  const handleShareQR = async () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;

    if (navigator.share) {
      try {
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], "cv-qr-code.png", { type: "image/png" });
          await navigator.share({
            title: `${fullName || "My"} Digital CV`,
            text: `Check out my digital CV: ${profileUrl}`,
            files: [file],
          });
        });
      } catch {
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast({ title: "Profile link copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleGenerate}
        disabled={!profileSlug}
        className="gap-1.5"
      >
        <QrCode className="h-4 w-4" />
        QR Code
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-background via-background to-accent/5 border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <QrCode className="h-5 w-5 text-primary" />
              Your Digital CV QR Code
            </DialogTitle>
          </DialogHeader>

          {generated && (
            <div className="flex flex-col items-center gap-6 py-4">
              {/* QR Code with futuristic frame */}
              <div className="relative group">
                <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative rounded-xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 border border-primary/30 shadow-2xl">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary/60 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary/60 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary/60 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary/60 rounded-br-xl" />

                  <div className="absolute inset-6 overflow-hidden rounded pointer-events-none">
                    <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-pulse" style={{ animation: "scan 2.5s ease-in-out infinite" }} />
                  </div>

                  <div ref={canvasRef} key={qrVersion}>
                    <QRCodeCanvas
                      value={profileUrl}
                      size={220}
                      level="H"
                      bgColor="#ffffff"
                      fgColor="#0f172a"
                      marginSize={2}
                      imageSettings={
                        centerImage
                          ? {
                              src: centerImage,
                              height: 44,
                              width: 44,
                              excavate: true,
                            }
                          : undefined
                      }
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                </div>
              </div>

              {/* Name label */}
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">
                  {fullName || "Digital CV"}
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[260px] truncate">
                  {profileUrl}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={copyLink}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy Link"}
                </Button>
                <Button
                  variant="hero"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={handleShareQR}
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>

              {/* Regenerate button */}
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-destructive"
                onClick={() => setShowRegenConfirm(true)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Regeneration confirmation */}
      <AlertDialog open={showRegenConfirm} onOpenChange={setShowRegenConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Regenerate QR Code?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Generating a new QR code will replace your current one.{" "}
              <span className="font-semibold text-destructive">
                Previously shared or printed QR codes will no longer work.
              </span>{" "}
              Make sure to update all shared copies after regeneration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRegenerate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 0; }
          50% { top: calc(100% - 2px); }
        }
      `}</style>
    </>
  );
};

export default ProfileQRCode;
