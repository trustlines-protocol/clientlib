FROM parity/parity:stable

COPY pw /
COPY blockchain /data

EXPOSE 8545

CMD ["--jsonrpc-cors", "*", "--jsonrpc-apis", "web3,eth,personal,parity", "--jsonrpc-hosts=all", "--base-path=/data/", "--config", "dev", "--unlock", "0x00a329c0648769a73afac7f9381e08fb43dbea72", "--password=/pw", "--jsonrpc-interface", "0.0.0.0"]
