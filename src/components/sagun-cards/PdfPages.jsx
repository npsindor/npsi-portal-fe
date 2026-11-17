import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

// Renders a PDF Blob page by page with pdf.js, so the preview is the actual PDF (identical to the download and
// the printout) and works on phones, whose browsers often can't show PDFs inline. pdf.js loads only when used.
export default function PdfPages({ blob, label, maxPages = 60, onPages }) {
  const box = useRef(null);
  const [state, setState] = useState({ loading: true, error: '', pages: 0 });
  useEffect(() => {
    if (!blob) return undefined;
    let cancelled = false;
    let task = null;
    const container = box.current;
    (async () => {
      setState({ loading: true, error: '', pages: 0 });
      try {
        const [pdfjs, worker] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]);
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        task = pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) });
        const pdf = await task.promise;
        if (cancelled) return;
        container.replaceChildren();
        const width = Math.max(280, container.clientWidth);
        const scale = Math.min(window.devicePixelRatio || 1, 2);
        const count = Math.min(pdf.numPages, maxPages);
        for (let number = 1; number <= count; number += 1) {
          const page = await pdf.getPage(number);
          if (cancelled) return;
          const viewport = page.getViewport({ scale: (width / page.getViewport({ scale: 1 }).width) * scale });
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = '100%';
          canvas.className = 'rounded-md bg-white shadow-md ring-1 ring-black/10';
          canvas.setAttribute('role', 'img');
          canvas.setAttribute('aria-label', `${label || 'PDF'} – ${number} / ${pdf.numPages}`);
          container.appendChild(canvas);
          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        }
        if (!cancelled) { setState({ loading: false, error: '', pages: pdf.numPages }); onPages?.(pdf.numPages); }
      } catch (error) {
        if (!cancelled) setState({ loading: false, error: error?.message || 'PDF', pages: 0 });
      }
    })();
    return () => {
      cancelled = true;
      task?.destroy?.();
    };
  }, [blob, label, maxPages, onPages]);
  return (
    <div>
      {state.loading && <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground" role="status"><Loader2 className="h-4 w-4 animate-spin" />…</p>}
      {state.error && <p role="alert" className="py-4 text-sm text-destructive">{state.error}</p>}
      <div ref={box} className="space-y-4" />
      {state.pages > maxPages && <p className="mt-3 text-xs text-muted-foreground">{maxPages} / {state.pages}</p>}
    </div>
  );
}
