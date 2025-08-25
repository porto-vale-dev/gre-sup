'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { useFormState, useFormStatus } from 'react-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Key, Lock, Loader2, Save, ShieldAlert } from 'lucide-react';
import { updatePasswordAction } from '@/actions/authActions';

const updatePasswordSchema = z.object({
  password: z.string().min(8, { message: "A nova senha deve ter no mínimo 8 caracteres." }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não correspondem.",
  path: ["confirmPassword"],
});
type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
       {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? "Salvando..." : "Salvar Nova Senha"}
    </Button>
  );
}

function UpdatePasswordForm() {
  const { toast } = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [hasError, setHasError] = useState(false);

  const form = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const [state, formAction] = useFormState(updatePasswordAction, {
    success: false,
    message: '',
  });

  useEffect(() => {
     // A sessão do Supabase pode não estar disponível imediatamente após o redirecionamento.
    // O evento 'SIGNED_IN' ou 'USER_UPDATED' será disparado quando a sessão for processada.
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
            setHasError(false);
        }
    });

    // Se o fragmento de hash não estiver na URL, o usuário provavelmente acessou a página diretamente.
    if (typeof window !== 'undefined' && !window.location.hash.includes('access_token')) {
        setHasError(true);
    }
    
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? "Sucesso!" : "Ocorreu um Erro",
        description: state.message,
        variant: state.success ? "default" : "destructive",
      });
      if (state.success) {
        router.push('/');
      }
    }
  }, [state, toast, router]);
  
  const handleFormSubmit = form.handleSubmit(() => {
    if (formRef.current) {
        formAction(new FormData(formRef.current));
    }
  });
  
  if (hasError) {
      return (
         <Card className="w-full max-w-md shadow-xl text-center">
            <CardHeader>
                <div className="mx-auto bg-destructive/10 text-destructive p-4 rounded-full w-fit">
                    <ShieldAlert className="h-12 w-12" />
                </div>
                <CardTitle className="font-headline text-2xl text-destructive mt-4">
                    Link Inválido ou Expirado
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    O link de redefinição de senha é inválido ou já foi utilizado. Por favor, solicite um novo link na página de recuperação de senha.
                </p>
            </CardContent>
         </Card>
      )
  }

  return (
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl text-primary flex items-center justify-center gap-2">
            <Save className="h-8 w-8" /> Definir Nova Senha
          </CardTitle>
          <CardDescription>
            Escolha uma senha forte e segura.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form 
            ref={formRef} 
            action={formAction}
            onSubmit={handleFormSubmit}
            className="space-y-6"
          >
             <div className="space-y-2">
              <Label htmlFor="password">
                <span className="flex items-center gap-1.5"><Key className="h-4 w-4 text-muted-foreground" /> Nova Senha</span>
              </Label>
              <Input 
                id="password"
                type="password" 
                placeholder="••••••••" 
                {...form.register("password")}
              />
               {form.formState.errors.password && <p className="text-sm font-medium text-destructive">{form.formState.errors.password.message}</p>}
            </div>
            
             <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                <span className="flex items-center gap-1.5"><Lock className="h-4 w-4 text-muted-foreground" /> Confirmar Nova Senha</span>
              </Label>
              <Input 
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...form.register("confirmPassword")}
              />
               {form.formState.errors.confirmPassword && <p className="text-sm font-medium text-destructive">{form.formState.errors.confirmPassword.message}</p>}
            </div>
            <SubmitButton />
          </form>
        </CardContent>
      </Card>
  )
}

// O Suspense é usado aqui porque a lógica dentro de UpdatePasswordForm pode
// precisar de um momento para verificar a URL e o estado da autenticação.
export default function AtualizarSenhaPage() {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem-theme(spacing.20))]">
            <Suspense fallback={<Loader2 className="h-16 w-16 animate-spin text-primary" />}>
                <UpdatePasswordForm />
            </Suspense>
        </div>
    );
}

// Importar o cliente Supabase é necessário para o listener de auth
import { supabase } from '@/lib/supabaseClient';
