// Example backend server for real video downloading
// This demonstrates how to implement actual video downloading functionality
// You would run this separately from the React app

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
}

// Endpoint to get video information
app.post('/api/video-info', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Use yt-dlp to get video information
        const command = `yt-dlp --dump-json "${url}"`;
        
        exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
            if (error) {
                console.error('Error getting video info:', error);
                return res.status(500).json({ 
                    error: 'Failed to fetch video information',
                    details: stderr 
                });
            }

            try {
                const videoInfo = JSON.parse(stdout);
                
                // Extract relevant information
                const response = {
                    title: videoInfo.title || 'Unknown Title',
                    duration: videoInfo.duration || 0,
                    thumbnail: videoInfo.thumbnail || '',
                    platform: detectPlatform(url),
                    url: url,
                    availableFormats: extractFormats(videoInfo.formats || []),
                    availableQualities: extractQualities(videoInfo.formats || []),
                    fileSize: videoInfo.filesize || null,
                    uploader: videoInfo.uploader || 'Unknown',
                    uploadDate: videoInfo.upload_date || new Date().toISOString().split('T')[0],
                    description: videoInfo.description || ''
                };

                res.json(response);
            } catch (parseError) {
                console.error('Error parsing video info:', parseError);
                res.status(500).json({ error: 'Failed to parse video information' });
            }
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Endpoint to download video/audio
app.post('/api/download', async (req, res) => {
    try {
        const { url, options } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // Generate filename
        const timestamp = Date.now();
        const extension = options.audioOnly ? 
            (options.audioFormat || 'mp3') : 
            (options.format || 'mp4');
        const filename = `download_${timestamp}.${extension}`;
        const filepath = path.join(downloadsDir, filename);

        // Build yt-dlp command
        let command = 'yt-dlp';
        
        if (options.audioOnly) {
            command += ' -x'; // Extract audio
            command += ` --audio-format ${options.audioFormat || 'mp3'}`;
            if (options.audioQuality && options.audioQuality !== 'best') {
                command += ` --audio-quality ${options.audioQuality.replace('kbps', '')}K`;
            }
        } else {
            if (options.quality && options.quality !== 'best') {
                command += ` -f "best[height<=${options.quality.replace('p', '')}]"`;
            }
            if (options.format && options.format !== 'mp4') {
                command += ` --recode-video ${options.format}`;
            }
        }

        command += ` -o "${filepath}" "${url}"`;

        console.log('Executing command:', command);

        const process = exec(command, { timeout: 300000 }, (error, stdout, stderr) => {
            if (error) {
                console.error('Download error:', error);
                return res.status(500).json({ 
                    error: 'Download failed',
                    details: stderr 
                });
            }

            // Check if file was created
            if (fs.existsSync(filepath)) {
                res.json({
                    success: true,
                    downloadUrl: `/downloads/${filename}`,
                    filename: filename,
                    message: 'Download completed successfully'
                });
            } else {
                res.status(500).json({ error: 'File was not created' });
            }
        });

        // Handle process progress (simplified)
        process.stdout?.on('data', (data) => {
            console.log('Download progress:', data.toString());
            // In a real implementation, you'd use WebSockets to send progress updates
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Helper functions
function detectPlatform(url) {
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
}

function extractFormats(formats) {
    const formatSet = new Set();
    formats.forEach(format => {
        if (format.ext) {
            formatSet.add(format.ext);
        }
    });
    return Array.from(formatSet).filter(fmt => 
        ['mp4', 'webm', 'mkv', 'avi', 'mov', 'flv'].includes(fmt)
    );
}

function extractQualities(formats) {
    const qualitySet = new Set();
    formats.forEach(format => {
        if (format.height) {
            qualitySet.add(`${format.height}p`);
        }
    });
    const qualities = Array.from(qualitySet).sort((a, b) => {
        return parseInt(b) - parseInt(a); // Sort descending
    });
    return qualities.length > 0 ? qualities : ['720p', '480p', '360p'];
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
    console.log('Make sure yt-dlp is installed: pip install yt-dlp');
    console.log('API endpoints:');
    console.log(`  POST http://localhost:${PORT}/api/video-info`);
    console.log(`  POST http://localhost:${PORT}/api/download`);
});

module.exports = app;