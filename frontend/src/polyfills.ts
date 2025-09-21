// Polyfills for Node.js globals in browser environment
(window as any).global = window;
(window as any).process = {
  env: { DEBUG: undefined },
  version: '',
  versions: {},
  platform: 'browser',
  nextTick: (fn: Function) => setTimeout(fn, 0)
};
(window as any).Buffer = (window as any).Buffer || {};
