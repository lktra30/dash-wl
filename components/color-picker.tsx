"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Palette } from "lucide-react"

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
}

const presetColors = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Violet
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#f97316", // Orange
  "#ec4899", // Pink
  "#6366f1", // Indigo
]

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
            <div className="w-4 h-4 rounded border" style={{ backgroundColor: value }} />
            <Palette className="w-4 h-4" />
            <span className="flex-1 text-left">{value}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-4">
            <div>
              <Label htmlFor="color-input">Custom Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="color-input"
                  type="color"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-12 h-10 p-1 border rounded"
                />
                <Input
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label>Preset Colors</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: color,
                      borderColor: value === color ? "#000" : "transparent",
                    }}
                    onClick={() => {
                      onChange(color)
                      setIsOpen(false)
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
