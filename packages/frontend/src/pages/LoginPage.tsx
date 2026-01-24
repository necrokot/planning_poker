import { Navigate } from 'react-router-dom';
import { GoogleLoginButton } from '../components/auth';
import { Button, Card } from '../components/common';
import { useAuth } from '../hooks';

export function LoginPage() {
  const { isAuthenticated, isLoading, isDevMode, loginWithGoogle, loginWithDev } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Planning Poker</h1>
          <p className="text-gray-600">
            Estimate your stories collaboratively with your team
          </p>
        </div>

        <div className="space-y-4">
          <GoogleLoginButton onClick={loginWithGoogle} />

          {isDevMode && (
            <>
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative bg-white px-4 text-sm text-gray-500">or</div>
              </div>

              <Button
                onClick={loginWithDev}
                variant="secondary"
                className="flex items-center justify-center gap-2 w-full bg-amber-100 hover:bg-amber-200 border-amber-300"
              >
                <span className="text-amber-600">&#9888;</span>
                <span>Skip Auth (Dev Only)</span>
              </Button>
            </>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">How it works</h2>
          <ul className="text-left text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary-600 font-bold">1.</span>
              Create a room and invite your team
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 font-bold">2.</span>
              Add issues to estimate
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 font-bold">3.</span>
              Everyone votes simultaneously
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 font-bold">4.</span>
              Reveal and discuss the results
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
