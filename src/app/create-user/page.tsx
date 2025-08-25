
'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, KeyRound, Loader2, Mail, Lock } from 'lucide-react';
import Link from 'next/link';
import { createUserAction } from '@/actions/createUser';

// A submit button that shows a loading state
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
       {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? "Criando..." : "Criar Conta"}
    </Button>
  );
}

export default function CreateUserPage() {
  const { toast } = useToast();
  
  // Initial state for the form action
  const initialState = {
    success: false,
    message: '',
  };

  // useFormState hook to manage form submission and state
  const [state, formAction] = useFormState(createUserAction, initialState);

  // Show a toast message when the action completes
  useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? "Sucesso!" : "Erro na Criação",
        description: state.message,
        variant: state.success ? "default" : "destructive",
      });
    }
  }, [state, toast]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem-theme(spacing.20))]">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl text-primary flex items-center justify-center gap-2">
            <UserPlus className="h-8 w-8" /> Criar Novo Usuário
          </CardTitle>
          <CardDescription>Preencha os dados para criar uma nova conta.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* The form now uses the server action */}
          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email_prefix">E-mail</Label>
              <div className="flex items-center">
                  <span className="inline-flex items-center pl-3 text-sm text-muted-foreground bg-muted border border-r-0 border-input rounded-l-md h-10">
                    <Mail className="h-4 w-4" />
                  </span>
                  <Input 
                    id="email_prefix"
                    name="email_prefix"
                    placeholder="usuario" 
                    className="rounded-l-none rounded-r-none focus:z-10"
                    required
                  />
                  <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-l-0 border-input rounded-r-md h-10">
                      @portovaleconsorcios.com.br
                  </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">
                <span className="flex items-center gap-1.5"><KeyRound className="h-4 w-4 text-muted-foreground" /> Senha</span>
              </Label>
              <Input 
                id="password"
                name="password"
                type="password" 
                placeholder="••••••••" 
                required
                minLength={8}
              />
            </div>
            
             <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                <span className="flex items-center gap-1.5"><Lock className="h-4 w-4 text-muted-foreground" /> Confirmar Senha</span>
              </Label>
              <Input 
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            <SubmitButton />
          </form>
        </CardContent>
        <CardFooter className="justify-center">
            <Button variant="outline" asChild className="w-full">
                <Link href="/">Voltar para o Login</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
