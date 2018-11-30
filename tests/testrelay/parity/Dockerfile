FROM parity/parity:stable

USER parity

WORKDIR /home/parity

COPY --chown=parity pw /home/parity/pw
COPY --chown=parity blockchain /home/parity/chaindata

EXPOSE 8545

ENTRYPOINT ["/entrypoint.sh"]

