const NETWORKS = {
    mainnet: {
        name: 'Mainnet',
        apiUrl: 'https://api.trongrid.io',
        contractAddress: 'YOUR_MAINNET_CONTRACT_ADDRESS', // You'll update this later
        apiKey: 'ebcf36ff-5bc4-41ff-9016-5ae5f4bf7d2f',
        headers: {
            'TRON-PRO-API-KEY': 'ebcf36ff-5bc4-41ff-9016-5ae5f4bf7d2f',
            'Accept': 'application/json'
        }
    },
    testnet: {
        name: 'Nile Testnet',
        apiUrl: 'https://nile.trongrid.io',
        contractAddress: 'TPgrjm95VJFNfY3bc6TC9jTCMws3UMWdPy',  // Testnet contract address
        apiKey: null, // Not needed for testnet
        headers: {
            'Accept': 'application/json'
        }
    }
};

const CURRENT_NETWORK = 'testnet'; // Leave as testnet for now, change to 'mainnet' when ready

export { NETWORKS, CURRENT_NETWORK };
