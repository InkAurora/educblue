const mockNavigate = jest.fn();
const mockUseNavigate = () => mockNavigate;
const mockUseParams = jest.fn().mockReturnValue({});
const mockUseLocation = jest.fn().mockReturnValue({
  pathname: '/test',
  search: '',
  hash: '',
  state: null,
});

module.exports = {
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ children }) => children,
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: mockUseNavigate,
  useParams: mockUseParams,
  useLocation: mockUseLocation,
  MemoryRouter: ({ children }) => children,
};
