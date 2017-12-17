FROM parity/parity:beta

COPY pw /
COPY blockchain /blockchain

EXPOSE 8545

CMD ["--jsonrpc-cors", "*", "--jsonrpc-apis", "web3,eth,personal", "--jsonrpc-hosts=all", "--no-ui", "--datadir", "/blockchain/", "--chain", "dev", "--unlock", "0x00a329c0648769a73afac7f9381e08fb43dbea72", "--password", "/pw", "--jsonrpc-interface", "0.0.0.0"] 
