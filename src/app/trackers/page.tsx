import { Archive, RotateCcw } from "lucide-react";
import { toggleTracker } from "@/app/actions";
import { AddTrackerForm } from "@/components/add-tracker-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TrackersPage() {
  const trackers = await prisma.tracker.findMany({
    orderBy: [{ kind: "asc" }, { isActive: "desc" }, { sortOrder: "asc" }],
  });

  return (
    <>
      <header className="page-header">
        <span className="eyebrow">Make it yours</span>
        <h1>What do you want to notice?</h1>
        <p className="lede">Track only what feels useful. Archive anything that becomes noise—its history will stay intact.</p>
      </header>

      <section className="card section-card">
        <div className="section-heading">
          <div><h2>Add a tracker</h2><p>Symptoms always use a 0–3 severity scale.</p></div>
        </div>
        <AddTrackerForm />
      </section>

      {(["HABIT", "SYMPTOM"] as const).map((kind) => (
        <section className="card section-card" key={kind}>
          <div className="section-heading">
            <div>
              <h2>{kind === "HABIT" ? "Inputs & habits" : "Symptoms"}</h2>
              <p>{kind === "HABIT" ? "Things you did, took, or encountered." : "Signals from your body and brain."}</p>
            </div>
          </div>
          <div className="tracker-list">
            {trackers.filter((tracker) => tracker.kind === kind).map((tracker) => (
              <div className={`tracker-row ${tracker.isActive ? "" : "archived"}`} key={tracker.id}>
                <div>
                  <h3>{tracker.emoji || "•"} {tracker.name}</h3>
                  <p>{tracker.valueType === "NUMBER" ? `Amount${tracker.unit ? ` in ${tracker.unit}` : ""}` : tracker.valueType === "SEVERITY" ? "Severity from 0–3" : "Yes or no"}</p>
                </div>
                <form action={toggleTracker.bind(null, tracker.id, !tracker.isActive)}>
                  <button className="button" type="submit">
                    {tracker.isActive ? <Archive size={16} /> : <RotateCcw size={16} />}
                    {tracker.isActive ? "Archive" : "Restore"}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
