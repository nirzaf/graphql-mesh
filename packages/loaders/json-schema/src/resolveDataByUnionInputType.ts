import { GraphQLInputType, isListType, isNonNullType, isInputObjectType } from 'graphql';
import { asArray } from '@graphql-tools/utils';
import { SchemaComposer } from 'graphql-compose';
import { sanitizeNameForGraphQL } from '@graphql-mesh/utils';

export function resolveDataByUnionInputType(data: any, type: GraphQLInputType, schemaComposer: SchemaComposer): any {
  if (data) {
    if (isListType(type)) {
      return asArray(data).map(elem => resolveDataByUnionInputType(elem, type.ofType, schemaComposer));
    }
    if (isNonNullType(type)) {
      return resolveDataByUnionInputType(data, type.ofType, schemaComposer);
    }
    if (isInputObjectType(type)) {
      const fieldMap = type.getFields();
      const isOneOf = schemaComposer.getAnyTC(type).getDirectiveByName('oneOf');
      data = asArray(data)[0];
      for (const propertyName in data) {
        const fieldName = sanitizeNameForGraphQL(propertyName);
        const field = fieldMap[fieldName];
        if (field) {
          if (isOneOf) {
            const resolvedData = resolveDataByUnionInputType(data[fieldName], field.type, schemaComposer);
            return resolvedData;
          }
          const fieldData = data[fieldName];
          data[fieldName] = undefined;
          const realFieldName = (field.extensions?.propertyName as string) || fieldName;
          data[realFieldName] = resolveDataByUnionInputType(fieldData, field.type, schemaComposer);
        }
      }
    }
  }
  return data;
}
