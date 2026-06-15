"use client"

/**
 * Hook para chamadas à API com CSRF automático
 * Uso:
 *   const { post, loading, error } = useApi()
 *   const result = await post("/api/leads", { nome, cpf, ... })
 */

import { useState, useCallback, useRef } from "react"

let csrfTokenCache: string | null = null
let csrfFetchPromise: Promise<string> | null = null

async function fetchCsrfToken(): Promise<string> {
  // Evita múltiplos fetches simultâneos
  if (csrfFetchPromise) return csrfFetchPromise

  csrfFetchPromise = fetch("/api/csrf")
    .then(r => r.json())
    .then(d => {
      csrfTokenCache    = d.token
      csrfFetchPromise  = null
      return d.token as string
    })

  return csrfFetchPromise
}

async function getCsrfToken(): Promise<string> {
  if (csrfTokenCache) return csrfTokenCache
  return fetchCsrfToken()
}

export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const request = useCallback(async <T = unknown>(
    method: "POST" | "PUT" | "PATCH" | "DELETE",
    url: string,
    body?: unknown
  ): Promise<{ success: boolean; data?: T; message?: string }> => {
    // Cancela request anterior se ainda estiver em andamento
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      const csrf = await getCsrfToken()

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type":  "application/json",
          "X-CSRF-Token":  csrf,
        },
        body:   body ? JSON.stringify(body) : undefined,
        signal: abortRef.current.signal,
      })

      const json = await res.json()

      if (!res.ok) {
        const msg = json.message ?? `Erro ${res.status}`
        setError(msg)
        return { success: false, message: msg }
      }

      return json
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        return { success: false, message: "Requisição cancelada" }
      }
      const msg = "Erro de conexão. Tente novamente."
      setError(msg)
      return { success: false, message: msg }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    post:   <T = unknown>(url: string, body?: unknown) => request<T>("POST",   url, body),
    put:    <T = unknown>(url: string, body?: unknown) => request<T>("PUT",    url, body),
    patch:  <T = unknown>(url: string, body?: unknown) => request<T>("PATCH",  url, body),
    remove: <T = unknown>(url: string)                 => request<T>("DELETE", url),
  }
}
