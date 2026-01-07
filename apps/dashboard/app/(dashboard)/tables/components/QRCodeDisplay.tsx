"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QRCodeDisplayProps {
  tableId: string;
  tableNumber: string;
  qrCodeData: string;
  tenantSlug: string;
  showDownloadButton?: boolean;
  children?: React.ReactNode;
}

export function QRCodeDisplay({
  tableId,
  tableNumber,
  qrCodeData,
  tenantSlug,
  showDownloadButton = true,
  children,
}: QRCodeDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState(false);

  // Generate the URL that the QR code will point to
  const targetUrl = `${process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || "http://localhost:3001"}/${tenantSlug}/table/${tableNumber}?qr=${qrCodeData}`;

  useEffect(() => {
    // Generate QR code as data URL
    QRCode.toDataURL(targetUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
      .then((url) => {
        setQrCodeUrl(url);
      })
      .catch((err) => {
        console.error("Error generating QR code:", err);
      });
  }, [targetUrl]);

  const handleDownload = async () => {
    if (!qrCodeUrl) return;

    setIsDownloading(true);
    try {
      // Generate a higher resolution QR code for download
      const qrCodeDataUrl = await QRCode.toDataURL(targetUrl, {
        width: 800,
        margin: 4,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      // Create a canvas to composite the QR code with the table label
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Canvas dimensions
      const qrSize = 800;
      const padding = 60;
      const headerHeight = 140;
      const totalHeight = qrSize + headerHeight + padding * 2;
      const totalWidth = qrSize + padding * 2;

      canvas.width = totalWidth;
      canvas.height = totalHeight;

      // Fill background with white
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw border
      ctx.strokeStyle = "#D1D5DB";
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

      // Draw table number
      ctx.fillStyle = "#111827";
      ctx.font = "bold 72px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`Table ${tableNumber}`, totalWidth / 2, padding + 60);

      // Draw "Scan to order" text
      ctx.fillStyle = "#6B7280";
      ctx.font = "28px system-ui, -apple-system, sans-serif";
      ctx.fillText("Scan to order", totalWidth / 2, padding + 105);

      // Draw separator line
      ctx.strokeStyle = "#D1D5DB";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding, padding + headerHeight - 15);
      ctx.lineTo(totalWidth - padding, padding + headerHeight - 15);
      ctx.stroke();

      // Load and draw QR code
      const qrImage = new Image();
      qrImage.onload = () => {
        ctx.drawImage(qrImage, padding, padding + headerHeight, qrSize, qrSize);

        // Convert canvas to download link
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `table-${tableNumber}-qr-code.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
          setIsDownloading(false);
        });
      };
      qrImage.src = qrCodeDataUrl;
    } catch (err) {
      console.error("Error downloading QR code:", err);
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* QR Code Image with Table Label */}
      <div className="relative bg-white border-2 border-slate-200 rounded-xl p-4">
        {/* Table Number Header */}
        <div className="text-center mb-3 pb-3 border-b-2 border-slate-200">
          <h3 className="text-2xl font-bold text-navy-500">Table {tableNumber}</h3>
          <p className="text-xs text-slate-500 mt-1">Scan to order</p>
        </div>

        {qrCodeUrl ? (
          <img
            src={qrCodeUrl}
            alt={`QR Code for Table ${tableNumber}`}
            className="w-full h-auto"
          />
        ) : (
          <div className="aspect-square flex items-center justify-center bg-slate-100 rounded">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
              <p className="text-xs text-slate-500 mt-2">Generating...</p>
            </div>
          </div>
        )}
      </div>

      {/* Children slot (e.g., Edit button) */}
      {children}

      {showDownloadButton && (
        <>
          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={!qrCodeUrl || isDownloading}
            className="w-full inline-flex justify-center items-center px-3 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Downloading...
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download QR Code
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
