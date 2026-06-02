// Card.jsx — single task card and the add-card form.

function StartChip({ startDate, estimate, projectEnd }) {
  if (!startDate) return null;
  const end = taskEnd(startDate, estimate);
  const projEnd = parseISO(projectEnd);
  const overdue = projEnd && end && end > projEnd;
  return (
    <span
      className={"card-due" + (overdue ? " is-warn" : "")}
      title={overdue
        ? `Ends ${formatDateShort(end)} — after project deadline ${formatDateShort(projEnd)}`
        : `Starts ${formatDateLong(startDate)}`}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        <rect x="1" y="2" width="8" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="0.9"/>
        <line x1="1" y1="4" x2="9" y2="4" stroke="currentColor" strokeWidth="0.9"/>
      </svg>
      {formatDateShort(startDate)}
    </span>
  );
}

function EstimateChip({ estimate }) {
  const label = formatEstimate(estimate);
  if (!label) return null;
  return (
    <span className="card-est" title={`Estimate: ${label}`}>
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        <circle cx="5" cy="5.2" r="3.6" fill="none" stroke="currentColor" strokeWidth="0.9"/>
        <path d="M5 3 L5 5.2 L6.6 6.2" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
      </svg>
      {label}
    </span>
  );
}

function DependencyChip({ deps, unresolved }) {
  if (!deps || deps.length === 0) return null;
  const total = deps.length;
  const left = unresolved.length;
  const ready = left === 0;
  return (
    <span className={"card-deps" + (ready ? " is-ready" : "")} title={ready ? "All dependencies done" : `Waiting on ${left} of ${total}`}>
      <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">
        <path d="M3.4 6.6L1.8 8.2a1.7 1.7 0 0 1-2.4-2.4L1 4.2M7.6 4.4L9.2 2.8a1.7 1.7 0 0 1 2.4 2.4L10 6.8M3.6 7.4L7.4 3.6" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" transform="translate(0,0.3)"/>
      </svg>
      {ready ? "ready" : `${left}/${total}`}
    </span>
  );
}

function Card({ task, project, taskMap, onOpen, onDragStart, onDragEnd, dragging }) {
  const deps = task.dependsOn || [];
  const unresolved = deps.filter((id) => {
    const dep = taskMap[id];
    return dep && dep.col !== "done";
  });
  const waiting = unresolved.length > 0;

  return (
    <article
      className={
        "card" +
        (dragging ? " is-dragging" : "") +
        (task.blocked ? " is-blocked" : "") +
        (waiting ? " is-waiting" : "")
      }
      draggable="true"
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(task)}
      style={{ "--accent": project.accent }}
    >
      <header className="card-head">
        <span className="card-code">{project.code}-{task.id.replace(/\D/g, "")}</span>
        <div className="card-head-right">
          <EstimateChip estimate={task.estimate} />
        </div>
      </header>
      <h4 className="card-title">{task.title}</h4>
      {task.blocked && (
        <div className="card-blocked">
          <span className="dot" />{task.blocker || "Blocked"}
        </div>
      )}
      {waiting && (
        <div className="card-waiting">
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <rect x="2.5" y="4.5" width="5" height="4" rx="0.5" fill="none" stroke="currentColor" strokeWidth="0.9"/>
            <path d="M3.7 4.5V3.2a1.3 1.3 0 0 1 2.6 0v1.3" fill="none" stroke="currentColor" strokeWidth="0.9"/>
          </svg>
          After {unresolved.map((id) => taskMap[id]?.title || id).slice(0, 1).join(", ")}
          {unresolved.length > 1 && ` + ${unresolved.length - 1} more`}
        </div>
      )}
      <footer className="card-foot">
        <div className="card-tags">
          {(task.tags || []).map(t => <span key={t} className="card-tag">{t}</span>)}
          <DependencyChip deps={deps} unresolved={unresolved} />
        </div>
        <div className="card-meta">
          <StartChip startDate={task.startDate} estimate={task.estimate} projectEnd={project.endDate} />
          {task.assignee === "me" && (
            <span className="card-me" title="Assigned to me">me</span>
          )}
        </div>
      </footer>
    </article>
  );
}

function AddCard({ onAdd, projectId, col }) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const submit = () => {
    const v = text.trim();
    if (v) onAdd({ project: projectId, col, title: v });
    setText("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button className="add-card" onClick={() => setOpen(true)} aria-label="Add task">
        <span>+</span> Add task
      </button>
    );
  }
  return (
    <div className="add-card-form">
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
          if (e.key === "Escape") { setText(""); setOpen(false); }
        }}
        placeholder="What needs doing?"
        rows="2"
      />
      <div className="add-card-actions">
        <button className="btn btn-primary" onClick={submit}>Add</button>
        <button className="btn btn-ghost" onClick={() => { setText(""); setOpen(false); }}>Cancel</button>
      </div>
    </div>
  );
}

Object.assign(window, { Card, AddCard });
