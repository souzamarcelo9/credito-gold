import { redirect } from "next/navigation"

// Delega para a API route que faz o rastreamento e redirect
export default async function RefPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`/api/ref/${slug}`)
}
