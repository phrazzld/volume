import { ReactNode } from "react";

interface TerminalTableProps {
  headers: string[];
  rows: Array<Array<string | number | ReactNode>>;
  columnWidths?: string[];
  highlightRows?: boolean;
  className?: string;
}

export function TerminalTable({
  headers,
  rows,
  columnWidths,
  highlightRows = false,
  className = "",
}: TerminalTableProps) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-terminal-bgSecondary">
            {headers.map((header, index) => (
              <th
                key={index}
                className={`px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-terminal-text border border-terminal-border ${
                  columnWidths?.[index] || ""
                }`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-3 py-8 text-center text-terminal-textSecondary border border-terminal-border"
              >
                NO DATA
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={
                  highlightRows && rowIndex % 2 === 0
                    ? "bg-terminal-bgSecondary/50"
                    : ""
                }
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`px-3 py-2 text-terminal-text border border-terminal-border font-mono tabular-nums ${
                      columnWidths?.[cellIndex] || ""
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
