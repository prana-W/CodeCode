import { Home2, NotFound, Login, Register, ContestsPage, ContestListPage, ContestEditPage, ProblemsPage, TestcasesPage, VerifyContestsPage, AdminContestDetailsPage, ContestParticipationLayout, ContestProblemsTab, ContestProblemView, ContestSubmitTab, ContestSubmissionsTab, ContestLeaderboardTab, AboutUs, UserProfile, UserProfileEdit } from './pages/index.js';


import ErrorBoundary from './components/ErrorBoundary.jsx';
import { ThemeProvider } from "@/components/theme-provider";
import Layout from './Layout.jsx';

import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

function ProtectedRoute({ children }) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

/** Redirects non-admin users to home. */
function AdminRoute({ children }) {
    const { user } = useAuth();
    if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
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
                path: 'about',
                element: <AboutUs />,
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
                path: 'contests',
                element: (
                    <ProtectedRoute>
                        <ContestsPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'user-profile/:username',
                element: (
                    <ProtectedRoute>
                        <UserProfile />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'user-profile/edit',
                element: (
                    <ProtectedRoute>
                        <UserProfileEdit />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'contest/:id',
                element: (
                    <ProtectedRoute>
                        <ContestParticipationLayout />
                    </ProtectedRoute>
                ),
                children: [
                    {
                        path: '',
                        element: <Navigate to="problems" replace />
                    },
                    {
                        path: 'problems',
                        element: <ContestProblemsTab />
                    },
                    {
                        path: 'problem/:problemId',
                        element: <ContestProblemView />
                    },
                    {
                        path: 'submit',
                        element: <ContestSubmitTab />
                    },
                    {
                        path: 'submissions',
                        element: <ContestSubmissionsTab />
                    },
                    {
                        path: 'leaderboard',
                        element: <ContestLeaderboardTab />
                    }
                ]
            },
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
                path: 'admin/verify-contests',
                element: (
                    <AdminRoute>
                        <VerifyContestsPage />
                    </AdminRoute>
                ),
            },
            {
                path: 'admin/verify-contests/:id',
                element: (
                    <AdminRoute>
                        <AdminContestDetailsPage />
                    </AdminRoute>
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
