// Othent.io
// Merging Web2 to Web3 user logins with a familiar and simple interface



const OTHENT_PUBLIC_KEY = `-----BEGIN CERTIFICATE-----
MIIDATCCAemgAwIBAgIJCASZzYUxA3ZaMA0GCSqGSIb3DQEBCwUAMB4xHDAaBgNV
BAMTE290aGVudC51cy5hdXRoMC5jb20wHhcNMjMwMzI3MTUwMTQ1WhcNMzYxMjAz
MTUwMTQ1WjAeMRwwGgYDVQQDExNvdGhlbnQudXMuYXV0aDAuY29tMIIBIjANBgkq
hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuMfe7y1WRZNruqTF4tIxgkN/Z5POJPVH
7He1ykzbO+zTVmbb6yhTMsw5wXOqXEner7o/RB4iaY9HWZCeUqQ++keVJmrOmGyW
k8Z3zH/6+i7BmRFJ/JZKLHQA2f4QTGHnV4x38Qo5YdkXyBmepXlspHLwmt6ZnusR
r2dKdXs31BLkviHgKiYdGjJHgBB/nHHceOMbqu96OxtfnK6Tof72Fv1slfrd0wg4
2INHTDL7X1uTLiG8rAQJmoL8CFaqiEOBQXPB56d4ZrLudWOxOgnq5nvaJWhgS73g
ciSQ8ep7dekkXz5SxORELHO+zf4P8mH+6suJawGJm2BdKFBoz4zkcQIDAQABo0Iw
QDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBTjozrzbwQ0004hmoRdkNw/RfZS
pDAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEBACD3YaG9S8m93ikv
B679JndGDcQ1QKXJX2yqAtLwUaJlRhHEbRtXym3J+kIHo1OOK8JAftcbbZq34p+v
p2YZm2gUDTiMQz1QQdKVmjB9TnNYP9jI7b4lupfuDeMntAVAo8b8WCrRQV4voN88
+XvagZ9H3sv7fdPHp1mKGjbpz9uBkXsujdQrdvfjIS5DzYDagyTlNboHQBbbS2bG
czxVhbQzxSOJlvug/pN3uUuyGo8DB4WDtBpb3fSnNAiox1n33E93P6zhyPg5QVSQ
lY/ACXm3UhY5UsRZXEzjoAL/ymM68b6B/85N4Xypve+bUk+Zwb9Ojmwb0pU9azQE
XxRWPy8=
-----END CERTIFICATE-----`
function verifyJWT(JWT, OTHENT_PUBLIC_KEY) {
    const jsonwebtokenPackage = SmartWeave.extensions.jwt
    try {
        const JWT_decoded = jsonwebtokenPackage.verify(JWT, OTHENT_PUBLIC_KEY, { algorithms: ['RS256'] });
        return {status: true, JWT_decoded: JWT_decoded}
    } catch (error) {
        return {status: false, error: error}
    }
}





function verifyJWK(JWK_JWT, JWKPublicKey) {
    const jsonwebtokenPackage = SmartWeave.extensions.jwt
    console.log(JWK_JWT)
    console.log(JWKPublicKey)
    try {
        console.log(JWKPublicKey)
        let pemKey = JWKPublicKey.replace(/\n|\s/g, '');
        pemKey = pemKey.replace(/^-----BEGINPUBLICKEY-----/, '');
        pemKey = pemKey.replace(/-----ENDPUBLICKEY-----$/, '');
        const lines = pemKey.match(/.{1,64}/g);
        const formattedKey = '-----BEGIN PUBLIC KEY-----\n' + lines.join('\n') + '\n-----END PUBLIC KEY-----';
        console.log(formattedKey)
        const JWK_decoded = jsonwebtokenPackage.verify(JWK_JWT, formattedKey, { algorithms: ['RS256'] });
        console.log(JWK_decoded)
        return {status: true, JWK_decoded: JWK_decoded}
    } catch (error) {
        return {status: false, error: error}
    }
}






export async function handle(state, action) {
    const contractInput = action.input



    
    if (contractInput.encryption_type === "JWT") {

        const inputJWT = verifyJWT(contractInput.jwt, OTHENT_PUBLIC_KEY)

        if (inputJWT.status === true) {

            const JWT_decoded = inputJWT.JWT_decoded

            if (JWT_decoded.iat > state.last_nonce) {

                // Add new last nonce
                state.last_nonce = JWT_decoded.iat



                // Initialize contract to a user
                try {
                    if (JWT_decoded.contract_input.function && action.input.function === 'initializeContract' && state.user_id === null && state.contract_address === null) {
                        state.user_id = JWT_decoded.sub;
                        state.contract_address = contractInput.contract_address
                        return { state }
                    }
                } catch (e) {
                    console.log(`Error initializing contract: ${e}`)
                    return { state }
                }


                
                // Broadcast TXN to another warp contract
                try {
                    if (JWT_decoded.contract_input.function && action.input.function === 'sendTransaction' && JWT_decoded.sub === state.user_id) {

                        const toContractId = JWT_decoded.contract_input.data.toContractId;
                        const toContractFunction = JWT_decoded.contract_input.data.toContractFunction;
                        const txnData = JWT_decoded.contract_input.data.txnData;

                        await SmartWeave.contracts.write(toContractId, { 
                            function: toContractFunction, 
                            txnData: txnData }
                        ); 

                        return { state }
                    }
                } catch (e) {
                    console.log(`Error sending transaction: ${e}`)
                    return { state }
                }




                // Backup SCW with external JWK
                try {
                    if (JWT_decoded.contract_input.function && action.input.function === 'initializeJWK' && state.JWK_public_key === null && state.user_id === JWT_decoded.sub) {
                        state.JWK_public_key = JWT_decoded.contract_input.data.JWK_public_key;
                        return { state }
                    }
                } catch (e) {
                    console.log(`Error initializing external JWK: ${e}`)
                    return { state }
                }



            }
            else {
                console.log({status: false, nonce: false, error: 'Invalid nonce'})
                return { state }
            }
        }
        if (inputJWT.status === false) {
            console.log({'Error validating JWT': inputJWT})
            return { state }
        }
    }




    if (contractInput.encryption_type === "JWK") {

        console.log(contractInput.encryption_type)
        console.log(state.JWK_public_key)
        console.log(contractInput.jwt)
        console.log('hello')

        const JWK_public_key = await state.JWK_public_key

        const inputJWK = verifyJWK(contractInput.jwt, JWK_public_key)

        if (inputJWK.status === true) {

            const JWK_decoded = inputJWK.JWK_decoded

            if (JWK_decoded.iat > state.last_nonce) {



                // Add new last nonce
                state.last_nonce = JWK_decoded.iat



                // Backup SCW with external JWK, need to change if block
                try {
                    if (JWK_decoded.contract_input.function && action.input.function === 'JWKBackupTxn') {


                        const toContractId = JWK_decoded.contract_input.data.toContractId;
                        const toContractFunction = JWK_decoded.contract_input.data.toContractFunction;
                        const txnData = JWK_decoded.contract_input.data.txnData;


                        await SmartWeave.contracts.write(toContractId, { 
                            function: toContractFunction, 
                            txnData: txnData }
                        ); 

                        return { state }
                    }
                } catch (e) {
                    console.log(`Error initializing contract: ${e}`)
                    return { state }
                }
            }
            else {
                console.log({status: false, nonce: false, error: 'Invalid nonce'})
                return { state }
            }
        }
        if (inputJWK.status === false) {
            console.log({'Error validating JWK': inputJWK})
            return { state }
        }
    }






    else {
        console.log({status: false, error: 'Error detecting encryption type (JWT or JWK)'})
        return { state }
    }


    








}