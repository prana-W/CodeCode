import { Home2, NotFound, Login, Register, ContestsPage, ContestListPage, ContestEditPage, ProblemsPage, TestcasesPage } from './pages/index.js';
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
            // ── Public Contests Page ─────────────────────────────────
            {
                path: 'contests',
                element:( 
                    <ProtectedRoute>
                     <ContestsPage />
                </ProtectedRoute>
            ),
            },
            // ── Design Contest Flow ──────────────────────────────────
            {
                path: 'design-contest',
                element: (
                    <ProtectedRoute>
                        <ContestListPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'design-contest/contest/:id',
                element: (
                    <ProtectedRoute>
                        <ContestEditPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'design-contest/problems/:contestId',
                element: (
                    <ProtectedRoute>
                        <ProblemsPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'design-contest/testcases/:contestId',
                element: (
                    <ProtectedRoute>
                        <TestcasesPage />
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
