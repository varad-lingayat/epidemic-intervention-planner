import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type DownloadScenarioPdfProps = {
  targetId: string;
  fileName: string;
  disabled?: boolean;
};

export function DownloadScenarioPdf({ targetId, fileName, disabled }: DownloadScenarioPdfProps) {
  const [isExporting, setIsExporting] = useState(false);

  const download = async () => {
    const target = document.getElementById(targetId);
    if (!target) {
      toast.error("The report is not ready to export yet. Please wait for it to finish loading and try again.");
      return;
    }

    setIsExporting(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(target, {
        backgroundColor: "#ffffff",
        scale: 1.6,
        useCORS: true,
        logging: false,
      });
      const image = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageHeight = (canvas.height * pageWidth) / canvas.width;
      let remainingHeight = imageHeight;
      let offset = 0;

      pdf.addImage(image, "PNG", 0, offset, pageWidth, imageHeight, undefined, "FAST");
      remainingHeight -= pageHeight;
      while (remainingHeight > 0) {
        offset = remainingHeight - imageHeight;
        pdf.addPage();
        pdf.addImage(image, "PNG", 0, offset, pageWidth, imageHeight, undefined, "FAST");
        remainingHeight -= pageHeight;
      }
      pdf.save(`${fileName.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()}.pdf`);
    } catch (error) {
      console.error("Scenario PDF export failed", error);
      toast.error("The PDF could not be created. Please try again after the report has finished loading.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button variant="outline" onClick={download} disabled={disabled || isExporting} className="rounded-xl">
      {isExporting ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <FileDown className="mr-2 h-3.5 w-3.5" />}
      {isExporting ? "Preparing PDF…" : "Download PDF"}
    </Button>
  );
}
