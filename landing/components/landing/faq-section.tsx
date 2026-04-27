import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Reveal } from "./motion"

const FAQS = [
  {
    q: "Do teachers need to install an app to scan QR codes?",
    a: "No. The printable QR tags open a secure web URL, so any phone camera can scan them — no app install, no Play Store account, no storage concerns. Maintenance staff and principals can optionally install a PWA for offline work queues and faster access.",
  },
  {
    q: "What happens when internet connectivity drops?",
    a: "AssetLink is offline-first. Teachers can scan tags, attach photos, and file tickets without a connection — entries queue on the device and sync automatically once the school is back online. The ticket ID and timestamp are preserved, so there's no ambiguity about when damage was reported.",
  },
  {
    q: "How is data protected and who can see what?",
    a: "Every role has a scoped view enforced at the database level (row-level security). Teachers see only their reports. Principals see their school. DepEd supervisors see aggregated division data — never individual PII. Photos are stored in private storage with signed URLs, and passwords are hashed with bcrypt.",
  },
  {
    q: "Does this replace DepEd's existing MOOE or property records?",
    a: "No. AssetLink complements official property records by providing the day-to-day reporting and repair workflow. Exported reports (CSV, PDF) align with DepEd property custodian forms, so your official records stay authoritative and audit-ready.",
  },
  {
    q: "Can a barangay or LGU help fund repairs through the system?",
    a: "Yes. When a ticket exceeds a configurable threshold or is flagged as structural, principals can escalate to the barangay official's view. Barangay users get a monitoring dashboard — no editing rights on school data — so accountability stays with the school.",
  },
  {
    q: "How are QR tags printed and what if one is damaged?",
    a: "Admins print tags in batches from the admin dashboard onto weather-resistant sticker stock. If a tag is torn or missing, any authorized user can regenerate and reprint it from the asset's history page — the asset ID never changes, so the repair history stays intact.",
  },
  {
    q: "What is the commitment for Guiwan Elementary staff?",
    a: "The system is designed for daily use. Teachers only need a 5-minute orientation to start reporting. Our maintenance team uses standard office equipment to manage repairs. No hardware purchase is required beyond the phones staff already carry.",
  },
  {
    q: "Is AssetLink open to other government or NGO use cases?",
    a: "The core asset → scan → ticket → repair → verify flow generalizes well to barangay halls, rural health units, and day-care centers. We're prioritizing Guiwan Elementary first as our flagship implementation, but the codebase is structured for future scaling.",
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="border-b border-border/60 bg-background">
      <div className="w-full px-6 py-20 md:px-12 md:py-24 lg:px-16">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-medium tracking-wide text-primary uppercase">
              Frequently asked
            </p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight text-balance md:text-4xl">
              Questions our teachers and staff usually ask.
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground md:text-lg">
              Straight answers on connectivity, privacy, and how AssetLink works for our school.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <Accordion
            type="single"
            collapsible
            className="mt-10 divide-y divide-border rounded-2xl border border-border bg-card"
            defaultValue="item-0"
          >
            {FAQS.map((item, i) => (
              <AccordionItem
                key={item.q}
                value={`item-${i}`}
                className="border-0 px-5 first:rounded-t-2xl last:rounded-b-2xl"
              >
                <AccordionTrigger className="py-5 text-left text-base font-medium text-foreground hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Have another question?{" "}
          <a className="text-primary underline-offset-4 hover:underline" href="#demo">
            Ask your school IT coordinator
          </a>
          .
        </p>
      </div>
    </section>
  )
}
