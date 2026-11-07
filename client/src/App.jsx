import { useEffect, useMemo, useState } from 'react';
import InsightFlowAgent from './components/InsightFlowAgent';
import {
  Activity, ArrowDownRight, ArrowUpRight, BarChart3, Bell, Bot, CheckCircle2,
  ChevronDown, CircleHelp, Clock3, Database, FileSpreadsheet, FileText, Home,
  LogOut, Menu, MessageSquare, Plus, Search, Send, Settings, ShieldCheck,
  Sparkles, UploadCloud, Users, X, Zap
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  Legend
} from 'recharts';
import { api, apiDownload, getUser, setSession, clearSession } from './api';


const sales = [
  { month: 'May', revenue: 18000, profit: 5200 }, { month: 'Jun', revenue: 22500, profit: 7100 },
  { month: 'Jul', revenue: 19800, profit: 6300 }, { month: 'Aug', revenue: 27900, profit: 9200 },
  { month: 'Sep', revenue: 25100, profit: 8400 }, { month: 'Oct', revenue: 32600, profit: 11400 },
];
const initialMessages = [{ role: 'assistant', text: 'Hi! I’m your AI Data Analyst. Ask me about sales, trends, data quality, or upload a CSV to get started. I’m powered by InsightFlow’s native AI agent. Select a dataset and ask me to analyze it.' }];

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const data = await api(`/auth/${mode}`, { method: 'POST', body: JSON.stringify({ name, email, password }) });
      setSession(data.token, data.user); onLogin(data.user);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <div className="auth-shell"><div className="auth-art"><div className="brand"><div className="brand-mark"><Activity size={22}/></div><span>InsightFlow</span></div><div className="art-copy"><div className="eyebrow"><Sparkles size={14}/> YOUR ANALYTICS COPILOT</div><h1>Turn data into<br/><span>decisions.</span></h1><p>A smarter workspace to explore your data, discover patterns, and make confident business decisions.</p><div className="art-stat"><div className="mini-bars"><i/><i/><i/><i/><i/><i/><i/></div><div><strong>Analytics, simplified</strong><small>One workspace. Clear answers.</small></div></div></div><div className="auth-foot">Built for curious minds and data-driven teams.</div></div><div className="auth-form-wrap"><form className="auth-card" onSubmit={submit}><div className="mobile-brand brand"><div className="brand-mark"><Activity size={22}/></div><span>InsightFlow</span></div><div className="eyebrow">WELCOME TO INSIGHTFLOW</div><h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2><p className="muted">{mode === 'login' ? 'Sign in to continue to your workspace.' : 'Start exploring your data in minutes.'}</p>{mode === 'register' && <label>Full name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" required minLength="2"/></label>}<label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" required minLength="8"/></label>{error && <div className="error-box">{error}</div>}<button className="primary-btn full-btn" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <span>→</span></button><p className="switch-auth">{mode === 'login' ? 'New to InsightFlow?' : 'Already have an account?'} <button type="button" onClick={()=>{setMode(mode==='login'?'register':'login');setError('')}}>{mode==='login'?'Create an account':'Sign in'}</button></p><div className="secure-note"><ShieldCheck size={15}/> Your data stays in your workspace</div></form></div></div>;
}


function ChatChart({ chart }) {
  if (
    !chart ||
    !Array.isArray(chart.data) ||
    chart.data.length === 0 ||
    !chart.xKey ||
    !chart.yKey
  ) {
    return null;
  }

  const { type, title, xKey, yKey, data } = chart;

  const chartColors = [
    '#9b7aff',
    '#38bdf8',
    '#34d399',
    '#f59e0b',
    '#f472b6',
    '#818cf8',
    '#fb7185',
    '#2dd4bf'
  ];

  const commonAxisProps = {
    axisLine: false,
    tickLine: false,
    tick: { fill: '#9aa2b6', fontSize: 11 }
  };

  return (
    <div
      style={{
        width: '100%',
        height: 340,
        marginTop: 14,
        padding: 16,
        background: '#171c2c',
        border: '1px solid #30364a',
        borderRadius: 12
      }}
    >
      <h4 style={{ margin: '0 0 16px', color: '#ffffff' }}>
        {title || `${yKey} by ${xKey}`}
      </h4>

      <ResponsiveContainer width="100%" height="85%">
        {type === 'pie' ? (
          <PieChart>
            <Pie
              data={data}
              dataKey={yKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        ) : type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid stroke="#30364a" strokeDasharray="4 5" />
            <XAxis dataKey={xKey} {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey={yKey}
              stroke="#9b7aff"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        ) : type === 'area' ? (
          <AreaChart data={data}>
            <CartesianGrid stroke="#30364a" strokeDasharray="4 5" />
            <XAxis dataKey={xKey} {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey={yKey}
              stroke="#9b7aff"
              fill="#9b7aff"
              fillOpacity={0.25}
            />
          </AreaChart>
        ) : type === 'bar' ? (
          <BarChart data={data}>
            <CartesianGrid stroke="#30364a" strokeDasharray="4 5" />
            <XAxis dataKey={xKey} {...commonAxisProps} />
            <YAxis {...commonAxisProps} />
            <Tooltip />
            <Legend />
            <Bar
              dataKey={yKey}
              fill="#9b7aff"
              radius={[5, 5, 0, 0]}
            />
          </BarChart>
        ) : (
          <></>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(getUser());
  const [page, setPage] = useState('Overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [messages, setMessages] = useState(initialMessages);
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [reportDatasetId, setReportDatasetId] = useState('');
  const [generatedReport, setGeneratedReport] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [reportHistory, setReportHistory] = useState([]);
  const [loadingReportHistory, setLoadingReportHistory] = useState(false);
  const [deletingReportId, setDeletingReportId] = useState('');
  const [viewingReportId, setViewingReportId] = useState('');
  const [generatedReportId, setGeneratedReportId] = useState('');
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailingReportId, setEmailingReportId] = useState('');


  async function loadDatasets() {
    try {
      const data = await api('/datasets');
      const list = data.datasets || [];

      setDatasets(list);

      if (list.length === 0) {
        setSelectedDataset(null);
        return;
      }

      // Keep the current selection when possible; otherwise select the latest dataset.
      const currentId = selectedDataset?._id;
      const chosenDataset =
        list.find((dataset) => dataset._id === currentId) || list[0];

      const detail = await api(`/datasets/${chosenDataset._id}`);
      setSelectedDataset(detail.dataset);
    } catch (error) {
      if (error.message?.includes('Session')) {
        logout();
      } else {
        setUploadError(error.message || 'Unable to load datasets.');
      }
    }
  }

  function logout() {
    clearSession();
    setUser(null);
    setDatasets([]);
    setSelectedDataset(null);
    setMessages(initialMessages);
    setQuestion('');
    setPage('Overview');
    setUploadError('');
  }

  useEffect(() => {
    if (user) {
      loadDatasets();
    }
  }, [user]);

  useEffect(() => {
    if (user && page === 'Reports') {
      loadReportHistory();
    }
  }, [user, page]);

  async function uploadFile(file) {
    if (!file) return;

    setUploadError('');
    setUploading(true);

    try {
      const form = new FormData();
      form.append('file', file);

      const data = await api('/datasets/upload', {
        method: 'POST',
        body: form
      });

      await loadDatasets();

      // Select the dataset returned by the upload endpoint.
      setSelectedDataset(data.dataset);

      setToast('Dataset uploaded successfully');
      setPage('Datasets');
      setTimeout(() => setToast(''), 3000);
    } catch (error) {
      setUploadError(error.message || 'Dataset upload failed.');
    } finally {
      setUploading(false);
    }
  }
  async function openDataset(id) {
    try { const data = await api(`/datasets/${id}`); setSelectedDataset(data.dataset); setPage('Datasets'); }
    catch(e) { setUploadError(e.message); }
  }
  async function deleteDataset(id) {
    try { await api(`/datasets/${id}`, { method: 'DELETE' }); setDatasets(prev=>prev.filter(d=>d._id!==id)); if(selectedDataset?._id===id)setSelectedDataset(null); }
    catch(e) { setUploadError(e.message); }
  }
  async function sendMessage(e) {
    e.preventDefault();

    const text = question.trim();

    if (!text || sending) return;

    if (!selectedDataset?._id) {
      setUploadError('Please select a dataset before asking a question.');
      return;
    }

    setMessages((prev) => [
      ...prev,
      { role: 'user', text }
    ]);
    setQuestion('');
    setSending(true);
    setUploadError('');

    try {
      const data = await api('/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          datasetId: selectedDataset._id
        })
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer || 'No response received from the AI agent.',
          chart: data.chart || null
        }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `I couldn't process that request: ${error.message}`
        }
      ]);
    } finally {
      setSending(false);
    }
  }
  
async function loadReportHistory() {
  setLoadingReportHistory(true);
  try {
    const data = await api('/reports');
    setReportHistory(data.reports || []);
  } catch (error) {
    setReportError(error.message || 'Unable to load report history.');
  } finally {
    setLoadingReportHistory(false);
  }
}

async function viewSavedReport(reportId) {
  setViewingReportId(reportId);
  setReportError('');
  try {
    const data = await api(`/reports/${reportId}`);
    const saved = data.report;
    setGeneratedReport(saved.report || '');
    setGeneratedReportId(saved._id || reportId);
    setReportDatasetId(String(saved.datasetId || ''));
  } catch (error) {
    setReportError(error.message || 'Unable to open saved report.');
  } finally {
    setViewingReportId('');
  }
}

async function emailSavedReport(reportId) {
  const recipient = emailRecipient.trim();

  if (!recipient) {
    setReportError('Please enter the recipient email address.');
    return;
  }

  if (emailingReportId) return;

  setEmailingReportId(reportId);
  setReportError('');

  try {
    const data = await api(`/reports/${reportId}/email`, {
      method: 'POST',
      body: JSON.stringify({ recipientEmail: recipient })
    });

    setToast(data.message || 'Report emailed successfully');
    setTimeout(() => setToast(''), 3000);
  } catch (error) {
    setReportError(error.message || 'Unable to email report.');
  } finally {
    setEmailingReportId('');
  }
}

async function deleteSavedReport(reportId) {
  const confirmed = window.confirm('Delete this saved report permanently?');
  if (!confirmed || deletingReportId) return;

  setDeletingReportId(reportId);
  setReportError('');
  try {
    await api(`/reports/${reportId}`, { method: 'DELETE' });
    setReportHistory((current) => current.filter((item) => item._id !== reportId));
    setToast('Report deleted successfully');
    setTimeout(() => setToast(''), 3000);
  } catch (error) {
    setReportError(error.message || 'Unable to delete report.');
  } finally {
    setDeletingReportId('');
  }
}

async function downloadSavedReportPdf(item) {
  if (!item?.datasetId) {
    setReportError('The dataset linked to this report is unavailable.');
    return;
  }

  setDownloadingPdf(true);
  setReportError('');
  try {
    const detail = await api(`/reports/${item._id}`);
    const saved = detail.report;
    const pdfBlob = await apiDownload('/reports/pdf', {
      method: 'POST',
      body: JSON.stringify({
        datasetId: saved.datasetId,
        report: saved.report
      })
    });

    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    const safeName = (item.datasetName || 'InsightFlow_Report')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    link.href = url;
    link.download = `${safeName}_report.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    setToast('PDF downloaded successfully');
    setTimeout(() => setToast(''), 3000);
  } catch (error) {
    setReportError(error.message || 'Unable to download saved report.');
  } finally {
    setDownloadingPdf(false);
  }
}

async function generateReport() {
  if (!reportDatasetId || generatingReport) {
    setReportError('Please select a dataset first.');
    return;
  }

  setGeneratingReport(true);
  setReportError('');
  setGeneratedReport('');

  try {
    const data = await api('/reports/generate', {
      method: 'POST',
      body: JSON.stringify({
        datasetId: reportDatasetId
      })
    });

    setGeneratedReport(data.report || 'No report was returned.');
    await loadReportHistory();
  } catch (error) {
    setReportError(error.message || 'Unable to generate report.');
  } finally {
    setGeneratingReport(false);
  }
}



async function downloadReportPdf() {
  if (!generatedReport || !reportDatasetId || downloadingPdf) {
    setReportError('Generate a report first.');
    return;
  }

  setDownloadingPdf(true);
  setReportError('');

  try {
    const pdfBlob = await apiDownload('/reports/pdf', {
      method: 'POST',
      body: JSON.stringify({
        datasetId: reportDatasetId,
        report: generatedReport
      })
    });

    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    const datasetName =
      datasets.find((dataset) => dataset._id === reportDatasetId)?.originalName
      || 'InsightFlow_Report';
    const safeName = datasetName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_');

    link.href = url;
    link.download = `${safeName}_report.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    setToast('PDF downloaded successfully');
    setTimeout(() => setToast(''), 3000);
  } catch (error) {
    setReportError(error.message || 'Unable to download PDF.');
  } finally {
    setDownloadingPdf(false);
  }
}

  const analyticsDataset = selectedDataset || datasets[0];
  const analyticsRows = analyticsDataset?.rows || [];
  const analyticsColumns = analyticsDataset?.columns || [];

  const revenueColumn = analyticsColumns.find(
    c => /revenue|sales|amount/i.test(c.name) && /numeric|number/i.test(c.type)
  );
  const categoryColumn = analyticsColumns.find(
    c => /region|category|product|department|segment|city|country/i.test(c.name)
  );

  const revenueByCategory = useMemo(() => {
    if (!revenueColumn || !categoryColumn || !analyticsRows.length) return [];
    const totals = {};
    analyticsRows.forEach(row => {
      const category = String(row[categoryColumn.name] ?? 'Unknown');
      const revenue = Number(String(row[revenueColumn.name] ?? '').replace(/,/g, ''));
      if (!Number.isFinite(revenue)) return;
      totals[category] = (totals[category] || 0) + revenue;
    });
    return Object.entries(totals)
      .map(([category, revenue]) => ({ category, revenue: Number(revenue.toFixed(2)) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [analyticsRows, revenueColumn, categoryColumn]);
  const totalRows = datasets.reduce((n,d)=>n+d.rowCount,0);
 
const nav = [
  {
    label: 'WORKSPACE',
    items: [
      ['Overview', Home],
      ['AI Analyst', MessageSquare],
      ['Datasets', Database],
      ['Reports', FileText]
    ]
  },
  {
    label: 'PREFERENCES',
    items: [['Settings', Settings]]
  }
];

  if (!user) return <AuthScreen onLogin={setUser}/>;
  return <div className="app-shell">
    {sidebarOpen && <button className="mobile-overlay" onClick={()=>setSidebarOpen(false)} aria-label="Close menu"/>}
    <aside className={`sidebar ${sidebarOpen?'sidebar-open':''}`}><div className="brand"><div className="brand-mark"><Activity size={21}/></div><span>InsightFlow</span><button className="close-sidebar" onClick={()=>setSidebarOpen(false)}><X size={18}/></button></div><div className="workspace-switch"><div className="workspace-avatar">A</div><div><strong>Analytics workspace</strong><small>Personal workspace</small></div><ChevronDown size={15}/></div>{nav.map(group=><div className="nav-group" key={group.label}><div className="nav-label">{group.label}</div>{group.items.map(([label,Icon])=><button key={label} className={`nav-item ${page===label?'active':''}`} onClick={()=>{setPage(label);setSidebarOpen(false)}}><Icon size={18}/><span>{label}</span>{label==='AI Analyst'&&<span className="nav-new">AI</span>}</button>)}</div>)}<div className="sidebar-bottom"><div className="upgrade-card"><div className="upgrade-icon"><Zap size={17}/></div><strong>Your insights, amplified</strong><p>Connect your data and ask better questions.</p><button onClick={()=>setPage('AI Analyst')}>Explore AI Analyst <span>↗</span></button></div><div className="user-row"><div className="user-avatar">{(user.name||'U').slice(0,1).toUpperCase()}</div><div className="user-meta"><strong>{user.name}</strong><small>{user.email}</small></div><button className="icon-btn" title="Sign out" onClick={logout}><LogOut size={16}/></button></div></div></aside>
    <main className="main-area"><header className="topbar"><button className="mobile-menu icon-btn" onClick={()=>setSidebarOpen(true)}><Menu size={20}/></button><div className="breadcrumb">Workspace <span>/</span> <strong>{page}</strong></div><div className="top-actions"><div className="searchbox"><Search size={16}/><input placeholder="Search workspace..." value={search} onChange={e=>setSearch(e.target.value)}/><kbd>⌘ K</kbd></div><button className="icon-btn notification-btn" title="Notifications"><Bell size={18}/><i/></button><div className="top-avatar">{(user.name||'U').slice(0,1).toUpperCase()}</div></div></header>
    <div className="page-content">
      {page==='Overview' && <><div className="page-heading"><div><div className="eyebrow">YOUR DATA, AT A GLANCE</div><h1>Good to see you, {user.name.split(' ')[0]} <span className="wave">✦</span></h1><p>Here’s what’s happening across your analytics workspace.</p></div><label className="upload-btn"><UploadCloud size={17}/> Upload dataset<input type="file" accept=".csv,text/csv" onChange={e=>uploadFile(e.target.files?.[0])}/></label></div>
        <div className="welcome-banner"><div className="banner-orb"><Sparkles size={23}/></div><div className="banner-copy"><div className="banner-tag">AI ANALYST <span>PREVIEW</span></div><h3>Your next insight is one question away.</h3><p>Ask questions in plain English and turn your data into a clear story.</p><button onClick={()=>setPage('AI Analyst')}>Start a conversation <span>→</span></button></div><div className="banner-graphic"><div className="graphic-grid"/><div className="floating-chart"><div className="chart-top"><span/><span/><span/></div><div className="chart-bars"><i/><i/><i/><i/><i/><i/></div><div className="chart-line"/></div></div></div>
        <div className="section-heading"><div><h2>Workspace overview</h2><p>Key metrics from your saved datasets</p></div><span className="live-pill"><i/> WORKSPACE</span></div>
        <div className="metrics-grid"><Metric title="Datasets uploaded" value={datasets.length} icon={Database} tone="purple" change="Your data library" /><Metric title="Total data rows" value={totalRows.toLocaleString()} icon={FileSpreadsheet} tone="blue" change="Across all datasets" /><Metric title="Data columns" value={datasets.reduce((n,d)=>n+d.columnCount,0)} icon={BarChart3} tone="green" change="Available for analysis" /><Metric title="AI conversations" value={messages.length>1?Math.ceil((messages.length-1)/2):0} icon={Bot} tone="orange" change="This session" /></div>
        <div className="dashboard-grid"><section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h3>Revenue by Region</h3>
              <p>{analyticsDataset ? `Actual data · ${analyticsDataset.originalName}` : 'Upload a dataset to begin'}</p>
            </div>
          </div>
          {revenueByCategory.length > 0 ? <>
            <div className="chart-legend"><span><i className="legend-revenue" /> Revenue</span></div>
            <div className="main-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByCategory} margin={{ top: 10, right: 12, left: 0, bottom: 5 }}>
                  <CartesianGrid stroke="#252a3a" strokeDasharray="4 5" vertical={false} />
                  <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: '#9aa2b6', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9aa2b6', fontSize: 12 }} tickFormatter={value => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value} />
                  <Tooltip formatter={value => [Number(value).toLocaleString(), 'Revenue']} contentStyle={{ background: '#171c2c', border: '1px solid #30364a', borderRadius: 10, color: '#fff' }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#9b7aff" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-foot"><span><i className="dot-purple" /> Actual uploaded dataset</span><span>{revenueByCategory.length} categories</span></div>
          </> : <div className="empty-mini">
            <div className="empty-icon"><Database size={20} /></div>
            <strong>No chartable data found</strong>
            <p>Select a dataset with a numeric Revenue or Sales column and a category such as Region or Product.</p>
            <button className="small-outline-btn" onClick={() => setPage('Datasets')}>View datasets</button>
          </div>}
        </section>
        <section className="panel dataset-panel"><div className="panel-heading"><div><h3>Recent datasets</h3><p>Your latest uploads</p></div><button className="text-link" onClick={()=>setPage('Datasets')}>View all <span>→</span></button></div>{datasets.length===0?<div className="empty-mini"><div className="empty-icon"><Database size={20}/></div><strong>No datasets yet</strong><p>Upload a CSV file to see its profile here.</p><label className="small-outline-btn">Upload CSV<input type="file" accept=".csv,text/csv" onChange={e=>uploadFile(e.target.files?.[0])}/></label></div>:<div className="recent-list">{datasets.slice(0,4).map(d=><button className="recent-item" key={d._id} onClick={()=>openDataset(d._id)}><div className="file-icon"><FileSpreadsheet size={18}/></div><div className="recent-info"><strong>{d.originalName}</strong><small>{d.rowCount.toLocaleString()} rows · {d.columnCount} columns</small></div><span className="file-date">{new Date(d.createdAt).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</span></button>)}</div>}</section></div>
        <div className="bottom-note"><div className="note-icon"><CircleHelp size={17}/></div><div><strong>Getting started with InsightFlow</strong><p>Upload a CSV to profile your data, then use AI Analyst to explore questions. Dashboard figures marked as sample are illustrative only.</p></div><button onClick={()=>setPage('Datasets')}>Explore datasets <span>→</span></button></div>
      </>}
      {page==='AI Analyst' && <><div className="page-heading"><div><div className="eyebrow">YOUR CONVERSATIONAL ANALYST</div><h1>AI Analyst</h1><p>Ask questions about your business data in plain English.</p></div><span className="mode-pill"><span/>Groq AI Agent</span></div><div className="chat-layout"><section className="panel chat-panel"><div className="chat-header"><div className="assistant-avatar"><Bot size={22}/></div><div><h3>InsightFlow Analyst</h3><p><i/> Ready to help · AI agent connected</p></div><button className="icon-btn" title="New conversation" onClick={()=>setMessages(initialMessages)}><Plus size={19}/></button></div><div className="chat-messages">{messages.map((m,i)=><div className={`message-row ${m.role}`} key={i}><div className={`message-avatar ${m.role}`}>{m.role==='assistant'?<Sparkles size={15}/>:user.name.slice(0,1).toUpperCase()}</div><div className="message-content"><span className="message-name">{m.role==='assistant'?'InsightFlow Analyst':'You'}</span><div className="message-bubble">{m.text}</div>
{m.role === 'assistant' && m.chart && (
  <ChatChart chart={m.chart} />
)}</div></div>)}{sending&&<div className="message-row assistant"><div className="message-avatar assistant"><Sparkles size={15}/></div><div className="typing"><i/><i/><i/></div></div>}</div><div className="suggestion-area"><span>TRY ASKING</span><div className="suggestion-chips">{['Summarize my dataset','Find missing values','What drives revenue?'].map(s=><button key={s} onClick={()=>setQuestion(s)}>{s}<ArrowUpRight size={13}/></button>)}</div></div><form className="chat-composer" onSubmit={sendMessage}><textarea value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage(e)}}} placeholder="Ask anything about your data…" rows="1"/><div className="composer-bottom"><span><Sparkles size={13}/>Powered by InsightFlow AI</span><button className="send-btn" disabled={!question.trim()||sending}><Send size={16}/></button></div></form></section><aside className="chat-side"><section className="panel context-card"><div className="side-title"><Database size={17}/><h3>Data context</h3></div><p className="muted">Choose a dataset to use as context for your next analysis.</p><select
  value={selectedDataset?._id || ''}
  onChange={async (e) => {
    const id = e.target.value;

    if (!id) {
      setSelectedDataset(null);
      return;
    }

    try {
      const data = await api(`/datasets/${id}`);
      setSelectedDataset(data.dataset);
      setUploadError('');
    } catch (error) {
      setUploadError(error.message || 'Unable to select this dataset.');
    }
  }}
>
  <option value="">No dataset selected</option>
  {datasets.map((dataset) => (
    <option value={dataset._id} key={dataset._id}>
      {dataset.originalName}
    </option>
  ))}
</select>{selectedDataset?<div className="context-summary"><strong>{selectedDataset.originalName}</strong><span>{selectedDataset.rowCount.toLocaleString()} rows · {selectedDataset.columnCount} columns</span></div>:<div className="context-empty"><FileSpreadsheet size={23}/><span>Dataset details will appear here.</span></div>}<button className="outline-btn full-btn" onClick={()=>setPage('Datasets')}>Manage datasets <span>→</span></button></section><section className="panel tips-card"><div className="side-title"><Sparkles size={17}/><h3>Tips for better insights</h3></div>{[['Be specific','Ask about a metric, date range, or category.'],['Explore trends','Compare periods to spot meaningful changes.'],['Check data quality','Look for missing values and unusual records.']].map(([t,d],i)=><div className="tip-row" key={t}><span>{String(i+1).padStart(2,'0')}</span><div><strong>{t}</strong><p>{d}</p></div></div>)}</section></aside></div></>}
      {page==='Datasets' && <><div className="page-heading"><div><div className="eyebrow">YOUR DATA LIBRARY</div><h1>Datasets</h1><p>Upload, inspect, and manage the data you want to analyze.</p></div><label className="upload-btn"><UploadCloud size={17}/>{uploading?'Analyzing…':'Upload CSV'}<input type="file" accept=".csv,text/csv" disabled={uploading} onChange={e=>uploadFile(e.target.files?.[0])}/></label></div>{uploadError&&<div className="error-box dataset-error">{uploadError}<button onClick={()=>setUploadError('')}><X size={15}/></button></div>}{datasets.length===0?<section className="panel upload-empty"><div className="upload-empty-icon"><UploadCloud size={28}/></div><h2>Start with your first dataset</h2><p>Upload a CSV file up to 5 MB. We’ll profile columns, missing values, unique values, and numeric fields.</p><label className="primary-btn">{uploading?'Analyzing…':'Choose CSV file'}<input type="file" accept=".csv,text/csv" disabled={uploading} onChange={e=>uploadFile(e.target.files?.[0])}/></label><small>CSV format · Up to 5 MB · First 10 rows preview</small></section>:<><div className="dataset-summary-grid"><Metric title="Total datasets" value={datasets.length} icon={Database} tone="purple" change="Saved in your workspace"/><Metric title="Total rows" value={totalRows.toLocaleString()} icon={FileSpreadsheet} tone="blue" change="Across uploaded files"/><Metric title="Total columns" value={datasets.reduce((n,d)=>n+d.columnCount,0)} icon={BarChart3} tone="green" change="Across uploaded files"/></div><div className="dataset-list">{datasets.filter(d=>d.originalName.toLowerCase().includes(search.toLowerCase())).map(d=><section className={`panel dataset-card ${selectedDataset?._id===d._id?'selected':''}`} key={d._id}><div className="dataset-card-top"><div className="file-icon large"><FileSpreadsheet size={21}/></div><div className="dataset-card-title"><h3>{d.originalName}</h3><p>Added {new Date(d.createdAt).toLocaleString()}</p></div><span className="status-tag"><CheckCircle2 size={13}/> Profiled</span></div><div className="dataset-stats"><div><span>Rows</span><strong>{d.rowCount.toLocaleString()}</strong></div><div><span>Columns</span><strong>{d.columnCount}</strong></div><div><span>Size</span><strong>CSV</strong></div></div><div className="dataset-card-actions"><button className="outline-btn" onClick={()=>openDataset(d._id)}>View profile</button><button className="danger-link" onClick={()=>deleteDataset(d._id)}>Delete</button></div></section>)}</div>{selectedDataset&&<section className="panel profile-panel"><div className="panel-heading"><div><h3>Dataset profile</h3><p>{selectedDataset.originalName} · First 10 rows preview</p></div><button className="icon-btn" onClick={()=>setSelectedDataset(null)}><X size={18}/></button></div><div className="profile-chips"><span>{selectedDataset.rowCount} rows</span><span>{selectedDataset.columnCount} columns</span><span>{selectedDataset.columns.filter(c=>c.missing>0).length} columns with missing values</span></div><div className="table-wrap"><table><thead><tr><th>Column</th><th>Type</th><th>Missing</th><th>Unique</th></tr></thead><tbody>{selectedDataset.columns.map(c=><tr key={c.name}><td>{c.name}</td><td><span className="type-pill">{c.type}</span></td><td>{c.missing}</td><td>{c.unique}</td></tr>)}</tbody></table></div>{selectedDataset.numericSummary?.length>0&&<><h4 className="subsection-title">Numeric summary</h4><div className="table-wrap"><table><thead><tr><th>Column</th><th>Min</th><th>Mean</th><th>Max</th><th>Count</th></tr></thead><tbody>{selectedDataset.numericSummary.map(n=><tr key={n.name}><td>{n.name}</td><td>{n.min}</td><td>{n.mean}</td><td>{n.max}</td><td>{n.count}</td></tr>)}</tbody></table></div></>}{selectedDataset.preview?.length>0&&<><h4 className="subsection-title">Data preview</h4><div className="table-wrap"><table><thead><tr>{Object.keys(selectedDataset.preview[0]).map(k=><th key={k}>{k}</th>)}</tr></thead><tbody>{selectedDataset.preview.map((r,i)=><tr key={i}>{Object.values(r).map((v,j)=><td key={j}>{String(v??'—')}</td>)}</tr>)}</tbody></table></div></>}</section>}</>}</>}
      {page === 'Reports' && <>
        <div className="page-heading">
          <div>
            <div className="eyebrow">AI-POWERED REPORTING</div>
            <h1>Reports</h1>
            <p>Generate professional reports from your uploaded datasets.</p>
          </div>
        </div>

        <section className="panel" style={{ padding: 24, marginBottom: 24 }}>
          <div className="side-title">
            <FileText size={20} />
            <h3>Generate a new report</h3>
          </div>
          <p className="muted">
            Select a dataset and let InsightFlow AI prepare a detailed
            analysis report with findings and recommendations.
          </p>

          <label style={{ display: 'block', marginTop: 20, marginBottom: 10 }}>
            Select dataset
          </label>
          <select
            value={reportDatasetId}
            onChange={(e) => {
              setReportDatasetId(e.target.value);
              setGeneratedReport('');
              setReportError('');
            }}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 10,
              marginBottom: 18,
              backgroundColor: '#171c2c',
              color: '#ffffff',
              border: '1px solid #343b52',
              colorScheme: 'dark'
            }}
          >
            <option value="" style={{ backgroundColor: '#171c2c', color: '#ffffff' }}>
              Choose a dataset
            </option>
            {datasets.map((dataset) => (
              <option
                key={dataset._id}
                value={dataset._id}
                style={{ backgroundColor: '#171c2c', color: '#ffffff' }}
              >
                {dataset.originalName}
              </option>
            ))}
          </select>

          {datasets.length === 0 && (
            <p className="muted">
              No datasets available. Upload a CSV file first.
            </p>
          )}

          {reportError && (
            <div className="error-box" style={{ marginBottom: 16 }}>
              {reportError}
            </div>
          )}

          <button
            className="primary-btn"
            onClick={generateReport}
            disabled={!reportDatasetId || generatingReport}
          >
            {generatingReport ? 'Generating report...' : 'Generate AI Report'}
            {!generatingReport && <span>→</span>}
          </button>
        </section>

        <section className="panel" style={{ padding: 24, marginBottom: 24 }}>
          <div className="panel-heading">
            <div>
              <div className="side-title">
                <Clock3 size={19} />
                <h3>Report History</h3>
              </div>
              <p className="muted">Your previously generated and saved reports.</p>
            </div>
            <button
              className="outline-btn"
              onClick={loadReportHistory}
              disabled={loadingReportHistory}
            >
              {loadingReportHistory ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          <label style={{ display: 'block', marginTop: 20, marginBottom: 8 }}>
            Recipient email
          </label>
          <input
            type="email"
            value={emailRecipient}
            onChange={(e) => setEmailRecipient(e.target.value)}
            placeholder="Enter recipient email address"
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 10,
              marginBottom: 18,
              backgroundColor: '#171c2c',
              color: '#ffffff',
              border: '1px solid #343b52'
            }}
          />

          {loadingReportHistory && reportHistory.length === 0 ? (
            <p className="muted" style={{ marginTop: 18 }}>Loading saved reports...</p>
          ) : reportHistory.length === 0 ? (
            <div className="empty-mini" style={{ marginTop: 18 }}>
              <div className="empty-icon"><FileText size={20} /></div>
              <strong>No saved reports yet</strong>
              <p>Generate an AI report and it will appear here automatically.</p>
            </div>
          ) : (
            <div className="recent-list" style={{ marginTop: 18 }}>
              {reportHistory.map((item) => (
                <div className="recent-item" key={item._id} style={{ gap: 14 }}>
                  <div className="file-icon"><FileText size={18} /></div>
                  <div className="recent-info">
                    <strong>{item.datasetName || 'Untitled dataset'}</strong>
                    <small>Generated {new Date(item.createdAt).toLocaleString()}</small>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginLeft: 'auto' }}>
                    <button
                      className="outline-btn"
                      onClick={() => viewSavedReport(item._id)}
                      disabled={viewingReportId === item._id}
                    >
                      {viewingReportId === item._id ? 'Opening...' : 'View'}
                    </button>
                    <button
                      className="outline-btn"
                      onClick={() => downloadSavedReportPdf(item)}
                      disabled={downloadingPdf}
                      title="Download this saved report as PDF"
                    >
                      <FileText size={15} /> PDF
                    </button>
                    <button
                      className="outline-btn"
                      onClick={() => emailSavedReport(item._id)}
                      disabled={emailingReportId === item._id || !emailRecipient.trim()}
                      title="Email this report as a PDF attachment"
                    >
                      {emailingReportId === item._id ? 'Sending...' : 'Email PDF'}
                    </button>
                    <button
                      className="danger-link"
                      onClick={() => deleteSavedReport(item._id)}
                      disabled={deletingReportId === item._id}
                    >
                      {deletingReportId === item._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {generatingReport && (
          <section className="panel" style={{ padding: 24 }}>
            <h3>InsightFlow is analyzing your dataset...</h3>
            <p className="muted">
              Calculating statistics and preparing your report. This may take a little time.
            </p>
          </section>
        )}

        {generatedReport && (
          <section className="panel" style={{ padding: 24 }}>
            <div className="panel-heading">
              <div>
                <h3>Generated Analysis Report</h3>
                <p>
                  {datasets.find((dataset) => dataset._id === reportDatasetId)?.originalName
                    || 'Selected dataset'}
                </p>
              </div>
              <span className="status-tag">
                <CheckCircle2 size={13} /> Generated
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20, marginBottom: 16 }}>
              <button
                className="primary-btn"
                onClick={downloadReportPdf}
                disabled={downloadingPdf}
              >
                {downloadingPdf ? 'Preparing PDF...' : 'Download PDF'}
                {!downloadingPdf && <FileText size={16} />}
              </button>
              <button
                className="outline-btn"
                onClick={() => emailSavedReport(generatedReportId)}
                disabled={!generatedReportId || emailingReportId === generatedReportId || !emailRecipient.trim()}
              >
                {emailingReportId === generatedReportId ? 'Sending...' : 'Email PDF'}
              </button>
            </div>
            <pre style={{
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
              fontFamily: 'inherit',
              fontSize: 14,
              lineHeight: 1.8,
              color: 'var(--text-primary, inherit)',
              marginTop: 20
            }}>
              {generatedReport}
            </pre>
          </section>
        )}
      </>}
      {page==='Settings' && <><div className="page-heading"><div><div className="eyebrow">WORKSPACE PREFERENCES</div><h1>Settings</h1><p>Your account and workspace details.</p></div></div><section className="panel settings-panel"><div className="settings-heading"><div className="user-avatar big">{user.name.slice(0,1).toUpperCase()}</div><div><h3>{user.name}</h3><p>{user.email}</p></div></div><div className="settings-line"><span>Workspace</span><strong>Personal workspace</strong></div><div className="settings-line"><span>Account created</span><strong>Active session</strong></div><div className="settings-line"><span>AI integration</span><span className="status-tag">Demo mode</span></div><p className="muted settings-help">InsightFlow uses its native LangChain agent powered by Groq.</p><button className="outline-btn" onClick={logout}><LogOut size={15}/> Sign out</button></section></>}
      {uploadError&&page!=='Datasets'&&<div className="error-toast">{uploadError}<button onClick={()=>setUploadError('')}><X size={14}/></button></div>}
    </div><footer className="app-footer"><span>© 2026 InsightFlow</span><span><i/> All systems operational</span><span>Built for better decisions</span></footer></main>{toast&&<div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
  </div>;
}
function Metric({title,value,icon:Icon,tone,change}) { return <div className="metric-card"><div className="metric-top"><span>{title}</span><div className={`metric-icon ${tone}`}><Icon size={18}/></div></div><strong className="metric-value">{value}</strong><div className="metric-foot"><span className="metric-trend"><ArrowUpRight size={13}/>{change}</span></div></div>; }

export default App;
