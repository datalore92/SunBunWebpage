const SBUN_CONTRACT_ADDRESS = 'YOUR_TOKEN_CONTRACT_ADDRESS';

class TokenDApp {
    constructor() {
        this.tronWeb = null;
        this.contract = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        if (window.tronLink?.ready) {
            await this.connectWallet();
        }
    }

    setupEventListeners() {
        document.getElementById('connect-wallet').addEventListener('click', () => this.connectWallet());
        document.getElementById('transfer').addEventListener('click', () => this.transfer());
    }

    async connectWallet() {
        try {
            if (!window.tronLink) {
                throw new Error('Please install TronLink wallet');
            }

            if (!window.tronLink.ready) {
                await window.tronLink.request({ method: 'tron_requestAccounts' });
            }

            this.tronWeb = window.tronLink.tronWeb;
            const address = this.tronWeb.defaultAddress.base58;
            
            if (!address) {
                throw new Error('Please unlock your wallet');
            }

            document.getElementById('connect-wallet').textContent = 'Connected';
            document.getElementById('wallet-address').textContent = `Connected: ${address}`;
            
            await this.loadContract();
            await this.updateBalance();
        } catch (err) {
            console.error('Connection error:', err);
            document.getElementById('wallet-address').textContent = `Error: ${err.message}`;
        }
    }

    async loadContract() {
        this.contract = await this.tronWeb.contract().at(SBUN_CONTRACT_ADDRESS);
    }

    async updateBalance() {
        if (!this.contract) return;
        const address = this.tronWeb.defaultAddress.base58;
        const balance = await this.contract.balanceOf(address).call();
        document.getElementById('token-balance').textContent = 
            `SBUN Balance: ${this.tronWeb.fromSun(balance)}`;
    }

    async transfer() {
        if (!this.contract) return;
        const recipient = document.getElementById('recipient').value;
        const amount = document.getElementById('amount').value;
        
        try {
            const tx = await this.contract.transfer(
                recipient,
                this.tronWeb.toSun(amount)
            ).send();
            alert('Transfer successful!');
            await this.updateBalance();
        } catch (err) {
            alert('Transfer failed: ' + err.message);
        }
    }
}

// Initialize dApp
new TokenDApp();
