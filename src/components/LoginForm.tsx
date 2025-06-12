
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { loginSchema, type LoginFormData } from '@/lib/schemas';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { LogIn, KeyRound, User } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "", // Supabase expects email here
      password: "",
    },
  });

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true);
    const { success, error } = await login(data);
    setIsLoading(false);

    if (success) {
      toast({
        title: "Login bem-sucedido!",
        description: "Redirecionando para o painel...",
      });
      router.push('/dashboard');
    } else {
      toast({
        title: "Erro no Login",
        description: error || "Usuário ou senha inválidos. Tente novamente.",
        variant: "destructive",
      });
      // Do not set form error for "password" specifically unless the error confirms it's a password issue
      // form.setError("password", { message: "Credenciais inválidas" });
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem-theme(spacing.20))]"> {/* Adjust height considering header/footer */}
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl text-primary flex items-center justify-center gap-2">
            <LogIn className="h-8 w-8" /> Acesso Restrito
          </CardTitle>
          <CardDescription>Faça login para acessar o painel do gestor. Use seu e-mail como usuário.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5"><User className="h-4 w-4 text-muted-foreground" /> Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5"><KeyRound className="h-4 w-4 text-muted-foreground" /> Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
