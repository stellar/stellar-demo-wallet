export enum Sep9FieldType {
  STRING = "string",
  COUNTRY_CODE = "country_code",
  PHONE_NUMBER = "phone number",
  DATE = "date",
  NUMBER = "number",
  BINARY = "binary",
  LANGUAGE_CODE = "language_code",
}

export interface Sep9Field {
  name: string;
  type: Sep9FieldType;
  description: string;
}

/**
 * Sep9Fields contains a list of all SEP-9 fields from v1.3.2 (https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0009.md).
 */
export const Sep9Fields: Sep9Field[] = [
  {
    name: "family_name",
    type: Sep9FieldType.STRING,
    description: "Family name",
  },
  {
    name: "last_name",
    type: Sep9FieldType.STRING,
    description: "Last name",
  },
  {
    name: "given_name",
    type: Sep9FieldType.STRING,
    description: "Given name",
  },
  {
    name: "first_name",
    type: Sep9FieldType.STRING,
    description: "First name",
  },
  {
    name: "additional_name",
    type: Sep9FieldType.STRING,
    description: "Middle name or other additional name",
  },
  {
    name: "address_country_code",
    type: Sep9FieldType.COUNTRY_CODE,
    description: "Country code for current address",
  },
  {
    name: "state_or_province",
    type: Sep9FieldType.STRING,
    description: "Name of state/province/region/prefecture",
  },
  {
    name: "city",
    type: Sep9FieldType.STRING,
    description: "Name of city/town",
  },
  {
    name: "postal_code",
    type: Sep9FieldType.STRING,
    description: "Postal or other code identifying user's locale",
  },
  {
    name: "address",
    type: Sep9FieldType.STRING,
    description:
      "Entire address (country, state, postal code, street address, etc...) as a multi-line string",
  },
  {
    name: "mobile_number",
    type: Sep9FieldType.PHONE_NUMBER,
    description: "Mobile phone number with country code, in E.164 format",
  },
  {
    name: "email_address",
    type: Sep9FieldType.STRING,
    description: "Email address",
  },
  {
    name: "birth_date",
    type: Sep9FieldType.DATE,
    description: "Date of birth, e.g. 1976-07-04",
  },
  {
    name: "birth_place",
    type: Sep9FieldType.STRING,
    description: "Place of birth (city, state, country; as on passport)",
  },
  {
    name: "birth_country_code",
    type: Sep9FieldType.COUNTRY_CODE,
    description: "ISO Code of country of birth",
  },
  {
    name: "bank_account_number",
    type: Sep9FieldType.STRING,
    description: "Number identifying bank account",
  },
  {
    name: "bank_number",
    type: Sep9FieldType.STRING,
    description:
      "Number identifying bank in national banking system (routing number in US)",
  },
  {
    name: "bank_phone_number",
    type: Sep9FieldType.STRING,
    description: "Phone number with country code for bank",
  },
  {
    name: "bank_branch_number",
    type: Sep9FieldType.STRING,
    description: "Number identifying bank branch",
  },
  {
    name: "tax_id",
    type: Sep9FieldType.STRING,
    description:
      "Tax identifier of user in their country (social security number in US)",
  },
  {
    name: "tax_id_name",
    type: Sep9FieldType.STRING,
    description: "Name of the tax ID (SSN or ITIN in the US)",
  },
  {
    name: "occupation",
    type: Sep9FieldType.NUMBER,
    description: "Occupation ISCO code",
  },
  {
    name: "employer_name",
    type: Sep9FieldType.STRING,
    description: "Name of employer",
  },
  {
    name: "employer_address",
    type: Sep9FieldType.STRING,
    description: "Address of employer",
  },
  {
    name: "language_code",
    type: Sep9FieldType.LANGUAGE_CODE,
    description: "Primary language",
  },
  {
    name: "id_type",
    type: Sep9FieldType.STRING,
    description: "Passport, drivers_license, id_card, etc...",
  },
  {
    name: "id_country_code",
    type: Sep9FieldType.COUNTRY_CODE,
    description:
      "Country issuing passport or photo ID as ISO 3166-1 alpha-3 code",
  },
  {
    name: "id_issue_date",
    type: Sep9FieldType.DATE,
    description: "ID issue date",
  },
  {
    name: "id_expiration_date",
    type: Sep9FieldType.DATE,
    description: "ID expiration date",
  },
  {
    name: "id_number",
    type: Sep9FieldType.STRING,
    description: "Passport or ID number",
  },
  {
    name: "photo_id_front",
    type: Sep9FieldType.BINARY,
    description: "Image of front of user's photo ID or passport",
  },
  {
    name: "photo_id_back",
    type: Sep9FieldType.BINARY,
    description: "Image of back of user's photo ID or passport",
  },
  {
    name: "notary_approval_of_photo_id",
    type: Sep9FieldType.BINARY,
    description: "Image of notary's approval of photo ID or passport",
  },
  {
    name: "ip_address",
    type: Sep9FieldType.STRING,
    description: "IP address of customer's computer",
  },
  {
    name: "photo_proof_residence",
    type: Sep9FieldType.BINARY,
    description:
      "Image of a utility bill, bank statement or similar with the user's name and address",
  },
];

/**
 * Sep9FieldsDict contains a dictionary with all SEP-9 fields from v1.3.2 (https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0009.md).
 */
export const Sep9FieldsDict: {
  [key: string]: Sep9Field;
} = Sep9Fields.reduce(
  (result: { [key: string]: Sep9Field }, sep9Field: Sep9Field) => ({
    ...result,
    [sep9Field.name]: sep9Field,
  }),
  {},
);
