"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"

interface LayerToggleProps {
  label: string
  enabled: boolean
  onToggle: (enabled: boolean) => void
  icon?: React.ReactNode
}

export function LayerToggle({ label, enabled, onToggle, icon }: LayerToggleProps) {
  return (
    <Button
      variant={enabled ? "default" : "outline"}
      size="sm"
      onClick={() => onToggle(!enabled)}
      className="flex items-center gap-2"
    >
      {enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      {icon}
      {label}
    </Button>
  )
} 