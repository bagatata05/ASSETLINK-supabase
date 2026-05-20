"use client"

import { useRef, useState, useEffect } from "react"
import { TrendingDown, TrendingUp } from "lucide-react"
import { useInView } from "framer-motion"
import { supabase } from "@/lib/supabase"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Reveal, StaggerGroup, StaggerItem } from "./motion"
import { Counter } from "./counter"

const mockResolutionData = [
  { month: "Oct", days: 5.8 },
  { month: "Nov", days: 4.9 },
  { month: "Dec", days: 4.1 },
  { month: "Jan", days: 3.4 },
  { month: "Feb", days: 2.6 },
  { month: "Mar", days: 1.8 },
]

const resolutionConfig: ChartConfig = {
  days: { label: "Avg. resolution (days)", color: "var(--primary)" },
}

const mockInventoryData = [
  { type: "Furniture", count: 2 },
  { type: "Electronics", count: 2 },
]

const inventoryConfig: ChartConfig = {
  count: { label: "Assets", color: "var(--primary)" },
}

const mockStatusData = [
  { name: "Resolved", value: 128, fill: "var(--primary)" },
  { name: "In progress", value: 28, fill: "color-mix(in oklch, var(--primary) 55%, white)" },
  { name: "Open", value: 14, fill: "var(--accent)" },
]

const statusConfig: ChartConfig = {
  value: { label: "Tickets" },
  Resolved: { label: "Resolved", color: "var(--primary)" },
  "In progress": { label: "In progress", color: "var(--primary)" },
  Open: { label: "Open", color: "var(--accent)" },
}

export function AnalyticsPreview() {
  const [resolutionData, setResolutionData] = useState<any[]>(mockResolutionData)
  const [inventoryData, setInventoryData] = useState<any[]>(mockInventoryData)
  const [statusData, setStatusData] = useState<any[]>(mockStatusData)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: reqData }, { data: assetData }] = await Promise.all([
          supabase.from('repair_requests').select('status,created_at,completed_at'),
          supabase.from('assets').select('category')
        ]);
        
        if (!reqData || !assetData) return;

        // 1. Status Data
        const resolved = reqData.filter((r: any) => r.status === 'Completed').length;
        const inProgress = reqData.filter((r: any) => r.status === 'In Progress').length;
        const open = reqData.filter((r: any) => r.status === 'Pending').length;
        
        setStatusData([
          { name: "Resolved", value: resolved, fill: "var(--primary)" },
          { name: "In progress", value: inProgress, fill: "color-mix(in oklch, var(--primary) 55%, white)" },
          { name: "Open", value: open, fill: "var(--accent)" },
        ]);

        // 2. Inventory Data
        const categories = ['Furniture', 'Electronics', 'Laboratory Equipment', 'Sports Equipment', 'Books & Materials', 'Appliances', 'Structural', 'Other'];
        const inventoryCounts = categories.map(type => {
          const count = assetData.filter((a: any) => a.category === type).length;
          return { type, count };
        }).filter((d: any) => d.count > 0).sort((a: any, b: any) => b.count - a.count).slice(0, 6);

        if (assetData.length > 0) {
          setInventoryData(inventoryCounts);
        } else {
          setInventoryData(mockInventoryData);
        }

        // 3. Resolution Data (Avg days per month for last 6 months)
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const now = new Date();
        const last6Months = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
          return {
             month: monthNames[d.getMonth()],
             year: d.getFullYear(),
             monthIndex: d.getMonth(),
             totalDays: 0,
             count: 0
          };
        });

        reqData.filter((r: any) => r.status === 'Completed' && r.created_at && r.completed_at).forEach((r: any) => {
           const created = new Date(r.created_at!);
           const completed = new Date(r.completed_at!);
           const days = (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
           
           const targetMonth = last6Months.find(m => m.year === completed.getFullYear() && m.monthIndex === completed.getMonth());
           if (targetMonth) {
              targetMonth.totalDays += days;
              targetMonth.count += 1;
           }
        });

        const resData = last6Months.map(m => ({
           month: m.month,
           days: m.count > 0 ? Number((m.totalDays / m.count).toFixed(1)) : 0
        }));
        
        setResolutionData(resData);

      } catch (error) {
        console.error("Error fetching analytics data:", error);
      }
    };
    
    fetchData();
  }, []);

  const statusTotal = statusData.reduce((acc: number, d: any) => acc + d.value, 0)
  const avgDays = resolutionData.length > 0 ? Number((resolutionData.reduce((acc: number, d: any) => acc + d.days, 0) / resolutionData.length).toFixed(1)) : 0;
  const totalAssets = inventoryData.reduce((acc: number, d: any) => acc + d.count, 0);

  const containerRef = useRef(null)
  const isVisible = useInView(containerRef, { amount: 0.3, once: false })

  return (
    <section id="analytics" ref={containerRef} className="border-b border-border/60 overflow-hidden">
      <div className="w-full px-4 py-16 md:px-12 md:py-24 lg:px-16">
        <Reveal once={false}>
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-wide text-primary uppercase">Analytics & reporting</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight text-balance md:text-4xl">
              Turn years of paper trails into decisions you can defend.
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground md:text-lg">
              Principals and school administrators get the same ground-truth data —
              where damage concentrates, how fast it gets resolved, and where resources are actually
              needed next.
            </p>
          </div>
        </Reveal>

        <StaggerGroup
          className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          staggerChildren={0.15}
          delayChildren={0.1}
          once={false}
        >
          {/* Resolution time */}
          <StaggerItem as="article" className="rounded-2xl border border-border bg-card p-4 sm:p-5 transition-shadow duration-300 hover:shadow-md">
            <header className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Avg. resolution time</p>
                <div className="mt-1 flex items-baseline gap-2 font-serif text-2xl sm:text-3xl">
                  <Counter to={avgDays} decimals={1} suffix="d" duration={1.5} once={false} />
                  <span className="inline-flex items-center gap-0.5 text-xs font-sans font-medium text-primary">
                    <TrendingDown className="h-3 w-3" aria-hidden="true" />
                    −69%
                  </span>
                </div>
              </div>
              <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground shrink-0">
                Last 6 months
              </span>
            </header>
            <ChartContainer config={resolutionConfig} className="mt-4 h-40 sm:h-44 w-full">
              <LineChart 
                key={isVisible ? "visible" : "hidden"}
                data={isVisible ? resolutionData : []} 
                margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  minTickGap={10}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Line
                  type="monotone"
                  dataKey="days"
                  stroke="var(--color-days)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--color-days)" }}
                  activeDot={{ r: 5 }}
                  animationDuration={1500}
                  animationBegin={200}
                />
              </LineChart>
            </ChartContainer>
          </StaggerItem>

          {/* Inventory Distribution */}
          <StaggerItem as="article" className="rounded-2xl border border-border bg-card p-4 sm:p-5 transition-shadow duration-300 hover:shadow-md">
            <header className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Asset inventory distribution</p>
                <div className="mt-1 flex items-baseline gap-2 font-serif text-2xl sm:text-3xl">
                  <Counter to={totalAssets} duration={1.2} once={false} />
                  <span className="inline-flex items-center gap-0.5 text-xs font-sans font-medium text-muted-foreground">
                    registered assets
                  </span>
                </div>
              </div>
              <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground shrink-0">
                By category
              </span>
            </header>
            <ChartContainer config={inventoryConfig} className="mt-4 h-40 sm:h-44 w-full">
              <BarChart 
                key={isVisible ? "visible" : "hidden"}
                data={isVisible ? inventoryData : []} 
                margin={{ top: 8, right: 4, left: -24, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="type"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
                  interval="preserveStartEnd"
                  minTickGap={5}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                />
                <ChartTooltip cursor={{ fill: "var(--secondary)" }} content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="count" 
                  fill="var(--color-count)" 
                  radius={[6, 6, 0, 0]} 
                  animationDuration={1200}
                  animationBegin={400}
                />
              </BarChart>
            </ChartContainer>
          </StaggerItem>

          {/* Status mix */}
          <StaggerItem as="article" className="rounded-2xl border border-border bg-card p-4 sm:p-5 transition-shadow duration-300 hover:shadow-md md:col-span-2 lg:col-span-1">
            <header className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Ticket status mix</p>
                <p className="mt-1 font-serif text-2xl sm:text-3xl">
                  <Counter to={statusTotal} duration={1.2} once={false} />
                </p>
                <p className="text-xs text-muted-foreground">tickets tracked</p>
              </div>
              <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground shrink-0">
                This term
              </span>
            </header>
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-6 sm:gap-4">
              <ChartContainer config={statusConfig} className="h-32 w-32 sm:h-36 sm:w-36 shrink-0">
                <PieChart key={isVisible ? "visible" : "hidden"}>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                  <Pie
                    data={isVisible ? statusData : []}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={2}
                    strokeWidth={0}
                    animationDuration={1000}
                    animationBegin={600}
                  >
                    {statusData.map((entry: any) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <ul className="w-full sm:flex-1 space-y-2 text-xs">
                {statusData.map((s: any) => (
                  <li key={s.name} className="flex items-center justify-between gap-2 py-1 border-b border-border/40 last:border-0 sm:border-0">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: s.fill }}
                        aria-hidden="true"
                      />
                      {s.name}
                    </span>
                    <span className="font-mono text-foreground font-semibold">{isVisible ? <Counter to={s.value} duration={1} once={false} /> : 0}</span>
                  </li>
                ))}
              </ul>
            </div>
          </StaggerItem>
        </StaggerGroup>
      </div>
    </section>
  )
}
