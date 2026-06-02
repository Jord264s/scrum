// Board.jsx — swimlane board with drag & drop.

function ColumnHeader({ col, totalsByCol }) {
  const total = totalsByCol[col.id] || 0;
  return (
    <div className="col-head">
      <div className="col-head-top">
        <span className="col-name">{col.name}</span>
        <span className="col-count">{total}</span>
      </div>
      <span className="col-hint">{col.hint}</span>
    </div>);

}

// Inline deadline editor. The native date input is layered over the
// label with pointer-events: none, and the label opens the picker
// programmatically. This way the entire chip is one big click target
// — works even when the lane has no tasks at all.
function ProjectDeadlineButton({ project, onPatchProject, overdue }) {
  const inputRef = React.useRef(null);

  const openPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    if (typeof el.showPicker === "function") {
      try { el.showPicker(); } catch (e) { /* showPicker may throw if not user-gesture */ }
    }
  };

  return (
    <span
      className={"lane-deadline" + (overdue ? " is-overdue" : "")}
      title={project.endDate ? "Project deadline · click to change" : "Set project deadline"}
      onClick={openPicker}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPicker(); }
      }}
    >
      <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
        <path d="M2 1.5V8.5M2 1.5H7L6 3L7 4.5H2" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="lane-deadline-label">
        {project.endDate ? `Finish ${formatDateShort(project.endDate)}` : "+ deadline"}
      </span>
      <input
        ref={inputRef}
        className="lane-deadline-input"
        type="date"
        value={project.endDate || ""}
        onChange={(e) => onPatchProject(project.id, { endDate: e.target.value || null })}
        aria-label="Project deadline"
        tabIndex={-1}
      />
    </span>
  );
}

function LaneMenu({ project, onArchive, onDelete }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lane-menu" ref={ref}>
      <button
        className="lane-menu-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="Lane actions"
        aria-haspopup="true"
        aria-expanded={open}
        title="Lane actions"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <circle cx="7" cy="2.5" r="1.3" fill="currentColor" />
          <circle cx="7" cy="7"   r="1.3" fill="currentColor" />
          <circle cx="7" cy="11.5" r="1.3" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div className="lane-menu-pop" role="menu">
          <button
            className="lane-menu-item"
            role="menuitem"
            onClick={() => { setOpen(false); onArchive(project.id); }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
              <rect x="1.5" y="2" width="11" height="3" rx="0.7" fill="none" stroke="currentColor" strokeWidth="1.1"/>
              <path d="M2.6 5.2V11a1 1 0 0 0 1 1h6.8a1 1 0 0 0 1-1V5.2" fill="none" stroke="currentColor" strokeWidth="1.1"/>
              <line x1="5.6" y1="7.7" x2="8.4" y2="7.7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
            Archive lane
          </button>
          <button
            className="lane-menu-item is-danger"
            role="menuitem"
            onClick={() => { setOpen(false); onDelete(project.id); }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M2.5 3.5h9M5 3.5V2.4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.1M3.6 3.5l.5 7.6a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.5-7.6" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Delete lane
          </button>
        </div>
      )}
    </div>
  );
}

function LaneHeader({ project, count, hoursTotal, latestTaskEnd, collapsed, onToggle, onPatchProject, onArchiveProject, onDeleteProject, density }) {
  const deadline = parseISO(project.endDate);
  // "Overdue plan" = a task ends after the project deadline.
  const overdue = deadline && latestTaskEnd && latestTaskEnd > deadline;
  return (
    <div className="lane-head" style={{ "--accent": project.accent, "--tint": project.tint }}>
      <button className="lane-toggle" onClick={onToggle} aria-label={collapsed ? "Expand" : "Collapse"}>
        <svg width="9" height="9" viewBox="0 0 9 9" style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0)" }}>
          <path d="M1.5 3 L4.5 6 L7.5 3" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <span className="lane-dot" />
      <div className="lane-meta">
        <EditableText
          as="span"
          className="lane-name"
          value={project.name}
          onChange={(v) => onPatchProject(project.id, { name: v })}
          title="Double-click to rename project"
        />
        <span className="lane-note">{project.note}</span>
        <ProjectDeadlineButton project={project} onPatchProject={onPatchProject} overdue={overdue} />
      </div>
      <div className="lane-stats">
        <span className="lane-stat"><b>{count}</b> tasks</span>
        {hoursTotal > 0 && <span className="lane-stat"><b>{formatHoursTotal(hoursTotal)}</b> est</span>}
        <span className="lane-code">{project.code}</span>
        <LaneMenu project={project} onArchive={onArchiveProject} onDelete={onDeleteProject} />
      </div>
    </div>);

}

function Cell({ project, col, tasks, taskMap, onAdd, onOpen, dragInfo, onDragStart, onDragEnd, onDropOnCell, dropHint }) {
  const [over, setOver] = React.useState(false);

  return (
    <div
      className={"cell" + (over ? " is-over" : "") + (dropHint ? " is-target" : "")}
      onDragOver={(e) => {
        if (!dragInfo.current) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!over) setOver(true);
      }}
      onDragLeave={(e) => {
        // Only un-highlight when we actually leave the cell, not children.
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onDropOnCell(project.id, col.id);
      }}>
      
      <div className="cell-stack">
        {tasks.map((t) =>
        <Card
          key={t.id}
          task={t}
          project={project}
          taskMap={taskMap}
          onOpen={onOpen}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          dragging={dragInfo.current && dragInfo.current.id === t.id} />

        )}
        <AddCard onAdd={onAdd} projectId={project.id} col={col.id} />
      </div>
    </div>);

}

function Lane({ project, columns, tasksByCol, taskMap, collapsed, onToggle, onAdd, onOpen, onPatchProject, onArchiveProject, onDeleteProject, dragInfo, onDragStart, onDragEnd, onDropOnCell, density }) {
  const count = columns.reduce((a, c) => a + (tasksByCol[c.id]?.length || 0), 0);
  const hoursTotal = columns.reduce(
    (a, c) => a + (tasksByCol[c.id] || []).reduce((s, t) => s + estimateHours(t.estimate), 0),
    0
  );
  // Latest task end across all columns — feeds the "overdue" indicator in the header.
  let latestTaskEnd = null;
  columns.forEach((c) => {
    (tasksByCol[c.id] || []).forEach((t) => {
      const e = taskEnd(t.startDate, t.estimate);
      if (e && (!latestTaskEnd || e > latestTaskEnd)) latestTaskEnd = e;
    });
  });
  const dragging = dragInfo.current;
  return (
    <section
      className={"lane" + (collapsed ? " is-collapsed" : "")}
      style={{ "--accent": project.accent, "--tint": project.tint }}
    >
      <LaneHeader project={project} count={count} hoursTotal={hoursTotal} latestTaskEnd={latestTaskEnd} collapsed={collapsed} onToggle={onToggle} onPatchProject={onPatchProject} onArchiveProject={onArchiveProject} onDeleteProject={onDeleteProject} density={density} />
      {!collapsed &&
      <div className="lane-grid">
          {columns.map((c) =>
        <Cell
          key={c.id}
          project={project}
          col={c}
          tasks={tasksByCol[c.id] || []}
          taskMap={taskMap}
          onAdd={onAdd}
          onOpen={onOpen}
          dragInfo={dragInfo}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDropOnCell={onDropOnCell}
          dropHint={dragging && dragging.project === project.id && dragging.col !== c.id} />

        )}
        </div>
      }
    </section>);

}

function Board({ projects, columns, tasks, collapsed, onToggleLane, onAdd, onOpen, onMove, onPatchProject, onArchiveProject, onDeleteProject }) {
  const dragInfo = React.useRef(null);
  const [, force] = React.useReducer((x) => x + 1, 0);

  const onDragStart = (e, task) => {
    dragInfo.current = { id: task.id, project: task.project, col: task.col };
    e.dataTransfer.effectAllowed = "move";
    try {e.dataTransfer.setData("text/plain", task.id);} catch (err) {}
    // Re-render so the dragged card gets the .is-dragging style.
    requestAnimationFrame(force);
  };
  const onDragEnd = () => {
    dragInfo.current = null;
    force();
  };
  const onDropOnCell = (projectId, colId) => {
    const d = dragInfo.current;
    if (!d) return;
    onMove(d.id, projectId, colId);
    dragInfo.current = null;
    force();
  };

  const totalsByCol = {};
  columns.forEach((c) => {
    totalsByCol[c.id] = tasks.filter((t) => t.col === c.id && projects.some((p) => p.id === t.project)).length;
  });

  // Full task map (used to resolve dependency titles + status even when
  // filtered/searched out of the visible set).
  const taskMap = React.useMemo(() => {
    const m = {};
    tasks.forEach((t) => {m[t.id] = t;});
    return m;
  }, [tasks]);

  // Sort: ready tasks first, then tasks waiting on dependencies. Inside each
  // bucket, keep stable order. This is the "ordering" mechanism — what can
  // happen now floats up, what's gated floats down.
  const sortByReady = (list) => {
    const ready = [];
    const waiting = [];
    list.forEach((t) => {
      const deps = t.dependsOn || [];
      const blocked = deps.some((id) => taskMap[id] && taskMap[id].col !== "done");
      (blocked ? waiting : ready).push(t);
    });
    return [...ready, ...waiting];
  };

  return (
    <div className="board" style={{ "--col-count": columns.length }}>
      <div className="board-head">
        <div className="lane-head-spacer" />
        <div className="col-head-row">
          {columns.map((c) =>
          <ColumnHeader key={c.id} col={c} totalsByCol={totalsByCol} />
          )}
        </div>
      </div>
      <div className="board-body">
        {projects.map((p) => {
          const projectTasks = tasks.filter((t) => t.project === p.id);
          const tasksByCol = {};
          columns.forEach((c) => {
            tasksByCol[c.id] = sortByReady(projectTasks.filter((t) => t.col === c.id));
          });
          return (
            <Lane
              key={p.id}
              project={p}
              columns={columns}
              tasksByCol={tasksByCol}
              taskMap={taskMap}
              collapsed={!!collapsed[p.id]}
              onToggle={() => onToggleLane(p.id)}
              onAdd={onAdd}
              onOpen={onOpen}
              onPatchProject={onPatchProject}
              onArchiveProject={onArchiveProject}
              onDeleteProject={onDeleteProject}
              dragInfo={dragInfo}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDropOnCell={onDropOnCell} />);


        })}
      </div>
    </div>);

}

// Archived lanes live in a collapsible tray below the board.
function ArchivedTray({ projects, tasks, onRestore, onDelete }) {
  const [open, setOpen] = React.useState(false);
  if (!projects || projects.length === 0) return null;

  return (
    <div className={"archived-tray" + (open ? " is-open" : "")}>
      <button className="archived-toggle" onClick={() => setOpen((o) => !o)}>
        <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
          <rect x="1.5" y="2" width="11" height="3" rx="0.7" fill="none" stroke="currentColor" strokeWidth="1.1"/>
          <path d="M2.6 5.2V11a1 1 0 0 0 1 1h6.8a1 1 0 0 0 1-1V5.2" fill="none" stroke="currentColor" strokeWidth="1.1"/>
          <line x1="5.6" y1="7.7" x2="8.4" y2="7.7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
        </svg>
        <span>Archived</span>
        <span className="archived-count">{projects.length}</span>
        <svg className="archived-chev" width="9" height="9" viewBox="0 0 9 9" style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }} aria-hidden="true">
          <path d="M1.5 3 L4.5 6 L7.5 3" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="archived-list">
          {projects.map((p) => {
            const n = tasks.filter((t) => t.project === p.id).length;
            return (
              <div key={p.id} className="archived-item" style={{ "--accent": p.accent }}>
                <span className="archived-dot" />
                <div className="archived-info">
                  <span className="archived-name">{p.name}</span>
                  <span className="archived-meta">{p.code} · {n} task{n === 1 ? "" : "s"}</span>
                </div>
                <div className="archived-actions">
                  <button className="archived-restore" onClick={() => onRestore(p.id)}>Restore</button>
                  <button className="archived-del" onClick={() => onDelete(p.id)} title="Delete permanently" aria-label="Delete permanently">
                    <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
                      <path d="M2.5 3.5h9M5 3.5V2.4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.1M3.6 3.5l.5 7.6a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.5-7.6" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Board, ArchivedTray });