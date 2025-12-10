import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDownTrayIcon,
  PlayIcon,
  MusicalNoteIcon,
  LinkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
// import axios from 'axios'; // Will be used for actual API calls in production
import {
  MediaDownloadOptions,
  MediaInfo,
  DownloadProgress,
  MediaFormat,
  AudioFormat,
  MediaQuality,
  AudioQuality,
  PlatformType
} from '../types';

interface MediaDownloaderProps {}

const MediaDownloader: React.FC<MediaDownloaderProps> = () => {
  const [url, setUrl] = useState('');
  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  const [options, setOptions] = useState<MediaDownloadOptions>({
    quality: '720p',
    format: 'mp4',
    audioOnly: false,
    audioQuality: '128kbps',
    audioFormat: 'mp3',
    extractAudio: false,
    subtitles: false,
    thumbnail: true
  });

  // Platform detection
  const detectPlatform = (url: string): PlatformType => {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
      return 'youtube';
    } else if (urlLower.includes('instagram.com')) {
      return 'instagram';
    } else if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
      return 'twitter';
    } else if (urlLower.includes('tiktok.com')) {
      return 'tiktok';
    } else if (urlLower.includes('facebook.com') || urlLower.includes('fb.com')) {
      return 'facebook';
    } else if (urlLower.includes('vimeo.com')) {
      return 'vimeo';
    }
    return 'generic';
  };

  // Validate URL format
  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const supportedDomains = [
        'youtube.com', 'youtu.be', 'instagram.com', 'twitter.com', 'x.com',
        'tiktok.com', 'facebook.com', 'fb.com', 'vimeo.com'
      ];
      
      return supportedDomains.some(domain => 
        urlObj.hostname.includes(domain) || urlObj.hostname.endsWith(domain)
      );
    } catch {
      return false;
    }
  };

  // Mock API calls (in a real implementation, you'd use actual APIs or backend services)
  const fetchMediaInfo = async (url: string): Promise<MediaInfo> => {
    // Validate URL first
    if (!isValidUrl(url)) {
      throw new Error('Unsupported URL or invalid format. Please check the URL and try again.');
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const platform = detectPlatform(url);
    
    // Generate more realistic mock data based on platform
    const mockTitles = {
      youtube: "Amazing YouTube Video - Tutorial & Tips",
      instagram: "Instagram Reel - Trending Content",
      tiktok: "Viral TikTok Video - Dance Challenge",
      twitter: "Twitter Video - Breaking News",
      facebook: "Facebook Video - Community Post",
      vimeo: "Vimeo Video - Creative Content",
      generic: "Video Content"
    };
    
    // Mock response - in real implementation, this would come from your backend
    // which would use libraries like yt-dlp, youtube-dl, or platform-specific APIs
    return {
      title: mockTitles[platform] || mockTitles.generic,
      duration: Math.floor(Math.random() * 600) + 30, // 30s to 10min
      thumbnail: "https://via.placeholder.com/320x180/4f46e5/ffffff?text=Video+Thumbnail",
      platform,
      url,
      availableFormats: ['mp4', 'webm', 'mkv'],
      availableQualities: ['144p', '240p', '360p', '480p', '720p', '1080p'],
      fileSize: Math.floor(Math.random() * 100 + 10) * 1024 * 1024, // 10-110MB
      uploader: "Content Creator",
      uploadDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: `This is sample content from ${platform}. In a real implementation, this would contain the actual video metadata and description.`
    };
  };

  const downloadMedia = async () => {
    if (!mediaInfo) {
      setError('No media information available. Please analyze a URL first.');
      return;
    }

    setError(null);
    setDownloadProgress({
      stage: 'fetching',
      progress: 0,
      message: 'Preparing download...'
    });

    try {
      // Simulate more realistic download process
      const stages = [
        { stage: 'fetching' as const, message: 'Fetching media information...', duration: 800 },
        { stage: 'downloading' as const, message: 'Downloading media...', duration: 4000 },
        { stage: 'converting' as const, message: options.audioOnly ? 'Converting to audio...' : 'Processing video...', duration: 1500 },
        { stage: 'complete' as const, message: 'Processing complete!', duration: 300 }
      ];

      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        
        // Set initial stage progress
        setDownloadProgress({
          stage: stage.stage,
          progress: (i / stages.length) * 100,
          message: stage.message
        });

        // Simulate smooth progress within each stage
        if (stage.stage === 'downloading') {
          const steps = 20; // More granular progress updates
          for (let step = 0; step <= steps; step++) {
            const stageProgress = (step / steps) * 100;
            const overallProgress = ((i + step / steps) / stages.length) * 100;
            
            await new Promise(resolve => setTimeout(resolve, stage.duration / steps));
            
            const downloadedBytes = (stageProgress / 100) * (mediaInfo.fileSize || 0);
            const remainingBytes = (mediaInfo.fileSize || 0) - downloadedBytes;
            const avgSpeed = 2 + Math.random() * 3; // 2-5 MB/s
            const eta = remainingBytes > 0 ? Math.ceil(remainingBytes / (avgSpeed * 1024 * 1024)) : 0;
            
            setDownloadProgress({
              stage: stage.stage,
              progress: overallProgress,
              message: `Downloading ${options.audioOnly ? 'audio' : 'video'}... ${Math.round(stageProgress)}%`,
              downloadedBytes,
              totalBytes: mediaInfo.fileSize,
              speed: `${avgSpeed.toFixed(1)}MB/s`,
              eta: eta > 0 ? `${eta}s` : 'Almost done...'
            });
          }
        } else {
          // For non-downloading stages, just wait
          await new Promise(resolve => setTimeout(resolve, stage.duration));
          
          if (stage.stage !== 'complete') {
            setDownloadProgress({
              stage: stage.stage,
              progress: ((i + 1) / stages.length) * 100,
              message: stage.message
            });
          }
        }
      }

      // Final completion
      setDownloadProgress({
        stage: 'complete',
        progress: 100,
        message: `${options.audioOnly ? 'Audio' : 'Video'} ready for download!`
      });

      // In a real implementation, you would trigger the actual file download here
      // For demo purposes, we'll create a proper mock file
      setTimeout(() => {
        try {
          const filename = generateMockFilename(mediaInfo, options);
          let blob: Blob;
          
          if (options.audioOnly) {
            // Create a minimal valid audio file (silence)
            blob = createMockAudioFile(options.audioFormat || 'mp3');
          } else {
            // Create a minimal valid video file
            blob = createMockVideoFile(options.format);
          }
          
          // Download the file
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          setDownloadProgress(null);
        } catch (error) {
          console.error('Failed to create download file:', error);
          setError('Failed to create download file. This is a demo limitation.');
          setDownloadProgress(null);
        }
      }, 1500);

    } catch (error) {
      console.error('Download simulation failed:', error);
      setDownloadProgress({
        stage: 'error',
        progress: 0,
        message: 'Download failed. Please try again.'
      });
      
      setTimeout(() => {
        setDownloadProgress(null);
      }, 3000);
    }
  };

  // Generate mock filename based on options
  const generateMockFilename = (info: MediaInfo, opts: MediaDownloadOptions): string => {
    const title = info.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50);
    const extension = opts.audioOnly ? 
      (opts.audioFormat || 'mp3') :
      (opts.format || 'mp4');
    const quality = opts.audioOnly ? opts.audioQuality : opts.quality;
    
    return `${title}_${quality}.${extension}`;
  };

  // Create a minimal valid audio file (WAV format with silence)
  const createMockAudioFile = (format: string): Blob => {
    if (format === 'mp3') {
      // Create a minimal MP3 file header (this won't be playable but will have correct format)
      const mp3Header = new Uint8Array([
        0xFF, 0xFB, 0x90, 0x00, // MP3 header
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
      ]);
      return new Blob([mp3Header], { type: 'audio/mpeg' });
    } else {
      // Create a minimal WAV file with 1 second of silence
      const sampleRate = 44100;
      const numChannels = 2;
      const bitsPerSample = 16;
      const duration = 1; // 1 second
      const numSamples = sampleRate * duration;
      const dataSize = numSamples * numChannels * (bitsPerSample / 8);
      const fileSize = 44 + dataSize;

      const buffer = new ArrayBuffer(fileSize);
      const view = new DataView(buffer);

      // WAV header
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(0, 'RIFF');
      view.setUint32(4, fileSize - 8, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
      view.setUint16(32, numChannels * (bitsPerSample / 8), true);
      view.setUint16(34, bitsPerSample, true);
      writeString(36, 'data');
      view.setUint32(40, dataSize, true);

      // Fill with silence (zeros)
      for (let i = 44; i < fileSize; i++) {
        view.setUint8(i, 0);
      }

      return new Blob([buffer], { type: 'audio/wav' });
    }
  };

  // Create a minimal valid video file
  const createMockVideoFile = (format: string): Blob => {
    if (format === 'mp4') {
      // Create a minimal MP4 file structure
      const mp4Header = new Uint8Array([
        // ftyp box
        0x00, 0x00, 0x00, 0x20, // box size
        0x66, 0x74, 0x79, 0x70, // 'ftyp'
        0x69, 0x73, 0x6F, 0x6D, // brand 'isom'
        0x00, 0x00, 0x02, 0x00, // minor version
        0x69, 0x73, 0x6F, 0x6D, // compatible brand 'isom'
        0x69, 0x73, 0x6F, 0x32, // compatible brand 'iso2'
        0x61, 0x76, 0x63, 0x31, // compatible brand 'avc1'
        0x6D, 0x70, 0x34, 0x31, // compatible brand 'mp41'
        
        // mdat box (empty)
        0x00, 0x00, 0x00, 0x08, // box size
        0x6D, 0x64, 0x61, 0x74  // 'mdat'
      ]);
      return new Blob([mp4Header], { type: 'video/mp4' });
    } else {
      // For other formats, create a basic file with proper MIME type
      const content = `Mock ${format.toUpperCase()} video file`;
      const mimeTypes: { [key: string]: string } = {
        'webm': 'video/webm',
        'mkv': 'video/x-matroska',
        'avi': 'video/x-msvideo',
        'mov': 'video/quicktime',
        'flv': 'video/x-flv'
      };
      return new Blob([content], { type: mimeTypes[format] || 'video/mp4' });
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    
    if (!trimmedUrl) {
      setError('Please enter a valid URL.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMediaInfo(null);

    try {
      const info = await fetchMediaInfo(trimmedUrl);
      setMediaInfo(info);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch media information. Please check the URL and try again.';
      setError(errorMessage);
      console.error('Error fetching media info:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle URL input changes with real-time validation
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    // Clear previous errors when user starts typing
    if (error) {
      setError(null);
    }
  };

  const clearAll = () => {
    setUrl('');
    setMediaInfo(null);
    setDownloadProgress(null);
    setError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center space-x-3">
            <ArrowDownTrayIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-white truncate">Media Downloader</h2>
              <p className="text-sm sm:text-base text-indigo-100 hidden sm:block">
                Download videos and audio from YouTube, Instagram, TikTok, and more
              </p>
              <p className="text-xs text-indigo-100 sm:hidden">Download from any platform</p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {/* URL Input */}
          <form onSubmit={handleUrlSubmit} className="mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={url}
                  onChange={handleUrlChange}
                  placeholder="Paste video/audio URL here (YouTube, Instagram, TikTok, etc.)"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                    error ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <InformationCircleIcon className="w-5 h-5" />
                    <span>Get Info</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Supported Platforms and Examples */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Supported Platforms:</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {['YouTube', 'Instagram', 'TikTok', 'Twitter/X', 'Facebook', 'Vimeo', 'And many more...'].map((platform) => (
                <span key={platform} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
                  {platform}
                </span>
              ))}
            </div>
            <div className="mt-3">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Example URLs (try these for demo):</p>
              <div className="space-y-1">
                {[
                  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                  'https://www.instagram.com/p/sample/',
                  'https://www.tiktok.com/@user/video/123456789',
                  'https://twitter.com/user/status/123456789'
                ].map((exampleUrl, index) => (
                  <button
                    key={index}
                    onClick={() => setUrl(exampleUrl)}
                    className="block text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {exampleUrl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <ExclamationCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Media Information */}
          {mediaInfo && (
            <div className="mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    <img
                      src={mediaInfo.thumbnail}
                      alt={mediaInfo.title}
                      className="w-full sm:w-40 h-24 sm:h-24 object-cover rounded-lg"
                    />
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate mb-2">
                      {mediaInfo.title}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div>Duration: {formatDuration(mediaInfo.duration)}</div>
                      <div>Platform: {mediaInfo.platform}</div>
                      <div>Size: {mediaInfo.fileSize ? formatFileSize(mediaInfo.fileSize) : 'Unknown'}</div>
                      <div>Uploader: {mediaInfo.uploader}</div>
                    </div>
                    {mediaInfo.description && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {mediaInfo.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Download Options */}
              <div className="mt-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Download Options
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                      className="flex items-center space-x-1 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    >
                      <AdjustmentsHorizontalIcon className="w-4 h-4" />
                      <span>Advanced Options</span>
                    </button>
                    <button
                      onClick={clearAll}
                      className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Quick Download Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <button
                    onClick={() => {
                      setOptions({ ...options, audioOnly: false, quality: '720p', format: 'mp4' });
                      downloadMedia();
                    }}
                    disabled={downloadProgress !== null}
                    className="flex items-center justify-center space-x-2 px-4 py-3 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <PlayIcon className="w-4 h-4" />
                    <span>Video HD</span>
                  </button>
                  <button
                    onClick={() => {
                      setOptions({ ...options, audioOnly: false, quality: '480p', format: 'mp4' });
                      downloadMedia();
                    }}
                    disabled={downloadProgress !== null}
                    className="flex items-center justify-center space-x-2 px-4 py-3 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <PlayIcon className="w-4 h-4" />
                    <span>Video SD</span>
                  </button>
                  <button
                    onClick={() => {
                      setOptions({ ...options, audioOnly: true, audioQuality: '128kbps', audioFormat: 'mp3' });
                      downloadMedia();
                    }}
                    disabled={downloadProgress !== null}
                    className="flex items-center justify-center space-x-2 px-4 py-3 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <MusicalNoteIcon className="w-4 h-4" />
                    <span>Audio MP3</span>
                  </button>
                  <button
                    onClick={() => {
                      setOptions({ ...options, audioOnly: true, audioQuality: '320kbps', audioFormat: 'mp3' });
                      downloadMedia();
                    }}
                    disabled={downloadProgress !== null}
                    className="flex items-center justify-center space-x-2 px-4 py-3 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <MusicalNoteIcon className="w-4 h-4" />
                    <span>Audio HQ</span>
                  </button>
                </div>

                {/* Advanced Options */}
                <AnimatePresence>
                  {showAdvancedOptions && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Video Options */}
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">Video Options</h4>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Quality
                            </label>
                            <select
                              value={options.quality}
                              onChange={(e) => setOptions(prev => ({ ...prev, quality: e.target.value as MediaQuality }))}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                              <option value="144p">144p (Low)</option>
                              <option value="240p">240p</option>
                              <option value="360p">360p</option>
                              <option value="480p">480p (SD)</option>
                              <option value="720p">720p (HD)</option>
                              <option value="1080p">1080p (Full HD)</option>
                              <option value="1440p">1440p (2K)</option>
                              <option value="2160p">2160p (4K)</option>
                              <option value="best">Best Available</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Format
                            </label>
                            <select
                              value={options.format}
                              onChange={(e) => setOptions(prev => ({ ...prev, format: e.target.value as MediaFormat }))}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                              <option value="mp4">MP4 (Recommended)</option>
                              <option value="webm">WebM</option>
                              <option value="mkv">MKV</option>
                              <option value="avi">AVI</option>
                              <option value="mov">MOV</option>
                              <option value="flv">FLV</option>
                            </select>
                          </div>
                        </div>

                        {/* Audio Options */}
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">Audio Options</h4>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Audio Quality
                            </label>
                            <select
                              value={options.audioQuality}
                              onChange={(e) => setOptions(prev => ({ ...prev, audioQuality: e.target.value as AudioQuality }))}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                              <option value="64kbps">64 kbps (Low)</option>
                              <option value="128kbps">128 kbps (Standard)</option>
                              <option value="192kbps">192 kbps (Good)</option>
                              <option value="256kbps">256 kbps (High)</option>
                              <option value="320kbps">320 kbps (Highest)</option>
                              <option value="best">Best Available</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Audio Format
                            </label>
                            <select
                              value={options.audioFormat}
                              onChange={(e) => setOptions(prev => ({ ...prev, audioFormat: e.target.value as AudioFormat }))}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                              <option value="mp3">MP3 (Recommended)</option>
                              <option value="aac">AAC</option>
                              <option value="ogg">OGG</option>
                              <option value="wav">WAV</option>
                              <option value="m4a">M4A</option>
                              <option value="flac">FLAC</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Additional Options */}
                      <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={options.audioOnly}
                            onChange={(e) => setOptions(prev => ({ ...prev, audioOnly: e.target.checked }))}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Audio Only</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={options.extractAudio}
                            onChange={(e) => setOptions(prev => ({ ...prev, extractAudio: e.target.checked }))}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Extract Audio</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={options.subtitles}
                            onChange={(e) => setOptions(prev => ({ ...prev, subtitles: e.target.checked }))}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Download Subtitles</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={options.thumbnail}
                            onChange={(e) => setOptions(prev => ({ ...prev, thumbnail: e.target.checked }))}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Download Thumbnail</span>
                        </label>
                      </div>

                      {/* Custom Download Button */}
                      <div className="pt-4">
                        <button
                          onClick={downloadMedia}
                          disabled={downloadProgress !== null}
                          className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                        >
                          <ArrowDownTrayIcon className="w-5 h-5" />
                          <span>Download with Custom Settings</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Download Progress */}
          {downloadProgress && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {downloadProgress.message}
                </span>
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  {Math.round(downloadProgress.progress)}%
                </span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress.progress}%` }}
                />
              </div>
              {downloadProgress.downloadedBytes && downloadProgress.totalBytes && (
                <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400">
                  <span>
                    {formatFileSize(downloadProgress.downloadedBytes)} / {formatFileSize(downloadProgress.totalBytes)}
                  </span>
                  <span>
                    {downloadProgress.speed} • ETA: {downloadProgress.eta}
                  </span>
                </div>
              )}
              {downloadProgress.stage === 'complete' && (
                <div className="flex items-center space-x-2 mt-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-green-700 dark:text-green-300">Download completed successfully!</span>
                </div>
              )}
            </div>
          )}

          {/* Real Implementation Notice */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <div className="flex items-start space-x-2">
              <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-2">Demo Implementation:</p>
                <p className="mb-2">
                  This is a demo showing the UI and workflow. For real video downloading, you would need:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Backend server with yt-dlp or similar tools</li>
                  <li>API endpoints to handle video extraction</li>
                  <li>Proper file streaming and download handling</li>
                  <li>Platform-specific API integrations</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <div className="flex items-start space-x-2">
              <InformationCircleIcon className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">Important Notice:</p>
                <p>
                  Please respect copyright laws and platform terms of service. Only download content you have permission to download. 
                  This tool is for educational and personal use only.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaDownloader;