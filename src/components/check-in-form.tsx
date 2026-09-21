"use client";

import type { DayLog, DayValue, Tracker } from "@prisma/client";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { saveBaseline, saveNote, saveTrackerValue } from "@/app/actions";
import { prettyDate, shiftDate } from "@/lib/dates";

type DayWithValues = DayLog & { values: DayValue[] };
type SaveState = "idle" | "saving" | "saved";

export function CheckInForm({
  date,
  today,
  trackers,
  dayLog,
}: {
  date: string;
  today: string;
  trackers: Tracker[];
  dayLog: DayWithValues | null;
}) {
  const initialValues = Object.fromEntries(
    (dayLog?.values ?? []).map((value) => [value.trackerId, value]),
  ) as Record<string, DayValue>;
  const [mood, setMood] = useState<number | null>(dayLog?.mood ?? null);
  const [energy, setEnergy] = useState<number | null>(dayLog?.energy ?? null);
  const [sleepHours, setSleepHours] = useState<number | null>(
    dayLog?.sleepHours ?? null,
  );
  const [note, setNote] = useState(dayLog?.note ?? "");
  const [values, setValues] = useState(initialValues);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [, startTransition] = useTransition();
  const lastSavedNote = useRef(dayLog?.note ?? "");

  useEffect(() => {
    if (note === lastSavedNote.current) return;
    const timer = setTimeout(() => {
      setSaveState("saving");
      startTransition(async () => {
        await saveNote(date, note);
        lastSavedNote.current = note;
        setSaveState("saved");
      });
    }, 650);
    return () => clearTimeout(timer);
  }, [date, note]);

  function persist(
    work: () => Promise<void>,
  ) {
    setSaveState("saving");
    startTransition(async () => {
      await work();
      setSaveState("saved");
    });
  }

  function baseline(
    field: "mood" | "energy" | "sleepHours",
    value: number,
  ) {
    if (field === "mood") setMood(value);
    if (field === "energy") setEnergy(value);
    if (field === "sleepHours") setSleepHours(value);
    persist(() => saveBaseline(date, field, value));
  }

  function trackerValue(
    trackerId: string,
    field: "boolValue" | "numValue" | "severity",
    value: boolean | number | null,
  ) {
    setValues((current) => ({
      ...current,
      [trackerId]: {
        ...current[trackerId],
        trackerId,
        [field]: value,
      } as DayValue,
    }));
    persist(() => saveTrackerValue(date, trackerId, field, value));
  }

  const habits = trackers.filter((tracker) => tracker.kind === "HABIT");
  const symptoms = trackers.filter((tracker) => tracker.kind === "SYMPTOM");
  const canGoForward = date < today;
  const saveLabel =
    saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Not saved yet";

  return (
    <>
      <header className="page-header">
        <span className="eyebrow">{date === today ? "Today’s check-in" : "Past check-in"}</span>
        <h1>{prettyDate(date)}</h1>
        <div className="section-heading">
          <p className="lede">A snapshot, not a score. Partial entries still count. Leave a slider untouched if you don’t want it logged.</p>
          <div className="date-nav">
            <Link className="icon-button" href={`/day/${shiftDate(date, -1)}`} aria-label="Previous day">
              <ChevronLeft size={18} />
            </Link>
            {date !== today && <Link className="button" href="/">Today</Link>}
            {canGoForward ? (
              <Link className="icon-button" href={`/day/${shiftDate(date, 1)}`} aria-label="Next day">
                <ChevronRight size={18} />
              </Link>
            ) : (
              <span className="icon-button" aria-disabled="true">
                <ChevronRight size={18} />
              </span>
            )}
          </div>
        </div>
      </header>

      <section className="card section-card">
        <div className="section-heading">
          <div><h2>How’s the budget?</h2><p>Your basic reserves for the day. Nothing is recorded until you move a slider.</p></div>
          <span className="save-state">{saveLabel}</span>
        </div>
        <div className="baseline-grid">
          <Baseline label="Mood" value={mood} fallback={3} min={1} max={5} onCommit={(value) => baseline("mood", value)} />
          <Baseline label="Energy" value={energy} fallback={3} min={1} max={5} onCommit={(value) => baseline("energy", value)} />
          <Baseline label="Sleep" value={sleepHours} fallback={7} min={0} max={12} step={0.5} suffix="h" onCommit={(value) => baseline("sleepHours", value)} />
        </div>
      </section>

      <TrackerSection title="Inputs" subtitle="Things that might add to—or spend—your capacity." trackers={habits} values={values} onChange={trackerValue} />
      <TrackerSection title="Symptoms" subtitle="What showed up in your body or brain?" trackers={symptoms} values={values} onChange={trackerValue} />

      <section className="card section-card">
        <div className="section-heading">
          <div><h2>A few words</h2><p>Context can be more useful than numbers.</p></div>
          <span className="save-state">{saveLabel}</span>
        </div>
        <textarea
          className="field"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="What happened today? Anything worth remembering?"
          aria-label="Daily note"
        />
      </section>
    </>
  );
}

function Baseline({
  label, value, fallback, min, max, step = 1, suffix = "", onCommit,
}: {
  label: string;
  value: number | null;
  fallback: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(value ?? fallback);

  function commit(next: number) {
    setDraft(next);
    onCommit(next);
  }

  return (
    <div className={`baseline ${value == null ? "unset" : ""}`}>
      <label>
        <span>{label}</span>
        <output>{value == null ? "—" : `${value}${suffix}`}</output>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={draft}
        aria-label={label}
        onChange={(event) => commit(Number(event.target.value))}
        onPointerUp={() => commit(draft)}
        onKeyUp={() => commit(draft)}
      />
    </div>
  );
}

function TrackerSection({
  title, subtitle, trackers, values, onChange,
}: {
  title: string;
  subtitle: string;
  trackers: Tracker[];
  values: Record<string, DayValue>;
  onChange: (id: string, field: "boolValue" | "numValue" | "severity", value: boolean | number | null) => void;
}) {
  return (
    <section className="card section-card">
      <div className="section-heading">
        <div><h2>{title}</h2><p>{subtitle}</p></div>
        <Link href="/trackers" className="button">Edit trackers</Link>
      </div>
      {trackers.length === 0 ? <p className="empty">No active trackers here yet.</p> : (
        <div className="tracker-grid">
          {trackers.map((tracker) => {
            const value = values[tracker.id];
            return (
              <div className="tracker-item" key={tracker.id}>
                <div className="tracker-title"><span>{tracker.emoji || "•"}</span><span>{tracker.name}</span></div>
                {tracker.valueType === "BOOLEAN" && (
                  <div className="check-row">
                    <span>{value?.boolValue ? "Logged" : "Not logged"}</span>
                    <button
                      type="button"
                      className={`toggle ${value?.boolValue ? "on" : ""}`}
                      onClick={() => onChange(tracker.id, "boolValue", !value?.boolValue)}
                      aria-label={`Toggle ${tracker.name}`}
                      aria-pressed={Boolean(value?.boolValue)}
                    />
                  </div>
                )}
                {tracker.valueType === "NUMBER" && (
                  <input
                    className="number-input"
                    type="number"
                    min="0"
                    step="any"
                    value={value?.numValue ?? ""}
                    placeholder={tracker.unit ? `0 ${tracker.unit}` : "0"}
                    aria-label={`${tracker.name} ${tracker.unit ?? "amount"}`}
                    onChange={(event) => {
                      const raw = event.target.value;
                      if (raw === "") {
                        onChange(tracker.id, "numValue", null);
                        return;
                      }
                      const next = Number(raw);
                      if (!Number.isFinite(next) || next < 0) return;
                      onChange(tracker.id, "numValue", next);
                    }}
                  />
                )}
                {tracker.valueType === "SEVERITY" && (
                  <>
                    <div className="severity">
                      {[0, 1, 2, 3].map((level) => (
                        <button type="button" className={value?.severity === level ? "active" : ""} onClick={() => onChange(tracker.id, "severity", level)} key={level}>{level}</button>
                      ))}
                    </div>
                    <div className="severity-labels"><span>none</span><span>rough</span></div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
