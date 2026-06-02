// App.jsx — root + state.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "regular",
  "accent": "warm",
  "showStats": true,
  "cardStyle": "lined"
}/*EDITMODE-END*/;

const ACCENT_THEMES = {
  warm:    { bg: "#FAF7F1", panel: "#FFFFFF", ink: "#231F18", muted: "#7A7062", line: "#E9E2D4", soft: "#F3EDDF" },
  paper:   { bg: "#F4F2EC", panel: "#FAF9F5", ink: "#1F1D18", muted: "#736E62", line: "#E3DED0", soft: "#EDE9DC" },
  cool:    { bg: "#F4F6F8", panel: "#FFFFFF", ink: "#1D2530", muted: "#6B7585", line: "#DCE3EA", soft: "#E6ECF2" },
  graphite:{ bg: "#181818", panel: "#222220", ink: "#F2EFE8", muted: "#9C968A", line: "#33312D", soft: "#2A2825" },
};

// Persist key bumped because the task shape changed (real `startDate` ISO
// dates replaced the freeform `due` string; estimate is now an object).
const STORE_KEY = "scrum.board.v2";

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : SEED_TASKS,
        extraProjects: Array.isArray(parsed.extraProjects) ? parsed.extraProjects : [],
        builtinPatches: parsed.builtinPatches || {},
        boardTitle: typeof parsed.boardTitle === "string" ? parsed.boardTitle : "Personal sprint board",
        archived: parsed.archived || {},
        deletedBuiltins: Array.isArray(parsed.deletedBuiltins) ? parsed.deletedBuiltins : [],
      };
    }
  } catch (e) {}
  return {
    tasks: SEED_TASKS, extraProjects: [], builtinPatches: {},
    boardTitle: "Personal sprint board", archived: {}, deletedBuiltins: [],
  };
}

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const initial = React.useMemo(loadStore, []);
  const [tasks, setTasks] = React.useState(initial.tasks);
  const [extraProjects, setExtraProjects] = React.useState(initial.extraProjects);
  // Built-in projects are immutable defaults; user edits live as a patch
  // overlay so a Reset cleanly drops them.
  const [builtinPatches, setBuiltinPatches] = React.useState(initial.builtinPatches);
  const [boardTitle, setBoardTitle] = React.useState(initial.boardTitle);
  // Archived = recoverable (tucked into a tray); deletedBuiltins = tombstones
  // for the seed projects (extra projects are just dropped from the array).
  const [archived, setArchived] = React.useState(initial.archived);
  const [deletedBuiltins, setDeletedBuiltins] = React.useState(initial.deletedBuiltins);
  const [hidden, setHidden] = React.useState({});
  const [collapsed, setCollapsed] = React.useState({});
  const [search, setSearch] = React.useState("");
  const [openTaskId, setOpenTaskId] = React.useState(null);
  const [showOverview, setShowOverview] = React.useState(false);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        tasks, extraProjects, builtinPatches, boardTitle, archived, deletedBuiltins,
      }));
    } catch (e) {}
  }, [tasks, extraProjects, builtinPatches, boardTitle, archived, deletedBuiltins]);

  const allProjects = React.useMemo(() => {
    const patched = PROJECTS
      .filter((p) => !deletedBuiltins.includes(p.id))
      .map((p) => ({ ...p, ...(builtinPatches[p.id] || {}) }));
    return [...patched, ...extraProjects];
  }, [extraProjects, builtinPatches, deletedBuiltins]);

  // Lanes the user can hide via the topbar pills, minus archived ones.
  const visibleProjects = allProjects.filter((p) => !hidden[p.id]);
  const boardProjects = visibleProjects.filter((p) => !archived[p.id]);
  const archivedProjects = allProjects.filter((p) => archived[p.id]);

  // Search trims tasks; lanes still render so structure stays stable.
  const filteredTasks = React.useMemo(() => {
    if (!search.trim()) return tasks;
    const q = search.toLowerCase();
    return tasks.filter((t) =>
      t.title.toLowerCase().includes(q) ||
      (t.tags || []).some((tag) => tag.toLowerCase().includes(q))
    );
  }, [tasks, search]);

  const toggleProject = (id) => setHidden((h) => ({ ...h, [id]: !h[id] }));
  const toggleLane = (id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  const addTask = ({ project, col, title }) => {
    const id = "t" + Math.random().toString(36).slice(2, 7);
    // New tasks default to today; the user picks a real start in the detail panel.
    setTasks((ts) => [...ts, {
      id, project, col, title,
      estimate: { value: 0, unit: "h" },
      startDate: toISO(today()),
      tags: [],
      dependsOn: [],
    }]);
  };
  const moveTask = (id, project, col) => {
    setTasks((ts) => ts.map((t) => t.id === id ? { ...t, project, col } : t));
  };
  const patchTask = (id, patch) => {
    setTasks((ts) => ts.map((t) => t.id === id ? { ...t, ...patch } : t));
  };
  const deleteTask = (id) => {
    setTasks((ts) => ts.filter((t) => t.id !== id));
  };

  const patchProject = (id, patch) => {
    const isBuiltin = PROJECTS.some((p) => p.id === id);
    if (isBuiltin) {
      setBuiltinPatches((bp) => ({ ...bp, [id]: { ...(bp[id] || {}), ...patch } }));
    } else {
      setExtraProjects((eps) => eps.map((p) => p.id === id ? { ...p, ...patch } : p));
    }
  };

  const archiveProject = (id) => setArchived((a) => ({ ...a, [id]: true }));
  const unarchiveProject = (id) => setArchived((a) => {
    const next = { ...a };
    delete next[id];
    return next;
  });

  const deleteProject = (id) => {
    const proj = allProjects.find((p) => p.id === id);
    const taskCount = tasks.filter((t) => t.project === id).length;
    const msg = taskCount > 0
      ? `Delete “${proj?.name}” and its ${taskCount} task${taskCount === 1 ? "" : "s"}? This can't be undone.`
      : `Delete “${proj?.name}”? This can't be undone.`;
    if (!confirm(msg)) return;
    // Drop the lane's tasks.
    setTasks((ts) => ts.filter((t) => t.project !== id));
    // Clear any archive flag.
    setArchived((a) => { const n = { ...a }; delete n[id]; return n; });
    // Remove the project itself.
    const isBuiltin = PROJECTS.some((p) => p.id === id);
    if (isBuiltin) {
      setDeletedBuiltins((d) => d.includes(id) ? d : [...d, id]);
      setBuiltinPatches((bp) => { const n = { ...bp }; delete n[id]; return n; });
    } else {
      setExtraProjects((eps) => eps.filter((p) => p.id !== id));
    }
  };

  const addProject = () => {
    const palettes = [
      { accent: "#6E5BA5", tint: "#EFEBF6" },
      { accent: "#3D7F7A", tint: "#E7F1F0" },
      { accent: "#A14B5C", tint: "#F6EAEC" },
      { accent: "#5C7034", tint: "#EEF1E5" },
    ];
    const name = prompt("Project name?");
    if (!name || !name.trim()) return;
    const code = (prompt("Short code (e.g. WORK)") || name.slice(0, 4)).toUpperCase().slice(0, 5);
    const palette = palettes[extraProjects.length % palettes.length];
    setExtraProjects((p) => [...p, {
      id: "p" + Math.random().toString(36).slice(2, 7),
      name: name.trim(),
      code,
      accent: palette.accent,
      tint: palette.tint,
      note: "New project",
      endDate: toISO(addDays(today(), 30)),
    }]);
  };

  const resetBoard = () => {
    if (!confirm("Reset board to sample data?")) return;
    setTasks(SEED_TASKS);
    setExtraProjects([]);
    setBuiltinPatches({});
    setBoardTitle("Personal sprint board");
    setArchived({});
    setDeletedBuiltins([]);
    setHidden({});
    setCollapsed({});
  };

  const openTask = openTaskId ? tasks.find((t) => t.id === openTaskId) : null;
  const openProject = openTask ? allProjects.find((p) => p.id === openTask.project) : null;

  const theme = ACCENT_THEMES[tweaks.accent] || ACCENT_THEMES.warm;
  const isDark = tweaks.accent === "graphite";

  const cssVars = {
    "--bg": theme.bg,
    "--panel": theme.panel,
    "--ink": theme.ink,
    "--muted": theme.muted,
    "--line": theme.line,
    "--soft": theme.soft,
    "--density": tweaks.density === "compact" ? "0.85" : tweaks.density === "comfy" ? "1.15" : "1",
    "--card-gap": tweaks.density === "compact" ? "6px" : tweaks.density === "comfy" ? "12px" : "8px",
    "--card-pad": tweaks.density === "compact" ? "9px 10px" : tweaks.density === "comfy" ? "14px 14px" : "11px 12px",
    "--card-radius": tweaks.cardStyle === "soft" ? "10px" : "6px",
    "--card-shadow": tweaks.cardStyle === "elevated"
      ? "0 1px 0 var(--line), 0 2px 8px rgba(20,15,8,0.06)"
      : "0 1px 0 var(--line)",
  };

  return (
    <div className={"app theme-" + tweaks.accent + (isDark ? " is-dark" : "")} style={cssVars}>
      <TopBar
        title={boardTitle}
        onChangeTitle={setBoardTitle}
        projects={allProjects}
        hidden={hidden}
        onToggleProject={toggleProject}
        search={search}
        onSearch={setSearch}
        onAddProject={addProject}
        onOpenOverview={() => setShowOverview(true)}
        sprint="Sprint 14 · Week of May 23 — May 29"
      />
      {tweaks.showStats && (
        <StatsBar tasks={tasks} projects={boardProjects} />
      )}
      <main className="board-wrap">
        <Board
          projects={boardProjects}
          columns={COLUMNS}
          tasks={filteredTasks}
          collapsed={collapsed}
          onToggleLane={toggleLane}
          onAdd={addTask}
          onOpen={(t) => setOpenTaskId(t.id)}
          onMove={moveTask}
          onPatchProject={patchProject}
          onArchiveProject={archiveProject}
          onDeleteProject={deleteProject}
        />
        <ArchivedTray
          projects={archivedProjects}
          tasks={tasks}
          onRestore={unarchiveProject}
          onDelete={deleteProject}
        />
      </main>

      {openTask && openProject && (
        <TaskDetail
          task={openTask}
          project={openProject}
          allTasks={tasks}
          onClose={() => setOpenTaskId(null)}
          onPatch={patchTask}
          onDelete={deleteTask}
        />
      )}

      {showOverview && (
        <GanttOverview
          projects={boardProjects}
          tasks={tasks}
          onClose={() => setShowOverview(false)}
          onOpenTask={(t) => { setShowOverview(false); setOpenTaskId(t.id); }}
        />
      )}

      <TweaksPanel title="Board settings">
        <TweakSection label="Layout" />
        <TweakRadio label="Density" value={tweaks.density}
                    options={["compact", "regular", "comfy"]}
                    onChange={(v) => setTweak("density", v)} />
        <TweakRadio label="Card style" value={tweaks.cardStyle}
                    options={["lined", "soft", "elevated"]}
                    onChange={(v) => setTweak("cardStyle", v)} />
        <TweakToggle label="Show stats bar" value={tweaks.showStats}
                     onChange={(v) => setTweak("showStats", v)} />

        <TweakSection label="Theme" />
        <TweakRadio label="Palette" value={tweaks.accent}
                    options={[
                      { value: "warm",     label: "Warm" },
                      { value: "paper",    label: "Paper" },
                      { value: "cool",     label: "Cool" },
                      { value: "graphite", label: "Dark" },
                    ]}
                    onChange={(v) => setTweak("accent", v)} />

        <TweakSection label="Board" />
        <TweakButton label="Reset to sample data" secondary onClick={resetBoard} />
      </TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
