// Gantt.jsx — total overview: half-transparent project span + solid task bars.

const DAY_W = 28;          // px per calendar day on the timeline
const ROW_PAD = 18;        // vertical padding inside a project row
const TASK_H = 18;         // each task bar's height
const TASK_GAP = 4;        // vertical gap between stacked task lanes
const LABEL_W = 220;       // left rail width
const COL_STATUS = {
  todo:   "#B5A990",
  doing:  "#C2693F",
  review: "#8B6A2A",
  done:   "#4F7A4A",
};

// Greedy lane assignment so overlapping task bars don't sit on top of each
// other. Returns a list of lane indices, one per task in input order.
function assignLanes(tasks) {
  // Sort by start, but remember original index for the output mapping.
  const ordered = tasks
    .map((t, i) => ({ t, i, start: parseISO(t.startDate) }))
    .filter((x) => x.start)
    .sort((a, b) => a.start - b.start);
  const laneEnd = []; // end Date per lane
  const lanes = new Array(tasks.length).fill(0);
  ordered.forEach(({ t, i, start }) => {
    const end = taskEnd(t.startDate, t.estimate) || addDays(start, 1);
    let lane = laneEnd.findIndex((e) => e <= start);
    if (lane === -1) { lane = laneEnd.length; laneEnd.push(end); }
    else laneEnd[lane] = end;
    lanes[i] = lane;
  });
  return lanes;
}

function GanttHeader({ days }) {
  // Group by month for the top label row.
  const months = [];
  days.forEach((d, i) => {
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    const last = months[months.length - 1];
    if (last && last.key === key) last.count++;
    else months.push({ key, label: `${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`, count: 1, startIdx: i });
  });

  const todayISO = toISO(today());
  return (
    <div className="gantt-head" style={{ width: days.length * DAY_W }}>
      <div className="gantt-months">
        {months.map((m) => (
          <div key={m.key} className="gantt-month" style={{ width: m.count * DAY_W }}>
            <span>{m.label}</span>
          </div>
        ))}
      </div>
      <div className="gantt-days">
        {days.map((d, i) => {
          const iso = toISO(d);
          const isToday = iso === todayISO;
          const isWeekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;
          const isMonStart = d.getUTCDay() === 1;
          return (
            <div
              key={i}
              className={"gantt-day"
                + (isToday ? " is-today" : "")
                + (isWeekend ? " is-weekend" : "")
                + (isMonStart ? " is-week-start" : "")}
              style={{ width: DAY_W }}
            >
              <span>{d.getUTCDate()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GanttRow({ project, tasks, range, onOpenTask }) {
  const start0 = range.start;
  const days = range.days;

  // Project span:
  //   start = earliest task start (so the bar shows what's actually planned)
  //   end   = project.endDate (the deadline the user backplans from)
  // If a task ends past the deadline, the bar still ends at the deadline
  // so the overflow is visually obvious.
  let earliestTaskStart = null;
  tasks.forEach((t) => {
    const s = parseISO(t.startDate);
    if (s && (!earliestTaskStart || s < earliestTaskStart)) earliestTaskStart = s;
  });
  const pEnd = parseISO(project.endDate);
  const pStart = earliestTaskStart || (pEnd ? addDays(pEnd, -14) : start0);
  const showSpan = pEnd && pStart;

  let pStartOff, pWidth;
  if (showSpan) {
    pStartOff = Math.max(0, diffDays(start0, pStart));
    const pEndOff = Math.min(days, diffDays(start0, pEnd));
    pWidth = Math.max(DAY_W * 0.6, (pEndOff - pStartOff) * DAY_W);
  }

  const deadlineOff = pEnd ? diffDays(start0, pEnd) : null;

  const lanes = assignLanes(tasks);
  const laneCount = Math.max(1, ...lanes) + 1;
  const rowH = laneCount * (TASK_H + TASK_GAP) - TASK_GAP + ROW_PAD * 2;

  return (
    <div className="gantt-row" style={{ height: rowH, "--accent": project.accent, "--tint": project.tint }}>
      <div className="gantt-row-bg">
        {showSpan && (
          <div
            className="gantt-project-bar"
            style={{ left: pStartOff * DAY_W, width: pWidth }}
            title={`${project.name} · ${formatDateShort(pStart)} → ${formatDateShort(pEnd)} (deadline)`}
          />
        )}
        {deadlineOff !== null && deadlineOff >= 0 && deadlineOff <= days && (
          <div
            className="gantt-deadline"
            style={{ left: deadlineOff * DAY_W }}
            title={`Deadline ${formatDateLong(pEnd)}`}
          >
            <span className="gantt-deadline-flag">{formatDateShort(pEnd)}</span>
          </div>
        )}
        {tasks.map((t, i) => {
          const tStart = parseISO(t.startDate);
          if (!tStart) return null;
          const tEnd = taskEnd(t.startDate, t.estimate) || addDays(tStart, 1);
          const off = Math.max(0, diffDays(start0, tStart));
          const w = Math.max(DAY_W * 0.55, diffDays(tStart, tEnd) * DAY_W);
          const top = ROW_PAD + lanes[i] * (TASK_H + TASK_GAP);
          const statusColor = COL_STATUS[t.col];
          const overflows = pEnd && tEnd > pEnd;
          return (
            <button
              key={t.id}
              className={"gantt-task"
                + (t.col === "done" ? " is-done" : "")
                + (t.blocked ? " is-blocked" : "")
                + (overflows ? " is-overflow" : "")}
              style={{
                left: off * DAY_W,
                width: w,
                top,
                height: TASK_H,
                background: t.col === "done" ? "transparent" : project.accent,
                borderColor: project.accent,
              }}
              title={`${t.title} · ${formatDateShort(tStart)} → ${formatDateShort(tEnd)} · ${formatEstimate(t.estimate) || "no estimate"}`}
              onClick={() => onOpenTask(t)}
            >
              <span className="gantt-task-status" style={{ background: statusColor }} />
              <span className="gantt-task-label">{t.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GanttOverview({ projects, tasks, onClose, onOpenTask }) {
  // Date range: from earliest task start − 3 days to latest of
  // (project deadline, task end) + 5 days.
  const range = React.useMemo(() => {
    const starts = [];
    const ends = [];
    projects.forEach((p) => {
      const e = parseISO(p.endDate);
      if (e) ends.push(e);
    });
    tasks.forEach((t) => {
      const s = parseISO(t.startDate);
      if (s) starts.push(s);
      const e = taskEnd(t.startDate, t.estimate);
      if (e) ends.push(e);
    });
    const fallback = today();
    const minStart = starts.length ? new Date(Math.min(...starts.map((d) => d.getTime()))) : fallback;
    const maxEnd = ends.length ? new Date(Math.max(...ends.map((d) => d.getTime()))) : addDays(fallback, 14);
    const start = addDays(minStart, -3);
    const end = addDays(maxEnd, 5);
    const days = Math.max(14, diffDays(start, end));
    const dayList = Array.from({ length: days }, (_, i) => addDays(start, i));
    return { start, end, days, dayList };
  }, [projects, tasks]);

  // Today line position
  const todayD = today();
  const todayOff = diffDays(range.start, todayD);
  const showToday = todayOff >= 0 && todayOff <= range.days;

  const scrollRef = React.useRef(null);

  // Auto-scroll to today on mount.
  React.useEffect(() => {
    if (!scrollRef.current || !showToday) return;
    scrollRef.current.scrollLeft = Math.max(0, todayOff * DAY_W - 200);
  }, [showToday, todayOff]);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const tasksByProject = React.useMemo(() => {
    const m = {};
    projects.forEach((p) => { m[p.id] = []; });
    tasks.forEach((t) => { if (m[t.project]) m[t.project].push(t); });
    return m;
  }, [projects, tasks]);

  return (
    <div className="gantt-scrim" onClick={onClose}>
      <div className="gantt-modal" onClick={(e) => e.stopPropagation()}>
        <header className="gantt-modal-head">
          <div>
            <h2>Total overview</h2>
            <p>{projects.length} projects · {tasks.length} tasks · {formatDateLong(range.start)} → {formatDateLong(range.end)}</p>
          </div>
          <div className="gantt-modal-tools">
            <button className="btn btn-ghost" onClick={() => {
              if (scrollRef.current && showToday) {
                scrollRef.current.scrollLeft = Math.max(0, todayOff * DAY_W - 200);
              }
            }}>Today</button>
            <button className="detail-x" onClick={onClose} aria-label="Close">×</button>
          </div>
        </header>

        <div className="gantt-grid">
          <div className="gantt-rail" style={{ width: LABEL_W }}>
            <div className="gantt-rail-head" />
            {projects.map((p) => {
              const ts = tasksByProject[p.id] || [];
              const pEnd = parseISO(p.endDate);
              let earliestStart = null;
              let latestEnd = null;
              ts.forEach((t) => {
                const s = parseISO(t.startDate);
                if (s && (!earliestStart || s < earliestStart)) earliestStart = s;
                const e = taskEnd(t.startDate, t.estimate);
                if (e && (!latestEnd || e > latestEnd)) latestEnd = e;
              });
              const overdue = pEnd && latestEnd && latestEnd > pEnd;
              const lanes = assignLanes(ts);
              const laneCount = Math.max(1, ...lanes) + 1;
              const rowH = laneCount * (TASK_H + TASK_GAP) - TASK_GAP + ROW_PAD * 2;
              return (
                <div key={p.id} className="gantt-rail-row" style={{ height: rowH }}>
                  <div className="gantt-rail-mark" style={{ background: p.accent }} />
                  <div className="gantt-rail-body">
                    <div className="gantt-rail-name">{p.name}</div>
                    <div className="gantt-rail-meta">
                      {earliestStart ? formatDateShort(earliestStart) : "—"}
                      {pEnd && ` → ${formatDateShort(pEnd)}`}
                      {ts.length > 0 && ` · ${ts.length} task${ts.length === 1 ? "" : "s"}`}
                      {overdue && <span className="gantt-rail-warn"> · over</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="gantt-scroll" ref={scrollRef}>
            <GanttHeader days={range.dayList} />
            <div className="gantt-body" style={{ width: range.days * DAY_W }}>
              {/* Weekend column tint (drawn once, behind rows) */}
              <div className="gantt-weekends">
                {range.dayList.map((d, i) => {
                  const we = d.getUTCDay() === 0 || d.getUTCDay() === 6;
                  return we ? (
                    <div key={i} className="gantt-we-col" style={{ left: i * DAY_W, width: DAY_W }} />
                  ) : null;
                })}
              </div>
              {showToday && (
                <div className="gantt-today" style={{ left: todayOff * DAY_W + DAY_W / 2 }} />
              )}
              {projects.map((p) => (
                <GanttRow
                  key={p.id}
                  project={p}
                  tasks={tasksByProject[p.id] || []}
                  range={{ start: range.start, days: range.days }}
                  onOpenTask={onOpenTask}
                />
              ))}
            </div>
          </div>
        </div>

        <footer className="gantt-modal-foot">
          <div className="gantt-legend">
            <span className="legend-item"><span className="legend-swatch is-ghost" /> project span</span>
            <span className="legend-item"><span className="legend-swatch is-solid" /> task</span>
            <span className="legend-item"><span className="legend-flag-mini" /> deadline</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: COL_STATUS.todo }} /> to do</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: COL_STATUS.doing }} /> in progress</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: COL_STATUS.review }} /> review</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: COL_STATUS.done }} /> done</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

Object.assign(window, { GanttOverview });
