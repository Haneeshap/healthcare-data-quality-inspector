import * as runtime from "@prisma/client/runtime/library";
export const PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
export const PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
export const PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
export const PrismaClientInitializationError = runtime.PrismaClientInitializationError;
export const PrismaClientValidationError = runtime.PrismaClientValidationError;
export const sql = runtime.sqltag;
export const empty = runtime.empty;
export const join = runtime.join;
export const raw = runtime.raw;
export const Sql = runtime.Sql;
export const Decimal = runtime.Decimal;
export const getExtensionContext = runtime.Extensions.getExtensionContext;
export const prismaVersion = {
    client: "6.19.3",
    engine: "c2990dca591cba766e3b7ef5d9e8a84796e47ab7"
};
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
export const defineExtension = runtime.Extensions.defineExtension;
//# sourceMappingURL=prismaNamespace.js.map