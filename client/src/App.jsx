import { Home2, NotFound, Login, Register, DesignContest, DesignProblem, DesignTestcase } from './pages/index.js';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { ThemeProvider } from "@/components/theme-provider";
import Layout from './Layout.jsx';

import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

/** Redirects unauthenticated users to /login. */
function ProtectedRoute({ children }) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        children: [
            {
                path: '',
                element: <Home2 />,
            },
            {
                path: 'login',
                element: <Login />,
            },
            {
                path: 'register',
                element: <Register />,
            },
            {
                path: 'design-contest',
                element: (
                    <ProtectedRoute>
                        <DesignContest />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'design-problem',
                element: (
                    <ProtectedRoute>
                        <DesignProblem />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'design-testcase',
                element: (
                    <ProtectedRoute>
                        <DesignTestcase />
                    </ProtectedRoute>
                ),
            },
            {
                path: '*',
                element: <NotFound />,
            },
        ],
    },
]);

function App() {
    return (
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
            <ErrorBoundary>
                <RouterProvider router={router} />
            </ErrorBoundary>
        </ThemeProvider>
    );
}

export default App;
