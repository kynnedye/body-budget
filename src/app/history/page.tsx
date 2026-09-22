import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { openDay } from "@/app/actions";
import { getHistoryDays } from "@/lib/data";
import { dateKey, prettyDate, todayKey } from "@/lib/dates";

export const dynamic = "force-dynamic";

function notePreview(note: string) {
  const trimmed = note.trim();
  if (!trimmed) return null;
  return trimmed.length > 180 ? `${trimmed.slice(0, 177).trimEnd()}…` : trimmed;
}

export default async function HistoryPage() {
  const logs = await getHistoryDays();
  const today = todayKey();

  return (
    <>
      <header className="page-header">
        <span className="eyebrow">Look back</span>
        <h1>What you already wrote down.</h1>
        <p className="lede">
          Open any logged day to reread the note and numbers, or jump to a date that isn’t in the list yet.
        </p>
      </header>

      <section className="card section-card">
        <div className="section-heading">
          <div>
            <h2>Jump to a date</h2>
            <p>Useful for a day you remember, or one you still want to fill in.</p>
          </div>
        </div>
        <form className="jump-form" action={openDay}>
          <label>
            Date
            <input className="field" type="date" name="date" defaultValue={today} max={today} required />
          </label>
          <button className="button" type="submit">Open day</button>
        </form>
      </section>

      <section className="card section-card">
        <div className="section-heading">
          <div>
            <h2>Logged days</h2>
            <p>
              {logs.length
                ? `${logs.length} ${logs.length === 1 ? "day has" : "days have"} something recorded.`
                : "Nothing is recorded yet."}
            </p>
          </div>
        </div>
        {logs.length === 0 ? (
          <p className="empty">When you log a day, it will show up here with its note.</p>
        ) : (
          <div className="history-list">
            {logs.map((log) => {
              const key = dateKey(log.date);
              const preview = notePreview(log.note);
              const bits = [
                log.mood != null ? `Mood ${log.mood}` : null,
                log.energy != null ? `Energy ${log.energy}` : null,
                log.sleepHours != null ? `Sleep ${log.sleepHours}h` : null,
                log.values.length
                  ? `${log.values.length} ${log.values.length === 1 ? "tracker" : "trackers"}`
                  : null,
              ].filter(Boolean);
              return (
                <Link className="history-row" href={`/day/${key}`} key={log.id}>
                  <div>
                    <h3>
                      {prettyDate(key)}
                      {key === today ? <span className="history-today">Today</span> : null}
                    </h3>
                    {bits.length ? <p>{bits.join(" · ")}</p> : null}
                    <p className={preview ? "history-note" : "history-note muted"}>
                      {preview ?? "No note written"}
                    </p>
                  </div>
                  <ChevronRight size={18} aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
