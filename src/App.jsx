/**
 * Raiz do front — monta os providers e as rotas.
 *
 * Mapa de rotas espelha o Cap. 8: quatro destinos na barra inferior e o resto
 * como navegação secundária em tela cheia.
 */

import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './state/AuthProvider.jsx';
import { RoovProvider } from './state/RoovProvider.jsx';
import { PlaceActionsProvider } from './components/PlaceActions.jsx';
import { AppShell } from './components/AppShell.jsx';
import { SplashScreen } from './modules/onboarding/SplashScreen.jsx';
import { AuthModule } from './modules/onboarding/AuthModule.jsx';
import { DiscoveryModule } from './modules/discovery/DiscoveryModule.jsx';
import { CommunitiesModule } from './modules/communities/CommunitiesModule.jsx';
import { CommunityDetailModule } from './modules/communities/CommunityDetailModule.jsx';
import { SavedModule } from './modules/saved/SavedModule.jsx';
import { ProfileModule } from './modules/profile/ProfileModule.jsx';
import { PlaceDetailModule } from './modules/place/PlaceDetailModule.jsx';
import { SearchModule } from './modules/search/SearchModule.jsx';
import { CreateModule } from './modules/create/CreateModule.jsx';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return (
      <div className="mx-auto h-full w-full max-w-md">
        <SplashScreen onComplete={() => setShowSplash(false)} />
      </div>
    );
  }

  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

/**
 * Portão de autenticação real. `RoovProvider` (mundo mock) só monta depois
 * que existe uma sessão — hoje um usuário real e o "perfil" mock ainda são
 * pessoas diferentes; misturá-los é trabalho da Fase 3.
 */
function AuthGate() {
  const { status } = useAuth();

  if (status === 'checking') {
    return <div className="mx-auto h-full w-full max-w-md bg-[var(--background)]" />;
  }

  if (status === 'anonymous') {
    return (
      <div className="mx-auto h-full w-full max-w-md">
        <AuthModule />
      </div>
    );
  }

  return (
    <RoovProvider>
      <PlaceActionsProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<DiscoveryModule />} />
            <Route path="/comunidades" element={<CommunitiesModule />} />
            <Route path="/comunidade/:id" element={<CommunityDetailModule />} />
            <Route path="/salvos" element={<SavedModule />} />
            <Route path="/perfil" element={<ProfileModule />} />
            <Route path="/lugar/:id" element={<PlaceDetailModule />} />
            <Route path="/buscar" element={<SearchModule />} />
            <Route path="/criar" element={<CreateModule />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </PlaceActionsProvider>
    </RoovProvider>
  );
}
