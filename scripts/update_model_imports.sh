#!/bin/bash
# Update all Bristh agent routes to use dynamic model client

ROUTES=(
  "src/app/api/bristh/agents/alice/route.ts"
  "src/app/api/bristh/agents/bob/route.ts"
  "src/app/api/bristh/agents/edda/route.ts"
  "src/app/api/bristh/agents/david/route.ts"
  "src/app/api/bristh/agents/fiona/route.ts"
  "src/app/api/bristh/agents/eric/route.ts"
  "src/app/api/bristh/agents/grace/route.ts"
)

for ROUTE in "${ROUTES[@]}"; do
  FILE="/Users/aisandbox/Documents/myAI/$ROUTE"
  if [ -f "$FILE" ]; then
    # Replace OpenAI import and static client with dynamic import
    sed -i '' "s|import OpenAI from 'openai';|import { getModelClient, buildCompletionParams } from '@/lib/model-registry';|g" "$FILE"
    
    # Remove the static openai client instantiation (handles multi-line)
    sed -i '' '/^const openai = new OpenAI/,/^});$/d' "$FILE"
    
    echo "Updated: $ROUTE"
  fi
done
echo "Done."
