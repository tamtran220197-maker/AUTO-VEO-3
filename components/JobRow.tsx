
import React from 'react';
import { VideoJob, JobStatus } from '../types';
import { Play, Download, RefreshCw, AlertCircle, Clock, CheckCircle2, Loader2 } from 'lucide-react';

interface JobRowProps {
  job: VideoJob;
  onRetry: (id: string) => void;
}

const JobRow: React.FC<JobRowProps> = ({ job, onRetry }) => {
  const getStatusIcon = () => {
    switch (job.status) {
      case JobStatus.PENDING: return <Clock className="w-5 h-5 text-slate-400" />;
      case JobStatus.RUNNING: return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      case JobStatus.SUCCESS: return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case JobStatus.FAILED: return <AlertCircle className="w-5 h-5 text-rose-400" />;
    }
  };

  const getStatusClass = () => {
    switch (job.status) {
      case JobStatus.PENDING: return 'border-slate-800 bg-slate-900/50';
      case JobStatus.RUNNING: return 'border-blue-900/50 bg-blue-950/20';
      case JobStatus.SUCCESS: return 'border-emerald-900/50 bg-emerald-950/20';
      case JobStatus.FAILED: return 'border-rose-900/50 bg-rose-950/20';
    }
  };

  return (
    <div className={`flex flex-col md:flex-row items-stretch gap-4 p-4 border rounded-xl transition-all duration-300 ${getStatusClass()}`}>
      <div className="flex items-start gap-3 flex-grow">
        <div className="mt-1">{getStatusIcon()}</div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">#{job.id.slice(-6)}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              job.status === JobStatus.SUCCESS ? 'bg-emerald-500/10 text-emerald-400' : 
              job.status === JobStatus.FAILED ? 'bg-rose-500/10 text-rose-400' : 
              job.status === JobStatus.RUNNING ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-slate-400'
            }`}>
              {job.status}
            </span>
            <span className="text-xs text-slate-500">
              {job.model.replace('-generate-preview', '')} • {job.aspectRatio}
            </span>
          </div>
          <p className="text-sm text-slate-200 line-clamp-2 leading-relaxed italic">
            "{job.prompt}"
          </p>
          {job.error && (
            <p className="text-xs text-rose-400 mt-2 font-medium bg-rose-500/5 p-2 rounded border border-rose-500/20">
              {job.error}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 min-w-[300px] justify-end">
        {job.videoUrl && (
          <div className="relative w-full md:w-48 aspect-video rounded-lg overflow-hidden bg-black ring-1 ring-slate-700 shadow-2xl">
            <video 
              src={job.videoUrl} 
              className="w-full h-full object-cover" 
              controls 
              preload="metadata"
            />
          </div>
        )}

        <div className="flex gap-2 w-full md:w-auto">
          {job.status === JobStatus.FAILED && (
            <button 
              onClick={() => onRetry(job.id)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm">Retry</span>
            </button>
          )}
          
          {job.videoUrl && (
            <a 
              href={job.videoUrl} 
              download={`veo-video-${job.id.slice(0, 8)}.mp4`}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-900/20"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Download</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobRow;
