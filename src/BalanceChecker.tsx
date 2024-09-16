import React, { useState, useEffect } from "react";
import { BrowserProvider, JsonRpcProvider, isAddress, formatUnits } from 'ethers';
import "./style.css"; // Certifique-se de que o caminho está correto

// Definindo o tipo de `window.ethereum`
declare global {
  interface Ethereum {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: Array<any> }) => Promise<any>;
  }

  interface Window {
    ethereum?: Ethereum;
  }
}

const BalanceChecker: React.FC = () => {
  const [accounts, setAccounts] = useState<string[]>([]); // Contas carregadas do backend
  const [balances, setBalances] = useState<{ [key: string]: string }>({}); // Saldos de todas as contas
  const [sortedAccounts, setSortedAccounts] = useState<string[]>([]); // Contas ordenadas
  const [newAddress, setNewAddress] = useState(''); // Novo endereço manual
  const [copiedAddress, setCopiedAddress] = useState(''); // Endereço copiado
  const [searchTerm, setSearchTerm] = useState(''); // Termo de busca
  const [isConnected, setIsConnected] = useState(false); // Status de conexão
  const [error, setError] = useState<string>(""); // Erros gerais
  const [duplicateAddressError, setDuplicateAddressError] = useState(false); // Endereço duplicado
  const [successMessage, setSuccessMessage] = useState(false); // Mensagem de sucesso ao adicionar

  const apiUrl = 'https://x8ki-letl-twmt.n7.xano.io/api:wHmUZQ0X/tabela'; // API do backend
  const provider = typeof window.ethereum !== 'undefined'
    ? new BrowserProvider(window.ethereum!)
    : new JsonRpcProvider("https://flow-testnet.g.alchemy.com/v2/dRr8neFMosh3bQrQHLKzjyHLUpdeX7bK");

  // Função para carregar endereços do backend
  const loadAddressesFromBackend = async () => {
    try {
      const response = await fetch(apiUrl);
      const addresses = await response.json();
      const normalizedAccounts = addresses.map((account: any) => account.address.toLowerCase());
      setAccounts(normalizedAccounts);

      for (const account of normalizedAccounts) {
        await getBalance(account);
      }
    } catch (error) {
      setError("Erro ao carregar endereços do backend");
      console.error(error);
    }
  };

  // Função para consultar o saldo de uma conta Flow
  const getBalance = async (account: string) => {
    try {
      const balance = await provider.getBalance(account);
      const flowBalance = formatUnits(balance, 18);
      setBalances(prev => ({ ...prev, [account]: parseFloat(flowBalance).toFixed(2) }));
    } catch (error) {
      setError("Erro ao consultar saldo");
      console.error(error);
    }
  };

  // Ordena as contas com base no saldo (da maior para a menor)
  const sortAccountsByBalance = () => {
    const sorted = [...accounts].sort((a, b) => {
      const balanceA = parseFloat(balances[a]) || 0;
      const balanceB = parseFloat(balances[b]) || 0;
      return balanceB - balanceA;
    });
    setSortedAccounts(sorted);
  };

  // Função para conectar ao MetaMask e buscar contas
  const connectMetaMask = async () => {
    try {
      const accountsList: string[] = await window.ethereum?.request({ method: "eth_requestAccounts" });
      const normalizedAccounts = accountsList.map(account => account.toLowerCase());
      setAccounts(prev => Array.from(new Set([...prev, ...normalizedAccounts]))); // Evita duplicatas
      setIsConnected(true);
      setError("");

      for (const account of normalizedAccounts) {
        await checkAndAddAddress(account);
        await getBalance(account);
      }
    } catch (error) {
      setError("Erro ao conectar MetaMask");
      console.error(error);
    }
  };

  // Função para verificar e adicionar endereço ao backend
  const checkAndAddAddress = async (address: string) => {
    try {
      const response = await fetch(apiUrl);
      const addresses = await response.json();
      const addressExists = addresses.some((item: any) => item.address.toLowerCase() === address);

      if (!addressExists) {
        await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address })
        });
        console.log(`Endereço ${address} adicionado.`);

        // Exibe a mensagem de sucesso por 3 segundos
        setSuccessMessage(true);
        setTimeout(() => setSuccessMessage(false), 3000);
      } else {
        setDuplicateAddressError(true);
        setTimeout(() => setDuplicateAddressError(false), 3000);
        console.log(`Endereço ${address} já existe.`);
      }
    } catch (error) {
      setError("Erro ao verificar/adicionar endereço no backend");
      console.error(error);
    }
  };

  // Função para adicionar um novo endereço manualmente e enviar para o backend
  const addAddress = async () => {
    const normalizedAddress = newAddress.toLowerCase();
    if (isAddress(normalizedAddress)) {
      if (!accounts.includes(normalizedAddress)) {
        await checkAndAddAddress(normalizedAddress);
        setAccounts(prev => [...prev, normalizedAddress]);
        getBalance(normalizedAddress);
        setNewAddress(''); // Limpa o input
      } else {
        setDuplicateAddressError(true);
        setTimeout(() => setDuplicateAddressError(false), 3000);
      }
    } else {
      setError("Endereço inválido");
    }
  };

  // Busca e filtra contas
  const filterAccounts = () => {
    return searchTerm === '' ? sortedAccounts : sortedAccounts.filter(account => account.includes(searchTerm.toLowerCase()));
  };

  // Função para copiar o endereço para a área de transferência
  const copyAddressToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(''), 3000);
  };

  // Função para desconectar do MetaMask
  const disconnectMetaMask = () => {
    setAccounts([]); // Limpa as contas
    setBalances({}); // Limpa os saldos
    setIsConnected(false); // Desconecta
    setError("");

    if (window.ethereum) {
      window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      }).then(() => console.log("Desconectado"))
        .catch((error: any) => console.error("Erro ao desconectar MetaMask", error));
    }
  };

  // Função para "sair" e recarregar a página
  const handleExit = () => {
    window.location.reload(); // Recarregar a página
  };

  // Carregar endereços do backend e ordenar ao carregar o componente
  useEffect(() => {
    loadAddressesFromBackend(); // Carregar lista de endereços do backend
  }, []);

  // Ordena os endereços sempre que os saldos são atualizados
  useEffect(() => {
    if (Object.keys(balances).length > 0) {
      sortAccountsByBalance(); // Ordena por saldo sempre que o saldo muda
    }
  }, [balances]);

  return (
    <div className="container">
      <header>
        <h1>Ranking das Baleias 🐳</h1>
      </header>

      <section className="input-section">
        <div className="add-address">
          <input
            type="text"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="Adicionar endereço manualmente"
          />
          <button onClick={addAddress}>Adicionar</button>
          <button onClick={connectMetaMask}>Adicionar via MetaMask</button>
        </div>

        <div className="search-bar">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por endereço"
          />
          <button onClick={loadAddressesFromBackend}>Atualizar</button>
        </div>

        <table className="account-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Conta</th>
              <th>Saldo (FLOW)</th>
            </tr>
          </thead>
          <tbody>
            {filterAccounts().map((account, index) => (
              <tr key={account}>
                <td>{index + 1}</td>
                <td>
                  <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
                  <span onClick={() => copyAddressToClipboard(account)} className="copy-icon">
                    📋
                  </span>
                  {copiedAddress === account && <span className="copied-message">Copiado!</span>}
                </td>
                <td>{balances[account] || "Carregando..."}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {isConnected && (
          <>
            {duplicateAddressError && (
              <p className="error-message">Endereço já foi adicionado.</p>
            )}
            {successMessage && (
              <p className="success-message">Endereço adicionado com sucesso!</p>
            )}

            <div className="action-buttons">
              <button onClick={disconnectMetaMask}>Desconectar</button>
              <button onClick={handleExit}>Sair</button>
            </div>
          </>
        )}
      </section>

      <footer>
        <p>Powered by Flow Testnet and Alchemy</p>
      </footer>
    </div>
  );
};

export default BalanceChecker;
