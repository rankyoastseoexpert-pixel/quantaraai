import { toast } from "@/hooks/use-toast";

/**
 * Capture a container's SVG (recharts) or canvas content as a JPG/PNG image download.
 */
export function exportContainerAsImage(
  containerSelector: string,
  format: "png" | "jpeg" = "jpeg",
  filename = "export"
) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    toast({ title: "Nothing to export", description: "No graph or result to capture." });
    return;
  }

  const svg = container.querySelector("svg");
  const canvas = container.querySelector("canvas") as HTMLCanvasElement | null;

  if (svg) {
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const svgData = new XMLSerializer().serializeToString(clone);
    const cvs = document.createElement("canvas");
    const rect = svg.getBoundingClientRect();
    const scale = 2;
    cvs.width = rect.width * scale;
    cvs.height = rect.height * scale;
    const ctx = cvs.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#0a0e1a";
      ctx.fillRect(0, 0, cvs.width, cvs.height);
      ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
      const a = document.createElement("a");
      a.href = cvs.toDataURL(`image/${format}`, 0.95);
      a.download = `${filename}.${format === "jpeg" ? "jpg" : "png"}`;
      a.click();
      toast({ title: `Exported ${format.toUpperCase()}` });
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  } else if (canvas) {
    const a = document.createElement("a");
    a.href = canvas.toDataURL(`image/${format}`, 0.95);
    a.download = `${filename}.${format === "jpeg" ? "jpg" : "png"}`;
    a.click();
    toast({ title: `Exported ${format.toUpperCase()}` });
  } else {
    toast({ title: "No graph found", description: "Generate a graph first to export." });
  }
}
