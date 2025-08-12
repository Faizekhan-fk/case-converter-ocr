export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const;

export const CASE_TYPE_EXAMPLES = {
  lowercase: 'hello world',
  uppercase: 'HELLO WORLD',
  capitalcase: 'Hello world',
  camelcase: 'helloWorld',
  pascalcase: 'HelloWorld',
  snakecase: 'hello_world',
  kebabcase: 'hello-world',
  constantcase: 'HELLO_WORLD',
  dotcase: 'hello.world',
  pathcase: 'hello/world',
  sentencecase: 'Hello world',
  titlecase: 'Hello World'
} as const;

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/bmp',
  'image/webp'
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ANIMATION_VARIANTS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  slideInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  },
  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  },
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  }
} as const;

export const TRANSITION_DURATION = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5
} as const;
