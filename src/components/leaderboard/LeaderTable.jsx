export default function LeaderTable({ headers, children, empty }) {
    if (!children || (Array.isArray(children) && !children.filter(Boolean).length)) {
        return <p className="text-center text-slate-500 py-10">{empty}</p>;
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-800">
                        {headers.map((h) => (
                            <th key={h.label} className={`pb-3 pr-4 font-medium ${h.right ? 'text-right' : ''}`}>
                                {h.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">{children}</tbody>
            </table>
        </div>
    );
}