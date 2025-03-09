const SBUN_CONTRACT_ADDRESS = 'TPgrjm95VJFNfY3bc6TC9jTCMws3UMWdPy';
const TOKEN_DECIMALS = 18;  // Changed from 6 to 18

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
        try {
            const balance = await this.contract.balanceOf(address).call();
            // Convert from BigNumber to string first
            const balanceString = balance.toString();
            // Insert decimal point in the correct position
            const decimalPos = balanceString.length - TOKEN_DECIMALS;
            let formattedBalance;
            if (decimalPos <= 0) {
                formattedBalance = "0." + "0".repeat(-decimalPos) + balanceString;
            } else {
                formattedBalance = balanceString.slice(0, decimalPos) + "." + balanceString.slice(decimalPos);
            }
            // Remove trailing zeros and decimal if whole number
            formattedBalance = parseFloat(formattedBalance).toString();
            document.getElementById('token-balance').textContent = 
                `SBUN Balance: ${formattedBalance}`;
        } catch (err) {
            console.error('Error getting balance:', err);
        }
    }

    async transfer() {
        if (!this.contract) return;
        const recipient = document.getElementById('recipient').value;
        const amount = document.getElementById('amount').value;
        
        try {
            // Convert amount to raw token value (considering 18 decimals)
            const rawAmount = this.tronWeb.toBigNumber(amount)
                .multipliedBy(this.tronWeb.toBigNumber(10).pow(TOKEN_DECIMALS))
                .toString();
            
            const tx = await this.contract.transfer(
                recipient,
                rawAmount
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
