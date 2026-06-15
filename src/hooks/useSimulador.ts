"use client"

import { useState, useCallback } from "react"
import { PRODUTOS } from "@/config/produtos"
import { simular } from "@/lib/simulador"
import type { ProdutoKey, SimulacaoResult } from "@/types"

interface SimuladorState {
  produto: ProdutoKey
  valor: number
  parcelas: number
  resultado: SimulacaoResult
}

export function useSimulador() {
  const [state, setState] = useState<SimuladorState>(() => {
    const produto = PRODUTOS.pessoal
    const valor = 10000
    const parcelas = 24
    return {
      produto: "pessoal",
      valor,
      parcelas,
      resultado: simular({ produto: "pessoal", valor, parcelas }),
    }
  })

  const setProduto = useCallback((produto: ProdutoKey) => {
    setState(prev => {
      const p = PRODUTOS[produto]
      const valor    = Math.max(p.valorMin, Math.min(prev.valor, p.valorMax))
      const parcelas = Math.max(p.prazoMin, Math.min(prev.parcelas, p.prazoMax))
      return {
        produto,
        valor,
        parcelas,
        resultado: simular({ produto, valor, parcelas }),
      }
    })
  }, [])

  const setValor = useCallback((valor: number) => {
    setState(prev => ({
      ...prev,
      valor,
      resultado: simular({ produto: prev.produto, valor, parcelas: prev.parcelas }),
    }))
  }, [])

  const setParcelas = useCallback((parcelas: number) => {
    setState(prev => ({
      ...prev,
      parcelas,
      resultado: simular({ produto: prev.produto, valor: prev.valor, parcelas }),
    }))
  }, [])

  const produtoConfig = PRODUTOS[state.produto]

  return { ...state, produtoConfig, setProduto, setValor, setParcelas }
}
