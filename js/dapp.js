import { NETWORKS, CURRENT_NETWORK } from './config.js';

const TOKEN_DECIMALS = 18;  // Changed from 6 to 18

class TokenDApp {
    constructor() {
        this.tronWeb = null;
        this.contract = null;
        this.currentFilter = 'all';
        this.network = NETWORKS[CURRENT_NETWORK];
        this.init();
    }

    async init() {
        // Update network display
        document.getElementById('network-name').textContent = this.network.name;
        document.querySelector('.network-indicator').classList.add(CURRENT_NETWORK);
        
        this.setupEventListeners();
        if (window.tronLink?.ready) {
            await this.connectWallet();
        }
        this.setupTransactionFilters();
    }

    setupEventListeners() {
        document.getElementById('connect-wallet').addEventListener('click', () => this.connectWallet());
        document.getElementById('transfer').addEventListener('click', () => this.transfer());
        window.addEventListener('scroll', () => this.handleTransactionScroll());
    }

    setupTransactionFilters() {
        const filters = document.querySelectorAll('.filter-btn');
        filters.forEach(btn => {
            btn.addEventListener('click', () => {
                filters.forEach(f => f.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.type;
                this.updateTransactionHistory();
            });
        });
    }

    async getTransactionHistory(address, limit = 50) {
        try {
            const listElement = document.querySelector('.transactions-list');
            listElement.innerHTML = '<p>Loading transactions...</p>';

            // Use network configuration
            const [incomingTx, outgoingTx] = await Promise.all([
                fetch(`${this.network.apiUrl}/v1/accounts/${address}/transactions/trc20?limit=${limit}&contract_address=${this.network.contractAddress}&only_to=true`, 
                    { headers: this.network.headers }),
                fetch(`${this.network.apiUrl}/v1/accounts/${address}/transactions/trc20?limit=${limit}&contract_address=${this.network.contractAddress}&only_from=true`, 
                    { headers: this.network.headers })
            ]);

            // Add debug logging
            console.log('Incoming response:', await incomingTx.clone().json());
            console.log('Outgoing response:', await outgoingTx.clone().json());

            const incomingData = await incomingTx.json();
            const outgoingData = await outgoingTx.json();

            // Combine and sort transactions
            const allTx = [...(incomingData.data || []), ...(outgoingData.data || [])]
                .sort((a, b) => b.block_timestamp - a.block_timestamp);

            if (allTx.length === 0) {
                listElement.innerHTML = '<p>No transactions found</p>';
                return [];
            }

            return allTx;
        } catch (err) {
            console.error('Error fetching transaction history:', err);
            document.querySelector('.transactions-list').innerHTML = 
                `<p>Error loading transactions: ${err.message}</p>`;
            return [];
        }
    }

    async updateTransactionHistory() {
        if (!this.tronWeb?.defaultAddress?.base58) {
            document.querySelector('.transactions-list').innerHTML = 
                '<p>Please connect your wallet first</p>';
            return;
        }
        
        const address = this.tronWeb.defaultAddress.base58;
        const transactions = await this.getTransactionHistory(address);
        const listElement = document.querySelector('.transactions-list');
        
        if (!transactions.length) return; // Error message already shown in getTransactionHistory
        
        listElement.innerHTML = '';
        
        transactions
            .filter(tx => this.filterTransaction(tx))
            .forEach(tx => {
                const isSent = tx.from === address;
                if (this.currentFilter !== 'all' && 
                    ((this.currentFilter === 'sent' && !isSent) || 
                     (this.currentFilter === 'received' && isSent))) {
                    return;
                }

                const amount = this.formatAmount(tx.value);
                const date = new Date(tx.block_timestamp).toLocaleString();
                
                const element = document.createElement('div');
                element.className = 'transaction-item';
                element.innerHTML = `
                    <div class="transaction-type ${isSent ? 'sent' : 'received'}">
                        ${isSent ? '↑ Sent' : '↓ Received'}
                    </div>
                    <div class="transaction-details">
                        <div>${isSent ? 'To' : 'From'}: ${this.shortenAddress(isSent ? tx.to : tx.from)}</div>
                        <div class="transaction-date">${date}</div>
                    </div>
                    <div class="transaction-amount">
                        ${isSent ? '-' : '+'} ${amount} SBUN
                    </div>
                `;
                
                listElement.appendChild(element);
            });
    }

    shortenAddress(address) {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    filterTransaction(tx) {
        const address = this.tronWeb.defaultAddress.base58;
        switch(this.currentFilter) {
            case 'sent':
                return tx.from === address;
            case 'received':
                return tx.to === address;
            default:
                return true;
        }
    }

    formatAmount(value) {
        return (parseFloat(value) / Math.pow(10, TOKEN_DECIMALS)).toFixed(2);
    }

    handleTransactionScroll() {
        // Add infinite scroll logic here if needed
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
            await this.updateTransactionHistory();
        } catch (err) {
            console.error('Connection error:', err);
            document.getElementById('wallet-address').textContent = `Error: ${err.message}`;
        }
    }

    async loadContract() {
        this.contract = await this.tronWeb.contract().at(this.network.contractAddress);
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
            await this.updateTransactionHistory();
        } catch (err) {
            alert('Transfer failed: ' + err.message);
        }
    }
}

// Initialize dApp
new TokenDApp();
