import * as runtime from "@prisma/client/runtime/index-browser";
export const Decimal = runtime.Decimal;
export const NullTypes = {
    DbNull: runtime.objectEnumValues.classes.DbNull,
    JsonNull: runtime.objectEnumValues.classes.JsonNull,
    AnyNull: runtime.objectEnumValues.classes.AnyNull,
};
export const DbNull = runtime.objectEnumValues.instances.DbNull;
export const JsonNull = runtime.objectEnumValues.instances.JsonNull;
export const AnyNull = runtime.objectEnumValues.instances.AnyNull;
export const ModelName = {
    Dataset: 'Dataset',
    DataRecord: 'DataRecord',
    DataIssue: 'DataIssue'
};
export const TransactionIsolationLevel = runtime.makeStrictEnum({
    Serializable: 'Serializable'
});
export const DatasetScalarFieldEnum = {
    id: 'id',
    filename: 'filename',
    uploadedAt: 'uploadedAt',
    totalRows: 'totalRows'
};
export const DataRecordScalarFieldEnum = {
    id: 'id',
    datasetId: 'datasetId',
    recordIdentifier: 'recordIdentifier',
    recordData: 'recordData'
};
export const DataIssueScalarFieldEnum = {
    id: 'id',
    datasetId: 'datasetId',
    recordId: 'recordId',
    rowNumber: 'rowNumber',
    field: 'field',
    issueType: 'issueType',
    severity: 'severity',
    description: 'description',
    suggestedCorrection: 'suggestedCorrection',
    status: 'status'
};
export const SortOrder = {
    asc: 'asc',
    desc: 'desc'
};
export const NullsOrder = {
    first: 'first',
    last: 'last'
};
//# sourceMappingURL=prismaNamespaceBrowser.js.map