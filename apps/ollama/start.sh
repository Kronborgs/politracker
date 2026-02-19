#!/bin/sh
set -eu

EMBED_MODEL="${EMBED_MODEL:-nomic-embed-text}"
LLM_MODEL="${LLM_MODEL:-qwen2.5:7b-instruct}"
PULL_ON_START="${PULL_ON_START:-true}"

ollama serve &
OLLAMA_PID=$!

until wget -qO- "http://127.0.0.1:11434/api/tags" >/dev/null 2>&1; do
  sleep 1
done

if [ "$PULL_ON_START" = "true" ]; then
  echo "Pulling embed model: $EMBED_MODEL"
  ollama pull "$EMBED_MODEL"

  if [ "$LLM_MODEL" != "$EMBED_MODEL" ]; then
    echo "Pulling llm model: $LLM_MODEL"
    ollama pull "$LLM_MODEL"
  fi
fi

wait "$OLLAMA_PID"
