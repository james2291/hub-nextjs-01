// Referee Stats (prototype Ref-Stats): DEMO DATA except the match count, which is from the feeds.
// Compared with another referee from the demo data.
import { PageBody } from "@/components/oval/app-shell";
import { DataNote, KpiStrip, Section } from "@/components/oval/primitives";
import { getReferee as getDemoReferee, referees as demoReferees, type Referee } from "@/data/hub";
import { getReferee } from "@/server/feeds";

function surname(name: string) {
  return name.split(" ").at(-1) ?? name;
}

function Legend({ a, b }: { a: string; b: string }) {
  return (
    <span className="flex items-center gap-3 text-xs text-ink">
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-[2px] bg-ink" />
        {a}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-[2px] bg-[#D4D4CE]" />
        {b}
      </span>
    </span>
  );
}

function PairedBar({ a, b }: { a: number; b: number }) {
  return (
    <span className="flex flex-col gap-1">
      <span className="block h-2 bg-subtle">
        <span className="block h-full bg-ink" style={{ width: `${Math.min(100, a)}%` }} />
      </span>
      <span className="block h-2 bg-subtle">
        <span className="block h-full bg-[#D4D4CE]" style={{ width: `${Math.min(100, b)}%` }} />
      </span>
    </span>
  );
}

export function RefereeStats({ slug }: { slug: string }) {
  const referee = getReferee(slug);
  if (!referee) return null;
  const demo = getDemoReferee(slug);
  const other: Referee | undefined =
    demoReferees.find((item) => item.id === "luke-pearce" && item.id !== slug) ??
    demoReferees.find((item) => item.id !== slug);
  if (!demo || !other) {
    return (
      <PageBody>
        <DataNote>
          {referee.name} refereed {referee.matches} matches in 2025/26. Penalty, card and set-piece
          figures need the officiating feed.
        </DataNote>
      </PageBody>
    );
  }
  const me = surname(demo.name);
  const them = surname(other.name);
  const stat = (r: Referee, label: string) =>
    r.stats.find((item) => item.label === label)?.value ?? "–";
  const share = (r: Referee, label: string) =>
    r.penaltyBreakdown.find((item) => item.label === label)?.value ?? 0;
  const set = (r: Referee, label: string) =>
    r.setPiece.find((item) => item.label === label)?.progress ?? 0;

  return (
    <PageBody>
      <DataNote label="DEMO DATA">
        Penalty and card numbers are demo data. Match count is from the 2025/26 feeds.
      </DataNote>
      <KpiStrip
        items={[
          { label: "Matches", value: referee.matches, detail: "2025/26 season" },
          { label: "Penalties", value: stat(demo, "Penalties"), detail: "Average per match" },
          { label: "Yellow cards", value: stat(demo, "Yellow cards"), detail: "Average per match" },
          { label: "Red cards", value: stat(demo, "Red cards"), detail: "This season" },
        ]}
      />
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Section title="Penalty breakdown" meta={<Legend a={me} b={them} />}>
          <div className="px-4 pb-4">
            <p className="mb-2 mt-2 text-xs text-mute">Share of penalties awarded</p>
            {demo.penaltyBreakdown.map((item) => (
              <div
                key={item.label}
                className="grid h-10 grid-cols-[100px_minmax(0,1fr)_90px] items-center gap-3"
              >
                <span>{item.label}</span>
                <PairedBar a={item.value} b={share(other, item.label)} />
                <span className="text-right">
                  <span className="text-[15px] font-semibold tabular-nums">{item.value}%</span>{" "}
                  <span className="text-xs text-mute">v {share(other, item.label)}%</span>
                </span>
              </div>
            ))}
          </div>
        </Section>
        <Section title="Set piece & advantage" meta={<Legend a={me} b={them} />}>
          <div className="flex flex-col gap-4 px-4 py-3">
            {demo.setPiece.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex justify-between">
                  <span>{item.label}</span>
                  <span>
                    <span className="text-[15px] font-semibold tabular-nums">{item.value}</span>{" "}
                    <span className="text-xs text-mute">v {set(other, item.label)}%</span>
                  </span>
                </div>
                <PairedBar a={item.progress} b={set(other, item.label)} />
              </div>
            ))}
          </div>
        </Section>
      </div>
      <Section title="Discipline" meta="Season averages">
        <div className="px-4 pb-2">
          <div
            role="row"
            className="grid h-[30px] grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2.5 border-b border-line2 text-[11px] font-medium text-mute"
          >
            <span />
            <span>{me}</span>
            <span>{them}</span>
          </div>
          {[
            ["Penalties per match", "Penalties"],
            ["Yellow cards per match", "Yellow cards"],
            ["Red cards this season", "Red cards"],
          ].map(([label, key]) => (
            <div
              key={label}
              className="grid h-[33px] grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2.5 border-b border-line2 last:border-b-0"
            >
              <span>{label}</span>
              <span className="font-semibold tabular-nums">{stat(demo, key ?? "")}</span>
              <span className="font-semibold tabular-nums">{stat(other, key ?? "")}</span>
            </div>
          ))}
        </div>
      </Section>
    </PageBody>
  );
}
