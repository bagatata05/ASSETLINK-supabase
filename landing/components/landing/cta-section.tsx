"use client"

import { useState } from "react"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Reveal } from "./motion"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase"

export function CtaSection() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResult, setSearchResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTrack = async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    setError(null)
    setSearchResult(null)

    try {
      const { data, error } = await supabase
        .from("repair_requests")
        .select("*")
        .or(`asset_code.ilike.%${searchQuery}%,request_number.ilike.%${searchQuery}%`)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          setError("No request found for that ID.")
        } else {
          setError("Error fetching status. Please try again.")
        }
      } else {
        setSearchResult(data)
      }
    } catch (err) {
      setError("An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="demo" className="border-b border-border/60">
      <div className="w-full px-6 py-20 md:px-12 md:py-24 lg:px-16">
        <Reveal className="grid gap-10 rounded-3xl border border-border bg-card p-8 md:p-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium tracking-wide text-primary uppercase">School Service Portal</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight text-balance md:text-4xl">
              Restore Guiwan Elementary, one QR at a time.
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground md:text-lg">
              Maintenance is now just a scan away. Report broken assets, track restoration progress, 
              and keep our classrooms safe for our students.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              {[
                "Instant notifications to Maintenance Head",
                "Real-time progress tracking for teachers",
                "Automated reports for school administration",
              ].map((i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-primary" aria-hidden="true" />
                  {i}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-secondary/30 p-8 flex flex-col justify-center gap-6">
            <div className="space-y-3">
              <h3 className="font-serif text-xl font-bold">Quick Report</h3>
              <p className="text-sm text-muted-foreground">Found something broken? Start a repair request instantly.</p>
              <Button 
                className="w-full h-12 text-lg font-semibold group shadow-lg shadow-primary/10"
                asChild
              >
                <a href={process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:5173"}>
                  Report a Problem
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-bold tracking-widest">OR CHECK STATUS</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Already reported? Enter your Asset ID or Request # to track progress.</p>
              <div className="flex gap-2">
                <InputGroup className="flex-1">
                  <InputGroupInput 
                    placeholder="e.g. CHR-042 or REQ-001" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                  />
                </InputGroup>
                <Button 
                  variant="secondary" 
                  className="px-6"
                  onClick={handleTrack}
                  disabled={loading}
                >
                  {loading ? "..." : "Track"}
                </Button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-destructive font-medium"
                  >
                    {error}
                  </motion.p>
                )}

                {searchResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Current Status</p>
                        <p className="text-lg font-bold text-foreground capitalize">{searchResult.status}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Asset</p>
                        <p className="text-sm font-medium">{searchResult.asset_name}</p>
                      </div>
                    </div>
                    {searchResult.maintenance_notes && (
                      <div className="mt-3 border-t border-primary/10 pt-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Maintenance Note</p>
                        <p className="text-xs italic text-muted-foreground mt-1">&ldquo;{searchResult.maintenance_notes}&rdquo;</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <p className="text-[10px] text-center text-muted-foreground italic">
              Official Asset Management System of Guiwan Elementary School
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
