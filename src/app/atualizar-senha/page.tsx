'use client';

import { useEffect, useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Key, Lock, Loader2, Save, ShieldAlert } from 'lucide-react';
import { updatePasswordAction } from '@/actions/authActions';
import { supabase } from '@/lib/supabaseClient';

const updatePasswordSchema = z.object({
  password: z.string().min(8, { message: "A nova senha deve ter no mínimo 8 caracteres." }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não correspondem.",
  path: ["confirmPassword"],
});
type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

function UpdatePasswordForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [hasError, setHasError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
            setHasError(false);
        }
    });

    if (typeof window !== 'undefined' && !window.location.hash.includes('access_token')) {
        setHasError(true);
    }
    
    return () => authListener.subscription.unsubscribe();
  }, []);
  
  const onSubmit = async (data: UpdatePasswordFormData) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('password', data.password);
    formData.append('confirmPassword', data.confirmPassword);
    
    const result = await updatePasswordAction(formData);

    toast({
      title: result.success ? "Sucesso!" : "Ocorreu um Erro",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });

    if (result.success) {
      router.push('/');
    }
    setIsSubmitting(false);
  };
  
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
            onSubmit={form.handleSubmit(onSubmit)}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
               {form.formState.errors.confirmPassword && <p className="text-sm font-medium text-destructive">{form.formState.errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
               {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Salvando..." : "Salvar Nova Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
  )
}

export default function AtualizarSenhaPage() {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem-theme(spacing.20))]">
            <Suspense fallback={<Loader2 className="h-16 w-16 animate-spin text-primary" />}>
                <UpdatePasswordForm />
            </Suspense>
        </div>
    );
}
