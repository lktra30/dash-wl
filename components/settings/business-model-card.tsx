"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { TrendingUp } from "lucide-react"

interface BusinessModelCardProps {
  businessModel: "TCV" | "MRR"
  onBusinessModelChange: (model: "TCV" | "MRR") => void
}

export function BusinessModelCard({ businessModel, onBusinessModelChange }: BusinessModelCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Business Model
        </CardTitle>
        <CardDescription>Select your preferred revenue tracking model</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* MRR Option */}
          <div
            onClick={() => onBusinessModelChange("MRR")}
            className={`
              relative flex flex-col gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all
              ${
                businessModel === "MRR"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/50 hover:bg-accent/50"
              }
            `}
          >
            <div className="flex items-center gap-2">
              <div
                className={`
                  w-4 h-4 rounded-full border-2 flex items-center justify-center
                  ${businessModel === "MRR" ? "border-primary" : "border-muted-foreground"}
                `}
              >
                {businessModel === "MRR" && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
              <Label className="font-semibold cursor-pointer">MRR</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Monthly Recurring Revenue - Track subscription-based revenue month over month
            </p>
          </div>

          {/* TCV Option */}
          <div
            onClick={() => onBusinessModelChange("TCV")}
            className={`
              relative flex flex-col gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all
              ${
                businessModel === "TCV"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/50 hover:bg-accent/50"
              }
            `}
          >
            <div className="flex items-center gap-2">
              <div
                className={`
                  w-4 h-4 rounded-full border-2 flex items-center justify-center
                  ${businessModel === "TCV" ? "border-primary" : "border-muted-foreground"}
                `}
              >
                {businessModel === "TCV" && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
              <Label className="font-semibold cursor-pointer">TCV</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Total Contract Value - Track the full value of contracts over their lifetime
            </p>
          </div>
        </div>

        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> This setting affects how revenue metrics are calculated across your dashboard.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
