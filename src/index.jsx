import ReactDOM from 'react-dom/client';
import App from './components/App.jsx';
import { NuqsAdapter } from 'nuqs/adapters/react';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
   <NuqsAdapter>
      <App/>
   </NuqsAdapter>
);
