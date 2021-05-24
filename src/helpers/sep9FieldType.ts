export const sep9FieldType: {
  [key: string]: string;
} = {
  family_name: "string",
  last_name: "string",
  given_name: "string",
  first_name: "string",
  additional_name: "string",
  address_country_code: "country code",
  state_or_province: "string",
  city: "string",
  postal_code: "string",
  address: "string", // Entire address (country, state, postal code, street address, etc...) as a multi-line string
  mobile_number: "phone number", // Mobile phone number with country code, in E.164 format
  email_address: "string",
  birth_date: "date", // 1976-07-04
  birth_place: "string",
  birth_country_code: "country code",
  bank_account_number: "string",
  bank_number: "string",
  bank_phone_number: "string",
  bank_branch_number: "string",
  tax_id: "string",
  tax_id_name: "string",
  occupation: "number", // Occupation ISCO code
  employer_name: "string",
  employer_address: "string",
  language_code: "string",
  id_type: "string",
  id_country_code: "country code",
  id_issue_date: "date",
  id_expiration_date: "date",
  id_number: "string",
  photo_id_front: "binary",
  photo_id_back: "binary",
  notary_approval_of_photo_id: "binary",
  ip_address: "string",
  photo_proof_residence: "binary",
};
