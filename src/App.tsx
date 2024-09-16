import { useEffect } from 'react';
import { useLocation, Route, Routes } from 'react-router-dom';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

import PageHelmet from './config/PageHelmet';
import { defaultMetaTags } from './config/metaTags';
import { useTabletQuery } from './hooks/useMediaQuery';
import './styles/App.scss';

// Importar o BalanceChecker
import BalanceChecker from './BalanceChecker'; // Certifique-se de que o caminho está correto

const App = () => {
	const tabletQuery = useTabletQuery();
	const location = useLocation();

	useEffect(() => {
		const handleResize = () => {
			const vh = window.innerHeight * 0.01;
			document.documentElement.style.setProperty('--vh', `${vh}px`);
		};

		if (tabletQuery) {
			handleResize();
			window.addEventListener('resize', handleResize);

			return () => {
				window.removeEventListener('resize', handleResize);
			};
		}
	}, [tabletQuery]);

	return (
		<TransitionGroup>
			<CSSTransition key={location.key} classNames='slide' timeout={1300}>
				<div id='page' className='page'>
					<PageHelmet metaTags={defaultMetaTags} />

					<div className='page-container'>
						{/* Adiciona BalanceChecker como página principal */}
						<Routes location={location}>
							<Route path="/" element={<BalanceChecker />} />
							{/* Aqui você pode adicionar mais rotas conforme necessário */}
						</Routes>
					</div>
				</div>
			</CSSTransition>
		</TransitionGroup>
	);
};

export default App;
