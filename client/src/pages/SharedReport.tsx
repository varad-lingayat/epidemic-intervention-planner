import { DownloadScenarioPdf } from "@/components/DownloadScenarioPdf";
import { ScenarioReportPreview } from "@/components/ScenarioReportPreview";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import type { ScenarioReportPayload } from "@shared/epidemic";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { Link, useRoute } from "wouter";

export default function SharedReport() {
  const [, params] = useRoute("/share/:shareId");
  const shareId = params?.shareId ?? "";
  const reportQuery = trpc.publicReport.byShareId.useQuery({ shareId }, { enabled: Boolean(shareId) });

  if (reportQuery.isLoading) return <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-100"><Loader2 className="h-6 w-6 animate-spin text-cyan-300" /></div>;
  if (reportQuery.error || !reportQuery.data) return <div className="grid min-h-screen place-items-center bg-slate-950 p-6 text-center text-slate-100"><div><h1 className="text-xl font-bold">Shared report unavailable</h1><p className="mt-2 text-sm text-slate-400">This link may be invalid or the report is no longer available.</p><Link href="/"><Button className="mt-5 rounded-xl">Return to simulator</Button></Link></div></div>;

  let payload: ScenarioReportPayload;
  try {
    payload = JSON.parse(reportQuery.data.reportJson) as ScenarioReportPayload;
  } catch {
    return <div className="grid min-h-screen place-items-center bg-slate-950 p-6 text-center text-slate-100"><div><h1 className="text-xl font-bold">Report data could not be read</h1><Link href="/"><Button className="mt-5 rounded-xl">Return to simulator</Button></Link></div></div>;
  }

  return <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1180px]"><header className="mb-5 flex flex-wrap items-center justify-between gap-3"><Link href="/"><Button variant="outline" className="rounded-xl"><ArrowLeft className="mr-2 h-3.5 w-3.5" /> Simulator</Button></Link><div className="flex items-center gap-2"><span className="hidden items-center gap-1 text-xs text-slate-500 sm:flex"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Shared academic scenario report</span><DownloadScenarioPdf targetId="shared-report-content" fileName={reportQuery.data.title} /></div></header><ScenarioReportPreview id="shared-report-content" title={reportQuery.data.title} payload={{ ...payload, plainEnglishExplanation: reportQuery.data.plainEnglishExplanation ?? payload.plainEnglishExplanation }} /></div></main>;
}
