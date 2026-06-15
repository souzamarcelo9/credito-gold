import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 font-['Sora'] text-[0.68rem] font-bold uppercase tracking-[0.06em]",
  {
    variants: {
      variant: {
        novo:             "bg-[#ffedd5] text-[#c2410c]",
        em_analise:       "bg-[#dbeafe] text-[#1d4ed8]",
        proposta_enviada: "bg-[#ede9fe] text-[#6d28d9]",
        aprovado:         "bg-[#dcfce7] text-[#15803d]",
        recusado:         "bg-[#f1f5f9] text-[#475569]",
        contrato_assinado:"bg-[#dcfce7] text-[#15803d]",
        pendente:         "bg-[#ffedd5] text-[#c2410c]",
        ativo:            "bg-[#dcfce7] text-[#15803d]",
        inativo:          "bg-[#f1f5f9] text-[#475569]",
        bronze:           "bg-[#fef3c7] text-[#92400e]",
        prata:            "bg-[#f1f5f9] text-[#475569]",
        gold:             "bg-[#fef9c3] text-[#854d0e]",
        diamante:         "bg-[#ede9fe] text-[#6d28d9]",
      },
    },
    defaultVariants: { variant: "novo" },
  }
)

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  className?: string
  children: React.ReactNode
}

export function Badge({ className, variant, children }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {children}
    </span>
  )
}
