const STATUS_MAP = {
    Pending: 'badge-pending',
    Approved: 'badge-approved',
    Completed: 'badge-completed',
    Cancelled: 'badge-cancelled',
};

export default function StatusBadge({ status }) {
    const cls = STATUS_MAP[status] || 'badge bg-slate-100 text-slate-600';
    return <span className={cls}>{status}</span>;
}
