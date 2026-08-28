# VM CORTES — Frontend

Interface do VM CORTES (conexão de contas, busca de canais, fila de aprovação).
Feito em React + Vite + Tailwind, consumindo a API do backend.

## Como rodar

Isso precisa rodar **ao lado** do backend (`vm-cortes-backend`), em outro terminal.

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173` (ou `http://SEU_IP:5173` se você rodou o
`configurar-rede.sh` do backend — nesse caso acesse pelo IP também no
computador, não pelo localhost, para o QR code funcionar do celular).

## Por que rodar local em vez de usar o preview do chat

O preview de artifact do Claude roda dentro de uma página `https://`. Por
política de segurança do navegador, uma página `https` não consegue chamar
um backend `http://localhost` ou `http://IP-da-rede-local` (mixed content /
Private Network Access). Rodando os dois localmente (frontend em
`http://localhost:5173` e backend em `http://localhost:4000`), tudo fica em
`http://` e essa restrição não existe.

## Ordem de execução recomendada

1. No backend: configure o `.env` (credenciais + `configurar-rede.sh` se for
   usar o QR code), depois `npm install && npm run dev`.
2. Confirme que `src/VMCortes.jsx` está com a constante `API_BASE` apontando
   para o mesmo endereço/porta do backend (o `configurar-rede.sh` já faz
   isso automaticamente se você passar o caminho deste arquivo como
   argumento).
3. Aqui no frontend: `npm install && npm run dev`.
4. Acesse a URL que o Vite mostrar no terminal.
