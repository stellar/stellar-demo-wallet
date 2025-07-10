#![no_std]

use soroban_sdk::{
    auth::{Context, CustomAccountInterface},
    contract, contracterror, contractimpl, contracttype,
    crypto::Hash,
    Bytes, BytesN, Env, Vec,
};

#[contract]
struct ContractAccount;

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    CredentialId(Bytes),
}

#[contracttype]
#[derive(Clone)]
pub struct Signature {
    pub credential_id: Bytes,
    pub signature: BytesN<64>,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum Error {
    SignerNotFound = 1,
    NoSignature = 2,
    InvalidSignature = 3,
}

const WEEK_OF_LEDGERS: u32 = 60 * 60 * 24 / 5 * 7;

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
        signature_payload: Hash<32>,
        signature: Self::Signature,
        _auth_contexts: Vec<Context>,
    ) -> Result<(), Error> {
        let max_ttl = env.storage().max_ttl();
        env.storage()
            .instance()
            .extend_ttl(max_ttl - WEEK_OF_LEDGERS, max_ttl);

        let pk = env.storage()
            .instance()
            .get::<_, BytesN<65>>(&DataKey::CredentialId(signature.credential_id.clone()))
            .ok_or(Error::SignerNotFound)?;

        env.crypto()
            .secp256r1_verify(&pk, &signature_payload.into(),  &signature.signature);

        Ok(())
    }
}
