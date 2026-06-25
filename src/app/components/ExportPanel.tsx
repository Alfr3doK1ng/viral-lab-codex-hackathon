import { ClipboardCopy } from "lucide-react";

type Props = {
  exportJson: string;
  copyStatus: string;
  canExport: boolean;
  onCopy: () => void;
};

export function ExportPanel({ exportJson, copyStatus, canExport, onCopy }: Props) {
  return (
    <section className="panel export-panel" aria-labelledby="export-heading">
      <div className="panel-heading row-heading">
        <div>
          <p className="eyebrow">Handoff</p>
          <h2 id="export-heading">Export JSON</h2>
        </div>
        <button className="secondary-action" type="button" onClick={onCopy} disabled={!canExport}>
          <ClipboardCopy size={17} />
          Copy JSON
        </button>
      </div>
      <p className="copy-status" aria-live="polite">
        {copyStatus}
      </p>
      {exportJson ? (
        <pre className="json-preview" data-testid="json-preview">
          {exportJson}
        </pre>
      ) : (
        <p className="empty-state">The export appears after brief generation.</p>
      )}
    </section>
  );
}
