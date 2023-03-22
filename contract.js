// Othent.io Warp SCW
// Email - lj@communitylabs.com




function verifyJWT(JWT, PUBLIC_KEY) {
    const jwt = SmartWeave.extensions.jwt
    try {
        const verifying = jwt.verify(JWT, PUBLIC_KEY, { algorithms: ['RS256'] });
        return verifying
    } catch (e) {
        console.log(`Error verifying JWT: ${e}`)
        return false
    }
}


export async function handle(state, action) {
    const contractInput = action.input

    console.log({'HELLLOOO': state})
    console.log({'MENNNNN': contractInput})

    const inputJWT = verifyJWT(contractInput.jwt, state.othent_signature)

    if (inputJWT !== false) {

        // Initialize contract to a user
        try {
            if (inputJWT.contract_input.function === 'initializeContract' && state.user_id === null && state.contract_address === null) {
                state.user_id = inputJWT.sub;
                state.contract_address = contractInput.contract_address
                return { state }
            }
        } catch (e) {
            console.log(`Error initializing contract: ${e}`)
            return { state }
        }


        
        // Broadcast TXN to another warp contract
        try {
            if (inputJWT.contract_input.function === 'broadcastTxn' && inputJWT.sub === state.user_id) {
                // interact with other contract
                const toContractId = inputJWT.contract_input.data.toContractId;
                const toContractFunction = inputJWT.contract_input.data.toContractFunction;
                const txnData = inputJWT.contract_input.data.txnData;

                // const transaction_id = await SmartWeave.contracts.write(toContractId, { 
                //     function: toContractFunction, 
                //     txnData: txnData }
                // ); 

                const transaction_id = 'helloPop' 

                return { transaction_id: transaction_id }
            }
        } catch (e) {
            console.log(`Error broadcasting transaction: ${e}`)
            return { state }
        }

    } else {
        return {'Invalid JWT, Othent.io did not sign this': inputJWT}
    }
}
