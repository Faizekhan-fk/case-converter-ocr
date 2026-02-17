**By [Faize khan]**
<<<<<<< HEAD
# Text Converter, OCR & Image Processor and Downloader Tools
=======
# Text Converter & OCR
>>>>>>> 8cbdc97cd81a53ec47ea17047ea58bd9bfbcaf70

A modern, responsive React application that provides text case conversion, optical character recognition (OCR), and advanced image processing functionality including background removal and format conversion. Built with TypeScript, Tailwind CSS, and modern AI-powered tools.

## Features

### 🔤 Case Converter
- **Multiple Case Types**: Convert text between 12 different case formats
  - lowercase
  - UPPERCASE
  - Capitalcase
  - camelCase
  - PascalCase
  - snake_case
  - kebab-case
  - CONSTANT_CASE
  - dot.case
  - path/case
  - Sentence case
  - Title Case

- **Interactive UI**: 
  - Real-time conversion as you type
  - Visual case selection with descriptions
  - Copy to clipboard functionality
  - Character count display
  - Input/output swap functionality

### 📷 OCR (Optical Character Recognition)
- **Image Text Extraction**: Extract text from images using Tesseract.js
- **Multiple Formats**: Support for JPEG, PNG, GIF, BMP, WebP
- **Drag & Drop**: Intuitive file upload with drag and drop
- **Progress Tracking**: Real-time OCR processing progress
- **Image Preview**: Preview uploaded images before processing
- **Seamless Integration**: Extracted text automatically transfers to case converter

### 🖼️ Image Processor
- **AI-Powered Background Removal**: Remove backgrounds from images using TensorFlow.js BodyPix
- **Format Conversion**: Convert between JPEG, PNG, and WebP formats
- **Batch Processing**: Process multiple images simultaneously
- **Advanced Options**: 
  - Adjustable image quality (0.1-1.0)
  - Custom background color for JPEG conversion
  - Segmentation threshold control
  - Horizontal flip option
- **Download Support**: Download processed images in multiple formats
- **Live Preview**: See processed images with transparency checkerboard background

### 🎨 Modern UI/UX
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark Mode**: Toggle between light and dark themes with system preference detection
- **Smooth Animations**: Framer Motion powered transitions and interactions
- **Accessibility**: Keyboard navigation and screen reader friendly
- **Professional Design**: Clean, modern interface with proper spacing and typography

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS for responsive design
- **Icons**: Heroicons for consistent iconography
- **Animations**: Framer Motion for smooth transitions
- **OCR**: Tesseract.js for client-side text recognition
- **AI/ML**: TensorFlow.js with BodyPix for background removal
- **Image Processing**: HTML5 Canvas API for image manipulation
- **File Handling**: React Dropzone for drag & drop, FileSaver.js for downloads
- **Image Formats**: Support for JPEG, PNG, WebP conversion

## Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd case-converter-ocr
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view the application

### Build for Production

```bash
npm run build
```

This builds the app for production to the `build` folder.

## Usage

### Case Converter
1. Navigate to the "Case Converter" tab
2. Enter or paste your text in the input area
3. Select the desired case type from the grid
4. The converted text appears automatically
5. Click "Copy" to copy the result to clipboard
6. Use "Swap" to reverse input and output
7. Use "Clear" to reset the input

### OCR
1. Navigate to the "OCR" tab
2. Drag and drop an image file or click to browse
3. Click "Extract Text" to process the image
4. Monitor the progress bar during extraction
5. The extracted text will appear below
6. Click "Copy" to copy the extracted text
7. The text automatically transfers to the Case Converter tab

### Image Processor
1. Navigate to the "Image Tools" tab
2. Drag and drop image files or click to browse (supports JPEG, PNG, WebP)
3. Select multiple images for batch processing
4. Choose processing type:
   - **Convert Format Only**: Simple format conversion
   - **Remove Background**: AI-powered background removal (requires model loading)
5. Configure advanced options (optional):
   - Adjust image quality slider
   - Choose background color for JPEG format
   - Fine-tune segmentation threshold
   - Enable horizontal flip if needed
6. Process images and preview results
7. Download processed images in your preferred format (JPEG/PNG/WebP)

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Features

- **Client-side Processing**: All operations happen in the browser
- **No Server Required**: Fully static application
- **Lazy Loading**: Components load as needed
- **Optimized Images**: Automatic image optimization for OCR
- **Memory Management**: Proper cleanup of OCR workers

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- [Tesseract.js](https://tesseract.projectnaptha.com/) for OCR functionality
- [TensorFlow.js](https://www.tensorflow.org/js) and [BodyPix](https://github.com/tensorflow/tfjs-models/tree/master/body-pix) for AI-powered background removal
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Heroicons](https://heroicons.com/) for beautiful icons
- [Framer Motion](https://www.framer.com/motion/) for animations
- [React Dropzone](https://react-dropzone.js.org/) for file uploads
- [FileSaver.js](https://github.com/eligrey/FileSaver.js/) for client-side file downloads
