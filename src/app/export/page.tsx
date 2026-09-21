import { Braces, FileSpreadsheet } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ExportPage() {
  const [days, trackers] = await Promise.all([
    prisma.dayLog.count(),
    prisma.tracker.count(),
  ]);

  return (
    <>
      <header className="page-header">
        <span className="eyebrow">Your data stays useful</span>
        <h1>Take it with you.</h1>
        <p className="lede">Download your full history for a spreadsheet, backup, or a future AI analysis you explicitly choose.</p>
      </header>

      <section className="card section-card">
        <h2>{days} daily {days === 1 ? "entry" : "entries"}, {trackers} trackers</h2>
        <p className="fine-print">CSV creates one row per day with a column for every tracker. JSON preserves tracker metadata and is best for backups or another app.</p>
        <div className="export-actions">
          <a className="button primary" href="/api/export/csv" download>
            <FileSpreadsheet size={18} /> Download CSV
          </a>
          <a className="button" href="/api/export/json" download>
            <Braces size={18} /> Download JSON
          </a>
        </div>
      </section>

      <section className="card section-card">
        <h2>A note about interpretation</h2>
        <p className="fine-print">
          Body Budget records associations, not medical causes. Avoid changing medication or treatment based only on a chart or AI summary; bring patterns to a clinician who knows your context.
        </p>
      </section>
    </>
  );
}
