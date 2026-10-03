import { parse } from 'csv-parse/sync';
export function parseCsv(csvContent) {
    const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        relax_column_count: false,
    });
    return records;
}
//# sourceMappingURL=csv-parser.service.js.map