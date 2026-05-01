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
    a: "No. The printable QR tags open a secure web URL, so any phone camera can scan them — no app install, no Play Store account, no storage concerns. Maintenance staff and principals can optionally install a PWA for faster access.",
  },
  {
    q: "How is data protected and who can see what?",
    a: "Every role has a scoped view enforced at the database level (row-level security). Teachers see only their reports. Principals see their school. Admins see aggregated maintenance data — never individual PII. Photos are stored in private storage with signed URLs, and passwords are hashed securely.",
  },
  {
    q: "How are QR tags printed and what if one is damaged?",
    a: "Authorized personnel print tags in batches from the dashboard onto weather-resistant sticker stock. If a tag is torn or missing, it can be regenerated and reprinted from the asset's history page — the asset ID never changes, so the repair history stays intact.",
  },
  {
    q: "How do I know if my account has been verified?",
    a: "After registration, you'll see a dedicated 'Awaiting Admin Approval' screen. The Principal reviews all professional metadata — including your Employee ID and Department — before granting access to the dashboard. You'll be able to sign in once your role is authorized.",
  },
  {
    q: "What professional details are required to join?",
    a: "To ensure school security, we require a valid Employee ID, your Department (for Teachers) or Specialization (for Maintenance), and a Phone Number. This helps the Principal verify your identity and allows for faster communication during urgent repairs.",
  },
  {
    q: "Can the Principal assist with scheduling repairs?",
    a: "Yes. While Maintenance staff usually manage their own schedules, the Principal has a 'Force Edit' mode on the shared calendar. This allows for administrative oversight and emergency rescheduling when priorities shift suddenly.",
  },
  {
    q: "How does the system handle urgent or overdue tasks?",
    a: "AssetLink tracks Service Level Agreement (SLA) deadlines for every repair. The calendar uses color-coded workload indicators (Light to Heavy) and highlights overdue tasks in red, ensuring that critical school infrastructure fixes are never forgotten.",
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
