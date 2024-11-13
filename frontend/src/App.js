import React from 'react';
import { ThemeProvider } from 'next-themes';
import { Provider } from './components/ui/provider';
import { defaultSystem } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './screens/Home';
import MovieDesc from './screens/MovieDesc';
import ScrollFromTop from './components/ScrollFromTop';

const App = () => {
	return (
		<ThemeProvider attribute='class'>
			<Provider value={defaultSystem}>
				<Router>
					<ScrollFromTop />
					<Routes>
						<Route path='/' exact element={<Home />} />
						<Route path='/description/:id' element={<MovieDesc />} />
					</Routes>
				</Router>
			</Provider>
		</ThemeProvider>
	);
}

export default App;
