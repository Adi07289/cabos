"use client";

import { Bell, Plus, Minus } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  SheetContent,
} from "@/components/ui/dialog";
import { IconButton } from "@/components/ui/icon-button";
import { Kbd } from "@/components/ui/kbd";
import { Progress } from "@/components/ui/progress";
import { RingProgress } from "@/components/ui/ring-progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 py-5 md:grid-cols-[10rem_1fr] md:items-center">
      <p className="text-label text-text-3 uppercase">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export function ComponentsGallery() {
  const [chips, setChips] = useState<string[]>(["Idle"]);
  const [on, setOn] = useState(true);
  const [ring, setRing] = useState(0.6);
  const toggleChip = (c: string) => setChips((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));

  return (
    <TooltipProvider delayDuration={300}>
      <div className="divide-y divide-border">
        <Row label="Button · office">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Disabled</Button>
        </Row>
        <Row label="Button · cab">
          <Button size="cab">Start shift</Button>
          <Button size="cab" variant="secondary">
            Log near miss
          </Button>
          <IconButton label="Notifications" size="icon-cab" variant="secondary">
            <Bell aria-hidden className="size-6" />
          </IconButton>
        </Row>
        <Row label="Badge">
          {(["neutral", "safe", "caution", "danger", "stop", "info", "accent"] as const).map((tone) => (
            <Badge key={tone} tone={tone}>
              {tone}
            </Badge>
          ))}
        </Row>
        <Row label="Chip">
          {["Idle", "Fuel", "Seatbelt", "Proximity"].map((c) => (
            <Chip key={c} selected={chips.includes(c)} onClick={() => toggleChip(c)}>
              {c}
            </Chip>
          ))}
        </Row>
        <Row label="Switch">
          <Switch id="demo-switch" checked={on} onCheckedChange={setOn} />
          <label htmlFor="demo-switch" className="text-body-sm text-text-2">
            {on ? "On" : "Off"}
          </label>
          <Switch disabled aria-label="Disabled switch" />
        </Row>
        <Row label="Tabs">
          <Tabs defaultValue="today" className="w-full max-w-md">
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
            <TabsContent value="today" className="pt-3 text-body-sm text-text-2">
              Tab panels switch without a page load.
            </TabsContent>
            <TabsContent value="week" className="pt-3 text-body-sm text-text-2">
              Keyboard: arrow keys move between tabs.
            </TabsContent>
            <TabsContent value="month" className="pt-3 text-body-sm text-text-2">
              Focus rings follow design §8.
            </TabsContent>
          </Tabs>
        </Row>
        <Row label="Dialog · sheet">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle className="text-h3">Dialog</DialogTitle>
              <DialogDescription className="mt-2 text-body text-text-2">
                Focus is trapped inside and returns to the trigger on close. Press <Kbd>Esc</Kbd> to close.
              </DialogDescription>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Open bottom sheet</Button>
            </DialogTrigger>
            <SheetContent>
              <DialogTitle className="text-h3">Bottom sheet</DialogTitle>
              <DialogDescription className="mt-2 text-body text-text-2">
                The cab pattern for secondary tasks: within one-hand reach at the bottom of the screen.
              </DialogDescription>
            </SheetContent>
          </Dialog>
        </Row>
        <Row label="Tooltip · office only">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost">Hover or focus me</Button>
            </TooltipTrigger>
            <TooltipContent>Tooltips never appear in Cab Mode: there is no hover in a cab.</TooltipContent>
          </Tooltip>
        </Row>
        <Row label="Progress">
          <div className="flex w-full max-w-md items-center gap-4">
            <IconButton label="Decrease" variant="secondary" onClick={() => setRing((r) => Math.max(0, r - 0.1))}>
              <Minus aria-hidden className="size-4" />
            </IconButton>
            <RingProgress value={ring} label="Ring progress" tone={ring < 1 ? "caution" : "safe"}>
              <span className="tabular font-numeral text-numeral-md">{Math.round(ring * 100)}</span>
            </RingProgress>
            <IconButton label="Increase" variant="secondary" onClick={() => setRing((r) => Math.min(1, r + 0.1))}>
              <Plus aria-hidden className="size-4" />
            </IconButton>
            <Progress value={ring * 100} label="Linear progress" className="flex-1" />
          </div>
        </Row>
        <Row label="Skeleton">
          <div className="flex w-full max-w-md flex-col gap-2" aria-label="Loading example">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </Row>
        <Row label="Separator · kbd">
          <span className="text-body-sm">Director</span>
          <Separator orientation="vertical" className="h-5" />
          <Kbd>D</Kbd>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </Row>
      </div>
    </TooltipProvider>
  );
}
