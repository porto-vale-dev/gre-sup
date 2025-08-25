
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createUserSchema, type CreateUserFormData } from '@/lib/schemas';
import { useToast } from "@/hooks/use-toast";
import { UserPlus, KeyRound, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateUserPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email_prefix: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: CreateUserFormData) {
    setIsSubmitting(true);
    
    // Combine prefix and domain to form the full email
    const fullEmail = `${data.email_prefix}@portovaleconsorcios.com.br`;

    console.log({
        email: fullEmail,
        password: data.password,
    });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Conta Criada (Simulação)",
      description: `Usuário com e-mail ${fullEmail} seria criado.`,
    });
    
    setIsSubmitting(false);
    form.reset();
  }

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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email_prefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <div className="flex items-center">
                        <FormControl>
                            <Input placeholder="usuario" {...field} className="rounded-r-none focus:z-10"/>
                        </FormControl>
                        <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-l-0 border-input rounded-r-md h-10">
                            @portovaleconsorcios.com.br
                        </span>
                    </div>
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
                      <Input type="password" placeholder="••••••••" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5"><KeyRound className="h-4 w-4 text-muted-foreground" /> Confirmar Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                 {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Criando..." : "Criar Conta"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center">
            <Button variant="link" asChild>
                <Link href="/">Voltar para o Login</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
