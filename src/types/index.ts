export interface OCRResult {
  text: string;
  confidence: number;
  words?: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
}

export interface OCRProgress {
  status: string;
  progress: number;
}

export type CaseType = 
  | 'lowercase'
  | 'uppercase' 
  | 'capitalcase'
  | 'camelcase'
  | 'pascalcase'
  | 'snakecase'
  | 'kebabcase'
  | 'constantcase'
  | 'dotcase'
  | 'pathcase'
  | 'sentencecase'
  | 'titlecase';

export interface ConversionHistory {
  id: string;
  original: string;
  converted: string;
  caseType: CaseType;
  timestamp: Date;
}

export interface AppState {
  inputText: string;
  outputText: string;
  selectedCase: CaseType;
  isProcessing: boolean;
  ocrProgress: OCRProgress | null;
  history: ConversionHistory[];
  darkMode: boolean;
}
