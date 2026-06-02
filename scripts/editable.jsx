// Editable.jsx — small inline-edit primitive.
//
// Renders its `value` as plain text. Double-click swaps it for a
// contentEditable element; Enter / blur commits, Escape reverts.
//
// Why not just <input>? We want zero layout shift when entering edit
// mode — the contentEditable inherits typography from its parent and
// keeps the same metrics, so the title doesn't "jump" when activated.

function EditableText({
  value,
  onChange,
  as: Tag = "span",
  className = "",
  placeholder = "",
  title = "Double-click to edit",
  multiline = false,
  ...rest
}) {
  const [editing, setEditing] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!editing) return;
    const el = ref.current;
    if (!el) return;
    el.textContent = value || "";
    el.focus();
    // Place caret at the end.
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }, [editing, value]);

  const commit = () => {
    const next = (ref.current?.textContent || "").trim();
    if (next && next !== value) onChange(next);
    setEditing(false);
  };
  const cancel = () => {
    setEditing(false);
  };

  if (editing) {
    return (
      <Tag
        ref={ref}
        className={className + " is-editing"}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !multiline) { e.preventDefault(); commit(); }
          if (e.key === "Enter" && multiline && e.metaKey) { e.preventDefault(); commit(); }
          if (e.key === "Escape") { e.preventDefault(); cancel(); }
        }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        {...rest}
      />
    );
  }
  return (
    <Tag
      className={className + " is-editable"}
      title={title}
      onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
      {...rest}
    >
      {value || <span className="editable-placeholder">{placeholder}</span>}
    </Tag>
  );
}

Object.assign(window, { EditableText });
