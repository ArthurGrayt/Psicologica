import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Doctors from './pages/Doctors';
import QuizSettings from './pages/QuizSettings';
import FormularioPublico from './pages/FormularioPublico';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirecionar raiz para o login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Rota de Login */}
        <Route path="/login" element={<Login />} />

        {/* Rotas Administrativas */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="doctors" element={<Doctors />} />
          <Route path="quiz-settings" element={<QuizSettings />} />
        </Route>

        {/* Rota Pública do Questionário */}
        <Route path="/quiz/:assessmentId" element={<FormularioPublico />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
