export const duration = (milliseconds: number): string => `${milliseconds.toFixed(1)} ms`;

export const timestamp = (timestamp: number): string =>
  new Date(timestamp).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });
