import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.HTMLAttributes<HTMLElement> & {
        src?: string;
        'auto-rotate'?: string | boolean;
        'camera-controls'?: string | boolean;
        ar?: string | boolean;
        alt?: string;
        style?: React.CSSProperties;
      };
    }
  }
}
