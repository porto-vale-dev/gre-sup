
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Key, Lock, Loader2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const updatePasswordSchema = z.object({
  password: z.string().min(8, { message: "A nova senha deve ter no mínimo 8 caracteres." }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não correspondem.",
  path: ["confirmPassword"],
});
type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

export default function AtualizarSenhaPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });
  
  const onSubmit = async (data: UpdatePasswordFormData) => {
    setIsSubmitting(true);
    
    // A sessão temporária é criada automaticamente pelo Supabase ao clicar no link do e-mail.
    // Usamos essa sessão para atualizar a senha.
    const { error } = await supabase.auth.updateUser({ password: data.password });

    if (error) {
        toast({
            title: "Ocorreu um Erro",
            description: "Não foi possível atualizar a senha. O link pode ter expirado ou ser inválido. Tente novamente.",
            variant: "destructive",
        });
    } else {
        toast({
            title: "Sucesso!",
            description: "Senha atualizada com sucesso! Você já pode fazer login com sua nova senha.",
            variant: "default",
        });
        // Desloga o usuário para invalidar a sessão temporária e o força a fazer um novo login.
        await supabase.auth.signOut();
        router.push('/');
    }

    setIsSubmitting(false);
  };

  return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="font-headline text-3xl text-primary flex items-center justify-center gap-2">
                <Save className="h-8 w-8" /> Definir Nova Senha
              </CardTitle>
              <CardDescription>
                Escolha uma senha forte e segura para sua conta.
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
      </div>
  );
}
