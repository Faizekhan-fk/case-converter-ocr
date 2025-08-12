import { CaseType } from '../types';

export const convertCase = (text: string, caseType: CaseType): string => {
  if (!text) return '';

  switch (caseType) {
    case 'lowercase':
      return text.toLowerCase();
    
    case 'uppercase':
      return text.toUpperCase();
    
    case 'capitalcase':
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    
    case 'camelcase':
      return text
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
          return index === 0 ? word.toLowerCase() : word.toUpperCase();
        })
        .replace(/\s+/g, '');
    
    case 'pascalcase':
      return text
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
        .replace(/\s+/g, '');
    
    case 'snakecase':
      return text
        .replace(/\W+/g, ' ')
        .split(/ |\B(?=[A-Z])/)
        .map(word => word.toLowerCase())
        .join('_');
    
    case 'kebabcase':
      return text
        .replace(/\W+/g, ' ')
        .split(/ |\B(?=[A-Z])/)
        .map(word => word.toLowerCase())
        .join('-');
    
    case 'constantcase':
      return text
        .replace(/\W+/g, ' ')
        .split(/ |\B(?=[A-Z])/)
        .map(word => word.toUpperCase())
        .join('_');
    
    case 'dotcase':
      return text
        .replace(/\W+/g, ' ')
        .split(/ |\B(?=[A-Z])/)
        .map(word => word.toLowerCase())
        .join('.');
    
    case 'pathcase':
      return text
        .replace(/\W+/g, ' ')
        .split(/ |\B(?=[A-Z])/)
        .map(word => word.toLowerCase())
        .join('/');
    
    case 'sentencecase':
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    
    case 'titlecase':
      return text.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
    
    default:
      return text;
  }
};

export const getCaseTypeLabel = (caseType: CaseType): string => {
  const labels: Record<CaseType, string> = {
    lowercase: 'lowercase',
    uppercase: 'UPPERCASE',
    capitalcase: 'Capitalcase',
    camelcase: 'camelCase',
    pascalcase: 'PascalCase',
    snakecase: 'snake_case',
    kebabcase: 'kebab-case',
    constantcase: 'CONSTANT_CASE',
    dotcase: 'dot.case',
    pathcase: 'path/case',
    sentencecase: 'Sentence case',
    titlecase: 'Title Case'
  };
  
  return labels[caseType];
};

export const getCaseTypeDescription = (caseType: CaseType): string => {
  const descriptions: Record<CaseType, string> = {
    lowercase: 'All characters in lowercase',
    uppercase: 'All characters in uppercase',
    capitalcase: 'First character uppercase, rest lowercase',
    camelcase: 'First word lowercase, subsequent words capitalized, no spaces',
    pascalcase: 'All words capitalized, no spaces',
    snakecase: 'All lowercase with underscores between words',
    kebabcase: 'All lowercase with hyphens between words',
    constantcase: 'All uppercase with underscores between words',
    dotcase: 'All lowercase with dots between words',
    pathcase: 'All lowercase with forward slashes between words',
    sentencecase: 'Like a sentence with proper capitalization',
    titlecase: 'First Letter Of Each Word Capitalized'
  };
  
  return descriptions[caseType];
};
