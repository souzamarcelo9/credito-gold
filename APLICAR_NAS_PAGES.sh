#!/bin/bash
# Execute na raiz do projeto para corrigir o margin-left de todas as pages
# Substitui ml-[260px] pela versão responsiva

find src/app/\(dashboard\) -name "*.tsx" -exec \
  sed -i 's/ml-\[260px\]/ml-0 pt-14 lg:ml-[240px] lg:pt-0/g' {} \;

echo "✅ margin-left corrigido em todas as pages do dashboard"
echo "   Desktop: ml-[240px] (sidebar 240px)"  
echo "   Mobile:  pt-14 (header 56px) sem margin"
