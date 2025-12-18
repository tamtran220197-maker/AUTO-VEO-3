
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VideoJob, JobStatus, QueueConfig } from './types';
import JobForm from './components/JobForm';
import JobRow from './components/JobRow';
import { generateVideo } from './services/geminiService';
import { 
  Play, 
  Settings, 
  Trash2, 
  Download, 
  Video, 
  FileVideo,
  ExternalLink,
  ShieldCheck,
  Pause,
  Monitor
} from 'lucide-react';

const QUEUE_CONFIG: QueueConfig = {
  maxConcurrent: 4,
  maxPerMinute: 4,
};

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, running: 0, success: 0, failed: 0 });
  
  // Rate limiting helper
  const startedTimesRef = useRef<number[]>([]);

  useEffect(() => {
    const checkApiKey = async () => {
      // Assuming window.aistudio.hasSelectedApiKey() is provided globally as per instructions
      if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } else {
        // Fallback for local dev if the environment variable exists
        setHasApiKey(!!process.env.API_KEY);
      }
    };
    checkApiKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (typeof (window as any).aistudio?.openSelectKey === 'function') {
      await (window as any).aistudio.openSelectKey();
      // MUST assume success after triggering openSelectKey to avoid race conditions
      setHasApiKey(true);
    }
  };

  useEffect(() => {
    const total = jobs.length;
    const pending = jobs.filter(j => j.status === JobStatus.PENDING).length;
    const running = jobs.filter(j => j.status === JobStatus.RUNNING).length;
    const success = jobs.filter(j => j.status === JobStatus.SUCCESS).length;
    const failed = jobs.filter(j => j.status === JobStatus.FAILED).length;
    setStats({ total, pending, running, success, failed });
  }, [jobs]);

  const updateJob = useCallback((id: string, updates: Partial<VideoJob>) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));
  }, []);

  const processQueue = useCallback(async () => {
    if (!isRunning) return;

    const runningJobsCount = jobs.filter(j => j.status === JobStatus.RUNNING).length;
    if (runningJobsCount >= QUEUE_CONFIG.maxConcurrent) return;

    // Check rate limit: max 4 jobs per minute
    const now = Date.now();
    const lastMinuteWindow = now - 60000;
    startedTimesRef.current = startedTimesRef.current.filter(t => t > lastMinuteWindow);
    
    if (startedTimesRef.current.length >= QUEUE_CONFIG.maxPerMinute) return;

    // Find the next pending job
    const nextJob = jobs.find(j => j.status === JobStatus.PENDING);
    if (!nextJob) {
      if (runningJobsCount === 0) setIsRunning(false);
      return;
    }

    // Start the job
    startedTimesRef.current.push(now);
    updateJob(nextJob.id, { status: JobStatus.RUNNING, startedAt: now });

    try {
      const videoUrl = await generateVideo(nextJob);
      updateJob(nextJob.id, { 
        status: JobStatus.SUCCESS, 
        videoUrl, 
        completedAt: Date.now() 
      });
    } catch (error: any) {
      console.error(`Job ${nextJob.id} failed:`, error);
      updateJob(nextJob.id, { 
        status: JobStatus.FAILED, 
        error: error.message || 'Unknown generation error' 
      });

      // Fix: If the request fails with "Requested entity was not found", reset the key selection state as per guidelines
      if (error.message === 'API_KEY_EXPIRED') {
        setHasApiKey(false);
      }
    }
  }, [isRunning, jobs, updateJob]);

  useEffect(() => {
    // Fix: Changed from NodeJS.Timeout to any to resolve "Cannot find namespace 'NodeJS'" in browser environments
    let timer: any;
    if (isRunning) {
      timer = setInterval(processQueue, 2000); // Check queue every 2 seconds
    }
    return () => clearInterval(timer);
  }, [isRunning, processQueue]);

  const addJobs = (newJobs: VideoJob[]) => {
    setJobs(prev => [...prev, ...newJobs]);
  };

  const retryJob = (id: string) => {
    updateJob(id, { status: JobStatus.PENDING, error: undefined, videoUrl: undefined });
    if (!isRunning) setIsRunning(true);
  };

  const clearCompleted = () => {
    setJobs(prev => prev.filter(j => j.status !== JobStatus.SUCCESS && j.status !== JobStatus.FAILED));
  };

  const downloadAll = () => {
    const successJobs = jobs.filter(j => j.status === JobStatus.SUCCESS && j.videoUrl);
    successJobs.forEach((j, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = j.videoUrl!;
        link.download = `veo-batch-${j.id.slice(0, 8)}.mp4`;
        link.click();
      }, index * 500); // Delay to prevent browser blocking multiple downloads
    });
  };

  if (!hasApiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center shadow-2xl">
          <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4">API Authentication Required</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            To use the Veo Batch Video Producer, you must select a valid Gemini API key from a paid GCP project.
          </p>
          <div className="space-y-4">
            <button 
              onClick={handleOpenKeySelector}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all"
            >
              Select API Key
            </button>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-400 transition-colors"
            >
              Learn about billing <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                VEO <span className="bg-blue-600/20 text-blue-400 text-[10px] px-1.5 py-0.5 rounded tracking-widest font-mono">BATCH</span>
              </h1>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Enterprise Video AI Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-950 rounded-xl px-4 py-2 border border-slate-800 gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Queue</span>
                <span className="text-lg font-mono font-bold">{stats.pending}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Processing</span>
                <span className="text-lg font-mono font-bold text-blue-400">{stats.running}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Completed</span>
                <span className="text-lg font-mono font-bold text-emerald-400">{stats.success}</span>
              </div>
            </div>

            <button 
              onClick={() => setIsRunning(!isRunning)}
              disabled={stats.total === 0}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all shadow-lg ${
                isRunning 
                  ? 'bg-amber-600/10 text-amber-500 border border-amber-500/50 hover:bg-amber-600/20' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-slate-800 disabled:text-slate-600'
              }`}
            >
              {isRunning ? <><Pause className="w-4 h-4 fill-current" /> Pause Production</> : <><Play className="w-4 h-4 fill-current" /> Start Production</>}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Left Side: Form */}
          <div className="xl:col-span-5 sticky top-28">
            <JobForm onAddJobs={addJobs} />
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4" /> Production Engine
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Max Concurrency</span>
                  <span className="font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded">4 Streams</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Rate Limit</span>
                  <span className="font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded">4 Requests / Min</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Engine Type</span>
                  <span className="font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded">Gemini-VEO-Cloud</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Queue */}
          <div className="xl:col-span-7">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Monitor className="w-6 h-6 text-slate-400" />
                Live Feed
              </h2>
              <div className="flex gap-2">
                {stats.success > 0 && (
                  <button 
                    onClick={downloadAll}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download All Success
                  </button>
                )}
                {stats.total > 0 && (
                  <button 
                    onClick={clearCompleted}
                    className="flex items-center gap-2 px-3 py-1.5 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 text-xs font-bold rounded-lg border border-rose-900/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Clear Finished
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-slate-800 rounded-3xl opacity-50">
                  <FileVideo className="w-16 h-16 text-slate-700 mb-4" />
                  <p className="text-slate-500 font-medium">No active jobs in the production queue</p>
                  <p className="text-slate-700 text-sm mt-1">Start by adding a single prompt or batch list</p>
                </div>
              ) : (
                jobs.sort((a, b) => b.createdAt - a.createdAt).map(job => (
                  <JobRow key={job.id} job={job} onRetry={retryJob} />
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 px-6 py-2 text-center">
        <p className="text-[10px] text-slate-600 uppercase font-bold tracking-[0.2em]">
          Gemini VEO Fast Production Infrastructure &bull; All output stored locally in memory
        </p>
      </footer>
    </div>
  );
};

export default App;
