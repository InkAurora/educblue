const mockNavigate = jest.fn();

const reactRouterDom = {
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '123' }),
  useLocation: () => ({ pathname: '/instructor/analytics/123' }),
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ children }) => <div>{children}</div>,
  Navigate: ({ to }) => <div>Navigate to {to}</div>,
  mockNavigate,
};

module.exports = reactRouterDom;
