const REQUIRED_FIELDS = [
    'patient_id',
    'appointment_id',
    'appointment_date',
    'appointment_status',
];
const VALID_STATUSES = [
    'scheduled',
    'completed',
    'cancelled',
    'no_show',
];
function getValue(record, field) {
    const matchingKey = Object.keys(record).find((key) => key.trim().toLowerCase() === field);
    return matchingKey ? record[matchingKey].trim() : '';
}
function isValidDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }
    const date = new Date(`${value}T00:00:00.000Z`);
    return (!Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value);
}
function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
export function analyzeRecords(records) {
    const issues = [];
    const seenAppointmentIds = new Set();
    const availableFields = new Set(Object.keys(records[0] ?? {}).map((key) => key.trim().toLowerCase()));
    for (const field of REQUIRED_FIELDS) {
        if (!availableFields.has(field)) {
            issues.push({
                rowNumber: null,
                field,
                issueType: 'MISSING_COLUMN',
                severity: 'ERROR',
                description: `The required column '${field}' is missing from the CSV header.`,
                suggestedCorrection: `Add the '${field}' column to the CSV file.`,
            });
        }
    }
    records.forEach((record, index) => {
        const rowNumber = index + 2;
        for (const field of REQUIRED_FIELDS) {
            if (availableFields.has(field) && !getValue(record, field)) {
                issues.push({
                    rowNumber,
                    field,
                    issueType: 'MISSING_VALUE',
                    severity: 'ERROR',
                    description: `The required field '${field}' is empty.`,
                    suggestedCorrection: `Provide a valid value for '${field}'.`,
                });
            }
        }
        const email = getValue(record, 'patient_email');
        if (email && !isValidEmail(email)) {
            issues.push({
                rowNumber,
                field: 'patient_email',
                issueType: 'INVALID_EMAIL',
                severity: 'ERROR',
                description: 'The email address does not have a valid format.',
                suggestedCorrection: 'Check and correct the email address.',
            });
        }
        const appointmentDate = getValue(record, 'appointment_date');
        if (appointmentDate && !isValidDate(appointmentDate)) {
            issues.push({
                rowNumber,
                field: 'appointment_date',
                issueType: 'INVALID_DATE',
                severity: 'ERROR',
                description: 'The appointment date is not a valid YYYY-MM-DD date.',
                suggestedCorrection: 'Use a real date in YYYY-MM-DD format.',
            });
        }
        const status = getValue(record, 'appointment_status').toLowerCase();
        if (status && !VALID_STATUSES.includes(status)) {
            issues.push({
                rowNumber,
                field: 'appointment_status',
                issueType: 'INVALID_STATUS',
                severity: 'ERROR',
                description: `The appointment status '${status}' is not recognised.`,
                suggestedCorrection: `Use one of: ${VALID_STATUSES.join(', ')}.`,
            });
        }
        const appointmentId = getValue(record, 'appointment_id').toLowerCase();
        if (appointmentId) {
            if (seenAppointmentIds.has(appointmentId)) {
                issues.push({
                    rowNumber,
                    field: 'appointment_id',
                    issueType: 'DUPLICATE_RECORD',
                    severity: 'WARNING',
                    description: `Appointment ID '${appointmentId}' appears more than once.`,
                    suggestedCorrection: 'Review the duplicate appointment record.',
                });
            }
            else {
                seenAppointmentIds.add(appointmentId);
            }
        }
    });
    return issues;
}
//# sourceMappingURL=quality.service.js.map