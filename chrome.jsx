// Chrome.jsx — top bar, filters, task detail panel.

function TopBar({ title, onChangeTitle, projects, hidden, onToggleProject, search, onSearch, onAddProject, onOpenOverview, sprint }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
        </div>
        <div className="brand-text">
          <EditableText
            as="h1"
            value={title}
            onChange={onChangeTitle}
            title="Double-click to rename board"
          />
          <p>{sprint}</p>
        </div>
      </div>

      <div className="filters">
        <span className="filters-label">Lanes</span>
        <div className="project-pills">
          {projects.map((p) => {
            const off = hidden[p.id];
            return (
              <button
                key={p.id}
                className={"pill" + (off ? " is-off" : "")}
                onClick={() => onToggleProject(p.id)}
                style={{ "--accent": p.accent, "--tint": p.tint }}
                title={off ? "Show lane" : "Hide lane"}
              >
                <span className="pill-dot" />
                <span className="pill-name">{p.name}</span>
              </button>
            );
          })}
          <button className="pill pill-add" onClick={onAddProject} title="Add project">+</button>
        </div>
      </div>

      <div className="topbar-right">
        <button className="overview-btn" onClick={onOpenOverview} title="Open timeline overview">
          <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden="true">
            <rect x="1"   y="2"   width="9" height="2" rx="0.5" fill="currentColor" opacity="0.35"/>
            <rect x="1.5" y="2.4" width="6" height="1.2" rx="0.3" fill="currentColor"/>
            <rect x="1"   y="5.5" width="11" height="2" rx="0.5" fill="currentColor" opacity="0.35"/>
            <rect x="3"   y="5.9" width="7" height="1.2" rx="0.3" fill="currentColor"/>
            <rect x="1"   y="9"   width="7" height="2" rx="0.5" fill="currentColor" opacity="0.35"/>
            <rect x="2"   y="9.4" width="4" height="1.2" rx="0.3" fill="currentColor"/>
          </svg>
          Overview
        </button>
        <div className="search">
          <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden="true">
            <circle cx="5.5" cy="5.5" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="8" y1="8" x2="11.5" y2="11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search tasks…"
          />
          {search && <button className="search-clear" onClick={() => onSearch("")}>×</button>}
        </div>
      </div>
    </header>
  );
}

function StatsBar({ tasks, projects }) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.col === "done").length;
  const doing = tasks.filter((t) => t.col === "doing").length;
  const blocked = tasks.filter((t) => t.blocked).length;
  const hoursLeft = tasks
    .filter((t) => t.col !== "done")
    .reduce((s, t) => s + estimateHours(t.estimate), 0);
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="statsbar">
      <div className="stat">
        <span className="stat-num">{done}<span className="stat-of">/{total}</span></span>
        <span className="stat-lbl">tasks done</span>
      </div>
      <div className="stat">
        <span className="stat-num">{formatHoursTotal(hoursLeft)}</span>
        <span className="stat-lbl">estimated remaining</span>
      </div>
      <div className="stat">
        <span className="stat-num">{doing}</span>
        <span className="stat-lbl">in progress</span>
      </div>
      <div className="stat">
        <span className={"stat-num" + (blocked ? " is-warn" : "")}>{blocked}</span>
        <span className="stat-lbl">blocked</span>
      </div>
      <div className="stat stat-bar">
        <div className="stat-track"><div className="stat-fill" style={{ width: pct + "%" }} /></div>
        <span className="stat-lbl">{pct}% complete · {projects.length} active project{projects.length === 1 ? "" : "s"}</span>
      </div>
    </div>
  );
}

// ── Dependency picker ─────────────────────────────────────────────────────
function DependencyPicker({ task, allTasks, value, onChange }) {
  // Scope candidates to the same project, excluding self.
  const candidates = allTasks.filter((t) => t.project === task.project && t.id !== task.id);
  // Sort: not-done first (more likely to be set as a dep), grouped by column order.
  const colOrder = { todo: 0, doing: 1, review: 2, done: 3 };
  candidates.sort((a, b) => (colOrder[a.col] - colOrder[b.col]));

  const set = new Set(value || []);
  const toggle = (id) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange([...next]);
  };

  const selected = (value || []).map((id) => allTasks.find((t) => t.id === id)).filter(Boolean);

  return (
    <div className="dep-picker">
      {selected.length > 0 && (
        <div className="dep-chips">
          {selected.map((t) => {
            const ready = t.col === "done";
            return (
              <span key={t.id} className={"dep-chip" + (ready ? " is-ready" : "")}>
                <span className="dep-chip-status" data-status={t.col} />
                <span className="dep-chip-title">{t.title}</span>
                <button
                  type="button"
                  className="dep-chip-x"
                  onClick={() => toggle(t.id)}
                  aria-label={`Remove dependency ${t.title}`}
                >×</button>
              </span>
            );
          })}
        </div>
      )}
      {candidates.length === 0 ? (
        <div className="dep-empty">No other tasks in this project yet.</div>
      ) : (
        <div className="dep-list">
          {candidates.map((t) => (
            <label key={t.id} className="dep-row">
              <input
                type="checkbox"
                checked={set.has(t.id)}
                onChange={() => toggle(t.id)}
              />
              <span className="dep-status" data-status={t.col} />
              <span className="dep-title">{t.title}</span>
              <span className="dep-col">{COLUMNS.find(c => c.id === t.col)?.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskDetail({ task, project, allTasks, onClose, onPatch, onDelete }) {
  const [title, setTitle] = React.useState(task.title);
  const [status, setStatus] = React.useState(task.col);
  const init = normalizeEstimate(task.estimate);
  const [estValue, setEstValue] = React.useState(init.value || 0);
  const [estUnit, setEstUnit] = React.useState(init.unit || "h");
  const [startDate, setStartDate] = React.useState(task.startDate || "");
  const [blocked, setBlocked] = React.useState(!!task.blocked);
  const [blocker, setBlocker] = React.useState(task.blocker || "");
  const [notes, setNotes] = React.useState(task.notes || "");
  const [dependsOn, setDependsOn] = React.useState(task.dependsOn || []);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = () => {
    onPatch(task.id, {
      title: title.trim() || task.title,
      col: status,
      estimate: { value: Number(estValue) || 0, unit: estUnit },
      startDate: startDate || null,
      blocked,
      blocker: blocked ? blocker : "",
      notes,
      dependsOn,
    });
    onClose();
  };

  // End date is computed live so the user sees what the estimate produces.
  const computedEnd = React.useMemo(() => {
    return taskEnd(startDate, { value: Number(estValue) || 0, unit: estUnit });
  }, [startDate, estValue, estUnit]);

  const projEnd = parseISO(project.endDate);
  const endsAfterDeadline = projEnd && computedEnd && computedEnd > projEnd;

  return (
    <div className="detail-scrim" onClick={onClose}>
      <div className="detail" onClick={(e) => e.stopPropagation()} style={{ "--accent": project.accent, "--tint": project.tint }}>
        <header className="detail-head">
          <div className="detail-tag">
            <span className="detail-dot" />
            {project.name} · {project.code}-{task.id.replace(/\D/g, "")}
          </div>
          <button className="detail-x" onClick={onClose} aria-label="Close">×</button>
        </header>

        <input
          className="detail-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
        />

        <div className="detail-grid">
          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="field field-estimate">
            <span>Estimate</span>
            <div className="estimate-input">
              <input
                type="number"
                min="0"
                step="0.5"
                value={estValue}
                onChange={(e) => setEstValue(e.target.value)}
              />
              <select value={estUnit} onChange={(e) => setEstUnit(e.target.value)}>
                <option value="h">hours</option>
                <option value="d">days</option>
                <option value="w">weeks</option>
              </select>
            </div>
          </label>
          <label className="field">
            <span>Start date</span>
            <input
              type="date"
              value={startDate}
              max={project.endDate || undefined}
              onChange={(e) => setStartDate(e.target.value)}
            />
            {endsAfterDeadline ? (
              <span className="field-warn">
                Ends {formatDateShort(computedEnd)} — after deadline {formatDateShort(projEnd)}
              </span>
            ) : computedEnd ? (
              <span className="field-info">
                Ends {formatDateShort(computedEnd)}
              </span>
            ) : null}
          </label>
        </div>

        <div className="field field-block">
          <div className="field-label-row">
            <span>Depends on</span>
            <span className="field-hint">Tasks that must finish first</span>
          </div>
          <DependencyPicker
            task={task}
            allTasks={allTasks}
            value={dependsOn}
            onChange={setDependsOn}
          />
        </div>

        <label className="field field-block">
          <span>Notes</span>
          <textarea
            rows="3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Decisions, links, context…"
          />
        </label>

        <div className="detail-blocker">
          <label className="blocker-toggle">
            <input type="checkbox" checked={blocked} onChange={(e) => setBlocked(e.target.checked)} />
            <span>Blocked</span>
          </label>
          {blocked && (
            <input
              className="blocker-input"
              type="text"
              value={blocker}
              onChange={(e) => setBlocker(e.target.value)}
              placeholder="What's blocking this?"
            />
          )}
        </div>

        <footer className="detail-foot">
          <button className="btn btn-danger" onClick={() => { if (confirm("Delete this task?")) { onDelete(task.id); onClose(); } }}>Delete</button>
          <div className="detail-foot-right">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Save</button>
          </div>
        </footer>
      </div>
    </div>
  );
}

Object.assign(window, { TopBar, StatsBar, TaskDetail });
