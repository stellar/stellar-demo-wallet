#![no_std]

use soroban_sdk::{
    auth::{Context, CustomAccountInterface},
    contract, contracterror, contractimpl, contracttype,
    crypto::Hash,
    Bytes, BytesN, Env, Vec,
    panic_with_error,
};

mod base64_url;

/// The WebAuthn type for the get operation.
const WEBAUTHN_TYPE_GET: &str = "webauthn.get";

/// Authenticator data flag offset. It appears after the RP ID hash in the authenticator data.
const AUTH_DATA_FLAG_OFFSET: u32 = 32;
/// Authenticator data flags for user presence
const AUTH_DATA_FLAG_UP: u8 = 0x01;
/// Authenticator data flags for user verification
const AUTH_DATA_FLAG_UV: u8 = 0x04;

/// Length of the encoded challenge in the client data JSON.
const ENCODED_CHALLENGE_LEN: u32 = 43;

/// Max length of the client data JSON in bytes.
///
/// #### Explanation of the length:
///
/// - `type`: ~20 bytes (`"type":"webauthn.get"`).
///
/// - `challenge`: ~58 bytes (`"challenge":"<base64url_32_byte_challenge>",`).
///
/// - `origin`: ~100-200 bytes (`"origin":"https://example.com",`)
///
/// - `crossOrigin`: ~20 bytes (`"crossOrigin":false,`).
///
/// Total length: ~298 bytes.
///
/// This is a conservative estimate, as the actual length may vary based on the specific values used.
/// The maximum length is set to 1024 bytes to accommodate any additional fields or whitespace.
const MAX_CLIENT_DATA_JSON_LEN: usize = 1024;

const WEEK_OF_LEDGERS: u32 = 60 * 60 * 24 / 5 * 7;

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    CredentialId(Bytes),
}

/// The Client Data JSON structure.
#[derive(serde::Deserialize, Clone, Debug, PartialEq, PartialOrd)]
struct ClientDataJson<'a> {
    /// The type of the WebAuthn operation.
    pub r#type: &'a str,
    /// The challenge used in the WebAuthn operation.
    pub challenge: &'a str,
}

#[contracttype]
#[derive(Clone)]
pub struct Signature {
    pub authenticator_data: Bytes,
    pub client_data_json: Bytes,
    pub credential_id: Bytes,
    pub signature: BytesN<64>,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum Error {
    SignerNotFound = 1,
    ClientDataParseError = 2,
    ClientDataInvalidType = 3,
    ClientDataInvalidChallenge = 4,
    AuthDataUserNotPresent = 5,
    AuthDataUserNotVerified = 6,
}

#[contract]
struct ContractAccount;

#[contractimpl]
impl ContractAccount {
    pub fn __constructor(
        env: Env,
        credential_id: Bytes,
        public_key: BytesN<65>,
    ) {
        env.storage().instance().set(&DataKey::CredentialId(credential_id), &public_key);
    }
}

#[contractimpl]
impl CustomAccountInterface for ContractAccount {
    type Signature = Signature;
    type Error = Error;

    #[allow(non_snake_case)]
    fn __check_auth(
        env: Env,
        _signature_payload: Hash<32>,
        signature: Self::Signature,
        _auth_contexts: Vec<Context>,
    ) -> Result<(), Error> {
        let max_ttl = env.storage().max_ttl();
        env.storage()
            .instance()
            .extend_ttl(max_ttl - WEEK_OF_LEDGERS, max_ttl);

        let Signature {
            authenticator_data,
            client_data_json,
            credential_id,
            signature,
        } = signature;

        let public_key = env.storage()
            .instance()
            .get::<_, BytesN<65>>(&DataKey::CredentialId(credential_id))
            .ok_or(Error::SignerNotFound)?;

        // ----------------------------
        // 1. Signature verification
        // ----------------------------

        // Extend the authenticator_data with the SHA-256 hash of client_data_json bytes.
        // This is part of constructing the full data that was signed.
        let mut message = authenticator_data.clone();
        message.extend_from_array(&env.crypto().sha256(&client_data_json).to_array());

        // Verify signature against SHA-256 hash of the combined message
        env.crypto().secp256r1_verify(&public_key, &env.crypto().sha256(&message), &signature);

        // ----------------------------
        // 2. Client Data JSON parsing and validation
        // ----------------------------

        // Convert client_data_json (Bytes) into a buffer of fixed max size 1024 bytes.
        let client_data_json_buffer = client_data_json.to_buffer::<MAX_CLIENT_DATA_JSON_LEN>();
        let client_data_json_bytes = client_data_json_buffer.as_slice();

        // Deserialize the client_data_json bytes into the ClientDataJson struct
        let (parsed_client_data_json, _): (ClientDataJson, _) =
            serde_json_core::de::from_slice(client_data_json_bytes)
                .map_err(|_| Error::ClientDataParseError)?;

        // Verify the Webauthn type
        if parsed_client_data_json.r#type != WEBAUTHN_TYPE_GET {
            panic_with_error!(env, Error::ClientDataInvalidType);
        }

        // Prepare a byte array to hold the expected challenge in base64 URL encoded form.
        // The length 43 is the expected length of a base64url encoding of a 32-byte challenge.
        let mut expected_challenge = [0u8; ENCODED_CHALLENGE_LEN as usize];

        // Encode the signature payload (challenge) into base64url and write into expected_challenge.
        base64_url::encode(&mut expected_challenge, &signature_payload.to_array());

        // Compare the challenge inside the client_data_json with the expected challenge we computed.
        if parsed_client_data_json.challenge.as_bytes() != expected_challenge {
            panic_with_error!(env, Error::ClientDataInvalidChallenge);
        }

        // ----------------------------
        // 3. Authenticator Data validation
        // ----------------------------

        // `authenticator_data` is structured as:
        // [ 0..32  ] RP ID hash (SHA256 of relying on party ID)
        // [ 32    ] Flags byte (bitfield: UP, UV, AT, ED, etc.)
        // [ 33..36] Signature counter (big-endian u32)
        // [ ...   ] Attested credential data (if AT flag set)
        // [ ...   ] Extension data (if ED flag set)

        let flags = authenticator_data
            .get(AUTH_DATA_FLAG_OFFSET)
            .unwrap();

        // Check user presence flag
        if flags & AUTH_DATA_FLAG_UP != AUTH_DATA_FLAG_UP {
            panic_with_error!(env, Error::AuthDataUserNotPresent);
        }

        // Check user verification flag
        if flags & AUTH_DATA_FLAG_UV != AUTH_DATA_FLAG_UV {
            panic_with_error!(env, Error::AuthDataUserNotVerified);
        }

        Ok(())
    }
}
