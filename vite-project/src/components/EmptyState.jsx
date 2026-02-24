export default function EmptyState({ icon, title, description }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            {icon && <div className="text-slate-300 mb-4">{icon}</div>}
            <h3 className="text-base font-semibold text-slate-600">{title || 'Không có dữ liệu'}</h3>
            {description && <p className="text-sm text-slate-400 mt-1 max-w-sm">{description}</p>}
        </div>
    );
}
