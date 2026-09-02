import type { CSSProperties } from 'react';

export function weightStyle(weight?: number): CSSProperties {
  return weight === undefined ? {} : { flex: weight };
}

export function mapJustify(value?: string): CSSProperties['justifyContent'] {
  switch (value) {
    case 'end':
      return 'flex-end';
    case 'center':
      return 'center';
    case 'spaceBetween':
      return 'space-between';
    case 'spaceAround':
      return 'space-around';
    case 'spaceEvenly':
      return 'space-evenly';
    default:
      return 'flex-start';
  }
}

export function mapAlign(value?: string): CSSProperties['alignItems'] {
  switch (value) {
    case 'start':
      return 'flex-start';
    case 'center':
      return 'center';
    case 'end':
      return 'flex-end';
    default:
      return 'stretch';
  }
}
