import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast.success('Lien de réinitialisation du mot de passe envoyé à votre adresse email !');
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-card rounded-2xl shadow-2xl p-8"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-4">
            <span className="text-white font-bold text-2xl">AI</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Mot de passe oublié</h1>
          <p className="text-muted-foreground">
            {submitted
              ? 'Vérifiez votre email pour les instructions de réinitialisation'
              : 'Saisissez votre adresse email pour réinitialiser votre mot de passe'}
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
            </Button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 p-4 rounded-lg">
              <p className="text-sm">
                Nous avons envoyé un lien de réinitialisation du mot de passe à <strong>{email}</strong>. Veuillez vérifier votre boîte de réception et suivre les instructions.
              </p>
            </div>
            <Button
              onClick={() => setSubmitted(false)}
              variant="outline"
              className="w-full"
            >
              Envoyer à nouveau
            </Button>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center space-x-2 text-sm text-primary hover:underline font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la connexion</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
