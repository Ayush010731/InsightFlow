
export default function InsightFlowAgent() {
  return (
    <div className="w-full min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          InsightFlow AI Analyst
        </h1>

        <p className="mb-5 text-sm text-slate-600">
          Analyze datasets, generate insights, charts, and reports.
        </p>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <iframe
            src="https://workflow.getmindpal.com/insightflow-automated-data-analysis-and-reporting-1792252549718"
            title="InsightFlow Data Analysis Workflow"
            className="w-full"
            style={{ height: "750px", border: 0 }}
            allow="clipboard-read; clipboard-write"
          />
        </div>
      </div>
    </div>
  );
}
