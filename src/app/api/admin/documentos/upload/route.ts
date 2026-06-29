import { NextRequest } from "next/server"
import { ok, err } from "@/lib/api-helpers"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file     = formData.get("file") as File | null
    const docId    = formData.get("docId") as string | null

    if (!file) return err("Arquivo obrigatório", 400)

    // Valida tipo
    const ALLOWED = ["application/pdf","image/jpeg","image/png","image/webp",
      "application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]
    if (!ALLOWED.includes(file.type)) return err("Tipo de arquivo não permitido. Use PDF, imagem ou documento Office.", 400)

    // Valida tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) return err("Arquivo muito grande. Máximo 10MB.", 400)

    // Gera nome único
    const ext      = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const path     = `documentos/${fileName}`

    // Upload para Supabase Storage
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      // Fallback: salva só o nome se não tiver Supabase configurado
      const prisma = (await import("@/lib/prisma")).default
      if (prisma && docId) {
        await (prisma as any).documentoInterno.update({
          where: { id: docId },
          data:  { arquivoNome: file.name },
        })
      }
      return ok({ url: null, nome: file.name }, "Nome do arquivo salvo (Storage não configurado)")
    }

    const bytes = await file.arrayBuffer()
    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/credito-gold/${path}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": file.type,
          "x-upsert": "false",
        },
        body: bytes,
      }
    )

    if (!uploadRes.ok) {
      const errBody = await uploadRes.text()
      console.error("[upload] Supabase error:", errBody)
      return err("Erro ao fazer upload no Storage", 500)
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/credito-gold/${path}`

    // Atualiza o documento com URL e nome
    if (docId) {
      const prisma = (await import("@/lib/prisma")).default
      if (prisma) {
        await (prisma as any).documentoInterno.update({
          where: { id: docId },
          data:  { arquivoUrl: publicUrl, arquivoNome: file.name },
        })
      }
    }

    return ok({ url: publicUrl, nome: file.name }, "Upload realizado com sucesso!")
  } catch (e) {
    console.error("[upload POST]", e)
    return err("Erro no upload", 500)
  }
}
