import { getToml } from "../methods/getToml";

/**
 * Extract specific fields from a TOML file
 * @param homeDomain - The home domain to fetch TOML from
 * @param fields - Array of field names to extract
 * @returns Object containing the requested fields
 */
export const extractTomlFields = async (
  homeDomain: string,
  fields: string[]
): Promise<Record<string, string | undefined>> => {
  const toml = await getToml(homeDomain) as any;
  
  const result: Record<string, string | undefined> = {};
  
  for (const field of fields) {
    result[field] = toml[field] as string | undefined;
  }
  
  return result;
};

/**
 * Extract a single field from a TOML file
 * @param homeDomain - The home domain to fetch TOML from
 * @param field - The field name to extract
 * @returns The field value or undefined if not found
 */
export const extractTomlField = async (
  homeDomain: string,
  field: string
): Promise<string | undefined> => {
  const toml = await getToml(homeDomain) as any;
  return toml[field] as string | undefined;
};

/**
 * Extract required fields from TOML file with validation
 * @param homeDomain - The home domain to fetch TOML from
 * @param requiredFields - Array of required field names
 * @returns Object containing the required fields
 * @throws Error if any required field is missing
 */
export const extractRequiredTomlFields = async (
  homeDomain: string,
  requiredFields: string[]
): Promise<Record<string, string>> => {
  const toml = await getToml(homeDomain) as any;
  
  const result: Record<string, string> = {};
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    const value = toml[field] as string | undefined;
    if (!value) {
      missingFields.push(field);
    } else {
      result[field] = value;
    }
  }
  
  if (missingFields.length > 0) {
    throw new Error(
      `Missing required TOML fields for ${homeDomain}: ${missingFields.join(', ')}`
    );
  }
  
  return result;
}; 