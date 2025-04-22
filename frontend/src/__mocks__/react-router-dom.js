const mockNavigate = jest.fn();
const mockUseNavigate = () => mockNavigate;
const mockUseParams = jest.fn().mockReturnValue({});

module.exports = {
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ children }) => children,
  useNavigate: mockUseNavigate,
  useParams: mockUseParams,
  MemoryRouter: ({ children }) => children,
};
