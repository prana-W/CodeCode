import {Outlet, useLocation} from 'react-router-dom';
import {Header, Footer} from './components';
import {Toaster} from '@/components/ui/sonner';

function Layout() {
    const location = useLocation();
    const isProblemView = location.pathname.includes('/problem/');

    return (
        <>
            <div className={`${isProblemView ? 'h-screen overflow-hidden' : 'min-h-screen'} flex flex-col`}>
                <Header />
                <main className="flex-1 flex flex-col min-h-0">
                    <Outlet />
                </main>
            </div>
            {!isProblemView && <Footer />}
        </>
    );
}

export default Layout;
