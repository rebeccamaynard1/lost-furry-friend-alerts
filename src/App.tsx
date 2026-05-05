import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import HomePage from "@/pages/HomePage";
import ReportLostPage from "@/pages/ReportLostPage";
import ReportFoundPage from "@/pages/ReportFoundPage";
import MapPage from "@/pages/MapPage";
import SightingsPage from "@/pages/SightingsPage";
import MessagesPage from "@/pages/MessagesPage";
import MyPetsPage from "@/pages/MyPetsPage";
import SheltersPage from "@/pages/SheltersPage";
import VolunteersPage from "@/pages/VolunteersPage";
import RuralPartnersPage from "@/pages/RuralPartnersPage";
import SponsorsPage from "@/pages/SponsorsPage";
import DonatePage from "@/pages/DonatePage";
import PremiumPage from "@/pages/PremiumPage";
import AdminPage from "@/pages/AdminPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import HelpPage from "@/pages/HelpPage";
import NotificationSettingsPage from "@/pages/NotificationSettingsPage";
import AlabamaPartnersPage from "@/pages/AlabamaPartnersPage";
import ProfileSettingsPage from "@/pages/ProfileSettingsPage";
import UnsubscribePage from "@/pages/UnsubscribePage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import PetDetailPage from "@/pages/PetDetailPage";
import NotFound from "@/pages/NotFound";
import ErrorBoundary from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/report-lost" element={<ReportLostPage />} />
              <Route path="/report-found" element={<ReportFoundPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/sightings" element={<SightingsPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/my-pets" element={<MyPetsPage />} />
              <Route path="/my-reports" element={<MyPetsPage />} />
              <Route path="/shelters" element={<SheltersPage />} />
              <Route path="/volunteers" element={<VolunteersPage />} />
              <Route path="/rural-partners" element={<RuralPartnersPage />} />
              <Route path="/sponsors" element={<SponsorsPage />} />
              <Route path="/donate" element={<DonatePage />} />
              <Route path="/premium" element={<PremiumPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/payment-success" element={<PaymentSuccessPage />} />
              <Route path="/donation-success" element={<PaymentSuccessPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/notification-settings" element={<NotificationSettingsPage />} />
              <Route path="/alabama-partners" element={<AlabamaPartnersPage />} />
              <Route path="/profile" element={<ProfileSettingsPage />} />
              <Route path="/unsubscribe" element={<UnsubscribePage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/pet/:id" element={<PetDetailPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
