import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

function Skeleton({ rows = 5, cols = 4 }) {
    return (
        <tbody>
            {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="border-t border-slate-100">
                    {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-slate-100 rounded animate-pulse" />
                        </td>
                    ))}
                </tr>
            ))}
        </tbody>
    );
}

export default function DataTable({ columns, data, loading, pagination, onPageChange, emptyMessage = 'No data' }) {
    const { page = 0, totalPages = 0, totalElements = 0 } = pagination || {};

    return (
        <div>
            <div className="table-wrapper">
                <table className="table">
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th key={col.key} style={{ width: col.width }}>{col.label}</th>
                            ))}
                        </tr>
                    </thead>
                    {loading ? (
                        <Skeleton rows={5} cols={columns.length} />
                    ) : (
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="text-center py-12 text-slate-400">{emptyMessage}</td>
                                </tr>
                            ) : (
                                data.map((row, i) => (
                                    <tr key={row.id || i}>
                                        {columns.map((col) => (
                                            <td key={col.key}>
                                                {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    )}
                </table>
            </div>

            {/* Pagination */}
            {pagination && totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
                    <span>Total {totalElements} records</span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onPageChange(page - 1)}
                            disabled={page === 0}
                            className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronLeftIcon className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 bg-primary-500 text-white rounded text-xs font-medium">{page + 1}</span>
                        <span className="px-2 text-slate-400">/ {totalPages}</span>
                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={page >= totalPages - 1}
                            className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
