import '@testing-library/jest-dom/vitest';

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  readyState = 0;
  onopen: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  onclose: ((ev: CloseEvent) => void) | null = null;

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
    setTimeout(() => this.onopen?.(new Event('open')), 0);
  }

  send() {
    // noop for tests
  }

  close() {
    this.onclose?.(new CloseEvent('close'));
  }
}

// @ts-expect-error override in tests
global.WebSocket = MockWebSocket;

export function getLastSocket() {
  return MockWebSocket.instances.at(-1);
}
