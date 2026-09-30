import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import DirectoryPage from './pages/DirectoryPage'
import LostPetsPage from './pages/LostPetsPage'
import FoundPetsPage from './pages/FoundPetsPage'
import ReportPetPage from './pages/ReportPetPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<LostPetsPage />} />
            <Route path="lost" element={<LostPetsPage />} />
            <Route path="found" element={<FoundPetsPage />} />
            <Route path="directory" element={<DirectoryPage />} />
            <Route path="report" element={<ReportPetPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
