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
    a: "No. The QR tags open a simple web link in any phone browser. There's no app to install, no account required to scan, and no storage used on your phone. Just scan and view.",
  },
  {
    q: "How is my data protected?",
    a: "We use secure school-level filters. Teachers only see their own reports, while the Principal and Maintenance staff see the full school log. All photos and details are stored securely and are only accessible to authorized staff.",
  },
  {
    q: "How are QR tags printed and what if one is lost?",
    a: "The Principal or Admin can print tags directly from the dashboard onto sticker paper. If a tag is lost or damaged, it can be reprinted instantly — the asset's history is always saved in the system.",
  },
  {
    q: "How do I know if my account is approved?",
    a: "After signing up, your account stays in a 'Pending' state until the Principal verifies your details. Once they confirm your role, you'll be able to log in and start using the dashboard.",
  },
  {
    q: "What details do I need to provide to join?",
    a: "To keep our school records accurate, we ask for your Name, Employee ID, and Department. This ensures that every repair request is tracked back to the right person for easy follow-up.",
  },
  {
    q: "Can the Principal help manage the repair calendar?",
    a: "Yes. While maintenance staff update their own tasks, the Principal has a special 'Force Edit' button to help reschedule urgent repairs or manage the school's priorities.",
  },
  {
    q: "How does the system track urgent problems?",
    a: "Every report is assigned a priority level. The maintenance calendar uses colors to show workload and highlights overdue tasks in red so that important fixes are never missed.",
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
