import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import Preloader from './pages/Preloader';

// import * as serviceWorkerRegistration from './serviceWorkerRegistration';
// import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
const helmetContext = {};

root.render(
	<HelmetProvider context={helmetContext}>
		{/* Page Preloader */}
		<Preloader />

		{/* web application */}
		<BrowserRouter>
			<App />
		</BrowserRouter>
	</HelmetProvider>
);
