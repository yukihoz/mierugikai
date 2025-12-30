import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function TrendChart({ data, onYearClick, globalMaxYear }) {
    if (!data || data.length === 0) return null;

    const years = data.map(d => parseInt(d.year));
    const maxYear = Math.max(...years);

    // Only show dashed line if the data actually extends to the "latest incomplete year" (globalMaxYear)
    const showDashed = globalMaxYear && maxYear === globalMaxYear;

    const processedData = data.map(d => {
        const y = parseInt(d.year);

        if (!showDashed) {
            return { ...d, countSolid: d.count, countDashed: null };
        }

        // Point belongs to solid line if year <= maxYear - 1
        // Point belongs to dashed line if year >= maxYear - 1
        // Overlap at maxYear - 1 ensures continuity.
        return {
            ...d,
            countSolid: (y <= maxYear - 1) ? d.count : null,
            countDashed: (y >= maxYear - 1) ? d.count : null
        };
    });

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-yellow-200 h-full">
            <h3 className="font-bold text-slate-700 mb-4 text-center">発言数の推移</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={processedData}
                        onClick={(e) => {
                            if (e && e.activePayload && e.activePayload[0]) {
                                onYearClick(e.activePayload[0].payload.year);
                            }
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fefce8" />
                        <XAxis
                            dataKey="year"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                        />
                        <Tooltip
                            cursor={{ stroke: '#facc15', strokeWidth: 2 }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            // Custom tooltip needed because active payload might be mostly nulls if we hover over one line vs other?
                            // Recharts handles this usually if we have multiple lines.
                            // But better to just look at "count" from payload.
                            formatter={(value, name, props) => {
                                // Ignore nulls in tooltip display if possible, or just show standard "count"
                                return [props.payload.count, "発言数"];
                            }}
                        />
                        {/* Solid Line */}
                        <Line
                            type="monotone"
                            dataKey="countSolid"
                            stroke="#ca8a04"
                            strokeWidth={3}
                            dot={{
                                fill: '#facc15',
                                stroke: '#ca8a04',
                                strokeWidth: 2,
                                r: 4,
                                onClick: (e, p) => onYearClick && onYearClick(p.payload.year),
                                style: { cursor: 'pointer' }
                            }}
                            activeDot={{
                                r: 6,
                                fill: '#854d0e',
                                onClick: (e, p) => onYearClick && onYearClick(p.payload.year),
                                style: { cursor: 'pointer' }
                            }}
                            connectNulls={false} // Important: do not connect over nulls
                        />
                        {/* Dashed Line */}
                        <Line
                            type="monotone"
                            dataKey="countDashed"
                            stroke="#ca8a04"
                            strokeWidth={3}
                            strokeDasharray="5 5"
                            dot={{
                                fill: '#facc15',
                                stroke: '#ca8a04',
                                strokeWidth: 2,
                                r: 4,
                                onClick: (e, p) => onYearClick && onYearClick(p.payload.year),
                                style: { cursor: 'pointer' }
                            }}
                            activeDot={{
                                r: 6,
                                fill: '#854d0e',
                                onClick: (e, p) => onYearClick && onYearClick(p.payload.year),
                                style: { cursor: 'pointer' }
                            }}
                            connectNulls={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
