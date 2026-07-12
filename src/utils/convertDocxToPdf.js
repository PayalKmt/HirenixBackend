import mammoth from "mammoth";
import PDFDocument from "pdfkit";

const stripHtml = (html) => html.replace(/<[^>]+>/g, "");

const convertDocxToPdf = async (buffer) => {
  const { value: html } = await mammoth.convertToHtml({ buffer });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const blockPattern = /<(h[1-6]|p|li)>([\s\S]*?)<\/\1>/g;
    let match;
    let hasContent = false;

    while ((match = blockPattern.exec(html)) !== null) {
      const tag = match[1];
      const text = stripHtml(match[2]).trim();
      if (!text) continue;

      hasContent = true;

      if (tag === "h1") {
        doc.moveDown(0.5).fontSize(18).font("Helvetica-Bold").text(text);
      } else if (tag === "h2") {
        doc.moveDown(0.4).fontSize(14).font("Helvetica-Bold").text(text);
      } else if (tag === "h3" || tag === "h4" || tag === "h5" || tag === "h6") {
        doc.moveDown(0.3).fontSize(12).font("Helvetica-Bold").text(text);
      } else if (tag === "li") {
        doc.fontSize(11).font("Helvetica").text(`• ${text}`, { indent: 20 });
      } else {
        doc.fontSize(11).font("Helvetica").text(text, { lineGap: 2 });
      }
    }

    if (!hasContent) {
      doc.fontSize(11).font("Helvetica").text(stripHtml(html).trim());
    }

    doc.end();
  });
};

export { convertDocxToPdf };
