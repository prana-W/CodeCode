import {
    Home,
    NotFound,
    Login,
    Register,
    ForgotPassword,
    ResetPassword,
    ContestsPage,
    ContestListPage,
    ContestEditPage,
    ProblemsPage,
    TestcasesPage,
    VerifyContestsPage,
    AdminContestDetailsPage,
    EvaluateContestsPage,
    ContestParticipationLayout,
    ContestProblemsTab,
    ContestProblemView,
    ContestSubmissionsTab,
    ContestLeaderboardTab,
    AboutUs,
    UserProfile,
    UserProfileEdit,
    RankingsPage,
    CustomInvocationPage,
    UserTemplates,
    TemplateEditor,
} from './pages/index.js';

import ErrorBoundary from './components/ErrorBoundary.jsx';
import {ThemeProvider} from '@/components/theme-provider';
import Layout from './Layout.jsx';

import {createBrowserRouter, RouterProvider, Navigate} from 'react-router-dom';
import {useAuth} from './context/AuthContext.jsx';
import {SocketProvider} from './context/SocketContext.jsx';

function ProtectedRoute({children}) {
    const {user, authLoading} = useAuth();
    if (authLoading) return null; // wait for /me hydration before deciding
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

/** Redirects non-admin users to home. */
function AdminRoute({children}) {
    const {user, authLoading} = useAuth();
    if (authLoading) return null;
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
                element: <Home />,
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
                path: 'forgot-password',
                element: <ForgotPassword />,
            },
            {
                path: 'reset-password',
                element: <ResetPassword />,
            },
            {
                path: 'rankings',
                element: (
                    <ProtectedRoute>
                        <RankingsPage />
                    </ProtectedRoute>
                ),
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
                path: 'custom-invocation',
                element: (
                    <ProtectedRoute>
                        <CustomInvocationPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'templates',
                element: (
                    <ProtectedRoute>
                        <UserTemplates />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'templates/:id',
                element: (
                    <ProtectedRoute>
                        <TemplateEditor />
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
                        element: <Navigate to="problems" replace />,
                    },
                    {
                        path: 'problems',
                        element: <ContestProblemsTab />,
                    },
                    {
                        path: 'problem/:problemId',
                        element: <ContestProblemView />,
                    },
                    {
                        path: 'submissions',
                        element: <ContestSubmissionsTab />,
                    },
                    {
                        path: 'leaderboard',
                        element: <ContestLeaderboardTab />,
                    },
                ],
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
                path: 'admin/evaluate-contests',
                element: (
                    <AdminRoute>
                        <EvaluateContestsPage />
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
                <SocketProvider>
                    <RouterProvider router={router} />
                </SocketProvider>
            </ErrorBoundary>
        </ThemeProvider>
    );
}

export default App;
