
import React, { useState, useRef } from 'react';
import { InputType, VeoModel, AspectRatio, VideoJob, JobStatus, Resolution } from '../types';
import { PlusCircle, Layers, Image as ImageIcon, Video as VideoIcon, Type, Trash2 } from 'lucide-react';

interface JobFormProps {
  onAddJobs: (jobs: VideoJob[]) => void;
}

const JobForm: React.FC<JobFormProps> = ({ onAddJobs }) => {
  const [isBatch, setIsBatch] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [batchPrompts, setBatchPrompts] = useState('');
  const [inputType, setInputType] = useState<InputType>(InputType.TEXT_ONLY);
  const [model, setModel] = useState<VeoModel>(VeoModel.VEO_3_1_FAST);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [resolution, setResolution] = useState<Resolution>('720p');
  const [startImage, setStartImage] = useState<string | null>(null);
  const [endImage, setEndImage] = useState<string | null>(null);

  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setImg: (val: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImg(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = () => {
    const promptsToProcess = isBatch 
      ? batchPrompts.split('\n').filter(p => p.trim() !== '') 
      : [prompt];

    if (promptsToProcess.length === 0) return;

    const newJobs: VideoJob[] = promptsToProcess.map(p => ({
      id: crypto.randomUUID(),
      prompt: p,
      inputType,
      model,
      aspectRatio,
      resolution,
      startImage: startImage || undefined,
      endImage: endImage || undefined,
      status: JobStatus.PENDING,
      progress: 0,
      createdAt: Date.now(),
    }));

    onAddJobs(newJobs);
    setPrompt('');
    setBatchPrompts('');
    // Reset images if not wanted for every batch item, though typically they might be common
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <PlusCircle className="w-6 h-6 text-blue-500" />
          Queue New Production
        </h2>
        <div className="flex bg-slate-800 p-1 rounded-lg">
          <button 
            onClick={() => setIsBatch(false)}
            className={`px-4 py-1.5 rounded-md text-sm transition-all ${!isBatch ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Single Job
          </button>
          <button 
            onClick={() => setIsBatch(true)}
            className={`px-4 py-1.5 rounded-md text-sm transition-all ${isBatch ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Batch Import
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            {isBatch ? 'Prompt List (One per line)' : 'Generation Prompt'}
          </label>
          {isBatch ? (
            <textarea 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all h-32"
              placeholder="A futuristic city at sunset&#10;A golden retriever surfing&#10;Abstract neon light movement..."
              value={batchPrompts}
              onChange={(e) => setBatchPrompts(e.target.value)}
            />
          ) : (
            <input 
              type="text"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Describe your cinematic vision..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Input Mode</label>
            <select 
              value={inputType}
              onChange={(e) => setInputType(e.target.value as InputType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value={InputType.TEXT_ONLY}>Text to Video</option>
              <option value={InputType.IMAGE_TO_VIDEO}>Image to Video</option>
              <option value={InputType.FRAMES_TO_VIDEO}>Start/End Frames</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">VEO Engine</label>
            <select 
              value={model}
              onChange={(e) => setModel(e.target.value as VeoModel)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value={VeoModel.VEO_3_1_FAST}>Veo 3.1 Fast</option>
              <option value={VeoModel.VEO_3_1_HQ}>Veo 3.1 HQ (Multi-Ref)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Aspect Ratio</label>
            <div className="flex gap-2">
              {['16:9', '9:16', '1:1'].map((ar) => (
                <button
                  key={ar}
                  onClick={() => setAspectRatio(ar as AspectRatio)}
                  className={`flex-1 py-2 text-xs font-bold rounded border transition-all ${aspectRatio === ar ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'}`}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Resolution</label>
            <select 
              value={resolution}
              onChange={(e) => setResolution(e.target.value as Resolution)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="720p">720p HD</option>
              <option value="1080p">1080p Full HD</option>
            </select>
          </div>
        </div>

        {(inputType === InputType.IMAGE_TO_VIDEO || inputType === InputType.FRAMES_TO_VIDEO) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="block text-xs font-bold text-slate-500 uppercase mb-3">Start Frame</span>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-slate-900 rounded border border-slate-800 flex items-center justify-center overflow-hidden">
                  {startImage ? (
                    <img src={startImage} alt="Start" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-700" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => fileInputRef1.current?.click()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded transition-colors"
                  >
                    Select Image
                  </button>
                  {startImage && (
                    <button onClick={() => setStartImage(null)} className="text-rose-400 text-xs hover:underline flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                  <input type="file" ref={fileInputRef1} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setStartImage)} />
                </div>
              </div>
            </div>

            {inputType === InputType.FRAMES_TO_VIDEO && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="block text-xs font-bold text-slate-500 uppercase mb-3">End Frame</span>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-slate-900 rounded border border-slate-800 flex items-center justify-center overflow-hidden">
                    {endImage ? (
                      <img src={endImage} alt="End" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-700" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => fileInputRef2.current?.click()}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded transition-colors"
                    >
                      Select Image
                    </button>
                    {endImage && (
                      <button onClick={() => setEndImage(null)} className="text-rose-400 text-xs hover:underline flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Clear
                      </button>
                    )}
                    <input type="file" ref={fileInputRef2} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setEndImage)} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-slate-800">
          <button 
            onClick={handleAdd}
            disabled={!isBatch && !prompt}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98]"
          >
            <PlusCircle className="w-5 h-5" />
            {isBatch ? `Queue ${batchPrompts.split('\n').filter(p => p.trim() !== '').length} Batch Jobs` : 'Add Job to Queue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobForm;
