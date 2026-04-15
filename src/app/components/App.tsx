import * as React from "react";
import { SceneNodeType, TypeCounts } from "../../layerCounter";
import CountRow from "./CountRow";
import { ExportIcon } from "./Icons";
import "../styles/ui.css";

function typeCountsTotal(typeCounts: TypeCounts): number {
  return Object.values(typeCounts).reduce((a, b) => a + b, 0);
}

const App = ({}) => {
  const [typeCounts, setTypeCounts] = React.useState<TypeCounts>({});
  const [shouldCountChildren, setShouldCountChildren] = React.useState(true);
  const [shouldIncludeVariants, setShouldIncludeVariants] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  React.useEffect(() => {
    window.onmessage = event => {
      const { type, message } = event.data.pluginMessage;
      if (type === "shouldCountChildren") setShouldCountChildren(message);
      else if (type === "shouldIncludeVariants") setShouldIncludeVariants(message);
      else if (type === "updateCounts") setTypeCounts(message);
    };
  }, []);

  const onNestedLayersClick = () => {
    const next = !shouldCountChildren;
    parent.postMessage({ pluginMessage: { type: "toggleCountChildren", message: next } }, "*");
    setShouldCountChildren(next);
  };

  const onVariantsClick = () => {
    const next = !shouldIncludeVariants;
    parent.postMessage({ pluginMessage: { type: "toggleIncludeVariants", message: next } }, "*");
    setShouldIncludeVariants(next);
  };

  const handleExport = () => {
    if (exporting) return;
    setExporting(true);
    parent.postMessage({
      pluginMessage: {
        type: "exportToCanvas",
        message: { counts: typeCounts, total: typeCountsTotal(typeCounts) }
      }
    }, "*");
    setTimeout(() => setExporting(false), 1200);
  };

  const total = typeCountsTotal(typeCounts);
  const isEmpty = total === 0;

  const sortedCounts = Object.entries(typeCounts).sort(
    ([aKey, aValue], [bKey, bValue]) => {
      if (bValue !== aValue) return bValue - aValue;
      return aKey.localeCompare(bKey);
    }
  ) as Array<[SceneNodeType, number]>;

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <div className="header-row">
          <span className="header-label">Selected Layers</span>
          <div className="header-right">
            <span className="header-count">{total}</span>
            {!isEmpty && (
              <button
                className={`export-btn${exporting ? " exporting" : ""}`}
                onClick={handleExport}
                title="Place on canvas"
              >
                <ExportIcon />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="body">
        {isEmpty ? (
          <div className="empty-state">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="18" y="4" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="4" y="18" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="18" y="18" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <p className="empty-title">No layers selected</p>
            <p className="empty-subtitle">Select layers on the canvas to count them</p>
          </div>
        ) : (
          <div className="count-list">
            {sortedCounts.map(([type, count]) => (
              <CountRow key={type} type={type} count={count} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="footer">
        <div className="checkboxes">
          <label className="checkbox-label">
            <input type="checkbox" className="checkbox-input" onChange={onNestedLayersClick} checked={shouldCountChildren}/>
            <span className="checkbox-custom" />
            <span className="checkbox-text">Include nested layers</span>
          </label>
          <label className="checkbox-label">
            <input type="checkbox" className="checkbox-input" onChange={onVariantsClick} checked={shouldIncludeVariants}/>
            <span className="checkbox-custom" />
            <span className="checkbox-text">Include unique variants</span>
          </label>
        </div>
        <div className="credit">
          <a href="https://blakewonka.com/layer-counter" target="_blank" className="credit-link">
            blakewonka
          </a>
        </div>
      </div>
    </div>
  );
};

export default App;
