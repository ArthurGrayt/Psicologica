import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Doctors from './pages/Doctors';
import QuizSettings from './pages/QuizSettings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirecionar raiz para o dashboard admin ou login (futuramente) */}
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Rotas Administrativas */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="doctors" element={<Doctors />} />
          <Route path="quiz-settings" element={<QuizSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
