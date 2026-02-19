FROM ollama/ollama:latest

COPY apps/ollama/start.sh /usr/local/bin/politracker-ollama-start.sh
RUN chmod +x /usr/local/bin/politracker-ollama-start.sh

EXPOSE 11434
ENTRYPOINT ["/usr/local/bin/politracker-ollama-start.sh"]
