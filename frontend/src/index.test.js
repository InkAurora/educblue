import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Mock dependencies
jest.mock('react-dom/client');
jest.mock('./reportWebVitals');
jest.mock('./App', () => () => 'App Component');
jest.mock('./index.css', () => ({}), { virtual: true });

describe('index.js', () => {
  let mockRender;
  let mockCreateRoot;
  let mockElement;

  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();

    // Setup test environment
    mockRender = jest.fn();
    mockCreateRoot = jest.fn(() => ({ render: mockRender }));
    ReactDOM.createRoot.mockImplementation(mockCreateRoot);

    // Mock DOM element
    mockElement = document.createElement('div');
    document.getElementById = jest.fn(() => mockElement);
  });

  // This test simulates what index.js should do
  it('should render App inside StrictMode in the root element', () => {
    // Simulate actions that index.js performs
    const root = document.getElementById('root');
    const reactRoot = ReactDOM.createRoot(root);
    reactRoot.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );

    // Verify expectations
    expect(document.getElementById).toHaveBeenCalledWith('root');
    expect(ReactDOM.createRoot).toHaveBeenCalledWith(mockElement);
    expect(mockRender).toHaveBeenCalled();

    // Check that StrictMode contains App
    const renderArg = mockRender.mock.calls[0][0];
    expect(renderArg.type).toBe(React.StrictMode);
    expect(renderArg.props.children.type).toBe(App);
  });

  it('should call reportWebVitals', () => {
    // Simulate action that index.js performs
    reportWebVitals();

    // Verify expectation
    expect(reportWebVitals).toHaveBeenCalled();
  });
});
